"use client";
import {isAlive} from "../core/actor-life.js";

import {Fragment} from "react";
import {useGame} from "../runtime/game-context";
import {activeTurnOrderField} from "../core/turn-order.js";
import {Icon} from "./ui";
import {CombatPopover} from "./combat-popover";

export function TurnOrder({onHover}:{onHover:(id:string)=>void}) {
  const {battle}=useGame();
  const field=activeTurnOrderField(battle);
  const pending=battle.queue.slice(battle.cursor).map((id:string)=>battle.actors.find((actor:any)=>actor.id===id)).filter((actor:any)=>isAlive(actor));
  const remaining=field ? field.expiresAfterRound-battle.round+1 : 0;
  return <div className="turn-order" data-turn-field={field?.kind}>
    {battle.outcome ? "Cuộc chạm trán đã khép lại." : <>
      <div className="turn-order-heading">
        <span className="turn-order-label">{battle.phase==="extra"?"VÒNG PHỤ · LƯỢT THÊM":"THỨ TỰ LƯỢT CHÍNH"}</span>
        {field && <CombatPopover label={field.name} content={<><h3>{field.name}</h3><p>Phe {field.priorityTeam==="party"?"đồng minh":"đối thủ"} được ưu tiên. Trong từng phe vẫn xếp theo SPD.</p><p>Còn {remaining} vòng, tính cả vòng hiện tại. Hết hiệu lực sau Vòng Phụ.</p><p>Chỉ đổi lượt chưa thực hiện; không cấp thêm lượt.</p></>}>
          <button type="button" className="turn-field-badge" aria-label={`${field.name} · còn ${remaining} vòng`}><Icon name="hourglass"/>{field.name}<span>{remaining} vòng</span></button>
        </CombatPopover>}
      </div>
      <div className="turn-chips">
        {pending.map((actor:any,index:number)=><Fragment key={actor.id}>
          {field && index>0 && pending[index-1].team!==actor.team && <span className="turn-team-divider" role="img" aria-label="Đồng hồ cát · ranh giới lượt đồng minh và đối thủ" title={field.name}><Icon name="hourglass"/></span>}
          <button data-turn-actor={actor.id} data-turn-team={actor.team} className={actor.id===battle.activeId?"acting":""} onPointerEnter={()=>onHover(actor.id)} onPointerLeave={()=>onHover("")} onFocus={()=>onHover(actor.id)} onBlur={()=>onHover("")} aria-label={`Xem vị trí ${actor.name}`}>
            {actor.id===battle.activeId?"◆ ":""}{actor.name}
          </button>
        </Fragment>)}
      </div>
    </>}
  </div>;
}
