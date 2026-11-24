import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave} from '../src/core/game-save.js';
import {createBattle,activeActor,getActor,executeAction,forecastBattleAction,moonlightSnapshot,abilityAvailability} from '../src/core/battle.js';
import {createArenaBattle} from '../src/core/arena.js';
import {createDungeonRun,advanceDungeonWave} from '../src/core/dungeon.js';
import {validateContent} from '../src/core/content.js';
import {battleStat} from '../src/core/stat-values.js';
import {moonlightStat,commandMoonlight,canCommandMoonlight} from '../src/core/moonlight-blessings.js';
import {moonlightCyclePhase,moonlightMagicAmplification,setMoonlightSelfAmplification} from '../src/core/moonlight-cycle.js';
import {combatTimeline} from '../src/ui/combat-timeline.js';
const base=await loadContent(),party=['luna','elaine','freya','iris'],id='test.eclipse_command';
function content(){const c=structuredClone(base);c.abilities[id]={id,name:'Hiệu Lệnh Thử',target:'enemy',cost:{mp:2},cooldown:0,skillLineId:id,growthProfile:'fixed',rankable:false,fixedReason:'Chỉ trong kiểm thử.',effects:[{type:'command_moonlight',blessingId:'chaotic_eclipse',targetMode:'selected',multiplier:1.2,hits:3}]};
 for(const [name,type,element]of [['fire_magic','magical','fire'],['water_magic','magical','water'],['fire_physical','physical','fire'],['dual_magic','magical','plain']]){c.abilities[name]={id:name,name,target:'enemy',cost:{mp:0},cooldown:0,skillLineId:name,growthProfile:'fixed',rankable:false,fixedReason:'Chỉ trong kiểm thử.',effects:[{type:'damage',damageType:type,element,multiplier:1,scalingStat:'magic',...(name==='dual_magic'?{additionalElements:['fire']}:{})}]};c.characters.iris.abilities.push(name);}c.characters.iris.abilities.push(id);return c;}
function save(c){const s=createGameSave(c);s.party=[...party];s.partyPresets[0].slots=[...party];s.unlockedCharacterIds=[...new Set([...s.unlockedCharacterIds,...party])];return s;}
function prepare(b){for(const a of b.actors){a.hp=a.stats.maxHp=100000;a.mp=a.stats.maxMp=1000;if(a.team==='enemy'){a.stats.attack=a.stats.magic=a.stats.defense=a.stats.resistance=0;a.weaknesses=[];a.abilities=['$defend'];}if(a.definitionId==='iris')a.abilities.push(id);}return b;}
function setup(){const c=content();return prepare(createBattle(c,save(c),'forest_patrol',()=>.99));}
function cast(b,actorId,abilityId,targetId){b.queue=[actorId,...b.actors.filter(a=>a.id!==actorId&&a.hp>0).map(a=>a.id)];b.cursor=0;executeAction(b,{actorId,abilityId,targetId:targetId??b.actors.find(a=>a.team!==getActor(b,actorId).team&&a.hp>0).id});return [...b.events];}
const damage=(events,source='moonlight_party')=>events.filter(e=>e.type==='damage'&&e.sourceId===source);
function activate(b){cast(b,'freya','$attack');const events=cast(b,'elaine','$attack');assert.equal(b.moonlight.party.active.id,'chaotic_eclipse');return events;}
function next(b){const r=b.round,events=[];for(let i=0;i<100&&b.round===r&&!b.outcome;i++){const a=activeActor(b);executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});events.push(...b.events);}assert.equal(b.round,r+1);return events;}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,a+' != '+b);

test('registered four-round recipe is available to Luna, with Nicole released and no access for mere support',()=>{const c=content(),d=c.moonlightBlessings.chaotic_eclipse;assert.deepEqual(validateContent(c),[]);assert.deepEqual(d.elements,['water','fire']);assert.equal(d.durationRounds,4);assert.deepEqual(d.phases,[]);assert.equal(d.targetMode,'selected');assert.equal(d.statRatio,1.5);assert.ok(c.characters.maria.moonlightBlessings.includes('chaotic_eclipse')&&c.characters.nicole.moonlightBlessings.includes('chaotic_eclipse'));assert.equal(c.characters.aisha.moonlightBlessings,undefined);const cc=content();cc.characters.luna.passive={};const b=prepare(createBattle(cc,save(cc),'forest_patrol',()=>.99));cast(b,'freya','$attack');cast(b,'elaine','$attack');assert.equal(b.moonlight.party,undefined);});

test('activation waits for all action damage, does not attack or refill, and owns no fifth turn slot',()=>{const b=setup(),events=activate(b);assert.ok(events.findIndex(e=>e.type==='moonlight_enter')>events.findLastIndex(e=>e.type==='damage'));assert.equal(damage(events).length,0);assert.equal(b.moonlight.party.active.expiresAfterRound,4);assert.equal(b.moonlight.party.active.cyclePhaseId,'waxing');assert.ok(!b.queue.includes('moonlight_party'));cast(b,'freya','$attack');assert.deepEqual(b.moonlight.party.slots,[]);});

test('actual rounds progress 20 / 60 / 60 / 20 then expire, with zero automatic attacks',()=>{const b=setup();activate(b);let events=[];for(const [index,phase,amp]of [[1,'waxing',.2],[2,'full',.6],[3,'full',.6],[4,'waning',.2]]){assert.equal(b.round,index);assert.equal(moonlightCyclePhase(b,'party').id,phase);assert.equal(moonlightCyclePhase(b,'party').damageAmp,amp);assert.equal(b.moonlight.party.active.cyclePhaseId,phase);events.push(...next(b));}assert.equal(b.moonlight.party.active,null);assert.equal(damage(events).length,0);assert.equal(events.filter(e=>e.type==='moonlight_phase').length,2);assert.equal(events.filter(e=>e.type==='moonlight_exit').length,1);assert.equal(moonlightMagicAmplification(b,getActor(b,'iris'),{damageType:'magical',element:'fire'}),1);});

test('MAG uses the dynamic living Water/Fire average, excluding the blessing, and snapshots never mutate clocks',()=>{const b=setup();activate(b);getActor(b,'elaine').stats.magic=80;getActor(b,'freya').stats.magic=120;getActor(b,'luna').stats.magic=900;const value=()=>moonlightStat(b,'party',(a,k)=>battleStat(b.content,a,k));near(value(),150);getActor(b,'elaine').stats.magic=160;near(value(),210);getActor(b,'freya').hp=0;near(value(),240);const before=structuredClone(b.moonlight);assert.equal(moonlightSnapshot(b).party.active.statValue,240);assert.deepEqual(b.moonlight,before);});

test('only magical Fire damage is amplified, once for dual elements; actual damage follows the phase',()=>{const b=setup();activate(b);const iris=getActor(b,'iris');iris.stats.magic=100;const amount=name=>{getActor(b,'enemy_0').statuses=[];return damage(cast(b,iris.id,name),'iris')[0].amount;};assert.equal(amount('fire_magic'),120);assert.equal(amount('water_magic'),100);assert.equal(amount('fire_physical'),100);assert.equal(amount('dual_magic'),120);next(b);assert.equal(amount('fire_magic'),160);assert.equal(amount('dual_magic'),160);assert.equal(moonlightMagicAmplification(b,getActor(b,'enemy_0'),{element:'fire',damageType:'magical'}),1);});

test('selected command uses its own MAG, three hits, Fire/Moon, one exposure and target-only VFX',()=>{const b=setup();activate(b);const fire=Object.values(b.content.statuses).find(s=>s.exposedElement==='fire').id,target=getActor(b,'enemy_1');target.statuses.push({id:fire,remaining:10,stacks:3,sourceId:'iris'});getActor(b,'elaine').stats.magic=80;getActor(b,'freya').stats.magic=120;const events=cast(b,'iris',id,target.id),hits=damage(events);assert.equal(hits.length,3);assert.ok(hits.every(e=>e.targetId===target.id&&e.damageType==='magical'&&e.elements.includes('fire')&&e.elements.includes('moon')));assert.equal(target.statuses.find(s=>s.id===fire).stacks,2);assert.equal(getActor(b,'moonlight_party').stats.magic,150);assert.equal(events.filter(e=>e.type==='reaction'&&e.sourceId==='moonlight_party').length,1);assert.deepEqual(b.moonlight.party.active.pulses,{});const fx=combatTimeline(events,b.content).frames.filter(f=>f.kind==='signature'&&f.presentation==='moonlight_eclipse');assert.equal(fx.length,1);assert.equal(fx[0].targetId,target.id);assert.equal(fx[0].area,false);});

test('a killed target stops the remaining command hits without retargeting or guardian responses',()=>{const b=setup();activate(b);getActor(b,'enemy_1').hp=1;const events=cast(b,'iris',id,'enemy_1');assert.equal(damage(events).length,1);assert.equal(damage(events)[0].targetId,'enemy_1');assert.equal(events.filter(e=>e.type==='reaction'&&e.sourceId==='noelle').length,0);});

test('direct command rejects missing, allied, dead or area targets and cannot recurse',()=>{const b=setup();activate(b);const a=getActor(b,'iris');let calls=0;const io={stat:()=>10,outcome:()=>false,followUp(){},pulse(){calls++;assert.equal(commandMoonlight(b,a,'chaotic_eclipse',io,{targetMode:'selected',primaryTargetId:'enemy_0'}),false);}};for(const options of [undefined,{targetMode:'selected',primaryTargetId:a.id},{targetMode:'selected',primaryTargetId:'missing'},{targetMode:'selected',primaryTargetId:'enemy_0',primaryMultiplier:2}])assert.equal(commandMoonlight(b,a,'chaotic_eclipse',io,options),false);getActor(b,'enemy_1').hp=0;assert.equal(commandMoonlight(b,a,'chaotic_eclipse',io,{targetMode:'selected',primaryTargetId:'enemy_1'}),false);assert.equal(commandMoonlight(b,a,'chaotic_eclipse',io,{targetMode:'selected',primaryTargetId:'enemy_0'}),true);assert.equal(calls,1);});

test('forecast is pure; absent or expired blessings reject mandatory commands before MP payment',()=>{const b=setup(),a=getActor(b,'iris'),mp=a.mp;assert.equal(abilityAvailability(b,a,b.content.abilities[id]).ok,false);assert.throws(()=>cast(b,a.id,id));assert.equal(a.mp,mp);activate(b);b.queue=[a.id,...b.actors.filter(x=>x.id!==a.id).map(x=>x.id)];b.cursor=0;const before=structuredClone(b.moonlight),cmd={actorId:a.id,abilityId:id,targetId:'enemy_0'},trial=forecastBattleAction(b,cmd);assert.equal(damage(trial.events).length,3);assert.deepEqual(b.moonlight,before);assert.equal(a.mp,mp);b.moonlight.party.active.expiresAfterRound=b.round-1;assert.equal(canCommandMoonlight(b,a,'chaotic_eclipse'),false);assert.throws(()=>cast(b,a.id,id));assert.equal(a.mp,mp);});

test('Extra phase does not advance the lunar cycle or add automatic attacks',()=>{const b=setup();activate(b);b.extraTurnGrants.add('iris');b.extraPhaseRequired=true;getActor(b,'freya').statuses.push({id:'stunned',remaining:2,stacks:1,sourceId:'enemy_0'});const deadline=b.moonlight.party.active.expiresAfterRound;let entered=false,events=[];for(let i=0;i<100&&b.round===1;i++){if(b.phase==='extra'){entered=true;assert.equal(moonlightCyclePhase(b,'party').id,'waxing');}const a=activeActor(b);executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});events.push(...b.events);}assert.ok(entered);assert.equal(moonlightCyclePhase(b,'party').id,'full');assert.equal(b.moonlight.party.active.expiresAfterRound,deadline);assert.equal(damage(events).length,0);});

test('provider KO does not erase an active cycle; independent battles start empty',()=>{const b=setup();activate(b);getActor(b,'luna').hp=0;cast(b,'iris','$defend','iris');next(b);assert.equal(moonlightCyclePhase(b,'party').id,'full');assert.equal(b.moonlight.party.active.id,'chaotic_eclipse');cast(b,'iris',id);assert.equal(damage(b.events).length,3);assert.equal(setup().moonlight.party.active,null);});

test('dungeon room carry preserves the activation and expiry instead of refreshing the cycle',()=>{const c=content(),run=createDungeonRun(c,save(c),'gold_mine','easy',()=>.99);prepare(run.battle);activate(run.battle);setMoonlightSelfAmplification(run.battle,'party',true);const before=structuredClone(run.battle.moonlight.party.active);run.battle.outcome='victory';advanceDungeonWave(c,run);assert.equal(run.battle.moonlight.party.active.includeBlessingDamage,true);assert.equal(run.battle.moonlight.party.active.startedRound,before.startedRound);assert.equal(run.battle.moonlight.party.active.expiresAfterRound,before.expiresAfterRound);assert.equal(moonlightCyclePhase(run.battle,'party').id,'full');assert.ok(!run.battle.events.some(e=>e.type==='moonlight_enter'));});

test('Arena mirror has independent cycle clocks, dynamic sources and selected targets',()=>{const c=content(),b=prepare(createArenaBattle(c,save(c),'mirror',17));const actor=(team,name)=>b.actors.find(a=>a.team===team&&a.definitionId===name);for(const team of ['party','enemy']){const other=team==='party'?'enemy':'party',target=actor(other,'luna');cast(b,actor(team,'freya').id,'$attack',target.id);cast(b,actor(team,'elaine').id,'$attack',target.id);assert.equal(b.moonlight[team].active.id,'chaotic_eclipse');const events=cast(b,actor(team,'iris').id,id,target.id);assert.equal(damage(events,'moonlight_'+team).length,3);assert.ok(damage(events,'moonlight_'+team).every(e=>e.targetId===target.id));}assert.notEqual(getActor(b,'moonlight_party'),getActor(b,'moonlight_enemy'));});

test('Luna end-round attack selects magical Fire/Moon but is not an automatic blessing pulse',()=>{const b=setup();activate(b);cast(b,'luna','luna.song','luna');const events=next(b),hits=damage(events,'luna').filter(e=>e.abilityId==='luna.pulse');assert.ok(hits.length>0);assert.ok(hits.every(e=>e.damageType==='magical'&&e.elements.includes('fire')&&e.elements.includes('moon')));assert.equal(damage(events).length,0);});

test('invalid cycle sums, aura values and untargeted command authoring are rejected',()=>{for(const change of [c=>c.moonlightBlessings.chaotic_eclipse.cycle[1].durationRounds=3,c=>c.moonlightBlessings.chaotic_eclipse.cycle[1].damageAmp=2,c=>c.moonlightBlessings.chaotic_eclipse.phases=['end'],c=>c.moonlightBlessings.chaotic_eclipse.damageAmplification.element='water',c=>delete c.abilities[id].effects[0].targetMode,c=>c.abilities[id].effects[0].primaryMultiplier=2]){const c=content();change(c);assert.ok(validateContent(c).length>0);}});

test('blessing commands do not inherit their own Fire magic amplification by default in any phase',()=>{
 const b=setup();activate(b);getActor(b,'elaine').stats.magic=80;getActor(b,'freya').stats.magic=120;
 assert.equal(b.content.moonlightBlessings.chaotic_eclipse.damageAmplification.includeBlessingDamage,false);
 for(const phase of ['waxing','full','full','waning']){
  assert.equal(moonlightCyclePhase(b,'party').id,phase);getActor(b,'enemy_0').statuses=[];
  const hits=damage(cast(b,'iris',id));assert.equal(hits.length,3);
  // 150 dynamic MAG * 120% coefficient * Luna's independent 108% Moon base multiplier = 194.
  assert.ok(hits.every(h=>h.amount===194),JSON.stringify(hits.map(h=>h.amount)));next(b);
 }
});

test('runtime self-amp switch is strict, reversible and local to this instance, with unchanged clock/MAG',()=>{
 const b=setup();assert.equal(setMoonlightSelfAmplification(b,'party',true),false);activate(b);
 getActor(b,'elaine').stats.magic=80;getActor(b,'freya').stats.magic=120;next(b);
 const before=structuredClone(b.moonlight.party.active),stat=moonlightStat(b,'party',(a,k)=>battleStat(b.content,a,k));
 assert.equal(setMoonlightSelfAmplification(b,'party','true'),false);assert.equal(setMoonlightSelfAmplification(b,'enemy',true),false);
 assert.equal(setMoonlightSelfAmplification(b,'party',true),true);getActor(b,'enemy_0').statuses=[];
 const hits=damage(cast(b,'iris',id));assert.ok(hits.every(h=>h.amount===311)); // floor(198 * 1.6), once.
 assert.equal(b.moonlight.party.active.startedRound,before.startedRound);assert.equal(b.moonlight.party.active.expiresAfterRound,before.expiresAfterRound);
 assert.equal(moonlightStat(b,'party',(a,k)=>battleStat(b.content,a,k)),stat);assert.deepEqual(b.content.moonlightBlessings.chaotic_eclipse.damageAmplification,{damageType:'magical',element:'fire',includeBlessingDamage:false});
 assert.equal(setMoonlightSelfAmplification(b,'party',false),true);assert.ok(damage(cast(b,'iris',id)).every(h=>h.amount===194));
 next(b);next(b);next(b);assert.equal(b.moonlight.party.active,null);assert.equal(setMoonlightSelfAmplification(b,'party',true),false);
 activate(b);assert.equal(b.moonlight.party.active.includeBlessingDamage,undefined);assert.equal(moonlightMagicAmplification(b,getActor(b,'moonlight_party'),{damageType:'magical',element:'fire'}),1);
});

test('definition opt-in and runtime opt-out work, while missing fields remain excluded and invalid values fail validation',()=>{
 const b=setup();b.content.moonlightBlessings.chaotic_eclipse.damageAmplification.includeBlessingDamage=true;activate(b);
 const source=getActor(b,'moonlight_party'),effect={damageType:'magical',element:'fire',additionalElements:['moon']};
 assert.equal(moonlightMagicAmplification(b,source,effect),1.2);assert.equal(setMoonlightSelfAmplification(b,'party',false),true);assert.equal(moonlightMagicAmplification(b,source,effect),1);
 const c=content();delete c.moonlightBlessings.chaotic_eclipse.damageAmplification.includeBlessingDamage;assert.deepEqual(validateContent(c),[]);
 for(const invalid of ['true',1,null]){const cc=content();cc.moonlightBlessings.chaotic_eclipse.damageAmplification.includeBlessingDamage=invalid;assert.ok(validateContent(cc).length>0);}
});

test('self-amp switch stays independent in Arena and forecast; ally Fire magic is still amplified',()=>{
 const c=content(),b=prepare(createArenaBattle(c,save(c),'mirror',17)),find=(team,name)=>b.actors.find(a=>a.team===team&&a.definitionId===name);
 for(const team of ['party','enemy']){const target=find(team==='party'?'enemy':'party','luna');cast(b,find(team,'freya').id,'$attack',target.id);cast(b,find(team,'elaine').id,'$attack',target.id);}
 setMoonlightSelfAmplification(b,'party',true);const effect={damageType:'magical',element:'fire'};
 assert.equal(moonlightMagicAmplification(b,getActor(b,'moonlight_party'),effect),1.2);assert.equal(moonlightMagicAmplification(b,getActor(b,'moonlight_enemy'),effect),1);
 assert.equal(moonlightMagicAmplification(b,find('enemy','iris'),effect),1.2);
 const a=find('party','iris');b.queue=[a.id,...b.actors.filter(x=>x.id!==a.id).map(x=>x.id)];b.cursor=0;
 const before=structuredClone(b.moonlight),trial=forecastBattleAction(b,{actorId:a.id,abilityId:id,targetId:find('enemy','luna').id});
 assert.equal(trial.moonlight.party.active.includeBlessingDamage,true);assert.deepEqual(b.moonlight,before);
});

test('cycle validator rejects the old order and non-1-2-1 phase durations even if totals match',()=>{for(const change of [x=>x.moonlightBlessings.chaotic_eclipse.cycle.reverse(),x=>{x.moonlightBlessings.chaotic_eclipse.cycle[0].durationRounds=2;x.moonlightBlessings.chaotic_eclipse.cycle[1].durationRounds=1;}]){const cc=content();change(cc);assert.ok(validateContent(cc).length);}});
