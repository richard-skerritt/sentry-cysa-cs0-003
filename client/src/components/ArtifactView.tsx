import type { Artifact } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FileText, ListOrdered, AlertTriangle, Bug, Network, StickyNote } from "lucide-react";

const ICONS: Record<Artifact["type"], typeof FileText> = {
  log: FileText,
  table: ListOrdered,
  alerts: AlertTriangle,
  vulns: Bug,
  flows: Network,
  notes: StickyNote,
};

export function ArtifactView({ artifact }: { artifact: Artifact }) {
  const Icon = ICONS[artifact.type];
  return (
    <div className="rounded-lg border border-card-border bg-card/60 overflow-hidden">
      <div className="px-3 py-2 border-b border-card-border bg-muted/50 flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        <span className="font-semibold">{artifact.title}</span>
      </div>
      <div className="p-3">
        {artifact.type === "log" && <pre className="log-block">{artifact.content}</pre>}

        {artifact.type === "flows" && <pre className="log-block">{artifact.content}</pre>}

        {artifact.type === "notes" && (
          <div className="text-sm font-mono whitespace-pre-wrap text-foreground/90 leading-relaxed">
            {artifact.content}
          </div>
        )}

        {artifact.type === "table" && (
          <div className="overflow-x-auto">
            <table className="text-sm font-mono w-full">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  {artifact.columns.map((c) => (
                    <th key={c} className="px-2 py-1.5 font-semibold">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {artifact.rows.map((r, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    {r.map((cell, j) => (
                      <td key={j} className="px-2 py-1.5 whitespace-nowrap text-foreground/90">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {artifact.type === "alerts" && (
          <div className="flex flex-col gap-1.5">
            {artifact.alerts.map((a) => (
              <div key={a.id} className="flex items-center gap-3 text-sm font-mono px-2 py-1.5 rounded border border-border bg-background/60">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-10">{a.id}</span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold border",
                    a.severity === "Critical" && "bg-destructive/20 text-destructive border-destructive/30",
                    a.severity === "High" && "bg-warning/15 text-warning border-warning/30",
                    a.severity === "Medium" && "bg-chart-2/15 text-chart-2 border-chart-2/30",
                    a.severity === "Low" && "bg-muted text-muted-foreground border-border",
                    a.severity === "Info" && "bg-muted text-muted-foreground border-border",
                  )}
                >
                  {a.severity}
                </span>
                <span className="text-muted-foreground text-xs w-16 truncate">{a.source}</span>
                <span className="flex-1 truncate">{a.rule}</span>
                {a.host && <span className="text-muted-foreground text-xs">{a.host}</span>}
                <span className="text-xs text-foreground/70 tabular-nums w-10 text-right">{a.count}</span>
              </div>
            ))}
          </div>
        )}

        {artifact.type === "vulns" && (
          <div className="overflow-x-auto">
            <table className="text-sm font-mono w-full">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="px-2 py-1.5 font-semibold">Host</th>
                  <th className="px-2 py-1.5 font-semibold">Service</th>
                  <th className="px-2 py-1.5 font-semibold">CVE</th>
                  <th className="px-2 py-1.5 font-semibold">CVSS</th>
                  <th className="px-2 py-1.5 font-semibold">KEV</th>
                  <th className="px-2 py-1.5 font-semibold">EPSS</th>
                  <th className="px-2 py-1.5 font-semibold">Note</th>
                </tr>
              </thead>
              <tbody>
                {artifact.findings.map((f, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="px-2 py-1.5">{f.host}</td>
                    <td className="px-2 py-1.5">{f.service}</td>
                    <td className="px-2 py-1.5">{f.cve}</td>
                    <td className="px-2 py-1.5">
                      <span className={cn(
                        "font-bold",
                        f.cvss >= 9 ? "text-destructive" :
                        f.cvss >= 7 ? "text-warning" :
                        f.cvss >= 4 ? "text-chart-2" : "text-muted-foreground"
                      )}>
                        {f.cvss.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      {f.kev ? <span className="text-destructive font-bold">KEV</span> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-2 py-1.5 tabular-nums">{f.epss !== undefined ? (f.epss * 100).toFixed(0) + "%" : "—"}</td>
                    <td className="px-2 py-1.5 text-muted-foreground text-xs">{f.note ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
