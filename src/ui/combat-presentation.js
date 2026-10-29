import { targetsFor } from '../core/battle.js';
import { damageMultiplier, supportAmount, speedDamageRatio } from '../core/combat-math.js';
import { battleStat } from '../core/stat-values.js';
import { skillScaling } from './skill-presentation.js';

export const compactNumber = value => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value);
const percent = value => `${compactNumber(value * 100)}%`;
const statNames = { attack: 'ATK', magic: 'MAG', defense: 'DEF', resistance: 'RES', speed: 'SPD', evasion: 'né vật lí', damageBonus: 'sát thương', damageReduction: 'giảm sát thương' };

export function resolveCombatTargets(battle, actor, skill, selection = {}) {
  const allies = battle.actors.filter(item => item.team === 'party' && item.hp > 0);
  const enemies = battle.actors.filter(item => item.team === 'enemy' && item.hp > 0);
  const rememberedAlly = allies.find(item => item.id === selection.allyId)?.id ?? allies[0]?.id ?? '';
  let enemyId = enemies.find(item => item.id === selection.enemyId)?.id ?? enemies[0]?.id ?? '';
  const legal = actor && skill && !battle.outcome ? targetsFor(battle, actor, skill) : [];
  // Taunt restricts single-target enemy selection. AoE keeps the chosen anchor.
  if (skill?.target === 'enemy' && legal.length && !legal.some(item => item.id === enemyId)) enemyId = legal[0].id;
  const allyId = skill?.target === 'self' && actor?.team === 'party' ? actor.id : rememberedAlly;
  const targetId = skill?.target === 'self' ? actor?.id ?? '' : ['ally', 'all_allies'].includes(skill?.target) ? allyId : enemyId;
  return { allyId, rememberedAlly, enemyId, targetId, legalIds: legal.map(item => item.id), affectedIds: skill?.target?.startsWith('all_') ? legal.map(item => item.id) : [targetId].filter(Boolean) };
}
export function liveSkillChoices(skill, actor, target) {
  const cost = skill.cost?.resource;
  const effect = skill.effects.find(item => item.consumeStatus);
  return { live: true, spent: cost ? cost.all ? actor.resourceValues?.[cost.id] ?? 0 : cost.amount ?? 0 : 0,
    stacks: effect ? target?.statuses?.find(status => status.id === effect.consumeStatus)?.stacks ?? 0 : 0,
    hpPercent: actor.hp / actor.stats.maxHp * 100,
    fieldStacks: actor.statuses?.find(status => status.id === actor.passive?.statusId)?.growth ?? 0 };
}
export function compactSkillScaling(skill, actor, target, content) {
  const choices = liveSkillChoices(skill, actor, target);
  const parts = [];
  for (const effect of skill.effects) {
    if (effect.type === 'damage') {
      const label = effect.damageType === 'physical' ? 'ATK' : 'MAG';
      const multiplier = damageMultiplier(effect, { spent: choices.spent, stacks: choices.stacks, hpRatio: actor.hp / actor.stats.maxHp });
      let line = `${effect.hits > 1 ? `${effect.hits} × ` : ''}${percent(multiplier)} ${label}`;
      const speed = speedDamageRatio(actor, effect.damageType, effect.speedMultiplier ?? 0);
      if (speed) line += ` + ${percent(speed)} SPD`;
      parts.push(line);
    } else if (effect.type === 'heal' || effect.type === 'shield') {
      const key = effect.scalingStat ?? 'magic';
      const formula = [effect.multiplier ? `${percent(effect.multiplier)} ${statNames[key]}` : '', effect.flat ? effect.flat : ''].filter(Boolean).join(' + ');
      const amount = supportAmount(effect, battleStat(content, actor, key), Boolean(target && target.hp / target.stats.maxHp <= .35));
      parts.push(`${formula || '0'} → ${amount} ${effect.type === 'shield' ? 'khiên' : 'HP'}`);
    } else if (effect.type === 'status' || effect.type === 'toggle_status') {
      const status = content.statuses[effect.status];
      const modifiers = Object.entries(status.modifiers ?? {}).map(([key, value]) => key === 'attackMultiplier' ? `Đòn kế ×${value}` : key === 'damageVsShielded' ? `+${percent(value)} ST lên khiên` : `${Number(value) >= 0 ? '+' : '−'}${percent(Math.abs(Number(value)))} ${statNames[key] ?? key}`);
      parts.push(...modifiers);
      if (status.taunt) parts.push('Khiêu khích');
      if (status.cover) parts.push('Đỡ đòn thay');
      if (status.effectImmunity) parts.push(`Chặn ${status.effectImmunity.charges} debuff`);
      if (status.regen) parts.push(`Hồi ${percent(status.regen)} HP/lượt`);
      if (status.turnStartAbility) parts.push(`Tạo ${status.name}`);
      if (status.damageOverTime) parts.push(`${status.name} · ${effect.duration} lượt`);
      if (!modifiers.length && !status.taunt && !status.cover && !status.effectImmunity && !status.regen && !status.turnStartAbility && !status.damageOverTime) parts.push(status.name);
    } else if (effect.type === 'resource') parts.push(effect.maxMpRatio ? `Hồi ${percent(effect.maxMpRatio)} MP` : `+${effect.amount} ${effect.resource === 'mp' ? 'MP' : actor.resources?.[effect.resource]?.name ?? effect.resource}`);
    else if (effect.type === 'cleanse') parts.push('Giải hiệu ứng bất lợi');
  }
  const damageCount = skill.effects.filter(effect => effect.type === 'damage').length;
  return parts.join(damageCount > 1 && parts.length === damageCount ? ' + ' : ' · ');
}
export function combatSkillDetails(skill, actor, target, content) {
  return skillScaling(skill, actor, content, liveSkillChoices(skill, actor, target));
}
export function statusDetails(status, actor, battle, content) {
  const definition = content.statuses[status.id];
  const source = battle.actors.find(item => item.id === status.sourceId) ?? battle.sourceActors?.find(item => item.id === status.sourceId) ?? actor;
  const lines = skillScaling({ target: 'self', effects: [{ type: 'status', status: status.id, ...(status.remaining !== null ? { duration: status.remaining } : {}) }] }, source, content, { live: true });
  if (status.potency !== undefined) {
    const index = lines.findIndex(line => line.startsWith('Độc:'));
    if (index >= 0) lines[index] = `Độc đã ghi nhận: ${status.potency} HP mỗi đầu lượt · còn ${status.remaining} lần.`;
  }
  if (status.growth !== undefined) lines.push(`Đã tích ${status.growth} tầng nội tại đám mây.`);
  return { source: source.name, duration: definition.effectImmunity ? `${status.charges} lần chặn còn lại` : status.remaining === null ? definition.consumeOnAttack ? 'Đến đòn tấn công kế tiếp' : definition.expiresOnShieldGain ? 'Đến khi nhận khiên mới' : 'Duy trì' : `${status.remaining} lượt của người mang`, lines };
}
