"use client";
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {combatTimeline,COMBAT_COLORS} from '../ui/combat-timeline.js';

function Glyph({kind,damageType}:{kind:string;damageType?:string}){
 if(kind==='formation')return <svg viewBox="0 0 600 180" preserveAspectRatio="none">{damageType==='physical'?<><path className="vfx-sweep" d="M10 140Q260 0 590 55L420 75Q210 25 10 140Z" fill="currentColor"/><path d="M25 150Q310 30 575 65" fill="none" stroke="currentColor" strokeWidth="3"/></>:<><ellipse cx="300" cy="105" rx="210" ry="55" fill="none" stroke="currentColor" strokeWidth="3"/><path d="m300 30 150 110H150Z" fill="none" stroke="currentColor" strokeWidth="2"/><ellipse className="vfx-detonation" cx="300" cy="85" rx="100" ry="65" fill="currentColor" opacity=".22"/></>}</svg>;
 return <svg viewBox="0 0 160 160">{['block','shield','effect_blocked'].includes(kind)?<path d="m80 15 49 20-6 56q-8 32-43 51-35-19-43-51l-6-56Zm0 16v89m-29-59h58" fill="none" stroke="currentColor" strokeWidth="4"/>:kind==='heal'?<><path d="M80 35v65M48 67h64" stroke="currentColor" strokeWidth="9"/><path d="m37 117 8-18 8 18m54 6 8-18 8 18" fill="none" stroke="currentColor" strokeWidth="2"/></>:kind==='mp_restore'?<path d="m80 24 26 53-26 57-26-57Zm-26 53h52" fill="none" stroke="currentColor" strokeWidth="3"/>:['status','cleanse','passive'].includes(kind)?<><circle cx="80" cy="80" r="44" fill="none" stroke="currentColor" strokeWidth="2"/><path d="m80 22 12 45 45 13-45 13-12 45-12-45-45-13 45-13Z" fill="none" stroke="currentColor" strokeWidth="2"/></>:damageType==='physical'?<path d="M20 141Q74 37 143 15L119 48Q65 66 20 141Z" fill="currentColor"/>:<><circle className="vfx-detonation" cx="80" cy="80" r="39" fill="currentColor" opacity=".3"/><circle cx="80" cy="80" r="48" fill="none" stroke="currentColor" strokeWidth="3"/><path d="m80 12 8 42 35-20-20 36 44 10-44 10 20 36-35-20-8 42-8-42-35 20 20-36-44-10 44-10-20-36 35 20Z" fill="currentColor" opacity=".5"/></>}</svg>;
}
const findCard=(id:string)=>Array.from(document.querySelectorAll<HTMLElement>('.combatant[data-actor-id]')).find(node=>node.dataset.actorId===id);
const history=new Map<number,Set<string>>();
/** Bounded, cancellable per-action timeline. Portals stay attached when scrolling/resizing. */
export function CombatEffects({events,content,sessionId,speed,onCue}:{events:any[];content:any;sessionId:number;speed:string;onCue?:(value:any)=>void}){
 const [visible,setVisible]=useState<any[]>([]),seen=useRef(new Set<string>()),timers=useRef<ReturnType<typeof setTimeout>[]>([]),animations=useRef<Animation[]>([]),generation=useRef(0);
 const clear=()=>{onCue?.(null);generation.current++;timers.current.forEach(clearTimeout);timers.current=[];animations.current.forEach(animation=>animation.cancel());animations.current=[];setVisible([]);document.querySelector('.battle-page')?.removeAttribute('data-vfx-playing');};
 useEffect(()=>{seen.current=history.get(sessionId)??new Set();history.set(sessionId,seen.current);if(history.size>2)history.delete(history.keys().next().value!);clear();return clear;},[sessionId]);
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)'),stop=()=>clear();media.addEventListener('change',stop);document.addEventListener('visibilitychange',stop);return()=>{media.removeEventListener('change',stop);document.removeEventListener('visibilitychange',stop);};},[]);
 useEffect(()=>{
  const fresh=events.filter(event=>!seen.current.has(String(event.key??event.visualId)));if(!fresh.length)return;
  fresh.forEach(event=>seen.current.add(String(event.key??event.visualId)));if(seen.current.size>256){seen.current=new Set(events.map(event=>String(event.key??event.visualId)));history.set(sessionId,seen.current);}
  clear();const token=generation.current,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const plan=combatTimeline(fresh,content,{speed,reduced});
  const later=(fn:()=>void,ms:number)=>timers.current.push(setTimeout(()=>{if(generation.current===token)fn();},ms));
  if(plan.frames.length)document.querySelector('.battle-page')?.setAttribute('data-vfx-playing','true');
  for(const frame of plan.frames.slice(0,128))later(()=>{
   const source=frame.kind==='source'||frame.kind==='passive',card=findCard(source?frame.sourceId:frame.targetId);
   let anchor:HTMLElement|undefined=card;
   if(frame.kind==='formation'){
    const team=card?.dataset.team??findCard(frame.sourceId)?.dataset.team;
    anchor=document.querySelector<HTMLElement>(team==='party'?'.ally-grid':'.enemy-grid')??undefined;
    if(!card)anchor=document.querySelector<HTMLElement>(findCard(frame.sourceId)?.dataset.team==='party'?'.enemy-grid':'.ally-grid')??undefined;
   }
   if(!anchor)return;
   if(frame.kind==="source")onCue?.({sourceId:frame.sourceId,label:frame.label});
   if(card&&!reduced){
    let keys:Keyframe[]|null=null;
    if(frame.kind==='source'&&!frame.automatic)keys=[{translate:'0 0'},{translate:`0 ${frame.attack?(card.dataset.team==='party'?-7:7):-3}px`,offset:.35},{translate:'0 0'}];
    if(frame.kind==='hurt')keys=[{transform:'translateX(0)'},{transform:'translateX(-3px)'},{transform:'translateX(3px)'},{transform:'translateX(0)'}];
    if(keys){animations.current=animations.current.filter(animation=>animation.playState==='running');animations.current.push(card.animate(keys,{duration:frame.duration,easing:'ease-out'}));}
   }
   const item={...frame,anchor,reduced};setVisible(previous=>[...previous,item].slice(-64));
   later(()=>setVisible(previous=>previous.filter(item=>item.id!==frame.id)),frame.duration);
  },frame.at);
  later(()=>{onCue?.(null);document.querySelector('.battle-page')?.removeAttribute('data-vfx-playing');},plan.duration);
 },[events,content,sessionId,speed]);
 return <>{visible.map(frame=>{
  const cue=frame.kind==='source'||frame.kind==='passive';
  const color=frame.kind==='heal'?'#87e7a6':['block','shield','effect_blocked'].includes(frame.kind)?'#78c8ff':frame.kind==='mp_restore'?'#c5a3ff':(COMBAT_COLORS as any)[frame.element]??'#ead69d';
  const text=cue?frame.label:frame.kind==='hurt'?`−${frame.amount}`:frame.kind==='block'?`Chặn ${frame.absorbed}`:frame.kind==='zero'?'0':frame.kind==='dodge'?'Né!':frame.kind==='heal'?`+${frame.amount} HP`:frame.kind==='mp_restore'?`+${frame.amount} MP`:frame.kind==='shield'?`+${frame.amount} Khiên`:frame.kind==='effect_blocked'?'Miễn nhiễm':frame.kind==='cleanse'?'Thanh tẩy':null;
  const hitGlyph=!cue&&!frame.custom&&!frame.periodic&&!['zero','dodge'].includes(frame.kind);
  return createPortal(<div className={`shared-combat-fx fx-${frame.kind} ${frame.primary?'primary-hit':''} ${frame.reduced?'reduced':''}`} data-combat-fx={frame.kind} data-fx-source={frame.sourceId} data-fx-target={frame.targetId} data-fx-damage-type={frame.damageType} data-fx-hit={frame.hitIndex} data-fx-id={frame.id} data-fx-custom={Boolean(frame.custom)} data-beneficial={frame.beneficial} style={{'--vfx-color':color,'--vfx-duration':`${frame.duration}ms`,'--vfx-hit-offset':`${((frame.hitIndex??0)%3)*22}px`} as React.CSSProperties} aria-hidden="true">
   {cue?<span className={`cast-cue ${frame.kind==='passive'?'passive-cue':''}`}>{frame.kind==='passive'?'◇ ':frame.reaction?'↗ ':'◆ '}{text}</span>:<>{hitGlyph&&<Glyph kind={frame.kind} damageType={frame.damageType}/>}<span className="vfx-number">{text}</span></>}
  </div>,frame.anchor,frame.id);
 })}</>;
}
