import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useGame } from '@/components/GameProvider';
import { Button } from '@/components/ui/button';
import { locationArea } from '@/lib/location-cases';

export function LocationStart() {
  const { user, busy, selectLocation } = useGame();
  const [finding, setFinding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  function locate() {
    if (!navigator.geolocation) { setError('Location is unavailable on this device. Existing cases remain available.'); return; }
    setFinding(true); setError(null);
    navigator.geolocation.getCurrentPosition(position => {
      if (position.coords.accuracy > 1000) { setError('Location is too uncertain. Move to a safe open area and retry.'); setFinding(false); return; }
      void selectLocation(locationArea(position.coords.latitude, position.coords.longitude)).finally(() => setFinding(false));
    }, e => { setFinding(false); setError(e.code === 1 ? 'Location permission denied. Allow location and retry, or play an existing case.' : 'Could not locate you. Retry from a safe place.'); }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  }
  return <section className="mt-6 border-y border-border py-5">
    <h2 className="font-display text-xl">Your area’s cold cases</h2>
    <p className="mt-2 text-xs text-muted-foreground">Fictional stories, not reports of real local crimes. Only an approximate area is saved; no movement trail.</p>
    {user ? <Button className="mt-4 w-full" disabled={busy || finding} onClick={locate}><MapPin />{finding ? 'Finding your area…' : 'Find cases at my location'}</Button> : <Button asChild className="mt-4 w-full"><Link to="/auth">Sign in for location cases</Link></Button>}
    {error && <p role="alert" className="mt-3 text-sm text-primary">{error}</p>}
  </section>;
}