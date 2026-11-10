import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave} from '../src/core/game-save.js';
import {createBattle,getActor,executeAction,activeActor} from '../src/core/battle.js';
import {resolveCharacter} from '../src/core/progression.js';
import {validateContent} from '../src/core/content.js';
const content=await loadContent();
function fixture(party){const c=structuredClone(content),save=createGameSave(c);save.party=[...party];save.partyPresets[0].slots=[...party];save.unlockedCharacterIds=[...new Set([...save.unlockedCharacterIds,...party])];const b=createBattle(c,save,'forest_patrol',()=>.99);for(const e of b.actors.filter(a=>a.team==='enemy')){e.hp=e.stats.maxHp=100000;e.stats.attack=0;e.stats.defense=e.stats.resistance=0;e.stats.magic=0;e.statuses=[];e.weaknesses=[];e.damageTypeWeaknesses=[];e.resistances={};e.abilities=['$defend'];}return {b,c,save};}
function act(b,id,abilityId,targetId){const a=getActor(b,id);b.queue=[a.id,...b.actors.filter(x=>x.id!==a.id&&x.hp>0).map(x=>x.id)];b.cursor=0;b.phase='main';b.outcome=null;executeAction(b,{actorId:a.id,abilityId,targetId:targetId??a.id});}
function attach(b,id,effectId){const a=getActor(b,id);a.gearEffects.push(structuredClone(content.gearEffects[effectId]));return a;}
function exclusive(party,characterId,templateId){const c=structuredClone(content),save=createGameSave(c);save.party=[...party];save.partyPresets[0].slots=[...party];save.unlockedCharacterIds=[...new Set([...save.unlockedCharacterIds,...party])];save.exclusiveGear.push({templateId,statKey:'maxHp',statValue:25});save.equippedExclusiveGear[characterId]=templateId;save.unlockedExclusiveRecipes.push(templateId);const b=createBattle(c,save,'forest_patrol',()=>.99);for(const e of b.actors.filter(a=>a.team==='enemy')){e.hp=e.stats.maxHp=100000;e.stats.attack=0;e.stats.defense=e.stats.resistance=0;e.statuses=[];e.weaknesses=[];e.damageTypeWeaknesses=[];e.resistances={};e.abilities=['$defend'];}return {b,c,save};}

test('the two soul gear recipes and two new trấn validate',()=>{
 assert.deepEqual(validateContent(content),[]);
 assert.equal(Object.keys(content.gearEffects).length,27);
 assert.equal(content.gearEffects.soul_wellspring.effect.type,'soul_creation_mp');
 assert.match(content.gearEffects.soul_wellspring.description,/trực tiếp tạo Hồn Kiếm bằng hiệu ứng kỹ năng/);
 assert.equal(content.gearEffects.soul_forge_sigil.effect.type,'soul_spend_damage');
 assert.ok(content.exclusiveGear['amiya.lantern']);assert.ok(content.exclusiveGear['kaguya.moon_cradle']);
});

test('soul gear applies max MP and ATK/MAG plus the creation and spend triggers',()=>{
 const c=structuredClone(content),save=createGameSave(c);
 save.gear.push({id:'rune_1',typeId:'t4_effect',effectId:'soul_wellspring',stats:{}});
 save.gear.push({id:'rune_2',typeId:'t4_effect',effectId:'soul_forge_sigil',stats:{}});
 save.equipment.amiya=['rune_1','rune_2'];
 save.unlockedCharacterIds=[...new Set([...save.unlockedCharacterIds,'amiya'])];
 const a=resolveCharacter(c,save,'amiya');
 assert.equal(a.stats.maxMp,150,'125 + 20% = 150 MP');
 assert.ok(Math.abs(a.stats.attack-11.5)<1e-9,'10 + 15% = 11,5 ATK');
 assert.ok(Math.abs(a.stats.magic-32.2)<1e-9,'28 + 15% = 32,2 MAG');
 const {b}=fixture(['amiya','tsukiha','kaguya','shion']);const ow=getActor(b,'amiya');attach(b,'amiya','soul_wellspring');
 for(const ally of b.actors.filter(x=>x.team==='party'))ally.mp=0;ow.mp=100;
 act(b,'amiya','amiya.offering');
 for(const ally of b.actors.filter(x=>x.team==='party'))assert.ok(ally.mp>=Math.ceil(ally.stats.maxMp*.03),ally.name+' nhận 3% MP');
});

test('soul spend damage scales with the number of Hồn Kiếm spent',()=>{
 const {b}=fixture(['tsukiha','shion','amiya','kaguya']),t=getActor(b,'tsukiha');b.teamResources.party.sword_soul.value=4;
 act(b,'tsukiha','tsukiha.burst',b.actors.find(a=>a.team==='enemy').id);const plain=b.events.filter(e=>e.type==='damage')[0].amount;
 const withGear=fixture(['tsukiha','shion','amiya','kaguya']),g=getActor(withGear.b,'tsukiha');attach(withGear.b,'tsukiha','soul_forge_sigil');withGear.b.teamResources.party.sword_soul.value=4;
 act(withGear.b,'tsukiha','tsukiha.burst',withGear.b.actors.find(a=>a.team==='enemy').id);const boosted=withGear.b.events.filter(e=>e.type==='damage')[0].amount;
 assert.ok(boosted>plain,'4 Hồn Kiếm tiêu thụ phải tăng sát thương');
 assert.ok(boosted/plain>1.25&&boosted/plain<1.4,'xấp xỉ +32% trước làm tròn');
});

test('Amiya trấn adds one exposure stack to primary and secondary targets',()=>{
 const {b}=exclusive(['amiya','tsukiha','shion','kaguya'],'amiya','amiya.lantern');const enemies=b.actors.filter(a=>a.team==='enemy');
 act(b,'amiya','amiya.strike',enemies[0].id);
 assert.equal(enemies[0].statuses.find(s=>s.id==='exposure_sword_soul').stacks,3,'mục tiêu chính 2+1');
 assert.equal(enemies[1].statuses.find(s=>s.id==='exposure_sword_soul').stacks,2,'mục tiêu phụ 1+1');
});

test('Kaguya trấn grants three permanent +4 DEF/RES stacks and then stops',()=>{
 const {b}=exclusive(['kaguya','amiya','tsukiha','shion'],'kaguya','kaguya.moon_cradle');const k=getActor(b,'kaguya');k.stats.maxMp=300;k.mp=300;
 const before=getActor(b,'amiya').baseStats?.defense??getActor(b,'amiya').stats.defense;
 for(let i=0;i<3;i++){k.cooldowns={};k.mp=300;act(b,'kaguya','kaguya.offering',k.id);}
 assert.equal(k.soulCreateStacks,3);assert.equal(getActor(b,'amiya').baseStats.defense,before+12);
 const afterThree=getActor(b,'amiya').baseStats.defense;
 k.cooldowns={};k.mp=300;act(b,'kaguya','kaguya.offering',k.id);
 assert.equal(getActor(b,'amiya').baseStats.defense,afterThree,'không vượt 3 tầng');
});



