import { damageMultiplier, supportAmount, effectiveStat, speedDamageBonus, speedDamageRatio, mpRestoreAmount, EMERGENCY_HEAL_MULTIPLIER, EMERGENCY_HP_THRESHOLD } from '../core/combat-math.js';
import { battleStat } from '../core/stat-values.js';

// Shared presentation for preparation previews and combat commands.
// Numeric previews use the same multiplier / support rounding as the battle engine.
export function skillDescription(skill) {
  if (skill.description) return skill.description;
  if (skill.id === '$attack' && new Set(skill.effects.map(effect => effect.damageType)).size > 1) return 'Đòn cơ bản không tốn MP. Phần vật lí tính qua DEF, phần ma pháp tính qua RES.';
  return skill.id === '$defend'
    ? 'Giảm 40% sát thương đến hết lượt kế tiếp và hồi ngay 5% MP tối đa (làm tròn lên, không vượt MP tối đa).'
    : 'Đòn cơ bản, không tốn tài nguyên.';
}

export function skillCost(skill, actor) {
  const costs = [];
  if (skill.cost?.mp) {
    const base=skill.cost.mp;
    const cap=actor.passive?.type==='extra_mp_damage' && skill.effects.some(effect=>effect.type==='damage') ? Math.ceil(base*actor.passive.extraCostRatio) : 0;
    const extra=actor.mp===undefined?cap:Math.min(cap,Math.max(0,actor.mp-base));
    costs.push((extra ? base+'–'+(base+extra) : base)+' MP');
  }
  if (skill.cost?.resource) {
    const cost = skill.cost.resource;
    const name = actor.resources[cost.id].name;
    costs.push(`${cost.all ? `Toàn bộ ${name} (ít nhất ${cost.min})` : `${cost.amount} ${name}`}${cost.consumeAt === 'after' ? ' · Tiêu sau khi thi triển' : ''}`);
  }
  if (skill.requiresResource) costs.push('Cần '+skill.requiresResource.min+' '+actor.resources[skill.requiresResource.id].name);
  if (skill.cooldown) costs.push(`Hồi chiêu: ${skill.cooldown} vòng`);
  return costs.join(' · ') || 'Không tốn MP';
}

export const TARGET_NAMES = {
  enemy: 'Một kẻ địch', all_enemies: 'Mọi kẻ địch',
  ally: 'Một đồng đội', all_allies: 'Toàn đội', self: 'Bản thân'
};

export function passiveDescription(actor, content) {
  const passive = actor.passive;
  if (!passive) return null;
  if (passive.type==='combat_mode') return passive.name+': '+passive.description;
  if (["extra_mp_damage","marked_ally_magic","hp_difference_damage","ally_heal_mp","stat_conversion","end_round_lowest_mp"].includes(passive.type)) return `${passive.name}: ${passive.description}`;
  if (['team_flat_self', 'team_flat_aura'].includes(passive.type)) {
    const names = { attack: 'ATK', magic: 'MAG', defense: 'DEF', resistance: 'RES', speed: 'SPD' };
    const group = passive.tag === 'valmont' ? 'Valmont' : passive.tag;
    const bonus = Object.entries(passive.modifiers).map(([key, value]) => `+${value} ${names[key]} căn bản`).join(', ');
    const recipient = passive.type === 'team_flat_self' ? `cho bản thân, với mỗi ${group} trong đội${passive.excludeSelf ? ' trừ bản thân' : ' (gồm bản thân)'}` : `cho mọi thành viên ${group}, với mỗi ${group} trong đội${passive.countSelf ? ' (gồm bản thân)' : ' trừ người cấp nội tại'}`;
    return `${passive.name}: ${bonus} ${recipient}. Cộng trước buff %, chốt theo đội hình lúc bắt đầu trận; đồng đội gục không làm mất bonus. Nhân vật ngoài đội chưa được cộng bonus đội hình trong preview.`;
  }
  if (passive.type === 'end_turn_mp_regen') return `${passive.name}: cuối lượt của chính mình, hồi ${percent(passive.ratio)} MP tối đa cho từng đồng đội còn sống, tăng thành ${percent(passive.ratio * passive.tagMultiplier)} với ${passive.tag === 'valmont' ? 'Valmont' : passive.tag} (gồm bản thân nếu đúng nhóm). Làm tròn lên, không vượt MP tối đa; bị choáng vẫn hồi, đã gục thì không kích hoạt.`;
  if (passive.type === 'field_growth') {
    const label = { attack: 'ATK', magic: 'MAG', defense: 'DEF', resistance: 'RES', speed: 'SPD' }[passive.stat];
    return `${passive.name}: mỗi đầu lượt còn ${content?.statuses[passive.statusId]?.name ?? 'đám mây'}, tăng ${percent(passive.ratio)} ${label} trước đòn mây, tối đa ${percent(passive.ratio * passive.maxStacks)}. ${label} tính trên chỉ số nền gồm trang bị, cộng tỷ lệ với buff khác. Mây hết hoặc người gọi gục thì mất toàn bộ bonus. Mây đánh tự động không hưởng/tiêu buff đòn kế tiếp.`;
  }
  if (passive.type === 'resource_stat_boost') {
    const names = { attack: 'ATK', magic: 'MAG', defense: 'DEF', resistance: 'RES', speed: 'SPD' };
    const resource = actor.resources[passive.resource];
    return `${passive.name}: mỗi ${resource.name} tăng ${percent(passive.ratio)} ${names[passive.stat]} trên chỉ số nền gồm trang bị; tối đa ${resource.max} điểm (+${percent(passive.ratio * resource.max)}). Hiệu lực thay đổi ngay khi tích hoặc tiêu điểm, cộng tỷ lệ với buff/debuff chỉ số khác.`;
  }
  if (passive.type === 'stat_boost') {
    const names = { attack: 'ATK', magic: 'MAG', defense: 'DEF', resistance: 'RES', speed: 'SPD' };
    return `${passive.name}: ${Object.entries(passive.modifiers).map(([key, amount]) => `${amount >= 0 ? '+' : '−'}${percent(Math.abs(amount))} ${names[key]} vĩnh viễn (${number(actor.baseStats?.[key] ?? actor.stats[key])} ${actor.gearBonuses?.[key] ? 'nền gồm gear' : 'cơ bản'} → ${number(effectiveStat(actor, key))})`).join('; ')}. Buff trong trận cộng tỷ lệ trên chỉ số nền${actor.gearBonuses ? ' gồm gear' : ''}.`;
  }
  if (passive.type === 'damage_reduction') return `${passive.requiresStatus?`Khi có ${content.statuses[passive.requiresStatus].name}, giảm`:'Luôn giảm'} ${Math.round(passive.amount * 100)}% sát thương nhận.`;
  if (passive.type === 'shield_break_attack_buff') {
    const status = content?.statuses[passive.statusId];
    return `${passive.name}: khi tự đánh vỡ khiên của kẻ địch, nhận ${status?.name ?? passive.statusId}. Đòn tấn công kế tiếp gây ${percent(status?.modifiers.attackMultiplier ?? 2)} sát thương (nhân riêng với buff khác). Hiệu lực bắt đầu sau toàn bộ đòn phá khiên, không cộng dồn; Phòng thủ/hỗ trợ giữ buff, đánh lại vỡ khiên sẽ cấp buff mới sau khi dùng buff cũ.`;
  }
  if (passive.type === 'shield_break_status') return `${passive.name}: khi khiên bị đánh vỡ và vẫn còn sống, nhận ${passive.statuses.map(status => `${content?.statuses?.[status.id]?.name ?? status.id}${status.duration ? ` (${status.duration} lượt)` : ''}`).join(', ')}.`;
  if (passive.type === 'speed_damage') return `${passive.name}: cộng ${percent(passive.ratio)} SPD hiện tại vào sát thương gốc của mỗi nhát vật lí, trước phòng thủ và điểm yếu. Áp dụng cho đánh thường và kỹ năng; tốc độ từ gear và buff đều có hiệu lực.`;
  if (passive.type === 'shield_break_heal') return `Khi khiên do ${actor.name} tạo bị phá, hồi tối đa ${Math.round(actor.stats.magic * passive.multiplier)} HP cho người mang khiên nếu cả hai còn đứng vững.`;
  if (passive.type === 'dodge_counter') return `Né thành công sẽ phản công và tạo 1 ${actor.resources[passive.resource].name}, tối đa một lần mỗi vòng.`;
  if (passive.type === 'magic_followup_mp') {
    const effect = content?.abilities[passive.followUpAbility]?.effects[0];
    const attack = effect ? `${percent(effect.multiplier ?? 1)} MAG hệ ${effect.element.toUpperCase()}` : 'một đòn phép';
    return `${passive.name}: mỗi vòng một lần, khi đồng đội khác gây sát thương phép đơn mục tiêu lên kẻ địch còn sống, liên kích ${attack} và tích 1 ${actor.resources[passive.resource].name}. Đòn của bản thân không kích hoạt liên kích. Đầu lượt nếu có ít nhất ${passive.threshold} ${actor.resources[passive.resource].name}, tiêu hết để hồi ${percent(passive.mpRestoreRatio)} MP tối đa cho mỗi đồng đội còn sống, gồm bản thân. Liên kích (FuA) không kích hoạt liên kích khác.`;
  }
  return null;
}

const number = value => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value);
const percent = value => `${number(value * 100)}%`;

export function skillPreviewOptions(skill, actor, content) {
  const controls = [];
  if (actor.passive?.type === 'field_growth' && skill.effects.some(effect => effect.type === 'damage')) controls.push({ key: 'fieldStacks', label: 'Uy lôi giả định', min: 0, max: actor.passive.maxStacks });
  if (skill.effects.some(effect => effect.perResource) && skill.cost?.resource?.all) {
    const resource = skill.cost.resource;
    controls.push({ key: 'spent', label: `${actor.resources[resource.id].name} giả định`, min: resource.min ?? 1, max: actor.resources[resource.id].max });
  }
  const mark = skill.effects.find(effect => effect.consumeStatus && effect.perStack);
  if (mark) controls.push({ key: 'stacks', label: `${content.statuses[mark.consumeStatus].name} trên mỗi mục tiêu`, min: 0, max: content.statuses[mark.consumeStatus].maxStacks ?? 1 });
  if (skill.effects.some(effect => effect.lowHpBonus)) controls.push({ key: 'hpPercent', label: 'HP người dùng (%)', min: 1, max: 100 });
  return controls;
}

export function skillScaling(skill, actor, content, choices = {}) {
  const lines = [];
  const valueOf = key => choices.live ? battleStat(content, actor, key) : effectiveStat(actor, key);
  const cost = skill.cost?.resource;
  const resourceName = cost ? actor.resources[cost.id].name : '';
  const spent = choices.spent ?? (cost?.all ? actor.resources[cost.id].max : cost?.amount ?? 0);
  const perPerson = skill.target === 'all_allies' ? '/người' : '';
  for (const effect of skill.effects) {
    if (effect.type === 'damage') {
      const stat = effect.damageType === 'physical' ? 'ATK' : 'MAG';
      let formula = effect.primaryMultiplier !== undefined ? `${percent(effect.primaryMultiplier)} ${stat} mục tiêu chính / ${percent(effect.multiplier)} ${stat} còn lại` : `${percent(effect.multiplier ?? 1)} ${stat}`;
      if (effect.perResource) formula += ` + ${percent(effect.perResource)} ${stat} mỗi ${resourceName} đã tiêu`;
      if (effect.perStack) formula += ` + ${percent(effect.perStack)} ${stat} mỗi ${content.statuses[effect.consumeStatus].name}`;
      if (effect.lowHpBonus) formula += ` + tối đa ${percent(effect.lowHpBonus)} ${stat} theo tỷ lệ HP đã mất`;
      const speedRatio = speedDamageRatio(actor, effect.damageType, effect.speedMultiplier ?? 0);
      if (speedRatio > 0) formula += ` + ${percent(speedRatio)} SPD`;
      const hitPrefix = effect.hits > 1 ? `${effect.hits} hit × (` : '';
      const hybrid = new Set(skill.effects.filter(effect => effect.type === 'damage').map(effect => effect.damageType)).size > 1;
      lines.push(`Hệ số${hybrid ? effect.damageType === 'physical' ? ' phần vật lí (tính DEF)' : ' phần ma pháp (tính RES)' : ''}: ${hitPrefix}${formula}${hitPrefix ? ')' : ''}.`);
      if (actor.passive?.type === 'field_growth' && !choices.live) {
        const passive = actor.passive;
        const growth = choices.fieldStacks ?? actor.statuses?.find(status => status.id === passive.statusId)?.growth ?? 0;
        const assumed = { ...actor, statuses: [{ id: passive.statusId, growth }] };
        const label = { attack: 'ATK', magic: 'MAG', defense: 'DEF', resistance: 'RES', speed: 'SPD' }[passive.stat];
        lines.push(`Giả định ${growth} ${passive.name}: +${percent(growth * passive.ratio)} ${label} → ${number(effectiveStat(assumed, passive.stat))} ${label} trước buff/debuff khác.`);
      }
      if (speedRatio > 0) lines.push(`Phần cộng từ tốc độ ${choices.live ? 'hiện tại' : 'chuẩn bị'}: ${number(speedDamageBonus(actor, effect.damageType, valueOf('speed'), effect.speedMultiplier ?? 0))} sát thương mỗi nhát, trước phòng thủ${effect.speedMultiplier && actor.passive?.type === 'speed_damage' ? ', đã gồm nội tại' : ''}.`);
      if (effect.perResource || effect.perStack || effect.lowHpBonus) {
        const stacks = choices.stacks ?? (content.statuses[effect.consumeStatus]?.maxStacks ?? 0);
        const multiplier = damageMultiplier(effect, { spent, stacks, hpRatio: (choices.hpPercent ?? 100) / 100 });
        lines.push(`Hệ số ${choices.live ? 'với trạng thái hiện tại' : 'theo giả định'}: ${effect.hits > 1 ? `${effect.hits} hit × ` : ''}${percent(multiplier)} ${stat}.`);
        if (actor.passive?.type === 'resource_stat_boost' && actor.passive.resource === cost?.id && !choices.live) {
          const passive = actor.passive;
          const assumed = { ...actor, resourceValues: { ...actor.resourceValues, [cost.id]: spent } };
          lines.push(`Với ${spent} ${resourceName}: +${percent(spent * passive.ratio)} ${stat} nền → ${number(effectiveStat(assumed, passive.stat))} ${stat} trước buff/debuff trong trận.`);
        }
      }
      if (cost?.consumeAt === 'after') lines.push('Giữ bonus chỉ số từ tài nguyên khi gây sát thương, tiêu số điểm đã dùng sau khi thi triển.');
      if (effect.penetration) lines.push(`Xuyên ${percent(effect.penetration)} ${effect.damageType === 'physical' ? 'DEF' : 'RES'} của mục tiêu.`);
      if (effect.unavoidable) lines.push('Đòn đánh không thể né.');
    }
    if (effect.type === 'heal' || effect.type === 'shield') {
      const key = effect.scalingStat ?? 'magic';
      const label = { attack: 'ATK', magic: 'MAG', defense: 'DEF', resistance: 'RES' }[key];
      const value = valueOf(key);
      const formula = [effect.multiplier ? `${percent(effect.multiplier)} ${label}` : '', effect.flat ? number(effect.flat) : ''].filter(Boolean).join(' + ') || '0';
      const amount = supportAmount(effect, value);
      lines.push(`${effect.type === 'shield' ? 'Khiên' : 'Hồi phục'}: ${formula} → ${number(amount)} ${effect.type === 'shield' ? 'khiên' : 'HP'}${perPerson}.`);
      if (effect.type === 'heal' && effect.emergency) lines.push(`Khi mục tiêu còn ≤${percent(EMERGENCY_HP_THRESHOLD)} HP: lượng hồi ×${number(EMERGENCY_HEAL_MULTIPLIER)} → ${number(supportAmount(effect, value, true))} HP${perPerson}.`);
    }
    if (effect.type === 'resource') {
      const recipient = effect.to === 'self' || skill.target === 'self' ? ' cho bản thân' : '';
      if (effect.resource === 'mp' && effect.maxMpRatio !== undefined) {
        const formula = `${effect.amount ? `${effect.amount} + ` : ''}${percent(effect.maxMpRatio)} MP tối đa`;
        const amount = recipient ? ` → ${number(mpRestoreAmount(effect, actor.stats.maxMp))} MP${recipient}` : ' của người nhận';
        lines.push(`Hồi ${formula}${amount}; phần theo tỷ lệ làm tròn lên, không vượt MP tối đa.`);
      } else lines.push(`${effect.resource === 'mp' ? 'Hồi' : 'Tạo'} ${effect.amount} ${effect.resource === 'mp' ? 'MP' : actor.resources[effect.resource]?.name ?? effect.resource}${recipient}.`);
    }
    if (effect.type === 'grant_extra_turn') lines.push('Cấp 1 Lượt Thêm trong Vòng Phụ hiện tại; tối đa 1/người/vòng. Không chen lượt chính. Trong Vòng Phụ, chỉ bỏ qua hiệu ứng cấp lượt; vẫn tiêu MP và hồi chiêu.');
    if (effect.onHitStatus) {
      const mark=content.statuses[effect.onHitStatus.status];
      lines.push('Mỗi hit trúng gắn 1 ' + mark.name + ', tối đa ' + mark.maxStacks + ' tầng, trong ' + effect.onHitStatus.duration + ' lượt mục tiêu.');
      if (mark.modifiersPerStack) lines.push(Object.entries(mark.modifiers).map(([key,n])=>percent(n)+' '+(key==='resistance'?'RES':key)+' mỗi tầng').join(', '));
    }
    if (effect.type === 'cleanse') lines.push('Giải toàn bộ hiệu ứng bất lợi trên người nhận.');
    if (['status', 'toggle_status'].includes(effect.type)) {
      const status = content.statuses[effect.status];
      const extension=actor.exclusiveGear?.template?.passive;
      const effectiveDuration=effect.duration + (extension?.type==='skill_status_duration' && extension.statusId===effect.status && extension.abilityIds.includes(skill.id) ? extension.extraDuration : 0);
      const duration = status.persistent && effect.duration === undefined ? status.expiresOnShieldGain ? 'đến khi nhận khiên mới' : 'duy trì đến khi tắt hoặc hết trận' : `${effectiveDuration} lượt của người nhận`;
      if (status.effectImmunity) lines.push(`${status.name}: chặn ${status.effectImmunity.charges} hiệu ứng bất lợi mới${status.effectImmunity.hostileOnly ? ' từ kẻ địch (không chặn hình phạt tự gây)' : ''}, rồi tiêu hiệu ứng khi hết số lần. Không giải hiệu ứng đã có; mỗi debuff tiêu một lần, không chặn cả chiêu nhiều debuff. Dùng lại làm mới, không cộng dồn · ${duration}.`);
      if (effect.type === 'toggle_status') lines.push(`Bật/tắt ${status.name}; dùng lại để xuống ngựa, không cộng dồn.`);
      const labels = { attack: 'ATK', magic: 'MAG', defense: 'DEF', resistance: 'RES (kháng phép)', speed: 'SPD', damageBonus: 'sát thương gây ra', evasion: 'khả năng né đòn vật lí' };
      for (const [key, value] of Object.entries(status.modifiers ?? {})) {
        if (key === 'damageVsShielded') lines.push(`Gây thêm ${percent(value)} sát thương nếu mục tiêu có khiên lúc từng hit bắt đầu; nhân riêng, áp dụng cả khiên và sát thương tràn vào HP · ${duration}.`);
        else if (key === 'attackMultiplier') lines.push(`Đòn tấn công kế tiếp gây ${percent(value)} sát thương, nhân riêng với buff khác · ${duration}.`);
        else if (key === 'damageTakenBonus') lines.push(`Nhận thêm ${percent(value)} sát thương · ${duration}.`);
        else lines.push(key === 'damageReduction' ? `Giảm ${percent(value)} sát thương nhận · ${duration}.` : `${value >= 0 ? '+' : '−'}${percent(Math.abs(value))} ${labels[key] ?? key} · ${duration}.`);
      }
      if (status.skipTurn) lines.push(`Bỏ qua hành động trong ${duration}; hiệu ứng đầu lượt vẫn xử lý.`);
      if (status.regen) lines.push(`Hồi ${percent(status.regen)} HP tối đa của người nhận vào đầu lượt · ${duration}.`);
      if (status.onDamagedResource) lines.push(`Mỗi hit chịu đựng tạo 1 ${actor.resources?.[status.onDamagedResource]?.name ?? status.onDamagedResource} · ${duration}.`);
      if (status.onAttackResource) {
        const trigger = status.onAttackResource;
        lines.push(`Mỗi hành động tấn công có ${percent(trigger.chance)} cơ hội tạo ${trigger.amount ?? 1} ${actor.resources?.[trigger.resource]?.name ?? trigger.resource} sau khi đánh (một lần/hành động) · ${duration}.`);
      }
      if (status.damageOverTime) {
        const dot = status.damageOverTime;
        const scaling = dot.scalingStat === 'attack' ? 'ATK' : 'MAG';
        lines.push(`Độc: ${number(dot.flat ?? 0)} + ${percent(dot.multiplier ?? 0)} ${scaling} → ${number(Math.max(1, supportAmount(dot, valueOf(dot.scalingStat))))} HP mỗi đầu lượt mục tiêu, trong ${effect.duration} lần.`);
        lines.push('Bỏ qua giáp và khiên; không hưởng điểm yếu, không kích hoạt liên kích. Không cộng dồn; dùng lại làm mới. Lượng độc ghi nhận chỉ số lúc sử dụng và vẫn duy trì khi người gây độc gục.');
      }
      if (status.cover) lines.push(`Nhận đòn đơn mục tiêu thay người nhận · ${duration}.`);
      if (status.taunt) lines.push(`Thu hút các đòn đơn mục tiêu · ${duration}.`);
      if (status.blockResourceGain) lines.push(`Chặn tích tài nguyên · ${duration}.`);
      if (status.maxStacks) lines.push(`Đặt ${status.name}, tối đa ${status.maxStacks} tầng · ${duration}.`);
      if (effect.extraStacksIfPresent) lines.push(`Nếu mục tiêu đã có ${status.name} trước chiêu, gắn thêm ${effect.extraStacksIfPresent} tầng, vẫn tuân thủ giới hạn.`);
      if (status.durationClock === 'main_turn') lines.push('Hết sau lượt Vòng Chính kế tiếp của người nhận; Vòng Phụ không giảm thời hạn.');
      if (status.consumeOnAttack) lines.push('Tiêu hiệu ứng sau hành động tấn công tiếp theo.');
      for (const statusId of effect.linkedStatuses ?? []) {
        lines.push(`Buff đi kèm: ${content.statuses[statusId].name} (gỡ cùng trạng thái chính nếu do trạng thái này cấp).`);
        lines.push(...skillScaling({ target: skill.target, effects: [{ type: 'status', status: statusId }] }, actor, content, choices));
      }
    }
  }
  const exclusive=actor.exclusiveGear?.template?.passive;
  if (exclusive && (!exclusive.abilityIds || exclusive.abilityIds.includes(skill.id))) lines.push('Trấn Phái · ' + exclusive.name + ': ' + exclusive.description);
  if (actor.passive?.type==='extra_mp_damage' && skill.cost?.mp > 0 && skill.effects.some(effect=>effect.type==='damage')) {
    const cap=Math.ceil(skill.cost.mp*actor.passive.extraCostRatio);
    const available=choices.live ? Math.max(0,actor.mp-skill.cost.mp) : cap;
    const spent=Math.min(cap,available);
    lines.push('Nội tại: tiêu thêm '+spent+'/'+cap+' MP một lần cho cả chiêu → sát thương ×'+number(1+actor.passive.maxDamageBonus*spent/cap)+'; không tính riêng mỗi mục tiêu/hit.');
  }
  return lines;
}
