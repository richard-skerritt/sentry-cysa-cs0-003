import { useMemo } from "react";
import { Link, useLocation } from "wouter";
import { EXAMS, DOMAIN_META, type Domain } from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrandMark } from "@/components/Brand";
import { ArrowRight, Clock, ListChecks, ShieldAlert, ShieldCheck, Gauge, Target, BookOpen, History as HistoryIcon } from "lucide-react";
import { ALL_MCQS, ALL_PBQS } from "@/data/bank";
import { useQuery } from "@tanstack/react-query";
import type { Attempt } from "@shared/schema";

const DIFFICULTY_META = {
  1: { label: "Baseline", tone: "bg-chart-5/15 text-chart-5 border-chart-5/30", desc: "Clear signals, classic phrasing" },
  2: { label: "Intermediate", tone: "bg-chart-3/15 text-chart-3 border-chart-3/30", desc: "Subtler distractors, mixed artifacts" },
  3: { label: "Toughest", tone: "bg-destructive/15 text-destructive border-destructive/30", desc: "Ambiguous, noisy, exam-day pressure" },
} as const;

export default function Home() {
  const [, navigate] = useLocation();
  const { data: attempts = [] } = useQuery<Attempt[]>({ queryKey: ["/api/attempts"] });

  const stats = useMemo(() => {
    const perDomain: Record<Domain, number> = { "1.0": 0, "2.0": 0, "3.0": 0, "4.0": 0 };
    ALL_MCQS.forEach((q) => (perDomain[q.domain] += 1));
    return {
      mcqs: ALL_MCQS.length,
      pbqs: ALL_PBQS.length,
      perDomain,
      completed: attempts.filter((a) => a.completedAt).length,
    };
  }, [attempts]);

  return (
    <AppShell>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-grid opacity-40" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-5 py-16 md:py-20">
          <div className="flex flex-col gap-6 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-primary">
              <span className="inline-block w-8 h-px bg-primary" />
              CompTIA CySA+ CS0-003
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight leading-[1.15]">
              Sit in the SOC seat before you sit the exam.
            </h1>
            <p className="text-muted-foreground leading-relaxed text-base max-w-2xl">
              Scenario-driven questions with real artifacts — logs, alerts, vuln scans, packet flows — scored the way CompTIA scores. Every distractor is tagged, so you learn the pattern behind the wrong answer, not just the right one.
            </p>
            <div className="flex flex-wrap gap-3 items-center pt-2">
              <Button
                size="lg"
                onClick={() => navigate("/exam/exam-1")}
                data-testid="button-start-baseline"
                className="gap-2"
              >
                Start Exam 1 — Baseline
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Link href="/notes" data-testid="link-notes">
                <Button size="lg" variant="outline" className="gap-2">
                  <BookOpen className="w-4 h-4" />
                  Study Notes
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-1.5"><ListChecks className="w-3.5 h-3.5 text-primary" /> {stats.mcqs} MCQs</span>
              <span className="flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-primary" /> {stats.pbqs} PBQs</span>
              <span className="flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5 text-primary" /> Weighted 33/30/20/17</span>
              <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-primary" /> Distractor-pattern coaching</span>
            </div>
          </div>
          <div className="absolute right-8 top-16 hidden lg:block opacity-30 text-primary">
            <BrandMark size={200} />
          </div>
        </div>
      </section>

      {/* Exams */}
      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Exams</div>
            <h2 className="text-xl font-bold">Three graded simulations</h2>
          </div>
          {stats.completed > 0 && (
            <Link href="/history" data-testid="link-history">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <HistoryIcon className="w-4 h-4" />
                {stats.completed} completed
              </Button>
            </Link>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {EXAMS.map((e, i) => {
            const d = DIFFICULTY_META[e.difficultyBias];
            return (
              <Card
                key={e.id}
                className="relative flex flex-col p-5 gap-4 hover-elevate group"
                data-testid={`card-exam-${e.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                      {String(i + 1).padStart(2, "0")} /
                    </span>
                    <Badge variant="outline" className={`${d.tone} font-mono text-[10px] uppercase tracking-wider`}>
                      {d.label}
                    </Badge>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                </div>
                <h3 className="text-base font-bold leading-tight">{e.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                  {e.description}
                </p>
                <dl className="grid grid-cols-3 gap-2 text-xs font-mono border-t border-border pt-3">
                  <div>
                    <dt className="text-muted-foreground uppercase tracking-wider text-[10px]">MCQ</dt>
                    <dd className="tabular-nums text-foreground font-bold mt-0.5">{e.targetMcqCount}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground uppercase tracking-wider text-[10px]">PBQ</dt>
                    <dd className="tabular-nums text-foreground font-bold mt-0.5">{e.targetPbqCount}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground uppercase tracking-wider text-[10px]">
                      <Clock className="w-3 h-3 inline -mt-0.5 mr-0.5" />min
                    </dt>
                    <dd className="tabular-nums text-foreground font-bold mt-0.5">{e.durationMin}</dd>
                  </div>
                </dl>
                <Button
                  onClick={() => navigate(`/exam/${e.id}`)}
                  data-testid={`button-start-${e.id}`}
                  className="gap-2 w-full"
                  variant={i === 0 ? "default" : "outline"}
                >
                  Start
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Domains */}
      <section className="mx-auto max-w-7xl px-5 py-6 pb-16">
        <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Exam Blueprint</div>
        <h2 className="text-xl font-bold mb-5">Four domains, weighted by the CompTIA blueprint</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(DOMAIN_META) as Domain[]).map((d) => {
            const m = DOMAIN_META[d];
            return (
              <Card key={d} className="p-4 flex flex-col gap-2" data-testid={`card-domain-${d}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Domain {d}
                  </span>
                  <span className="tabular-nums text-base font-bold text-primary">
                    {Math.round(m.weight * 100)}%
                  </span>
                </div>
                <div className="text-sm font-bold leading-tight">{m.name}</div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${m.weight * 100}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground font-mono mt-1">
                  {stats.perDomain[d]} questions in bank
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
