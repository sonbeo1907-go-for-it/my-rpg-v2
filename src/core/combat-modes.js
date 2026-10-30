// Modes belong to actors. Leaving is idempotent; presentation never mutates gameplay.
export function activeCombatMode(actor) { return actor?.combatModes?.[actor.activeMode] ?? null; }
export function enterCombatMode(battle, actor, id, io) {
  if (actor.activeMode || !actor.combatModes?.[id]) throw new Error('Không thể chuyển dạng.');
  actor.activeMode = id;
  io.write(battle, actor.name + ' triệu hồi ' + actor.combatModes[id].name + '.');
  io.emit(battle,{type:'mode_enter',sourceId:actor.id,mode:id});
}
export function leaveCombatMode(battle, actor, reason, io) {
  const mode = activeCombatMode(actor);
  if (!mode) return false;
  const id = actor.activeMode;
  delete actor.activeMode; // Clear first: nested hooks cannot refund twice.
  io.emit(battle,{type:'mode_exit',sourceId:actor.id,mode:id,reason});
  io.write(battle, mode.name + ' rời sân.');
  io.restore(battle,actor,'mp',Math.ceil(actor.stats.maxMp * mode.exitMpRatio),actor.id);
  return true;
}
export function checkCombatMode(battle,actor,reason,io) {
  const mode=activeCombatMode(actor);
  if (mode && (actor.hp<=0 || battle.outcome || ((reason==='turn_start'||reason==='round_end') && (actor.resourceValues?.[mode.resource]??0)<=0))) return leaveCombatMode(battle,actor,reason,io);
  return false;
}
export function modeAvailability(actor,skill) {
  const mode=activeCombatMode(actor);
  if (mode && !mode.allowedAbilities.includes(skill.id)) return {ok:false,reason:'Không thể sử dụng khi ' + mode.name + ' đang hiện diện.'};
  if (skill.requiresMode && actor.activeMode!==skill.requiresMode) return {ok:false,reason:'Cần triệu hồi ' + (actor.combatModes?.[skill.requiresMode]?.name??skill.requiresMode) + '.'};
  const required=skill.requiresResource;
  if (required && (actor.resourceValues?.[required.id]??0)<required.min) return {ok:false,reason:'Cần '+required.min+' '+(actor.resources?.[required.id]?.name??required.id)+'.'};
  return null;
}
export function battlePresentation(actors) {
  const owner=actors.find(actor=>actor.hp>0 && activeCombatMode(actor));
  const mode=activeCombatMode(owner);
  return mode ? {ownerId:owner.id,mode:owner.activeMode,music:mode.music,background:mode.background,name:mode.name}:null;
}
