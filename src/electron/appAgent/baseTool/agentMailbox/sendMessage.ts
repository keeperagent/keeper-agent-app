import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { agentMailboxDB } from "@/electron/database/agentMailbox";
import { agentProfileDB } from "@/electron/database/agentProfile";
import { sendToRenderer } from "@/electron/main";
import { MESSAGE } from "@/electron/constant";
import { safeStringify } from "@/electron/appAgent/utils";
import type { ToolContext } from "@/electron/appAgent/toolContext";
import { TOOL_KEYS } from "@/electron/constant";

const schema = z.object({
  to: z
    .union([z.number(), z.literal("*")])
    .describe(
      'Recipient agent registry ID, or "*" to broadcast to all agents in the team.',
    ),
  subject: z.string().describe("Short subject line for the message"),
  body: z.string().describe("Full message body"),
});

export const sendMessageTool = (toolContext: ToolContext) =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.SEND_MESSAGE,
    description:
      'Send a message to another registry agent by their agent ID, or broadcast to all agents with to="*". Use this to coordinate work, share results, or delegate sub-tasks.',
    schema: schema as any,
    func: async ({
      to,
      subject,
      body,
    }: {
      to: number | "*";
      subject: string;
      body: string;
    }) => {
      const isBroadcast = to === "*";
      const toAgentId = isBroadcast ? undefined : (to as number);

      if (toAgentId !== undefined) {
        const [recipient] = await agentProfileDB.getOneAgentProfile(toAgentId);
        if (!recipient) {
          throw new Error(`Recipient agent not found: ${toAgentId}`);
        }
      }

      const [message, err] = await agentMailboxDB.createMessage({
        fromAgentId: toolContext.agentProfileId,
        toAgentId,
        subject,
        body,
        isBroadcast,
      });

      if (err || !message) {
        throw new Error(`Failed to send message: ${err?.message}`);
      }

      sendToRenderer(MESSAGE.AGENT_MAILBOX_CHANGED);

      return safeStringify({
        success: true,
        messageId: message.id,
        to: isBroadcast ? "broadcast" : toAgentId!,
      });
    },
  });
