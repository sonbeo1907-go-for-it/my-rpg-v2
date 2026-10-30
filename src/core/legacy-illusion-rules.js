// Save v6 compatibility only. This does not enable the retired node game mode.
// Shared exploration rules. Map identities, stories and special actions live outside this module.
import { dungeonDay, nextDungeonReset } from './dungeon-rules.js';

export const DANGER_LEVELS = Object.freeze([
  { level: 0, reveals: 0, spent: 0, hp: 1, power: 1, normalDrop: 0, bossDrop: 0 },
  { level: 1, reveals: 12, spent: 6, hp: 1.05, power: 1.03, normalDrop: 0, bossDrop: 0 },
  { level: 2, reveals: 25, spent: 14, hp: 1.12, power: 1.06, normalDrop: 0, bossDrop: 0 },
  { level: 3, reveals: 40, spent: 25, hp: 1.22, power: 1.11, normalDrop: .08, bossDrop: .20 },
  { level: 4, reveals: 60, spent: 40, hp: 1.35, power: 1.16, normalDrop: .12, bossDrop: .30 },
]);
export const STAT_KEYS = ['attack', 'magic', 'defense', 'resistance', 'speed'];
export const CURRENCIES = ['coins', 'prisma', 'recruitmentShards', 'prismaFragments', 'originalPrisma'];
export function requireRule(ok, message) { if (!ok) throw new Error(message); }
export const integer = (v, min = 0) => Number.isSafeInteger(v) && v >= min;
export const record = v => v !== null && typeof v === 'object' && !Array.isArray(v);
export const validId = v => typeof v === 'string' && /^[a-zA-Z0-9_.:-]{1,160}$/.test(v) && !['__proto__', 'constructor', 'prototype'].includes(v);
export function addUnique(list, value) { if (!list.includes(value)) list.push(value); }
export function addCurrency(campaign, key, amount) {
  requireRule(CURRENCIES.includes(key) && integer(amount) && integer((campaign[key] ?? 0) + amount), 'Phần thưởng vượt giới hạn.');
  campaign[key] = (campaign[key] ?? 0) + amount;
}
export function hashSeed(text) {
  let seed = 2166136261;
  for (const char of String(text)) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
  return seed >>> 0;
}
// JSON stores the CURRENT PRNG state, not just its initial seed.
export function runRandom(holder) {
  requireRule(integer(holder.rng) && holder.rng <= 0xffffffff, 'Seed Ảo Ảnh không hợp lệ.');
  return () => { holder.rng = (Math.imul(1664525, holder.rng) + 1013904223) >>> 0; return holder.rng / 4294967296; };
}
export function weighted(items, random) {
  requireRule(items.length > 0 && items.every(x => Number.isFinite(x.weight) && x.weight > 0), 'Pool Ảo Ảnh rỗng hoặc sai trọng số.');
  let value = random() * items.reduce((sum, x) => sum + x.weight, 0);
  return items.find(x => (value -= x.weight) < 0) ?? items.at(-1);
}
export function dangerLevel(reveals, spent) {
  return DANGER_LEVELS.filter(x => reveals >= x.reveals && spent >= x.spent).at(-1)?.level ?? 0;
}
export function exhaustion(stamina) {
  return { speed: stamina <= -20 ? -.10 : 0, attack: stamina <= -40 ? -.10 : 0,
    magic: stamina <= -40 ? -.10 : 0, defense: stamina <= -60 ? -.15 : 0,
    resistance: stamina <= -60 ? -.15 : 0, damageTakenBonus: stamina <= -80 ? .20 : 0 };
}
export function runExpiry(now) { return nextDungeonReset(new Date(nextDungeonReset(now).getTime() + 1)).toISOString(); }
export function isRunExpired(run, now) { return new Date(now).getTime() >= new Date(run.expiresAt).getTime(); }
export { dungeonDay };

export function validateGraph(graph) {
  requireRule(record(graph) && Array.isArray(graph.nodes) && graph.nodes.length > 0 && graph.nodes.length <= 2000, 'Graph Ảo Ảnh không hợp lệ.');
  const ids = new Map(), coordinates = new Set();
  for (const node of graph.nodes) {
    requireRule(validId(node.id) && !ids.has(node.id) && integer(node.x, -100000) && integer(node.y, -100000)
      && Array.isArray(node.neighbors) && node.neighbors.length <= 4 && new Set(node.neighbors).size === node.neighbors.length, 'Node Ảo Ảnh không hợp lệ.');
    const coordinate = `${node.x}:${node.y}`;
    requireRule(!coordinates.has(coordinate), 'Hai node trùng tọa độ.'); coordinates.add(coordinate); ids.set(node.id, node);
  }
  requireRule(ids.has(graph.startNodeId), 'Thiếu node xuất phát.');
  for (const node of graph.nodes) for (const id of node.neighbors) {
    const other = ids.get(id);
    requireRule(other && other.neighbors.includes(node.id) && Math.abs(other.x - node.x) + Math.abs(other.y - node.y) === 1, 'Cạnh phải hai chiều và nối bốn hướng.');
  }
  const reached = new Set([graph.startNodeId]), queue = [graph.startNodeId];
  for (let i = 0; i < queue.length; i++) for (const id of ids.get(queue[i]).neighbors) if (!reached.has(id)) { reached.add(id); queue.push(id); }
  requireRule(reached.size === ids.size, 'Graph có node không thể tiếp cận.');
  return graph;
}

// Utility for content authors/tests; production maps may register entirely different generators.
export function rectangularGraph(width, height, startNodeId = '0:0') {
  requireRule(integer(width, 1) && integer(height, 1) && width * height <= 2000, 'Kích thước graph không hợp lệ.');
  const nodes = [];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) nodes.push({ id: `${x}:${y}`, x, y, slot: 'empty',
    neighbors: [[x-1,y],[x+1,y],[x,y-1],[x,y+1]].filter(([a,b]) => a >= 0 && a < width && b >= 0 && b < height).map(([a,b]) => `${a}:${b}`) });
  return validateGraph({ startNodeId, nodes });
}
