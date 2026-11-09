import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave} from '../src/core/game-save.js';
import {createBattle,activeActor,getActor,executeAction,DEFEND} from '../src/core/battle.js';
import {validateContent} from '../src/core/content.js';
import {lowHpDamageBonus} from '../src/core/conditional-combat.js';
import {passivePresentation} from '../src/ui/skill-copy.js';
const content=await loadContent();
function fixture(){
 const c=structuredClone(content);
 const save=createGameSave(c);save.party=['karin','arthur'];save.partyPresets[0].slots=[...save.party];
 save.unlockedCharacterIds=[...new Set([...save.unlockedCharacterIds,'karin','arthur'])];
 const b=createBattle(c,save,'forest_patrol',()=>.99);
 for(const enemy of b.actors.filter(actor=>actor.team==='enemy')){enemy.hp=enemy.stats.maxHp=100000;enemy.stats.attack=0;enemy.stats.defense=0;enemy.weaknesses=[];enemy.resistances={};}
 const karin=getActor(b,'karin');karin.stats.defense=0;
 return {b,karin};
}
function enemyHit(b,attack,target='karin'){
 const id='test.karin_hit';
 b.content.abilities[id]={id,name:'Đòn thử',target:'enemy',effects:[{type:'damage',damageType:'physical',element:'plain',multiplier:1}]};
 const enemy=b.actors.find(actor=>actor.team==='enemy');
 if(!enemy.abilities.includes(id))enemy.abilities.push(id);
 enemy.stats.attack=attack;
 b.queue=[enemy.id,...b.actors.filter(actor=>actor.id!==enemy.id&&actor.hp>0).map(actor=>actor.id)];
 b.cursor=0;b.phase='main';b.outcome=null;
 executeAction(b,{actorId:enemy.id,abilityId:id,targetId:getActor(b,target).id});
}
function nextRound(b){
 const start=b.round;
 for(let i=0;i<80&&b.round===start;i++){
  const actor=activeActor(b);
  executeAction(b,{actorId:actor.id,abilityId:'$defend',targetId:actor.id});
 }
 assert.ok(b.round>start,'phải qua vòng mới');
}

test('Karin passive is authored as a once-per-battle round immortality',()=>{
 const k=content.characters.karin;
 assert.equal(k.passive.type,'low_hp_immortality');
 assert.equal(k.passive.ratio,0.6);
 assert.equal(k.passive.threshold,0.25);
 assert.equal(k.passive.immortalityStatus,'karin_immortal');
 assert.equal(lowHpDamageBonus(k.passive,0.5),0.3,'nội tại sát thương cũ vẫn hoạt động');
 const status=content.statuses.karin_immortal;
 assert.equal(status.preventDeath,true);
 assert.equal(status.durationClock,'round');
 assert.deepEqual(validateContent(content),[]);
 assert.doesNotMatch(JSON.stringify(passivePresentation(k,content)),/undefined|NaN/);
});

test('Karin does not gain Bất Tử above 25% HP',()=>{
 const {b,karin}=fixture();
 karin.hp=100;enemyHit(b,10);
 assert.ok(karin.hp/karin.stats.maxHp>0.25);
 assert.equal(karin.statuses.some(status=>status.id==='karin_immortal'),false);
 assert.equal(karin.battleProcs?.lowHpImmortality,undefined);
});

test('Crossing into 25% grants Bất Tử once and prevents death for the rest of the round',()=>{
 const {b,karin}=fixture();
 karin.hp=57;enemyHit(b,1);
 assert.equal(karin.hp,56,'dưới ngưỡng 25%');
 const status=karin.statuses.find(entry=>entry.id==='karin_immortal');
 assert.ok(status,'phải nhận Bất Tử');
 assert.equal(status.expiresAfterRound,b.round);
 assert.equal(karin.battleProcs.lowHpImmortality,true);
 assert.ok(b.log.some(line=>line.includes('Bất Tử đến hết vòng')));
 enemyHit(b,10000);
 assert.equal(karin.hp,1,'Bất Tử giữ Karin ở 1 HP');
});

test('Lethal damage from above 25% still triggers Bất Tử before death',()=>{
 const {b,karin}=fixture();
 karin.hp=karin.stats.maxHp;
 enemyHit(b,10000);
 assert.equal(karin.hp,1);
 assert.ok(karin.statuses.some(status=>status.id==='karin_immortal'));
});

test('Bất Tử expires at round end and cannot trigger a second time in the same battle',()=>{
 const {b,karin}=fixture();
 karin.hp=karin.stats.maxHp;
 enemyHit(b,10000);
 assert.equal(karin.hp,1);
 assert.ok(karin.statuses.some(status=>status.id==='karin_immortal'));
 nextRound(b);
 assert.equal(karin.statuses.some(status=>status.id==='karin_immortal'),false,'hết vòng phải mất Bất Tử');
 assert.equal(karin.hp,1);
 enemyHit(b,10000);
 assert.equal(karin.hp,0,'lần thứ hai trong trận không được cứu');
 assert.equal(karin.statuses.some(status=>status.id==='karin_immortal'),false);
});

test('Blood Oath HP cost can also cross the threshold and grant Bất Tử',()=>{
 const {b,karin}=fixture();
 karin.hp=68;
 b.queue=[karin.id,...b.actors.filter(actor=>actor.id!==karin.id&&actor.hp>0).map(actor=>actor.id)];
 b.cursor=0;b.phase='main';b.outcome=null;
 executeAction(b,{actorId:karin.id,abilityId:'karin.blood_oath',targetId:karin.id});
 assert.ok(karin.hp<=Math.floor(karin.stats.maxHp*0.25));
 assert.ok(karin.statuses.some(status=>status.id==='karin_immortal'));
});
