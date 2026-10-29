// Encounter rules are authored on enemy definitions; no character/encounter IDs in the battle engine.
export function initializeBoss(actor) {
  if (!actor.boss) return;
  actor.bossState = { phase: 1, rotationStep: 0, pendingMoves: [] };
}

export function bossPhase(actor) { return actor.boss?.phases[actor.bossState.phase - 1]; }

export function bossHealthFloor(actor) {
  const next = actor.boss?.phases[actor.bossState.phase];
  return next ? Math.ceil(actor.stats.maxHp * next.atHpRatio) : 0;
}

export function bossFireMultiplier(actor, effect) {
  if (!actor.boss || actor.bossState.phase !== 3 || effect.element !== 'fire') return 1;
  const rule = actor.boss.suppression;
  const stacks = actor.statuses.find(status => status.id === rule.statusId)?.stacks ?? 0;
  return rule.fireMultipliers[stacks];
}

export function suppressOnWeakness(battle, attacker, target, context, write, apply) {
  if (!target.boss || context.weaknessTargets.has(target.id)) return;
  context.weaknessTargets.add(target.id);
  const rule = target.boss.suppression;
  const status = apply(rule.statusId, rule.durations[target.bossState.phase - 1]);
  if (!status) return;
  write(battle, `${target.name}: Kìm hãm ${status.stacks} / ${rule.maxStacks} (${status.remaining} lượt của boss).`);
}

export function transitionBossPhases(battle, { write, restoreMp }) {
  for (const actor of battle.actors) {
    if (!actor.boss || actor.hp <= 0) continue;
    const state = actor.bossState, next = actor.boss.phases[state.phase];
    if (!next || actor.hp > Math.ceil(actor.stats.maxHp * next.atHpRatio)) continue;
    state.phase++;
    state.rotationStep = 0; state.pendingMoves = [];
    const phase = bossPhase(actor);
    write(battle, `${actor.name} chuyển Giai đoạn ${state.phase}: ${phase.name}!`);
    const suppression = actor.statuses.find(status => status.id === actor.boss.suppression.statusId);
    if (suppression) suppression.remaining = Math.min(suppression.remaining, actor.boss.suppression.durations[state.phase - 1]);
    for (const ally of battle.actors.filter(item => item.team !== actor.team && item.hp > 0)) restoreMp(battle, ally, 'mp', ally.stats.maxMp, actor.id);
    write(battle, 'Chuyển giai đoạn: hồi đầy MP cho toàn đội còn sống.');
  }
}

// Due telegraphs take a slot in the next turn, never add a third move.
export function bossTurnJobs(battle, actor) {
  const state = actor.bossState, phase = bossPhase(actor);
  const due = state.pendingMoves.filter(move => move.readyRound <= battle.round);
  state.pendingMoves = state.pendingMoves.filter(move => move.readyRound > battle.round);
  const rotation = phase.rotation[state.rotationStep++ % phase.rotation.length];
  return [...due, ...rotation.map(abilityId => ({ abilityId }))].slice(0, phase.actionsPerTurn);
}

export function validateBossDefinition(actor, content, fail) {
  if (!actor.boss) return;
  const boss = actor.boss, id = actor.id;
  const abilityExists = skill => typeof skill === 'string' && Object.hasOwn(content.abilities, skill);
  if (boss.type !== 'three_phase_dragon' || !Array.isArray(boss.phases) || boss.phases.length !== 3) {
    fail(`${id}: invalid boss phases`); return;
  }
  boss.phases.forEach((phase, index) => {
    if (!phase || typeof phase.name !== 'string' || !phase.name
      || !Number.isFinite(phase.atHpRatio) || phase.atHpRatio <= 0 || phase.atHpRatio > 1
      || (index === 0 ? phase.atHpRatio !== 1 : phase.atHpRatio >= boss.phases[index - 1]?.atHpRatio)
      || phase.actionsPerTurn !== (index === 2 ? 2 : 1)
      || !Array.isArray(phase.rotation) || !phase.rotation.length) { fail(`${id}: invalid boss phase ${index + 1}`); return; }
    for (const moves of phase.rotation) {
      if (!Array.isArray(moves) || moves.length !== phase.actionsPerTurn
        || moves.some(skill => !abilityExists(skill) || !actor.abilities?.includes(skill)
          || !['enemy', 'all_enemies'].includes(content.abilities[skill].target)
          || !content.abilities[skill].effects?.some(effect => effect.type === 'damage'))) fail(`${id}: invalid boss rotation`);
    }
  });
  const rule = boss.suppression;
  if (!rule || !Object.hasOwn(content.statuses, rule.statusId ?? '') || rule.maxStacks !== 2
    || content.statuses[rule.statusId]?.maxStacks !== rule.maxStacks || content.statuses[rule.statusId]?.kind !== 'debuff'
    || JSON.stringify(rule.durations) !== '[3,3,2]'
    || !Array.isArray(rule.fireMultipliers) || rule.fireMultipliers.length !== rule.maxStacks + 1
    || rule.fireMultipliers.some((value, index) => !Number.isFinite(value) || value < 1 || (index > 0 && value > rule.fireMultipliers[index - 1]))) fail(`${id}: invalid boss suppression`);
  const fallback = content.abilities[boss.phases[0]?.rotation?.[0]?.[0]];
  if (!fallback || fallback.cost?.mp || fallback.cost?.resource || fallback.cooldown || fallback.windup) fail(`${id}: boss requires a free fallback attack`);
}
