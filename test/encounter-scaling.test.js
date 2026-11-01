import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,getActor} from '../src/core/battle.js';
import {createDungeonRun,createDungeonPreview,advanceDungeonWave} from '../src/core/dungeon.js';
import {enemyHpProfile,enemyHpFactor,enemyStatFactor,levelScaledEnemyStats,scaleEnemyStats} from '../src/core/enemy-scaling.js';
import {validateContent} from '../src/core/content.js';
const content=await loadContent();
const hp=(l,p)=>enemyHpFactor(l,p,content);
const bossContext={rewardTier:'boss'},superContext={rewardTier:'super'};

test('HP profile is selected by encounter, including Bounty and explicit overrides; never by enemy ID',()=>{
 assert.equal(enemyHpProfile({rewardTier:'normal'}),'normal');assert.equal(enemyHpProfile(bossContext),'boss');assert.equal(enemyHpProfile({rewardTier:'boss',category:'bounty'}),'boss');assert.equal(enemyHpProfile(superContext),'superboss');assert.equal(enemyHpProfile({...superContext,hpScalingProfile:'boss'}),'boss');
 const enemy=content.enemies.goblin;
 const n=levelScaledEnemyStats(enemy,45,content,1,{rewardTier:'normal'}),b=levelScaledEnemyStats(enemy,45,content,1,bossContext);
 assert.notEqual(n.maxHp,b.maxHp);for(const key of ['maxMp','attack','magic','defense','resistance','speed'])assert.equal(n[key],b[key]);
 assert.throws(()=>enemyHpProfile({hpScalingProfile:'elite'}));assert.throws(()=>enemyHpProfile({hpScalingProfile:null}));
});

test('HP boundaries use one multiplicative step at 30/31, 50/51 and 80/81; unsupported levels reject',()=>{
 for(const [p,first,last]of [['normal',.018,.025],['boss',.03,.04]]){
  for(const l of [1,5,25,30,31,45,50])assert.ok(Math.abs(hp(l,p)-(1+first)**(Math.min(l,30)-1)*(1+last)**Math.max(0,l-30))<1e-10);
  assert.ok(Math.abs(hp(30,p)/hp(29,p)-(1+first))<1e-12);assert.ok(Math.abs(hp(31,p)/hp(30,p)-(1+last))<1e-12);
  assert.throws(()=>hp(51,p));assert.throws(()=>hp(60,p));
 }
 for(const l of [1,5,25,30,31,45,50,51,60,80,81,90])assert.ok(Math.abs(hp(l,'superboss')-1.015**(Math.min(l,50)-1)*1.025**Math.max(0,Math.min(l,80)-50)*1.03**Math.max(0,l-80))<1e-10);
 for(const [l,g]of [[50,1.015],[51,1.025],[80,1.025],[81,1.03],[90,1.03]])assert.ok(Math.abs(hp(l,'superboss')/hp(l-1,'superboss')-g)<1e-12);
 assert.throws(()=>hp(91,'superboss'));assert.throws(()=>hp(0,'normal'));assert.throws(()=>hp(1.5,'normal'));
});

test('offense and defense hit exact endpoints, ignore legacy milestones and freeze above 50',()=>{
 for(const [key,target]of [['attack',2],['magic',2],['defense',1.25],['resistance',1.25]]){
  assert.equal(enemyStatFactor(key,1,content),1);assert.equal(enemyStatFactor(key,50,content),target);
  for(const l of [51,60,80,90])assert.equal(enemyStatFactor(key,l,content),target);
 }
 const changed=structuredClone(content);changed.progressionRules.default.milestones.forEach(m=>{m.offense=99;m.defense=99;});
 const e=content.enemies.black_script_cleric;assert.deepEqual(levelScaledEnemyStats(e,45,content,1,bossContext),levelScaledEnemyStats(e,45,changed,1,bossContext));
 for(const l of [1,25,50,60])for(const k of ['maxMp','speed'])assert.equal(enemyStatFactor(k,l,content),1+content.progressionRules.default.enemyGrowth[k]*(l-1));
});

test('all 66 template references are identities without HP overrides; no template mutation or rounding drift',()=>{
 assert.equal(Object.keys(content.enemies).length,66);const before=JSON.stringify(content.enemies);
 for(const e of Object.values(content.enemies)){
  const context={hpScalingProfile:e.referenceLevel>50?'superboss':'normal'};
  assert.deepEqual(levelScaledEnemyStats(e,e.referenceLevel,content,1,context),e.stats,e.id);
  const level=Math.min(45,e.referenceLevel+10);
  const factors={maxHp:1.37,attack:1.11,maxMp:1.4};
  const actual=levelScaledEnemyStats(e,level,content,factors,context);
  assert.equal(actual.maxHp,Math.round(e.stats.maxHp*hp(level,context.hpScalingProfile)/hp(e.referenceLevel,context.hpScalingProfile)*1.37));
  assert.ok(Object.values(actual).every(Number.isSafeInteger));
 }
 assert.equal(JSON.stringify(content.enemies),before);
});

test('current Normal and Boss numerical examples use the same Level 1 baseline',()=>{
 for(const [l,expected]of [[1,120],[5,129],[15,154],[25,184],[30,201],[35,228],[45,292],[50,330]])assert.equal(levelScaledEnemyStats(content.enemies.goblin,l,content).maxHp,expected);
 for(const [l,expected]of [[1,1120],[5,1261],[15,1694],[25,2277],[30,2639],[35,3211],[45,4753],[50,5783]])assert.equal(levelScaledEnemyStats(content.enemies.black_script_cleric,l,content,1,bossContext).maxHp,expected);
 const enemy=content.enemies.goblin,a=levelScaledEnemyStats(enemy,45,content),b=levelScaledEnemyStats({...enemy,hpReferenceLevel:15},45,content,1,{hpReferenceLevel:25});
 assert.equal(b.maxHp,Math.round(120*hp(45,'normal')/hp(25,'normal')));
 for(const k of ['maxMp','attack','magic','defense','resistance','speed'])assert.equal(a[k],b[k]);
});

test('Alice and Miraebolis use the global Lv1 base; fixed encounter levels and HP curve stay authored',()=>{
 const save=createGameSave(content);save.storyFlags.push('illusion.sinister_unlocked');save.chronicles.aliceFirstEncounterCleared=true;save.chronicles.eventClearIds.push('book1.j04');
 for(const [quest,id,hpExpected]of [['alice_superboss','dark_holy_blade_alice',6372],['miraebolis_superboss','miraebolis',9558]]){
  const b=createBattle(content,save,quest,()=>.9,{questDifficulty:'very_easy'}),a=getActor(b,'enemy_0');
  assert.equal(a.level,60);assert.equal(a.pendingSuperLevelBalance,true);assert.equal(a.stats.maxHp,hpExpected);
  const base=content.enemies[id];assert.equal(base.referenceLevel,1);assert.equal(content.encounters[quest].hpReferenceLevel,1);
  for(const k of ['maxMp','attack','magic','defense','resistance','speed'])assert.equal(a.stats[k],Math.round(base.stats[k]*enemyStatFactor(k,60,content)));
 }
 assert.equal(content.encounters.epilogue_unfinished.enemyLevel,30);assert.equal(enemyHpProfile(content.encounters.epilogue_unfinished),'superboss');
 assert.equal(content.enemies.wyvern_thunder.referenceLevel,1);
});

test('new dungeon levels apply original MP overrides once, reset HP/offense overrides and preserve carried snapshots',()=>{
 const now=new Date('2026-11-01T05:00:00Z');
 for(const id of ['gold_mine','dangerous'])for(const d of content.dungeons[id].difficulties){
  assert.equal(d.enemyLevel,{easy:15,medium:30,hard:45}[d.id]);assert.equal(d.enemyScale.maxHp,1);assert.equal(d.enemyScale.attack,1);assert.equal(d.enemyScale.magic,1);
  const save=createGameSave(content),r=createDungeonRun(content,save,id,d.id,{now,random:()=>0,preview:createDungeonPreview(content,id,d.id,{now,random:()=>0})});
  for(const actor of r.battle.actors.filter(a=>a.team==='enemy'))assert.deepEqual(actor.stats,levelScaledEnemyStats(content.enemies[actor.definitionId],d.enemyLevel,content,d.enemyScale,content.encounters[r.battle.encounterId]));
  if(d.waves>1){const a=getActor(r.battle,'arthur');a.hp=90;a.mp=9;a.shield=12;r.battle.outcome='victory';advanceDungeonWave(content,r);const next=getActor(r.battle,'arthur');assert.equal(next.hp,90);assert.equal(next.mp,9);assert.equal(next.shield,12);}
  assert.deepEqual(decodeGameSave(encodeGameSave(save,content),content),save);
 }
});

test('malformed curves, profiles, unsupported encounter/dungeon levels and HP references fail content validation',()=>{
 for(const change of [
  c=>c.progressionRules.default.enemyHpCurves.normal[0].growth=-1,
  c=>c.progressionRules.default.enemyHpCurves.boss[1].untilLevel=30,
  c=>delete c.progressionRules.default.enemyHpCurves.superboss,
  c=>c.progressionRules.default.enemyHpCurves.normal[1].untilLevel=60,
  c=>c.progressionRules.default.enemyStatGrowthTargets.offense.multiplier=NaN,
  c=>c.progressionRules.default.enemyStatGrowthTargets.defense.atLevel=60,
  c=>c.progressionRules.default.enemyStatGrowthTargets.aboveCap='extrapolate',
  c=>c.encounters.forest_patrol.hpScalingProfile='elite',
  c=>c.encounters.forest_patrol.hpReferenceLevel=60,
  c=>c.encounters.forest_patrol.enemyLevel=51,
  c=>c.encounters.alice_superboss.hpReferenceLevel=0,
  c=>c.enemies.goblin.hpReferenceLevel=1.2,
  c=>c.dungeons.gold_mine.difficulties[0].enemyLevel=60,
 ]){const c=structuredClone(content);change(c);assert.ok(validateContent(c).length);}
 assert.deepEqual(validateContent(content),[]);
});

test('all authored encounters and five selectable difficulties wire the same immutable scaling into battle',()=>{
 const save=createGameSave(content);save.unlockedCharacterIds=Object.keys(content.characters);
 save.claimedFirstClearRewards=Object.keys(content.encounters);
 save.chronicles.aliceFirstEncounterCleared=true;save.chronicles.eventClearIds.push('book1.j04');
 save.storyFlags.push('illusion.sinister_unlocked',...Object.values(content.encounters).map(e=>e.requires?.storyFlag).filter(Boolean));
 for(const encounter of Object.values(content.encounters).filter(e=>e.category!=='chronicle')){
  save.party=encounter.requiredPartyIds?.length?[...encounter.requiredPartyIds]:['arthur','iris','elaine','garrek'];
  const selectable=!encounter.travelerStory&&encounter.rewardTier!=='super';
  for(const difficulty of selectable?Object.keys(content.progressionRules.default.questDifficulties):['medium']){
   const battle=createBattle(content,save,encounter.id,()=>.99,{questDifficulty:difficulty});
   const level=selectable?content.progressionRules.default.questDifficulties[difficulty].level:encounter.enemyLevel;
   for(const actor of battle.actors.filter(a=>a.team==='enemy'))assert.deepEqual(actor.stats,levelScaledEnemyStats(content.enemies[actor.definitionId],level,content,1,encounter),encounter.id+'/'+difficulty);
  }
 }
});

test('Superboss HP extension is available to 90 without opening content or extrapolating offense',()=>{
 for(const [level,alice,mira]of [[50,4978,7467],[60,6372,9558],[80,10442,15662],[90,14033,21049]]){
  for(const [id,expected]of [['dark_holy_blade_alice',alice],['miraebolis',mira]])assert.equal(levelScaledEnemyStats(content.enemies[id],level,content,1,{rewardTier:'super',hpReferenceLevel:1}).maxHp,expected);
 }
 assert.equal(content.progressionRules.default.maxLevel,50);
 assert.ok(Object.values(content.encounters).every(e=>e.enemyLevel<=60));
});

test('every non-story Boss and Bounty uses encounter reference 1 for all seven stats without affecting shared normal/story enemies',()=>{
 const save=createGameSave(content);save.claimedFirstClearRewards=Object.keys(content.encounters);
 const before=JSON.stringify(content.enemies);
 for(const e of Object.values(content.encounters).filter(e=>e.rewardTier==='boss'&&!e.travelerStory&&e.category!=='chronicle')){
  assert.equal(e.referenceLevel,1,e.id);
  const raw=createBattle(content,save,e.id,()=>.99,{enemyLevel:1});
  for(const actor of raw.actors.filter(a=>a.team==='enemy')){assert.equal(actor.referenceLevel,1);assert.deepEqual(actor.stats,content.enemies[actor.definitionId].stats);}
  for(const level of [5,15,25,35,45]){
   const b=createBattle(content,save,e.id,()=>.99,{enemyLevel:level});
   for(const actor of b.actors.filter(a=>a.team==='enemy')){
    const base=content.enemies[actor.definitionId].stats;
    for(const key of Object.keys(base))assert.equal(actor.stats[key],Math.round(base[key]*(key==='maxHp'?enemyHpFactor(level,'boss',content):enemyStatFactor(key,level,content))));
   }
  }
 }
 assert.equal(JSON.stringify(content.enemies),before);
 const normal=createBattle(content,save,'forest_patrol',()=>.99,{enemyLevel:5});assert.deepEqual(getActor(normal,'enemy_0').stats,levelScaledEnemyStats(content.enemies.goblin,5,content,1,content.encounters.forest_patrol));
 for(const invalid of [0,null,1.5,100]){const bad=structuredClone(content);bad.encounters.ogre_trial.referenceLevel=invalid;assert.ok(validateContent(bad).length);}
});

test('all templates and encounters have base Level 1; post-30 stat growth accelerates and hits exact cap',()=>{
 assert.equal(content.progressionRules.default.enemyBaselineLevel,1);
 for(const e of Object.values(content.enemies))assert.equal(e.referenceLevel,1,e.id);
 for(const e of Object.values(content.encounters))assert.equal(e.referenceLevel,1,e.id);
 for(const [key,target]of [['attack',2],['magic',2],['defense',1.25],['resistance',1.25]]){
  const early=enemyStatFactor(key,30,content)/enemyStatFactor(key,29,content),late=enemyStatFactor(key,31,content)/enemyStatFactor(key,30,content);
  assert.ok(late>early);assert.ok(Math.abs(late-early**2)<1e-12);assert.equal(enemyStatFactor(key,50,content),target);
  let previous=0;for(let level=1;level<=50;level++){const value=enemyStatFactor(key,level,content);assert.ok(value>previous);previous=value;}
 }
 for(const change of [c=>c.progressionRules.default.enemyBaselineLevel=25,c=>c.progressionRules.default.enemyStatGrowthTargets.offense.accelerateAfterLevel=50,c=>c.progressionRules.default.enemyStatGrowthTargets.defense.lateGrowthWeight=1]){const c=structuredClone(content);change(c);assert.ok(validateContent(c).length);}
});
