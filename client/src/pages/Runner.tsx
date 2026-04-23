import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChoiceRow } from "@/components/ChoiceRow";
import { OrderingList } from "@/components/OrderingList";
import { ArtifactView } from "@/components/ArtifactView";
import { StemText } from "@/components/Qualifier";
import { cn } from "@/lib/utils";
import { EXAMS, DOMAIN_META, type Domain, type Confidence, type MCQ, type PBQ, type PBQTask } from "@/lib/types";
import { ITEM_BY_ID, generateExam } from "@/data/bank";
import { scoreExam } from "@/lib/exam-logic";
import { serializeAttempt } from "@/lib/attempt-store";
import type { Attempt } from "@shared/schema";
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Clock,
  CheckCircle2,
  Circle,
  HelpCircle,
  Zap,
  AlertCircle,
  Lock,
} from "lucide-react";

type Answers = Record<string, string[]>;
type ConfMap = Record<string, Confidence>;

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function Runner() {
  const params = useParams<{ examId: string }>();
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  const exam = useMemo(() => EXAMS.find((e) => e.id === params.examId), [params.examId]);
  const questionIds = useMemo(() => (exam ? generateExam(exam) : []), [exam]);

  // runtime state
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [flags, setFlags] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<ConfMap>({});
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [startMs] = useState<number>(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  // live timer
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startMs) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startMs]);

  // create attempt on mount
  const createdRef = useRef(false);
  useEffect(() => {
    if (!exam || createdRef.current || questionIds.length === 0) return;
    createdRef.current = true;
    (async () => {
      try {
        const payload = serializeAttempt({
          examId: exam.id,
          startedAt: startMs,
          questionIds,
          answers: {},
          flags: [],
          confidence: {},
        }) as Partial<Attempt>;
        const res = await apiRequest("POST", "/api/attempts", payload);
        const created = (await res.json()) as Attempt;
        setAttemptId(created.id);
      } catch (e) {
        console.error("failed to create attempt", e);
      }
    })();
  }, [exam, questionIds, startMs]);

  // debounced autosave
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (attemptId == null) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await apiRequest(
          "PATCH",
          `/api/attempts/${attemptId}`,
          serializeAttempt({ answers, flags, confidence }),
        );
      } catch (e) {
        /* silent */
      }
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [answers, flags, confidence, attemptId]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (attemptId == null) throw new Error("no attempt");
      const score = scoreExam(questionIds, answers).overall;
      const durationSec = Math.floor((Date.now() - startMs) / 1000);
      const payload = serializeAttempt({
        answers,
        flags,
        confidence,
      });
      await apiRequest("PATCH", `/api/attempts/${attemptId}`, {
        ...payload,
        completedAt: Date.now(),
        score,
        durationSec,
      });
      return attemptId;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["/api/attempts"] });
      navigate(`/review/${id}`);
    },
  });

  if (!exam) {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto py-20 px-5 text-center">
          <AlertCircle className="w-8 h-8 mx-auto text-destructive mb-4" />
          <h1 className="text-xl font-bold mb-2">Exam not found</h1>
          <Button onClick={() => navigate("/")} data-testid="button-back-home">Back to home</Button>
        </div>
      </AppShell>
    );
  }

  const currentId = questionIds[idx];
  const current = ITEM_BY_ID[currentId];
  if (!current) return null;

  const isFlagged = flags.includes(currentId);
  const toggleFlag = () =>
    setFlags((prev) =>
      prev.includes(currentId) ? prev.filter((x) => x !== currentId) : [...prev, currentId],
    );

  const setConf = (level: Confidence) =>
    setConfidence((prev) => ({ ...prev, [currentId]: level }));

  const answeredCount = questionIds.filter((id) => {
    const item = ITEM_BY_ID[id];
    if (!item) return false;
    if (item.kind === "mcq") return (answers[id] ?? []).length > 0;
    return item.tasks.every((t) => (answers[t.id] ?? []).length > 0);
  }).length;

  const allAnswered = answeredCount === questionIds.length;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-5 py-6">
        {/* top bar */}
        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-mono uppercase tracking-wider text-[10px]">
              {exam.name}
            </Badge>
            <span className="text-sm text-muted-foreground font-mono">
              {idx + 1} / {questionIds.length}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono text-sm tabular-nums text-muted-foreground">
              <Clock className="w-4 h-4" />
              {fmtTime(elapsed)}
            </div>
            <Button
              size="sm"
              variant={isFlagged ? "default" : "outline"}
              onClick={toggleFlag}
              data-testid="button-flag"
              className={cn("gap-1.5", isFlagged && "bg-warning text-warning-foreground hover:bg-warning/90")}
            >
              <Flag className="w-4 h-4" />
              {isFlagged ? "Flagged" : "Flag"}
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={() => setShowConfirm(true)}
              data-testid="button-submit"
              disabled={submitMutation.isPending}
            >
              <Lock className="w-4 h-4 mr-1.5" />
              Submit
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_240px] gap-5">
          {/* content */}
          <div className="min-w-0">
            {current.kind === "mcq" ? (
              <MCQView
                mcq={current}
                selected={answers[currentId] ?? []}
                onSelect={(next) => setAnswers((prev) => ({ ...prev, [currentId]: next }))}
                confidence={confidence[currentId]}
                onConfidence={setConf}
              />
            ) : (
              <PBQView
                pbq={current}
                answers={answers}
                onAnswerChange={(taskId, next) =>
                  setAnswers((prev) => ({ ...prev, [taskId]: next }))
                }
                confidence={confidence[currentId]}
                onConfidence={setConf}
              />
            )}

            {/* nav */}
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
                onClick={() => setIdx((i) => Math.min(questionIds.length - 1, i + 1))}
                disabled={idx === questionIds.length - 1}
                data-testid="button-next"
                className="gap-1.5"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* sidebar navigator */}
          <aside className="order-first lg:order-last">
            <Card className="p-3 sticky top-20">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Navigator
                </span>
                <span className="text-xs font-mono tabular-nums text-foreground/80">
                  {answeredCount}/{questionIds.length}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted mb-3 overflow-hidden mx-1">
                <div
                  className="h-full bg-primary rounded-full transition-[width]"
                  style={{ width: `${(answeredCount / Math.max(1, questionIds.length)) * 100}%` }}
                />
              </div>
              <div className="grid grid-cols-6 lg:grid-cols-5 gap-1.5">
                {questionIds.map((qid, i) => {
                  const item = ITEM_BY_ID[qid];
                  if (!item) return null;
                  const isPbq = item.kind === "pbq";
                  const answered =
                    isPbq
                      ? item.tasks.every((t) => (answers[t.id] ?? []).length > 0)
                      : (answers[qid] ?? []).length > 0;
                  const flagged = flags.includes(qid);
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
                          : answered
                            ? "border-primary/40 bg-primary/10 text-foreground"
                            : "border-border bg-background text-muted-foreground",
                        isPbq && !active && "border-chart-4/50 bg-chart-4/10",
                      )}
                    >
                      {i + 1}
                      {flagged && (
                        <Flag className="absolute -top-1 -right-1 w-3 h-3 text-warning fill-warning" />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-border flex flex-col gap-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm border border-primary/40 bg-primary/10" /> Answered
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm border border-chart-4/50 bg-chart-4/10" /> PBQ
                </div>
                <div className="flex items-center gap-1.5">
                  <Flag className="w-3 h-3 text-warning fill-warning" /> Flagged
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </div>

      {/* submit confirmation overlay */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowConfirm(false)}
          data-testid="overlay-submit"
        >
          <Card
            className="max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-2">Submit exam?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You've answered <span className="text-foreground font-bold tabular-nums">{answeredCount}</span> of <span className="text-foreground font-bold tabular-nums">{questionIds.length}</span>. Unanswered questions will count as incorrect.
            </p>
            {!allAnswered && (
              <div className="text-xs font-mono flex items-center gap-1.5 text-warning mb-4 bg-warning/10 border border-warning/30 rounded-md px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5" />
                {questionIds.length - answeredCount} unanswered
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                data-testid="button-cancel-submit"
              >
                Keep going
              </Button>
              <Button
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
                data-testid="button-confirm-submit"
              >
                {submitMutation.isPending ? "Scoring..." : "Submit & score"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

/* =============== MCQ view =============== */
function MCQView({
  mcq,
  selected,
  onSelect,
  confidence,
  onConfidence,
}: {
  mcq: MCQ;
  selected: string[];
  onSelect: (next: string[]) => void;
  confidence: Confidence | undefined;
  onConfidence: (c: Confidence) => void;
}) {
  const isMulti = mcq.correct.length > 1;
  return (
    <Card className="p-5 md:p-6 flex flex-col gap-5">
      <Header
        id={mcq.id}
        domain={mcq.domain}
        objective={mcq.objective}
        difficulty={mcq.difficulty}
        kind="MCQ"
      />
      <StemText>{mcq.stem}</StemText>
      {mcq.artifact && <ArtifactView artifact={mcq.artifact} />}

      <div className="flex flex-col gap-2">
        {isMulti && (
          <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-0.5">
            Select all that apply ({mcq.correct.length} correct)
          </div>
        )}
        {mcq.choices.map((c) => {
          const isSel = selected.includes(c.id);
          return (
            <ChoiceRow
              key={c.id}
              id={c.id}
              label={c.text}
              selected={isSel}
              multi={isMulti}
              testId={`choice-${mcq.id}-${c.id}`}
              onToggle={() => {
                if (isMulti) {
                  onSelect(isSel ? selected.filter((s) => s !== c.id) : [...selected, c.id]);
                } else {
                  onSelect([c.id]);
                }
              }}
            />
          );
        })}
      </div>

      <ConfidenceBar confidence={confidence} onConfidence={onConfidence} />
    </Card>
  );
}

/* =============== PBQ view =============== */
function PBQView({
  pbq,
  answers,
  onAnswerChange,
  confidence,
  onConfidence,
}: {
  pbq: PBQ;
  answers: Answers;
  onAnswerChange: (taskId: string, next: string[]) => void;
  confidence: Confidence | undefined;
  onConfidence: (c: Confidence) => void;
}) {
  return (
    <Card className="p-5 md:p-6 flex flex-col gap-5">
      <Header
        id={pbq.id}
        domain={pbq.domain}
        objective={pbq.objective}
        difficulty={pbq.difficulty}
        kind="PBQ"
      />
      <div>
        <h2 className="text-base font-bold mb-1.5">{pbq.title}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{pbq.scenario}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* artifacts */}
        <div className="flex flex-col gap-3 md:sticky md:top-20 md:self-start md:max-h-[calc(100vh-6rem)] md:overflow-y-auto md:pr-1">
          {pbq.artifacts.map((a, i) => (
            <ArtifactView key={i} artifact={a} />
          ))}
        </div>
        {/* tasks */}
        <div className="flex flex-col gap-5">
          {pbq.tasks.map((task, i) => (
            <PBQTaskView
              key={task.id}
              task={task}
              index={i + 1}
              selected={answers[task.id] ?? []}
              onSelect={(next) => onAnswerChange(task.id, next)}
            />
          ))}
        </div>
      </div>

      <ConfidenceBar confidence={confidence} onConfidence={onConfidence} />
    </Card>
  );
}

function PBQTaskView({
  task,
  index,
  selected,
  onSelect,
}: {
  task: PBQTask;
  index: number;
  selected: string[];
  onSelect: (next: string[]) => void;
}) {
  // For ordering, initialize with scrambled order (stable per task id)
  const baseOrder = useMemo(() => {
    if (task.mode !== "order") return [];
    const ids = task.choices.map((c) => c.id);
    // stable scramble: reverse (deterministic)
    return [...ids].reverse();
  }, [task]);

  const orderSelected = selected.length > 0 ? selected : baseOrder;

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-5 first:border-t-0 first:pt-0">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-mono uppercase tracking-wider text-primary">
            Task {index}
          </span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            {task.mode === "single" ? "Single answer" : task.mode === "multi" ? "Multi-select" : "Reorder"}
          </span>
        </div>
        <StemText>{task.prompt}</StemText>
      </div>

      {task.mode === "order" ? (
        <>
          <div className="text-xs font-mono text-muted-foreground">
            Use the arrows to place the steps in the correct order.
          </div>
          <OrderingList
            ids={orderSelected}
            choices={task.choices}
            onChange={onSelect}
          />
        </>
      ) : (
        <div className="flex flex-col gap-2">
          {task.mode === "multi" && (
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Select all that apply ({task.correct.length} correct)
            </div>
          )}
          {task.choices.map((c) => {
            const isSel = selected.includes(c.id);
            return (
              <ChoiceRow
                key={c.id}
                id={c.id}
                label={c.text}
                selected={isSel}
                multi={task.mode === "multi"}
                testId={`choice-${task.id}-${c.id}`}
                onToggle={() => {
                  if (task.mode === "multi") {
                    onSelect(isSel ? selected.filter((s) => s !== c.id) : [...selected, c.id]);
                  } else {
                    onSelect([c.id]);
                  }
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* =============== shared pieces =============== */
function Header({
  id,
  domain,
  objective,
  difficulty,
  kind,
}: {
  id: string;
  domain: Domain;
  objective: string;
  difficulty: 1 | 2 | 3;
  kind: "MCQ" | "PBQ";
}) {
  const diffLabel = difficulty === 1 ? "Baseline" : difficulty === 2 ? "Intermediate" : "Hard";
  const diffTone =
    difficulty === 1
      ? "text-chart-5 border-chart-5/40 bg-chart-5/10"
      : difficulty === 2
        ? "text-chart-3 border-chart-3/40 bg-chart-3/10"
        : "text-destructive border-destructive/40 bg-destructive/10";
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
      <span className="px-2 py-0.5 rounded-sm border border-border text-muted-foreground uppercase tracking-wider">
        {id}
      </span>
      <span className="px-2 py-0.5 rounded-sm bg-primary/10 text-primary border border-primary/30 uppercase tracking-wider">
        {kind}
      </span>
      <span className="text-muted-foreground">Domain {domain} — {DOMAIN_META[domain].name}</span>
      <span className={cn("px-2 py-0.5 rounded-sm border uppercase tracking-wider", diffTone)}>
        {diffLabel}
      </span>
      <span className="text-muted-foreground/70 ml-auto hidden md:inline">{objective}</span>
    </div>
  );
}

function ConfidenceBar({
  confidence,
  onConfidence,
}: {
  confidence: Confidence | undefined;
  onConfidence: (c: Confidence) => void;
}) {
  const options: { id: Confidence; label: string; icon: typeof Zap }[] = [
    { id: "know", label: "I know this", icon: CheckCircle2 },
    { id: "unsure", label: "Unsure", icon: HelpCircle },
    { id: "guess", label: "Guess", icon: Circle },
  ];
  return (
    <div className="flex items-center gap-2 border-t border-border pt-3">
      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
        Confidence
      </span>
      <div className="flex gap-1.5">
        {options.map((o) => {
          const Icon = o.icon;
          const active = confidence === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onConfidence(o.id)}
              data-testid={`button-confidence-${o.id}`}
              className={cn(
                "text-xs font-mono px-2 py-1 rounded-sm border flex items-center gap-1.5 hover-elevate uppercase tracking-wider",
                active
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border text-muted-foreground",
              )}
            >
              <Icon className="w-3 h-3" />
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
