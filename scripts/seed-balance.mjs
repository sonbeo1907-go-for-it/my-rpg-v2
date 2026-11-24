import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {loadContent} from './load-content.mjs';
import {createGameSave} from '../src/core/game-save.js';
import {resolveCharacter} from '../src/core/progression.js';
import {createBattle,activeActor,getActor,executeAction,moonlightSnapshot,abilityAvailability} from '../src/core/battle.js';
import {battleStat} from '../src/core/stat-values.js';
import {t4Stats} from '../src/core/gear-rules.js';
import {assertValidEquipment} from '../src/core/equipment.js';
import {allocationLimit,normalizeLevelState} from '../src/core/leveling.js';
import {masteryEnabled,skillLineId,validateCharacterSkillRanks} from '../src/core/skill-rules.js';
import {changeRevelation} from '../src/core/moonlight-revelation.js';

const PARTY=['shashthi','luna','bianca','lisbeth'];
const isMain=process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href;
export function balanceVersion(content,before=false){const c=structuredClone(content);c.moonlightBlessings.bountiful_seed.statRatio=before?1.5:1.2;c.abilities['moonlight.bountiful_seed'].effects[0].multiplier=before?1.5:1.8;c.abilities['bianca.harvest'].effects.find(e=>e.type==='command_moonlight').multiplier=before?3.8:3;return c;}
function account(c,loadouts){let s=createGameSave(c);s.party=[...PARTY];s.partyPresets[0].slots=[...PARTY];s.unlockedCharacterIds=[...new Set([...s.unlockedCharacterIds,...PARTY])];s.storyFlags.push('illusion.sinister_unlocked');s.recruitmentShards=100;s=changeRevelation(s,c,'lisbeth',true);
 for(const id of PARTY){const st=s.characters[id];st.level=50;st.xp=0;st.limitBreakRank=3;st.allocations=id==='luna'?{maxHp:17,maxMp:17,defense:15}:{magic:17,maxMp:17,maxHp:15};st.skillRanks={basic:masteryEnabled(c,id)?8:5};for(const key of c.characters[id].abilities.filter(key=>c.abilities[key].rankable))st.skillRanks[skillLineId(c.abilities[key])]=masteryEnabled(c,id)?8:5;normalizeLevelState(c,st);validateCharacterSkillRanks(c,s,id);s.extraGearSlots[id]=3;s.equipment[id]=[];
  for(const recipe of loadouts[id]){const gear={id:'rune_'+(++s.craftedGearSerial),...(recipe==='magic'||recipe==='maxHp'?{typeId:'t4_stats',primaryStat:recipe,secondaryStat:recipe,stats:t4Stats(c,recipe,recipe)}:{typeId:'t4_effect',effectId:recipe,stats:{}})};s.gear.push(gear);s.equipment[id].push(gear.id);}
 }
 s.exclusiveGear.push({templateId:'lisbeth.judgment_staff',statKey:'magic',statValue:10});s.equippedExclusiveGear.lisbeth='lisbeth.judgment_staff';s.unlockedExclusiveRecipes.push('lisbeth.judgment_staff');assertValidEquipment(s,c);return s;
}
export function defaultLoadouts(){return Object.fromEntries(PARTY.map(id=>[id,id==='luna'?['moonlit_covenant','moonlit_duet','vitality_chalice','shelter_relay','restoration_clock','maxHp']:Array(6).fill('magic')]));}
function dummy(b,targets,resistance){const original=b.actors.find(a=>a.team==='enemy');const stats=structuredClone(original.stats);for(const a of b.actors.filter(a=>a.team==='enemy')){delete a.boss;delete a.bossState;a.hp=a.stats.maxHp=1e9;a.stats.attack=a.stats.magic=0;a.stats.defense=stats.defense;a.stats.resistance=resistance??stats.resistance;a.weaknesses=[];a.resistances={};a.abilities=['bench.wait'];a.statuses=[];}
 for(let i=1;i<targets;i++){const a=structuredClone(original);a.id='bench_enemy_'+i;b.actors.push(a);}return {sourceEncounter:'miraebolis_superboss',level:b.enemyLevel,originalStats:stats,measuredResistance:resistance??stats.resistance,targets,changes:'Stationary damage target: boss scripts, HP gates, natural weaknesses and resistances removed; HP 1e9 prevents clipping. Real scaled RES retained unless zero-RES control. No boss AI or win-rate claim.'};}
function policy(b,a){const target=b.actors.find(t=>t.team==='enemy'&&t.hp>0),r=b.round,ok=id=>abilityAvailability(b,a,b.content.abilities[id]).ok;let id='$defend',who=a.id;
 if(a.team==='enemy')id='bench.wait';
 else if(a.id==='shashthi'){
  if(r===1&&ok('shashthi.gift')){id='shashthi.gift';who='shashthi';}
  else if(r===2&&ok('shashthi.harvest'))id='shashthi.harvest';
  else if(r===4&&ok('shashthi.gift')){id='shashthi.gift';who='bianca';}
  else if(r===3&&ok('shashthi.guard'))id='shashthi.guard';
  else if(r===5){id='$attack';who=target.id;}
 }else if(a.id==='luna'){
  if([1,4].includes(r)&&ok('luna.promise'))id='luna.promise';else if(r===2&&ok('luna.song'))id='luna.song';else if(ok('luna.lament'))id='luna.lament';
 }else if(a.id==='bianca'){
  if(b.phase==='extra')id='bianca.harvest';else if([1,4].includes(r))id='bianca.bargain';else id='bianca.opening';
 }else if(a.id==='lisbeth'){
  if([2,6].includes(r)&&ok('lisbeth.pride'))id='lisbeth.pride';else if([3,5].includes(r)&&ok('lisbeth.judgment'))id='lisbeth.judgment';else if(r===1)id='$attack';
 }
 const skill=b.content.abilities[id];if(id==='$attack'||skill?.target==='enemy'||skill?.target==='all_enemies')who=target.id;return {actorId:a.id,abilityId:id,targetId:who};
}
export function runSeedRotation(content,loadouts,{targets=1,lowHp=false,resistance}={}){
 const c=structuredClone(content);c.abilities['bench.wait']={id:'bench.wait',name:'Wait',target:'self',cost:{mp:0},cooldown:0,effects:[{type:'resource',resource:'mp',amount:0}],growthProfile:'fixed',rankable:false,skillLineId:'bench.wait'};
 const save=account(c,loadouts),b=createBattle(c,save,'miraebolis_superboss',()=>.99,{enemyLevel:90}),targetInfo=dummy(b,targets,resistance),trace=[],totals={},peak={};
 if(lowHp)for(const a of b.actors.filter(a=>a.team==='party'))a.hp=Math.floor(a.stats.maxHp*.69);
 for(let safety=0;safety<160&&b.round<=6&&!b.outcome;safety++){
  const a=activeActor(b);assert.ok(a,'active actor');const round=b.round,phase=b.phase,command=policy(b,a);
  if(round===6&&a.id==='bianca'&&phase==='extra'){peak.stats=Object.fromEntries(b.actors.filter(a=>a.team==='party').map(a=>[a.id,{MAG:battleStat(c,a,'magic'),HP:a.hp,maxHp:a.stats.maxHp,MP:a.mp,maxMp:a.stats.maxMp,rank:a.skillRanks,statuses:a.statuses.map(s=>({id:s.id,remaining:s.remaining}))}]));peak.buffSnapshots=Object.fromEntries(b.actors.filter(a=>a.team==='party').map(a=>[a.id,structuredClone(a.statuses)]));peak.blessingMag=moonlightSnapshot(b).party.active.statValue;peak.beforeStacks=a.resourceValues.harvest_credit;peak.sourceSnapshot=structuredClone(a);}
  executeAction(b,command);const events=structuredClone(b.events);trace.push({round,phase,actor:a.id,ability:command.abilityId,events});
  for(const e of events)if(e.type==='damage')totals[e.sourceId]=(totals[e.sourceId]??0)+e.amount;
  if(round===6&&a.id==='bianca'&&phase==='extra'){
   const damages=events.filter(e=>e.type==='damage');peak.biancaOwn=damages.filter(e=>e.sourceId==='bianca').reduce((n,e)=>n+e.amount,0);
   peak.commands=damages.filter(e=>e.sourceId==='moonlight_party'&&e.automatic===true&&e.abilityId==='moonlight.bountiful_seed');
   // Split using the explicit reaction/automatic-cast boundary; both share source ID and ability ID.
   let commanded=false;peak.commandHits=[];peak.pulseHits=[];
   for(const e of events){if(e.sourceId==='moonlight_party'&&e.type==='reaction')commanded=true;else if(e.sourceId==='moonlight_party'&&e.type==='ability_cast')commanded=false;if(e.type==='damage'&&e.sourceId==='moonlight_party')(commanded?peak.commandHits:peak.pulseHits).push(e);}
   peak.commandDamage=peak.commandHits.reduce((n,e)=>n+e.amount,0);peak.pulseDamage=peak.pulseHits.reduce((n,e)=>n+e.amount,0);peak.afterStacks=a.resourceValues.harvest_credit;
  }
 }
 assert.ok(peak.commandHits?.length,'missing R6 peak');assert.equal(peak.commandHits.length,3);assert.equal(peak.beforeStacks,3);assert.equal(peak.afterStacks,0);assert.equal(peak.pulseHits.length,targets);assert.equal(b.outcome,null);
 let bestPulse={round:0,damage:0};
 for(const entry of trace){let automatic=false,n=0;for(const e of entry.events){if(e.sourceId==='moonlight_party'&&['reaction','ability_cast'].includes(e.type))automatic=e.type==='ability_cast';if(automatic&&e.type==='damage'&&e.sourceId==='moonlight_party')n+=e.amount;}if(n>bestPulse.damage)bestPulse={round:entry.round,damage:n};}
 peak.bestPulse=bestPulse;
 return {targetInfo,peak,totals,trace,builds:Object.fromEntries(PARTY.map(id=>[id,{level:50,allocations:save.characters[id].allocations,ranks:save.characters[id].skillRanks,gear:loadouts[id],exclusive:id==='lisbeth'?{id:'lisbeth.judgment_staff',magic:10}:null}])),campaign:save,battle:b};
}

function combinations(pool,max=6){const out=[];function next(i,chosen){if(chosen.length>max)return;if(i===pool.length){out.push([...chosen,...Array(6-chosen.length).fill('magic')]);return;}next(i+1,chosen);next(i+1,[...chosen,pool[i]]);}next(0,[]);return out;}
export function optimizeSeedGear(c,lowHp=false){
 const loads=defaultLoadouts(),probe=runSeedRotation(c,loads,{lowHp,resistance:0});
 const pool=Object.values(c.gearEffects).filter(r=>r.effect.modifiers?.magic>0||r.effect.type==='mp_stat_conversion'&&r.effect.stat==='magic').map(r=>r.id),candidates=combinations(pool);let checked=0;
 // The objective is source MAG for the Bianca command, not a claim to optimize every possible party or rotation.
 for(const id of ['bianca','shashthi','lisbeth']){let best=-Infinity,chosen;for(const gear of candidates){if(id==='bianca'&&!gear.includes('moonlit_duet'))continue;const proposed={...loads,[id]:gear},s=account(c,proposed),a=resolveCharacter(c,s,id);a.hp=lowHp?Math.floor(a.stats.maxHp*.69):a.stats.maxHp;a.moonlightGearActive=true;a.lunarBaseBonuses={attack:8,magic:8};a.statuses=structuredClone(probe.peak.buffSnapshots[id]);const score=battleStat(c,a,'magic');checked++;if(score>best){best=score;chosen=gear;}}
  loads[id]=chosen;
 }
 return {loadouts:loads,candidates:checked,pool};
}

if(isMain){const base=await loadContent(),before=balanceVersion(base,true),after=balanceVersion(base,false);const rows=[],optimizations={};
 for(const lowHp of [false,true]){const optimized=optimizeSeedGear(before,lowHp);optimizations[lowHp?'lowHp':'fullHp']=optimized;
  const variants=lowHp?[['mixed_low_hp',optimized.loadouts]]:[['all_stat',defaultLoadouts()],['mixed_full_hp',optimized.loadouts]];
  for(const [build,loads]of variants)for(const targets of [1,3])for(const resistance of [0,undefined]){const old=runSeedRotation(before,loads,{targets,lowHp,resistance}),now=runSeedRotation(after,loads,{targets,lowHp,resistance});
   rows.push({build,targets,resistance:old.targetInfo.measuredResistance,builds:old.builds,before:old.peak,after:now.peak,damage6RoundsBefore:old.totals,damage6RoundsAfter:now.totals,targetInfo:old.targetInfo});
  }
 }
 const output={description:'Same legal Lv50 builds, ranks and six-round script before/after. Three core new units R5; Lisbeth R5M3 + MAG10 signature + Harvest revelation. Six legal T4 slots. Optimize source MAG among registered MAG-effect subsets, hold winners fixed across versions. Controlled targets with actual Miraebolis Lv90 RES, not boss clear or win-rate test. Also RES0 and low-HP peak controls.',party:PARTY,versions:{before:{statRatio:1.5,pulse:1.5,bianca:3.8},after:{statRatio:1.2,pulse:1.8,bianca:3}},optimizations,rows};
 for(const row of rows)for(const side of ['before','after']){delete row[side].sourceSnapshot;delete row[side].buffSnapshots;delete row[side].commands;row[side].commandHits=row[side].commandHits.map(h=>({targetId:h.targetId,amount:h.amount}));row[side].pulseHits=row[side].pulseHits.map(h=>({targetId:h.targetId,amount:h.amount}));}
 fs.writeFileSync('docs/SEED_BALANCE_2026_11_24.json',JSON.stringify(output,null,2)+String.fromCharCode(10));console.table(rows.map(r=>({build:r.build,targets:r.targets,RES:r.resistance,MAG_before:r.before.blessingMag,MAG_after:r.after.blessingMag,command_before:r.before.commandDamage,command_after:r.after.commandDamage,pulse_before:r.before.pulseDamage,pulse_after:r.after.pulseDamage})));
}
