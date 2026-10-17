import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { lovable } from '@/integrations/lovable';
import '@lovable.dev/cloud-auth-js/styles.css';
import { Button } from '@/components/ui/button';
import { Shell } from '@/components/Shell';
import { useGame } from '@/components/GameProvider';

export const Route = createFileRoute('/auth')({ head: () => ({ meta: [ { title: 'Detective Sign In | CASE ZERO' }, { name: 'description', content: 'Sign in to keep your ghost cases, detective XP and achievements online.' }, { property: 'og:title', content: 'Detective Sign In | CASE ZERO' }, { property: 'og:description', content: 'Return to your investigation from any device.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' } ] }), component: Auth });
function Auth() {
  const { user } = useGame();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signIn = async (provider: 'google' | 'lovable') => {
    setPending(true); setError(null);
    try { const r = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/auth` }); if (r.error) setError('Sign-in could not finish. Please try again.'); }
    catch { setError('Sign-in could not finish. Please try again.'); }
    finally { setPending(false); }
  };
  return <Shell><p className="text-xs uppercase text-ghost">CASE ZERO</p><h1 className="font-display mt-4 text-3xl">Detective Sign In</h1>{user ? <div className="mt-6 space-y-4"><p className="text-sm text-ghost">Signed in. Your investigation is ready.</p><Button asChild className="w-full"><Link to="/">Return to Case Map</Link></Button></div> : <div className="mt-8 space-y-3"><Button variant="outline" disabled={pending} className="w-full" onClick={() => void signIn('google')}>Continue with Google</Button><Button disabled={pending} className="lovable-auth-button w-full" onClick={() => void signIn('lovable')}>Continue with Lovable</Button>{pending && <p role="status" className="text-xs text-muted-foreground">Signing in…</p>}{error && <p role="alert" className="text-sm text-primary">{error}</p>}</div>}</Shell>;
}