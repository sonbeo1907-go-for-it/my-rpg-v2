import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave} from '../src/core/game-save.js';
import {createBattle,getActor,executeAction,activeActor} from '../src/core/battle.js';
import {resolveRankedAbility} from '../src/core/skill-resolver.js';
import {exclusiveDamageEffect} from '../src/core/exclusive-hooks.js';
import {mpCost} from '../src/core/conditional-combat.js';
import {validateContent} from '../src/core/content.js';
import {exclusiveRollRange} from '../src/core/blacksmith-rules.js';
const content=await loadContent();
const gearStat={statKey:'maxMp',statValue:exclusiveRollRange(content,'maxMp').min};
function fixture(party,gearIds=[]){
 const c=structuredClone(content),save=createGameSave(c);
 save.party=[...party];save.partyPresets[0].slots=[...party];
 save.unlockedCharacterIds=[...new Set([...save.unlockedCharacterIds,...party])];
 for(const id of gearIds){const templateId=c.exclusiveGear[id].id;save.exclusiveGear.push({templateId,...gearStat});save.equippedExclusiveGear[c.exclusiveGear[id].characterId]=templateId;save.unlockedExclusiveRecipes.push(templateId);}
 const b=createBattle(c,save,'forest_patrol',()=>.99);
 for(const e of b.actors.filter(a=>a.team==='enemy')){e.hp=e.stats.maxHp=100000;e.stats.attack=0;e.stats.defense=e.stats.resistance=0;e.statuses=[];e.weaknesses=[];e.resistances={};e.abilities=['$defend'];}
 return {b,c,save};
}
function act(b,id,abilityId,targetId){const a=getActor(b,id);b.queue=[a.id,...b.actors.filter(x=>x.id!==a.id&&x.hp>0).map(x=>x.id)];b.cursor=0;b.phase='main';b.outcome=null;executeAction(b,{actorId:a.id,abilityId,targetId:targetId??a.id});}
function enemyStrike(b,targetId,power=100){const e=b.actors.find(a=>a.team==='enemy');e.stats.attack=power;e.abilities=['$attack'];b.queue=[e.id];b.cursor=0;b.phase='main';b.outcome=null;executeAction(b,{actorId:e.id,abilityId:'$attack',targetId});}

test('Ardelia has correct identity and living +10 DEF/RES aura',()=>{
 const a=content.characters.ardelia;
 assert.equal(a.roleGroup,'defensive_support');assert.equal(a.element,'water');assert.equal(a.affiliation,'expedition_corps');
 assert.deepEqual(a.stats,{maxHp:240,maxMp:125,attack:10,magic:14,defense:24,resistance:32,speed:15});
 assert.equal(a.passive.type,'living_team_flat_guard');assert.deepEqual(a.passive.modifiers,{defense:10,resistance:10});
 assert.ok(content.banners.standard.characterPool.includes('ardelia'));assert.ok(content.pvpAiProfiles.ardelia);
 assert.deepEqual(validateContent(content),[]);
 const without=fixture(['iris']);const iris0=getActor(without.b,'iris');const hp0=iris0.hp;enemyStrike(without.b,iris0.id);const loss0=hp0-iris0.hp;
 const withA=fixture(['ardelia','iris']);const iris1=getActor(withA.b,'iris');const hp1=iris1.hp;enemyStrike(withA.b,iris1.id);const loss1=hp1-iris1.hp;
 assert.ok(loss1<loss0,'+10 DEF phải giảm sát thương nhận vào');
});

test('Ardelia triage heals by RES, buffs DEF/RES, aegis cleanses and shields, purge debuffs ATK/MAG',()=>{
 const {b,c}=fixture(['ardelia','iris']);const ar=getActor(b,'ardelia'),iris=getActor(b,'iris');iris.hp=50;iris.statuses=[{id:'deep_wound',remaining:2,stacks:1}];
 act(b,'ardelia','ardelia.triage',ar.id);
 assert.ok(iris.hp>50);assert.ok(ar.statuses.some(s=>s.id==='ardelia_guard'));assert.ok(iris.statuses.some(s=>s.id==='ardelia_guard'));
 iris.statuses.push({id:'deep_wound',remaining:2,stacks:1});act(b,'ardelia','ardelia.aegis',ar.id);
 assert.ok(iris.statuses.every(s=>s.id!=='deep_wound'));assert.ok(iris.shield>0);
 const enemy=b.actors.find(a=>a.team==='enemy');act(b,'ardelia','ardelia.purge',enemy.id);
 assert.ok(enemy.hp<100000);assert.ok(enemy.statuses.some(s=>s.id==='ardelia_weaken'));
});

test('Ardelia Trấn strengthens RES shield and grants Hộ Ấn to the team',()=>{
 const base=fixture(['ardelia','iris']);const ar0=getActor(base.b,'ardelia');act(base.b,'ardelia','ardelia.aegis',ar0.id);const plain=ar0.shield;
 const {b}=fixture(['ardelia','iris'],['ardelia.field_kit']);const ar=getActor(b,'ardelia'),iris=getActor(b,'iris');act(b,'ardelia','ardelia.aegis',ar.id);
 assert.ok(ar.shield>plain,'Trấn phải tăng khiên theo RES');
 assert.ok(ar.statuses.some(s=>s.id==='effect_ward'));assert.ok(iris.statuses.some(s=>s.id==='effect_ward'));
});

test('Minerva Trấn adds 120% MAG shield to every ally after Hộ Ấn and scales with Rank',()=>{
 const one=fixture(['minerva','iris'],['minerva.silent_forest']);const m1=getActor(one.b,'minerva');m1.skillRanks['minerva.ward']=1;act(one.b,'minerva','minerva.ward',m1.id);const s1=m1.shield;
 const five=fixture(['minerva','iris'],['minerva.silent_forest']);const m5=getActor(five.b,'minerva');m5.skillRanks['minerva.ward']=5;act(five.b,'minerva','minerva.ward',m5.id);const s5=m5.shield;
 for(const ally of five.b.actors.filter(a=>a.team==='party'))assert.ok(ally.shield>0,'mọi đồng đội có khiên');
 assert.ok(s5>s1,'Khiên phải tăng theo Rank');
});

test('Amelia Trấn reduces team damage while shielded, raises follow-up to 140% and dispels one buff',()=>{
 const plain=fixture(['amelia','iris']);const pi=getActor(plain.b,'iris');pi.shield=10;const php=pi.hp;enemyStrike(plain.b,pi.id);const ploss=php-pi.hp;
 const armored=fixture(['amelia','iris'],['amelia.mirror']);const ai=getActor(armored.b,'iris');ai.shield=10;const ahp=ai.hp;enemyStrike(armored.b,ai.id);const aloss=ahp-ai.hp;
 assert.ok(aloss<ploss,'đội có khiên phải giảm 20% sát thương nhận');
 const a=getActor(armored.b,'amelia');const echo=resolveRankedAbility(armored.c,a,'amelia.echo');assert.equal(exclusiveDamageEffect(a,echo.id,echo.effects[0]).multiplier,1.4);
 const enemy=armored.b.actors.find(x=>x.team==='enemy');enemy.statuses.push({id:'young_oath',remaining:3,stacks:1});ai.shield=1000;enemyStrike(armored.b,ai.id);assert.ok(!enemy.statuses.some(s=>s.id==='young_oath'),'liên kích phải xóa 1 buff');
});

test('Amaryllis Trấn starts Litany ready and adds 350% MAG team shield; rank reduces MP up to 5',()=>{
 const noGear=fixture(['amaryllis']);assert.ok(noGear.b.actors.find(a=>a.id==='amaryllis').cooldowns['amaryllis.litany']>0);
 const {b,c}=fixture(['amaryllis'],['amaryllis.litany_lamp']);const am=getActor(b,'amaryllis');assert.equal(am.cooldowns['amaryllis.litany'],0);
 am.mp=am.stats.maxMp;act(b,'amaryllis','amaryllis.litany',am.id);
 for(const ally of b.actors.filter(a=>a.team==='party'))assert.equal(ally.shield,140,'Khiên Kinh Cầu rank 1 = 350% MAG');
 const high=fixture(['amaryllis'],['amaryllis.litany_lamp']);const amh=getActor(high.b,'amaryllis');amh.skillRanks['amaryllis.litany']=5;amh.mp=amh.stats.maxMp;act(high.b,'amaryllis','amaryllis.litany',amh.id);assert.ok(amh.shield>140,'Khiên tăng theo Rank');
 const r1=resolveRankedAbility(c,am,'amaryllis.litany',1),r5=resolveRankedAbility(c,am,'amaryllis.litany',5);assert.ok(mpCost(r5,am)<mpCost(r1,am));assert.equal(c.abilities['amaryllis.litany'].rankable,true);assert.equal(c.abilities['amaryllis.litany'].growthProfile,'output_buff_mp');
});


