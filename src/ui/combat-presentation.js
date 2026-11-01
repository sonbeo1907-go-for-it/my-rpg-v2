import {resolveRankedAbility} from '../core/skill-resolver.js';
import {exclusiveDamageEffect} from '../core/exclusive-hooks.js';
import { formulaSnapshot, formulaDamage } from '../core/formula-field.js';
import { scalingValue, scalingLabel } from '../core/scaling.js';
import { targetsAsGroup, resourceCost, debuffTypeCount, debuffDamageBonus, buffTypeCount, buffDamageBonus, lowHpDamageBonus } from '../core/conditional-combat.js';
import { targetsFor, selectedTargets } from '../core/battle.js';
import { damageMultiplier, supportAmount, speedDamageRatio } from '../core/combat-math.js';
import { battleStat } from '../core/stat-values.js';
import { skillBaseStatBonuses } from '../core/turn-order.js';
import { skillPresentation } from './skill-copy.js';
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
  const allyId = skill?.target === 'self' && actor?.team === 'party' ? actor.id : skill?.target==='adjacent_allies' && !legal.some(item=>item.id===rememberedAlly) ? legal[0]?.id??rememberedAlly : rememberedAlly;
  const targetId = skill?.target === 'self' ? actor?.id ?? '' : ['ally', 'all_allies', 'adjacent_allies'].includes(skill?.target) ? allyId : enemyId;
  return { allyId, rememberedAlly, enemyId, targetId, legalIds: legal.map(item => item.id), affectedIds: actor && skill ? selectedTargets(battle,actor,skill,targetId).map(item=>item.id) : [] };
}
export function liveSkillChoices(skill, actor, target, battle) {
  const cost = resourceCost(skill,actor);
  const effect = skill.effects.find(item => item.consumeStatus);
  const legal = battle ? targetsFor(battle,actor,skill) : [];
  const selected = battle ? selectedTargets(battle,actor,skill,target?.id) : [];
  const theorem=battle && skill.effects.some(effect=>effect.formulaScaling)?formulaSnapshot(battle,actor):null;
  const baseStatBonuses=battle?skillBaseStatBonuses(battle,actor,skill,selected):{};
  if(theorem?.baseMagic) baseStatBonuses.magic=(baseStatBonuses.magic??0)+theorem.baseMagic;
  return { live: true, formulaCorrect:theorem?.correct??0,formulaContributors:theorem?.contributors??0,debuffCount: battle ? debuffTypeCount(battle.content,target) : 0,buffCount:battle?buffTypeCount(battle.content,target):0, baseStatBonuses, spent: cost ? cost.all ? actor.resourceValues?.[cost.id] ?? 0 : cost.amount ?? 0 : 0,
    stacks: effect ? target?.statuses?.find(status => status.id === effect.consumeStatus)?.stacks ?? 0 : 0,
    hpPercent: actor.hp / actor.stats.maxHp * 100,
    fieldStacks: actor.statuses?.find(status => status.id === actor.passive?.statusId)?.growth ?? 0 };
}
export function compactSkillScaling(skill, actor, target, content, battle) {
  skill=resolveRankedAbility(content,actor,skill);
  const choices = liveSkillChoices(skill, actor, target, battle ? {...battle,content} : undefined);
  const parts = [];
  for (const authoredEffect of skill.effects) {
    const effect=exclusiveDamageEffect(actor,skill.id,formulaDamage(authoredEffect,{correct:choices.formulaCorrect}));
    if (effect.type === 'damage') {
      const label = scalingLabel(effect,statNames);
      const multiplier = damageMultiplier(effect, { spent: choices.spent, stacks: choices.stacks, hpRatio: actor.hp / actor.stats.maxHp,buffs:choices.buffCount });
      let line = `${effect.hits > 1 ? `${effect.hits} × ` : ''}${percent(multiplier)} ${label}`;
      if (effect.primaryMultiplier!==undefined) line=`${percent(effect.primaryMultiplier)} ${label} chính / ${percent(effect.multiplier)} ${label} ${skill.target==='enemy_splash'?'ô kề':'còn lại'}`;
      const speed = speedDamageRatio(actor, effect.damageType, effect.speedMultiplier ?? 0);
      if (speed) line += ` + ${percent(speed)} SPD`;
      parts.push(line);
      if(effect.formulaScaling && choices.formulaCorrect===3)parts.push('Xuyên '+percent(effect.penetration)+' RES');
    } else if (effect.type === 'heal' || effect.type === 'shield') {
      const label = scalingLabel(effect,statNames);
      const formula = [effect.multiplier ? `${percent(effect.multiplier)} ${label}` : '', effect.flat ? effect.flat : ''].filter(Boolean).join(' + ');
      const amount = supportAmount(effect, scalingValue(effect,key=>battleStat(content, actor, key)), Boolean(target && target.hp / target.stats.maxHp <= .35));
      parts.push(`${formula || '0'} → ${amount} ${effect.type === 'shield' ? 'khiên' : 'HP'}${effect.durationRounds?' · '+effect.durationRounds+' vòng':''}`);
    } else if (effect.type === 'status' || effect.type === 'toggle_status') {
      const status = content.statuses[effect.status];
      const modifiers = Object.entries(effect.appliedModifiers ?? status.modifiers ?? {}).map(([key, value]) => key === 'attackMultiplier' ? `Đòn kế ×${value}` : key === 'damageVsShielded' ? `Địch có khiên: ST ×${compactNumber(1+Number(value))}` : `${Number(value) >= 0 ? '+' : '−'}${percent(Math.abs(Number(value)))} ${statNames[key] ?? key}`);
      parts.push(...modifiers);
      for (const id of effect.linkedStatuses??[]) parts.push(content.statuses[id].name);
      if (status.taunt) parts.push('Khiêu khích');
      if (status.cover) parts.push('Đỡ đòn thay');
      if (status.effectImmunity) parts.push(`Chặn ${status.effectImmunity.charges} hiệu ứng`);
      if (status.regen) parts.push(`Hồi ${percent(status.regen)} HP/lượt`);
      if (status.turnStartAbility) parts.push(`Tạo ${status.name}`);
      if (status.damageOverTime) parts.push(`${status.name} · ${effect.duration} lượt`);
      if (!modifiers.length && !status.taunt && !status.cover && !status.effectImmunity && !status.regen && !status.turnStartAbility && !status.damageOverTime) parts.push(status.name);
    } else if (effect.type === 'resource') parts.push(effect.maxMpRatio ? `Hồi ${percent(effect.maxMpRatio)} MP` : `+${effect.amount} ${effect.resource === 'mp' ? 'MP' : actor.resources?.[effect.resource]?.name ?? effect.resource}`);
    else if (['enter_mode','prepare_mode'].includes(effect.type)) {parts.push((effect.type==='prepare_mode'?'Đầu vòng sau: ':'Triển khai ')+actor.combatModes[effect.mode].name);if(effect.followUpBonus!==undefined)parts.push('Liên kích '+percent(content.abilities[actor.passive.followUpAbility].effects[0].multiplier+effect.followUpBonus)+' MAG / '+actor.passive.modePerRound+' lần mỗi vòng') ;}
    else if (effect.type==='summon_companion') parts.push('Đầu vòng sau: '+actor.companions[effect.companion].name+' · '+actor.companions[effect.companion].durationRounds+' vòng');
    else if (effect.type === 'turn_order_field') parts.push('Ưu tiên lượt đồng minh · '+effect.durationRounds+' vòng');
    else if (effect.type === 'grant_extra_turn') parts.push(skill.target==='adjacent_allies'?'+1 Lượt Thêm / ô kề':'+1 Lượt Thêm');
    else if (effect.type === 'formula_field') parts.push('Đại Đồ Thức · '+effect.durationRounds+' vòng');
    else if (effect.type === 'edit_formula') parts.push('Đổi chỗ / viết lại dấu');
    else if(effect.type==='dispel')parts.push('Xóa '+(effect.all?'toàn bộ':effect.count)+' buff địch');
    else if (effect.type === 'cleanse') parts.push('Giải hiệu ứng bất lợi');
  }
  for (const [key,amount] of Object.entries(choices.baseStatBonuses)) parts.push('+'+amount+' '+statNames[key]+' căn bản');
  if(skill.target==='random_enemies')parts.push('mục tiêu ngẫu nhiên');
  if(actor.passive?.type==='shielded_damage_bonus' && actor.shield>0 && skill.effects.some(effect=>effect.type==='damage'))parts.push('+'+percent(actor.passive.ratio)+' ST từ khiên');
  if(actor.passive?.type==='target_debuff_damage' && skill.effects.some(effect=>effect.type==='damage'))parts.push('+'+percent(debuffDamageBonus(actor.passive,choices.debuffCount))+' ST theo debuff');
  if(actor.passive?.type==='target_buff_damage'&&skill.effects.some(e=>e.type==='damage'))parts.push('+'+percent(buffDamageBonus(actor.passive,choices.buffCount))+' ST theo buff địch');
  if(actor.passive?.type==='low_hp_damage'&&skill.effects.some(e=>e.type==='damage'))parts.push('+'+percent(lowHpDamageBonus(actor.passive,actor.hp/actor.stats.maxHp))+' ST từ HP đã mất');
  const damageCount = skill.effects.filter(effect => effect.type === 'damage').length;
  return parts.join(damageCount > 1 && parts.length === damageCount ? ' + ' : ' · ');
}
export function combatSkillDetails(skill, actor, target, content) {
  return skillScaling(skill, actor, content, liveSkillChoices(skill, actor, target));
}
export function statusDetails(status, actor, battle, content) {
  const definition = content.statuses[status.id];
  const source = battle.actors.find(item => item.id === status.sourceId) ?? battle.sourceActors?.find(item => item.id === status.sourceId) ?? actor;
  const presentation = skillPresentation({ target: 'self', effects: [{ type: 'status', status: status.id, appliedModifiers:status.appliedModifiers, ...(status.remaining !== null ? { duration: status.remaining } : {}) }] }, source, content, { live: true, statusCharges: status.charges });
  const lines = [...presentation.facts, ...presentation.rules];
  if (status.potency !== undefined) {
    const index = lines.findIndex(line => line.startsWith('Độc:'));
    if (index >= 0) lines[index] = `Độc đã ghi nhận: ${status.potency * (status.stacks ?? 1)} HP mỗi đầu lượt · còn ${status.remaining} lần.`;
  }
  if (status.growth !== undefined) lines.push(`Đã tích ${status.growth} tầng nội tại đám mây.`);
  if (definition.exposedElement) lines.push(`Còn ${status.stacks} tầng Sơ hở.`);
  return { source: source.name, duration: definition.effectImmunity ? `${status.charges} lần chặn còn lại` : status.remaining === null ? definition.exposedElement ? 'Đến khi hết tầng hoặc bị giải' : definition.consumeOnAttack ? 'Đến đòn tấn công kế tiếp' : definition.expiresOnShieldGain ? 'Đến khi nhận khiên mới' : 'Duy trì' : definition.durationClock === "round" ? `${status.remaining} vòng, tính cả vòng hiện tại` : `${status.remaining} lượt${definition.durationClock === "main_turn" ? " chính" : ""} của người mang`, lines };
}
