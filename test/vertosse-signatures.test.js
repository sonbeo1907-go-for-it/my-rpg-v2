import {coefficientFactor,skillRules} from '../src/core/skill-rules.js';
import {exclusiveDamageEffect,validateExclusivePassive} from '../src/core/exclusive-hooks.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,activeActor,getActor,executeEnemyTurn,forecastBattleAction} from '../src/core/battle.js';
import {resolveCharacter} from '../src/core/progression.js';
import {baseStatValue} from '../src/core/combat-math.js';
import {criticalChance,resolveCritical} from '../src/core/critical.js';
import {resolveRankedAbility} from '../src/core/skill-resolver.js';
import {teamResourceState} from '../src/core/team-resources.js';
import {buyExclusiveRecipe} from '../src/core/blueprint-shop.js';
import {craftExclusive} from '../src/core/blacksmith.js';
import {exclusiveRollRange} from '../src/core/blacksmith-rules.js';
import {createArenaBattle} from '../src/core/arena.js';
import {createDungeonRun,advanceDungeonWave} from '../src/core/dungeon.js';
import {snapshotChronicleBattle,restoreChronicleBattle} from '../src/core/chronicle-combat.js';
import {validateContent} from '../src/core/content.js';
import {validateSpecialPassive} from '../src/core/exclusive-specials.js';
import {seededRandom} from '../src/core/random.js';
import {passivePresentation} from '../src/ui/skill-copy.js';
const c=await loadContent(),ids=['selene.signature','simon.signature','genevieve.signature'];
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function save(equip=ids){const s=createGameSave(c);s.party=['selene','simon','genevieve','arthur'];s.partyPresets[0].slots=[...s.party];s.unlockedCharacterIds=[...new Set([...s.unlockedCharacterIds,...s.party])];for(const id of equip){s.unlockedExclusiveRecipes.push(id);s.exclusiveGear.push({templateId:id,statKey:'maxMp',statValue:exclusiveRollRange(c,'maxMp').min});s.equippedExclusiveGear[c.exclusiveGear[id].characterId]=id;}return s;}
function fixture(equip=ids){const b=createBattle(c,save(equip),'forest_patrol',seededRandom(72),{enemyLevel:1});for(const a of b.actors){a.hp=a.stats.maxHp=100000;a.mp=a.stats.maxMp=10000;}return b;}
function cast(b,a,id,target=a.id){b.queue=[a.id,...b.actors.filter(x=>x.hp>0&&x.id!==a.id).map(x=>x.id)];b.cursor=0;executeAction(b,{actorId:a.id,abilityId:id,targetId:target});}
function step(b){const a=activeActor(b);assert.ok(a);if(a.team==='enemy')executeEnemyTurn(b);else executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});}
function advance(b,round){let n=0;while(b.round<round&&n++<80)step(b);assert.equal(b.round,round);}
const guard=a=>a.statuses.find(s=>s.id==='vertosse_round_guard');

test('all three recipes use Blueprint unlock, crafting and save round-trip',()=>{
 assert.deepEqual(validateContent(c),[]);let s=save([]);s.blueprints=30;s.coins=100000;s.prismaFragments=20000;s.recruitmentShards=100;s.originalPrisma=10;
 for(const id of ids){assert.throws(()=>craftExclusive(s,c,id),/Shop/);s=buyExclusiveRecipe(s,c,id);s=craftExclusive(s,c,id,()=>.5);}
 assert.equal(s.blueprints,0);assert.deepEqual(decodeGameSave(encodeGameSave(s,c),c).exclusiveGear.map(x=>x.templateId).sort(),[...ids].sort());
});

test('Selene adds 20 percentage points to shared Crit; Moon damage never benefits',()=>{
 const s=resolveCharacter(c,save(['selene.signature']),'selene');near(criticalChance(s),.2);near(criticalChance(s,true),.35);
 s.baseStats={...s.stats,attack:60,magic:90};s.gearEffects=[{effect:{type:'critical_chance',stat:'attack',atStat:150}},{effect:{type:'critical_chance',stat:'magic',atStat:150}}];near(criticalChance(s),.8);near(criticalChance(s,true),.95);s.baseStats.attack=150;assert.equal(criticalChance(s,true),1);
 const battle={random:()=>{throw Error('Moon must not roll Crit');}};assert.deepEqual(resolveCritical(battle,s,{type:'damage',element:'moon'},{}),{critical:false,multiplier:1});
 near(criticalChance(resolveCharacter(c,save([]),'selene')),0);
});

test('Lunarmare receives +18 base ATK total only while active; resolution never mutates source data',()=>{
 const b=fixture(['selene.signature']),s=getActor(b,'selene'),base=baseStatValue(s,'attack');near(base,29);cast(b,s,'selene.masquerade');near(baseStatValue(s,'attack'),base+18);assert.match(s.combatModes.lunarmare.summary,/18 ATK/);
 teamResourceState(b,s,'evidence').value=3;cast(b,s,'selene.verdict','enemy_0');assert.equal(s.activeMode,undefined);near(baseStatValue(s,'attack'),base);
 for(let i=0;i<2;i++)assert.equal(resolveCharacter(c,save(['selene.signature']),'selene').combatModes.lunarmare.baseStatBonuses.attack,18);
 assert.equal(c.characters.selene.combatModes.lunarmare.baseStatBonuses.attack,10);
 assert.match(passivePresentation(s,c).rules.join(' '),/18 ATK/);
});

test('Simon resolves two CD reductions and actual passive follow-up applies three Water Exposures',()=>{
 const b=fixture(['simon.signature']),s=getActor(b,'simon'),a=getActor(b,'selene');
 for(const id of ['simon.strategy','simon.cross_examine'])assert.equal(resolveRankedAbility(c,s,id).cooldown,1);
 cast(b,a,'selene.masquerade');cast(b,a,'selene.execution','enemy_0');const e=b.events.find(e=>e.type==='reaction'&&e.sourceId===s.id);assert.ok(e);assert.equal(getActor(b,e.targetId).statuses.find(x=>x.id==='exposure_water').stacks,3);
 cast(b,s,'simon.strategy',a.id);assert.equal(s.cooldowns['simon.strategy'],2);advance(b,2);assert.equal(s.cooldowns['simon.strategy'],1);advance(b,3);assert.equal(s.cooldowns['simon.strategy'],0);
 assert.equal(c.abilities['simon.objection'].effects[0].onHitStatus.stacks,2);assert.equal(c.abilities['simon.strategy'].cooldown,2);
 assert.match(passivePresentation(s,c).facts.join(' '),/3 Sơ Hở Thủy/);
 assert.match(passivePresentation(resolveCharacter(c,save([]),'simon'),c).facts.join(' '),/2 Sơ Hở Thủy/);
});

test('Genevieve grants base stats/evidence at real round starts, lasts through Extra and expires at end',()=>{
 const b=fixture(['genevieve.signature']),g=getActor(b,'genevieve');assert.equal(teamResourceState(b,g,'evidence').value,1);
 for(const a of b.actors.filter(a=>a.team==='party')){assert.deepEqual(guard(a).baseStatModifiers,{defense:6,resistance:6});assert.equal(guard(a).expiresAfterRound,1);near(baseStatValue(a,'defense'),c.characters[a.id].stats.defense+6);}
 assert.ok(b.actors.filter(a=>a.team==='enemy').every(a=>!guard(a)));assert.equal(getActor(b,'selene').statuses.find(s=>s.id==='lunarmare_conviction').stacks,1);
 b.extraTurnGrants.add(g.id);b.extraPhaseRequired=true;let n=0;while(b.phase!=='extra'&&n++<30)step(b);assert.equal(b.round,1);assert.equal(b.phase,'extra');assert.ok(guard(g));assert.equal(teamResourceState(b,g,'evidence').value,1);
 const before=guard(g);advance(b,2);assert.notEqual(guard(g),before);assert.equal(guard(g).expiresAfterRound,2);assert.equal(teamResourceState(b,g,'evidence').value,2);near(baseStatValue(g,'defense'),26);
 g.hp=0;advance(b,3);assert.equal(teamResourceState(b,g,'evidence').value,2);assert.ok(b.actors.every(a=>!guard(a)));
 const plain=fixture([]);assert.equal(teamResourceState(plain,'party','evidence').value,0);assert.ok(plain.actors.every(a=>!guard(a)));
});

test('full Evidence still emits creation; stunned source procs but fallen recipients get no buff',()=>{
 const b=fixture(['genevieve.signature']),g=getActor(b,'genevieve');teamResourceState(b,g,'evidence').value=6;g.statuses.push({id:'stunned',remaining:4,sourceId:'enemy_0'});getActor(b,'arthur').hp=0;
 advance(b,2);assert.equal(teamResourceState(b,g,'evidence').value,6);assert.ok(guard(g));assert.ok(!guard(getActor(b,'arthur')));assert.ok(b.events.some(e=>e.type==='team_resource_created'&&e.sourceId===g.id&&e.capped));
});

test('snapshot does not duplicate round-start proc; dungeon starts the next round without stacking mode bonus',()=>{
 const b=fixture(),copy=restoreChronicleBattle(c,snapshotChronicleBattle(b));assert.equal(teamResourceState(copy,'party','evidence').value,1);assert.equal(guard(getActor(copy,'genevieve')).expiresAfterRound,1);advance(copy,2);assert.equal(teamResourceState(copy,'party','evidence').value,2);
 const run=createDungeonRun(c,save(),'gold_mine','easy',()=>.99),s=getActor(run.battle,'selene');cast(run.battle,s,'selene.masquerade');const previous=teamResourceState(run.battle,s,'evidence').value;run.battle.outcome='victory';advanceDungeonWave(c,run);
 assert.equal(run.battle.round,2);assert.equal(teamResourceState(run.battle,'party','evidence').value,previous+1);near(baseStatValue(getActor(run.battle,'selene'),'attack'),47);assert.equal(guard(getActor(run.battle,'genevieve')).expiresAfterRound,2);
});

test('PvP mirror effects and Evidence stay relative to each owner; Simon signature works for AI side',()=>{
 const b=createArenaBattle(c,save(),'mirror',72);for(const a of b.actors){a.hp=a.stats.maxHp=100000;a.mp=a.stats.maxMp=10000;}
 for(const side of ['party','enemy']){assert.equal(teamResourceState(b,side,'evidence').value,1);const a=b.actors.find(a=>a.team===side&&a.definitionId==='selene');near(criticalChance(a),.2);assert.ok(guard(a));}
 const enemySelene=b.actors.find(a=>a.team==='enemy'&&a.definitionId==='selene'),enemySimon=b.actors.find(a=>a.team==='enemy'&&a.definitionId==='simon');cast(b,enemySelene,'selene.masquerade');assert.equal(teamResourceState(b,'party','evidence').value,1);assert.equal(teamResourceState(b,'enemy','evidence').value,4);near(baseStatValue(enemySelene,'attack'),47);
 const target=b.actors.find(a=>a.team==='party');cast(b,enemySelene,'selene.execution',target.id);const reaction=b.events.find(e=>e.type==='reaction'&&e.sourceId===enemySimon.id);assert.ok(reaction);assert.equal(getActor(b,reaction.targetId).team,'party');assert.equal(getActor(b,reaction.targetId).statuses.find(s=>s.id==='exposure_water').stacks,3);
});

test('new adapters reject invalid crit chance, mode and round buff configurations',()=>{
 const crit=c.exclusiveGear['selene.signature'].passive.effects[0],mode=c.exclusiveGear['selene.signature'].passive.effects[1],round=c.exclusiveGear['genevieve.signature'].passive;
 for(const p of [{...crit,ratio:2},{...mode,modeId:'missing'},{...mode,amount:-1},{...round,teamResourceId:'missing'},{...round,duration:3},{...round,baseStatModifiers:{defense:NaN}},{...round,statusId:'stun'}])assert.equal(validateSpecialPassive(p,c),false);
});

test('Selene signature produces real critical hits without weakness and disappears when unequipped',()=>{
 for(const equipped of [true,false]){
  const b=fixture(equipped?['selene.signature']:[]),s=getActor(b,'selene'),target=getActor(b,'enemy_0');target.weaknesses=[];target.damageTypeWeaknesses=[];target.resistances={};b.random=()=>.19;
  cast(b,s,'$attack',target.id);const hit=b.events.find(e=>e.type==='damage'&&e.sourceId===s.id);assert.ok(hit);assert.equal(Boolean(hit.critical),equipped);
 }
});

test('Simon signature still respects Hộ Ấn and cannot turn blocked Exposure into extra stacks',()=>{
 const b=fixture(['simon.signature']),s=getActor(b,'simon'),a=getActor(b,'selene'),target=getActor(b,'enemy_2');target.hp=target.stats.maxHp=1000000;
 const ward=Object.values(c.statuses).find(status=>status.effectImmunity);assert.ok(ward);target.statuses=[{id:ward.id,remaining:3,charges:1,sourceId:target.id}];
 cast(b,a,'selene.masquerade');cast(b,a,'selene.execution','enemy_0');assert.ok(b.events.some(e=>e.type==='reaction'&&e.sourceId===s.id&&e.targetId===target.id));assert.ok(!target.statuses.some(status=>status.id==='exposure_water'));assert.ok(!target.statuses.some(status=>status.id===ward.id));
});

test('forecast includes enhanced Simon follow-up without mutating live state; illegal spend remains atomic',()=>{
 const b=fixture(),a=getActor(b,'selene');cast(b,a,'selene.masquerade');b.queue=[a.id,'enemy_0'];b.cursor=0;const before=snapshotChronicleBattle(b);
 const forecast=forecastBattleAction(b,{actorId:a.id,abilityId:'selene.execution',targetId:'enemy_0'});assert.ok(forecast.actors.some(target=>target.team==='enemy'&&target.statuses.some(s=>s.id==='exposure_water'&&s.stacks===3)));assert.deepEqual(snapshotChronicleBattle(b),before);
 a.mp=0;const illegal=snapshotChronicleBattle(b);assert.throws(()=>executeAction(b,{actorId:a.id,abilityId:'selene.execution',targetId:'enemy_0'}));assert.deepEqual(snapshotChronicleBattle(b),illegal);
});

test('Miraebolis phase change neither reapplies Genevieve round buff nor duplicates Evidence generation',()=>{
 const campaign=save();campaign.storyFlags.push('illusion.sinister_unlocked');const b=createBattle(c,campaign,'miraebolis_superboss',seededRandom(66)),enemy=b.actors.find(a=>a.team==='enemy'),s=getActor(b,'selene'),g=getActor(b,'genevieve');
 cast(b,s,'selene.masquerade');const pool=teamResourceState(b,s,'evidence').value,round=b.round,before=structuredClone(guard(g));enemy.hp=Math.ceil(enemy.stats.maxHp*enemy.boss.phases[1].atHpRatio)+1;cast(b,s,'selene.execution',enemy.id);
 assert.equal(enemy.bossState.phase,2);assert.equal(b.round,round);assert.equal(teamResourceState(b,s,'evidence').value,pool-1);assert.deepEqual(guard(g),before);near(baseStatValue(g,'defense'),26);assert.equal(g.statuses.filter(s=>s.id==='vertosse_round_guard').length,1);
});

test('Simon signature raises real PvE follow-up to R5M3 without gear changing the original 160 percent',()=>{
 for(const equipped of [true,false]){
  const b=fixture(equipped?['simon.signature']:[]),a=getActor(b,'selene'),s=getActor(b,'simon'),target=getActor(b,'enemy_2');target.hp=target.stats.maxHp=1000000;target.stats.defense=0;target.weaknesses=[];target.damageTypeWeaknesses=[];target.resistances={};
  cast(b,a,'selene.masquerade');cast(b,a,'selene.execution','enemy_0');const hit=b.events.find(e=>e.type==='damage'&&e.sourceId===s.id);assert.ok(hit);assert.equal(hit.targetId,target.id);assert.equal(hit.amount,Math.floor(s.stats.attack*1.6*(equipped?coefficientFactor(8,skillRules(c)):1)));assert.equal(target.statuses.find(s=>s.id==='exposure_water').stacks,equipped?3:2);
  assert.equal(resolveRankedAbility(c,s,'simon.objection').skillRank,1);assert.equal(c.abilities['simon.objection'].effects[0].multiplier,1.6);if(equipped)assert.match(passivePresentation(s,c).facts.join(' '),/337,93% ATK/);
 }
});

test('Simon signature damage respects PvP R5 ceiling on either mirror side',()=>{
 for(const side of ['party','enemy']){
  const b=createArenaBattle(c,save(['simon.signature']),'mirror',72);for(const a of b.actors){a.hp=a.stats.maxHp=100000;a.mp=a.stats.maxMp=10000;a.stats.defense=0;a.weaknesses=[];a.damageTypeWeaknesses=[];a.resistances={};}
  const a=b.actors.find(a=>a.team===side&&a.definitionId==='selene'),s=b.actors.find(a=>a.team===side&&a.definitionId==='simon'),target=b.actors.find(a=>a.team!==side);cast(b,a,'selene.masquerade');cast(b,a,'selene.execution',target.id);
  const hit=b.events.find(e=>e.type==='damage'&&e.sourceId===s.id);assert.ok(hit);assert.equal(hit.pvpDamage.before,Math.floor(s.stats.attack*1.6*coefficientFactor(5,skillRules(c))));assert.match(passivePresentation(s,b.content).facts.join(' '),/234,26% ATK/);
 }
});

test('rank-equivalent signature uses shared progression once and validates authored rank',()=>{
 const actor=resolveCharacter(c,save(['simon.signature']),'simon'),raw=resolveRankedAbility(c,actor,'simon.objection').effects[0],copy=structuredClone(raw),resolved=exclusiveDamageEffect(actor,'simon.objection',raw);near(resolved.multiplier,3.3792833536000013);assert.deepEqual(raw,copy);assert.deepEqual(exclusiveDamageEffect(actor,'simon.objection',resolved),resolved);
 actor.skillProgression={...actor.skillProgression,coefficientGrowthPerRank:1.2};near(exclusiveDamageEffect(actor,'simon.objection',raw).multiplier,1.6*coefficientFactor(8,actor.skillProgression));
 const p=c.exclusiveGear['simon.signature'].passive.effects.find(p=>p.type==='skill_scaling_override');for(const rank of [0,8.5,9,Infinity])assert.equal(validateExclusivePassive({...p,equivalentRank:rank},c),false);assert.equal(validateExclusivePassive(p,c),true);
});
