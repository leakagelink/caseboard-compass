import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function Shell({ children, nav = true }: { children: ReactNode; nav?: boolean }) {
  return (
    <div className="fog min-h-screen">
      <main className={`mx-auto max-w-md px-5 pt-6 ${nav ? "pb-24" : "pb-10"}`}>{children}</main>
      {nav && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
          <div className="mx-auto grid max-w-md grid-cols-3 text-center text-xs">
            {[
              { to: "/", label: "Cases" },
              { to: "/profile", label: "Profile" },
              { to: "/admin", label: "Admin" },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                activeOptions={{ exact: l.to === "/" }}
                className="py-4 uppercase tracking-widest text-muted-foreground"
                activeProps={{ className: "text-ghost" }}
              >
                {l.label}
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
