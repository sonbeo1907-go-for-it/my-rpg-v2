import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,forecastBattleAction,activeActor,executeEnemyTurn} from '../src/core/battle.js';
import {battleStat} from '../src/core/stat-values.js';
import {claimBattleReward} from '../src/core/economy.js';
import {exclusiveCraftUnlocked} from '../src/core/blacksmith-rules.js';
import {grantTrialMilestones} from '../src/core/unrecorded-rewards.js';
import {validateContent} from '../src/core/content.js';
import {createArenaBattle} from '../src/core/arena.js';
const content=await loadContent();
function fixture(){const save=createGameSave(content);save.unlockedCharacterIds.push('remulia','wilson');save.party=['remulia','wilson','iris','elaine'];const b=createBattle(content,save,'forest_patrol',()=>.99);for(const a of b.actors.filter(a=>a.team==='enemy')){a.hp=a.stats.maxHp=100000;a.shield=0;}return {b,save,r:b.actors.find(a=>a.id==='remulia'),enemies:b.actors.filter(a=>a.team==='enemy')};}
function cast(b,actor,id,target){b.queue=[actor.id,...b.actors.filter(a=>a.id!==actor.id&&a.hp>0).map(a=>a.id)];b.cursor=0;executeAction(b,{actorId:actor.id,abilityId:id,targetId:target??actor.id});}
function exposed(a,element){a.statuses.push({id:'exposure_'+element,stacks:3,remaining:undefined,sourceId:'wilson'});}

test('Remulia data validates, release 104, free reward does not enter any gacha pool',()=>{
 assert.deepEqual(validateContent(content),[]);assert.equal(content.characters.remulia.releaseId,104);assert.equal(content.characters.remulia.resources.unrecorded_song.max,10);
 for(const banner of Object.values(content.banners))assert.ok(!banner.characterPool.includes('remulia'));
});
test('AoE converts each target separately, consumes one exposure per cast and gives only two passive stacks',()=>{
 const {b,r,enemies}=fixture();exposed(enemies[0],'fire');exposed(enemies[1],'water');
 cast(b,r,'remulia.echo',enemies[0].id);
 const hits=b.events.filter(e=>e.type==='damage'&&e.sourceId===r.id);
 assert.equal(hits.find(e=>e.targetId===enemies[0].id).element,'fire');assert.equal(hits.find(e=>e.targetId===enemies[1].id).element,'water');assert.equal(hits.find(e=>e.targetId===enemies[2].id).element,'plain');
 assert.equal(r.resourceValues.unrecorded_song,3);for(const a of enemies.slice(0,2))assert.equal(a.statuses.find(s=>s.id.startsWith('exposure_')).stacks,2);
});
test('basic attacks keep Plain and no passive song gain; forecast cannot mutate live resources or exposures',()=>{
 const {b,r,enemies}=fixture();exposed(enemies[0],'fire');b.queue=[r.id,...b.actors.filter(a=>a.id!==r.id).map(a=>a.id)];b.cursor=0;
 const before=JSON.stringify({r,enemies});const forecast=forecastBattleAction(b,{actorId:r.id,abilityId:'remulia.echo',targetId:enemies[0].id});assert.equal(forecast.actors.find(a=>a.id===r.id).resourceValues.unrecorded_song,3);assert.equal(JSON.stringify({r,enemies}),before);
 cast(b,r,'$attack',enemies[0].id);assert.equal(r.resourceValues.unrecorded_song,0);assert.equal(enemies[0].statuses.find(s=>s.id==='exposure_fire').stacks,3);
});
test('ten-song finisher fully restores living team, cleanses, resets only owned active cooldowns and does not revive',()=>{
 const {b,r,enemies}=fixture(),allies=b.actors.filter(a=>a.team===r.team),dead=allies.at(-1);dead.hp=0;
 r.resourceValues.unrecorded_song=10;
 for(const a of allies.slice(0,-1)){a.hp=12;a.mp=30;a.statuses.push({id:'deep_wound',remaining:2,stacks:1,sourceId:enemies[0].id});a.cooldowns[a.abilities.find(id=>content.abilities[id].cooldown>0)]=8;a.cooldowns['$gear_timer']=4;}
 cast(b,r,'remulia.coda',enemies[0].id);
 for(const a of allies.slice(0,-1)){assert.equal(a.hp,a.stats.maxHp);assert.equal(a.mp,a.stats.maxMp);assert.ok(!a.statuses.some(s=>s.id==='deep_wound'));for(const id of a.abilities)if(content.abilities[id].cooldown>0)assert.equal(a.cooldowns[id]??0,0);assert.equal(a.cooldowns['$gear_timer'],4);}
 assert.equal(dead.hp,0);assert.equal(r.resourceValues.unrecorded_song,0);
});
test('nine starting stacks cannot fund restoration; passive gained after an empowered finisher belongs to next cast',()=>{
 const {b,r,enemies}=fixture();r.resourceValues.unrecorded_song=9;r.hp=10;exposed(enemies[0],'fire');cast(b,r,'remulia.coda',enemies[0].id);assert.equal(r.hp,10);assert.equal(r.resourceValues.unrecorded_song,10);
 r.cooldowns['remulia.coda']=0;r.mp=100;cast(b,r,'remulia.coda',enemies[0].id);assert.equal(r.hp,r.stats.maxHp);assert.equal(r.resourceValues.unrecorded_song,2);
});
test('relic rewards successful direct ally exposure once per AoE cast, not self, basic or blocked application',()=>{
 const {b,r,enemies}=fixture(),w=b.actors.find(a=>a.id==='wilson');r.exclusiveGear={template:content.exclusiveGear['remulia.lost_tuning_fork']};
 cast(b,w,'wilson.petals',enemies[0].id);assert.equal(r.statuses.find(s=>s.id==='remulia_resonance').stacks,1);
 w.mp=100;w.cooldowns['wilson.petals']=0;cast(b,w,'wilson.petals',enemies[0].id);assert.equal(r.statuses.find(s=>s.id==='remulia_resonance').stacks,2);
 assert.equal(battleStat(content,r,'magic'),r.stats.magic*1.2);
 // Use the real ward definition, not a synthetic unregistered status.
 const ward=Object.values(content.statuses).find(s=>s.effectImmunity);for(const a of enemies)a.statuses=[{id:ward.id,charges:1,remaining:2,sourceId:a.id}];
 w.mp=100;w.cooldowns['wilson.petals']=0;cast(b,w,'wilson.petals',enemies[0].id);assert.equal(r.statuses.find(s=>s.id==='remulia_resonance').stacks,2);
});
test('trial milestones grant retrospectively, including zero-point clears, and never duplicate slots on reload',()=>{
 const save=createGameSave(content);save.unrecordedLedger.best={song_chimera:22,song_ego:12};grantTrialMilestones(save,content);assert.ok(!save.unlockedCharacterIds.includes('remulia'));assert.ok(exclusiveCraftUnlocked(save,content.exclusiveGear['remulia.lost_tuning_fork']));
 save.unrecordedLedger.best.song_calamity=0;
 let restored=decodeGameSave(encodeGameSave(save,content),content);assert.ok(restored.unlockedCharacterIds.includes('remulia'));assert.equal(restored.extraGearSlots.remulia,2);
 restored=decodeGameSave(encodeGameSave(restored,content),content);assert.equal(restored.extraGearSlots.remulia,2);restored.unrecordedLedger.best.song_calamity=12;grantTrialMilestones(restored,content);assert.equal(restored.extraGearSlots.remulia,3);
});
test('milestones commit with rewards; rejected persistence never mutates the saved campaign',()=>{
 const save=createGameSave(content);save.unrecordedLedger.best={song_chimera:12,song_ego:12};const b=createBattle(content,save,'song_calamity',()=>.99,{enemyLevel:60,trial:{level:60}});b.outcome='victory';
 const before=JSON.stringify(save);assert.throws(()=>claimBattleReward(save,b,content,()=>{throw Error('disk');}));assert.equal(JSON.stringify(save),before);assert.ok(!b.rewardClaimed);
 const next=claimBattleReward(save,b,content);assert.ok(next.unlockedCharacterIds.includes('remulia'));assert.equal(next.extraGearSlots.remulia,2);assert.ok(b.firstClearRewards.some(r=>r.characterId==='remulia'));
});
test('mirror opponents keep independent song resources, target conversion and restoration use caster-relative allies',()=>{
 const {save}=fixture(),b=createArenaBattle(content,save,'mirror',194),r=b.actors.find(a=>a.team==='enemy'&&a.definitionId==='remulia'),player=b.actors.find(a=>a.team==='party'&&a.definitionId==='remulia');
 for(const a of b.actors){a.hp=a.stats.maxHp=10000;a.mp=100;}
 player.hp=10;player.resourceValues.unrecorded_song=7;r.hp=10;r.resourceValues.unrecorded_song=10;exposed(player,'water');
 cast(b,r,'remulia.coda',player.id);assert.equal(r.hp,r.stats.maxHp);assert.equal(player.resourceValues.unrecorded_song,7);assert.equal(r.resourceValues.unrecorded_song,2);assert.ok(player.hp<10000);
 assert.equal(b.events.find(e=>e.type==='damage'&&e.sourceId===r.id&&e.targetId===player.id).element,'water');
});
test('stun skips the cast without resource gain or MP spend; Extra Turns use the same single-cast award',()=>{
 const {b,r,enemies}=fixture();exposed(enemies[0],'fire');r.statuses.push({id:'stunned',remaining:1,stacks:1,sourceId:enemies[0].id});
 const before=r.mp;b.queue=[r.id,...b.actors.filter(a=>a.id!==r.id).map(a=>a.id)];b.cursor=0;
 // A real skipped turn is processed by beginTurn as normal engine progression.
 const first=b.actors.find(a=>a.team==='party'&&a.id!==r.id);b.queue=[first.id,r.id,...b.actors.filter(a=>a.id!==first.id&&a.id!==r.id).map(a=>a.id)];b.cursor=0;
 executeAction(b,{actorId:first.id,abilityId:'$defend',targetId:first.id});assert.notEqual(activeActor(b)?.id,r.id);assert.equal(r.mp,before);assert.equal(r.resourceValues.unrecorded_song,0);
 b.phase='extra';r.statuses=[];cast(b,r,'remulia.echo',enemies[0].id);assert.equal(r.resourceValues.unrecorded_song,3);
});
test('failed skill validation never consumes or awards songs',()=>{
 const {b,r,enemies}=fixture();r.mp=0;r.resourceValues.unrecorded_song=10;exposed(enemies[0],'earth');b.queue=[r.id];b.cursor=0;
 assert.throws(()=>executeAction(b,{actorId:r.id,abilityId:'remulia.coda',targetId:enemies[0].id}));assert.equal(r.resourceValues.unrecorded_song,10);assert.equal(enemies[0].statuses[0].stacks,3);
});
