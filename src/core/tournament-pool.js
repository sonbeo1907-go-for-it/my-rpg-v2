// Pure authoring/selection helpers. No campaign writes, schedules or battle execution.
const object=x=>Boolean(x&&typeof x==='object'&&!Array.isArray(x));
const unique=a=>Array.isArray(a)&&a.every(x=>typeof x==='string'&&x.length>0)&&new Set(a).size===a.length;
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function identities(team){return team.members.map(m=>{const i=m.identity;return i.kind==='original_npc'?'npc:'+i.npcId:'character:'+i.characterId;});}
export function validateTournamentParticipants(d,teams,ids,keyCount=null){
 const errors=[];
 if(!unique(ids)||ids.length!==16||ids.some(id=>!d.candidateTeamIds.includes(id)||!teams[id]))return ['invalid participant references: exactly 16 required'];
 const rows=ids.map(id=>teams[id]);
 if(rows.filter(t=>t.controller==='player').length!==1||!ids.includes(d.playerTeamId))errors.push('invalid player participant');
 if([1,2,3,4].some(pot=>rows.filter(t=>t.seedPot===pot).length!==4))errors.push('seed pots must contain four participants each');
 const seen=new Set();for(const team of rows)for(const identity of identities(team)){if(seen.has(identity))errors.push('duplicate participant identity '+identity);seen.add(identity);}
 if(keyCount!==null&&rows.filter(t=>t.narrativeRole==='key').length!==keyCount)errors.push('invalid key team quota');
 return errors;
}
function random(seed){let n=2166136261;for(const c of String(seed))n=Math.imul(n^c.charCodeAt(0),16777619);return()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function shuffled(items,rng){const a=[...items].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
// Exhaustive finite backtracking, pruned by pot slots and remaining key/filler counts.
function search(d,teams,keyCount,seed){
 const player=teams[d.playerTeamId],rng=random(seed),keys=shuffled(d.candidateTeamIds.map(id=>teams[id]).filter(t=>t.narrativeRole==='key'),rng),filler=shuffled(d.candidateTeamIds.map(id=>teams[id]).filter(t=>t.narrativeRole==='filler'),rng);
 const candidates=[...keys,...filler],slots=[4,4,4,4];slots[player.seedPot-1]--;
 const used=new Set(identities(player)),chosen=[player.id];
 function visit(index,needed){
  if(chosen.length===16)return needed===0?[...chosen]:null;
  if(needed<0||candidates.length-index<16-chosen.length)return null;
  for(let pot=1;pot<=4;pot++)if(candidates.slice(index).filter(t=>t.seedPot===pot&&(needed>0||t.narrativeRole!=='key')).length<slots[pot-1])return null;
  if(candidates.slice(index).filter(t=>t.narrativeRole==='key').length<needed)return null;
  for(let i=index;i<candidates.length;i++){
   const t=candidates[i],isKey=t.narrativeRole==='key',ids=identities(t);
   if(!slots[t.seedPot-1]||(isKey&&needed===0)||ids.some(id=>used.has(id)))continue;
   slots[t.seedPot-1]--;chosen.push(t.id);ids.forEach(id=>used.add(id));
   const result=visit(i+1,needed-Number(isKey));
   chosen.pop();slots[t.seedPot-1]++;ids.forEach(id=>used.delete(id));
   if(result)return result;
  }
  return null;
 }
 return visit(0,keyCount);
}
export function selectTournamentParticipants(d,teams,{firstClear=false,drawSeed,keyCount}={}){
 if(typeof firstClear!=='boolean')throw Error('Invalid firstClear');
 if(!firstClear){const ids=d.selection.introduction.participantTeamIds;const errors=validateTournamentParticipants(d,teams,ids,4);if(errors.length)throw Error(errors.join('; '));return [...ids];}
 const weights=d.selection.keyCountWeights;
 if(keyCount===undefined){const rng=random(drawSeed),total=weights.reduce((n,w)=>n+w.weight,0);let roll=rng()*total;keyCount=weights.find(w=>(roll-=w.weight)<0)?.count??weights.at(-1).count;}
 if(!weights.some(w=>w.count===keyCount&&w.weight>0))throw Error('Invalid key team quota');
 const ids=search(d,teams,keyCount,drawSeed);if(!ids)throw Error('No feasible tournament pool');const errors=validateTournamentParticipants(d,teams,ids,keyCount);if(errors.length)throw Error(errors.join('; '));return ids;
}
export function validateTournamentPool(d,teams,builds,characters){
 const errors=[],fail=s=>errors.push(d.id+': '+s);
 if(d.teamIds!==undefined||d.participantCount!==16||!unique(d.candidateTeamIds)||d.candidateTeamIds.length!==27||d.candidateTeamIds.some(id=>!teams[id]||teams[id].tournamentId!==d.id)){fail('invalid candidate pool: 27 definitions required');return errors;}
 const rows=d.candidateTeamIds.map(id=>teams[id]),player=teams[d.playerTeamId];
 if(player?.controller!=='player'||player.seedPot!==4||player.narrativeRole!=='player'||rows.filter(t=>t.controller==='player').length!==1)fail('invalid player team');
 if(rows.filter(t=>t.narrativeRole==='filler').length!==18||rows.filter(t=>t.narrativeRole==='key').length!==8)fail('invalid narrative pool counts');
 for(const t of rows){
  if(!['player','key','filler'].includes(t.narrativeRole)||!Array.isArray(t.members)){fail('invalid team role/roster');continue;}
  for(const m of t.members){const i=m?.identity,source=builds[m?.buildId]?.templateCharacterId;
   if(m?.kind!==undefined||!object(i)){fail('invalid member identity');continue;}
   const fields=Object.keys(i).sort();
   if(i.kind==='original_npc'){if(!equal(fields,['kind','npcId'])||typeof i.npcId!=='string'||!i.npcId.trim()||t.controller!=='ai')fail('invalid NPC identity');}
   else if(['named_character','player_loan'].includes(i.kind)){
    if(!equal(fields,['characterId','kind'])||!characters?.[i.characterId]||source!==i.characterId||(i.kind==='player_loan')!==(t.controller==='player')||(i.kind==='named_character'&&t.narrativeRole!=='key'))fail('invalid named character identity');
   }else fail('invalid identity kind');
  }
 }
 for(const t of rows)if(Array.isArray(t.members)&&t.members.every(m=>object(m?.identity)&&['original_npc','named_character','player_loan'].includes(m.identity.kind))){
  const ids=identities(t);if(new Set(ids).size!==ids.length)fail('duplicate identity within team '+t.id);
 }
 for(const id of ['rotary','monica','lumine','eri'])if(!rows.some(t=>t.members?.some(m=>m?.identity?.kind==='named_character'&&m.identity.characterId===id)))fail('missing named character team '+id);
 const a=d.selection,progress=d.progression;
 if(!object(a)||a.method!=='seeded_pot_quota'||!equal(a.npcPotQuotas,[4,4,4,3])||!Array.isArray(a.keyCountWeights)||a.keyCountWeights.length!==2||!equal(a.keyCountWeights.map(w=>w?.count).sort(),[1,2])||a.keyCountWeights.some(w=>!Number.isFinite(w?.weight)||w.weight<=0)||a.tuningStatus!=='playtest'||!object(a.introduction)||typeof a.introduction.drawSeed!=='string'||!a.introduction.drawSeed.trim()){fail('invalid selection policy');return errors;}
 if(!equal(progress,{firstClear:{outcome:'champion',scope:'profile',commitWithResult:true},specialEncounterGate:'first_clear_at_run_creation'}))fail('invalid First Clear gate');
 if(!equal(d.seedPolicy,{beforeFirstClear:'fixed_introduction_draw',afterFirstClear:'new_draw_each_run',combat:'new_each_run_keep_on_retry',simulation:'new_each_run_commit_once',encounter:'snapshot_at_run_creation',unitIdentity:'run_team_member'}))fail('invalid seed policy');
 const special=d.specialEncounters;if(!object(special)||special.gate!=='first_clear_at_run_creation'||!equal(special.characterIds,['rotary','monica','lumine','eri'])||special.publication!=='design_only'||special.configured!==false)fail('invalid special encounter foundation');
 if(d.simulation?.keyTeamRatingAdvantage!==true)fail('missing key simulation policy');
 if(errors.length)return errors;
 try{
  const ids=selectTournamentParticipants(d,teams),pair=a.introduction.sameGroupTeamIds;
  for(const e of validateTournamentParticipants(d,teams,ids,4))fail(e);
  if(!unique(pair)||pair.length!==2||!pair.includes(d.playerTeamId)||pair.some(id=>!ids.includes(id))||teams[pair.find(id=>id!==d.playerTeamId)]?.seedPot!==3)fail('invalid introduction same-group constraint');
  const relations=rows.filter(t=>t.storyRelationship);if(relations.length!==4||relations.some(t=>t.narrativeRole!=='key'||!ids.includes(t.id))||!relations.some(t=>pair.includes(t.id)&&t.storyRelationship.anchorCharacterId==='luka'))fail('invalid introduction relationship teams');
  for(const w of a.keyCountWeights)selectTournamentParticipants(d,teams,{firstClear:true,drawSeed:'feasibility',keyCount:w.count});
 }catch(e){fail(e.message);}
 return errors;
}
