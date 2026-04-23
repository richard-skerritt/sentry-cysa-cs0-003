import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EXAMS } from "@/lib/types";
import type { Attempt } from "@shared/schema";
import { Loader2, History as HistoryIcon, BarChart3, BookOpen, ArrowRight, Clock, Calendar } from "lucide-react";

function fmtDuration(s: number | null): string {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${String(r).padStart(2, "0")}s`;
}

function fmtDate(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function History() {
  const { data: attempts = [], isLoading } = useQuery<Attempt[]>({
    queryKey: ["/api/attempts"],
  });

  const sorted = [...attempts].sort((a, b) => b.startedAt - a.startedAt);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-5 py-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
              Attempts
            </div>
            <h1 className="text-xl font-bold">Your exam history</h1>
          </div>
          <Link href="/" data-testid="link-home">
            <Button variant="outline" className="gap-2">
              Start an exam
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 mx-auto text-muted-foreground animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <Card className="p-12 text-center">
            <HistoryIcon className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
            <h2 className="text-base font-bold mb-1.5">No attempts yet</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Take any of the three exams and your results will show up here.
            </p>
            <Link href="/" data-testid="link-start">
              <Button>Pick an exam</Button>
            </Link>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {sorted.map((a) => {
              const exam = EXAMS.find((e) => e.id === a.examId);
              const isComplete = a.completedAt != null;
              return (
                <Card
                  key={a.id}
                  className="p-4 flex items-center gap-4 flex-wrap hover-elevate"
                  data-testid={`card-attempt-${a.id}`}
                >
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm">{exam?.name ?? a.examId}</span>
                      {!isComplete && (
                        <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider bg-warning/15 text-warning border-warning/40">
                          In progress
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {fmtDate(a.startedAt)}
                      </span>
                      {isComplete && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {fmtDuration(a.durationSec)}
                        </span>
                      )}
                    </div>
                  </div>

                  {isComplete && (
                    <div className="flex items-center gap-1">
                      <div className="text-right">
                        <div
                          className={cn(
                            "text-xl font-bold tabular-nums",
                            (a.score ?? 0) >= 80
                              ? "text-success"
                              : (a.score ?? 0) >= 70
                                ? "text-chart-3"
                                : "text-destructive",
                          )}
                        >
                          {a.score ?? 0}%
                        </div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                          Score
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {isComplete ? (
                      <>
                        <Link href={`/results/${a.id}`} data-testid={`link-results-${a.id}`}>
                          <Button size="sm" variant="outline" className="gap-1.5">
                            <BarChart3 className="w-3.5 h-3.5" />
                            Results
                          </Button>
                        </Link>
                        <Link href={`/review/${a.id}`} data-testid={`link-review-${a.id}`}>
                          <Button size="sm" variant="default" className="gap-1.5">
                            <BookOpen className="w-3.5 h-3.5" />
                            Review
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <Link href={`/review/${a.id}`} data-testid={`link-continue-${a.id}`}>
                        <Button size="sm" variant="outline">Open</Button>
                      </Link>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
