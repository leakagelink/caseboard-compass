import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CASES } from "@/data/cases";
import { completeCase, emptyCase, useCases, useSave } from "@/lib/progress";
import { Bar } from "@/components/Shell";
import ghostImg from "@/assets/ghost.png";

export const Route = createFileRoute("/case/$caseId/hunt")({
  loader: ({ params }) => {
    const c = CASES.find((x) => x.slug === params.caseId);
    if (!c) throw notFound();
    return { title: c.title, ghost: c.ghost.name };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Ghost Encounter — ${loaderData?.ghost ?? "Entity"} | CASE ZERO` },
      { name: "description", content: "Scan, dodge and confront the ghost with the spectral scanner." },
      { property: "og:title", content: `Ghost Encounter — ${loaderData?.title ?? "Case"}` },
      { property: "og:description", content: "Confront the ghost through your camera or in practice mode." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Hunt,
});

type Phase = "intro" | "fight" | "won" | "lost";
const PLAYER_MAX = 100;

function Hunt() {
  const { caseId } = Route.useParams();
  const { cases } = useCases();
  const c = cases.find((x) => x.slug === caseId)!;
  const { save, update } = useSave();
  const p = save.cases[c.id] ?? emptyCase;

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camera, setCamera] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);

  const [phase, setPhase] = useState<Phase>("intro");
  const [ghostHp, setGhostHp] = useState(c.ghost.hp);
  const [hp, setHp] = useState(PLAYER_MAX);
  const [pos, setPos] = useState({ x: 50, y: 45 });
  const [revealed, setRevealed] = useState(false);
  const [vanished, setVanished] = useState(false);
  const [scanCd, setScanCd] = useState(0);
  const [atkCd, setAtkCd] = useState(0);
  const [dodgeCd, setDodgeCd] = useState(0);
  const [dodging, setDodging] = useState(false);
  const [flash, setFlash] = useState<"hit" | "hurt" | null>(null);
  const [log, setLog] = useState("Sweep the area with your scanner.");
  const [healed, setHealed] = useState(false);
  const dodgingRef = useRef(false);
  dodgingRef.current = dodging;

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamera(false);
  };
  useEffect(() => stopCamera, []);

  const startAR = async () => {
    setCamError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("unsupported");
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = s;
      setCamera(true);
      begin();
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          void videoRef.current.play();
        }
      });
    } catch (e) {
      setCamError(
        (e as Error).name === "NotAllowedError"
          ? "Camera permission was denied. You can still play in practice mode."
          : "Camera isn't available on this device. Try practice mode.",
      );
    }
  };

  const begin = () => {
    setGhostHp(c.ghost.hp); setHp(PLAYER_MAX); setRevealed(false); setVanished(false);
    setScanCd(0); setAtkCd(0); setDodgeCd(0); setHealed(false);
    setLog("Sweep the area with your scanner."); setPhase("fight");
  };

  // Ghost movement + attacks + cooldown ticks
  useEffect(() => {
    if (phase !== "fight") return;
    const move = setInterval(() => setPos({ x: 20 + Math.random() * 60, y: 25 + Math.random() * 40 }), 1800);
    const tick = setInterval(() => {
      setScanCd((v) => Math.max(0, v - 100)); setAtkCd((v) => Math.max(0, v - 100)); setDodgeCd((v) => Math.max(0, v - 100));
    }, 100);
    const attack = setInterval(() => {
      if (Math.random() < 0.25) {
        setVanished(true); setRevealed(false); setLog(`${c.ghost.name} skips out of sight!`);
        setTimeout(() => setVanished(false), 2000);
        return;
      }
      if (dodgingRef.current) { setLog("Dodged!"); return; }
      setHp((h) => h - c.ghost.power);
      setFlash("hurt"); setTimeout(() => setFlash(null), 250);
      setLog(`${c.ghost.name} strikes! −${c.ghost.power}`);
    }, c.ghost.attackEvery);
    return () => { clearInterval(move); clearInterval(tick); clearInterval(attack); };
  }, [phase, c.ghost]);

  useEffect(() => {
    if (phase !== "fight") return;
    if (hp <= 0) { setPhase("lost"); stopCamera(); }
    else if (ghostHp <= 0) {
      setPhase("won"); stopCamera();
      update((s) => completeCase(s, c, hp >= 70));
    }
  }, [hp, ghostHp, phase]);

  const scan = () => {
    if (scanCd > 0) return;
    setScanCd(5000);
    if (vanished) { setLog("Nothing… it's hiding."); return; }
    setRevealed(true); setLog("Entity revealed! Strike now.");
    setTimeout(() => setRevealed(false), 3000);
  };
  const attack = () => {
    if (atkCd > 0) return;
    setAtkCd(700);
    if (!revealed || vanished) { setLog("You can't hit what you can't see. Scan first."); return; }
    const dmg = c.ghost.mode === "release" ? 18 : 15;
    setGhostHp((g) => {
      let next = g - dmg;
      if (c.id === "CASE-003" && !healed && next < c.ghost.hp * 0.3 && next > 0) {
        setHealed(true); setLog("Undertow! The Warden regains strength."); next += 40;
      } else setLog(c.ghost.mode === "release" ? `Truth lands. −${dmg}` : `Direct hit! −${dmg}`);
      return next;
    });
    setFlash("hit"); setTimeout(() => setFlash(null), 200);
  };
  const dodge = () => {
    if (dodgeCd > 0) return;
    setDodgeCd(4000); setDodging(true);
    setTimeout(() => setDodging(false), 1200);
  };

  const actionLabel = c.ghost.mode === "release" ? "Expose" : "Banish";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background: live camera or practice fog */}
      {camera ? (
        <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="fog absolute inset-0" />
      )}
      <div className="scanlines pointer-events-none absolute inset-0" />
      {flash === "hurt" && <div className="pointer-events-none absolute inset-0 bg-primary/30" />}

      {phase === "fight" && (
        <>
          {/* Ghost */}
          <img
            src={ghostImg}
            alt={c.ghost.name}
            width={768}
            height={1024}
            className="pointer-events-none absolute w-40 -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              opacity: vanished ? 0 : revealed ? 0.95 : 0.12,
              filter: flash === "hit" ? "brightness(2.5)" : revealed ? "drop-shadow(0 0 20px var(--ghost))" : "blur(3px)",
            }}
          />
          {/* Reticle */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ghost/60">
            <div className="absolute left-1/2 top-0 h-full w-px bg-ghost/40" />
            <div className="absolute left-0 top-1/2 h-px w-full bg-ghost/40" />
          </div>
        </>
      )}

      {/* HUD */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-4 py-4">
        <div className="flex items-center justify-between text-xs">
          <Link to="/case/$caseId" params={{ caseId }} onClick={stopCamera} className="text-muted-foreground">← Exit</Link>
          <span className="font-display text-ghost">SPECTRAL SCANNER · {camera ? "AR CAM" : "PRACTICE"}</span>
        </div>

        {phase === "fight" && (
          <div className="mt-3 space-y-2 rounded-md bg-background/70 p-3 backdrop-blur">
            <div className="flex justify-between text-[11px]"><span className="text-primary">{c.ghost.name}</span><span>{Math.max(0, ghostHp)}/{c.ghost.hp}</span></div>
            <Bar value={ghostHp} max={c.ghost.hp} tone="primary" />
            <div className="flex justify-between text-[11px]"><span className="text-ghost">You</span><span>{Math.max(0, hp)}/{PLAYER_MAX}</span></div>
            <Bar value={hp} max={PLAYER_MAX} tone="ghost" />
            <p className="pt-1 text-xs text-muted-foreground" aria-live="polite">{dodging ? "Evading…" : log}</p>
          </div>
        )}

        <div className="flex-1" />

        {phase === "intro" && (
          <div className="rounded-lg border border-border bg-card/90 p-5 backdrop-blur">
            <p className="text-xs uppercase tracking-widest text-primary">{c.id} · Final encounter</p>
            <h1 className="font-display mt-2 text-2xl">{c.ghost.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Scan to reveal the entity, then {actionLabel.toLowerCase()} it while visible. Dodge to avoid its strikes.
            </p>
            {!p.deduced && <p className="mt-3 text-sm text-primary">Finish the evidence board first.</p>}
            {camError && <p className="mt-3 text-sm text-primary">{camError}</p>}
            <div className="mt-4 space-y-2">
              <button disabled={!p.deduced} onClick={startAR} className="w-full rounded-md bg-primary py-3 font-display text-primary-foreground disabled:opacity-40">
                Start AR Hunt (uses camera)
              </button>
              <button disabled={!p.deduced} onClick={begin} className="w-full rounded-md border border-ghost py-3 font-display text-ghost disabled:opacity-40">
                Practice Mode (no camera)
              </button>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Camera video stays on your device and is never recorded. Play in a safe, open indoor space. This web version is a prototype — full 3D AR tracking comes with the mobile app.
            </p>
          </div>
        )}

        {phase === "fight" && (
          <div className="grid grid-cols-3 gap-3 pb-2">
            <HudButton label="Scan" cd={scanCd} max={5000} onClick={scan} tone="ghost" />
            <HudButton label={actionLabel} cd={atkCd} max={700} onClick={attack} tone="primary" big />
            <HudButton label="Dodge" cd={dodgeCd} max={4000} onClick={dodge} tone="ghost" />
          </div>
        )}

        {phase === "lost" && (
          <div className="rounded-lg border border-primary bg-card/95 p-5">
            <p className="text-xs uppercase tracking-widest text-primary">You were overwhelmed</p>
            <p className="mt-2 text-sm">{c.ghost.name} drives you from the scene. Catch your breath and try again.</p>
            <button onClick={begin} className="mt-4 w-full rounded-md bg-primary py-3 font-display text-primary-foreground">Retry (practice)</button>
            <button onClick={() => { setPhase("intro"); }} className="mt-2 w-full rounded-md border border-border py-3 text-sm">Back to briefing</button>
          </div>
        )}

        {phase === "won" && (
          <div className="max-h-[80vh] overflow-y-auto rounded-lg border border-ghost bg-card/95 p-5 shadow-[var(--shadow-eerie)]">
            <p className="text-xs uppercase tracking-widest text-ghost">Case Solved · {c.id}</p>
            <h1 className="font-display mt-2 text-2xl">The ghost was {c.ghost.trueName}</h1>
            <p className="mt-3 text-sm leading-relaxed">{c.reveal}</p>
            <p className="mt-4 text-sm text-ghost">+{c.rewardXp} XP{hp >= 70 ? " · +50 flawless bonus" : ""}</p>
            <p className="text-[11px] text-muted-foreground">Rewards are only granted on your first solve.</p>
            <div className="mt-4 space-y-2">
              <Link to="/" className="block rounded-md bg-primary py-3 text-center font-display text-primary-foreground">Back to Case Map</Link>
              <Link to="/profile" className="block rounded-md border border-border py-3 text-center text-sm">View Bestiary</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HudButton({ label, cd, max, onClick, tone, big }: { label: string; cd: number; max: number; onClick: () => void; tone: "ghost" | "primary"; big?: boolean }) {
  const ready = cd === 0;
  return (
    <button
      onClick={onClick}
      disabled={!ready}
      className={`relative overflow-hidden rounded-full border-2 font-display ${big ? "h-20" : "h-16 self-end"} ${
        tone === "primary" ? "border-primary bg-primary/20 text-primary-foreground" : "border-ghost bg-background/60 text-ghost"
      } ${ready ? "" : "opacity-60"}`}
    >
      <span className="absolute inset-x-0 bottom-0 bg-foreground/15" style={{ height: `${(cd / max) * 100}%` }} />
      <span className="relative">{label}</span>
    </button>
  );
}
