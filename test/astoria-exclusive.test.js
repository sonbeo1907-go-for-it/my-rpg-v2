import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {unlockCharacter} from '../src/core/ownership.js';
import {createBattle,getActor,executeAction,activeActor} from '../src/core/battle.js';
import {battleStat} from '../src/core/stat-values.js';
import {baseStatValue} from '../src/core/combat-math.js';
import {specialResourceKeepChance} from '../src/core/exclusive-specials.js';
import {validateContent} from '../src/core/content.js';
import {buyExclusiveRecipe,blueprintRecipeUnlocked} from '../src/core/blueprint-shop.js';
import {exclusiveCraftUnlocked,exclusiveRollRange} from '../src/core/blacksmith-rules.js';
import {craftExclusive,equipExclusive} from '../src/core/blacksmith.js';
const content=await loadContent();
const ID='astoria.crown',near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function campaign({magic=36,gear=true}={}){
 const c=structuredClone(content);c.characters.astoria.stats.magic=magic;c.characters.astoria.stats.speed=100;
 const save=createGameSave(c);unlockCharacter(save,c,'astoria');save.party=['astoria'];save.partyPresets[0].slots=['astoria'];
 if(gear){
  save.exclusiveGear.push({templateId:ID,statKey:'attack',statValue:exclusiveRollRange(c,'attack').min});
  save.equippedExclusiveGear.astoria=ID;
  save.unlockedExclusiveRecipes.push(ID);
 }
 return {c,save};
}
function battle(options){
 const {c,save}=campaign(options);
 const b=createBattle(c,save,'forest_patrol',()=>.99);
 for(const enemy of b.actors.filter(actor=>actor.team==='enemy')){
  enemy.hp=enemy.stats.maxHp=1000000;enemy.stats.defense=enemy.stats.resistance=0;enemy.weaknesses=[];enemy.resistances={};
 }
 return b;
}
function use(b,id,ability,target=id){
 b.queue=[id,...b.actors.filter(actor=>actor.id!==id&&actor.hp>0).map(actor=>actor.id)];
 b.cursor=0;b.phase='main';b.outcome=null;getActor(b,id).cooldowns={};
 executeAction(b,{actorId:id,abilityId:ability,targetId:target});
}
function summon(b){
 const astoria=getActor(b,'astoria');astoria.resourceValues.space_rift=5;use(b,'astoria','astoria.summon');
 assert.equal(astoria.activeMode,'magnamut','phải vào Magnamut');
 return astoria;
}

test('Vương Miện Hố Đen is a sellable blueprint Trấn with two tested passive adapters',()=>{
 const template=content.exclusiveGear[ID];
 assert.ok(template,'phải có mục dữ liệu astoria.crown');
 assert.equal(template.characterId,'astoria');
 assert.equal(template.enabled,true);
 assert.deepEqual(template.requires,{blueprint:true});
 assert.equal(template.passive.type,'bundle');
 assert.deepEqual(template.passive.effects.map(effect=>effect.type),['mode_stat_boost','resource_keep_chance']);
 const [mode,keep]=template.passive.effects;
 assert.equal(mode.modeId,'magnamut');assert.equal(mode.stat,'magic');assert.equal(mode.ratio,0.35);
 assert.deepEqual(keep.abilityIds,['astoria.command']);assert.equal(keep.resourceId,'space_rift');assert.equal(keep.stat,'magic');assert.equal(keep.atStat,150);assert.equal(keep.cap,1);
 assert.deepEqual(validateContent(content),[]);
});

test('Astoria gains 35% MAG only while Magnamut is present',()=>{
 const b=battle(),astoria=getActor(b,'astoria'),before=battleStat(b.content,astoria,'magic');
 near(before,36);
 summon(b);
 near(battleStat(b.content,astoria,'magic'),(before+15)*1.35);
 const plain=battle({gear:false}),plainAstoria=getActor(plain,'astoria');summon(plain);near(battleStat(plain.content,plainAstoria,'magic'),51);
});

test('Command keeps a rift at 100% at 150 base MAG and scales linearly below that',()=>{
 const capped=battle({magic:135}),astoria=summon(capped);astoria.resourceValues.space_rift=3;
 capped.random=()=>.9999;
 use(capped,'astoria','astoria.command','enemy_0');
 assert.equal(astoria.resourceValues.space_rift,3,'150 MAG phải chắc chắn giữ Vết nứt');
 assert.ok(capped.log.some(line=>line.includes('giữ lại Vết nứt')));

 const half=battle({magic:60}),halfAstoria=summon(half);
 const keep=specialResourceKeepChance(halfAstoria,'astoria.command','space_rift',key=>baseStatValue(halfAstoria,key));
 near(keep.chance,.5);
 half.random=()=>.49;halfAstoria.resourceValues.space_rift=3;use(half,'astoria','astoria.command','enemy_0');assert.equal(halfAstoria.resourceValues.space_rift,3);
 half.random=()=>.51;halfAstoria.resourceValues.space_rift=3;use(half,'astoria','astoria.command','enemy_0');assert.equal(halfAstoria.resourceValues.space_rift,2,'trượt xác suất thì vẫn tiêu 1 Vết nứt');
});

test('without the Trấn, Command always spends its rift',()=>{
 const b=battle({gear:false,magic:135}),astoria=summon(b);astoria.resourceValues.space_rift=3;b.random=()=>0;
 use(b,'astoria','astoria.command','enemy_0');
 assert.equal(astoria.resourceValues.space_rift,2);
});

test('recipe opens in the Blueprint shop for 10 blueprints, appears in forge data and crafts once',()=>{
 const template=content.exclusiveGear[ID];
 const fresh=createGameSave(content);fresh.blueprints=20;
 assert.equal(blueprintRecipeUnlocked(fresh,template),false);
 assert.equal(exclusiveCraftUnlocked(fresh,template),false);
 assert.throws(()=>buyExclusiveRecipe(fresh,content,ID,{battleActive:true}),/kết thúc/);
 const opened=buyExclusiveRecipe(fresh,content,ID);
 assert.equal(opened.blueprints,10);assert.deepEqual(opened.unlockedExclusiveRecipes,[ID]);assert.equal(fresh.blueprints,20);
 assert.equal(exclusiveCraftUnlocked(opened,template),true);
 assert.throws(()=>buyExclusiveRecipe(opened,content,ID),/đã được mở/);

 const owned=structuredClone(opened);unlockCharacter(owned,content,'astoria');Object.assign(owned,{coins:1000000,prismaFragments:1000000,recruitmentShards:1000,originalPrisma:100});
 const crafted=craftExclusive(owned,content,ID,()=>0),item=crafted.exclusiveGear.find(entry=>entry.templateId===ID);
 assert.ok(item,'phải chế tạo được sau khi mở công thức');
 assert.throws(()=>craftExclusive(crafted,content,ID),/đã được chế tạo/);
 const equipped=equipExclusive(crafted,content,'astoria',ID);
 assert.equal(equipped.equippedExclusiveGear.astoria,ID);
 assert.deepEqual(decodeGameSave(encodeGameSave(equipped,content),content).exclusiveGear,equipped.exclusiveGear);
});
