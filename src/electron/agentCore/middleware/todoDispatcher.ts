import { createMiddleware } from "langchain";
import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { TodoItemStatus } from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";
import { ToolContext, PlanState } from "@/electron/agentCore/toolContext";

const ALWAYS_ALLOWED_TOOLS = new Set(["write_todos"]);

const BETWEEN_STEPS_ALLOWED_TOOLS = new Set([
  "write_todos",
  "request_approval",
  "confirm_approval",
  "read_file",
]);

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

// Returns the total character length of an AI message's text content (handles string and array forms)
const getTextLen = (content: any): number => {
  if (typeof content === "string") {
    return content.length;
  }
  if (Array.isArray(content)) {
    return content
      .filter((block: any) => block.type === "text")
      .reduce((sum: number, block: any) => sum + (block.text || "").length, 0);
  }
  return 0;
};

// Appends text to the system message (used only for one-time hints, not dynamic reminders)
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
        "If this step requires on-chain data (price, balance), call task(query_agent) now. " +
        "If you have all required data and are ready to execute a swap or transfer, call request_approval next.";
    } else if (planState === "drafted") {
      transactionNextStep =
        "request_approval already called. Your next action MUST be: call confirm_approval with a summary table now. Do NOT call task yet.";
    } else if (planState === "approved") {
      transactionNextStep =
        "Approval granted. If your plan has a separate execute step next, call write_todos to mark the current step completed and the execute step in_progress — the approval carries over. " +
        "If execution is part of the current step, call task() with the execution subagent immediately. Do NOT write any text response.";
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
        `  {"id":${item.id},"content":${JSON.stringify(item.content)},"status":"${item.status === TodoItemStatus.COMPLETED ? "completed" : item.id === nextTodo?.id ? "in_progress" : item.status}","type":${JSON.stringify(item.type || "")}}`,
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
    const isCommunicateNext = nextTodo?.type === "communicate";
    if (isCommunicateNext) {
      reminder +=
        `\n\nCRITICAL: The next step is to share results with the user. ` +
        `Write a FULL response now — do NOT just say "Done" or repeat the step name. ` +
        `Your response MUST include: (1) how many wallets succeeded vs failed, ` +
        `(2) transaction hash(es) for successful wallets, ` +
        `(3) reason for any failures. ` +
        `Use the data from completed steps above. The framework will mark this step completed automatically.`;
    } else {
      reminder += `\n\nCRITICAL: The data above is already fetched. Use it directly for the next step — do NOT re-fetch. Follow the planned approval gate before delegating to any execution subagent.`;
    }
  }
  return reminder;
};

// Builds the nudge message for a stalled non-communicate step (no tool call produced)
const buildStallNudge = (
  stalledStep: any,
  planState: string | null | undefined,
): string => {
  if (planState === PlanState.APPROVED) {
    return (
      "CRITICAL: Approval is granted but you produced no tool call. " +
      "If your plan has a separate execute step next, call write_todos to advance to it — the approval carries over automatically. " +
      "If execution is part of the current step, call task() with the execution subagent immediately. " +
      "Do NOT output any text."
    );
  }

  const stepName = stalledStep.content;
  const stepType = stalledStep.type;

  if (stepType === "transaction") {
    return (
      `CRITICAL: Step "${stepName}" is in_progress but you produced no tool call. ` +
      "If this step needs on-chain data (balance, price), call task(query_agent) NOW. " +
      "If you have all required data and are ready to execute, call request_approval NOW. " +
      "Do NOT output any text."
    );
  }

  if (stepType === "workflow") {
    return (
      `CRITICAL: Step "${stepName}" is in_progress but you produced no tool call. ` +
      "Call request_approval to begin the approval gate, then confirm_approval, then task(workflow_agent). " +
      "Do NOT output any text."
    );
  }

  if (stepType === "code") {
    return (
      `CRITICAL: Step "${stepName}" is in_progress but you produced no tool call. ` +
      "Call write_javascript with the complete code first, then confirm_approval so the user can review, " +
      "then task(code_execution_agent). Do NOT output any text."
    );
  }

  const stepTypeToSubagent: Record<string, string> = {
    research: "research_agent",
    visualize: "visualization_agent",
    manage:
      "the appropriate management subagent (scheduler_agent, data_management_agent, task_management_agent, or team_mailbox_agent)",
  };

  const subagent = stepTypeToSubagent[stepType] || "the appropriate subagent";
  return (
    `CRITICAL: Step "${stepName}" is in_progress but you produced no tool call. ` +
    `Call task(${subagent}) NOW. Do NOT output any text.`
  );
};

/**
 * Guards the agent's todo-driven execution loop. Responsibilities:
 *
 * 1. Plan lifecycle — tracks the active plan across turns:
 *    - Locks the plan once any step goes in_progress (no new items allowed mid-execution).
 *    - Lazily resets lock and state when the model starts a brand-new plan after the previous one fully completed.
 *    - Assigns stable IDs to todo items so they survive across write_todos calls.
 *
 * 2. Step scoping — restricts available tools to what the current step type allows:
 *    - Reads the `type` field on the in_progress item from write_todos.
 *    - Stores it in toolContext.currentStepType so the allowlist middleware can enforce it.
 *
 * 3. Approval gate — blocks execution subagents (trade/transfer/launch/workflow) until
 *    the user has approved via request_approval → confirm_approval.
 *
 * 4. Auto-advance — marks steps completed automatically after a successful task() call,
 *    and auto-completes communicate steps when the model outputs a text response.
 *
 * 5. Safety rails — prevents retries on failed steps, multiple task() calls per turn,
 *    and status regression (completed → non-completed).
 *
 * 6. Stall recovery — detects zero-output turns and injects a nudge to resume:
 *    - Non-communicate step in_progress but no tool call → nudge based on approval state.
 *    - No plan and zero output → nudge to call write_todos.
 *    - Communicate ready and model produced text → auto-advance and complete.
 */
export const createTodoDispatcherMiddleware = (toolContext: ToolContext) => {
  let lastKnownTodos: any[] = [];
  let nextTodoId = 1;
  let taskCallCounts = new Map<string, number>(); // subagent_type → calls in current step
  let completedStepResults: { stepName: string; content: string }[] = [];
  let planLocked = false;
  let stallCountPerStep = new Map<number, number>(); // stepId → consecutive stall count
  let betweenStepsStallCount = 0;

  const MAX_STALLS_PER_STEP = 3;
  const MAX_BETWEEN_STEPS_STALLS = 3;

  const resetStepState = () => {
    lastKnownTodos = [];
    nextTodoId = 1;
    taskCallCounts.clear();
    completedStepResults = [];
    planLocked = false;
    stallCountPerStep.clear();
    betweenStepsStallCount = 0;
  };

  toolContext.update({ resetStepState });

  const getArgs = (request: any): any =>
    request?.toolCall?.args || request?.toolCall?.kwargs || {};

  const blockError = (content: string, request: any): ToolMessage =>
    new ToolMessage({
      content,
      tool_call_id: request?.toolCall?.id || "",
      status: "error",
    });

  // Advances a todo step to completed, fires callbacks, and returns logging metadata.
  // Used by both handleTask (on success) and afterModel (communicate auto-advance).
  const advanceStepToCompleted = (
    stepIndex: number,
  ): {
    completedStep: any;
    allDone: boolean;
    nextStep: any;
  } => {
    const completedStep = lastKnownTodos[stepIndex];
    lastKnownTodos = lastKnownTodos.map((item: any, index: number) =>
      index === stepIndex
        ? { ...item, status: TodoItemStatus.COMPLETED }
        : item,
    );
    toolContext.update({ currentStepType: null });
    taskCallCounts.clear();
    stallCountPerStep.clear();
    betweenStepsStallCount = 0;

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

    return { completedStep, allDone, nextStep };
  };

  const handleWriteTodos = async (request: any, handler: any): Promise<any> => {
    const argsKey = request?.toolCall?.args != null ? "args" : "kwargs";
    let todos: any[] =
      request?.toolCall?.args?.todos || request?.toolCall?.kwargs?.todos || [];

    logEveryWhere({
      message:
        `[TodoDispatcher] handleWriteTodos — incoming todos=${todos.length} ` +
        `statuses=[${todos.map((t: any) => t.status).join(",")}] ` +
        `planLocked=${planLocked} existingTodos=${lastKnownTodos.length}`,
    });

    // Lazy reset: if the previous plan fully completed/rejected and the incoming todos
    // are an entirely new plan (no matching IDs or content), reset state so the new
    // plan is not blocked by the stale planLocked flag.
    const allExistingDone =
      planLocked &&
      lastKnownTodos.length > 0 &&
      lastKnownTodos.every(
        (item: any) =>
          item.status === TodoItemStatus.COMPLETED ||
          item.status === "rejected",
      );
    const incomingMatchesExisting = todos.some((todo: any) =>
      lastKnownTodos.some(
        (knownTodo: any) =>
          (todo.id && String(knownTodo.id) === String(todo.id)) ||
          knownTodo.content === todo.content,
      ),
    );
    if (allExistingDone && !incomingMatchesExisting) {
      logEveryWhere({
        message: `[TodoDispatcher] Previous plan fully done — lazy reset for new plan`,
      });
      resetStepState();
    }

    // Block new items once execution has started (plan locked after first in_progress)
    if (planLocked) {
      const newItems = todos.filter((todo: any) => {
        if (todo.id) {
          return !lastKnownTodos.some(
            (knownTodo: any) => String(knownTodo.id) === String(todo.id),
          );
        }
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
        return blockError(
          `Error: Plan is locked. Use your existing steps with their original IDs — do not create new items. ` +
            `Existing steps: {${existingList}}. The pending reminder contains the exact write_todos payload to use.`,
          request,
        );
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
      return blockError(
        `Error: Only one step can be in_progress at a time. Found ${inProgressItems.length} in_progress items: [${titles}]. Mark the current step done before starting the next.`,
        request,
      );
    }

    const activeStep = inProgressItems[0] || null;
    if (activeStep && !activeStep.type) {
      return blockError(
        `Error: Todo item "${activeStep.content || "unknown content"}" is missing the required "type" field. ` +
          `Every in_progress item must have a type: research, visualize, code, transaction, workflow, manage, or communicate.`,
        request,
      );
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
    const taskArgs = getArgs(request);
    const subagentType = taskArgs?.subagent_type || "unknown subagent_type";

    // Block task call if write_todos has never been called (no plan exists yet)
    if (lastKnownTodos.length === 0) {
      logEveryWhere({
        message: `[TodoDispatcher] Blocked task("${subagentType}") — write_todos not called yet`,
      });
      return blockError(
        `Error: You must call write_todos to create your plan before calling task. Create your full todo plan first, mark the first step as in_progress, then call task.`,
        request,
      );
    }

    const stepType = toolContext.currentStepType;
    const allowedSubagents = stepType ? STEP_ALLOWED_SUBAGENTS[stepType] : null;
    if (
      allowedSubagents &&
      subagentType &&
      !allowedSubagents.includes(subagentType)
    ) {
      logEveryWhere({
        message: `[TodoDispatcher] Blocked task call — stepType="${stepType}" requested="${subagentType}" description="${taskArgs?.description || ""}"`,
      });
      return blockError(
        `Error: Step type "${stepType}" only allows [${allowedSubagents.join(", ")}] as subagent_type. Got "${subagentType}". ` +
          `Do NOT add new todo items. Call write_todos to mark the next planned step in_progress and proceed according to your existing todo plan.`,
        request,
      );
    }

    // Block code_execution_agent if no code has been approved yet
    if (subagentType === "code_execution_agent" && !toolContext.pendingCode) {
      logEveryWhere({
        message: `[TodoDispatcher] Blocked code_execution_agent — no pending code`,
      });
      return blockError(
        "Error: No approved code found. You must call `write_javascript` with the complete code first, then call `confirm_approval` so the user can review it. Only after approval is granted should you delegate to code_execution_agent.",
        request,
      );
    }

    // Enforce retry limit: max 1 call per subagent_type per step (no retries)
    const callCount = taskCallCounts.get(subagentType) || 0;
    if (callCount >= 1) {
      logEveryWhere({
        message: `[TodoDispatcher] Retry limit hit — ${subagentType} already called once in current step`,
      });
      return blockError(
        `Error: ${subagentType} already failed for this step. Do not retry — report the failure to the user instead.`,
        request,
      );
    }

    // Block task call if no step is currently in_progress (retry after auto-advance)
    const hasActiveStep = lastKnownTodos.some(
      (item: any) => item.status === TodoItemStatus.IN_PROGRESS,
    );
    if (!hasActiveStep) {
      logEveryWhere({
        message: `[TodoDispatcher] Blocked "${subagentType}" — no step in_progress, retrying a completed step`,
      });
      return blockError(
        `Error: No step is currently in_progress. You cannot retry a completed step. Call write_todos to mark the next step as in_progress and proceed with your plan.`,
        request,
      );
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
      return blockError(
        `Error: Cannot delegate to ${subagentType} without user approval. ` +
          `You MUST follow the approval gate in order: ` +
          `(1) call request_approval now, ` +
          `(2) call confirm_approval with a markdown summary table, ` +
          `(3) only AFTER approval is granted, call task("${subagentType}").`,
        request,
      );
    }

    // Count this as an execution attempt only after all soft blocks pass
    taskCallCounts.set(subagentType, callCount + 1);

    const taskResult = await handler(request);
    const resultContent = extractResultContent(taskResult);
    const taskFailed =
      taskResult?.status === "error" ||
      resultContent.toLowerCase().startsWith("error:") ||
      resultContent.includes("blocked_planning_mode");

    if (taskFailed) {
      logEveryWhere({
        message: `[Step] Failed: "${subagentType}" — ${resultContent.slice(0, 200)}`,
      });
      // Mark the failed step and all remaining pending steps as rejected so the plan terminates cleanly
      lastKnownTodos = lastKnownTodos.map((item: any) => {
        if (
          item.status === TodoItemStatus.IN_PROGRESS ||
          (item.status !== TodoItemStatus.COMPLETED &&
            item.status !== "rejected")
        ) {
          return { ...item, status: "rejected" };
        }
        return item;
      });
      planLocked = false;
      toolContext.update({ currentStepType: null });
      taskCallCounts.clear();
      stallCountPerStep.clear();
      betweenStepsStallCount = 0;
      return taskResult;
    }

    // Auto-advance the in_progress step to completed on success
    const inProgressIndex = lastKnownTodos.findIndex(
      (item: any) => item.status === TodoItemStatus.IN_PROGRESS,
    );
    if (inProgressIndex !== -1) {
      if (resultContent) {
        const truncated =
          resultContent.length > 1200
            ? resultContent.slice(0, 1200) + "..."
            : resultContent;
        completedStepResults.push({
          stepName: lastKnownTodos[inProgressIndex].content,
          content: truncated,
        });
      }

      const { completedStep, allDone } =
        advanceStepToCompleted(inProgressIndex);

      const allDoneNote =
        completedStep.type === "visualize"
          ? `\n\n[Framework] Step "${completedStep.content}" has been automatically marked as completed. The chart is now displayed to the user. Your final response MUST be empty or at most one sentence — absolutely no tables, bullet points, or analysis. The chart speaks for itself.`
          : `\n\n[Framework] Step "${completedStep.content}" has been automatically marked as completed. All steps are complete — give your final response.`;
      const note = allDone
        ? allDoneNote
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
        stallCountPerStep.clear();
        betweenStepsStallCount = 0;
        toolContext.update({ currentStepType: null });
        logEveryWhere({
          message: `[TodoDispatcher] Plan rejected — marked step as rejected, released plan lock`,
        });
      }
    } catch (parseErr: any) {
      logEveryWhere({
        message: `[TodoDispatcher] confirm_approval response parse error — rejection may not have registered: ${parseErr?.message}`,
      });
    }
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
      return blockError(
        `Error: You must call write_todos to create your plan before calling "${toolName}". Create your full todo plan first, mark the first step as in_progress, then gather any needed data before requesting approval.`,
        request,
      );
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
      return blockError(
        `Error: You have a todo plan but no step is currently in_progress. ` +
          `Call write_todos to mark the next step as in_progress before calling "${toolName}".`,
        request,
      );
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

      logEveryWhere({
        message:
          `[TodoDispatcher] wrapModelCall — planLocked=${planLocked} todos=${lastKnownTodos.length} ` +
          `statuses=[${lastKnownTodos.map((t: any) => t.status).join(",")}]`,
      });

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
        updatedRequest = {
          ...updatedRequest,
          messages: [
            ...(updatedRequest.messages || []),
            new HumanMessage(
              buildInProgressReminder(
                inProgressTodos,
                toolContext.planState,
              ).trim(),
            ),
          ],
        };
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
        updatedRequest = {
          ...updatedRequest,
          messages: [
            ...(updatedRequest.messages || []),
            new HumanMessage(
              buildPendingReminder(lastKnownTodos, completedStepResults).trim(),
            ),
          ],
        };
      }

      return handler(updatedRequest);
    },

    // afterModel is declared as { canJumpTo, hook } instead of a plain function so that
    // the hook can return jumpTo: "model" to re-invoke the agent node. Plain functions
    // cannot use jumpTo — it requires canJumpTo to be declared so the framework allows
    // the jump target. Without this, the only escape from a bad model turn is END.
    afterModel: {
      canJumpTo: ["model"],
      hook: (state: any) => {
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

        const toolCallNames = (lastAiMsg.tool_calls || []).map(
          (tc: any) => tc.name,
        );
        const hasToolCalls = toolCallNames.length > 0;
        const textLen = getTextLen(lastAiMsg.content);

        logEveryWhere({
          message:
            `[TodoDispatcher] afterModel — toolCalls=[${toolCallNames.join(",") || "none"}] textLen=${textLen} ` +
            `planLocked=${planLocked} todos=${lastKnownTodos.length} ` +
            `statuses=[${lastKnownTodos.map((t: any) => t.status).join(",")}]`,
        });

        const hasPendingTodos = lastKnownTodos.some(
          (item: any) =>
            item.status !== TodoItemStatus.COMPLETED &&
            item.status !== "rejected",
        );

        if (hasToolCalls) {
          // Strip preamble text — reasoning noise that wastes tokens on subsequent turns
          if (lastAiMsg.content) {
            lastAiMsg.content = "";
          }

          // Any tool call counts as progress — reset stall counters
          const activeStep = lastKnownTodos.find(
            (item: any) => item.status === TodoItemStatus.IN_PROGRESS,
          );
          if (activeStep?.id) {
            stallCountPerStep.delete(activeStep.id);
          }
          betweenStepsStallCount = 0;

          const taskCalls = (lastAiMsg.tool_calls || []).filter(
            (tc: any) => tc.name === "task",
          );

          // Warn when write_todos was the only call and model also produced text —
          // indicates the model is trying to finalize without delegating execution
          const onlyWriteTodos =
            taskCalls.length === 0 &&
            toolCallNames.every((name: string) => name === "write_todos");
          if (onlyWriteTodos && hasPendingTodos && textLen > 0) {
            logEveryWhere({
              message:
                `[TodoDispatcher] afterModel — write_todos only with no task delegated, ` +
                `pending: [${lastKnownTodos.map((t: any) => `"${String(t.content).slice(0, 40)}"(${t.status})`).join(", ")}] ` +
                `planState=${toolContext.planState}`,
            });
          }

          // Block multiple task calls in the same turn
          if (taskCalls.length > 1) {
            return {
              messages: taskCalls.slice(1).map(
                (tc: any) =>
                  new ToolMessage({
                    content:
                      "Error: Only one subagent delegation per turn. Wait for the current task to complete, mark it done in write_todos, then start the next.",
                    tool_call_id: tc.id,
                    status: "error",
                  }),
              ),
            };
          }

          return;
        }

        // Find an in_progress step that is NOT a communicate step.
        // Communicate steps are excluded — the model is expected to produce text for
        // them, not call a tool, so stall detection does not apply.
        const stalledStep = lastKnownTodos.find(
          (item: any) =>
            item.status === TodoItemStatus.IN_PROGRESS &&
            item.type !== "communicate",
        );

        // Any output (text or empty) without a tool call while a non-communicate step
        // is in_progress means the agent stalled. Nudge based on approval state.
        // After MAX_STALLS_PER_STEP consecutive nudges with no progress, force-reject
        // the plan to prevent infinite loops hitting the recursion limit.
        if (stalledStep) {
          const stepId = stalledStep.id;
          const stallCount = (stallCountPerStep.get(stepId) || 0) + 1;
          stallCountPerStep.set(stepId, stallCount);

          if (stallCount > MAX_STALLS_PER_STEP) {
            logEveryWhere({
              message: `[TodoDispatcher] afterModel — stall limit reached (${stallCount}) on "${stalledStep.content}", force-rejecting plan`,
            });
            lastKnownTodos = lastKnownTodos.map((item: any) => {
              if (
                item.status === TodoItemStatus.IN_PROGRESS ||
                (item.status !== TodoItemStatus.COMPLETED &&
                  item.status !== "rejected")
              ) {
                return { ...item, status: "rejected" };
              }
              return item;
            });
            planLocked = false;
            stallCountPerStep.clear();
            toolContext.update({ currentStepType: null });
            return {
              messages: [
                new HumanMessage(
                  `The step "${stalledStep.content}" could not be completed after ${MAX_STALLS_PER_STEP} attempts. ` +
                    "Please report this failure to the user and stop — do not retry.",
                ),
              ],
              jumpTo: "model",
            };
          }

          logEveryWhere({
            message: `[TodoDispatcher] afterModel — stalled on "${stalledStep.content}" type="${stalledStep.type}" (planState=${toolContext.planState}), nudging (attempt ${stallCount}/${MAX_STALLS_PER_STEP})`,
          });
          return {
            messages: [
              new HumanMessage(
                buildStallNudge(stalledStep, toolContext.planState),
              ),
            ],
            jumpTo: "model",
          };
        }

        // Between-steps stall: model produced zero output but pending todos remain.
        // Covers two cases:
        //   (a) Transition gap — no step is in_progress, pending reminder was injected but model produced nothing.
        //   (b) Communicate step is in_progress but model produced no text instead of a response.
        if (textLen === 0 && hasPendingTodos) {
          betweenStepsStallCount += 1;

          if (betweenStepsStallCount > MAX_BETWEEN_STEPS_STALLS) {
            logEveryWhere({
              message: `[TodoDispatcher] afterModel — between-steps stall limit reached (${betweenStepsStallCount}), force-rejecting plan`,
            });
            lastKnownTodos = lastKnownTodos.map((item: any) => {
              if (
                item.status === TodoItemStatus.IN_PROGRESS ||
                (item.status !== TodoItemStatus.COMPLETED &&
                  item.status !== "rejected")
              ) {
                return { ...item, status: "rejected" };
              }
              return item;
            });
            planLocked = false;
            betweenStepsStallCount = 0;
            stallCountPerStep.clear();
            toolContext.update({ currentStepType: null });
            return {
              messages: [
                new HumanMessage(
                  "The plan could not advance after multiple attempts. " +
                    "Please report this failure to the user and stop — do not retry.",
                ),
              ],
              jumpTo: "model",
            };
          }

          const inProgressCommunicate = lastKnownTodos.find(
            (item: any) =>
              item.status === TodoItemStatus.IN_PROGRESS &&
              item.type === "communicate",
          );
          const nextPendingStep = lastKnownTodos.find(
            (item: any) =>
              item.status !== TodoItemStatus.COMPLETED &&
              item.status !== "rejected",
          );
          const nudgeMsg = inProgressCommunicate
            ? `CRITICAL: Step "${inProgressCommunicate.content}" is in_progress. ` +
              "Give your full text response now — the framework will mark it completed automatically. Do NOT call any tools."
            : `CRITICAL: You have pending todo steps but produced no output. ` +
              `Call write_todos to mark "${nextPendingStep?.content || "the next step"}" as in_progress, then proceed.`;
          logEveryWhere({
            message: `[TodoDispatcher] afterModel — between-steps stall (attempt ${betweenStepsStallCount}/${MAX_BETWEEN_STEPS_STALLS}, inProgressCommunicate=${!!inProgressCommunicate}), nudging`,
          });
          return {
            messages: [new HumanMessage(nudgeMsg)],
            jumpTo: "model",
          };
        }

        // No plan at all and zero output — model failed to call write_todos.
        // Happens when a short message ("yes", "ok") arrives after the model broke
        // the contract by asking for verbal confirmation before planning.
        if (textLen === 0 && lastKnownTodos.length === 0) {
          logEveryWhere({
            message: `[TodoDispatcher] afterModel — zero output with no plan, nudging model to call write_todos`,
          });
          return {
            messages: [
              new HumanMessage(
                "CRITICAL: You produced no output at all. " +
                  "If the user's message is an action request (swap, sell, buy, transfer), call write_todos immediately to plan your steps. " +
                  "If the user said 'yes' or 'ok', treat it as 'proceed with the action you just described' and call write_todos now.",
              ),
            ],
            jumpTo: "model",
          };
        }

        // Communicate auto-advance: when the model produces a text response and ALL
        // prior steps are explicitly completed or rejected, mark the communicate step
        // completed automatically. Requires strict completion — no orphaned exceptions.
        const communicateIndex = lastKnownTodos.findIndex(
          (item: any) =>
            item.type === "communicate" &&
            item.status !== TodoItemStatus.COMPLETED &&
            item.status !== "rejected",
        );
        if (communicateIndex !== -1) {
          const allPriorStepsDone = lastKnownTodos
            .slice(0, communicateIndex)
            .every(
              (item: any) =>
                item.status === TodoItemStatus.COMPLETED ||
                item.status === "rejected",
            );
          if (allPriorStepsDone) {
            lastKnownTodos = lastKnownTodos.map((item: any) => {
              if (
                item.status !== TodoItemStatus.COMPLETED &&
                item.status !== "rejected" &&
                item.type !== "communicate"
              ) {
                return { ...item, status: TodoItemStatus.COMPLETED };
              }
              return item;
            });
            advanceStepToCompleted(communicateIndex);
          }
        }
      },
    },
  });
};
