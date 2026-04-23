import { useMemo } from "react";
import { Link, useParams } from "wouter";
import { marked } from "marked";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookOpen, ArrowLeft, FileText, Search } from "lucide-react";
import { useState } from "react";

/* All 14 curriculum files — imported as raw strings at build time */
const MODULES = import.meta.glob("../content/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

interface NoteDoc {
  slug: string;
  title: string;
  body: string;
  category: string;
}

function slugFromPath(p: string): string {
  const m = p.match(/\/([^/]+)\.md$/);
  return m ? m[1] : p;
}

function titleFromMd(body: string, fallback: string): string {
  const m = body.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : fallback.replace(/-/g, " ");
}

/* Light categorization by filename prefix for organization */
const CATEGORIES: Record<string, { label: string; order: number }> = {
  SIEM: { label: "Security Operations", order: 1 },
  "Threat-Intelligence": { label: "Security Operations", order: 1 },
  "Network-Security": { label: "Security Operations", order: 1 },
  "Endpoint-Security": { label: "Security Operations", order: 1 },
  "MITRE-ATTCK": { label: "Security Operations", order: 1 },
  "Windows-Event": { label: "Security Operations", order: 1 },
  "Vulnerability-Management": { label: "Vulnerability Management", order: 2 },
  "CVSS-v3": { label: "Vulnerability Management", order: 2 },
  "Cloud-Security": { label: "Vulnerability Management", order: 2 },
  "Incident-Response": { label: "Incident Response", order: 3 },
  "Digital-Forensics": { label: "Incident Response", order: 3 },
  "IR-Playbooks": { label: "Incident Response", order: 3 },
  Reporting: { label: "Reporting & Communication", order: 4 },
  Regulatory: { label: "Reporting & Communication", order: 4 },
};

function categoryFor(slug: string): string {
  for (const key of Object.keys(CATEGORIES)) {
    if (slug.startsWith(key)) return CATEGORIES[key].label;
  }
  return "Reference";
}

function buildDocs(): NoteDoc[] {
  const docs: NoteDoc[] = Object.entries(MODULES).map(([path, body]) => {
    const slug = slugFromPath(path);
    return {
      slug,
      title: titleFromMd(body, slug),
      body,
      category: categoryFor(slug),
    };
  });
  // stable sort: category order, then alpha
  const catOrder: Record<string, number> = {
    "Security Operations": 1,
    "Vulnerability Management": 2,
    "Incident Response": 3,
    "Reporting & Communication": 4,
    Reference: 5,
  };
  docs.sort((a, b) => {
    const c = (catOrder[a.category] ?? 99) - (catOrder[b.category] ?? 99);
    if (c !== 0) return c;
    return a.title.localeCompare(b.title);
  });
  return docs;
}

export default function Notes() {
  const params = useParams<{ slug?: string }>();
  const docs = useMemo(buildDocs, []);
  const [q, setQ] = useState("");

  const current = params.slug ? docs.find((d) => d.slug === params.slug) : null;

  if (current) {
    return <NoteReader doc={current} docs={docs} />;
  }

  const filtered = q.trim()
    ? docs.filter(
        (d) =>
          d.title.toLowerCase().includes(q.toLowerCase()) ||
          d.body.toLowerCase().includes(q.toLowerCase()),
      )
    : docs;

  const grouped = filtered.reduce<Record<string, NoteDoc[]>>((acc, d) => {
    (acc[d.category] ??= []).push(d);
    return acc;
  }, {});

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-5 py-8">
        <div className="mb-6">
          <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
            Curriculum
          </div>
          <h1 className="text-xl font-bold mb-4">Study notes</h1>
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search notes..."
              data-testid="input-notes-search"
              className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {Object.entries(grouped).map(([cat, items]) => (
          <section key={cat} className="mb-8">
            <h2 className="text-xs font-mono uppercase tracking-wider text-primary mb-2.5 flex items-center gap-2">
              <span className="w-6 h-px bg-primary" />
              {cat}
            </h2>
            <div className="grid md:grid-cols-2 gap-2.5">
              {items.map((d) => (
                <Link key={d.slug} href={`/notes/${d.slug}`} data-testid={`link-note-${d.slug}`}>
                  <Card className="p-4 hover-elevate flex items-start gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold leading-tight">{d.title}</div>
                      <div className="text-xs font-mono text-muted-foreground mt-0.5 truncate">
                        {d.slug}.md
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}

        {filtered.length === 0 && (
          <Card className="p-10 text-center">
            <BookOpen className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No notes match your search.</p>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

function NoteReader({ doc, docs }: { doc: NoteDoc; docs: NoteDoc[] }) {
  const html = useMemo(() => {
    marked.setOptions({ gfm: true, breaks: false });
    return marked.parse(doc.body) as string;
  }, [doc]);

  const sameCategory = docs.filter((d) => d.category === doc.category && d.slug !== doc.slug);
  const idx = docs.findIndex((d) => d.slug === doc.slug);
  const prev = idx > 0 ? docs[idx - 1] : null;
  const next = idx < docs.length - 1 ? docs[idx + 1] : null;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-5 py-8">
        <Link href="/notes" data-testid="link-back-notes">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 mb-3">
            <ArrowLeft className="w-4 h-4" />
            All notes
          </Button>
        </Link>

        <div className="grid lg:grid-cols-[1fr_220px] gap-8">
          <article className="min-w-0">
            <div className="text-xs font-mono uppercase tracking-wider text-primary mb-2">
              {doc.category}
            </div>
            <div
              className={cn(
                "prose-notes",
                "text-foreground/90 leading-relaxed",
              )}
              dangerouslySetInnerHTML={{ __html: html }}
            />

            {/* prev/next */}
            <div className="mt-10 pt-6 border-t border-border flex justify-between gap-3 flex-wrap">
              {prev ? (
                <Link href={`/notes/${prev.slug}`} data-testid="link-prev-note">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-left">
                      <span className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        Previous
                      </span>
                      <span className="block truncate max-w-[180px]">{prev.title}</span>
                    </span>
                  </Button>
                </Link>
              ) : (
                <span />
              )}
              {next && (
                <Link href={`/notes/${next.slug}`} data-testid="link-next-note">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <span className="text-right">
                      <span className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        Next
                      </span>
                      <span className="block truncate max-w-[180px]">{next.title}</span>
                    </span>
                  </Button>
                </Link>
              )}
            </div>
          </article>

          {sameCategory.length > 0 && (
            <aside className="order-first lg:order-last">
              <div className="lg:sticky lg:top-20">
                <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                  In this domain
                </div>
                <nav className="flex flex-col gap-0.5">
                  {sameCategory.map((d) => (
                    <Link
                      key={d.slug}
                      href={`/notes/${d.slug}`}
                      data-testid={`link-related-${d.slug}`}
                      className="text-xs py-1.5 px-2 rounded-md hover-elevate text-muted-foreground block leading-snug"
                    >
                      {d.title}
                    </Link>
                  ))}
                </nav>
              </div>
            </aside>
          )}
        </div>
      </div>
    </AppShell>
  );
}
