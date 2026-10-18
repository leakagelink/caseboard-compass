import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CASES } from "@/data/cases";
import { isUnlocked, useCases, useSave } from "@/lib/progress";
import { Section, Shell } from "@/components/Shell";

export const Route = createFileRoute("/case/$caseId/")({
  loader: ({ params }) => {
    const c = CASES.find((x) => x.slug === params.caseId);
    if (!c && /^loc-[a-z0-9]+-[1-3]$/.test(params.caseId)) return { title: 'Location case', id: params.caseId, ghost: 'Location ghost' };
    if (!c) throw notFound();
    return { title: c.title, id: c.id };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.id} Dossier — ${loaderData.title} | CASE ZERO` : "Case file | CASE ZERO" },
      { name: "description", content: "Case briefing: timeline, entity profile and objectives." },
      { property: "og:title", content: loaderData ? `${loaderData.title} — Case Dossier` : "Case Dossier" },
      { property: "og:description", content: "Open the case file and begin the investigation." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dossier,
});

function Dossier() {
  const { caseId } = Route.useParams();
  const { cases } = useCases();
  const { save, loading } = useSave();
  const c = cases.find((x) => x.slug === caseId);
  if (!c && loading) return <p role="status">Loading case…</p>;
  if (!c) throw notFound();
  const p = save.cases[c.id];
  const open = isUnlocked(cases, save, c);

  return (
    <Shell>
      <Link to="/" className="text-xs text-muted-foreground">← Case Map</Link>
      <div className="mt-4 rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-eerie)]">
        <div className="flex items-center justify-between text-xs">
          <span className="font-display text-ghost">{c.id}</span>
          <span className="rounded border border-primary px-2 py-0.5 uppercase text-primary">{p?.solved ? "Closed" : "Open"}</span>
        </div>
        <h1 className="font-display mt-3 text-3xl">{c.title}</h1>
        <p className="mt-1 text-xs text-muted-foreground">{c.location} · {c.date}</p>
        <p className="mt-4 text-sm leading-relaxed text-card-foreground">{c.summary}</p>
        <p className="mt-3 text-xs text-muted-foreground">Difficulty: <span className="text-ghost">{c.difficulty}</span> · Reward {c.rewardXp} XP</p>
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
        <p className="text-xs text-muted-foreground">Identity: {p?.solved ? c.ghost.trueName : "classified until case solved"}</p>
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

      <div className="mt-8 space-y-3">
        {!open ? (
          <p className="text-center text-sm text-muted-foreground">This case is locked. Solve the previous case first.</p>
        ) : (
          <>
            <Link to="/case/$caseId/evidence" params={{ caseId }} className="block rounded-md bg-primary py-3 text-center font-display text-primary-foreground">
              {p?.inspected.length ? "Continue Investigation" : "Open Evidence Board"}
            </Link>
            {p?.deduced && (
              <Link to="/case/$caseId/hunt" params={{ caseId }} className="block rounded-md border border-ghost py-3 text-center font-display text-ghost">
                {p.solved ? "Replay Ghost Encounter" : "Begin Ghost Encounter"}
              </Link>
            )}
          </>
        )}
      </div>
    </Shell>
  );
}
