import { createFileRoute, Link } from "@tanstack/react-router";
import { GAME_TITLE } from "@/data/cases";
import { isUnlocked, level, useCases, useSave } from "@/lib/progress";
import { LocationStart } from "@/components/LocationStart";
import { Shell } from "@/components/Shell";
import { Button } from '@/components/ui/button';
import { ArrowUpRight, LockKeyhole, CheckCheck, Radar, Crosshair } from 'lucide-react';
import cityScene from '@/assets/case-city.jpg';
import { useCallback, useState } from 'react';
import { GameIntro } from '@/components/GameIntro';

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CASE ZERO — Enter the Ghost Investigation" },
      { name: "description", content: "Enter CASE ZERO, discover fictional ghost cases in your area, and investigate the secrets of dead thieves." },
      { property: "og:title", content: "CASE ZERO: Ghost Detective" },
      { property: "og:description", content: "Investigate fictional crimes haunted by the ghosts of dead thieves." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CaseMap,
});

function CaseMap() {
  const [entered, setEntered] = useState(false);
  const enter = useCallback(() => setEntered(true), []);
  const { save } = useSave();
  const { cases } = useCases();
  const published = cases.filter((c) => c.status === "published" && (save.selectedArea ? c.campaign === `area:${save.selectedArea}` : !c.campaign));
  const current = published.find((c) => !save.cases[c.id]?.solved && isUnlocked(cases, save, c));

  if (!entered) return <GameIntro onEnter={enter} />;

  return (
    <Shell>
      <p className="signal-live text-[10px] uppercase tracking-[0.3em] text-ghost">{GAME_TITLE}</p>
      <div className="mt-2 flex items-end justify-between">
        <h1 className="font-display text-3xl sm:text-4xl">Case Map</h1>
        <span className="text-xs text-ghost">Lv {level(save.xp)} · {save.xp} XP</span>
      </div>

      <div className="mission-scene relative mt-6 overflow-hidden">
        <img src={cityScene} alt="A fictional spectral thief in a rain-soaked city alley" width={1536} height={1024} className="scene-image absolute inset-0 h-full w-full" />
        <div className="scene-shade absolute inset-0" /><div className="spectral-sweep" />
        <div className="absolute left-5 top-5 flex items-center gap-2 text-[10px] uppercase tracking-widest text-ghost"><Radar className="h-4 w-4" />Fictional case sector</div>
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
          <p className="mb-2 text-[10px] uppercase tracking-widest text-signal">{current ? 'Active investigation' : 'Sector cleared'}</p>
          <h2 className="font-display max-w-lg text-3xl sm:text-4xl">{current?.title ?? 'No unfinished cases'}</h2>
          <p className="mt-2 text-xs text-muted-foreground">{current ? `${current.difficulty} · ${current.rewardXp} XP · ${current.clues.length} clues` : 'Every secret in this sector has been uncovered.'}</p>
          {current && <Button asChild className="mt-5 h-11"><Link to="/case/$caseId" params={{ caseId: current.slug }}><Crosshair />{save.cases[current.id]?.inspected.length ? 'Continue Investigation' : 'Start New Case'}<ArrowUpRight /></Link></Button>}
        </div>
      </div>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_2fr]">
      <div><LocationStart /><div className="mt-6 flex justify-between border-y border-border py-4 text-xs"><span className="text-muted-foreground">CASE ARCHIVE</span><span className="text-ghost">{published.filter(c => save.cases[c.id]?.solved).length} / {published.length} CLOSED</span></div></div>

      <ol className="case-sequence relative space-y-4 border-l border-dashed border-border pl-6">
        {published.map((c, index) => {
          const solved = !!save.cases[c.id]?.solved;
          const open = isUnlocked(cases, save, c);
          const body = (
            <div
              className={`mission-card rounded-md border bg-card p-5 ${solved ? "border-ghost" : open ? "mission-active" : "border-border opacity-60"}`}
            >
              <div className="flex justify-between text-xs">
                <span className="font-display text-ghost">FILE 0{index + 1}</span>
                <span className="flex items-center gap-2 uppercase text-muted-foreground">{solved ? <CheckCheck className="h-4 w-4 text-ghost" /> : open ? <Radar className="h-4 w-4 text-primary" /> : <LockKeyhole className="h-4 w-4" />}{solved ? "Solved" : open ? c.difficulty : "Locked"}</span>
              </div>
              <p className="font-display mt-2 text-xl">{c.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{open ? c.location : "Solve the previous case to unlock."}</p>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[10px] uppercase tracking-widest"><span className="text-signal">{c.rewardXp} XP</span><span className="text-muted-foreground">{c.clues.length} evidence traces</span>{open && <ArrowUpRight className="h-4 w-4 text-ghost" />}</div>
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
      </div>
      <p className="mt-8 text-center text-[11px] text-muted-foreground">
        All cases, people and places are fictional. Play anywhere safe — no travel required.
      </p>
    </Shell>
  );
}
