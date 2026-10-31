import { enemyStatMultipliers } from "../core/enemy-scaling.js";
import { STAT_LABELS } from "../core/catalog.js";

export function enemyScaleSummary(scale) {
  const entries = Object.entries(enemyStatMultipliers(scale)).filter(
    ([, factor]) => factor !== 1,
  );
  return entries.length
    ? entries
        .map(
          ([key, factor]) =>
            `${STAT_LABELS[key]} ×${factor.toLocaleString("vi-VN")}`,
        )
        .join(" · ")
    : "Chỉ số gốc";
}

export function dungeonRewardText(reward) {
  if(reward.characterXp)return `${reward.characterXp} XP / nhân vật`;
  if(reward.limitBreakStones)return `${reward.limitBreakStones} Tinh Thạch Phá Giới`;
  return reward.coins
    ? `${reward.coins} coin`
    : `${reward.recruitmentShards} Pure Prisma`;
}
