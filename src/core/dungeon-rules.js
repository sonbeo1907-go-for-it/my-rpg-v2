import {trainingChargeState} from './training-charges.js';
import { enemyStatMultipliers } from "./enemy-scaling.js";
export const DUNGEON_TIME_ZONE = "Asia/Ho_Chi_Minh";
export function dungeonDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: DUNGEON_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const field = (name) => parts.find((part) => part.type === name).value;
  return `${field("year")}-${field("month")}-${field("day")}`;
}
export function nextDungeonReset(now = new Date()) {
  const [year, month, day] = dungeonDay(now).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1) - 7 * 60 * 60 * 1000);
}
export function validateDungeonContent(content) {
  const errors = [];
  for (const dungeon of Object.values(content.dungeons ?? {})) {
    if (
      !/^\/art\/[a-z0-9-]+\.svg$/.test(dungeon.art) ||
      typeof dungeon.name !== "string" ||
      !Array.isArray(dungeon.difficulties)
    ) {
      errors.push(`Invalid dungeon ${dungeon.id}`);
      continue;
    }
    if (dungeon.closed === true) {
      if (dungeon.difficulties.length)
        errors.push(`Closed dungeon has difficulties ${dungeon.id}`);
      continue;
    }
    if (!Number.isSafeInteger(dungeon.dailyLimit) || dungeon.dailyLimit < 1)
      errors.push(`Invalid daily limit ${dungeon.id}`);
    if (
      dungeon.encounterTier !== undefined &&
      !["normal", "boss"].includes(dungeon.encounterTier)
    )
      errors.push(`Invalid dungeon pool ${dungeon.id}`);
    if (
      dungeon.revealRooms !== undefined &&
      typeof dungeon.revealRooms !== "boolean"
    )
      errors.push(`Invalid dungeon reveal ${dungeon.id}`);
    if (
      dungeon.stageLabel !== undefined &&
      (typeof dungeon.stageLabel !== "string" || !dungeon.stageLabel.trim())
    )
      errors.push(`Invalid dungeon stage label ${dungeon.id}`);
    if(dungeon.recharge&&(dungeon.id!=="training_grounds"||dungeon.dailyLimit!==9||dungeon.recharge.capacity!==9||dungeon.recharge.amount!==3||dungeon.recharge.hours!==8||dungeon.recharge.initial!==9))errors.push("Invalid recharge rule "+dungeon.id);
    const ids = new Set();
    for (const difficulty of dungeon.difficulties) {
      if (
        !["easy", "medium", "hard"].includes(difficulty.id) ||
        ids.has(difficulty.id) ||
        typeof difficulty.enabled !== "boolean"
      )
        errors.push(`Invalid dungeon difficulty ${dungeon.id}`);
      ids.add(difficulty.id);
      if(difficulty.enemyLevel!==undefined&&(!Number.isInteger(difficulty.enemyLevel)||difficulty.enemyLevel<1||difficulty.enemyLevel>60))errors.push("Invalid dungeon enemy level "+dungeon.id);
      const rewards = Object.entries(difficulty.reward ?? {});
      const expectedReward={gold_mine:'coins',dangerous:'recruitmentShards',training_grounds:'characterXp',breakthrough_trial:'limitBreakStones'}[dungeon.id];
      if(expectedReward&&!Object.hasOwn(difficulty.reward??{},expectedReward))errors.push('Invalid reward kind '+dungeon.id);
      if (
        rewards.length !== 1 ||
        rewards.some(
          ([key, value]) =>
            !["coins", "recruitmentShards", "characterXp", "limitBreakStones"].includes(key) ||
            !Number.isSafeInteger(value) ||
            value <= 0,
        )
      )
        errors.push(`Invalid dungeon reward ${dungeon.id}`);
      if (
        difficulty.enabled &&
        (!Number.isSafeInteger(difficulty.waves) ||
          difficulty.waves < 1 ||
          difficulty.waves > 20)
      )
        errors.push(`Invalid dungeon waves ${dungeon.id}`);
      if (difficulty.enabled) {
        try {
          if (
            difficulty.enemyScale == null ||
            Object.values(enemyStatMultipliers(difficulty.enemyScale)).some(
              (factor) => factor < 1,
            )
          )
            throw new Error("Invalid scale");
        } catch {
          errors.push(`Invalid dungeon scaling ${dungeon.id}`);
        }
      }
    }
    if (ids.size !== 3)
      errors.push(`Dungeon requires three difficulties ${dungeon.id}`);
  }
  return errors;
}
export function normalizeDungeonDaily(input, content) {
  if (input === undefined) return { day: null, clears: {} };
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    !input.clears ||
    typeof input.clears !== "object" ||
    Array.isArray(input.clears)
  )
    throw new Error("Dữ liệu lượt hầm ngục không hợp lệ.");
  const day = input.day;
  if (
    day !== null &&
    (typeof day !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
      !Number.isFinite(Date.parse(`${day}T00:00:00Z`)) ||
      new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) !== day)
  )
    throw new Error("Ngày hầm ngục không hợp lệ.");
  for (const [id, count] of Object.entries(input.clears)) {
    const definition = Object.hasOwn(content.dungeons ?? {}, id)
      ? content.dungeons[id]
      : null;
    if (
      !definition ||
      !definition.dailyLimit ||
      definition.recharge ||
      !Number.isSafeInteger(count) ||
      count < 0 ||
      count > definition.dailyLimit ||
      day === null
    )
      throw new Error("Số lượt hầm ngục không hợp lệ.");
  }
  return { day, clears: { ...input.clears } };
}
export function dungeonDailyState(campaign, content, id, now = new Date()) {
  const definition = content.dungeons[id];
  if(definition?.recharge)return trainingChargeState(campaign,now);
  if (!definition?.dailyLimit) return { used: 0, remaining: null, limit: null };
  const ledger = campaign.dungeonDaily ?? { day: null, clears: {} };
  const today = dungeonDay(now);
  // Moving the device clock backwards never creates a second reset.
  const used = ledger.day && today <= ledger.day ? (ledger.clears[id] ?? 0) : 0;
  return {
    used,
    remaining: Math.max(0, definition.dailyLimit - used),
    limit: definition.dailyLimit,
  };
}
