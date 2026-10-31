import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../scripts/load-content.mjs';
import { createCampaign, completeStoryEvent, resolveCharacter, serializeCampaign, deserializeCampaign } from '../src/core/progression.js';
import { createBattle, getActor, executeAction } from '../src/core/battle.js';
import { claimBattleReward } from '../src/core/economy.js';
import { createSaveExport, parseSaveImport } from '../src/core/save-file.js';
import { validateContent } from '../src/core/content.js';

const content = await loadContent();
const upgradeId = 'arthur.control_training';

test('winning the ogre trial grants the Arthur upgrade even when Arthur is benched; only new battle actors change', () => {
  const campaign = createCampaign(content); campaign.party = ['iris', 'elaine'];
  const battle = createBattle(content, campaign, 'ogre_trial');
  getActor(battle, 'enemy_0').hp = 1; getActor(battle, 'enemy_1').hp = 1;
  executeAction(battle, { actorId: 'iris', abilityId: '$attack', targetId: 'enemy_0' });
  executeAction(battle, { actorId: 'elaine', abilityId: '$attack', targetId: 'enemy_1' });
  assert.equal(battle.outcome, 'victory');
  battle.rewardRandom=()=>0;
  let saved;
  const received = claimBattleReward(campaign, battle, content, next => { saved = serializeCampaign(next); });
  assert.deepEqual(campaign.characters.arthur.upgradeIds, []);
  assert.deepEqual(received.characters.arthur.upgradeIds, [upgradeId]);
  assert.ok(received.storyFlags.includes('arthur_completed_sword_training'));
  assert.deepEqual(received.claimedFirstClearRewards, ['ogre_trial']);
  assert.equal(received.coins, 150);
  const arthur = resolveCharacter(content, received, 'arthur');
  assert.ok(arthur.abilities.includes('arthur.ogres_bane_controlled'));
  assert.ok(arthur.abilities.includes('arthur.partial_release'));
  assert.equal(arthur.abilities.includes('arthur.ogres_bane'), false);
  assert.equal(battle.firstClearRewards[0].type, 'upgrade');
  assert.equal(battle.firstClearRewards[0].alreadyOwned, false);
  const restored = deserializeCampaign(saved, content);
  assert.deepEqual(parseSaveImport(createSaveExport(restored, content).text, content), restored);
  restored.party = ['arthur'];
  assert.ok(getActor(createBattle(content, restored, 'forest_patrol'), 'arthur').abilities.includes('arthur.partial_release'));
  const repeat = { encounterId: 'ogre_trial', outcome: 'victory', rewardRandom:()=>0 };
  const twice = claimBattleReward(restored, repeat, content);
  assert.equal(twice.coins, 300);
  assert.deepEqual(twice.characters.arthur.upgradeIds, [upgradeId]);
  assert.deepEqual(repeat.firstClearRewards, []);
  assert.equal(twice.recruitmentShards, 0);
});

test('failed persistence cannot partially grant the upgrade, story flag, ledger or coins', () => {
  const campaign = createCampaign(content), before = serializeCampaign(campaign);
  const battle = { encounterId: 'ogre_trial', outcome: 'victory', rewardRandom:()=>0 };
  assert.throws(() => claimBattleReward(campaign, battle, content, () => { throw new Error('quota'); }));
  assert.equal(serializeCampaign(campaign), before);
  assert.equal(battle.rewardClaimed, undefined);
  assert.equal(battle.firstClearRewards, undefined);
  assert.deepEqual(claimBattleReward(campaign, battle, content).characters.arthur.upgradeIds, [upgradeId]);
  for (const outcome of [null, 'defeat', 'draw']) {
    assert.equal(claimBattleReward(campaign, { encounterId: 'ogre_trial', outcome }, content), campaign);
  }
  assert.deepEqual(claimBattleReward(campaign, { encounterId: 'forest_patrol', outcome: 'victory' }, content).characters.arthur.upgradeIds, []);
});

test('legacy trained Arthur retains the upgrade without duplicate skills or upgrades when winning the trial', () => {
  const old = createCampaign(content);
  completeStoryEvent(old, content, 'arthur_completed_sword_training');
  const restored = deserializeCampaign(serializeCampaign(old), content);
  const battle = { encounterId: 'ogre_trial', outcome: 'victory', rewardRandom:()=>0 };
  const next = claimBattleReward(restored, battle, content);
  assert.deepEqual(next.characters.arthur.upgradeIds, [upgradeId]);
  assert.equal(next.storyFlags.filter(id => id === 'arthur_completed_sword_training').length, 1);
  assert.equal(battle.firstClearRewards[0].alreadyOwned, true);
  assert.equal(resolveCharacter(content, next, 'arthur').abilities.filter(id => id === 'arthur.partial_release').length, 1);
});

test('reward definitions and imported claimed-upgrade ledgers must reference earned upgrades', () => {
  const invalid = structuredClone(content);
  invalid.encounters.ogre_trial.firstClearRewards = [{ type: 'upgrade', upgradeId: 'missing' }];
  assert.match(validateContent(invalid).join('\n'), /unknown upgrades/);
  const campaign = createCampaign(content); campaign.claimedFirstClearRewards = ['ogre_trial'];
  assert.throws(() => deserializeCampaign(serializeCampaign(campaign), content), /nâng cấp đã nhận/);
});
