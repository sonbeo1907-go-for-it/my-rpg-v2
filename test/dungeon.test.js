import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../scripts/load-content.mjs';
import { createCampaign } from '../src/core/progression.js';
import { createGameSave,encodeGameSave,decodeGameSave } from '../src/core/game-save.js';
import { createDungeonRun,advanceDungeonWave,claimDungeonReward,isFinalDungeonWave,dungeonQuestPool } from '../src/core/dungeon.js';
import { dungeonDay,nextDungeonReset,dungeonDailyState } from '../src/core/dungeon-rules.js';
import { getActor,activeActor,basicAbility,targetsFor,executeAction,executeEnemyTurn } from '../src/core/battle.js';
import { claimBattleReward } from '../src/core/economy.js';
import { statusDetails } from '../src/ui/combat-presentation.js';
import { seededRandom } from '../src/core/random.js';
const content=await loadContent();
const now=new Date('2026-10-29T05:00:00Z');
const run=(save=createGameSave(content),difficulty='easy')=>createDungeonRun(content,save,'gold_mine',difficulty,{now,random:()=>0});
function clearWave(current) { current.battle.actors.filter(actor=>actor.team==='enemy').forEach(actor=>actor.hp=0);current.battle.outcome='victory'; }
function finish(current) { while(true){clearWave(current);if(isFinalDungeonWave(current))return;advanceDungeonWave(content,current);} }

test('all gold difficulties apply their HP, MP, ATK and MAG scales on every wave without mutating source or party',()=>{
  const original=JSON.stringify(content),save=createGameSave(content);
  for(const [id,waves,hp,mp,power] of [['easy',3,1.1,1.5,1],['medium',4,1.75,2.25,1.25],['hard',4,1.9,2.25,1.6]]){
    const current=run(save,id);assert.equal(current.waveIds.length,waves);assert.equal(new Set(current.waveIds).size,waves);
    assert.ok(current.waveIds.every(id=>dungeonQuestPool(content).includes(id)));
    for(let wave=0;wave<waves;wave++){
      for(const actor of current.battle.actors.filter(actor=>actor.team==='enemy')){
        const base=content.enemies[actor.definitionId];
        assert.equal(actor.stats.maxHp,Math.round(base.stats.maxHp*hp));assert.equal(actor.hp,actor.stats.maxHp);
        assert.equal(actor.stats.maxMp,Math.round(base.stats.maxMp*mp));assert.equal(actor.mp,actor.stats.maxMp);
        for(const key of ['attack','magic'])assert.equal(actor.stats[key],Math.round(base.stats[key]*power));
        for(const key of ['defense','resistance','speed'])assert.equal(actor.stats[key],base.stats[key]);
      }
      assert.equal(getActor(current.battle,'arthur').stats.maxHp,190);
      if(wave<waves-1){clearWave(current);advanceDungeonWave(content,current);}
    }
  }
  assert.equal(JSON.stringify(content),original);assert.equal(save.coins,0);
});

test('wave transition retains party snapshots, fallen members, shields, resources and status charges; cooldowns advance one round',()=>{
  const save=createGameSave(content),current=run(save);const previous=current.battle;
  const garrek=getActor(previous,'garrek'),arthur=getActor(previous,'arthur');
  garrek.hp=83;garrek.mp=12;garrek.shield=17;garrek.shieldSourceId='elaine';garrek.cooldowns['garrek.resolve']=2;
  garrek.statuses=[{id:'shaken',remaining:2,sourceId:previous.actors.find(actor=>actor.team==='enemy').id,stacks:1},{id:'effect_ward',remaining:null,sourceId:'garrek',stacks:1,charges:1}];
  arthur.hp=0;arthur.resourceValues.resonance=3;
  const snapshot=structuredClone(garrek);clearWave(current);const before=JSON.stringify(previous.actors);
  save.party=['fiona'];save.characters.arthur.upgradeIds.push('arthur.control_training');
  const next=advanceDungeonWave(content,current);
  assert.equal(JSON.stringify(previous.actors),before);assert.equal(next.round,previous.round+1);
  const carried=getActor(next,'garrek');assert.equal(carried.hp,snapshot.hp);assert.equal(carried.mp,snapshot.mp);assert.equal(carried.shield,17);assert.equal(carried.shieldSourceId,'elaine');
  assert.deepEqual(carried.statuses,snapshot.statuses);assert.equal(carried.cooldowns['garrek.resolve'],1);
  assert.equal(getActor(next,'arthur').hp,0);assert.equal(getActor(next,'arthur').resourceValues.resonance,3);assert.equal(next.actors.some(actor=>actor.id==='fiona'),false);
});

test('carried poison ticks once at the next real turn and keeps its original source instead of binding to a new enemy',()=>{
  const current=run(),previous=current.battle,source=previous.actors.find(actor=>actor.team==='enemy');
  const iris=getActor(previous,'iris');iris.hp=100;iris.statuses=[{id:'kai_poison',remaining:2,sourceId:source.id,stacks:1,potency:9}];
  clearWave(current);const next=advanceDungeonWave(content,current);
  assert.equal(getActor(next,'iris').hp,91);assert.equal(getActor(next,'iris').statuses[0].remaining,1);
  assert.equal(next.events.filter(event=>event.periodic).length,1);
  assert.equal(next.actors.some(actor=>actor.id===source.id),false);
  assert.equal(getActor(next,source.id).name,source.name);
  assert.equal(statusDetails(getActor(next,'iris').statuses[0],getActor(next,'iris'),next,content).source,source.name);
});

test('intermediate waves never grant 50 Coin or first-clear unlocks; a completed chain grants exactly its reward once',()=>{
  for(const [difficulty,coins] of [['easy',1000],['medium',2000],['hard',3000]]){
    const save=createGameSave(content),current=run(save,difficulty);clearWave(current);
    assert.equal(claimBattleReward(save,current.battle,content),save);assert.equal(claimDungeonReward(save,current,content,()=>{},now),save);
    finish(current);const granted=claimDungeonReward(save,current,content,()=>{},now);
    assert.equal(granted.coins,coins);assert.equal(granted.victories,1);assert.equal(granted.dungeonDaily.clears.gold_mine,1);
    assert.deepEqual(granted.claimedFirstClearRewards,[]);assert.equal(granted.unlockedCharacterIds.includes('kai'),false);
    assert.equal(granted.extraGearSlots.arthur,undefined);assert.equal(claimDungeonReward(granted,current,content,()=>{},now),granted);
  }
});

test('daily limit is shared across difficulties; failed saves leave reward/quota retryable and no partial grants',()=>{
  let save=createGameSave(content);
  for(const difficulty of ['easy','medium','hard']){const current=run(save,difficulty);finish(current);const before=JSON.stringify(save);
    assert.throws(()=>claimDungeonReward(save,current,content,()=>{throw new Error('quota');},now),/quota/);assert.equal(JSON.stringify(save),before);assert.equal(current.claimed,false);assert.equal(current.battle.rewardClaimed,undefined);
    save=claimDungeonReward(save,current,content,()=>{},now);
  }
  assert.equal(save.coins,6000);assert.equal(dungeonDailyState(save,content,'gold_mine',now).remaining,0);
  assert.throws(()=>run(save),/hết lượt/);assert.throws(()=>run(save,'medium'),/hết lượt/);assert.throws(()=>run(save,'hard'),/hết lượt/);
  assert.equal(dungeonDailyState(save,content,'dangerous',now).remaining,1);
});

test('Vietnam midnight resets quotas, rollback does not, and a chain is charged on the day its reward is claimed',()=>{
  const before=new Date('2026-10-29T16:59:59Z'),after=new Date('2026-10-29T17:00:00Z');
  assert.equal(dungeonDay(before),'2026-10-29');assert.equal(dungeonDay(after),'2026-10-30');assert.equal(nextDungeonReset(before).toISOString(),'2026-10-29T17:00:00.000Z');
  const save=createGameSave(content);save.dungeonDaily={day:'2026-10-29',clears:{gold_mine:3}};
  assert.equal(dungeonDailyState(save,content,'gold_mine',before).remaining,0);assert.equal(dungeonDailyState(save,content,'gold_mine',after).remaining,3);
  assert.equal(dungeonDailyState(save,content,'gold_mine',new Date('2026-10-28T12:00:00Z')).remaining,0);
  save.dungeonDaily.clears.gold_mine=2;const current=run(save);finish(current);const granted=claimDungeonReward(save,current,content,()=>{},after);
  assert.deepEqual(granted.dungeonDaily,{day:'2026-10-30',clears:{gold_mine:1}});
});

test('daily ledger round-trips through export/import, old saves initialize it and corrupt ledgers fail validation',()=>{
  const save=createGameSave(content);save.dungeonDaily={day:'2026-10-29',clears:{gold_mine:2}};
  assert.deepEqual(decodeGameSave(encodeGameSave(save,content),content),save);
  const old=JSON.parse(encodeGameSave(save,content));delete old.dungeonDaily;
  assert.deepEqual(decodeGameSave(JSON.stringify(old),content).dungeonDaily,{day:null,clears:{}});
  for(const ledger of [null,{day:'2026-02-30',clears:{}},{day:null,clears:{gold_mine:1}},{day:'2026-10-29',clears:{gold_mine:4}},{day:'2026-10-29',clears:{unknown:1}},{day:'2026-10-29',clears:{gold_mine:-1}}]){
    assert.throws(()=>decodeGameSave(JSON.stringify({...old,dungeonDaily:ledger}),content));
  }
});

test('closed difficulties, defeat and draw cannot advance or grant dungeon rewards',()=>{
  const save=createGameSave(content);
  for(const [id,difficulty] of [['dangerous','unknown'],['illusion','easy']])assert.throws(()=>createDungeonRun(content,save,id,difficulty,{now}));
  for(const outcome of ['defeat','draw']){const current=run(save);current.battle.outcome=outcome;assert.throws(()=>advanceDungeonWave(content,current));assert.equal(claimDungeonReward(save,current,content,()=>{},now),save);}
});

test('all gold difficulties run real enemy AI through bounded wave outcomes with finite carry-over state',()=>{
  for(const difficulty of ['easy','medium','hard'])for(const seed of [1,42,20261029]){
    const save=createCampaign(content),current=createDungeonRun(content,save,'gold_mine',difficulty,{now,random:seededRandom(seed)});
    let actions=0;
    while(actions++<4000){const battle=current.battle;
      if(battle.outcome){if(battle.outcome==='victory'&&!isFinalDungeonWave(current)){advanceDungeonWave(content,current);continue;}break;}
      const actor=activeActor(battle);
      if(actor.team==='enemy')executeEnemyTurn(battle);else{const skill=basicAbility(actor);executeAction(battle,{actorId:actor.id,abilityId:skill.id,targetId:targetsFor(battle,actor,skill)[0]?.id});}
      for(const member of battle.actors)assert.ok(Number.isFinite(member.hp)&&member.hp>=0&&member.hp<=member.stats.maxHp&&Number.isFinite(member.mp)&&member.mp>=0&&member.mp<=member.stats.maxMp);
    }
    assert.ok(['victory','defeat','draw'].includes(current.battle.outcome));
  }
});
