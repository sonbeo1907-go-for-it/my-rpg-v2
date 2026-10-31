import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,activeActor,getActor,executeAction,abilityAvailability,basicAbility} from '../src/core/battle.js';
import {battleStat} from '../src/core/stat-values.js';
import {validateContent} from '../src/core/content.js';
import {commandAbilityIds,battlePresentation,checkCombatMode} from '../src/core/combat-modes.js';
import {roundSummons} from '../src/core/combat-summons.js';
import {skillPresentation,passivePresentation} from '../src/ui/skill-copy.js';
import {recruitCharacter} from '../src/core/economy.js';
const content=await loadContent();
function setup(party=['drake','arthur'],change=()=>{},options={}){
 const c=structuredClone(content);c.characters[party[0]].stats.speed=100;change(c);const save=createGameSave(c);save.party=party;save.unlockedCharacterIds=[...new Set([...save.unlockedCharacterIds,...party])];if(party.includes('astoria'))save.storyFlags.push('developer.astoria');
 const b=createBattle(c,save,'forest_patrol',()=>.99,options);for(const e of b.actors.filter(a=>a.team==='enemy')){e.stats.maxHp=e.hp=100000;e.stats.attack=e.stats.magic=1;e.stats.defense=e.stats.resistance=0;e.weaknesses=[];e.resistances={};}return {b,c,save};
}
function act(b,id='$defend',target){const a=activeActor(b);executeAction(b,{actorId:a.id,abilityId:id,targetId:target??a.id});}
function until(b,predicate){for(let i=0;i<200;i++){if(predicate())return;assert.equal(b.outcome,null);act(b);}throw Error('Condition unreachable');}
const ready=(b,id)=>until(b,()=>activeActor(b)?.id===id);
const drake=b=>getActor(b,'drake');

test('Sylva and Drake are official Fire/Earth Sorcerers at zero duplicates with save/recruitment compatibility',()=>{
 for(const [id,element]of [['sylva','fire'],['drake','earth']]){const a=content.characters[id];assert.equal(a.roleGroup,'sorcerer');assert.equal(a.element,element);assert.ok(content.banners.standard.characterPool.includes(id));const save=createGameSave(content);assert.equal(save.unlockedCharacterIds.includes(id),false);save.recruitmentShards=120;const next=recruitCharacter(save,content,'standard',id);assert.equal(next.extraGearSlots[id]??0,0);assert.deepEqual(decodeGameSave(encodeGameSave(next,content),content),next);}
});
test('Drake has a single preparation command before armor; stale locked actions cannot spend MP',()=>{
 const {b}=setup(),d=drake(b);assert.deepEqual(commandAbilityIds(d),['drake.armor','$defend']);assert.equal(abilityAvailability(b,d,basicAbility(d)).ok,false);assert.equal(abilityAvailability(b,d,content.abilities['drake.ward']).ok,false);assert.throws(()=>act(b,'drake.ward'),/Cần/);assert.equal(d.mp,120);
});
test('armor only arrives at next global round, never an extra turn; it grants base DEF/RES and one max-HP shield',()=>{
 const {b}=setup(),d=drake(b);act(b,'drake.armor');assert.deepEqual(d.pendingMode,{id:'earth_armor',readyRound:2});assert.equal(d.activeMode,undefined);assert.equal(d.shield,0);assert.equal(battleStat(b.content,d,'defense'),24);b.extraTurnGrants.add(d.id);b.extraPhaseRequired=true;until(b,()=>b.phase==='extra');assert.equal(d.activeMode,undefined);assert.equal(abilityAvailability(b,d,content.abilities['drake.armor']).ok,false);act(b);assert.equal(b.round,2);assert.equal(d.activeMode,'earth_armor');assert.equal(d.pendingMode,undefined);assert.equal(d.shield,215);assert.equal(battleStat(b.content,d,'defense'),29);assert.equal(battleStat(b.content,d,'resistance'),29);assert.ok(commandAbilityIds(d).includes('drake.golem'));assert.equal(commandAbilityIds(d).includes('drake.armor'),false);
 const before=d.shield;until(b,()=>b.round===3);assert.equal(d.shield,before);assert.equal(b.events.filter(e=>e.type==='mode_enter'&&e.sourceId==='drake').length,0);
});
test('mode base bonuses apply before percentages and an existing stronger shield is preserved on entry',()=>{
 const {b}=setup(),d=drake(b);d.stats.maxHp=300;d.hp=300;d.shield=400;d.shieldSourceId='arthur';act(b,'drake.armor');until(b,()=>b.round===2);assert.equal(d.shield,400);assert.equal(d.shieldSourceId,'arthur');act(b,'drake.rampart');assert.equal(battleStat(b.content,d,'defense'),36.25);assert.equal(battleStat(b.content,d,'resistance'),36.25);
});
test('Golem starts next round, attacks exactly three starts and three ends, then exits without taking a party slot',()=>{
 const {b}=setup(),d=drake(b);act(b,'drake.armor');until(b,()=>b.round===2);act(b,'drake.golem');assert.equal(d.companionStates.stone_guardian.active,false);assert.equal(b.actors.filter(a=>a.team==='party').length,2);until(b,()=>b.round===3);assert.equal(d.companionStates.stone_guardian.expiresAfterRound,5);assert.equal(d.companionStates.stone_guardian.active,true);assert.equal(b.events.filter(e=>e.abilityId==='drake.golem_start'&&e.type==='damage').length,3);until(b,()=>b.round===6);assert.equal(d.companionStates.stone_guardian,undefined);assert.equal(b.log.filter(l=>l.includes('Thạch Vệ Liên kích (FuA) đầu vòng:')).length,3);assert.equal(b.log.filter(l=>l.includes('Thạch Vệ Liên kích (FuA) cuối vòng:')).length,3);assert.equal(b.queue.some(id=>id.includes('guardian')),false);
});
test('Golem boundary hooks reserve their quotas before recursion; extra phases never add pulses',()=>{
 const {b}=setup(),d=drake(b);d.activeMode='earth_armor';d.companionStates={stone_guardian:{active:true,readyRound:1,expiresAfterRound:3,pulses:{}}};const calls=[];const io={write(){},emit(){},restore(){},outcome(){return false;},pulse(b,owner,id,name,phase){calls.push(phase);roundSummons(b,phase,io);}};
 roundSummons(b,'start',io);roundSummons(b,'start',io);b.phase='extra';roundSummons(b,'start',io);roundSummons(b,'end',io);roundSummons(b,'end',io);assert.deepEqual(calls,['start','end']);
});
test('automatic Golem pulses never consume next-attack buffs or trigger Aurora magic chains',()=>{
 const {b}=setup(['drake','aurora']);act(b,'drake.armor');until(b,()=>b.round===2);act(b,'drake.golem');const d=drake(b),buff=Object.values(content.statuses).find(s=>s.modifiers?.attackMultiplier);d.statuses.push({id:buff.id,remaining:null,sourceId:d.id});until(b,()=>b.round===3);assert.ok(d.statuses.some(s=>s.id===buff.id));assert.equal(getActor(b,'aurora').resourceValues.thunder_charge,0);assert.ok(b.events.filter(e=>e.type==='damage'&&e.sourceId==='drake').every(e=>e.automatic&&e.reaction));
});
test('owner death cancels pending armor and active/pending Golems without granting a shield or recovery',()=>{
 const {b}=setup();act(b,'drake.armor');const d=drake(b);d.hp=0;until(b,()=>b.round===2);assert.equal(d.pendingMode,undefined);assert.equal(d.activeMode,undefined);assert.equal(d.shield,0);
 const other=setup().b;act(other,'drake.armor');until(other,()=>other.round===2);act(other,'drake.golem');const owner=drake(other);owner.hp=0;until(other,()=>other.round===3);assert.equal(owner.companionStates,undefined);assert.equal(owner.activeMode,undefined);
});
test('armor preparation and Golem lifetime carry across rooms; entry cannot regrant armor shield or extend summons',()=>{
 const {b,c,save}=setup(undefined,()=>{},{continuesOnVictory:true});act(b,'drake.armor');const carried=b.actors.filter(a=>a.team==='party');const next=createBattle(c,save,'forest_patrol',()=>.99,{partyActors:carried,roundOffset:1,continuesOnVictory:true});assert.equal(drake(next).activeMode,'earth_armor');assert.equal(drake(next).shield,215);
 drake(next).shield=17;const third=createBattle(c,save,'forest_patrol',()=>.99,{partyActors:next.actors.filter(a=>a.team==='party'),roundOffset:2,continuesOnVictory:true});assert.equal(drake(third).shield,17);assert.equal(battleStat(c,drake(third),'defense'),29);
 drake(third).companionStates={stone_guardian:{active:true,readyRound:3,expiresAfterRound:5,pulses:{start:3,end:3}}};const fourth=createBattle(c,save,'forest_patrol',()=>.99,{partyActors:third.actors.filter(a=>a.team==='party'),roundOffset:4});assert.equal(drake(fourth).companionStates.stone_guardian.expiresAfterRound,5);assert.equal(drake(fourth).companionStates.stone_guardian.pulses.start,5);
});
test('final battle end clears pending entities and active modes, while a continuing victory retains them',()=>{
 const {b}=setup(),d=drake(b);d.activeMode='earth_armor';d.companionStates={stone_guardian:{active:true,readyRound:1,expiresAfterRound:3,pulses:{}}};let refunds=0;const io={write(){},emit(){},restore(){refunds++;}};
 b.outcome='victory';b.continuesOnVictory=true;checkCombatMode(b,d,'battle_end',io);assert.equal(d.activeMode,'earth_armor');assert.ok(d.companionStates);b.continuesOnVictory=false;checkCombatMode(b,d,'battle_end',io);assert.equal(d.activeMode,undefined);assert.equal(d.companionStates,undefined);assert.equal(refunds,0);
});
test('Sylva switches all three skills while Azurius is present and restores her normal kit after three rounds',()=>{
 const {b}=setup(['sylva','arthur']),s=getActor(b,'sylva');assert.ok(commandAbilityIds(s).includes('sylva.care'));assert.equal(commandAbilityIds(s).includes('sylva.wings'),false);act(b,'sylva.call');assert.equal(s.activeMode,'azurius');assert.equal(s.modeExpiresAfterRound,3);assert.equal(battleStat(b.content,s,'magic'),38);assert.ok(commandAbilityIds(s).includes('sylva.breath'));assert.equal(commandAbilityIds(s).includes('sylva.flare'),false);assert.equal(abilityAvailability(b,s,content.abilities['sylva.flare']).ok,false);until(b,()=>b.round===4);assert.equal(s.activeMode,undefined);assert.equal(battleStat(b.content,s,'magic'),32);assert.ok(commandAbilityIds(s).includes('sylva.flare'));
});
test('Azurius uses target-aware AoE and party shielding, with variant costs actually deducted',()=>{
 const {b}=setup(['sylva','arthur']),s=getActor(b,'sylva');act(b,'sylva.call');ready(b,s.id);const mp=s.mp;for(const e of b.actors.filter(a=>a.team==='enemy'))e.statuses=[];act(b,'sylva.breath','enemy_1');const hits=b.events.filter(e=>e.type==='damage'&&e.sourceId==='sylva');assert.deepEqual(hits.map(e=>e.amount),[41,83,41]);assert.equal(s.mp,mp-12);ready(b,s.id);act(b,'sylva.wings');assert.equal(s.shield,46);assert.equal(getActor(b,'arthur').shield,46);
});
test('multiple summon scenes coexist and a silent mode never masks Magnamut audio priority',()=>{
 const actors=['sylva','drake','astoria'].map(id=>({...structuredClone(content.characters[id]),hp:100,activeMode:{sylva:'azurius',drake:'earth_armor',astoria:'magnamut'}[id]}));actors[1].companionStates={stone_guardian:{active:true}};const p=battlePresentation(actors);assert.equal(p.mode,'magnamut');assert.equal(p.music,'astoria');assert.deepEqual(p.scenes.map(s=>s.mode),['azurius','earth_armor','stone_guardian','magnamut']);
});
test('Chloe heals and buffs ATK/DEF/SPD together, including a full-HP recipient; refresh never stacks',()=>{
 const {b}=setup(['chloe','arthur']),a=getActor(b,'arthur');act(b,'chloe.care','arthur');let status=a.statuses.find(s=>s.id==='chloe_comfort');assert.equal(status.remaining,2);assert.equal(battleStat(b.content,a,'attack'),a.stats.attack*1.15);assert.equal(battleStat(b.content,a,'defense'),a.stats.defense*1.15);assert.equal(battleStat(b.content,a,'speed'),a.stats.speed*1.15);ready(b,'chloe');a.hp=50;act(b,'chloe.care','arthur');assert.equal(a.hp,97);assert.equal(a.statuses.filter(s=>s.id==='chloe_comfort').length,1);
});
test('mode/companion data and concise previews preserve lifetimes, delays, base stats and no undefined values',()=>{
 for(const id of ['sylva','drake']){const a=content.characters[id];assert.doesNotMatch(JSON.stringify(passivePresentation(a,content)),/undefined|NaN/);for(const key of a.abilities)assert.doesNotMatch(JSON.stringify(skillPresentation(content.abilities[key],a,content)),/undefined|NaN/);}
 assert.match(skillPresentation(content.abilities['drake.armor'],content.characters.drake,content).facts.join(' '),/Đầu vòng sau/);assert.match(skillPresentation(content.abilities['drake.armor'],content.characters.drake,content).facts.join(' '),/100% HP tối đa/);
 for(const mutate of [c=>c.characters.sylva.combatModes.azurius.durationRounds=0,c=>c.characters.drake.combatModes.earth_armor.entryEffects[0].multiplier=Infinity,c=>c.characters.drake.companions.stone_guardian.roundEndAbility='aurora.follow_up',c=>c.characters.drake.companions.stone_guardian.durationRounds=0,c=>c.characters.sylva.combatModes.azurius.commandAbilities=['drake.ward'],c=>c.characters.drake.preModeAbility='drake.ward']){const c=structuredClone(content);mutate(c);assert.ok(validateContent(c).length);}
});

test('Golem can win at a round boundary without creating a phantom turn or extra end-round attack',()=>{
 const {b}=setup();act(b,'drake.armor');until(b,()=>b.round===2);act(b,'drake.golem');for(const enemy of b.actors.filter(a=>a.team==='enemy'))enemy.hp=1;
 for(let i=0;i<20&&!b.outcome;i++)act(b);
 assert.equal(b.outcome,'victory');assert.equal(activeActor(b),null);assert.equal(drake(b).activeMode,undefined);assert.equal(drake(b).companionStates,undefined);assert.equal(b.log.filter(l=>l.includes('Thạch Vệ Liên kích (FuA) đầu vòng:')).length,1);assert.equal(b.log.some(l=>l.includes('Thạch Vệ Liên kích (FuA) cuối vòng:')),false);
});
test('Miraebolis transitions preserve armor, Golem deadline and pending preparation; no extra entry shield',()=>{
 const c=structuredClone(content),save=createGameSave(c);save.party=['drake','sylva'];save.unlockedCharacterIds.push('drake','sylva');save.storyFlags.push('illusion.sinister_unlocked');const b=createBattle(c,save,'miraebolis_superboss',()=>.99),d=drake(b),s=getActor(b,'sylva'),boss=getActor(b,'enemy_0');
 d.activeMode='earth_armor';d.shield=17;d.companionStates={stone_guardian:{active:true,readyRound:1,expiresAfterRound:3,pulses:{}}};s.pendingMode={id:'azurius',readyRound:2};
 for(let i=0;i<2;i++){boss.hp=Math.ceil(boss.stats.maxHp*boss.boss.phases[i+1].atHpRatio)+1;b.queue=['drake','sylva'];b.cursor=0;act(b,'drake.stone',boss.id);assert.equal(boss.bossState.phase,i+2);assert.equal(d.activeMode,'earth_armor');assert.equal(d.shield,17);assert.equal(d.companionStates.stone_guardian.expiresAfterRound,3);assert.equal(s.pendingMode.readyRound,2);assert.equal(d.mp,120);assert.equal(b.events.some(e=>e.type==='mode_enter'||e.type==='mode_exit'),false);}
});
test('a defeated final enemy cancels prepared armor before it can grant a free post-victory shield',()=>{
 const {b}=setup();act(b,'drake.armor');for(const enemy of b.actors.filter(a=>a.team==='enemy'))enemy.hp=0;act(b);assert.equal(b.outcome,'victory');assert.equal(drake(b).pendingMode,undefined);assert.equal(drake(b).activeMode,undefined);assert.equal(drake(b).shield,0);
});

