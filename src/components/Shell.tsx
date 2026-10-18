import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useGame } from './GameProvider';
import { Button } from './ui/button';
import { MusicControl } from './GameAudio';
import { Fingerprint, FolderSearch, UserRound, Shield } from 'lucide-react';

export function Shell({ children, nav = true }: { children: ReactNode; nav?: boolean }) {
  const { user, loading, busy, error, retry, isAdmin } = useGame();
  return (
    <div className="game-shell min-h-screen">
      <main className={`screen-enter mx-auto px-5 pt-6 ${nav ? "pb-28" : "pb-10"}`}>
        <div className="mb-6 flex items-center justify-between border-b border-border pb-3"><Link to="/" className="flex items-center gap-3 text-xs uppercase tracking-widest"><Fingerprint className="h-7 w-7 text-ghost" /><span>CASE ZERO<span className="mt-1 block text-[9px] text-muted-foreground">Paranormal investigation unit</span></span></Link><MusicControl /></div>
        {loading && <p role="status" className="mb-4 text-xs text-ghost">Loading your detective file…</p>}
        {!loading && !user && <div className="mb-5 flex items-center justify-between border-b border-border pb-3"><span className="text-xs text-muted-foreground">Visitor</span><Button asChild size="sm" variant="outline"><Link to="/auth">Sign in to investigate</Link></Button></div>}
        {busy && <p role="status" className="mb-3 text-xs text-ghost">Saving…</p>}
        {error && <div role="alert" className="mb-4 border border-primary p-3 text-sm"><p>{error}</p><Button variant="link" onClick={retry}>Retry</Button></div>}
        {children}
      </main>
      {nav && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
          <div className="mx-auto grid max-w-md grid-cols-3 text-center text-xs">
            {[
              { to: "/", label: "Cases" },
              { to: "/profile", label: "Profile" },
              { to: isAdmin ? "/admin" : "/auth", label: isAdmin ? "Admin" : "Account" },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                activeOptions={{ exact: l.to === "/" }}
                className="flex flex-col items-center gap-1 py-3 uppercase tracking-widest text-muted-foreground transition-colors hover:text-ghost"
                activeProps={{ className: "text-ghost" }}
              >
                {l.label === 'Cases' ? <FolderSearch className="h-4 w-4" /> : l.label === 'Profile' ? <UserRound className="h-4 w-4" /> : <Shield className="h-4 w-4" />}{l.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

export function Bar({ value, max, tone }: { value: number; max: number; tone: "ghost" | "primary" }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded bg-muted">
      <div
        className={`h-full transition-all ${tone === "ghost" ? "bg-ghost" : "bg-primary"}`}
        style={{ width: `${Math.max(0, (value / max) * 100)}%` }}
      />
    </div>
  );
}
