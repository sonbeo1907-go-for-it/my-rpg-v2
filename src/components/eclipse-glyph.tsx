export function EclipseGlyph({strike=false,phase='waning'}:{strike?:boolean;phase?:string}){
 return <svg viewBox="0 0 160 160" fill="none" aria-hidden="true">{strike?<>
  <path className="eclipse-gather" d="M15 27Q50 45 80 68Q110 45 145 27M30 13Q49 43 80 68Q111 43 130 13" stroke="#8edcff" strokeWidth="3"/>
  <path className="eclipse-lance" d="m80 9 10 57 9 10-15 69-4 12-4-12-15-69 9-10Z" fill="#ff9d58"/><path d="M80 30v114" stroke="#fff4dc" strokeWidth="4"/>
  <path d="M28 124Q80 91 132 124M46 137Q80 113 114 137" stroke="#9ce6ff" strokeWidth="3"/>
 </>:<>
  <path d="M18 104C-4 60 28 17 64 24c-34 13-40 51-13 73 20 16 51 17 84 2-32 33-83 40-117 5Z" fill="#407f9b"/><path d="M17 83C14 42 50 18 79 28" stroke="#a4e3f4" strokeWidth="3"/>
  <path className="eclipse-fire-ring" d="m83 12 8 14 15-7 4 18 17-1-3 18 15 8-12 14 10 16-18 4-1 18-17-6-11 14-11-14-17 6-1-18-18-4 10-16-12-14 15-8-3-18 17 1 4-18 15 7Z" fill="#d7713c"/>
  <circle cx="83" cy="70" r="39" fill="#141b2b" stroke="#ffcc84" strokeWidth={phase==='full'?5:2}/>
  {phase!=='full'&&<path d={phase==='waning'?'M83 32c-34 10-31 66 0 76-50 0-50-76 0-76Z':'M83 32c34 10 31 66 0 76 50 0 50-76 0-76Z'} fill="#d9ecf7"/>}
  <path d="M25 115c30-11 58 18 91 2m-79 15c26-7 48 12 70 1" stroke="#a4e3f4" strokeWidth="3" strokeLinecap="round"/>
 </>}</svg>;
}
