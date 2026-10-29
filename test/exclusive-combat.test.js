import test from 'node:test';import assert from 'node:assert/strict';
import { loadContent } from '../scripts/load-content.mjs';
import { createGameSave,encodeGameSave,decodeGameSave } from '../src/core/game-save.js';
import { resolveCharacter,completeStoryEvent } from '../src/core/progression.js';
import { createBattle,executeAction,getActor } from '../src/core/battle.js';
import { craftExclusive,beginReforge,finishReforge,equipExclusive } from '../src/core/blacksmith.js';
import { claimBattleReward } from '../src/core/economy.js';
import { battleStat } from '../src/core/stat-values.js';
import { skillScaling } from '../src/ui/skill-presentation.js';
import { validateContent } from '../src/core/content.js';
const content=await loadContent();
function campaign(){const c=createGameSave(content);c.unlockedCharacterIds=Object.keys(content.characters);Object.assign(c,{coins:50000,prismaFragments:1000,recruitmentShards:30,originalPrisma:20});return c;}
function setup(id,party,disable=false,random=()=>.99){let c=campaign();c.party=party;const template=content.exclusiveGear[id];c.exclusiveGear.push({templateId:id,statKey:'attack',statValue:5});c.equippedExclusiveGear[template.characterId]=id;const b=createBattle(content,c,'forest_patrol',random);for(const e of b.actors.filter(a=>a.team==='enemy')){e.hp=e.stats.maxHp=10000;e.stats.defense=60;}if(disable)delete getActor(b,template.characterId).exclusiveGear;return b;}
function use(b,id,ability,target=id){b.queue=[id,...b.actors.filter(a=>a.id!==id&&a.hp>0).map(a=>a.id)];b.cursor=0;executeAction(b,{actorId:id,abilityId:ability,targetId:target});}
const damage=b=>b.events.filter(e=>e.type==='damage');

test('quest first clear grants fixed ATK+5 exclusive and Arthur/Iris/Takeshi dupes atomically; replay cannot duplicate',()=>{
 const c=createGameSave(content),battle={outcome:'victory',encounterId:'giant_boar_trial'};
 assert.throws(()=>claimBattleReward(c,battle,content,()=>{throw Error('disk');}),/disk/);assert.equal(battle.rewardClaimed,undefined);assert.equal(c.coins,0);assert.deepEqual(c.exclusiveGear,[]);
 const next=claimBattleReward(c,battle,content);assert.equal(next.coins,150);assert.deepEqual(next.exclusiveGear,[{templateId:'arthur.intro',statKey:'attack',statValue:5}]);assert.deepEqual(next.extraGearSlots,{arthur:1,iris:1,takeshi:1});assert.equal(next.recruitmentShards,30);
 const restored=decodeGameSave(encodeGameSave(next,content),content);const replay=claimBattleReward(restored,{outcome:'victory',encounterId:'giant_boar_trial'},content);assert.equal(replay.coins,300);assert.deepEqual(replay.exclusiveGear,next.exclusiveGear);assert.deepEqual(replay.extraGearSlots,next.extraGearSlots);assert.equal(replay.recruitmentShards,30);
 assert.equal(content.encounters.giant_boar_trial.bgm,'boss');assert.equal(content.encounters.giant_boar_trial.rewardTier,'boss');
 assert.throws(()=>craftExclusive(c,content,'arthur.intro'),/nhiệm vụ/);
 const forged=JSON.parse(encodeGameSave(next,content));forged.exclusiveGear=[];assert.throws(()=>decodeGameSave(JSON.stringify(forged),content),/Trấn Phái/);
 assert.equal(claimBattleReward(c,{outcome:'victory',encounterId:'giant_boar_trial',dungeon:{}},content),c);
});
test('already-owned quest exclusive keeps reforged stat; intro is eligible for ordinary reforge without changing passive',()=>{
 let c=campaign();c.exclusiveGear=[{templateId:'arthur.intro',statKey:'speed',statValue:9}];
 const next=claimBattleReward(c,{outcome:'victory',encounterId:'giant_boar_trial'},content);assert.equal(next.exclusiveGear[0].statKey,'speed');assert.equal(next.exclusiveGear[0].statValue,9);
 c=beginReforge(next,content,'arthur.intro',()=>0);assert.equal(c.originalPrisma,19);assert.equal(c.exclusiveGear[0].statKey,'speed');c=finishReforge(c,content,c.pendingReforge.id,true);assert.equal(c.exclusiveGear[0].statKey,'maxHp');assert.equal(c.exclusiveGear[0].statValue,25);assert.equal(content.exclusiveGear['arthur.intro'].passive.type,'skill_damage');
});
test('all 12 authored craft templates can be crafted/reforged/equipped once in separate slot and round-trip save',()=>{
 for(const t of Object.values(content.exclusiveGear).filter(t=>!t.source)){
  let c=campaign();c=craftExclusive(c,content,t.id,()=>.5);assert.equal(c.coins,40000);c=equipExclusive(c,content,t.characterId,t.id);const resolved=resolveCharacter(content,c,t.characterId);assert.equal(resolved.exclusiveGear.template.passive.type,t.passive.type);assert.deepEqual(c.equipment,{});assert.throws(()=>craftExclusive(c,content,t.id),/đã được/);assert.deepEqual(decodeGameSave(encodeGameSave(c,content),content).exclusiveGear,c.exclusiveGear);
 }
});
test('Arthur intro boosts only Light Slash by 8%; unequipped passive never applies',()=>{
 const run=(ability,disable)=>{const b=setup('arthur.intro',['arthur'],disable);getActor(b,'arthur').resourceValues.resonance=3;use(b,'arthur',ability,'enemy_0');return damage(b)[0].amount;};
 const a=run('arthur.light_slash',false),base=run('arthur.light_slash',true);assert.ok(Math.abs(a-base*1.08)<2);
 assert.equal(run('arthur.release',false),run('arthur.release',true));assert.equal(run('arthur.ogres_bane',false),run('arthur.ogres_bane',true));
});
test('Arthur penetration handles both story variants, keeps resource costs/fatigue and excludes release',()=>{
 for(const ability of ['arthur.ogres_bane','arthur.ogres_bane_controlled']){
  const b=setup('arthur.unbound',['arthur']),base=setup('arthur.unbound',['arthur'],true);
  for(const x of [b,base]){const a=getActor(x,'arthur');a.abilities.push(ability);a.resourceValues.resonance=3;use(x,a.id,ability,'enemy_0');assert.equal(a.resourceValues.resonance,0);assert.equal(a.mp,32);assert.ok(a.statuses.some(s=>s.id===(ability.endsWith('controlled')?'controlled_fatigue':'exhausted')));}
  assert.ok(damage(b)[0].amount>damage(base)[0].amount);
 }
});
test('Arthur release protection refreshes once and survives through next own action, including upgraded partial release',()=>{
 const b=setup('arthur.afterglow',['arthur']);const a=getActor(b,'arthur');a.abilities.push('arthur.partial_release');a.resourceValues.resonance=3;use(b,a.id,'arthur.release','enemy_0');assert.equal(a.statuses.find(s=>s.id==='exclusive_afterglow').remaining,1);
 a.resourceValues.resonance=2;use(b,a.id,'arthur.partial_release','enemy_0');assert.equal(a.statuses.filter(s=>s.id==='exclusive_afterglow').length,1);use(b,a.id,'$defend');assert.ok(!a.statuses.some(s=>s.id==='exclusive_afterglow'));
});
test('Iris notebook extra Data shares main/extra quota, never marks quota when full, and preserves max 3',()=>{
 const b=setup('iris.notebook',['iris','arthur']);const iris=getActor(b,'iris');use(b,'iris','iris.formula','arthur');assert.equal(iris.resourceValues.data,2);
 b.phase='extra';use(b,'iris','iris.formula','arthur');assert.equal(iris.resourceValues.data,3);iris.resourceValues.data=0;use(b,'iris','iris.formula','arthur');assert.equal(iris.resourceValues.data,1);
 b.round++;iris.resourceValues.data=3;use(b,'iris','iris.formula','arthur');iris.resourceValues.data=0;use(b,'iris','iris.formula','arthur');assert.equal(iris.resourceValues.data,2);
});
test('Iris compass extends calibration with separate 10% speed for 2 recipient turns',()=>{
 const b=setup('iris.compass',['iris','arthur']);use(b,'iris','iris.calibrate','arthur');const a=getActor(b,'arthur');assert.equal(battleStat(content,a,'speed'),17.6);assert.equal(battleStat(content,a,'attack'),40.8);assert.equal(a.statuses.find(s=>s.id==='exclusive_calibration').remaining,2);assert.equal(getActor(b,'iris').resourceValues.data,1);
});
test('Takeshi dodge heal triggers on actual physical dodge once across phases; magic and full-HP attempts do not use quota',()=>{
 const b=setup('takeshi.cloak',['takeshi'],false,()=>0),a=getActor(b,'takeshi');a.statuses.push({id:'evasive',remaining:5,sourceId:a.id});
 use(b,'enemy_0','$attack','takeshi');assert.equal(a.procRounds?.exclusive_dodge,undefined);a.hp=100;
 b.phase='extra';use(b,'enemy_0','$attack','takeshi');assert.equal(a.hp,110);assert.equal(a.resourceValues.opening,1);use(b,'enemy_0','$attack','takeshi');assert.equal(a.hp,110);
 b.round++;use(b,'enemy_0','$attack','takeshi');assert.equal(a.hp,120);
 const magic=setup('takeshi.cloak',['takeshi'],false,()=>0);const p=getActor(magic,'takeshi');p.hp=100;p.statuses.push({id:'evasive',remaining:5,sourceId:p.id});getActor(magic,'enemy_0').abilities.push('lionel.light');use(magic,'enemy_0','lionel.light','takeshi');assert.equal(p.procRounds?.exclusive_dodge,undefined);
});
test('Takeshi penetration requires at least 2 openings and never boosts counters/basic/slash',()=>{
 const run=(n,disable)=>{const b=setup('takeshi.insight',['takeshi'],disable);getActor(b,'takeshi').resourceValues.opening=n;use(b,'takeshi','takeshi.riposte','enemy_0');assert.equal(getActor(b,'takeshi').resourceValues.opening,0);return damage(b)[0].amount;};
 assert.equal(run(1,false),run(1,true));assert.ok(run(2,false)>run(2,true));assert.ok(run(3,false)>run(3,true));
});
test('Fiona fresh mark tests pre-cast state and once-round cap even in extra; next round permits a new target',()=>{
 const b=setup('fiona.prism',['fiona']);use(b,'fiona','fiona.shard','enemy_0');assert.equal(getActor(b,'enemy_0').statuses[0].stacks,2);
 b.phase='extra';use(b,'fiona','fiona.shard','enemy_1');assert.equal(getActor(b,'enemy_1').statuses[0].stacks,1);
 b.round++;use(b,'fiona','fiona.shard','enemy_0');assert.equal(getActor(b,'enemy_0').statuses[0].stacks,3);use(b,'fiona','fiona.shard','enemy_2');assert.equal(getActor(b,'enemy_2').statuses[0].stacks,2);
});
test('Fiona crown counts distinct enemies that actually lose marks, returns 8 MP once after complete cast',()=>{
 for(const targets of [1,2,3]){
  const b=setup('fiona.crown',['fiona']);const f=getActor(b,'fiona');for(let i=0;i<targets;i++)getActor(b,'enemy_'+i).statuses.push({id:'prisma',stacks:3,remaining:4,sourceId:f.id});use(b,'fiona','fiona.collapse','enemy_0');assert.equal(f.mp,targets>=2?96:88);assert.equal(b.actors.filter(a=>a.team==='enemy').some(a=>a.statuses.some(s=>s.id==='prisma')),false);
 }
});
test('Elaine relic multiplies only shieldbreak heal, mirror extends/refreshes veil without stacking or increasing shields',()=>{
 const b=setup('elaine.relic',['elaine','arthur']);const a=getActor(b,'arthur');a.hp=100;use(b,'elaine','elaine.shield','arthur');assert.equal(a.shield,54);a.shield=1;use(b,'enemy_0','$attack','arthur');assert.equal(b.events.find(e=>e.type==='heal').amount,16);
 const dead=setup('elaine.relic',['elaine','arthur']);use(dead,'elaine','elaine.shield','arthur');getActor(dead,'elaine').hp=0;getActor(dead,'arthur').shield=1;use(dead,'enemy_0','$attack','arthur');assert.equal(dead.events.some(e=>e.type==='heal'),false);
 const veil=setup('elaine.mirror',['elaine','arthur']);use(veil,'elaine','elaine.veil');use(veil,'elaine','elaine.veil');assert.equal(getActor(veil,'arthur').statuses.find(s=>s.id==='water_veil').remaining,3);assert.equal(getActor(veil,'arthur').statuses.filter(s=>s.id==='water_veil').length,1);assert.equal(battleStat(content,getActor(veil,'arthur'),'resistance'),24);
 assert.ok(skillScaling(content.abilities['elaine.veil'],getActor(veil,'elaine'),content).some(l=>l.includes('3 lượt')));
});
test('Garrek crest reduces actual Cover redirect only by separate 0.85, not original targeting or AoE',()=>{
 const run=(target,area,disable)=>{const b=setup('garrek.crest',['garrek','arthur'],disable);use(b,'garrek','garrek.cover','arthur');getActor(b,'enemy_0').stats.attack=100;getActor(b,'enemy_0').abilities.push('giant_boar.stampede');getActor(b,'enemy_0').mp=100;use(b,'enemy_0',area?'giant_boar.stampede':'$attack',target);return damage(b).find(e=>e.targetId==='garrek').amount;};
 assert.ok(Math.abs(run('arthur',false,false)-run('arthur',false,true)*.85)<2);assert.equal(run('garrek',false,false),run('garrek',false,true));assert.equal(run('arthur',true,false),run('arthur',true,true));
});
test('Garrek armor heals only next actual start including extra phase; poison KO cannot be rescued',()=>{
 const b=setup('garrek.armor',['garrek','lionel']);const a=getActor(b,'garrek');a.hp=200;use(b,a.id,'garrek.fortress');assert.equal(a.hp,200);
 // Isolate next actual start via phase transition (main round need not advance).
 b.extraTurnGrants=new Set([a.id]);b.extraPhaseRequired=true;b.queue=['enemy_0'];b.cursor=0;executeAction(b,{actorId:'enemy_0',abilityId:'$defend',targetId:'enemy_0'});assert.equal(b.phase,'extra');assert.equal(a.hp,218);assert.equal(a.pendingExclusiveHeal,undefined);
 const dead=setup('garrek.armor',['garrek','lionel']);const d=getActor(dead,'garrek');d.hp=10;use(dead,d.id,'garrek.fortress');d.statuses.push({id:'kai_poison',remaining:1,potency:20,sourceId:'enemy_0'});dead.extraTurnGrants=new Set([d.id]);dead.extraPhaseRequired=true;dead.queue=['enemy_0'];dead.cursor=0;executeAction(dead,{actorId:'enemy_0',abilityId:'$defend',targetId:'enemy_0'});assert.equal(d.hp,0);assert.equal(dead.events.some(e=>e.type==='heal'&&e.targetId===d.id),false);
});
test('exclusive schema rejects unknown hook types and broken skill/status/source references',()=>{
 for(const mutate of [c=>c.exclusiveGear['iris.notebook'].passive.type='fake',c=>c.exclusiveGear['arthur.intro'].passive.abilityIds=['missing'],c=>c.exclusiveGear['elaine.mirror'].passive.statusId='missing',c=>c.exclusiveGear['arthur.intro'].source.encounterId='missing',c=>c.exclusiveGear['garrek.crest'].passive.ratio=1.1]){const c=structuredClone(content);mutate(c);assert.ok(validateContent(c).length);}
});
test('once-per-round exclusive can first activate during extra; an ineligible main action never reserves its quota',()=>{
 const b=setup('iris.notebook',['iris','arthur']);use(b,'iris','iris.calibrate','arthur');assert.equal(getActor(b,'iris').resourceValues.data,1);assert.equal(getActor(b,'iris').procRounds?.exclusive_resource,undefined);
 b.phase='extra';use(b,'iris','iris.formula','arthur');assert.equal(getActor(b,'iris').resourceValues.data,3);assert.equal(getActor(b,'iris').procRounds.exclusive_resource,b.round);
 const f=setup('fiona.prism',['fiona']);use(f,'fiona','fiona.refraction','enemy_0');f.phase='extra';getActor(f,'enemy_0').statuses=[];use(f,'fiona','fiona.shard','enemy_0');assert.equal(getActor(f,'enemy_0').statuses[0].stacks,2);
});
