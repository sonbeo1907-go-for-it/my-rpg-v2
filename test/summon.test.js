import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../scripts/load-content.mjs';
import { createGameSave, encodeGameSave, decodeGameSave } from '../src/core/game-save.js';
import { pullGacha, recruitCharacter, claimBattleReward } from '../src/core/economy.js';
import { bannerRates, highestSummonRarity } from '../src/core/summon-presentation.js';

const content = await loadContent();
function funded(streak = 0) { const save = createGameSave(content); save.coins = 100000; save.prisma = 1000; save.gacha.totalPulls = streak; save.gacha.pity.standard = streak; return save; }
const restore = save => decodeGameSave(encodeGameSave(save, content), content);
function sequence(values) { let i = 0; return () => { assert.ok(i < values.length, 'Unexpected RNG call'); return values[i++]; }; }

test('absolute base rates are 30/50/15/5; high gear retains a 4:1 split', () => {
  const rates = bannerRates(content.banners.standard);
  for (const [key, expected] of Object.entries({ low: .3, mid: .5, high: .15, character: .05 })) assert.ok(Math.abs(rates[key] - expected) < 1e-12);
  assert.ok(Math.abs(rates.byType.t3_focused - .12) < 1e-12);
  assert.ok(Math.abs(rates.byType.t3_dual - .03) < 1e-12);
  assert.equal(highestSummonRarity([{ kind: 'gear', gear: { typeId: 't1' } }]), 'low');
  assert.equal(highestSummonRarity([{ kind: 'gear', gear: { typeId: 't2' } }, { kind: 'gear', gear: { typeId: 't3_dual' } }]), 'high');
  assert.equal(highestSummonRarity([...Array.from({ length: 9 }, () => ({ kind: 'gear', gear: { typeId: 't3_focused' } })), { kind: 'character' }]), 'character');
});

test('49 consecutive gear pulls guarantee a character on pull 50 and reset pity, including duplicates', () => {
  let save = funded();
  for (let i = 0; i < 49; i++) save = pullGacha(save, content, 'standard', 1, () => 0).campaign;
  assert.equal(save.gacha.pity.standard, 49);
  const forced = pullGacha(save, content, 'standard', 1, sequence([0]));
  assert.equal(forced.results[0].characterId, 'dain'); assert.equal(forced.results[0].guaranteed, true);
  assert.equal(forced.campaign.gacha.pity.standard, 0); assert.equal(forced.campaign.gacha.totalPulls, 50);
  assert.equal(save.gacha.pity.standard, 49); // Pure transaction.
  const duplicateInput = structuredClone(forced.campaign); duplicateInput.gacha.totalPulls += 49; duplicateInput.gacha.pity.standard = 49;
  const dupe = pullGacha(duplicateInput, content, 'standard', 1, sequence([0]));
  assert.equal(dupe.results[0].duplicate, true); assert.equal(dupe.campaign.gacha.pity.standard, 0);
  assert.equal(dupe.campaign.recruitmentShards, 10); assert.equal(dupe.campaign.extraGearSlots.dain, 1);
});

test('a natural character resets pity; ten pulls process pity in order and keep counting after the guaranteed character', () => {
  const natural = pullGacha(funded(20), content, 'standard', 1, sequence([.95, 0]));
  assert.equal(natural.results[0].guaranteed, false); assert.equal(natural.campaign.gacha.pity.standard, 0);
  const batch = pullGacha(funded(45), content, 'standard', 10, () => 0);
  assert.equal(batch.results.filter(item => item.kind === 'character').length, 1);
  assert.equal(batch.results[4].guaranteed, true);
  assert.equal(batch.campaign.gacha.pity.standard, 5);
  assert.equal(batch.campaign.gacha.totalPulls, 55);
  assert.equal(batch.campaign.coins, 100000); assert.equal(batch.campaign.prisma, 990);
  assert.deepEqual(restore(batch.campaign), batch.campaign);
});

test('redemption and first-clear characters leave summon pity and last batch unchanged', () => {
  let save = pullGacha(funded(7), content, 'standard', 1, () => 0).campaign;
  save.recruitmentShards = 120;
  const recruited = recruitCharacter(save, content, 'standard', 'dain');
  assert.deepEqual(recruited.gacha, save.gacha);
  const rewarded = claimBattleReward(recruited, { outcome: 'victory', encounterId: 'goblin_forest_ambush' }, content);
  assert.ok(rewarded.unlockedCharacterIds.includes('kai'));
  assert.deepEqual(rewarded.gacha, save.gacha);
});

test('save import/export preserves pity and last rewards; older saves start with no inferred pity', () => {
  const save = pullGacha(funded(48), content, 'standard', 10, () => 0).campaign;
  assert.deepEqual(restore(save), save);
  const old = funded(200); delete old.gacha.pity; delete old.gacha.lastSummon;
  const upgraded = restore(old);
  assert.equal(upgraded.gacha.totalPulls, 200); assert.deepEqual(upgraded.gacha.pity, {}); assert.equal(upgraded.gacha.lastSummon, null);
  for (const mutate of [
    state => { state.pity.standard = 50; }, state => { state.pity.standard = -1; }, state => { state.pity.standard = .5; },
    state => { state.pity.unknown = 1; }, state => { state.lastSummon.id = 'summon_1'; },
    state => { state.lastSummon.results[0].gear.stats.attack = 999; }, state => { state.lastSummon.results[1].guaranteed = 'yes'; }
  ]) { const bad = structuredClone(save); mutate(bad.gacha); assert.throws(() => restore(bad)); }
});
