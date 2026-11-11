import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave} from '../src/core/game-save.js';
import {createBattle,activeActor,executeAction,executeEnemyTurn} from '../src/core/battle.js';
import {trialUpcomingWarning} from '../src/core/trial-warnings.js';
import {existsSync} from 'node:fs';
const content=await loadContent();
function fixture(id){const b=createBattle(content,createGameSave(content),id,()=>.99,{enemyLevel:60});for(const a of b.actors){a.hp=a.stats.maxHp=10000000;a.mp=a.stats.maxMp=10000;a.stats.attack=10;a.stats.magic=10;}return b;}
function toRound(b,n){let guard=0;while(b.round<n&&!b.outcome&&guard++<1000){const a=activeActor(b);if(a.team==='enemy')executeEnemyTurn(b);else executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});}assert.equal(b.round,n);}
test('all four authored music groups point to available assets',()=>{for(const id of ['song_menu','song_chimera','song_ego','song_calamity']){assert.equal(content.music[id].loop,true);assert.ok(existsSync('public'+content.music[id].tracks[0]));}});
test('Ego warns before adaptation and announces the actual new weakness after end-round execution',()=>{
 const b=fixture('song_ego');toRound(b,5);assert.ok(b.trial.alerts.some(a=>a.kind==='warning'&&a.round===5&&/Thích nghi/.test(a.title)));assert.match(trialUpcomingWarning(b),/cuối vòng 5/);
 toRound(b,6);assert.ok(b.trial.alerts.some(a=>a.kind==='active'&&a.round===5&&/hoàn tất/.test(a.title)));assert.match(trialUpcomingWarning(b),/cuối vòng 10/);
});
test('Calamity warns for the next reverse round and announces entry through actual round progression',()=>{
 const b=fixture('song_calamity');toRound(b,5);assert.ok(b.trial.alerts.some(a=>a.kind==='warning'&&a.round===4&&/sắp bắt đầu/.test(a.title)));assert.ok(b.trial.alerts.some(a=>a.kind==='active'&&a.round===5&&/đang hiệu lực/.test(a.title)));assert.ok(b.trial.alerts.length<=12);
});
test('Chimera marks the countdown immediately, warns on final round and announces revival',()=>{
 const b=fixture('song_chimera'),a=b.actors.find(a=>a.team==='party'),head=b.actors.find(a=>a.team==='enemy');head.hp=1;a.stats.attack=500;b.queue=[a.id,...b.actors.filter(x=>x.id!==a.id).map(x=>x.id)];b.cursor=0;
 executeAction(b,{actorId:a.id,abilityId:'$attack',targetId:head.id});assert.match(trialUpcomingWarning(b),/cuối vòng 3/);assert.ok(b.trial.alerts.some(a=>/Một đầu/.test(a.title)));
 toRound(b,3);assert.ok(b.trial.alerts.some(a=>a.kind==='warning'&&/Cơ hội cuối/.test(a.title)));toRound(b,4);assert.ok(b.trial.alerts.some(a=>a.kind==='active'&&/hồi sinh/.test(a.title)));
});
