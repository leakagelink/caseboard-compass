import { createFileRoute, Link } from "@tanstack/react-router";
import { GAME_TITLE } from "@/data/cases";
import { isUnlocked, level, useCases, useSave } from "@/lib/progress";
import { LocationStart } from "@/components/LocationStart";
import { Shell } from "@/components/Shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CASE ZERO: Ghost Detective — Case Map" },
      { name: "description", content: "Choose your next haunted case. Solve each crime to unlock the next ghost." },
      { property: "og:title", content: "CASE ZERO: Ghost Detective" },
      { property: "og:description", content: "Investigate fictional crimes haunted by the ghosts of dead thieves." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CaseMap,
});

function CaseMap() {
  const { save } = useSave();
  const { cases } = useCases();
  const published = cases.filter((c) => c.status === "published" && (!c.campaign || c.campaign === ));
  const current = published.find((c) => !save.cases[c.id]?.solved && isUnlocked(cases, save, c));

  return (
    <Shell>
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{GAME_TITLE}</p>
      <div className="mt-2 flex items-end justify-between">
        <h1 className="font-display text-3xl">Case Map</h1>
        <span className="text-xs text-ghost">Lv {level(save.xp)} · {save.xp} XP</span>
      </div>

      <LocationStart />
      {current && (
        <Link
          to="/case/$caseId"
          params={{ caseId: current.slug }}
          className="mt-5 block rounded-md bg-primary py-3 text-center font-display text-primary-foreground"
        >
          {save.cases[current.id]?.inspected.length ? "Continue Investigation" : "Start New Case"} — {current.id}
        </Link>
      )}

      <ol className="relative mt-8 space-y-6 border-l border-dashed border-border pl-6">
        {published.map((c) => {
          const solved = !!save.cases[c.id]?.solved;
          const open = isUnlocked(cases, save, c);
          const body = (
            <div
              className={`rounded-lg border bg-card p-4 ${solved ? "border-ghost" : open ? "border-primary shadow-[var(--shadow-eerie)]" : "border-border opacity-50"}`}
            >
              <div className="flex justify-between text-xs">
                <span className="font-display text-ghost">{c.id}</span>
                <span className="uppercase text-muted-foreground">{solved ? "Solved" : open ? c.difficulty : "Locked"}</span>
              </div>
              <p className="font-display mt-2 text-xl">{c.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{open ? c.location : "Solve the previous case to unlock."}</p>
            </div>
          );
          return (
            <li key={c.id} className="relative">
              <span className={`absolute -left-[31px] top-5 h-3 w-3 rounded-full ${solved ? "bg-ghost" : open ? "bg-primary" : "bg-muted"}`} />
              {open ? <Link to="/case/$caseId" params={{ caseId: c.slug }}>{body}</Link> : body}
            </li>
          );
        })}
      </ol>
      <p className="mt-8 text-center text-[11px] text-muted-foreground">
        All cases, people and places are fictional. Play anywhere safe — no travel required.
      </p>
    </Shell>
  );
}
