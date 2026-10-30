import { scalingValue, adjacentAllies } from "./scaling.js";
import { statusModifier } from "./stat-values.js";
import { exclusivePassive, procAvailable, markProc } from "./exclusive-hooks.js";
import { enemyStatMultipliers, scaleEnemyStats } from "./enemy-scaling.js";
import { resolveCharacter } from "./progression.js";
import { seededRandom } from "./random.js";
import {
  WEAKNESS_MULTIPLIER,
  ELEMENT_NAMES,
  DAMAGE_TYPE_NAMES,
} from "./content.js";
import { isValidParty } from "./party.js";
import {
  damageMultiplier,
  supportAmount,
  EMERGENCY_HP_THRESHOLD,
  effectiveStat,
  speedDamageBonus,
  mpRestoreAmount,
  shieldedDamageMultiplier,
  incomingDamageMultiplier,
} from "./combat-math.js";
import {
  canTriggerFollowUp,
  FOLLOW_UP_LABEL,
  REACTION_LABELS,
} from "./follow-up.js";
import { battleStat } from "./stat-values.js";
import { assertOwnedParty } from "./ownership.js";
import { assertValidEquipment } from "./equipment.js";
import {
  initializeBoss,
  bossHealthFloor,
  bossFireMultiplier,
  suppressOnWeakness,
  transitionBossPhases,
  bossTurnJobs,
} from "./boss-mechanics.js";
import { activeStatuses } from "./status-state.js";
import { assertQuestUnlocked, assertEncounterParty } from "./quest-catalog.js";
import { normalizeBlacksmithState } from "./blacksmith-state.js";

import { checkCombatMode, enterCombatMode, modeAvailability } from "./combat-modes.js";
import { copyTurnOrderField, orderActorIds, expireTurnOrderField, applyTurnOrderField, skillBaseStatBonuses } from "./turn-order.js";
import { mpCost, debuffTypeCount, debuffDamageBonus, targetsAsGroup } from "./conditional-combat.js";
const modeIO = { write, emit: emitEvent, restore: gainResource };
const living = (actor) => actor.hp > 0;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function createBattle(
  content,
  campaign,
  encounterId,
  random = seededRandom(1),
  options = {},
) {
  if (options.continuesOnVictory !== undefined && typeof options.continuesOnVictory !== "boolean") throw new Error("Thiết lập chuyển trận không hợp lệ.");
  const encounter = content.encounters[encounterId];
  if (!encounter) throw new Error(`Unknown encounter ${encounterId}`);
  assertQuestUnlocked(encounter, campaign);
  assertEncounterParty(encounter, campaign, content);
  if (!isValidParty(campaign.party, content.characters))
    throw new Error("Invalid party");
  assertOwnedParty(campaign);
  assertValidEquipment(campaign, content);
  normalizeBlacksmithState(campaign, content, campaign);
  const scale = enemyStatMultipliers(options.enemyScale ?? 1);
  if (
    !Number.isSafeInteger(options.roundOffset ?? 0) ||
    (options.roundOffset ?? 0) < 0
  )
    throw new Error("Thiết lập đợt quái không hợp lệ.");
  const makeActor = (definition, team, id) => ({
    ...structuredClone(definition),
    definitionId: definition.id,
    id,
    team,
    hp: definition.stats.maxHp,
    mp: definition.stats.maxMp,
    shield: 0,
    shieldSourceId: null,
    statuses: [],
    cooldowns: {},
    reactionRound: 0,
    followUpRound: 0,
    resourceValues: Object.fromEntries(
      Object.keys(definition.resources ?? {}).map((key) => [key, 0]),
    ),
  });
  const actors = [
    ...(options.partyActors
      ? structuredClone(options.partyActors)
      : campaign.party
          .filter(Boolean)
          .map((id) =>
            makeActor(resolveCharacter(content, campaign, id), "party", id),
          )),
    ...encounter.enemies.map((id, index) => {
      const definition = structuredClone(content.enemies[id]);
      definition.stats = scaleEnemyStats(definition.stats, scale);
      return makeActor(
        definition,
        "enemy",
        `${options.enemyIdPrefix ?? "enemy_"}${index}`,
      );
    }),
  ];
  for (const actor of actors.filter(item=>item.team==='party')) {
    const slot=campaign.party.indexOf(actor.id);
    actor.formationSlot=slot>=0?slot:actors.filter(item=>item.team==='party').indexOf(actor);
  }
  const enemies = actors.filter((actor) => actor.team === "enemy");
  for (const actor of enemies) {
    const siblings = enemies.filter(
      (item) => item.definitionId === actor.definitionId,
    );
    if (siblings.length > 1)
      actor.name = `${actor.name} ${siblings.indexOf(actor) < 26 ? String.fromCharCode(65 + siblings.indexOf(actor)) : siblings.indexOf(actor) + 1}`;
  }
  for (const actor of actors) initializeBoss(actor);
  const battle = {
    content,
    encounterId,
    actors,
    random,
    round: options.roundOffset ?? 0,
    roundOffset: options.roundOffset ?? 0,
    sourceActors: structuredClone(options.sourceActors ?? []),
    phase: "main",
    extraTurnGrants: new Set(),
    extraTurnUsed: new Set(),
    extraPhaseRequired: false,
    turnOrderField: copyTurnOrderField(options.turnOrderField),
    mainTurnOrder: [],
    queue: [],
    cursor: 0,
    outcome: null,
    continuesOnVictory: options.continuesOnVictory === true,
    log: [...(options.log ?? [])],
    events: [],
    actionCount: 0,
  };
  if (!actors.some((actor) => actor.team === "party" && living(actor))) {
    battle.outcome = "defeat";
    write(battle, "Không còn đồng đội đứng vững để tiếp tục đợt mới.");
    return battle;
  }
  startRound(battle);
  return battle;
}

export function getActor(battle, id) {
  return (
    battle.actors.find((actor) => actor.id === id) ??
    battle.sourceActors?.find((actor) => actor.id === id)
  );
}
export function activeActor(battle) {
  return battle.outcome ? null : getActor(battle, battle.queue[battle.cursor]);
}

function write(battle, message) {
  battle.log.push(message);
  if (battle.log.length > 200) battle.log.shift();
}

// Presentation events describe actual outcomes, independently of translated log text.
// They contain only the most recent action, including reactions and next-turn regen.
function emitEvent(battle, event) {
  battle.events.push(event);
}

function statusDefinitions(battle, actor) {
  return activeStatuses(actor).map(
    (status) => battle.content.statuses[status.id],
  );
}
function modifier(battle, actor, key, ignoreConsumables = false) {
  return statusModifier(battle.content, actor, key, ignoreConsumables);
}
function flag(battle, actor, key) {
  return statusDefinitions(battle, actor).some((status) => status[key]);
}
function stat(battle, actor, key, ignoreConsumables = false) {
  return battleStat(battle.content, actor, key, ignoreConsumables);
}

function attackContext(battle, actor) {
  const buffs = actor.statuses.filter(
    (status) =>
      battle.content.statuses[status.id].modifiers?.attackMultiplier !==
      undefined,
  );
  return {
    weaknessTargets: new Set(),
    consumedTargets: new Map(),
    newlyMarkedTargets: new Set(),
    shieldBreakBuffs: new Set(),
    attackBuffs: buffs,
    multiplier: buffs.reduce(
      (value, status) =>
        value * battle.content.statuses[status.id].modifiers.attackMultiplier,
      1,
    ),
  };
}

function finishAttackContext(battle, actor, context) {
  for (const [sourceId, proc] of context.supportMpSources ?? []) {
    const source = getActor(battle, sourceId);
    if (source && living(source)) {
      const passive = source.passive;
      write(battle, `${source.name} kích hoạt ${passive.name}.`);
      gainResource(battle, source, "mp", passive.amount + (proc.weakness ? passive.weaknessBonus : 0), source.id);
    }
  }
  context.supportMpSources?.clear();
  actor.statuses = actor.statuses.filter(
    (status) => !context.attackBuffs.includes(status),
  );
  if (living(actor))
    for (const statusId of context.shieldBreakBuffs)
      applyStatus(battle, actor, statusId, undefined, actor.id);
}

function startRound(battle) {
  battle.round += 1;
  battle.phase = "main";
  battle.extraTurnGrants = new Set();
  battle.extraTurnUsed = new Set();
  battle.extraPhaseRequired = false;
  if (battle.round - (battle.roundOffset ?? 0) > 60) {
    battle.outcome = "draw";
    for (const actor of battle.actors) checkCombatMode(battle,actor,"battle_end",modeIO);
    write(battle, "Trận đấu dừng sau 60 vòng.");
    return;
  }
  expireTurnOrderField(battle,modeIO);
  battle.queue = orderActorIds(battle,battle.actors.filter(living).map(actor=>actor.id));
  battle.mainTurnOrder = [...battle.queue];
  battle.cursor = 0;
  for (const actor of battle.actors) {
    for (const id of Object.keys(actor.cooldowns))
      actor.cooldowns[id] = Math.max(0, actor.cooldowns[id] - 1);
  }
  write(battle, `— Vòng Chính ${battle.round} —`);
  beginTurn(battle);
}

function healHp(battle, target, requested, sourceId, label = "") {
  if (!living(target)) return 0;
  const amount = Math.min(target.stats.maxHp - target.hp, Math.max(0, Math.round(requested)));
  target.hp += amount;
  if (amount > 0) {
    emitEvent(battle, { type: "heal", targetId: target.id, sourceId, amount });
    const source = getActor(battle, sourceId), passive = target.passive;
    if (passive?.type === "ally_heal_mp" && source && source.id !== target.id && source.team === target.team && procAvailable(battle,target,"ally_heal_mp")) {
      markProc(battle,target,"ally_heal_mp");
      gainResource(battle,target,"mp",Math.ceil(target.stats.maxMp * passive.ratio),target.id);
    }
  }
  write(battle, `${target.name} hồi ${amount} HP${label ? " từ " + label : ""}.`);
  return amount;
}

function beginTurn(battle) {
  const actor = activeActor(battle);
  if (!actor) return;
  checkCombatMode(battle,actor,"turn_start",modeIO);
  if (battle.phase === "extra") battle.extraTurnUsed.add(actor.id);
  // Poison resolves before any regeneration or turn-start passive, even after its source falls.
  for (const status of [...actor.statuses]) {
    const definition = battle.content.statuses[status.id];
    if (!definition.damageOverTime) continue;
    const amount = Math.min(
      Math.max(0, actor.hp - bossHealthFloor(actor)),
      Math.floor(
        status.potency *
          incomingDamageMultiplier(modifier(battle, actor, "damageTakenBonus")),
      ),
    );
    actor.hp -= amount;
    status.remaining -= 1;
    emitEvent(battle, {
      type: "damage",
      targetId: actor.id,
      sourceId: status.sourceId,
      amount,
      absorbed: 0,
      weakness: false,
      periodic: true,
    });
    write(battle, `${actor.name} mất ${amount} HP vì ${definition.name}.`);
    transitionBossPhases(battle, { write, restoreMp: gainResource });
    if (status.remaining <= 0)
      actor.statuses = actor.statuses.filter((item) => item !== status);
    if (!living(actor)) {
      actor.statuses = actor.statuses.filter(
        (item) => !battle.content.statuses[item.id].turnStartAbility,
      );
      onActorDefeated(battle,getActor(battle,status.sourceId),actor);
      write(battle, `${actor.name} gục xuống vì ${definition.name}.`);
      advance(battle); // Skip the defeated actor, including a last-enemy victory.
      return;
    }
  }
  const passive = actor.passive;
  if (
    passive?.type === "magic_followup_mp" &&
    actor.resourceValues[passive.resource] >= passive.threshold
  ) {
    const consumed = actor.resourceValues[passive.resource];
    actor.resourceValues[passive.resource] = 0;
    write(
      battle,
      `${actor.name} kích hoạt ${passive.name}, tiêu ${consumed} ${actor.resources[passive.resource].name}: hồi ${Math.round(passive.mpRestoreRatio * 100)}% MP tối đa toàn đội.`,
    );
    for (const ally of battle.actors.filter(
      (ally) => ally.team === actor.team && living(ally),
    )) {
      gainResource(
        battle,
        ally,
        "mp",
        Math.round(ally.stats.maxMp * passive.mpRestoreRatio),
        actor.id,
      );
    }
  }
  for (const status of [...actor.statuses]) {
    const definition = battle.content.statuses[status.id];
    if (definition.regen) {
      healHp(battle, actor, actor.stats.maxHp * definition.regen, status.sourceId, definition.name);
    }
  }
  if (actor.pendingExclusiveHeal) {
    const pending = actor.pendingExclusiveHeal;
    delete actor.pendingExclusiveHeal;
    healHp(battle, actor, actor.stats.maxHp * pending.ratio, pending.sourceId, pending.name);
  }
  for (const status of [...actor.statuses]) {
    const abilityId = battle.content.statuses[status.id].turnStartAbility;
    if (!abilityId) continue;
    const growth = actor.passive;
    if (growth?.type === "field_growth" && growth.statusId === status.id) {
      status.growth = Math.min(growth.maxStacks, (status.growth ?? 0) + 1);
      const label = {
        attack: "ATK",
        magic: "MAG",
        defense: "DEF",
        resistance: "RES",
        speed: "SPD",
      }[growth.stat];
      write(
        battle,
        `${actor.name}: ${growth.name} +${Math.round(status.growth * growth.ratio * 100)}% ${label}.`,
      );
    }
    const skill = battle.content.abilities[abilityId];
    const context = {
      ...attackContext(battle, actor),
      attackBuffs: [],
      multiplier: 1,
      automatic: true,
    };
    write(
      battle,
      `${actor.name} kích hoạt ${skill.name} từ ${battle.content.statuses[status.id].name}.`,
    );
    const targets = targetsFor(battle, actor, skill);
    for (const effect of skill.effects) {
      for (const target of targets)
        for (let i = 0; i < (effect.hits ?? 1) && living(target); i++)
          hit(battle, actor, target, effect, 0, {
            reaction: true,
            area: true,
            actionContext: context,
          });
    }
    finishAttackContext(battle, actor, context);
    transitionBossPhases(battle, { write, restoreMp: gainResource });
    if (checkOutcome(battle)) return;
  }
  if (flag(battle, actor, "skipTurn")) {
    write(battle, `${actor.name} bị choáng, mất lượt hành động.`);
    finishStatuses(battle, actor, [...actor.statuses], false);
    battle.actionCount++;
    endTurnPassive(battle, actor);
    advance(battle);
  }
}

function endTurnPassive(battle, actor) {
  const passive = actor.passive;
  if (!living(actor) || passive?.type !== "end_turn_mp_regen") return;
  write(battle, `${actor.name} kích hoạt ${passive.name} cuối lượt.`);
  for (const ally of battle.actors.filter(
    (target) => target.team === actor.team && living(target),
  )) {
    const multiplier = ally.tags?.includes(passive.tag)
      ? passive.tagMultiplier
      : 1;
    gainResource(
      battle,
      ally,
      "mp",
      Math.ceil(ally.stats.maxMp * passive.ratio * multiplier),
      actor.id,
    );
  }
}

function onActorDefeated(battle,killer,target) {
  const passive=killer?.passive;
  if (!killer || killer.team===target.team || passive?.type!=="kill_mp_discount" || killer.statuses.some(status=>status.id===passive.statusId)) return;
  applyStatus(battle,killer,passive.statusId,undefined,killer.id);
  write(battle,killer.name+" kích hoạt "+passive.name+": giảm "+Math.round(passive.ratio*100)+"% MP tiêu hao.");
}

function checkOutcome(battle) {
  if (!battle.actors.some((actor) => actor.team === "enemy" && living(actor)))
    battle.outcome = "victory";
  else if (
    !battle.actors.some((actor) => actor.team === "party" && living(actor))
  )
    battle.outcome = "defeat";
  for (const actor of battle.actors) checkCombatMode(battle,actor,battle.outcome ? "battle_end" : "owner_state",modeIO);
  return battle.outcome;
}

function advance(battle) {
  if (checkOutcome(battle)) return;
  battle.cursor += 1;
  while (
    battle.cursor < battle.queue.length &&
    !living(getActor(battle, battle.queue[battle.cursor]))
  )
    battle.cursor += 1;
  if (battle.cursor >= battle.queue.length) finishPhase(battle);
  else beginTurn(battle);
}

// The phase boundary is independent of recipient survival: even an empty extra phase resolves.
function finishPhase(battle) {
  if (checkOutcome(battle)) return;
  if (battle.phase === "main" && battle.extraPhaseRequired) {
    battle.phase = "extra";
    battle.queue = orderActorIds(battle,battle.actors.filter(actor => living(actor) && battle.extraTurnGrants.has(actor.id)).map(actor=>actor.id));
    battle.cursor = 0;
    write(battle, `— Vòng Phụ ${battle.round} —`);
    emitEvent(battle, { type: "phase", phase: "extra", round: battle.round });
    if (battle.queue.length) { beginTurn(battle); return; }
  }
  finishMainRound(battle);
}

function finishMainRound(battle) {
  if (checkOutcome(battle) || battle.endOfRoundResolvedRound === battle.round) return;
  battle.endOfRoundResolvedRound = battle.round;
  for (const actor of battle.actors) checkCombatMode(battle,actor,"round_end",modeIO);
  for (const source of battle.actors.filter(living)) {
    const passive = source.passive;
    if (passive?.type === "end_round_team_mp") {
      write(battle,source.name+" kích hoạt "+passive.name+" cuối Vòng.");
      for (const ally of battle.actors.filter(item=>living(item) && item.team===source.team)) gainResource(battle,ally,"mp",Math.ceil(ally.stats.maxMp*passive.ratio),source.id);
      continue;
    }
    if (passive?.type !== "end_round_lowest_mp") continue;
    const target = battle.actors.filter(actor => living(actor) && actor.team === source.team && actor.stats.maxMp > 0)
      .sort((a,b) => a.mp / a.stats.maxMp - b.mp / b.stats.maxMp)[0];
    if (target) {
      write(battle, `${source.name} kích hoạt ${passive.name} cuối Vòng.`);
      gainResource(battle, target, "mp", Math.ceil(target.stats.maxMp * passive.ratio), source.id);
    }
  }
  expireTurnOrderField(battle,modeIO,true);
  emitEvent(battle, { type: "round_end", round: battle.round });
  write(battle, `— Kết thúc Vòng Chính ${battle.round} —`);
  startRound(battle);
}

export function targetsFor(battle, actor, skill) {
  if (skill.target === "self") return living(actor) ? [actor] : [];
  if (skill.target === "adjacent_allies") return adjacentAllies(battle,actor);
  const allies = skill.target === "ally" || skill.target === "all_allies";
  let targets = battle.actors.filter(
    (target) =>
      living(target) &&
      (allies ? target.team === actor.team : target.team !== actor.team),
  );
  if (skill.requiresTargetStatus) targets = targets.filter(target => target.statuses.some(status => status.id === skill.requiresTargetStatus && status.stacks > 0));
  if (skill.target === "enemy") {
    const taunting = targets.filter((target) => flag(battle, target, "taunt"));
    if (taunting.length) targets = taunting;
  }
  return skill.excludeSelf ? targets.filter(target => target.id !== actor.id) : targets;
}

export function abilityAvailability(battle, actor, skill) {
  if (!actor || !living(actor))
    return { ok: false, reason: "Không thể hành động." };
  const modeCheck = modeAvailability(actor,skill);
  if (modeCheck) return modeCheck;
  if ((actor.cooldowns[skill.id] ?? 0) > 0)
    return {
      ok: false,
      reason: `Hồi chiêu: ${actor.cooldowns[skill.id]} vòng.`,
    };
  if (actor.mp < mpCost(skill,actor))
    return { ok: false, reason: "Không đủ MP." };
  if (skill.target === "adjacent_allies" && !targetsFor(battle,actor,skill).length) return {ok:false,reason:"Không có đồng đội còn sống ở hai ô kề."};
  if (skill.requiresTargetStatus && !targetsFor(battle,actor,skill).length)
    return { ok: false, reason: `Cần mục tiêu có ${battle.content.statuses[skill.requiresTargetStatus].name}.` };
  const resource = skill.cost?.resource;
  if (
    resource &&
    (actor.resourceValues[resource.id] ?? 0) <
      (resource.min ?? resource.amount ?? 1)
  )
    return {
      ok: false,
      reason: `Chưa đủ ${actor.resources?.[resource.id]?.name ?? resource.id}.`,
    };
  return { ok: true, reason: "" };
}

function gainResource(battle, actor, id, amount, sourceId = actor.id) {
  if (id === "mp") {
    const recovered = Math.min(amount, actor.stats.maxMp - actor.mp);
    actor.mp = clamp(actor.mp + amount, 0, actor.stats.maxMp);
    if (recovered > 0) {
      emitEvent(battle, {
        type: "mp_restore",
        targetId: actor.id,
        sourceId,
        amount: recovered,
      });
      write(battle, `${actor.name} hồi ${recovered} MP.`);
    }
    return;
  }
  if (!actor.resources?.[id]) return;
  // Exhaustion prevents resource generation, but does not remove stored resources.
  if (amount > 0 && flag(battle, actor, "blockResourceGain")) return;
  actor.resourceValues[id] = clamp(
    (actor.resourceValues[id] ?? 0) + amount,
    0,
    actor.resources[id].max,
  );
}

function coverTarget(battle, target) {
  for (const status of target.statuses) {
    if (battle.content.statuses[status.id].cover) {
      const source = getActor(battle, status.sourceId);
      if (source && living(source) && source.id !== target.id) return source;
    }
  }
  return target;
}

function triggerMagicFollowups(battle, attacker, target) {
  for (const ally of battle.actors) {
    const passive = ally.passive;
    if (!living(target)) break;
    if (
      !canTriggerFollowUp(ally, attacker, target) ||
      passive?.type !== "magic_followup_mp" ||
      ally.followUpRound === battle.round
    )
      continue;
    // Reserve the once-per-round activation before damage to prevent reaction chains.
    ally.followUpRound = battle.round;
    const ability = battle.content.abilities[passive.followUpAbility];
    const actionContext = attackContext(battle, ally);
    write(battle, `${ally.name} ${FOLLOW_UP_LABEL} bằng ${ability.name}.`);
    emitEvent(battle, {
      type: "reaction",
      kind: "follow_up",
      label: FOLLOW_UP_LABEL,
      sourceId: ally.id,
      targetId: target.id,
      abilityId: ability.id,
    });
    for (const effect of ability.effects) {
      for (let i = 0; i < (effect.hits ?? 1) && living(target); i += 1)
        hit(battle, ally, target, effect, 0, { reaction: true, actionContext });
    }
    finishAttackContext(battle, ally, actionContext);
    gainResource(battle, ally, passive.resource, 1);
    write(
      battle,
      `${ally.name}: ${ally.resources[passive.resource].name} ${ally.resourceValues[passive.resource]} / ${ally.resources[passive.resource].max}.`,
    );
  }
}

function hit(
  battle,
  attacker,
  originalTarget,
  effect,
  spent = 0,
  options = {},
) {
  const context = options.actionContext ?? attackContext(battle, attacker);
  try {
    return resolveHit(battle, attacker, originalTarget, effect, spent, {
      ...options,
      actionContext: context,
    });
  } finally {
    if (!options.actionContext) finishAttackContext(battle, attacker, context);
  }
}

function resolveHit(
  battle,
  attacker,
  originalTarget,
  effect,
  spent,
  { reaction = false, area = false, actionContext },
) {
  const target =
    !area && !reaction ? coverTarget(battle, originalTarget) : originalTarget;
  if (!living(attacker) || !living(target)) return;
  if (target.id !== originalTarget.id)
    write(battle, `${target.name} chắn đòn cho ${originalTarget.name}.`);
  const evasion =
    effect.damageType === "physical" && !effect.unavoidable
      ? clamp(modifier(battle, target, "evasion"), 0, 0.85)
      : 0;
  if (evasion > 0 && battle.random() < evasion) {
    emitEvent(battle, {
      type: "dodge",
      targetId: target.id,
      sourceId: attacker.id,
    });
    write(battle, `${target.name} né đòn của ${attacker.name}.`);
    const dodgeHeal = exclusivePassive(target,"dodge_heal");
    if (dodgeHeal && target.hp < target.stats.maxHp && procAvailable(battle,target,"exclusive_dodge")) {
      if (healHp(battle,target,target.stats.maxHp * dodgeHeal.ratio,target.id,dodgeHeal.name) > 0) markProc(battle,target,"exclusive_dodge");
    }
    if (
      !reaction &&
      target.passive?.type === "dodge_counter" &&
      target.reactionRound !== battle.round
    ) {
      target.reactionRound = battle.round;
      gainResource(battle, target, target.passive.resource, 1);
      write(battle, `${target.name} phản kiếm!`);
      emitEvent(battle, {
        type: "reaction",
        kind: "counter",
        label: REACTION_LABELS.counter,
        sourceId: target.id,
        targetId: attacker.id,
      });
      const counter = battle.content.abilities[target.passive.counterAbility];
      if (counter) {
        const context = attackContext(battle, target);
        context.skillId = counter.id;
        for (const effect of counter.effects) {
          if (living(attacker) && living(target)) {
            if (effect.type === "damage") hit(battle, target, attacker, effect, 0, { reaction: true, actionContext: context });
            else applyEffect(battle, target, [attacker], effect, 0, false, context);
          }
        }
        finishAttackContext(battle, target, context);
      } else hit(
        battle,
        target,
        attacker,
        {
          type: "damage",
          damageType: "physical",
          element: target.element,
          multiplier: 0.85,
          unavoidable: true,
        },
        0,
        { reaction: true },
      );
    }
    return;
  }
  let hitMagicBonus = 0;
  if (effect.damageType === "magical") {
    for (const ally of battle.actors.filter(candidate => living(candidate) && candidate.team === attacker.team && candidate.id !== attacker.id)) {
      const passive = ally.passive;
      if (passive?.type === "marked_ally_magic" && target.statuses.some(status => status.id === passive.statusId)) hitMagicBonus += passive.ratio;
    }
  }
  const power = scalingValue(effect,key=>battleStat(battle.content,attacker,key,actionContext.automatic,key==="magic"?hitMagicBonus:0,actionContext.baseStatBonuses?.[key]??0));
  const penetration = exclusivePassive(attacker,"skill_penetration",actionContext.skillId);
  const extraPenetration = penetration && spent >= (penetration.minSpent ?? 0) ? penetration.ratio : 0;
  const defense =
    stat(
      battle,
      target,
      effect.damageType === "physical" ? "defense" : "resistance",
    ) *
    (1 - clamp((effect.penetration ?? 0) + extraPenetration, 0, 1));
  let stacks = 0;
  if (effect.consumeStatus) {
    const mark = target.statuses.find(
      (status) => status.id === effect.consumeStatus,
    );
    stacks = mark?.stacks ?? 0;
    if (stacks > 0) {
      if (!actionContext.consumedTargets.has(effect.consumeStatus)) actionContext.consumedTargets.set(effect.consumeStatus,new Set());
      actionContext.consumedTargets.get(effect.consumeStatus).add(target.id);
    }
    target.statuses = target.statuses.filter(
      (status) => status.id !== effect.consumeStatus,
    );
  }
  const multiplier = damageMultiplier(effect, {
    spent,
    stacks,
    hpRatio: attacker.hp / attacker.stats.maxHp,
  });
  let reduction = modifier(battle, target, "damageReduction");
  if (target.passive?.type === "damage_reduction" &&
    (!target.passive.requiresStatus || activeStatuses(target).some(status => status.id === target.passive.requiresStatus)))
    reduction += target.passive.amount;
  const elementWeakness = target.weaknesses?.includes(effect.element) ?? false;
  const typeWeakness =
    target.damageTypeWeaknesses?.includes(effect.damageType) ?? false;
  // Element and damage type are alternative triggers of the same +50% bonus.
  const weakness = elementWeakness || typeWeakness;
  const weaknessReason = [
    elementWeakness ? ELEMENT_NAMES[effect.element] : null,
    typeWeakness ? DAMAGE_TYPE_NAMES[effect.damageType] : null,
  ]
    .filter(Boolean)
    .join(" / ");
  let amount = Math.max(
    1,
    Math.floor(
      Math.max(
        1,
        power * multiplier +
          speedDamageBonus(
            attacker,
            effect.damageType,
            stat(battle, attacker, "speed", actionContext.automatic),
            effect.speedMultiplier ?? 0,
          ) -
          defense * 0.55,
      ) *
        (target.resistances?.[effect.element] ?? 1) *
        (weakness ? WEAKNESS_MULTIPLIER : 1) *
        bossFireMultiplier(attacker, effect) *
        Math.max(
          0.1,
          1 +
            modifier(battle, attacker, "damageBonus", actionContext.automatic) + debuffDamageBonus(attacker.passive,debuffTypeCount(battle.content,target)),
        ) *
        (actionContext.multiplier ?? 1) *
        (attacker.passive?.type === "hp_difference_damage" ? 1 + Math.min(attacker.passive.cap, Math.abs(attacker.hp / attacker.stats.maxHp - target.hp / target.stats.maxHp)) : 1) *
        (target.id !== originalTarget.id && exclusivePassive(target,"cover_damage_reduction") ? 1 - exclusivePassive(target,"cover_damage_reduction").ratio : 1) *
        shieldedDamageMultiplier(
          target.shield,
          modifier(
            battle,
            attacker,
            "damageVsShielded",
            actionContext.automatic,
          ),
        ) *
        incomingDamageMultiplier(modifier(battle, target, "damageTakenBonus")) *
        (1 - clamp(reduction, 0, 0.75)),
    ),
  );
  const absorbed = Math.min(target.shield, amount);
  target.shield -= absorbed;
  amount -= absorbed;
  const lostHp = Math.min(
    Math.max(0, target.hp - bossHealthFloor(target)),
    amount,
  );
  target.hp -= lostHp;
  // Reserve before nested reactions; settle after the whole attack so a later
  // weak target/hit can upgrade 3 MP to 5 MP. Shield damage and kills count.
  if (attacker.team !== target.team && lostHp + absorbed > 0) {
    for (const source of battle.actors) {
      const passive = source.passive;
      if (!living(source) || source.id === attacker.id || source.team !== attacker.team
        || passive?.type !== "buffed_ally_mp"
        || !attacker.statuses.some(status => status.sourceId === source.id && passive.statusIds.includes(status.id))) continue;
      const existing = actionContext.supportMpSources?.get(source.id);
      if (existing) existing.weakness ||= weakness;
      else if (procAvailable(battle, source, "buffed_ally_mp")) {
        markProc(battle, source, "buffed_ally_mp");
        (actionContext.supportMpSources ??= new Map()).set(source.id, { weakness });
      }
    }
  }
  emitEvent(battle, {
    type: "damage",
    targetId: target.id,
    sourceId: attacker.id,
    amount: lostHp,
    absorbed,
    element: effect.element,
    weakness,
    ...(actionContext.hybrid ? { damageType: effect.damageType } : {}),
    ...(actionContext.automatic ? { automatic: true } : {}),
  });
  write(
    battle,
    `${attacker.name} → ${target.name}: ${lostHp} sát thương${actionContext.hybrid ? ` ${DAMAGE_TYPE_NAMES[effect.damageType]}` : ""}${absorbed ? `, khiên chặn ${absorbed}` : ""}${weakness ? `, yếu ${weaknessReason} (+50%)` : ""}.`,
  );
  if (living(target) && weakness && lostHp + absorbed > 0)
    suppressOnWeakness(
      battle,
      attacker,
      target,
      actionContext,
      write,
      (id, duration) =>
        applyStatus(battle, target, id, duration, attacker.id, {
          silent: true,
        }),
    );
  if (
    absorbed &&
    target.shield === 0 &&
    attacker.team !== target.team &&
    attacker.passive?.type === "shield_break_attack_buff"
  )
    actionContext.shieldBreakBuffs.add(attacker.passive.statusId);
  if (absorbed && target.shield === 0 && living(target)) {
    const healer = getActor(battle, target.shieldSourceId);
    if (healer?.passive?.type === "shield_break_heal" && living(healer)) {
      const bonus = exclusivePassive(healer,"shield_break_heal_bonus");
      healHp(battle,target,stat(battle,healer,"magic") * healer.passive.multiplier * (1 + (bonus?.ratio ?? 0)),healer.id,"Dư âm thủy hộ");
    }
    const refill=healer?.passive;
    if (refill?.type === "shield_break_mp" && living(healer) && target.mp<target.stats.maxMp && procAvailable(battle,target,"shield_mp:"+healer.id)) {
      const amount=Math.ceil(scalingValue(refill,key=>stat(battle,healer,key))*refill.multiplier);
      markProc(battle,target,"shield_mp:"+healer.id);
      write(battle,healer.name+" kích hoạt "+refill.name+" cho "+target.name+".");
      gainResource(battle,target,"mp",amount,healer.id);
    }
    if (target.passive?.type === "shield_break_status") {
      write(battle, `${target.name} vỡ khiên!`);
      for (const status of target.passive.statuses)
        applyStatus(battle, target, status.id, status.duration, attacker.id);
    }
  }
  if (living(target) && (lostHp || absorbed)) {
    for (const status of statusDefinitions(battle, target)) {
      if (status.onDamagedResource)
        gainResource(battle, target, status.onDamagedResource, 1);
    }
  }
  // Refresh an existing mark at most once per main round per target. New marks don't consume that quota.
  if (living(target) && effect.damageType === "magical" && lostHp + absorbed > 0) {
    for (const mark of target.statuses) {
      const refresh = battle.content.statuses[mark.id].magicRefresh;
      const source = getActor(battle,mark.sourceId);
      if (refresh && source?.team === attacker.team && attacker.team !== target.team && !actionContext.newlyMarkedTargets.has(target.id + ":" + mark.id) && (!refresh.oncePerRound || mark.refreshedRound !== battle.round)) {
        mark.remaining = refresh.duration;
        mark.refreshedRound = battle.round;
        write(battle, `${target.name}: làm mới ${battle.content.statuses[mark.id].name} (${refresh.duration} lượt).`);
      }
    }
    if (effect.onHitStatus) {
      const applied = applyStatus(battle,target,effect.onHitStatus.status,effect.onHitStatus.duration,attacker.id);
      if (applied && !actionContext.preMarkedTargets?.has(target.id + ":" + applied.id)) actionContext.newlyMarkedTargets.add(target.id + ":" + applied.id);
    }
  } else if (living(target) && effect.damageType !== "magical" && lostHp + absorbed > 0 && effect.onHitStatus) {
    applyStatus(battle,target,effect.onHitStatus.status,effect.onHitStatus.duration,attacker.id);
  }
  if (!living(target)) {
    target.statuses = target.statuses.filter(
      (status) => !battle.content.statuses[status.id].turnStartAbility,
    );
    onActorDefeated(battle,attacker,target);
    checkCombatMode(battle,target,"owner_ko",modeIO);
    write(battle, `${target.name} gục xuống.`);
  } else if (
    !reaction &&
    !area &&
    effect.damageType === "magical" &&
    lostHp + absorbed > 0
  )
    triggerMagicFollowups(battle, attacker, target);
}

function applyStatus(
  battle,
  target,
  statusId,
  duration,
  sourceId,
  { silent = false } = {},
) {
  const definition = battle.content.statuses[statusId];
  const source = getActor(battle, sourceId);
  if (definition.kind === "debuff") {
    const ward = target.statuses.find((status) => {
      const immunity = battle.content.statuses[status.id].effectImmunity;
      return (
        immunity &&
        (status.charges ?? immunity.charges) > 0 &&
        (!immunity.hostileOnly || (source && source.team !== target.team))
      );
    });
    if (ward) {
      ward.charges =
        (ward.charges ??
          battle.content.statuses[ward.id].effectImmunity.charges) - 1;
      if (ward.charges === 0)
        target.statuses = target.statuses.filter((status) => status !== ward);
      write(
        battle,
        `${target.name} miễn nhiễm ${definition.name}, tiêu 1 lần ${battle.content.statuses[ward.id].name}.`,
      );
      emitEvent(battle, {
        type: "effect_blocked",
        targetId: target.id,
        sourceId,
        statusId,
      });
      return null;
    }
  }
  const previous = target.statuses.find((status) => status.id === statusId);
  target.statuses = target.statuses.filter((status) => status.id !== statusId);
  const applied = {
    id: statusId,
    remaining: duration ?? (definition.persistent ? null : duration),
    sourceId,
    stacks: Math.min(definition.maxStacks ?? 1, (previous?.stacks ?? 0) + 1),
    ...(previous?.refreshedRound !== undefined ? { refreshedRound: previous.refreshedRound } : {}),
  };
  if (definition.effectImmunity)
    applied.charges = definition.effectImmunity.charges;
  if (definition.damageOverTime) {
    applied.potency = Math.max(
      1,
      supportAmount(
        definition.damageOverTime,
        stat(battle, source, definition.damageOverTime.scalingStat),
      ),
    );
  }
  target.statuses.push(applied);
  if (!silent) write(battle, `${target.name}: ${definition.name}.`);
  return applied;
}

function applyEffect(
  battle,
  actor,
  targets,
  effect,
  spent,
  area,
  actionContext = attackContext(battle, actor),
) {
  if (effect.type === "damage" && actionContext.skill?.target === "random_enemies" && effect.to !== "self") {
    for (let index=0;index<(effect.hits??1) && living(actor);index++) {
      const pool=targetsFor(battle,actor,actionContext.skill);
      if (!pool.length) break;
      const roll=battle.random();
      if (!Number.isFinite(roll) || roll<0 || roll>=1) throw new Error("Nguồn chọn mục tiêu không hợp lệ.");
      const target=pool[Math.floor(roll*pool.length)];
      emitEvent(battle,{type:"random_target",sourceId:actor.id,targetId:target.id,hitIndex:index,totalHits:effect.hits??1});
      hit(battle,actor,target,effect,spent,{area:true,actionContext});
    }
    return;
  }
  const recipients = effect.to === "self" ? [actor] : targets;
  for (const target of recipients) {
    if (!living(target)) continue;
    if (effect.type === "damage") {
      for (
        let i = 0;
        i < (effect.hits ?? 1) && living(target) && living(actor);
        i += 1
      )
        hit(battle, actor, target, effect.primaryMultiplier !== undefined ? {...effect,multiplier:target.id===actionContext.primaryTargetId ? effect.primaryMultiplier : effect.multiplier} : effect, spent, { area, actionContext });
    }
    if (effect.type === "turn_order_field") applyTurnOrderField(battle,target,effect,modeIO);
    if (effect.type === "enter_mode") enterCombatMode(battle,target,effect.mode,modeIO);
    if (effect.type === "heal") {
      healHp(battle,target,supportAmount(effect,scalingValue(effect,key=>stat(battle,actor,key)),target.hp / target.stats.maxHp <= EMERGENCY_HP_THRESHOLD),actor.id);
    }
    if (effect.type === "shield") {
      const amount = supportAmount(
        effect,
        scalingValue(effect,key=>stat(battle,actor,key)),
      );
      // Shields do not stack; a weaker shield cannot overwrite a stronger one.
      if (amount > target.shield) {
        target.shield = amount;
        target.shieldSourceId = actor.id;
        target.statuses = target.statuses.filter(
          (status) => !battle.content.statuses[status.id].expiresOnShieldGain,
        );
        emitEvent(battle, {
          type: "shield",
          targetId: target.id,
          sourceId: actor.id,
          amount,
        });
      }
      write(battle, `${target.name} có ${target.shield} khiên.`);
    }
    if (effect.type === "resource")
      gainResource(
        battle,
        target,
        effect.resource,
        effect.resource === "mp"
          ? mpRestoreAmount(effect, target.stats.maxMp)
          : effect.amount,
        actor.id,
      );
    if (effect.type === "status") {
      const count = 1 + (effect.extraStacksIfPresent && actionContext.preMarkedTargets?.has(target.id + ":" + effect.status) ? effect.extraStacksIfPresent : 0);
      const extension = exclusivePassive(actor,"skill_status_duration",actionContext.skillId);
      const duration = effect.duration === undefined ? undefined : effect.duration + (extension?.statusId === effect.status ? extension.extraDuration : 0);
      for (let i = 0; i < count; i++) {
        const applied = applyStatus(battle, target, effect.status, duration, actor.id);
        if (!applied || applied.stacks >= (battle.content.statuses[effect.status].maxStacks ?? 1)) break;
      }
    }
    if (effect.type === "grant_extra_turn") {
      if (battle.phase === "extra") write(battle, `${target.name}: bỏ qua cấp Lượt Thêm trong Vòng Phụ.`);
      else if (battle.extraTurnGrants.has(target.id)) write(battle, `${target.name}: đã có Lượt Thêm trong vòng này.`);
      else {
        battle.extraTurnGrants.add(target.id);
        battle.extraPhaseRequired = true;
        write(battle, `${target.name} nhận Lượt Thêm cho Vòng Phụ ${battle.round}.`);
        emitEvent(battle, {type:"extra_turn_granted",sourceId:actor.id,targetId:target.id,round:battle.round});
      }
    }
    if (effect.type === "toggle_status") {
      if (target.statuses.some((status) => status.id === effect.status)) {
        target.statuses = target.statuses.filter(
          (status) => status.id !== effect.status,
        );
        write(
          battle,
          `${target.name} kết thúc ${battle.content.statuses[effect.status].name}.`,
        );
      } else {
        const applied = applyStatus(
          battle,
          target,
          effect.status,
          effect.duration,
          actor.id,
        );
        if (applied && effect.linkedStatuses)
          applied.linkedStatuses = [...effect.linkedStatuses];
      }
    }
    if (effect.type === "cleanse") {
      target.statuses = target.statuses.filter(
        (status) => battle.content.statuses[status.id].kind !== "debuff",
      );
      write(battle, `${target.name} được giải hiệu ứng bất lợi.`);
    }
  }
}

export function basicAbility(actor) {
  const magical = actor.basicDamageType === "magical";
  return {
    id: "$attack",
    name: magical ? "Phép cơ bản" : "Đánh thường",
    target: "enemy",
    presentation: actor.basicPresentation,
    effects: actor.basicAttack
      ? structuredClone(actor.basicAttack)
      : [
          {
            type: "damage",
            damageType: magical ? "magical" : "physical",
            element: actor.element,
            multiplier: 1,
          },
        ],
  };
}

export const DEFEND = {
  id: "$defend",
  name: "Phòng thủ",
  target: "self",
  effects: [
    { type: "status", status: "guard", duration: 1 },
    { type: "resource", resource: "mp", maxMpRatio: 0.05 },
  ],
};

export function executeAction(battle, { actorId, abilityId, targetId }) {
  return resolveAction(battle, { actorId, abilityId, targetId });
}

function finishStatuses(
  battle,
  actor,
  oldStatuses,
  offensive,
  tickDuration = true,
) {
  actor.statuses = actor.statuses.filter((status) => {
    if (!oldStatuses.includes(status)) return true;
    if (battle.content.statuses[status.id].damageOverTime) return true;
    if (offensive && battle.content.statuses[status.id].consumeOnAttack)
      return false;
    if (
      (battle.content.statuses[status.id].persistent &&
        status.remaining === null) ||
      (battle.content.statuses[status.id].durationClock === "main_turn" && battle.phase === "extra") ||
      !tickDuration
    )
      return true;
    status.remaining -= 1;
    if (
      status.remaining <= 0 &&
      battle.content.statuses[status.id].turnStartAbility
    )
      write(
        battle,
        `${actor.name}: ${battle.content.statuses[status.id].name} hết hiệu lực${actor.passive?.type === "field_growth" && actor.passive.statusId === status.id ? `, ${actor.passive.name} kết thúc` : ""}.`,
      );
    return status.remaining > 0;
  });
}

function resolveAction(
  battle,
  { actorId, abilityId, targetId },
  { endTurn = true, resetEvents = true } = {},
) {
  if (battle.outcome) throw new Error("Trận đấu đã kết thúc.");
  const actor = activeActor(battle);
  if (!actor || actor.id !== actorId)
    throw new Error("Chưa đến lượt nhân vật này.");
  const skill =
    abilityId === "$attack"
      ? basicAbility(actor)
      : abilityId === "$defend"
        ? DEFEND
        : battle.content.abilities[abilityId];
  if (
    !skill ||
    (!abilityId.startsWith("$") && !actor.abilities.includes(abilityId))
  )
    throw new Error("Nhân vật chưa có kỹ năng này.");
  const availability = abilityAvailability(battle, actor, skill);
  if (!availability.ok) throw new Error(availability.reason);
  const legal = targetsFor(battle, actor, skill);
  const area = targetsAsGroup(skill);
  const targets =
    area || skill.target === "self"
      ? legal
      : legal.filter((target) => target.id === targetId);
  if (!targets.length) throw new Error("Mục tiêu không hợp lệ.");
  if (skill.effects.some(effect=>effect.primaryMultiplier!==undefined) && !legal.some(target=>target.id===targetId)) throw new Error("Mục tiêu chính không hợp lệ.");
  // Validate everything before mutating MP, resources or turn order.
  if (resetEvents) battle.events = [];
  const oldStatuses = [...actor.statuses];
  if (skill.presentation) emitEvent(battle,{type:"ability_cast",sourceId:actor.id,abilityId:skill.id,presentation:skill.presentation,targetId,area,targetIds:targets.map(target=>target.id)});
  actor.mp -= mpCost(skill,actor);
  let spent = 0;
  const deferredResource = skill.cost?.resource?.consumeAt === "after";
  if (skill.cost?.resource) {
    const cost = skill.cost.resource;
    spent = cost.all ? actor.resourceValues[cost.id] : cost.amount;
    if (!deferredResource) actor.resourceValues[cost.id] -= spent;
  }
  if (skill.cooldown) actor.cooldowns[skill.id] = skill.cooldown + 1;
  write(battle, `${actor.name} dùng ${skill.name}.`);
  const actionContext = attackContext(battle, actor);
  actionContext.skillId = skill.id;
  actionContext.skill = skill;
  actionContext.primaryTargetId = targetId;
  actionContext.baseStatBonuses = skillBaseStatBonuses(battle,actor,skill,targets);
  for (const [key,amount] of Object.entries(actionContext.baseStatBonuses)) {
    write(battle,actor.name+": "+actor.passive.name+" +"+amount+" "+(key==="magic"?"MAG":"ATK")+" căn bản cho chiêu này.");
    emitEvent(battle,{type:"skill_base_bonus",sourceId:actor.id,abilityId:skill.id,stat:key,amount});
  }
  actionContext.preMarkedTargets = new Set(battle.actors.flatMap(target => target.statuses.map(mark => target.id + ":" + mark.id)));
  const damageBonus = exclusivePassive(actor,"skill_damage",skill.id);
  if (damageBonus) actionContext.multiplier *= 1 + damageBonus.ratio;
  if (actor.passive?.type === "extra_mp_damage" && (skill.cost?.mp ?? 0) > 0 && skill.effects.some(effect => effect.type === "damage") && skill.activation !== "passive") {
    const cap = Math.ceil(skill.cost.mp * actor.passive.extraCostRatio);
    const extra = Math.min(actor.mp,cap);
    actor.mp -= extra;
    actionContext.multiplier *= 1 + (cap ? actor.passive.maxDamageBonus * extra / cap : 0);
    write(battle, `${actor.name}: ${actor.passive.name}, tiêu thêm ${extra}/${cap} MP.`);
  }
  actionContext.hybrid =
    new Set(
      skill.effects
        .filter((effect) => effect.type === "damage")
        .map((effect) => effect.damageType),
    ).size > 1;
  for (const effect of skill.effects)
    applyEffect(battle, actor, targets, effect, spent, area, actionContext);
  const exclusive = actor.exclusiveGear?.template?.passive;
  if (exclusive && (!exclusive.abilityIds || exclusive.abilityIds.includes(skill.id)) && living(actor)) {
    if (exclusive.type === "after_skill_status") {
      for (const target of exclusive.to === "targets" ? targets.filter(living) : [actor]) applyStatus(battle,target,exclusive.statusId,exclusive.duration,actor.id);
    }
    if (exclusive.type === "skill_resource_bonus" && (!exclusive.oncePerRound || procAvailable(battle,actor,"exclusive_resource"))) {
      const before = actor.resourceValues[exclusive.resource] ?? 0;
      gainResource(battle,actor,exclusive.resource,exclusive.amount);
      if (actor.resourceValues[exclusive.resource] > before) markProc(battle,actor,"exclusive_resource");
    }
    if (exclusive.type === "fresh_mark_bonus" && (!exclusive.oncePerRound || procAvailable(battle,actor,"exclusive_mark"))) {
      for (const target of targets.filter(living)) {
        if (!actionContext.preMarkedTargets.has(target.id + ":" + exclusive.statusId) && target.statuses.some(status => status.id === exclusive.statusId)) {
          const old = target.statuses.find(status => status.id === exclusive.statusId).stacks;
          let applied;
          for (let i=0;i<exclusive.amount;i++) {
            applied = applyStatus(battle,target,exclusive.statusId,exclusive.duration,actor.id);
            if (!applied || applied.stacks >= (battle.content.statuses[exclusive.statusId].maxStacks ?? 1)) break;
          }
          if (applied && applied.stacks > old) { markProc(battle,actor,"exclusive_mark"); break; }
        }
      }
    }
    if (exclusive.type === "consumed_targets_mp" && (actionContext.consumedTargets.get(exclusive.statusId)?.size ?? 0) >= exclusive.minTargets) gainResource(battle,actor,"mp",exclusive.amount);
    if (exclusive.type === "next_turn_heal") actor.pendingExclusiveHeal = { ratio: exclusive.ratio, sourceId: actor.id, name: exclusive.name };
  }
  if (deferredResource) {
    const resourceId = skill.cost.resource.id;
    actor.resourceValues[resourceId] = Math.max(
      0,
      actor.resourceValues[resourceId] - spent,
    );
  }
  const offensive = skill.effects.some((effect) => effect.type === "damage");
  // Once per attack action, after its damage and resource cost. New points belong to the next attack.
  if (offensive && living(actor)) {
    for (const status of statusDefinitions(battle, actor)) {
      const trigger = status.onAttackResource;
      const resource = actor.resources?.[trigger?.resource];
      if (
        !trigger ||
        !resource ||
        actor.resourceValues[trigger.resource] >= resource.max
      )
        continue;
      if (battle.random() < trigger.chance) {
        const before = actor.resourceValues[trigger.resource];
        gainResource(battle, actor, trigger.resource, trigger.amount ?? 1);
        const gained = actor.resourceValues[trigger.resource] - before;
        if (gained > 0)
          write(
            battle,
            `${actor.name} tích ${gained} ${actor.resources[trigger.resource].name} từ ${status.name}: ${actor.resourceValues[trigger.resource]} / ${actor.resources[trigger.resource].max}.`,
          );
      }
    }
  }
  finishStatuses(battle, actor, oldStatuses, offensive, endTurn);
  if (offensive) finishAttackContext(battle, actor, actionContext);
  battle.actionCount += 1;
  transitionBossPhases(battle, { write, restoreMp: gainResource });
  if (endTurn) {
    endTurnPassive(battle, actor);
    advance(battle);
  } else checkOutcome(battle);
  return battle;
}

function executeBossTurn(battle, actor) {
  battle.events = [];
  const oldStatuses = [...actor.statuses];
  const jobs = bossTurnJobs(battle, actor);
  let heavyUsed = false;
  for (const [index, job] of jobs.entries()) {
    if (battle.outcome || !living(actor)) break;
    let skill = battle.content.abilities[job.abilityId];
    if (
      !abilityAvailability(battle, actor, skill).ok ||
      (heavyUsed && skill.bossHeavy)
    )
      skill = battle.content.abilities[actor.boss.phases[0].rotation[0][0]];
    if (skill.bossHeavy) heavyUsed = true;
    const legal = targetsFor(battle, actor, skill);
    if (!legal.length) break;
    const target =
      legal.find((item) => item.id === job.targetId) ??
      legal[Math.floor(battle.random() * legal.length)];
    write(
      battle,
      `${actor.name} — Giai đoạn ${actor.bossState.phase}, hành động ${index + 1} / ${jobs.length}.`,
    );
    if (skill.windup && !job.readyRound) {
      actor.bossState.pendingMoves.push({
        abilityId: skill.id,
        readyRound: battle.round + skill.windup.rounds,
        targetId: skill.target === "enemy" ? target.id : undefined,
      });
      write(
        battle,
        `${actor.name} vận sức: ${skill.name}${skill.target === "enemy" ? ` nhắm ${target.name}` : ""}. ${skill.windup.message} Thi triển từ lượt boss ở vòng ${battle.round + skill.windup.rounds}.`,
      );
      battle.actionCount++;
    } else {
      resolveAction(
        battle,
        { actorId: actor.id, abilityId: skill.id, targetId: target.id },
        { endTurn: false, resetEvents: false },
      );
    }
  }
  finishStatuses(battle, actor, oldStatuses, false);
  endTurnPassive(battle, actor);
  if (!battle.outcome) advance(battle);
}

export function executeEnemyTurn(battle) {
  const actor = activeActor(battle);
  if (!actor || actor.team !== "enemy") return;
  if (actor.boss) return executeBossTurn(battle, actor);
  const priority = actor.ai?.priorities.map(rule => {
    const ability = battle.content.abilities[rule.abilityId];
    if (!ability || !abilityAvailability(battle, actor, ability).ok) return null;
    const targets = targetsFor(battle, actor, ability);
    let target;
    if (rule.when === "unshielded" && actor.shield === 0) target = targets[0];
    if (rule.when === "ally_hp_below") target = targets.filter(ally => ally.hp / ally.stats.maxHp < rule.ratio).sort((a,b) => a.hp/a.stats.maxHp-b.hp/b.stats.maxHp)[0];
    if (rule.when === "ally_unshielded") target = targets.find(ally => ally.shield === 0);
    if (rule.when === "missing_status") target = targets.find(ally => !ally.statuses.some(status => status.id === rule.statusId));
    return target ? { ability, target } : null;
  }).find(Boolean);
  const skills = actor.abilities
    .map((id) => battle.content.abilities[id])
    .filter(
      (skill) =>
        abilityAvailability(battle, actor, skill).ok &&
        skill.effects.some((effect) => (effect.type === "damage" || effect.type === "grant_extra_turn")),
    );
  const skill = priority
    ? priority.ability
    : skills.length && battle.random() < 0.7
      ? skills[Math.floor(battle.random() * skills.length)]
      : basicAbility(actor);
  const targets = targetsFor(battle, actor, skill);
  const target = priority?.target ?? targets[Math.floor(battle.random() * targets.length)];
  executeAction(battle, {
    actorId: actor.id,
    abilityId: skill.id,
    targetId: target?.id,
  });
}
