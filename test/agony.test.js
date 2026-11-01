import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave} from '../src/core/game-save.js';
import {createBattle,activeActor,getActor,executeAction,targetsFor,abilityAvailability,basicAbility} from '../src/core/battle.js';
import {isAlive,isInAgony,expireAgony} from '../src/core/actor-life.js';
import {resolveCombatTargets} from '../src/ui/combat-presentation.js';
import {snapshotChronicleBattle,restoreChronicleBattle} from '../src/core/chronicle-combat.js';
import {seededRandom} from '../src/core/random.js';
import {validateContent,ELEMENTS} from '../src/core/content.js';
import {passivePresentation} from '../src/ui/skill-copy.js';
const content=await loadContent();
function setup(party=['arthur','iris','elaine','garrek']){const c=structuredClone(content),s=createGameSave(c);s.party=party;s.partyPresets[0].slots=[...party];s.unlockedCharacterIds=[...new Set([...s.unlockedCharacterIds,...party.filter(Boolean)])];const b=createBattle(c,s,'drageshelmfjall_lost_lamps',seededRandom(1));for(const e of b.actors.filter(a=>a.team==='enemy')){e.stats.maxHp=200;e.hp=100;e.stats.defense=e.stats.resistance=0;}const a=getActor(b,party[0]);a.stats.attack=a.stats.magic=100;return {b,c,s,a,e:getActor(b,'enemy_0')};}
function cast(b,id,ability,target='enemy_0',endRound=false){b.queue=endRound?[id]:[id,b.actors.find(a=>a.id!==id&&isAlive(a)).id];b.cursor=0;return executeAction(b,{actorId:id,abilityId:ability,targetId:target});}
function skill(b,actor,effects,target='enemy',id='test.damage'){b.content.abilities[id]={id,name:'Test',target,effects};actor.abilities.push(id);return id;}
function finishRound(b){const ally=b.actors.find(a=>a.team==='party'&&isAlive(a));cast(b,ally.id,'$defend',ally.id,true);}
const io={write:()=>{},emit:()=>{}};

test('regional quest contains two Agony enemies, Moon weakness and both supplied BGM files',()=>{
 assert.deepEqual(validateContent(content),[]);const q=content.encounters.drageshelmfjall_lost_lamps;assert.deepEqual(q.enemies,['lampkeeper_revenant','lampkeeper_revenant']);assert.equal(q.bgm,'drageshelmfjall');assert.equal(content.music[q.bgm].tracks.length,2);assert.ok(ELEMENTS.includes('moon')&&ELEMENTS.includes('agony'));assert.ok(Object.values(content.characters).every(a=>a.element!=='moon'));assert.ok(passivePresentation(content.enemies.lampkeeper_revenant,content).rules.length>0);
});
test('zero HP enters Agony without death/victory, retains targeting and can act',()=>{
 const {b,a,e}=setup();cast(b,a.id,'$attack');assert.equal(e.hp,0);assert.equal(e.stats.maxHp,200);assert.ok(isInAgony(e));assert.ok(isAlive(e));assert.equal(e.agonyState.expiresAfterRound,2);assert.equal(b.outcome,null);assert.equal(b.events.filter(e=>e.type==='agony_enter').length,1);assert.ok(targetsFor(b,a,basicAbility(a)).includes(e));assert.ok(resolveCombatTargets(b,a,basicAbility(a),{enemyId:e.id}).legalIds.includes(e.id));assert.equal(abilityAvailability(b,e,basicAbility(e)).ok,true);cast(b,e.id,'$attack',a.id);assert.ok(b.events.some(ev=>ev.type==='damage'&&ev.sourceId===e.id));
});
test('Agony damage reduces max HP by 70% final raw damage and retains loss after repeated returns',()=>{
 const {b,a,e}=setup();cast(b,a.id,'$attack');cast(b,a.id,'$attack');assert.equal(e.hp,0);assert.equal(e.stats.maxHp,130);assert.equal(b.events.find(ev=>ev.type==='damage').maxHpDamage,70);b.round=2;expireAgony(b,io);assert.equal(e.hp,130);assert.equal(e.stats.maxHp,130);assert.equal(isInAgony(e),false);cast(b,a.id,'$attack');assert.equal(e.hp,30);cast(b,a.id,'$attack');assert.equal(e.hp,0);assert.equal(e.agonyState.cycles,2);assert.equal(e.agonyState.expiresAfterRound,3);b.round=3;expireAgony(b,io);assert.equal(e.hp,130);
});
test('multi-hit keeps attacking the same zero-HP enemy and only final max-HP death grants kill passive',()=>{
 const {b,a,e}=setup(['charlemagnes','iris',null,null]);e.hp=10;e.stats.maxHp=120;const id=skill(b,a,[{type:'damage',damageType:'physical',element:'fire',multiplier:1,hits:3}]);cast(b,a.id,id);assert.equal(b.events.filter(ev=>ev.type==='damage'&&ev.targetId===e.id).length,3);assert.equal(e.stats.maxHp,0);assert.equal(e.hp,0);assert.equal(isAlive(e),false);assert.equal(e.statuses.length,0);assert.ok(a.statuses.some(s=>s.id===a.passive.statusId));assert.equal(b.log.filter(line=>line===e.name+' gục xuống.').length,1);b.round=5;expireAgony(b,io);assert.equal(e.hp,0);
});
test('Agony element bypasses normal HP and shields, clamps HP without double subtraction and can kill directly',()=>{
 const {b,a,e}=setup();e.hp=180;e.shield=50;const id=skill(b,a,[{type:'damage',damageType:'physical',element:'agony',multiplier:1}]);cast(b,a.id,id);assert.equal(e.stats.maxHp,100);assert.equal(e.hp,100);assert.equal(e.shield,50);assert.equal(e.agonyState,undefined);assert.equal(b.events.find(ev=>ev.type==='damage').maxHpDamage,100);cast(b,a.id,id);assert.equal(e.stats.maxHp,0);assert.equal(isAlive(e),false);assert.ok(!b.events.some(ev=>ev.type==='agony_enter'));
});
test('Moon weakness multiplies by 1.5, including damage to max HP during Agony',()=>{
 const {b,a,e}=setup();e.hp=e.stats.maxHp=500;const id=skill(b,a,[{type:'damage',damageType:'magical',element:'moon',multiplier:1}]);cast(b,a.id,id);assert.equal(e.hp,350);assert.equal(b.events.find(ev=>ev.type==='damage').weakness,true);e.hp=1;cast(b,a.id,id);cast(b,a.id,id);assert.equal(e.stats.maxHp,395);assert.equal(b.events.find(ev=>ev.type==='damage').maxHpDamage,105);
});
test('old shields disappear without break procs; heal, shield and cleanse cannot undo Agony',()=>{
 const {b,a,e}=setup();e.shield=10;e.hp=1;cast(b,a.id,'$attack');const healer=getActor(b,'enemy_1'),id=skill(b,healer,[{type:'heal',flat:200},{type:'shield',flat:200},{type:'cleanse'}],'ally','test.support');cast(b,healer.id,id,e.id);assert.equal(e.hp,0);assert.equal(e.shield,0);assert.ok(isInAgony(e));assert.equal(b.events.filter(e=>['heal','shield'].includes(e.type)).length,0);
});
test('poison can enter Agony through a shield and later reduces max HP; lethal max-HP DoT kills for real',()=>{
 const {b,a,e}=setup();b.content.statuses.test_poison={id:'test_poison',name:'Poison',kind:'debuff',damageOverTime:{scalingStat:'attack',multiplier:1}};e.hp=5;e.shield=40;e.statuses.push({id:'test_poison',sourceId:a.id,potency:50,stacks:1,remaining:5});b.queue=[a.id,e.id];b.cursor=0;executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});assert.ok(isInAgony(e));assert.equal(e.shield,0);assert.equal(e.stats.maxHp,200);cast(b,e.id,'$defend',e.id);b.queue=[a.id,e.id];b.cursor=0;executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});assert.equal(e.stats.maxHp,165);e.stats.maxHp=20;b.queue=[a.id,e.id];b.cursor=0;executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});assert.equal(e.stats.maxHp,0);assert.equal(isAlive(e),false);
});
test('timeout waits through next round extra turns and is not a heal, cleanse or MP/cooldown reset',()=>{
 const {b,a,e}=setup();cast(b,a.id,'$attack');finishRound(b);assert.equal(b.round,2);assert.ok(isInAgony(e));e.mp=7;e.cooldowns.keep=9;e.statuses.push({id:'astraea_rootbound',remaining:4,sourceId:a.id});b.extraPhaseRequired=true;b.extraTurnGrants.add(e.id);b.queue=[a.id];b.cursor=0;executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});assert.equal(b.phase,'extra');assert.ok(isInAgony(e));assert.equal(activeActor(b).id,e.id);executeAction(b,{actorId:e.id,abilityId:'$attack',targetId:a.id});assert.equal(b.round,3);assert.equal(e.hp,e.stats.maxHp);assert.equal(e.mp,7);assert.ok(e.cooldowns.keep>0);assert.ok(e.statuses.some(s=>s.id==='astraea_rootbound'));assert.ok(b.log.some(s=>s.includes('trở lại từ Oán Hận')));
});
test('Aurora still follows magic that enters Agony, and max-HP death still counts as a true kill',()=>{
 const {b,a,e}=setup(['iris','aurora','elaine','garrek']);a.stats.magic=100;e.hp=1;cast(b,a.id,'$attack');assert.ok(b.events.some(ev=>ev.type==='reaction'&&ev.sourceId==='aurora'));assert.ok(e.stats.maxHp<200);assert.ok(isAlive(e));
});
test('both zero-HP ghosts prevent false victory and snapshots retain deadline, cap and targetability',()=>{
 const {b,a,e,c}=setup();const other=getActor(b,'enemy_1');cast(b,a.id,'$attack');cast(b,a.id,'$attack',other.id);assert.ok(isInAgony(e)&&isInAgony(other));assert.equal(b.outcome,null);const restored=restoreChronicleBattle(c,snapshotChronicleBattle(b));assert.ok(isAlive(getActor(restored,e.id)));assert.equal(getActor(restored,e.id).agonyState.expiresAfterRound,2);assert.equal(targetsFor(restored,getActor(restored,a.id),basicAbility(a)).length,2);
 cast(restored,a.id,'$attack');cast(restored,a.id,'$attack');cast(restored,a.id,'$attack');assert.equal(isAlive(getActor(restored,e.id)),false);assert.equal(restored.outcome,null);for(let n=0;n<3;n++)cast(restored,a.id,'$attack',other.id);assert.equal(restored.outcome,'victory');
});
test('ordinary enemies still die immediately at 0 HP and do not acquire Agony state',()=>{
 const {b,a,e}=setup();delete e.agony;delete e.group;cast(b,a.id,'$attack');assert.equal(isAlive(e),false);assert.equal(e.agonyState,undefined);
});

test('Agony-element periodic damage routes directly to max HP outside Agony without double HP damage',()=>{
 const {b,a,e}=setup();b.content.statuses.test_agony_dot={id:'test_agony_dot',name:'Agony DOT',kind:'debuff',damageOverTime:{scalingStat:'attack',multiplier:1,element:'agony'}};e.hp=80;e.shield=40;e.statuses.push({id:'test_agony_dot',sourceId:a.id,potency:50,stacks:1,remaining:2});b.queue=[a.id,e.id];b.cursor=0;executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});assert.equal(e.stats.maxHp,150);assert.equal(e.hp,80);assert.equal(e.shield,40);assert.equal(e.agonyState,undefined);
});
