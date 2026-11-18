import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,executeEnemyTurn,activeActor,getActor,forecastBattleAction,abilityAvailability,basicAbility,DEFEND} from '../src/core/battle.js';
import {createArenaBattle} from '../src/core/arena.js';
import {seededRandom} from '../src/core/random.js';
import {validateContent} from '../src/core/content.js';
import {resolveCharacter} from '../src/core/progression.js';
import {resolveRankedAbility} from '../src/core/skill-resolver.js';
import {battleStat} from '../src/core/stat-values.js';
import {snapshotChronicleBattle,restoreChronicleBattle} from '../src/core/chronicle-combat.js';
import {createDungeonRun,advanceDungeonWave} from '../src/core/dungeon.js';
import {skillPresentation,passivePresentation} from '../src/ui/skill-copy.js';
import {compactSkillScaling} from '../src/ui/combat-presentation.js';
const content=await loadContent();
function fixture(party=['luka','gairyu','iris','elaine']){
 const c=structuredClone(content),s=createGameSave(c);s.unlockedCharacterIds=Object.keys(c.characters);s.party=[...party];s.partyPresets[0].slots=[...party];
 const b=createBattle(c,s,'forest_patrol',seededRandom(78),{enemyLevel:1});
 for(const a of b.actors.filter(a=>a.team==='enemy')){a.hp=a.stats.maxHp=100000;a.stats.defense=a.stats.resistance=0;a.weaknesses=[];a.resistances={};}
 return {b,c,s};
}
function use(b,id,skill,target,phase='main',resetCd=true){
 const a=getActor(b,id);b.queue=[id,b.actors.find(t=>t.team!==a.team&&t.hp>0).id];b.cursor=0;b.phase=phase;if(resetCd)a.cooldowns={};
 const def=skill==='$attack'?basicAbility(a):skill==='$defend'?DEFEND:b.content.abilities[skill];
 executeAction(b,{actorId:id,abilityId:skill,targetId:target??(def.target==='self'?id:b.actors.find(t=>t.team!==a.team&&t.hp>0).id)});
}
const hits=(b,id)=>b.events.filter(e=>e.type==='damage'&&e.sourceId===id&&!e.periodic);
const stacks=b=>getActor(b,'luka').resourceValues.rhythm;
function addSkill(b,actorId,{id='test_magic',element='fire',damageType='magical',target='all_enemies',hits:count=3,multiplier=.1}={}){
 b.content.abilities[id]={id,name:'Phép thử',target,cost:{mp:0},effects:[{type:'damage',damageType,element,scalingStat:'magic',multiplier,hits:count}]};getActor(b,actorId).abilities.push(id);return id;
}

test('Luka #111 and Gairyu #112 are locked data-only additions, absent from all recruitment sources',()=>{
 assert.deepEqual(validateContent(content),[]);const s=createGameSave(content);
 for(const [id,releaseId]of [['luka',111],['gairyu',112]]){
  assert.equal(content.characters[id].releaseId,releaseId);assert.equal(content.characters[id].affiliation,'magic_academy');assert.ok(!s.unlockedCharacterIds.includes(id));
  for(const banner of Object.values(content.banners)){assert.equal(banner.characterPool.includes(id),id==='gairyu');assert.ok(!banner.rateUpRotation?.roster.includes(id));assert.equal(banner.rateUpRotation?.rosterAdditions?.some(x=>x.id===id),id==='gairyu');}
  delete s.characters[id];
 }
 const migrated=decodeGameSave(encodeGameSave(s,content),content);for(const id of ['luka','gairyu']){assert.equal(migrated.characters[id].level,1);assert.ok(!migrated.unlockedCharacterIds.includes(id));}
});
test('Gairyu MAG bonus applies once in prepared and combat stats; Luka normal attack is magical ATK scaling',()=>{
 const {b,c,s}=fixture();const g=resolveCharacter(c,s,'gairyu');assert.equal(g.baseStats.magic,35);assert.equal(g.stats.magic,45.5);assert.equal(battleStat(c,getActor(b,'gairyu'),'magic'),45.5);use(b,'gairyu','$attack');assert.equal(hits(b,'gairyu')[0].damageType,'magical');assert.equal(hits(b,'gairyu')[0].amount,45);
 getActor(b,'luka').stats.magic=999;use(b,'luka','$attack');assert.equal(hits(b,'luka')[0].amount,34);assert.equal(hits(b,'luka')[0].damageType,'magical');assert.equal(stacks(b),0);
});
test('Luka skill gains stack in addition to explicit effect: buff +3, single target +2, cap 5',()=>{
 const {b}=fixture();use(b,'luka','luka.tempo');assert.equal(stacks(b),3);use(b,'luka','luka.riff');assert.equal(stacks(b),5);use(b,'luka','luka.riff');assert.equal(stacks(b),5);use(b,'luka','$defend');assert.equal(stacks(b),5);
});
test('Luka zero-stack burst is legal, pays MP, hits only primary and adjacent without wrap, then creates one stack',()=>{
 const {b}=fixture(),a=getActor(b,'luka'),before=a.mp;
 assert.equal(abilityAvailability(b,a,b.content.abilities['luka.encore']).ok,true);use(b,'luka','luka.encore','enemy_0');
 assert.equal(before-a.mp,16);assert.deepEqual(hits(b,'luka').map(e=>[e.targetId,e.amount]),[['enemy_0',108],['enemy_1',68]]);assert.equal(stacks(b),1);
});
test('Luka consumes all five before hitting; primary/sides scale 420%/260% ATK, newly generated stack is not spent',()=>{
 const {b}=fixture();getActor(b,'luka').resourceValues.rhythm=5;use(b,'luka','luka.encore','enemy_1');
 assert.deepEqual(hits(b,'luka').map(e=>[e.targetId,e.amount]),[['enemy_0',88],['enemy_1',142],['enemy_2',88]]);assert.equal(stacks(b),1);
});
test('Luka Rank5 raises both base and per-stack damage; preview agrees for primary and adjacent',()=>{
 const {b,c}=fixture(),a=getActor(b,'luka');a.resourceValues.rhythm=5;a.skillRanks={'luka.encore':5};
 const text=compactSkillScaling(c.abilities['luka.encore'],a,getActor(b,'enemy_1'),c,b);assert.match(text,/614,92% ATK chính/);assert.match(text,/380,67% ATK ô kề/);
 const preview=skillPresentation(c.abilities['luka.encore'],a,c,{live:true,spent:5});assert.match(JSON.stringify(preview),/20%\/12%/);
 use(b,a.id,'luka.encore','enemy_1');assert.deepEqual(hits(b,a.id).map(e=>e.amount),[Math.floor(34*2.6*1.1**4),Math.floor(34*4.2*1.1**4),Math.floor(34*2.6*1.1**4)]);
});
test('one ally magical AoE multi-hit grants only one rhythm, even with full shield absorption',()=>{
 const {b}=fixture();const id=addSkill(b,'elaine');for(const e of b.actors.filter(a=>a.team==='enemy'))e.shield=10000;
 use(b,'elaine',id);assert.equal(stacks(b),1);assert.equal(hits(b,'elaine').length,9);
});
test('Light, Dark, physical skills, basic attacks, defend and hostile magic never charge Luka',()=>{
 const {b}=fixture();for(const element of ['light','dark'])use(b,'elaine',addSkill(b,'elaine',{id:'test_'+element,element}));
 use(b,'elaine',addSkill(b,'elaine',{id:'test_phys',damageType:'physical'}));use(b,'elaine','$attack');use(b,'elaine','$defend');
 use(b,'enemy_0',addSkill(b,'enemy_0',{id:'test_enemy',target:'enemy'}),'luka');assert.equal(stacks(b),0);
});
test('each valid magical element can charge; source character element is irrelevant',()=>{
 for(const element of ['plain','fire','water','earth','wind','thunder','moon','sword_soul']){const {b}=fixture();use(b,'elaine',addSkill(b,'elaine',{element}));assert.equal(stacks(b),1,element);}
});
test('Gairyu chain has distinct action contexts: three casts yield exactly three Luka stacks and no recursive ally chain',()=>{
 const {b}=fixture();b.random=()=>0;const before=getActor(b,'gairyu').mp;use(b,'gairyu','gairyu.inferno');
 assert.deepEqual(b.events.filter(e=>e.type==='reaction'&&e.sourceId==='gairyu').map(e=>e.abilityId),['gairyu.rampage','gairyu.flare']);assert.equal(stacks(b),3);assert.equal(before-getActor(b,'gairyu').mp,24);
 assert.equal(getActor(b,'gairyu').cooldowns['gairyu.rampage'],undefined);assert.equal(hits(b,'gairyu').length,9);
});
test('Gairyu failure guarantees next attempt across both branches, success clears guarantee',()=>{
 const {b}=fixture();b.random=()=>.99;use(b,'gairyu','gairyu.rampage');assert.equal(getActor(b,'gairyu').skillFollowUpState.guaranteed,true);assert.equal(hits(b,'gairyu').length,3);
 use(b,'gairyu','gairyu.inferno');const rolls=b.events.filter(e=>e.type==='follow_up_roll');assert.deepEqual(rolls.map(e=>[e.success,e.guaranteed]),[[true,true],[false,false]]);assert.equal(getActor(b,'gairyu').skillFollowUpState.guaranteed,true);
 use(b,'gairyu','gairyu.rampage');assert.equal(getActor(b,'gairyu').skillFollowUpState.guaranteed,false);assert.equal(hits(b,'gairyu').length,6);
});
test('Gairyu follow-up uses current target skill Rank, ignores its cooldown and cannot charge MP again',()=>{
 const {b,c}=fixture(),a=getActor(b,'gairyu');a.skillRanks={'gairyu.inferno':1,'gairyu.rampage':5,'gairyu.flare':5};a.cooldowns['gairyu.rampage']=7;b.random=()=>0;
 use(b,a.id,'gairyu.inferno',undefined,'main',false);assert.equal(a.cooldowns['gairyu.rampage'],7);assert.equal(a.mp,86);
 const h=hits(b,a.id);assert.equal(h[3].amount,Math.floor(45.5*2.5*1.1**4));assert.equal(h[6].amount,Math.floor(45.5*1.5*1.1**4));assert.equal(resolveRankedAbility(c,a,'gairyu.flare').skillRank,5);
});
test('no living target means no roll or armed guarantee lost after the killing hit',()=>{
 const {b}=fixture(),a=getActor(b,'gairyu');a.skillFollowUpState={guaranteed:true};for(const e of b.actors.filter(a=>a.team==='enemy'))e.hp=1;
 use(b,a.id,'gairyu.inferno');assert.equal(b.outcome,'victory');assert.equal(a.skillFollowUpState.guaranteed,true);assert.equal(b.events.filter(e=>e.type==='follow_up_roll').length,0);
});
test('insufficient MP rejects atomically without stacks, RNG or guarantee changes',()=>{
 const {b}=fixture(),a=getActor(b,'gairyu');a.mp=0;a.skillFollowUpState={guaranteed:true};b.queue=[a.id,'enemy_0'];b.cursor=0;const before=snapshotChronicleBattle(b);
 assert.throws(()=>executeAction(b,{actorId:a.id,abilityId:'gairyu.inferno',targetId:'enemy_0'}));assert.deepEqual(snapshotChronicleBattle(b),before);
});
test('forecast clones guaranteed state, stacks and RNG instead of consuming them',()=>{
 const {b}=fixture(),a=getActor(b,'gairyu');a.skillFollowUpState={guaranteed:true};b.queue=[a.id,'enemy_0'];b.cursor=0;const before=snapshotChronicleBattle(b);
 forecastBattleAction(b,{actorId:a.id,abilityId:'gairyu.inferno',targetId:'enemy_0'});assert.deepEqual(snapshotChronicleBattle(b),before);
});
test('main-turn buff survives Extra and two subsequent main actions, rejected cooldown does not expire it',()=>{
 const {b}=fixture(),a=getActor(b,'luka');use(b,a.id,'luka.tempo');assert.equal(a.statuses.find(s=>s.id==='luka_tempo').remaining,3);
 use(b,a.id,'$defend',undefined,'extra');assert.equal(a.statuses.find(s=>s.id==='luka_tempo').remaining,3);
 for(let n=2;n>=0;n--){use(b,a.id,'$defend');assert.equal(a.statuses.find(s=>s.id==='luka_tempo')?.remaining??0,n);}
});
test('actual skip progression under stun neither creates rhythm nor attempts a Gairyu follow-up',()=>{
 const {b}=fixture(),a=getActor(b,'luka');b.queue=['elaine',a.id,'gairyu','enemy_0'];b.cursor=0;a.statuses=[{id:'stunned',remaining:1}];getActor(b,'gairyu').statuses=[{id:'stunned',remaining:1}];getActor(b,'gairyu').skillFollowUpState={guaranteed:true};
 executeAction(b,{actorId:'elaine',abilityId:'$defend',targetId:'elaine'});assert.equal(activeActor(b).id,'enemy_0');assert.equal(stacks(b),0);assert.equal(getActor(b,'gairyu').skillFollowUpState.guaranteed,true);
});
test('wave and snapshot carry resource/guarantee; a fresh fight resets both',()=>{
 const {c,s}=fixture(),run=createDungeonRun(c,s,'gold_mine','easy',{random:seededRandom(21)});getActor(run.battle,'luka').resourceValues.rhythm=4;getActor(run.battle,'gairyu').skillFollowUpState={guaranteed:true};
 const copy=restoreChronicleBattle(c,snapshotChronicleBattle(run.battle));assert.equal(stacks(copy),4);assert.equal(getActor(copy,'gairyu').skillFollowUpState.guaranteed,true);
 run.battle.outcome='victory';advanceDungeonWave(c,run);assert.equal(stacks(run.battle),4);assert.equal(getActor(run.battle,'gairyu').skillFollowUpState.guaranteed,true);
 const fresh=createBattle(c,s,'forest_patrol');assert.equal(stacks(fresh),0);assert.equal(getActor(fresh,'gairyu').skillFollowUpState,undefined);
});
test('Arena mirror uses unit IDs, relative ally teams and independent guarantees, never cross-charges opponents',()=>{
 const {c,s}=fixture(),b=createArenaBattle(c,s,'mirror',68);for(const a of b.actors){a.hp=a.stats.maxHp=100000;a.stats.resistance=0;a.weaknesses=[];a.resistances={};}b.random=()=>.99;
 const g=b.actors.find(a=>a.team==='enemy'&&a.characterId==='gairyu'),l=b.actors.find(a=>a.team==='enemy'&&a.characterId==='luka');assert.ok(g&&l);
 const playerLuka=b.actors.find(a=>a.team==='party'&&a.characterId==='luka'),playerGairyu=b.actors.find(a=>a.team==='party'&&a.characterId==='gairyu');use(b,g.id,'gairyu.rampage',playerLuka.id);assert.equal(g.skillFollowUpState.guaranteed,true);assert.equal(playerGairyu.skillFollowUpState,undefined);assert.equal(l.resourceValues.rhythm,1);assert.equal(playerLuka.resourceValues.rhythm,0);
});
test('UI explains resources, guarantee and rank without leaking raw hook IDs',()=>{
 const {b,c}=fixture();getActor(b,'gairyu').skillFollowUpState={guaranteed:true};const text=JSON.stringify([passivePresentation(getActor(b,'luka'),c),passivePresentation(getActor(b,'gairyu'),c),skillPresentation(c.abilities['gairyu.inferno'],getActor(b,'gairyu'),c)]);
 assert.match(text,/chắc chắn thành công/);assert.match(text,/50% cơ hội Liên kích/);assert.doesNotMatch(text,/skill_magic_charge|chanceFollowUp|undefined|NaN/);
});
test('validators reject malformed or cyclic reaction graphs and invalid primary scaling/resource schemas',()=>{
 const changes=[c=>c.characters.luka.passive.resource='bad',c=>c.characters.luka.passive.excludedElements=['void'],c=>c.characters.gairyu.passive.followUpGuarantee='yes',c=>c.abilities['gairyu.flare'].chanceFollowUp={abilityId:'gairyu.inferno',chance:.5},c=>c.abilities['gairyu.rampage'].chanceFollowUp.chance=2,c=>c.abilities['gairyu.inferno'].chanceFollowUp.abilityId='luka.riff',c=>c.abilities['luka.encore'].effects[0].primaryPerResource=-1,c=>c.abilities['luka.encore'].cost.resource.min=-1];
 for(const change of changes){const c=structuredClone(content);change(c);assert.ok(validateContent(c).length>0);}
});

test('Gairyu complete chain resolves before the final main-turn buff expires',()=>{
 const {b}=fixture(),a=getActor(b,'gairyu');b.random=()=>0;
 b.content.statuses.test_magic_boost={id:'test_magic_boost',name:'Hưng phấn',kind:'buff',durationClock:'main_turn',modifiers:{magic:.5}};
 a.statuses=[{id:'test_magic_boost',remaining:1}];use(b,a.id,'gairyu.inferno');
 const power=35*(1+.3+.5),h=hits(b,a.id);assert.equal(h[0].amount,Math.floor(power*4.2));assert.equal(h[3].amount,Math.floor(power*2.5));assert.equal(h[6].amount,Math.floor(power*1.5));assert.ok(!a.statuses.some(s=>s.id==='test_magic_boost'));
});
test('Aurora follow-up is a separate eligible cast, self-cast and basic attack do not charge Luka on their own',()=>{
 const {b}=fixture(['luka','gairyu','aurora','elaine']);use(b,'luka','$attack');assert.equal(stacks(b),1);assert.ok(b.events.some(e=>e.type==='reaction'&&e.sourceId==='aurora'));
 const {b:d}=fixture();use(d,'luka','$attack');assert.equal(stacks(d),0);
});
test('fully evaded spells and a fallen Luka do not grant rhythm',()=>{
 const {b}=fixture();b.content.statuses.test_magic_evade={id:'test_magic_evade',name:'Né phép',kind:'buff',modifiers:{magicEvasion:1}};for(const e of b.actors.filter(a=>a.team==='enemy'))e.passive={evasion:{baseChance:1,perBaseSpeed:0,cap:1,damageTypes:['magical']}};b.random=()=>0;
 use(b,'elaine',addSkill(b,'elaine'));assert.equal(stacks(b),0);
 getActor(b,'luka').hp=0;for(const e of b.actors.filter(a=>a.team==='enemy'))e.passive={};use(b,'elaine','test_magic');assert.equal(stacks(b),0);
});
test('Extra Turn can attempt the shared guarantee; it is not a per-round or per-skill pity',()=>{
 const {b}=fixture();b.random=()=>.99;use(b,'gairyu','gairyu.rampage');assert.equal(getActor(b,'gairyu').skillFollowUpState.guaranteed,true);
 use(b,'gairyu','gairyu.rampage',undefined,'extra');assert.equal(getActor(b,'gairyu').skillFollowUpState.guaranteed,false);assert.equal(hits(b,'gairyu').length,6);
});
