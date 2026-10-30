import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../scripts/load-content.mjs';
import { createGameSave, encodeGameSave, decodeGameSave } from '../src/core/game-save.js';
import { claimBattleReward, victoryCoinReward, convertCoinsToPrisma, prismaConversionCost, pullGacha, recruitCharacter } from '../src/core/economy.js';
import { validateContent } from '../src/core/content.js';
const content = await loadContent();
const restore = save => decodeGameSave(encodeGameSave(save, content), content);

test('conversion costs 300 Coin per Prisma, rejects invalid/overflow quantities and cannot spend Pure Prisma', () => {
  const save = createGameSave(content); save.coins = 3500; save.prisma = 2; save.recruitmentShards = 123;
  assert.equal(prismaConversionCost(content, 10), 3000);
  const next = convertCoinsToPrisma(save, content, 10);
  assert.equal(next.coins, 500); assert.equal(next.prisma, 12); assert.equal(next.recruitmentShards, 123);
  assert.equal(save.coins, 3500); assert.equal(save.prisma, 2);
  assert.deepEqual(restore(next), next);
  for (const quantity of [0, -1, .5, NaN, Infinity, '1', Number.MAX_SAFE_INTEGER]) assert.throws(() => convertCoinsToPrisma(save, content, quantity));
  assert.throws(() => convertCoinsToPrisma(next, content, 2), /Không đủ Coin/);
  const full = structuredClone(save); full.prisma = Number.MAX_SAFE_INTEGER;
  assert.throws(() => convertCoinsToPrisma(full, content, 1), /giới hạn/);
});

test('pulls consume only ordinary Prisma; conversion plus summon can commit as one immutable transaction', () => {
  const save = createGameSave(content); save.coins = 2400; save.prisma = 3; save.recruitmentShards = 55;
  assert.throws(() => pullGacha(save, content, 'standard', 10), /Không đủ Prisma/);
  const one = pullGacha(save, content, 'standard', 1, () => 0).campaign;
  assert.equal(one.prisma, 2); assert.equal(one.coins, 2400); assert.equal(one.recruitmentShards, 55);
  const ten = pullGacha(convertCoinsToPrisma(save, content, 7), content, 'standard', 10, () => 0).campaign;
  assert.equal(ten.coins, 300); assert.equal(ten.prisma, 0); assert.equal(ten.gacha.totalPulls, 10);
  assert.equal(save.coins, 2400); assert.equal(save.prisma, 3); assert.equal(save.gear.length, 0);
  assert.throws(() => pullGacha(convertCoinsToPrisma(save, content, 7), content, 'standard', 10, () => NaN));
  assert.equal(save.coins, 2400); assert.equal(save.gacha.totalPulls, 0);
});

test('Pure Prisma selects one locked hero for 120, leaves other currencies and pity unchanged', () => {
  const save = createGameSave(content); save.coins = 900; save.prisma = 4; save.recruitmentShards = 130;
  save.gacha.totalPulls = 25; save.gacha.pity.standard = 25;
  const next = recruitCharacter(save, content, 'standard', 'dain');
  assert.equal(next.recruitmentShards, 10); assert.equal(next.coins, 900); assert.equal(next.prisma, 4);
  assert.ok(next.unlockedCharacterIds.includes('dain')); assert.deepEqual(next.gacha, save.gacha);
  assert.throws(() => recruitCharacter(next, content, 'standard', 'dain'));
  assert.throws(() => recruitCharacter(next, content, 'standard', 'freya'), /Pure Prisma/);
  assert.deepEqual(restore(next), next);
});

test('every encounter pays its data-driven tier once, independent of BGM and first-clear rewards', () => {
  const withoutMusic = structuredClone(content);
  for (const encounter of Object.values(withoutMusic.encounters)) {
    const expected = { normal: 50, boss: 150, super: 1000 }[encounter.rewardTier];
    assert.equal(victoryCoinReward(content, encounter.id), expected);
    encounter.bgm = 'normal';
    const battle = { encounterId: encounter.id, outcome: 'victory', actors:(encounter.requiredPartyIds??[]).map(id=>({id,team:'party'})) };
    const campaign=createGameSave(content);
    if(encounter.travelerStory)campaign.claimedFirstClearRewards=withoutMusic.travelerStories[encounter.travelerStory].chapters.slice(0,withoutMusic.travelerStories[encounter.travelerStory].chapters.indexOf(encounter.id));
    const next = claimBattleReward(campaign, battle, withoutMusic);
    assert.equal(next.coins, expected, encounter.id);
    assert.equal(claimBattleReward(next, battle, withoutMusic), next);
  }
  for (const tier of ['superboss', null, -1]) {
    const bad = structuredClone(content); bad.encounters.forest_patrol.rewardTier = tier;
    assert.ok(validateContent(bad).length);
  }
});

test('old saves preserve coins, former shards, pity and history, initialize Prisma to zero and reject corrupt balances', () => {
  const save = createGameSave(content); save.coins = 987; save.recruitmentShards = 75; save.gacha.totalPulls = 17; save.gacha.pity.standard = 17;
  const legacy = JSON.parse(encodeGameSave(save, content)); delete legacy.prisma;
  const migrated = decodeGameSave(JSON.stringify(legacy), content);
  assert.equal(migrated.prisma, 0); assert.equal(migrated.coins, 987); assert.equal(migrated.recruitmentShards, 75); assert.equal(migrated.gacha.pity.standard, 17);
  for (const prisma of [-1, .5, null, '5', Number.MAX_SAFE_INTEGER + 1]) { legacy.prisma = prisma; assert.throws(() => decodeGameSave(JSON.stringify(legacy), content)); }
});
