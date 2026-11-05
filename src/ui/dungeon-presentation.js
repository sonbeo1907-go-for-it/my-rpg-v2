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
  const parts=[];
  if(reward.characterXp)parts.push(`${reward.characterXp} XP / nhân vật`);
  if(reward.limitBreakStones)parts.push(`${reward.limitBreakStones} Tinh Thạch Phá Giới`);
  if(reward.coins)parts.push(`${reward.coins} coin`);
  if(reward.recruitmentShards)parts.push(`${reward.recruitmentShards} Pure Prisma`);
  for(const [field,label]of [['xpBooksGreen','I'],['xpBooksBlue','II'],['xpBooksPurple','III']])if(reward[field])parts.push(`${reward[field]} Nhật kí hành trình ${label}`);
  return parts.join(' · ');
}
