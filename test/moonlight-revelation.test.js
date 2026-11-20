import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,activeActor,getActor,forecastBattleAction} from '../src/core/battle.js';
import {changeRevelation,activeMoonlight} from '../src/core/moonlight-revelation.js';
import {battleStat} from '../src/core/stat-values.js';
import {syncTeamStatAuras} from '../src/core/knight-passives.js';
import {createArenaBattle} from '../src/core/arena.js';
import {resolveRankedAbility} from '../src/core/skill-resolver.js';
const c=await loadContent();
function account(party=['noelle','rhett','gawain','tywin'],enabled=true){let s=createGameSave(c);s.party=party;s.partyPresets[0].slots=party;s.unlockedCharacterIds=[...new Set([...s.unlockedCharacterIds,...party])];s.recruitmentShards=90;if(enabled)for(const id of party.filter(id=>c.characters[id]?.moonlightRevelation))s=changeRevelation(s,c,id,true);return s;}
function setup(party,enabled=true){const b=createBattle(c,account(party,enabled),'forest_patrol',()=>.99);for(const a of b.actors){a.hp=a.stats.maxHp=100000;if(a.team==='enemy'){a.stats.attack=0;a.stats.magic=0;a.stats.defense=0;a.stats.resistance=0;a.weaknesses=[];}}return b;}
function cast(b,id,ability,target){b.queue=[id,...b.actors.filter(a=>a.id!==id&&a.hp>0).map(a=>a.id)];b.cursor=0;executeAction(b,{actorId:id,abilityId:ability,targetId:target??'enemy_0'});}
function storm(b,water='tywin'){cast(b,'noelle','noelle.thunder');cast(b,water,'$attack');assert.ok(activeMoonlight(b,'party','thunder_wrath'));}
function next(b){const r=b.round;for(let i=0;i<50&&b.round===r&&!b.outcome;i++){const a=activeActor(b);executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});}assert.equal(b.round,r+1);}
const hits=(b,id,target='enemy_0')=>b.events.filter(e=>e.type==='damage'&&e.sourceId===id&&e.targetId===target);

test('revelation costs 30 Pure per character once, toggle is free and persistent',()=>{
 let s=account(undefined,false),old=structuredClone(s);s=changeRevelation(s,c,'rhett',true);assert.equal(s.recruitmentShards,60);assert.deepEqual(old.moonlightRevelations,{});
 s=changeRevelation(s,c,'rhett',false);assert.equal(s.recruitmentShards,60);assert.equal(s.moonlightRevelations.rhett.enabled,false);s=changeRevelation(s,c,'rhett',true);assert.equal(s.recruitmentShards,60);
 assert.deepEqual(decodeGameSave(encodeGameSave(s,c),c),s);
 const oldData=JSON.parse(encodeGameSave(s,c));delete oldData.moonlightRevelations;assert.deepEqual(decodeGameSave(JSON.stringify(oldData),c).moonlightRevelations,{});
});
test('invalid, unowned, poor and locked revelation edits cannot spend or mutate',()=>{
 const s=account(undefined,false);s.recruitmentShards=29;const before=structuredClone(s);assert.throws(()=>changeRevelation(s,c,'rhett',true));assert.deepEqual(s,before);
 assert.throws(()=>changeRevelation(s,c,'rhett',true,{battleActive:true}));assert.throws(()=>changeRevelation(s,c,'rhett',false));assert.throws(()=>changeRevelation(s,c,'noelle',true));assert.throws(()=>changeRevelation(s,c,'rhett','yes'));
 const bad=JSON.parse(encodeGameSave(s,c));bad.moonlightRevelations={noelle:{unlocked:true,enabled:true}};assert.throws(()=>decodeGameSave(JSON.stringify(bad),c));
});
test('revelation receivers never grant blessing access, including Aisha',()=>{
 const b=setup(['rhett','gawain','tywin','aisha']);assert.equal(b.moonlight.party,undefined);cast(b,'tywin','$attack');getActor(b,'rhett').resourceValues.charge=3;cast(b,'rhett','rhett.overload');assert.equal(b.moonlight.party,undefined);assert.equal(hits(b,'rhett').length,1);
});
test('Rhett and Tywin only gain their ATK bonuses while enabled and storm is active',()=>{
 const b=setup();syncTeamStatAuras(b);assert.equal(battleStat(c,getActor(b,'rhett'),'attack'),36);storm(b);syncTeamStatAuras(b);assert.ok(Math.abs(battleStat(c,getActor(b,'rhett'),'attack')-46.8)<1e-8);assert.equal(battleStat(c,getActor(b,'tywin'),'attack'),41.25);
 getActor(b,'rhett').moonlightRevelationEnabled=false;syncTeamStatAuras(b);assert.equal(battleStat(c,getActor(b,'rhett'),'attack'),36);
 b.moonlight.party.active=null;syncTeamStatAuras(b);assert.equal(battleStat(c,getActor(b,'tywin'),'attack'),33);
});
test('Rhett consumes charges once: full three adds Moon to main hit and three fixed bonus waves',()=>{
 const b=setup();storm(b);const a=getActor(b,'rhett');a.resourceValues.charge=3;cast(b,'rhett','rhett.overload');const h=hits(b,'rhett');assert.equal(h.length,4);assert.ok(h.every(e=>e.elements.includes('moon')&&e.elements.includes('thunder')));assert.equal(a.resourceValues.charge,0);assert.equal(a.mp,37);
});
test('two Rhett charges still add two bonus waves but main explosion stays Thunder',()=>{
 const b=setup();storm(b);getActor(b,'rhett').resourceValues.charge=2;cast(b,'rhett','rhett.overload');const h=hits(b,'rhett');assert.equal(h.length,3);assert.equal(h[0].element,'thunder');assert.equal(h[0].elements,undefined);assert.ok(h.slice(1).every(e=>e.elements.includes('moon')));
});
test('Rhett bonus stays at 70% through Rank 1, 5 and Mastery 3 while main damage grows',()=>{
 assert.equal(c.characters.rhett.moonlightRevelation.bonusMultiplier,.7);
 const totals=[],main=[];for(const rank of [1,5,8]){const b=setup();storm(b);const a=getActor(b,'rhett');a.skillRanks={'rhett.overload':rank};a.resourceValues.charge=3;cast(b,'rhett','rhett.overload');totals.push(hits(b,'rhett')[1].amount);main.push(hits(b,'rhett')[0].amount);}assert.deepEqual(totals,[totals[0],totals[0],totals[0]]);assert.ok(main[2]>main[1]&&main[1]>main[0]);
});
test('Tywin extra Water/Moon hit stays at 250% through ranks and mastery, with no extra MP',()=>{
 assert.equal(c.characters.tywin.moonlightRevelation.bonusMultiplier,2.5);
 const totals=[],main=[];for(const rank of [1,5,8]){const b=setup();storm(b);const a=getActor(b,'tywin'),mp=a.mp;a.skillRanks={'tywin.truecut':rank};cast(b,'tywin','tywin.truecut');const h=hits(b,'tywin');assert.equal(h.length,2);assert.ok(h.every(e=>e.elements.includes('water')&&e.elements.includes('moon')));assert.equal(a.mp,mp-16);totals.push(h[1].amount);main.push(h[0].amount);}assert.deepEqual(totals,[totals[0],totals[0],totals[0]]);assert.ok(main[2]>main[1]&&main[1]>main[0]);
});
test('Gawain orders 180% blessing ATK and Noelle responds without paying MP',()=>{
 const b=setup();storm(b);const mp=getActor(b,'noelle').mp;cast(b,'gawain','gawain.judgment');assert.ok(b.events.some(e=>e.type==='reaction'&&e.sourceId==='moonlight_party'));assert.ok(b.events.some(e=>e.type==='reaction'&&e.sourceId==='noelle'));assert.equal(getActor(b,'noelle').mp,mp);assert.equal(b.moonlight.party.active.followUps.noelle.count,1);
 const amount=hits(b,'moonlight_party')[0].amount;assert.ok(amount>0);assert.equal(getActor(b,'moonlight_party').stats.attack,(46.8+33+41.25+35)/4);const peer=setup();storm(peer);cast(peer,'gawain','gawain.judgment');assert.equal(hits(peer,'moonlight_party')[0].amount,amount);
});
test('Gawain without active/enabled revelation still casts ordinary judgment',()=>{
 for(const enabled of [false,true]){const b=setup(undefined,enabled);cast(b,'gawain','gawain.judgment');assert.equal(b.events.filter(e=>e.sourceId==='moonlight_party').length,0);assert.ok(hits(b,'gawain').length);}
 const b=setup(undefined,false);storm(b);cast(b,'gawain','gawain.judgment');assert.equal(b.events.filter(e=>e.sourceId==='moonlight_party').length,0);
});
test('Gawain forecast cannot spend live quota, charges or MP',()=>{
 const b=setup();storm(b);b.queue=['gawain','noelle','tywin','rhett','enemy_0'];b.cursor=0;const before=structuredClone(b.moonlight),mp=getActor(b,'gawain').mp;const trial=forecastBattleAction(b,{actorId:'gawain',abilityId:'gawain.judgment',targetId:'enemy_0'});assert.equal(trial.moonlight.party.active.followUps.noelle.count,1);assert.deepEqual(b.moonlight,before);assert.equal(getActor(b,'gawain').mp,mp);
});
test('Aisha mode entry deals AoE, buffs only Water/Thunder, doubles and reverts dynamically',()=>{
 const b=setup(['aisha','noelle','tywin','iris']);cast(b,'aisha','aisha.workshop');assert.ok(hits(b,'aisha').length);syncTeamStatAuras(b);assert.equal(battleStat(c,getActor(b,'aisha'),'attack'),45);assert.equal(battleStat(c,getActor(b,'noelle'),'attack'),43.75);assert.equal(battleStat(c,getActor(b,'iris'),'attack'),c.characters.iris.stats.attack);
 storm(b);syncTeamStatAuras(b);assert.equal(battleStat(c,getActor(b,'aisha'),'attack'),54);assert.equal(battleStat(c,getActor(b,'noelle'),'attack'),52.5);assert.equal(getActor(b,'aisha').modeExpiresAfterRound,5);
 b.moonlight.party.active=null;syncTeamStatAuras(b);assert.equal(battleStat(c,getActor(b,'aisha'),'attack'),45);getActor(b,'aisha').hp=0;syncTeamStatAuras(b);assert.equal(battleStat(c,getActor(b,'noelle'),'attack'),35);
});
test('Aisha pulses once at start of rounds, not on cast or Extra Turn, expires after round five',()=>{
 const b=setup(['aisha','noelle','tywin','iris']);cast(b,'aisha','aisha.workshop');const a=getActor(b,'aisha');assert.equal(b.events.filter(e=>e.abilityId==='aisha.pulse').length,0);next(b);assert.equal(b.events.filter(e=>e.type==='reaction'&&e.abilityId==='aisha.pulse').length,1);
 b.phase='extra';cast(b,'aisha','$defend','aisha');assert.equal(b.events.filter(e=>e.abilityId==='aisha.pulse').length,0);b.phase='main';
 while(b.round<6){a.mp=120;next(b);}assert.equal(a.activeMode,undefined);assert.equal(b.events.filter(e=>e.type==='reaction'&&e.abilityId==='aisha.pulse').length,0);
});
test('Aisha mode damage and aura both grow by their normal rank groups',()=>{
 const actor={...structuredClone(c.characters.aisha),skillRanks:{'aisha.workshop':5}},skill=resolveRankedAbility(c,actor,'aisha.workshop');assert.ok(skill.effects[1].rankDamageFactor>1.46);assert.ok(skill.effects[0].modeAppliedModifiers.attack>.30);
});
test('Aisha end-round MP restoration includes herself and final blessing round, excludes other elements and KO',()=>{
 const b=setup(['aisha','noelle','tywin','iris']);storm(b);for(const a of b.actors.filter(a=>a.team==='party'))a.mp=0;next(b);
 assert.ok(b.events.some(e=>e.type==='mp_restore'&&e.sourceId==='aisha'&&e.targetId==='noelle'));
 const a=getActor(b,'aisha');assert.ok(a.mp>=10);assert.equal(b.events.filter(e=>e.type==='mp_restore'&&e.sourceId==='aisha'&&e.targetId==='iris').length,0);
});
test('Aisha is official in gacha, has stable ID 118 and no board-wide mode presentation',()=>{
 assert.equal(c.characters.aisha.releaseId,118);assert.ok(c.banners.standard.characterPool.includes('aisha'));assert.equal(c.characters.aisha.combatModes.workshop.presentationScope,'none');assert.equal(c.characters.aisha.moonlightBlessings,undefined);
});

test('Gawain command really uses 180% instead of the natural 100% coefficient',()=>{
 const amounts=[];for(const multiplier of [1,1.8]){const b=setup();storm(b);getActor(b,'gawain').moonlightRevelation.commandMultiplier=multiplier;cast(b,'gawain','gawain.judgment');amounts.push(hits(b,'moonlight_party')[0].amount);}
 assert.ok(Math.abs(amounts[1]/amounts[0]-1.8)<.04);
});
test('last-round Aisha MP recovery happens before blessing expiry and never again without storm',()=>{
 const b=setup(['aisha','noelle','tywin','iris']);storm(b);while(b.round<3)next(b);
 for(const a of b.actors.filter(a=>a.team==='party'))a.mp=0;
 next(b);assert.equal(b.moonlight.party.active,null);
 const restores=b.events.filter(e=>e.type==='mp_restore'&&e.sourceId==='aisha');assert.equal(restores.find(e=>e.targetId==='aisha').amount,10);assert.equal(restores.find(e=>e.targetId==='noelle').amount,8);assert.equal(restores.find(e=>e.targetId==='tywin').amount,6);assert.ok(!restores.some(e=>e.targetId==='iris'));
 next(b);assert.equal(b.events.filter(e=>e.type==='mp_restore'&&e.sourceId==='aisha').length,0);
});
test('Aisha death prevents her passive recovery even though the independent blessing remains',()=>{
 const b=setup(['aisha','noelle','tywin','iris']);storm(b);getActor(b,'aisha').hp=0;getActor(b,'noelle').mp=0;b.queue=b.actors.filter(a=>a.hp>0).map(a=>a.id);b.cursor=0;next(b);assert.ok(b.moonlight.party.active);assert.equal(b.events.filter(e=>e.type==='mp_restore'&&e.sourceId==='aisha').length,0);
});
test('both PvP teams can use the revelation with their own Noelle and Gawain',()=>{
 const s=account(),b=createArenaBattle(c,s,'mirror',98);for(const a of b.actors)a.hp=a.stats.maxHp=100000;
 const id=(team,name)=>b.actors.find(a=>a.team===team&&a.definitionId===name).id;
 for(const team of ['party','enemy']){
  const target=id(team==='party'?'enemy':'party','noelle');cast(b,id(team,'noelle'),'noelle.thunder',target);cast(b,id(team,'tywin'),'$attack',target);
  cast(b,id(team,'gawain'),'gawain.judgment',target);assert.ok(b.events.some(e=>e.type==='reaction'&&e.sourceId==='moonlight_'+team));assert.ok(b.events.some(e=>e.type==='reaction'&&e.sourceId===id(team,'noelle')));
 }
 assert.equal(b.moonlight.party.active.followUps[id('party','noelle')].count,1);assert.equal(b.moonlight.enemy.active.followUps[id('enemy','noelle')].count,1);
});
test('Aisha periodic damage grows with workshop rank, including rank 5 in PvP',()=>{
 const amounts=[];for(const rank of [1,5]){const b=setup(['aisha','noelle','tywin','iris']);getActor(b,'aisha').skillRanks={'aisha.workshop':rank};cast(b,'aisha','aisha.workshop');next(b);amounts.push(hits(b,'aisha').find(e=>e.abilityId==='aisha.pulse').amount);}assert.ok(amounts[1]>amounts[0]*1.4);
});
