import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,decodeGameSave,encodeGameSave} from '../src/core/game-save.js';
import {createBattle,activeActor,executeAction,executeEnemyTurn} from '../src/core/battle.js';
import {activeStatuses} from '../src/core/status-state.js';
import {captureExposures,resolveWeakness} from '../src/core/weakness.js';
import {grantTrialMilestones,trialMilestoneProgress} from '../src/core/unrecorded-rewards.js';
import {exclusiveCraftUnlocked} from '../src/core/blacksmith-rules.js';
import {trialPureReward} from '../src/core/unrecorded-trials.js';
const c=await loadContent();
function fixture(){const s=createGameSave(c);s.unlockedCharacterIds.push('remulia');s.party=['remulia','iris','elaine','garrek'];s.partyPresets[0].slots=[...s.party];const b=createBattle(c,s,'forest_patrol',()=>.99),r=b.actors.find(a=>a.id==='remulia');for(const a of b.actors){a.hp=a.stats.maxHp=100000;a.mp=a.stats.maxMp=10000;}return {b,r};}
function step(b){const a=activeActor(b);if(a.team==='enemy')executeEnemyTurn(b);else executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});}
function toRemulia(b,r,phase='main'){let n=0;while((activeActor(b)?.id!==r.id||b.phase!==phase)&&n++<200)step(b);assert.ok(n<200);}
function buff(b,r){executeAction(b,{actorId:r.id,abilityId:'remulia.prelude',targetId:r.id});}
const remaining=r=>r.statuses.find(s=>s.id==='weakness_exploitation')?.remaining;
function weakness(b,r){return resolveWeakness(c,r,b.actors.find(a=>a.team==='enemy'),{element:'plain',damageType:'magical'},{exposures:captureExposures(b)}).multiplier;}
test('Remulia actually receives x2 weakness, Extra Turn does not age it, four subsequent main turns expire it',()=>{
 const {b,r}=fixture();toRemulia(b,r);buff(b,r);assert.ok(activeStatuses(r).some(s=>s.id==='weakness_exploitation'));assert.equal(weakness(b,r),2);assert.equal(remaining(r),4);
 b.extraTurnGrants.add(r.id);b.extraPhaseRequired=true;toRemulia(b,r,'extra');step(b);assert.equal(remaining(r),4);assert.equal(weakness(b,r),2);
 for(let i=1;i<=4;i++){toRemulia(b,r);step(b);assert.equal(remaining(r),i<4?4-i:undefined);}
 assert.equal(weakness(b,r),1.5);assert.ok(!r.statuses.some(s=>s.id==='remulia_prelude'));
});
test('stunned main turn expires both timed buffs; rejected recast cannot refresh them',()=>{
 const {b,r}=fixture();toRemulia(b,r);buff(b,r);for(const s of r.statuses)if(['weakness_exploitation','remulia_prelude'].includes(s.id))s.remaining=1;
 r.mp=0;assert.throws(()=>executeAction(b,{actorId:r.id,abilityId:'remulia.prelude',targetId:r.id}));assert.equal(remaining(r),1);
 r.statuses.push({id:'stunned',remaining:1,stacks:1,sourceId:r.id});const until=b.round+2;let n=0;while(remaining(r)!==undefined&&b.round<=until&&n++<200)step(b);
 assert.equal(remaining(r),undefined);assert.ok(!r.statuses.some(s=>s.id==='remulia_prelude'));assert.equal(weakness(b,r),1.5);
});
test('ready recast refreshes to four main turns instead of stacking duration',()=>{
 const {b,r}=fixture();toRemulia(b,r);buff(b,r);for(let i=0;i<3;i++){toRemulia(b,r);step(b);}assert.equal(remaining(r),1);
 toRemulia(b,r);assert.equal(r.cooldowns['remulia.prelude'],0);buff(b,r);assert.equal(remaining(r),4);assert.equal(r.statuses.filter(s=>s.id==='weakness_exploitation').length,1);assert.equal(weakness(b,r),2);
});
test('milestones use 8 for each slot and 16 for recipe, while 22 still fills the 30 Pure daily quota',()=>{
 let s=createGameSave(c);s.unrecordedLedger.best={song_chimera:7,song_ego:0,song_calamity:0};grantTrialMilestones(s,c);assert.ok(s.unlockedCharacterIds.includes('remulia'));assert.equal(s.extraGearSlots.remulia??0,0);assert.equal(trialMilestoneProgress(s).recipe,false);
 s.unrecordedLedger.best.song_chimera=8;grantTrialMilestones(s,c);assert.equal(s.extraGearSlots.remulia,1);
 s.unrecordedLedger.best.song_ego=15;grantTrialMilestones(s,c);assert.equal(s.extraGearSlots.remulia,2);assert.equal(exclusiveCraftUnlocked(s,c.exclusiveGear['remulia.lost_tuning_fork']),false);
 s.unrecordedLedger.best.song_ego=16;grantTrialMilestones(s,c);assert.equal(exclusiveCraftUnlocked(s,c.exclusiveGear['remulia.lost_tuning_fork']),true);
 s.unrecordedLedger.best.song_calamity=8;grantTrialMilestones(s,c);assert.equal(s.extraGearSlots.remulia,3);s=decodeGameSave(encodeGameSave(s,c),c);assert.equal(s.extraGearSlots.remulia,3);assert.equal(trialPureReward(22),30);
});
