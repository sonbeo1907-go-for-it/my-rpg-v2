import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,getActor,forecastBattleAction,activeActor,executeEnemyTurn} from '../src/core/battle.js';
import {createStoryRun,advanceStoryWave} from '../src/core/story-waves.js';
import {questCatalog,encounterReturnPath} from '../src/core/quest-catalog.js';
import {dungeonQuestPool} from '../src/core/dungeon.js';
import {gearRecipeUnlocked,BOUNTY_ENCOUNTERS} from '../src/core/gear-rules.js';
import {gearRecipeSource} from '../src/core/gear-effect-schema.js';
import {craftGear} from '../src/core/gear-forge.js';
import {claimBattleReward} from '../src/core/economy.js';
import {changeHomeScene} from '../src/core/home-scenes.js';
import {validateContent} from '../src/core/content.js';
const c=await loadContent();const save=()=>createGameSave(c);
test('Northern route requires Orochi then KE1, stays out of other boards and dungeon pools, cannot lower its fixed Lv50',()=>{
 const s=save();assert.deepEqual(questCatalog(c,s,{tab:'north'}),[]);assert.throws(()=>createBattle(c,s,'north_ke_01'));
 s.claimedFirstClearRewards.push('east_ke_08');assert.deepEqual(questCatalog(c,s,{tab:'north'}).map(e=>e.id),['north_ke_01']);assert.throws(()=>createBattle(c,s,'north_ke_02'));
 for(const opts of [{questDifficulty:'very_easy'},{enemyLevel:1},{questDifficulty:'east_45'}])assert.throws(()=>createBattle(c,s,'north_ke_01',()=>.99,opts));
 const b=createBattle(c,s,'north_ke_01');assert.equal(b.enemyLevel,50);for(const x of b.actors.filter(a=>a.team==='enemy'))assert.ok(!x.weaknesses.includes('moon'));
 for(const id of ['gold_mine','dangerous'])assert.ok(!dungeonQuestPool(c,id).some(id=>id.startsWith('north_')));
 assert.ok(!questCatalog(c,s).some(e=>e.category==='north_key'));assert.equal(encounterReturnPath(c,'north_ke_02'),'/quests?tab=north&selected=north_ke_02');
 const noArthur={...s,party:['iris','elaine']};assert.equal(createBattle(c,noArthur,'north_ke_01').enemyLevel,50);
});
test('both Northern waves carry HP/MP; only final successful persisted clear unlocks next quest, Moon recipes and snowy home',()=>{
 let s=save();s.claimedFirstClearRewards.push('east_ke_08');
 for(const id of ['north_ke_01','north_ke_02']){
  const run=createStoryRun(c,s,id,()=>.99);const a=getActor(run.battle,'arthur');a.hp=77;a.mp=12;run.battle.outcome='victory';assert.equal(claimBattleReward(s,run.battle,c),s);
  advanceStoryWave(c,run);assert.equal(getActor(run.battle,'arthur').hp,77);assert.equal(getActor(run.battle,'arthur').mp,12);assert.equal(run.battle.enemyLevel,50);run.battle.outcome='victory';
  const raw=JSON.stringify(s);assert.throws(()=>claimBattleReward(s,run.battle,c,()=>{throw Error('disk');}),/disk/);assert.equal(JSON.stringify(s),raw);assert.ok(!run.battle.rewardClaimed);
  s=claimBattleReward(s,run.battle,c);assert.ok(s.claimedFirstClearRewards.includes(id));s=decodeGameSave(encodeGameSave(s,c),c);assert.equal(claimBattleReward(s,run.battle,c),s);
 }
 for(const id of ['moonlit_duet','moonlit_covenant'])assert.ok(gearRecipeUnlocked(s,c.gearEffects[id]));assert.equal(changeHomeScene(s,'snow_town').homeScene,'snow_town');
});
test('all 24 newly assigned recipes are gated by earned progression, not merely first-clear at low trial score',()=>{
 const s=save(),assigned=Object.values(c.gearEffects).filter(r=>r.requires?.anyBounty||r.requires?.trialScore||['east_ke_03','north_ke_02'].includes(r.requires?.firstClear));assert.equal(assigned.length,24);
 for(const r of assigned)assert.equal(gearRecipeUnlocked(s,r),false,r.id);
 for(const id of BOUNTY_ENCOUNTERS){const n={...s,claimedFirstClearRewards:[id]};assert.equal(assigned.filter(r=>gearRecipeUnlocked(n,r)).length,8);}
 for(const trial of ['song_chimera','song_ego','song_calamity']){for(const points of [0,11,12,22]){const n={...s,claimedFirstClearRewards:[trial],unrecordedLedger:{...s.unrecordedLedger,best:{[trial]:points}}};assert.equal(assigned.filter(r=>gearRecipeUnlocked(n,r)).length,points>=12?4:0);}}
 assert.equal(assigned.filter(r=>gearRecipeUnlocked({...s,claimedFirstClearRewards:['east_ke_03']},r)).length,2);
 assert.equal(gearRecipeSource(c.gearEffects.martial_insight),'/chronicles/unrecorded/chimera');assert.equal(gearRecipeSource(c.gearEffects.soul_wellspring),'/quests?tab=east&selected=east_ke_03');
});
test('locked recipes reject crafting atomically; already crafted equipment stays valid without retroactive deletion',()=>{
 const s=save();s.coins=100000;s.prismaFragments=10000;s.gacha.totalPulls=1;s.gear=[{id:'gear_1',typeId:'t3_focused',stats:{attack:5}}];const raw=JSON.stringify(s);assert.throws(()=>craftGear(s,c,{effectId:'guardian_talisman',materialId:'gear_1'}));assert.equal(JSON.stringify(s),raw);
 s.craftedGearSerial=1;s.gear.push({id:'rune_1',typeId:'t4_effect',effectId:'moonlit_duet',stats:{}});s.equipment.arthur=['rune_1',null,null];assert.equal(decodeGameSave(encodeGameSave(s,c),c).gear.at(-1).effectId,'moonlit_duet');
 s.claimedFirstClearRewards.push(BOUNTY_ENCOUNTERS[0]);assert.equal(craftGear(s,c,{effectId:'guardian_talisman',materialId:'gear_1'}).gear.at(-1).effectId,'guardian_talisman');
});
for(const damageType of ['physical','magical'])for(const moon of [false,true])test('incoming '+damageType+' '+(moon?'effect':'normal')+' uses 110/70 percent for HP, shield and forecast',()=>{
 const source=structuredClone(c),s=save(),b=createBattle(source,s,'forest_patrol',()=>.99),a=b.actors[0],e=b.actors.find(a=>a.team==='enemy');
 for(const actor of b.actors){actor.passive=null;actor.hp=actor.stats.maxHp=100000;actor.mp=actor.stats.maxMp=10000;actor.stats.attack=actor.stats.magic=100;actor.stats.defense=actor.stats.resistance=0;actor.baseStats={...actor.stats};actor.statuses=[];actor.gearEffects=[];actor.weaknesses=[];actor.resistances={};}
 e.damageKindMultipliers={normalDamage:.7,effectDamage:1.1};e.shield=30;source.abilities['test.north']={id:'test.north',name:'Thử sát thương',target:'enemy',effects:[{type:'damage',element:'fire',damageType,multiplier:1,...(moon?{additionalElements:['moon']}:{})}]};a.abilities.push('test.north');b.queue=[a.id,e.id];b.cursor=0;const cmd={actorId:a.id,abilityId:'test.north',targetId:e.id},f=forecastBattleAction(b,cmd);executeAction(b,cmd);const hit=b.events.find(x=>x.type==='damage'&&x.sourceId===a.id),total=hit.amount+hit.absorbed;assert.equal(total,moon?110:70);assert.equal(hit.absorbed,30);assert.equal(getActor(f,e.id).hp,e.hp);assert.equal(hit.effectDamage,moon);
});
test('incoming damage class schema is strict and templates keep Lv1 base values',()=>{assert.deepEqual(validateContent(c),[]);for(const value of [{normalDamage:0,effectDamage:1.1},{normalDamage:.7},[.7,1.1],{normalDamage:.7,effectDamage:1.1,extra:1}]){const x=structuredClone(c);x.enemies.north_tavern_shade.damageKindMultipliers=value;assert.ok(validateContent(x).length);}for(const id of ['north_ke_01','north_ke_02']){const e=c.encounters[id];assert.equal(e.referenceLevel,1);assert.equal(e.fixedEnemyLevel,50);for(const eid of e.waves.flat())assert.equal(c.enemies[eid].referenceLevel,1);}});

test('both northern boss windups warn a full round before releasing through real turn progression',()=>{
 for(const [id,heavy]of [['north_ke_01','north.crush'],['north_ke_02','north.shade_wave']]){
  const s=save();s.claimedFirstClearRewards=['east_ke_08','north_ke_01'];const b=createBattle(c,s,id,()=>.99,{storyWaveIndex:1});
  for(const a of b.actors.filter(a=>a.team==='party')){a.hp=a.stats.maxHp=100000;a.mp=a.stats.maxMp=1000;}
  const boss=b.actors.find(a=>a.boss);let warningRound=null,released=false,turns=0;
  while(b.round<9&&!b.outcome&&turns++<80){const a=activeActor(b),before=b.round;if(a.team==='enemy')executeEnemyTurn(b);else executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});
   const pending=boss.bossState.pendingMoves.find(m=>m.abilityId===heavy);if(pending&&warningRound===null){warningRound=before;assert.equal(pending.readyRound,before+1);assert.ok(b.log.some(l=>l.includes(c.abilities[heavy].windup.message)));}
   if(b.events.some(e=>e.type==='damage'&&e.sourceId===boss.id&&e.abilityId===heavy)){assert.ok(warningRound!==null);assert.ok(before>=warningRound+1);released=true;break;}
  }
  assert.ok(warningRound!==null,id+' must actually warn');assert.ok(released,id+' must actually release');
 }
});
test('score 12 unlock notifications settle with the actual trial ledger and cannot duplicate after reload',()=>{
 const s=save(),d=c.trials.chimera,conditions=Object.fromEntries(d.conditions.slice(0,4).map(x=>[x.id,3]));const b=createBattle(c,s,'song_chimera',()=>.99,{trial:{level:60,conditions},enemyLevel:60});b.outcome='victory';const n=claimBattleReward(s,b,c);assert.equal(n.unrecordedLedger.best.song_chimera,12);assert.equal(b.firstClearRewards.filter(r=>r.type==='gear_recipe').length,4);assert.equal(claimBattleReward(n,b,c),n);assert.equal(decodeGameSave(encodeGameSave(n,c),c).unrecordedLedger.best.song_chimera,12);
});
