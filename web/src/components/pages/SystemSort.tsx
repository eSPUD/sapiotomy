"use client";

import { useEffect, useRef, useState } from "react";
import { SORTING_ITEMS } from "@/lib/authored";
import { useStore } from "@/store/useStore";

type Zone = "fast" | "slow";
const TOTAL = SORTING_ITEMS.length;
const label = (z: Zone) => (z === "fast" ? "System 1 · fast" : "System 2 · slow");
const byId = (id: string) => SORTING_ITEMS.find((x) => x.id === id);

/**
 * Sort six everyday tasks into System 1 vs System 2. Drag a chip into a bin, or
 * select it and press "Place here" (keyboard path). Correct drops lock in green;
 * wrong drops flash red and bounce back. A reward lands at 6/6.
 */
export function SystemSort() {
  const recordInteraction = useStore((s) => s.recordInteraction);
  const [placed, setPlaced] = useState<Record<string, Zone>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Zone | null>(null);
  const [announce, setAnnounce] = useState("");
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (flashTimer.current) clearTimeout(flashTimer.current); }, []);

  const done = Object.keys(placed).length === TOTAL;
  const pool = SORTING_ITEMS.filter((x) => !placed[x.id]);

  const attempt = (id: string, zone: Zone) => {
    const item = byId(id);
    if (!item || placed[id]) return;
    recordInteraction(1);
    setSelected(null);
    if (item.system === zone) {
      setPlaced((p) => ({ ...p, [id]: zone }));
      setAnnounce(`Correct. "${item.text}" is ${label(zone)}.`);
    } else {
      setWrongId(id);
      setAnnounce(`Not quite. Try the other side.`);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setWrongId(null), 800);
    }
  };

  return (
    <section aria-label="Sort the questions into System 1 or System 2" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-ink">Your turn: sort six questions</h2>
        <span className="font-mono text-sm text-ink-muted">{Object.keys(placed).length} / {TOTAL} sorted</span>
      </div>
      <p className="text-sm text-ink-muted">
        Drag each question into the system it runs on, or select it and press a side. System 1 if the
        answer just arrives; System 2 if you would have to work for it.
      </p>

      {/* The pool */}
      <div className="flex min-h-[2.5rem] flex-wrap gap-2" aria-label="Questions still to sort">
        {pool.length === 0 ? (
          <p className="text-sm text-ink-muted">All sorted.</p>
        ) : (
          pool.map((x) => {
            const isSel = selected === x.id;
            const isWrong = wrongId === x.id;
            return (
              <button
                key={x.id}
                type="button"
                draggable
                aria-pressed={isSel}
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", x.id);
                  setSelected(x.id);
                }}
                onClick={() => setSelected(isSel ? null : x.id)}
                className={`rounded border px-3 py-1.5 text-sm ${
                  isWrong
                    ? "border-wrong bg-wrong text-canvas"
                    : isSel
                      ? "border-compute bg-compute/15 text-ink ring-2 ring-compute"
                      : "border-grid bg-surface-raised text-ink hover:border-compute"
                }`}
              >
                {x.text}
              </button>
            );
          })
        )}
      </div>

      {/* The two bins */}
      <div className="grid gap-4 md:grid-cols-2">
        {(["fast", "slow"] as Zone[]).map((z) => {
          const here = SORTING_ITEMS.filter((x) => placed[x.id] === z);
          const accentText = z === "fast" ? "text-compute" : "text-wrong";
          const accentBorder = z === "fast" ? "border-compute" : "border-wrong";
          const accentBtn = z === "fast" ? "bg-compute" : "bg-wrong";
          return (
            <div
              key={z}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(z);
              }}
              onDragLeave={() => setDragOver((d) => (d === z ? null : d))}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                setDragOver(null);
                if (id) attempt(id, z);
              }}
              className={`flex min-h-[7rem] flex-col gap-2 rounded-lg border-l-4 bg-surface p-4 ${accentBorder} ${
                dragOver === z ? "outline outline-2 outline-compute" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className={`text-sm font-semibold uppercase tracking-wide ${accentText}`}>{label(z)}</h3>
                {selected ? (
                  <button
                    type="button"
                    onClick={() => attempt(selected, z)}
                    className={`rounded ${accentBtn} px-2 py-1 text-xs font-semibold text-canvas`}
                  >
                    Place here
                  </button>
                ) : null}
              </div>
              <ul className="flex flex-wrap gap-2">
                {here.map((x) => (
                  <li key={x.id} className="rounded border border-correct bg-correct px-3 py-1.5 text-sm text-canvas">
                    <span aria-hidden="true">✓ </span>
                    {x.text}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {done ? (
        <div className="rounded-lg border-l-4 border-correct bg-correct/10 p-4">
          <p className="font-semibold text-correct">All six sorted.</p>
          <p className="text-sm text-ink-muted">
            You just ran System 2 to tell System 1 from System 2. Perception, language and feeling
            arrive on their own; arithmetic, parking and comparing have to be worked out.
          </p>
        </div>
      ) : null}

      <div aria-live="polite" className="sr-only">
        {announce}
      </div>
    </section>
  );
}
