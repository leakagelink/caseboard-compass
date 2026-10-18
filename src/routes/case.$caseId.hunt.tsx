import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CASES, type GameCase } from "@/data/cases";
import { StoryPlayback } from '@/components/StoryPlayback';
import { emptyCase, isUnlocked, useCases, useSave } from "@/lib/progress";
import { Bar } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Radar, Shield, Zap, Pause, Play } from "lucide-react";
import ghostImg from "@/assets/ghost.png";
import { MusicControl } from '@/components/GameAudio';

export const Route = createFileRoute("/case/$caseId/hunt")({
  loader: ({ params }) => {
    const c = CASES.find((x) => x.slug === params.caseId);
    if (!c && /^loc-[a-z0-9]+-[1-3]$/.test(params.caseId)) return { title: 'Location case', id: params.caseId, ghost: 'Location ghost' };
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

function Hunt() {
  const { caseId } = Route.useParams();
  const { cases, loading } = useSave();
  const c = cases.find(x => x.slug === caseId);
  if (loading) return <p role="status">Loading encounter…</p>;
  if (!c) throw notFound();
  return <HuntReady key={c.id} c={c} />;
}

function HuntReady({ c }: { c: GameCase }) {
  const { caseId } = Route.useParams();
  const { cases } = useCases();
  const { save, act, user, loading, busy, error, retry } = useSave();
  const p = save.cases[c.id] ?? emptyCase;
  const e = save.encounters?.[c.id];
  const [started, setStarted] = useState(false);
  const [camera, setCamera] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [now, setNow] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const activeRef = useRef(true);
  const requestRef = useRef(0);
  const busyRef = useRef(false);
  busyRef.current = busy;
  const actRef = useRef(act); actRef.current = act;
  const phase = p.solved && !started ? 'won' : e?.phase === 'paused' ? 'paused' : started ? e?.phase ?? 'intro' : 'intro';
  const stopCamera = () => { requestRef.current += 1; streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; setCamera(false); };
  useEffect(() => { activeRef.current = true; return () => { activeRef.current = false; requestRef.current += 1; streamRef.current?.getTracks().forEach(t => t.stop()); void audioRef.current?.close(); }; }, []);
  useEffect(() => {
    if (!camera || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    void videoRef.current.play().catch(() => { setCamError('Camera playback failed. Practice mode is still available.'); stopCamera(); });
  }, [camera]);
  useEffect(() => {
    if (phase !== 'fight') return;
    const clock = setInterval(() => setNow(Date.now()), 100);
    const tick = setInterval(() => { if (!busyRef.current) void actRef.current({ caseId: c.id, kind: 'tick' }); }, 1200);
    return () => { clearInterval(clock); clearInterval(tick); };
  }, [phase, c.id]);
  useEffect(() => { if (phase === 'won' || phase === 'lost') stopCamera(); }, [phase]);
  const sound = (frequency: number) => {
    if (muted) return;
    try { audioRef.current ??= new AudioContext(); const ctx = audioRef.current; void ctx.resume(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.frequency.value = frequency; gain.gain.setValueAtTime(0.045, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18); osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.18); } catch { /* Sound is optional; gameplay remains available. */ }
  };
  const begin = async () => { sound(180); const result = await act({ caseId: c.id, kind: 'start' }); if (result && activeRef.current) { setNow(Date.now()); setStarted(true); } return Boolean(result); };
  const pause = async () => { if (await act({ caseId: c.id, kind: 'pause' })) stopCamera(); };
  const resume = async () => { if (await act({ caseId: c.id, kind: 'resume' })) { setNow(Date.now()); setStarted(true); } };
  const startAR = async () => {
    setRequesting(true); setCamError(null); const request = ++requestRef.current;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      if (!activeRef.current || request !== requestRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      if (await begin()) setCamera(true); else stopCamera();
    } catch (err) {
      if (activeRef.current) setCamError(err instanceof DOMException && err.name === 'NotAllowedError' ? 'Camera permission was denied. Use practice mode or allow the camera and retry.' : 'Camera is unavailable. You can still play in practice mode.');
    } finally { if (activeRef.current) setRequesting(false); }
  };
  const command = async (kind: 'scan' | 'strike' | 'dodge') => { sound(kind === 'scan' ? 650 : kind === 'strike' ? 110 : 320); await act({ caseId: c.id, kind }); };
  const allowed = Boolean(user && p.deduced && isUnlocked(cases, save, c));
  const revealed = Boolean(e && now < e.revealedUntil);
  const cooldown = (at: number, duration: number) => Math.max(0, at + duration - now);
  const actionLabel = c.ghost.mode === 'release' ? 'Expose' : 'Banish';
  return <div className="relative min-h-screen overflow-hidden bg-background">
    {camera ? <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover" /> : <div className="fog absolute inset-0" />}
    <div className="scanlines pointer-events-none absolute inset-0" />
    {phase === 'fight' && <><img src={ghostImg} alt={c.ghost.name} width={768} height={1024} className={`ghost-entity pointer-events-none absolute left-1/2 top-[45%] w-40 -translate-x-1/2 -translate-y-1/2 ${revealed ? 'opacity-95' : 'opacity-10 blur-sm'}`} /><div className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ghost/60" /></>}
    <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-4 py-4">
      <div className="mb-1 flex justify-end"><MusicControl /></div>
      <div className="flex items-center justify-between gap-2 text-xs"><Link to="/case/$caseId" params={{ caseId }} onClick={stopCamera} className="text-muted-foreground">← Exit</Link><span className="font-display text-ghost">SCANNER · {camera ? 'CAMERA OVERLAY' : 'PRACTICE'}</span><Button variant="ghost" size="icon" title={muted ? 'Enable sound' : 'Mute sound'} aria-label={muted ? 'Enable sound' : 'Mute sound'} onClick={() => setMuted(!muted)}>{muted ? <VolumeX /> : <Volume2 />}</Button></div>
      {error && <div role="alert" className="mt-3 bg-background/90 p-3 text-sm text-primary"><p>{error}</p><Button variant="outline" size="sm" onClick={retry}>Retry connection</Button></div>}
      {phase === 'fight' && <div className="mt-2 flex justify-end"><Button variant="outline" size="icon" aria-label="Pause encounter" title="Pause encounter" disabled={busy} onClick={() => void pause()}><Pause /></Button></div>}
      {phase === 'fight' && e && <div className="mt-3 space-y-2 rounded-md bg-background/80 p-3 backdrop-blur"><div className="flex justify-between text-xs"><span className="text-primary">{c.ghost.name}</span><span>{e.ghostHp}/{c.ghost.hp}</span></div><Bar value={e.ghostHp} max={c.ghost.hp} tone="primary" /><div className="flex justify-between text-xs"><span className="text-ghost">You</span><span>{e.hp}/100</span></div><Bar value={e.hp} max={100} tone="ghost" /><p aria-live="polite" className="min-h-10 pt-1 text-xs text-muted-foreground">{e.log}</p></div>}
      <div className="flex-1" />
      {phase === 'paused' && <section className="border-t border-ghost bg-background/95 py-6"><h1 className="font-display text-2xl">Encounter paused</h1><p className="mt-3 text-sm text-muted-foreground">Health and combat timers are frozen. Resume within 15 minutes; up to 5 pauses per attempt.</p><Button disabled={busy} onClick={() => void resume()} className="mt-4 w-full"><Play />Resume in practice mode</Button></section>}
      {phase === 'intro' && <section className="border-t border-ghost bg-background/90 py-6"><p className="text-xs uppercase text-primary">{c.id} · Final encounter</p><h1 className="font-display mt-2 text-2xl">{c.ghost.name}</h1>{loading ? <p role="status" className="mt-3">Loading encounter…</p> : !allowed && <p className="mt-3 text-sm text-primary">{!user ? 'Sign in to hunt.' : !isUnlocked(cases, save, c) ? 'This case is locked or unpublished.' : 'Finish the evidence board first.'}</p>}{camError && <p role="alert" className="mt-3 text-sm text-primary">{camError}</p>}<div className="mt-4 space-y-2"><Button disabled={!allowed || busy || requesting} onClick={() => void startAR()} className="h-12 w-full">{requesting ? 'Opening camera…' : 'Start camera encounter'}</Button><Button disabled={!allowed || busy || requesting} variant="outline" onClick={() => void begin()} className="h-12 w-full border-ghost text-ghost">Practice Mode (no camera)</Button>{!user && <Button asChild variant="outline" className="w-full"><Link to="/auth">Sign in</Link></Button>}</div><p className="mt-3 text-xs text-muted-foreground">Camera video stays on your device and is never recorded. Stay in a safe indoor space. Full 3D AR tracking belongs to the mobile version.</p></section>}
      {phase === 'fight' && e && <div className="grid grid-cols-3 gap-3 pb-2"><Button aria-label="Scan" disabled={busy || cooldown(e.scanAt,5000)>0} variant="outline" onClick={() => void command('scan')} className="h-16 flex-col border-ghost text-ghost"><Radar /><span>{cooldown(e.scanAt,5000)>0 ? `${Math.ceil(cooldown(e.scanAt,5000)/1000)}s` : 'Scan'}</span></Button><Button disabled={busy || cooldown(e.strikeAt,700)>0} onClick={() => void command('strike')} className="h-16 flex-col"><Zap />{actionLabel}</Button><Button aria-label="Dodge" disabled={busy || cooldown(e.dodgeAt,4000)>0} variant="outline" onClick={() => void command('dodge')} className="h-16 flex-col border-ghost text-ghost"><Shield /><span>{cooldown(e.dodgeAt,4000)>0 ? `${Math.ceil(cooldown(e.dodgeAt,4000)/1000)}s` : 'Dodge'}</span></Button></div>}
      {phase === 'lost' && <section className="border-t border-primary bg-background/95 py-6"><h1 className="font-display text-2xl">You were overwhelmed</h1><p className="mt-3 text-sm">Catch your breath and try again.</p><Button disabled={busy} onClick={() => void begin()} className="mt-4 w-full">Retry (practice)</Button><Button variant="outline" className="mt-2 w-full" onClick={() => setStarted(false)}>Back to briefing</Button></section>}
      {phase === 'won' && <section className="max-h-[80vh] overflow-y-auto border-t border-ghost bg-background/95 py-6"><p className="text-xs uppercase text-ghost">Case Solved · {c.id}</p><h1 className="font-display mt-2 text-2xl">The ghost was {c.ghost.trueName}</h1><StoryPlayback text={c.reveal} /><p className="mt-4 text-sm text-ghost">{save.xp} XP total · Saved online</p><p className="mt-1 text-xs text-muted-foreground">Rewards are granted only on your first solve.</p><Button asChild className="mt-4 w-full"><Link to="/">Back to Case Map</Link></Button><Button asChild variant="outline" className="mt-2 w-full"><Link to="/profile">View Bestiary</Link></Button></section>}
    </div>
  </div>;
}
