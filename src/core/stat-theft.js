import {baseStatValue} from './combat-math.js';

// A transfer creates two independent dispellable statuses. Prepared stats never mutate.
export function stealBaseStat(battle,actor,target,effect,io){
 const own=actor.statuses.find(s=>s.id===effect.buff),lost=target.statuses.find(s=>s.id===effect.debuff);
 const held=own?.baseStatModifiers?.[effect.stat]??0;
 const debt=Math.max(0,-(lost?.baseStatModifiers?.[effect.stat]??0));
 const base=Math.max(0,baseStatValue(target,effect.stat));
 const amount=Math.max(0,Math.min(base*effect.ratio,effect.cap-held,effect.cap-debt));
 if(amount<=0){io.write(battle,actor.name+': không thể cướp thêm '+effect.cap+' '+({attack:'ATK',magic:'MAG',defense:'DEF',resistance:'RES',speed:'SPD'}[effect.stat])+' căn bản.');return 0;}
 const applied=io.status(battle,target,effect.debuff,undefined,actor.id,{baseStatModifiers:{[effect.stat]:-debt-amount}});
 if(!applied)return 0;
 io.status(battle,actor,effect.buff,undefined,actor.id,{baseStatModifiers:{[effect.stat]:held+amount}});
 const n=new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2}).format(amount);
 io.write(battle,actor.name+' cướp '+n+' '+({attack:'ATK',magic:'MAG',defense:'DEF',resistance:'RES',speed:'SPD'}[effect.stat])+' căn bản từ '+target.name+'.');
 io.emit(battle,{type:'base_stat_stolen',sourceId:actor.id,targetId:target.id,stat:effect.stat,amount,total:held+amount});
 return amount;
}

export function validateStatTheft(content){
 const errors=[],stats=['attack','magic','defense','resistance','speed'];
 for(const s of Object.values(content.statuses))if(s.baseStatShift&&(!s.persistent||!stats.includes(s.baseStatShift.stat)||!Number.isFinite(s.baseStatShift.cap)||s.baseStatShift.cap<=0||s.modifiers||s.maxStacks))errors.push(s.id+': invalid base stat shift');
 for(const skill of Object.values(content.abilities))for(const e of skill.effects??[])if(e.type==='steal_base_stat'){
  const buff=content.statuses[e.buff],debuff=content.statuses[e.debuff];
  if(skill.target!=='enemy'||!stats.includes(e.stat)||!Number.isFinite(e.ratio)||e.ratio<=0||e.ratio>1||!Number.isFinite(e.cap)||e.cap<=0||buff?.kind!=='buff'||debuff?.kind!=='debuff'||[buff,debuff].some(s=>s?.baseStatShift?.stat!==e.stat||s?.baseStatShift?.cap!==e.cap))errors.push(skill.id+': invalid base stat theft');
 }
 return errors;
}
