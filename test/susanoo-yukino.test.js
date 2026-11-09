import {test} from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,activeActor,executeAction,forecastBattleAction,planAutoBattleTurn} from '../src/core/battle.js';
import {createArenaBattle} from '../src/core/arena.js';
import {seededRandom} from '../src/core/random.js';
import {teamResourceState} from '../src/core/team-resources.js';
import {battleStat} from '../src/core/stat-values.js';
import {resolveRankedAbility} from '../src/core/skill-resolver.js';
import {resolveCharacter} from '../src/core/progression.js';
import {validateContent} from '../src/core/content.js';
import {skillPresentation,passivePresentation} from '../src/ui/skill-copy.js';
import {skillCost,skillScaling} from '../src/ui/skill-presentation.js';
import {snapshotChronicleBattle,restoreChronicleBattle} from '../src/core/chronicle-combat.js';
const c0=await loadContent();
function campaign(c,party){const s=createGameSave(c);s.party=party;s.partyPresets[0].slots=[...party];s.unlockedCharacterIds=Object.keys(c.characters);return s;}
function setup(party=['susanoo','yukino','shion','kaguya']){const c=structuredClone(c0),s=campaign(c,party),b=createBattle(c,s,'forest_patrol',seededRandom(9),{enemyLevel:1});for(const a of b.actors){a.hp=a.stats.maxHp=10000;a.mp=a.stats.maxMp=200;a.stats.attack=a.stats.magic=100;a.stats.defense=a.stats.resistance=0;a.baseStats={...a.stats};a.statuses=[];a.gearEffects=[];a.cooldowns={};a.weaknesses=[];a.resistances={};if(!['susanoo','yukino','shion','kaguya'].includes(a.characterId??a.id))a.passive=null;}const unit=id=>b.actors.find(a=>(a.characterId??a.id)===id),enemies=b.actors.filter(a=>a.team==='enemy');pool(b).value=0;return {b,c,s,unit,enemies,e:enemies[0]};}
const pool=b=>teamResourceState(b,'party','sword_soul');
function use(b,a,id,t=a){b.queue=[a.id,...b.actors.filter(x=>x.id!==a.id&&x.hp>0).map(x=>x.id)];b.cursor=0;return executeAction(b,{actorId:a.id,abilityId:id,targetId:t.id});}
function waitRound(b){const a=b.actors.find(a=>a.team==='enemy'&&a.hp>0),id='test.wait';b.content.abilities[id]={id,name:'Chờ',target:'self',effects:[]};a.abilities.push(id);b.queue=[a.id];b.cursor=0;executeAction(b,{actorId:a.id,abilityId:id,targetId:a.id});}
const hits=(b,a)=>b.events.filter(e=>e.type==='damage'&&e.sourceId===a.id);
test('official roster, save migration and native previews are complete',()=>{const s=createGameSave(c0);for(const id of ['susanoo','yukino']){assert.ok(c0.banners.standard.characterPool.includes(id));delete s.characters[id];}const old=decodeGameSave(encodeGameSave(s,c0),c0);for(const id of ['susanoo','yukino']){assert.ok(old.characters[id]);assert.ok(!old.unlockedCharacterIds.includes(id));assert.ok(passivePresentation(c0.characters[id],c0).facts.length);}assert.deepEqual(validateContent(c0),[]);});
test('Susanoo prepared and live conversion uses current DEF/RES before ATK buffs, with fixed cap',()=>{const {b,c,unit}=setup(),a=unit('susanoo');a.stats.defense=a.baseStats.defense=60;a.stats.resistance=a.baseStats.resistance=100;assert.equal(battleStat(c,a,'attack'),120);a.statuses.push({id:'susanoo_guard',remaining:3,sourceId:a.id},{id:'tsukiha_prayer',remaining:3,sourceId:a.id});assert.equal(battleStat(c,a,'attack'),186);a.stats.defense=a.baseStats.defense=200;assert.equal(battleStat(c,a,'attack'),187.5);const prepared=resolveCharacter(c0,campaign(c0,['susanoo']),'susanoo');assert.equal(prepared.stats.attack,38);});
test('Susanoo offering ranks defense buffs, grants one explicit soul and main-turn lifetime',()=>{const {b,c,unit}=setup(),a=unit('susanoo');use(b,a,'susanoo.offering');assert.equal(a.statuses.find(s=>s.id==='susanoo_guard').remaining,3);assert.equal(pool(b).value,4);b.phase='extra';use(b,a,'$defend');assert.equal(a.statuses.find(s=>s.id==='susanoo_guard').remaining,3);assert.equal(resolveRankedAbility(c,a,'susanoo.offering',5).effects[0].appliedModifiers.defense,.2*1.05**4);});
test('Susanoo burst pays four souls or MP, never both, and preserves authored cooldown',()=>{for(const funded of [false,true]){const {b,unit,e}=setup(),a=unit('susanoo');pool(b).value=funded?4:3;use(b,a,'susanoo.burst',e);assert.equal(a.mp,funded?200:172);assert.equal(hits(b,a)[0].amount,600);assert.equal(a.cooldowns['susanoo.burst'],4);}});
test('Yukino answers only explicit ally skills; Shion response cannot recurse and Main/Extra share quota',()=>{const {b,unit,e}=setup(),y=unit('yukino'),s=unit('susanoo');use(b,s,'susanoo.offering');assert.equal(hits(b,y).length,1);assert.equal(hits(b,y)[0].amount,150);assert.equal(pool(b).value,4);b.phase='extra';s.cooldowns={};use(b,s,'susanoo.offering');assert.equal(hits(b,y).length,1);assert.equal(hits(b,y)[0].amount,150);s.cooldowns={};use(b,s,'susanoo.offering');assert.equal(hits(b,y).length,0);b.phase='main';waitRound(b);s.cooldowns={};use(b,s,'susanoo.offering');assert.equal(hits(b,y).length,1);assert.equal(hits(b,y)[0].targetId,'enemy_2');});
test('own skill, basic natural gain, and passive resource generation never trigger Yukino',()=>{const {b,unit,e}=setup(),y=unit('yukino');use(b,y,'yukino.offering',e);assert.equal(hits(b,y).filter(e=>e.reaction).length,0);use(b,unit('susanoo'),'susanoo.strike',e);assert.equal(hits(b,y).length,0);waitRound(b);assert.equal(hits(b,y).length,0);});
test('Yukino per-target souls include kills and shield hits, exclude dodges, cap at three',()=>{const {b,unit,enemies,e}=setup(),y=unit('yukino');e.hp=1;enemies[1].shield=1000;enemies[2].passive={type:'none',evasion:{baseChance:1,perBaseSpeed:0,cap:1,damageTypes:['magical']}};use(b,y,'yukino.offering',e);const gains=b.events.filter(e=>e.type==='team_resource_created'&&e.sourceId===y.id);assert.equal(gains[0].created,2);assert.equal(gains[1].created,1);assert.equal(hits(b,y).length,2);});
test('Yukino burst shares total coefficient using target snapshot; consumes all real souls once',()=>{for(const n of [0,3,4,6,10]){const {b,unit,enemies,e}=setup(),y=unit('yukino');pool(b).value=n;e.hp=1;use(b,y,'yukino.burst',e);assert.equal(y.mp,n>=4?200:172);const amount=(400/3)*(1+(n>=4?(n-4)*.1:0));assert.equal(hits(b,y).find(h=>h.targetId===enemies[1].id).amount,Math.floor(amount));assert.equal(pool(b).value,n>=4?1:n+1);assert.equal(b.events.filter(e=>e.type==='team_resource_spent').length,n>=4?1:0);}});
test('Yukino shared coefficient is 400% against one target and scales Rank only once',()=>{const {b,c,unit,enemies,e}=setup(),y=unit('yukino');for(const a of enemies.slice(1))a.hp=0;use(b,y,'yukino.burst',e);assert.equal(hits(b,y)[0].amount,400);assert.equal(resolveRankedAbility(c,y,'yukino.burst',5).effects[0].rankDamageFactor,1.1**4);});
test('forecast, carry and AI keep paid pools, passive quota and RNG local',()=>{const {b,c,unit,e}=setup(),a=unit('susanoo'),y=unit('yukino');b.queue=[a.id,e.id];b.cursor=0;const before=b.random.getState(),trial=forecastBattleAction(b,{actorId:a.id,abilityId:'susanoo.offering',targetId:a.id});assert.equal(pool(b).value,0);assert.equal(b.random.getState(),before);assert.ok(trial.events.some(e=>e.type==='reaction'&&e.sourceId===y.id));use(b,a,'susanoo.offering');const restored=restoreChronicleBattle(c,snapshotChronicleBattle(b));a.cooldowns={};const ra=restored.actors.find(x=>x.id===a.id);ra.cooldowns={};use(restored,ra,'susanoo.offering');assert.equal(hits(restored,y).length,1);ra.cooldowns={};use(restored,ra,'susanoo.offering');assert.equal(hits(restored,y).length,0);assert.ok(planAutoBattleTurn(b));});
test('public cost and previews never leak undefined for consume-all or natives',()=>{const {b,c,unit,e}=setup(),y=unit('yukino');pool(b).value=10;for(const id of ['susanoo','yukino'])for(const s of c.characters[id].abilities){const a=unit(id),skill=c.abilities[s],p=skillPresentation(skill,a,c);assert.ok(p.facts.length);assert.doesNotMatch(JSON.stringify([p,skillCost(skill,a,b),skillScaling(skill,a,c,{teamSpent:10})]),/undefined|NaN/);}assert.match(skillCost(c.abilities['yukino.burst'],y,b),/10 Hồn Kiếm/);});
test('Arena enemy-side explicit creation fuels only its own reaction and resource pool',()=>{const c=structuredClone(c0),b=createArenaBattle(c,campaign(c,['susanoo','yukino','shion','kaguya']),'mirror'),foe=b.actors.find(a=>a.team==='enemy'&&a.characterId==='susanoo'),y=b.actors.find(a=>a.team==='enemy'&&a.characterId==='yukino');const own=pool(b).value;use(b,foe,'susanoo.offering');assert.ok(hits(b,y).length);assert.equal(pool(b).value,own);assert.ok(teamResourceState(b,'enemy','sword_soul').value>0);});

test('actual Main and Extra progression shares two uses and refreshes only in the next round',()=>{
 const {b,unit,enemies}=setup(),shion=unit('shion'),susanoo=unit('susanoo'),yukino=unit('yukino');
 const gain='test.directSoul';b.content.abilities[gain]={id:gain,name:'Gọi hồn',target:'self',cost:{mp:0},effects:[{type:'team_resource',resource:'sword_soul',amount:1}]};
 shion.abilities.push(gain);susanoo.abilities.push(gain);
 b.queue=[shion.id,susanoo.id,yukino.id,unit('kaguya').id,...enemies.map(a=>a.id)];b.cursor=0;
 const cast=(a,id)=>executeAction(b,{actorId:a.id,abilityId:id,targetId:a.id});
 cast(shion,'shion.offering');assert.equal(hits(b,yukino).length,1);
 cast(susanoo,'susanoo.offering');assert.equal(hits(b,yukino).length,1);
 for(let n=0;n<20&&b.phase!=='extra';n++)cast(activeActor(b),'$defend');
 assert.equal(b.phase,'extra');assert.equal(b.round,1);
 for(let n=0;n<5&&activeActor(b).id!==susanoo.id;n++)cast(activeActor(b),'$defend');
 assert.equal(activeActor(b).id,susanoo.id);cast(susanoo,gain);
 assert.equal(hits(b,yukino).length,0);assert.equal(b.round,2);
 const next=activeActor(b);assert.equal(next.id,shion.id);cast(next,gain);
 assert.equal(hits(b,yukino).length,1);assert.equal(hits(b,yukino)[0].amount,90);
});
test('legacy single-use native quotas and invalid configuration stay controlled',()=>{
 const {b,c,unit}=setup(),y=unit('yukino'),a=unit('susanoo');delete y.passive.perRound;
 use(b,a,'susanoo.offering');assert.equal(hits(b,y).length,1);a.cooldowns={};use(b,a,'susanoo.offering');assert.equal(hits(b,y).length,0);
 for(const n of [0,-1,1.5,5]){const copy=structuredClone(c);copy.characters.yukino.passive.perRound=n;assert.ok(validateContent(copy).some(x=>x.includes('invalid creation follow-up')));}
});
