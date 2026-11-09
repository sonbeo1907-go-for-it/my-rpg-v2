export function AngelicaGlyph(){
 return <svg className="angelica-glyph" viewBox="0 0 600 240" preserveAspectRatio="xMidYMid meet">
  <g className="angelica-orbit" fill="none" stroke="#f6e7a8" strokeWidth="2">
   <ellipse cx="300" cy="120" rx="235" ry="82"/>
   <ellipse cx="300" cy="120" rx="205" ry="64" strokeDasharray="8 9"/>
  </g>
  <g className="angelica-runes" fill="none" stroke="#ffe9a8" strokeWidth="3">
   <path d="M300 28v34m0 116v34M86 120h38m352 0h38"/>
   <path d="m170 55 24 24m212 82 24 24m0-130-24 24M194 161l-24 24"/>
   <circle cx="300" cy="120" r="52"/>
   <path d="m300 78 13 29 29 13-29 13-13 29-13-29-29-13 29-13Z"/>
  </g>
  <g className="angelica-seals" fill="#f8e8ae">
   {[0,1,2,3,4,5,6,7].map(i=>{const a=i*Math.PI/4;return <path key={i} d={`M${300+Math.cos(a)*180} ${120+Math.sin(a)*58}l-9-18 24 8Z`} opacity=".85"/>})}
  </g>
  <g className="angelica-core" fill="none" stroke="#fff4c4" strokeWidth="4">
   <circle cx="300" cy="120" r="22"/>
   <path d="M300 92v56m-28-28h56"/>
  </g>
 </svg>;
}
