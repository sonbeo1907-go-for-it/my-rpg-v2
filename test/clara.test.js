import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,executeEnemyTurn,activeActor,forecastBattleAction} from '../src/core/battle.js';
import {createArenaBattle} from '../src/core/arena.js';
import {criticalChance,criticalDamageMultiplier} from '../src/core/critical.js';
import {validateContent} from '../src/core/content.js';
import {resolveRankedAbility} from '../src/core/skill-resolver.js';
import {skillPresentation,passivePresentation} from '../src/ui/skill-copy.js';
import {combatTimeline} from '../src/ui/combat-timeline.js';
import {snapshotChronicleBattle,restoreChronicleBattle} from '../src/core/chronicle-combat.js';
import {seededRandom} from '../src/core/random.js';
const c=await loadContent(),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,a+' != '+b);
function save(){const s=createGameSave(c);s.party=['clara','arthur','iris','elaine'];s.partyPresets[0].slots=[...s.party];s.unlockedCharacterIds=[...new Set([...s.unlockedCharacterIds,...s.party])];return s;}
function fixture(){const b=createBattle(c,save(),'forest_patrol',()=>.99);for(const a of b.actors){a.hp=a.stats.maxHp=100000;a.mp=a.stats.maxMp=1000;a.stats.defense=a.stats.resistance=0;a.statuses=[];a.weaknesses=[];a.resistances={};if(a.team==='enemy'){a.stats.attack=a.stats.magic=0;a.passive=null;}}return {b,a:b.actors.find(x=>x.id==='clara'),ally:b.actors.find(x=>x.id==='arthur'),other:b.actors.find(x=>x.id==='iris'),enemies:b.actors.filter(x=>x.team==='enemy')};}
function cast(b,a,id,target=a.id){b.queue=[a.id,...b.actors.filter(x=>x.id!==a.id&&x.hp>0).map(x=>x.id)];b.cursor=0;executeAction(b,{actorId:a.id,abilityId:id,targetId:target});}
const marks=(a,id)=>a.statuses.find(s=>s.id===id),follow=b=>b.events.filter(e=>e.type==='reaction'&&e.abilityId==='clara.traces');
test('Clara is an official unique release with recruitment, AI, copy and old-save defaults',()=>{
 assert.deepEqual(validateContent(c),[]);assert.equal(c.characters.clara.releaseId,128);assert.ok(c.banners.standard.characterPool.includes('clara'));assert.ok(c.pvpAiProfiles.clara);const s=createGameSave(c);delete s.characters.clara;const restored=decodeGameSave(encodeGameSave(s,c),c);assert.ok(restored.characters.clara);assert.ok(!restored.unlockedCharacterIds.includes('clara'));assert.ok(passivePresentation(c.characters.clara,c).facts.length);
});
test('two recipients receive doubled Crit chance, damage and main-turn lifetime for a Light ally',()=>{
 const {b,a,ally}=fixture();cast(b,a,'clara.focus',ally.id);for(const x of [a,ally]){const m=marks(x,'clara_focus');assert.equal(m.remaining,4);near(criticalChance(x,false,c),.12);near(criticalDamageMultiplier(x,c),1.74);}assert.equal(a.mp,980);assert.equal(a.cooldowns['clara.focus'],3);
});
test('non-Light/Dark ally gives baseline to both and recast refreshes without stacking',()=>{
 const {b,a,ally,other}=fixture();cast(b,a,'clara.focus',ally.id);a.cooldowns={};cast(b,a,'clara.focus',other.id);for(const x of [a,other]){assert.equal(marks(x,'clara_focus').remaining,2);near(criticalChance(x,false,c),.06);near(criticalDamageMultiplier(x,c),1.62);}assert.equal(a.statuses.filter(s=>s.id==='clara_focus').length,1);
});
test('support doubles amp charges, stat strength and time for both; Rank grows only eligible groups',()=>{
 const {b,a,ally}=fixture();a.skillRanks={'clara.expedition':5};cast(b,a,'clara.expedition',ally.id);for(const x of [a,ally]){assert.equal(marks(x,'clara_expedition_amp').charges,4);near(marks(x,'clara_expedition_amp').appliedModifiers.damageBonus,.3);assert.equal(marks(x,'clara_expedition_stats').remaining,6);near(marks(x,'clara_expedition_stats').appliedModifiers.attack,.36*1.05**4);assert.ok(b.extraTurnGrants.has(x.id));}assert.equal(c.statuses.clara_expedition_amp.damageUses,2);assert.equal(c.abilities['clara.expedition'].effects[0].charges,2);
});
test('manual skill one is ranked blast, no exposure and no self passive',()=>{
 const {b,a,enemies}=fixture();a.skillRanks={'clara.traces':5};cast(b,a,'clara.traces',enemies[0].id);assert.equal(follow(b).length,0);assert.ok(!enemies.some(e=>e.statuses.some(s=>s.id.startsWith('exposure_'))));const damage=b.events.filter(e=>e.type==='damage'&&e.sourceId===a.id);assert.equal(damage.length,2);assert.equal(new Set(damage.map(e=>e.targetId)).size,2);near(resolveRankedAbility(c,a,'clara.traces').effects[0].rankDamageFactor,1.1**4);
});
test('ally Light skill triggers once per action, random blast 3/2 exposure and team MP',()=>{
 const {b,a,ally,enemies}=fixture();for(const x of b.actors)x.mp=0;ally.mp=100;cast(b,ally,'arthur.light_slash',enemies[0].id);assert.equal(follow(b).length,1);assert.equal(follow(b)[0].targetId,enemies.at(-1).id);assert.equal(marks(enemies.at(-1),'exposure_light').stacks,3);assert.equal(marks(enemies.at(-2),'exposure_light').stacks,2);assert.equal(a.mp,60);assert.equal(a.cooldowns['clara.traces'],undefined);assert.equal(a.elementObservationState.count,1);
});
test('Dark trigger applies Dark exposure, basic/defend/self/reactions do not trigger',()=>{
 const {b,a,ally,enemies}=fixture();const content=structuredClone(c);content.abilities['arthur.light_slash'].effects[0].element='dark';b.content=content;cast(b,ally,'arthur.light_slash',enemies[0].id);assert.ok(marks(enemies.at(-1),'exposure_dark'));cast(b,ally,'$attack',enemies[0].id);assert.equal(follow(b).length,0);cast(b,ally,'$defend');assert.equal(follow(b).length,0);cast(b,a,'clara.traces',enemies[0].id);assert.equal(follow(b).length,0);
});
test('shared main/extra quota, next-round reset, living recipients and dead owner',()=>{
 const {b,a,ally,enemies,other}=fixture();cast(b,ally,'arthur.light_slash',enemies[0].id);b.phase='extra';cast(b,ally,'arthur.light_slash',enemies[0].id);assert.equal(follow(b).length,1);cast(b,ally,'arthur.light_slash',enemies[0].id);assert.equal(follow(b).length,0);b.round++;other.hp=0;other.mp=0;cast(b,ally,'arthur.light_slash',enemies[0].id);assert.equal(follow(b).length,1);assert.equal(other.mp,0);a.hp=0;cast(b,ally,'arthur.light_slash',enemies[0].id);assert.equal(follow(b).length,0);
});
test('forecast cannot reserve or restore MP in the real battle',()=>{
 const {b,a,ally,enemies}=fixture();const before=JSON.stringify({hp:b.actors.map(x=>x.hp),mp:b.actors.map(x=>x.mp),state:a.elementObservationState});(b.queue=[ally.id,...b.actors.filter(x=>x.id!==ally.id).map(x=>x.id)],b.cursor=0,forecastBattleAction(b,{actorId:ally.id,abilityId:'arthur.light_slash',targetId:enemies[0].id}));assert.equal(JSON.stringify({hp:b.actors.map(x=>x.hp),mp:b.actors.map(x=>x.mp),state:a.elementObservationState}),before);
});
test('Crit status sums with weakness and caps chance/damage; expired status does not apply',()=>{
 const {a}=fixture();a.statuses=[{id:'clara_focus',remaining:4,stacks:1,appliedModifiers:{criticalChanceBonus:1,criticalDamageBonus:2}}];assert.equal(criticalChance(a,true,c),1);assert.equal(criticalDamageMultiplier(a,c),2);a.statuses[0].remaining=0;assert.equal(criticalChance(a,false,c),0);assert.equal(criticalDamageMultiplier(a,c),1.5);
});
test('Moon number presentation keeps element flags without changing ordinary damage or heal',()=>{
 const {frames}=combatTimeline([{type:'damage',sourceId:'a',targetId:'b',amount:10,element:'thunder',elements:['thunder','moon']},{type:'damage',sourceId:'a',targetId:'b',amount:10,element:'light'},{type:'heal',sourceId:'a',targetId:'b',amount:10}],c);assert.ok(frames.find(f=>f.kind==='hurt'&&f.elements?.includes('moon')));assert.ok(frames.find(f=>f.kind==='hurt'&&f.element==='light'&&!f.elements));assert.ok(frames.find(f=>f.kind==='heal'));
});

test('main-turn Crit duration survives Extra, ticks skipped main turn, and cooldown readies normally',()=>{
 const {b,a,ally}=fixture();
 function step(){const x=activeActor(b);if(x.team==='enemy')executeEnemyTurn(b);else executeAction(b,{actorId:x.id,abilityId:'$defend',targetId:x.id});}
 function seek(phase='main'){let n=0;while((activeActor(b)?.id!==a.id||b.phase!==phase)&&n++<200)step();assert.ok(n<200);}
 seek();executeAction(b,{actorId:a.id,abilityId:'clara.focus',targetId:ally.id});b.extraTurnGrants.add(a.id);b.extraPhaseRequired=true;seek('extra');step();assert.equal(marks(a,'clara_focus').remaining,4);
 for(let i=0;i<3;i++){seek();step();}seek();assert.equal(marks(a,'clara_focus').remaining,1);assert.equal(a.cooldowns['clara.focus'],0);
 executeAction(b,{actorId:a.id,abilityId:'clara.focus',targetId:ally.id});a.statuses.push({id:'stunned',remaining:1,stacks:1});let n=0;while(marks(a,'stunned')&&n++<200)step();assert.ok(n<200);assert.equal(marks(a,'clara_focus').remaining,3);
});
test('Extra Turn granted to both resolves through real queues without adding turns in Extra',()=>{
 const {b,a,ally}=fixture();
 function step(){const x=activeActor(b);if(x.team==='enemy')executeEnemyTurn(b);else executeAction(b,{actorId:x.id,abilityId:'$defend',targetId:x.id});}
 let n=0;while(activeActor(b)?.id!==a.id&&n++<100)step();executeAction(b,{actorId:a.id,abilityId:'clara.expedition',targetId:ally.id});const seen=[];while(b.phase!=='extra'&&n++<100)step();while(b.phase==='extra'&&n++<100){seen.push(activeActor(b).id);step();}assert.deepEqual(new Set(seen),new Set([a.id,ally.id]));assert.ok(n<100);assert.equal(marks(a,'clara_expedition_amp').charges,4);
});
test('a multi-hit ally cast triggers once and Clara followups cannot call a second Clara',()=>{
 const {b,a,ally,enemies}=fixture();const content=structuredClone(c);content.abilities['arthur.light_slash'].effects[0].hits=3;b.content=content;const twin=structuredClone(a);twin.id='clara-twin';twin.formationSlot=4;b.actors.push(twin);cast(b,ally,'arthur.light_slash',enemies[0].id);assert.equal(follow(b).length,2);assert.equal(a.elementObservationState.count,1);assert.equal(twin.elementObservationState.count,1);
});
test('complete dodge does not trigger observations and passive heal does not revive allies',()=>{
 const {b,a,ally,enemies}=fixture();const content=structuredClone(c);content.statuses.testing_evasion={id:'testing_evasion',kind:'buff',modifiers:{evasion:1}};b.content=content;for(const e of enemies)e.statuses=[{id:'testing_evasion',remaining:3,stacks:1}];b.random=()=>0;cast(b,ally,'arthur.light_slash',enemies[0].id);assert.equal(follow(b).length,0);assert.equal(a.elementObservationState,undefined);
});
test('mirror teams have isolated quotas, buff targets, blast formation and snapshot continuity',()=>{
 for(const team of ['party','enemy']){const b=createArenaBattle(c,save(),'mirror',91);for(const x of b.actors){x.hp=x.stats.maxHp=100000;x.mp=x.stats.maxMp=1000;x.statuses=[];x.weaknesses=[];x.resistances={};x.stats.defense=x.stats.resistance=0;}
 const a=b.actors.find(x=>x.team===team&&x.definitionId==='clara'),ally=b.actors.find(x=>x.team===team&&x.definitionId==='arthur'),enemy=b.actors.find(x=>x.team!==team&&x.definitionId==='arthur'),otherClara=b.actors.find(x=>x.team!==team&&x.definitionId==='clara');
 cast(b,a,'clara.focus',ally.id);near(criticalChance(a,false,c),.12);near(criticalChance(ally,false,c),.12);assert.equal(criticalChance(otherClara,false,c),0);
 cast(b,ally,'arthur.light_slash',enemy.id);assert.equal(follow(b).length,1);assert.equal(a.elementObservationState.count,1);assert.equal(otherClara.elementObservationState,undefined);assert.ok(b.events.filter(e=>e.type==='damage'&&e.sourceId===a.id).every(e=>e.pvpDamage));
 const copy=restoreChronicleBattle(c,snapshotChronicleBattle(b));assert.deepEqual(copy.actors.find(x=>x.id===a.id).elementObservationState,a.elementObservationState);cast(copy,copy.actors.find(x=>x.id===ally.id),'arthur.light_slash',enemy.id);assert.equal(copy.actors.find(x=>x.id===a.id).elementObservationState.count,2);
 }
});
test('invalid passive and conditional support schema are rejected',()=>{
 for(const mutate of [x=>x.characters.clara.passive.perRound=0,x=>x.characters.clara.passive.followUpAbility='missing',x=>x.abilities['clara.focus'].selectedAllyBuffBonus.elements=['unknown'],x=>x.statuses.clara_focus.modifiers.criticalChanceBonus=2]){const content=structuredClone(c);mutate(content);assert.ok(validateContent(content).length);}
 const actor=c.characters.clara;for(const id of actor.abilities){const view=skillPresentation(c.abilities[id],actor,c);assert.ok(view.summary);assert.ok(!JSON.stringify(view).includes('criticalChanceBonus'));}
});

test('resolved hit uses Clara Crit chance/damage buff, while Moon damage remains unable to Crit',()=>{
 const {b,a,ally,enemies}=fixture();b.random=()=>.1;cast(b,a,'clara.focus',ally.id);cast(b,ally,'arthur.light_slash',enemies[0].id);const hit=b.events.find(e=>e.type==='damage'&&e.sourceId===ally.id);assert.equal(hit.critical,true);near(hit.criticalMultiplier,1.74);
 const content=structuredClone(c);content.abilities['arthur.light_slash'].effects[0].additionalElements=['moon'];b.content=content;cast(b,ally,'arthur.light_slash',enemies[0].id);const moon=b.events.find(e=>e.type==='damage'&&e.sourceId===ally.id);assert.ok(moon.elements.includes('moon'));assert.ok(!moon.critical);
});
