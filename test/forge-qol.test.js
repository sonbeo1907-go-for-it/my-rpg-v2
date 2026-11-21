import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {craftGear,beginGearReforge,finishGearReforge,gearReforgeQuote,advancedReforgeUnlocked} from '../src/core/gear-forge.js';
import {dismantleGear,dismantleQuote} from '../src/core/blacksmith.js';
import {equipGear} from '../src/core/equipment.js';
import {validateContent} from '../src/core/content.js';
const content=await loadContent();
function base(unlocked=true){let c=createGameSave(content);Object.assign(c,{coins:100000,prismaFragments:10000});c.gear=Array.from({length:30},(_,i)=>({id:'gear_'+(i+1),typeId:i%2?'t3_dual':'t3_focused',stats:i%2?{attack:2,magic:2}:{attack:5}}));c.gacha.totalPulls=30;c=craftGear(c,content,{materialId:'gear_30',primaryStat:'attack'},()=>2/7);if(unlocked)c.claimedFirstClearRewards.push('east_ke_08');return c;}
const options=(c,count,targetStat='magic')=>({targetStat,materialIds:c.gear.filter(g=>g.typeId.startsWith('t3')).slice(0,count).map(g=>g.id)});

test('advanced reforge is retroactively gated by the persisted Orochi first clear, not visibility or party',()=>{
 const locked=base(false),raw=JSON.stringify(locked);assert.equal(advancedReforgeUnlocked(locked,content),false);assert.throws(()=>beginGearReforge(locked,content,'rune_1',()=>0,options(locked,20)),/Yamata/);assert.equal(JSON.stringify(locked),raw);
 const c=base();assert.equal(advancedReforgeUnlocked(c,content),true);assert.ok(gearReforgeQuote(c,content,'rune_1',options(c,20)));
});
test('advanced probability rises above the base 1/7 toward 100%; a miss cannot return the target again',()=>{
 const c=base(),o=options(c,1);assert.equal(gearReforgeQuote(c,content,'rune_1',o).advanced.chance,26/140);
 assert.equal(beginGearReforge(c,content,'rune_1',()=>26/140-.000001,o).pendingGearReforge.nextSecondaryStat,'magic');
 for(const n of [26/140,.2,.5,.7,.999999])assert.notEqual(beginGearReforge(c,content,'rune_1',()=>n,o).pendingGearReforge.nextSecondaryStat,'magic');
});
test('20 T3 guarantee a chosen line, pay and consume once, keep main/old item until decision, and round trip pending metadata',()=>{
 const c=base(),raw=JSON.stringify(c),o=options(c,20),n=beginGearReforge(c,content,'rune_1',()=>.999999,o);assert.equal(JSON.stringify(c),raw);assert.equal(n.coins,c.coins-2500);assert.equal(n.prismaFragments,c.prismaFragments-450);assert.equal(n.gear.length,c.gear.length-20);assert.ok(o.materialIds.every(id=>!n.gear.some(g=>g.id===id)));assert.equal(n.pendingGearReforge.nextSecondaryStat,'magic');assert.deepEqual(n.gear.at(-1),c.gear.at(-1));
 const restored=decodeGameSave(encodeGameSave(n,content),content);assert.deepEqual(restored.pendingGearReforge,n.pendingGearReforge);assert.deepEqual(restored.pendingGearReforge.advanced,{targetStat:'magic',materialCount:20});assert.throws(()=>beginGearReforge(restored,content,'rune_1'));
 const keep=finishGearReforge(restored,content,n.pendingGearReforge.id,false);assert.deepEqual(keep.gear.at(-1),c.gear.at(-1));assert.equal(keep.gear.length,n.gear.length);assert.equal(keep.coins,n.coins);
 const accept=finishGearReforge(restored,content,n.pendingGearReforge.id,true);assert.deepEqual(accept.gear.at(-1).stats,{attack:5,magic:3});assert.equal(accept.pendingGearReforge,null);assert.throws(()=>finishGearReforge(accept,content,n.pendingGearReforge.id,true));
});
test('selected substat may equal main or current, including scaled HP/MP values',()=>{
 const c=base();for(const [key,stats]of [['attack',{attack:8}],['maxHp',{attack:5,maxHp:15}],['maxMp',{attack:5,maxMp:6}]]){const n=beginGearReforge(c,content,'rune_1',()=>0,options(c,20,key));assert.deepEqual(finishGearReforge(n,content,n.pendingGearReforge.id,true).gear.at(-1).stats,stats);}
});
test('advanced material and currency errors leave all input state intact',()=>{
 const c=base(),raw=JSON.stringify(c),o=options(c,20);
 for(const bad of [{...o,targetStat:'secret'},{...o,materialIds:[]},{...o,materialIds:[o.materialIds[0],o.materialIds[0]]},{...o,materialIds:['rune_1']},options(c,21),{...o,materialIds:['missing']}])assert.throws(()=>beginGearReforge(c,content,'rune_1',()=>0,bad));
 assert.throws(()=>beginGearReforge(equipGear(c,content,'arthur',o.materialIds[0]),content,'rune_1',()=>0,o));
 for(const n of [-1,1,NaN])assert.throws(()=>beginGearReforge(c,content,'rune_1',()=>n,o));
 for(const state of [{...c,coins:2499},{...c,prismaFragments:449}])assert.throws(()=>beginGearReforge(state,content,'rune_1',()=>0,o));assert.equal(JSON.stringify(c),raw);
});
test('consumed T3 gacha receipts cannot resurrect and tampered guaranteed pending outcomes are rejected',()=>{
 const c=base(),g=c.gear[0];c.gacha.lastSummon={bannerId:'standard',results:[{kind:'gear',gear:g}],count:1};
 // Same receipt update contract as forging; validate pending metadata independently below.
 const n=beginGearReforge(c,content,'rune_1',()=>0,options(c,20));assert.equal(n.gacha.lastSummon.results[0].dismantled,true);
 const valid=beginGearReforge(base(),content,'rune_1',()=>0,options(base(),20));const p=JSON.parse(encodeGameSave(valid,content));p.pendingGearReforge.nextSecondaryStat='speed';assert.throws(()=>decodeGameSave(JSON.stringify(p),content));
});
test('999 item dismantle is atomic and validates all members, including an equipped last item',()=>{
 const c=createGameSave(content);c.gear=Array.from({length:1000},(_,i)=>({id:'gear_'+(i+1),typeId:'t1',stats:{attack:1}}));c.gacha.totalPulls=1000;const ids=c.gear.map(g=>g.id),raw=JSON.stringify(c);assert.equal(dismantleQuote(c,content,ids.slice(0,999)).fragments,4995);const n=dismantleGear(c,content,ids.slice(0,999));assert.equal(n.gear.length,1);assert.equal(n.prismaFragments,4995);assert.deepEqual(decodeGameSave(encodeGameSave(n,content),content),n);assert.equal(JSON.stringify(c),raw);
 assert.throws(()=>dismantleGear(c,content,ids),/999/);assert.throws(()=>dismantleGear(c,content,[ids[0],ids[0]]));const equipped=equipGear(c,content,'arthur',ids[998]);assert.throws(()=>dismantleGear(equipped,content,ids.slice(0,999)));assert.equal(equipped.gear.length,1000);
});
test('content rejects unsafe advanced reforge rules and dismantle limits',()=>{
 assert.deepEqual(validateContent(content),[]);for(const change of [c=>c.blacksmith.default.maxDismantle=1000,c=>c.blacksmith.default.advancedSecondaryReforge.maxMaterials=0,c=>c.blacksmith.default.advancedSecondaryReforge.requiresFirstClear='not-a-quest']){const c=structuredClone(content);change(c);assert.ok(validateContent(c).length);}
});
