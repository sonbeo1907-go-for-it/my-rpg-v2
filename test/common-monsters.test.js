import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../scripts/load-content.mjs';
import { createCampaign } from '../src/core/progression.js';
import { createBattle, activeActor, basicAbility, targetsFor, executeAction, executeEnemyTurn } from '../src/core/battle.js';
import { claimBattleReward } from '../src/core/economy.js';
import { seededRandom } from '../src/core/random.js';

const content=await loadContent();
const quests=['boar_field','granary_rats','beetle_orchard','bat_roost','riverbank_pests','marsh_trail','mushroom_grove','flickering_woods'];
test('new easy quests are beatable ungeared with the default four starters using only basic attacks and pay exactly 50 Coin',()=>{
  for(const id of quests)for(const seed of [1,7,42,2026,20261029]){
    const campaign=createCampaign(content);
    const battle=createBattle(content,campaign,id,seededRandom(seed));
    while(!battle.outcome&&battle.actionCount<160){
      const actor=activeActor(battle);
      if(actor.team==='enemy')executeEnemyTurn(battle);
      else{const skill=basicAbility(actor);executeAction(battle,{actorId:actor.id,abilityId:skill.id,targetId:targetsFor(battle,actor,skill)[0]?.id});}
    }
    assert.equal(battle.outcome,'victory',`${id}/${seed}`);
    assert.ok(battle.round<=10,`${id}/${seed} took ${battle.round} rounds`);
    assert.ok(battle.actors.filter(actor=>actor.team==='party').every(actor=>actor.hp>0),`${id}/${seed} lost a starter`);
    const rewarded=claimBattleReward(campaign,battle,content);
    assert.equal(rewarded.coins,50,id);assert.equal(rewarded.prisma,0);assert.equal(rewarded.recruitmentShards,0);
    assert.equal(claimBattleReward(rewarded,battle,content),rewarded);
  }
});
