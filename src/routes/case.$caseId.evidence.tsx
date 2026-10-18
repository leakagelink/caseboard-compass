import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { CASES, type Clue } from "@/data/cases";
import { emptyCase, isUnlocked, useCases, useSave, type Verdict } from "@/lib/progress";
import { Shell } from "@/components/Shell";
import { Button } from '@/components/ui/button';

export const Route = createFileRoute("/case/$caseId/evidence")({
  loader: ({ params }) => {
    const c = CASES.find((x) => x.slug === params.caseId);
    if (!c && /^loc-[a-z0-9]+-[1-3]$/.test(params.caseId)) return { title: 'Location case', id: params.caseId, ghost: 'Location ghost' };
    if (!c) throw notFound();
    return { title: c.title };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Evidence Board — ${loaderData?.title ?? "Case"} | CASE ZERO` },
      { name: "description", content: "Inspect clues, reject the red herrings and name the culprit." },
      { property: "og:title", content: `Evidence Board — ${loaderData?.title ?? "Case"}` },
      { property: "og:description", content: "Sort real evidence from misleading clues and make your deduction." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Board,
});

function Board() {
  const { caseId } = Route.useParams();
  const { cases } = useCases();
  const c = cases.find((x) => x.slug === caseId);
  const { save, act, busy, user, loading } = useSave();
  if (!c && loading) return <p role="status">Loading case…</p>;
  if (!c && loading) return <p role="status">Loading case…</p>;
  if (!c) throw notFound();
  const p = save.cases[c.id] ?? emptyCase;
  const [open, setOpen] = useState<Clue | null>(null);
  const [wrong, setWrong] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const allInspected = c.clues.every((cl) => p.inspected.includes(cl.id));
  const allJudged = c.clues.every((cl) => p.verdicts[cl.id]);
  const correctSort = c.clues.every((cl) => (p.verdicts[cl.id] === "relevant") === cl.relevant);

  const inspect = async (cl: Clue) => {
    const result = await act({ caseId: c.id, kind: 'inspect', clueId: cl.id });
    if (result) setOpen(cl);
  };
  const judge = async (id: string, v: Verdict) => {
    setWrong(false);
    if (await act({ caseId: c.id, kind: 'judge', clueId: id, verdict: v })) setOpen(null);
  };
  const useHint = async () => {
    const result = await act({ caseId: c.id, kind: 'hint' });
    if (result?.message) setHint(result.message);
  };

  if (loading) return <Shell><p className="text-sm">Opening evidence…</p></Shell>;
  if (!user || !isUnlocked(cases, save, c)) return <Shell><h1 className="font-display text-2xl">Evidence Board</h1><p className="mt-4 text-sm">{!user ? 'Sign in to begin your investigation.' : 'This case is locked or unpublished. Solve the previous case first.'}</p><Button asChild className="mt-4"><Link to={!user ? '/auth' : '/'}>{!user ? 'Sign in' : 'Case Map'}</Link></Button></Shell>;

  return (
    <Shell nav={false}>
      <div className="flex items-center justify-between">
        <Link to="/case/$caseId" params={{ caseId }} className="text-xs text-muted-foreground">← Dossier</Link>
        <span className="font-display text-xs text-ghost">{c.id}</span>
      </div>
      <h1 className="font-display mt-4 text-2xl">Evidence Board</h1>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Inspected {p.inspected.length}/{c.clues.length} · Sorted {Object.keys(p.verdicts).length}/{c.clues.length}</span>
        <Button variant="ghost" onClick={() => void useHint()} disabled={busy || save.hints <= 0} className="text-ghost">Hint ({save.hints})</Button>
      </div>
      {hint && <p className="mt-2 text-xs text-ghost">{hint}</p>}

      <div className="mt-5 grid grid-cols-2 gap-3">
        {c.clues.map((cl, i) => {
          const v = p.verdicts[cl.id];
          const seen = p.inspected.includes(cl.id);
          return (
            <Button variant="outline" disabled={busy}
              key={cl.id}
              onClick={() => inspect(cl)}
              style={{ rotate: `${i % 2 ? 1.5 : -1.5}deg` }}
              className={`h-auto whitespace-normal block rounded-md border bg-card p-3 text-left transition hover:border-ghost ${
                v === "relevant" ? "border-ghost" : v === "misleading" ? "border-primary opacity-60" : "border-border"
              }`}
            >
              <span className="text-[10px] uppercase text-muted-foreground">{cl.location}</span>
              <p className="font-display mt-1 text-sm leading-tight">{cl.name}</p>
              <p className="mt-2 text-[10px] text-muted-foreground">
                {v ? (v === "relevant" ? "◆ Evidence" : "✕ Red herring") : seen ? "Inspected" : "Tap to inspect"}
              </p>
            </Button>
          );
        })}
      </div>

      {allInspected && allJudged && !correctSort && (
        <p className="mt-5 rounded border border-primary p-3 text-sm text-primary">
          Something doesn't add up. Re-examine your sorting — the ghost knows when you're wrong.
        </p>
      )}

      {allInspected && allJudged && correctSort && !p.deduced && (
        <section className="mt-6 rounded-lg border border-ghost bg-card p-4">
          <h2 className="font-display text-lg">Deduction</h2>
          <p className="text-sm text-muted-foreground">{c.deductionQuestion}</p>
          <div className="mt-3 space-y-2">
            {c.suspects.map((s) => (
              <Button variant="outline" disabled={busy}
                key={s.id}
                onClick={async () => { const r = await act({ caseId: c.id, kind: 'accuse', suspectId: s.id }); setWrong(Boolean(r?.message)); }}
                className="h-auto whitespace-normal w-full rounded border border-border p-3 text-left hover:border-ghost"
              >
                <span className="font-display">{s.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">{s.role}</span>
              </Button>
            ))}
          </div>
          {wrong && <p className="mt-3 text-sm text-primary">The air turns cold. That's not who the evidence points to.</p>}
        </section>
      )}

      {p.deduced && (
        <section className="mt-6 rounded-lg border border-primary bg-card p-5 shadow-[var(--shadow-eerie)]">
          <p className="text-xs uppercase tracking-widest text-primary">Deduction confirmed</p>
          <p className="mt-2 text-sm">The truth is close — but {c.ghost.name} won't let it go quietly.</p>
          <Link to="/case/$caseId/hunt" params={{ caseId }} className="mt-4 block rounded-md bg-primary py-3 text-center font-display text-primary-foreground">
            Begin Ghost Encounter
          </Link>
        </section>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-background/80 backdrop-blur-sm" onClick={() => setOpen(null)}>
          <div className="mx-auto w-full max-w-md rounded-t-xl border-t border-ghost bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <p className="text-[10px] uppercase text-muted-foreground">{open.location}</p>
            <h3 className="font-display text-xl">{open.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{open.description}</p>
            <p className="mt-4 border-l-2 border-ghost pl-3 text-sm">{open.inspection}</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button disabled={busy} variant="outline" onClick={() => void judge(open.id, 'relevant')} className="border-ghost text-ghost">Real evidence</Button>
              <Button disabled={busy} variant="outline" onClick={() => void judge(open.id, 'misleading')} className="border-primary text-primary">Red herring</Button>
              <Button variant="ghost" onClick={() => setOpen(null)} className="col-span-2">Close</Button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
