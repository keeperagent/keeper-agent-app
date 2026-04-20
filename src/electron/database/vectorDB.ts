import { open, type Database } from "sqlite";
import sqlite3 from "@vscode/sqlite3";
import * as sqliteVec from "sqlite-vec";
import { logEveryWhere } from "@/electron/service/util";
import { getVecDbPath } from "./common";

export const CURRENT_TOOL_SCHEMA_VERSION = 1;
export const EMBEDDING_DIMS = 384; // all-MiniLM-L6-v2

let vecDB: Database | null = null;
export const getVecDB = async (): Promise<Database> => {
  if (vecDB) {
    return vecDB;
  }

  const db = await open({
    filename: getVecDbPath(),
    driver: sqlite3.Database,
  });

  try {
    sqliteVec.load((db as any).db);
    logEveryWhere({ message: "[VectorDB] sqlite-vec loaded" });
  } catch (err: any) {
    logEveryWhere({
      message: `[VectorDB] sqlite-vec load error: ${err?.message}`,
    });
    throw err;
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS agent_experiences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      runId TEXT NOT NULL,
      intent TEXT NOT NULL,
      todoTemplate TEXT NOT NULL,
      toolCallSequence TEXT NOT NULL,
      successCount INTEGER NOT NULL DEFAULT 1,
      failureCount INTEGER NOT NULL DEFAULT 0,
      failureNotes TEXT,
      schemaVersion INTEGER NOT NULL DEFAULT ${CURRENT_TOOL_SCHEMA_VERSION},
      lastUsed INTEGER NOT NULL,
      createdAt INTEGER NOT NULL
    )
  `);

  await db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS agent_experiences_vec USING vec0(
      intentVector FLOAT[${EMBEDDING_DIMS}]
    )
  `);

  vecDB = db;
  return db;
};

export const vectorToBuffer = (vector: number[]): Buffer => {
  const float32 = new Float32Array(vector);
  return Buffer.from(float32.buffer);
};

export type AgentExperience = {
  id: number;
  runId: string;
  intent: string;
  todoTemplate: string;
  toolCallSequence: string;
  successCount: number;
  failureCount: number;
  failureNotes: string | null;
  schemaVersion: number;
  lastUsed: number;
  createdAt: number;
};
