import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave,GAME_SAVE_VERSION} from '../src/core/game-save.js';
import {createProfileStore} from '../src/runtime/profile-store.js';
import {gearCatalog} from '../src/core/catalog.js';
import {createBattle} from '../src/core/battle.js';
import {claimBattleReward} from '../src/core/economy.js';
const content=await loadContent();
function history(){const c=createGameSave(content);c.coins=12345;c.illusion.sequence=7;c.illusion.tutorial={completedMapIds:['hunter_guild_training'],completedAt:{hunter_guild_training:'2026-10-29T15:10:00.000Z'}};c.illusion.globalFlags=['remembered.story'];return c;}
test('v6 remains the current format and preserves legacy exploration history and presets after save',()=>{
 const c=history();assert.equal(GAME_SAVE_VERSION,6);const text=encodeGameSave(c,content);const restored=decodeGameSave(text,content);assert.equal(restored.coins,12345);assert.deepEqual(restored.illusion,c.illusion);assert.deepEqual(restored.partyPresets,c.partyPresets);assert.equal(JSON.parse(encodeGameSave(restored,content)).version,6);
});
test('v4 and v5 migrate forward without losing currencies, gear or preset names',()=>{
 for(const version of [4,5]){const old=JSON.parse(encodeGameSave(history(),content));old.version=version;delete old.illusion;old.partyPresets[0].name='Đội cũ';const c=decodeGameSave(JSON.stringify(old),content);assert.equal(c.coins,12345);assert.equal(c.partyPresets[0].name,'Đội cũ');assert.equal(c.illusion.version,1);assert.equal(JSON.parse(encodeGameSave(c,content)).version,6);}
});
test('malformed v6 archives and unknown future versions remain rejected rather than silently downgraded',()=>{
 for(const mutate of [c=>delete c.illusion,c=>c.illusion.version=2,c=>c.illusion.sequence=-1,c=>c.version=7]){const c=JSON.parse(encodeGameSave(history(),content));mutate(c);assert.throws(()=>decodeGameSave(JSON.stringify(c),content));}
});
test('old loot gear keeps independent serials, equipment and chronological sorting without changing pity',()=>{
 const c=history();c.gacha.totalPulls=1;c.illusion.gearSerial=10;c.gear=[{id:'gear_1',typeId:'t1',stats:{attack:1}},{id:'loot_10',typeId:'t2',stats:{magic:3}},{id:'loot_2',typeId:'t1',stats:{defense:1}}];c.equipment.arthur=['loot_10'];
 const r=decodeGameSave(encodeGameSave(c,content),content);assert.deepEqual(r.gear,c.gear);assert.deepEqual(r.equipment,c.equipment);assert.deepEqual(r.gacha,c.gacha);assert.deepEqual(gearCatalog(content,r,{sort:'received',direction:'asc'}).map(g=>g.id),['gear_1','loot_10','loot_2']);r.illusion.gearSerial=1;assert.throws(()=>encodeGameSave(r,content),/Gear/);
});
test('native profile loader accepts v6 and writes v6 with all archived history intact',async()=>{
 const initial=encodeGameSave(history(),content);let text=initial;let revision='r1';const entry=()=>({id:1,username:'Arthur',text,backup:null,revision,updatedAt:1});
 const nativeInvoke=async(command,args)=>{if(command==='save_directory')return 'test/saves';if(command==='list_profiles')return[entry()];if(command==='read_profile')return entry();if(command==='write_profile'){assert.equal(args.revision,revision);text=args.text;revision='r2';return entry();}throw Error(command);};
 const store=createProfileStore({content,storage:{getItem:()=>null},nativeInvoke});await store.initialize();assert.equal(store.entries[0].error,'');const profile=await store.load(1);profile.campaign.coins++;await store.save(1,profile.campaign);assert.equal(JSON.parse(text).version,6);assert.deepEqual(JSON.parse(text).illusion,JSON.parse(initial).illusion);
});
test('the old v5 browser key still migrates when the current key is v6',async()=>{
 const c=JSON.parse(encodeGameSave(history(),content));c.version=5;delete c.illusion;const data=new Map([['northern-prisma.campaign.v5',JSON.stringify(c)]]);const storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};
 const store=createProfileStore({content,storage});await store.initialize();assert.equal(store.entries.length,1);assert.equal(store.entries[0].campaign.coins,12345);assert.equal(JSON.parse(store.entries[0].text).version,6);assert.ok(data.has('northern-prisma.campaign.v5'));
});
test('claiming new Iris story rewards preserves old v6 history through a subsequent disk round trip',()=>{
 const c=history();const b=createBattle(content,c,'iris_story_growth');b.outcome='victory';const next=claimBattleReward(c,b,content);const restored=decodeGameSave(encodeGameSave(next,content),content);assert.deepEqual(restored.illusion,c.illusion);assert.equal(restored.extraGearSlots.iris,1);assert.ok(restored.claimedFirstClearRewards.includes('iris_story_growth'));
});
