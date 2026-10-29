import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../scripts/load-content.mjs';
import { enemyStatMultipliers, scaleEnemyStats } from '../src/core/enemy-scaling.js';
import { validateDungeonContent } from '../src/core/dungeon-rules.js';
import { enemyScaleSummary } from '../src/ui/dungeon-presentation.js';
const content = await loadContent();

test('numeric battle scaling keeps legacy HP/MP semantics; individual stat factors default to one', () => {
  const base = { maxHp: 101, maxMp: 25, attack: 13, magic: 17, defense: 11, resistance: 12, speed: 19 };
  assert.deepEqual(scaleEnemyStats(base, 1.5), { ...base, maxHp: 152, maxMp: 38 });
  assert.deepEqual(scaleEnemyStats(base, { maxHp: 1.75, attack: 1.25, magic: 1.25 }), { ...base, maxHp: 177, attack: 16, magic: 21 });
  assert.equal(enemyStatMultipliers({ maxHp: 1.1 }).maxMp, 1);
  assert.equal(base.attack, 13);
  assert.throws(() => scaleEnemyStats({ ...base, attack: Number.MAX_SAFE_INTEGER }, { attack: 2 }));
});
test('invalid per-stat dungeon scaling is rejected before a run starts', () => {
  for (const value of [undefined, null, 0, -1, Infinity, [], {}, { hp: 2 }, { attack: 0 }, { magic: NaN }, { maxHp: -2 }, { speed: 0.5 }]) {
    const modified = structuredClone(content);
    modified.dungeons.gold_mine.difficulties[0].enemyScale = value;
    assert.ok(validateDungeonContent(modified).some(error => /scaling/.test(error)), String(value));
  }
  assert.deepEqual(validateDungeonContent(content), []);
});
test('preview reports all independently changed factors with Vietnamese number formatting', () => {
  const summary = enemyScaleSummary(content.dungeons.gold_mine.difficulties[1].enemyScale);
  assert.equal(summary, 'HP ×1,75 · MP ×2,25 · ATK ×1,25 · MAG ×1,25');
});
