import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave,changePresetSlot,selectPreset} from '../src/core/game-save.js';
import {enterFortress,moveFortress,leaveFortress,beginFortressEvent,actFortressEvent,performFortressService,fortressToken} from '../src/core/fortress.js';
import {createChronicleBattle,checkpointChronicleBattle,finishChronicleBattle} from '../src/core/chronicle-combat.js';
import {assertFortressLoadoutUnchanged,appendFortressLog} from '../src/core/fortress-session.js';
import {equipGear,unequipGear} from '../src/core/equipment.js';
import {equipExclusive,unequipExclusive} from '../src/core/blacksmith.js';
import {createBattle} from '../src/core/battle.js';
import {fortressText} from '../src/ui/fortress-display.js';
import {normalizeSettings} from '../src/ui/preferences.js';
const content=await loadContent(),token=fortressToken;
function fixture(){let c=createGameSave(content);c.chronicles.firstClearIds=content.chronicles.book1.locations.map(l=>l.introId);c=enterFortress(c,content,{random:()=>0});c.chronicles.books.book2.firstClearIds=content.chronicles.book2.locations.map(l=>l.introId);return c;}
const move=(c,id)=>moveFortress(c,content,{token:token(c),locationId:id});
function begin(c,id){const e=content.chronicleEvents[id];c=move(c,e.locationId);c=beginFortressEvent(c,content,{token:token(c)});const p=c.chronicles.activeSession.activeEvent;Object.assign(p,{eventId:id,originLocation:e.locationId,stepId:e.steps[0].id,battleStepId:e.steps.find(s=>s.battle)?.id??null});return c;}
function act(c,id){const p=c.chronicles.activeSession.activeEvent;return actFortressEvent(c,content,{token:token(c),instanceId:p.instanceId,stepId:p.stepId,actionId:id});}
function battle(c){const p=c.chronicles.activeSession.activeEvent;return createChronicleBattle(content,c,'book2',p.instanceId);}
function rest(c){return performFortressService(c,content,{token:token(c),serviceId:'infirmary_rest'});}
function completed(c){while(c.chronicles.activeSession.activeEvent){const p=c.chronicles.activeSession.activeEvent,e=content.chronicleEvents[p.eventId],step=e.steps.find(s=>s.id===p.stepId);c=act(c,step.actions[0].id);}return c;}
test('HP and MP persist between different combat events; dead allies stay down, transient combat state resets',()=>{
 let c=begin(fixture(),'book2.a03');c=act(c,'s0-act');let b=battle(c);for(const a of b.actors.filter(a=>a.team==='party')){a.hp=a.id==='garrek'?0:27;a.mp=3;a.shield=91;a.cooldowns.example=8;a.statuses=[{id:'guard',remaining:2}];}
 b.outcome='victory';c=finishChronicleBattle(c,content,b);c=completed(c);c=decodeGameSave(encodeGameSave(c,content),content);c=begin(c,'book2.i03');c=act(c,'s0-act');b=battle(c);
 for(const a of b.actors.filter(a=>a.team==='party')){assert.equal(a.hp,a.id==='garrek'?0:27);assert.equal(a.mp,3);assert.equal(a.shield,0);assert.deepEqual(a.cooldowns,{});assert.deepEqual(a.statuses,[]);}
 assert.ok(!b.queue.includes('garrek'));
});
test('retreat/retry cannot refresh HP/MP, party wipe requires rest or exit, infirmary revives once per session',()=>{
 let c=begin(fixture(),'book2.a03');c=act(c,'s0-act');let b=battle(c);b.actors.filter(a=>a.team==='party').forEach(a=>{a.hp=21;a.mp=2;});b.outcome='defeat';c=checkpointChronicleBattle(c,content,b);c=decodeGameSave(encodeGameSave(c,content),content);b=battle(c);assert.equal(b.actors.find(a=>a.id==='arthur').hp,21);assert.equal(b.actors.find(a=>a.id==='arthur').mp,2);
 b.actors.filter(a=>a.team==='party').forEach(a=>a.hp=0);b.outcome='defeat';c=checkpointChronicleBattle(c,content,b);assert.throws(()=>battle(c),/quân y/);c=move(c,'f');const stale=token(c);c=rest(c);assert.equal(c.chronicles.activeSession.restUsed,true);assert.throws(()=>rest(c));assert.throws(()=>performFortressService(c,content,{token:stale,serviceId:'infirmary_rest'}));c=decodeGameSave(encodeGameSave(c,content),content);assert.throws(()=>rest(c));c=move(c,'a');b=battle(c);for(const a of b.actors.filter(a=>a.team==='party')){assert.equal(a.hp,a.stats.maxHp);assert.equal(a.mp,a.stats.maxMp);}
 assert.equal(c.chronicles.books.book2.activityLog.filter(e=>e.kind==='rest').length,1);
});
test('rest is forbidden in other areas or while battle is active; failures leave party resources unchanged',()=>{
 let c=fixture(),before=structuredClone(c);assert.throws(()=>rest(c));assert.deepEqual(c,before);c=begin(c,'book2.a03');c=act(c,'s0-act');c=checkpointChronicleBattle(c,content,battle(c));before=structuredClone(c);assert.throws(()=>move(c,'f'));assert.throws(()=>rest(c));assert.deepEqual(c,before);
});
test('legacy active sessions derive resource cache from the exact battle snapshot instead of healing on migration',()=>{
 let c=begin(fixture(),'book2.a03');c=act(c,'s0-act');const b=battle(c);b.actors.find(a=>a.id==='arthur').hp=19;b.actors.find(a=>a.id==='arthur').mp=1;c=checkpointChronicleBattle(c,content,b);const raw=JSON.parse(encodeGameSave(c,content));for(const key of ['partyIds','partyVitals','restUsed'])delete raw.chronicles.activeSession[key];delete raw.chronicles.books.book2.activityLog;const n=decodeGameSave(JSON.stringify(raw),content);assert.equal(n.chronicles.activeSession.partyVitals.arthur.hp,19);assert.equal(n.chronicles.activeSession.partyVitals.arthur.mp,1);assert.equal(n.chronicles.activeSession.restUsed,false);assert.deepEqual(n.party,c.party);
});
test('only ending the old session unlocks loadout changes and starts a new session with a new rest allowance',()=>{
 let c=fixture();c=move(c,'f');c.chronicles.activeSession.partyVitals.arthur.hp=1;c=rest(c);c=move(c,'a');c=leaveFortress(c,content,{token:token(c),confirmed:true});const id=c.chronicles.nextSessionId;c=changePresetSlot(c,0,'takeshi');c=enterFortress(c,content,{random:()=>0});assert.equal(c.chronicles.activeSession.sessionId,'fortress-'+id);assert.equal(c.chronicles.activeSession.restUsed,false);assert.ok(c.chronicles.activeSession.partyVitals.takeshi);assert.ok(!c.chronicles.activeSession.partyVitals.arthur);
});
test('party/equipment/exclusive APIs and transaction guard reject changes during a session',()=>{
 const c=fixture();assert.throws(()=>changePresetSlot(c,0,'takeshi'));assert.throws(()=>selectPreset(c,c.partyPresets[1].id));assert.throws(()=>equipGear(c,content,'arthur','absent'));assert.throws(()=>unequipGear(c,content,'arthur'));assert.throws(()=>equipExclusive(c,content,'arthur','absent'));assert.throws(()=>unequipExclusive(c,content,'arthur'));const changed=structuredClone(c);changed.characters.arthur.allocations.attack=1;assert.throws(()=>assertFortressLoadoutUnchanged(c,changed,content));assert.doesNotThrow(()=>assertFortressLoadoutUnchanged(c,{...c,coins:c.coins+1},content));assert.throws(()=>createBattle(content,c,'forest_patrol'));
});
test('resource/save validation rejects invalid values and partial migrations; a used rest stays used',()=>{
 const c=fixture();c.chronicles.activeSession.restUsed=true;assert.equal(decodeGameSave(encodeGameSave(c,content),content).chronicles.activeSession.restUsed,true);for(const value of [-1,NaN,Infinity,999999]){const n=structuredClone(c);n.chronicles.activeSession.partyVitals.arthur.hp=value;assert.throws(()=>encodeGameSave(n,content));}const raw=JSON.parse(encodeGameSave(c,content));delete raw.chronicles.activeSession.partyIds;assert.throws(()=>decodeGameSave(JSON.stringify(raw),content));
});
test('activity history is bounded, attributed to the correct room, saved once, and settings control only visibility',()=>{
 let c=fixture();for(let i=0;i<220;i++){c.chronicles.activeSession.actionRevision++;appendFortressLog(c,'Công việc '+i);}assert.equal(c.chronicles.books.book2.activityLog.length,200);appendFortressLog(c,'No duplicate');assert.equal(c.chronicles.books.book2.activityLog.length,200);c=move(c,'e');c.chronicles.activeSession.actionRevision++;appendFortressLog(c,'Roland xác nhận.');const saved=decodeGameSave(encodeGameSave(c,content),content);assert.equal(saved.chronicles.books.book2.activityLog.at(-1).locationId,'e');assert.equal(normalizeSettings({chronicleLogs:false}).chronicleLogs,false);assert.equal(normalizeSettings({}).chronicleLogs,true);
});
test('Vietnamese presentation never exposes engine item IDs, including legacy saved notes',()=>{
 const itemIds=Object.keys(content.chronicles.book2.items);for(const e of Object.values(content.chronicleEvents).filter(e=>e.bookId==='book2'))for(const s of e.steps){for(const value of [s.narration,...(s.actions??[]).map(a=>a.label)])for(const id of itemIds)assert.ok(!value.includes(id),e.id+' leaked '+id);}
 assert.equal(fortressText(content,'Đối chiếu shift_order_signed'),'Đối chiếu Lệnh đổi phiên gác có xác nhận');
});
