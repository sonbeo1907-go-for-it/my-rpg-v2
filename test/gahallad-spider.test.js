import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../scripts/load-content.mjs';
import { createCampaign, resolveCharacter, serializeCampaign, deserializeCampaign } from '../src/core/progression.js';
import { createBattle, getActor, executeAction, executeEnemyTurn } from '../src/core/battle.js';
import { effectiveStat } from '../src/core/combat-math.js';
import { validateContent } from '../src/core/content.js';
import { pullGacha } from '../src/core/economy.js';
import { skillScaling, passiveDescription } from '../src/ui/skill-presentation.js';
import { activeStatuses } from '../src/core/status-state.js';

const content = await loadContent();
function setup(party = ['gahallad', 'iris', 'elaine'], source = content, encounter = 'giant_spider_lair') {
  const campaign = createCampaign(source); campaign.party = party; campaign.unlockedCharacterIds = Object.keys(source.characters);
  return createBattle(source, campaign, encounter, () => .99);
}
function use(battle, actorId, abilityId, targetId = actorId) {
  battle.cursor = battle.queue.indexOf(actorId);
  executeAction(battle, { actorId, abilityId, targetId });
}
function enemyTurn(battle) { battle.cursor = battle.queue.indexOf('enemy_0'); executeEnemyTurn(battle); }
const spider = battle => getActor(battle, 'enemy_0');
const has = (actor, id) => actor.statuses.some(status => status.id === id);

test('Gahallad has a persistent toggled cavalry mode granting 15% ATK, without stacking or leaking into new battles', () => {
  const battle = setup(), actor = getActor(battle, 'gahallad');
  assert.equal(actor.element, 'dark');
  assert.equal(actor.roleGroup, 'physical_dps');
  use(battle, actor.id, 'gahallad.mount');
  assert.ok(Math.abs(effectiveStat(actor, 'attack', content.statuses.black_cavalry.modifiers.attack) - 39.1) < 1e-9);
  assert.equal(actor.mp, 65);
  assert.equal(actor.statuses.find(status => status.id === 'black_cavalry').remaining, null);
  assert.equal(activeStatuses(actor).some(status => status.id === 'siegebreaker'), true);
  for (let i = 0; i < 5; i++) use(battle, actor.id, '$defend');
  assert.equal(has(actor, 'black_cavalry'), true);
  use(battle, actor.id, 'gahallad.mount');
  assert.equal(effectiveStat(actor, 'attack'), 34); assert.equal(has(actor, 'black_cavalry'), false);
  assert.equal(activeStatuses(actor).some(status => status.id === 'siegebreaker'), false);
  use(battle, actor.id, 'gahallad.mount');
  assert.equal(actor.statuses.filter(status => status.id === 'black_cavalry').length, 1);
  assert.deepEqual(getActor(setup(), 'gahallad').statuses, []);
});

test('mounted bonus applies to shield damage and overflow, while spider exposure starts on subsequent hits', () => {
  const battle = setup(), actor = getActor(battle, 'gahallad');
  use(battle, actor.id, 'gahallad.mount'); enemyTurn(battle);
  assert.equal(spider(battle).shield, 140); assert.equal(spider(battle).mp, 90);
  const hp = spider(battle).hp;
  use(battle, actor.id, 'gahallad.charge', 'enemy_0');
  const event = battle.events.find(event => event.type === 'damage');
  assert.equal(event.absorbed, 140); assert.equal(event.amount, 98); // Total hit 238, not doubled again on break.
  assert.equal(spider(battle).hp, hp - 98);
  assert.equal(has(spider(battle), 'shell_exposed'), true);
  assert.equal(battle.log.filter(line => line.includes('bị choáng, mất lượt')).length, 1);
  assert.equal(spider(battle).mp, 90); // Stunned turn cannot attack or shield.
  assert.equal(has(actor, 'cavalry_momentum'), true);
  use(battle, actor.id, 'gahallad.trample', 'enemy_0');
  assert.equal(battle.events.find(event => event.type === 'damage').amount, 230);
  assert.equal(has(actor, 'cavalry_momentum'), false);
  assert.equal(actor.mp, 45);
});

test('shield bonus is reusable on another ally and another character, not coupled to Gahallad IDs', () => {
  const source = structuredClone(content);
  source.abilities['test.cavalry'] = { id: 'test.cavalry', name: 'Test buff', target: 'ally', effects: [{ type: 'status', status: 'siegebreaker', duration: 2 }] };
  source.characters.iris.abilities.push('test.cavalry');
  assert.deepEqual(validateContent(source), []);
  for (const [recipient, expected] of [['arthur', 82], ['aurora', 64]]) {
    const battle = setup(['iris', recipient], source, 'forest_patrol');
    spider(battle).shield = 1000;
    use(battle, 'iris', 'test.cavalry', recipient);
    use(battle, recipient, '$attack', 'enemy_0');
    assert.equal(battle.events.find(event => event.type === 'damage').absorbed, expected);
    assert.equal(getActor(battle, recipient).statuses.find(status => status.id === 'siegebreaker').remaining, 1);
  }
});

test('each hit checks current shield: a two-hit attack does not stack shield bonus with newly exposed vulnerability', () => {
  const source = structuredClone(content); source.abilities['gahallad.trample'].effects[0].hits = 2;
  const battle = setup(['gahallad', 'iris'], source);
  use(battle, 'gahallad', 'gahallad.mount'); spider(battle).shield = 1;
  use(battle, 'gahallad', 'gahallad.trample', 'enemy_0');
  assert.deepEqual(battle.events.filter(event => event.type === 'damage').map(event => [event.amount, event.absorbed]), [[114, 1], [115, 0]]);
  assert.equal(battle.log.filter(line => line.includes('vỡ khiên!')).length, 1);
  assert.equal(has(getActor(battle, 'gahallad'), 'cavalry_momentum'), true);
  use(battle, 'gahallad', 'gahallad.trample', 'enemy_0');
  assert.deepEqual(battle.events.filter(event => event.type === 'damage').map(event => event.amount), [230, 230]);
  assert.equal(has(getActor(battle, 'gahallad'), 'cavalry_momentum'), false);
});

test('without a shield mounted attacks only gain ATK; vulnerability is not present before the first shield break', () => {
  const battle = setup(); use(battle, 'gahallad', 'gahallad.mount');
  assert.equal(spider(battle).shield, 0); assert.equal(has(spider(battle), 'shell_exposed'), false);
  use(battle, 'gahallad', 'gahallad.trample', 'enemy_0');
  assert.equal(battle.events.find(event => event.type === 'damage').amount, 57);
});

test('shield priority AI restores its shield and clears exposed status when available', () => {
  const battle = setup(); spider(battle).shield = 1;
  use(battle, 'gahallad', 'gahallad.trample', 'enemy_0');
  assert.equal(has(spider(battle), 'shell_exposed'), true);
  const before = spider(battle).mp;
  enemyTurn(battle);
  assert.equal(spider(battle).shield, 140);
  assert.equal(spider(battle).mp, before - 10);
  assert.equal(has(spider(battle), 'shell_exposed'), false);
  assert.ok(battle.log.some(line => line.endsWith('dùng Kén tơ sắt.')));
});

test('spider vulnerability also doubles periodic damage without triggering repeated shield breaks', () => {
  const battle = setup(['gahallad', 'kai']);
  spider(battle).shield = 1;
  use(battle, 'gahallad', 'gahallad.trample', 'enemy_0');
  use(battle, 'kai', 'kai.poison', 'enemy_0');
  const event = battle.events.find(event => event.periodic);
  assert.equal(event.amount, 24);
  assert.equal(event.weakness, false);
  assert.equal(battle.log.filter(line => line.includes('vỡ khiên!')).length, 1);
});

test('preview presents persistent cavalry, shield multiplier and damage formulas', () => {
  const actor = resolveCharacter(content, createCampaign(content), 'gahallad');
  const lines = skillScaling(content.abilities['gahallad.mount'], actor, content).join('\n');
  assert.match(lines, /Bật\/tắt/); assert.match(lines, /15% ATK/);
  assert.match(lines, /thêm 100% sát thương.*mục tiêu có khiên/);
  assert.match(lines, /duy trì đến khi tắt hoặc hết trận/);
  assert.match(lines, /Buff đi kèm: Phá Thành/);
  assert.match(passiveDescription(actor, content), /Sát uy dư chấn.*200% sát thương/);
  assert.match(skillScaling(content.abilities['gahallad.charge'], actor, content).join('\n'), /240% ATK/);
});

test('Gahallad is locked in old saves, recruitable and uses the normal duplicate/save flow', () => {
  const old = createCampaign(content); delete old.characters.gahallad;
  let campaign = deserializeCampaign(serializeCampaign(old), content);
  assert.deepEqual(campaign.characters.gahallad, { level: 1, upgradeIds: [] });
  assert.equal(campaign.unlockedCharacterIds.includes('gahallad'), false);
  campaign.coins = 200; campaign.prisma = 10;
  const pool = content.banners.standard.characterPool;
  for (let i = 0; i < 2; i++) {
    const draws = [.95, (pool.indexOf('gahallad') + .5) / pool.length];
    campaign = pullGacha(campaign, content, 'standard', 1, () => draws.shift()).campaign;
  }
  const restored = deserializeCampaign(serializeCampaign(campaign), content);
  assert.ok(restored.unlockedCharacterIds.includes('gahallad'));
  assert.equal(restored.extraGearSlots.gahallad, 1);
  assert.equal(restored.recruitmentShards, 10);
});

test('content validates reusable toggle/status/shield-break/AI contracts', () => {
  for (const corrupt of [
    data => { data.statuses.black_cavalry.persistent = false; },
    data => { data.statuses.siegebreaker.modifiers.damageVsShielded = NaN; },
    data => { data.statuses.shell_exposed.modifiers.damageTakenBonus = -1; },
    data => { data.statuses.stunned.persistent = true; },
    data => { data.statuses.stunned.skipTurn = 'yes'; },
    data => { data.enemies.giant_spider.passive.statuses[0].duration = 0; },
    data => { data.enemies.giant_spider.passive.statuses[1].id = 'missing'; },
    data => { data.enemies.giant_spider.ai.priorities[0].abilityId = 'enemy.spider_bite'; }
  ]) {
    const invalid = structuredClone(content); corrupt(invalid); assert.ok(validateContent(invalid).length);
  }
});
