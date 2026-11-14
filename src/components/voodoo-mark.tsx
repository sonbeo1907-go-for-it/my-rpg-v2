"use client";
/** Local ritual mark: persistent while the actual Voodoo status is active. */
export function VoodooMark({turns}:{turns:number}){
 return <div className="voodoo-mark" role="img" aria-label={`Voodoo · còn ${turns} lượt chính`}>
  <svg viewBox="0 0 80 118" fill="none" aria-hidden="true">
   <g className="voodoo-threads" stroke="currentColor" strokeWidth="1"><path d="M7 0 28 48M40 0v41M73 0 51 48M17 4l5 23M62 8l-3 18"/><circle cx="40" cy="57" r="26" strokeDasharray="2 5"/></g>
   <g className="voodoo-doll" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="40" cy="48" r="12" fill="#16232c"/><path d="m32 44 5 5m0-5-5 5m11-5 5 5m0-5-5 5M36 54h8m-7 8-5 16 8 5 8-5-5-16m-9 3-11 8m23-8 11 8M36 81l-5 16m13-16 5 16"/><path d="m38 68 5 6m0-6-5 6" stroke="#e9c68d"/></g>
   <path d="m40 105 4 4-4 4-4-4Z" fill="currentColor"/>
  </svg>
  <span>Voodoo <b>{turns}</b></span>
 </div>;
}
