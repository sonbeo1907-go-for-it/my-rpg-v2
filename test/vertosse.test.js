import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,getActor,basicAbility,DEFEND,abilityAvailability} from '../src/core/battle.js';
import {teamResourceState,teamResourceValue,teamResourceSpent} from '../src/core/team-resources.js';
import {battleStat,battleMaxMp} from '../src/core/stat-values.js';
import {battlePresentation,commandAbilityIds} from '../src/core/combat-modes.js';
import {resolveRankedAbility} from '../src/core/skill-resolver.js';
import {validateContent} from '../src/core/content.js';
import {skillPresentation,passivePresentation} from '../src/ui/skill-copy.js';
import {skillCost,skillPreviewOptions} from '../src/ui/skill-presentation.js';
import {compactSkillScaling,liveSkillChoices} from '../src/ui/combat-presentation.js';
import {snapshotChronicleBattle,restoreChronicleBattle} from '../src/core/chronicle-combat.js';
import {seededRandom} from '../src/core/random.js';
import {createDungeonRun,advanceDungeonWave} from '../src/core/dungeon.js';
const content=await loadContent(),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function fixture(party=['selene','simon','genevieve','arthur'],mutate=()=>{}){
 const c=structuredClone(content);mutate(c);const save=createGameSave(c);save.party=party;save.partyPresets[0].slots=[...party];save.unlockedCharacterIds=Object.keys(c.characters);
 const b=createBattle(c,save,'forest_patrol',seededRandom(102),{enemyLevel:1});for(const e of b.actors.filter(a=>a.team==='enemy')){e.hp=e.stats.maxHp=100000;e.stats.defense=e.stats.resistance=0;e.weaknesses=[];e.resistances={};}return {b,c,save};
}
function use(b,id,ability,target,phase='main'){
 b.outcome=null;b.phase=phase;b.queue=[id,id==='enemy_0'?b.actors.find(a=>a.team==='party'&&a.hp>0).id:'enemy_0'];b.cursor=0;const a=getActor(b,id);a.cooldowns={};
 const s=ability==='$attack'?basicAbility(a):ability==='$defend'?DEFEND:b.content.abilities[ability];executeAction(b,{actorId:id,abilityId:ability,targetId:target??(s.target==='enemy'?'enemy_0':id)});
}
const state=b=>teamResourceState(b,'party','evidence'),amount=b=>state(b)?.value??0;
const status=(b,id,key)=>getActor(b,id).statuses.find(s=>s.id===key);
const hits=(b,id)=>b.events.filter(e=>e.type==='damage'&&!e.periodic&&e.sourceId===id);
function endRound(b){const e=getActor(b,'enemy_0');b.queue=[e.id];b.cursor=0;executeAction(b,{actorId:e.id,abilityId:'$attack',targetId:b.actors.find(a=>a.team==='party'&&a.hp>0).id});}

test('Vertosse are three formal gacha characters and pre-update saves gain locked default states',()=>{
 const {c}=fixture();assert.deepEqual(validateContent(c),[]);for(const id of ['selene','simon','genevieve'])assert.ok(c.banners.standard.characterPool.includes(id));
 const save=createGameSave(c);for(const id of ['selene','simon','genevieve'])delete save.characters[id];const copy=decodeGameSave(JSON.stringify(save),c);for(const id of ['selene','simon','genevieve']){assert.equal(copy.characters[id].level,1);assert.ok(!copy.unlockedCharacterIds.includes(id));}
});
test('any single family member initializes exactly one empty shared pool; none means no pool',()=>{
 for(const id of ['selene','simon','genevieve']){const {b}=fixture([id,'arthur','iris','elaine']);assert.equal(amount(b),0);assert.equal(state(b).max,6);assert.equal(Object.keys(b.teamResources.party).length,1);}
 assert.deepEqual(fixture(['arthur','iris','elaine','garrek']).b.teamResources,{});
});
test('day skills create evidence once even if the target falls; utility and attack coefficient remain modest',()=>{
 const {b}=fixture();const e=getActor(b,'enemy_0');e.hp=1;use(b,'selene','selene.seal',e.id);assert.equal(e.hp,0);assert.equal(amount(b),1);assert.equal(status(b,'selene','lunarmare_conviction').stacks,1);assert.equal(status(b,'selene','lunarmare_conviction').remaining,2);
 use(b,'selene','selene.noble_step','enemy_1');assert.equal(amount(b),2);assert.equal(status(b,'selene','lunarmare_conviction').stacks,2);near(battleStat(b.content,getActor(b,'selene'),'speed'),25*1.15);
});
test('overflow still emits completed creation events and refreshes Selene buff without storing more than six',()=>{
 const {b}=fixture();state(b).value=6;use(b,'simon','simon.closing','arthur');assert.equal(amount(b),6);const e=b.events.find(e=>e.type==='team_resource_created');assert.equal(e.created,1);assert.equal(e.amount,0);assert.equal(e.capped,true);assert.equal(status(b,'selene','lunarmare_conviction').stacks,1);
 use(b,'selene','selene.masquerade');assert.equal(amount(b),6);const s=status(b,'selene','lunarmare_conviction');assert.equal(s.stacks,3);assert.equal(s.remaining,2);near(battleStat(b.content,getActor(b,'selene'),'attack'),39*1.45);
});
test('transform creates three, changes commands, adds base ATK and never changes the board background/BGM',()=>{
 const {b}=fixture();const a=getActor(b,'selene'),mp=a.mp;use(b,a.id,'selene.masquerade');assert.equal(mp-a.mp,8);assert.equal(amount(b),3);assert.equal(a.activeMode,'lunarmare');assert.equal(a.stats.attack,29);near(battleStat(b.content,a,'attack'),56.55);assert.deepEqual(commandAbilityIds(a),['selene.execution','selene.sweep','selene.verdict','$defend']);assert.equal(battlePresentation(b.actors),null);assert.equal(b.extraTurnGrants.size,0);assert.equal(abilityAvailability(b,a,b.content.abilities['selene.masquerade']).ok,false);
});
test('final evidence hit retains full mode damage, Simon reacts to another target, then Selene leaves without skipped turn',()=>{
 const {b}=fixture();use(b,'selene','selene.masquerade');state(b).value=3;const a=getActor(b,'selene'),before=a.mp;use(b,a.id,'selene.verdict','enemy_0');assert.equal(amount(b),0);assert.equal(before-a.mp,12);assert.equal(hits(b,a.id)[0].amount,Math.floor(39*1.45*5.5));assert.equal(a.activeMode,undefined);const follow=b.events.find(e=>e.type==='reaction'&&e.sourceId==='simon');assert.equal(follow.targetId,'enemy_1');assert.equal(b.events.filter(e=>e.sourceId==='simon'&&e.type==='reaction').length,1);assert.ok(status(b,'enemy_1','exposure_water'));
 const order=b.events.map(e=>e.type);assert.ok(order.indexOf('mode_exit')>b.events.findIndex(e=>e.type==='damage'&&e.sourceId==='simon'));assert.ok(commandAbilityIds(a).includes('selene.seal'));use(b,a.id,'selene.seal','enemy_1');assert.equal(amount(b),1);
});
test('insufficient shared cost and illegal target are atomic: no MP, cooldown, buff or evidence mutation',()=>{
 const {b}=fixture();use(b,'selene','selene.masquerade');state(b).value=1;b.queue=['selene','enemy_0'];b.cursor=0;const before=snapshotChronicleBattle(b);assert.equal(abilityAvailability(b,getActor(b,'selene'),b.content.abilities['selene.verdict']).ok,false);assert.throws(()=>executeAction(b,{actorId:'selene',abilityId:'selene.verdict',targetId:'enemy_0'}));assert.deepEqual(snapshotChronicleBattle(b),before);
 assert.throws(()=>executeAction(b,{actorId:'selene',abilityId:'selene.execution',targetId:'missing'}));assert.deepEqual(snapshotChronicleBattle(b),before);
});
test('another ally can deplete shared evidence and force mode exit at the end of that action',()=>{
 const {b}=fixture();use(b,'selene','selene.masquerade');state(b).value=1;use(b,'simon','simon.cross_examine','arthur');assert.equal(amount(b),0);assert.equal(getActor(b,'selene').activeMode,undefined);assert.ok(!b.events.some(e=>e.type==='reaction'&&e.sourceId==='simon'));assert.equal(status(b,'arthur','weakness_exploitation').remaining,3);
});
test('Simon reacts once per consuming skill, including AoE and Extra Turns, not once per stack or hit',()=>{
 const {b}=fixture();use(b,'selene','selene.masquerade');state(b).value=6;use(b,'selene','selene.sweep','enemy_0');assert.equal(amount(b),5);assert.equal(hits(b,'selene').length,3);assert.equal(hits(b,'simon').length,1);
 use(b,'selene','selene.verdict','enemy_0','extra');assert.equal(amount(b),2);assert.equal(hits(b,'simon').length,1);assert.equal(teamResourceSpent(b,'party','evidence'),4);
 use(b,'selene','selene.execution','enemy_0','extra');assert.equal(hits(b,'simon').length,1);assert.equal(teamResourceSpent(b,'party','evidence'),5);
});
test('Simon chooses highest current absolute HP, not percentage or selected target; dodge applies no exposure',()=>{
 const {b,c}=fixture();use(b,'selene','selene.masquerade');getActor(b,'enemy_0').hp=50;getActor(b,'enemy_1').hp=500;getActor(b,'enemy_1').stats.maxHp=100000;getActor(b,'enemy_2').hp=400;getActor(b,'enemy_2').stats.maxHp=400;
 use(b,'selene','selene.execution','enemy_0');assert.equal(b.events.find(e=>e.type==='reaction'&&e.sourceId==='simon').targetId,'enemy_1');assert.equal(status(b,'enemy_1','exposure_water').stacks,2);
 c.statuses.test_dodge={id:'test_dodge',name:'Né',kind:'buff',modifiers:{evasion:1}};getActor(b,'enemy_1').statuses=[{id:'test_dodge',remaining:3}];b.random=()=>0;use(b,'selene','selene.execution','enemy_2');assert.ok(b.events.some(e=>e.type==='dodge'&&e.sourceId==='simon'));assert.equal(status(b,'enemy_1','exposure_water'),undefined);
});
test('Simon does not react to generation, his own spending, fallen owner, or a finished enemy formation',()=>{
 const {b}=fixture();use(b,'selene','selene.seal');assert.equal(hits(b,'simon').length,0);use(b,'simon','simon.cross_examine','selene');assert.equal(hits(b,'simon').length,0);
 use(b,'selene','selene.masquerade');getActor(b,'simon').hp=0;use(b,'selene','selene.execution','enemy_0');assert.equal(hits(b,'simon').length,0);
});
test('Genevieve end-round refund counts actual spending, joins Main/Extra and caps at 12 percent once',()=>{
 for(const count of [0,1,2,3,5]){const {b}=fixture();use(b,'selene','selene.masquerade');state(b).value=6;for(let i=0;i<count;i++)use(b,'selene','selene.execution','enemy_0',i%2?'extra':'main');for(const a of b.actors.filter(a=>a.team==='party'))a.mp=0;b.phase='main';endRound(b);for(const a of b.actors.filter(a=>a.team==='party'))assert.equal(a.mp,Math.ceil(battleMaxMp(b.content,a)*Math.min(.12,count*.04)));assert.equal(teamResourceSpent(b,'party','evidence'),0);assert.equal(b.log.filter(s=>s.includes('kích hoạt Thu Xếp Sau Phiên Tòa')).length,count?1:0);}
});
test('fallen Genevieve cannot refund; fallen recipients remain empty; generated evidence gives no refund',()=>{
 const {b}=fixture();use(b,'selene','selene.masquerade');use(b,'selene','selene.execution','enemy_0');getActor(b,'genevieve').hp=0;for(const a of b.actors.filter(a=>a.team==='party'))a.mp=0;endRound(b);for(const a of b.actors.filter(a=>a.team==='party'))assert.equal(a.mp,0);
});
test('Genevieve snapshots evidence before generation, uses ATK for AoE shield/heal, and does not stack shields',()=>{
 for(const stacks of [0,3,6]){const {b}=fixture();state(b).value=stacks;use(b,'genevieve','genevieve.curtain');const shield=Math.round(28*(1.2+stacks*.15));for(const a of b.actors.filter(a=>a.team==='party'))assert.equal(a.shield,shield);assert.equal(amount(b),Math.min(6,stacks+1));
 state(b).value=stacks;for(const a of b.actors.filter(a=>a.team==='party'))a.hp=1;use(b,'genevieve','genevieve.remedy');for(const a of b.actors.filter(a=>a.team==='party'))assert.equal(a.hp,1+Math.round(28*(1+stacks*.15)));}
});
test('DEF/RES and Genevieve rank scale both base and evidence terms consistently',()=>{
 const {b,c}=fixture();state(b).value=6;use(b,'genevieve','genevieve.household');near(status(b,'arthur','vertosse_household').appliedModifiers.defense,.35);assert.equal(status(b,'arthur','vertosse_household').remaining,3);
 const g=getActor(b,'genevieve');g.skillRanks={'genevieve.household':5,'genevieve.curtain':5};use(b,g.id,'genevieve.household');near(status(b,'arthur','vertosse_household').appliedModifiers.resistance,.35*1.05**4);use(b,g.id,'genevieve.curtain');assert.equal(getActor(b,'arthur').shield,Math.round(28*2.1*1.1**4));
 const ranked=resolveRankedAbility(c,getActor(b,'simon'),'simon.strategy',5);near(ranked.effects[0].appliedModifiers.attack,.3*1.05**4);assert.equal(ranked.effects[0].appliedModifiers.speed,.15);
});
test('Simon attack buff and weakness buff last three main turns, extra turns do not tick them',()=>{
 const {b}=fixture();use(b,'simon','simon.closing','arthur');use(b,'simon','simon.cross_examine','arthur');use(b,'simon','simon.strategy','arthur');use(b,'arthur','$defend',undefined,'extra');assert.equal(status(b,'arthur','weakness_exploitation').remaining,3);assert.equal(status(b,'arthur','legal_strategy').remaining,3);
 for(let i=0;i<3;i++)use(b,'arthur','$defend');assert.equal(status(b,'arthur','weakness_exploitation'),undefined);assert.equal(status(b,'arthur','legal_strategy'),undefined);
});
test('Simon two-use damage buff reuses independent per-action charges and can amplify his follow-up',()=>{
 const {b}=fixture();use(b,'simon','simon.closing','selene');use(b,'selene','selene.masquerade');assert.equal(status(b,'selene','closing_argument').charges,2);use(b,'selene','selene.sweep','enemy_0');assert.equal(status(b,'selene','closing_argument').charges,1);
 use(b,'simon','simon.closing','simon');use(b,'selene','selene.execution','enemy_0');assert.equal(status(b,'simon','closing_argument').charges,1);assert.ok(hits(b,'simon')[0].amount>=Math.floor(25*1.6*1.3));
});
test('shared state and mode survive snapshots and wave transitions, but fresh standalone encounters reset both',()=>{
 const {b,c,save}=fixture();use(b,'selene','selene.masquerade');use(b,'selene','selene.execution','enemy_0');const copy=restoreChronicleBattle(c,snapshotChronicleBattle(b));assert.deepEqual(copy.teamResources,b.teamResources);assert.equal(getActor(copy,'selene').activeMode,'lunarmare');assert.equal(createBattle(c,save,'forest_patrol').teamResources.party.evidence.value,0);
 const run=createDungeonRun(c,save,'gold_mine','easy',seededRandom(33));use(run.battle,'selene','selene.masquerade');const pool=structuredClone(run.battle.teamResources);run.battle.outcome='victory';advanceDungeonWave(c,run);assert.deepEqual(run.battle.teamResources,pool);assert.equal(getActor(run.battle,'selene').activeMode,'lunarmare');
});
test('resource tooltip, costs and Rank preview reveal scaling without raw IDs',()=>{
 const {b,c}=fixture(),g=getActor(b,'genevieve'),s=getActor(b,'selene');state(b).value=6;const preview=skillPresentation(c.abilities['genevieve.curtain'],g,c,{teamResourceStacks:6});assert.match(preview.facts.join(' '),/210% ATK/);assert.match(compactSkillScaling(c.abilities['genevieve.curtain'],g,null,c,b),/210% ATK/);assert.match(skillCost(c.abilities['selene.verdict'],s),/3 Bằng Chứng/);assert.ok(skillPreviewOptions(c.abilities['genevieve.household'],g,c).some(x=>x.key==='teamResourceStacks'));assert.match(passivePresentation(s,c).facts.join(' '),/15%/);
});
test('content validation rejects invalid shared costs, gains, scaling and inconsistent pool definitions',()=>{
 for(const change of [c=>c.abilities['selene.execution'].cost.teamResource.amount=7,c=>c.abilities['selene.seal'].effects.at(-1).amount=-1,c=>c.abilities['genevieve.curtain'].effects[0].teamResourceScaling.perStack=-1,c=>c.characters.simon.teamResources.evidence.max=7,c=>c.characters.genevieve.passive.cap=2]){const c=structuredClone(content);change(c);assert.ok(validateContent(c).length>0);}
});

test('Miraebolis phase transitions retain shared evidence and Lunarmare; the global scene stays unchanged',()=>{
 const {c,save}=fixture();save.storyFlags.push('illusion.sinister_unlocked');const b=createBattle(c,save,'miraebolis_superboss',seededRandom(66));const enemy=b.actors.find(a=>a.team==='enemy');
 use(b,'selene','selene.masquerade');const before=structuredClone(b.teamResources);enemy.hp=Math.ceil(enemy.stats.maxHp*enemy.boss.phases[1].atHpRatio)+1;use(b,'selene','$defend');
 // The attack moves across the threshold while using one evidence. The shared pool must not reset.
 use(b,'selene','selene.execution',enemy.id);assert.equal(enemy.bossState.phase,2);assert.equal(amount(b),before.party.evidence.value-1);assert.equal(getActor(b,'selene').activeMode,'lunarmare');assert.equal(battlePresentation(b.actors),null);
});
test('dead family owners do not delete the pool; reaching an empty mode at turn start never skips Selene action',()=>{
 const {b}=fixture();use(b,'selene','selene.masquerade');state(b).value=0;b.queue=['enemy_0','selene'];b.cursor=0;executeAction(b,{actorId:'enemy_0',abilityId:'$defend',targetId:'enemy_0'});assert.equal(getActor(b,'selene').activeMode,undefined);assert.equal(b.queue[b.cursor],'selene');use(b,'selene','selene.seal');assert.equal(amount(b),1);
 getActor(b,'selene').hp=0;use(b,'simon','simon.closing','arthur');assert.equal(amount(b),2);
});

test('Simon retains faction membership without adopting the Vertosse surname',()=>{
 assert.equal(content.characters.simon.name,'Simon');assert.equal(content.characters.simon.affiliation,'Gia tộc Vertosse');assert.ok(content.characters.simon.tags.includes('vertosse'));assert.ok(content.characters.simon.teamResources.evidence);
});
test('Simon and Genevieve each create and use their shared mechanic with no Selene in the party',()=>{
 const {b:s}=fixture(['simon','arthur','iris','elaine']);use(s,'simon','simon.closing','arthur');assert.equal(amount(s),1);assert.equal(status(s,'arthur','closing_argument').charges,2);use(s,'simon','simon.cross_examine','arthur');assert.equal(amount(s),0);assert.equal(status(s,'arthur','weakness_exploitation').remaining,3);assert.equal(hits(s,'simon').length,0);
 const {b:g}=fixture(['genevieve','arthur','iris','elaine']);use(g,'genevieve','genevieve.curtain');assert.equal(amount(g),1);assert.equal(getActor(g,'arthur').shield,Math.round(28*1.2));for(const a of g.actors.filter(a=>a.team==='party'))a.hp=1;use(g,'genevieve','genevieve.remedy');assert.equal(amount(g),2);assert.equal(getActor(g,'arthur').hp,1+Math.round(28*1.15));use(g,'genevieve','genevieve.household');near(status(g,'arthur','vertosse_household').appliedModifiers.defense,.25);
});

test('Lunarmare transformation cooldown starts only on exit, blocks two subsequent rounds and does not restart',()=>{
 const {b,c,save}=fixture();use(b,'selene','selene.masquerade');const a=getActor(b,'selene');assert.equal(a.cooldowns['selene.masquerade'],undefined);state(b).value=3;use(b,a.id,'selene.verdict','enemy_0');assert.equal(a.activeMode,undefined);assert.equal(a.cooldowns['selene.masquerade'],3);assert.ok(b.events.some(e=>e.type==='cooldown_started'&&e.rounds===2));
 const restored=restoreChronicleBattle(c,snapshotChronicleBattle(b));assert.equal(getActor(restored,a.id).cooldowns['selene.masquerade'],3);
 for(let i=0;i<2;i++){endRound(b);assert.equal(abilityAvailability(b,a,c.abilities['selene.masquerade']).ok,false);assert.equal(a.cooldowns['selene.masquerade'],2-i);}
 endRound(b);assert.equal(a.cooldowns['selene.masquerade'],0);assert.equal(abilityAvailability(b,a,c.abilities['selene.masquerade']).ok,true);
 const fresh=createBattle(c,save,'forest_patrol');assert.equal(getActor(fresh,a.id).cooldowns['selene.masquerade'],undefined);
});
test('depletion by Simon starts the same cooldown and Extra Turn does not decrement it',()=>{
 const {b}=fixture();use(b,'selene','selene.masquerade');state(b).value=1;use(b,'simon','simon.cross_examine','arthur');const a=getActor(b,'selene');assert.equal(a.cooldowns['selene.masquerade'],3);b.phase='extra';b.queue=[a.id,'enemy_0'];b.cursor=0;executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});assert.equal(a.cooldowns['selene.masquerade'],3);assert.equal(abilityAvailability(b,a,b.content.abilities['selene.masquerade']).ok,false);
});
test('mode exit from defeat also starts cooldown; snapshots/continuing waves keep it and UI discloses its trigger',()=>{
 const {b,c,save}=fixture();use(b,'selene','selene.masquerade');getActor(b,'selene').hp=1;getActor(b,'enemy_0').stats.attack=1000;b.queue=['enemy_0','simon'];b.cursor=0;executeAction(b,{actorId:'enemy_0',abilityId:'$attack',targetId:'selene'});assert.equal(getActor(b,'selene').activeMode,undefined);assert.equal(getActor(b,'selene').cooldowns['selene.masquerade'],3);
 const run=createDungeonRun(c,save,'gold_mine','easy',seededRandom(41));use(run.battle,'selene','selene.masquerade');teamResourceState(run.battle,'party','evidence').value=3;run.battle.queue=['selene','genevieve'];run.battle.cursor=0;executeAction(run.battle,{actorId:'selene',abilityId:'selene.verdict',targetId:run.battle.actors.find(a=>a.team==='enemy').id});assert.equal(getActor(run.battle,'selene').cooldowns['selene.masquerade'],3);run.battle.outcome='victory';advanceDungeonWave(c,run);assert.equal(getActor(run.battle,'selene').cooldowns['selene.masquerade'],2);
 assert.match(skillCost(c.abilities['selene.masquerade'],getActor(b,'selene')),/sau khi rời dạng: 2 vòng/);assert.match(skillPresentation(c.abilities['selene.masquerade'],getActor(b,'selene'),c).facts.join(' '),/Sau khi rời dạng: hồi chiêu 2 vòng/);
 for(const r of [{abilityId:'selene.masquerade',rounds:0},{abilityId:'selene.seal',rounds:2}]){const copy=structuredClone(c);copy.characters.selene.combatModes.lunarmare.exitCooldown=r;assert.ok(validateContent(copy).length>0);}
});
