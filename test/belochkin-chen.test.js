import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave} from '../src/core/game-save.js';
import {createBattle,getActor,executeAction,activeActor,targetsFor} from '../src/core/battle.js';
import {battleStat} from '../src/core/stat-values.js';
import {activeStatuses} from '../src/core/status-state.js';
import {validateContent} from '../src/core/content.js';
import {skillPresentation,passivePresentation} from '../src/ui/skill-copy.js';
const content=await loadContent();
function fixture(party,encounter='forest_patrol'){
 const c=structuredClone(content),save=createGameSave(c);
 save.party=[...party];save.partyPresets[0].slots=[...party];save.unlockedCharacterIds=[...new Set([...save.unlockedCharacterIds,...party])];
 if(encounter==='miraebolis_superboss'){save.chronicles??={};save.chronicles.books??={};save.chronicles.books.book2??={};save.chronicles.books.book2.finaleCleared=true;}
 const b=createBattle(c,save,encounter,()=>.99);
 for(const e of b.actors.filter(a=>a.team==='enemy')){if(!e.boss){e.hp=e.stats.maxHp=100000;e.stats.attack=0;e.stats.defense=e.stats.resistance=0;e.statuses=[];e.weaknesses=[];e.resistances={};e.abilities=['$defend'];}}
 return {b,c,save};
}
function act(b,id,abilityId,targetId){const actor=getActor(b,id);b.queue=[actor.id,...b.actors.filter(a=>a.id!==actor.id&&a.hp>0).map(a=>a.id)];b.cursor=0;b.phase='main';b.outcome=null;executeAction(b,{actorId:actor.id,abilityId,targetId:targetId??actor.id});}
function nextRound(b,after){const start=b.round;for(let i=0;i<100&&b.round===start;i++){const actor=activeActor(b);if(!actor)break;executeAction(b,{actorId:actor.id,abilityId:'$defend',targetId:actor.id});after?.(actor);}assert.ok(b.round>start);}

test('Belochkin command lets the player choose a different ally',()=>{
 const {b,c}=fixture(['belochkin','ardelia','iris']);const be=getActor(b,'belochkin'),ar=getActor(b,'ardelia'),ir=getActor(b,'iris');
 const ids=targetsFor(b,be,c.abilities['belochkin.command']).map(a=>a.id);assert.ok(ids.includes(ar.id));assert.ok(ids.includes(ir.id));assert.ok(!ids.includes(be.id));
 act(b,'belochkin','belochkin.command',ir.id);assert.ok(ir.statuses.some(s=>s.id==='belochkin_command'));assert.ok(b.extraTurnGrants.has(ir.id));assert.ok(!ar.statuses.some(s=>s.id==='belochkin_command'));
});
test('Belochkin and Chen have correct expedition identities',()=>{
 const be=content.characters.belochkin,ch=content.characters.chen;
 assert.equal(be.roleGroup,'offensive_support');assert.equal(be.element,'wind');assert.equal(be.affiliation,'expedition_corps');assert.deepEqual(be.stats,{maxHp:160,maxMp:90,attack:32,magic:10,defense:18,resistance:20,speed:24});
 assert.equal(be.passive.type,'round_category_mp');assert.equal(be.passive.requiredCategories,2);assert.equal(be.passive.ratio,.08);
 assert.equal(ch.roleGroup,'physical_dps');assert.equal(ch.element,'plain');assert.equal(ch.affiliation,'expedition_corps');assert.deepEqual(ch.stats,{maxHp:180,maxMp:90,attack:38,magic:8,defense:22,resistance:16,speed:16});
 assert.equal(ch.passive.type,'boss_hunter_mode');assert.equal(ch.combatModes.duelist_edge.exitCondition,'no_boss');
 assert.ok(content.banners.standard.characterPool.includes('belochkin'));assert.ok(content.banners.standard.characterPool.includes('chen'));
 assert.ok(content.pvpAiProfiles.belochkin);assert.ok(content.pvpAiProfiles.chen);assert.deepEqual(validateContent(content),[]);
});

test('Belochkin command buffs self and one ally, grants both an extra turn',()=>{
 const {b}=fixture(['belochkin','ardelia']);const be=getActor(b,'belochkin'),ar=getActor(b,'ardelia');act(b,'belochkin','belochkin.command',ar.id);
 assert.ok(be.statuses.some(s=>s.id==='belochkin_command'));assert.ok(ar.statuses.some(s=>s.id==='belochkin_command'));
 assert.ok(b.extraTurnGrants.has(be.id));assert.ok(b.extraTurnGrants.has(ar.id));
});

test('Belochkin storm applies physical amplification to every ally',()=>{
 const {b}=fixture(['belochkin','ardelia']);act(b,'belochkin','belochkin.storm',b.actors.find(a=>a.team==='enemy').id);
 for(const ally of b.actors.filter(a=>a.team==='party'))assert.ok(ally.statuses.some(s=>s.id==='belochkin_offensive'),'mỗi đồng đội nhận buff');
});
test('Thế Công Phá amplifies only physical damage and consumes one charge per action',()=>{
 const baseline=fixture(['belochkin','chen']);const e0=baseline.b.actors.find(a=>a.team==='enemy');act(baseline.b,'chen','chen.slash',e0.id);const plain=baseline.b.events.filter(e=>e.type==='damage'&&e.sourceId==='chen').reduce((n,e)=>n+e.amount,0);
 const buffed=fixture(['belochkin','chen']);act(buffed.b,'belochkin','belochkin.storm',buffed.b.actors.find(a=>a.team==='enemy').id);const e1=buffed.b.actors.find(a=>a.team==='enemy');act(buffed.b,'chen','chen.slash',e1.id);const boosted=buffed.b.events.filter(e=>e.type==='damage'&&e.sourceId==='chen').reduce((n,e)=>n+e.amount,0);
 assert.ok(boosted>plain);assert.equal(getActor(buffed.b,'chen').statuses.find(s=>s.id==='belochkin_offensive').charges,1);
});

test('Belochkin restores 8% team MP when two of three skill categories are used in the round',()=>{
 const {b}=fixture(['belochkin','ardelia','chen','iris']);const be=getActor(b,'belochkin');
 be.mp=0;act(b,'ardelia','ardelia.aegis',getActor(b,'ardelia').id);act(b,'chen','chen.slash',b.actors.find(a=>a.team==='enemy').id);
 assert.ok(b.categoryUsage.party.has('support'));assert.ok(b.categoryUsage.party.has('single'));
 be.mp=0;nextRound(b,actor=>{if(actor.id==='belochkin')be.mp=0;});
 assert.equal(be.mp,Math.ceil(be.stats.maxMp*.08));
});

test('Chen auto-enters Quyết Đấu against a boss and leaves when all bosses are down',()=>{
 const {b,c}=fixture(['chen','iris'],'miraebolis_superboss');const ch=getActor(b,'chen');
 assert.equal(ch.activeMode,'duelist_edge');assert.ok(activeStatuses(ch).some(s=>s.id==='escalation'));
 assert.ok(battleStat(c,ch,'attack')>battleStat(c,{...ch,activeMode:undefined},'attack'));
 for(const enemy of b.actors.filter(a=>a.team==='enemy'&&a.boss))enemy.hp=0;
 executeAction(b,{actorId:activeActor(b).id,abilityId:'$defend',targetId:activeActor(b).id});
 assert.equal(ch.activeMode,undefined,'không còn trùm thì rời dạng');
});

test('Chen skills apply DEF break, one exposure and six total hits',()=>{
 const {b}=fixture(['chen','iris']);const enemy=b.actors.find(a=>a.team==='enemy');
 act(b,'chen','chen.slash',enemy.id);assert.ok(enemy.statuses.some(s=>s.id==='chen_sunder'));
 act(b,'chen','chen.double',enemy.id);assert.equal(enemy.statuses.find(s=>s.id==='exposure_plain').stacks,1);
 act(b,'chen','chen.fulfill',enemy.id);assert.equal(b.events.filter(e=>e.type==='damage'&&e.sourceId==='chen').length,6);
});




test('New-unit tooltips are player-facing Vietnamese without internal modifier keys',()=>{
 const storm=skillPresentation(content.abilities['belochkin.storm'],content.characters.belochkin,content).facts.join(' ');
 assert.match(storm,/35% sát thương vật lí/);assert.doesNotMatch(storm,/damageBonus/);
 const passive=passivePresentation(content.characters.belochkin,content);
 const facts=passive.facts.join(' ');
 for(const group of ['Tạo Khiên hoặc hồi HP','Tấn công một mục tiêu','Tấn công nhiều mục tiêu'])assert.match(facts,new RegExp(group));
 assert.match(skillPresentation(content.abilities['vilgard.cleave'],content.characters.vilgard,content).facts.join(' '),/\+2 Ám Ảnh/);
 assert.match(skillPresentation(content.abilities['vilgard.reckoning'],content.characters.vilgard,content).facts.join(' '),/20% DEF/);
 assert.doesNotMatch(passivePresentation(content.characters.chen,content).rules.join(' '),/dispel/i);
});
