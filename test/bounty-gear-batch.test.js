import {createStoryRun,advanceStoryWave} from '../src/core/story-waves.js';
import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,getActor,executeAction,executeEnemyTurn,activeActor,abilityAvailability,targetsFor} from '../src/core/battle.js';
import {claimBattleReward} from '../src/core/economy.js';import {craftGear} from '../src/core/gear-forge.js';
import {gearRecipeUnlocked} from '../src/core/gear-rules.js';import {validateContent} from '../src/core/content.js';
import {questCatalog,BOUNTY_PREREQUISITES,encounterReturnPath} from '../src/core/quest-catalog.js';
import {dungeonQuestPool} from '../src/core/dungeon.js';
import {initializeGearEncounter} from '../src/core/gear-effects.js';
const content=await loadContent(),bounties=Object.values(content.encounters).filter(e=>e.category==='bounty');
function fixture(){const c=createGameSave(content);c.party=['arthur','iris','elaine','garrek'];const b=createBattle(structuredClone(content),c,'forest_patrol',()=>.99);for(const a of b.actors){a.passive=null;delete a.baseStats;a.stats={...a.stats,maxHp:100,maxMp:100,attack:100,magic:100,defense:0,resistance:0};a.hp=a.team==='enemy'?10000:100;a.stats.maxHp=a.hp;a.mp=50;a.shield=0;a.statuses=[];a.weaknesses=[];a.damageTypeWeaknesses=[];a.gearEffects=[];}return b;}
const actor=(b,id='arthur')=>getActor(b,id);
function gear(b,id,owner='arthur'){actor(b,owner).gearEffects.push(structuredClone(content.gearEffects[id]));return actor(b,owner);}
function cast(b,owner,effects,target='enemy_0',type='enemy',extra={}){const a=actor(b,owner),id='test.'+owner,skill={id,name:id,target:type,effects,...extra};b.content.abilities[id]=skill;if(!a.abilities.includes(id))a.abilities.push(id);return use(b,owner,id,target);}
function use(b,owner,id,target=owner){b.outcome=null;b.phase='main';b.queue=[owner,owner==='enemy_0'?'iris':'enemy_0'];b.cursor=0;executeAction(b,{actorId:owner,abilityId:id,targetId:target});return b.events;}
const damage=(n=1,type='physical',element='plain',extra={})=>({type:'damage',damageType:type,element,multiplier:n,...extra});
function attack(b,owner='arthur',target='enemy_0',n=1,type='physical',extra={}){return cast(b,owner,[damage(n,type,extra.element??'plain',extra)],target);}
const hits=b=>b.events.filter(e=>e.type==='damage'&&!e.periodic);
function finishStories(){let c=createGameSave(content);for(const story of Object.values(content.travelerStories).filter(s=>['iris','fiona','takeshi'].includes(s.id))){for(const id of story.chapters){const e=content.encounters[id];c=claimBattleReward(c,{encounterId:id,outcome:'victory',rewardRandom:()=>0,actors:(e.requiredPartyIds??[]).map(id=>({id,team:'party'})),...(e.waves?{storyWave:{waveIndex:e.waves.length-1,totalWaves:e.waves.length}}:{})},content);}}return c;}

test('five bounty bosses and 18 recipes validate, stay out of ordinary board/dungeon pools and require all three stories',()=>{
 assert.deepEqual(validateContent(content),[]);assert.equal(bounties.length,5);assert.equal(Object.values(content.gearEffects).filter(r=>r.requires?.firstClear).length,18);
 const c=createGameSave(content);for(const id of BOUNTY_PREREQUISITES){assert.equal(questCatalog(content,c,{tab:'bounty'}).length,0);assert.throws(()=>createBattle(content,c,bounties[0].id));c.claimedFirstClearRewards.push(id);}
 assert.equal(questCatalog(content,c,{tab:'bounty'}).length,5);
 assert.equal(questCatalog(content,c,{tab:'bounty',type:'normal'}).length,5);
 assert.ok(questCatalog(content,c).every(e=>e.category!=='bounty'));
 assert.ok(dungeonQuestPool(content,'dangerous').every(id=>content.encounters[id].category!=='bounty'));
 for(const e of bounties){assert.equal(e.rewardTier,'boss');assert.equal(e.enemies.length,1);assert.equal(content.enemies[e.enemies[0]].boss,undefined);assert.equal(encounterReturnPath(content,e.id),`/quests?tab=bounty&selected=${e.id}`);}
});
test('boss first clear unlocks only assigned recipes, survives save and failed persistence, replay never repeats unlocks',()=>{
 let c=finishStories();assert.ok(BOUNTY_PREREQUISITES.every(id=>c.claimedFirstClearRewards.includes(id)));
 for(const e of bounties){const b={questDifficulty:'very_easy',encounterId:e.id,outcome:'victory',rewardRandom:()=>0};assert.throws(()=>claimBattleReward(c,b,content,()=>{throw Error('disk');}));assert.equal(b.rewardClaimed,undefined);assert.ok(e.firstClearRewards.every(r=>!gearRecipeUnlocked(c,content.gearEffects[r.recipeId])));
  c=claimBattleReward(c,b,content);assert.equal(b.firstClearRewards.length,e.firstClearRewards.length);c=decodeGameSave(encodeGameSave(c,content),content);assert.ok(e.firstClearRewards.every(r=>gearRecipeUnlocked(c,content.gearEffects[r.recipeId])));
  const replay={questDifficulty:'very_easy',encounterId:e.id,outcome:'victory',rewardRandom:()=>0};const coins=c.coins;c=claimBattleReward(c,replay,content);assert.equal(c.coins,coins+150);assert.deepEqual(replay.firstClearRewards,[]);
 }
 const fresh=createGameSave(content);assert.throws(()=>claimBattleReward(fresh,{encounterId:bounties[0].id,outcome:'victory'},content));
});
test('new recipe crafts only after boss clear, uses common cost and real T3 material',()=>{
 let c=finishStories();Object.assign(c,{coins:100000,prismaFragments:10000});c.gear=[{id:'gear_1',typeId:'t3_focused',stats:{attack:5}}];c.gacha.totalPulls=1;
 const options={materialId:'gear_1',effectId:'hunter_ring'};assert.throws(()=>craftGear(c,content,options));c=claimBattleReward(c,{encounterId:'bounty_ash_cloaked_swordsman',outcome:'victory',rewardRandom:()=>0},content);
 const coins=c.coins;c=craftGear(c,content,options);assert.equal(c.coins,coins-12000);assert.equal(c.prismaFragments,7600);assert.equal(c.gear[0].effectId,'hunter_ring');assert.equal(c.gear.length,1);assert.deepEqual(decodeGameSave(encodeGameSave(c,content),content),c);
});
test('typed mirrors reduce exactly one direct hit then wait three rounds, do not reduce the other type',()=>{
 for(const [id,type]of[['spell_mirror','magical'],['recoil_lining','physical']]){const b=fixture();gear(b,id,'iris');cast(b,'enemy_0',[damage(.2,type)],'iris');assert.equal(hits(b)[0].amount,16);attack(b,'enemy_0','iris',.2,type);assert.equal(hits(b)[0].amount,20);b.round+=3;attack(b,'enemy_0','iris',.2,type);assert.equal(hits(b)[0].amount,16);}
 const b=fixture();gear(b,'spell_mirror','iris');attack(b,'enemy_0','iris',.2,'physical');assert.equal(hits(b)[0].amount,20);assert.equal(actor(b,'iris').gearEffectReadyRounds,undefined);
});
test('multi-hit physical mirror affects first connected hit only; dodge does not spend it',()=>{
 const b=fixture();const a=gear(b,'recoil_lining','iris');attack(b,'enemy_0','iris',.2,'physical',{hits:2});assert.deepEqual(hits(b).map(h=>h.amount),[16,20]);
 const c=fixture(),t=gear(c,'recoil_lining','iris');t.statuses=[{id:'evasive',remaining:2,stacks:1,sourceId:t.id}];c.random=()=>0;attack(c,'enemy_0','iris',.2);assert.equal(hits(c).length,0);assert.equal(t.gearEffectReadyRounds,undefined);
});
test('impact stone uses HP plus absorbed shield, procs after break, never revives or replaces a thicker shield',()=>{
 const b=fixture(),t=gear(b,'unyielding_stone','iris');t.shield=30;attack(b,'enemy_0','iris',.3);assert.equal(t.hp,100);assert.equal(t.shield,12);assert.equal(t.gearEffectReadyRounds.gear_unyielding_stone,b.round+4);
 const c=fixture(),u=gear(c,'unyielding_stone','iris');u.shield=100;attack(c,'enemy_0','iris',.3);assert.equal(u.shield,70);assert.equal(u.gearEffectReadyRounds,undefined);
 const d=fixture(),v=gear(d,'unyielding_stone','iris');v.hp=20;attack(d,'enemy_0','iris',.5);assert.equal(v.hp,0);assert.equal(v.shield,0);
});
test('life charm heals once per encounter, only after actual HP loss and only while alive',()=>{
 const b=fixture(),t=gear(b,'life_charm','iris');t.hp=25;t.shield=20;attack(b,'enemy_0','iris',.05);assert.equal(t.hp,25);assert.equal(t.gearEffectEncounterUses?.gear_life_charm,undefined);
 t.shield=0;attack(b,'enemy_0','iris',.05);assert.equal(t.hp,32);t.hp=25;attack(b,'enemy_0','iris',.05);assert.equal(t.hp,20);
 b.encounterId='same';initializeGearEncounter(b);assert.deepEqual(t.gearEffectEncounterUses,{});t.gearEffectEncounterUses.gear_life_charm=true;initializeGearEncounter(b,true);assert.equal(t.gearEffectEncounterUses.gear_life_charm,true);initializeGearEncounter(b);assert.deepEqual(t.gearEffectEncounterUses,{});t.gearEffectEncounterUses.gear_life_charm=true;b.encounterId='next';initializeGearEncounter(b,true);assert.deepEqual(t.gearEffectEncounterUses,{});
 const c=fixture(),u=gear(c,'life_charm','iris');u.hp=10;attack(c,'enemy_0','iris',.5);assert.equal(u.hp,0);
});
test('life charm can rescue a surviving HP cost but cannot repeatedly refill it',()=>{
 const b=fixture(),a=gear(b,'life_charm');a.hp=35;cast(b,'arthur',[damage(.1)],'enemy_0','enemy',{cost:{hpMaxRatio:.1}});assert.equal(a.hp,37);a.hp=35;cast(b,'arthur',[damage(.1)],'enemy_0','enemy',{cost:{hpMaxRatio:.1}});assert.equal(a.hp,25);
});
test('DoT can trigger life charm while typed direct-hit mirror remains unused',()=>{
 const b=fixture(),a=gear(b,'life_charm','iris');gear(b,'spell_mirror','iris');a.hp=32;a.statuses=[{id:'kai_poison',remaining:1,stacks:1,potency:5,sourceId:'enemy_0'}];b.queue=['arthur','iris','enemy_0'];b.cursor=0;executeAction(b,{actorId:'arthur',abilityId:'$defend',targetId:'arthur'});assert.equal(a.hp,39);assert.equal(a.gearEffectReadyRounds?.gear_spell_mirror,undefined);
});
test('Defend adds 4 MP from incense and shield improves reduction from 40% to 50%',()=>{
 const b=fixture(),t=gear(b,'calming_incense','iris');gear(b,'steadfast_shield','iris');use(b,'iris','$defend');assert.equal(t.mp,59);attack(b,'enemy_0','iris',.2);assert.equal(hits(b)[0].amount,10);assert.equal(t.hp,90);
});
test('source crystal only triggers at main-turn start below or equal 25%, minimum 3 and four-round cooldown',()=>{
 const b=fixture(),a=gear(b,'source_crystal','iris');a.mp=25;b.queue=['arthur','iris','enemy_0'];b.cursor=0;executeAction(b,{actorId:'arthur',abilityId:'$defend',targetId:'arthur'});assert.equal(a.mp,35);
 a.mp=0;b.phase='extra';b.queue=['arthur','iris','enemy_0'];b.cursor=0;executeAction(b,{actorId:'arthur',abilityId:'$defend',targetId:'arthur'});assert.equal(a.mp,0);
 b.round+=4;b.phase='main';a.stats.maxMp=20;b.queue=['arthur','iris','enemy_0'];b.cursor=0;executeAction(b,{actorId:'arthur',abilityId:'$defend',targetId:'arthur'});assert.equal(a.mp,3);
});
test('mana lens rewards successful allied buff once per round, not self buff',()=>{
 const b=fixture(),a=gear(b,'mana_lens');cast(b,'arthur',[{type:'status',status:'calibrated',duration:2}],'arthur','ally');assert.equal(a.mp,50);
 cast(b,'arthur',[{type:'status',status:'calibrated',duration:2}],'iris','ally');assert.equal(a.mp,52);cast(b,'arthur',[{type:'status',status:'calibrated',duration:2}],'elaine','ally');assert.equal(a.mp,52);b.round++;cast(b,'arthur',[{type:'status',status:'calibrated',duration:2}],'iris','ally');assert.equal(a.mp,54);
});
test('emergency kit adds 6% to exactly the lowest pre-cast HP ratio in an AoE, once per round',()=>{
 const b=fixture();gear(b,'emergency_kit');actor(b,'arthur').hp=25;actor(b,'iris').hp=15;actor(b,'elaine').hp=30;cast(b,'arthur',[{type:'heal',flat:10}],'arthur','all_allies');assert.equal(actor(b,'arthur').hp,35);assert.equal(actor(b,'iris').hp,31);assert.equal(actor(b,'elaine').hp,40);assert.equal(b.events.filter(e=>e.gearEffectId==='emergency_kit').length,1);
 actor(b,'iris').hp=10;cast(b,'arthur',[{type:'heal',flat:10}],'iris','ally');assert.equal(actor(b,'iris').hp,20);
});
test('rest bell only rewards actual healing by another ally skill, not self healing or full HP',()=>{
 const b=fixture(),a=gear(b,'rest_bell','iris');a.hp=50;cast(b,'iris',[{type:'heal',flat:10}],'iris','self');assert.equal(a.mp,50);cast(b,'arthur',[{type:'heal',flat:10}],'iris','ally');assert.equal(a.mp,52);cast(b,'arthur',[{type:'heal',flat:10}],'iris','ally');assert.equal(a.mp,52);b.round++;a.hp=100;cast(b,'arthur',[{type:'heal',flat:10}],'iris','ally');assert.equal(a.mp,52);
});
test('hunter ring applies on every eligible single-target cast and snapshots threshold for all its hits',()=>{
 const b=fixture();gear(b,'hunter_ring');actor(b,'enemy_0').hp=actor(b,'enemy_0').stats.maxHp=500;attack(b,'arthur','enemy_0',1,'physical',{hits:2});assert.deepEqual(hits(b).map(h=>h.amount),[118,118]);actor(b,'enemy_0').hp=500;attack(b);assert.equal(hits(b)[0].amount,118);cast(b,'arthur',[damage(1)],'enemy_0','all_enemies');assert.ok(hits(b).every(h=>h.amount===100));
});
test('hunter and execute bonuses never apply to basic attack; execute starts strictly below 35%',()=>{
 const b=fixture();gear(b,'hunter_ring');gear(b,'execution_blade');use(b,'arthur','$attack','enemy_0');assert.equal(hits(b)[0].amount,100);const t=actor(b,'enemy_0');t.stats.maxHp=1000;t.hp=350;attack(b);assert.equal(hits(b)[0].amount,100);t.hp=349;attack(b);assert.equal(hits(b)[0].amount,110);
});
test('shield hook extra never leaks into HP, including a shield smaller than damage or smaller than bonus',()=>{
 for(const [shield,left,hp]of[[200,75,10000],[110,0,10000],[80,0,9980],[0,0,9900]]){const b=fixture();gear(b,'shield_hook');actor(b,'enemy_0').shield=shield;attack(b);assert.equal(actor(b,'enemy_0').shield,left);assert.equal(actor(b,'enemy_0').hp,hp);}
});
test('physical/magical shred waits until cast finishes, only HP damage qualifies, and lasts one main turn',()=>{
 for(const [id,type,status]of[['armor_pin','physical','gear_defense_crack'],['cracked_lens','magical','gear_resistance_crack']]){const b=fixture();gear(b,id);const t=actor(b,'enemy_0');t.stats.defense=t.stats.resistance=100;attack(b,'arthur','enemy_0',1,type,{hits:2});assert.deepEqual(hits(b).map(h=>h.amount),[44,44]);assert.equal(t.statuses.find(s=>s.id===status).remaining,1);b.phase='extra';b.queue=['enemy_0','iris'];b.cursor=0;executeAction(b,{actorId:'enemy_0',abilityId:'$defend',targetId:'enemy_0'});assert.ok(t.statuses.some(s=>s.id===status));use(b,'enemy_0','$defend');assert.ok(!t.statuses.some(s=>s.id===status));}
 const b=fixture();gear(b,'armor_pin');actor(b,'enemy_0').shield=1000;attack(b);assert.equal(actor(b,'enemy_0').statuses.length,0);assert.equal(actor(b).gearEffectReadyRounds,undefined);
});
test('photometer restores once per cast at weakness, includes shield damage and respects two-round cooldown',()=>{
 const b=fixture(),a=gear(b,'photometer');const t=actor(b,'enemy_0');t.weaknesses=['plain'];t.shield=1000;attack(b,'arthur','enemy_0',.2,'physical',{hits:2});assert.equal(a.mp,53);attack(b);assert.equal(a.mp,53);b.round+=2;attack(b);assert.equal(a.mp,56);
});
test('compass rolls once after multi-hit damage, cannot buff its own cast, respects existing weakness and ward',()=>{
 const b=fixture();const a=gear(b,'weakness_compass');let rolls=0;b.random=()=>{rolls++;return .1;};attack(b,'arthur','enemy_0',.1,'physical',{hits:2,element:'fire'});assert.deepEqual(hits(b).map(h=>h.amount),[10,10]);assert.equal(rolls,1);assert.equal(actor(b,'enemy_0').statuses.find(s=>s.id==='exposure_fire').stacks,1);attack(b,'arthur','enemy_0',.1,'physical',{element:'fire'});assert.equal(hits(b)[0].amount,15);
 const c=fixture();gear(c,'weakness_compass');c.random=()=>.1;const t=actor(c,'enemy_0');t.statuses=[{id:'effect_ward',remaining:null,charges:1,stacks:1,sourceId:t.id}];attack(c,'arthur','enemy_0',.1);assert.equal(t.statuses.length,0);assert.equal(actor(c).gearEffectReadyRounds,undefined);t.weaknesses=['plain'];attack(c,'arthur','enemy_0',.1);assert.equal(actor(c).gearEffectReadyRounds,undefined);
});
test('observer medal includes wearer and any ally weakness, only once per round and never replaces stronger shield',()=>{
 const b=fixture(),a=gear(b,'observer_medal','iris');actor(b,'enemy_0').weaknesses=['plain'];attack(b);assert.equal(a.shield,5);a.shield=0;attack(b);assert.equal(a.shield,0);b.round++;attack(b,'iris');assert.equal(a.shield,5);b.round++;a.shield=50;attack(b);assert.equal(a.shield,50);assert.notEqual(a.gearEffectProcRounds.gear_observer_medal,b.round);
});
test('bounty AI restores guardian shield, witch healing strictly below 35%, cleric prefers exposed legal target',()=>{
 const c=createGameSave(content);c.claimedFirstClearRewards=[...BOUNTY_PREREQUISITES];
 for(const id of ['bell_lock_guardian','salt_marsh_witch','black_script_cleric']){const b=createBattle(content,c,'bounty_'+id,()=>.99),boss=actor(b,'enemy_0');b.queue=['enemy_0','arthur'];b.cursor=0;
  if(id==='bell_lock_guardian'){executeEnemyTurn(b);assert.equal(boss.shield,90);}
  if(id==='salt_marsh_witch'){const s=content.abilities['bounty.witch.prayer'];boss.hp=350;assert.equal(abilityAvailability(b,boss,s).ok,false);boss.hp=349;assert.equal(abilityAvailability(b,boss,s).ok,true);executeEnemyTurn(b);assert.equal(boss.hp,404);}
  if(id==='black_script_cleric'){const iris=actor(b,'iris');iris.statuses.push({id:'exposure_dark',remaining:null,stacks:1,sourceId:boss.id});executeEnemyTurn(b);assert.ok(b.events.some(e=>e.type==='damage'&&e.targetId==='iris'&&e.weakness));}
 }
});
test('new content validator rejects broken gear effects, recipe sources, HP gates and hostile target AI',()=>{
 const cases=[c=>c.gearEffects.spell_mirror.effect.ratio=2,c=>c.gearEffects.source_crystal.effect.minimum=0,c=>c.gearEffects.mana_lens.oncePerRound=false,c=>c.gearEffects.hunter_ring.requires.firstClear='missing',c=>c.encounters.bounty_bell_lock_guardian.firstClearRewards[0].recipeId='hunter_ring',c=>c.abilities['bounty.witch.prayer'].requiresHpBelow=2,c=>c.enemies.black_script_cleric.ai.priorities[0].statusId='missing'];for(const alter of cases){const c=structuredClone(content);alter(c);assert.ok(validateContent(c).length);}
});

test('passive follow-up cannot activate offensive skill gear',()=>{
 const b=fixture(),a=actor(b,'iris');Object.assign(a,{passive:structuredClone(content.characters.aurora.passive),resources:structuredClone(content.characters.aurora.resources),resourceValues:{thunder_seals:0}});for(const id of ['photometer','armor_pin','cracked_lens','weakness_compass','hunter_ring'])gear(b,id,'iris');actor(b,'enemy_0').weaknesses=['thunder'];b.random=()=>.1;attack(b,'arthur','enemy_0',.1,'magical');assert.ok(b.events.some(e=>e.type==='reaction'&&e.sourceId==='iris'));assert.ok(!b.events.some(e=>e.gearEffectId));assert.equal(a.mp,50);
});
test('AoE shred chooses one valid main target and never shreds every enemy',()=>{
 const b=fixture();gear(b,'armor_pin');cast(b,'arthur',[damage(.1)],'enemy_1','all_enemies');assert.ok(!actor(b,'enemy_0').statuses.some(s=>s.id==='gear_defense_crack'));assert.ok(actor(b,'enemy_1').statuses.some(s=>s.id==='gear_defense_crack'));assert.ok(!actor(b,'enemy_2').statuses.some(s=>s.id==='gear_defense_crack'));
});
test('cleric mark is applied after damage, can be warded or cleansed, and AI obeys taunt',()=>{
 const b=fixture();const id='bounty.cleric.mark',boss=actor(b,'enemy_0');boss.abilities.push(id);use(b,'enemy_0',id,'iris');assert.equal(hits(b)[0].weakness,false);assert.ok(actor(b,'iris').statuses.some(s=>s.id==='exposure_dark'));
 cast(b,'elaine',[{type:'cleanse',count:1}],'iris','ally');assert.ok(!actor(b,'iris').statuses.some(s=>s.id==='exposure_dark'));
 boss.cooldowns={};actor(b,'iris').hp=100;actor(b,'iris').statuses=[{id:'effect_ward',remaining:null,charges:1,stacks:1,sourceId:'iris'}];use(b,'enemy_0',id,'iris');assert.ok(b.events.some(e=>e.type==='effect_blocked'&&e.statusId==='exposure_dark'));
 const c=createGameSave(content);c.claimedFirstClearRewards=[...BOUNTY_PREREQUISITES];const x=createBattle(content,c,'bounty_black_script_cleric',()=>.99);actor(x,'iris').statuses=[{id:'exposure_dark',remaining:null,stacks:1,sourceId:'enemy_0'}];actor(x,'arthur').statuses=[{id:'taunt',remaining:2,stacks:1,sourceId:'arthur'}];x.queue=['enemy_0','arthur'];x.cursor=0;executeEnemyTurn(x);assert.ok(x.events.filter(e=>e.type==='damage').every(e=>e.targetId==='arthur'));
});
test('once-per-encounter use survives story wave and boss phase, resets even for repeated identical dungeon room',()=>{
 const c=createGameSave(content);c.party=['arthur','fiona',null,null];c.partyPresets[0].slots=[...c.party];const run=createStoryRun(content,c,'fiona_story_eins',()=>.99);const a=getActor(run.battle,'arthur');a.gearEffects=[structuredClone(content.gearEffects.life_charm)];a.gearEffectEncounterUses={gear_life_charm:true};run.battle.outcome='victory';const next=advanceStoryWave(content,run);assert.equal(getActor(next,'arthur').gearEffectEncounterUses.gear_life_charm,true);
 const room=createBattle(content,c,'forest_patrol',()=>.99,{partyActors:next.actors.filter(a=>a.team==='party'),roundOffset:next.round});const p=getActor(room,'arthur');assert.deepEqual(p.gearEffectEncounterUses,{});p.gearEffectEncounterUses.gear_life_charm=true;
 const repeat=createBattle(content,c,'forest_patrol',()=>.99,{partyActors:room.actors.filter(a=>a.team==='party'),roundOffset:room.round});assert.deepEqual(getActor(repeat,'arthur').gearEffectEncounterUses,{});
 c.storyFlags.push('illusion.sinister_unlocked');const phase=createBattle(content,c,'miraebolis_superboss',()=>.99),hero=getActor(phase,'arthur');hero.gearEffects=[structuredClone(content.gearEffects.life_charm)];hero.gearEffectEncounterUses={gear_life_charm:true};getActor(phase,'enemy_0').hp=2341;use(phase,'arthur','arthur.light_slash','enemy_0');assert.equal(getActor(phase,'enemy_0').bossState.phase,2);assert.equal(hero.gearEffectEncounterUses.gear_life_charm,true);
});
