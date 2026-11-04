// Healing debt is stored in HP, not percentages; capacity changes never resize existing debt.
export function lifeDebt(actor) {
 return (actor?.statuses??[]).reduce((sum,status)=>sum+Math.max(0,status.debtHp??0),0);
}
export function payLifeDebt(actor,healing) {
 let remaining=healing,paid=0;
 for(const status of actor.statuses??[]){
  if(!(status.debtHp>0)||remaining<=0)continue;
  const payment=Math.min(status.debtHp,remaining);
  status.debtHp-=payment;remaining-=payment;paid+=payment;
 }
 actor.statuses=actor.statuses.filter(status=>status.debtHp===undefined||status.debtHp>0);
 return {paid,remaining};
}
export function clearLifeDebt(actor) {
 actor.statuses=actor.statuses.filter(status=>status.debtHp===undefined);
}
