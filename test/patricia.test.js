import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave} from '../src/core/game-save.js';
import {createBattle,activeActor,getActor,executeAction} from '../src/core/battle.js';
import {battleStat} from '../src/core/stat-values.js';
import {shieldAuraBonus} from '../src/core/shield-aura.js';
import {statusApplicationChance} from '../src/core/status-chance.js';
import {validateContent} from '../src/core/content.js';
import {buyExclusiveRecipe,blueprintRecipeUnlocked} from '../src/core/blueprint-shop.js';
import {exclusiveRollRange,exclusiveCraftUnlocked} from '../src/core/blacksmith-rules.js';
import {craftExclusive} from '../src/core/blacksmith.js';
const content=await loadContent();
const ID='patricia.geode';
function fixture({gear=false}={}){
 const c=structuredClone(content);
 const save=createGameSave(c);save.party=['patricia','arthur','iris','takeshi'];save.partyPresets[0].slots=[...save.party];
 save.unlockedCharacterIds=[...new Set([...save.unlockedCharacterIds,...save.party])];
 if(gear){
  save.exclusiveGear.push({templateId:ID,statKey:'attack',statValue:exclusiveRollRange(c,'attack').min});
  save.equippedExclusiveGear.patricia=ID;
  save.unlockedExclusiveRecipes.push(ID);
 }
 const b=createBattle(c,save,'forest_patrol',()=>.99);
 for(const enemy of b.actors.filter(actor=>actor.team==='enemy')){
  enemy.hp=enemy.stats.maxHp=100000;enemy.stats.attack=0;enemy.stats.defense=0;enemy.stats.resistance=0;
  enemy.abilities=['$defend'];enemy.statuses=[];enemy.weaknesses=[];enemy.resistances={};
 }
 b.random=()=>.99;
 return {b,c,save,patricia:getActor(b,'patricia')};
}
function act(b,id,target){const actor=activeActor(b);executeAction(b,{actorId:actor.id,abilityId:id,targetId:target??(b.content.abilities[id]?.target==='self'?actor.id:b.actors.find(a=>a.team==='enemy'&&a.hp>0).id)});}
function cast(b,id,target){const p=getActor(b,'patricia');b.queue=[p.id,...b.actors.filter(a=>a.id!==p.id&&a.hp>0).map(a=>a.id)];b.cursor=0;b.phase='main';b.outcome=null;executeAction(b,{actorId:p.id,abilityId:id,targetId:target??(b.content.abilities[id].target==='self'?p.id:b.actors.find(a=>a.team==='enemy'&&a.hp>0).id)});}
function nextRound(b,after){
 const start=b.round;
 for(let i=0;i<80&&b.round===start;i++){
  const a=activeActor(b);
  executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});
  after?.(a);
 }
 assert.ok(b.round>start,'phải qua vòng');
}

test('Patricia is an Earth magical DPS of the expedition corps',()=>{
 const p=content.characters.patricia;
 assert.equal(p.roleGroup,'magical_dps');assert.equal(p.element,'earth');assert.equal(p.affiliation,'expedition_corps');
 assert.deepEqual(p.stats,{maxHp:140,maxMp:100,attack:9,magic:36,defense:16,resistance:22,speed:16});
 assert.deepEqual(p.abilities,['patricia.bedrock','patricia.survey','patricia.core']);
 assert.equal(p.passive.type,'shielded_ally_magic');assert.equal(p.passive.ratio,0.15);
 assert.ok(content.banners.standard.characterPool.includes('patricia'));
 assert.ok(content.pvpAiProfiles.patricia,'phải có AI profile');
 assert.deepEqual(validateContent(content),[]);
});

test('Patricia gains 15% MAG for every living ally holding a shield',()=>{
 const {b,patricia}=fixture();
 assert.equal(shieldAuraBonus(b,patricia),0);
 assert.equal(battleStat(b.content,patricia,'magic'),36);
 for(const [id,value] of [['arthur',1],['iris',2],['patricia',3],['takeshi',4]]){
  getActor(b,id).shield=10;
  assert.equal(shieldAuraBonus(b,patricia),value*0.15);
 }
 const shielded=battleStat(b.content,patricia,'magic'); // raw battleStat deliberately excludes battle state
 assert.equal(shielded,36,'battleStat trực tiếp không tự đọc battle; aura được áp trong damage/skill path');
});

test('The aura is actually applied to Patricia damage and shield skills',()=>{
 const plain=fixture();cast(plain.b,'patricia.survey');
 const plainDamage=plain.b.events.filter(e=>e.type==='damage').reduce((n,e)=>n+e.amount,0);
 const buffed=fixture();
 for(const id of ['arthur','iris'])getActor(buffed.b,id).shield=10;
 cast(buffed.b,'patricia.survey');
 const buffedDamage=buffed.b.events.filter(e=>e.type==='damage').reduce((n,e)=>n+e.amount,0);
 assert.ok(buffedDamage>plainDamage,'2 Khiên phải tăng sát thương của Patricia');
 assert.ok(Math.abs(buffedDamage/plainDamage-1.3)<0.03,'2 Khiên = +30% MAG');

 const shieldBattle=fixture();cast(shieldBattle.b,'patricia.bedrock');
 const shields=shieldBattle.b.actors.filter(a=>a.team==='party').map(a=>a.shield);
 assert.ok(shields.every(value=>value>0),'mọi đồng đội phải nhận khiên');
 assert.equal(new Set(shields).size,1,'khiên toàn đội phải cùng một giá trị, không tự tăng giữa chừng');
});

test('Stun chance uses dynamic MAG, includes shield aura, and caps at 80% around 160 MAG',()=>{
 const {b,patricia}=fixture();
 const rule=content.abilities['patricia.core'].effects[0].onHitStatus.chanceScaling;
 assert.equal(statusApplicationChance(b.content,patricia,rule,b),Math.min(.8,36/160*.8));
 patricia.stats.magic=160;
 assert.equal(statusApplicationChance(b.content,patricia,rule,b),.8);
 patricia.stats.magic=100;
 for(const id of ['arthur','iris'])getActor(b,id).shield=10;
 assert.equal(statusApplicationChance(b.content,patricia,rule,b),Math.min(.8,130/160*.8),'2 Khiên phải cộng vào MAG động');
});

test('Patricia Trấn restores 2% max MP per shielded team member at round end',()=>{
 const {b,patricia}=fixture({gear:true});
 for(const id of ['patricia','arthur','iris'])getActor(b,id).shield=100;
 patricia.mp=0;
 nextRound(b,actor=>{if(actor.id==='patricia')patricia.mp=0;});
 assert.equal(patricia.mp,Math.ceil(patricia.stats.maxMp*0.02*3),'3 thành viên có khiên');
 const noGear=fixture();for(const id of ['patricia','arthur','iris'])getActor(noGear.b,id).shield=100;noGear.patricia.mp=0;nextRound(noGear.b,actor=>{if(actor.id==='patricia')noGear.patricia.mp=0;});assert.equal(noGear.patricia.mp,0);
});

test('Patricia Trấn is a blueprint recipe in the shop and forge',()=>{
 const template=content.exclusiveGear[ID];
 assert.ok(template);assert.equal(template.characterId,'patricia');assert.deepEqual(template.requires,{blueprint:true});
 assert.equal(template.passive.type,'end_round_shielded_mp');assert.equal(template.passive.ratio,0.02);
 const fresh=createGameSave(content);fresh.blueprints=20;
 assert.equal(blueprintRecipeUnlocked(fresh,template),false);
 const opened=buyExclusiveRecipe(fresh,content,ID);
 assert.equal(opened.blueprints,10);
 assert.equal(exclusiveCraftUnlocked(opened,template),true);
 const owned=structuredClone(opened);owned.unlockedCharacterIds.push('patricia');
 Object.assign(owned,{coins:1000000,prismaFragments:1000000,recruitmentShards:1000,originalPrisma:100});
 const crafted=craftExclusive(owned,content,ID,()=>0);
 assert.ok(crafted.exclusiveGear.some(item=>item.templateId===ID));
});
