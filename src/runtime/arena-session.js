// A small durable abandonment marker, independent of campaign/save migrations.
const key=id=>'the-prisma-origin.arena-session.'+id;
export function saveArenaSession(storage,id,battle){
 if(id===null||id===undefined||!battle?.arena||battle.arena.recovered)return;
 storage.setItem(key(id),JSON.stringify({version:1,matchId:battle.arena.matchId,state:battle.outcome?'finished':'active',outcome:battle.outcome,forfeited:Boolean(battle.arena.forfeited),seed:battle.arena.seed,teamId:battle.arena.teamId,playerName:battle.arena.playerName,round:battle.round,party:battle.actors.filter(a=>a.team==='party').map(a=>a.characterId)}));
}
export function takeAbandonedArena(storage,id){
 try{const record=JSON.parse(storage.getItem(key(id))??'null');
  if(record?.version!==1||!(record.state==='active'||record.state==='finished'&&record.forfeited)||!Number.isSafeInteger(record.seed)||record.seed<0||record.seed>0xffffffff||typeof record.teamId!=='string'||!Array.isArray(record.party)||record.party.length!==4||typeof record.playerName!=='string')return null;
  storage.setItem(key(id),JSON.stringify({...record,state:'acknowledged',outcome:'defeat',forfeited:true}));return record;
 }catch{return null;}
}
