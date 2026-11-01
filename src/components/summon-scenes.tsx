"use client";
import {isAlive} from "../core/actor-life.js";

import type {CSSProperties} from 'react';
export function SummonScenes({presentation,actors,round}:{presentation:any;actors:any[];round:number}) {
 const scenes=presentation?.scenes??(presentation?[presentation]:[]);
 const backdrops=scenes.filter((scene:any)=>Boolean(scene.background));
 return <>
  {backdrops.map((scene:any)=><div key={scene.ownerId+scene.mode} data-scene-owner={scene.ownerId} data-scene-mode={scene.mode} className={'summon-backdrop mode-scene mode-scene-'+scene.mode} aria-hidden="true" style={{backgroundImage:`url("${scene.background}")`,opacity:backdrops.length>1?.65:1,zIndex:0} as CSSProperties}><span className="summon-eye-halo"/></div>)}
  {actors.filter(actor=>isAlive(actor)&&actor.pendingMode).map(actor=><div className="summon-pending" role="status" data-pending-mode={actor.id} key={actor.id}>{actor.name} · {actor.combatModes[actor.pendingMode.id].name}<span>Đang chuẩn bị · Hoàn tất đầu vòng {actor.pendingMode.readyRound}</span></div>)}
  {actors.flatMap(actor=>isAlive(actor)?Object.entries(actor.companionStates??{}).filter(([,state]:any)=>!state.active).map(([id,state]:any)=><div className="summon-pending" role="status" data-pending-companion={id} key={actor.id+id}>{actor.companions[id].name}<span>Đang đến · Xuất hiện đầu vòng {state.readyRound}</span></div>):[])}
  {scenes.map((scene:any)=><div className={'summon-state summon-state-'+scene.mode+(scene.background?'':' mode-summary-only')} data-mode-banner={scene.mode} role="status" key={scene.ownerId+scene.mode} style={scene.background?{'--summon-art':`url("${scene.background}")`} as CSSProperties:undefined}>{scene.mode==='magnamut'?'Magnamut · Cộng hưởng thời không':scene.name}<span>{scene.summary}</span>{scene.mode==='azurius'&&<small>Còn {Math.max(0,(actors.find(actor=>actor.id===scene.ownerId)?.modeExpiresAfterRound??round)-round+1)} vòng, tính cả vòng hiện tại</small>}</div>)}
 </>;
}
