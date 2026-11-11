import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../scripts/load-content.mjs';
import { createGameSave } from '../src/core/game-save.js';
import { createBattle, executeAction, getActor } from '../src/core/battle.js';
import { claimBattleReward } from '../src/core/economy.js';
import { gearSlotCapacity } from '../src/core/gear-slots.js';

const content = await loadContent();

function save(party = ['senya', 'tsukiha', 'arthur', 'iris']) {
  const s = createGameSave(content);
  for (const id of party) if (!s.unlockedCharacterIds.includes(id)) s.unlockedCharacterIds.push(id);
  s.party = party;
  s.claimedFirstClearRewards = Object.keys(content.encounters);
  s.storyFlags.push('eastern_hunts_unlocked');
  return s;
}

function battle(encounterId, difficulty, actors, campaign) {
  return {
    encounterId,
    questDifficulty: difficulty,
    outcome: 'victory',
    rewardRandom: () => 0.99,
    actors: actors.map((id) => ({ id, definitionId: id, team: 'party' })),
  };
}

test('Senya has the agreed sword-soul physical kit', () => {
  const s = content.characters.senya;
  assert.equal(s.element, 'plain');
  assert.equal(s.affiliation, 'hunters_guild');
  assert.equal(s.releaseId, 101);
  assert.deepEqual(s.abilities, ['senya.slash', 'senya.hunt', 'senya.fulfill']);
  assert.equal(content.abilities['senya.slash'].cost.mp, 3);
  assert.equal(content.abilities['senya.slash'].cooldown, undefined);
  assert.ok(content.abilities['senya.slash'].effects[0].additionalElements.includes('sword_soul'));
  assert.equal(content.abilities['senya.fulfill'].cost.preferTeamResource.amount, 3);
  assert.equal(content.abilities['senya.fulfill'].effects[0].hits, 3);
  assert.equal(content.abilities['senya.fulfill'].effects[0].multiplier, 1.5);
});

test('spending Hồn Kiếm gives Senya a 30% ATK buff for three turns', () => {
  const s = save();
  const b = createBattle(content, s, 'east_e_01', () => 0.99, { questDifficulty: 'east_35' });
  b.teamResources.party.sword_soul.value = 3;
  b.queue = [getActor(b, 'senya').id];
  b.cursor = 0;
  b.phase = 'main';
  b.outcome = null;
  executeAction(b, { actorId: 'senya', abilityId: 'senya.fulfill', targetId: b.actors.find(a => a.team === 'enemy').id });
  const buff = getActor(b, 'senya').statuses.find(status => status.id === 'senya_blood_hunt');
  assert.ok(buff);
  assert.equal(buff.remaining, 3);
});

test('Senya unlock and her three gear-slot trials are recorded', () => {
  const s = createGameSave(content);
  let next = claimBattleReward(s, battle('east_ke_03', 'east_35', ['arthur'], s), content);
  assert.ok(next.unlockedCharacterIds.includes('senya'));

  next.party = ['senya'];
  next = claimBattleReward(next, battle('east_ke_03', 'east_35', ['senya'], next), content);
  next = claimBattleReward(next, battle('east_ke_06', 'east_45', ['senya'], next), content);
  next = claimBattleReward(next, battle('east_ke_08', 'east_55', ['senya'], next), content);

  assert.ok(next.storyFlags.includes('senya.gear_slot_1'));
  assert.ok(next.storyFlags.includes('senya.gear_slot_2'));
  assert.ok(next.storyFlags.includes('senya.gear_slot_3'));
  for (let index = 1; index <= 3; index++) assert.ok(next.storyFlags.includes(`senya.gear_slot_${index}_unlocked`));
  assert.equal(next.extraGearSlots.senya, 3);
  assert.equal(gearSlotCapacity(next, content, 'senya'), content.economy.default.baseGearSlots + 3);
});
