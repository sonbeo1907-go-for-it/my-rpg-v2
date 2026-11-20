import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,activeActor,getActor,forecastBattleAction} from '../src/core/battle.js';
import {createArenaBattle} from '../src/core/arena.js';
import {createStoryRun,advanceStoryWave} from '../src/core/story-waves.js';
import {seededRandom} from '../src/core/random.js';
import {snapshotChronicleBattle,restoreChronicleBattle} from '../src/core/chronicle-combat.js';
import {moonlightStat,validateMoonlight} from '../src/core/moonlight-blessings.js';
import {battleStat} from '../src/core/stat-values.js';
const c=await loadContent();
function save(content=c,party=['noelle','elaine']){const s=createGameSave(content);s.unlockedCharacterIds=[...new Set([...s.unlockedCharacterIds,...party])];s.party=[...party];while(s.party.length<4)s.party.push(null);s.partyPresets[0].slots=[...s.party];return s;}
function fresh(content=c,s=save(content)){const b=createBattle(content,s,'forest_patrol',seededRandom(7));for(const a of b.actors.filter(a=>a.team==='enemy')){a.hp=a.stats.maxHp=100000;a.stats.defense=0;a.stats.resistance=0;a.weaknesses=[];}return b;}
function cast(b,id,ability,target='enemy_0'){b.queue=[id,...b.actors.filter(a=>a.id!==id&&a.hp>0).map(a=>a.id)];b.cursor=0;executeAction(b,{actorId:id,abilityId:ability,targetId:target});}
function round(b){const r=b.round;for(let n=0;n<80&&b.round===r&&!b.outcome;n++){const a=activeActor(b);executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});}assert.ok(b.round>r||b.outcome);}
function activate(b){cast(b,'noelle','noelle.thunder');cast(b,'elaine','$attack');assert.equal(b.moonlight.party.active.id,'thunder_wrath');}
test('Noelle ships in gacha with stable stats; Shashthi now grants seed access',()=>{
 assert.deepEqual(c.characters.noelle.stats,{maxHp:200,maxMp:100,attack:35,magic:5,defense:24,resistance:24,speed:20});assert.equal(c.characters.noelle.releaseId,117);
 assert.ok(c.banners.standard.characterPool.includes('noelle'));assert.ok(!c.characters.noelle.developerOnly);
 assert.deepEqual(Object.values(c.characters).filter(a=>a.moonlightBlessings?.includes('bountiful_seed')).map(a=>a.id),['shashthi']);
 assert.deepEqual(validateMoonlight(c),[]);assert.deepEqual(decodeGameSave(encodeGameSave(save(),c),c),save());
});
test('activation waits until every hit and reaction resolves, then atomically consumes both slots',()=>{
 const cc=structuredClone(c);cc.characters.elaine.basicAttack=[{type:'damage',damageType:'magical',element:'water',multiplier:1,hits:2}];const b=fresh(cc);
 cast(b,'noelle','noelle.thunder');assert.deepEqual(b.moonlight.party.slots,['thunder']);assert.equal(b.moonlight.party.active,null);
 cast(b,'elaine','$attack');const enter=b.events.findIndex(e=>e.type==='moonlight_enter');assert.ok(enter>b.events.findLastIndex(e=>e.type==='damage'));assert.equal(b.events.filter(e=>e.type==='moonlight_enter').length,1);assert.deepEqual(b.moonlight.party.slots,[]);
 assert.equal(b.moonlight.party.active.expiresAfterRound,b.round+2);assert.equal(b.actors.length,5);assert.ok(!b.queue.includes('moonlight_party'));
});
test('Noelle activation never retroactively adds Moon to the triggering action; later attacks do',()=>{
 const b=fresh();cast(b,'elaine','$attack');cast(b,'noelle','noelle.thunder');assert.ok(b.events.filter(e=>e.type==='damage'&&e.sourceId==='noelle').every(e=>!e.elements?.includes('moon')));
 cast(b,'noelle','noelle.thunder');assert.ok(b.events.filter(e=>e.type==='damage'&&e.sourceId==='noelle').every(e=>e.elements.includes('moon')));assert.deepEqual(b.moonlight.party.slots,[]);
});
test('round start/end pulse once each, FuA once per AoE without MP, expiration after final FuA',()=>{
 const b=fresh();activate(b);const n=getActor(b,'noelle'),paid=n.mp;round(b);
 const pulses=b.events.filter(e=>e.type==='ability_cast'&&e.abilityId==='moonlight.thunder_wrath');assert.equal(pulses.length,2);
 assert.equal(b.events.filter(e=>e.type==='reaction'&&e.sourceId==='noelle'&&e.abilityId==='noelle.thunder').length,2);
 assert.equal(b.moonlight.party.active.followUps.noelle.count,1); // new round's separate limiter
 assert.ok(n.mp>=paid);assert.deepEqual(b.moonlight.party.slots,[]);
 round(b);round(b);assert.equal(b.moonlight.party.active,null);const end=b.events.findIndex(e=>e.type==='moonlight_exit');assert.ok(end>b.events.findLastIndex(e=>e.type==='reaction'&&e.sourceId==='noelle'));
});
test('dynamic ATK averages living eligible characters only and does not inherit owner skill ranks',()=>{
 const b=fresh();activate(b);const n=getActor(b,'noelle'),e=getActor(b,'elaine');n.stats.attack=80;e.stats.attack=120;
 assert.equal(moonlightStat(b,'party',(a,k)=>battleStat(c,a,k)),100);e.hp=0;assert.equal(moonlightStat(b,'party',(a,k)=>battleStat(c,a,k)),80);
 assert.equal(c.abilities['moonlight.thunder_wrath'].growthProfile,'fixed');
});
test('Noelle KO does not remove active blessing; total party KO ends battle',()=>{
 const b=fresh();activate(b);getActor(b,'noelle').hp=1;cast(b,'enemy_0','$attack','noelle');round(b);assert.ok(b.moonlight.party.active);assert.ok(b.events.some(e=>e.sourceId==='moonlight_party'&&e.type==='damage'));assert.ok(!b.events.some(e=>e.type==='reaction'&&e.sourceId==='noelle'));
 getActor(b,'elaine').hp=1;cast(b,'enemy_0','$attack','elaine');assert.equal(b.outcome,'defeat');
});
test('forecast and checkpoint restore preserve pending/active state without mutating or replaying',()=>{
 const b=fresh();cast(b,'noelle','noelle.thunder');b.queue=['elaine','noelle','enemy_0'];b.cursor=0;
 const before=structuredClone(b.moonlight),trial=forecastBattleAction(b,{actorId:'elaine',abilityId:'$attack',targetId:'enemy_0'});assert.ok(trial.moonlight.party.active);assert.deepEqual(b.moonlight,before);
 cast(b,'elaine','$attack');const snap=snapshotChronicleBattle(b),restored=restoreChronicleBattle(c,snap);assert.deepEqual(restored.moonlight,b.moonlight);assert.equal(restored.events.filter(e=>e.type==='moonlight_enter').length,b.events.filter(e=>e.type==='moonlight_enter').length);
});
test('both mirror teams have independent sockets and sources, never five formation slots',()=>{
 const s=save(),b=createArenaBattle(c,s,'mirror',7);assert.ok(b.moonlight.party);assert.ok(b.moonlight.enemy);
 const enemies=b.actors.filter(a=>a.team==='enemy'),n=enemies.find(a=>a.definitionId==='noelle'),e=enemies.find(a=>a.definitionId==='elaine');
 const target=b.actors.find(a=>a.team==='party'&&a.definitionId==='noelle').id;
 cast(b,n.id,'noelle.thunder',target);cast(b,e.id,'$attack',target);assert.equal(b.moonlight.enemy.active.id,'thunder_wrath');assert.equal(b.moonlight.party.active,null);assert.ok(!b.actors.some(a=>a.actorKind==='moonlight'));
});
test('seed formula, per-target pulse, fixed anchors and earth/moon elements',()=>{
 const cc=structuredClone(c);cc.characters.iris.moonlightBlessings=['bountiful_seed'];cc.characters.iris.element='light';cc.characters.iris.basicAttack=[{type:'damage',damageType:'magical',element:'light',multiplier:1}];
 const b=fresh(cc,save(cc,['iris','garrek']));getActor(b,'iris').stats.magic=40;getActor(b,'garrek').stats.magic=20;cast(b,'iris','$attack');cast(b,'garrek','$attack');assert.equal(b.moonlight.party.active.id,'bountiful_seed');assert.equal(moonlightStat(b,'party',(a,k)=>battleStat(cc,a,k)),45);
 round(b);const hits=b.events.filter(e=>e.type==='damage'&&e.sourceId==='moonlight_party');assert.equal(hits.length,3);assert.ok(hits.every(e=>e.amount===Math.floor(45*1.5*.6)&&e.damageType==='magical'&&e.elements.includes('earth')&&e.elements.includes('moon')),JSON.stringify(hits));
 assert.equal(b.events.filter(e=>e.type==='ability_cast'&&e.abilityId==='moonlight.bountiful_seed').length,1);assert.ok(b.moonlight.party.active.targets.includes('enemy_0'));
});
test('shelter and repair use ATK, cooldowns and round-duration reduction',()=>{
 const b=fresh();cast(b,'noelle','noelle.shelter','noelle');assert.equal(getActor(b,'elaine').shield,35);assert.equal(getActor(b,'noelle').mp,90);assert.equal(getActor(b,'noelle').cooldowns['noelle.shelter'],2);
 getActor(b,'elaine').hp=50;cast(b,'noelle','noelle.repair','elaine');assert.equal(getActor(b,'elaine').hp,103);assert.equal(c.statuses.noelle_guard.durationClock,'round');
});
