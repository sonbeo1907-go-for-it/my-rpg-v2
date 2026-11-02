import {seededRandom} from '../src/core/random.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {resolveCharacter} from '../src/core/progression.js';
import {createBattle,executeAction,getActor,basicAbility,DEFEND,abilityAvailability,targetsFor} from '../src/core/battle.js';
import {battleStat,battleMaxMp,clampBattleMp} from '../src/core/stat-values.js';
import {resolveRankedAbility} from '../src/core/skill-resolver.js';
import {mpCost} from '../src/core/conditional-combat.js';
import {validateContent} from '../src/core/content.js';
import {skillPresentation,passivePresentation} from '../src/ui/skill-copy.js';
import {compactSkillScaling,statusDetails} from '../src/ui/combat-presentation.js';
import {snapshotChronicleBattle,restoreChronicleBattle} from '../src/core/chronicle-combat.js';
import {createDungeonRun,advanceDungeonWave} from '../src/core/dungeon.js';
const content=await loadContent();
function fixture(party=['arthur','artesia','chelsea','elaine'],mutate=()=>{}){
 const c=structuredClone(content);mutate(c);const save=createGameSave(c);save.unlockedCharacterIds=Object.keys(c.characters);save.party=party;save.partyPresets[0].slots=[...party];
 const b=createBattle(c,save,'forest_patrol',seededRandom(52),{enemyLevel:1});
 for(const e of b.actors.filter(a=>a.team==='enemy')){e.hp=e.stats.maxHp=100000;e.stats.defense=e.stats.resistance=0;e.weaknesses=[];e.resistances={};}
 return {b,c,save};
}
function use(b,id,ability,target,reset=true){
 b.outcome=null;b.phase='main';b.queue=[id,id==='enemy_0'?b.actors.find(a=>a.team==='party'&&a.hp>0).id:'enemy_0'];b.cursor=0;
 const a=getActor(b,id);if(reset)a.cooldowns={};const skill=ability==='$attack'?basicAbility(a):ability==='$defend'?DEFEND:b.content.abilities[ability];
 executeAction(b,{actorId:id,abilityId:ability,targetId:target??(skill.target==='enemy'?'enemy_0':id)});
}
const status=(b,id,key)=>getActor(b,id).statuses.find(s=>s.id===key);
const damage=(b,id)=>b.events.filter(e=>e.type==='damage'&&!e.periodic&&e.sourceId===id).reduce((n,e)=>n+e.amount+e.absorbed,0);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);

test('Artesia is a formal recruit, magical Light support; old saves receive locked default state',()=>{
 const {c,save}=fixture();assert.deepEqual(validateContent(c),[]);assert.ok(c.banners.standard.characterPool.includes('artesia'));assert.equal(c.characters.artesia.roleGroup,'offensive_support');assert.equal(basicAbility(c.characters.artesia).effects[0].damageType,'magical');assert.equal(c.characters.artesia.element,'light');
 const old=createGameSave(c);delete old.characters.artesia;const loaded=decodeGameSave(JSON.stringify({...old}),c);assert.equal(loaded.characters.artesia.level,1);assert.ok(!loaded.unlockedCharacterIds.includes('artesia'));
 assert.deepEqual(decodeGameSave(encodeGameSave(save,c),c).characters.artesia,save.characters.artesia);
});
test('all four formation positions select fixed adjacent slots including wrap, without self',()=>{
 for(let slot=0;slot<4;slot++){
  const party=['arthur','chelsea','elaine'];party.splice(slot,0,'artesia');const {b}=fixture(party),a=getActor(b,'artesia');
  const expected=[party[(slot+3)%4],party[(slot+1)%4]].sort();assert.deepEqual(targetsFor(b,a,b.content.abilities['artesia.twinstars']).map(x=>x.id).sort(),expected);
  use(b,a.id,'artesia.twinstars');for(const id of expected){near(battleStat(b.content,getActor(b,id),'attack'),getActor(b,id).stats.attack*1.25);assert.equal(status(b,id,'twinstar_guidance').remaining,3);}assert.equal(a.statuses.length,0);
 }
});
test('empty/fallen neighboring slots are never compressed; both unavailable blocks paid skills',()=>{
 const {b}=fixture(['artesia',null,'arthur','elaine']);getActor(b,'elaine').hp=0;
 for(const id of getActor(b,'artesia').abilities)assert.equal(abilityAvailability(b,getActor(b,'artesia'),b.content.abilities[id]).ok,false);
 getActor(b,'arthur').mp=0;use(b,'artesia','$defend');assert.equal(getActor(b,'arthur').mp,0);
});
test('Defend gives owner the usual 5%, only neighbors 3%, and triggers on real extra-turn Defend',()=>{
 const {b}=fixture();for(const a of b.actors.filter(a=>a.team==='party'))a.mp=0;use(b,'artesia','$defend');
 assert.equal(getActor(b,'artesia').mp,6);assert.equal(getActor(b,'arthur').mp,2);assert.equal(getActor(b,'chelsea').mp,Math.ceil(getActor(b,'chelsea').stats.maxMp*.03));assert.equal(getActor(b,'elaine').mp,0);
 b.phase='extra';b.queue=['artesia','enemy_0'];b.cursor=0;executeAction(b,{actorId:'artesia',abilityId:'$defend',targetId:'artesia'});assert.equal(getActor(b,'arthur').mp,4);assert.equal(getActor(b,'artesia').mp,12);
});
test('MP capacity is temporary, does not refill on apply/refresh and increases percentage recovery',()=>{
 const {b}=fixture(),a=getActor(b,'arthur');a.mp=10;use(b,'artesia','artesia.starsea');assert.equal(a.stats.maxMp,40);assert.equal(battleMaxMp(b.content,a),56);assert.equal(a.mp,10);
 use(b,'artesia','artesia.starsea');assert.equal(battleMaxMp(b.content,a),56);assert.equal(a.mp,10);getActor(b,'artesia').mp=0;use(b,'artesia','$defend');assert.equal(a.mp,12);
 use(b,'arthur','$defend');assert.equal(a.mp,15);
});
test('capacity expiry clamps current MP, extra turns do not tick its duration; dispel clamps immediately',()=>{
 const {b,c}=fixture(),a=getActor(b,'arthur');use(b,'artesia','artesia.starsea');a.mp=56;
 b.phase='extra';b.queue=[a.id,'enemy_0'];b.cursor=0;executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});assert.equal(status(b,a.id,'starsea_capacity').remaining,3);
 use(b,a.id,'$defend');use(b,a.id,'$defend');assert.equal(battleMaxMp(c,a),56);use(b,a.id,'$defend');assert.equal(battleMaxMp(c,a),40);assert.equal(a.mp,40);
 use(b,'artesia','artesia.starsea');a.mp=56;c.abilities.test_dispel={id:'test_dispel',name:'Xóa',target:'enemy',effects:[{type:'dispel',all:true}]};getActor(b,'enemy_0').abilities.push('test_dispel');use(b,'enemy_0','test_dispel',a.id);assert.equal(a.mp,40);assert.equal(battleMaxMp(c,a),40);
});
test('capacity Rank grows 5% relatively; damage amplification remains 30% while its MP cost falls',()=>{
 const {b,c}=fixture(),a=getActor(b,'artesia');const power=resolveRankedAbility(c,a,'artesia.twinstars',5),cap=resolveRankedAbility(c,a,'artesia.starsea',5),amp=resolveRankedAbility(c,a,'artesia.destiny',5);
 near(power.effects[0].appliedModifiers.attack,.25*1.05**4);near(cap.effects[0].appliedModifiers.maxMp,.4*1.05**4);assert.equal(amp.effects[0].appliedModifiers,undefined);assert.ok(mpCost(amp,a)<18);assert.equal(c.statuses.destined_radiance.modifiers.damageBonus,.3);
});
test('ATK/MAG and capacity last three main turns and can be refreshed at round R+3',()=>{
 const {b,c}=fixture(),a=getActor(b,'artesia');use(b,a.id,'artesia.twinstars');assert.equal(a.cooldowns['artesia.twinstars'],3);
 for(let i=0;i<3;i++){b.queue=['artesia'];b.cursor=0;executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});}
 assert.equal(b.round,4);assert.equal(abilityAvailability(b,a,c.abilities['artesia.twinstars']).ok,true);
 const {b:other}=fixture();use(other,'artesia','artesia.destiny');assert.equal(getActor(other,'artesia').cooldowns['artesia.destiny'],4);
});
test('each recipient has independent three-use charges; support/Defend preserve, recast refreshes',()=>{
 const {b}=fixture();use(b,'artesia','artesia.destiny');const chelsea=getActor(b,'chelsea');assert.equal(status(b,'arthur','destined_radiance').charges,3);
 use(b,'arthur','$defend');use(b,chelsea.id,'chelsea.urgent');assert.equal(status(b,chelsea.id,'destined_radiance').charges,3);
 use(b,'arthur','$attack','enemy_0');assert.equal(status(b,'arthur','destined_radiance').charges,2);assert.equal(status(b,chelsea.id,'destined_radiance').charges,3);
 use(b,'artesia','artesia.destiny');assert.equal(status(b,'arthur','destined_radiance').charges,3);assert.equal(getActor(b,'arthur').statuses.filter(s=>s.id==='destined_radiance').length,1);
 for(let i=0;i<3;i++)use(b,'arthur','$attack','enemy_0');assert.equal(status(b,'arthur','destined_radiance'),undefined);
});
test('multi-hit AoE consumes once for the complete skill; uses the largest damageBonus while consuming all eligible buffs',()=>{
 const {b,c}=fixture(['arthur','artesia','chelsea','elaine'],c=>{c.abilities.test_area={id:'test_area',name:'Thử',target:'all_enemies',effects:[{type:'damage',element:'light',damageType:'physical',multiplier:1,hits:2}]};c.characters.arthur.abilities.push('test_area');});
 use(b,'arthur','test_area');const normal=damage(b,'arthur');use(b,'artesia','artesia.destiny');use(b,'arthur','test_area');assert.equal(damage(b,'arthur'),Math.floor(getActor(b,'arthur').stats.attack*1.3)*6);assert.ok(damage(b,'arthur')>normal);assert.equal(status(b,'arthur','destined_radiance').charges,2);
 getActor(b,'arthur').statuses.push({id:'empowered',remaining:3,sourceId:'artesia',stacks:1});use(b,'arthur','$attack','enemy_0');assert.equal(damage(b,'arthur'),Math.floor(getActor(b,'arthur').stats.attack*1.4));assert.equal(status(b,'arthur','empowered'),undefined);
});
test('shield damage consumes, a completely dodged skill does not',()=>{
 const {b,c}=fixture();use(b,'artesia','artesia.destiny');const e=getActor(b,'enemy_0');e.shield=1000;use(b,'arthur','$attack',e.id);assert.equal(status(b,'arthur','destined_radiance').charges,2);assert.ok(b.events.some(e=>e.type==='damage'&&e.absorbed>0));
 c.statuses.test_evasion={id:'test_evasion',name:'Né',kind:'buff',modifiers:{evasion:1}};e.statuses.push({id:'test_evasion',remaining:3});b.random=()=>0;use(b,'arthur','$attack',e.id);assert.equal(status(b,'arthur','destined_radiance').charges,2);
});
test('Chelsea counter and Aurora follow-up are amplified and consume a charge each',()=>{
 const {b}=fixture();use(b,'artesia','artesia.destiny');b.random=()=>0;use(b,'enemy_0','$attack','chelsea');assert.ok(b.events.some(e=>e.type==='reaction'&&e.kind==='counter'));assert.equal(status(b,'chelsea','destined_radiance').charges,2);assert.ok(damage(b,'chelsea')>0);
 const {b:x}=fixture(['iris','aurora','artesia','elaine']);use(x,'artesia','artesia.destiny');use(x,'iris','$attack','enemy_0');assert.equal(status(x,'aurora','destined_radiance').charges,2);assert.ok(damage(x,'aurora')>0);
});
test('automatic direct attacks consume once, periodic poison never consumes or amplifies itself',()=>{
 const {b,c}=fixture(['gawain','artesia','logia','elaine']);use(b,'artesia','artesia.destiny');const g=getActor(b,'gawain');const cloud=g.passive.statusId;g.statuses.push({id:cloud,remaining:3,sourceId:g.id});
 const last=getActor(b,'enemy_0');last.stats.speed=0;b.queue=[last.id,g.id];b.cursor=0;executeAction(b,{actorId:last.id,abilityId:'$defend',targetId:last.id});assert.equal(status(b,g.id,'destined_radiance').charges,2);
 const poison=Object.values(c.statuses).find(s=>s.damageOverTime);const e=getActor(b,'enemy_1');e.statuses.push({id:poison.id,remaining:2,potency:10,stacks:1,sourceId:g.id});b.queue=[last.id,e.id];b.cursor=0;executeAction(b,{actorId:last.id,abilityId:'$defend',targetId:last.id});assert.equal(status(b,g.id,'destined_radiance').charges,2);assert.equal(b.events.find(x=>x.periodic).amount,10);
});
test('battle snapshots preserve capacity and remaining charges; room transition retains ordinary dungeon state',()=>{
 const {b,c}=fixture();use(b,'artesia','artesia.starsea');use(b,'artesia','artesia.destiny');getActor(b,'arthur').mp=55;use(b,'arthur','$attack','enemy_0');const copy=restoreChronicleBattle(c,snapshotChronicleBattle(b));assert.equal(battleMaxMp(c,getActor(copy,'arthur')),56);assert.equal(getActor(copy,'arthur').mp,55);assert.equal(status(copy,'arthur','destined_radiance').charges,2);
 const {save}=fixture();const run=createDungeonRun(c,save,'gold_mine','easy',()=>.5);use(run.battle,'artesia','artesia.starsea');use(run.battle,'artesia','artesia.destiny');getActor(run.battle,'arthur').mp=55;run.battle.outcome='victory';advanceDungeonWave(c,run);assert.equal(battleMaxMp(c,getActor(run.battle,'arthur')),56);assert.equal(getActor(run.battle,'arthur').mp,55);assert.equal(status(run.battle,'arthur','destined_radiance').charges,3);
});
test('preview shows main-turn duration, remaining independent charges and capacity without irrelevant extra-turn instructions',()=>{
 const {b,c}=fixture();use(b,'artesia','artesia.destiny');const p=skillPresentation(c.abilities['artesia.destiny'],getActor(b,'artesia'),c);assert.match(p.facts.join(' '),/30%/);assert.match(p.facts.join(' '),/3 lần/);assert.ok(!p.rules.join(' ').includes('Lượt đã có'));
 const cap=skillPresentation(c.abilities['artesia.starsea'],getActor(b,'artesia'),c);assert.match(cap.rules.join(' '),/không tự hồi MP/);assert.match(cap.facts.join(' '),/40%/);assert.match(cap.facts.join(' '),/3 lượt chính/);
 assert.match(passivePresentation(getActor(b,'artesia'),c).facts.join(' '),/3%/);assert.match(compactSkillScaling(c.abilities['artesia.destiny'],getActor(b,'artesia'),null,c,b),/3 lần/);
 use(b,'arthur','$attack','enemy_0');assert.match(statusDetails(status(b,'arthur','destined_radiance'),getActor(b,'arthur'),b,c).duration,/2 lần/);
});
test('invalid charge/capacity definitions and invalid neighbor-regeneration passive are rejected',()=>{
 for(const mutate of [c=>c.statuses.destined_radiance.damageUses=0,c=>c.statuses.destined_radiance.consumeOnAttack=true,c=>c.statuses.starsea_capacity.modifiers.maxMp=Infinity,c=>c.characters.artesia.passive.ratio=-1]){const c=structuredClone(content);mutate(c);assert.ok(validateContent(c).length>0);}
});

test('temporary capacity adds with permanent percent modifiers using the same base as other stat buffs',()=>{
 const {b,c}=fixture(undefined,c=>{c.characters.arthur.passive={type:'stat_boost',name:'Dự trữ',modifiers:{maxMp:.2}};});
 const a=getActor(b,'arthur');assert.equal(a.stats.maxMp,48);use(b,'artesia','artesia.starsea');assert.equal(battleMaxMp(c,a),64);near(battleStat(c,a,'maxMp'),64);
});
