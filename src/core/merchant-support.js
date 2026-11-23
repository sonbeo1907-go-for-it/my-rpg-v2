import {isAlive} from './actor-life.js';

export function teamMpDiscount(battle,team){
 let ratio=0;for(const owner of battle.actors){const p=owner.passive;if(owner.team!==team||!isAlive(owner)||p?.type!=='team_mp_discount')continue;ratio=Math.max(ratio,p.ratio*(owner.combatModes?.[owner.activeMode]?.mpDiscountMultiplier??1));}return ratio;
}
export function preparedMpDiscount(content,campaign,id){const ids=campaign.party.includes(id)?campaign.party.filter(Boolean):[id];return Math.max(0,...ids.map(key=>content.characters[key]?.passive).filter(p=>p?.type==='team_mp_discount').map(p=>p.ratio));}
export function syncMpDiscountAuras(battle){for(const a of battle.actors)a.teamMpCostReduction=teamMpDiscount(battle,a.team);}
export function supportTurnStart(battle,owner,io){
 const mode=owner.combatModes?.[owner.activeMode],ratio=mode?.mainTurnTeamMpRatio;if(!ratio||battle.phase!=='main'||!isAlive(owner))return;
 const key=[battle.round,battle.phase,battle.cursor,battle.queue[battle.cursor],owner.id].join(':');if(owner.supportRecoveryTurn===key)return;owner.supportRecoveryTurn=key;
 io.announce(battle,owner);for(const ally of battle.actors.filter(a=>a.team===owner.team&&isAlive(a)))io.restore(battle,ally,'mp',Math.ceil(io.maxMp(battle.content,ally)*ratio),owner.id);
}
export function drainHitMp(battle,source,target,effect,context,io){
 if(!effect.mpDrainRatio||!isAlive(source)||source.team===target.team)return;
 const seen=context.mpDrainedTargets??=new Set();if(seen.has(target.id))return;seen.add(target.id);
 const amount=Math.min(target.mp,Math.ceil(io.maxMp(battle.content,target)*effect.mpDrainRatio));if(amount<=0)return;target.mp-=amount;
 io.emit(battle,{type:'mp_drain',sourceId:source.id,targetId:target.id,amount});io.write(battle,source.name+' hút '+amount+' MP từ '+target.name+'.');io.restore(battle,source,'mp',amount,source.id);
}
export function validateMerchantSupport(content){
 const errors=[],bad=id=>errors.push(id+': invalid merchant support');for(const a of Object.values(content.characters??{})){const p=a.passive;if(p?.type==='team_mp_discount'&&(!p.name||!p.description||!Number.isFinite(p.ratio)||p.ratio<=0||p.ratio>=1))bad(a.id);
  for(const mode of Object.values(a.combatModes??{})){
   if(mode.mpDiscountMultiplier!==undefined&&(p?.type!=='team_mp_discount'||!Number.isFinite(mode.mpDiscountMultiplier)||mode.mpDiscountMultiplier<1||p.ratio*mode.mpDiscountMultiplier>=1))bad(a.id);
   if(mode.mainTurnTeamMpRatio!==undefined&&(!Number.isFinite(mode.mainTurnTeamMpRatio)||mode.mainTurnTeamMpRatio<=0||mode.mainTurnTeamMpRatio>1||mode.lifetime!=='turns'||mode.durationClock!=='main_turn'))bad(a.id);
  }
 }
 for(const s of Object.values(content.abilities??{}))for(const e of s.effects??[]){if(e.mpDrainRatio!==undefined&&(e.type!=='damage'||!Number.isFinite(e.mpDrainRatio)||e.mpDrainRatio<=0||e.mpDrainRatio>1))bad(s.id);
  const h=e.onHitStatus;if(h?.charges!==undefined&&(!content.statuses[h.status]?.consumeOnPaidSkill||!Number.isSafeInteger(h.charges)||h.charges<1||h.charges>99))bad(s.id);
  if(h?.moonlightMultiplier!==undefined&&(e.type!=='damage'||content.statuses[h.status]?.kind!=='debuff'||!content.statuses[h.status].modifiers||!Number.isFinite(h.moonlightMultiplier)||h.moonlightMultiplier<=1||h.moonlightMultiplier>3||Object.values(content.statuses[h.status].modifiers).some(n=>n>=0||n*h.moonlightMultiplier< -1)))bad(s.id);
 }
 return errors;
}
