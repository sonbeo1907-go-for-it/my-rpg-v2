import {activeStatuses} from './status-state.js';
// These are recipient-side reductions. Different sources use the strongest value.
export function receivedSupport(content,target,amount,key){
 const reduction=Math.max(0,...activeStatuses(target).filter(s=>s.remaining==null||s.remaining>0).map(s=>content.statuses[s.id]?.[key]??0));
 return Math.max(0,Math.round(amount*(1-Math.min(1,reduction))));
}
export function consumeStatusCharge(target,status){
 status.charges=Math.max(0,(status.charges??1)-1);
 if(!status.charges)target.statuses=target.statuses.filter(s=>s!==status);
}
