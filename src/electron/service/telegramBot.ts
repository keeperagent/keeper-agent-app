import { Telegraf } from "telegraf";
import { preferenceDB } from "@/electron/database/preference";
import { campaignDB } from "@/electron/database/campaign";
import { campaignProfileDB } from "@/electron/database/campaignProfile";
import { workflowDB } from "@/electron/database/workflow";
import { mainWindow } from "@/electron/main";
import { TELEGRAM_BOT } from "@/electron/constant";
import { IWorkflowVariable } from "@/electron/type";
import { logEveryWhere } from "./util";

/**
 * TelegramBotService — Remote campaign runner via Telegram bot.
 *
 * Commands:
 *   /connect  — Link the bot to a chat by saving the chat ID.
 *   /campaign — List all campaigns (paginated, 15 per page, with search).
 *   /run      — Start the guided workflow-run flow (see steps below).
 *   /stop     — Stop the currently running workflow.
 *
 * Campaign list & search:
 *   - Both /campaign and /run show paginated results (15 per page).
 *   - "Search campaign" button prompts the user to type a campaign name.
 *   - Prev/Next buttons navigate between pages.
 *
 * Run-workflow flow (4 steps):
 *
 *   Step 1 – Select workflow & choose path
 *     User picks a campaign → picks a workflow → sees options:
 *       • "Set variables" → go to Step 2a
 *       • "Skip variables" → go to Step 3
 *       • "Quick run"      → skip everything, go to Step 4 (confirm)
 *       • "Re-run"         → restore last run config, go to Step 4
 *
 *   Step 2 – Set workflow variables (optional)
 *     a) Set individually — pick a variable, type a value.
 *     b) Set all at once  — send `varName=value` lines in one message.
 *     c) Skip / Next step → go to Step 3.
 *
 *   Step 3 – Secret key (secret key, optional)
 *     User can enter a secret key or skip it → go to Step 4.
 *
 *   Step 4 – Confirm & run
 *     Shows a summary (campaign, workflow, variables, secret key).
 *     "Run now" sends the config to the renderer via IPC and saves
 *     it for future re-runs. "Cancel" aborts the flow.
 *
 * Status reporting:
 *   - After a workflow starts via Telegram, a periodic status report is sent
 *     every 15 seconds showing progress (completed/total profiles).
 *   - When the workflow completes, a final completion message is sent.
 *   - Status monitoring stops on workflow completion or /stop command.
 *
 * Session management:
 *   - Each chat gets one ITelegramRunSession stored in runSessionMap.
 *   - Sessions expire after 10 minutes (SESSION_TTL_MS).
 *   - Expired sessions are cleaned up every 5 minutes.
 *   - Last-run configs are kept in lastRunConfigMap for the "Re-run" shortcut.
 */

type IMarkUpInline = {
  text: string;
  callback_data: string;
};

type ITelegramRunSession = {
  workflowId: string;
  campaignId: string;
  variables: Record<string, string>;
  encryptKey?: string;
  // When set, the next text message will be treated as input for this field.
  // AWAITING_ENCRYPT_KEY means we're waiting for secret key input.
  awaitingInput?: string;
  createdAt: number;
};

const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes
const AWAITING_ENCRYPT_KEY = "__encrypt_key__";
const AWAITING_BATCH_VARIABLES = "__batch_variables__";
const CAMPAIGN_PAGE_SIZE = 15;

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
const STATUS_REPORT_INTERVAL_MS = 15 * 1000; // 15 seconds

// Store last run config per workflow+campaign for re-run
type ILastRunConfig = {
  variables: Record<string, string>;
  encryptKey?: string;
};

type ICampaignSearchContext = {
  searchText?: string;
  forAction: "run" | "list";
};

class TelegramBotService {
  private mapTelegramBot: Map<string, Telegraf>;
  private runSessionMap = new Map<number, ITelegramRunSession>();
  private lastRunConfigMap = new Map<string, ILastRunConfig>();
  private campaignSearchMap = new Map<number, ICampaignSearchContext>();
  private cleanupIntervalId: ReturnType<typeof setInterval> | null = null;
  private statusMonitorId: ReturnType<typeof setInterval> | null = null;
  private monitoringCampaignId: number | null = null;
  private monitoringWorkflowName: string | null = null;
  private monitoringCampaignName: string | null = null;

  constructor() {
    this.mapTelegramBot = new Map();
  }

  private getTelegramBot = async (
    botToken: string,
  ): Promise<[Telegraf | null, Error | null]> => {
    if (this.mapTelegramBot.has(botToken)) {
      return [this.mapTelegramBot.get(botToken)!, null];
    }

    return this.initTelegramBot(botToken);
  };

  initTelegramBot = async (
    botToken: string,
  ): Promise<[Telegraf | null, Error | null]> => {
    try {
      const currentBot = this.mapTelegramBot.get(botToken);
      if (currentBot) {
        currentBot.stop();
      }

      const newBot = new Telegraf(botToken);
      this.mapTelegramBot.set(botToken, newBot);
      return [newBot, null];
    } catch (err: any) {
      logEveryWhere({ message: `initTelegramBot() error: ${err?.message}` });
      return [null, err];
    }
  };

  sendMessage = async (
    botToken: string,
    message: string,
    chatId: string,
    imageGIF?: string,
  ): Promise<Error | null> => {
    try {
      if (!chatId) {
        return Error("missing chat id");
      }

      const [telegramBot, err] = await this.getTelegramBot(botToken);
      if (!telegramBot || err) {
        return err;
      }

      if (imageGIF) {
        await telegramBot.telegram.sendAnimation(chatId, imageGIF, {
          caption: message,
          parse_mode: "HTML",
        });
      } else {
        await telegramBot.telegram.sendMessage(chatId, message, {
          parse_mode: "HTML",
        });
      }

      return null;
    } catch (err: any) {
      return err;
    }
  };

  private replyMessage = (ctx: any, message: string, listAction?: any) => {
    ctx.reply(
      message,
      listAction && { reply_markup: { inline_keyboard: listAction } },
    );
  };

  private replyHTML = (ctx: any, message: string, markup?: any[][]) => {
    ctx.reply(message, {
      parse_mode: "HTML",
      ...(markup && { reply_markup: { inline_keyboard: markup } }),
    });
  };

  private toSingleLineButtons = (inputMarkup: IMarkUpInline[]) => {
    return inputMarkup.map((item) => [item]);
  };

  private parseIds = (callbackData: string) => {
    const parts = callbackData.split("_");
    return {
      workflowId: parts[parts.length - 2],
      campaignId: parts[parts.length - 1],
    };
  };

  private buildAction = (
    action: string,
    workflowId: string,
    campaignId: string,
  ) => {
    return `${action}${workflowId}_${campaignId}`;
  };

  private cancelButton = (workflowId: string, campaignId: string) => ({
    text: "❌ Cancel",
    callback_data: this.buildAction(
      TELEGRAM_BOT.ACTION_CANCEL_RUN,
      workflowId,
      campaignId,
    ),
  });

  private backButton = (
    action: string,
    workflowId: string,
    campaignId: string,
  ) => ({
    text: "⬅️ Back",
    callback_data: this.buildAction(action, workflowId, campaignId),
  });

  private getRegexAction = (action: string) => {
    return new RegExp(`^${action}\\d+$`);
  };

  private getSession = (chatId?: number) => {
    if (!chatId) {
      return undefined;
    }

    const session = this.runSessionMap.get(chatId);
    if (session && Date.now() - session.createdAt > SESSION_TTL_MS) {
      this.runSessionMap.delete(chatId);
      return undefined;
    }

    return session;
  };

  private cleanExpiredSessions = () => {
    const now = Date.now();
    for (const [chatId, session] of this.runSessionMap) {
      if (now - session.createdAt > SESSION_TTL_MS) {
        this.runSessionMap.delete(chatId);
      }
    }
  };

  startStatusMonitor = (
    campaignId: number,
    workflowName: string,
    campaignName: string,
  ) => {
    this.stopStatusMonitor();
    this.monitoringCampaignId = campaignId;
    this.monitoringWorkflowName = workflowName;
    this.monitoringCampaignName = campaignName;

    this.statusMonitorId = setInterval(async () => {
      if (!this.monitoringCampaignId) {
        return;
      }

      try {
        const [totalProfile, totalUnFinished, err] =
          await campaignProfileDB.getCampaignProfileStatus(
            this.monitoringCampaignId,
          );
        if (err) return;

        const completed = totalProfile - totalUnFinished;
        const progress =
          totalProfile > 0 ? Math.round((completed / totalProfile) * 100) : 0;

        const message =
          `📊 <b>Status Update</b>\n\n` +
          `<b>Campaign:</b> ${escapeHtml(this.monitoringCampaignName || "")}\n` +
          `<b>Workflow:</b> ${escapeHtml(this.monitoringWorkflowName || "")}\n` +
          `<b>Progress:</b> ${completed}/${totalProfile} profiles (${progress}%)`;

        const [preference] = await preferenceDB.getOnePreference();
        await this.sendMessage(
          preference?.botTokenTelegram || "",
          message,
          preference?.chatIdTelegram?.toString() || "",
        );
      } catch (error) {
        logEveryWhere({
          message: `Status monitor error: ${error}`,
        });
      }
    }, STATUS_REPORT_INTERVAL_MS);
  };

  isMonitoring = (campaignId?: number) => {
    if (campaignId !== undefined) {
      return (
        this.statusMonitorId !== null &&
        this.monitoringCampaignId === campaignId
      );
    }
    return this.statusMonitorId !== null;
  };

  stopStatusMonitor = () => {
    if (this.statusMonitorId) {
      clearInterval(this.statusMonitorId);
      this.statusMonitorId = null;
    }
    this.monitoringCampaignId = null;
    this.monitoringWorkflowName = null;
    this.monitoringCampaignName = null;
  };

  reportWorkflowCompleted = async (
    campaignId: number,
    workflowName: string,
    campaignName: string,
  ) => {
    this.stopStatusMonitor();

    try {
      const [totalProfile, , err] =
        await campaignProfileDB.getCampaignProfileStatus(campaignId);

      const message =
        `✅ <b>Workflow Completed</b>\n\n` +
        `<b>Campaign:</b> ${escapeHtml(campaignName)}\n` +
        `<b>Workflow:</b> ${escapeHtml(workflowName)}\n` +
        `<b>Total profiles:</b> ${err ? "N/A" : totalProfile}`;

      const [preference] = await preferenceDB.getOnePreference();
      await this.sendMessage(
        preference?.botTokenTelegram || "",
        message,
        preference?.chatIdTelegram?.toString() || "",
      );
    } catch (error) {
      logEveryWhere({
        message: `Report workflow completed error: ${error}`,
      });
    }
  };

  private getLastRunKey = (workflowId: string, campaignId: string) => {
    return `${workflowId}_${campaignId}`;
  };

  private getWorkflowVariables = async (workflowId: string) => {
    const [workflow, err] = await workflowDB.getOneWorkflow(Number(workflowId));
    if (err) {
      return {
        workflow: null,
        listVariable: [],
        err,
      };
    }
    return {
      workflow: workflow,
      listVariable: workflow?.listVariable || [],
      err: null,
    };
  };

  private showStep1 = async (
    ctx: any,
    workflowId: string,
    campaignId: string,
  ) => {
    const { listVariable, err: wfErr } =
      await this.getWorkflowVariables(workflowId);

    if (wfErr) {
      this.replyMessage(ctx, "Cannot load workflow. Error: " + wfErr);
      return;
    }

    const quickRunBtn = {
      text: "🚀 Quick run",
      callback_data: this.buildAction(
        TELEGRAM_BOT.ACTION_QUICK_RUN,
        workflowId,
        campaignId,
      ),
    };

    const lastRunConfig = this.lastRunConfigMap.get(
      this.getLastRunKey(workflowId, campaignId),
    );
    const rerunBtn = lastRunConfig
      ? {
          text: "🔄 Re-run last settings",
          callback_data: this.buildAction(
            TELEGRAM_BOT.ACTION_RERUN,
            workflowId,
            campaignId,
          ),
        }
      : null;
    const shortcutRow = rerunBtn ? [quickRunBtn, rerunBtn] : [quickRunBtn];

    if (listVariable.length > 0) {
      const varList = listVariable
        .map((v) => {
          const name = v.label || v.variable;
          return v.value ? `  • ${name} (default: ${v.value})` : `  • ${name}`;
        })
        .join("\n");

      let hint = `\n\n💡 <i>Quick run = skip variables & secret key, use defaults</i>`;
      if (lastRunConfig) {
        const lastVars = Object.entries(lastRunConfig.variables)
          .map(([key, value]) => `${key}=${value}`)
          .join(", ");
        hint += `\n🔄 <i>Re-run = use last settings${lastVars ? `: ${lastVars}` : ""}${lastRunConfig.encryptKey ? ", with secret key" : ""}</i>`;
      }

      ctx.reply(
        `This workflow has ${listVariable.length} variable(s):\n${varList}\n\nDo you want to set variables?` +
          hint,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "✏️ Set variables",
                  callback_data: this.buildAction(
                    TELEGRAM_BOT.ACTION_SET_VARIABLES,
                    workflowId,
                    campaignId,
                  ),
                },
                {
                  text: "⏭️ Skip variables",
                  callback_data: this.buildAction(
                    TELEGRAM_BOT.ACTION_SKIP_VARIABLES,
                    workflowId,
                    campaignId,
                  ),
                },
              ],
              shortcutRow,
              [this.cancelButton(workflowId, campaignId)],
            ],
          },
        },
      );
    } else {
      let hint = `\n\n💡 <i>Quick run = skip secret key, run immediately</i>`;
      if (lastRunConfig) {
        hint += `\n🔄 <i>Re-run = use last settings${lastRunConfig.encryptKey ? ", with secret key" : ""}</i>`;
      }

      ctx.reply(`Do you want to set an secret key?` + hint, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Enter secret key",
                callback_data: this.buildAction(
                  TELEGRAM_BOT.ACTION_ENTER_ENCRYPT_KEY + "_",
                  workflowId,
                  campaignId,
                ),
              },
              {
                text: "Skip secret key",
                callback_data: this.buildAction(
                  TELEGRAM_BOT.ACTION_SKIP_ENCRYPT_KEY + "_",
                  workflowId,
                  campaignId,
                ),
              },
            ],
            shortcutRow,
            [this.cancelButton(workflowId, campaignId)],
          ],
        },
      });
    }
  };

  private showVariableList = (
    ctx: any,
    listVariable: IWorkflowVariable[],
    session: ITelegramRunSession,
  ) => {
    const { workflowId, campaignId } = session;
    const buttons = listVariable.map((variable) => {
      const userVal = session.variables[variable.variable];
      const displayName = variable.label || variable.variable;
      let text = displayName;
      if (userVal) {
        text += ` = ${userVal}`;
      } else if (variable.value) {
        text += ` (default: ${variable.value})`;
      }

      return {
        text,
        callback_data: `${TELEGRAM_BOT.ACTION_SET_A_VARIABLE}${variable.variable}_${workflowId}_${campaignId}`,
      };
    });

    const markup = this.toSingleLineButtons(buttons);
    markup.push([
      {
        text: "📝 Set all at once",
        callback_data: this.buildAction(
          TELEGRAM_BOT.ACTION_SET_ALL_VARIABLES,
          workflowId,
          campaignId,
        ),
      },
    ]);

    markup.push([
      this.backButton(
        TELEGRAM_BOT.ACTION_BACK_TO_STEP1,
        workflowId,
        campaignId,
      ),
      {
        text: "▶️ Next step",
        callback_data: this.buildAction(
          TELEGRAM_BOT.ACTION_NEXT_STEP_VARIABLE,
          workflowId,
          campaignId,
        ),
      },
      this.cancelButton(workflowId, campaignId),
    ]);

    ctx.reply("Select a variable to set, or set all at once:", {
      reply_markup: { inline_keyboard: markup },
    });
  };

  private showEncryptKeyOptions = async (
    ctx: any,
    workflowId: string,
    campaignId: string,
  ) => {
    // Determine back target: variable list if workflow has variables, otherwise step1
    const { listVariable } = await this.getWorkflowVariables(workflowId);
    const backTarget =
      listVariable.length > 0
        ? TELEGRAM_BOT.ACTION_BACK_TO_VARLIST
        : TELEGRAM_BOT.ACTION_BACK_TO_STEP1;

    ctx.reply("Do you want to set an secret key?", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Enter secret key",
              callback_data: this.buildAction(
                TELEGRAM_BOT.ACTION_ENTER_ENCRYPT_KEY + "_",
                workflowId,
                campaignId,
              ),
            },
            {
              text: "Skip secret key",
              callback_data: this.buildAction(
                TELEGRAM_BOT.ACTION_SKIP_ENCRYPT_KEY + "_",
                workflowId,
                campaignId,
              ),
            },
          ],
          [
            this.backButton(backTarget, workflowId, campaignId),
            this.cancelButton(workflowId, campaignId),
          ],
        ],
      },
    });
  };

  private showConfirmation = async (ctx: any, chatId: number) => {
    const session = this.getSession(chatId);
    if (!session) {
      return;
    }

    const { workflowId, campaignId, variables, encryptKey } = session;
    const { workflow } = await this.getWorkflowVariables(workflowId);
    const [campaignFound] = await campaignDB.getOneCampaign(Number(campaignId));

    const campaignName = escapeHtml(campaignFound?.name || "Unknown");
    const workflowName = escapeHtml(workflow?.name || "Unknown");

    let msg = `<b>📋 Confirm Run</b>\n\n`;
    msg += `<b>Campaign:</b> ${campaignName}\n`;
    msg += `<b>Workflow:</b> ${workflowName}\n`;
    msg += `<b>Secret key:</b> ${encryptKey ? "Yes (set)" : "No"}\n`;

    const varEntries = Object.entries(variables);
    if (varEntries.length > 0) {
      msg += `\n<b>Variables:</b>\n`;
      varEntries.forEach(([name, val]) => {
        msg += `  • <b>${escapeHtml(name)}</b> = ${escapeHtml(val)}\n`;
      });
    }

    this.replyHTML(ctx, msg, [
      [
        {
          text: "🚀 Run now",
          callback_data: this.buildAction(
            TELEGRAM_BOT.ACTION_CONFIRM_RUN,
            workflowId,
            campaignId,
          ),
        },
      ],
      [
        this.backButton(
          TELEGRAM_BOT.ACTION_BACK_TO_ENCRYPT,
          workflowId,
          campaignId,
        ),
        this.cancelButton(workflowId, campaignId),
      ],
    ]);
  };

  private showCampaignList = async (
    ctx: any,
    page: number,
    forAction: "run" | "list",
    searchText?: string,
  ) => {
    try {
      const [res] = await campaignDB.getListCampaign(
        page,
        CAMPAIGN_PAGE_SIZE,
        searchText,
      );

      if (!res || res.data.length === 0) {
        const noResultMsg = searchText
          ? `No campaigns found for "${searchText}"`
          : "No campaign found";
        this.replyMessage(ctx, noResultMsg, [
          [
            {
              text: "🔍 Search again",
              callback_data: `${TELEGRAM_BOT.ACTION_SEARCH_CAMPAIGN}${forAction}`,
            },
            {
              text: "📋 Show all",
              callback_data: `campaign_page_${forAction}_1_`,
            },
          ],
        ]);
        return;
      }

      if (forAction === "run") {
        const buttons = res.data.map((item) => ({
          text: item?.name || "",
          callback_data:
            TELEGRAM_BOT.ACTION_RUN_A_CAMPAIGN + (item?.id?.toString() || ""),
        }));
        const markup = this.toSingleLineButtons(buttons);

        const navRow: IMarkUpInline[] = [];
        if (page > 1) {
          navRow.push({
            text: "⬅️ Prev",
            callback_data: `campaign_page_run_${page - 1}_${searchText || ""}`,
          });
        }
        if (page < res.totalPage) {
          navRow.push({
            text: "Next ➡️",
            callback_data: `campaign_page_run_${page + 1}_${searchText || ""}`,
          });
        }

        const searchRow: IMarkUpInline[] = [
          {
            text: "🔍 Search campaign",
            callback_data: `${TELEGRAM_BOT.ACTION_SEARCH_CAMPAIGN}run`,
          },
        ];

        if (navRow.length > 0) markup.push(navRow);
        markup.push(searchRow);

        const title = searchText
          ? `Search results for "${searchText}" (${res.totalData} found, page ${page}/${res.totalPage})`
          : `Select a campaign to run (page ${page}/${res.totalPage})`;
        this.replyMessage(ctx, title, markup);
      } else {
        const names = res.data.map(
          (item, i) =>
            `${(page - 1) * CAMPAIGN_PAGE_SIZE + i + 1}. <b>${escapeHtml(item.name || "")}</b>`,
        );

        const navRow: IMarkUpInline[] = [];
        if (page > 1) {
          navRow.push({
            text: "⬅️ Prev",
            callback_data: `campaign_page_list_${page - 1}_${searchText || ""}`,
          });
        }
        if (page < res.totalPage) {
          navRow.push({
            text: "Next ➡️",
            callback_data: `campaign_page_list_${page + 1}_${searchText || ""}`,
          });
        }

        const markup: IMarkUpInline[][] = [];
        if (navRow.length > 0) markup.push(navRow);
        markup.push([
          {
            text: "🔍 Search campaign",
            callback_data: `${TELEGRAM_BOT.ACTION_SEARCH_CAMPAIGN}list`,
          },
          {
            text: "Run a campaign 🚀",
            callback_data: TELEGRAM_BOT.ACTION_RUN_CAMPAIGN,
          },
        ]);

        const title = searchText
          ? `Search results for "${escapeHtml(searchText)}" (${res.totalData} found, page ${page}/${res.totalPage})`
          : `<i>List of campaign (page ${page}/${res.totalPage}):</i>`;
        this.replyHTML(ctx, `${title}\n${names.join("\n")}`, markup);
      }
    } catch (error: any) {
      this.replyMessage(
        ctx,
        `An error occurred while getting campaigns: ${error?.message}`,
      );
    }
  };

  private runCampaign = async (ctx: any) => {
    await ctx.deleteMessage();
    await this.showCampaignList(ctx, 1, "run");
  };

  private runACampaign = async (ctx: any) => {
    try {
      await ctx.deleteMessage();
      const campaignID = ctx.match[0].replace(
        TELEGRAM_BOT.ACTION_RUN_A_CAMPAIGN,
        "",
      );

      const [foundCampaign, err] = await campaignDB.getOneCampaign(
        Number(campaignID),
      );
      if (err) {
        this.replyMessage(ctx, "An error occurred while running the campaign");
        return;
      }

      const listWorkflow = foundCampaign?.listWorkflow || [];
      if (listWorkflow.length === 0) {
        this.replyMessage(ctx, "No workflow found for this campaign");
        return;
      }

      const buttons = listWorkflow.map((workflow) => ({
        text: workflow?.name || "",
        callback_data: `${TELEGRAM_BOT.ACTION_RUN_WORKFLOW}${workflow?.id}_${campaignID}`,
      }));

      this.replyMessage(
        ctx,
        "Select a workflow to run 🚀",
        this.toSingleLineButtons(buttons),
      );
    } catch {
      this.replyMessage(ctx, "An error occurred while running the campaign");
    }
  };

  start = async () => {
    try {
      const [preference] = await preferenceDB.getOnePreference();
      if (!preference?.isTelegramOn || !preference?.botTokenTelegram) {
        logEveryWhere({ message: "Telegram bot is not connected" });
        return;
      }

      const [telegramBot, err] = await this.initTelegramBot(
        preference.botTokenTelegram,
      );
      if (!telegramBot || err) {
        if (err)
          logEveryWhere({
            message: `startTelegramBot() error: ${err.message}`,
          });
        return;
      }

      logEveryWhere({ message: "Starting Telegram bot" });

      telegramBot.telegram.setMyCommands([
        {
          command: TELEGRAM_BOT.COMMAND_CONNECT_BOT,
          description: "Connect bot",
        },
        {
          command: TELEGRAM_BOT.COMMAND_GET_ALL_CAMPAIGN,
          description: "Get all campaign",
        },
        {
          command: TELEGRAM_BOT.COMMAND_RUN_CAMPAIGN,
          description: "Run a campaign",
        },
        {
          command: TELEGRAM_BOT.COMMAND_STOP_CAMPAIGN,
          description: "Stop running a campaign",
        },
      ]);

      telegramBot.command(TELEGRAM_BOT.COMMAND_CONNECT_BOT, async (ctx) => {
        const chatIdTelegram = ctx.chat.id;
        ctx.reply(`Chat ID: ${chatIdTelegram}`);
        const [pref] = await preferenceDB.getOnePreference();
        await preferenceDB.updatePreference({ chatIdTelegram, id: pref?.id });
        logEveryWhere({ message: `Chat ID saved, chat id: ${chatIdTelegram}` });
      });

      telegramBot.command(
        TELEGRAM_BOT.COMMAND_GET_ALL_CAMPAIGN,
        async (ctx) => {
          await this.showCampaignList(ctx, 1, "list");
        },
      );

      telegramBot.action(TELEGRAM_BOT.ACTION_RUN_CAMPAIGN, (ctx) =>
        this.runCampaign(ctx),
      );
      telegramBot.command(TELEGRAM_BOT.COMMAND_RUN_CAMPAIGN, (ctx) =>
        this.runCampaign(ctx),
      );
      telegramBot.action(
        this.getRegexAction(TELEGRAM_BOT.ACTION_RUN_A_CAMPAIGN),
        (ctx) => this.runACampaign(ctx),
      );

      // Search campaign: prompt user for search text
      telegramBot.action(/^search_campaign_(run|list)$/, async (ctx) => {
        await ctx.deleteMessage();
        const forAction = ctx.match[1] as "run" | "list";
        const chatId = ctx.chat?.id;
        if (!chatId) return;

        this.campaignSearchMap.set(chatId, { forAction });
        ctx.reply("Enter campaign name to search:");
      });

      // Campaign pagination
      telegramBot.action(
        /^campaign_page_(run|list)_(\d+)_(.*)$/,
        async (ctx) => {
          await ctx.deleteMessage();
          const forAction = ctx.match[1] as "run" | "list";
          const page = Number(ctx.match[2]);
          const searchText = ctx.match[3] || undefined;
          await this.showCampaignList(ctx, page, forAction, searchText);
        },
      );

      // Step 1: After selecting a workflow, check for variables
      telegramBot.action(/^run_workflow_[0-9_]+$/, async (ctx) => {
        await ctx.deleteMessage();
        const { workflowId, campaignId } = this.parseIds(ctx.match[0]);
        const chatId = ctx.chat?.id;
        if (!chatId) {
          return;
        }

        this.runSessionMap.set(chatId, {
          workflowId,
          campaignId,
          variables: {},
          createdAt: Date.now(),
        });

        await this.showStep1(ctx, workflowId, campaignId);
      });

      // Quick run: skip variables & secret key, go straight to confirmation
      telegramBot.action(/^quick_run_[\d_]+$/, async (ctx) => {
        await ctx.deleteMessage();
        const chatId = ctx.chat?.id;
        if (!chatId) {
          return;
        }

        const session = this.getSession(chatId);
        if (!session) {
          return;
        }

        await this.showConfirmation(ctx, chatId);
      });

      // Re-run with last settings: restore saved config and go to confirmation
      telegramBot.action(/^rerun_[\d_]+$/, async (ctx) => {
        await ctx.deleteMessage();
        const { workflowId, campaignId } = this.parseIds(ctx.match[0]);
        const chatId = ctx.chat?.id;
        if (!chatId) {
          return;
        }

        const lastConfig = this.lastRunConfigMap.get(
          this.getLastRunKey(workflowId, campaignId),
        );
        if (!lastConfig) {
          this.replyMessage(
            ctx,
            "No previous run found. Please configure manually.",
          );
          return;
        }

        // Create session with last run settings
        this.runSessionMap.set(chatId, {
          workflowId,
          campaignId,
          variables: { ...lastConfig.variables },
          encryptKey: lastConfig.encryptKey,
          createdAt: Date.now(),
        });

        await this.showConfirmation(ctx, chatId);
      });

      // Step 2a: User wants to set variables
      telegramBot.action(/^set_variables_[\d_]+$/, async (ctx) => {
        await ctx.deleteMessage();
        const { workflowId } = this.parseIds(ctx.match[0]);
        const session = this.getSession(ctx.chat?.id);
        if (!session) {
          return;
        }

        const { listVariable } = await this.getWorkflowVariables(workflowId);
        this.showVariableList(ctx, listVariable, session);
      });

      // Step 2b: User skips variables
      telegramBot.action(/^skip_variables_[\d_]+$/, async (ctx) => {
        await ctx.deleteMessage();
        const { workflowId, campaignId } = this.parseIds(ctx.match[0]);
        this.showEncryptKeyOptions(ctx, workflowId, campaignId);
      });

      // Step 2c: User wants to set all variables at once
      telegramBot.action(/^set_all_var_[\d_]+$/, async (ctx) => {
        await ctx.deleteMessage();
        const { workflowId } = this.parseIds(ctx.match[0]);
        const session = this.getSession(ctx.chat?.id);
        if (!session) {
          return;
        }

        const { listVariable } = await this.getWorkflowVariables(workflowId);
        const example = listVariable
          .map(
            (variable) =>
              `${variable.variable}=${variable.value || "your_value"}`,
          )
          .join("\n");

        session.awaitingInput = AWAITING_BATCH_VARIABLES;
        this.replyHTML(
          ctx,
          `Enter all variables, one per line:\n<code>${example}</code>`,
          [
            [
              this.backButton(
                TELEGRAM_BOT.ACTION_BACK_TO_VARLIST,
                session.workflowId,
                session.campaignId,
              ),
              this.cancelButton(session.workflowId, session.campaignId),
            ],
          ],
        );
      });

      // Step 2d: User selects a specific variable to set
      telegramBot.action(/^set_a_var_.+_\d+_\d+$/, async (ctx) => {
        await ctx.deleteMessage();
        const withoutPrefix = ctx.match[0].replace(
          TELEGRAM_BOT.ACTION_SET_A_VARIABLE,
          "",
        );
        const variableName = withoutPrefix.split("_").slice(0, -2).join("_");

        const session = this.getSession(ctx.chat?.id);
        if (!session) {
          return;
        }

        session.awaitingInput = variableName;
        this.replyHTML(
          ctx,
          `Enter value for variable "<b>${variableName}</b>":`,
          [
            [
              this.backButton(
                TELEGRAM_BOT.ACTION_BACK_TO_VARLIST,
                session.workflowId,
                session.campaignId,
              ),
              this.cancelButton(session.workflowId, session.campaignId),
            ],
          ],
        );
      });

      // Step 2d: "Next step" -> secret key
      telegramBot.action(/^next_step_var_[\d_]+$/, async (ctx) => {
        await ctx.deleteMessage();
        const { workflowId, campaignId } = this.parseIds(ctx.match[0]);
        const session = this.getSession(ctx.chat?.id);
        if (session) session.awaitingInput = undefined;

        this.showEncryptKeyOptions(ctx, workflowId, campaignId);
      });

      // Step 3: Enter or skip secret key
      telegramBot.action(
        [
          /^enter_encrypt_key_campaign[\d_]+/,
          /^skip_encrypt_key_campaign[\d_]+/,
        ],
        async (ctx) => {
          await ctx.deleteMessage();
          const callbackData = ctx.match[0];
          const chatId = ctx.chat?.id;
          if (!chatId) {
            return;
          }

          const { workflowId, campaignId } = this.parseIds(callbackData);

          if (!this.getSession(chatId)) {
            this.runSessionMap.set(chatId, {
              workflowId,
              campaignId,
              variables: {},
              createdAt: Date.now(),
            });
          }

          if (callbackData.startsWith(TELEGRAM_BOT.ACTION_ENTER_ENCRYPT_KEY)) {
            this.runSessionMap.get(chatId)!.awaitingInput =
              AWAITING_ENCRYPT_KEY;
            ctx.reply("Enter your secret key:", {
              reply_markup: {
                inline_keyboard: [
                  [
                    this.backButton(
                      TELEGRAM_BOT.ACTION_BACK_TO_ENCRYPT,
                      workflowId,
                      campaignId,
                    ),
                    this.cancelButton(workflowId, campaignId),
                  ],
                ],
              },
            });
          } else {
            await this.showConfirmation(ctx, chatId);
          }
        },
      );

      // Step 4a: Confirm and run
      telegramBot.action(/^confirm_run_[\d_]+$/, async (ctx) => {
        await ctx.deleteMessage();
        const chatId = ctx.chat?.id;
        if (!chatId) {
          return;
        }

        const session = this.getSession(chatId);
        if (!session) {
          this.replyMessage(ctx, "Session expired. Please start again.");
          return;
        }

        const { workflowId, campaignId, encryptKey, variables } = session;

        const [workflow, errWf] = await workflowDB.getOneWorkflow(
          Number(workflowId),
        );
        const [campaignFound, errCamp] = await campaignDB.getOneCampaign(
          Number(campaignId),
        );

        if (errWf || errCamp) {
          this.replyMessage(
            ctx,
            "Cannot run this workflow. Error: " +
              (errWf?.message || errCamp?.message),
          );
          this.runSessionMap.delete(chatId);
          return;
        }

        // Apply variable values to workflow
        if (workflow?.listVariable) {
          workflow.listVariable = workflow.listVariable.map((variable) =>
            variables[variable.variable] !== undefined
              ? { ...variable, value: variables[variable.variable] }
              : variable,
          );
        }

        this.replyHTML(
          ctx,
          `Workflow "<b>${escapeHtml(workflow?.name || "")}</b>" from campaign "<b>${escapeHtml(campaignFound?.name || "")}</b>" started successfully ⚡️`,
        );

        mainWindow?.webContents.send(
          TELEGRAM_BOT.ACTION_RUN_WORKFLOW_USING_TELEGRAM,
          {
            workflow,
            campaignId,
            encryptKey,
            overrideListVariable: workflow?.listVariable,
          },
        );

        // Start periodic status reporting
        this.startStatusMonitor(
          Number(campaignId),
          workflow?.name || "Unknown",
          campaignFound?.name || "Unknown",
        );

        // Save last run config for re-run
        this.lastRunConfigMap.set(this.getLastRunKey(workflowId, campaignId), {
          variables: { ...variables },
          encryptKey,
        });

        this.runSessionMap.delete(chatId);
      });

      // Step 4b: Cancel
      telegramBot.action(/^cancel_run_[\d_]+$/, async (ctx) => {
        await ctx.deleteMessage();
        if (ctx.chat?.id) this.runSessionMap.delete(ctx.chat.id);
        this.replyMessage(ctx, "Run cancelled.");
      });

      // Back to step 1: re-show the variable/secret key initial choice
      telegramBot.action(/^back_step1_[\d_]+$/, async (ctx) => {
        await ctx.deleteMessage();
        const { workflowId, campaignId } = this.parseIds(ctx.match[0]);
        const session = this.getSession(ctx.chat?.id);
        if (session) session.awaitingInput = undefined;

        await this.showStep1(ctx, workflowId, campaignId);
      });

      // Back to variable list
      telegramBot.action(/^back_varlist_[\d_]+$/, async (ctx) => {
        await ctx.deleteMessage();
        const { workflowId } = this.parseIds(ctx.match[0]);
        const chatId = ctx.chat?.id;
        if (!chatId) {
          return;
        }

        const session = this.getSession(chatId);
        if (!session) {
          return;
        }

        session.awaitingInput = undefined;

        const { listVariable } = await this.getWorkflowVariables(workflowId);
        this.showVariableList(ctx, listVariable, session);
      });

      // Back to secret key options
      telegramBot.action(/^back_encrypt_[\d_]+$/, async (ctx) => {
        await ctx.deleteMessage();
        const { workflowId, campaignId } = this.parseIds(ctx.match[0]);
        const session = this.getSession(ctx.chat?.id);
        if (session) {
          session.awaitingInput = undefined;
        }

        await this.showEncryptKeyOptions(ctx, workflowId, campaignId);
      });

      // Text input handler for variable values, secret key, and campaign search
      telegramBot.on("text", async (ctx) => {
        const chatId = ctx.chat?.id;
        if (!chatId) {
          return;
        }

        const inputText = ctx.message.text;

        // Handle campaign search input
        const searchContext = this.campaignSearchMap.get(chatId);
        if (searchContext) {
          this.campaignSearchMap.delete(chatId);
          try {
            await ctx.deleteMessage();
          } catch {}
          await this.showCampaignList(
            ctx,
            1,
            searchContext.forAction,
            inputText,
          );
          return;
        }

        const session = this.getSession(chatId);
        if (!session?.awaitingInput) {
          return;
        }
        try {
          await ctx.deleteMessage();
        } catch {}

        if (session.awaitingInput === AWAITING_ENCRYPT_KEY) {
          session.encryptKey = inputText;
          session.awaitingInput = undefined;
          await this.showConfirmation(ctx, chatId);
        } else if (session.awaitingInput === AWAITING_BATCH_VARIABLES) {
          // Parse batch input: each line is varName=value
          const lines = inputText
            .split("\n")
            .filter((line) => line.includes("="));
          const setVars: string[] = [];

          for (const line of lines) {
            const eqIndex = line.indexOf("=");
            const varName = line.slice(0, eqIndex).trim();
            const varValue = line.slice(eqIndex + 1).trim();
            if (varName) {
              session.variables[varName] = varValue;
              setVars.push(`<b>${varName}</b> = ${varValue}`);
            }
          }
          session.awaitingInput = undefined;

          if (setVars.length > 0) {
            this.replyHTML(ctx, `✅ Variables set:\n${setVars.join("\n")}`);
          } else {
            this.replyHTML(
              ctx,
              `⚠️ No valid variables found. Use format: <code>varName=value</code>`,
            );
          }

          const { listVariable } = await this.getWorkflowVariables(
            session.workflowId,
          );
          this.showVariableList(ctx, listVariable, session);
        } else {
          const variableName = session.awaitingInput;
          session.variables[variableName] = inputText;
          session.awaitingInput = undefined;

          this.replyHTML(
            ctx,
            `✅ Variable "<b>${variableName}</b>" set to "<b>${inputText}</b>"`,
          );

          const { listVariable } = await this.getWorkflowVariables(
            session.workflowId,
          );
          this.showVariableList(ctx, listVariable, session);
        }
      });

      // Stop command
      telegramBot.command(TELEGRAM_BOT.COMMAND_STOP_CAMPAIGN, async (ctx) => {
        this.stopStatusMonitor();
        mainWindow?.webContents.send(
          TELEGRAM_BOT.ACTION_STOP_CAMPAIGN_USING_TELEGRAM,
        );
        this.replyMessage(ctx, "Stopped running workflow");
      });

      // Periodically clean expired sessions every 5 minutes
      if (this.cleanupIntervalId) {
        clearInterval(this.cleanupIntervalId);
      }
      this.cleanupIntervalId = setInterval(
        this.cleanExpiredSessions,
        5 * 60 * 1000,
      );

      telegramBot
        .launch()
        .then(() => logEveryWhere({ message: "Telegram bot is polling" }))
        .catch((err: any) =>
          logEveryWhere({
            message: `Telegram bot launch error: ${err?.message}`,
          }),
        );
    } catch (err: any) {
      logEveryWhere({ message: `startTelegramBot() error: ${err?.message}` });
    }
  };
}

export const telegramBotService = new TelegramBotService();
