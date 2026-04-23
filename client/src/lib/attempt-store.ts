/* A tiny in-memory store for the current exam attempt.
   Persistence is handled via API calls (POST/PATCH /api/attempts).
   We keep state in React Query cache; this store exposes helpers only. */

import type { Attempt } from "@shared/schema";

export interface AttemptState extends Omit<Attempt, "questionIds" | "answers" | "flags" | "confidence"> {
  questionIds: string[];
  answers: Record<string, string[]>;
  flags: string[];
  confidence: Record<string, "know" | "unsure" | "guess">;
}

export function parseAttempt(raw: Attempt): AttemptState {
  return {
    ...raw,
    questionIds: JSON.parse(raw.questionIds),
    answers: JSON.parse(raw.answers),
    flags: JSON.parse(raw.flags),
    confidence: JSON.parse(raw.confidence),
  };
}

export function serializeAttempt(s: Partial<AttemptState>): Partial<Attempt> {
  const out: any = { ...s };
  if (s.questionIds) out.questionIds = JSON.stringify(s.questionIds);
  if (s.answers) out.answers = JSON.stringify(s.answers);
  if (s.flags) out.flags = JSON.stringify(s.flags);
  if (s.confidence) out.confidence = JSON.stringify(s.confidence);
  return out;
}
