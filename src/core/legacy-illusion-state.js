// Save v6 compatibility only. This does not enable the retired node game mode.
import { integer, record, validId, requireRule, validateGraph, CURRENCIES, dangerLevel } from './legacy-illusion-rules.js';

export function emptyIllusionState() {
  return { version: 1, sequence: 0, gearSerial: 0, globalFlags: [], loreFirstClears: [], days: {}, run: null, lastRun: null,
    tutorial: { completedMapIds: [], completedAt: {} } };
}
export function illusionMapState(state, run) {
  return run.mode === 'tutorial' ? run.trainingMap : state.days[run.dayKey]?.maps[run.mapId];
}
const ids = value => Array.isArray(value) && new Set(value).size === value.length && value.every(validId);
const date = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
export function assertJson(value, depth = 0) {
  requireRule(depth < 70, 'Save Ảo Ảnh quá sâu.');
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return;
  if (typeof value === 'number') { requireRule(Number.isFinite(value), 'Save Ảo Ảnh có số không hợp lệ.'); return; }
  requireRule(Array.isArray(value) || record(value), 'Save Ảo Ảnh phải là JSON.');
  for (const [key, child] of Object.entries(value)) {
    requireRule(!['__proto__','constructor','prototype'].includes(key), 'Khóa dữ liệu không hợp lệ.');
    assertJson(child, depth + 1);
  }
}
export function normalizeIllusionState(input) {
  if (input === undefined) return emptyIllusionState();
  input = { ...input, tutorial: input?.tutorial ?? { completedMapIds: [], completedAt: {} } };
  assertJson(input);
  requireRule(record(input) && input.version === 1 && integer(input.sequence) && integer(input.gearSerial)
    && ids(input.globalFlags) && ids(input.loreFirstClears) && record(input.days), 'Dữ liệu Ảo Ảnh không hợp lệ.');
  requireRule(record(input.tutorial) && ids(input.tutorial.completedMapIds) && record(input.tutorial.completedAt)
    && Object.entries(input.tutorial.completedAt).every(([id, stamp]) => input.tutorial.completedMapIds.includes(id) && date(stamp)), 'Tiến trình hướng dẫn không hợp lệ.');
  for (const [dayKey, day] of Object.entries(input.days)) {
    requireRule(/^\d{4}-\d{2}-\d{2}$/.test(dayKey) && record(day) && record(day.maps) && Array.isArray(day.rewards) && day.rewards.length >= 5, 'Sổ ngày Ảo Ảnh không hợp lệ.');
    for (const [i, reward] of day.rewards.entries()) requireRule(reward.id === i + 1 && CURRENCIES.includes(reward.currency)
      && integer(reward.amount, 1) && ['locked','unclaimed','claimed'].includes(reward.state), 'Mốc thưởng Ảo Ảnh không hợp lệ.');
    for (const [id, map] of Object.entries(day.maps)) {
      requireRule(validId(id) && integer(map.seed) && ids(map.visited) && ids(map.knownLandmarks) && record(map.counts)
        && Array.isArray(map.objectives) && map.objectives.length === 5 && ids(map.objectives.map(x => x.id)), 'Tiến độ map không hợp lệ.');
      validateGraph(map.graph);
      const nodes = map.graph.nodes.map(x => x.id);
      requireRule([...map.visited, ...map.knownLandmarks].every(x => nodes.includes(x)), 'Node tiến độ không thuộc graph.');
      for (const values of Object.values(map.counts)) requireRule(ids(values), 'Bộ đếm mục tiêu không hợp lệ.');
      for (const objective of map.objectives) requireRule(['explore','normal','boss','event','blessing','curse'].includes(objective.type)
        && integer(objective.target, 1) && typeof objective.completed === 'boolean', 'Mục tiêu Ảo Ảnh không hợp lệ.');
    }
  }
  const run = input.run;
  if (run !== null) {
    requireRule(record(run) && run.id === `illusion_${run.sequence}` && integer(run.sequence, 1) && run.sequence <= input.sequence
      && validId(run.mapId) && date(run.startedAt) && date(run.expiresAt) && integer(run.rng) && run.rng <= 0xffffffff
      && integer(run.stamina, -99) && run.stamina <= 100 && integer(run.spent) && ids(run.visited) && ids(run.revealed) && ids(run.revealCounted)
      && ids(run.restUsed) && ids(run.curseBacklash) && ids(run.actionIds) && ids(run.dangerWaves)
      && ids(run.blessings) && ids(run.curses) && run.curses.length <= 3 && record(run.bindings) && record(run.events)
      && record(run.pendingLoot) && integer(run.pendingLoot.prismaFragments) && integer(run.pendingLoot.recruitmentShards)
      && Array.isArray(run.pendingLoot.gear) && Array.isArray(run.party) && run.party.length > 0 && run.party.length <= 4
      && ids(run.party.map(x => x.id)) && record(run.loadout) && record(run.effectRules), 'Chuyến Ảo Ảnh không hợp lệ.');
    requireRule(run.mode === undefined || ['exploration','tutorial'].includes(run.mode), 'Loại chuyến đi không hợp lệ.');
    const dailyMap = illusionMapState(input, run);
    if (run.mode === 'tutorial') {
      requireRule(record(dailyMap) && integer(run.practiceCoins) && record(run.training) && validId(run.training.stage)
        && Array.isArray(dailyMap.visited) && Array.isArray(dailyMap.knownLandmarks), 'Chuyến hướng dẫn không hợp lệ.');
      validateGraph(dailyMap.graph);
    }
    requireRule(dailyMap && dailyMap.graph.nodes.some(n => n.id === run.currentNodeId)
      && run.danger === dangerLevel(run.revealCounted.length, run.spent), 'Chuyến không khớp ngày hoặc Danger.');
    const nodeIds = dailyMap.graph.nodes.map(n => n.id);
    requireRule([...run.visited,...run.revealed,...run.revealCounted,...run.restUsed,...run.curseBacklash,Object.keys(run.bindings)].flat().every(id => nodeIds.includes(id))
      && run.revealCounted.every(id=>run.revealed.includes(id)) && Object.keys(run.bindings).length===nodeIds.length, 'Chuyến có node lạ.');
    requireRule(run.loadout.party.filter(Boolean).join('|')===run.party.map(a=>a.id).join('|'), 'Đội hình chuyến không khớp snapshot.');
    for (const actor of run.party) requireRule(integer(actor.maxHp, 1) && integer(actor.maxMp) && integer(actor.hp) && actor.hp <= actor.maxHp
      && integer(actor.mp) && actor.mp <= actor.maxMp, 'HP/MP hành trình không hợp lệ.');
    for (const binding of Object.values(run.bindings)) requireRule(record(binding) && ['empty','rest','safe','landmark','encounter','event','blessing','curse'].includes(binding.kind)
      && ['available','cleared'].includes(binding.state), 'Nội dung node không hợp lệ.');
    for (const event of Object.values(run.events)) requireRule(validId(event.id) && ['available','active','completed','failed'].includes(event.state), 'Sự kiện không hợp lệ.');
    if (run.combat !== null) requireRule(record(run.combat) && record(run.combat.snapshot) && validId(run.combat.encounterId)
      && run.combat.danger===run.danger && run.currentNodeId===run.combat.nodeId
      && nodeIds.includes(run.combat.nodeId) && run.combat.snapshot.encounterId === run.combat.encounterId, 'Snapshot trận không hợp lệ.');
  }
  if (input.lastRun !== null) requireRule(record(input.lastRun) && validId(input.lastRun.id) && typeof input.lastRun.reason === 'string', 'Tổng kết chuyến không hợp lệ.');
  return structuredClone(input);
}

export function assertIllusionLoadoutLocked(before, after) {
  if (!before.illusion?.run) return;
  for (const key of ['party','characters','gear','equipment','extraGearSlots','exclusiveGear','equippedExclusiveGear','activePartyPresetId','partyPresets'])
    requireRule(JSON.stringify(before[key]) === JSON.stringify(after[key]), 'Đội hình và trang bị đang khóa trong chuyến Ảo Ảnh.');
}
