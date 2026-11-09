import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave} from '../src/core/game-save.js';
import {createBattle,getActor,executeAction,activeActor} from '../src/core/battle.js';
import {battleStat} from '../src/core/stat-values.js';
import {validateContent} from '../src/core/content.js';
const content=await loadContent();
function fixture(party){
 const c=structuredClone(content),save=createGameSave(c);
 save.party=[...party];save.partyPresets[0].slots=[...party];save.unlockedCharacterIds=[...new Set([...save.unlockedCharacterIds,...party])];
 const b=createBattle(c,save,'forest_patrol',()=>.99);
 for(const e of b.actors.filter(a=>a.team==='enemy')){e.hp=e.stats.maxHp=100000;e.stats.attack=0;e.stats.defense=e.stats.resistance=0;e.statuses=[];e.weaknesses=[];e.resistances={};e.abilities=['$defend'];}
 return {b,c,save};
}
function act(b,id,abilityId,targetId){const actor=getActor(b,id);b.queue=[actor.id,...b.actors.filter(a=>a.id!==actor.id&&a.hp>0).map(a=>a.id)];b.cursor=0;b.phase='main';b.outcome=null;executeAction(b,{actorId:actor.id,abilityId,targetId:targetId??actor.id});}
function nextRound(b,after){const start=b.round;for(let i=0;i<100&&b.round===start;i++){const a=activeActor(b);if(!a)break;executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});after?.(a);}assert.ok(b.round>start);}
function kill(b,id){const target=getActor(b,id);target.hp=1;const e=b.actors.find(a=>a.team==='enemy');e.stats.attack=10000;e.abilities=['$attack'];b.queue=[e.id];b.cursor=0;b.phase='main';b.outcome=null;executeAction(b,{actorId:e.id,abilityId:'$attack',targetId:target.id});}

test('Angelica locks the highest-SPD ally once at battle start and tracks life',()=>{
 const {b,c}=fixture(['angelica','belochkin','chen','ardelia']);const a=getActor(b,'angelica');
 assert.equal(a.speedLockId,'belochkin');assert.equal(battleStat(c,a,'speed'),23);
 kill(b,'belochkin');
 assert.equal(battleStat(c,a,'speed'),1,'khi người được khóa gục, SPD về 1');
});

test('Angelica seal, curse and iconic apply their authored effects',()=>{
 const {b,c}=fixture(['angelica','ardelia']);const enemies=b.actors.filter(a=>a.team==='enemy');
 act(b,'angelica','angelica.seal',b.actors.find(a=>a.team==='enemy').id);
 assert.ok(enemies.every(e=>e.statuses.some(s=>s.id==='buff_seal')));
 act(b,'angelica','angelica.curse',b.actors.find(a=>a.team==='enemy').id);
 assert.ok(enemies.every(e=>e.statuses.some(s=>s.id==='mana_disruption')&&e.statuses.some(s=>s.id==='deep_wound')&&e.statuses.some(s=>s.id==='angelica_curse')));
 const enemy=enemies[0];c.abilities['test.cd']={id:'test.cd',name:'CD thử',target:'enemy',cost:{mp:5},cooldown:2,effects:[{type:'damage',damageType:'physical',element:'plain',multiplier:1}]};enemy.abilities.push('test.cd');enemy.cooldowns={};
 act(b,'angelica','angelica.iconic',enemy.id);
 assert.equal(enemy.cooldowns['test.cd'],1,'kỹ năng có CD bị tăng 1 vòng');
 assert.equal(c.abilities['angelica.iconic'].presentation,'angelica_iconic');
});

test('Melpiphia ends the round with MP based on other living Water allies',()=>{
 const {b,c}=fixture(['melpiphia','ardelia','chen']);const m=getActor(b,'melpiphia'),ar=getActor(b,'ardelia');
 m.mp=0;ar.mp=0;nextRound(b,a=>{if(a.id==='melpiphia')m.mp=0;if(a.id==='ardelia')ar.mp=0;});
 assert.equal(m.mp,3,'1 đồng đội Thủy khác: 2,5% × 100 = 3 MP');
 assert.equal(ar.mp,4,'Ardelia hồi 2,5% × 125 = 4 MP');
});

test('Melpiphia strike creates three Water exposures and bless targets a Water ally',()=>{
 const {b}=fixture(['melpiphia','ardelia']);const enemy=b.actors.find(a=>a.team==='enemy');act(b,'melpiphia','melpiphia.strike',enemy.id);
 assert.equal(enemy.statuses.find(s=>s.id==='exposure_water').stacks,3);
 const ar=getActor(b,'ardelia');act(b,'melpiphia','melpiphia.bless',ar.id);
 assert.ok(ar.statuses.some(s=>s.id==='melpiphia_bless'));assert.ok(b.extraTurnGrants.has(ar.id));
 act(b,'melpiphia','melpiphia.undertow',enemy.id);
 assert.ok(enemy.statuses.some(s=>s.id==='melpiphia_curse'));assert.ok(b.extraTurnGrants.has(getActor(b,'melpiphia').id));
});

test('Angelica and Melpiphia enter the official roster',()=>{
 for(const id of ['angelica','melpiphia']){assert.ok(content.characters[id]);assert.ok(content.banners.standard.characterPool.includes(id));assert.ok(content.pvpAiProfiles[id]);}
 assert.equal(content.characters.angelica.stats.speed,1);assert.deepEqual(validateContent(content),[]);
});

