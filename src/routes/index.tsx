import { createFileRoute, Link } from "@tanstack/react-router";
import { case001, GAME_TITLE } from "@/data/case001";
import { useProgress } from "@/lib/progress";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Case 001 Dossier — The Midnight Heist | CASE ZERO" },
      { name: "description", content: "Open the case file for The Midnight Heist: timeline, ghost profile and objectives." },
      { property: "og:title", content: "Case 001 Dossier — The Midnight Heist" },
      { property: "og:description", content: "A dead thief, a stolen relic and clocks that stop at midnight." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dossier,
});

function Dossier() {
  const c = case001;
  const { p } = useProgress();
  const started = p.inspected.length > 0;
  return (
    <main className="fog mx-auto min-h-screen max-w-md px-5 pb-28 pt-8">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{GAME_TITLE}</p>
      <div className="mt-6 rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-eerie)]">
        <div className="flex items-center justify-between text-xs">
          <span className="font-display text-ghost">{c.id}</span>
          <span className="rounded border border-primary px-2 py-0.5 uppercase text-primary">{c.status}</span>
        </div>
        <h1 className="font-display mt-3 text-3xl text-foreground">{c.title}</h1>
        <p className="mt-1 text-xs text-muted-foreground">{c.location} · {c.date}</p>
        <p className="mt-4 text-sm leading-relaxed text-card-foreground">{c.summary}</p>
        <p className="mt-3 text-xs text-muted-foreground">Difficulty: <span className="text-ghost">{c.difficulty}</span></p>
      </div>

      <Section title="Timeline">
        <ol className="space-y-3 border-l border-border pl-4">
          {c.timeline.map((t) => (
            <li key={t.time}>
              <span className="font-display text-ghost">{t.time}</span>
              <p className="text-sm text-card-foreground">{t.event}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Entity Profile">
        <p className="font-display text-xl text-primary">{c.ghost.name}</p>
        <p className="text-xs text-muted-foreground">Identity: classified until case solved</p>
        <p className="mt-2 text-sm">{c.ghost.temperament}</p>
        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          {c.ghost.abilities.map((a) => <li key={a}>◆ {a}</li>)}
        </ul>
      </Section>

      <Section title="Objectives">
        <ul className="space-y-2 text-sm">
          {c.objectives.map((o, i) => <li key={o}><span className="text-ghost">0{i + 1}</span> {o}</li>)}
        </ul>
      </Section>

      <p className="mt-6 text-center text-[11px] text-muted-foreground">All people, places and crimes in this case are fictional.</p>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 p-4 backdrop-blur">
        <Link to="/evidence" className="mx-auto block max-w-md rounded-md bg-primary py-3 text-center font-display text-primary-foreground">
          {started ? "Continue Investigation" : "Open Evidence Board"}
        </Link>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}
