import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,getActor,executeAction,executeEnemyTurn,activeActor} from '../src/core/battle.js';
import {setAstoriaEnabled} from '../src/core/developer.js';
import {createStoryRun,advanceStoryWave,isFinalStoryWave} from '../src/core/story-waves.js';
import {claimBattleReward} from '../src/core/economy.js';
import {completeStoryEvent,resolveCharacter} from '../src/core/progression.js';
import {gearSlotCapacity} from '../src/core/gear-slots.js';
import {validateContent} from '../src/core/content.js';
import {skillBaseStatBonuses} from '../src/core/turn-order.js';
import {liveSkillChoices} from '../src/ui/combat-presentation.js';
import {passivePresentation,skillPresentation} from '../src/ui/skill-copy.js';
import {questCatalog} from '../src/core/quest-catalog.js';
import {dungeonQuestPool} from '../src/core/dungeon.js';
const content=await loadContent();
const chapters=content.travelerStories.fiona.chapters;
function save(){const c=createGameSave(content);c.party=['fiona','iris','elaine','garrek'];c.partyPresets[0].slots=[...c.party];return c;}
function complete(c,index){c.claimedFirstClearRewards=chapters.slice(0,index);for(const id of chapters.slice(0,index))for(const r of content.encounters[id].firstClearRewards)if(r.type==='upgrade')completeStoryEvent(c,content,content.upgrades[r.upgradeId].requires.storyFlag);return c;}
function use(b,id,skill,target='enemy_0'){b.queue=[id,...b.actors.filter(a=>a.id!==id&&a.hp>0).map(a=>a.id)];b.cursor=0;executeAction(b,{actorId:id,abilityId:skill,targetId:target});}
function nativeBattle(){const c=complete(save(),3),b=createBattle(content,c,'forest_patrol',()=>.99);for(const e of b.actors.filter(a=>a.team==='enemy')){e.hp=e.stats.maxHp=10000;e.stats.resistance=0;e.weaknesses=[];}return b;}
function mark(b,id,stacks=1){getActor(b,id).statuses.push({id:'prisma',stacks,remaining:4,sourceId:'fiona'});}
const damage=(b,id='enemy_0')=>b.events.filter(e=>e.type==='damage'&&e.sourceId==='fiona'&&e.targetId===id).reduce((n,e)=>n+e.amount,0);

test('Fiona has three sequential chapters, required participation, upgrades and slots; no public quest/dungeon leakage',()=>{
 const c=save();assert.deepEqual(chapters,['fiona_story_eins','fiona_story_zwei','fiona_story_drei']);assert.deepEqual(chapters.map(id=>content.encounters[id].name),['Eins','Zwei','Drei']);
 for(const id of chapters.slice(1))assert.throws(()=>createBattle(content,c,id),/chương trước/);
 c.party=['arthur'];assert.throws(()=>createBattle(content,c,chapters[0]),/Fiona/);
 for(const pool of [questCatalog(content,c),...['gold_mine','dangerous'].map(id=>dungeonQuestPool(content,id).map(key=>content.encounters[key]))])assert.ok(pool.every(e=>!e.travelerStory));
 assert.equal(content.encounters[chapters[0]].waves.length,3);assert.equal(content.encounters[chapters[1]].waves.length,2);
 const enemies=new Set(content.encounters[chapters[0]].waves.flat());for(const id of ['goblin','goblin_shaman','goblin_warrior','ogre_warrior'])assert.ok(enemies.has(id));
});

test('only final wave pays; persistence is atomic; gear slots/upgrades once; replay and save roundtrip work',()=>{
 let c=save();
 for(const[index,id]of chapters.entries()) {
  let b;if(content.encounters[id].waves){const run=createStoryRun(content,c,id,()=>.99);while(!isFinalStoryWave(run)){run.battle.outcome='victory';assert.equal(claimBattleReward(c,run.battle,content),c);assert.equal(run.battle.rewardClaimed,undefined);advanceStoryWave(content,run);}b=run.battle;}else b=createBattle(content,c,id,()=>.99);
  b.outcome='victory';const before=structuredClone(c);assert.throws(()=>claimBattleReward(c,b,content,()=>{throw Error('disk');}),/disk/);assert.deepEqual(c,before);assert.equal(b.rewardClaimed,undefined);
  c=claimBattleReward(c,b,content);assert.equal(gearSlotCapacity(c,content,'fiona'),4+index);assert.equal(c.characters.fiona.upgradeIds.length,index+1);assert.equal(c.victories,index+1);assert.equal(c.coins,index===2?250:(index+1)*50);assert.equal(claimBattleReward(c,b,content),c);
 }
 assert.equal(resolveCharacter(content,c,'fiona').passive.type,'detonation_base_growth');assert.deepEqual(decodeGameSave(encodeGameSave(c,content),content),c);
 const replay=createStoryRun(content,c,chapters[0],()=>.99);while(!isFinalStoryWave(replay)){replay.battle.outcome='victory';advanceStoryWave(content,replay);}replay.battle.outcome='victory';const after=claimBattleReward(c,replay.battle,content);assert.equal(after.coins,c.coins+50);assert.equal(gearSlotCapacity(after,content,'fiona'),6);assert.equal(after.recruitmentShards,c.recruitmentShards);assert.equal(after.dailyCommissions.questClears,c.dailyCommissions.questClears);
 const fake={encounterId:chapters[0],outcome:'victory',actors:[]};assert.equal(claimBattleReward(c,fake,content),c);
});

test('story waves carry actor state and chapter growth with frozen loadout, unique enemies and no premature mode cleanup',()=>{
 const c=complete(save(),3),run=createStoryRun(content,c,chapters[0],()=>.99);const old=run.battle,f=getActor(old,'fiona');f.hp=73;f.mp=39;f.shield=17;f.shieldSourceId='elaine';f.cooldowns['fiona.collapse']=3;f.detonationBonus=6;f.statuses=[{id:'empowered',remaining:4,stacks:1,sourceId:'iris'}];
 c.party=['arthur'];old.outcome='victory';const next=advanceStoryWave(content,run),n=getActor(next,'fiona');assert.equal(n.hp,73);assert.equal(n.mp,39);assert.equal(n.shield,17);assert.equal(n.detonationBonus,6);assert.equal(n.cooldowns['fiona.collapse'],2);assert.equal(n.statuses[0].id,'empowered');assert.equal(n.statuses[0].remaining,4);assert.ok(next.actors.every(a=>a.team==='party'||a.id.startsWith('story_2_')));assert.ok(next.sourceActors.some(a=>a.id.startsWith('story_1_')));assert.equal(next.encounterId,chapters[0]);assert.equal(next.storyWave.waveIndex,1);assert.equal(old.storyWave.waveIndex,0);assert.notEqual(f,n);assert.equal(old.continuesOnVictory,true);assert.equal(next.continuesOnVictory,true);
 assert.throws(()=>advanceStoryWave(content,run),/Chưa thể/);next.outcome='defeat';assert.throws(()=>advanceStoryWave(content,run));next.outcome='victory';advanceStoryWave(content,run);assert.equal(run.battle.continuesOnVictory,false);run.battle.outcome='victory';assert.throws(()=>advanceStoryWave(content,run));
});

test('shared detonation bonus applies immediately, once per cast, before MAG buffs, and caps across both skills',()=>{
 const b=nativeBattle(),f=getActor(b,'fiona');f.statuses.push({id:'calibrated',remaining:100,stacks:1,sourceId:'iris'});
 const empower=content.statuses.calibrated.modifiers.magic;
 for(let cast=1;cast<=7;cast++) {
  const skill=cast%2?'fiona.collapse':'fiona.convergence';f.mp=100;f.cooldowns={};mark(b,'enemy_0',3);const bonus=Math.min(10,cast*2);
  use(b,'fiona',skill);assert.equal(f.detonationBonus,bonus);assert.equal(damage(b),Math.floor((38+bonus)*(1+empower)*(skill==='fiona.collapse'?2.65:3.5)));assert.equal(b.events.filter(e=>e.type==='skill_base_bonus').length,1);
 }
 assert.equal(getActor(createBattle(content,complete(save(),3),'forest_patrol'),'fiona').detonationBonus,undefined);
});

test('AoE samples all targets before the cast; no growth for empty detonation, marking, basics or failed casts',()=>{
 const b=nativeBattle(),f=getActor(b,'fiona');mark(b,'enemy_2',3);
 use(b,'fiona','fiona.collapse');assert.equal(f.detonationBonus,2);assert.equal(damage(b),10);assert.equal(damage(b,'enemy_2'),106);
 f.cooldowns={};use(b,'fiona','fiona.collapse');assert.equal(f.detonationBonus,2);assert.equal(damage(b),9);assert.equal(b.events.some(e=>e.type==='skill_base_bonus'),false);
 f.mp=100;use(b,'fiona','fiona.refraction_complete');assert.equal(f.detonationBonus,2);f.mp=0;assert.throws(()=>use(b,'fiona','fiona.convergence'));assert.equal(f.detonationBonus,2);
 use(b,'fiona','$attack');assert.equal(f.detonationBonus,2);
});

test('live preview uses next accumulated bonus without changing actor or consuming Prisma',()=>{
 const b=nativeBattle(),f=getActor(b,'fiona');f.detonationBonus=4;mark(b,'enemy_1',2);const before=structuredClone(f),skill=content.abilities['fiona.collapse'],targets=b.actors.filter(a=>a.team==='enemy');
 for(let i=0;i<4;i++)assert.deepEqual(skillBaseStatBonuses(b,f,skill,targets),{magic:6});assert.deepEqual(f,before);assert.equal(getActor(b,'enemy_1').statuses[0].stacks,2);
 const choices=liveSkillChoices(skill,f,getActor(b,'enemy_1'),b);assert.equal(choices.baseStatBonuses.magic,6);assert.ok(passivePresentation(f,content).rules.some(s=>s.includes('Dùng chung')));assert.ok(skillPresentation(skill,f,content,choices).facts.length);
});

test('Ogre King cannot skip phase, stays one action/turn, keeps player state without free MP; telegraph is real',()=>{
 const b=createBattle(content,complete(save(),2),chapters[2],()=>.99),boss=getActor(b,'enemy_0'),f=getActor(b,'fiona');f.detonationBonus=8;f.mp=10;f.stats.magic=10000;
 use(b,'fiona','$attack');assert.equal(boss.hp,900);assert.equal(boss.bossState.phase,2);assert.equal(f.detonationBonus,8);assert.equal(f.mp,10);assert.equal(boss.statuses.some(s=>s.id==='suppression'),false);assert.ok(boss.weaknesses.includes('dark'));assert.equal(b.events.some(e=>e.type==='mp_restore'),false);
 for(const a of b.actors.filter(a=>a.team==='party')){a.hp=a.stats.maxHp=10000;}
 for(let i=0;i<5;i++){b.queue=['enemy_0','fiona'];b.cursor=0;b.round=10+i;const before=b.actionCount;executeEnemyTurn(b);assert.equal(b.actionCount,before+1);}
 assert.ok(b.log.some(s=>s.includes('vận sức: Thiên băng địa liệt')));assert.ok(b.log.some(s=>s.includes('dùng Thiên băng địa liệt')));assert.equal(boss.boss.phases[1].damageMultiplier,1.15);
});

test('malformed wave definitions, growth schemas and phased boss configuration are rejected',()=>{
 const mutations=[c=>c.encounters.fiona_story_eins.waves[1]=[],c=>c.encounters.fiona_story_eins.waves[0]=['missing'],c=>c.encounters.fiona_story_eins.enemies=['goblin'],c=>c.encounters.fiona_story_eins.waves[1]=['ogre_king','goblin'],c=>c.upgrades['fiona.faint_light'].changes[0].passive.increment=0,c=>c.upgrades['fiona.faint_light'].changes[0].passive.statusId='empowered',c=>c.enemies.ogre_king.boss.phases[1].actionsPerTurn=3,c=>c.enemies.ogre_king.boss.phases[1].damageMultiplier=-1];
 for(const mutate of mutations){const c=structuredClone(content);mutate(c);assert.ok(validateContent(c).length);}
 assert.throws(()=>createBattle(content,save(),chapters[0],()=>.99,{storyWaveIndex:3}),/Đợt truyện/);
});

test('actual story wave victories preserve Magnamut until final victory, then refund MP once',()=>{
 const c=setAstoriaEnabled(save(),true);c.party=['astoria','fiona'];const run=createStoryRun(content,c,chapters[0],()=>.99);
 const a=getActor(run.battle,'astoria');a.activeMode='magnamut';a.resourceValues.space_rift=4;a.mp=30;
 for(let wave=0;wave<3;wave++) {
  const b=run.battle;for(const e of b.actors.filter(a=>a.team==='enemy'))e.hp=1;
  use(b,'astoria','astoria.command',b.actors.find(a=>a.team==='enemy').id);assert.equal(b.outcome,'victory');const actor=getActor(b,'astoria');
  if(wave<2){assert.equal(actor.activeMode,'magnamut');assert.equal(actor.mp,30);assert.equal(b.events.some(e=>e.type==='mode_exit'),false);advanceStoryWave(content,run);assert.equal(getActor(run.battle,'astoria').activeMode,'magnamut');}
  else {assert.equal(actor.activeMode,undefined);assert.equal(actor.mp,72);assert.equal(b.log.filter(s=>s==='Magnamut rời sân.').length,1);}
 }
});
