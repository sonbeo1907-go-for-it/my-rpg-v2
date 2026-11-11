import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,activeActor,executeAction,executeEnemyTurn,forecastBattleAction} from '../src/core/battle.js';
import {claimBattleReward} from '../src/core/economy.js';
import {trialSelection,trialPureReward,trialDailyState,normalizeTrialLedger,trialRewardPreview,trialRule} from '../src/core/unrecorded-trials.js';
import {questCatalog,encounterReturnPath} from '../src/core/quest-catalog.js';
import {validateContent} from '../src/core/content.js';
import {levelScaledEnemyStats} from '../src/core/enemy-scaling.js';
import {orderActorIds} from '../src/core/turn-order.js';
import {validateFarmTarget} from '../src/core/farm-session.js';
const content=await loadContent(),campaign=()=>createGameSave(content);
function fixture(id='song_chimera',conditions={},level=60){const save=campaign(),b=createBattle(content,save,id,()=>.99,{enemyLevel:level,trial:{level,conditions}});return {b,save,enemies:b.actors.filter(a=>a.team==='enemy'),party:b.actors.filter(a=>a.team==='party')};}
function harmless(b){for(const a of b.actors){a.hp=a.stats.maxHp=1000000;a.mp=a.stats.maxMp=10000;a.stats.attack=20;a.stats.magic=20;delete a.baseStats;}}
function step(b){const a=activeActor(b);assert.ok(a);if(a.team==='enemy')executeEnemyTurn(b);else executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});}
function toRound(b,n){let guard=0;while(b.round<n&&!b.outcome&&guard++<1500)step(b);assert.equal(b.round,n);assert.ok(guard<1500);}
function kill(b,target){const a=b.actors.find(a=>a.team==='party');target.hp=1;target.shield=0;a.stats.attack=500;delete a.baseStats;b.queue=[a.id,...b.actors.filter(x=>x.id!==a.id&&x.hp>0).map(x=>x.id)];b.cursor=0;executeAction(b,{actorId:a.id,abilityId:'$attack',targetId:target.id});}
test('three trials validate, use three provided BGM files, no old super unlock gate or ordinary quest leak',()=>{
 assert.deepEqual(validateContent(content),[]);const save=campaign(),trials=questCatalog(content,save,{tab:'trial'});
 assert.deepEqual(trials.map(e=>e.id),['song_chimera','song_ego','song_calamity']);
 for(const e of trials){assert.equal(e.rewardTier,'super');assert.equal(e.referenceLevel,1);assert.equal(content.music[e.bgm].tracks[0],'/bgm/bgm_sp_'+e.id+'.mp3');assert.ok(e.enemies.every(id=>content.enemies[id].controlImmunities.includes('stun')));assert.throws(()=>validateFarmTarget(content,{kind:'quest',id:e.id}));}
 for(const tab of ['sinister','extermination','bounty','east'])assert.ok(!questCatalog(content,save,{tab}).some(e=>e.trialId));
});
test('mutually exclusive tiers score up to 33; 22 points fill the 30 Pure daily allowance',()=>{
 const conditions=Object.fromEntries(content.trials.chimera.conditions.map(c=>[c.id,3]));const s=trialSelection(content,'song_chimera',{level:90,conditions});
 assert.equal(s.score,33);assert.equal(s.maxScore,33);assert.equal(trialPureReward(Math.ceil(s.maxScore*2/3)),30);
 assert.deepEqual([7,8,12,16,19,22,33].map(trialPureReward),[0,6,12,20,25,30,30]);
 for(const input of [{level:65},{level:60,conditions:{vital:4}},{conditions:{not_real:1}},{conditions:{vital:1.5}},{conditions:[]},{points:99}])assert.throws(()=>trialSelection(content,'song_chimera',input));
 assert.throws(()=>createBattle(content,campaign(),'song_chimera',()=>.99,{enemyLevel:90,trial:{level:60}}));
});
test('level-scaled stats change only for this battle, party prepared bases and HP/MP match preview',()=>{
 const save=campaign(),snapshot=JSON.stringify(content.enemies.song_dragon),normal=fixture().b,scaled=fixture('song_chimera',{vital:3,fury:2,frail:1,weary:2,wound:3},80).b;
 const enemy=scaled.actors.find(a=>a.definitionId==='song_dragon'),base=levelScaledEnemyStats(content.enemies.song_dragon,80,content,1,content.encounters.song_chimera);
 assert.equal(enemy.stats.maxHp,Math.round(base.maxHp*1.5));assert.equal(enemy.stats.attack,Math.round(base.attack*1.2));
 const a=scaled.actors.find(a=>a.id==='arthur'),old=normal.actors.find(a=>a.id==='arthur');assert.equal(a.hp,Math.round(old.hp*.9));assert.equal(a.mp,Math.round(old.mp*.9));assert.equal(a.stats.attack,Math.round(old.stats.attack*.8));assert.ok(a.statuses.some(s=>s.id==='deep_wound'&&s.remaining===6));
 assert.equal(JSON.stringify(content.enemies.song_dragon),snapshot);assert.equal(save.characters.arthur.level,1);
 assert.ok(Object.isFrozen(scaled.trial.selection));assert.ok(Object.isFrozen(scaled.trial.selection.conditions));
});
test('Chimera window includes first KO round and revives only fallen heads at 50% at round-three end',()=>{
 const {b,enemies}=fixture();harmless(b);kill(b,enemies[0]);assert.equal(b.trial.deadline,3);const max=enemies[0].stats.maxHp;
 toRound(b,3);assert.equal(enemies[0].hp,0);assert.equal(b.trial.deadline,3);
 toRound(b,4);assert.equal(enemies[0].hp,Math.round(max*.5));assert.equal(b.trial.deadline,null);assert.equal(b.outcome,null);assert.equal(enemies[1].hp,enemies[1].stats.maxHp);
 kill(b,enemies[1]);assert.equal(b.trial.deadline,6); // A new KO starts a fresh window.
});
test('second KO does not refresh deadline; condition changes revive ratio without changing the window',()=>{
 const {b,enemies}=fixture('song_chimera',{revive:3});harmless(b);kill(b,enemies[0]);toRound(b,2);kill(b,enemies[1]);assert.equal(b.trial.deadline,3);
 enemies[0].statuses=[{id:'deep_wound',remaining:2,stacks:1,sourceId:'arthur'}];
 toRound(b,4);for(const a of enemies.slice(0,2)){assert.equal(a.hp,a.stats.maxHp);assert.deepEqual(a.statuses,[]);}
});
test('all three heads defeated before the deadline wins immediately and does not revive them',()=>{
 const {b,enemies}=fixture();harmless(b);kill(b,enemies[0]);toRound(b,3);kill(b,enemies[1]);kill(b,enemies[2]);assert.equal(b.outcome,'victory');assert.ok(enemies.every(a=>a.hp===0));
});
test('Extra Turn phase does not tick the linked-head deadline as a new round',()=>{
 const {b,enemies,party}=fixture();harmless(b);kill(b,enemies[0]);b.extraPhaseRequired=true;b.extraTurnGrants.add(party[0].id);
 let guard=0;while(b.phase!=='extra'&&guard++<30)step(b);assert.equal(b.round,1);assert.equal(b.phase,'extra');assert.equal(b.trial.deadline,3);step(b);assert.equal(b.round,2);assert.equal(enemies[0].hp,0);
});
test('Ego adapts at end of round five using damage history; always leaves an opening and never mutates templates',()=>{
 const {b,enemies,party}=fixture('song_ego');harmless(b);const original=JSON.stringify(content.enemies.song_ego),a=party[0];
 b.queue=[a.id,...b.actors.filter(x=>x.id!==a.id).map(x=>x.id)];b.cursor=0;executeAction(b,{actorId:a.id,abilityId:'$attack',targetId:enemies[0].id});
 assert.ok(b.trial.damageByElement.light>0);toRound(b,5);assert.equal(b.trial.adaptedAt,0);toRound(b,6);assert.equal(b.trial.adaptedAt,5);assert.equal(enemies[0].resistances.light,.7);assert.ok(!Object.keys(enemies[0].resistances).includes(enemies[0].weaknesses[0]));
 assert.equal(JSON.stringify(content.enemies.song_ego),original);toRound(b,10);assert.equal(b.trial.adaptedAt,5);toRound(b,11);assert.equal(b.trial.adaptedAt,10);
});
test('Ego-specific tiers change adaptation interval, resistance and grant a fresh shield',()=>{
 const {b,enemies}=fixture('song_ego',{adapt:3,resist:3,carapace:2});harmless(b);toRound(b,3);assert.equal(b.trial.adaptedAt,2);assert.ok(Object.values(enemies[0].resistances).every(n=>n===.3));assert.ok(enemies[0].shield>0);assert.ok(enemies[0].shield<=enemies[0].stats.maxHp*.1);
});
test('Calamity moves only unspent turns; history/current are stable and Extra grants are not duplicated',()=>{
 const {b,enemies,party}=fixture('song_calamity');harmless(b);const boss=enemies[0];b.queue=[party[0].id,boss.id,party[1].id,party[2].id,party[3].id];b.mainTurnOrder=[...b.queue];b.cursor=1;b.extraTurnGrants.add(party[0].id);
 executeEnemyTurn(b);assert.deepEqual(b.queue,[party[0].id,boss.id,party[3].id,party[2].id,party[1].id]);assert.equal(activeActor(b).id,party[3].id);assert.deepEqual([...b.extraTurnGrants],[party[0].id]);assert.equal(new Set(b.queue).size,5);
});
test('Calamity round boundary schedules low-SPD-first round, expires on following round, enemy echo/drain use engine',()=>{
 const {b,party}=fixture('song_calamity',{clock:1,echo:2,drain:3});harmless(b);party.forEach((a,i)=>a.stats.speed=10+i);toRound(b,4);
 assert.equal(b.trial.reverseRound,4);assert.deepEqual(orderActorIds(b,party.map(a=>a.id)),party.map(a=>a.id));assert.ok(party.every(a=>a.mp<10000));assert.ok(party.some(a=>a.hp<1000000));
 toRound(b,5);assert.notEqual(b.trial.reverseRound,b.round);assert.deepEqual(orderActorIds(b,party.map(a=>a.id)),party.map(a=>a.id).reverse());
});
test('forecast cannot mutate trial resource/timer/adaptation state or grant rewards',()=>{
 const {b,party,enemies}=fixture('song_chimera');harmless(b);enemies[0].hp=1;party[0].stats.attack=500;b.queue=[party[0].id,...b.actors.filter(a=>a.id!==party[0].id).map(a=>a.id)];b.cursor=0;
 const before=JSON.stringify(b.trial),trial=forecastBattleAction(b,{actorId:party[0].id,abilityId:'$attack',targetId:enemies[0].id});assert.equal(JSON.stringify(b.trial),before);assert.equal(enemies[0].hp,1);assert.equal(trial.trial.deadline,3);
});
test('settlement pays full 30 at 22+ points, is idempotent, shared cap and best scores survive save round trip',()=>{
 let save=campaign();const now=new Date('2026-11-11T16:59:59Z'),selection={level:90,conditions:Object.fromEntries(content.trials.chimera.conditions.slice(0,6).map(c=>[c.id,3]))};
 const b=createBattle(content,save,'song_chimera',()=>.99,{enemyLevel:90,trial:selection});b.outcome='victory';const replay={...b};
 save=claimBattleReward(save,b,content,()=>{},now);assert.equal(save.recruitmentShards,30);assert.equal(save.coins,1000);assert.equal(save.unrecordedLedger.earned,30);assert.equal(save.unrecordedLedger.best.song_chimera,24);assert.equal(save.victories,1);
 assert.equal(claimBattleReward(save,b,content,()=>{},now),save);assert.equal(claimBattleReward(save,replay,content,()=>{},now),save);
 save=decodeGameSave(encodeGameSave(save,content),content);assert.equal(save.unrecordedLedger.earned,30);
 const second=createBattle(content,save,'song_ego',()=>.99,{enemyLevel:60});second.outcome='victory';save=claimBattleReward(save,second,content,()=>{},now);assert.equal(save.recruitmentShards,30);assert.equal(save.coins,2000);assert.equal(save.unrecordedLedger.lastSerial,2);
 assert.ok(!save.chronicles.aliceDifficultyClears.includes(90));
});
test('remaining daily allowance clamps reward, VN midnight resets, clock rollback does not refill',()=>{
 const save=campaign();save.unrecordedLedger={day:'2026-11-11',earned:27,lastSerial:2,best:{}};
 const selection=trialSelection(content,'song_ego',{level:90,conditions:{vital:3,fury:3,armor:3,frail:3,weary:3,wound:3}});
 assert.equal(trialRewardPreview(save,selection,new Date('2026-11-11T16:59:59Z')).recruitmentShards,3);
 assert.equal(trialDailyState(save,new Date('2026-11-11T17:00:00Z')).remaining,30);assert.equal(trialDailyState(save,new Date('2026-11-10T10:00:00Z')).remaining,3);
});
test('failed persistence grants nothing, retry succeeds; defeat/draw give neither currency nor daily progress',()=>{
 const {b,save}=fixture('song_ego',{vital:3,fury:3,armor:3},90),before=JSON.stringify(save);b.outcome='victory';assert.throws(()=>claimBattleReward(save,b,content,()=>{throw Error('disk failure');}));assert.equal(b.rewardClaimed,undefined);assert.equal(JSON.stringify(save),before);
 const next=claimBattleReward(save,b,content);assert.ok(next.recruitmentShards>0);assert.equal(b.rewardClaimed,true);
 for(const outcome of ['defeat','draw']){const f=fixture();f.b.outcome=outcome;assert.equal(claimBattleReward(f.save,f.b,content),f.save);assert.equal(f.save.unrecordedLedger.earned,0);}
});
test('missing ledger migrates; corrupt daily counts, dates, serials, best scores and conditions are rejected',()=>{
 const save=campaign();delete save.unrecordedLedger;assert.deepEqual(decodeGameSave(encodeGameSave(save,content),content).unrecordedLedger,normalizeTrialLedger());
 for(const change of [{earned:31},{day:'2026-02-31'},{lastSerial:-1},{best:{song_ego:99}}])assert.throws(()=>normalizeTrialLedger({...normalizeTrialLedger(),...change}));
 const c=structuredClone(content);c.trials.ego.conditions[0].tiers[0].stats.maxHp=-1;assert.ok(validateContent(c).some(e=>e.includes('invalid stat')));
});
test('return URL retains selected conditions and level, with no automatic replay of the contract',()=>{
 const path=encounterReturnPath(content,'song_ego',null,80,{level:80,conditions:{adapt:2,vital:1}});assert.equal(path,'/chronicles/unrecorded/ego?level=80&adapt=2&vital=1');
});

test('the three trial superbosses qualify for authored boss-hunter modes even without scripted phases',()=>{
 const save=campaign();save.party=['chen','iris','elaine','garrek'];save.unlockedCharacterIds.push('chen');
 for(const id of ['song_chimera','song_ego','song_calamity']){const b=createBattle(content,save,id,()=>.99);assert.ok(b.actors.find(a=>a.id==='chen').activeMode);}
});

test('Chimera death from start-turn poison opens the same three-round window even when that turn is skipped',()=>{
 const {b,enemies}=fixture();harmless(b);const a=b.actors.find(a=>a.id==='arthur');enemies[0].hp=1;enemies[0].statuses=[{id:'kai_poison',remaining:2,stacks:1,potency:10,sourceId:a.id}];b.queue=[a.id,enemies[0].id,...b.actors.filter(x=>x.id!==a.id&&x.id!==enemies[0].id).map(x=>x.id)];b.cursor=0;
 executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});assert.equal(enemies[0].hp,0);assert.equal(b.trial.deadline,3);assert.notEqual(activeActor(b).id,enemies[0].id);
});
test('trial end-round MP loss uses the current Max MP capacity, including allied capacity buffs',()=>{
 const {b,party}=fixture('song_calamity',{drain:3});harmless(b);const a=party[0];a.stats.maxMp=100;a.mp=100;a.statuses=[{id:'artesia_capacity',remaining:3,stacks:1,sourceId:'iris',appliedModifiers:{maxMp:.4}}];
 // Use a real available capacity status ID rather than assuming character-specific authoring names.
 const template=Object.values(content.statuses).find(s=>s.kind==='buff'&&s.modifiers?.maxMp>0);assert.ok(template);a.statuses[0].id=template.id;
 // Finish with an enemy as current so Arthur cannot Defend/refill immediately at the boundary.
 const boss=b.actors.find(x=>x.team==='enemy');b.queue=[boss.id];b.cursor=0;executeEnemyTurn(b);assert.ok(a.mp<=92); // ceil(140*.06)=9, not ceil(100*.06)=6.
});
