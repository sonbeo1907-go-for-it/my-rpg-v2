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
// A preferred debt payment is an alternative cost, not HP loss or received healing.
export function preferredLifeDebtCost(skill,actor){
 const ratio=skill.cost?.preferLifeDebtRatio;
 if(!ratio||!actor)return 0;
 const amount=Math.ceil(actor.stats.maxHp*ratio);
 return amount>0&&lifeDebt(actor)>=amount?amount:0;
}
export function externalHealingBlocked(actor,sourceId){return actor?.passive?.blockExternalHealing===true&&lifeDebt(actor)>0&&sourceId!==actor.id;}
export function mortgageDamageBonus(actor){return actor?.passive?.type==='life_mortgage_pact'&&lifeDebt(actor)>0?actor.passive.damageBonus:0;}
export function clearLifeDebt(actor) {
 actor.statuses=actor.statuses.filter(status=>status.debtHp===undefined);
}
