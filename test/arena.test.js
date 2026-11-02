import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
import {createArenaBattle} from '../src/core/arena.js';
import {createBattle,getActor,executeAction,executeEnemyTurn,activeActor,abilityAvailability,targetsFor,basicAbility} from '../src/core/battle.js';
import {chooseArenaAction} from '../src/core/arena-ai.js';
import {resolveRankedAbility} from '../src/core/skill-resolver.js';
import {adjacentAllies} from '../src/core/scaling.js';
import {equipGear} from '../src/core/equipment.js';import {equipExclusive} from '../src/core/blacksmith.js';
const content=await loadContent();
function campaign(party){const c=createGameSave(content);c.party=party;c.partyPresets[0].slots=[...party];c.unlockedCharacterIds=[...new Set([...c.unlockedCharacterIds,...party.filter(Boolean)])];return c;}
const unit=(b,team,id)=>b.actors.find(a=>a.team===team&&a.characterId===id);
function cast(b,a,abilityId,targetId=a.id){b.outcome=null;b.phase='main';b.queue=[a.id,...b.actors.filter(t=>t.id!==a.id).map(t=>t.id)];b.cursor=0;executeAction(b,{actorId:a.id,abilityId,targetId});}
test('mirror produces unique actor IDs and preserves definition, slots, loadout and save',()=>{
 let c=campaign(['chelsea','iris',null,'garrek']);c.characters.chelsea.level=50;c.characters.chelsea.limitBreakRank=3;c.characters.chelsea.skillRanks={'chelsea.seal':5};c.gear=[{id:'gear_1',typeId:'t3_focused',stats:{speed:5}}];c.gacha.totalPulls=1;c=equipGear(c,content,'chelsea','gear_1');c.exclusiveGear=[{templateId:'chelsea.compass',statKey:'speed',statValue:5}];c=equipExclusive(c,content,'chelsea','chelsea.compass');const before=JSON.stringify(c),b=createArenaBattle(content,c);
 assert.equal(new Set(b.actors.map(a=>a.id)).size,6);assert.equal(JSON.stringify(c),before);
 for(const id of c.party.filter(Boolean)){const a=unit(b,'party',id),e=unit(b,'enemy',id);assert.equal(a.definitionId,id);assert.equal(e.definitionId,id);assert.notEqual(a.id,e.id);for(const key of ['stats','passive','exclusiveGear','gearEffects','skillRanks','formationSlot'])assert.deepEqual(a[key],e[key]);}
 assert.equal(resolveRankedAbility(content,unit(b,'enemy','chelsea'),'chelsea.seal').skillRank,5);
 assert.equal(unit(b,'enemy','garrek').formationSlot,3);
});
test('both sides wrap adjacent positions across empty slots as a four-slot formation',()=>{const b=createArenaBattle(content,campaign(['roland','arthur',null,'iris']));for(const team of ['party','enemy'])assert.deepEqual(adjacentAllies(b,unit(b,team,'roland')).map(a=>a.characterId),['arthur','iris']);});
test('Evidence and gunpowder are independent for each side; modes are local',()=>{const b=createArenaBattle(content,campaign(['selene','genevieve','isabelle','viktor']));cast(b,unit(b,'enemy','selene'),'selene.masquerade');assert.equal(b.teamResources.enemy.evidence.value,3);assert.equal(b.teamResources.party.evidence.value,0);assert.equal(unit(b,'enemy','selene').activeMode,'lunarmare');assert.equal(unit(b,'enemy','selene').combatModes.lunarmare.presentationScope,'none');cast(b,unit(b,'enemy','isabelle'),'isabelle.signature',unit(b,'party','genevieve').id);assert.equal(b.teamResources.enemy.gunpowder.value,2);assert.equal(b.teamResources.party.gunpowder.value,0);assert.equal(b.teamResources.party.evidence.value,0);});
test('opponent Gear IV procs, its owner remains distinct and main turn buffs do not leak sides',()=>{let c=campaign(['arthur','iris','elaine','garrek']);c.gear=[{id:'rune_1',typeId:'t4_effect',stats:{},effectId:'unerring_signet'}];c=equipGear(c,content,'arthur','rune_1');const b=createArenaBattle(content,c);for(const team of ['party','enemy'])assert.ok(unit(b,team,'arthur').statuses.some(s=>s.id==='true_strike_round'));});
test('enemy Lionel grants an extra turn only to enemy ally; Monica priority is relative to her side',()=>{const b=createArenaBattle(content,campaign(['lionel','monica','arthur','elaine']));const lionel=unit(b,'enemy','lionel'),arthur=unit(b,'enemy','arthur');cast(b,lionel,'lionel.encore',arthur.id);assert.ok(b.extraTurnGrants.has(arthur.id));assert.ok(!b.extraTurnGrants.has(unit(b,'party','arthur').id));cast(b,unit(b,'enemy','monica'),'monica.distortion');assert.equal(b.turnOrderField.priorityTeam,'enemy');});
test('follow-up is same-side only with mirrored Aurora',()=>{const b=createArenaBattle(content,campaign(['aurora','freya','elaine','garrek']));cast(b,unit(b,'enemy','freya'),'freya.fireball',unit(b,'party','garrek').id);assert.equal(unit(b,'enemy','aurora').resourceValues.thunder_charge,1);assert.equal(unit(b,'party','aurora').resourceValues.thunder_charge,0);assert.ok(b.events.some(e=>e.sourceId===unit(b,'enemy','aurora').id&&e.type==='damage'));});
test('every official character can use generic AI in a mirror, including Monica',()=>{
 for(const character of Object.values(content.characters).filter(c=>!c.developerOnly)){
  const c=campaign([character.id,'iris','elaine','garrek'].filter((id,i,a)=>a.indexOf(id)===i));while(c.party.length<4)c.party.push(null);
  const b=createArenaBattle(content,c);for(let n=0;n<80&&!b.outcome;n++){
   const a=activeActor(b);assert.ok(a,character.id);const command=chooseArenaAction(b,a,{abilityAvailability,targetsFor,basicAbility});
   try{if(a.team==='enemy')executeEnemyTurn(b);else executeAction(b,command);}catch(e){throw Error(character.id+' / '+a.name+' / '+command.abilityId+': '+e.message,{cause:e});}
  }
 }
});
test('arena draws after complete round limit and never modifies campaign',()=>{const c=campaign(['garrek','elaine',null,null]),before=encodeGameSave(c,content),b=createArenaBattle(content,c);b.arena.maxRounds=1;while(!b.outcome){const a=activeActor(b);executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});}assert.equal(b.outcome,'draw');assert.equal(encodeGameSave(c,content),before);});
test('normal PvE retains legacy actor IDs and enemy rank behavior',()=>{const b=createBattle(content,createGameSave(content),'forest_patrol');assert.ok(getActor(b,'arthur'));assert.ok(getActor(b,'enemy_0'));assert.equal(b.arena,null);assert.equal(resolveRankedAbility(content,getActor(b,'enemy_0'),'arthur.light_slash').skillRank,1);});

test('arena cannot roll or claim PvE rewards or daily progress',async()=>{const {prepareVictoryReward}=await import('../src/core/quest-rewards.js'),{claimBattleReward}=await import('../src/core/economy.js');const c=campaign(['arthur','iris','elaine','garrek']),before=JSON.stringify(c),b=createArenaBattle(content,c);b.outcome='victory';assert.deepEqual(prepareVictoryReward(b,content),{});assert.throws(()=>claimBattleReward(c,b,content),/Đấu tập/);assert.equal(JSON.stringify(c),before);});
test('enemy counter reacts on its own side and respects separate per-round limiter',()=>{const b=createArenaBattle(content,campaign(['takeshi','iris','elaine','garrek']));for(const a of b.actors){a.hp=a.stats.maxHp=10000;}b.random=()=>0;const defender=unit(b,'enemy','takeshi'),attacker=unit(b,'party','garrek');cast(b,defender,'takeshi.stance');cast(b,attacker,'$attack',defender.id);assert.ok(b.events.some(e=>e.type==='reaction'&&e.sourceId===defender.id));assert.equal(unit(b,'party','takeshi').reactionRound,0);assert.equal(defender.reactionRound,b.round);});
