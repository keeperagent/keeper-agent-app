import { logEveryWhere } from "@/electron/service/util";
import {
  getVecDB,
  vectorToBuffer,
  CURRENT_TOOL_SCHEMA_VERSION,
  type AgentExperience,
} from "@/electron/database/vectorDB";
import { embeddingModel } from "./embedding";

const SIMILARITY_THRESHOLD = 0.85;
const CONFIDENCE_THRESHOLD = 0.8;
const MIN_SUCCESS_COUNT = 3;

class ExperienceRetriever {
  retrieve = async (userMessage: string): Promise<string | null> => {
    try {
      logEveryWhere({ message: `[ExperienceRetriever] Querying for: "${userMessage.slice(0, 80)}"` });
      const db = await getVecDB();
      const queryVector = await embeddingModel.embed(userMessage);
      const queryBuffer = vectorToBuffer(queryVector);

      const row = await db.get<AgentExperience & { distance: number }>(
        `
        SELECT ae.*, v.distance
        FROM (
          SELECT rowid, vec_distance_cosine(intentVector, ?) AS distance
          FROM agent_experiences_vec
          ORDER BY distance
          LIMIT 10
        ) v
        JOIN agent_experiences ae ON ae.id = v.rowid
        WHERE ae.schemaVersion = ?
        ORDER BY v.distance
        LIMIT 1
      `,
        [queryBuffer, CURRENT_TOOL_SCHEMA_VERSION],
      );

      if (!row) {
        logEveryWhere({ message: `[ExperienceRetriever] No match found in DB` });
        return null;
      }

      // vec_distance_cosine returns cosine distance: 0 = identical, 2 = opposite
      // For normalized vectors: similarity = 1 - distance
      const similarity = 1 - row.distance;
      if (similarity < SIMILARITY_THRESHOLD) {
        logEveryWhere({
          message: `[ExperienceRetriever] Miss: similarity=${similarity.toFixed(3)} below threshold=${SIMILARITY_THRESHOLD}`,
        });
        return null;
      }

      const confidence =
        row.successCount / (row.successCount + row.failureCount);
      if (
        confidence < CONFIDENCE_THRESHOLD ||
        row.successCount < MIN_SUCCESS_COUNT
      ) {
        logEveryWhere({
          message: `[ExperienceRetriever] Miss: confidence=${confidence.toFixed(2)} successes=${row.successCount} — thresholds not met`,
        });
        return null;
      }

      const toolSequence = JSON.parse(row.toolCallSequence) as string[];
      const todos = JSON.parse(row.todoTemplate) as { content: string }[];
      const todoSteps = todos.map((todo) => todo.content).join(" → ");

      logEveryWhere({
        message: `[ExperienceRetriever] Hit: similarity=${similarity.toFixed(3)} confidence=${confidence.toFixed(2)} successes=${row.successCount} intent="${row.intent}"`,
      });

      const lines = [
        `[Experience] This is a reference from a similar past task — use it as a guide only. You MUST still call write_todos first with a complete plan before any other action.`,
        `Past todo plan: ${todoSteps}`,
        `Past tools used: ${toolSequence.join(" → ")}`,
      ];

      if (row.failureNotes) {
        const notes = row.failureNotes.split("\n").filter(Boolean);
        lines.push(`⚠ Known failure modes:`);
        notes.forEach((note) => lines.push(`- ${note}`));
      }

      return lines.join("\n");
    } catch (err: any) {
      logEveryWhere({
        message: `[ExperienceRetriever] Error: ${err?.message}`,
      });
      return null;
    }
  };
}

export const experienceRetriever = new ExperienceRetriever();
