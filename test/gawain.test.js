import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../scripts/load-content.mjs';
import { createCampaign, resolveCharacter, serializeCampaign, deserializeCampaign } from '../src/core/progression.js';
import { createBattle, getActor, activeActor, executeAction, executeEnemyTurn, abilityAvailability } from '../src/core/battle.js';
import { effectiveStat } from '../src/core/combat-math.js';
import { equipGear } from '../src/core/equipment.js';
import { pullGacha } from '../src/core/economy.js';
import { validateContent } from '../src/core/content.js';
import { skillScaling, skillPreviewOptions, passiveDescription } from '../src/ui/skill-presentation.js';

const content = await loadContent();
function setup(party = ['gawain'], source = content, encounter = 'forest_patrol') {
  const campaign = createCampaign(source); campaign.party = party; campaign.unlockedCharacterIds = Object.keys(source.characters);
  campaign.storyFlags.push('illusion.sinister_unlocked');
  const battle = createBattle(source, campaign, encounter, () => .99);
  for (const actor of battle.actors.filter(actor => actor.team === 'enemy')) {
    actor.hp = actor.stats.maxHp = 100000; actor.stats.attack = actor.stats.magic = 0;
  }
  return battle;
}
function use(battle, actorId, abilityId, targetId = actorId) {
  battle.cursor = battle.queue.indexOf(actorId);
  executeAction(battle, { actorId, abilityId, targetId });
}
function nextGawain(battle) {
  for (let i = 0; !battle.outcome && activeActor(battle).id !== 'gawain' && i < 20; i++) {
    const actor = activeActor(battle);
    if (actor.team === 'enemy') executeEnemyTurn(battle);
    else executeAction(battle, { actorId: actor.id, abilityId: '$defend' });
  }
  assert.equal(battle.outcome, null);
  assert.equal(activeActor(battle).id, 'gawain');
}
const gawain = battle => getActor(battle, 'gawain');
const cloud = battle => gawain(battle).statuses.find(status => status.id === 'storm_cloud');
const pulses = battle => battle.events.filter(event => event.automatic);

test('cloud has exactly three future owner-turn pulses, ramps 10/20/20 and leaves one downtime round when recast', () => {
  const battle = setup();
  const expected = [0, .1, .2, .2, 0, .1, .2, .2, 0, .1];
  for (let round = 1; round <= expected.length; round++) {
    assert.equal(battle.round, round);
    const bonus = effectiveStat(gawain(battle), 'attack') / 33 - 1;
    assert.ok(Math.abs(bonus - expected[round - 1]) < 1e-9, `round ${round}`);
    if ([1, 5, 9].includes(round)) {
      assert.equal(cloud(battle), undefined);
      assert.equal(abilityAvailability(battle, gawain(battle), content.abilities['gawain.cloud']).ok, true);
      use(battle, 'gawain', 'gawain.cloud');
      assert.equal(pulses(battle).length, 0);
      assert.equal(effectiveStat(gawain(battle), 'attack'), 33);
    } else {
      assert.equal(pulses(battle).length, 3);
      assert.equal(abilityAvailability(battle, gawain(battle), content.abilities['gawain.cloud']).ok, false);
      use(battle, 'gawain', '$defend');
      if ([4, 8].includes(round)) {
        assert.equal(cloud(battle), undefined);
        assert.equal(effectiveStat(gawain(battle), 'attack'), 33);
      }
    }
    if (round < expected.length) nextGawain(battle);
  }
});

test('cloud uses ATK after the growth increment, hits all enemies and consumes neither MP nor the active action', () => {
  const battle = setup();
  getActor(battle, 'enemy_0').statuses.push({ id: 'taunt', remaining: 3, stacks: 1, sourceId: 'enemy_0' });
  use(battle, 'gawain', 'gawain.cloud'); nextGawain(battle);
  assert.deepEqual(pulses(battle).map(event => event.amount), [22, 22, 9]);
  assert.equal(gawain(battle).mp, 68);
  assert.equal(battle.actionCount, 4); // Summon + three enemy actions, pulse is free.
  assert.equal(activeActor(battle).id, 'gawain');
  assert.equal(cloud(battle).growth, 1);
  assert.equal(cloud(battle).remaining, 3);
  use(battle, 'gawain', 'gawain.sweep', 'enemy_0');
  assert.equal(gawain(battle).mp, 59);
  assert.equal(cloud(battle).remaining, 2);
});

test('automatic cloud does not benefit from or consume Iris empowerment or next-attack multipliers', () => {
  const battle = setup(['iris', 'gawain']);
  use(battle, 'iris', 'iris.formula', 'gawain');
  gawain(battle).statuses.push({ id: 'cavalry_momentum', remaining: null, stacks: 1, sourceId: 'gawain' });
  use(battle, 'gawain', 'gawain.cloud'); nextGawain(battle);
  assert.deepEqual(pulses(battle).map(event => event.amount), [22, 22, 9]);
  assert.equal(gawain(battle).statuses.some(status => status.id === 'empowered'), true);
  assert.equal(gawain(battle).statuses.some(status => status.id === 'cavalry_momentum'), true);
  use(battle, 'gawain', 'gawain.sweep', 'enemy_0');
  assert.deepEqual(battle.events.filter(event => event.type === 'damage').map(event => event.amount), [109, 109, 56]);
  assert.equal(gawain(battle).statuses.some(status => ['empowered', 'cavalry_momentum'].includes(status.id)), false);
});

test('cloud cannot be selected as an active command and never triggers Aurora follow-ups, even if authored as magic', () => {
  const source = structuredClone(content); source.abilities['gawain.cloud_pulse'].effects[0].damageType = 'magical';
  const battle = setup(['gawain', 'aurora'], source);
  assert.throws(() => use(battle, 'gawain', 'gawain.cloud_pulse', 'enemy_0'), /chưa có kỹ năng/);
  use(battle, 'gawain', 'gawain.cloud'); nextGawain(battle);
  assert.equal(pulses(battle).length, 3);
  assert.equal(getActor(battle, 'aurora').resourceValues.thunder_charge, 0);
  assert.equal(battle.events.some(event => event.sourceId === 'aurora' && ['damage','reaction'].includes(event.type)), false);
});

test('a lethal cloud pulse ends the battle before Gawain can spend an active turn', () => {
  const battle = setup();
  for (const enemy of battle.actors.filter(actor => actor.team === 'enemy')) enemy.hp = 1;
  use(battle, 'gawain', 'gawain.cloud');
  for (let i = 0; !battle.outcome && i < 3; i++) executeEnemyTurn(battle);
  assert.equal(battle.outcome, 'victory'); assert.equal(activeActor(battle), null);
  assert.equal(gawain(battle).mp, 68); assert.equal(battle.actionCount, 4);
});

test('owner death removes cloud immediately and poison death is resolved before a cloud pulse', () => {
  const battle = setup(['gawain', 'elaine']);
  use(battle, 'gawain', 'gawain.cloud'); nextGawain(battle);
  assert.equal(cloud(battle).growth, 1);
  gawain(battle).hp = 1; getActor(battle, 'enemy_0').stats.attack = 999;
  use(battle, 'enemy_0', '$attack', 'gawain');
  assert.equal(gawain(battle).hp, 0); assert.equal(cloud(battle), undefined);
  assert.equal(effectiveStat(gawain(battle), 'attack'), 33);
  const poisoned = setup(['gawain', 'elaine']);
  use(poisoned, 'gawain', 'gawain.cloud');
  gawain(poisoned).hp = 1;
  gawain(poisoned).statuses.push({ id: 'kai_poison', potency: 12, remaining: 2, stacks: 1, sourceId: 'enemy_0' });
  for (let i = 0; activeActor(poisoned).id !== 'elaine' && i < 5; i++) executeEnemyTurn(poisoned);
  use(poisoned, 'elaine', '$defend');
  assert.equal(gawain(poisoned).hp, 0); assert.equal(cloud(poisoned), undefined);
  assert.equal(pulses(poisoned).length, 0);
});

test('stun skips the active action but cloud still resolves at turn start and its duration ticks once', () => {
  const battle = setup(); use(battle, 'gawain', 'gawain.cloud');
  gawain(battle).statuses.push({ id: 'stunned', remaining: 1, stacks: 1, sourceId: 'enemy_0' });
  for (let i = 0; i < 3; i++) executeEnemyTurn(battle);
  assert.equal(battle.round, 2);
  assert.equal(activeActor(battle).team, 'enemy');
  assert.equal(cloud(battle).growth, 1); assert.equal(cloud(battle).remaining, 2);
  assert.equal(pulses(battle).length, 3); assert.equal(gawain(battle).mp, 68);
});

test('cloud respects boss HP gates, applies Thunder suppression and refills MP on phase transition', () => {
  const battle = setup(['gawain'], content, 'miraebolis_superboss');
  getActor(battle, 'enemy_0').stats.maxHp = getActor(battle, 'enemy_0').hp = 3600;
  use(battle, 'gawain', 'gawain.cloud');
  getActor(battle, 'enemy_0').hp = 2341; gawain(battle).mp = 0;
  nextGawain(battle);
  assert.equal(getActor(battle, 'enemy_0').hp, 2340);
  assert.equal(getActor(battle, 'enemy_0').bossState.phase, 2);
  assert.equal(getActor(battle, 'enemy_0').statuses.find(status => status.id === 'dragon_suppressed').stacks, 1);
  assert.equal(gawain(battle).mp, 80);
  assert.equal(cloud(battle).growth, 1);
});

test('growth uses geared base ATK and additive buffs; preview includes the passive pulse and stack assumptions', () => {
  let campaign = createCampaign(content); campaign.unlockedCharacterIds.push('gawain');
  campaign.gacha.totalPulls = 1; campaign.gear = [{ id: 'gear_1', typeId: 't3_focused', stats: { attack: 5 } }];
  campaign = equipGear(campaign, content, 'gawain', 'gear_1');
  const actor = resolveCharacter(content, campaign, 'gawain');
  actor.statuses = [{ id: 'storm_cloud', growth: 2, remaining: 1 }];
  assert.ok(Math.abs(effectiveStat(actor, 'attack', .2) - 53.2) < 1e-9);
  assert.match(passiveDescription(actor, content), /10% ATK.*20%/);
  const skill = content.abilities['gawain.cloud_pulse'];
  assert.deepEqual(skillPreviewOptions(skill, actor, content)[0], { key: 'fieldStacks', label: 'Uy lôi giả định', min: 0, max: 2 });
  assert.match(skillScaling(skill, actor, content, { fieldStacks: 2 }).join('\n'), /20% ATK → 45,6 ATK/);
});

test('old saves gain a locked Gawain and recruitment uses the shared banner flow', () => {
  const old = createCampaign(content); delete old.characters.gawain;
  let campaign = deserializeCampaign(serializeCampaign(old), content);
  assert.equal(campaign.unlockedCharacterIds.includes('gawain'), false);
  assert.deepEqual(campaign.characters.gawain, { level: 1, xp: 0, allocations: {}, limitBreakRank: 0, skillRanks: {}, upgradeIds: [] });
  campaign.coins = 100; campaign.prisma = 10;
  const pool = content.banners.standard.characterPool;
  const draws = [.95, (pool.indexOf('gawain') + .5) / pool.length];
  campaign = pullGacha(campaign, content, 'standard', 1, () => draws.shift()).campaign;
  assert.equal(campaign.unlockedCharacterIds.includes('gawain'), true);
  assert.equal(serializeCampaign(campaign).includes('storm_cloud'), false);
});

test('validation rejects broken cloud references, permanent clouds and invalid growth or automatic skills', () => {
  for (const corrupt of [
    data => { data.characters.gawain.passive.statusId = 'missing'; },
    data => { data.characters.gawain.passive.maxStacks = 0; },
    data => { data.characters.gawain.passive.ratio = NaN; },
    data => { data.statuses.storm_cloud.turnStartAbility = 'missing'; },
    data => { data.statuses.storm_cloud.persistent = true; },
    data => { data.abilities['gawain.cloud_pulse'].activation = 'active'; },
    data => { data.abilities['gawain.cloud_pulse'].target = 'enemy'; },
    data => { data.abilities['gawain.cloud_pulse'].cost = { mp: 5 }; }
  ]) {
    const invalid = structuredClone(content); corrupt(invalid); assert.ok(validateContent(invalid).length);
  }
});
