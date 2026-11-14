"use client";
import {useTurnOrderMotion} from "./turn-order-motion";
import {turnOrderEntries} from '../core/turn-delegation.js';


import {Fragment} from "react";
import {useGame} from "../runtime/game-context";
import {activeTurnOrderField} from "../core/turn-order.js";
import {Icon} from "./ui";
import {CombatPopover} from "./combat-popover";

export function TurnOrder({onHover}:{onHover:(id:string)=>void}) {
  const {battle}=useGame();
  const field=activeTurnOrderField(battle);
  const pending=turnOrderEntries(battle).map((entry:any)=>({...entry.actor,turnKey:entry.key,delegated:entry.delegated,turnOwner:battle.actors.find((a:any)=>a.id===entry.ownerId)?.name}));
  const remaining=field ? field.expiresAfterRound-battle.round+1 : 0;
  const signature=JSON.stringify(pending.map((a:any,i:number)=>[a.turnKey,a.id,a.name,a.team,i===0&&a.id===battle.activeId]))+'|'+(field?.kind??'');
  const rail=useTurnOrderMotion(signature,`${battle.sessionId}:${battle.round}:${battle.phase}`,battle.phase==='extra');
  return <div className="turn-order" data-turn-field={field?.kind}>
    <>
      <div className="turn-order-heading">
        <span className="turn-order-label">{battle.outcome?"Cuộc chạm trán đã khép lại.":battle.phase==="extra"?"VÒNG PHỤ · LƯỢT THÊM":"THỨ TỰ LƯỢT CHÍNH"}</span>
        {field && <CombatPopover label={field.name} content={<><h3>{field.name}</h3>{field.kind==='speed_shift'?<p>Phe thi triển +{Math.round(field.allySpeed*100)}% SPD · phe đối phương {Math.round(field.enemySpeed*100)}% SPD. Xếp lượt theo SPD toàn bàn; không phải buff/debuff.</p>:<p>Phe {field.priorityTeam==="party"?"đồng minh":"đối thủ"} được ưu tiên. Trong từng phe vẫn xếp theo SPD.</p>}<p>Còn {remaining} vòng, tính cả vòng hiện tại. Hết hiệu lực sau Vòng Phụ.</p><p>Chỉ đổi lượt chưa thực hiện; không cấp thêm lượt.</p></>}>
          <button type="button" className="turn-field-badge" aria-label={`${field.name} · còn ${remaining} vòng`}><Icon name="hourglass"/>{field.name}<span>{remaining} vòng</span></button>
        </CombatPopover>}
      </div>
      <div className="turn-rail" ref={rail} aria-label="Thứ tự hành động"><div className="turn-chips">
        {pending.map((actor:any,index:number)=><Fragment key={actor.turnKey}>
          {field?.kind==='team_priority' && index>0 && pending[index-1].team!==actor.team && <span data-turn-key={`divider:${pending[index-1].id}:${actor.id}`} className="turn-team-divider" role="img" aria-label="Đồng hồ cát · ranh giới lượt đồng minh và đối thủ" title={field.name}><Icon name="hourglass"/></span>}
          <button data-turn-key={actor.turnKey} data-turn-actor={actor.id} data-turn-owner={actor.turnKey} data-turn-team={actor.team} className={index===0&&actor.id===battle.activeId?"acting":""} onPointerEnter={()=>onHover(actor.id)} onPointerLeave={()=>onHover("")} onFocus={()=>onHover(actor.id)} onBlur={()=>onHover("")} aria-label={`Xem vị trí ${actor.name}${actor.delegated?` · lượt từ ${actor.turnOwner}`:""}`}>
            {index===0&&actor.id===battle.activeId?"◆ ":""}{battle.arena?(actor.team==='party'?'Bạn · ':'Địch · ')+(actor.characterName??actor.name):actor.name}{actor.delegated&&<small className="delegated-turn-label"> ← {actor.turnOwner}</small>}
          </button>
        </Fragment>)}
      </div><div className="turn-exit-layer" data-turn-exits aria-hidden="true"/></div>
    </>
  </div>;
}
