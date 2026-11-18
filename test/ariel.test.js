import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,planAutoBattleTurn,activeActor,executeAction,executeEnemyTurn,getActor,forecastBattleAction,abilityAvailability} from '../src/core/battle.js';
import {createArenaBattle} from '../src/core/arena.js';
import {createDungeonRun,advanceDungeonWave} from '../src/core/dungeon.js';
import {seededRandom} from '../src/core/random.js';
import {snapshotChronicleBattle,restoreChronicleBattle} from '../src/core/chronicle-combat.js';
import {battleStat} from '../src/core/stat-values.js';import {resolveRankedAbility} from '../src/core/skill-resolver.js';
import {validateContent} from '../src/core/content.js';
import {skillPresentation,passivePresentation} from '../src/ui/skill-copy.js';
import {compactSkillScaling} from '../src/ui/combat-presentation.js';
const content=await loadContent(),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function fixture(party=['ariel','luka','gairyu','elaine']){
 const c=structuredClone(content),s=createGameSave(c);s.unlockedCharacterIds=Object.keys(c.characters);s.party=[...party];s.partyPresets[0].slots=[...party];
 const b=createBattle(c,s,'forest_patrol',seededRandom(56),{enemyLevel:1});
 for(const e of b.actors.filter(a=>a.team==='enemy')){e.hp=e.stats.maxHp=100000;e.stats.defense=e.stats.resistance=e.stats.attack=e.stats.magic=0;e.weaknesses=[];e.resistances={};}
 return {b,c,s};
}
function use(b,id,skill,target,resetCd=true,phase='main'){
 const a=getActor(b,id);b.queue=[id,...b.actors.filter(t=>t.id!==id&&t.hp>0).map(t=>t.id)];b.cursor=0;b.phase=phase;if(resetCd)a.cooldowns={};
 executeAction(b,{actorId:id,abilityId:skill,targetId:target??(skill.startsWith('ariel.')&&skill!=='ariel.spotlight'||skill==='$defend'?id:b.actors.find(t=>t.team!==a.team&&t.hp>0).id)});
}
function addSkill(b,owner,{id='test_magic',element='wind',damageType='magical',hits=1,target='enemy',multiplier=1}={}){
 b.content.abilities[id]={id,name:'Chiêu thử',target,effects:[{type:'damage',damageType,element,multiplier,hits,scalingStat:'magic'}]};getActor(b,owner).abilities.push(id);return id;
}
const hits=(b,id)=>b.events.filter(e=>e.type==='damage'&&e.sourceId===id&&!e.periodic),spot=(b,id)=>getActor(b,id).statuses.find(s=>s.id==='ariel_spotlight');
function step(b){const a=activeActor(b);assert.ok(a);if(a.team==='enemy')executeEnemyTurn(b);else executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});}
function seek(b,p){for(let n=0;n<300&&!p();n++)step(b);assert.ok(p());}

test('Ariel is locked academy #113 data only and absent from every recruitment pool',()=>{
 assert.deepEqual(validateContent(content),[]);const a=content.characters.ariel,s=createGameSave(content);assert.equal(a.releaseId,113);assert.equal(a.affiliation,'magic_academy');assert.ok(a.tags.includes('class_7a'));assert.ok(!s.unlockedCharacterIds.includes(a.id));
 for(const b of Object.values(content.banners)){assert.ok(b.characterPool.includes(a.id));assert.ok(!b.rateUpRotation?.roster.includes(a.id));assert.ok(b.rateUpRotation?.rosterAdditions?.some(x=>x.id===a.id));}
 delete s.characters.ariel;const saved=decodeGameSave(encodeGameSave(s,content),content);assert.equal(saved.characters.ariel.level,1);assert.ok(!saved.unlockedCharacterIds.includes('ariel'));
});
test('Rotary copies main Fire from a Sword Soul ally, never the additional Sword Soul damage element',()=>{
 const {b}=fixture(['rotary','tsukiha','ariel','elaine']);use(b,'rotary','rotary.voodoo','tsukiha');use(b,'rotary','rotary.needle','enemy_0');const t=getActor(b,'enemy_0');assert.ok(t.statuses.some(s=>s.id==='exposure_fire'));assert.ok(!t.statuses.some(s=>s.id==='exposure_sword_soul'));
});
test('explicit Soul-element binding is blocked, leaves other exposure intact and does not block needle damage',()=>{
 const {b}=fixture(['rotary','tsukiha','ariel','elaine']);getActor(b,'tsukiha').element='sword_soul';use(b,'rotary','rotary.voodoo','tsukiha');const t=getActor(b,'enemy_0');t.statuses=[{id:'exposure_water',stacks:2,remaining:null,sourceId:'ariel'}];
 use(b,'rotary','rotary.needle',t.id);assert.ok(hits(b,'rotary')[0].amount>0);assert.ok(!t.statuses.some(s=>s.id==='exposure_sword_soul'));assert.equal(t.statuses.find(s=>s.id==='exposure_water').stacks,2);
});
test('anthem buffs ATK/MAG for six main turns, Rank5 grows both and Extra does not reduce duration',()=>{
 const {b,c}=fixture(),a=getActor(b,'ariel');a.skillRanks={'ariel.anthem':5};use(b,a.id,'ariel.anthem');const l=getActor(b,'luka');near(battleStat(c,l,'attack'),34*(1+.2*1.05**4));assert.equal(l.statuses.find(s=>s.id==='ariel_anthem').remaining,6);
 use(b,l.id,'$defend',l.id,true,'extra');assert.equal(l.statuses.find(s=>s.id==='ariel_anthem').remaining,6);for(let n=5;n>=0;n--){use(b,l.id,'$defend',l.id);assert.equal(l.statuses.find(s=>s.id==='ariel_anthem')?.remaining??0,n);}
});
test('spotlight snapshots current Ariel MAG, adds before skill amp/RES and consumes once',()=>{
 const {b,c}=fixture(),a=getActor(b,'ariel');use(b,a.id,'ariel.spotlight','luka');near(spot(b,'luka').flatSkillBonus,40.8);a.stats.magic=999;getActor(b,'luka').statuses.push({id:'artesia_destiny',remaining:3,charges:3,sourceId:a.id});
 // Use a known independent output amp authored in the fixture.
 getActor(b,'luka').statuses=getActor(b,'luka').statuses.filter(s=>s.id!=='artesia_destiny');c.statuses.test_amp={id:'test_amp',name:'Khuếch đại',kind:'buff',modifiers:{damageBonus:.3}};getActor(b,'luka').statuses.push({id:'test_amp',remaining:3});getActor(b,'enemy_0').stats.resistance=20;
 use(b,'luka','luka.riff');assert.equal(hits(b,'luka')[0].amount,Math.floor((34*1.8+40.8-20*.55)*1.3));assert.equal(spot(b,'luka'),undefined);
});
test('two magical hits split total flat bonus; every AoE target gets that same total',()=>{
 const {b}=fixture();use(b,'ariel','ariel.spotlight','elaine');const skill=addSkill(b,'elaine',{target:'all_enemies',hits:2});use(b,'elaine',skill);
 assert.equal(hits(b,'elaine').length,6);assert.ok(hits(b,'elaine').every(e=>e.amount===Math.floor(30+40.8/2)));assert.equal(spot(b,'elaine'),undefined);
});
test('Light and Dark receive spotlight flat bonus but never the stage passive amp',()=>{
 for(const element of ['light','dark']){const {b}=fixture();use(b,'ariel','ariel.stage');use(b,'ariel','ariel.spotlight','elaine');use(b,'elaine',addSkill(b,'elaine',{element}));assert.equal(hits(b,'elaine')[0].amount,Math.floor(30+40.8));}
});
test('basic, physical skill and support casts preserve charge; normal eligible magic spends it',()=>{
 const {b}=fixture();use(b,'ariel','ariel.spotlight','elaine');use(b,'elaine','$attack');assert.equal(spot(b,'elaine').charges,1);use(b,'elaine','$defend','elaine');assert.equal(spot(b,'elaine').charges,1);use(b,'elaine',addSkill(b,'elaine',{damageType:'physical'}));assert.equal(spot(b,'elaine').charges,1);use(b,'elaine',addSkill(b,'elaine',{id:'test_real'}));assert.equal(spot(b,'elaine'),undefined);
});
test('all misses keep charge; full absorption consumes it; Phong Ấn blocks grant without phantom bonus',()=>{
 const {b}=fixture();use(b,'ariel','ariel.spotlight','elaine');const e=getActor(b,'enemy_0');e.passive={evasion:{baseChance:1,perBaseSpeed:0,cap:1,damageTypes:['magical']}};b.random=()=>0;
 use(b,'elaine',addSkill(b,'elaine'));assert.equal(spot(b,'elaine').charges,1);e.passive={};e.shield=10000;use(b,'elaine','test_magic');assert.equal(spot(b,'elaine'),undefined);assert.ok(hits(b,'elaine')[0].absorbed>0);
 const id=Object.values(b.content.statuses).find(s=>s.buffRejection).id;getActor(b,'elaine').statuses=[{id,remaining:null,charges:1}];use(b,'ariel','ariel.spotlight','elaine');assert.equal(spot(b,'elaine'),undefined);
});
test('Ariel own Rank scales flat grant once, attacker Rank scales only its own base coefficient',()=>{
 const {b,c}=fixture(),a=getActor(b,'ariel'),l=getActor(b,'luka');a.skillRanks={'ariel.spotlight':5};l.skillRanks={'luka.riff':5};use(b,a.id,'ariel.spotlight',l.id);const bonus=34*1.2*1.1**4;near(spot(b,l.id).flatSkillBonus,bonus);use(b,l.id,'luka.riff');assert.equal(hits(b,l.id)[0].amount,Math.floor(34*1.8*1.1**4+bonus));near(resolveRankedAbility(c,a,'ariel.spotlight',5).effects[0].flatSkillScaling.multiplier,1.2*1.1**4);
});
test('stage boosts the whole allied team, not enemy SPD, and reorders only remaining slots',()=>{
 const {b,c}=fixture();getActor(b,'enemy_0').stats.speed=25;b.queue=['elaine','ariel','enemy_0','luka','gairyu'];b.cursor=1;
 executeAction(b,{actorId:'ariel',abilityId:'ariel.stage',targetId:'ariel'});assert.deepEqual(b.mainTurnOrder.slice(0,3),['elaine','ariel','luka']);near(battleStat(c,getActor(b,'luka'),'speed'),22*1.2);near(battleStat(c,getActor(b,'ariel'),'speed'),23*1.2);assert.equal(battleStat(c,getActor(b,'enemy_0'),'speed'),25);
});
test('stage is separate from statuses/Monica field; refresh never stacks speed',()=>{
 const {b,c}=fixture();b.turnOrderField={kind:'team_priority',name:'Trường thời gian',sourceId:'luka',priorityTeam:'enemy',expiresAfterRound:10};const before=structuredClone(b.turnOrderField);
 use(b,'ariel','ariel.stage');assert.deepEqual(b.turnOrderField,before);assert.ok(!getActor(b,'ariel').statuses.some(s=>s.id==='ariel_stage'));b.round=2;use(b,'ariel','ariel.stage');assert.equal(getActor(b,'ariel').performanceStage.expiresAfterRound,5);near(battleStat(c,getActor(b,'luka'),'speed'),22*1.2);
});
test('passive applies per hit to non-Light/Dark magical skills, includes self, excludes physical and basics',()=>{
 for(const [kind,element,expected]of [['magical','wind',36],['magical','fire',36],['magical','plain',36],['magical','dark',30],['physical','wind',30]]){const {b}=fixture();use(b,'ariel','ariel.stage');use(b,'elaine',addSkill(b,'elaine',{element,damageType:kind}));assert.equal(hits(b,'elaine')[0].amount,expected);}
 const {b}=fixture();use(b,'ariel','ariel.stage');use(b,'ariel',addSkill(b,'ariel',{element:'water'}));assert.equal(hits(b,'ariel')[0].amount,40);use(b,'elaine','$attack');assert.equal(hits(b,'elaine')[0].amount,30);
});
test('stage amp and flat bonus work together; owner KO stops amp but not speed or already granted flat buff',()=>{
 const {b,c}=fixture();use(b,'ariel','ariel.stage');use(b,'ariel','ariel.spotlight','luka');use(b,'luka','luka.riff');assert.equal(hits(b,'luka')[0].amount,122);
 use(b,'ariel','ariel.spotlight','luka');getActor(b,'ariel').hp=0;use(b,'luka','luka.riff');assert.equal(hits(b,'luka')[0].amount,102);near(battleStat(c,getActor(b,'luka'),'speed'),26.4);
});
test('stage expires after fourth full round through actual progression, even if Ariel is stunned',()=>{
 const {b,c}=fixture();seek(b,()=>activeActor(b)?.id==='ariel');executeAction(b,{actorId:'ariel',abilityId:'ariel.stage',targetId:'ariel'});getActor(b,'ariel').statuses.push({id:'stunned',remaining:8});
 seek(b,()=>b.round===4);assert.ok(getActor(b,'ariel').performanceStage);near(battleStat(c,getActor(b,'luka'),'speed'),26.4);seek(b,()=>b.round===5);assert.equal(getActor(b,'ariel').performanceStage,undefined);assert.equal(battleStat(c,getActor(b,'luka'),'speed'),22);
});
test('spotlight on Gairyu is spent on primary skill only; chain still receives stage amp independently',()=>{
 const {b}=fixture();use(b,'ariel','ariel.stage');use(b,'ariel','ariel.spotlight','gairyu');b.random=()=>0;use(b,'gairyu','gairyu.inferno');const h=hits(b,'gairyu');assert.equal(h.length,9);assert.equal(h[0].amount,Math.floor((45.5*4.2+40.8)*1.2));assert.equal(h[3].amount,Math.floor(45.5*2.5*1.2));assert.equal(h[6].amount,Math.floor(45.5*1.5*1.2));
});
test('forecast/snapshot preserve flat snapshot, independent stage, resource charges and RNG',()=>{
 const {b,c}=fixture();use(b,'ariel','ariel.stage');use(b,'ariel','ariel.spotlight','luka');b.queue=['luka','enemy_0'];b.cursor=0;const before=snapshotChronicleBattle(b);forecastBattleAction(b,{actorId:'luka',abilityId:'luka.riff',targetId:'enemy_0'});assert.deepEqual(snapshotChronicleBattle(b),before);
 const copy=restoreChronicleBattle(c,before);assert.equal(getActor(copy,'ariel').performanceStage.expiresAfterRound,4);near(spot(copy,'luka').flatSkillBonus,40.8);use(copy,'luka','luka.riff');assert.equal(hits(copy,'luka')[0].amount,122);
});
test('dungeon wave keeps remaining stage deadline and flat buff; fresh battle clears them',()=>{
 const {c,s}=fixture(),run=createDungeonRun(c,s,'gold_mine','easy',{random:seededRandom(82)});use(run.battle,'ariel','ariel.stage');use(run.battle,'ariel','ariel.spotlight','luka');const end=getActor(run.battle,'ariel').performanceStage.expiresAfterRound;run.battle.outcome='victory';advanceDungeonWave(c,run);assert.equal(getActor(run.battle,'ariel').performanceStage.expiresAfterRound,end);near(spot(run.battle,'luka').flatSkillBonus,40.8);
 const fresh=createBattle(c,s,'forest_patrol');assert.equal(getActor(fresh,'ariel').performanceStage,undefined);assert.equal(spot(fresh,'luka'),undefined);
});
test('PvP stages/flat grants use distinct actor IDs and cannot boost opponent',()=>{
 const {c,s}=fixture(),b=createArenaBattle(c,s,'mirror',41);const find=(id,team)=>b.actors.find(a=>a.characterId===id&&a.team===team);const a=find('ariel','enemy'),l=find('luka','enemy'),player=find('luka','party');
 use(b,a.id,'ariel.stage',a.id);near(battleStat(c,l,'speed'),l.stats.speed*1.2);near(battleStat(c,player,'speed'),player.stats.speed);use(b,a.id,'ariel.spotlight',l.id);assert.ok(l.statuses.some(s=>s.id==='ariel_spotlight'));assert.ok(!player.statuses.some(s=>s.id==='ariel_spotlight'));
});
test('rejected MP/CD cast changes neither snapshot nor buff; spotlight uses ordinary CD1 round clock',()=>{
 const {b}=fixture(),a=getActor(b,'ariel');use(b,a.id,'ariel.spotlight','luka');assert.equal(a.cooldowns['ariel.spotlight'],2);b.queue=[a.id,'enemy_0'];b.cursor=0;const before=snapshotChronicleBattle(b);assert.equal(abilityAvailability(b,a,b.content.abilities['ariel.spotlight']).ok,false);assert.throws(()=>executeAction(b,{actorId:a.id,abilityId:'ariel.spotlight',targetId:'luka'}));assert.deepEqual(snapshotChronicleBattle(b),before);
});
test('copy shows exclusions/snapshot and stage durations without implementation keys',()=>{
 const {b,c}=fixture();const text=JSON.stringify([skillPresentation(c.abilities['rotary.needle'],c.characters.rotary,c),skillPresentation(c.abilities['ariel.stage'],getActor(b,'ariel'),c),skillPresentation(c.abilities['ariel.spotlight'],getActor(b,'ariel'),c),passivePresentation(getActor(b,'ariel'),c)]);assert.match(text,/Trừ Hồn Kiếm/);assert.match(text,/40,8/);assert.match(text,/4 vòng/);assert.doesNotMatch(text,/performance_stage_amp|flatSkillScaling|undefined|NaN/);assert.match(compactSkillScaling(c.abilities['ariel.stage'],getActor(b,'ariel'),getActor(b,'ariel'),c,b),/20% SPD/);
});
test('validators reject malformed snapshots, stage metadata and exclusions',()=>{
 for(const change of [c=>c.abilities['ariel.stage'].effects[0].durationRounds=0,c=>c.abilities['ariel.stage'].effects[0].speed=2,c=>c.abilities['ariel.spotlight'].effects[0].flatSkillScaling.stat='attack',c=>c.statuses.ariel_spotlight.damageUses=3,c=>c.abilities['rotary.needle'].effects[1].excludedElements=['unknown']]){const c=structuredClone(content);change(c);assert.ok(validateContent(c).length>0);}
});

test('AI values stage setup and gives spotlight to a magic-skill user, not a physical-only ally',()=>{
 const {b}=fixture(['ariel','luka','arthur','garrek']);b.queue=['ariel','luka','arthur','garrek','enemy_0'];b.cursor=0;
 const first=planAutoBattleTurn(b);assert.ok(['ariel.stage','ariel.anthem'].includes(first.abilityId));
 use(b,'ariel','ariel.stage');use(b,'ariel','ariel.anthem');b.queue=['ariel','luka','arthur','garrek','enemy_0'];b.cursor=0;
 const next=planAutoBattleTurn(b);assert.equal(next.abilityId,'ariel.spotlight');assert.equal(next.targetId,'luka');
});
