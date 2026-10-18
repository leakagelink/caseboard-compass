import { createFileRoute, Link } from "@tanstack/react-router";
import { ACHIEVEMENTS, level, useCases, useSave } from "@/lib/progress";
import { Bar, Section, Shell } from "@/components/Shell";
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Fingerprint, Award } from 'lucide-react';
import ghostImage from '@/assets/ghost.png';

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Detective Profile — Bestiary & Achievements | CASE ZERO" },
      { name: "description", content: "Your detective level, ghost bestiary, evidence history and achievements." },
      { property: "og:title", content: "Detective Profile | CASE ZERO" },
      { property: "og:description", content: "Track XP, ghosts encountered and achievements." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { save, user } = useSave();
  const { cases } = useCases();
  const lv = level(save.xp);
  const evidence = cases.flatMap((c) =>
    c.clues.filter((cl) => cl.relevant && save.cases[c.id]?.verdicts[cl.id] === "relevant").map((cl) => ({ ...cl, caseId: c.id })),
  );

  return (
    <Shell>
      <h1 className="font-display text-3xl">Detective File</h1>
      {user && <p className="mt-2 text-xs text-ghost">{user.user_metadata?.['full_name'] ?? 'Detective'} · Online progress</p>}
      <div className="mt-4 border-y border-ghost py-6">
        <Fingerprint className="mb-4 h-12 w-12 text-ghost" />
        <div className="flex justify-between text-sm"><span>Level {lv}</span><span className="text-ghost">{save.xp} XP</span></div>
        <div className="mt-2"><Bar value={save.xp % 200} max={200} tone="ghost" /></div>
        <p className="mt-2 text-xs text-muted-foreground">
          {cases.filter((c) => save.cases[c.id]?.solved).length}/{cases.length} cases solved · {save.hints} hints left
        </p>
      </div>

      <Section title="Ghost Bestiary">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => {
            const pr = save.cases[c.id];
            const known = !!pr?.deduced;
            return (
              <div key={c.id} className={`mission-card rounded-md border bg-card p-4 ${pr?.solved ? "border-ghost" : "border-border"}`}>
                <div className="relative mb-3 flex h-36 items-center justify-center overflow-hidden border-b border-border"><img src={ghostImage} alt={known ? c.ghost.name : 'Unidentified spectral entity'} width={768} height={1024} loading="lazy" className={`ghost-portrait h-36 w-28 ${known ? '' : 'opacity-25 blur-sm'}`} /><div className="spectral-sweep" /></div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{c.id}</span>
                  <span className={pr?.solved ? "text-ghost" : "text-muted-foreground"}>{pr?.solved ? (c.ghost.mode === "release" ? "Released" : "Banished") : known ? "Encountered" : "Unknown"}</span>
                </div>
                <p className="font-display mt-1 text-lg">{known ? c.ghost.name : "??????"}</p>
                {pr?.solved && <><p className="text-xs text-muted-foreground">True identity: {c.ghost.trueName} · {c.ghost.temperament}</p><Button asChild variant="outline" className="mt-3"><Link to="/case/$caseId/hunt" params={{ caseId: c.slug }}>Read / listen to story</Link></Button></>}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Achievements">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {ACHIEVEMENTS.map((a) => {
            const got = a.test(save);
            return (
              <div key={a.id} className={`rounded-md border p-3 ${got ? "border-primary bg-card" : "border-border opacity-50"}`}>
                <Award className={`mb-3 h-7 w-7 ${got ? 'text-signal' : 'text-muted-foreground'}`} />
                <p className="font-display text-sm">{got ? "◆ " : "◇ "}{a.name}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{a.desc}</p>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Evidence Collected">
        {evidence.length === 0 ? (
          <p className="text-sm text-muted-foreground">No confirmed evidence yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {evidence.map((e) => <li key={e.id}><span className="text-ghost">{e.caseId}</span> · {e.name}</li>)}
          </ul>
        )}
      </Section>

      <Section title="Settings & Privacy">
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li>Camera is only requested when you start an AR hunt and is never recorded.</li>
          <li>Location is requested only when you choose area cases. An approximate area is saved online; no movement trail.</li>
          <li>Old device-only prototype saves remain on that device; online rewards start with a new investigation.</li>
        </ul>
        {user && <Button variant="outline" className="mt-4" onClick={() => void supabase.auth.signOut()}>Sign out</Button>}
      </Section>
    </Shell>
  );
}
