import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { LLMResult } from "@langchain/core/outputs";
import type { Serialized } from "@langchain/core/load/serializable";

export type TraceStep =
  | { type: "llm_end"; output: string; timestamp: number }
  | {
      type: "tool_start";
      toolName: string;
      input: unknown;
      timestamp: number;
    }
  | {
      type: "tool_end";
      toolName: string;
      output: string;
      timestamp: number;
    };

export class TraceCollector extends BaseCallbackHandler {
  name = "TraceCollector";
  steps: TraceStep[] = [];
  private toolNameByRunId = new Map<string, string>();

  handleLLMEnd(output: LLMResult): void {
    const text =
      output?.generations?.[0]?.[0]?.text ||
      JSON.stringify(output?.generations || []);
    this.steps.push({
      type: "llm_end",
      output: text,
      timestamp: Date.now(),
    });
  }

  handleToolStart(
    _tool: Serialized,
    input: string,
    runId: string,
    _parentRunId?: string,
    _tags?: string[],
    _metadata?: Record<string, unknown>,
    name?: string,
  ): void {
    let parsedInput: unknown = input;
    try {
      parsedInput = JSON.parse(input);
    } catch {
      parsedInput = input;
    }
    const toolName = name || "unknown";
    this.toolNameByRunId.set(runId, toolName);
    this.steps.push({
      type: "tool_start",
      toolName,
      input: parsedInput,
      timestamp: Date.now(),
    });
  }

  handleToolEnd(
    output: any,
    runId: string,
    _parentRunId?: string,
    _tags?: string[],
  ): void {
    const toolName = this.toolNameByRunId.get(runId) || "unknown";
    this.toolNameByRunId.delete(runId);
    const serializedOutput =
      typeof output === "string" ? output : JSON.stringify(output);
    this.steps.push({
      type: "tool_end",
      toolName,
      output: serializedOutput,
      timestamp: Date.now(),
    });
  }

  toJson(): string {
    return JSON.stringify(this.steps);
  }
}
