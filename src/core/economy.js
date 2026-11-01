import {grantPartyXp} from './leveling.js';
import {questExperience} from './quest-difficulty.js';
import {FIRST_CLEAR_CURRENCIES} from './first-clear-labels.js';
import {validT4Gear} from './gear-rules.js';
import {prepareVictoryReward} from './quest-rewards.js';
import {recordDailyClear} from './daily-commissions.js';
import { grantQuestExclusive } from './exclusive-rewards.js';
import { ownsCharacter, unlockCharacter } from './ownership.js';
import { gearSlotCapacity, unlockDuplicateSlot } from './gear-slots.js';
import { completeStoryEvent } from './story-events.js';

const STAT_KEYS = ['maxHp', 'maxMp', 'attack', 'magic', 'defense', 'resistance', 'speed'];
const positiveInt = value => Number.isSafeInteger(value) && value > 0;
export const economyRules = content => content.economy.default;
export const encounterTier = encounter => encounter?.rewardTier === undefined ? 'normal' : encounter.rewardTier;
export function victoryCoinReward(content, encounterId) {
  const rules = economyRules(content);
  if(content.encounters[encounterId]?.rewardPolicy==='none')return 0;
  return { normal: rules.victoryCoins, boss: rules.bossVictoryCoins, super: rules.superVictoryCoins }[encounterTier(content.encounters[encounterId])];
}
export function prismaConversionCost(content, quantity) {
  if (!positiveInt(quantity) || !Number.isSafeInteger(quantity * economyRules(content).prismaCoinCost)) throw new Error('Số lượng Prisma không hợp lệ.');
  return quantity * economyRules(content).prismaCoinCost;
}
export function convertCoinsToPrisma(campaign, content, quantity) {
  const cost = prismaConversionCost(content, quantity);
  if (!Number.isSafeInteger(campaign.coins) || campaign.coins < cost) throw new Error('Không đủ Coin để chuyển đổi Prisma.');
  const balance = checkedAdd(campaign.prisma ?? 0, quantity);
  const next = structuredClone(campaign);
  next.coins -= cost; next.prisma = balance;
  return next;
}

export function validateEconomyContent(content) {
  const errors = [];
  const rules = content.economy?.default;
  if (!rules || !content.banners || !content.gearTypes) return ['Missing economy, banners or gearTypes'];
  for (const key of ['victoryCoins', 'bossVictoryCoins', 'superVictoryCoins', 'legacyVictoryCoins', 'prismaCoinCost', 'singlePullCost', 'tenPullCost', 'duplicateShards', 'recruitCost']) {
    if (!positiveInt(rules[key])) errors.push(`economy: invalid ${key}`);
  }
  if(!Number.isFinite(rules.coinRewardChance)||rules.coinRewardChance<=0||rules.coinRewardChance>=1||!positiveInt(rules.normalFragmentReward)||!positiveInt(rules.bossFragmentReward))errors.push('economy: invalid Quest reward split');
  for (const encounter of Object.values(content.encounters)) if (!['normal', 'boss', 'super'].includes(encounterTier(encounter))) errors.push(`encounters: invalid rewardTier ${encounter.id}`);
  const br=rules.bountyBlueprintRewards;
  if(rules.blueprintRecipeCost!==10||!br||br.minLevel!==25||br.coinChance!==.4||br.fragmentChance!==.4||br.blueprintChance!==.2||JSON.stringify(br.amountByLevel)!==JSON.stringify([{level:25,amount:1},{level:35,amount:3},{level:45,amount:5}]))errors.push('economy: invalid Blueprint rules');
  if (!positiveInt(rules.baseGearSlots) || !positiveInt(rules.maxGearSlots) || rules.maxGearSlots < rules.baseGearSlots) errors.push('economy: invalid gear slot limits');
  if (!Array.isArray(rules.starterCharacters) || !rules.starterCharacters.length
    || new Set(rules.starterCharacters).size !== rules.starterCharacters.length
    || rules.starterCharacters.some(id => !Object.hasOwn(content.characters, id))) errors.push('economy: invalid starterCharacters');
  if (!Array.isArray(rules.gearStats) || !rules.gearStats.length
    || new Set(rules.gearStats.map(item => item.stat)).size !== rules.gearStats.length
    || rules.gearStats.some(item => !STAT_KEYS.includes(item.stat) || !positiveInt(item.scale) || typeof item.label !== 'string')) errors.push('economy: invalid gearStats');
  for (const type of Object.values(content.gearTypes)) {
    if(type.id==='t4_stats'&&(type.points!==5||type.statCount!==2))errors.push('gearTypes: invalid forged stats');
    if (type.id==='t4_effect') {if(type.points!==0||type.statCount!==0)errors.push('gearTypes: invalid effect gear');continue;}
    if (!positiveInt(type.points) || !positiveInt(type.statCount) || type.statCount > (rules.gearStats?.length ?? 0)) errors.push(`gearTypes: invalid ${type.id}`);
  }
  for (const banner of Object.values(content.banners)) {
    if (!positiveInt(banner.gearWeight) || !positiveInt(banner.characterWeight)) errors.push(`banners: invalid weights ${banner.id}`);
    if (banner.pity !== undefined && (!banner.pity || !positiveInt(banner.pity.characterAt) || banner.pity.characterAt < 2)) errors.push(`banners: invalid pity ${banner.id}`);
    if (!Array.isArray(banner.characterPool) || !banner.characterPool.length
      || new Set(banner.characterPool).size !== banner.characterPool.length
      || banner.characterPool.some(id => !Object.hasOwn(content.characters, id) || content.characters[id]?.developerOnly || content.characters[id]?.recruitmentOnly || rules.starterCharacters?.includes(id))) errors.push(`banners: invalid characterPool ${banner.id}`);
    if (!Array.isArray(banner.gearRates) || !banner.gearRates.length
      || new Set(banner.gearRates.map(item => item.typeId)).size !== banner.gearRates.length
      || banner.gearRates.some(item => !Object.hasOwn(content.gearTypes, item.typeId) || item.typeId.startsWith('t4_') || !positiveInt(item.weight))) errors.push(`banners: invalid gearRates ${banner.id}`);
  }
  return errors;
}

export function validateGear(gear, content) {
  const type = Object.hasOwn(content.gearTypes, gear?.typeId) ? content.gearTypes[gear.typeId] : null;
  if (!type || typeof gear.id !== 'string' || !/^(gear|loot|rune)_[1-9]\d*$/.test(gear.id)
    || !gear.stats || typeof gear.stats !== 'object' || Array.isArray(gear.stats)) return false;
  if(['t4_stats','t4_effect'].includes(gear.typeId))return validT4Gear(gear,content);
  if(gear.primaryStat!==undefined||gear.secondaryStat!==undefined||gear.effectId!==undefined||gear.id.startsWith('rune_'))return false;
  const entries = Object.entries(gear.stats);
  return entries.length === type.statCount && entries.every(([key, value]) => {
    const definition = economyRules(content).gearStats.find(item => item.stat === key);
    return definition && value === definition.scale * type.points;
  });
}

function checkedAdd(value, amount) {
  if (!Number.isSafeInteger(value) || value < 0 || !Number.isSafeInteger(value + amount)) throw new Error('Số dư vượt giới hạn cho phép.');
  return value + amount;
}

// Shared by banners and authored first-clear rewards; duplicate rules never diverge.
export function grantCharacterCopy(campaign, content, characterId) {
  if (!Object.hasOwn(content.characters, characterId)) throw new Error('Nhân vật thưởng không hợp lệ.');
  const rules = economyRules(content);
  const duplicate = ownsCharacter(campaign, characterId);
  let slotUnlocked = false;
  if (duplicate) {
    campaign.recruitmentShards = checkedAdd(campaign.recruitmentShards, rules.duplicateShards);
    slotUnlocked = unlockDuplicateSlot(campaign, content, characterId);
  } else unlockCharacter(campaign, content, characterId);
  return { characterId, duplicate, shards: duplicate ? rules.duplicateShards : 0, slotUnlocked, gearSlots: gearSlotCapacity(campaign, content, characterId) };
}

// A failed persistence callback leaves both campaign and claim unchanged for a retry.
export function claimBattleReward(campaign, battle, content, persist = () => {}, now = new Date()) {
  if (battle.dungeon||content.encounters[battle.encounterId]?.category==='chronicle') return campaign; // Wave clears never grant Quest rewards or first-clear unlocks.
  if (battle.outcome !== 'victory' || battle.rewardClaimed) return campaign;
  const encounter = content.encounters[battle.encounterId];
  if (encounter?.waves && (battle.storyWave?.totalWaves!==encounter.waves.length || battle.storyWave?.waveIndex!==encounter.waves.length-1)) return campaign;
  if (encounter?.travelerStory || encounter?.category==='bounty') {
    if (encounter.requires?.firstClear && !campaign.claimedFirstClearRewards?.includes(encounter.requires.firstClear)) throw new Error('Chương truyện trước chưa hoàn thành.');
    if (encounter.requires?.firstClears?.some(id=>!campaign.claimedFirstClearRewards?.includes(id))) throw new Error('Hãy hoàn thành đủ các câu chuyện bắt buộc trước khi nhận thưởng chương truyện.');
    if (encounter.requiredPartyIds?.some(id => !battle.actors?.some(actor => actor.team === 'party' && (actor.definitionId ?? actor.id) === id))) throw new Error('Đội tham chiến thiếu nhân vật bắt buộc.');
  }
  const next = structuredClone(campaign);
  for(const[field,n]of Object.entries(prepareVictoryReward(battle,content,battle.rewardRandom??Math.random,campaign))) next[field]=checkedAdd(next[field]??0,n);
  next.victories = checkedAdd(next.victories, 1);
  if(encounter?.superLevels&&next.chronicles?.aliceFirstEncounterCleared&&!next.chronicles.aliceDifficultyClears.includes(battle.enemyLevel))next.chronicles.aliceDifficultyClears.push(battle.enemyLevel);
  if (encounter && !encounter.travelerStory && ["normal","boss"].includes(encounterTier(encounter))) recordDailyClear(next,"quest",now);
  next.claimedFirstClearRewards ??= [];
  const rewards = content.encounters[battle.encounterId]?.firstClearRewards;
  const granted = [];
  if (rewards?.length && !next.claimedFirstClearRewards.includes(battle.encounterId)) {
    for (const reward of rewards) {
      if (reward.type === 'upgrade') {
        const upgrade = content.upgrades[reward.upgradeId];
        if (!upgrade) throw new Error('Nâng cấp thưởng không hợp lệ.');
        const alreadyOwned = next.characters[upgrade.characterId].upgradeIds.includes(upgrade.id);
        completeStoryEvent(next, content, upgrade.requires.storyFlag);
        granted.push({ type: 'upgrade', upgradeId: upgrade.id, characterId: upgrade.characterId, alreadyOwned });
      } else if(reward.type==='currency'){if(!FIRST_CLEAR_CURRENCIES.includes(reward.currency))throw Error('Loại tiền thưởng không hợp lệ.');next[reward.currency]=checkedAdd(next[reward.currency]??0,reward.amount);granted.push({...reward});}
      else if(reward.type==='exclusive_recipe')granted.push({...reward});
      else if (reward.type === 'gear_slot') granted.push({type:'gear_slot',characterId:reward.characterId,slotUnlocked:unlockDuplicateSlot(next,content,reward.characterId)});
      else if (reward.type === 'gear_recipe') granted.push({type:'gear_recipe',recipeId:reward.recipeId});
      else if (reward.type === 'exclusive') granted.push(grantQuestExclusive(next,content,reward.templateId));
      else granted.push(grantCharacterCopy(next, content, reward.characterId));
    }
    next.claimedFirstClearRewards.push(battle.encounterId);
  }
  if(encounter?.category==='bounty'&&!next.claimedFirstClearRewards.includes(encounter.id))next.claimedFirstClearRewards.push(encounter.id);
  const amount=questExperience(content,encounter,battle.questDifficulty);
  const recipients=battle.actors?.filter(a=>a.team==="party").map(a=>a.definitionId??a.id)??campaign.party.filter(Boolean);
  const xpAwards=amount?grantPartyXp(next,content,recipients,amount):[];
  persist(next);
  battle.xpAwards=xpAwards;
  battle.rewardClaimed = true;
  battle.firstClearRewards = granted;
  return next;
}

function roll(random) {
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error('Nguồn ngẫu nhiên không hợp lệ.');
  return value;
}

function weighted(items, random) {
  let cursor = roll(random) * items.reduce((sum, item) => sum + item.weight, 0);
  for (const item of items) {
    cursor -= item.weight;
    if (cursor < 0) return item;
  }
  return items.at(-1);
}

// Pure transaction: persist the complete result before replacing live campaign state.
export function pullGacha(campaign, content, bannerId, count, random = Math.random) {
  const banner = Object.hasOwn(content.banners, bannerId) ? content.banners[bannerId] : null;
  if (!banner || ![1, 10].includes(count)) throw new Error('Lượt quay không hợp lệ.');
  const rules = economyRules(content);
  const cost = count === 10 ? rules.tenPullCost : rules.singlePullCost;
  if (!Number.isSafeInteger(campaign.prisma) || campaign.prisma < cost) throw new Error('Không đủ Prisma.');
  const next = structuredClone(campaign);
  next.prisma -= cost;
  next.gacha.pity ??= {};
  const pityCount = next.gacha.pity[bannerId] ?? 0;
  if (!Number.isSafeInteger(pityCount) || pityCount < 0 || (banner.pity && pityCount >= banner.pity.characterAt)) throw new Error('Bộ đếm pity không hợp lệ.');
  const results = [];
  for (let index = 0; index < count; index += 1) {
    next.gacha.totalPulls = checkedAdd(next.gacha.totalPulls, 1);
    const guaranteed = Boolean(banner.pity && (next.gacha.pity[bannerId] ?? 0) >= banner.pity.characterAt - 1);
    const character = guaranteed || roll(random) >= banner.gearWeight / (banner.gearWeight + banner.characterWeight);
    if (character) {
      const characterId = banner.characterPool[Math.floor(roll(random) * banner.characterPool.length)];
      results.push({ kind: 'character', ...grantCharacterCopy(next, content, characterId), guaranteed });
      if (banner.pity) next.gacha.pity[bannerId] = 0;
    } else {
      const type = content.gearTypes[weighted(banner.gearRates, random).typeId];
      const pool = [...rules.gearStats];
      const stats = {};
      for (let slot = 0; slot < type.statCount; slot += 1) {
        const [definition] = pool.splice(Math.floor(roll(random) * pool.length), 1);
        stats[definition.stat] = definition.scale * type.points;
      }
      const gear = { id: `gear_${next.gacha.totalPulls}`, typeId: type.id, stats };
      next.gear.push(gear);
      results.push({ kind: 'gear', gear: structuredClone(gear) });
      if (banner.pity) next.gacha.pity[bannerId] = (next.gacha.pity[bannerId] ?? 0) + 1;
    }
  }
  next.gacha.lastSummon = { id: `summon_${next.gacha.totalPulls}`, bannerId, results: structuredClone(results) };
  return { campaign: next, results };
}

export function recruitCharacter(campaign, content, bannerId, id) {
  const banner = Object.hasOwn(content.banners, bannerId) ? content.banners[bannerId] : null;
  if (!banner?.characterPool.includes(id) || ownsCharacter(campaign, id)) throw new Error('Nhân vật không thể chiêu mộ.');
  const cost = economyRules(content).recruitCost;
  if (!Number.isSafeInteger(campaign.recruitmentShards) || campaign.recruitmentShards < cost) throw new Error('Không đủ Pure Prisma.');
  const next = structuredClone(campaign);
  next.recruitmentShards -= cost;
  unlockCharacter(next, content, id);
  return next;
}
