import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {loadContent} from '../scripts/load-content.mjs';
import {validateContent} from '../src/core/content.js';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,activeActor,getActor,executeAction,executeEnemyTurn,forecastBattleAction,targetsFor,basicAbility} from '../src/core/battle.js';
import {bossRitualNotices,bossActionCount,curseDebuffCount} from '../src/core/encounter-rituals.js';
import {isQuestUnlocked,questCatalog,encounterReturnPath} from '../src/core/quest-catalog.js';
import {claimBattleReward} from '../src/core/economy.js';
import {levelScaledEnemyStats} from '../src/core/enemy-scaling.js';
import {seededRandom} from '../src/core/random.js';

const content=await loadContent();
const ids=['east_super_mountain','east_super_fox','east_super_twins'];
function save(party=['arthur','iris','elaine','garrek']){
  const s=createGameSave(content);s.party=party;s.partyPresets[0].slots=[...party];
  s.unlockedCharacterIds=Object.keys(content.characters);s.storyFlags.push('east_campaign_completed');return s;
}
function setup(id='east_super_mountain',party=['arthur','iris','elaine','garrek'],level=60,source=content){
  const b=createBattle(source,save(party),id,seededRandom(411),{enemyLevel:level});
  for(const a of b.actors.filter(a=>a.team==='party')){
    a.stats.maxHp=50000;a.hp=50000;a.stats.maxMp=1000;a.mp=1000;
    a.stats.speed=100;a.stats.attack=60;a.stats.magic=60;
  }
  return b;
}
const boss=b=>b.actors.find(a=>a.team==='enemy');
function step(b,policy){
  assert.ok(!b.outcome,'Test advanced into ended battle');
  const a=activeActor(b);assert.ok(a);
  if(a.team==='enemy')executeEnemyTurn(b);
  else executeAction(b,policy?.(a,b)??{actorId:a.id,abilityId:'$defend',targetId:a.id});
}
function until(b,predicate,policy){for(let i=0;i<1500&&!predicate();i++)step(b,policy);assert.ok(predicate(),'Progression limit exceeded');}
function round(b,n){until(b,()=>b.round>=n);}
function act(b,id,skill='$attack',target='enemy_0'){
  until(b,()=>activeActor(b)?.id===id);executeAction(b,{actorId:id,abilityId:skill,targetId:target});
}
function readyMountain(party=['arthur','iris','elaine','garrek']){
  const b=setup('east_super_mountain',party);round(b,4);
  assert.ok(boss(b).bossState.pendingMoves.some(m=>m.ritual?.kind==='stance'));
  return b;
}

test('three post-Orochi supers share Lv1 templates, four Super Levels and valid shipped music',()=>{
  assert.deepEqual(validateContent(content),[]);
  for(const id of ids){const e=content.encounters[id];assert.equal(e.category,'east_super');assert.equal(e.referenceLevel,1);assert.equal(e.hpReferenceLevel,1);assert.equal(e.hpScalingProfile,'superboss');assert.deepEqual(e.superLevels,[60,70,80,90]);
    for(const track of content.music[e.bgm].tracks)assert.ok(existsSync(new URL('../public'+track,import.meta.url)));
  }
});
test('Orochi gate is independent of legacy sinister flags and enforced at createBattle',()=>{
  const s=createGameSave(content);s.storyFlags.push('illusion.sinister_unlocked');
  for(const id of ids){assert.equal(isQuestUnlocked(content.encounters[id],s),false);assert.throws(()=>createBattle(content,s,id),/Orochi/);}
  s.storyFlags.push('east_campaign_completed');
  assert.deepEqual(questCatalog(content,s,{tab:'east'}).filter(e=>e.category==='east_super').map(e=>e.id),ids);
  assert.ok(!questCatalog(content,s,{tab:'sinister'}).some(e=>ids.includes(e.id)));
  for(const id of ids){assert.equal(createBattle(content,s,id).enemyLevel,60);for(const level of [60,70,80,90])assert.equal(createBattle(content,s,id,undefined,{enemyLevel:level}).enemyLevel,level);assert.throws(()=>createBattle(content,s,id,undefined,{enemyLevel:55}),/Cấp/);}
});
test('legacy Orochi receipt restores the completion flag without granting another reward',()=>{
  const s=createGameSave(content);s.claimedFirstClearRewards.push('east_ke_08');s.coins=321;
  assert.equal(isQuestUnlocked(content.encounters[ids[0]],s),true);
  const loaded=decodeGameSave(encodeGameSave(s,content),content);assert.ok(loaded.storyFlags.includes('east_campaign_completed'));assert.equal(loaded.coins,321);
});
test('scouting and battle stats use one level scaling pass, including both twins',()=>{
  for(const id of ids)for(const level of [60,70,80,90]){
    const b=createBattle(content,save(),id,undefined,{enemyLevel:level});
    for(const a of b.actors.filter(a=>a.team==='enemy'))assert.deepEqual(a.stats,levelScaledEnemyStats(content.enemies[a.definitionId],level,content,1,content.encounters[id]));
    assert.equal(encounterReturnPath(content,id,null,level),`/quests?tab=east&selected=${id}&superLevel=${level}`);
  }
});
test('giant footprint is one selectable actor, one AoE recipient and one queue entry',()=>{
  const b=setup(),a=getActor(b,'iris');
  assert.equal(b.actors.filter(a=>a.team==='enemy').length,1);assert.equal(boss(b).formationSpan,3);
  assert.deepEqual(targetsFor(b,a,{target:'all_enemies'}).map(a=>a.id),['enemy_0']);
  assert.equal(b.queue.filter(id=>id==='enemy_0').length,1);
  a.basicAttack=[{type:'damage',damageType:'magical',element:'plain',multiplier:.6,hits:2}];
  act(b,'iris');assert.equal(b.events.filter(e=>e.type==='damage'&&e.sourceId==='iris').length,2);
});
test('Sơn Thế waits for a full warning round and a multi-hit cast breaks only one mark',()=>{
  const b=readyMountain(),a=getActor(b,'arthur');
  const move=boss(b).bossState.pendingMoves.find(m=>m.ritual);
  assert.equal(move.warningRound,4);assert.equal(move.readyRound,5);assert.equal(move.ritual.marks,0);
  a.basicAttack=[{type:'damage',damageType:'physical',element:'water',multiplier:.1,hits:4}];
  act(b,'arthur');assert.equal(move.ritual.marks,1);assert.equal(b.events.filter(e=>e.type==='damage'&&e.sourceId==='arthur').length,4);
  const text=bossRitualNotices(b).find(n=>n.kind==='stance');assert.equal(text.marks,1);
});
test('wrong element, periodic damage and unsuccessful commands do not break Sơn Thế',()=>{
  const b=readyMountain(),a=getActor(b,'arthur'),enemy=boss(b),move=enemy.bossState.pendingMoves.find(m=>m.ritual);
  a.basicAttack=[{type:'damage',damageType:'physical',element:'plain',multiplier:.1}];
  until(b,()=>activeActor(b).id==='arthur');
  assert.throws(()=>executeAction(b,{actorId:'arthur',abilityId:'not-a-skill',targetId:enemy.id}));assert.equal(move.ritual.marks,0);
  executeAction(b,{actorId:'arthur',abilityId:'$attack',targetId:enemy.id});assert.equal(move.ritual.marks,0);
  enemy.statuses.push({id:'kai_poison',remaining:3,stacks:1,sourceId:a.id,potency:1});
  until(b,()=>activeActor(b)?.id===enemy.id);assert.equal(move.ritual.marks,0);
});
test('three independent weakness casts cancel collapse, expose one boss and use no extra action',()=>{
  const b=readyMountain(),enemy=boss(b),move=enemy.bossState.pendingMoves.find(m=>m.ritual);
  for(const id of ['arthur','iris','elaine']){
    getActor(b,id).basicAttack=[{type:'damage',damageType:'magical',element:'water',multiplier:.1}];act(b,id);
  }
  assert.equal(move.ritual.marks,3);assert.equal(move.ritual.cancelled,true);assert.ok(enemy.bossState.stanceExposure);
  until(b,()=>b.round===5);
  assert.equal(enemy.bossState.stanceExposure,undefined,'exposure ends after the next actual boss main turn');
  until(b,()=>b.round===6);
  assert.equal(b.log.some(s=>s.includes('dùng Núi Đổ Không Trời')),false);
  assert.ok(b.log.some(s=>s.includes('Vỡ Thế')));
});
test('partial breaks reduce only collapse damage, not subsequent ordinary attacks',()=>{
  const results=[];
  for(const marks of [0,1,2]){
    const b=readyMountain(),enemy=boss(b),move=enemy.bossState.pendingMoves.find(m=>m.ritual);
    // Fix incoming defense and remove guard at the actual cast so only the ritual ratio differs.
    for(const a of b.actors.filter(a=>a.team==='party'))a.stats.defense=0;
    move.ritual.marks=marks;
    until(b,()=>b.round===5&&activeActor(b)?.id===enemy.id);
    for(const a of b.actors.filter(a=>a.team==='party'))a.statuses=[];
    executeEnemyTurn(b);
    const damage=b.events.find(e=>e.type==='damage'&&e.abilityId==='east_great.mountain_collapse');assert.ok(damage);results.push(damage.amount);
  }
  assert.equal(results[1],Math.floor(results[0]*.85));assert.equal(results[2],Math.floor(results[0]*.7));
});
test('phase transitions cancel pending rituals without refilling MP or resetting mode/resources',()=>{
  const b=readyMountain(),a=getActor(b,'arthur'),enemy=boss(b);a.mp=17;a.resourceValues.resonance=2;
  a.basicAttack=[{type:'damage',damageType:'physical',element:'light',multiplier:1}];a.stats.attack=100000;
  act(b,'arthur');assert.equal(enemy.bossState.phase,2);assert.equal(enemy.hp,Math.ceil(enemy.stats.maxHp*.5));assert.equal(a.mp,17);assert.equal(a.resourceValues.resonance,2);
  assert.deepEqual(enemy.bossState.pendingMoves,[]);assert.ok(b.log.some(s=>s.includes('hủy nghi thức cũ')));
});
test('forecast owns a cloned ritual state and cannot spend the real marks or RNG',()=>{
  const b=readyMountain(),a=getActor(b,'arthur');a.basicAttack=[{type:'damage',damageType:'physical',element:'water',multiplier:.1}];
  until(b,()=>activeActor(b)?.id===a.id);
  const state=structuredClone(boss(b).bossState),hp=boss(b).hp;
  const preview=forecastBattleAction(b,{actorId:a.id,abilityId:'$attack',targetId:'enemy_0'});
  assert.deepEqual(boss(b).bossState,state);assert.equal(boss(b).hp,hp);
  assert.equal(boss(preview).bossState.pendingMoves.find(m=>m.ritual).ritual.marks,1);
});
test('serializable pending rituals survive a state clone and progress to the same outcome',()=>{
  const b=readyMountain(),{content:c,random,...state}=b;
  const clone={...structuredClone(state),content:c,random:seededRandom(random.getState())};
  round(b,6);round(clone,6);
  assert.equal(boss(clone).bossState.mainTurnsCompleted,boss(b).bossState.mainTurnsCompleted);
  assert.deepEqual(boss(clone).bossState.pendingMoves,boss(b).bossState.pendingMoves);
});
test('Cửu Vĩ debuff count is source-aware, distinct by type and ignores old expired effects',()=>{
  const b=setup('east_super_fox'),enemy=boss(b),a=getActor(b,'arthur');
  a.statuses=[{id:'deep_wound',remaining:2,stacks:1,sourceId:enemy.id},{id:'shield_fracture',remaining:2,stacks:3,sourceId:enemy.id},{id:'buff_seal',remaining:null,charges:1,sourceId:enemy.id},{id:'mana_disruption',remaining:null,charges:1,sourceId:'iris'}];
  assert.equal(curseDebuffCount(b,enemy,a),3);
  a.statuses=a.statuses.filter(s=>s.id!=='deep_wound');assert.equal(curseDebuffCount(b,enemy,a),2);
});
test('Cửu Vĩ actually applies seals, MP disruption, wound and fracture using normal status effects',()=>{
  const b=setup('east_super_fox');round(b,5);
  assert.ok(b.log.some(s=>s.includes('Phong Ấn')));assert.ok(b.log.some(s=>s.includes('Nhiễu Ma Lực')));
  assert.ok(b.log.some(s=>s.includes('Vết Thương Sâu')));assert.ok(b.log.some(s=>s.includes('Rạn Khiên')));
  const notice=bossRitualNotices(b).find(n=>n.kind==='curse');
  // First ritual is prepared on the fifth actual boss turn; finish that turn if needed.
  if(!notice){round(b,6);assert.ok(bossRitualNotices(b).some(n=>n.kind==='curse'));}
});
test('cleansing Cửu Vĩ effects during the real warning window reduces the actual ritual hit',()=>{
  const values=[];
  for(const cleanse of [false,true]){
    const b=setup('east_super_fox'),enemy=boss(b);round(b,6);
    const move=enemy.bossState.pendingMoves.find(m=>m.ritual?.kind==='curse');assert.ok(move);assert.equal(move.warningRound,6);assert.equal(move.readyRound,7);
    until(b,()=>b.round===7&&activeActor(b)?.id===enemy.id);
    for(const a of b.actors.filter(a=>a.team==='party')){
      a.statuses=cleanse?[]:[{id:'deep_wound',remaining:2,stacks:1,sourceId:enemy.id},{id:'shield_fracture',remaining:2,stacks:1,sourceId:enemy.id},{id:'buff_seal',remaining:null,charges:1,sourceId:enemy.id}];
    }
    executeEnemyTurn(b);values.push(b.events.find(e=>e.type==='damage'&&e.targetId==='arthur'&&e.abilityId==='east_great.fox_ritual').amount);
  }
  assert.equal(values[0],Math.floor(values[1]*1.45));
});
test('twins start with two independent actors, both shielded by Phong Quỷ normal support skill',()=>{
  const b=setup('east_super_twins');round(b,3);
  const enemies=b.actors.filter(a=>a.team==='enemy');assert.equal(enemies.length,2);assert.notEqual(enemies[0].id,enemies[1].id);
  assert.ok(enemies.every(a=>a.shield>0));assert.equal(bossRitualNotices(b).filter(n=>n.kind==='link').length,2);
  assert.ok(enemies.every(a=>bossActionCount(b,a,1)===1));
});
test('each half of the twins ritual consumes its own action and never adds an out-of-turn hit',()=>{
  const b=setup('east_super_twins');round(b,4);
  until(b,()=>b.round===5);
  for(const id of ['east_great.thunder_ritual','east_great.wind_ritual'])assert.equal(b.log.filter(s=>s.includes('dùng '+content.abilities[id].name+'.')).length,1);
  assert.equal(b.log.filter(s=>/Giai đoạn 1, hành động 2 \/ 2/.test(s)).length,0);
});
test('breaking one twin link cancels just that half, other twin continues its ritual',()=>{
  const b=setup('east_super_twins');round(b,3);
  for(const id of ['arthur','iris']){getActor(b,id).basicAttack=[{type:'damage',damageType:'magical',element:'water',multiplier:.1}];act(b,id,'$attack','enemy_0');}
  assert.equal(getActor(b,'enemy_0').bossState.pendingMoves[0].ritual.cancelled,true);assert.equal(getActor(b,'enemy_1').bossState.pendingMoves[0].ritual.cancelled,false);
  round(b,5);assert.equal(b.log.some(s=>s.includes('dùng Thiên Môn Lôi Bạo — Lôi.')),false);assert.ok(b.log.some(s=>s.includes('dùng Thiên Môn Lôi Bạo — Phong.')));
});
test('one twin defeat cancels both waiting halves and survivor doubles actions only next round',()=>{
  for(const victim of ['enemy_0','enemy_1']){
    const b=setup('east_super_twins');round(b,3);const attacker=getActor(b,'arthur'),other=getActor(b,victim==='enemy_0'?'enemy_1':'enemy_0');
    attacker.stats.attack=100000;act(b,'arthur','$attack',victim);
    assert.equal(b.outcome,null);assert.equal(b.linkedBossState.soloActorId,other.id);assert.equal(b.linkedBossState.survivorReadyRound,4);
    assert.equal(bossActionCount(b,other,1),1);assert.equal(other.bossState.pendingMoves.length,0);
    round(b,4);assert.equal(bossActionCount(b,other,1),2);
    until(b,()=>activeActor(b)?.id===other.id);executeEnemyTurn(b);
    assert.ok(b.log.some(s=>s.includes(other.name+' — Giai đoạn 1, hành động 2 / 2.')));
  }
});
test('simultaneous twin defeat ends battle once and rewards do not duplicate on settlement',()=>{
  const b=setup('east_super_twins'),a=getActor(b,'arthur');
  const attack=content.abilities['enemy.quake'];
  a.abilities.push(attack.id);a.stats.attack=100000;a.stats.magic=100000;act(b,'arthur',attack.id);
  assert.equal(b.outcome,'victory');assert.equal(b.actors.filter(a=>a.team==='enemy'&&a.hp>0).length,0);
  const c=save(),first=claimBattleReward(c,b,content),again=claimBattleReward(first,b,content);
  assert.equal(first.coins-c.coins,1000);assert.equal(first.victories,c.victories+1);assert.equal(again.coins,first.coins);assert.ok(first.claimedFirstClearRewards.includes('east_super_twins'));
  assert.doesNotThrow(()=>decodeGameSave(encodeGameSave(first,content),content));
});
test('fresh retry resets all pending mechanics, exposure and survivor state',()=>{
  const b=readyMountain();boss(b).bossState.stanceExposure={damageBonus:.2,untilMainTurn:100};
  const retry=createBattle(content,save(),b.encounterId,seededRandom(411),{enemyLevel:70});
  assert.deepEqual(boss(retry).bossState.pendingMoves,[]);assert.equal(boss(retry).bossState.stanceExposure,undefined);assert.equal(retry.round,1);
});
test('content rejects unsupported multi-boss encounters, over-wide bodies and malformed rituals',()=>{
  for(const mutate of [
    c=>delete c.encounters.east_super_twins.bossEncounter,
    c=>c.enemies.east_great_mountain.formationSpan=5,
    c=>c.enemies.east_great_mountain.boss.ritual.marks=0,
    c=>c.enemies.east_great_fox.boss.ritual.abilityId='missing',
    c=>c.encounters.east_super_twins.bossEncounter.rituals[1].enemyId='east_great_thunder',
    c=>c.encounters.east_super_twins.bossEncounter.survivor.actionsPerTurn=4,
  ]){const c=structuredClone(content);mutate(c);assert.ok(validateContent(c).length);}
});

test('survivor two-move turns tick ordinary defensive buffs once, not once per move',()=>{
  const b=setup('east_super_twins');round(b,3);
  const wind=getActor(b,'enemy_1'),attacker=getActor(b,'arthur');
  const guard=()=>wind.statuses.find(s=>s.id==='east_great_wind_guard');
  assert.equal(guard().remaining,2);
  attacker.stats.attack=100000;act(b,'arthur','$attack','enemy_0');
  round(b,4);assert.equal(guard().remaining,1);
  until(b,()=>activeActor(b)?.id===wind.id);executeEnemyTurn(b);
  assert.equal(guard(),undefined);
});
test('all new bosses reject incoming player stun through actual skill resolution',()=>{
  const stun=Object.values(content.statuses).find(s=>s.skipTurn).id;
  for(const id of ids){
    const b=setup(id),a=getActor(b,'arthur');
    a.basicAttack=[{type:'damage',damageType:'physical',element:'plain',multiplier:.1},{type:'status',status:stun,duration:1}];
    for(const target of b.actors.filter(a=>a.team==='enemy')){act(b,'arthur','$attack',target.id);assert.equal(target.statuses.some(s=>s.id===stun),false);}
  }
});

test('phase-two ritual releases use only the authored light filler, preserving the next rotation step',()=>{
  const b=setup('east_super_fox'),enemy=boss(b),a=getActor(b,'arthur');
  a.stats.attack=100000;act(b,'arthur');a.stats.attack=60;
  assert.equal(enemy.bossState.phase,2);
  until(b,()=>enemy.bossState.pendingMoves.some(m=>m.ritual?.kind==='curse'));
  const ready=enemy.bossState.pendingMoves.find(m=>m.ritual?.kind==='curse').readyRound;
  until(b,()=>b.round===ready&&activeActor(b)?.id===enemy.id);
  const index=enemy.bossState.rotationStep;executeEnemyTurn(b);
  assert.deepEqual(b.events.filter(e=>e.type==='ability_cast'&&e.sourceId===enemy.id).map(e=>e.abilityId),['east_great.fox_ritual','east_great.fox_flame']);
  assert.equal(enemy.bossState.rotationStep,index);
});
test('two due heavy moves are released across separate turns instead of losing the deferred move',()=>{
  const b=readyMountain(),enemy=boss(b);
  until(b,()=>b.round===5&&activeActor(b)?.id===enemy.id);executeEnemyTurn(b);
  assert.ok(enemy.bossState.pendingMoves.some(m=>m.abilityId==='east_great.mountain_boulder'));
  until(b,()=>b.round===6&&activeActor(b)?.id===enemy.id);executeEnemyTurn(b);
  assert.ok(b.events.some(e=>e.type==='ability_cast'&&e.abilityId==='east_great.mountain_boulder'));
});

test('round-limit draw clears pending rituals through real end-of-round progression',()=>{
  const b=readyMountain();b.round=60;
  for(let i=0;i<50&&!b.outcome;i++)step(b);
  assert.equal(b.outcome,'draw');assert.deepEqual(boss(b).bossState.pendingMoves,[]);
});