import {isAlive} from './actor-life.js';
export function softCapValue(amount,rule){return amount<=rule.threshold?amount:rule.threshold+(amount-rule.threshold)*rule.overflowRatio;}
export function pvpDamageKind(ctx,area=false){
 if(ctx.periodic)return 'periodic';
 const group=area||['all_enemies','enemy_splash','random_enemies'].includes(ctx.skill?.target);
 if(ctx.reaction||ctx.automatic)return group?'reaction_area':ctx.reactionKind==='follow_up'?'follow_up':'counter';
 if(ctx.skill?.target==='random_enemies')return 'random';
 if(group)return 'area';
 const count=ctx.skill?.effects?.filter(e=>e.type==='damage').reduce((n,e)=>n+(e.hits??1),0)??1;
 return count>1?'multi':'single';
}
function capTargets(b,source,target,ctx,kind){
 let pool=(ctx.pvpTargetSnapshot??b.actors.filter(a=>a.team!==source?.team&&isAlive(a)).map(a=>a.id)).map(id=>b.actors.find(a=>a.id===id)).filter(Boolean);
 const primary=ctx.primaryTargetId??target.id;
 if(ctx.skill?.target==='enemy_splash'){const anchor=pool.find(a=>a.id===primary),slot=anchor?.formationSlot;pool=pool.filter(a=>slot===undefined||Math.abs(a.formationSlot-slot)<=1);}
 if(!['area','random','reaction_area'].includes(kind))pool=[target];
 return pool.length?pool:[target];
}
export function reservePvpAutomatic(b,actor,io){
 if(!b.pvpRules)return true;
 if(b.pvpTriggers?.round!==b.round)b.pvpTriggers={round:b.round,counts:{}};
 const count=b.pvpTriggers.counts[actor.id]??0;
 if(count>=b.pvpRules.loopGuards.maxAutomaticActionsPerUnitPerRound){io.write(b,actor.name+': PvP chặn kích hoạt tự động vượt giới hạn vòng.');return false;}
 b.pvpTriggers.counts[actor.id]=count+1;return true;
}
export function allowPvpHit(b,actor,ctx,io){
 if(!b.pvpRules)return true;
 if(ctx.pvpDenied)return false;
 if((ctx.reaction||ctx.automatic)&&!ctx.pvpRegistered){ctx.pvpRegistered=true;if(!reservePvpAutomatic(b,actor,io)){ctx.pvpDenied=true;return false;}}
 ctx.pvpHits=(ctx.pvpHits??0)+1;
 if(ctx.pvpHits>b.pvpRules.loopGuards.maxDamageHitsPerAction){ctx.pvpDenied=true;io.write(b,actor.name+': PvP chặn số hit vượt giới hạn kỹ năng.');return false;}
 return true;
}
export function applyPvpDamageCap(b,source,target,amount,ctx,area,io){
 if(!b.pvpRules||source?.team===target.team)return {amount,info:null};
 const names={single:'Đơn mục tiêu',multi:'Nhiều hit',random:'Ngẫu nhiên',area:'Diện rộng',follow_up:'Liên kích',counter:'Phản công',reaction_area:'Phản ứng diện rộng',periodic:'Sát thương duy trì'};
 const kind=pvpDamageKind(ctx,area),rule=b.pvpRules.softCaps[kind];
 if(!ctx.pvpDamage){
  const targets=capTargets(b,source,target,ctx,kind),damageEffects=ctx.skill?.effects?.filter(e=>e.type==='damage')??[];
  const weight=a=>damageEffects.reduce((n,e)=>n+(a.id===ctx.primaryTargetId?(e.primaryMultiplier??e.multiplier??1):(e.multiplier??1))*(e.hits??1),0)||1;
  const totalWeight=targets.reduce((n,a)=>n+weight(a),0);
  ctx.pvpDamage={kind,targets:Object.fromEntries(targets.map(a=>[a.id,{raw:0,threshold:Math.min(rule.threshold,rule.totalThreshold===undefined?rule.threshold:rule.totalThreshold*weight(a)/totalWeight)}]))};
 }
 const record=ctx.pvpDamage.targets[target.id]??=( {raw:0,threshold:rule.threshold} );
 const before=record.raw;record.raw+=amount;
 const config={...rule,threshold:record.threshold};
 const capped=Math.max(0,Math.floor(softCapValue(record.raw,config))-Math.floor(softCapValue(before,config)));
 const info={before:amount,after:capped,kind,threshold:record.threshold,cumulativeBefore:before,cumulativeAfter:record.raw,rulesetVersion:b.pvpRules.rulesetVersion};
 if(b.pvpRules.debugDamage){io.emit(b,{type:'pvp_soft_cap',sourceId:source?.id,targetId:target.id,...info});io.write(b,`[PvP ${info.rulesetVersion}] ${source?.name??'Hiệu ứng'} → ${target.name}: ${amount} → ${capped} sát thương qua soft cap (${names[kind]}).`);}
 return {amount:capped,info};
}
export function pvpPeriodicContext(b,source,target){
 if(b.pvpPeriodic?.round!==b.round)b.pvpPeriodic={round:b.round,contexts:{}};
 const key=(source?.id??'environment')+':'+target.id;
 return b.pvpPeriodic.contexts[key]??=( {periodic:true} );
}
