/** Original golden ceremonial blade, drawn for Anabel's target-local combat effects. */
export function AnabelGlyph({presentation,id}:{presentation:string;id:string}){
 const key='anabel-'+id.replace(/[^a-zA-Z0-9_-]/g,''),dawn=presentation==='anabel_dawn',command=presentation==='anabel_command',large=presentation==='anabel_cleave';
 return <svg className="anabel-glyph" viewBox="0 0 600 360" data-anabel-kind={presentation} aria-hidden="true">
  <defs>
   <linearGradient id={key+'-gold'} x1="0" x2="1"><stop stopColor="#8b4805"/><stop offset=".22" stopColor="#f5b529"/><stop offset=".48" stopColor="#fff6ba"/><stop offset=".65" stopColor="#eeb01d"/><stop offset="1" stopColor="#8d4a06"/></linearGradient>
   <linearGradient id={key+'-edge'}><stop stopColor="#d48b0d" stopOpacity="0"/><stop offset=".35" stopColor="#ffd35d"/><stop offset=".6" stopColor="#fffce1"/><stop offset="1" stopColor="#e6a51c" stopOpacity="0"/></linearGradient>
   <radialGradient id={key+'-aura'}><stop stopColor="#fff9bd" stopOpacity=".85"/><stop offset=".35" stopColor="#ffdc54" stopOpacity=".4"/><stop offset="1" stopColor="#e49c12" stopOpacity="0"/></radialGradient>
  </defs>
  {dawn?<>
   <ellipse className="anabel-aura" cx="300" cy="250" rx="210" ry="110" fill={`url(#${key}-aura)`}/>
   <g className="anabel-descending-sword">
    <path d="m300 34-9 18 4 54h10l4-54Z" fill="#6a370d" stroke="#f7c755" strokeWidth="2"/>
    <path d="m290 55 20 9m-19 4 18 9m-17 4 16 9m-15 4 14 9" stroke="#e8aa2c" strokeWidth="3"/>
    <path d="m300 15 10 17-10 16-10-16Z" fill={`url(#${key}-gold)`} stroke="#fff0a3" strokeWidth="1.5"/>
    <path d="M297 107C278 91 267 87 258 97c-9 10-3 23 7 24 10 2 14-8 6-11m32-3c19-16 30-20 39-10 9 10 3 23-7 24-10 2-14-8-6-11" fill="none" stroke="#d58e15" strokeWidth="10"/>
    <path d="M253 103q-24-17-38-4 20 0 29 20l40 10m63-26q24-17 38-4-20 0-29 20l-40 10" fill={`url(#${key}-gold)`} stroke="#f8d56a" strokeWidth="2"/>
    <path d="M283 121q-20 22-14 47l12 51q4 42 19 93 15-51 19-93l12-51q6-25-14-47Z" fill={`url(#${key}-gold)`} stroke="#ffd96c" strokeWidth="2"/>
    <path d="m300 139-12 35 12 122 12-122Z" fill="#ffdf69" opacity=".6"/>
    <path d="M300 146v143m-6-132q-28 5-10 29 15 3 8 20m14-49q28 5 10 29-15 3-8 20m-13-2q-19 12-2 27m12-27q19 12 2 27" fill="none" stroke="#9b5c08" strokeWidth="2"/>
    <path d="M297 154v124m-18-119q6 2 8 8m34-8q-6 2-8 8" fill="none" stroke="#fff8b8" strokeWidth="2"/>
    <path d="m300 99 18 17-18 26-18-26Z" fill={`url(#${key}-gold)`} stroke="#ffe9a4" strokeWidth="2"/>
    <ellipse cx="300" cy="116" rx="6" ry="8" fill="#5c3106" stroke="#f9d774" strokeWidth="2"/>
   </g>
   <g className="anabel-contact" fill="none" stroke="#ffe293"><ellipse cx="300" cy="300" rx="105" ry="20" strokeWidth="3"/><path d="m300 259 0 77m-82-36h164m-134-32 104 64m-104 0 104-64" strokeWidth="2"/></g>
  </>:command?<g className="anabel-command-aura"><ellipse cx="300" cy="250" rx="200" ry="95" fill={`url(#${key}-aura)`}/><path d="m249 180 15-42 21 26 15-46 15 46 21-26 15 42Zm15 15h72M300 206v77" fill="none" stroke="#ffe79c" strokeWidth="4"/><path d="M230 275V92m140 183V92" stroke={`url(#${key}-edge)`} strokeWidth="3"/></g>:<g className={'anabel-slash '+(large?'anabel-slash-large':'')} transform="rotate(-27 300 180)"><path className="anabel-slash-aura" d="M60 247Q250 64 549 113Q299 128 60 247Z" fill={`url(#${key}-aura)`}/><path className="anabel-slash-edge" d="M65 242Q278 91 546 117" stroke={`url(#${key}-edge)`} strokeWidth={large?14:6} strokeLinecap="round" fill="none"/><path className="anabel-slash-core" d="M79 235Q285 102 529 119" stroke="#fff8ce" strokeWidth={large?4:2} fill="none"/>{large&&<path d="M101 251Q290 116 522 129" stroke="#e8b84b" strokeWidth="2" fill="none" opacity=".75"/>}</g>}
 </svg>;
}
