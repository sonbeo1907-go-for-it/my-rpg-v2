import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {resolveCharacter} from '../src/core/progression.js';
import {createBattle,getActor,activeActor,executeAction,executeEnemyTurn,planAutoBattleTurn} from '../src/core/battle.js';
import {resolveRankedAbility} from '../src/core/skill-resolver.js';
import {validateContent} from '../src/core/content.js';
import {skillPresentation,passivePresentation} from '../src/ui/skill-copy.js';
import {statusModifier} from '../src/core/stat-values.js';
import {createArenaBattle} from '../src/core/arena.js';
import {rotationSchedule} from '../src/core/rate-up.js';
const content=await loadContent();
function fixture(party=['kanade','wilson','iris','elaine']){
 const c=structuredClone(content),save=createGameSave(c);save.party=party;save.partyPresets[0].slots=[...party];save.unlockedCharacterIds=[...new Set([...save.unlockedCharacterIds,...party])];
 const b=createBattle(c,save,'forest_patrol',()=>.99,{enemyLevel:1});
 for(const a of b.actors){a.hp=a.stats.maxHp=100000;a.mp=a.stats.maxMp=1000;a.stats.magic=40;a.stats.attack=40;a.stats.defense=a.stats.resistance=0;a.baseStats={...a.stats};a.statuses=[];a.gearEffects=[];a.weaknesses=[];a.resistances={};if(a.team==='enemy')a.passive=null;}
 const unit=id=>getActor(b,id);return {b,c,save,unit,enemies:b.actors.filter(a=>a.team==='enemy')};
}
function cast(b,actor,skill,target='enemy_0'){
 b.queue=[actor.id,...b.actors.filter(a=>a.hp>0&&a.id!==actor.id).map(a=>a.id)];b.cursor=0;
 executeAction(b,{actorId:actor.id,abilityId:skill,targetId:target});
}
const hits=(b,owner)=>b.events.filter(e=>e.type==='damage'&&e.sourceId===owner.id);
const echoes=(b,owner)=>b.events.filter(e=>e.type==='reaction'&&e.kind==='follow_up'&&e.sourceId===owner.id);

test('Marquis release IDs, affiliations, recruitment, AI and old saves reconcile without a free unlock',()=>{
 assert.equal(content.characters.kanade.releaseId,102);assert.equal(content.characters.wilson.releaseId,103);
 const save=createGameSave(content);
 for(const id of ['kanade','wilson']){assert.equal(content.characters[id].affiliation,'house_marquis');assert.ok(content.banners.standard.characterPool.includes(id));assert.ok(content.pvpAiProfiles[id]);assert.ok(!save.unlockedCharacterIds.includes(id));delete save.characters[id];}
 const restored=decodeGameSave(encodeGameSave(save,content),content);assert.ok(restored.characters.kanade&&restored.characters.wilson);assert.ok(!restored.unlockedCharacterIds.includes('kanade'));
 assert.deepEqual(validateContent(content),[]);
});
test('Kanade amplifies only Earth-weak targets in an active skill; AoE does not grant a persistent buff',()=>{
 const {b,unit,enemies}=fixture(['kanade','iris','elaine','garrek']),k=unit('kanade');enemies[0].weaknesses=['earth'];enemies[1].damageTypeWeaknesses=['magical'];
 cast(b,k,'kanade.garden');const damage=hits(b,k);
 assert.deepEqual(damage.map(d=>d.amount),[384,192,128]);assert.equal(damage[0].weaknessMultiplier,2);assert.equal(damage[1].weaknessMultiplier,1.5);
 assert.ok(!k.statuses.some(s=>s.id==='weakness_exploitation'));assert.ok(enemies.every(e=>e.statuses.some(s=>s.id==='buff_seal')));
});
test('Earth exposure enables Kanade, consumes once; an unrelated exposure and basic attacks cannot borrow the passive',()=>{
 const {b,unit,enemies}=fixture(['kanade','iris','elaine','garrek']),k=unit('kanade');
 enemies[0].statuses=[{id:'exposure_earth',stacks:2,remaining:null,sourceId:'iris'}];
 cast(b,k,'kanade.fault');assert.equal(hits(b,k)[0].amount,240);assert.equal(enemies[0].statuses.find(s=>s.id==='exposure_earth').stacks,1);
 enemies[0].statuses=[];enemies[0].weaknesses=['earth'];cast(b,k,'$attack');assert.equal(hits(b,k)[0].amount,60);
 enemies[0].weaknesses=[];enemies[0].statuses=[{id:'exposure_fire',stacks:2,remaining:null,sourceId:'iris'}];cast(b,k,'kanade.fault');assert.equal(hits(b,k)[0].amount,80);
});
test('Kanade native amplification coexists with the strongest skill amp and exploitation never multiplies twice',()=>{
 const {b,unit,enemies}=fixture(['kanade','iris','elaine','garrek']),k=unit('kanade');enemies[0].weaknesses=['earth'];
 k.statuses=[{id:'weakness_exploitation',remaining:3,sourceId:'iris'},{id:'empowered',remaining:3,sourceId:'iris'}];
 const amp=content.statuses.empowered.modifiers.damageBonus;
 cast(b,k,'kanade.fault');assert.equal(hits(b,k)[0].amount,Math.floor(80*2*(1+.5+amp)));assert.equal(hits(b,k)[0].weaknessMultiplier,2);
});
test('Wilson echoes the ranked first skill as AoE despite insufficient MP and cooldown, then reapplies Earth exposure',()=>{
 const {b,c,unit,enemies}=fixture(),k=unit('kanade'),w=unit('wilson');w.skillRanks={'wilson.petals':5};w.mp=0;w.cooldowns['wilson.petals']=9;
 enemies[0].statuses=[{id:'exposure_earth',stacks:1,remaining:null,sourceId:w.id}];
 cast(b,k,'kanade.fault');assert.equal(echoes(b,w).length,1);assert.equal(hits(b,w).length,3);assert.equal(w.mp,0);assert.equal(w.cooldowns['wilson.petals'],9);
 assert.ok(enemies.every(e=>e.statuses.find(s=>s.id==='exposure_earth')?.stacks===2));
 assert.equal(hits(b,w).find(h=>h.targetId===enemies[1].id).amount,Math.floor(40*1.2*1.1**4));
 assert.equal(resolveRankedAbility(c,w,'wilson.petals').skillRank,5);
});
test('Wilson shares two activations across main and Extra, excluding self, defend, basic, wrong element and physical Earth',()=>{
 const {b,c,unit}=fixture(),k=unit('kanade'),w=unit('wilson');
 cast(b,w,'wilson.petals');assert.equal(echoes(b,w).length,0);
 cast(b,k,'$defend',k.id);assert.equal(echoes(b,w).length,0);cast(b,k,'$attack');assert.equal(echoes(b,w).length,0);
 cast(b,unit('elaine'),'elaine.shield',k.id);assert.equal(echoes(b,w).length,0);
 const physical={...c.abilities['kanade.fault'],id:'test.physical',effects:[{type:'damage',damageType:'physical',element:'earth',multiplier:1}]};c.abilities[physical.id]=physical;k.abilities.push(physical.id);cast(b,k,physical.id);assert.equal(echoes(b,w).length,0);
 cast(b,k,'kanade.bloom',k.id);assert.equal(echoes(b,w).length,1);
 b.phase='extra';cast(b,k,'kanade.fault');assert.equal(echoes(b,w).length,1);assert.equal(w.elementSkillEchoState.count,2);
 cast(b,k,'kanade.fault');assert.equal(echoes(b,w).length,0);
 b.round++;b.phase='main';cast(b,k,'kanade.fault');assert.equal(echoes(b,w).length,1);
});
test('support echo can trigger while Wilson is stunned but never with a fallen owner or from another echo',()=>{
 const {b,unit}=fixture(),w=unit('wilson'),k=unit('kanade');w.statuses=[{id:'stunned',remaining:1,sourceId:'enemy_0'}];
 cast(b,k,'kanade.fault');assert.equal(echoes(b,w).length,1);assert.equal(w.elementSkillEchoState.count,1);
 w.hp=0;cast(b,k,'kanade.fault');assert.equal(echoes(b,w).length,0);
});
test('Kanade four-main-turn buff survives Extra and can be refreshed when Mori-length cooldown is ready',()=>{
 const {b,unit}=fixture(['kanade','iris','elaine','garrek']),k=unit('kanade');
 cast(b,k,'kanade.bloom',k.id);const createdRound=b.round;
 assert.ok(b.extraTurnGrants.has(k.id));assert.equal(k.statuses.find(s=>s.id==='kanade_bloom').remaining,4);
 let sawExtra=false,steps=0;
 while(++steps<180){const a=activeActor(b);assert.ok(a);if(a.id===k.id&&b.phase==='main'&&b.round===createdRound+4)break;
  if(a.id===k.id){assert.ok(k.statuses.some(s=>s.id==='kanade_bloom'));if(b.phase==='extra')sawExtra=true;}
  if(a.team==='enemy')executeEnemyTurn(b);else executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});
 }
 assert.ok(steps<180&&sawExtra);assert.equal(k.cooldowns['kanade.bloom'],0);
 cast(b,k,'kanade.bloom',k.id);assert.equal(k.statuses.filter(s=>s.id==='kanade_bloom').length,1);assert.equal(k.statuses.find(s=>s.id==='kanade_bloom').remaining,4);
});
test('rank growth affects damage, MAG buff and healing; debuff, exposure, seals and duration stay fixed',()=>{
 const {b,c,unit,enemies}=fixture(),k=unit('kanade'),w=unit('wilson');
 assert.equal(resolveRankedAbility(c,k,'kanade.garden',5).effects[0].rankDamageFactor,1.1**4);
 assert.ok(Math.abs(resolveRankedAbility(c,k,'kanade.bloom',5).effects[0].appliedModifiers.magic-.35*1.05**4)<1e-9);
 assert.equal(resolveRankedAbility(c,w,'wilson.petals',5).effects[0].onHitStatus.stacks,2);
 assert.equal(resolveRankedAbility(c,w,'wilson.shelter',5).effects[0].multiplier,.75*1.1**4);
 cast(b,k,'kanade.fault');cast(b,w,'wilson.fissure');assert.equal(enemies[0].statuses.filter(s=>s.id==='marquis_res_break').length,1);assert.equal(statusModifier(c,enemies[0],'resistance'),-.2);
 for(const a of b.actors.filter(a=>a.team==='party'))a.hp=50;
 cast(b,w,'wilson.shelter',w.id);assert.ok(b.actors.filter(a=>a.team==='party').every(a=>a.hp===80));
 for(const a of [k,w]){assert.ok(passivePresentation(a,c).facts.length);for(const id of a.abilities)assert.ok(skillPresentation(c.abilities[id],a,c).summary.length<=180);}
 assert.ok(planAutoBattleTurn(b)===null||typeof planAutoBattleTurn(b).abilityId==='string');
});
test('both Arena sides own independent Wilson limits, target enemies relatively and honor reaction soft caps',()=>{
 const c=createGameSave(content);c.party=['kanade','wilson','iris','elaine'];c.unlockedCharacterIds.push('kanade','wilson');c.partyPresets[0].slots=[...c.party];
 const b=createArenaBattle(content,c,'mirror',12);
 for(const a of b.actors){a.hp=a.stats.maxHp=10000;a.mp=a.stats.maxMp=1000;a.stats.magic=40;}
 for(const team of ['party','enemy']){
  const k=b.actors.find(a=>a.team===team&&(a.characterId??a.definitionId)==='kanade'),w=b.actors.find(a=>a.team===team&&(a.characterId??a.definitionId)==='wilson');assert.ok(k&&w);
  cast(b,k,'kanade.fault',b.actors.find(a=>a.team!==team).id);assert.equal(w.elementSkillEchoState.count,1);
  assert.ok(hits(b,w).every(e=>b.actors.find(a=>a.id===e.targetId).team!==team));
 }
});
test('invalid intrinsic/echo rules fail validation and published rate-up lineups before the addition stay unchanged',()=>{
 for(const mutate of [c=>c.characters.kanade.passive.damageBonus=-1,c=>c.characters.wilson.passive.perRound=0,c=>c.characters.wilson.passive.followUpAbility='kanade.bloom']){const c=structuredClone(content);mutate(c);assert.ok(validateContent(c).length);}
 for(const day of ['2026-11-02','2026-11-05','2026-11-08','2026-11-10']){
  const old=structuredClone(content);old.banners.standard.rateUpRotation.rosterAdditions=old.banners.standard.rateUpRotation.rosterAdditions.filter(x=>!['kanade','wilson'].includes(x.id));
  const at=new Date(day+'T05:00:00Z');assert.deepEqual(rotationSchedule(content,at).banners.map(b=>b.featured),rotationSchedule(old,at).banners.map(b=>b.featured));
 }
});
