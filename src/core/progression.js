import {emptyShopDaily,normalizeShopDaily} from './shop-daily.js';
import {emptyDailyCommissions,normalizeDailyCommissions} from './daily-commissions.js';
import { isValidParty } from "./party.js";
import { effectiveStat } from "./combat-math.js";
import { teamBonusesFor } from "./team-bonuses.js";
import { assertOwnedParty } from "./ownership.js";
import { economyRules, validateGear } from "./economy.js";
import { equippedGear, assertValidEquipment } from "./equipment.js";
import { grantEligibleUpgrades } from "./story-events.js";
import { normalizeGachaState } from "./gacha-state.js";
import { normalizeDungeonDaily } from "./dungeon-rules.js";
import { emptyBlacksmithState, normalizeBlacksmithState, equippedExclusive } from "./blacksmith-state.js";
import { emptyIllusionState, normalizeIllusionState } from './legacy-illusion-state.js';
export { grantEligibleUpgrades, completeStoryEvent } from "./story-events.js";

export const SAVE_VERSION = 3;

export function createCampaign(content) {
  return {
    version: SAVE_VERSION,
    party: ["arthur", "iris", "elaine", "garrek"],
    characters: Object.fromEntries(
      Object.keys(content.characters).map((id) => [
        id,
        { level: 1, upgradeIds: [] },
      ]),
    ),
    storyFlags: [],
    victories: 0,
    claimedFirstClearRewards: [],
    unlockedCharacterIds: [...economyRules(content).starterCharacters],
    coins: 0,
    prisma: 0,
    recruitmentShards: 0,
    gear: [],
    equipment: {},
    extraGearSlots: {},
    gacha: { totalPulls: 0, pity: {}, lastSummon: null },
    dungeonDaily: { day: null, clears: {} },
    dailyCommissions: emptyDailyCommissions(),
    shopDaily: emptyShopDaily(),
    illusion: emptyIllusionState(),
    ...emptyBlacksmithState(),
  };
}

export function resolveCharacter(content, campaign, characterId) {
  const base = content.characters[characterId];
  const state = campaign.characters[characterId];
  if (!base || !state) throw new Error(`Unknown character ${characterId}`);
  const character = structuredClone(base);
  const upgrades = state.upgradeIds
    .map((id) => content.upgrades[id])
    .filter(Boolean)
    .sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id.localeCompare(b.id),
    );
  for (const upgrade of upgrades) {
    if (upgrade.characterId !== characterId)
      throw new Error(`Upgrade ${upgrade.id} belongs to another character`);
    for (const change of upgrade.changes) {
      if (
        change.type === "unlock_ability" &&
        !character.abilities.includes(change.ability)
      )
        character.abilities.push(change.ability);
      if (change.type === "replace_ability")
        character.abilities = character.abilities.map((id) =>
          id === change.from ? change.to : id,
        );
      if (change.type === "resource_max")
        character.resources[change.resource].max = change.max;
      if (change.type === "set_passive")
        character.passive = structuredClone(change.passive);
    }
  }
  const gear = equippedGear(campaign, characterId);
  if (gear.length) {
    character.equippedGearIds = gear.map((item) => item.id);
    character.gearBonuses = {};
    for (const item of gear)
      for (const [key, amount] of Object.entries(item.stats))
        character.gearBonuses[key] = (character.gearBonuses[key] ?? 0) + amount;
    for (const [key, amount] of Object.entries(character.gearBonuses))
      character.stats[key] += amount;
  }
  const exclusive = equippedExclusive(campaign, content, characterId);
  if (exclusive) {
    character.exclusiveGear = structuredClone(exclusive);
    character.exclusiveBonuses = { [exclusive.statKey]: exclusive.statValue };
    character.stats[exclusive.statKey] += exclusive.statValue;
    if (exclusive.template.passive.type === "stat_boost") character.exclusiveModifiers = { ...exclusive.template.passive.modifiers };
  }
  const team = teamBonusesFor(content, campaign, characterId);
  character.teamBonuses = team.bonuses;
  character.teamBonusSources = team.sources;
  for (const [key, amount] of Object.entries(team.bonuses))
    character.stats[key] += amount;
  if (["stat_boost","stat_conversion"].includes(character.passive?.type) || character.exclusiveModifiers) {
    character.baseStats = structuredClone(character.stats);
    for (const key of new Set([...Object.keys(character.passive?.type === "stat_boost" ? character.passive.modifiers : {}), ...Object.keys(character.exclusiveModifiers ?? {}), ...(character.passive?.type === "stat_conversion" ? [character.passive.toStat] : [])]))
      character.stats[key] = effectiveStat(character, key);
  }
  return character;
}

// Battle HP, cooldowns and temporary statuses deliberately never enter the campaign save.
export function serializeCampaign(campaign) {
  const {
    version,
    party,
    characters,
    storyFlags,
    victories,
    unlockedCharacterIds,
    coins,
    prisma = 0,
    recruitmentShards,
    gear,
    gacha,
    equipment = {},
    extraGearSlots = {},
    claimedFirstClearRewards = [],
  } = campaign;
  return JSON.stringify({
    version,
    party,
    characters,
    storyFlags,
    victories,
    unlockedCharacterIds,
    coins,
    prisma,
    recruitmentShards,
    gear,
    gacha,
    equipment,
    extraGearSlots,
    claimedFirstClearRewards,
    dungeonDaily: campaign.dungeonDaily ?? { day: null, clears: {} },
    dailyCommissions: normalizeDailyCommissions(campaign.dailyCommissions),
    shopDaily: normalizeShopDaily(campaign.shopDaily),
    prismaFragments: campaign.prismaFragments ?? 0,
    originalPrisma: campaign.originalPrisma ?? 0,
    exclusiveGear: campaign.exclusiveGear ?? [],
    equippedExclusiveGear: campaign.equippedExclusiveGear ?? {},
    pendingReforge: campaign.pendingReforge ?? null,
    blacksmithRevision: campaign.blacksmithRevision ?? 0,
    illusion: campaign.illusion ?? emptyIllusionState(),
  });
}

export function deserializeCampaign(raw, content) {
  const input = JSON.parse(raw);
  // Future schema changes belong here as explicit version-to-version migrations.
  if (!input || ![1, 2, SAVE_VERSION].includes(input.version))
    throw new Error("Phiên bản save chưa được hỗ trợ.");
  if (!isValidParty(input.party, content.characters))
    throw new Error("Đội hình trong save không hợp lệ.");
  if (
    !Array.isArray(input.storyFlags) ||
    input.storyFlags.some((flag) => typeof flag !== "string")
  )
    throw new Error("Mốc truyện trong save không hợp lệ.");
  if (!Number.isSafeInteger(input.victories) || input.victories < 0)
    throw new Error("Tiến trình trong save không hợp lệ.");
  if (
    !input.characters ||
    typeof input.characters !== "object" ||
    Array.isArray(input.characters)
  )
    throw new Error("Tiến trình nhân vật trong save không hợp lệ.");
  const result = createCampaign(content);
  result.illusion = normalizeIllusionState(input.illusion);
  result.dailyCommissions = normalizeDailyCommissions(input.dailyCommissions);
  result.shopDaily = normalizeShopDaily(input.shopDaily);
  result.dungeonDaily = normalizeDungeonDaily(input.dungeonDaily, content);
  result.party = [...input.party];
  result.storyFlags = [...new Set(input.storyFlags)];
  result.victories = input.victories;
  if (input.version === 1) {
    // v1 had no ownership. Retain story progress, but only starter characters remain playable.
    result.party = input.party.map((id) =>
      result.unlockedCharacterIds.includes(id) ? id : null,
    );
    if (!result.party.some(Boolean))
      result.party = [...createCampaign(content).party];
    result.coins = input.victories * economyRules(content).legacyVictoryCoins;
    if (!Number.isSafeInteger(result.coins))
      throw new Error("Số coin chuyển đổi vượt giới hạn.");
  } else {
    const ids = input.unlockedCharacterIds;
    if (
      !Array.isArray(ids) ||
      new Set(ids).size !== ids.length ||
      ids.some(
        (id) =>
          typeof id !== "string" || !Object.hasOwn(content.characters, id),
      ) ||
      economyRules(content).starterCharacters.some((id) => !ids.includes(id))
    )
      throw new Error("Nhân vật đã mở khóa không hợp lệ.");
    result.unlockedCharacterIds = [...ids];
    assertOwnedParty(result);
    for (const key of ["coins", "recruitmentShards"]) {
      if (!Number.isSafeInteger(input[key]) || input[key] < 0)
        throw new Error(`Số dư ${key} không hợp lệ.`);
      result[key] = input[key];
    }
    const prisma = input.prisma === undefined ? 0 : input.prisma;
    if (!Number.isSafeInteger(prisma) || prisma < 0)
      throw new Error("Số dư Prisma không hợp lệ.");
    result.prisma = prisma;
    if (
      !Number.isSafeInteger(input.gacha?.totalPulls) ||
      input.gacha.totalPulls < 0
    )
      throw new Error("Số lượt quay không hợp lệ.");
    result.gacha = { totalPulls: input.gacha.totalPulls };
    if (
      !Array.isArray(input.gear) ||
      input.gear.some(
        (item) =>
          !validateGear(item, content) ||
          !Number.isSafeInteger(Number(item.id.slice(5))) ||
          Number(item.id.slice(5)) > (item.id.startsWith('loot_') ? result.illusion.gearSerial : result.gacha.totalPulls),
      ) ||
      new Set(input.gear.map((item) => item.id)).size !== input.gear.length
    )
      throw new Error("Gear trong save không hợp lệ.");
    result.gear = input.gear.map(({ id, typeId, stats }) => ({
      id,
      typeId,
      stats: { ...stats },
    }));
    result.equipment = input.equipment === undefined ? {} : input.equipment;
    if (input.version === 2) {
      if (
        !result.equipment ||
        typeof result.equipment !== "object" ||
        Array.isArray(result.equipment)
      )
        throw new Error("Dữ liệu trang bị không hợp lệ.");
      result.equipment = Object.fromEntries(
        Object.entries(result.equipment).map(([id, gearId]) => {
          if (typeof gearId !== "string")
            throw new Error("Trang bị v2 không hợp lệ.");
          return [id, [gearId]];
        }),
      );
    } else result.extraGearSlots = input.extraGearSlots;
    assertValidEquipment(result, content);
    result.equipment = Object.fromEntries(
      Object.entries(result.equipment).map(([id, slots]) => [id, [...slots]]),
    );
    result.extraGearSlots = { ...result.extraGearSlots };
  }
  const claimed = input.claimedFirstClearRewards ?? [];
  if (
    !Array.isArray(claimed) ||
    new Set(claimed).size !== claimed.length ||
    claimed.some(
      (id) =>
        typeof id !== "string" ||
        !Object.hasOwn(content.encounters, id) ||
        !content.encounters[id].firstClearRewards?.length,
    )
  )
    throw new Error("Thưởng lần đầu trong save không hợp lệ.");
  result.claimedFirstClearRewards = [...claimed];
  for (const id of Object.keys(content.characters)) {
    const saved = input.characters?.[id];
    if (!Object.hasOwn(input.characters, id)) continue; // New content characters can be added to an older save.
    if (!saved || typeof saved !== "object" || Array.isArray(saved))
      throw new Error(`Dữ liệu ${id} không hợp lệ.`);
    if (
      !Number.isInteger(saved.level) ||
      saved.level < 1 ||
      saved.level > 99 ||
      !Array.isArray(saved.upgradeIds)
    )
      throw new Error(`Dữ liệu ${id} không hợp lệ.`);
    for (const upgradeId of saved.upgradeIds) {
      const upgrade = content.upgrades[upgradeId];
      if (
        !upgrade ||
        upgrade.characterId !== id ||
        !result.storyFlags.includes(upgrade.requires.storyFlag)
      )
        throw new Error(`Nâng cấp ${upgradeId} không hợp lệ.`);
    }
    result.characters[id] = {
      level: saved.level,
      upgradeIds: [...new Set(saved.upgradeIds)],
    };
  }
  grantEligibleUpgrades(result, content);
  for (const id of claimed)
    for (const reward of content.encounters[id].firstClearRewards) {
      if (reward.type === "upgrade") {
        const upgrade = content.upgrades[reward.upgradeId];
        if (
          !result.characters[upgrade.characterId]?.upgradeIds.includes(
            upgrade.id,
          )
        )
          throw new Error("Thưởng lần đầu không khớp nâng cấp đã nhận.");
      } else if (reward.type === "exclusive") {
        if (!input.exclusiveGear?.some(item => item.templateId === reward.templateId)) throw new Error("Thưởng lần đầu không khớp Trấn Phái đã nhận.");
      } else if (!result.unlockedCharacterIds.includes(reward.characterId))
        throw new Error("Thưởng lần đầu không khớp nhân vật đã sở hữu.");
    }
  if (input.version !== 1)
    result.gacha = normalizeGachaState(input.gacha, result, content);
  Object.assign(result, normalizeBlacksmithState(input, content, result));
  return result;
}
