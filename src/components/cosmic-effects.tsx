"use client";
import { useEffect, useId, useRef, useState } from "react";

type Effect = { id: string; kind: string; anchor: string; x: number; y: number; width: number; height: number };
/** One bounded presentation per cast. Combat never waits on these animations. */
export function CosmicEffects({ events, sessionId, speed }: { events: any[]; sessionId: number; speed: string }) {
  const [effect, setEffect] = useState<Effect | null>(null);
  const seen = useRef(new Set<string>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gradient = useId().replace(/:/g, "");
  useEffect(() => {
    seen.current.clear(); setEffect(null);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [sessionId]);
  useEffect(() => {
    const casts = events.filter(event => event.type === "ability_cast" && event.presentation?.startsWith("cosmic_") && !seen.current.has(event.key));
    if (!casts.length) return;
    for (const cast of casts) seen.current.add(cast.key);
    // Retain only the recent batch; event history cannot grow with an endless run.
    if (seen.current.size > 64) seen.current = new Set(casts.map(event => event.key));
    const cast = casts.at(-1)!;
    const formation = cast.area || cast.presentation === "cosmic_summon";
    const anchor = formation ? document.querySelector(".enemy-grid") : Array.from(document.querySelectorAll<HTMLElement>("[data-actor-id]")).find(card => card.dataset.actorId === cast.targetId);
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const pad = formation ? 28 : 40;
    setEffect({ id: `${sessionId}-${cast.key}`, kind: cast.presentation, anchor: formation ? "formation" : "target", x: rect.left - pad, y: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 });
    if (timer.current) clearTimeout(timer.current);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    timer.current = setTimeout(() => setEffect(null), reduced ? 120 : speed === "fast" ? 170 : 600);
  }, [events, sessionId, speed]);
  if (!effect) return null;
  const burst = ["cosmic_annihilation", "cosmic_rupture", "cosmic_summon"].includes(effect.kind);
  return <div key={effect.id} className={`cosmic-fx ${effect.kind}`} data-fx-anchor={effect.anchor} aria-hidden="true" style={{ left: effect.x, top: effect.y, width: effect.width, height: effect.height, "--fx-duration": speed === "fast" ? "160ms" : "580ms" } as React.CSSProperties}>
    <svg viewBox="0 0 600 300" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradient}><stop stopColor="#5830a8"/><stop offset=".45" stopColor="#e4b4ff"/><stop offset=".6" stopColor="#ecfaff"/><stop offset="1" stopColor="#8050ff"/></linearGradient>
        <radialGradient id={`${gradient}-burst`}><stop stopColor="#fff"/><stop offset=".18" stopColor="#d9e6ff" stopOpacity=".95"/><stop offset=".45" stopColor="#bd60ff" stopOpacity=".7"/><stop offset="1" stopColor="#49229b" stopOpacity="0"/></radialGradient>
      </defs>
      {burst && <g className="cosmic-burst"><ellipse cx="300" cy="150" rx="260" ry="135" fill={`url(#${gradient}-burst)`}/><ellipse cx="300" cy="150" rx="170" ry="74" fill="none" stroke="#dfabff" strokeWidth="3"/><ellipse cx="300" cy="150" rx="105" ry="116" fill="none" stroke="#8adfff" strokeWidth="2" transform="rotate(35 300 150)"/></g>}
      {effect.kind !== "cosmic_annihilation" && effect.kind !== "cosmic_summon" && <g className="cosmic-slashes" fill="none" stroke={`url(#${gradient})`} strokeWidth="9" strokeLinecap="round">
        {effect.kind === "cosmic_wave" ? <path d="M40 258 Q280 80 558 42"/> : effect.kind === "cosmic_double" ? <><path d="M535 265 Q290 120 55 36"/><path className="slash-two" d="M300 282 Q220 120 65 30"/></> : <><path d="M50 270 Q300 140 550 30"/><path className="slash-two" d="M110 270 Q320 160 560 40"/></>}
      </g>}
      <g className="cosmic-particles" fill="#d9d7ff">{Array.from({length:12},(_,i)=><path key={i} d={`M${300+Math.cos(i*Math.PI/6)*230} ${150+Math.sin(i*Math.PI/6)*100}l4 7-4 7-4-7Z`}/>)}</g>
    </svg>
  </div>;
}
