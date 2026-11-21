import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,activeActor,getActor,forecastBattleAction,moonlightSnapshot,abilityAvailability} from '../src/core/battle.js';
import {createArenaBattle} from '../src/core/arena.js';
import {resolveRankedAbility} from '../src/core/skill-resolver.js';
import {battleStat} from '../src/core/stat-values.js';
import {validateContent} from '../src/core/content.js';
import {skillPresentation,passivePresentation} from '../src/ui/skill-copy.js';
import {skillScaling} from '../src/ui/skill-presentation.js';
import {createDungeonRun,advanceDungeonWave} from '../src/core/dungeon.js';
const c=await loadContent();
function account(party=['bianca','shashthi','lyon','iris']){const s=createGameSave(c);s.party=party;s.partyPresets[0].slots=[...party];s.unlockedCharacterIds=[...new Set([...s.unlockedCharacterIds,...party])];return s;}
function setup(party){const b=createBattle(structuredClone(c),account(party),'forest_patrol',()=>.99);for(const a of b.actors){a.hp=a.stats.maxHp=100000;if(a.team==='enemy'){a.stats.attack=a.stats.magic=a.stats.defense=a.stats.resistance=0;a.weaknesses=[];}}return b;}
function cast(b,id,ability,target){b.queue=[id,...b.actors.filter(a=>a.id!==id&&a.hp>0).map(a=>a.id)];b.cursor=0;executeAction(b,{actorId:id,abilityId:ability,targetId:target??b.actors.find(a=>a.team!==getActor(b,id).team&&a.hp>0).id});return b.events;}
function next(b){const r=b.round;for(let i=0;i<70&&b.round===r&&!b.outcome;i++){const a=activeActor(b);executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});}assert.equal(b.round,r+1);}
const hits=(b,source='moonlight_party',target='enemy_0')=>b.events.filter(e=>e.type==='damage'&&e.sourceId===source&&e.targetId===target);
function seed(b,bianca='bianca',light='shashthi',target){cast(b,light,'$attack',target);cast(b,bianca,'$attack',target);assert.equal(b.moonlight[getActor(b,bianca).team].active.id,'bountiful_seed');}

test('Bianca is an official Valmont provider, with stable ID, gacha availability and old-save defaults',()=>{
 const a=c.characters.bianca;assert.equal(a.releaseId,121);assert.equal(a.affiliation,'house_valmont');assert.ok(a.tags.includes('valmont'));assert.ok(c.banners.standard.characterPool.includes(a.id));
 assert.deepEqual(a.stats,{maxHp:160,maxMp:120,defense:18,resistance:24,attack:8,magic:36,speed:18});
 const s=account();assert.deepEqual(decodeGameSave(encodeGameSave(s,c),c),s);const b=setup();assert.equal(getActor(b,'bianca').resourceValues.harvest_credit,0);assert.ok(b.moonlight.party.allowed.includes('bountiful_seed'));
 assert.ok(battleStat(c,getActor(b,'lyon'),'defense')>c.characters.lyon.stats.defense);
});
test('Bianca independently grants Quang-Tho access and fills six only after activation settles',()=>{
 const b=setup(['bianca','arthur','lyon','iris']);cast(b,'bianca','bianca.opening');assert.equal(getActor(b,'bianca').resourceValues.harvest_credit,0);cast(b,'arthur','$attack');assert.equal(b.moonlight.party.active.id,'bountiful_seed');assert.equal(getActor(b,'bianca').resourceValues.harvest_credit,6);
 assert.ok(!hits(b,'bianca').some(e=>e.elements?.includes('moon')));cast(b,'bianca','$attack');assert.ok(hits(b,'bianca')[0].elements.includes('moon'));
});
test('direct and commanded hits use independent sources, only the chosen seeded target, and min(3, layers)',()=>{
 for(const n of [0,1,2,3,6]){const b=setup();seed(b);const a=getActor(b,'bianca');a.resourceValues.harvest_credit=n;const mp=a.mp,clock=structuredClone(b.moonlight.party.active);cast(b,a.id,'bianca.harvest','enemy_1');
 assert.equal(hits(b,a.id,'enemy_1').length,1);assert.ok(hits(b,a.id,'enemy_1')[0].elements.includes('moon'));assert.equal(hits(b,'moonlight_party','enemy_1').length,Math.min(3,n));assert.equal(hits(b).length,0);assert.equal(hits(b,'moonlight_party','enemy_2').length,0);assert.equal(a.resourceValues.harvest_credit,Math.max(0,n-3));assert.equal(a.mp,mp-10);assert.deepEqual(b.moonlight.party.active.pulses,clock.pulses);assert.equal(b.moonlight.party.active.expiresAfterRound,clock.expiresAfterRound);
 for(const h of hits(b,'moonlight_party','enemy_1'))assert.ok(h.elements.includes('earth')&&h.elements.includes('moon'));
 }});
test('no seed, no anchor, or dead original target never spends layers or retargets the command',()=>{
 for(const mode of ['inactive','unanchored','dead']){const b=setup();if(mode!=='inactive')seed(b);const a=getActor(b,'bianca');a.resourceValues.harvest_credit=6;if(mode==='unanchored')b.moonlight.party.active.targets=b.moonlight.party.active.targets.filter(id=>id!=='enemy_0');if(mode==='dead')getActor(b,'enemy_0').hp=1;
 cast(b,a.id,'bianca.harvest');assert.equal(a.resourceValues.harvest_credit,6);assert.equal(hits(b).length,0);assert.equal(hits(b,'moonlight_party','enemy_1').length,0);assert.equal(a.mp,110);
 }});
test('each command hit grows with burst Rank once, using blessing MAG and Shashthi potency',()=>{
 const samples=[];for(const rank of [1,5]){const b=setup();seed(b);const a=getActor(b,'bianca');a.skillRanks={'bianca.harvest':rank};const power=moonlightSnapshot(b).party.active.statValue;cast(b,a.id,'bianca.harvest');const h=hits(b);assert.equal(h.length,3);assert.ok(h.every(x=>Math.abs(x.amount-power*3.8*1.2*1.1**(rank-1))<2));samples.push(h.map(x=>x.amount));assert.equal(getActor(b,'moonlight_party').stats.magic,power);}
 for(let i=0;i<3;i++)assert.ok(Math.abs(samples[1][i]-samples[0][i]*1.1**4)<2);
});
test('forecasts are repeatable, match execution, and do not consume live layers, MP or blessing duration',()=>{
 const b=setup();seed(b);const a=getActor(b,'bianca');a.skillRanks={'bianca.harvest':5};b.queue=['bianca','iris','shashthi','lyon','enemy_0'];b.cursor=0;const old=structuredClone({a,moonlight:b.moonlight});const command={actorId:a.id,abilityId:'bianca.harvest',targetId:'enemy_1'};
 const trial=forecastBattleAction(b,command),again=forecastBattleAction(b,command);assert.deepEqual({a,moonlight:b.moonlight},old);assert.deepEqual(hits(trial,'moonlight_party','enemy_1'),hits(again,'moonlight_party','enemy_1'));executeAction(b,command);assert.deepEqual(hits(b,'moonlight_party','enemy_1'),hits(trial,'moonlight_party','enemy_1'));
});
test('opening grants a real Extra Turn, but casting again in Extra cannot recursively create another',()=>{
 const b=setup(),a=getActor(b,'bianca'),seen=[];for(let i=0;i<40&&b.round===1;i++){const unit=activeActor(b);seen.push([unit.id,b.phase]);executeAction(b,{actorId:unit.id,abilityId:unit.id==='bianca'?'bianca.opening':'$defend',targetId:unit.id==='bianca'?'enemy_0':unit.id});}
 assert.deepEqual(seen.filter(x=>x[0]==='bianca'),[['bianca','main'],['bianca','extra']]);assert.equal(b.round,2);assert.equal(a.mp,110);assert.equal(getActor(b,'enemy_0').statuses.find(s=>s.id==='exposure_earth').stacks,3);
});
test('self buff scales base MAG, refreshes without stacking, and cleanses even if its buff is sealed',()=>{
 for(const blocked of [false,true]){const b=setup(),a=getActor(b,'bianca');a.skillRanks={'bianca.bargain':5};a.statuses.push({id:'exposure_dark',stacks:1,remaining:null,sourceId:'enemy_0'});if(blocked){const seal=Object.values(c.statuses).find(s=>s.buffRejection);a.statuses.push({id:seal.id,charges:1,stacks:1,remaining:null,sourceId:'enemy_0'});}
 cast(b,a.id,'bianca.bargain',a.id);assert.ok(!a.statuses.some(s=>c.statuses[s.id].kind==='debuff'));const status=a.statuses.find(s=>s.id==='bianca_acumen');assert.equal(Boolean(status),!blocked);if(status){assert.ok(Math.abs(status.baseStatModifiers.magic-12*1.05**4)<1e-8);cast(b,a.id,'bianca.bargain',a.id);assert.equal(a.statuses.filter(s=>s.id==='bianca_acumen').length,1);assert.equal(a.statuses.find(s=>s.id==='bianca_acumen').remaining,3);}
 }});
test('self buff uses three main turns, ticks on stun, and ignores Extra Turns through actual engine progression',()=>{
 const b=setup(),a=getActor(b,'bianca');cast(b,a.id,'bianca.bargain',a.id);cast(b,a.id,'bianca.opening');const before=a.statuses.find(s=>s.id==='bianca_acumen').remaining;
 while(b.round===1){const unit=activeActor(b);executeAction(b,{actorId:unit.id,abilityId:'$defend',targetId:unit.id});}assert.equal(a.statuses.find(s=>s.id==='bianca_acumen').remaining,before);
 a.statuses.push({id:'stunned',stacks:1,remaining:1,sourceId:'enemy_0'});b.queue=['iris','bianca','lyon','shashthi','enemy_0'];b.cursor=0;executeAction(b,{actorId:'iris',abilityId:'$defend',targetId:'iris'});assert.equal(a.statuses.find(s=>s.id==='bianca_acumen').remaining,before-1);
});
test('expiry removes Moon damage but retains unused layers, reactivation refills without exceeding six',()=>{
 const b=setup();seed(b);cast(b,'bianca','bianca.harvest');assert.equal(getActor(b,'bianca').resourceValues.harvest_credit,3);while(b.round<4)next(b);assert.equal(b.moonlight.party.active,null);assert.equal(getActor(b,'bianca').resourceValues.harvest_credit,3);cast(b,'bianca','$attack');assert.ok(!hits(b,'bianca')[0].elements?.includes('moon'));cast(b,'shashthi','$attack');assert.equal(getActor(b,'bianca').resourceValues.harvest_credit,6);assert.equal(b.moonlight.party.active.id,'bountiful_seed');
});
test('dungeon carry preserves layers and blessing deadlines without another activation',()=>{
 const run=createDungeonRun(c,account(),'gold_mine','easy',{random:()=>0,rewardRandom:()=>0,now:new Date('2026-11-21T05:00:00Z')});for(const e of run.battle.actors.filter(a=>a.team==='enemy'))e.hp=e.stats.maxHp=100000;
 seed(run.battle);cast(run.battle,'bianca','bianca.harvest');const deadline=run.battle.moonlight.party.active.expiresAfterRound;run.battle.outcome='victory';advanceDungeonWave(c,run);assert.equal(getActor(run.battle,'bianca').resourceValues.harvest_credit,3);assert.equal(run.battle.moonlight.party.active.expiresAfterRound,deadline);assert.ok(!run.battle.events.some(e=>e.type==='moonlight_enter'));
});
test('PvP mirror sides keep separate layers/seed targets, clamp Rank 5 and use single-target reaction cap',()=>{
 const b=createArenaBattle(c,account(),'mirror',41);for(const a of b.actors){a.hp=a.stats.maxHp=100000;a.stats.defense=a.stats.resistance=0;}
 const id=(team,name)=>b.actors.find(a=>a.team===team&&a.definitionId===name).id;
 for(const team of ['party','enemy']){const target=id(team==='party'?'enemy':'party','iris'),owner=getActor(b,id(team,'bianca'));seed(b,owner.id,id(team,'shashthi'),target);owner.skillRanks={'bianca.harvest':8};assert.equal(resolveRankedAbility(c,owner,'bianca.harvest').skillRank,5);cast(b,owner.id,'bianca.harvest',target);assert.equal(hits(b,'moonlight_'+team,target).length,3);assert.equal(owner.resourceValues.harvest_credit,3);const caps=b.events.filter(e=>e.type==='pvp_soft_cap'&&e.sourceId==='moonlight_'+team);assert.ok(caps.length);assert.ok(caps.every(e=>e.kind==='follow_up'));}
 assert.equal(getActor(b,id('party','bianca')).resourceValues.harvest_credit,3);
});
test('targeted commands and activation resource schema reject invalid authoring; shared content is immutable',()=>{
 assert.deepEqual(validateContent(c),[]);for(const mutate of [x=>x.characters.bianca.passive.amount=7,x=>x.abilities['bianca.harvest'].effects[1].spendResource.max=0,x=>x.abilities['bianca.harvest'].effects[1].spendResource.id='missing',x=>x.abilities['bianca.harvest'].effects[1].targetMode='all',x=>x.abilities['bianca.harvest'].effects[1].blessingId='thunder_wrath']){const copy=structuredClone(c);mutate(copy);assert.ok(validateContent(copy).length);}
 const before=JSON.stringify(c),b=setup();seed(b);cast(b,'bianca','bianca.harvest');assert.equal(JSON.stringify(c),before);
});
test('structured and legacy skill previews show MAG, layered command costs and Rank coefficients',()=>{
 const b=setup(),a=getActor(b,'bianca');a.skillRanks={'bianca.harvest':5};const skill=resolveRankedAbility(c,a,'bianca.harvest'),copy=JSON.stringify(skillPresentation(skill,a,c)),legacy=skillScaling(skill,a,c).join(' ');
 for(const value of [copy,legacy]){assert.ok(value.includes('MAG'));assert.ok(!value.includes('ATK'));assert.ok(value.includes('556'));assert.ok(value.includes('3'));assert.ok(value.includes('Lộc Nguyệt'));}assert.ok(JSON.stringify(passivePresentation(a,c)).includes('6'));
});
test('unaffordable actions and stun do not spend layers or issue commands',()=>{
 const b=setup();seed(b);const a=getActor(b,'bianca');a.mp=9;assert.equal(abilityAvailability(b,a,c.abilities['bianca.harvest']).ok,false);assert.throws(()=>cast(b,a.id,'bianca.harvest'));assert.equal(a.resourceValues.harvest_credit,6);a.mp=120;a.statuses.push({id:'stunned',remaining:1,stacks:1,sourceId:'enemy_0'});b.queue=['iris','bianca','lyon','shashthi','enemy_0'];b.cursor=0;executeAction(b,{actorId:'iris',abilityId:'$defend',targetId:'iris'});assert.equal(a.resourceValues.harvest_credit,6);assert.equal(hits(b).length,0);
});

test('Bianca real three-round combo: two Main openings, two Extra bursts, then cleanse/base-MAG buff',()=>{
 for(const rank of [1,5]){
  const b=setup(['bianca','shashthi','astraea','iris']),a=getActor(b,'bianca'),turns=[];
  a.skillRanks={'bianca.opening':rank,'bianca.harvest':rank,'bianca.bargain':rank};
  const initialMp=a.mp,initialMagic=battleStat(c,a,'magic');
  let activated=false,burstHits=0,naturalPulses=0,trace=[];
  for(let i=0;i<60&&turns.length<5;i++){
   const actor=activeActor(b),round=b.round,phase=b.phase;
   let abilityId='$defend',targetId=actor.id;
   if(round===1&&['shashthi','astraea'].includes(actor.id)){abilityId='$attack';targetId='enemy_0';}
   if(actor.id==='bianca'){
    assert.ok(b.moonlight.party.active?.id==='bountiful_seed');
    if(!activated){assert.equal(a.resourceValues.harvest_credit,6);activated=true;}
    abilityId=round===3?'bianca.bargain':phase==='extra'?'bianca.harvest':'bianca.opening';
    targetId=abilityId==='bianca.bargain'?a.id:'enemy_1';
    if(round===3)a.statuses.push({id:'exposure_dark',remaining:null,stacks:1,sourceId:'enemy_0'});
    const before=a.resourceValues.harvest_credit;
    executeAction(b,{actorId:actor.id,abilityId,targetId});
    const pulseStart=b.events.findIndex(e=>e.type==='ability_cast'&&e.sourceId==='moonlight_party');
    const commands=b.events.slice(0,pulseStart<0?undefined:pulseStart).filter(e=>e.type==='damage'&&e.sourceId==='moonlight_party'&&e.reaction&&e.targetId==='enemy_1');
    if(abilityId==='bianca.harvest'){assert.equal(commands.length,3);burstHits+=commands.length;}
    else assert.equal(commands.length,0);
    turns.push([round,phase,abilityId,before,a.resourceValues.harvest_credit,a.mp]);
    if(abilityId==='bianca.bargain'){
     assert.ok(!a.statuses.some(s=>c.statuses[s.id].kind==='debuff'));
     assert.ok(Math.abs(battleStat(c,a,'magic')-initialMagic-12*1.05**(rank-1))<1e-8);
     assert.equal(a.statuses.find(s=>s.id==='bianca_acumen').remaining,3);
    }
   }else executeAction(b,{actorId:actor.id,abilityId,targetId});
   naturalPulses+=b.events.filter(e=>e.type==='ability_cast'&&e.sourceId==='moonlight_party').length;
   trace.push(...b.events.filter(e=>e.type==='moonlight_enter'));
  }
  assert.deepEqual(turns,[[1,'main','bianca.opening',6,6,initialMp-5],[1,'extra','bianca.harvest',6,3,initialMp-15],[2,'main','bianca.opening',3,3,initialMp-20],[2,'extra','bianca.harvest',3,0,initialMp-30],[3,'main','bianca.bargain',0,0,initialMp-35]]);
  assert.equal(burstHits,6);assert.equal(naturalPulses,2);assert.equal(trace.length,1);
  assert.equal(b.moonlight.party.active.expiresAfterRound,3);
  console.log('Bianca Rank '+rank+' combo: '+JSON.stringify({turns,commandHits:burstHits,naturalPulses,activationCount:trace.length,magicAfter:Math.round(battleStat(c,a,'magic')*100)/100}));
 }
});
