import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { agentMailboxDB } from "@/electron/database/agentMailbox";
import { safeStringify } from "@/electron/appAgent/utils";
import { TOOL_KEYS } from "@/electron/constant";

const schema = z.object({
  messageId: z.number().describe("ID of the message to acknowledge"),
});

export const acknowledgeMessageTool = () =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.ACKNOWLEDGE_MESSAGE,
    description:
      "Mark a message as acknowledged after you have processed it. Acknowledged messages are excluded from future read_messages calls.",
    schema: schema as any,
    func: async ({ messageId }: { messageId: number }) => {
      const [success, err] = await agentMailboxDB.acknowledgeMessage(messageId);

      if (err) {
        throw new Error(`Failed to acknowledge message: ${err?.message}`);
      }

      return safeStringify({ success, messageId });
    },
  });
