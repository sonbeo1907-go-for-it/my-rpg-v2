import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../scripts/load-content.mjs';
import { createGameSave,encodeGameSave,decodeGameSave,selectPreset,renamePreset } from '../src/core/game-save.js';
import { createCampaign,resolveCharacter } from '../src/core/progression.js';
import { createBattle } from '../src/core/battle.js';
import { effectiveStat } from '../src/core/combat-math.js';
import { equipGear } from '../src/core/equipment.js';
import { pullGacha } from '../src/core/economy.js';
import { validateContent } from '../src/core/content.js';
import { dismantleGear,dismantleQuote,craftExclusive,beginReforge,finishReforge,equipExclusive,unequipExclusive,rollExclusiveStat } from '../src/core/blacksmith.js';
import { FORGE_STATS,exclusiveRollRange } from '../src/core/blacksmith-rules.js';
const content=await loadContent();
function source(){
 const c=structuredClone(content);
 for(const[id,characterId,modifiers]of[['test-arthur','arthur',{attack:.2}],['test-arthur-two','arthur',{defense:.1}],['test-lisbeth','lisbeth',{magic:.1}]])c.exclusiveGear[id]={id,characterId,name:`Mẫu kiểm thử ${id}`,description:'Chỉ có trong bài kiểm thử.',enabled:true,passive:{type:'stat_boost',description:'Hiệu ứng kiểm thử.',modifiers}};
 assert.deepEqual(validateContent(c),[]);return c;
}
function funded(c=content){const save=createGameSave(c);Object.assign(save,{coins:50000,prismaFragments:10000,recruitmentShards:30,originalPrisma:20});return save;}
function gearSave(){const save=funded();save.gear=['t1','t2','t3_focused','t3_dual'].map((typeId,i)=>({id:`gear_${i+1}`,typeId,stats:typeId==='t3_dual'?{attack:2,magic:2}:{attack:typeId==='t1'?1:typeId==='t2'?3:5}}));save.gacha.totalPulls=4;return save;}
function rng(...values){return()=>values.shift()??0;}

test('shipping content contains 14 authored exclusive templates; removed illusion is absent',()=>{
 assert.equal(Object.keys(content.exclusiveGear).length,14);assert.equal(Object.hasOwn(content.dungeons,'illusion'),false);
 assert.deepEqual(Object.values(content.items).map(x=>x.field),['coins','prisma','recruitmentShards','originalPrisma','prismaFragments']);
});
test('v4 migrates to the current envelope without losing presets, ordinary gear, currencies, progression or daily quota',()=>{
 let original=selectPreset(gearSave(),'party-3');original=renamePreset(original,'Đội đã lưu');original.dungeonDaily={day:'2026-10-29',clears:{gold_mine:2}};
 const old=JSON.parse(encodeGameSave(original,content));old.version=4;
 for(const key of ['prismaFragments','originalPrisma','exclusiveGear','equippedExclusiveGear','pendingReforge','blacksmithRevision'])delete old[key];
 const restored=decodeGameSave(JSON.stringify(old),content);
 assert.equal(restored.prismaFragments,0);assert.equal(restored.originalPrisma,0);assert.deepEqual(restored.exclusiveGear,[]);assert.equal(restored.pendingReforge,null);
 for(const key of ['coins','prisma','recruitmentShards','gear','partyPresets','activePartyPresetId','dungeonDaily'])assert.deepEqual(restored[key],original[key]);
 assert.equal(JSON.parse(encodeGameSave(restored,content)).version,6);
});
test('dismantling mixed tiers yields 5/15/40/40, never changes pull counters and does not mutate input',()=>{
 const original=gearSave(),raw=JSON.stringify(original),ids=original.gear.map(x=>x.id);
 assert.equal(dismantleQuote(original,content,ids).fragments,100);
 const next=dismantleGear(original,content,ids);assert.equal(next.prismaFragments,10100);assert.deepEqual(next.gear,[]);assert.equal(next.gacha.totalPulls,4);assert.equal(JSON.stringify(original),raw);
 assert.deepEqual(decodeGameSave(encodeGameSave(next,content),content),next);
});
test('dismantle rechecks any owner, rejects missing/duplicate/exclusive IDs and atomically refuses invalid batches',()=>{
 const c=source();let original=gearSave();original=equipGear(original,c,'iris','gear_2');
 for(const ids of [[],['gear_1','gear_1'],['gear_1','missing'],['gear_1','gear_2'],['test-arthur']])assert.throws(()=>dismantleGear(original,c,ids));
 assert.equal(original.gear.length,4);assert.equal(original.prismaFragments,10000);
 const many=funded();many.gear=Array.from({length:100},(_,i)=>({id:`gear_${i+1}`,typeId:'t1',stats:{attack:1}}));many.gacha.totalPulls=100;
 assert.throws(()=>dismantleGear(many,content,many.gear.map(x=>x.id)));
 assert.equal(dismantleGear(many,content,many.gear.slice(0,99).map(x=>x.id)).gear.length,1);
 many.prismaFragments=Number.MAX_SAFE_INTEGER;assert.throws(()=>dismantleGear(many,content,['gear_1']));
});
test('dismantled last-summon items remain historical receipts and never resurrect or reuse gear IDs',()=>{
 let save=funded();save.prisma=2;save=pullGacha(save,content,'standard',1,()=>0).campaign;
 const id=save.gear[0].id;save=dismantleGear(save,content,[id]);
 assert.equal(save.gacha.lastSummon.results[0].dismantled,true);save=decodeGameSave(encodeGameSave(save,content),content);assert.deepEqual(save.gear,[]);
 save=pullGacha(save,content,'standard',1,()=>0).campaign;assert.equal(save.gear[0].id,'gear_2');assert.equal(save.gacha.totalPulls,2);
});
test('one stat rolls uniformly by type then integer, covers min/max inclusive, and rejects invalid RNG',()=>{
 for(const[index,key]of FORGE_STATS.entries()){
  const range=exclusiveRollRange(content,key);
  assert.deepEqual(rollExclusiveStat(content,rng((index+.01)/7,0)),{statKey:key,statValue:range.min});
  assert.deepEqual(rollExclusiveStat(content,rng((index+.01)/7,.999999)),{statKey:key,statValue:range.max});
 }
 for(const value of [-1,1,NaN,Infinity])assert.throws(()=>rollExclusiveStat(content,()=>value));
});
test('craft costs exactly four materials once, requires owner and enabled template, and never autoequips',()=>{
 const c=source(),original=funded(c),raw=JSON.stringify(original),next=craftExclusive(original,c,'test-arthur',rng(0,0));
 assert.equal(next.coins,40000);assert.equal(next.prismaFragments,7600);assert.equal(next.recruitmentShards,27);assert.equal(next.originalPrisma,19);
 assert.deepEqual(next.exclusiveGear,[{templateId:'test-arthur',statKey:'maxHp',statValue:25}]);assert.deepEqual(next.equippedExclusiveGear,{});assert.equal(JSON.stringify(original),raw);
 assert.throws(()=>craftExclusive(next,c,'test-arthur'));assert.throws(()=>craftExclusive(original,c,'test-lisbeth'));
 c.exclusiveGear['test-arthur'].enabled=false;assert.throws(()=>craftExclusive(original,c,'test-arthur'));
});
test('insufficient materials or a roll/revision error cannot partially spend or create gear',()=>{
 const c=source();for(const key of ['coins','prismaFragments','recruitmentShards','originalPrisma']){const save=funded(c);save[key]=0;const before=JSON.stringify(save);assert.throws(()=>craftExclusive(save,c,'test-arthur'));assert.equal(JSON.stringify(save),before);}
 const save=funded(c),before=JSON.stringify(save);assert.throws(()=>craftExclusive(save,c,'test-arthur',()=>NaN));assert.equal(JSON.stringify(save),before);
 save.blacksmithRevision=Number.MAX_SAFE_INTEGER;assert.throws(()=>craftExclusive(save,c,'test-arthur',()=>0));
});
test('separate exclusive slot switches templates without stacking, preserves collection and ordinary slot counts',()=>{
 const c=source();let save=craftExclusive(funded(c),c,'test-arthur',rng(2.1/7,0));save=craftExclusive(save,c,'test-arthur-two',()=>0);
 save.gear=[{id:'gear_1',typeId:'t1',stats:{attack:1}}];save.gacha.totalPulls=1;save=equipGear(save,c,'arthur','gear_1');const base=resolveCharacter(c,save,'arthur');
 save=equipExclusive(save,c,'arthur','test-arthur');const first=resolveCharacter(c,save,'arthur');assert.equal(first.stats.attack,(base.stats.attack+5)*1.2);assert.equal(effectiveStat(first,'attack'),first.stats.attack);
 assert.equal(save.equipment.arthur.length,3);assert.equal(save.exclusiveGear.length,2);assert.throws(()=>equipExclusive(save,c,'iris','test-arthur'));assert.throws(()=>equipGear(save,c,'arthur','test-arthur'));
 save=equipExclusive(save,c,'arthur','test-arthur-two');assert.equal(resolveCharacter(c,save,'arthur').stats.attack,base.stats.attack);
 save=unequipExclusive(save,c,'arthur');assert.equal(resolveCharacter(c,save,'arthur').stats.attack,base.stats.attack);assert.equal(save.exclusiveGear.length,2);
});
test('a native percentage passive combines once with the equipped exclusive passive; battle stats are snapshots',()=>{
 const c=source();let save=funded(c);save.unlockedCharacterIds.push('lisbeth');save=craftExclusive(save,c,'test-lisbeth',rng(3.1/7,0));save=equipExclusive(save,c,'lisbeth','test-lisbeth');save.party=['lisbeth','iris','elaine','garrek'];save.partyPresets[0].slots=[...save.party];
 const actor=resolveCharacter(c,save,'lisbeth');assert.equal(actor.stats.magic,(42+5)*1.3);
 const battle=createBattle(c,save,'forest_patrol');const snapshot=JSON.stringify(battle.actors[0]);save=unequipExclusive(save,c,'lisbeth');assert.equal(JSON.stringify(battle.actors[0]),snapshot);assert.equal(resolveCharacter(c,save,'lisbeth').stats.magic,42*1.2);
});
test('reforge persists spent currency and both stats across reload; keep old and use new cost nothing further',()=>{
 const c=source();let save=craftExclusive(funded(c),c,'test-arthur',()=>0);save=equipExclusive(save,c,'arthur','test-arthur');
 const pending=beginReforge(save,c,'test-arthur',rng(2.1/7,.999));assert.equal(pending.originalPrisma,save.originalPrisma-1);assert.deepEqual(pending.exclusiveGear,save.exclusiveGear);
 const loaded=decodeGameSave(encodeGameSave(pending,c),c);assert.deepEqual(loaded.pendingReforge,pending.pendingReforge);assert.throws(()=>beginReforge(loaded,c,'test-arthur'));
 const kept=finishReforge(loaded,c,loaded.pendingReforge.id,false),used=finishReforge(loaded,c,loaded.pendingReforge.id,true);
 assert.deepEqual(kept.exclusiveGear,save.exclusiveGear);assert.equal(kept.originalPrisma,pending.originalPrisma);assert.equal(kept.pendingReforge,null);
 assert.deepEqual(used.exclusiveGear,[{templateId:'test-arthur',statKey:'attack',statValue:10}]);assert.deepEqual(used.equippedExclusiveGear,save.equippedExclusiveGear);assert.equal(used.originalPrisma,pending.originalPrisma);
 assert.throws(()=>finishReforge(used,c,loaded.pendingReforge.id,true));
 const again=beginReforge(kept,c,'test-arthur',()=>0);assert.throws(()=>finishReforge(again,c,loaded.pendingReforge.id,true));
});
test('identical reforge results are allowed; zero currency/unowned/invalid RNG do not spend',()=>{
 const c=source(),original=craftExclusive(funded(c),c,'test-arthur',()=>0),pending=beginReforge(original,c,'test-arthur',()=>0);
 assert.equal(pending.pendingReforge.previousStatKey,pending.pendingReforge.nextStatKey);assert.equal(pending.pendingReforge.previousStatValue,pending.pendingReforge.nextStatValue);
 for(const change of [save=>save.originalPrisma=0,save=>save.exclusiveGear=[],save=>save.pendingReforge=pending.pendingReforge]){const value=structuredClone(original);change(value);assert.throws(()=>beginReforge(value,c,'test-arthur'));}
 const raw=JSON.stringify(original);assert.throws(()=>beginReforge(original,c,'test-arthur',()=>NaN));assert.equal(JSON.stringify(original),raw);
});
test('v5 validates every new field, ownership, unique templates, cross-character slots and pending old/new consistency',()=>{
 const c=source();let save=craftExclusive(funded(c),c,'test-arthur',()=>0);save=beginReforge(save,c,'test-arthur',()=>0);const raw=JSON.parse(encodeGameSave(save,c));
 for(const corrupt of [x=>delete x.originalPrisma,x=>x.prismaFragments=-1,x=>x.originalPrisma=null,x=>x.prismaFragments=.5,x=>x.blacksmithRevision=Number.MAX_SAFE_INTEGER+1,x=>x.exclusiveGear.push(x.exclusiveGear[0]),x=>x.exclusiveGear[0].statValue=99,x=>x.equippedExclusiveGear={iris:'test-arthur'},x=>x.pendingReforge.previousStatValue=30,x=>x.pendingReforge.nextStatKey='secret',x=>x.pendingReforge.id=0]){const bad=structuredClone(raw);corrupt(bad);assert.throws(()=>decodeGameSave(JSON.stringify(bad),c));}
 assert.deepEqual(decodeGameSave(encodeGameSave(createGameSave(content),content),content).exclusiveGear,[]);
});
test('content rejects unsafe costs, unknown resources and unsupported passive adapters before enabling templates',()=>{
 for(const corrupt of [x=>x.blacksmith.default.maxDismantle=100,x=>x.blacksmith.default.craftCost.coins=-1,x=>x.blacksmith.default.rollMaxPoints=3,x=>x.exclusiveGear['test-arthur'].passive.type='unimplemented',x=>x.exclusiveGear['test-arthur'].passive.modifiers={unknown:1},x=>x.items.coin.field='password']){const c=source();corrupt(c);assert.ok(validateContent(c).length);}
});
