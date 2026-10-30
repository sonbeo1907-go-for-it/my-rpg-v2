"use client";
import {useEffect,useId,useRef,useState} from 'react';
export function AcademicEffects({events,sessionId,speed}:{events:any[];sessionId:number;speed:string}){
 const [effect,setEffect]=useState<any>(null),seen=useRef(new Set<string>()),timer=useRef<ReturnType<typeof setTimeout>|null>(null),id=useId().replace(/:/g,'');
 useEffect(()=>{seen.current.clear();setEffect(null);return()=>{if(timer.current)clearTimeout(timer.current);};},[sessionId]);
 useEffect(()=>{
  const casts=events.filter(event=>((event.type==='ability_cast'&&event.presentation?.startsWith('academic_'))||event.type==='formula_record')&&!seen.current.has(event.visualId??event.key));if(!casts.length)return;
  casts.forEach(event=>seen.current.add(event.visualId??event.key));if(seen.current.size>64)seen.current=new Set(casts.map(event=>event.visualId??event.key));
  const cast=casts.filter(event=>event.type==='ability_cast').at(-1)??casts.at(-1),kind=cast.presentation??'academic_record';
  const area=['academic_open','academic_edit','academic_record'].includes(kind);
  const anchor=area?document.querySelector('.formula-board')??document.querySelector('.battlefield'):Array.from(document.querySelectorAll<HTMLElement>('[data-actor-id]')).find(card=>card.dataset.actorId===cast.targetId);if(!anchor)return;
  const rect=anchor.getBoundingClientRect();setEffect({key:`${sessionId}-${cast.visualId??cast.key}`,kind,perfect:cast.perfect,left:rect.left-12,top:rect.top-12,width:rect.width+24,height:rect.height+24});
  if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>setEffect(null),matchMedia('(prefers-reduced-motion: reduce)').matches?120:speed==='fast'?240:750);
 },[events,sessionId,speed]);
 if(!effect)return null;
 const pages=effect.kind==='academic_basic'?2:['academic_rebuttal','academic_record'].includes(effect.kind)?1:3;
 return <div key={effect.key} className={`academic-fx ${effect.kind} ${effect.perfect?'perfect':''}`} data-academic-fx={effect.kind} aria-hidden="true" style={{left:effect.left,top:effect.top,width:effect.width,height:effect.height,'--academic-duration':speed==='fast'?'230ms':'720ms'} as React.CSSProperties}>
  <svg viewBox="0 0 600 360" preserveAspectRatio="none"><defs><radialGradient id={id}><stop stopColor="#fff9dd" stopOpacity=".85"/><stop offset=".35" stopColor="#a8d3eb" stopOpacity=".35"/><stop offset="1" stopColor="#d8c47e" stopOpacity="0"/></radialGradient></defs>
   <ellipse className="academic-flare" cx="300" cy="180" rx="280" ry="175" fill={`url(#${id})`}/>
   <g fill="none" stroke={effect.perfect?'#ffe99a':'#b5d3db'} strokeWidth="2"><ellipse className="academic-ring" cx="300" cy="180" rx="235" ry="130"/><path d="m300 40 210 235H90Z"/><path d="M30 180h540M300 15v330" opacity=".45"/></g>
   <g className="academic-pages" fill="#f9edc9" stroke="#d1ad64" strokeWidth="2">{Array.from({length:pages},(_,index)=><g key={index} className={`academic-page page-${index}`}><path d={`M${245+index*9} 75h80l24 25v140h-104Z`}/><path d={`M${325+index*9} 75v25h24m-90 25h55m-55 22h55m-55 22h40`} fill="none" stroke="#5b7488"/></g>)}</g>
   {effect.perfect&&<text x="300" y="305" textAnchor="middle" fill="#ffefb0" fontSize="28" fontFamily="serif">Q.E.D.</text>}
  </svg>
 </div>;
}
