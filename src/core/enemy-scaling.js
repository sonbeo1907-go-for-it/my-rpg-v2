export const ENEMY_SCALE_STATS = Object.freeze([
  'maxHp', 'maxMp', 'attack', 'magic', 'defense', 'resistance', 'speed',
]);

export function enemyStatMultipliers(value = 1) {
  // A numeric override retains the legacy HP/MP-only contract.
  const input = typeof value === 'number' ? { maxHp: value, maxMp: value } : value;
  if (!input || typeof input !== 'object' || Array.isArray(input) || !Object.keys(input).length
    || Object.entries(input).some(([key, factor]) => !ENEMY_SCALE_STATS.includes(key) || !Number.isFinite(factor) || factor <= 0))
    throw new Error('Thiết lập hệ số quái không hợp lệ.');
  return Object.fromEntries(ENEMY_SCALE_STATS.map(key => [key, input[key] ?? 1]));
}

export function scaleEnemyStats(stats, value = 1) {
  const factors = enemyStatMultipliers(value), scaled = { ...stats };
  for (const key of ENEMY_SCALE_STATS) {
    const amount = Math.max(key === 'maxHp' ? 1 : 0, Math.round(stats[key] * factors[key]));
    if (!Number.isSafeInteger(amount)) throw new Error('Chỉ số quái sau khi nhân vượt giới hạn cho phép.');
    scaled[key] = amount;
  }
  return scaled;
}

export function enemyHpProfile(encounter = {}) {
  if(encounter.hpScalingProfile!==undefined&&!['normal','boss','superboss'].includes(encounter.hpScalingProfile))throw Error('Đường tăng HP của trận không hợp lệ.');
  const profile = encounter.hpScalingProfile ?? ({normal:'normal',boss:'boss',super:'superboss'}[encounter.rewardTier ?? 'normal']);
  if (!['normal','boss','superboss'].includes(profile)) throw Error('Đường tăng HP của trận không hợp lệ.');
  return profile;
}

function checkLevel(level) {
  if (!Number.isInteger(level) || level < 1 || level > 99) throw Error('Level đối thủ không hợp lệ.');
}

export function enemyHpFactor(level, profile, content) {
  checkLevel(level);
  const segments = content.progressionRules.default.enemyHpCurves?.[profile];
  if (!Array.isArray(segments) || !segments.length || level > segments.at(-1).untilLevel)
    throw Error('Level vượt phạm vi đường tăng HP đã thiết kế.');
  let factor = 1, lower = 1;
  for (const {untilLevel,growth} of segments) {
    factor *= (1 + growth) ** Math.max(0, Math.min(level,untilLevel) - lower);
    lower = untilLevel;
  }
  return factor;
}

export function enemyStatFactor(key, level, content) {
  checkLevel(level);
  const rules = content.progressionRules.default;
  const target = rules.enemyStatGrowthTargets[['attack','magic'].includes(key) ? 'offense' : 'defense'];
  if (['attack','magic','defense','resistance'].includes(key)) {
    // Each post-30 step has twice the logarithmic growth weight. Normalize the
    // total budget so the target is exact at 50, then freeze pending Super Level.
    const capped=Math.min(level,target.atLevel),pivot=target.accelerateAfterLevel;
    const weight=Math.min(capped,pivot)-1+Math.max(0,capped-pivot)*target.lateGrowthWeight;
    const budget=pivot-1+(target.atLevel-pivot)*target.lateGrowthWeight;
    return target.multiplier ** (weight/budget);
  }
  if (!['maxMp','speed'].includes(key)) throw Error('Chỉ số tăng trưởng không hợp lệ.');
  return 1 + rules.enemyGrowth[key] * (level - 1);
}

// Scale immutable templates once; encounter context controls HP, never enemy identity/rank.
export function levelScaledEnemyStats(enemy,level,content,override=1,encounter={}) {
  checkLevel(level);
  const ref = encounter.referenceLevel ?? enemy.referenceLevel ?? content.progressionRules.default.enemyBaselineLevel;
  const hpRef = encounter.hpReferenceLevel ?? enemy.hpReferenceLevel ?? ref;
  const profile = enemyHpProfile(encounter);
  const hpRatio = enemyHpFactor(level,profile,content) / enemyHpFactor(hpRef,profile,content);
  const normalized = Object.fromEntries(ENEMY_SCALE_STATS.map(key => [key, enemy.stats[key] * (key === 'maxHp'
    ? hpRatio : enemyStatFactor(key,level,content) / enemyStatFactor(key,ref,content))]));
  return scaleEnemyStats(normalized,override);
}

export function validateEnemyScalingRules(content) {
  const r=content.progressionRules?.default, errors=[];
  if(r?.enemyBaselineLevel!==1)errors.push('Invalid enemy baseline level');
  for (const [profile,max] of [['normal',50],['boss',50],['superboss',90]]) {
    const segments=r?.enemyHpCurves?.[profile];
    if (!Array.isArray(segments) || !segments.length || segments.at(-1)?.untilLevel!==max
      || segments.some((s,i)=>!s || !Number.isInteger(s.untilLevel) || s.untilLevel<= (i?segments[i-1]?.untilLevel:1)
        || !Number.isFinite(s.growth) || s.growth<0)) errors.push('Invalid enemy HP curve '+profile);
  }
  if (!r?.enemyHpCurves || Object.keys(r.enemyHpCurves).some(k=>!['normal','boss','superboss'].includes(k))) errors.push('Invalid enemy HP profiles');
  for (const key of ['offense','defense']) {
    const t=r?.enemyStatGrowthTargets?.[key];
    if (!t || t.atLevel!==50 || !Number.isFinite(t.multiplier) || t.multiplier<=1 || !Number.isInteger(t.accelerateAfterLevel) || t.accelerateAfterLevel<2 || t.accelerateAfterLevel>=t.atLevel || !Number.isFinite(t.lateGrowthWeight) || t.lateGrowthWeight<=1) errors.push('Invalid enemy stat target '+key);
  }
  if (r?.enemyStatGrowthTargets?.aboveCap!=='freeze') errors.push('Invalid enemy Super Level fallback');
  return errors;
}
