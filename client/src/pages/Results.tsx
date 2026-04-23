import { useMemo } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DOMAIN_META, EXAMS, type Domain } from "@/lib/types";
import { scoreExam, scoreMCQ, scorePBQ } from "@/lib/exam-logic";
import { ITEM_BY_ID } from "@/data/bank";
import { parseAttempt } from "@/lib/attempt-store";
import type { Attempt } from "@shared/schema";
import {
  CheckCircle2,
  XCircle,
  TrendingUp,
  Clock,
  Target,
  AlertCircle,
  Loader2,
  Sparkles,
  ListChecks,
  ShieldAlert,
  RotateCcw,
  BookOpen,
} from "lucide-react";

// CompTIA CySA+ passing score is ~750/900 (≈83%). The UI uses 70% and 80% as
// practice benchmarks that most instructors recommend before exam day.
const PASS_THRESHOLD = 80;

function fmtDuration(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${String(r).padStart(2, "0")}s`;
}

export default function Results() {
  const params = useParams<{ attemptId: string }>();
  const [, navigate] = useLocation();

  const { data, isLoading, error } = useQuery<Attempt>({
    queryKey: ["/api/attempts", params.attemptId],
  });

  const attempt = useMemo(() => (data ? parseAttempt(data) : null), [data]);

  const score = useMemo(() => {
    if (!attempt) return null;
    return scoreExam(attempt.questionIds, attempt.answers);
  }, [attempt]);

  const examMeta = useMemo(
    () => (attempt ? EXAMS.find((e) => e.id === attempt.examId) : null),
    [attempt],
  );

  if (isLoading) {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto py-20 px-5 text-center">
          <Loader2 className="w-8 h-8 mx-auto text-muted-foreground animate-spin mb-3" />
          <p className="text-sm text-muted-foreground font-mono">Loading results...</p>
        </div>
      </AppShell>
    );
  }

  if (error || !attempt || !score) {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto py-20 px-5 text-center">
          <AlertCircle className="w-8 h-8 mx-auto text-destructive mb-4" />
          <h1 className="text-xl font-bold mb-2">Results not available</h1>
          <Button onClick={() => navigate("/")} data-testid="button-back-home">Back to home</Button>
        </div>
      </AppShell>
    );
  }

  const passed = score.overall >= PASS_THRESHOLD;

  // Per-question outcomes for pattern-by-type
  const wrong = attempt.questionIds.filter((id) => {
    const item = ITEM_BY_ID[id];
    if (!item) return false;
    if (item.kind === "mcq") return scoreMCQ(item, attempt.answers[id]) !== 1;
    return scorePBQ(item, attempt.answers) !== 1;
  });

  const durationSec = attempt.durationSec ?? 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-5 py-8">
        {/* score hero */}
        <section className="mb-8">
          <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
            {examMeta?.name ?? "Exam"}
          </div>
          <div className="flex flex-wrap items-baseline gap-4 mb-4">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              {passed ? "On track." : "Keep at it."}
            </h1>
            <Badge
              variant="outline"
              className={cn(
                "font-mono uppercase tracking-wider text-[10px]",
                passed
                  ? "bg-success/15 text-success border-success/40"
                  : "bg-warning/15 text-warning border-warning/40",
              )}
            >
              {passed ? "Passed (≥80%)" : "Below 80%"}
            </Badge>
          </div>

          <div className="grid md:grid-cols-4 gap-3">
            <ScoreCard
              label="Overall"
              value={`${score.overall}%`}
              icon={Target}
              highlight
              testId="stat-overall"
            />
            <ScoreCard
              label="MCQ"
              value={`${score.mcqPercent}%`}
              sub={`${score.mcqCount} items`}
              icon={ListChecks}
              testId="stat-mcq"
            />
            <ScoreCard
              label="PBQ"
              value={`${score.pbqPercent}%`}
              sub={`${score.pbqCount} items`}
              icon={ShieldAlert}
              testId="stat-pbq"
            />
            <ScoreCard
              label="Time"
              value={fmtDuration(durationSec)}
              sub={`${attempt.questionIds.length} questions`}
              icon={Clock}
              testId="stat-time"
            />
          </div>
        </section>

        {/* per-domain */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold">Per domain</h2>
          </div>
          <Card className="p-5">
            <div className="flex flex-col gap-5">
              {(Object.keys(DOMAIN_META) as Domain[]).map((d) => {
                const row = score.byDomain[d];
                const meta = DOMAIN_META[d];
                const tone =
                  row.percent >= 80
                    ? "bg-success"
                    : row.percent >= 70
                      ? "bg-chart-3"
                      : "bg-destructive";
                return (
                  <div key={d}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                          Domain {d}
                        </span>
                        <span className="font-bold truncate">{meta.name}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono tabular-nums shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {row.earned.toFixed(1)} / {row.total}
                        </span>
                        <span className={cn("font-bold", row.percent >= 70 ? "text-foreground" : "text-destructive")}>
                          {row.percent}%
                        </span>
                      </div>
                    </div>
                    <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-[width]", tone)}
                        style={{ width: `${row.percent}%` }}
                      />
                      {/* Pass benchmark marker */}
                      <div
                        className="absolute top-0 bottom-0 w-px bg-foreground/40"
                        style={{ left: "80%" }}
                        aria-hidden
                      />
                    </div>
                    <div className="mt-1 text-[10px] font-mono text-muted-foreground">
                      Weight on real exam: {Math.round(meta.weight * 100)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>

        {/* pattern insights */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold">Coaching insights</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {score.insights.map((ins, i) => (
              <Card key={i} className="p-4" data-testid={`insight-${i}`}>
                <p className="text-sm leading-relaxed text-foreground/90">{ins}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* distractor-trap counts */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-4 h-4 text-destructive" />
            <h2 className="text-base font-bold">Where distractors caught you</h2>
          </div>
          <div className="grid md:grid-cols-5 sm:grid-cols-2 gap-3">
            <TrapCard label="Right action, wrong phase" value={score.patterns.rightActionWrongPhase} />
            <TrapCard label="Right tool, wrong purpose" value={score.patterns.rightToolWrongPurpose} />
            <TrapCard label="Valid, not BEST" value={score.patterns.validButNotBest} />
            <TrapCard label="Scope mismatch" value={score.patterns.scopeMismatch} />
            <TrapCard label="Policy vs. ops" value={score.patterns.policyVsOps} />
          </div>
        </section>

        {/* next actions */}
        <section className="flex flex-wrap gap-3 items-center pt-3 border-t border-border">
          <Link href={`/review/${params.attemptId}`} data-testid="link-review">
            <Button variant="default" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Review with coaching
            </Button>
          </Link>
          {examMeta && (
            <Button
              variant="outline"
              onClick={() => navigate(`/exam/${examMeta.id}`)}
              data-testid="button-retake"
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Retake {examMeta.name}
            </Button>
          )}
          <Link href="/notes" data-testid="link-notes">
            <Button variant="outline" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Study notes
            </Button>
          </Link>
          {wrong.length > 0 && (
            <span className="text-xs font-mono text-muted-foreground ml-auto">
              {wrong.length} to revisit
            </span>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function ScoreCard({
  label,
  value,
  sub,
  icon: Icon,
  highlight,
  testId,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof Target;
  highlight?: boolean;
  testId?: string;
}) {
  return (
    <Card
      data-testid={testId}
      className={cn(
        "p-4 flex flex-col gap-1.5",
        highlight && "border-primary/40 bg-primary/5",
      )}
    >
      <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className={cn("text-xl font-bold tabular-nums", highlight && "text-primary")}>{value}</div>
      {sub && <div className="text-xs font-mono text-muted-foreground">{sub}</div>}
    </Card>
  );
}

function TrapCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-3">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground leading-tight mb-1">
        {label}
      </div>
      <div
        className={cn(
          "text-xl font-bold tabular-nums",
          value === 0 ? "text-muted-foreground" : "text-destructive",
        )}
      >
        {value}
      </div>
    </Card>
  );
}
