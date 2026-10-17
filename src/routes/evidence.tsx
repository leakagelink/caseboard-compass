import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { case001, type Clue } from "@/data/case001";
import { useProgress, type Verdict } from "@/lib/progress";

export const Route = createFileRoute("/evidence")({
  head: () => ({
    meta: [
      { title: "Evidence Board — Case 001 | CASE ZERO" },
      { name: "description", content: "Inspect clues, reject the red herrings and name the culprit of The Midnight Heist." },
      { property: "og:title", content: "Evidence Board — The Midnight Heist" },
      { property: "og:description", content: "Sort real evidence from misleading clues and make your deduction." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Board,
});

function Board() {
  const c = case001;
  const { p, update, reset } = useProgress();
  const [open, setOpen] = useState<Clue | null>(null);
  const [wrong, setWrong] = useState(false);

  const allInspected = c.clues.every((cl) => p.inspected.includes(cl.id));
  const allJudged = c.clues.every((cl) => p.verdicts[cl.id]);
  const correctSort = c.clues.every((cl) => (p.verdicts[cl.id] === "relevant") === cl.relevant);
  const solved = p.accused === c.culprit;

  const inspect = (cl: Clue) => {
    setOpen(cl);
    update((s) => (s.inspected.includes(cl.id) ? s : { ...s, inspected: [...s.inspected, cl.id] }));
  };
  const judge = (id: string, v: Verdict) => {
    setWrong(false);
    update((s) => ({ ...s, verdicts: { ...s.verdicts, [id]: v } }));
  };

  return (
    <main className="fog mx-auto min-h-screen max-w-md px-5 pb-16 pt-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-xs text-muted-foreground">← Dossier</Link>
        <span className="font-display text-xs text-ghost">{c.id}</span>
      </div>
      <h1 className="font-display mt-4 text-2xl">Evidence Board</h1>
      <p className="text-xs text-muted-foreground">
        Inspected {p.inspected.length}/{c.clues.length} · Sorted {Object.keys(p.verdicts).length}/{c.clues.length}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {c.clues.map((cl, i) => {
          const v = p.verdicts[cl.id];
          const seen = p.inspected.includes(cl.id);
          return (
            <button
              key={cl.id}
              onClick={() => inspect(cl)}
              style={{ rotate: `${i % 2 ? 1.5 : -1.5}deg` }}
              className={`rounded-md border bg-card p-3 text-left transition hover:border-ghost ${
                v === "relevant" ? "border-ghost" : v === "misleading" ? "border-primary opacity-60" : "border-border"
              }`}
            >
              <span className="text-[10px] uppercase text-muted-foreground">{cl.location}</span>
              <p className="font-display mt-1 text-sm leading-tight">{cl.name}</p>
              <p className="mt-2 text-[10px] text-muted-foreground">
                {v ? (v === "relevant" ? "◆ Evidence" : "✕ Red herring") : seen ? "Inspected" : "Tap to inspect"}
              </p>
            </button>
          );
        })}
      </div>

      {allInspected && allJudged && !correctSort && (
        <p className="mt-5 rounded border border-primary p-3 text-sm text-primary">
          Something doesn't add up. Re-examine your sorting — the ghost knows when you're wrong.
        </p>
      )}

      {allInspected && allJudged && correctSort && !solved && (
        <section className="mt-6 rounded-lg border border-ghost bg-card p-4">
          <h2 className="font-display text-lg">Deduction</h2>
          <p className="text-sm text-muted-foreground">Who took the Obsidian Reliquary?</p>
          <div className="mt-3 space-y-2">
            {c.suspects.map((s) => (
              <button
                key={s.id}
                onClick={() => (s.id === c.culprit ? update((x) => ({ ...x, accused: s.id })) : setWrong(true))}
                className="w-full rounded border border-border p-3 text-left hover:border-ghost"
              >
                <span className="font-display">{s.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">{s.role}</span>
              </button>
            ))}
          </div>
          {wrong && <p className="mt-3 text-sm text-primary">The clocks tick louder. That's not who the evidence points to.</p>}
        </section>
      )}

      {solved && (
        <section className="mt-6 rounded-lg border border-primary bg-card p-5 shadow-[var(--shadow-eerie)]">
          <p className="text-xs uppercase tracking-widest text-primary">Case Solved</p>
          <h2 className="font-display mt-2 text-xl">The ghost was {c.ghost.trueName}</h2>
          <p className="mt-3 text-sm leading-relaxed">{c.reveal}</p>
          <p className="mt-4 text-xs text-muted-foreground">The final ghost encounter and Case 002 unlock arrive in the next build.</p>
          <button onClick={reset} className="mt-4 text-xs text-ghost underline">Replay case</button>
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
              <button onClick={() => { judge(open.id, "relevant"); setOpen(null); }} className="rounded border border-ghost py-3 text-sm text-ghost">Real evidence</button>
              <button onClick={() => { judge(open.id, "misleading"); setOpen(null); }} className="rounded border border-primary py-3 text-sm text-primary">Red herring</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
