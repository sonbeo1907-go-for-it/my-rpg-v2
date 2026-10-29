export const ENEMY_SCALE_STATS = Object.freeze([
  'maxHp', 'maxMp', 'attack', 'magic', 'defense', 'resistance', 'speed',
]);

export function enemyStatMultipliers(value = 1) {
  // Retain the original numeric contract: a scalar scales HP and MP only.
  const input = typeof value === 'number' ? { maxHp: value, maxMp: value } : value;
  if (!input || typeof input !== 'object' || Array.isArray(input) || !Object.keys(input).length
    || Object.entries(input).some(([key, factor]) => !ENEMY_SCALE_STATS.includes(key) || !Number.isFinite(factor) || factor <= 0))
    throw new Error('Thiết lập hệ số quái không hợp lệ.');
  return Object.fromEntries(ENEMY_SCALE_STATS.map(key => [key, input[key] ?? 1]));
}

export function scaleEnemyStats(stats, value = 1) {
  const factors = enemyStatMultipliers(value);
  const scaled = { ...stats };
  for (const key of ENEMY_SCALE_STATS) {
    const amount = Math.max(key === 'maxHp' ? 1 : 0, Math.round(stats[key] * factors[key]));
    if (!Number.isSafeInteger(amount)) throw new Error('Chỉ số quái sau khi nhân vượt giới hạn cho phép.');
    scaled[key] = amount;
  }
  return scaled;
}
