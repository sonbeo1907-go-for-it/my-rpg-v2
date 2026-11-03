import {activeStatuses} from './status-state.js';
export function hasBeneficialStatus(content,actor){
 return activeStatuses(actor).some(s=>(s.remaining==null||s.remaining>0)&&(s.stacks??1)>0&&(s.charges??1)>0&&content.statuses[s.id]?.kind==='buff');
}
export function bypassedBarrierReduction(content,target,attacker){
 if(!hasBeneficialStatus(content,attacker))return 0;
 return activeStatuses(target).filter(s=>(s.remaining==null||s.remaining>0)&&content.statuses[s.id]?.bypassedByBuffedAttacker).reduce((sum,s)=>sum+(content.statuses[s.id].modifiers?.damageReduction??0)*(s.stacks??1),0);
}
