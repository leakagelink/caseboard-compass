import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Crosshair, Fingerprint, Radar, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MusicControl } from '@/components/GameAudio';
import { LocationStart } from '@/components/LocationStart';
import ghostScene from '@/assets/ghost-intro.jpg';

const SESSION_KEY = 'casezero-opening-v1';

export function GameIntro({ onEnter }: { onEnter: () => void }) {
  const [stage, setStage] = useState<'splash' | 'invite'>('splash');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved === 'done') { onEnter(); return; }
      if (saved === 'invite') setStage('invite');
    } catch { /* Opening still works with browser storage disabled. */ }
  }, [onEnter]);
  function invite() {
    try { sessionStorage.setItem(SESSION_KEY, 'invite'); } catch { /* Optional presentation state. */ }
    setStage('invite');
  }
  function enter() {
    try { sessionStorage.setItem(SESSION_KEY, 'done'); } catch { /* Not player progress. */ }
    onEnter();
  }
  useEffect(() => {
    if (stage !== 'splash') { heading.current?.focus(); return; }
    const timer = window.setTimeout(invite, 4200);
    return () => window.clearTimeout(timer);
  }, [stage]);

  return <main className={`ghost-opening ghost-opening-${stage}`} aria-label="CASE ZERO game opening">
    <div className="intro-art" aria-hidden="true"><img src={ghostScene} alt="" width={1024} height={1536} fetchPriority="high" /><div className="intro-vignette" /></div>
    <div className="intro-rain" aria-hidden="true" />
    <div className="intro-noise scanlines" aria-hidden="true" />
    <div className="intro-scan" aria-hidden="true" />
    <div className="intro-edge intro-edge-left" aria-hidden="true" /><div className="intro-edge intro-edge-right" aria-hidden="true" />
    <header className="intro-header">
      <div className="flex items-center gap-2 text-xs text-ghost"><Fingerprint className="h-6 w-6" /><span className="font-display">CZ / PARANORMAL UNIT</span></div>
      <MusicControl />
    </header>
    <div className="intro-target" aria-hidden="true"><span /><Crosshair className="h-5 w-5" /><span /></div>
    <div className="intro-entity-tag" aria-hidden="true"><span className="signal-live">UNIDENTIFIED ENTITY</span><span>CASE FILE / 001</span></div>

    {stage === 'splash' ? <section key="splash" className="intro-content intro-splash-content">
      <p className="intro-eyebrow"><span />THE DEAD STILL HAVE SECRETS<span /></p>
      <h1 className="intro-title font-display" data-text="CASE ZERO">CASE <span>ZERO</span></h1>
      <p className="intro-tagline">The thief is dead. The case isn’t.</p>
      <div className="intro-boot" role="status"><Radar className="h-4 w-4" /><span>Establishing contact…</span><span className="intro-loading-dots">•••</span></div>
      <div className="intro-progress" aria-hidden="true"><span /></div>
      <Button variant="ghost" className="mt-4 text-xs text-muted-foreground" onClick={invite}>Enter the unknown<ArrowRight /></Button>
    </section> : <section key="invite" className="intro-content intro-invite-content">
      <p className="intro-eyebrow"><Radar className="h-3.5 w-3.5" />YOUR FIRST INVESTIGATION</p>
      <h1 ref={heading} tabIndex={-1} className="intro-question font-display">Kya aap apne area ka<br /><span>raaz khologe?</span></h1>
      <p className="intro-invitation">Live location game try karna chahte ho?</p>
      <div className="intro-mission-trail" aria-hidden="true"><span>FIND THE CLUES</span><ArrowRight /><span>FACE THE GHOST</span><ArrowRight /><span>REVEAL THE TRUTH</span></div>
      <LocationStart invitation onLocated={enter} onSkip={enter} />
      <p className="intro-disclaimer">Fictional cases · Browser practice<br />True spatial AR requires the native phone app.</p>
    </section>}
    <footer className="intro-footer"><span><ShieldCheck className="h-3 w-3" />PLAY SAFE. STAY AWARE.</span><span>DETECTIVE ACCESS / CZ</span></footer>
  </main>;
}