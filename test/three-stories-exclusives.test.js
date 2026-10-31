import test from 'node:test';import assert from 'node:assert/strict';import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';import {createBattle,getActor,executeAction,executeEnemyTurn} from '../src/core/battle.js';
import {battleStat} from '../src/core/stat-values.js';import {copyTurnOrderField,expireTurnOrderField} from '../src/core/turn-order.js';import {exclusivePassive,validateExclusivePassive} from '../src/core/exclusive-hooks.js';
import {resolveCharacter,completeStoryEvent} from '../src/core/progression.js';import {claimBattleReward} from '../src/core/economy.js';import {craftExclusive} from '../src/core/blacksmith.js';
import {exclusiveCraftUnlocked} from '../src/core/blacksmith-rules.js';import {createStoryRun,advanceStoryWave} from '../src/core/story-waves.js';import {isQuestUnlocked,questCatalog} from '../src/core/quest-catalog.js';
import {dungeonQuestPool} from '../src/core/dungeon.js';import {skillPresentation,passivePresentation} from '../src/ui/skill-copy.js';import {skillScaling} from '../src/ui/skill-presentation.js';import {combatTimeline} from '../src/ui/combat-timeline.js';import {validateContent} from '../src/core/content.js';
const content=await loadContent(),owners=['victorina','monica','sieg'],ids={monica:'monica.silver_watch',victorina:'victorina.rose_shield',sieg:'sieg.silver_tide',chelsea:'chelsea.compass'};
const a=(b,id)=>getActor(b,id);
function campaign(party,withGear=true){const c=createGameSave(content);c.unlockedCharacterIds=Object.keys(content.characters);c.party=party;c.partyPresets[0].slots=[...party];completeStoryEvent(c,content,'arthur.full_control_story_cleared');if(withGear)for(const id of party)if(ids[id]){c.exclusiveGear.push({templateId:ids[id],statKey:'maxHp',statValue:25});c.equippedExclusiveGear[id]=ids[id];}return c;}
function fixture(party=['monica','arthur','iris','elaine'],withGear=true){const b=createBattle(structuredClone(content),campaign(party,withGear),'forest_patrol',()=>.99);for(const t of b.actors.filter(t=>t.team==='enemy')){t.hp=t.stats.maxHp=10000;t.stats.attack=100;t.stats.defense=t.stats.resistance=0;t.weaknesses=[];}for(const t of b.actors.filter(t=>t.team==='party'))t.mp=t.stats.maxMp=1000;return b;}
function use(b,owner,skill,target=owner,phase='main'){b.phase=phase;b.outcome=null;b.queue=[owner,owner==='enemy_0'?'iris':'enemy_0'];b.cursor=0;executeAction(b,{actorId:owner,abilityId:skill,targetId:target});}
function hit(b,target,multiplier=.4){const id='test.hit';b.content.abilities[id]={id,name:id,target:'enemy',effects:[{type:'damage',damageType:'physical',element:'plain',multiplier,penetration:1}]};if(!a(b,'enemy_0').abilities.includes(id))a(b,'enemy_0').abilities.push(id);use(b,'enemy_0',id,target);}
function win(c,id,persist=()=>{}){const e=content.encounters[id];return claimBattleReward(c,{encounterId:id,outcome:'victory',rewardRandom:()=>0,actors:(e.requiredPartyIds??[]).map(id=>({id,team:'party'})),...(e.waves?{storyWave:{waveIndex:e.waves.length-1,totalWaves:e.waves.length}}:{})},content,persist);}
function bossSave(owner){let c=intro();return win(win(c,owner+'_story_1'),owner+'_story_2');}
function intro(){let c=createGameSave(content);for(const owner of ['iris','fiona','takeshi'])for(const id of content.travelerStories[owner].chapters)c=win(c,id);return c;}
const damage=b=>b.events.filter(e=>e.type==='damage'&&!e.periodic);

test('three new companion stories, seven enemies and 17 exclusive templates validate',()=>{
 assert.deepEqual(validateContent(content),[]);assert.equal(Object.keys(content.exclusiveGear).length,17);for(const owner of owners){const s=content.travelerStories[owner];assert.equal(s.chapters.length,3);assert.ok(s.order>3);for(const id of s.chapters)assert.equal(content.encounters[id].requiredPartyIds,undefined);}
 assert.equal(content.enemies.time_quill.stats.maxHp,80);assert.ok(content.enemies.time_quill.stats.speed>34);assert.equal(content.enemies.unstable_hourglass.stats.maxHp,130);assert.ok(content.enemies.prototype07.stats.speed>content.characters.monica.stats.speed);
});
test('compound Chelsea exclusive retains 85% counter and extends only urgent to three main turns',()=>{
 const b=fixture(['chelsea','arthur','iris','elaine']);use(b,'chelsea','chelsea.urgent');const status=a(b,'chelsea').statuses.find(s=>s.id==='chelsea_urgent');assert.equal(status.remaining,3);assert.equal(exclusivePassive(a(b,'chelsea'),'skill_scaling_override','chelsea.counter').multiplier,.85);use(b,'chelsea','$defend','chelsea','extra');assert.equal(status.remaining,3);assert.ok(skillPresentation(content.abilities['chelsea.urgent'],a(b,'chelsea'),content).facts.some(s=>s.includes('3 lượt chính')));
});
test('Monica field lasts three global rounds with watch, grants 25% MAG immediately and uses base bonus before percent',()=>{
 const b=fixture();assert.equal(battleStat(content,a(b,'monica'),'magic'),34);use(b,'monica','monica.distortion');assert.equal(b.turnOrderField.expiresAfterRound,3);assert.equal(b.turnOrderField.abilityId,'monica.distortion');assert.equal(battleStat(content,a(b,'monica'),'magic'),42.5);assert.equal(battleStat(content,a(b,'monica'),'magic',false,0,6),50);assert.ok(b.queue.indexOf('iris')<b.queue.indexOf('enemy_0'));
 const p=skillPresentation(content.abilities['monica.distortion'],a(b,'monica'),content);assert.ok(p.facts.some(s=>s.includes('3 vòng')));assert.ok(p.facts.some(s=>s.includes('+25% MAG')));assert.ok(skillScaling(content.abilities['monica.distortion'],a(b,'monica'),content).some(s=>s.includes('3 vòng')));
});
test('watch refresh never adds remaining duration, expires after global round and removes all MAG bonus',()=>{
 const b=fixture();use(b,'monica','monica.distortion');b.round=2;a(b,'monica').cooldowns={};use(b,'monica','monica.distortion');assert.equal(b.turnOrderField.expiresAfterRound,4);assert.equal(battleStat(content,a(b,'monica'),'magic'),42.5);expireTurnOrderField(b,{write(){},emit(){}},true);assert.equal(battleStat(content,a(b,'monica'),'magic'),42.5);b.round=4;expireTurnOrderField(b,{write(){},emit(){}},true);assert.equal(b.turnOrderField,null);assert.equal(battleStat(content,a(b,'monica'),'magic'),34);
 const base=fixture(undefined,false);use(base,'monica','monica.distortion');assert.equal(base.turnOrderField.expiresAfterRound,2);assert.equal(battleStat(content,a(base,'monica'),'magic'),34);
});
test('field MAG bonus follows own field only, survives room carry without doubling, and clears when replaced',()=>{
 const b=fixture();use(b,'monica','monica.distortion');const c=campaign(['monica','arthur','iris','elaine']);const carried=createBattle(content,c,'forest_patrol',()=>.99,{partyActors:b.actors.filter(t=>t.team==='party'),turnOrderField:copyTurnOrderField(b.turnOrderField),roundOffset:1});assert.equal(battleStat(content,a(carried,'monica'),'magic'),42.5);
 const foe=a(carried,'enemy_0');foe.abilities.push('monica.distortion');foe.mp=100;use(carried,'enemy_0','monica.distortion');assert.equal(battleStat(content,a(carried,'monica'),'magic'),34);assert.equal(carried.turnOrderField.sourceId,'enemy_0');
});
test('rose shield heals bearer from current DEF/RES, alongside MP, once per recipient per round',()=>{
 const b=fixture(['victorina','arthur','iris','elaine']);use(b,'victorina','victorina.petals');const target=a(b,'arthur');target.hp-=50;target.mp=0;const before=target.hp,shield=target.shield;hit(b,'arthur');const lost=damage(b)[0].amount;assert.equal(target.hp,before-lost+10);assert.equal(target.mp,6);assert.ok(shield>0);
 target.shield=35;target.shieldSourceId='victorina';target.mp=0;const hp=target.hp;hit(b,'arthur');assert.equal(target.hp,hp-damage(b)[0].amount);assert.equal(target.mp,0);
 const iris=a(b,'iris');iris.hp-=40;iris.mp=0;hit(b,'iris');assert.equal(iris.mp,6);assert.ok(b.events.some(e=>e.type==='heal'&&e.targetId==='iris'&&e.amount===10));
});
test('rose heal works at full MP, scales after DEF/RES buffs, and never revives or triggers from dead source',()=>{
 const b=fixture(['victorina','arthur','iris','elaine']);const v=a(b,'victorina'),t=a(b,'arthur');v.stats.defense=40;v.stats.resistance=40;use(b,'victorina','victorina.petals');t.hp-=50;t.mp=t.stats.maxMp;hit(b,'arthur',.6);assert.ok(b.events.some(e=>e.type==='heal'&&e.amount===14));
 b.round++;t.hp=1;t.shield=1;hit(b,'arthur',10);assert.equal(t.hp,0);assert.ok(!b.events.some(e=>e.type==='heal'));
 const c=fixture(['victorina','arthur','iris','elaine']);use(c,'victorina','victorina.petals');a(c,'victorina').hp=0;a(c,'arthur').hp-=30;hit(c,'arthur');assert.ok(!c.events.some(e=>e.type==='heal'||e.type==='mp_restore'));
});
test('full HP and MP do not consume rose quota; no exclusive preserves original MP-only behavior',()=>{
 const b=fixture(['victorina','arthur','iris','elaine']);use(b,'victorina','victorina.petals');const t=a(b,'arthur');t.shield=40;t.mp=t.stats.maxMp;hit(b,'arthur');assert.equal(t.procRounds?.['shield_mp:victorina'],undefined);t.shield=35;t.hp-=20;hit(b,'arthur');assert.ok(b.events.some(e=>e.type==='heal'));
 const c=fixture(['victorina','arthur','iris','elaine'],false);use(c,'victorina','victorina.petals');a(c,'arthur').hp-=50;a(c,'arthur').mp=0;hit(c,'arthur');assert.equal(a(c,'arthur').mp,6);assert.ok(!c.events.some(e=>e.type==='heal'));
});
test('Sieg aura gives shielded allies 8%, no own shield required; self is never doubled and KO removes aura',()=>{
 const b=fixture(['sieg','arthur','iris','elaine']);const source=a(b,'sieg'),arthur=a(b,'arthur');for(const t of [source,arthur]){t.stats.attack=100;delete t.baseStats;}
 source.shield=0;arthur.shield=1;use(b,'arthur','$attack','enemy_0');assert.equal(damage(b)[0].amount,108);arthur.shield=0;use(b,'arthur','$attack','enemy_0');assert.equal(damage(b)[0].amount,100);source.shield=1;use(b,'sieg','$attack','enemy_0');assert.equal(damage(b)[0].amount,108);arthur.shield=1;source.hp=0;use(b,'arthur','$attack','enemy_0');assert.equal(damage(b)[0].amount,100);
});
test('unarmed Sieg passive still helps only Sieg; aura applies to magic damage too when shielded',()=>{
 const b=fixture(['sieg','arthur','iris','elaine'],false);a(b,'arthur').stats.attack=100;a(b,'arthur').shield=1;use(b,'arthur','$attack','enemy_0');assert.equal(damage(b)[0].amount,100);
 const c=fixture(['sieg','monica','iris','elaine']);a(c,'monica').stats.magic=100;a(c,'monica').shield=1;a(c,'monica').passive=null;use(c,'monica','$attack','enemy_0');assert.equal(damage(c)[0].amount,64);assert.equal(damage(c)[1].amount,64);
});
test('Rauth telegraphs for an action, then spends MP once and lands only one AoE at next main turn',()=>{
 const c=bossSave('victorina'),b=createBattle(content,c,'victorina_story_3',()=>.99),boss=a(b,'enemy_0');boss.aiRotationStep=3;b.queue=['enemy_0','arthur'];b.cursor=0;const count=b.actionCount;executeEnemyTurn(b);assert.equal(boss.mp,100);assert.equal(boss.preparedMove.readyRound,b.round+1);assert.equal(b.actionCount,count+1);assert.equal(damage(b).length,0);assert.ok(b.events.some(e=>e.type==='enemy_windup'));
 for(const ally of b.actors.filter(t=>t.team==='party'))ally.shield=100;b.round++;b.queue=['enemy_0','arthur'];b.cursor=0;executeEnemyTurn(b);assert.equal(boss.mp,84);assert.equal(boss.preparedMove,undefined);assert.equal(damage(b).length,4);assert.ok(damage(b).every(e=>e.amount===0&&e.absorbed>0));assert.equal(boss.cooldowns['rauth.crush'],4);
});
test('prepared move waits through extra phase; MP loss before release falls back safely to free attack',()=>{
 const b=createBattle(content,bossSave('victorina'),'victorina_story_3',()=>.99),boss=a(b,'enemy_0');boss.aiRotationStep=3;b.queue=['enemy_0','arthur'];b.cursor=0;executeEnemyTurn(b);b.phase='extra';b.queue=['enemy_0','arthur'];b.cursor=0;executeEnemyTurn(b);assert.ok(boss.preparedMove);b.phase='main';b.round++;boss.mp=0;b.queue=['enemy_0','arthur'];b.cursor=0;executeEnemyTurn(b);assert.equal(boss.preparedMove,undefined);assert.equal(damage(b).length,1);assert.equal(boss.mp,0);
});
test('three bosses keep exact stats and are single-phase ordinary enemies; Prototype really uses pure slow',()=>{
 for(const [id,stats,weak]of[['rauth',[1050,100,39,21,28,23,16],['fire']],['prototype07',[920,140,16,35,22,27,29],['wind','earth']],['dry_river_guardian',[1100,100,38,20,32,22,9],['water','thunder']]]){assert.deepEqual(Object.values(content.enemies[id].stats),stats);assert.deepEqual(content.enemies[id].weaknesses,weak);assert.equal(content.enemies[id].boss,undefined);}
 const b=createBattle(content,bossSave('monica'),'monica_story_3',()=>.99);a(b,'enemy_0').aiRotationStep=2;b.queue=['enemy_0','arthur'];b.cursor=0;executeEnemyTurn(b);assert.equal(damage(b).length,0);assert.ok(b.actors.some(t=>t.statuses.some(s=>s.id==='prototype_offbeat'&&s.remaining===2)));assert.equal(a(b,'enemy_0').mp,130);
});
test('river rubble does two 65% physical hits and every boss can fall back at zero MP',()=>{
 const b=createBattle(content,bossSave('sieg'),'sieg_story_3',()=>.99);a(b,'enemy_0').aiRotationStep=2;b.queue=['enemy_0','arthur'];b.cursor=0;executeEnemyTurn(b);assert.equal(damage(b).length,2);assert.ok(damage(b).every(e=>e.damageType==='physical'));for(const owner of owners){const x=createBattle(content,bossSave(owner),owner+'_story_3',()=>.99);a(x,'enemy_0').mp=0;a(x,'enemy_0').aiRotationStep=1;x.queue=['enemy_0','arthur'];x.cursor=0;executeEnemyTurn(x);assert.equal(damage(x).length,1);assert.equal(a(x,'enemy_0').mp,0);}
});
test('stories enforce intro and order without character ownership, have exact waves, and cannot leak into quests or dungeons',()=>{
 for(const owner of owners){const fresh=createGameSave(content);for(const id of content.travelerStories[owner].chapters)assert.throws(()=>createBattle(content,fresh,id));const c=intro();assert.ok(!c.unlockedCharacterIds.includes(owner));assert.ok(createBattle(content,c,owner+'_story_1'));assert.equal(isQuestUnlocked(content.encounters[owner+'_story_2'],c),false);assert.equal(content.encounters[owner+'_story_2'].waves.length,3);assert.equal(content.encounters[owner+'_story_3'].rewardTier,'boss');assert.ok(questCatalog(content,c).every(e=>e.travelerStory!==owner));assert.ok(dungeonQuestPool(content).every(id=>content.encounters[id].travelerStory!==owner));}
 assert.deepEqual(content.encounters.victorina_story_2.waves,[['wolf','wolf','wolf_leader'],['goblin','goblin','goblin_shaman'],['goblin_warrior','goblin_warrior','goblin_shaman']]);assert.deepEqual(content.encounters.sieg_story_2.waves[2],['wild_boar','wild_boar','ember_wisp','ember_wisp']);
});
test('three story rewards and chapter-II recipes commit without owners; replay does not duplicate currencies or recipes',()=>{
 for(const owner of owners){let c=intro();const before={coin:c.coins,pure:c.recruitmentShards,original:c.originalPrisma};c=win(c,owner+'_story_1');const run=createStoryRun(content,c,owner+'_story_2',()=>.99);for(let i=0;i<2;i++){run.battle.outcome='victory';assert.equal(claimBattleReward(c,run.battle,content),c);advanceStoryWave(content,run);}run.battle.outcome='victory';c=claimBattleReward(c,run.battle,content);assert.equal(exclusiveCraftUnlocked(c,content.exclusiveGear[ids[owner]]),true);assert.ok(!c.unlockedCharacterIds.includes(owner));c=win(c,owner+'_story_3');assert.equal(c.coins,before.coin+1250);assert.equal(c.recruitmentShards,before.pure+15);assert.equal(c.originalPrisma,before.original+1);assert.deepEqual(decodeGameSave(encodeGameSave(c,content),content),c);const replay=win(c,owner+'_story_3');assert.equal(replay.recruitmentShards,c.recruitmentShards);assert.equal(replay.originalPrisma,c.originalPrisma);assert.equal(replay.coins,c.coins+150);}
});
test('new exclusive formulas gate crafting at chapter II, preserve standard cost and round-trip with bundle definitions',()=>{
 for(const owner of owners){let c=intro();Object.assign(c,{coins:100000,prismaFragments:10000,recruitmentShards:100,originalPrisma:10});assert.throws(()=>craftExclusive(c,content,ids[owner]),/chương/);c=win(win(c,owner+'_story_1'),owner+'_story_2');assert.throws(()=>craftExclusive(c,content,ids[owner]),/sở hữu/);c.unlockedCharacterIds.push(owner);const before=c.coins;c=craftExclusive(c,content,ids[owner],()=>.5);assert.equal(c.coins,before-10000);assert.deepEqual(decodeGameSave(encodeGameSave(c,content),content),c);}
});
test('Arthur signature plan is one target cleave or one formation sweep, retaining all damage feedback',()=>{
 for(const [id,tag,area,n]of [['arthur.ogres_bane_mastered','hero_mastered',false,1],['arthur.ogres_bane_flash','hero_flash',true,3]]){const b=fixture(['arthur','iris','elaine','garrek']);a(b,'arthur').resourceValues.resonance=3;use(b,'arthur',id,'enemy_0');const events=structuredClone(b.events),plan=combatTimeline(events,content);assert.equal(plan.frames.filter(f=>f.kind==='signature').length,1);assert.equal(plan.frames.find(f=>f.kind==='signature').presentation,tag);assert.equal(plan.frames.find(f=>f.kind==='signature').area,area);assert.equal(plan.frames.filter(f=>f.kind==='hurt').length,n);assert.equal(plan.frames.filter(f=>f.kind==='formation').length,0);assert.deepEqual(b.events,events);assert.equal(a(b,'arthur').resourceValues.resonance,0);assert.equal(a(b,'arthur').mp,990);const reduced=combatTimeline(events,content,{reduced:true});assert.ok(reduced.frames.every(f=>f.at===0));assert.ok(reduced.duration<=120);}
});
test('compound schema validates children; invalid field bonuses and rotations are rejected',()=>{
 for(const change of [c=>c.exclusiveGear['monica.silver_watch'].passive.effects[0].extraRounds=0,c=>c.exclusiveGear['monica.silver_watch'].passive.effects[1].modifiers.magic=3,c=>c.exclusiveGear['chelsea.compass'].passive.effects.push(c.exclusiveGear['chelsea.compass'].passive),c=>c.exclusiveGear['victorina.rose_shield'].passive.multiplier=-1,c=>c.enemies.rauth.ai.rotation=['missing'],c=>c.abilities['rauth.crush'].windup.rounds=0]){const c=structuredClone(content);change(c);assert.ok(validateContent(c).length);}
 assert.equal(validateExclusivePassive({type:'bundle',name:'test',description:'test',effects:[]},content),false);
});


test('compound exclusives preserve existing after-action status and resource hooks',()=>{
 const b=fixture(['arthur','iris','elaine','garrek']);const actor=a(b,'arthur');actor.exclusiveGear={template:{passive:{type:'bundle',effects:[{type:'after_skill_status',abilityIds:['arthur.light_slash'],statusId:'guard',duration:1,to:'self'},{type:'skill_resource_bonus',abilityIds:['arthur.light_slash'],resource:'resonance',amount:1}]}}};use(b,'arthur','arthur.light_slash','enemy_0');assert.equal(actor.resourceValues.resonance,2);assert.ok(actor.statuses.some(s=>s.id==='guard'));
});
