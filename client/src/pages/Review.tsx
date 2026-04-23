import { useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChoiceRow } from "@/components/ChoiceRow";
import { OrderingList } from "@/components/OrderingList";
import { ArtifactView } from "@/components/ArtifactView";
import { StemText } from "@/components/Qualifier";
import { cn } from "@/lib/utils";
import { DOMAIN_META, type Domain, type MCQ, type PBQ, type PBQTask, type Choice } from "@/lib/types";
import { ITEM_BY_ID } from "@/data/bank";
import { scoreExam, scoreMCQ, scorePBQ, isCorrect } from "@/lib/exam-logic";
import { parseAttempt } from "@/lib/attempt-store";
import type { Attempt } from "@shared/schema";
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle2,
  XCircle,
  Lightbulb,
  BarChart3,
  AlertCircle,
  Loader2,
  BookOpen,
} from "lucide-react";

const TRAP_LABELS: Record<string, string> = {
  "right-action-wrong-phase": "Right action, wrong phase",
  "right-tool-wrong-purpose": "Right tool, wrong purpose",
  "valid-but-not-best": "Valid, but not the BEST answer",
  "scope-mismatch": "Scope mismatch",
  "policy-vs-ops": "Policy answer, operational question",
  correct: "Correct answer",
};

export default function Review() {
  const params = useParams<{ attemptId: string }>();
  const [, navigate] = useLocation();
  const [idx, setIdx] = useState(0);

  const { data, isLoading, error } = useQuery<Attempt>({
    queryKey: ["/api/attempts", params.attemptId],
  });

  const attempt = useMemo(() => (data ? parseAttempt(data) : null), [data]);

  if (isLoading) {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto py-20 px-5 text-center">
          <Loader2 className="w-8 h-8 mx-auto text-muted-foreground animate-spin mb-3" />
          <p className="text-sm text-muted-foreground font-mono">Loading attempt...</p>
        </div>
      </AppShell>
    );
  }
  if (error || !attempt) {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto py-20 px-5 text-center">
          <AlertCircle className="w-8 h-8 mx-auto text-destructive mb-4" />
          <h1 className="text-xl font-bold mb-2">Attempt not found</h1>
          <Button onClick={() => navigate("/")} data-testid="button-back-home">Back to home</Button>
        </div>
      </AppShell>
    );
  }

  const { questionIds, answers, flags } = attempt;
  const currentId = questionIds[idx];
  const current = ITEM_BY_ID[currentId];

  const itemOutcomes = questionIds.map((id) => {
    const item = ITEM_BY_ID[id];
    if (!item) return "empty";
    if (item.kind === "mcq") {
      return scoreMCQ(item, answers[id]) === 1 ? "correct" : "incorrect";
    }
    const s = scorePBQ(item, answers);
    return s === 1 ? "correct" : s > 0 ? "partial" : "incorrect";
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-5 py-6">
        {/* header bar */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-mono uppercase tracking-wider text-[10px]">
              Review mode
            </Badge>
            <span className="text-sm text-muted-foreground font-mono">
              Q {idx + 1} / {questionIds.length}
            </span>
            {flags.includes(currentId) && (
              <Badge className="bg-warning text-warning-foreground gap-1 font-mono text-[10px]">
                <Flag className="w-3 h-3" />
                Flagged
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/results/${params.attemptId}`)}
              data-testid="button-view-results"
              className="gap-1.5"
            >
              <BarChart3 className="w-4 h-4" />
              View results
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_240px] gap-5">
          <div className="min-w-0">
            {current?.kind === "mcq" ? (
              <MCQReview mcq={current} selected={answers[currentId] ?? []} />
            ) : current?.kind === "pbq" ? (
              <PBQReview pbq={current} answers={answers} />
            ) : null}

            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setIdx((i) => Math.max(0, i - 1))}
                disabled={idx === 0}
                data-testid="button-prev"
                className="gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  if (idx === questionIds.length - 1) {
                    navigate(`/results/${params.attemptId}`);
                  } else {
                    setIdx((i) => i + 1);
                  }
                }}
                data-testid="button-next"
                className="gap-1.5"
              >
                {idx === questionIds.length - 1 ? "Finish" : "Next"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* navigator */}
          <aside className="order-first lg:order-last">
            <Card className="p-3 sticky top-20">
              <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2 px-1">
                Questions
              </div>
              <div className="grid grid-cols-6 lg:grid-cols-5 gap-1.5">
                {questionIds.map((qid, i) => {
                  const o = itemOutcomes[i];
                  const active = i === idx;
                  return (
                    <button
                      key={qid}
                      onClick={() => setIdx(i)}
                      data-testid={`nav-item-${i + 1}`}
                      className={cn(
                        "relative h-8 text-xs font-mono tabular-nums rounded border transition-colors hover-elevate",
                        active
                          ? "border-primary bg-primary text-primary-foreground font-bold"
                          : o === "correct"
                            ? "border-success/40 bg-success/10 text-foreground"
                            : o === "incorrect"
                              ? "border-destructive/40 bg-destructive/10 text-foreground"
                              : o === "partial"
                                ? "border-warning/40 bg-warning/10 text-foreground"
                                : "border-border",
                      )}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-border flex flex-col gap-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm border border-success/40 bg-success/10" /> Correct
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm border border-warning/40 bg-warning/10" /> Partial (PBQ)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm border border-destructive/40 bg-destructive/10" /> Incorrect
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

/* ============================================================
   MCQ review — show correctness + rationale + key phrase + distractor trap notes
   ============================================================ */
function MCQReview({ mcq, selected }: { mcq: MCQ; selected: string[] }) {
  const isMulti = mcq.correct.length > 1;
  const correctIds = new Set(mcq.correct);
  const wasCorrect = isCorrect(mcq.correct, selected);
  const pickedDistractors = selected
    .filter((id) => !correctIds.has(id))
    .map((id) => mcq.choices.find((c) => c.id === id))
    .filter(Boolean) as Choice[];

  return (
    <Card className="p-5 md:p-6 flex flex-col gap-5">
      <ReviewHeader
        id={mcq.id}
        kind="MCQ"
        domain={mcq.domain}
        objective={mcq.objective}
        difficulty={mcq.difficulty}
        verdict={wasCorrect ? "correct" : "incorrect"}
      />
      <StemText>{mcq.stem}</StemText>
      {mcq.artifact && <ArtifactView artifact={mcq.artifact} />}

      <div className="flex flex-col gap-2">
        {mcq.choices.map((c) => {
          const isSel = selected.includes(c.id);
          const isCorr = correctIds.has(c.id);
          return (
            <ChoiceRow
              key={c.id}
              id={c.id}
              label={c.text}
              selected={isSel}
              multi={isMulti}
              onToggle={() => {}}
              review
              correct={isCorr}
              disabled
              testId={`review-choice-${mcq.id}-${c.id}`}
            />
          );
        })}
      </div>

      <Coaching
        keyPhrase={mcq.keyPhrase}
        explanation={mcq.explanation}
        qualifier={mcq.qualifier}
        notes={mcq.notes}
        distractors={pickedDistractors}
      />
    </Card>
  );
}

/* ============================================================
   PBQ review — walk through each task with its own outcome
   ============================================================ */
function PBQReview({ pbq, answers }: { pbq: PBQ; answers: Record<string, string[]> }) {
  const overall = scorePBQ(pbq, answers);
  return (
    <Card className="p-5 md:p-6 flex flex-col gap-5">
      <ReviewHeader
        id={pbq.id}
        kind="PBQ"
        domain={pbq.domain}
        objective={pbq.objective}
        difficulty={pbq.difficulty}
        verdict={overall === 1 ? "correct" : overall > 0 ? "partial" : "incorrect"}
      />
      <div>
        <h2 className="text-base font-bold mb-1.5">{pbq.title}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{pbq.scenario}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-3 md:sticky md:top-20 md:self-start md:max-h-[calc(100vh-6rem)] md:overflow-y-auto md:pr-1">
          {pbq.artifacts.map((a, i) => (
            <ArtifactView key={i} artifact={a} />
          ))}
        </div>
        <div className="flex flex-col gap-5">
          {pbq.tasks.map((task, i) => (
            <PBQTaskReview
              key={task.id}
              task={task}
              index={i + 1}
              selected={answers[task.id] ?? []}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-primary" />
          Overall coaching
        </div>
        <p className="text-sm leading-relaxed text-foreground/90">{pbq.explanation}</p>
        {pbq.notes && pbq.notes.length > 0 && <NotesLinks notes={pbq.notes} />}
      </div>
    </Card>
  );
}

function PBQTaskReview({
  task,
  index,
  selected,
}: {
  task: PBQTask;
  index: number;
  selected: string[];
}) {
  const correctIds = new Set(task.correct);
  const wasCorrect = isCorrect(task.correct, selected, task.mode === "order");
  const pickedDistractors = task.choices.filter(
    (c) => selected.includes(c.id) && !correctIds.has(c.id),
  );

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-5 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono uppercase tracking-wider text-primary">
          Task {index}
        </span>
        <Verdict verdict={wasCorrect ? "correct" : "incorrect"} />
      </div>
      <StemText>{task.prompt}</StemText>

      {task.mode === "order" ? (
        <>
          <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Your order</div>
          <OrderingList
            ids={selected.length > 0 ? selected : task.choices.map((c) => c.id)}
            choices={task.choices}
            onChange={() => {}}
            review
            correctOrder={task.correct}
          />
          {!wasCorrect && (
            <>
              <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-2">
                Correct order
              </div>
              <ol className="flex flex-col gap-1.5">
                {task.correct.map((id, i) => {
                  const c = task.choices.find((x) => x.id === id);
                  return (
                    <li
                      key={id}
                      className="flex items-start gap-3 text-sm px-3 py-2 rounded-md border border-success/40 bg-success/10"
                    >
                      <span className="tabular-nums font-mono text-xs text-muted-foreground mt-0.5 w-4">
                        {i + 1}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground mt-0.5 uppercase w-4">
                        {id}
                      </span>
                      <span className="flex-1 leading-snug">{c?.text}</span>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-2">
          {task.choices.map((c) => {
            const isSel = selected.includes(c.id);
            const isCorr = correctIds.has(c.id);
            return (
              <ChoiceRow
                key={c.id}
                id={c.id}
                label={c.text}
                selected={isSel}
                multi={task.mode === "multi"}
                onToggle={() => {}}
                review
                correct={isCorr}
                disabled
                testId={`review-choice-${task.id}-${c.id}`}
              />
            );
          })}
        </div>
      )}

      <Coaching
        keyPhrase={undefined}
        qualifier={task.qualifier}
        explanation={task.explanation}
        distractors={pickedDistractors}
        notes={undefined}
      />
    </div>
  );
}

/* ============================================================
   Coaching panel — rationale + distractor-trap callouts
   ============================================================ */
function Coaching({
  explanation,
  keyPhrase,
  qualifier,
  notes,
  distractors,
}: {
  explanation: string;
  keyPhrase?: string;
  qualifier?: string;
  notes?: string[];
  distractors: Choice[];
}) {
  return (
    <div className="flex flex-col gap-4 border-t border-border pt-4">
      <div>
        <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-primary" />
          Why this answer
        </div>
        <p className="text-sm leading-relaxed text-foreground/90">{explanation}</p>
        {qualifier && (
          <div className="text-xs text-muted-foreground mt-2">
            The qualifier <span className="qualifier">{qualifier}</span> is what makes this answer the target — not a technically valid but adjacent option.
          </div>
        )}
        {keyPhrase && (
          <div className="text-xs text-muted-foreground mt-2">
            Key phrase: <span className="font-mono text-foreground bg-accent px-1.5 py-0.5 rounded-sm">{keyPhrase}</span>
          </div>
        )}
      </div>

      {distractors.length > 0 && (
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-destructive" />
            Distractor pattern
          </div>
          <ul className="flex flex-col gap-2">
            {distractors.map((d) => (
              <li
                key={d.id}
                className="text-sm text-foreground/90 border border-destructive/30 bg-destructive/5 rounded-md px-3 py-2"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-muted-foreground uppercase">{d.id}</span>
                  {d.trap && d.trap !== "correct" && (
                    <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider border-destructive/40 text-destructive">
                      {TRAP_LABELS[d.trap]}
                    </Badge>
                  )}
                </div>
                <div className="text-xs leading-relaxed text-muted-foreground">{d.rationale}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {notes && notes.length > 0 && <NotesLinks notes={notes} />}
    </div>
  );
}

function NotesLinks({ notes }: { notes: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-3">
      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <BookOpen className="w-3.5 h-3.5" />
        Study:
      </span>
      {notes.map((slug) => (
        <a
          key={slug}
          href={`#/notes/${slug}`}
          data-testid={`link-notes-${slug}`}
          className="text-xs font-mono px-2 py-0.5 rounded-sm border border-border hover-elevate text-foreground/90"
        >
          {slug.replace(/-/g, " ")}
        </a>
      ))}
    </div>
  );
}

function ReviewHeader({
  id,
  kind,
  domain,
  objective,
  difficulty,
  verdict,
}: {
  id: string;
  kind: "MCQ" | "PBQ";
  domain: Domain;
  objective: string;
  difficulty: 1 | 2 | 3;
  verdict: "correct" | "incorrect" | "partial";
}) {
  const diffLabel = difficulty === 1 ? "Baseline" : difficulty === 2 ? "Intermediate" : "Hard";
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
      <span className="px-2 py-0.5 rounded-sm border border-border text-muted-foreground uppercase tracking-wider">
        {id}
      </span>
      <span className="px-2 py-0.5 rounded-sm bg-primary/10 text-primary border border-primary/30 uppercase tracking-wider">
        {kind}
      </span>
      <span className="text-muted-foreground">Domain {domain} — {DOMAIN_META[domain].name}</span>
      <span className="text-muted-foreground">{diffLabel}</span>
      <span className="text-muted-foreground/70 hidden md:inline">{objective}</span>
      <span className="ml-auto">
        <Verdict verdict={verdict} />
      </span>
    </div>
  );
}

function Verdict({ verdict }: { verdict: "correct" | "incorrect" | "partial" }) {
  if (verdict === "correct") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-success/15 text-success border border-success/40 uppercase tracking-wider font-mono text-[10px] font-bold">
        <CheckCircle2 className="w-3 h-3" />
        Correct
      </span>
    );
  }
  if (verdict === "partial") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-warning/15 text-warning border border-warning/40 uppercase tracking-wider font-mono text-[10px] font-bold">
        Partial
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-destructive/15 text-destructive border border-destructive/40 uppercase tracking-wider font-mono text-[10px] font-bold">
      <XCircle className="w-3 h-3" />
      Incorrect
    </span>
  );
}
