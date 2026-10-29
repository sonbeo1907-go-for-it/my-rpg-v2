import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../scripts/load-content.mjs';
import { createCampaign, completeStoryEvent } from '../src/core/progression.js';
import { equipGear } from '../src/core/equipment.js';
import { seededRandom } from '../src/core/random.js';
import { createBattle, getActor, activeActor, executeAction, executeEnemyTurn, abilityAvailability } from '../src/core/battle.js';
import { bossFireMultiplier } from '../src/core/boss-mechanics.js';
import { validateContent } from '../src/core/content.js';

const content = await loadContent();
function setup(party = ['arthur', 'iris', 'elaine', 'garrek'], random = () => .99, source = content) {
  const campaign = createCampaign(source); campaign.party = party;
  campaign.storyFlags.push('illusion.sinister_unlocked');
  campaign.unlockedCharacterIds = Object.keys(source.characters);
  return createBattle(source, campaign, 'miraebolis_superboss', random);
}
function use(battle, actorId, abilityId, targetId = actorId) {
  battle.cursor = battle.queue.indexOf(actorId);
  executeAction(battle, { actorId, abilityId, targetId });
}
const boss = battle => getActor(battle, 'enemy_0');
const mark = battle => boss(battle).statuses.find(status => status.id === 'dragon_suppressed');
function stageThree(battle) {
  const enemy = boss(battle);
  enemy.hp = 1260; enemy.bossState.phase = 3;
  enemy.bossState.rotationStep = 0; enemy.bossState.pendingMoves = [];
}
function bossTurn(battle) { battle.cursor = battle.queue.indexOf('enemy_0'); executeEnemyTurn(battle); }

test('Miraebolis has three HP phases, Water/Light/Thunder weaknesses and Fire resistance', () => {
  const definition = content.enemies.miraebolis;
  assert.equal(definition.stats.maxHp, 3600);
  assert.deepEqual(definition.weaknesses, ['water', 'light', 'thunder']);
  assert.equal(definition.resistances.fire, .7);
  assert.deepEqual(definition.boss.phases.map(phase => [phase.atHpRatio, phase.actionsPerTurn]), [[1, 1], [.65, 1], [.35, 2]]);
  for (const element of ['water', 'light', 'thunder']) for (const type of ['physical', 'magical']) {
    const battle = setup(['arthur']), actor = getActor(battle, 'arthur');
    actor.element = element; actor.basicDamageType = type; actor.stats.attack = 80; actor.stats.magic = 80;
    use(battle, 'arthur', '$attack', 'enemy_0');
    const event = battle.events.find(event => event.type === 'damage');
    assert.equal(event.amount, type === 'physical' ? 93 : 91);
    assert.equal(event.weakness, true); assert.equal(mark(battle).stacks, 1);
  }
});

test('weakness adds one suppression per attack action, caps at two, refreshes and counts shield damage', () => {
  const source = structuredClone(content); source.abilities['arthur.light_slash'].effects[0].hits = 3;
  const battle = setup(['arthur'], () => .99, source);
  use(battle, 'arthur', 'arthur.light_slash', 'enemy_0');
  assert.equal(mark(battle).stacks, 1); assert.equal(mark(battle).remaining, 3);
  use(battle, 'arthur', '$attack', 'enemy_0');
  assert.equal(mark(battle).stacks, 2);
  mark(battle).remaining = 1;
  boss(battle).shield = 1000;
  const hp = boss(battle).hp;
  use(battle, 'arthur', 'arthur.light_slash', 'enemy_0');
  assert.equal(boss(battle).hp, hp);
  assert.equal(mark(battle).stacks, 2); assert.equal(mark(battle).remaining, 3);
  getActor(battle, 'arthur').element = 'plain'; mark(battle).remaining = 1;
  use(battle, 'arthur', '$attack', 'enemy_0');
  assert.equal(mark(battle).remaining, 1);
});

test('a Light primary and Thunder follow-up independently suppress; multi-hit follow-up counts once', () => {
  const source = structuredClone(content); source.abilities['aurora.follow_up'].effects[0].hits = 3;
  const battle = setup(['lisbeth', 'aurora'], () => .99, source);
  use(battle, 'lisbeth', 'lisbeth.lance', 'enemy_0');
  assert.equal(mark(battle).stacks, 2);
  assert.equal(battle.log.filter(line => line.includes('Kìm hãm')).length, 2);
  assert.equal(getActor(battle, 'aurora').resourceValues.thunder_charge, 1);
});

test('phase one suppression expires after three whole boss turns', () => {
  const battle = setup(['arthur']);
  use(battle, 'arthur', '$attack', 'enemy_0');
  for (const remaining of [2, 1, 0]) {
    bossTurn(battle);
    assert.equal(mark(battle)?.remaining ?? 0, remaining);
  }
});

test('phase three uses two moves but ticks suppression only once; flames scale by 160/130/100 percent', () => {
  for (const [stacks, expected] of [[0, 86], [1, 70], [2, 54]]) {
    const battle = setup(['arthur']); stageThree(battle);
    if (stacks) boss(battle).statuses.push({ id: 'dragon_suppressed', stacks, remaining: 2, sourceId: 'arthur' });
    assert.equal(bossFireMultiplier(boss(battle), { element: 'fire' }), [1.6, 1.3, 1][stacks]);
    assert.equal(bossFireMultiplier(boss(battle), { element: 'plain' }), 1);
    bossTurn(battle);
    assert.equal(battle.log.filter(line => /hành động [12] \/ 2/.test(line)).length, 2);
    assert.equal(battle.events.filter(event => event.sourceId === 'enemy_0' && event.type === 'damage').length, 2);
    assert.equal(battle.events.find(event => event.element === 'fire').amount, expected);
    if (stacks) assert.equal(mark(battle).remaining, 1);
    assert.equal(boss(battle).mp, 593);
  }
});

test('phase transitions gate overflow damage and restore only living allies MP exactly once', () => {
  const battle = setup(), enemy = boss(battle);
  getActor(battle, 'iris').hp = 0;
  for (const actor of battle.actors.filter(actor => actor.team === 'party')) actor.mp = 0;
  const arthur = getActor(battle, 'arthur'); arthur.hp = 50; arthur.stats.attack = 100000;
  arthur.resourceValues.resonance = 2; arthur.cooldowns.test = 4;
  use(battle, 'arthur', '$attack', 'enemy_0');
  assert.equal(enemy.hp, 2340); assert.equal(enemy.bossState.phase, 2);
  assert.equal(arthur.mp, 40); assert.equal(arthur.hp, 50);
  assert.equal(arthur.resourceValues.resonance, 2); assert.equal(arthur.cooldowns.test, 4);
  assert.equal(getActor(battle, 'iris').hp, 0); assert.equal(getActor(battle, 'iris').mp, 0);
  arthur.mp = 1;
  use(battle, 'arthur', '$attack', 'enemy_0');
  assert.equal(enemy.hp, 1260); assert.equal(enemy.bossState.phase, 3); assert.equal(arthur.mp, 40);
  assert.equal(battle.log.filter(line => line.includes('hồi đầy MP')).length, 2);
});

test('phase two immediately continues normal round order with a real boss turn and no extra end-round attack', () => {
  const battle = setup(); boss(battle).hp = 2341;
  use(battle, 'arthur', '$attack', 'enemy_0');
  assert.equal(boss(battle).bossState.phase, 2);
  while (battle.round === 1) {
    const actor = activeActor(battle);
    if (actor.team === 'enemy') executeEnemyTurn(battle);
    else executeAction(battle, { actorId: actor.id, abilityId: '$defend' });
  }
  assert.equal(battle.queue.length, 5);
  assert.ok(battle.queue.includes('enemy_0'));
  const acted = [];
  while (battle.round === 2) {
    const actor = activeActor(battle); acted.push(actor.id);
    if (actor.team === 'enemy') executeEnemyTurn(battle);
    else executeAction(battle, { actorId: actor.id, abilityId: '$defend' });
  }
  assert.deepEqual(acted, ['iris', 'elaine', 'enemy_0', 'arthur', 'garrek']);
  assert.equal(battle.actors.filter(actor => actor.team === 'party').every(actor => actor.hp === actor.stats.maxHp), true);
  assert.equal(boss(battle).bossState.pendingMoves[0].abilityId, 'enemy.miraebolis_sweep');
});

test('phase three starts immediately at 35%, refills MP again and clamps suppression without changing HP', () => {
  const battle = setup(); boss(battle).hp = 2341;
  use(battle, 'arthur', '$attack', 'enemy_0');
  for (const actor of battle.actors.filter(actor => actor.team === 'party')) { actor.mp = 0; actor.hp -= 10; }
  const hp = battle.actors.filter(actor => actor.team === 'party').map(actor => actor.hp);
  boss(battle).hp = 1261;
  use(battle, 'arthur', '$attack', 'enemy_0');
  assert.equal(boss(battle).bossState.phase, 3); assert.equal(boss(battle).hp, 1260);
  assert.equal(mark(battle).remaining, 2);
  assert.deepEqual(battle.actors.filter(actor => actor.team === 'party').map(actor => actor.mp), [40, 90, 100, 45]);
  assert.deepEqual(battle.actors.filter(actor => actor.team === 'party').map(actor => actor.hp), hp);
  assert.equal(battle.log.filter(line => line.includes('hồi đầy MP')).length, 2);
  getActor(battle, 'arthur').mp = 0;
  use(battle, 'arthur', '$attack', 'enemy_0');
  assert.equal(getActor(battle, 'arthur').mp, 0);
});

test('phase three telegraphs use a move slot; release waits for a complete response window', () => {
  const battle = setup(); stageThree(battle); boss(battle).bossState.rotationStep = 3;
  bossTurn(battle);
  assert.equal(boss(battle).bossState.pendingMoves[0].abilityId, 'enemy.miraebolis_doom');
  assert.equal(battle.events.filter(event => event.type === 'damage').length, 1); // Charge + Fang, not instant Doom.
  const acted = new Set();
  while (activeActor(battle).team !== 'enemy') {
    const actor = activeActor(battle); acted.add(actor.id);
    executeAction(battle, { actorId: actor.id, abilityId: '$defend' });
  }
  assert.deepEqual(acted, new Set(['arthur', 'garrek', 'iris', 'elaine']));
  executeEnemyTurn(battle);
  assert.equal(battle.events.filter(event => event.type === 'damage').length, 5); // Doom hits four, then Fang hits one.
  assert.equal(boss(battle).bossState.pendingMoves.length, 0);
  assert.ok(battle.log.includes('Miraebolis · Hắc Long Thiêu Thành dùng Tâm diệt thành.'));
});

test('a lethal counter cancels the second move and surviving counters remain capped once per round', () => {
  const lethal = setup(['takeshi'], () => 0); stageThree(lethal); boss(lethal).hp = 1;
  getActor(lethal, 'takeshi').element = 'light';
  use(lethal, 'takeshi', 'takeshi.stance'); bossTurn(lethal);
  assert.equal(lethal.outcome, 'victory');
  assert.equal(lethal.log.some(line => line.endsWith('dùng Hỏa cầu hắc long.')), false);
  assert.equal(boss(lethal).mp, 600);
  const battle = setup(['takeshi', 'elaine'], () => 0); stageThree(battle);
  boss(battle).bossState.rotationStep = 2;
  use(battle, 'takeshi', 'takeshi.stance'); bossTurn(battle);
  assert.equal(getActor(battle, 'takeshi').resourceValues.opening, 1);
  assert.equal(battle.log.filter(line => line.includes('phản kiếm!')).length, 1);
  assert.equal(battle.events.filter(event => event.type === 'dodge').length, 2);
});

test('transition triggered by a counter does not grant retroactive extra moves', () => {
  const battle = setup(['takeshi', 'arthur'], () => 0), enemy = boss(battle);
  enemy.hp = 1261; enemy.bossState.phase = 2; enemy.bossState.rotationStep = 1;
  getActor(battle, 'takeshi').element = 'light';
  use(battle, 'takeshi', 'takeshi.stance'); bossTurn(battle);
  assert.equal(enemy.bossState.phase, 3);
  assert.equal(battle.log.filter(line => /hành động \d \/ 1/.test(line)).length, 1);
  assert.equal(battle.log.some(line => /hành động 2 \/ 2/.test(line)), false);
});

test('boss definitions reject bad thresholds, rotations, suppression, telegraphs and non-solo encounters', () => {
  for (const corrupt of [
    data => { data.enemies.miraebolis.boss.phases[1].atHpRatio = 1; },
    data => { data.enemies.miraebolis.boss.phases[2].actionsPerTurn = 1; },
    data => { data.enemies.miraebolis.boss.phases[0].rotation = [['missing']]; },
    data => { data.enemies.miraebolis.boss.suppression.durations = [3, 3, 3]; },
    data => { data.enemies.miraebolis.boss.suppression.fireMultipliers = [1.6, NaN, 1]; },
    data => { data.abilities['enemy.miraebolis_fang'].cost = { mp: 5 }; },
    data => { data.abilities['enemy.miraebolis_doom'].windup.rounds = 0; },
    data => { data.encounters.miraebolis_superboss.enemies.push('goblin'); }
  ]) {
    const invalid = structuredClone(content); corrupt(invalid);
    assert.ok(validateContent(invalid).length);
  }
});

test('a prepared starter party can defeat all three phases through real turn order and MP cycles', () => {
  let campaign = createCampaign(content);
  campaign.storyFlags.push('illusion.sinister_unlocked');
  campaign.party = ['arthur', 'iris', 'garrek', 'elaine'];
  campaign.extraGearSlots.arthur = 1; campaign.gacha.totalPulls = 4;
  campaign.gear = Array.from({ length: 4 }, (_, i) => ({ id: `gear_${i + 1}`, typeId: 't2', stats: { attack: 3 } }));
  for (let i = 0; i < 4; i++) campaign = equipGear(campaign, content, 'arthur', `gear_${i + 1}`, i);
  completeStoryEvent(campaign, content, 'arthur_completed_sword_training');
  const battle = createBattle(content, campaign, 'miraebolis_superboss', seededRandom(20261027));
  const phases = new Set();
  while (!battle.outcome && battle.actionCount < 1500) {
    phases.add(boss(battle).bossState.phase);
    const actor = activeActor(battle);
    if (actor.team === 'enemy') { executeEnemyTurn(battle); continue; }
    const allies = battle.actors.filter(item => item.team === 'party' && item.hp > 0);
    const arthur = getActor(battle, 'arthur');
    const has = (target, id) => target.statuses.some(status => status.id === id);
    const can = id => abilityAvailability(battle, actor, content.abilities[id]).ok;
    let id = '$defend', targetId = actor.id;
    if (actor.id === 'arthur') {
      id = actor.resourceValues.resonance >= 3 && can('arthur.ogres_bane_controlled') ? 'arthur.ogres_bane_controlled' : 'arthur.light_slash'; targetId = 'enemy_0';
    } else if (actor.id === 'iris' && arthur.hp > 0) {
      targetId = arthur.id;
      if (!has(arthur, 'calibrated') && can('iris.calibrate')) id = 'iris.calibrate';
      else if (!has(arthur, 'empowered') && can('iris.formula')) id = 'iris.formula';
    } else if (actor.id === 'garrek' && arthur.hp > 0) {
      if (!has(arthur, 'cover') && can('garrek.resolve')) { id = 'garrek.resolve'; targetId = arthur.id; }
    } else if (actor.id === 'elaine') {
      if (allies.filter(item => item.shield < 25).length >= 2 && can('elaine.sanctuary')) id = 'elaine.sanctuary';
      else if (boss(battle).bossState.phase === 3 && !has(actor, 'water_veil') && can('elaine.veil')) id = 'elaine.veil';
      else if (arthur.hp > 0 && arthur.shield < 20 && can('elaine.shield')) { id = 'elaine.shield'; targetId = arthur.id; }
    }
    executeAction(battle, { actorId: actor.id, abilityId: id, targetId });
    for (const member of battle.actors) {
      assert.ok(Number.isFinite(member.hp) && member.hp >= 0 && member.hp <= member.stats.maxHp);
      assert.ok(Number.isFinite(member.mp) && member.mp >= 0 && member.mp <= member.stats.maxMp);
    }
  }
  assert.equal(battle.outcome, 'victory');
  assert.deepEqual(phases, new Set([1, 2, 3]));
  assert.ok(battle.round < 60);
  assert.equal(boss(battle).hp, 0);
});
