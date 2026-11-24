import {skillPresentation} from '../src/ui/skill-copy.js';
import {skillScaling} from '../src/ui/skill-presentation.js';
import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,activeActor,getActor,targetsFor,abilityAvailability,forecastBattleAction,moonlightSnapshot} from '../src/core/battle.js';
import {changeRevelation,activeMoonlight} from '../src/core/moonlight-revelation.js';
import {resolveRankedAbility} from '../src/core/skill-resolver.js';
import {battleStat} from '../src/core/stat-values.js';
import {syncTeamStatAuras} from '../src/core/knight-passives.js';
import {createArenaBattle} from '../src/core/arena.js';
import {validateContent} from '../src/core/content.js';
import {createDungeonRun,advanceDungeonWave} from '../src/core/dungeon.js';
import {mpCost,resourceCost} from '../src/core/conditional-combat.js';
const c=await loadContent();
function account(party){let s=createGameSave(c);s.party=party;s.partyPresets[0].slots=Array.from({length:4},(_,i)=>party[i]??null);s.unlockedCharacterIds=[...new Set([...s.unlockedCharacterIds,...party])];s.recruitmentShards=90;for(const id of party.filter(id=>c.characters[id]?.moonlightRevelation))s=changeRevelation(s,c,id,true);return s;}
function setup(party=['shashthi','yufina','astraea','iris']){const b=createBattle(structuredClone(c),account(party),'forest_patrol',()=>.99);for(const a of b.actors){a.hp=a.stats.maxHp=100000;if(a.team==='enemy'){a.stats.attack=a.stats.magic=a.stats.defense=a.stats.resistance=0;a.weaknesses=[];}}return b;}
function cast(b,id,ability,target){b.queue=[id,...b.actors.filter(a=>a.id!==id&&a.hp>0).map(a=>a.id)];b.cursor=0;executeAction(b,{actorId:id,abilityId:ability,targetId:target??b.actors.find(a=>a.team==='enemy'&&a.hp>0).id});return b.events;}
function next(b){const r=b.round;for(let i=0;i<70&&b.round===r&&!b.outcome;i++){const a=activeActor(b);executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});}assert.equal(b.round,r+1);}
function seed(b){cast(b,'shashthi','$attack');cast(b,'astraea','$attack');assert.ok(activeMoonlight(b,'party','bountiful_seed'));}
function song(b){cast(b,'yufina','$attack');cast(b,'yumia','$attack');assert.ok(activeMoonlight(b,'party','nameless_song'));}
function storm(b){cast(b,'noelle','noelle.thunder');cast(b,'tywin','$attack');assert.ok(activeMoonlight(b,'party','thunder_wrath'));}
const hits=(b,id,target='enemy_0')=>b.events.filter(e=>e.type==='damage'&&e.sourceId===id&&e.targetId===target);

test('Shashthi and Flynn are official, stable providers; new revelations persist without granting access',()=>{
 assert.equal(c.characters.shashthi.releaseId,119);assert.equal(c.characters.flynn.releaseId,120);
 for(const id of ['shashthi','flynn'])assert.ok(c.banners.standard.characterPool.includes(id));
 assert.equal(c.characters.shashthi.combatModes.harvest.presentationScope,'none');assert.equal(c.characters.flynn.combatModes.moon_storm.presentationScope,'none');
 let s=account(['yufina','astraea']);assert.equal(s.recruitmentShards,30);assert.deepEqual(decodeGameSave(encodeGameSave(s,c),c),s);
 const b=createBattle(c,s,'forest_patrol');assert.equal(b.moonlight.party,undefined);
});
test('Shashthi gift restricts targets, doubles rank-scaled magnitude and rounds only for blessing providers',()=>{
 const b=setup(['shashthi','yufina','noelle','astraea']),a=getActor(b,'shashthi');
 assert.deepEqual(targetsFor(b,a,c.abilities['shashthi.gift']).map(a=>a.id),['shashthi','yufina','astraea']);
 const before=a.mp;assert.throws(()=>cast(b,a.id,'shashthi.gift','noelle'));assert.equal(a.mp,before);
 a.skillRanks={'shashthi.gift':5};cast(b,a.id,'shashthi.gift','shashthi');let s=a.statuses.find(s=>s.id==='shashthi_magic');assert.ok(Math.abs(s.appliedModifiers.magic-.9*1.05**4)<1e-8);assert.equal(s.expiresAfterRound,6);
 const peer=setup();cast(peer,'shashthi','shashthi.gift','yufina');s=getActor(peer,'yufina').statuses.find(s=>s.id==='shashthi_magic');assert.equal(s.appliedModifiers.magic,.45);assert.equal(s.expiresAfterRound,3);
});
test('Shashthi gift respects Phong An instead of bypassing buff rejection',()=>{
 const b=setup(),a=getActor(b,'shashthi'),seal=Object.values(c.statuses).find(s=>s.buffRejection);a.statuses.push({id:seal.id,remaining:null,stacks:1,charges:1,sourceId:'enemy_0'});cast(b,a.id,'shashthi.gift',a.id);assert.ok(!a.statuses.some(s=>s.id==='shashthi_magic'));assert.equal(a.mp,108);
});
test('seed gets Shashthi 20% or mode 50% before amplification, without changing its dynamic MAG',()=>{
 const values=[];for(const mode of [false,true]){const b=setup();seed(b);if(mode)cast(b,'shashthi','shashthi.harvest');const expected=(battleStat(c,getActor(b,'shashthi'),'magic')+battleStat(c,getActor(b,'yufina'),'magic')+battleStat(c,getActor(b,'astraea'),'magic'))/3*1.2;next(b);const h=hits(b,'moonlight_party');assert.equal(h.length,1);assert.equal(getActor(b,'moonlight_party').stats.magic,expected);values.push(h[0].amount);assert.ok(h[0].elements.includes('earth')&&h[0].elements.includes('moon'));}
 assert.ok(Math.abs(values[1]/values[0]-1.5/1.2)<.03);
});
test('harvest entry/pulse is MAG, gains Moon while seed is active, rank grows both and expires after round five',()=>{
 const entries=[],pulses=[];for(const rank of [1,5]){const b=setup();seed(b);getActor(b,'shashthi').skillRanks={'shashthi.harvest':rank};cast(b,'shashthi','shashthi.harvest');const entry=hits(b,'shashthi')[0];assert.ok(entry.elements.includes('moon'));entries.push(entry.amount);assert.equal(getActor(b,'shashthi').modeExpiresAfterRound,5);next(b);const pulse=hits(b,'shashthi').find(e=>e.abilityId==='shashthi.pulse');assert.ok(pulse);pulses.push(pulse.amount);assert.equal(b.events.filter(e=>e.type==='reaction'&&e.abilityId==='shashthi.pulse').length,1);while(b.round<6)next(b);assert.equal(getActor(b,'shashthi').activeMode,undefined);}assert.ok(entries[1]>entries[0]*1.4);assert.ok(pulses[1]>pulses[0]*1.35);
});
test('Shashthi death removes her seed boost while the independent blessing remains',()=>{
 const b=setup();seed(b);getActor(b,'shashthi').hp=0;b.queue=b.actors.filter(a=>a.hp>0).map(a=>a.id);b.cursor=0;next(b);assert.ok(activeMoonlight(b,'party','bountiful_seed'));const stat=getActor(b,'moonlight_party').stats.magic;assert.ok(Math.abs(hits(b,'moonlight_party')[0].amount-stat*1.8*.6)<2);
});
test('Yufina Song revelation adds a fixed ATK hit only to active skills; mode basics gain Moon without the extra hit',()=>{
 const extra=[];for(const rank of [1,5]){const b=setup(['luna','yufina','yumia','iris']);song(b);cast(b,'yufina','yufina.ignite');getActor(b,'yufina').skillRanks={'yufina.pierce':rank};cast(b,'yufina','yufina.pierce');const h=hits(b,'yufina');assert.equal(h.length,2);assert.ok(h.every(e=>e.elements.includes('moon')));extra.push(h[1].amount);assert.ok(Math.abs(h[1].amount-battleStat(c,getActor(b,'yufina'),'attack')*1.2*1.1)<2);const mp=getActor(b,'yufina').mp;cast(b,'yufina','$attack');assert.equal(hits(b,'yufina').length,1);assert.ok(hits(b,'yufina')[0].elements.includes('moon'));assert.equal(getActor(b,'yufina').mp,mp);}
 assert.equal(extra[0],extra[1]);
});
test('Yufina needs her mode, enabled revelation and same-side Song for extra ATK damage',()=>{
 for(const missing of ['mode','enabled','song']){const b=setup(['luna','yufina','yumia','iris']);if(missing!=='song')song(b);if(missing!=='mode')cast(b,'yufina','yufina.ignite');if(missing==='enabled')getActor(b,'yufina').moonlightRevelationEnabled=false;cast(b,'yufina','yufina.pierce');assert.equal(hits(b,'yufina').length,1);assert.equal(hits(b,'yufina')[0].elements,undefined);}
});
test('Astraea revelation reserves three support follow-ups across Main and Extra; fourth is refused',()=>{
 const b=setup();cast(b,'astraea','astraea.garden','astraea');seed(b);
 const checks=[];cast(b,'iris','iris.calibrate','yufina');checks.push(hits(b,'astraea'));cast(b,'shashthi','shashthi.gift','yufina');checks.push(hits(b,'astraea'));b.phase='extra';cast(b,'yufina','yufina.ignite');checks.push(hits(b,'astraea'));cast(b,'shashthi','shashthi.guard','shashthi');assert.equal(hits(b,'astraea').length,0);
 for(const h of checks){assert.equal(h.length,1);assert.ok(h[0].elements.includes('moon'));}assert.equal(getActor(b,'astraea').supportFollowupState.count,3);
});
test('Astraea revealed follow-up keeps self/Defend exclusions; own attacks never gain Moon',()=>{
 const b=setup();cast(b,'astraea','astraea.garden','astraea');seed(b);cast(b,'iris','$defend','iris');assert.equal(hits(b,'astraea').length,0);cast(b,'astraea','astraea.roots');assert.equal(hits(b,'astraea')[0].elements,undefined);
});
test('Flynn real queue rotation: charge at R1, spend in Extra/R2, charge ready again at R3',()=>{
 const b=setup(['flynn','noelle','tywin','iris']),a=getActor(b,'flynn'),seen=[];
 for(let i=0;i<70&&seen.length<5;i++){const unit=activeActor(b);let skill='$defend';if(unit.id==='flynn'){skill=b.round===1&&b.phase==='main'||b.round===3&&b.phase==='main'?'flynn.charge':'flynn.burst';seen.push([b.round,b.phase,skill]);}executeAction(b,{actorId:unit.id,abilityId:skill,targetId:skill==='$defend'?unit.id:'enemy_0'});if(unit.id==='flynn')assert.equal(a.resourceValues.storm_charge,[2,1,0,2,1][seen.length-1]);}
 assert.deepEqual(seen,[[1,'main','flynn.charge'],[1,'extra','flynn.burst'],[2,'main','flynn.burst'],[3,'main','flynn.charge'],[3,'extra','flynn.burst']]);assert.equal(a.mp,80);assert.equal(a.resourceValues.storm_charge,1);
});
test('Flynn variants switch cost/coefficient/CD and invalidate cached resolved previews without mutating data',()=>{
 const b=setup(['flynn','noelle','tywin','iris']),a=getActor(b,'flynn'),raw=c.abilities['flynn.burst'];let empty=resolveRankedAbility(c,a,raw);assert.equal(empty.cost.mp,35);assert.equal(empty.cooldown,3);
 a.resourceValues.storm_charge=1;const ready=resolveRankedAbility(c,a,empty);assert.equal(ready.cost.mp,undefined);assert.equal(ready.cost.resource.amount,1);assert.equal(ready.effects[0].primaryMultiplier,2.4);assert.equal(ready.cooldown,0);a.mp=0;assert.equal(abilityAvailability(b,a,raw).ok,true);cast(b,a.id,raw.id);assert.equal(a.resourceValues.storm_charge,0);assert.equal(a.mp,0);assert.equal(a.cooldowns[raw.id]??0,0);assert.equal(raw.cost.mp,35);
 a.mp=35;cast(b,a.id,raw.id);assert.equal(a.mp,0);assert.equal(a.cooldowns[raw.id],4);a.resourceValues.storm_charge=1;assert.equal(abilityAvailability(b,a,raw).ok,false);
});
test('Flynn has independent primary/all-other damage, optional command and Noelle response',()=>{
 for(const charges of [0,1]){const b=setup(['flynn','noelle','tywin','iris']);storm(b);const a=getActor(b,'flynn');a.resourceValues.storm_charge=charges;const mp=a.mp,noelleMp=getActor(b,'noelle').mp;cast(b,a.id,'flynn.burst','enemy_1');const own=hits(b,a.id,'enemy_1')[0],other=hits(b,a.id,'enemy_0')[0],command=hits(b,'moonlight_party','enemy_1')[0],side=hits(b,'moonlight_party','enemy_0')[0];assert.ok(own.amount>other.amount);assert.ok(command.amount>side.amount);assert.ok(Math.abs(command.amount/side.amount-(charges?3.6/2:4.8/3.2))<.05);assert.equal(a.resourceValues.storm_charge,0);assert.equal(a.mp,mp-(charges?0:35));assert.equal(getActor(b,'noelle').mp,noelleMp);assert.equal(b.moonlight.party.active.followUps.noelle.count,1);assert.ok(hits(b,'noelle').length);assert.ok(own.elements.includes('moon'));assert.equal(a.modeTurnsRemaining,4);}
 const b=setup(['flynn','noelle','tywin','iris']);getActor(b,'flynn').resourceValues.storm_charge=1;cast(b,'flynn','flynn.burst');assert.equal(hits(b,'moonlight_party').length,0);assert.ok(hits(b,'flynn').length);
});
test('Flynn activation includes +12 base ATK and +20% blessing ATK immediately; commands do not refresh',()=>{
 const b=setup(['flynn','noelle','tywin','iris']);storm(b);const a=getActor(b,'flynn');assert.equal(a.activeMode,'moon_storm');assert.equal(a.modeTurnsRemaining,5);assert.equal(battleStat(c,a,'attack'),50);const expected=(50+35+battleStat(c,getActor(b,'tywin'),'attack'))/3*1.2;assert.equal(moonlightSnapshot(b).party.active.statValue,expected);assert.equal(b.events.find(e=>e.type==='moonlight_enter').statValue,expected);
 a.resourceValues.storm_charge=1;cast(b,a.id,'flynn.burst');assert.equal(a.modeTurnsRemaining,4);assert.equal(getActor(b,'moonlight_party').stats.attack,expected);
});
test('Flynn forecast does not spend MP, layers, mode turns or Noelle reaction quota',()=>{
 const b=setup(['flynn','noelle','tywin','iris']);storm(b);const a=getActor(b,'flynn');a.resourceValues.storm_charge=1;b.queue=['flynn','noelle','tywin','iris','enemy_0'];b.cursor=0;const old=structuredClone({a,moonlight:b.moonlight});const trial=forecastBattleAction(b,{actorId:a.id,abilityId:'flynn.burst',targetId:'enemy_0'});assert.equal(trial.moonlight.party.active.followUps.noelle.count,1);assert.deepEqual({a,moonlight:b.moonlight},old);
});
test('Flynn mode spends only his main turns, including stun, and outlasts blessing expiry',()=>{
 const b=setup(['flynn','noelle','tywin','iris']);storm(b);const a=getActor(b,'flynn');next(b);const remaining=a.modeTurnsRemaining;
 b.queue=['iris','flynn','noelle','tywin','enemy_0'];b.cursor=0;a.statuses.push({id:'stunned',remaining:1,stacks:1,sourceId:'enemy_0'});executeAction(b,{actorId:'iris',abilityId:'$defend',targetId:'iris'});assert.equal(a.modeTurnsRemaining,remaining-1);
 b.phase='extra';cast(b,'flynn','$defend','flynn');assert.equal(a.modeTurnsRemaining,remaining-1);b.phase='main';while(b.round<4)next(b);assert.equal(b.moonlight.party.active,null);assert.equal(a.activeMode,'moon_storm');cast(b,'flynn','$attack');assert.ok(hits(b,'flynn')[0].elements.includes('moon'));
});
test('Shashthi and Flynn validate mode/variant/provider contracts and reject malformed new data',()=>{
 assert.deepEqual(validateContent(c),[]);for(const mutate of [cc=>cc.characters.flynn.combatModes.moon_storm.durationClock='round',cc=>cc.abilities['flynn.burst'].resourceVariants.ready.cost={mp:0},cc=>cc.abilities['shashthi.gift'].effects[0].moonlightProviderBonus={modifierMultiplier:3,durationMultiplier:2},cc=>cc.characters.astraea.moonlightRevelation.modePerRound=100]){const cc=structuredClone(c);mutate(cc);assert.ok(validateContent(cc).length);}
});
test('mirror teams use independent Flynn commands and Noelle quotas',()=>{
 const b=createArenaBattle(c,account(['flynn','noelle','tywin','iris']),'mirror',89);for(const a of b.actors)a.hp=a.stats.maxHp=100000;
 const id=(team,name)=>b.actors.find(a=>a.team===team&&a.definitionId===name).id;for(const team of ['party','enemy']){const target=id(team==='party'?'enemy':'party','iris');cast(b,id(team,'noelle'),'noelle.thunder',target);cast(b,id(team,'tywin'),'$attack',target);getActor(b,id(team,'flynn')).resourceValues.storm_charge=1;cast(b,id(team,'flynn'),'flynn.burst',target);assert.ok(b.events.some(e=>e.type==='reaction'&&e.sourceId==='moonlight_'+team));assert.equal(b.moonlight[team].active.followUps[id(team,'noelle')].count,1);}
});

test('Flynn raw cost quotes track layers, and Rank 5 grows both his hit and the commanded coefficient',()=>{
 const b=setup(['flynn','noelle','tywin','iris']),a=getActor(b,'flynn');assert.equal(mpCost(c.abilities['flynn.burst'],a,b),35);a.resourceValues.storm_charge=1;assert.equal(mpCost(c.abilities['flynn.burst'],a,b),0);assert.equal(resourceCost(c.abilities['flynn.burst'],a).amount,1);
 const skill=resolveRankedAbility(c,a,'flynn.burst',5);assert.equal(skill.effects[0].rankDamageFactor,1.1**4);assert.equal(skill.effects[1].primaryMultiplier,3.6);assert.equal(skill.effects[1].rankDamageFactor,1.1**4);
});
test('Flynn commands share Noelle three-per-round quota with pulses and do not consume their clock slots',()=>{
 const b=setup(['flynn','noelle','tywin','iris']);storm(b);const a=getActor(b,'flynn');a.resourceValues.storm_charge=3;const pulseClock=structuredClone(b.moonlight.party.active.pulses);
 for(let i=0;i<3;i++){cast(b,a.id,'flynn.burst');assert.equal(b.moonlight.party.active.followUps.noelle.count,i+1);assert.deepEqual(b.moonlight.party.active.pulses,pulseClock);}
 a.mp=90;cast(b,a.id,'flynn.burst');assert.ok(hits(b,'moonlight_party').length);assert.equal(hits(b,'noelle').length,0);assert.equal(b.moonlight.party.active.followUps.noelle.count,3);
});
test('a killed primary falls back for the blessing command, and activation refresh never duplicates base bonuses',()=>{
 const b=setup(['flynn','noelle','tywin','iris']);storm(b);const a=getActor(b,'flynn');a.resourceValues.storm_charge=1;getActor(b,'enemy_1').hp=1;cast(b,a.id,'flynn.burst','enemy_1');const event=b.events.find(e=>e.type==='reaction'&&e.sourceId==='moonlight_party');assert.equal(event.targetId,'enemy_0');assert.ok(hits(b,'moonlight_party','enemy_0')[0].amount>hits(b,'moonlight_party','enemy_2')[0].amount);
 while(b.round<4)next(b);a.modeTurnsRemaining=2;cast(b,'noelle','noelle.thunder');cast(b,'tywin','$attack');assert.equal(a.modeTurnsRemaining,5);assert.equal(battleStat(c,a,'attack'),50);assert.equal(b.events.filter(e=>e.type==='mode_refresh').length,1);
});
test('Flynn mode and Shashthi seed survive a dungeon room without reactivation or clock resets',()=>{
 for(const party of [['flynn','noelle','tywin','iris'],['shashthi','yufina','astraea','iris']]){const run=createDungeonRun(c,account(party),'gold_mine','easy',{random:()=>0,rewardRandom:()=>0,now:new Date('2026-11-20T05:00:00Z')});for(const e of run.battle.actors.filter(a=>a.team==='enemy'))e.hp=e.stats.maxHp=100000;
 if(party[0]==='flynn')storm(run.battle);else{seed(run.battle);cast(run.battle,'shashthi','shashthi.harvest');}const old=structuredClone(run.battle.moonlight.party.active),owner=getActor(run.battle,party[0]),remaining=owner.modeTurnsRemaining,deadline=owner.modeExpiresAfterRound;run.battle.outcome='victory';advanceDungeonWave(c,run);
 assert.equal(run.battle.moonlight.party.active.expiresAfterRound,old.expiresAfterRound);assert.equal(getActor(run.battle,party[0]).activeMode,party[0]==='flynn'?'moon_storm':'harvest');assert.equal(getActor(run.battle,party[0]).modeTurnsRemaining,remaining);assert.equal(getActor(run.battle,party[0]).modeExpiresAfterRound,deadline);assert.ok(!run.battle.events.some(e=>e.type==='mode_enter'||e.type==='moonlight_enter'));}
});

test('both Flynn branches scale commanded main/other damage once at Rank 5 without changing blessing ATK or Noelle',()=>{
 for(const charges of [0,1]){
  const samples=[];
  for(const rank of [1,5]){const b=setup(['flynn','noelle','tywin','iris']);storm(b);const a=getActor(b,'flynn');a.skillRanks={'flynn.burst':rank};a.resourceValues.storm_charge=charges;
   const before=structuredClone(b.moonlight.party.active),atk=moonlightSnapshot(b).party.active.statValue;cast(b,a.id,'flynn.burst','enemy_1');
   samples.push({main:hits(b,'moonlight_party','enemy_1')[0].amount,side:hits(b,'moonlight_party','enemy_0')[0].amount,noelle:hits(b,'noelle','enemy_0')[0].amount,atk});
   assert.equal(b.moonlight.party.active.expiresAfterRound,before.expiresAfterRound);assert.deepEqual(b.moonlight.party.active.pulses,before.pulses);assert.equal(b.moonlight.party.active.followUps.noelle.count,1);assert.equal(a.resourceValues.storm_charge,0);assert.equal(a.mp,charges?90:55);
  }
  for(const key of ['main','side'])assert.ok(Math.abs(samples[1][key]-samples[0][key]*1.1**4)<2,key+' scaled exactly once');
  assert.equal(samples[0].atk,samples[1].atk);assert.equal(samples[0].noelle,samples[1].noelle);
 }
});
test('ranked Flynn command forecast matches actual execution and leaves real blessing/resource state untouched',()=>{
 const b=setup(['flynn','noelle','tywin','iris']);storm(b);const a=getActor(b,'flynn');a.skillRanks={'flynn.burst':5};a.resourceValues.storm_charge=1;b.queue=['flynn','iris','noelle','tywin','enemy_0'];b.cursor=0;
 const old=structuredClone({actor:a,moonlight:b.moonlight}),trial=forecastBattleAction(b,{actorId:a.id,abilityId:'flynn.burst',targetId:'enemy_1'});assert.deepEqual({actor:a,moonlight:b.moonlight},old);
 cast(b,a.id,'flynn.burst','enemy_1');for(const id of ['enemy_0','enemy_1'])assert.equal(hits(b,'moonlight_party',id)[0].amount,hits(trial,'moonlight_party',id)[0].amount);
});
test('ranked commands do not change subsequent natural pulses or Gawain fixed commands',()=>{
 const pulses=[];for(const rank of [1,5]){const b=setup(['flynn','noelle','tywin','iris']);storm(b);const a=getActor(b,'flynn');a.skillRanks={'flynn.burst':rank};a.resourceValues.storm_charge=1;cast(b,a.id,'flynn.burst');next(b);const amounts=hits(b,'moonlight_party').map(e=>e.amount);assert.ok(amounts.length);pulses.push(amounts);}assert.deepEqual(pulses[0],pulses[1]);
 const orders=[];for(const rank of [1,5]){const b=setup(['gawain','noelle','tywin','iris']);storm(b);getActor(b,'gawain').skillRanks={'gawain.judgment':rank};cast(b,'gawain','gawain.judgment');orders.push(hits(b,'moonlight_party')[0].amount);}assert.equal(orders[0],orders[1]);
});
test('Flynn command Rank is capped at 5 for either PvP side, retaining separate blessing sources and Noelle response',()=>{
 const b=createArenaBattle(c,account(['flynn','noelle','tywin','iris']),'mirror',89);for(const a of b.actors)a.hp=a.stats.maxHp=100000;
 const id=(team,name)=>b.actors.find(a=>a.team===team&&a.definitionId===name).id;
 for(const team of ['party','enemy']){const target=id(team==='party'?'enemy':'party','iris');cast(b,id(team,'noelle'),'noelle.thunder',target);cast(b,id(team,'tywin'),'$attack',target);const a=getActor(b,id(team,'flynn'));a.skillRanks={'flynn.burst':8};a.resourceValues.storm_charge=1;
  const skill=resolveRankedAbility(c,a,'flynn.burst');assert.equal(skill.skillRank,5);assert.equal(skill.effects[1].rankDamageFactor,1.1**4);cast(b,a.id,'flynn.burst',target);assert.ok(hits(b,'moonlight_'+team,target).length);assert.equal(b.moonlight[team].active.followUps[id(team,'noelle')].count,1);
 }
});
test('command rank scaling is opt-in, validated in every resource variant, and never mutates authored data/cache',()=>{
 const raw=JSON.stringify(c.abilities['flynn.burst']),b=setup(['flynn','noelle','tywin','iris']),a=getActor(b,'flynn');a.skillRanks={'flynn.burst':5};a.resourceValues.storm_charge=1;
 const ready=resolveRankedAbility(c,a,'flynn.burst');assert.equal(resolveRankedAbility(c,a,ready),ready);a.resourceValues.storm_charge=0;const empty=resolveRankedAbility(c,a,ready);assert.equal(empty.effects[1].primaryMultiplier,4.8);assert.equal(empty.effects[1].rankDamageFactor,1.1**4);assert.equal(JSON.stringify(c.abilities['flynn.burst']),raw);
 for(const change of [cc=>cc.abilities['flynn.burst'].effects[1].rankScaling='yes',cc=>cc.abilities['flynn.burst'].resourceVariants.ready.effects[1].rankScaling=1,cc=>cc.abilities['flynn.burst'].resourceVariants.empty.effects[1].rankScaling='yes']){const cc=structuredClone(c);change(cc);assert.ok(validateContent(cc).length);}
});

test('Flynn tooltips and scaling previews show the same ranked command coefficients as combat',()=>{
 const b=setup(['flynn','noelle','tywin','iris']),a=getActor(b,'flynn');a.skillRanks={'flynn.burst':5};
 for(const charges of [0,1]){a.resourceValues.storm_charge=charges;const skill=resolveRankedAbility(c,a,'flynn.burst'),main=charges?'527':'702',side=charges?'292':'468';
  const facts=skillPresentation(skill,a,c).facts.join(' ');assert.ok(facts.includes(main)&&facts.includes(side),facts);
  const lines=skillScaling(skill,a,c).join(' ');assert.ok(lines.includes(main)&&lines.includes(side),lines);
 }
});
