import type {CSSProperties} from 'react';

function AncestralBlade(){return <><path d="M-4 70-3-58 0-94 3-58 4 70Z" fill="#0b3155" stroke="#a9e9ff" strokeWidth="1.5"/><path d="M0-84V66M-18 43h36M-3 54h6M-3 63h6" fill="none" stroke="#ebfdff" strokeWidth="2"/></>;}

/** Original iaido silhouettes: a quiet draw, opposing cuts and converging ancestral blades. */
export function IaidoGlyph({presentation,id,hitIndex=0,final=false}:{presentation:string;id:string;hitIndex?:number;final?:boolean}){
 const key='iaido-'+id.replace(/[^a-zA-Z0-9_-]/g,''),awaken=presentation==='iaido_awaken',hilt=presentation==='iaido_hilt',still=presentation==='iaido_still',finish=final||presentation==='iaido_eclipse'&&hitIndex>=5;
 const twin=presentation==='iaido_twin',draw=presentation==='iaido_draw',second=twin&&hitIndex%2===1;
 const angle=finish?-26:draw?-12:twin?(second?31:-31):presentation==='iaido_basic'?(hitIndex%2?23:-23):[-29,29,-12,12,0][hitIndex%5];
 const phase=awaken?'converge':hilt?'hilt':still?'still':finish?'finish':draw?'draw':second?'return-cut':'cut';
 return <svg className="iaido-signature" viewBox="0 0 600 280" preserveAspectRatio="none" data-iaido-kind={presentation} data-iaido-hit={hitIndex} data-iaido-final={Boolean(finish)} data-iaido-phase={phase} data-iaido-direction={angle} aria-hidden="true">
  <defs><linearGradient id={key}><stop stopColor="#267ac5" stopOpacity="0"/><stop offset=".24" stopColor="#65c7ff"/><stop offset=".5" stopColor="#f1ffff"/><stop offset=".76" stopColor="#9ce9ff"/><stop offset="1" stopColor="#267ac5" stopOpacity="0"/></linearGradient></defs>
  {hilt?<g className="iaido-hilt" transform="translate(300 174)"><path d="m-65 35 130-70" stroke="#5aa9db" strokeWidth="4"/><path d="m-13-21 26 42" stroke="#bdedff" strokeWidth="3"/><path className="iaido-hilt-spark" d="M-43 0h86M0-35v70m-14-14 28 28m-28 0 28-28" fill="none" stroke="#f0ffff" strokeWidth="2"/></g>:still?<g className="iaido-still"><path d="M175 140h250" fill="none" stroke={`url(#${key})`} strokeWidth="1"/><path d="m294 140 6-6 6 6-6 6Z" fill="none" stroke="#b9f2ff" strokeWidth="1"/></g>:awaken?<>
   {[-1,1].flatMap(side=>[0,1,2].map(i=><g className="iaido-ancestor" key={side+':'+i} style={{'--iaido-x':`${side*(130+i*48)}px`,'--iaido-y':`${(i-1)*66}px`,'--iaido-angle':`${side*(24+i*18)}deg`,'--iaido-order':i} as CSSProperties}><g transform="translate(300 140)"><AncestralBlade/></g></g>))}
   <g className="iaido-united" transform="translate(300 140)"><AncestralBlade/></g><path className="iaido-union-line" d="M90 140h420" stroke={`url(#${key})`} strokeWidth="1.5"/>
  </>:<g transform={`rotate(${angle} 300 140)`}>
   {finish&&<g className="iaido-final-mark" fill="none" stroke="#89dfff"><path d="m278 48 44 184M192 140h216" strokeWidth="1"/><path d="m246 86 108 108m-108 0 108-108" strokeWidth=".8" opacity=".5"/></g>}
   <g className="iaido-trail"><path d="M-12 157Q280 114 612 124" fill="none" stroke={`url(#${key})`} strokeWidth={finish?5:second?3.5:draw?1.5:2}/><path d="M4 161Q290 120 596 127" fill="none" stroke="#e7ffff" strokeWidth={finish?1.8:second?1.5:.8}/></g>
   <g className="iaido-afterimage" fill="none" stroke="#53b9f0" opacity=".45"><path d="M20 165Q285 125 580 129" strokeWidth=".8"/>{!draw&&<path d="M38 150Q280 108 568 121" strokeWidth=".7"/>}</g>
   {second&&<path className="iaido-edge" d="m294 128 12-18-4 32-12 18Z" fill="#edffff"/>}
  </g>}
 </svg>;
}
