import {
  HumanMessage,
  SystemMessage,
  type MessageContent,
} from "@langchain/core/messages";
import { LLMProvider } from "@/electron/type";
import { createBackgroundLLM } from "../llm";
import { logEveryWhere } from "@/electron/service/util";
import {
  getVecDB,
  vectorToBuffer,
  CURRENT_TOOL_SCHEMA_VERSION,
  type AgentExperience,
} from "@/electron/database/vectorDB";
import { embeddingModel } from "./embedding";

// cosine distance threshold for merging experiences (similarity > 0.92)
const MERGE_DISTANCE_THRESHOLD = 0.08;
// Max number of failure reflections to keep per experience
const MAX_FAILURE_NOTES = 3;

export type RecordInput = {
  runId: string;
  userMessage: string;
  toolCallSequence: string | null;
  todoTemplate: string | null;
  isSuccess: boolean;
  errorMsg?: string | null;
  provider: LLMProvider;
};

class ExperienceRecorder {
  private extractMessageText = (content: MessageContent): string => {
    if (typeof content === "string") {
      return content;
    }
    return content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();
  };
  private generateFailureReflection = async (
    userMessage: string,
    toolCallSequence: string | null,
    errorMsg: string | null,
    provider: LLMProvider,
  ): Promise<string> => {
    try {
      const llm = await createBackgroundLLM(provider);
      const toolsAttempted = toolCallSequence
        ? JSON.parse(toolCallSequence).join(" → ")
        : "none";
      const context = [
        `User intent: ${userMessage}`,
        `Tools attempted: ${toolsAttempted}`,
        errorMsg ? `Error: ${errorMsg}` : "Failed without explicit error",
      ].join("\n");

      const result = await llm.invoke([
        new SystemMessage(
          "Analyze this failed agent task. Write one sentence explaining why it likely failed and what to avoid next time. Be specific and actionable.",
        ),
        new HumanMessage(context),
      ]);
      return this.extractMessageText(result.content).trim();
    } catch {
      return errorMsg
        ? `Failed with error: ${errorMsg.slice(0, 150)}`
        : "Task failed";
    }
  };

  private appendFailureNote = (
    existing: string | null,
    newNote: string,
  ): string => {
    const notes = existing ? existing.split("\n").filter(Boolean) : [];
    notes.push(newNote);
    return notes.slice(-MAX_FAILURE_NOTES).join("\n");
  };

  private generalizeIntent = async (
    userMessage: string,
    provider: LLMProvider,
  ): Promise<string> => {
    try {
      const llm = await createBackgroundLLM(provider);
      const result = await llm.invoke([
        new SystemMessage(
          "Generalize the user's intent into a short, abstract description (5–10 words). " +
            "Remove specific values, amounts, token names, wallet addresses. " +
            "Return only the generalized intent, nothing else.",
        ),
        new HumanMessage(userMessage),
      ]);

      return this.extractMessageText(result.content).trim();
    } catch {
      return userMessage.slice(0, 200);
    }
  };

  record = async (input: RecordInput): Promise<void> => {
    const {
      runId,
      userMessage,
      toolCallSequence,
      todoTemplate,
      isSuccess,
      errorMsg,
      provider,
    } = input;

    try {
      const db = await getVecDB();

      if (!isSuccess) {
        const queryVector = await embeddingModel.embed(userMessage);
        const queryBuffer = vectorToBuffer(queryVector);

        const match = await db.get<{ id: number; distance: number }>(
          `
          SELECT ae.id, v.distance
          FROM (
            SELECT aev.rowid, vec_distance_cosine(aev.intentVector, ?) AS distance
            FROM agent_experiences_vec aev
            JOIN agent_experiences ae ON ae.id = aev.rowid
            WHERE ae.schemaVersion = ?
            ORDER BY distance
            LIMIT 1
          ) v
          JOIN agent_experiences ae ON ae.id = v.rowid
          WHERE v.distance < ?
        `,
          [queryBuffer, CURRENT_TOOL_SCHEMA_VERSION, MERGE_DISTANCE_THRESHOLD],
        );

        if (match) {
          const reflection = await this.generateFailureReflection(
            userMessage,
            toolCallSequence,
            errorMsg || null,
            provider,
          );
          const existingRow = await db.get<{ failureNotes: string | null }>(
            `SELECT failureNotes FROM agent_experiences WHERE id = ?`,
            [match.id],
          );
          const updatedNotes = this.appendFailureNote(
            existingRow?.failureNotes || null,
            reflection,
          );
          await db.run(
            `UPDATE agent_experiences
             SET failureCount = failureCount + 1, failureNotes = ?, lastUsed = ?
             WHERE id = ?`,
            [updatedNotes, Date.now(), match.id],
          );
          logEveryWhere({
            message: `[ExperienceRecorder] Recorded failure reflection for id=${match.id}: "${reflection}"`,
          });
        }

        return;
      }

      if (!toolCallSequence || !todoTemplate) {
        return;
      }

      const generalizedIntent = await this.generalizeIntent(
        userMessage,
        provider,
      );
      const intentVector = await embeddingModel.embed(generalizedIntent);
      const intentBuffer = vectorToBuffer(intentVector);

      const existing = await db.get<AgentExperience & { distance: number }>(
        `
        SELECT ae.*, v.distance
        FROM (
          SELECT aev.rowid, vec_distance_cosine(aev.intentVector, ?) AS distance
          FROM agent_experiences_vec aev
          JOIN agent_experiences ae ON ae.id = aev.rowid
          WHERE ae.schemaVersion = ?
          ORDER BY distance
          LIMIT 1
        ) v
        JOIN agent_experiences ae ON ae.id = v.rowid
        WHERE v.distance < ?
      `,
        [intentBuffer, CURRENT_TOOL_SCHEMA_VERSION, MERGE_DISTANCE_THRESHOLD],
      );

      if (existing) {
        await db.run(
          `UPDATE agent_experiences
           SET successCount = successCount + 1, toolCallSequence = ?, todoTemplate = ?, lastUsed = ?
           WHERE id = ?`,
          [toolCallSequence, todoTemplate, Date.now(), existing.id],
        );
        logEveryWhere({
          message: `[ExperienceRecorder] Merged into id=${existing.id} (${existing.successCount + 1} successes)`,
        });
      } else {
        const now = Date.now();
        const result = await db.run(
          `INSERT INTO agent_experiences
             (runId, intent, todoTemplate, toolCallSequence, successCount, failureCount, schemaVersion, lastUsed, createdAt)
           VALUES (?, ?, ?, ?, 1, 0, ?, ?, ?)`,
          [
            runId,
            generalizedIntent,
            todoTemplate,
            toolCallSequence,
            CURRENT_TOOL_SCHEMA_VERSION,
            now,
            now,
          ],
        );

        const newId = result.lastID!;
        await db.run(
          `INSERT INTO agent_experiences_vec (rowid, intentVector) VALUES (?, ?)`,
          [newId, intentBuffer],
        );
        logEveryWhere({
          message: `[ExperienceRecorder] New experience id=${newId}: "${generalizedIntent}"`,
        });
      }
    } catch (err: any) {
      logEveryWhere({ message: `[ExperienceRecorder] Error: ${err?.message}` });
    }
  };
}

export const experienceRecorder = new ExperienceRecorder();
