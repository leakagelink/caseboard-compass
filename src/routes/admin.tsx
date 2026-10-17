import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useCases, type CaseOverride } from "@/lib/progress";
import type { GameCase } from "@/data/cases";
import { Shell } from "@/components/Shell";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Case Admin Dashboard | CASE ZERO" },
      { name: "description", content: "Manage cases: titles, story summaries, difficulty, rewards and publish status." },
      { property: "og:title", content: "Case Admin Dashboard | CASE ZERO" },
      { property: "og:description", content: "Edit and publish ghost cases." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { cases, saveOverride, resetOverrides } = useCases();
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <Shell>
      <h1 className="font-display text-3xl">Case Admin</h1>
      <p className="mt-1 text-xs text-muted-foreground">
        Prototype: edits are saved on this device only. Shared, secure case management arrives with accounts.
      </p>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <Stat label="Cases" value={cases.length} />
        <Stat label="Published" value={cases.filter((c) => c.status === "published").length} />
        <Stat label="Clues" value={cases.reduce((n, c) => n + c.clues.length, 0)} />
      </div>

      <div className="mt-6 space-y-3">
        {cases.map((c) =>
          editing === c.id ? (
            <Editor key={c.id} c={c} onCancel={() => setEditing(null)} onSave={(o) => { saveOverride(c.id, o); setEditing(null); }} />
          ) : (
            <div key={c.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex justify-between text-xs">
                <span className="text-ghost">{c.id} · #{c.order}</span>
                <span className={c.status === "published" ? "text-ghost" : "text-primary"}>{c.status}</span>
              </div>
              <p className="font-display mt-1 text-lg">{c.title}</p>
              <p className="text-xs text-muted-foreground">{c.difficulty} · {c.rewardXp} XP · {c.clues.length} clues · {c.ghost.name}</p>
              <div className="mt-3 flex gap-2 text-xs">
                <button onClick={() => setEditing(c.id)} className="rounded border border-ghost px-3 py-1 text-ghost">Edit</button>
                <button
                  onClick={() => saveOverride(c.id, { status: c.status === "published" ? "draft" : "published" })}
                  className="rounded border border-border px-3 py-1"
                >
                  {c.status === "published" ? "Unpublish" : "Publish"}
                </button>
              </div>
            </div>
          ),
        )}
      </div>
      <button onClick={resetOverrides} className="mt-6 text-xs text-muted-foreground underline">Restore original case data</button>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <p className="font-display text-xl text-ghost">{value}</p>
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
    </div>
  );
}

function Editor({ c, onSave, onCancel }: { c: GameCase; onSave: (o: CaseOverride) => void; onCancel: () => void }) {
  const [f, setF] = useState({ title: c.title, summary: c.summary, difficulty: c.difficulty, rewardXp: c.rewardXp, order: c.order });
  const input = "w-full rounded border border-input bg-background px-3 py-2 text-sm";
  return (
    <div className="space-y-3 rounded-lg border border-ghost bg-card p-4">
      <label className="block text-xs text-muted-foreground">Title<input className={input} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
      <label className="block text-xs text-muted-foreground">Story summary<textarea rows={4} className={input} value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} /></label>
      <div className="grid grid-cols-3 gap-2">
        <label className="block text-xs text-muted-foreground">Difficulty<input className={input} value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: e.target.value })} /></label>
        <label className="block text-xs text-muted-foreground">XP<input type="number" min={0} max={1000} className={input} value={f.rewardXp} onChange={(e) => setF({ ...f, rewardXp: Math.min(1000, Math.max(0, +e.target.value)) })} /></label>
        <label className="block text-xs text-muted-foreground">Order<input type="number" min={1} className={input} value={f.order} onChange={(e) => setF({ ...f, order: +e.target.value })} /></label>
      </div>
      <div className="flex gap-2 text-sm">
        <button onClick={() => onSave(f)} className="rounded bg-primary px-4 py-2 text-primary-foreground">Save</button>
        <button onClick={onCancel} className="rounded border border-border px-4 py-2">Cancel</button>
      </div>
    </div>
  );
}
