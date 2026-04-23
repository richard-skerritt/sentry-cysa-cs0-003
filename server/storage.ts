import { attempts } from '@shared/schema';
import type { Attempt, InsertAttempt } from '@shared/schema';
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, desc } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

// Bootstrap schema (Drizzle migrations not used in template — simple CREATE TABLE)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    completed_at INTEGER,
    question_ids TEXT NOT NULL,
    answers TEXT NOT NULL,
    flags TEXT NOT NULL DEFAULT '[]',
    confidence TEXT NOT NULL DEFAULT '{}',
    score INTEGER,
    duration_sec INTEGER
  );
`);

export const db = drizzle(sqlite);

export interface IStorage {
  createAttempt(attempt: InsertAttempt): Promise<Attempt>;
  getAttempt(id: number): Promise<Attempt | undefined>;
  updateAttempt(id: number, patch: Partial<InsertAttempt>): Promise<Attempt | undefined>;
  listAttempts(): Promise<Attempt[]>;
}

export class DatabaseStorage implements IStorage {
  async createAttempt(attempt: InsertAttempt): Promise<Attempt> {
    return db.insert(attempts).values(attempt).returning().get();
  }
  async getAttempt(id: number): Promise<Attempt | undefined> {
    return db.select().from(attempts).where(eq(attempts.id, id)).get();
  }
  async updateAttempt(id: number, patch: Partial<InsertAttempt>): Promise<Attempt | undefined> {
    return db.update(attempts).set(patch).where(eq(attempts.id, id)).returning().get();
  }
  async listAttempts(): Promise<Attempt[]> {
    return db.select().from(attempts).orderBy(desc(attempts.startedAt)).all();
  }
}

export const storage = new DatabaseStorage();
