import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/* ===== Attempts — one row per completed or in-progress exam ===== */
export const attempts = sqliteTable("attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  examId: text("exam_id").notNull(),             // "exam-1" | "exam-2" | "exam-3"
  startedAt: integer("started_at").notNull(),    // epoch ms
  completedAt: integer("completed_at"),          // null = in progress
  // Serialized JSON blobs (SQLite has no array / json column)
  questionIds: text("question_ids").notNull(),   // JSON string[]
  answers: text("answers").notNull(),            // JSON { [qid]: string[] }
  flags: text("flags").notNull().default("[]"),  // JSON string[] of qids
  confidence: text("confidence").notNull().default("{}"), // JSON { qid: "know"|"unsure"|"guess" }
  score: integer("score"),                       // percent 0-100 (null until completed)
  durationSec: integer("duration_sec"),
});

export const insertAttemptSchema = createInsertSchema(attempts).omit({ id: true });
export type InsertAttempt = z.infer<typeof insertAttemptSchema>;
export type Attempt = typeof attempts.$inferSelect;
