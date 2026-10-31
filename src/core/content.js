import {validateSummonDefinition} from './summon-rules.js';
import { validateEconomyContent } from './economy.js';
import { validateBossDefinition } from './boss-mechanics.js';
import { validateDungeonContent } from './dungeon-rules.js';
import { validateBlacksmithContent } from './blacksmith-rules.js';
import { validReactivePassive } from './reactive-passives.js';
import { validateTravelerStories } from './traveler-stories.js';

export const ELEMENTS = ['plain', 'fire', 'water', 'earth', 'wind', 'thunder', 'light', 'dark'];
export const ELEMENT_NAMES = { plain: 'Thường', fire: 'Hỏa', water: 'Thủy', earth: 'Thổ', wind: 'Phong', thunder: 'Lôi', light: 'Quang', dark: 'Ám' };
export const DAMAGE_TYPE_NAMES = { physical: 'vật lí', magical: 'ma pháp' };
export const WEAKNESS_MULTIPLIER = 1.5;
export const ROLE_GROUPS = {
  physical_dps: 'DPS vật lí', magical_dps: 'DPS ma pháp',
  offensive_support: 'Hỗ trợ tấn công', defensive_support: 'Hỗ trợ phòng thủ',
  tank: 'Thủ Hộ', fighter: 'Đấu sĩ', sorcerer: 'Thuật Sư'
};
export const EFFECT_TYPES = ['damage', 'heal', 'shield', 'status', 'toggle_status', 'resource', 'cleanse', 'grant_extra_turn', 'enter_mode', 'turn_order_field', 'formula_field', 'edit_formula', 'end_formula', 'prepare_mode', 'summon_companion', 'dispel'];

export function indexById(items) {
  return Object.fromEntries(items.map(item => [item.id, item]));
}

// Validate references before running a game, rather than failing midway through a battle.
export function validateContent(content) {
  const errors = [];
  const fail = message => errors.push(message);
  const exists = (collection, id, where) => {
    if (!content[collection] || typeof id !== 'string' || !Object.hasOwn(content[collection], id)) fail(`${where}: unknown ${collection} id "${id}"`);
  };
  for (const key of ['characters', 'abilities', 'statuses', 'upgrades', 'enemies', 'encounters', 'music']) {
    if (!content[key] || typeof content[key] !== 'object') fail(`Missing collection: ${key}`);
  }
  if (errors.length) return errors;
  for (const [id, actor] of Object.entries({ ...content.characters, ...content.enemies })) {
    if (!ELEMENTS.includes(actor.element)) fail(`${id}: invalid element`);
    if (actor.basicAttack !== undefined && (!Array.isArray(actor.basicAttack) || !actor.basicAttack.length || actor.basicAttack.some(effect => !effect
      || effect.type !== 'damage' || !['physical', 'magical'].includes(effect.damageType) || !ELEMENTS.includes(effect.element)
      || (effect.scalingStat !== undefined && !['attack','magic','defense','resistance'].includes(effect.scalingStat))
      || !Number.isFinite(effect.multiplier) || effect.multiplier <= 0
      || Object.keys(effect).some(key => !['type', 'damageType', 'element', 'multiplier', 'scalingStat'].includes(key))))) fail(`${id}: invalid basic attack`);
    if (actor.roleGroup !== undefined && !Object.hasOwn(ROLE_GROUPS, actor.roleGroup)) fail(`${id}: invalid role group`);
    if (actor.tags !== undefined && (!Array.isArray(actor.tags) || new Set(actor.tags).size !== actor.tags.length || actor.tags.some(tag => typeof tag !== 'string' || !tag))) fail(`${id}: invalid tags`);
    if (actor.secondaryRoleGroups !== undefined && (!Array.isArray(actor.secondaryRoleGroups) || actor.secondaryRoleGroups.some(group => !Object.hasOwn(ROLE_GROUPS, group)))) fail(`${id}: invalid secondary role groups`);
    for (const stat of ['maxHp', 'maxMp', 'attack', 'magic', 'defense', 'resistance', 'speed']) {
      if (!Number.isFinite(actor.stats?.[stat]) || actor.stats[stat] < (stat === 'maxHp' ? 1 : 0)) fail(`${id}: invalid ${stat}`);
    }
    for (const skill of actor.abilities ?? []) {
      exists('abilities', skill, id);
      if (content.abilities[skill]?.activation === 'passive') fail(`${id}: passive ability ${skill} cannot be an active command`);
    }
    if (!actor.abilities?.length) fail(`${id}: requires abilities`);
    for (const [resource, definition] of Object.entries(actor.resources ?? {})) {
      if (!Number.isInteger(definition.max) || definition.max < 1) fail(`${id}: invalid resource ${resource}`);
    }
    for (const [element, multiplier] of Object.entries(actor.resistances ?? {})) {
      if (!ELEMENTS.includes(element) || !Number.isFinite(multiplier) || multiplier < 0) fail(`${id}: invalid resistance ${element}`);
    }
    if (actor.weaknesses !== undefined) {
      if (!Array.isArray(actor.weaknesses)) fail(`${id}: weaknesses must be an array`);
      else {
        for (const element of actor.weaknesses) if (!ELEMENTS.includes(element)) fail(`${id}: invalid weakness ${element}`);
        if (new Set(actor.weaknesses).size !== actor.weaknesses.length) fail(`${id}: duplicate weakness`);
      }
    }
    if (actor.damageTypeWeaknesses !== undefined) {
      if (!Array.isArray(actor.damageTypeWeaknesses)) fail(`${id}: damageTypeWeaknesses must be an array`);
      else {
        for (const type of actor.damageTypeWeaknesses) if (typeof type !== 'string' || !Object.hasOwn(DAMAGE_TYPE_NAMES, type)) fail(`${id}: invalid damage type weakness`);
        if (new Set(actor.damageTypeWeaknesses).size !== actor.damageTypeWeaknesses.length) fail(`${id}: duplicate damage type weakness`);
      }
    }
    if (actor.passive?.type && !['damage_reduction', 'shield_break_heal', 'dodge_counter', 'magic_followup_mp', 'stat_boost', 'speed_damage', 'resource_stat_boost', 'shield_break_status', 'shield_break_attack_buff', 'field_growth', 'team_flat_self', 'team_flat_aura', 'end_turn_mp_regen', 'extra_mp_damage', 'marked_ally_magic', 'hp_difference_damage', 'ally_heal_mp', 'stat_conversion', 'end_round_lowest_mp', 'buffed_ally_mp', 'combat_mode', 'later_target_base_stat', 'kill_mp_discount', 'target_debuff_damage', 'end_round_team_mp', 'shield_break_mp', 'shielded_damage_bonus', 'debuff_received_heal', 'formula_scholar', 'dot_potency_bonus', 'attack_status', 'shield_survival_followup', 'low_hp_damage', 'target_buff_damage', 'ally_skill_counter', 'detonation_base_growth'].includes(actor.passive.type)) fail(`${id}: invalid passive`);
    const native = actor.passive;
    if (native?.type==='detonation_base_growth' && !validReactivePassive(native,content,actor)) fail(id+': invalid detonation growth');
    if (native?.type==='low_hp_damage' && (!native.name||!native.description||!Number.isFinite(native.ratio)||native.ratio<=0||native.ratio>1)) fail(id+': invalid low HP damage');
    if (native?.type==='target_buff_damage' && (!native.name||!native.description||!Number.isFinite(native.ratio)||native.ratio<=0||!Number.isFinite(native.cap)||native.cap<=0||native.cap>2)) fail(id+': invalid target buff damage');
    if (native?.type==='ally_skill_counter') {const a=content.abilities[native.counterAbility];if(!native.name||!native.description||native.oncePerRound!==true||a?.activation!=='passive'||a.target!=='enemy'||a.cost||a.cooldown||!a.effects?.length||a.effects.some(e=>e.type!=='damage'))fail(id+': invalid ally skill counter');}
    if (native?.type === 'formula_scholar' && (!native.name || !native.description || !Number.isInteger(native.amount) || native.amount<1 || native.amount>10 || !Number.isInteger(native.maxSources) || native.maxSources<1 || native.maxSources>3)) fail(id+': invalid formula scholar');
    if (native?.type === 'shielded_damage_bonus' && (!native.name || !native.description || !Number.isFinite(native.ratio) || native.ratio<=0 || native.ratio>1)) fail(id+': invalid shielded damage bonus');
    if (native?.type === 'debuff_received_heal' && (!native.name || !native.description || !Number.isFinite(native.multiplier) || native.multiplier<=0 || native.multiplier>2 || native.oncePerRecipientPerRound!==true)) fail(id+': invalid debuff healing passive');
    if (native?.type === 'end_round_team_mp' && (!native.name || !native.description || !Number.isFinite(native.ratio) || native.ratio<=0 || native.ratio>1)) fail(id+': invalid team MP regeneration');
    if (native?.type === 'shield_break_mp' && (!native.name || !native.description || !Number.isFinite(native.multiplier) || native.multiplier<=0 || native.multiplier>1 || native.oncePerRecipientPerRound!==true || !Array.isArray(native.scalingStats) || !native.scalingStats.length || new Set(native.scalingStats).size!==native.scalingStats.length || native.scalingStats.some(key=>!['defense','resistance'].includes(key)))) fail(id+': invalid shield MP passive');
    if (native?.type === 'kill_mp_discount') {
      exists('statuses',native.statusId,id);
      const status=content.statuses[native.statusId];
      if (!native.name || !native.description || !Number.isFinite(native.ratio) || native.ratio<=0 || native.ratio>=1 || !status?.persistent || status.kind!=='buff' || status.mpCostReduction!==native.ratio) fail(id+': invalid kill MP discount');
    }
    if (native?.type === 'target_debuff_damage' && (!native.name || !native.description || !Number.isFinite(native.ratio) || native.ratio<=0 || !Number.isFinite(native.cap) || native.cap<native.ratio || native.cap>3)) fail(id+': invalid debuff damage passive');
    if (native?.type==='dot_potency_bonus' && (!native.name || !native.description || !Number.isFinite(native.ratio) || native.ratio<=0 || native.ratio>1 || !Array.isArray(native.statusIds) || !native.statusIds.length || new Set(native.statusIds).size!==native.statusIds.length || native.statusIds.some(key=>!content.statuses[key]?.damageOverTime))) fail(id+': invalid periodic damage passive');
    if (native?.type==='attack_status' && (!native.name || !native.description || content.statuses[native.statusId]?.kind!=='debuff' || !Number.isInteger(native.duration) || native.duration<1)) fail(id+': invalid attack status passive');
    if (native?.type==='shield_survival_followup') {
      const follow=content.abilities[native.followUpAbility];
      if (!native.name || !native.description || native.oncePerRound!==true || follow?.activation!=='passive' || follow.target!=='all_enemies' || follow.cost || follow.cooldown || !follow.effects?.length || follow.effects.some(effect=>effect.type!=='damage')) fail(id+': invalid shield survival follow-up');
    }
    if (native?.type === 'later_target_base_stat' && (!native.name || !native.description || !['attack','magic'].includes(native.stat) || !Number.isFinite(native.amount) || native.amount <= 0)) fail(id + ': invalid turn-order passive');
    if (native?.type === 'damage_reduction' && (!Number.isFinite(native.amount) || native.amount<0 || native.amount>1 || (native.requiresStatus !== undefined && !Object.hasOwn(content.statuses,native.requiresStatus)))) fail(`${id}: invalid conditional damage reduction`);
    if (native?.type === 'buffed_ally_mp' && !validReactivePassive(native,content,actor)) fail(`${id}: invalid reactive passive`);
    if (native?.type === 'dodge_counter' && native.counterAbility && !validReactivePassive({...native,name:native.name ?? 'Phản kiếm'},content,actor)) fail(`${id}: invalid counter ability`);
    if (['extra_mp_damage','marked_ally_magic','hp_difference_damage','ally_heal_mp','stat_conversion','end_round_lowest_mp'].includes(native?.type)) {
      const ratioKeys = native.type === 'extra_mp_damage' ? ['extraCostRatio','maxDamageBonus'] : [native.type === 'hp_difference_damage' ? 'cap' : 'ratio'];
      if (!native.name || !native.description || ratioKeys.some(key => !Number.isFinite(native[key]) || native[key] <= 0 || native[key] > 1)) fail(id + ': invalid native passive ratios');
      if (native.type === 'marked_ally_magic') exists('statuses',native.statusId,id);
      if (native.type === 'stat_conversion' && (!['maxHp','maxMp'].includes(native.fromStat) || !['attack','magic','defense','resistance','speed'].includes(native.toStat))) fail(id + ': invalid stat conversion');
    }
    if (['team_flat_self', 'team_flat_aura'].includes(actor.passive?.type)) {
      const passive = actor.passive;
      if (typeof passive.tag !== 'string' || !passive.tag || !passive.modifiers || typeof passive.modifiers !== 'object' || Array.isArray(passive.modifiers) || !Object.keys(passive.modifiers).length
        || Object.entries(passive.modifiers).some(([key, value]) => !['attack', 'magic', 'defense', 'resistance', 'speed'].includes(key) || !Number.isInteger(value) || value <= 0)
        || (passive.type === 'team_flat_self' ? typeof passive.excludeSelf !== 'boolean' : typeof passive.countSelf !== 'boolean')) fail(`${id}: invalid team flat bonus`);
    }
    if (actor.passive?.type === 'end_turn_mp_regen') {
      const passive = actor.passive;
      if (typeof passive.tag !== 'string' || !passive.tag || !Number.isFinite(passive.ratio) || passive.ratio <= 0 || passive.ratio > 1
        || !Number.isFinite(passive.tagMultiplier) || passive.tagMultiplier < 1 || passive.ratio * passive.tagMultiplier > 1) fail(`${id}: invalid end-turn MP regeneration`);
    }
    if (actor.passive?.type === 'field_growth') {
      const passive = actor.passive;
      exists('statuses', passive.statusId, id);
      if (!content.statuses[passive.statusId]?.turnStartAbility || !['attack', 'magic', 'defense', 'resistance', 'speed'].includes(passive.stat)
        || !Number.isFinite(passive.ratio) || passive.ratio <= 0 || !Number.isInteger(passive.maxStacks) || passive.maxStacks < 1) fail(`${id}: invalid field growth`);
    }
    if (actor.passive?.type === 'shield_break_attack_buff') {
      const statusId = actor.passive.statusId;
      exists('statuses', statusId, id);
      const status = content.statuses[statusId];
      if (!status || status.kind !== 'buff' || !status.persistent || !status.consumeOnAttack || !Number.isFinite(status.modifiers?.attackMultiplier) || status.modifiers.attackMultiplier <= 0) fail(`${id}: invalid shield break attack buff`);
    }
    if (actor.passive?.type === 'shield_break_status') {
      const statuses = actor.passive.statuses;
      if (!Array.isArray(statuses) || !statuses.length || new Set(statuses.map(status => status?.id)).size !== statuses.length) fail(`${id}: invalid shield break statuses`);
      else for (const status of statuses) {
        exists('statuses', status?.id, id);
        if (!content.statuses[status?.id]?.persistent && (!Number.isInteger(status?.duration) || status.duration < 1)) fail(`${id}: invalid shield break status duration`);
      }
    }
    if (actor.ai !== undefined) {
      if (!Array.isArray(actor.ai?.priorities) || !actor.ai.priorities.length) fail(`${id}: invalid AI priorities`);
      else for (const rule of actor.ai.priorities) {
        const skill = content.abilities[rule?.abilityId];
        const friendly = ['self','ally','all_allies'].includes(skill?.target);
        const valid = rule?.when === 'unshielded' ? skill?.target === 'self' && skill.effects?.some(effect=>effect.type==='shield')
          : rule?.when === 'ally_unshielded' ? friendly && skill.effects?.some(effect=>effect.type==='shield')
          : rule?.when === 'ally_hp_below' ? friendly && Number.isFinite(rule.ratio) && rule.ratio>0 && rule.ratio<=1 && skill.effects?.some(effect=>effect.type==='heal')
          : rule?.when === 'missing_status' ? friendly && content.statuses[rule.statusId] && skill.effects?.some(effect=>effect.type==='status'&&effect.status===rule.statusId)
          : false;
        if (!actor.abilities?.includes(rule?.abilityId) || !skill || !valid) fail(`${id}: invalid shield AI priority`);
      }
    }
    if (actor.passive?.type === 'resource_stat_boost') {
      const passive = actor.passive;
      if (!actor.resources || typeof passive.resource !== 'string' || !Object.hasOwn(actor.resources, passive.resource)
        || !['attack', 'magic', 'defense', 'resistance', 'speed'].includes(passive.stat)
        || !Number.isFinite(passive.ratio) || passive.ratio <= 0) fail(`${id}: invalid resource stat boost`);
    }
    if (actor.passive?.type === 'speed_damage' && (!Number.isFinite(actor.passive.ratio) || actor.passive.ratio <= 0)) fail(`${id}: invalid speed damage ratio`);
    if (actor.passive?.type === 'stat_boost') {
      const modifiers = actor.passive.modifiers;
      if (!modifiers || typeof modifiers !== 'object' || Array.isArray(modifiers) || !Object.keys(modifiers).length) fail(`${id}: stat boost requires modifiers`);
      else for (const [key, amount] of Object.entries(modifiers)) {
        if (!['attack', 'magic', 'defense', 'resistance', 'speed'].includes(key) || !Number.isFinite(amount)) fail(`${id}: invalid permanent stat modifier ${key}`);
      }
    }
    if (actor.passive?.type === 'magic_followup_mp') {
      const passive = actor.passive;
      exists('abilities', passive.followUpAbility, id);
      const ability = content.abilities[passive.followUpAbility];
      if (ability && (ability.activation !== 'passive' || ability.target !== 'enemy' || ability.effects?.some(effect => effect.type !== 'damage' || effect.damageType !== 'magical'))) fail(`${id}: follow-up must be a passive single-target magical damage ability`);
      if (!actor.resources?.[passive.resource] || !Number.isInteger(passive.threshold) || passive.threshold < 1 || passive.threshold > actor.resources[passive.resource].max) fail(`${id}: invalid passive resource threshold`);
      if (!Number.isFinite(passive.mpRestoreRatio) || passive.mpRestoreRatio <= 0 || passive.mpRestoreRatio > 1) fail(`${id}: invalid passive MP restore ratio`);
    }
    const possibleSkills = [...(actor.abilities ?? []), ...Object.values(content.upgrades).filter(upgrade => upgrade.characterId === id).flatMap(upgrade => upgrade.changes.flatMap(change => change.ability ? [change.ability] : change.to ? [change.to] : []))];
    for (const skillId of possibleSkills) {
      const skill = content.abilities[skillId];
      if (!skill) continue;
      const resourceId = skill.cost?.resource?.id??skill.cost?.preferResource?.id;
      if (skill.cost?.preferResource && skill.cost.preferResource.amount>(actor.resources?.[resourceId]?.max??0)) fail(id+'/'+skillId+': preferred cost exceeds resource cap');
      if (resourceId && !actor.resources?.[resourceId]) fail(`${id}/${skillId}: unknown resource ${resourceId}`);
      for (const effect of skill.effects ?? []) {
        if (effect.type === 'resource' && effect.resource !== 'mp' && (effect.to === 'self' || skill.target === 'self') && !actor.resources?.[effect.resource]) fail(`${id}/${skillId}: unknown resource ${effect.resource}`);
        const attackResource = ['status', 'toggle_status'].includes(effect.type) ? content.statuses[effect.status]?.onAttackResource?.resource : null;
        if (attackResource && (effect.to === 'self' || skill.target === 'self') && !Object.hasOwn(actor.resources ?? {}, attackResource)) fail(`${id}/${skillId}: unknown attack resource ${attackResource}`);
      }
    }
    if (actor.developerOnly !== undefined && typeof actor.developerOnly !== 'boolean') fail(id + ': invalid developer flag');
    if (actor.passive?.type === 'combat_mode' && !Object.keys(actor.combatModes ?? {}).length) fail(id + ': combat mode passive requires modes');
    validateSummonDefinition(actor,content,fail);
    for (const skillId of actor.abilities ?? []) {
      const skill = content.abilities[skillId];
      if (skill?.requiresMode && !actor.combatModes?.[skill.requiresMode]) fail(id + ': unknown required mode');
      if (skill?.requiresResource && (!actor.resources?.[skill.requiresResource.id] || skill.requiresResource.min > actor.resources[skill.requiresResource.id].max)) fail(id + ': invalid required resource');
      for (const effect of skill?.effects ?? []) if (effect.type === 'enter_mode' && !actor.combatModes?.[effect.mode]) fail(id + ': unknown mode');
    }
    validateBossDefinition(actor, content, fail);
  }
  for (const [id, skill] of Object.entries(content.abilities)) {
    if ((skill.effects?.filter(effect=>effect.type==='formula_field').length??0)>1 || (skill.requiresFormula && skill.effects?.some(effect=>effect.type==='formula_field'))) fail(id+': invalid formula opener');
    if (skill.requiresFormula!==undefined && typeof skill.requiresFormula!=='boolean') fail(id+': invalid formula requirement');
    if (skill.minFormulaEntries!==undefined && (skill.requiresFormula!==true || !Number.isInteger(skill.minFormulaEntries) || skill.minFormulaEntries<1 || skill.minFormulaEntries>3)) fail(id+': invalid formula minimum');
    if (skill.formulaTag!==undefined && !['lead','break','strike','none'].includes(skill.formulaTag)) fail(id+': invalid formula tag');
    if (skill.requiresResource && (!skill.requiresResource.id || !Number.isInteger(skill.requiresResource.min) || skill.requiresResource.min < 1)) fail(id + ': invalid resource requirement');
    if (skill.requiresMode !== undefined && (typeof skill.requiresMode !== 'string' || !skill.requiresMode)) fail(id + ': invalid mode requirement');
    if (skill.activation !== undefined && !['active', 'passive'].includes(skill.activation)) fail(`${id}: invalid activation`);
    if (skill.requiresTargetStatus !== undefined) exists('statuses',skill.requiresTargetStatus,id);
    if (!['enemy', 'enemy_splash', 'all_enemies', 'random_enemies', 'adjacent_allies', 'ally', 'all_allies', 'self'].includes(skill.target)) fail(`${id}: invalid target`);
    if (!Number.isInteger(skill.cooldown ?? 0) || (skill.cooldown ?? 0) < 0) fail(`${id}: invalid cooldown`);
    if (!Number.isFinite(skill.cost?.mp ?? 0) || (skill.cost?.mp ?? 0) < 0) fail(`${id}: invalid MP cost`);
    if(skill.cost?.hpMaxRatio!==undefined && (!Number.isFinite(skill.cost.hpMaxRatio)||skill.cost.hpMaxRatio<=0||skill.cost.hpMaxRatio>=1))fail(id+': invalid HP cost');
    if (skill.cost?.preferResource) {
      const preferred=skill.cost.preferResource;
      if (skill.cost.resource || !Number.isFinite(skill.cost.mp) || skill.cost.mp<=0 || typeof preferred.id!=='string' || !preferred.id || !Number.isInteger(preferred.amount) || preferred.amount<1 || !['before','after'].includes(preferred.consumeAt) || Object.keys(preferred).some(key=>!['id','amount','consumeAt'].includes(key))) fail(id+': invalid preferred resource cost');
    }
    if (skill.cost?.resource) {
      const cost = skill.cost.resource;
      if (cost.all ? !Number.isInteger(cost.min) || cost.min < 1 : !Number.isInteger(cost.amount) || cost.amount < 1) fail(`${id}: invalid resource cost`);
      if (cost.consumeAt !== undefined && !['before', 'after'].includes(cost.consumeAt)) fail(`${id}: invalid resource consumption timing`);
    }
    if (skill.target==='random_enemies' && (!skill.effects?.some(effect=>effect.type==='damage') || skill.effects.some(effect=>effect.type!=='damage' && effect.to!=='self'))) fail(id+': random targeting requires damage or self effects');
    if (!skill.effects?.length) fail(`${id}: requires effects`);
    if (skill.bossHeavy !== undefined && typeof skill.bossHeavy !== 'boolean') fail(`${id}: invalid bossHeavy`);
    if (skill.windup !== undefined && (!skill.windup || skill.windup.rounds !== 1 || typeof skill.windup.message !== 'string' || !skill.windup.message)) fail(`${id}: invalid windup`);
    for (const effect of skill.effects ?? []) {
      if (!EFFECT_TYPES.includes(effect.type)) fail(`${id}: invalid effect ${effect.type}`);
      if (['status', 'toggle_status'].includes(effect.type)) {
        exists('statuses', effect.status, id);
        if ((!content.statuses[effect.status]?.persistent || effect.duration !== undefined) && (!Number.isInteger(effect.duration) || effect.duration < 1)) fail(`${id}: invalid status duration`);
        if (effect.type === 'toggle_status' && !content.statuses[effect.status]?.persistent) fail(`${id}: toggle requires persistent status`);
      }
      if (effect.linkedStatuses !== undefined) {
        const primary = content.statuses[effect.status];
        if (effect.type !== 'toggle_status' || !Array.isArray(effect.linkedStatuses) || !effect.linkedStatuses.length
          || new Set(effect.linkedStatuses).size !== effect.linkedStatuses.length
          || effect.linkedStatuses.includes(effect.status) || effect.duration !== undefined || primary?.consumeOnAttack || primary?.expiresOnShieldGain) fail(`${id}: invalid linked statuses`);
        else for (const statusId of effect.linkedStatuses) {
          exists('statuses', statusId, id);
          const linked = content.statuses[statusId];
          if (!linked?.persistent || linked.kind !== 'buff' || !linked.modifiers || linked.modifiers.attackMultiplier !== undefined
            || ['consumeOnAttack', 'expiresOnShieldGain', 'skipTurn', 'regen', 'onDamagedResource', 'onAttackResource', 'damageOverTime', 'cover', 'taunt', 'blockResourceGain', 'effectImmunity'].some(key => linked[key])) fail(`${id}: linked statuses require persistent modifier buffs`);
        }
      }
      if (effect.onHitStatus !== undefined) {
        exists('statuses',effect.onHitStatus?.status,id);
        if (effect.type !== 'damage' || !Number.isInteger(effect.onHitStatus?.duration) || effect.onHitStatus.duration < 1) fail(id + ': invalid on-hit status');
      }
      if (effect.extraStacksIfPresent !== undefined && (effect.type !== 'status' || !Number.isInteger(effect.extraStacksIfPresent) || effect.extraStacksIfPresent < 1 || !content.statuses[effect.status]?.maxStacks)) fail(`${id}: invalid conditional status stacks`);
      if (effect.type === 'formula_field' && (skill.target!=='self' || typeof effect.name!=='string' || !effect.name.trim() || !Number.isInteger(effect.durationRounds) || effect.durationRounds<1 || !Array.isArray(effect.sequence) || effect.sequence.length!==3 || new Set(effect.sequence).size!==3 || effect.sequence.some(tag=>!['lead','break','strike'].includes(tag)) || !/^\/art\/[a-z0-9_-]+\.svg$/.test(effect.background))) fail(id+': invalid formula field');
      if (effect.type === 'edit_formula' && (skill.target!=='self' || skill.requiresFormula!==true || !skill.minFormulaEntries)) fail(id+': invalid formula edit');
      if (effect.type === 'end_formula' && !(skill.target==='self' || effect.to==='self')) fail(id+': formula must end on its owner');
      if (effect.formulaScaling && !skill.effects.some(effect=>effect.type==='end_formula' && (skill.target==='self'||effect.to==='self'))) fail(id+': formula finisher must close its field');
      if (effect.formulaScaling!==undefined && (effect.type!=='damage' || skill.requiresFormula!==true || skill.minFormulaEntries!==3 || !Number.isFinite(effect.formulaScaling.perCorrect) || effect.formulaScaling.perCorrect<=0 || effect.formulaScaling.perCorrect>2 || !Number.isFinite(effect.formulaScaling.perfectPenetration) || effect.formulaScaling.perfectPenetration<0 || effect.formulaScaling.perfectPenetration>1)) fail(id+': invalid formula scaling');
      if (effect.type === 'turn_order_field' && (skill.target !== 'self' || typeof effect.name !== 'string' || !effect.name || !Number.isInteger(effect.durationRounds) || effect.durationRounds < 1)) fail(id + ': invalid turn-order field');
      if (['enter_mode','prepare_mode'].includes(effect.type) && (typeof effect.mode !== 'string' || !effect.mode || skill.target !== 'self')) fail(id + ': invalid enter mode');
      if(effect.type==='dispel' && (!['enemy','all_enemies','enemy_splash'].includes(skill.target)||!(effect.all===true&&effect.count===undefined||effect.all===undefined&&Number.isInteger(effect.count)&&effect.count>0))) fail(id+': invalid dispel');
      if(effect.perTargetBuff!==undefined && (effect.type!=='damage'||!Number.isFinite(effect.perTargetBuff)||effect.perTargetBuff<=0||!Number.isInteger(effect.maxTargetBuffs)||effect.maxTargetBuffs<1||effect.maxTargetBuffs>10))fail(id+': invalid target buff scaling');
      if(effect.maxTargetBuffs!==undefined&&effect.perTargetBuff===undefined)fail(id+': missing target buff scaling');
      if (effect.type==='summon_companion' && (typeof effect.companion!=='string' || !effect.companion || skill.target!=='self')) fail(id+': invalid companion summon');
      if (effect.primaryMultiplier !== undefined && (effect.type !== 'damage' || !['all_enemies','enemy_splash'].includes(skill.target) || !Number.isFinite(effect.primaryMultiplier) || effect.primaryMultiplier < 0)) fail(id + ': invalid primary damage');
      if (effect.type === 'damage') {
        if (!ELEMENTS.includes(effect.element)) fail(`${id}: invalid damage element`);
        if (!['physical', 'magical'].includes(effect.damageType)) fail(`${id}: invalid damage type`);
        if (effect.consumeStatus) exists('statuses', effect.consumeStatus, id);
      }
      for (const key of ['multiplier', 'perResource', 'perStack', 'flat', 'lowHpBonus', 'speedMultiplier']) {
        if (effect[key] !== undefined && (!Number.isFinite(effect[key]) || effect[key] < 0)) fail(`${id}: invalid effect ${key}`);
      }
      if (effect.speedMultiplier !== undefined && (effect.type !== 'damage' || effect.damageType !== 'physical')) fail(`${id}: speedMultiplier requires physical damage`);
      if (effect.scalingStat !== undefined && (!['damage', 'heal', 'shield'].includes(effect.type) || !['attack', 'magic', 'defense', 'resistance'].includes(effect.scalingStat))) fail(`${id}: invalid support scaling stat`);
      if (effect.scalingStats!==undefined && (!['heal','shield'].includes(effect.type) || effect.scalingStat!==undefined || !Array.isArray(effect.scalingStats) || !effect.scalingStats.length || effect.scalingStats.length>4 || new Set(effect.scalingStats).size!==effect.scalingStats.length || effect.scalingStats.some(key=>!['attack','magic','defense','resistance'].includes(key)))) fail(id+': invalid average scaling stats');
      if (effect.durationRounds!==undefined && (!['shield','turn_order_field','formula_field'].includes(effect.type) || !Number.isInteger(effect.durationRounds) || effect.durationRounds<1)) fail(id+': invalid shield round duration');
      if (effect.type === 'resource') {
        if (!effect.resource || (effect.amount === undefined && effect.maxMpRatio === undefined)
          || (effect.amount !== undefined && (!Number.isInteger(effect.amount) || effect.amount < 1))) fail(`${id}: invalid resource effect`);
      }
      if (effect.maxMpRatio !== undefined && (effect.type !== 'resource' || effect.resource !== 'mp'
        || !Number.isFinite(effect.maxMpRatio) || effect.maxMpRatio <= 0 || effect.maxMpRatio > 1)) fail(`${id}: invalid MP restore ratio`);
      if (effect.penetration !== undefined && (!Number.isFinite(effect.penetration) || effect.penetration < 0 || effect.penetration > 1)) fail(`${id}: invalid penetration`);
      if (effect.hits !== undefined && (!Number.isInteger(effect.hits) || effect.hits < 1 || effect.hits > 20)) fail(`${id}: invalid hits`);
      if (effect.to && !['self', 'targets'].includes(effect.to)) fail(`${id}: invalid effect recipient`);
    }
  }
  for (const [id, status] of Object.entries(content.statuses)) {
    if (!['buff', 'debuff'].includes(status.kind)) fail(`${id}: invalid status kind`);
    if (status.modifiersPerStack !== undefined && (status.modifiersPerStack !== true || !Number.isInteger(status.maxStacks) || status.maxStacks < 1)) fail(id + ': invalid stack modifiers');
    if (status.modifierGroup !== undefined && (typeof status.modifierGroup !== 'string' || !status.modifierGroup)) fail(id + ': invalid modifier group');
    if (status.durationClock !== undefined && !['main_turn','round'].includes(status.durationClock)) fail(id + ': invalid duration clock');
    if (status.durationClock==='round' && (status.kind!=='buff' || status.persistent || status.damageOverTime || status.turnStartAbility || status.consumeOnAttack)) fail(id+': round clock requires a timed support buff');
    if (status.magicRefresh !== undefined && (!Number.isInteger(status.magicRefresh?.duration) || status.magicRefresh.duration < 1 || status.magicRefresh.oncePerRound !== true || status.kind !== 'debuff')) fail(id + ': invalid magic refresh');
    if (status.effectImmunity !== undefined) {
      const immunity = status.effectImmunity;
      if (!immunity || status.kind !== 'buff' || !Number.isInteger(immunity.charges) || immunity.charges < 1 || typeof immunity.hostileOnly !== 'boolean') fail(`${id}: invalid effect immunity`);
    }
    if (status.turnStartAbility !== undefined) {
      exists('abilities', status.turnStartAbility, id);
      const skill = content.abilities[status.turnStartAbility];
      if (status.kind !== 'buff' || status.persistent || status.consumeOnAttack || status.damageOverTime
        || !skill || skill.activation !== 'passive' || skill.target !== 'all_enemies' || skill.cost || skill.cooldown || skill.windup
        || skill.effects?.some(effect => effect.type !== 'damage')) fail(`${id}: invalid turn-start attack`);
    }
    for (const key of ['persistent', 'expiresOnShieldGain', 'skipTurn']) {
      if (status[key] !== undefined && typeof status[key] !== 'boolean') fail(`${id}: invalid ${key}`);
    }
    if (status.persistent && (status.skipTurn || status.damageOverTime)) fail(`${id}: persistent status cannot skip turns or deal periodic damage`);
    if (status.mpCostReduction!==undefined && (!Number.isFinite(status.mpCostReduction) || status.mpCostReduction<=0 || status.mpCostReduction>=1 || status.kind!=='buff' || !status.persistent)) fail(id+': invalid MP reduction status');
    if (status.skipTurn && status.kind !== 'debuff') fail(`${id}: skipTurn must be a debuff`);
    for (const key of ['damageVsShielded', 'damageTakenBonus']) {
      if (status.modifiers?.[key] !== undefined && (!Number.isFinite(status.modifiers[key]) || status.modifiers[key] < 0)) fail(`${id}: invalid ${key}`);
    }
    if (status.modifiers?.attackMultiplier !== undefined && (!Number.isFinite(status.modifiers.attackMultiplier) || status.modifiers.attackMultiplier <= 0 || status.consumeOnAttack !== true)) fail(`${id}: invalid next attack multiplier`);
    if (status.onAttackResource !== undefined) {
      const trigger = status.onAttackResource;
      if (!trigger || typeof trigger !== 'object' || Array.isArray(trigger)
        || typeof trigger.resource !== 'string' || !trigger.resource
        || !Number.isFinite(trigger.chance) || trigger.chance <= 0 || trigger.chance > 1
        || !Number.isInteger(trigger.amount ?? 1) || (trigger.amount ?? 1) < 1) fail(`${id}: invalid attack resource trigger`);
    }
    if (status.maxStacks!==undefined && (!Number.isInteger(status.maxStacks) || status.maxStacks<1 || status.maxStacks>99)) fail(id+': invalid stack cap');
    if (status.damageOverTime !== undefined) {
      const dot = status.damageOverTime;
      if (!dot || typeof dot !== 'object' || !['attack', 'magic'].includes(dot.scalingStat)
        || !Number.isFinite(dot.flat ?? 0) || (dot.flat ?? 0) < 0
        || !Number.isFinite(dot.multiplier ?? 0) || (dot.multiplier ?? 0) < 0
        || (dot.flat ?? 0) + (dot.multiplier ?? 0) <= 0 || status.kind !== 'debuff') fail(`${id}: invalid damage over time`);
    }
  }
  for (const [id, upgrade] of Object.entries(content.upgrades)) {
    exists('characters', upgrade.characterId, id);
    if (!upgrade.requires?.storyFlag) fail(`${id}: requires story flag`);
    for (const change of upgrade.changes ?? []) {
      if (change.type === 'unlock_ability') exists('abilities', change.ability, id);
      else if (change.type === 'replace_ability') {
        exists('abilities', change.from, id);
        exists('abilities', change.to, id);
      } else if (change.type === 'resource_max') {
        if (!content.characters[upgrade.characterId]?.resources?.[change.resource] || !Number.isInteger(change.max) || change.max < 1) fail(`${id}: invalid resource upgrade`);
      } else if (change.type === 'set_passive') {
        if (!validReactivePassive(change.passive,content,content.characters[upgrade.characterId])) fail(`${id}: invalid passive upgrade`);
      } else fail(`${id}: unknown upgrade operation`);
    }
  }
  for (const [id, encounter] of Object.entries(content.encounters)) {
    if (encounter.requires !== undefined &&
      (!encounter.requires || typeof encounter.requires !== 'object' || Array.isArray(encounter.requires)
        || !(typeof encounter.requires.storyFlag === 'string' && encounter.requires.storyFlag.trim() || typeof encounter.requires.firstClear === 'string' && content.encounters[encounter.requires.firstClear] || Array.isArray(encounter.requires.firstClears) && encounter.requires.firstClears.length>0)
        || (encounter.requires.storyFlag !== undefined && (typeof encounter.requires.storyFlag !== 'string' || !encounter.requires.storyFlag.trim()))
        || (encounter.requires.firstClear !== undefined && (!content.encounters[encounter.requires.firstClear] || encounter.requires.firstClear === id))))
      fail(`${id}: invalid quest unlock requirement`);
    if (encounter.requires?.firstClears!==undefined && (!Array.isArray(encounter.requires.firstClears)||!encounter.requires.firstClears.length||new Set(encounter.requires.firstClears).size!==encounter.requires.firstClears.length||encounter.requires.firstClears.some(key=>key===id||!content.encounters[key]))) fail(id+': invalid prerequisite chapters');
    if (encounter.requiredPartyIds !== undefined && (!Array.isArray(encounter.requiredPartyIds) || !encounter.requiredPartyIds.length || new Set(encounter.requiredPartyIds).size !== encounter.requiredPartyIds.length || encounter.requiredPartyIds.some(characterId=>!content.characters[characterId]))) fail(`${id}: invalid required party`);
    if (encounter.waves !== undefined) {
      if (!encounter.travelerStory || !Array.isArray(encounter.waves) || encounter.waves.length<2 || encounter.waves.length>20 || JSON.stringify(encounter.enemies)!==JSON.stringify(encounter.waves[0])) fail(id+': invalid story waves');
      else for(const wave of encounter.waves) {
        if (!Array.isArray(wave) || !wave.length || wave.length>4 || wave.some(enemy=>!content.enemies[enemy]) || (wave.length!==1 && wave.some(enemy=>content.enemies[enemy]?.boss))) fail(id+': invalid story wave enemies');
      }
    }
    if (!encounter.enemies?.length) fail(`${id}: requires enemies`);
    for (const enemy of encounter.enemies ?? []) exists('enemies', enemy, id);
    if (encounter.enemies?.some(enemy => content.enemies[enemy]?.boss) && encounter.enemies.length !== 1) fail(`${id}: scripted boss requires a solo encounter`);
    exists('music', encounter.bgm ?? 'normal', id);
    if (encounter.firstClearRewards !== undefined) {
      if (!Array.isArray(encounter.firstClearRewards) || !encounter.firstClearRewards.length) fail(`${id}: invalid first clear rewards`);
      else for (const reward of encounter.firstClearRewards) {
        if (!reward || !['character', 'duplicate', 'gear_slot', 'upgrade', 'exclusive'].includes(reward.type)) fail(`${id}: invalid first clear reward type`);
        else if (reward.type === 'exclusive') {
          exists('exclusiveGear',reward.templateId,id);
          if (content.exclusiveGear?.[reward.templateId]?.source?.encounterId !== id) fail(id + ': exclusive reward source mismatch');
        }
        else if (reward.type === 'upgrade') exists('upgrades', reward.upgradeId, id);
        else exists('characters', reward.characterId, id);
      }
    }
  }
  for (const [id, group] of Object.entries(content.music)) {
    if (group.loop !== undefined && typeof group.loop !== 'boolean') fail(`${id}: invalid music loop`);
    if (!Array.isArray(group.tracks) || !group.tracks.length
      || new Set(group.tracks).size !== group.tracks.length
      || group.tracks.some(track => typeof track !== 'string' || !/^\/bgm\/[a-zA-Z0-9_-]+\.mp3$/.test(track))) fail(`${id}: invalid music tracks`);
  }
  errors.push(...validateEconomyContent(content));
  errors.push(...validateDungeonContent(content));
  errors.push(...validateBlacksmithContent(content));
  errors.push(...validateTravelerStories(content));
  return errors;
}

export function assembleContent(collections) {
  const content = {};
  for (const [name, items] of Object.entries(collections)) {
    const ids = new Set();
    for (const item of items) {
      if (!item.id || ids.has(item.id)) throw new Error(`${name}: duplicate or missing id ${item.id}`);
      ids.add(item.id);
    }
    content[name] = indexById(items);
  }
  const errors = validateContent(content);
  if (errors.length) throw new Error(`Invalid content:\n${errors.join('\n')}`);
  return content;
}

export const COLLECTIONS = ['characters', 'abilities', 'statuses', 'upgrades', 'enemies', 'encounters', 'economy', 'gearTypes', 'banners', 'music', 'dungeons', 'blacksmith', 'exclusiveGear', 'items', 'travelerStories'];
