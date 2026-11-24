// Aggregate resolved outcomes, never parse translated/truncated presentation logs.
const fields=['damage','hpDamage','shieldDamage','commandDamage','healing','shieldCreated','shieldAbsorbed','hpTaken','shieldTaken','mpRestored','cleanses','extraTurns'];
function entry(battle,id){
 if(!id)return null;
 const actor=[...battle.actors,...battle.sourceActors??[]].find(a=>a.id===id);
 if(!actor)return null;
 const ledger=battle.contributions??={rows:{},events:0};
 const key=actor.actorKind==='moonlight'?id+':'+actor.definitionId:id;
 return ledger.rows[key]??={id:key,sourceId:id,name:actor.name,team:actor.team,kind:actor.actorKind??(actor.team==='party'?'character':'enemy'),...Object.fromEntries(fields.map(k=>[k,0]))};
}
export function recordContribution(battle,event){
 const owner=entry(battle,event.commanderId??event.sourceId),target=entry(battle,event.targetId);
 if(!battle.contributions)return;
 battle.contributions.events++;
 const amount=Math.max(0,event.amount??0);
 if(event.type==='damage'){
  const absorbed=Math.max(0,event.absorbed??0),hostile=owner&&target&&owner.team!==target.team;
  if(hostile){owner.hpDamage+=amount;owner.shieldDamage+=absorbed;owner.damage+=amount+absorbed;if(event.commanderId)owner.commandDamage+=amount+absorbed;}
  if(target){target.hpTaken+=amount;target.shieldTaken+=absorbed;}
  const shieldOwner=entry(battle,event.shieldSourceId);if(shieldOwner)shieldOwner.shieldAbsorbed+=absorbed;
 }
 if(owner&&event.type==='heal')owner.healing+=amount;
 if(owner&&event.type==='shield')owner.shieldCreated+=Math.max(0,event.added??amount);
 if(owner&&event.type==='mp_restore')owner.mpRestored+=amount;
 if(owner&&event.type==='cleanse')owner.cleanses+=event.amount??event.statusIds?.length??0;
 if(owner&&event.type==='extra_turn_granted')owner.extraTurns++;
}
export function contributionReport(battle,team='party'){
 const byId=battle.contributions?.rows??{},actors=[...battle.actors,...battle.sourceActors??[]].filter(a=>a.team===team&&a.actorKind!=='moonlight');
 const rows=actors.map(a=>({...Object.fromEntries(fields.map(k=>[k,0])),id:a.id,name:a.name,team,kind:a.actorKind??'character',...byId[a.id]})).concat(Object.values(byId).filter(r=>r.team===team&&r.kind==='moonlight'));
 const totals=Object.fromEntries(fields.map(k=>[k,rows.reduce((n,r)=>n+r[k],0)]));
 return {rows:rows.map(r=>({...r,damagePercent:totals.damage?r.damage/totals.damage*100:0})),totals,round:battle.round,actions:battle.actionCount??0};
}
