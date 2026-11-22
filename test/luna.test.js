import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,activeActor,getActor,abilityAvailability,forecastBattleAction,moonlightSnapshot} from '../src/core/battle.js';
import {resolveCharacter} from '../src/core/progression.js';
import {battleStat} from '../src/core/stat-values.js';
import {syncTeamStatAuras} from '../src/core/knight-passives.js';
import {resolveRankedAbility} from '../src/core/skill-resolver.js';
import {createArenaBattle} from '../src/core/arena.js';
import {battlePresentation} from '../src/core/combat-modes.js';
import {validateContent} from '../src/core/content.js';
import {skillPresentation,passivePresentation} from '../src/ui/skill-copy.js';
import {moonlightAccess,moonlightAspectAbility,lunarBaseDamageMultiplier,lunarOutgoingAmp} from '../src/core/lunar-support.js';
import {createDungeonRun,advanceDungeonWave} from '../src/core/dungeon.js';
const c=await loadContent(),near=(a,b,tolerance=1e-8)=>assert.ok(Math.abs(a-b)<=tolerance,a+' != '+b);
function account(party=['luna','noelle','shashthi','bianca'],gear={}){const s=createGameSave(c);s.party=party;s.partyPresets[0].slots=[...party];s.unlockedCharacterIds=[...new Set([...s.unlockedCharacterIds,...party])];for(const[id,recipes]of Object.entries(gear))for(const effectId of recipes){const gearId='rune_'+(++s.craftedGearSerial);s.gear.push({id:gearId,typeId:'t4_effect',effectId,stats:{}});(s.equipment[id]??=[]).push(gearId);}return s;}
function setup(party,gear){const b=createBattle(structuredClone(c),account(party,gear),'forest_patrol',()=>.99);for(const a of b.actors.filter(a=>a.team==='enemy')){a.hp=a.stats.maxHp=100000;a.stats.attack=a.stats.magic=a.stats.defense=a.stats.resistance=0;a.weaknesses=[];}return b;}
function cast(b,id,ability,target){b.queue=[id,...b.actors.filter(a=>a.id!==id&&a.hp>0).map(a=>a.id)];b.cursor=0;executeAction(b,{actorId:id,abilityId:ability,targetId:target??b.actors.find(a=>a.team!==getActor(b,id).team&&a.hp>0).id});}
function next(b){const r=b.round,events=[];for(let i=0;i<80&&b.round===r&&!b.outcome;i++){const a=activeActor(b);executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});events.push(...b.events);}assert.equal(b.round,r+1);return events;}
function activate(b,id='bountiful_seed'){if(id==='bountiful_seed'){cast(b,'shashthi','$attack');cast(b,'bianca','$attack');}else{cast(b,'noelle','noelle.thunder');cast(b,b.actors.find(a=>a.element==='water'&&a.team==='party').id,'$attack');}assert.equal(b.moonlight.party.active.id,id);}
const damage=(events,id,target='enemy_0')=>events.filter(e=>e.type==='damage'&&e.sourceId===id&&e.targetId===target);

test('Luna is official, grants both live recipes, and does not register unfinished blessings',()=>{
 assert.equal(c.characters.luna.releaseId,122);assert.ok(c.banners.standard.characterPool.includes('luna'));assert.deepEqual(c.characters.luna.stats,{maxHp:300,maxMp:130,defense:20,resistance:25,attack:10,magic:10,speed:24});
 assert.deepEqual(moonlightAccess(c.characters.luna,c).sort(),['bountiful_seed','nameless_song','thunder_wrath']);assert.equal(Object.keys(c.moonlightBlessings).length,3);
 const s=account();assert.deepEqual(decodeGameSave(encodeGameSave(s,c),c),s);
 for(const [party,sequence,wanted]of [[['luna','tywin','iris','garrek'],['garrek','tywin'],'thunder_wrath'],[['luna','arthur','lyon','iris'],['arthur','lyon'],'bountiful_seed']]){
  const b=setup(party);if(wanted==='thunder_wrath'){b.content.characters.garrek.element='thunder';getActor(b,'garrek').element='thunder';}
  for(const id of sequence)cast(b,id,'$attack');assert.equal(b.moonlight.party.active.id,wanted);
 }
});
test('both active skills deal magical Plain damage from dynamic max HP, not current HP or MAG',()=>{
 const values=[];for(const hp of [300,90]){const b=setup(),a=getActor(b,'luna');a.hp=hp;a.stats.magic=999;cast(b,a.id,'luna.lament');const hit=damage(b.events,a.id)[0];values.push(hit.amount);assert.equal(hit.damageType,'magical');assert.equal(hit.element,'plain');assert.equal(hit.amount,60);const debuff=getActor(b,'enemy_0').statuses.find(s=>s.id==='luna_lament');assert.equal(debuff.remaining,3);assert.equal(a.mp,120);}
 assert.equal(values[0],values[1]);const b=setup(undefined,{luna:['moonlit_covenant']});assert.equal(getActor(b,'luna').stats.maxHp,375);cast(b,'luna','luna.lament');assert.equal(damage(b.events,'luna')[0].amount,75);
});
test('promise grants ranked base stats once, doubles only when blessing is already active, and respects seals',()=>{
 for(const active of [false,true]){const b=setup(),a=getActor(b,'luna');if(active)activate(b);a.skillRanks={'luna.promise':5};cast(b,a.id,'luna.promise');for(const ally of b.actors.filter(a=>a.team==='party')){const s=ally.statuses.find(s=>s.id==='luna_promise');near(s.baseStatModifiers.attack,6*1.05**4*(active?2:1));near(s.baseStatModifiers.magic,s.baseStatModifiers.attack);assert.ok(s.remaining===3||s.remaining===4);}assert.equal(a.cooldowns['luna.promise'],3);assert.equal(a.mp,120);}
 const b=setup(),ally=getActor(b,'bianca'),seal=Object.values(c.statuses).find(s=>s.buffRejection);ally.statuses.push({id:seal.id,charges:1,remaining:null,stacks:1,sourceId:'enemy_0'});cast(b,'luna','luna.promise');assert.ok(!ally.statuses.some(s=>s.id==='luna_promise'));
});
test('mode entry cleanses every ally and grants a single ward; aura is not a debuff and is immediately visible',()=>{
 const b=setup(),enemy=getActor(b,'enemy_0');enemy.stats.attack=100;enemy.stats.magic=50;
 for(const a of b.actors.filter(a=>a.team==='party'))a.statuses.push({id:'exposure_dark',remaining:null,stacks:3,sourceId:enemy.id},{id:'luna_lament',remaining:3,stacks:1,sourceId:enemy.id});
 cast(b,'luna','luna.song','luna');for(const a of b.actors.filter(a=>a.team==='party')){assert.ok(!a.statuses.some(s=>c.statuses[s.id].kind==='debuff'));assert.equal(a.statuses.find(s=>s.id==='effect_ward').charges,1);}
 near(battleStat(c,enemy,'attack'),80);near(battleStat(c,enemy,'magic'),40);assert.ok(!enemy.statuses.some(s=>c.statuses[s.id].kind==='debuff'));assert.equal(getActor(b,'luna').mp,110);assert.equal(getActor(b,'luna').modeExpiresAfterRound,5);assert.equal(getActor(b,'luna').cooldowns['luna.song'],4);
 assert.equal(battlePresentation(b.actors).music,'song_of_the_moon');assert.equal(battlePresentation(b.actors).background,'/art/luna-moonfield.svg');
});
test('mode start/end hooks use global rounds, keep fifth-round effect, then restore aura and music',()=>{
 const b=setup();activate(b);cast(b,'luna','luna.song','luna');const owner=getActor(b,'luna'),ally=getActor(b,'bianca'),enemy=getActor(b,'enemy_0');enemy.stats.attack=100;
 ally.statuses.push({id:'exposure_dark',remaining:null,stacks:2,sourceId:enemy.id},{id:'luna_lament',remaining:3,stacks:1,sourceId:enemy.id});
 const first=next(b);assert.equal(b.round,2);assert.equal(ally.statuses.filter(s=>c.statuses[s.id].kind==='debuff').length,1);assert.equal(ally.statuses.find(s=>s.id==='effect_ward').charges,1);assert.equal(first.filter(e=>e.type==='ability_cast'&&e.abilityId==='luna.renew').length,1);assert.equal(damage(first,owner.id).filter(e=>e.abilityId==='luna.pulse').length,1);
 next(b);const third=next(b);assert.equal(b.round,4);assert.equal(owner.activeMode,'moon_song');assert.equal(b.moonlight.party.active,null);assert.ok(damage(third,owner.id).some(e=>e.abilityId==='luna.pulse'));
 assert.equal(damage(next(b),owner.id).filter(e=>e.abilityId==='luna.pulse').length,0);assert.equal(owner.activeMode,'moon_song');assert.equal(abilityAvailability(b,owner,c.abilities['luna.song']).ok,false);
 activate(b);const fifth=next(b);assert.ok(damage(fifth,owner.id).some(e=>e.abilityId==='luna.pulse'));assert.equal(owner.activeMode,undefined);near(battleStat(c,enemy,'attack'),100);assert.equal(battlePresentation(b.actors),null);assert.equal(abilityAvailability(b,owner,c.abilities['luna.song']).ok,true);
});
test('end pulse matches currently active blessing: physical Thunder-Moon or magical Earth-Moon',()=>{
 for(const id of ['thunder_wrath','bountiful_seed']){const b=setup(id==='thunder_wrath'?['luna','noelle','tywin','iris']:undefined);activate(b,id);cast(b,'luna','luna.song','luna');const events=next(b),hit=damage(events,'luna').find(e=>e.abilityId==='luna.pulse');assert.ok(hit);assert.equal(hit.damageType,id==='thunder_wrath'?'physical':'magical');assert.ok(hit.elements.includes('moon'));assert.ok(hit.elements.includes(id==='thunder_wrath'?'thunder':'earth'));assert.equal(hit.amount,Math.floor(300*.5*1.1*1.3*.6*hit.weaknessMultiplier));}
 const b=setup();cast(b,'luna','luna.song','luna');assert.equal(damage(next(b),'luna').filter(e=>e.abilityId==='luna.pulse').length,0);
});
test('mode Rank grows only end-pulse damage, not field, wards, duration, MP or debuff removal',()=>{
 const samples=[];for(const rank of [1,5]){const b=setup();activate(b);const a=getActor(b,'luna');a.skillRanks={'luna.song':rank};const skill=resolveRankedAbility(c,a,'luna.song');assert.deepEqual(skill.growthGroups,['damage']);cast(b,a.id,skill.id,a.id);assert.equal(a.mp,110);assert.equal(a.modeExpiresAfterRound,5);assert.equal(a.combatModes.moon_song.moonlightField.moonDamageTaken,.3);samples.push(damage(next(b),a.id).find(e=>e.abilityId==='luna.pulse').amount);}
 near(samples[1],samples[0]*1.1**4,2);
});
test('native 10% applies to allied Moon hits and blessing sources, never non-Moon or opposing hits',()=>{
 for(const ownerAlive of [true,false]){const b=setup();activate(b);const a=getActor(b,'luna');if(!ownerAlive)a.hp=0;const before=structuredClone(b.moonlight.party.active);cast(b,'bianca','bianca.harvest','enemy_1');const hit=damage(b.events,'moonlight_party','enemy_1')[0];const power=getActor(b,'moonlight_party').stats.magic;near(hit.amount,Math.floor(power*3.8*1.2*(ownerAlive?1.1:1)),1);assert.equal(b.moonlight.party.active.expiresAfterRound,before.expiresAfterRound);assert.equal(lunarBaseDamageMultiplier(b,getActor(b,'enemy_0'),{element:'moon'}),1);assert.equal(lunarBaseDamageMultiplier(b,a,{element:'plain'}),1);}
});
test('moonlit gear static stats, conditional doubling and lunar amp are exact and reversible',()=>{
 const s=account(undefined,{bianca:['moonlit_duet'],luna:['moonlit_covenant']});assert.deepEqual(decodeGameSave(encodeGameSave(s,c),c),s);near(resolveCharacter(c,s,'bianca').stats.magic,36*1.15);assert.equal(resolveCharacter(c,s,'luna').stats.maxHp,375);
 const b=setup(undefined,{bianca:['moonlit_duet']});const a=getActor(b,'bianca');near(battleStat(c,a,'magic'),36*1.15);activate(b);near(battleStat(c,a,'magic'),36*1.3);cast(b,a.id,'bianca.harvest','enemy_1');const own=damage(b.events,a.id,'enemy_1')[0];near(own.amount,Math.floor(36*1.3*1.2*1.1*1.25),1);while(b.round<4)next(b);near(battleStat(c,a,'magic'),36*1.15);
});
test('team +8 aura does not stack across wearers, is applied before skill buffs, and stops when no living wearer remains',()=>{
 const b=setup(undefined,{luna:['moonlit_covenant'],noelle:['moonlit_covenant']}),a=getActor(b,'bianca');activate(b);near(battleStat(c,a,'magic'),44);cast(b,'shashthi','shashthi.gift',a.id);near(battleStat(c,a,'magic'),44*1.9);getActor(b,'luna').hp=0;syncTeamStatAuras(b);near(battleStat(c,a,'magic'),44*1.9);getActor(b,'noelle').hp=0;syncTeamStatAuras(b);near(battleStat(c,a,'magic'),36*1.9);
});
test('new gear obeys crafting recipe validation and cannot be equipped twice in one effect group',()=>{
 const s=account(undefined,{bianca:['moonlit_duet','moonlit_duet']});assert.throws(()=>createBattle(c,s,'forest_patrol'));assert.deepEqual(validateContent(c),[]);for(const change of [x=>x.gearEffects.moonlit_duet.effect.moonDamageBonus=2,x=>x.gearEffects.moonlit_covenant.effect.teamBaseBonuses.attack=9,x=>x.characters.luna.combatModes.moon_song.moonlightField.roundEndAbility='missing']){const cc=structuredClone(c);change(cc);assert.ok(validateContent(cc).length);}
});
test('forecast entry/promise is pure, includes aura and doubling, and matches execution',()=>{
 const b=setup();activate(b);const a=getActor(b,'luna');b.queue=[a.id,...b.actors.filter(x=>x.id!==a.id).map(x=>x.id)];b.cursor=0;const before=structuredClone({a,moon:b.moonlight}),cmd={actorId:a.id,abilityId:'luna.song',targetId:a.id};const trial=forecastBattleAction(b,cmd);assert.deepEqual({a,moon:b.moonlight},before);assert.equal(getActor(trial,a.id).activeMode,'moon_song');executeAction(b,cmd);assert.equal(getActor(trial,a.id).mp,a.mp);assert.deepEqual(getActor(trial,'enemy_0').lunarModifiers,getActor(b,'enemy_0').lunarModifiers);
});
test('Luna death ends mode aura/background and native bonus while the existing blessing survives',()=>{
 const b=setup();activate(b);cast(b,'luna','luna.song','luna');const a=getActor(b,'luna'),enemy=getActor(b,'enemy_0');a.hp=0;cast(b,'noelle','$defend','noelle');assert.equal(a.activeMode,undefined);assert.equal(battlePresentation(b.actors),null);assert.equal(b.moonlight.party.active.id,'bountiful_seed');syncTeamStatAuras(b);assert.deepEqual(enemy.lunarModifiers,{});
});
test('dungeon carry preserves mode deadline and does not replay entry cleanse or ward',()=>{
 const run=createDungeonRun(c,account(),'gold_mine','easy',{random:()=>0,rewardRandom:()=>0,now:new Date('2026-11-21T05:00:00Z')});cast(run.battle,'luna','luna.song','luna');const owner=getActor(run.battle,'luna'),deadline=owner.modeExpiresAfterRound;run.battle.outcome='victory';advanceDungeonWave(c,run);assert.equal(getActor(run.battle,'luna').activeMode,'moon_song');assert.equal(getActor(run.battle,'luna').modeExpiresAfterRound,deadline);assert.ok(!run.battle.events.some(e=>e.type==='mode_enter'));assert.equal(battlePresentation(run.battle.actors).music,'song_of_the_moon');
});
test('PvP has symmetric independent fields, access and gear auras and clamps mode Rank to five',()=>{
 const b=createArenaBattle(c,account(undefined,{luna:['moonlit_covenant']}),'mirror',122);for(const a of b.actors){a.hp=a.stats.maxHp=100000;a.stats.defense=a.stats.resistance=0;}const id=(team,name)=>b.actors.find(a=>a.team===team&&a.definitionId===name).id;
 for(const team of ['party','enemy']){const owner=getActor(b,id(team,'luna'));owner.skillRanks={'luna.song':8};assert.equal(resolveRankedAbility(c,owner,'luna.song').skillRank,5);cast(b,owner.id,'luna.song',owner.id);assert.equal(owner.activeMode,'moon_song');assert.deepEqual(b.moonlight[team].allowed,['bountiful_seed','nameless_song','thunder_wrath']);}
 assert.ok(b.actors.every(a=>a.lunarModifiers.attack===-.2&&a.lunarModifiers.magic===-.2));
});
test('copy presents dynamic max HP, supported recipes, fixed field values and ranked end damage',()=>{
 const a=getActor(setup(),'luna');a.skillRanks={'luna.song':5};const facts=skillPresentation(c.abilities['luna.song'],a,c).facts.join(' ');assert.ok(facts.includes('73,21% HP'));assert.ok(facts.includes('30%'));assert.ok(facts.includes('5 vòng'));assert.ok(JSON.stringify(passivePresentation(a,c)).includes('10%'));assert.equal(moonlightAspectAbility(setup(),a,c.abilities['luna.pulse']),null);
});

test('stun skips Luna active turn but never stops global mode hooks, and Extra Turns never duplicate them',()=>{
 const b=setup();activate(b);cast(b,'luna','luna.song','luna');getActor(b,'noelle').stats.speed=30;
 next(b);assert.equal(activeActor(b).id,'noelle');getActor(b,'luna').statuses.push({id:'stunned',remaining:1,stacks:1,sourceId:'enemy_0'});
 executeAction(b,{actorId:'noelle',abilityId:'$defend',targetId:'noelle'});assert.ok(b.log.some(line=>line.includes('Luna bị choáng')));assert.equal(getActor(b,'luna').modeExpiresAfterRound,5);assert.equal(getActor(b,'luna').activeMode,'moon_song');const events=next(b);assert.equal(damage(events,'luna').filter(e=>e.abilityId==='luna.pulse').length,1);
 const extra=setup();activate(extra);cast(extra,'luna','luna.song','luna');cast(extra,'bianca','bianca.opening');const round=next(extra);assert.equal(damage(round,'luna').filter(e=>e.abilityId==='luna.pulse').length,1);assert.equal(round.filter(e=>e.type==='ability_cast'&&e.abilityId==='luna.renew').length,1);
});
test('periodic Moon damage receives Luna support, lunar gear and hostile field once each',()=>{
 const b=setup(undefined,{noelle:['moonlit_duet']});activate(b);cast(b,'luna','luna.song','luna');b.content.statuses.test_moon_dot={id:'test_moon_dot',name:'Độc nguyệt thử nghiệm',kind:'debuff',damageOverTime:{element:'moon'}};
 getActor(b,'enemy_0').statuses.push({id:'test_moon_dot',remaining:2,stacks:1,potency:100,sourceId:'noelle'});b.queue=['luna','enemy_0','noelle','shashthi','bianca','enemy_1','enemy_2'];b.cursor=0;executeAction(b,{actorId:'luna',abilityId:'$defend',targetId:'luna'});const tick=damage(b.events,'noelle').find(e=>e.periodic);assert.ok(tick);assert.equal(tick.amount,Math.floor(100*1.1*1.25*1.3));
});
test('universal access automatically includes future registered pairs without adding unfinished content today',()=>{
 const content=structuredClone(c);content.moonlightBlessings.nameless_song={id:'nameless_song',elements:['light','dark']};content.moonlightBlessings.chaotic_eclipse={id:'chaotic_eclipse',elements:['water','fire']};assert.equal(moonlightAccess(content.characters.luna,content).length,4);assert.equal(Object.keys(c.moonlightBlessings).length,3);
});

test('native lunar increase also covers flat skill damage supplied by Ariel before amplification',()=>{
 const amounts=[];for(const alive of [true,false]){const b=setup(['luna','shashthi','bianca','ariel']);activate(b);cast(b,'ariel','ariel.spotlight','bianca');assert.ok(getActor(b,'bianca').statuses.some(s=>s.flatSkillBonus>0));if(!alive)getActor(b,'luna').hp=0;cast(b,'bianca','bianca.opening');amounts.push(damage(b.events,'bianca')[0].amount);}near(amounts[0],amounts[1]*1.1,2);
});
﻿
test('Song Nguyet boosts every commanded seed hit exactly once while keeping its independent source and rank',()=>{
 const b=setup(undefined,{bianca:['moonlit_duet']});activate(b);getActor(b,'bianca').skillRanks={'bianca.harvest':5};
 b.queue=['bianca',...b.actors.filter(a=>a.id!=='bianca'&&a.hp>0).map(a=>a.id)];b.cursor=0;
 const before=structuredClone(b.moonlight),trial=forecastBattleAction(b,{actorId:'bianca',abilityId:'bianca.harvest',targetId:'enemy_1'});assert.deepEqual(b.moonlight,before);
 cast(b,'bianca','bianca.harvest','enemy_1');assert.deepEqual(damage(trial.events,'moonlight_party','enemy_1').map(h=>h.amount),damage(b.events,'moonlight_party','enemy_1').map(h=>h.amount));
 const commanded=damage(b.events,'moonlight_party','enemy_1'),power=getActor(b,'moonlight_party').stats.magic;
 assert.equal(commanded.length,3);for(const h of commanded)near(h.amount,Math.floor(power*3.8*1.1**4*1.2*1.1*1.25),1);
 assert.ok(b.events.some(e=>e.type==='reaction'&&e.sourceId==='moonlight_party'));assert.equal(getActor(b,'moonlight_party').gearEffects,undefined);
 const natural=damage(next(b),'moonlight_party','enemy_1');assert.equal(natural.length,1);near(natural[0].amount,Math.floor(getActor(b,'moonlight_party').stats.magic*1.5*1.2*1.1*.6),1);
});

test('commanded thunder borrows only the commander amp, never leaks it into Noelle response or another order',()=>{
 const b=setup(['luna','noelle','tywin','flynn'],{flynn:['moonlit_duet']});activate(b,'thunder_wrath');for(const e of b.actors.filter(a=>a.team==='enemy'))e.statuses=[];
 const a=getActor(b,'flynn');a.resourceValues[Object.keys(a.resources)[0]]=2;cast(b,'flynn','flynn.burst','enemy_0');let power=getActor(b,'moonlight_party').stats.attack;
 near(damage(b.events,'moonlight_party')[0].amount,Math.floor(power*3.6*1.1*1.25),1);
 const noelle=damage(b.events,'noelle')[0];near(noelle.amount,Math.floor(battleStat(c,getActor(b,'noelle'),'attack')*1.5*1.1),1);
 a.gearEffects=[];for(const e of b.actors.filter(a=>a.team==='enemy'))e.statuses=[];cast(b,'flynn','flynn.burst','enemy_0');power=getActor(b,'moonlight_party').stats.attack;
 near(damage(b.events,'moonlight_party')[0].amount,Math.floor(power*3.6*1.1),1);
});

test('lunar command gear chooses same-side commander, preserves ordinary Moon hits, and ignores non-Moon effects',()=>{
 const b=setup(undefined,{bianca:['moonlit_duet']}),s={id:'moonlight_party',actorKind:'moonlight',team:'party'};activate(b);
 assert.equal(lunarOutgoingAmp(b,s,{element:'moon'},{moonlightCommanderId:'bianca'}),1.25);
 assert.equal(lunarOutgoingAmp(b,s,{element:'earth'},{moonlightCommanderId:'bianca'}),1);
 b.moonlight.enemy=structuredClone(b.moonlight.party);assert.equal(lunarOutgoingAmp(b,{...s,team:'enemy'},{element:'moon'},{moonlightCommanderId:'bianca'}),1);
 assert.equal(lunarOutgoingAmp(b,s,{element:'moon'}),1);
 assert.equal(lunarOutgoingAmp(b,getActor(b,'bianca'),{element:'moon'},{moonlightCommanderId:'luna'}),1.25);
});


test('PvP mirror commanded gear uses each runtime unit ID and never borrows opposing gear',()=>{
 const b=createArenaBattle(c,account(undefined,{bianca:['moonlit_duet']}),'mirror',122);for(const a of b.actors){a.hp=a.stats.maxHp=100000;a.stats.defense=a.stats.resistance=0;}
 const id=(team,name)=>b.actors.find(a=>a.team===team&&a.definitionId===name).id;
 for(const team of ['party','enemy']){
  const target=id(team==='party'?'enemy':'party','noelle');cast(b,id(team,'shashthi'),'$attack',target);cast(b,id(team,'bianca'),'$attack',target);assert.equal(b.moonlight[team].active.id,'bountiful_seed');
  cast(b,id(team,'bianca'),'bianca.harvest',target);assert.equal(damage(b.events,'moonlight_'+team,target).length,3);
  const source=getActor(b,'moonlight_'+team);assert.equal(lunarOutgoingAmp(b,source,{element:'moon'},{moonlightCommanderId:id(team,'bianca')}),1.25);assert.equal(lunarOutgoingAmp(b,source,{element:'moon'},{moonlightCommanderId:id(team==='party'?'enemy':'party','bianca')}),1);
 }
});
