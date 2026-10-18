import { useState } from 'react';
import { ArrowUpRight, MapPin, LoaderCircle, ShieldCheck } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useGame } from '@/components/GameProvider';
import { Button } from '@/components/ui/button';
import { locationArea } from '@/lib/location-cases';

export function LocationStart({ invitation = false, onLocated, onSkip }: { invitation?: boolean; onLocated?: () => void; onSkip?: () => void }) {
  const { user, busy, authLoading, selectLocation } = useGame();
  const [finding, setFinding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signInNeeded, setSignInNeeded] = useState(false);
  function locate() {
    if (!user) { setSignInNeeded(true); return; }
    if (!navigator.geolocation) { setError('Location is unavailable on this device. Existing cases remain available.'); return; }
    setFinding(true); setError(null);
    navigator.geolocation.getCurrentPosition(position => {
      if (position.coords.accuracy > 1000) { setError('Location is too uncertain. Move to a safe open area and retry.'); setFinding(false); return; }
      void selectLocation(locationArea(position.coords.latitude, position.coords.longitude)).then(saved => {
        if (saved) onLocated?.();
        else setError('Your area could not be saved. Please retry.');
      }).catch(() => setError('Your area could not be saved. Please retry.')).finally(() => setFinding(false));
    }, e => { setFinding(false); setError(e.code === 1 ? 'Location permission denied. Allow location and retry, or play an existing case.' : 'Could not locate you. Retry from a safe place.'); }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  }
  if (invitation) return <div className="intro-choices">
    {signInNeeded && !user ? <>
      <p role="status" className="mb-3 text-sm text-ghost">Detective, sign in to save your location cases.</p>
      <Button asChild className="intro-yes h-14 w-full"><Link to="/auth"><ShieldCheck />Sign in & enter<ArrowUpRight /></Link></Button>
    </> : <Button className="intro-yes h-14 w-full" disabled={busy || finding || authLoading} onClick={locate}>{finding ? <LoaderCircle className="animate-spin" /> : <MapPin />}{finding ? 'Finding your case…' : 'YES — Hunt near me'}<ArrowUpRight /></Button>}
    <Button variant="ghost" className="mt-2 h-11 w-full text-muted-foreground" disabled={finding || busy} onClick={onSkip}>NO — Explore case files</Button>
    {error && <p role="alert" className="mt-2 text-sm text-signal">{error}</p>}
    <p className="mt-3 flex justify-center gap-2 text-[11px] text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 shrink-0" />Approximate area only. No movement tracking.</p>
  </div>;
  return <section className="mt-6 border-y border-border py-5">
    <h2 className="font-display text-xl">Your area’s cold cases</h2>
    <p className="mt-2 text-xs text-muted-foreground">Fictional stories, not reports of real local crimes. Only an approximate area is saved; no movement trail.</p>
    {user ? <Button className="mt-4 w-full" disabled={busy || finding} onClick={locate}><MapPin />{finding ? 'Finding your area…' : 'Find cases at my location'}</Button> : <Button asChild className="mt-4 w-full"><Link to="/auth">Sign in for location cases</Link></Button>}
    {error && <p role="alert" className="mt-3 text-sm text-primary">{error}</p>}
  </section>;
}