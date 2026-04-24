import { randomUUID } from "crypto";
import { codexCliAuth } from "./codexCliAuth";

class CodexCliTransport {
  private sessionId = randomUUID();

  createCodexFetch = (): typeof fetch => {
    return async (input: RequestInfo | URL, init?: RequestInit) => {
      const accessToken = await codexCliAuth.getAccessToken();
      const config = codexCliAuth.loadConfig();

      const headers = new Headers(init?.headers);
      headers.delete("authorization");
      headers.set("authorization", `Bearer ${accessToken}`);
      headers.set("originator", config.originator);
      headers.set("session_id", this.sessionId);

      let body = init?.body;
      if (body && typeof body === "string") {
        try {
          const parsed = JSON.parse(body);
          delete parsed.temperature;
          parsed.store = false;

          if (Array.isArray(parsed.tools)) {
            parsed.tools = parsed.tools.map((tool: any) =>
              tool.parameters
                ? {
                    ...tool,
                    parameters: this.enforceStrictSchema(tool.parameters),
                  }
                : tool,
            );
          }

          if (!parsed.instructions && Array.isArray(parsed.input)) {
            parsed.instructions = this.extractInstructions(parsed.input);
            parsed.input = parsed.input.filter(
              (msg: any) => msg.role !== "system" && msg.role !== "developer",
            );
          }
          body = JSON.stringify(parsed);
        } catch {}
      }

      return fetch(input, { ...init, headers, body });
    };
  };

  private extractInstructions = (input: any[]): string => {
    const systemMessages = input.filter(
      (msg) => msg.role === "system" || msg.role === "developer",
    );
    if (systemMessages.length === 0) {
      return "You are a helpful assistant.";
    }

    return systemMessages
      .map((msg) =>
        typeof msg.content === "string"
          ? msg.content
          : Array.isArray(msg.content)
            ? msg.content.map((part: any) => part.text || "").join("")
            : "",
      )
      .join("\n");
  };

  private enforceStrictSchema = (schema: any): any => {
    if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
      return schema;
    }

    for (const key of ["anyOf", "oneOf", "allOf"]) {
      if (Array.isArray(schema[key])) {
        return { ...schema, [key]: schema[key].map(this.enforceStrictSchema) };
      }
    }

    if (schema.type === "object") {
      const properties = schema.properties || {};
      const allKeys = Object.keys(properties);
      // z.record() — no defined properties and not already strict → convert to string
      if (allKeys.length === 0 && schema.additionalProperties !== false) {
        return { type: "string" };
      }

      const existingRequired: string[] = schema.required || [];
      const updatedProperties: Record<string, any> = {};
      for (const key of allKeys) {
        const propSchema = this.enforceStrictSchema(properties[key]);
        updatedProperties[key] = existingRequired.includes(key)
          ? propSchema
          : { anyOf: [propSchema, { type: "null" }] };
      }

      return {
        ...schema,
        properties: updatedProperties,
        required: allKeys,
        additionalProperties: false,
      };
    }

    if (schema.type === "array" && schema.items) {
      let items = this.enforceStrictSchema(schema.items);
      if (!items.type && !items.anyOf && !items.oneOf && !items.allOf) {
        items = { type: "object", additionalProperties: false };
      }
      return { ...schema, items };
    }

    // {} (z.unknown()) — needs a type key
    if (!schema.type && !schema.anyOf && !schema.oneOf && !schema.allOf) {
      const meaningfulKeys = Object.keys(schema).filter(
        (key) => key !== "$schema" && key !== "description",
      );
      if (meaningfulKeys.length === 0) {
        return { type: "object", additionalProperties: false };
      }
    }
    return schema;
  };
}

const codexCliTransport = new CodexCliTransport();
export { codexCliTransport };
