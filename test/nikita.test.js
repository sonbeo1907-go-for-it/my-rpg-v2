import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,executeEnemyTurn,activeActor,forecastBattleAction} from '../src/core/battle.js';
import {createArenaBattle} from '../src/core/arena.js';
import {resolveWeakness,captureExposures} from '../src/core/weakness.js';
import {resolveRankedAbility} from '../src/core/skill-resolver.js';
import {passivePresentation} from '../src/ui/skill-copy.js';
const c=await loadContent();
function save(){const s=createGameSave(c);s.party=['nikita','iris','garrek','elaine'];s.partyPresets[0].slots=[...s.party];s.unlockedCharacterIds.push('nikita');return s;}
function fixture(){const b=createBattle(c,save(),'forest_patrol',()=>.5),a=b.actors.find(x=>x.id==='nikita'),e=b.actors.find(x=>x.team==='enemy');for(const x of b.actors){x.hp=x.stats.maxHp=100000;x.mp=x.stats.maxMp=1000;x.statuses=[];}e.weaknesses=[];e.resistances={};return {b,a,e};}
function cast(b,a,id,target=a.id){b.queue=[a.id,...b.actors.filter(x=>x.id!==a.id&&x.hp>0).map(x=>x.id)];b.cursor=0;executeAction(b,{actorId:a.id,abilityId:id,targetId:target});}
const hit=(b,a)=>b.events.find(x=>x.type==='damage'&&x.sourceId===a.id);
test('Nikita joins recruitment and AI with stable release ID; older saves remain locked',()=>{
 assert.equal(c.characters.nikita.releaseId,107);assert.equal(c.characters.nikita.affiliation,'capital_knights');assert.ok(c.banners.standard.characterPool.includes('nikita'));assert.ok(c.pvpAiProfiles.nikita);
 const s=createGameSave(c);delete s.characters.nikita;const restored=decodeGameSave(encodeGameSave(s,c),c);assert.ok(restored.characters.nikita);assert.ok(!restored.unlockedCharacterIds.includes('nikita'));
 assert.match(JSON.stringify(passivePresentation(c.characters.nikita,c)),/50% RES/);
});
test('wind weakness and exposure enable bonus/penetration only for active skills; no free exploitation',()=>{
 const {b,a,e}=fixture(),effect=c.abilities['nikita.dagger'].effects[0];e.weaknesses=['wind'];
 function resolve(extra={}){return resolveWeakness(c,a,e,effect,{skillId:'nikita.dagger',exposures:captureExposures(b),...extra});}
 assert.equal(resolve().multiplier,1.5);assert.equal(resolve().skillWeaknessDamageBonus,.6);assert.equal(resolve().skillWeaknessPenetration,.5);
 for(const extra of [{skillId:'$attack'},{reaction:true},{automatic:true}]){assert.equal(resolve(extra).skillWeaknessDamageBonus,0);assert.equal(resolve(extra).skillWeaknessPenetration,0);}
 e.weaknesses=[];e.damageTypeWeaknesses=['magical'];assert.equal(resolve().skillWeaknessDamageBonus,0);assert.equal(resolve().skillWeaknessPenetration,0);
 e.statuses=[{id:'exposure_wind',stacks:1,remaining:null}];assert.equal(resolve().skillWeaknessPenetration,.5);
});
test('passive changes actual damage and does not mutate Kanade or shared definitions',()=>{
 const f=fixture(),control=fixture();for(const x of [f,control]){x.e.weaknesses=['wind'];x.e.stats.resistance=100;}
 control.a.passive={...control.a.passive,damageBonus:0,penetration:0};cast(f.b,f.a,'nikita.dagger',f.e.id);cast(control.b,control.a,'nikita.dagger',control.e.id);
 assert.ok(hit(f.b,f.a).amount>hit(control.b,control.a).amount);assert.equal(c.characters.kanade.passive.weaknessMultiplier,2);assert.equal(c.characters.kanade.passive.penetration,undefined);
});
test('four charges cap, burst costs no MP, forecast is isolated, failure spends nothing',()=>{
 const {b,a,e}=fixture();for(let i=0;i<5;i++)cast(b,a,'nikita.dagger',e.id);assert.equal(a.resourceValues.shadow_wind,4);const mp=a.mp;
 b.queue=[a.id,e.id];b.cursor=0;const preview=forecastBattleAction(b,{actorId:a.id,abilityId:'nikita.execution',targetId:e.id});assert.equal(preview.actors.find(x=>x.id===a.id).resourceValues.shadow_wind,0);assert.equal(a.resourceValues.shadow_wind,4);
 cast(b,a,'nikita.execution',e.id);assert.equal(a.mp,mp);assert.equal(a.resourceValues.shadow_wind,0);assert.equal(a.cooldowns['nikita.execution'],4);
 a.cooldowns['nikita.execution']=0;a.resourceValues.shadow_wind=3;b.queue=[a.id,e.id];b.cursor=0;assert.throws(()=>executeAction(b,{actorId:a.id,abilityId:'nikita.execution',targetId:e.id}));assert.equal(a.resourceValues.shadow_wind,3);assert.equal(a.mp,mp);
});
test('veil buffs after damage and remains available at expiry; Extra does not tick it, main stun does',()=>{
 const {b,a,e}=fixture();
 function step(){const x=activeActor(b);if(x.team==='enemy')executeEnemyTurn(b);else executeAction(b,{actorId:x.id,abilityId:'$defend',targetId:x.id});}
 function seek(phase='main'){let n=0;while((activeActor(b)?.id!==a.id||b.phase!==phase)&&n++<200)step();assert.ok(n<200);}
 seek();executeAction(b,{actorId:a.id,abilityId:'nikita.veil',targetId:e.id});assert.equal(a.resourceValues.shadow_wind,1);assert.equal(a.statuses.find(s=>s.id==='nikita_veil').remaining,3);
 b.extraTurnGrants.add(a.id);b.extraPhaseRequired=true;seek('extra');step();assert.equal(a.statuses.find(s=>s.id==='nikita_veil').remaining,3);
 for(let i=0;i<3;i++){seek();step();}seek();assert.ok(!a.statuses.some(s=>s.id==='nikita_veil'));assert.equal(a.cooldowns['nikita.veil'],0);
 executeAction(b,{actorId:a.id,abilityId:'nikita.veil',targetId:e.id});a.statuses.push({id:'stunned',remaining:1,stacks:1});const before=a.statuses.find(s=>s.id==='nikita_veil').remaining;let n=0;while(a.statuses.some(s=>s.id==='stunned')&&n++<100)step();assert.equal(a.statuses.find(s=>s.id==='nikita_veil').remaining,before-1);
});
test('rank improves both damage and MAG buff while burst has no mastery; enemy mirror consumes its own charges',()=>{
 const s=save();s.characters.nikita.level=50;const a=c.characters.nikita;
 const ranked=resolveRankedAbility(c,a,c.abilities['nikita.execution'],5);assert.ok(ranked.effects[0].rankDamageFactor>1);
 const b=createArenaBattle(c,s,'mirror',456),enemy=b.actors.find(x=>x.team==='enemy'&&x.definitionId==='nikita'),player=b.actors.find(x=>x.team==='party'&&x.definitionId==='nikita');for(const x of b.actors)x.hp=x.stats.maxHp=100000;
 enemy.resourceValues.shadow_wind=4;player.resourceValues.shadow_wind=2;cast(b,enemy,'nikita.execution',player.id);assert.equal(enemy.resourceValues.shadow_wind,0);assert.equal(player.resourceValues.shadow_wind,2);assert.ok(hit(b,enemy).pvpDamage);
});


