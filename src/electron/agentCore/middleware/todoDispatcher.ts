import { createMiddleware } from "langchain";
import { AIMessage, ToolMessage } from "@langchain/core/messages";
import { TodoItemStatus } from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";
import { ToolContext, PlanState } from "@/electron/agentCore/toolContext";

// Tools always available regardless of active step type
const ALWAYS_ALLOWED_TOOLS = new Set(["write_todos"]);

// Extra tools unlocked per step type (on top of ALWAYS_ALLOWED_TOOLS)
const STEP_EXTRA_TOOLS: Record<string, string[]> = {
  research: ["task", "read_file", "ls", "glob", "grep"],
  visualize: ["task", "read_file"],
  code: [
    "task",
    "write_javascript",
    "execute",
    "execute_javascript",
    "read_file",
    "write_file",
    "edit_file",
    "ls",
    "glob",
    "grep",
    "request_approval",
    "confirm_approval",
  ],
  transaction: ["task", "request_approval", "confirm_approval"],
  workflow: ["task", "read_file", "request_approval", "confirm_approval"],
  communicate: [],
  manage: ["task", "read_file"],
};

// When `task` is called, main agent will delegate to the subagent, which subagent_type is expected for each step type
const STEP_ALLOWED_SUBAGENTS: Record<string, string[]> = {
  research: ["research_agent"],
  visualize: ["visualization_agent"],
  code: ["code_execution_agent"],
  transaction: ["query_agent", "trade_agent", "transfer_agent", "launch_agent"],
  workflow: ["workflow_agent"],
  manage: [
    "scheduler_agent",
    "data_management_agent",
    "task_management_agent",
    "team_mailbox_agent",
  ],
};

// Subagents that always require user approval before execution
const ALWAYS_APPROVAL_REQUIRED = new Set([
  "trade_agent",
  "transfer_agent",
  "launch_agent",
]);

// Tools that require a todo plan to exist before they can be called
const TOOLS_REQUIRING_PLAN = new Set(["request_approval", "confirm_approval"]);

// Tools allowed between steps (when plan exists but no step is in_progress)
const BETWEEN_STEPS_ALLOWED_TOOLS = new Set([
  "write_todos",
  "request_approval",
  "confirm_approval",
  "read_file",
]);

const getToolName = (tool: any): string =>
  tool?.name || tool?.function?.name || "";

// Extracts text content from a task result — handles LangGraph Command, ToolMessage, and structured output forms
const extractResultContent = (result: any): string => {
  const unwrap = (raw: string): string => {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.result === "string") {
        return parsed.result;
      }
    } catch {}

    return raw;
  };

  const contentToString = (content: any): string => {
    if (typeof content === "string") {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .map((block: any) => {
          if (typeof block === "string") {
            return block;
          }
          if (typeof block?.text === "string") {
            return block.text;
          }

          return "";
        })
        .join("")
        .trim();
    }
    return "";
  };

  if (result?.content) {
    const direct = contentToString(result.content);
    if (direct) {
      return unwrap(direct);
    }
  }

  const messages: any[] = Array.isArray(result?.update?.messages)
    ? result.update.messages
    : [];
  // Walk in reverse — deepagents with responseFormat stores the structured output
  // as a ToolMessage (not an AIMessage) so we check all message types.
  for (let index = messages.length - 1; index >= 0; index--) {
    const msg = messages[index];
    const rawContent = msg?.content ?? msg?.kwargs?.content;
    const content = contentToString(rawContent);
    if (content.trim()) {
      return unwrap(content);
    }

    // Fallback: structured output may live in additional_kwargs
    const additionalKwargs =
      msg?.additional_kwargs || msg?.kwargs?.additional_kwargs || {};
    const funcArgs =
      additionalKwargs?.function_call?.arguments ||
      additionalKwargs?.tool_calls?.[0]?.function?.arguments;
    if (typeof funcArgs === "string" && funcArgs.trim()) {
      return unwrap(funcArgs);
    }
  }

  return "";
};

// Appends text to the system message (handles both string and array forms)
const appendToSystemMessage = (request: any, text: string): any => {
  const currentSystem = request?.systemMessage;
  if (typeof currentSystem === "string") {
    return { ...request, systemMessage: currentSystem + text };
  }

  if (Array.isArray(currentSystem) && currentSystem.length > 0) {
    const last = currentSystem[currentSystem.length - 1];
    const updatedLast =
      typeof last === "string"
        ? last + text
        : { ...last, content: (last?.content || "") + text };

    return {
      ...request,
      systemMessage: [...currentSystem.slice(0, -1), updatedLast],
    };
  }

  return request;
};

// Builds the system message reminder for in_progress steps
const buildInProgressReminder = (
  inProgressTodos: any[],
  planState: string | null | undefined,
): string => {
  const names = inProgressTodos
    .map((t: any) => `"${t.content || t.title || "unknown"}"`)
    .join(", ");
  const singular = inProgressTodos.length === 1;
  const isCommunicate = inProgressTodos.every(
    (item: any) => item.type === "communicate",
  );
  const isTransaction = inProgressTodos.some(
    (item: any) => item.type === "transaction",
  );

  if (isCommunicate) {
    return (
      `\n\nREMINDER: The following todo ${singular ? "item is" : "items are"} still in_progress: [${names}]. ` +
      `Give your response — the framework will mark ${singular ? "it" : "them"} completed automatically.`
    );
  }

  if (isTransaction) {
    let transactionNextStep: string;
    if (!planState) {
      transactionNextStep =
        "Your next action MUST be: call request_approval now.";
    } else if (planState === "drafted") {
      transactionNextStep =
        "request_approval already called. Your next action MUST be: call confirm_approval with a summary table now. Do NOT call task yet.";
    } else if (planState === "approved") {
      transactionNextStep =
        "Approval granted. Your next action MUST be: call task with the appropriate subagent now.";
    } else {
      transactionNextStep =
        "Follow the approval gate: request_approval → confirm_approval → task.";
    }

    return (
      `\n\nREMINDER: The following todo ${singular ? "item is" : "items are"} still in_progress: [${names}]. ` +
      `This is a transaction step. ${transactionNextStep}`
    );
  }

  return (
    `\n\nREMINDER: The following todo ${singular ? "item is" : "items are"} still in_progress: [${names}]. ` +
    `Call task with the appropriate subagent to execute ${singular ? "it" : "them"} — the framework will mark ${singular ? "it" : "them"} completed automatically when the task succeeds.`
  );
};

// Builds the system message reminder when plan has pending steps but none is in_progress
const buildPendingReminder = (
  lastKnownTodos: any[],
  completedStepResults: { stepName: string; content: string }[],
): string => {
  const nextTodo = lastKnownTodos.find(
    (item: any) =>
      item.status !== TodoItemStatus.COMPLETED && item.status !== "rejected",
  );
  const nextName = nextTodo?.content || "the next step";
  const currentPlan = lastKnownTodos
    .map(
      (item: any) =>
        `  {"id":${item.id},"content":${JSON.stringify(item.content)},"status":"${item.status === TodoItemStatus.COMPLETED ? "completed" : item.content === nextName ? "in_progress" : item.status}","type":${JSON.stringify(item.type || "")}}`,
    )
    .join(",\n");
  let reminder =
    `\n\nREMINDER: Your todo plan has pending steps but none is currently in_progress. ` +
    `You MUST call write_todos to mark "${nextName}" as in_progress — do NOT call task before doing so. ` +
    `Use EXACTLY these items (preserving all id fields):\n[\n${currentPlan}\n]`;
  if (completedStepResults.length > 0) {
    const resultsContext = completedStepResults
      .map((r) => `\n- "${r.stepName}": ${r.content}`)
      .join("");
    reminder += `\n\nData from completed steps (use this — do NOT re-fetch):${resultsContext}`;
    reminder += `\n\nCRITICAL: The data above is already fetched. Use it directly for the next step — do NOT re-fetch. Follow the planned approval gate before delegating to any execution subagent.`;
  }
  return reminder;
};

/**
 * Enforces typed todo-driven execution:
 * 1. Intercepts write_todos to read the `type` field on in_progress items (before zod strips it)
 *    and stores it in toolContext.currentStepType.
 * 2. Filters the tool list in wrapModelCall so only tools relevant to the current step are visible.
 * 3. Prevents multiple subagent (task) calls in the same model turn via afterModel.
 */
export const createTodoDispatcherMiddleware = (toolContext: ToolContext) => {
  let lastKnownTodos: any[] = [];
  let nextTodoId = 1;
  let taskCallCounts = new Map<string, number>(); // subagent_type → calls in current step
  let completedStepResults: { stepName: string; content: string }[] = [];
  let planLocked = false;

  toolContext.update({
    resetStepState: () => {
      lastKnownTodos = [];
      nextTodoId = 1;
      taskCallCounts.clear();
      completedStepResults = [];
      planLocked = false;
    },
  });

  const handleWriteTodos = async (request: any, handler: any): Promise<any> => {
    const argsKey = request?.toolCall?.args != null ? "args" : "kwargs";
    let todos: any[] =
      request?.toolCall?.args?.todos || request?.toolCall?.kwargs?.todos || [];

    // Block new items once execution has started (plan locked after first in_progress)
    if (planLocked) {
      const newItems = todos.filter((todo: any) => {
        if (todo.id) {
          return !lastKnownTodos.some(
            (knownTodo: any) => String(knownTodo.id) === String(todo.id),
          );
        }
        // No id (some models omit id fields): treat as known if content matches
        return !lastKnownTodos.some(
          (knownTodo: any) => knownTodo.content === todo.content,
        );
      });

      if (newItems.length > 0) {
        const existingList = lastKnownTodos
          .map(
            (item: any) => `${item.id}:"${String(item.content).slice(0, 50)}"`,
          )
          .join(", ");
        logEveryWhere({
          message: `[TodoDispatcher] Blocked write_todos — plan locked, attempted to add ${newItems.length} new item(s)`,
        });

        return new ToolMessage({
          content:
            `Error: Plan is locked. Use your existing steps with their original IDs — do not create new items. ` +
            `Existing steps: {${existingList}}. The pending reminder contains the exact write_todos payload to use.`,
          tool_call_id: request?.toolCall?.id || "",
          status: "error",
        });
      }
    }

    // Auto-assign stable IDs to items that arrive without one
    todos = todos.map((todo: any) => {
      if (todo.id) {
        return todo;
      }
      const known = lastKnownTodos.find(
        (knownTodo: any) => knownTodo.id && knownTodo.content === todo.content,
      );
      return { ...todo, id: known ? known.id : nextTodoId++ };
    });

    // Detect step change to reset retry counts
    const prevActiveContent = lastKnownTodos.find(
      (item: any) => item.status === TodoItemStatus.IN_PROGRESS,
    )?.content;

    // New plan detection: if none of the incoming items match any known item (by ID or content),
    // reset to avoid cross-turn leakage (old completed steps from a previous conversation turn)
    const hasAnyKnownId = todos.some((todo: any) =>
      lastKnownTodos.some(
        (knownTodo: any) =>
          (todo.id && String(knownTodo.id) === String(todo.id)) ||
          knownTodo.content === todo.content,
      ),
    );
    if (!hasAnyKnownId && lastKnownTodos.length > 0) {
      lastKnownTodos = [];
      nextTodoId = 1;
      taskCallCounts.clear();
    }

    // Prevent status regression (completed → non-completed) and re-add dropped completed items
    // Only re-add "completed" items — never re-add in_progress/pending from a previous plan
    const mergedTodos = todos.map((item: any) => {
      const known = lastKnownTodos.find(
        (knownItem: any) => knownItem.id && knownItem.id === item.id,
      );
      if (
        known?.status === TodoItemStatus.COMPLETED &&
        item.status !== TodoItemStatus.COMPLETED
      ) {
        return { ...item, status: TodoItemStatus.COMPLETED };
      }

      return item;
    });

    const todoIds = new Set(mergedTodos.map((t: any) => t.id));
    const dropped = lastKnownTodos.filter(
      (item: any) =>
        item.id &&
        !todoIds.has(item.id) &&
        item.status === TodoItemStatus.COMPLETED,
    );
    todos = [...mergedTodos, ...dropped];
    request.toolCall[argsKey] = { ...request.toolCall[argsKey], todos };
    lastKnownTodos = todos;

    const newActiveContent = todos.find(
      (item: any) => item.status === TodoItemStatus.IN_PROGRESS,
    )?.content;
    if (prevActiveContent !== newActiveContent) {
      taskCallCounts.clear();
    }

    // Log plan creation / update before locking
    if (!planLocked) {
      const planSummary = todos
        .map(
          (todo: any) =>
            `"${String(todo.content).slice(0, 60)}"(${todo.type || "?"})`,
        )
        .join(" → ");
      logEveryWhere({
        message: `[Plan] Created ${todos.length} step(s): ${planSummary}`,
      });
    }

    // Lock the plan once any step goes in_progress — no new items allowed after this
    if (
      !planLocked &&
      todos.some((todo: any) => todo.status === TodoItemStatus.IN_PROGRESS)
    ) {
      planLocked = true;
      const triggerStep = todos.find(
        (todo: any) => todo.status === TodoItemStatus.IN_PROGRESS,
      );
      logEveryWhere({
        message: `[Plan] Locked — step "${triggerStep?.content || "unknown content"}" (${triggerStep?.type || "unknown step type"}) started`,
      });
    }

    const inProgressItems = todos.filter(
      (todo: any) => todo.status === TodoItemStatus.IN_PROGRESS,
    );
    if (inProgressItems.length > 1) {
      const titles = inProgressItems
        .map(
          (todo: any) => `"${todo.content || todo.title || "unknown title"}"`,
        )
        .join(", ");

      return new ToolMessage({
        content: `Error: Only one step can be in_progress at a time. Found ${inProgressItems.length} in_progress items: [${titles}]. Mark the current step done before starting the next.`,
        tool_call_id: request?.toolCall?.id || "",
        status: "error",
      });
    }

    const activeStep = inProgressItems[0] || null;
    if (activeStep && !activeStep.type) {
      return new ToolMessage({
        content:
          `Error: Todo item "${activeStep.content || "unknown content"}" is missing the required "type" field. ` +
          `Every in_progress item must have a type: research, visualize, code, transaction, workflow, manage, or communicate.`,
        tool_call_id: request?.toolCall?.id || "",
        status: "error",
      });
    }

    if (activeStep) {
      logEveryWhere({
        message: `[Step] In-progress: "${activeStep.content}" (${activeStep.type || "unknown step type"})`,
      });
    }

    toolContext.update({ currentStepType: activeStep?.type || null });

    const writeTodosResult = await handler(request);
    const writeTodosContent =
      typeof writeTodosResult?.content === "string"
        ? writeTodosResult.content
        : "OK";
    const idNote = `\n[Framework] IDs: {${todos.map((todo: any) => `${todo.id}:"${String(todo.content).slice(0, 50)}"`).join(", ")}}. Preserve the id field in all future write_todos calls.`;

    return new ToolMessage({
      content: writeTodosContent + idNote,
      tool_call_id:
        writeTodosResult?.tool_call_id || request?.toolCall?.id || "",
    });
  };

  const handleTask = async (request: any, handler: any): Promise<any> => {
    // Block task call if write_todos has never been called (no plan exists yet)
    if (lastKnownTodos.length === 0) {
      const earlyArgs =
        request?.toolCall?.args || request?.toolCall?.kwargs || {};
      const requestedSubagent = earlyArgs?.subagent_type || "unknown";
      logEveryWhere({
        message: `[TodoDispatcher] Blocked task("${requestedSubagent}") — write_todos not called yet`,
      });

      return new ToolMessage({
        content: `Error: You must call write_todos to create your plan before calling task. Create your full todo plan first, mark the first step as in_progress, then call task.`,
        tool_call_id: request?.toolCall?.id || "",
        status: "error",
      });
    }

    const stepType = toolContext.currentStepType;
    const allowedSubagents = stepType ? STEP_ALLOWED_SUBAGENTS[stepType] : null;
    if (allowedSubagents) {
      const args = request?.toolCall?.args || request?.toolCall?.kwargs || {};
      const requestedType: string = args?.subagent_type || "";
      if (requestedType && !allowedSubagents.includes(requestedType)) {
        logEveryWhere({
          message: `[TodoDispatcher] Blocked task call — stepType="${stepType}" requested="${requestedType}" description="${args?.description || ""}"`,
        });

        return new ToolMessage({
          content:
            `Error: Step type "${stepType}" only allows [${allowedSubagents.join(", ")}] as subagent_type. Got "${requestedType}". ` +
            `Do NOT add new todo items. Call write_todos to mark the next planned step in_progress and proceed according to your existing todo plan.`,
          tool_call_id: request?.toolCall?.id || "",
          status: "error",
        });
      }
    }

    // Block code_execution_agent if no code has been approved yet
    const taskArgs = request?.toolCall?.args || request?.toolCall?.kwargs || {};
    if (
      taskArgs?.subagent_type === "code_execution_agent" &&
      !toolContext.pendingCode
    ) {
      logEveryWhere({
        message: `[TodoDispatcher] Blocked code_execution_agent — no pending code`,
      });
      return new ToolMessage({
        content:
          "Error: No approved code found. You must call `write_javascript` with the complete code first, then call `confirm_approval` so the user can review it. Only after approval is granted should you delegate to code_execution_agent.",
        tool_call_id: request?.toolCall?.id || "",
        status: "error",
      });
    }

    // Enforce retry limit: max 1 call per subagent_type per step (no retries)
    const subagentType = taskArgs?.subagent_type || "unknown subagent_type";
    const callCount = taskCallCounts.get(subagentType) || 0;
    if (callCount >= 1) {
      logEveryWhere({
        message: `[TodoDispatcher] Retry limit hit — ${subagentType} already called once in current step`,
      });
      return new ToolMessage({
        content: `Error: ${subagentType} already failed for this step. Do not retry — report the failure to the user instead.`,
        tool_call_id: request?.toolCall?.id || "",
        status: "error",
      });
    }

    // Block task call if no step is currently in_progress (retry after auto-advance)
    const hasActiveStep = lastKnownTodos.some(
      (item: any) => item.status === TodoItemStatus.IN_PROGRESS,
    );
    if (!hasActiveStep) {
      logEveryWhere({
        message: `[TodoDispatcher] Blocked "${subagentType}" — no step in_progress, retrying a completed step`,
      });
      return new ToolMessage({
        content: `Error: No step is currently in_progress. You cannot retry a completed step. Call write_todos to mark the next step as in_progress and proceed with your plan.`,
        tool_call_id: request?.toolCall?.id || "",
        status: "error",
      });
    }

    // Enforce approval gate — block execution subagents until planState is APPROVED.
    // trade/transfer/launch always require approval (they only perform on-chain execution).
    // workflow_agent requires approval only for "workflow" step type (run_workflow) —
    // not for search/list/check operations which use a "manage" or "transaction" step type.
    const needsApproval =
      ALWAYS_APPROVAL_REQUIRED.has(subagentType) ||
      (subagentType === "workflow_agent" &&
        toolContext.currentStepType === "workflow");
    if (needsApproval && toolContext.planState !== PlanState.APPROVED) {
      logEveryWhere({
        message: `[TodoDispatcher] Blocked task("${subagentType}") — planState="${toolContext.planState}" stepType="${toolContext.currentStepType}" (APPROVED required)`,
      });
      return new ToolMessage({
        content:
          `Error: Cannot delegate to ${subagentType} without user approval. ` +
          `You MUST follow the approval gate in order: ` +
          `(1) call request_approval now, ` +
          `(2) call confirm_approval with a markdown summary table, ` +
          `(3) only AFTER approval is granted, call task("${subagentType}").`,
        tool_call_id: request?.toolCall?.id || "",
        status: "error",
      });
    }

    // Count this as an execution attempt only after all soft blocks pass
    taskCallCounts.set(subagentType, callCount + 1);

    const taskResult = await handler(request);
    const resultContent = extractResultContent(taskResult);
    const taskFailed =
      taskResult?.status === "error" ||
      resultContent.startsWith("Error:") ||
      resultContent.startsWith("error:") ||
      resultContent.includes("blocked_planning_mode");

    if (taskFailed) {
      logEveryWhere({
        message: `[Step] Failed: "${subagentType}" — ${resultContent.slice(0, 200)}`,
      });
      return taskResult;
    }

    // Auto-advance the in_progress step to completed on success
    const inProgressIndex = lastKnownTodos.findIndex(
      (item: any) => item.status === TodoItemStatus.IN_PROGRESS,
    );
    if (inProgressIndex !== -1) {
      const completedStep = lastKnownTodos[inProgressIndex];
      lastKnownTodos = lastKnownTodos.map((item: any, index: number) =>
        index === inProgressIndex
          ? { ...item, status: TodoItemStatus.COMPLETED }
          : item,
      );
      toolContext.update({ currentStepType: null });
      taskCallCounts.clear();

      if (resultContent) {
        const truncated =
          resultContent.length > 1200
            ? resultContent.slice(0, 1200) + "..."
            : resultContent;
        completedStepResults.push({
          stepName: completedStep.content,
          content: truncated,
        });
      }
      const allDone = lastKnownTodos.every(
        (item: any) => item.status === TodoItemStatus.COMPLETED,
      );
      const nextStep = !allDone
        ? lastKnownTodos.find(
            (item: any) => item.status !== TodoItemStatus.COMPLETED,
          )
        : null;
      logEveryWhere({
        message: allDone
          ? `[Step] Completed: "${completedStep.content}" — all done`
          : `[Step] Completed: "${completedStep.content}" → next: "${nextStep?.content}"`,
      });
      toolContext.onStepAdvanced?.(completedStep.content, lastKnownTodos);
      if (allDone) {
        toolContext.onAllDone?.(lastKnownTodos);
      }
      const note = allDone
        ? `\n\n[Framework] Step "${completedStep.content}" has been automatically marked as completed. All steps are complete — give your final response.`
        : `\n\n[Framework] Step "${completedStep.content}" has been automatically marked as completed. Call write_todos to mark the next step as in_progress.`;

      const storedContent =
        resultContent.length > 2000
          ? resultContent.slice(0, 2000) + "...[truncated]"
          : resultContent;

      return new ToolMessage({
        content: storedContent + note,
        tool_call_id: taskResult?.tool_call_id || request?.toolCall?.id || "",
      });
    }

    return taskResult;
  };

  const handleConfirmApproval = async (
    request: any,
    handler: any,
  ): Promise<any> => {
    const result = await handleGateChecks(request, handler);
    try {
      const content = typeof result?.content === "string" ? result.content : "";
      const parsed = JSON.parse(content);
      if (parsed.status === "rejected") {
        lastKnownTodos = lastKnownTodos.map((item: any) =>
          item.status === TodoItemStatus.IN_PROGRESS
            ? { ...item, status: "rejected" }
            : item,
        );
        planLocked = false;
        toolContext.update({ currentStepType: null });
        logEveryWhere({
          message: `[TodoDispatcher] Plan rejected — marked step as rejected, released plan lock`,
        });
      }
    } catch {}
    return result;
  };

  const handleGateChecks = async (request: any, handler: any): Promise<any> => {
    const toolName = request?.toolCall?.name;
    const hasTodoPlan = lastKnownTodos.length > 0;

    // Block request_approval / confirm_approval if no todo plan exists yet
    if (!hasTodoPlan && TOOLS_REQUIRING_PLAN.has(toolName)) {
      logEveryWhere({
        message: `[TodoDispatcher] Blocked "${toolName}" — no todo plan yet`,
      });
      return new ToolMessage({
        content: `Error: You must call write_todos to create your plan before calling "${toolName}". Create your full todo plan first, mark the first step as in_progress, then gather any needed data before requesting approval.`,
        tool_call_id: request?.toolCall?.id || "",
        status: "error",
      });
    }

    // Block execution tools when plan exists but no step is in_progress
    const hasInProgress = lastKnownTodos.some(
      (todo: any) => todo.status === TodoItemStatus.IN_PROGRESS,
    );

    if (
      hasTodoPlan &&
      !hasInProgress &&
      !ALWAYS_ALLOWED_TOOLS.has(toolName) &&
      !BETWEEN_STEPS_ALLOWED_TOOLS.has(toolName)
    ) {
      logEveryWhere({
        message: `[TodoDispatcher] Blocked "${toolName}" — todo plan exists but no step is in_progress`,
      });

      return new ToolMessage({
        content:
          `Error: You have a todo plan but no step is currently in_progress. ` +
          `Call write_todos to mark the next step as in_progress before calling "${toolName}".`,
        tool_call_id: request?.toolCall?.id || "",
        status: "error",
      });
    }

    return handler(request);
  };

  return createMiddleware({
    name: "TodoDispatcher",

    wrapToolCall: async (request: any, handler: any) => {
      const toolName = request?.toolCall?.name;
      if (toolName === "write_todos") {
        return handleWriteTodos(request, handler);
      }
      if (toolName === "task") {
        return handleTask(request, handler);
      }
      if (toolName === "confirm_approval") {
        return handleConfirmApproval(request, handler);
      }
      return handleGateChecks(request, handler);
    },

    wrapModelCall: async (request: any, handler: any) => {
      let updatedRequest = request;

      // Inject experience hint once on the first model call of a run, then clear it
      const hint = toolContext.experienceHint;
      if (hint) {
        toolContext.update({ experienceHint: null });
        updatedRequest = appendToSystemMessage(updatedRequest, "\n\n" + hint);
      }

      // Inject reminder if any todos are still in_progress
      const inProgressTodos = lastKnownTodos.filter(
        (item: any) => item.status === TodoItemStatus.IN_PROGRESS,
      );
      if (inProgressTodos.length > 0) {
        const isTransaction = inProgressTodos.some(
          (item: any) => item.type === "transaction",
        );
        const currentPlanState = toolContext.planState;

        if (isTransaction) {
          logEveryWhere({
            message: `[TodoDispatcher] In-progress reminder — isTransaction=true planState="${currentPlanState}"`,
          });
        }
        updatedRequest = appendToSystemMessage(
          updatedRequest,
          buildInProgressReminder(inProgressTodos, currentPlanState),
        );
      }

      // Inject reminder when plan has pending todos but nothing is in_progress
      // (happens right after auto-advance — prevents the LLM from retrying task before calling write_todos)
      const hasPendingTodos = lastKnownTodos.some(
        (item: any) =>
          item.status !== TodoItemStatus.COMPLETED &&
          item.status !== "rejected",
      );
      if (
        lastKnownTodos.length > 0 &&
        inProgressTodos.length === 0 &&
        hasPendingTodos
      ) {
        const nextTodo = lastKnownTodos.find(
          (item: any) =>
            item.status !== TodoItemStatus.COMPLETED &&
            item.status !== "rejected",
        );
        logEveryWhere({
          message: `[TodoDispatcher] Pending reminder — nextStep="${nextTodo?.content || "the next step"}" completedStepResults=${completedStepResults.length}`,
        });
        updatedRequest = appendToSystemMessage(
          updatedRequest,
          buildPendingReminder(lastKnownTodos, completedStepResults),
        );
      }

      // Filter tools based on current execution state
      if (
        !Array.isArray(updatedRequest?.tools) ||
        updatedRequest.tools.length === 0
      ) {
        return handler(updatedRequest);
      }

      const stepType = toolContext.currentStepType;
      let allowed: Set<string>;

      if (stepType && STEP_EXTRA_TOOLS[stepType]) {
        // Active step: only tools scoped to this step type
        allowed = new Set([
          ...ALWAYS_ALLOWED_TOOLS,
          ...STEP_EXTRA_TOOLS[stepType],
        ]);
      } else if (lastKnownTodos.length > 0) {
        // Between steps: plan exists but nothing in_progress
        allowed = BETWEEN_STEPS_ALLOWED_TOOLS;
      } else {
        // No todos yet: only write_todos + read_file (memory read at startup is legitimate)
        allowed = new Set(["write_todos", "read_file"]);
      }

      const filteredTools = updatedRequest.tools.filter((tool: any) =>
        allowed.has(getToolName(tool)),
      );

      return handler({ ...updatedRequest, tools: filteredTools });
    },

    afterModel: (state: any) => {
      const messages: any[] = state?.messages;
      if (!messages?.length) {
        return;
      }

      const lastAiMsg = [...messages]
        .reverse()
        .find((msg: any) => AIMessage.isInstance(msg));
      if (!lastAiMsg) {
        return;
      }

      // Strip preamble text when tool calls are present — it's reasoning noise that
      // wastes input tokens on every subsequent turn without adding value
      if (lastAiMsg?.tool_calls?.length && lastAiMsg.content) {
        lastAiMsg.content = "";
      }

      // Auto-advance communicate steps when LLM gives a text response (no tool calls)
      if (!lastAiMsg?.tool_calls?.length) {
        const communicateIndex = lastKnownTodos.findIndex(
          (item: any) =>
            item.status === TodoItemStatus.IN_PROGRESS &&
            item.type === "communicate",
        );
        if (communicateIndex !== -1) {
          const completedStep = lastKnownTodos[communicateIndex];
          lastKnownTodos = lastKnownTodos.map((item: any, index: number) =>
            index === communicateIndex
              ? { ...item, status: TodoItemStatus.COMPLETED }
              : item,
          );
          toolContext.update({ currentStepType: null });
          taskCallCounts.clear();
          const allDone = lastKnownTodos.every(
            (item: any) => item.status === TodoItemStatus.COMPLETED,
          );
          const nextStep = !allDone
            ? lastKnownTodos.find(
                (item: any) => item.status !== TodoItemStatus.COMPLETED,
              )
            : null;
          logEveryWhere({
            message: allDone
              ? `[Step] Completed: "${completedStep.content}" — all done`
              : `[Step] Completed: "${completedStep.content}" → next: "${nextStep?.content}"`,
          });
          toolContext.onStepAdvanced?.(completedStep.content, lastKnownTodos);
          if (allDone) {
            toolContext.onAllDone?.(lastKnownTodos);
          }
        }
        return;
      }

      const taskCalls = lastAiMsg.tool_calls.filter(
        (taskCall: any) => taskCall.name === "task",
      );
      if (taskCalls.length <= 1) {
        return;
      }

      // Block multiple task (subagent) calls in the same turn
      return {
        messages: taskCalls.slice(1).map(
          (taskCall: any) =>
            new ToolMessage({
              content:
                "Error: Only one subagent delegation per turn. Wait for the current task to complete, mark it done in write_todos, then start the next.",
              tool_call_id: taskCall.id,
              status: "error",
            }),
        ),
      };
    },
  });
};
