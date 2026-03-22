import { z } from "zod";
import { scheduleDB } from "@/electron/database/schedule";
import { safeStringify } from "@/electron/appAgent/utils";
import type { ISchedule } from "@/electron/type";

// Shared schema for tools that target an existing schedule by ID or name
export const scheduleTargetSchema = {
  scheduleId: z
    .number()
    .optional()
    .describe("ID of the schedule. Prefer this if already known."),
  name: z
    .string()
    .optional()
    .describe(
      "Name of the schedule. Used to look up the ID when it is not known.",
    ),
};

export const lookupSchedule = async (
  scheduleId?: number,
  name?: string,
): Promise<[ISchedule | null, Error | null]> => {
  if (!scheduleId && !name) {
    return [
      null,
      new Error("Provide scheduleId or name to identify the schedule."),
    ];
  }

  if (scheduleId) {
    const [schedule] = await scheduleDB.getOneSchedule(scheduleId);
    if (!schedule) {
      return [null, new Error(`Schedule with id ${scheduleId} not found.`)];
    }
    return [schedule, null];
  }

  const [res] = await scheduleDB.getListSchedule(1, 50, name);
  const match = res?.data.find(
    (s) => s.name?.toLowerCase() === name!.toLowerCase(),
  );
  if (!match) {
    return [null, new Error(`No schedule found with name "${name}".`)];
  }
  return [match, null];
};

export const scheduleNotFoundResponse = (err: Error): string =>
  safeStringify({ error: err.message });
