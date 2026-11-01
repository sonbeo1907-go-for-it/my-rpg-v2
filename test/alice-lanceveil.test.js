import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../scripts/load-content.mjs';
import { createCampaign, serializeCampaign, deserializeCampaign, resolveCharacter } from '../src/core/progression.js';
import { createBattle, getActor, activeActor, executeAction, executeEnemyTurn } from '../src/core/battle.js';
import { pullGacha } from '../src/core/economy.js';
import { skillScaling } from '../src/ui/skill-presentation.js';

const content = await loadContent();
function setup(party, encounter = 'alice_superboss', random = () => .99) {
  const campaign = createCampaign(content);
  campaign.storyFlags.push('illusion.sinister_unlocked');
  campaign.party = party;
  campaign.unlockedCharacterIds = Object.keys(content.characters);
  const source=structuredClone(content);source.encounters[encounter].enemyLevel=1;
  return createBattle(source, campaign, encounter, random,{enemyLevel:1});
}
function use(battle, actorId, abilityId, targetId = actorId) {
  battle.cursor = battle.queue.indexOf(actorId);
  executeAction(battle, { actorId, abilityId, targetId });
}
const damage = battle => battle.events.find(event => event.type === 'damage').amount;

test('Alice is a high-RES superboss; Light amplifies physical and magical hits without bypassing RES', () => {
  const boss = content.enemies.dark_holy_blade_alice;
  assert.ok(boss.stats.maxHp > content.enemies.wyvern_light.stats.maxHp * 2);
  assert.ok(boss.stats.resistance > boss.stats.defense * 2);
  assert.deepEqual(boss.weaknesses, ['light']);
  for (const [type, element, expected] of [['physical', 'plain', 62], ['magical', 'plain', 30], ['physical', 'light', 93], ['magical', 'light', 45]]) {
    const battle = setup(['arthur']);
    const actor = getActor(battle, 'arthur');
    actor.stats.attack = 80; actor.stats.magic = 80;
    actor.element = element; actor.basicDamageType = type;
    use(battle, actor.id, '$attack', 'enemy_0');
    assert.equal(damage(battle), expected, `${type}/${element}`);
  }
});

test('Alice AI can use every authored move; all area curses hit and debuff every living party member', () => {
  const ids = content.enemies.dark_holy_blade_alice.abilities;
  for (let index = 0; index < ids.length; index++) {
    const values = [.1, (index + .5) / ids.length, 0];
    const battle = setup(['arthur', 'iris', 'elaine', 'garrek'], 'alice_superboss', () => values.shift());
    battle.cursor = battle.queue.indexOf('enemy_0');
    const skill = content.abilities[ids[index]], boss = getActor(battle, 'enemy_0');
    executeEnemyTurn(battle);
    assert.ok(battle.log.includes(`${boss.name} dùng ${skill.name}.`));
    assert.equal(boss.mp, boss.stats.maxMp - skill.cost.mp);
    assert.equal(boss.cooldowns[skill.id] ?? 0, skill.cooldown ? skill.cooldown + 1 : 0);
    if (skill.target !== 'all_enemies') continue;
    assert.equal(battle.events.filter(event => event.type === 'damage').length, 4);
    for (const hero of battle.actors.filter(actor => actor.team === 'party')) {
      for (const effect of skill.effects.filter(effect => effect.type === 'status')) {
        const status = hero.statuses.find(status => status.id === effect.status);
        assert.equal(status.remaining, 2);
        assert.equal(content.statuses[status.id].kind, 'debuff');
      }
    }
  }
});

test('Alice weakening reduces outgoing physical damage; slowing changes initiative next round', () => {
  const battle = setup(['arthur', 'iris', 'elaine', 'garrek']);
  use(battle, 'enemy_0', 'enemy.alice_curse');
  use(battle, 'arthur', 'arthur.light_slash', 'enemy_0');
  assert.equal(damage(battle), 18); // (34 × .8 × 1.1 − 32 × .55) × 1.5, floored.
  const slow = setup(['arthur', 'iris', 'elaine', 'garrek']);
  assert.ok(slow.queue.indexOf('iris') < slow.queue.indexOf('enemy_0'));
  use(slow, 'enemy_0', 'enemy.alice_grasp');
  while (slow.round === 1) {
    const actor = activeActor(slow);
    executeAction(slow, { actorId: actor.id, abilityId: '$defend' });
  }
  assert.ok(slow.queue.indexOf('enemy_0') < slow.queue.indexOf('iris'));
});

test('Armie can remove every Alice curse together while keeping allied protection', () => {
  const battle = setup(['arthur', 'armie', 'lanceveil', 'garrek']);
  use(battle, 'lanceveil', 'lanceveil.bulwark');
  for (const id of ['enemy.alice_curse', 'enemy.alice_grasp', 'enemy.alice_judgment']) use(battle, 'enemy_0', id);
  const arthur = getActor(battle, 'arthur');
  assert.deepEqual(arthur.statuses.map(status => status.id).sort(), ['lanceveil_bulwark', 'alice_withering', 'alice_chains', 'eroded', 'fractured'].sort());
  use(battle, 'armie', 'armie.treatment', 'arthur');
  assert.deepEqual(arthur.statuses.map(status => status.id), ['lanceveil_bulwark']);
});

test('Lanceveil uses ATK-scaled Fire lance attacks; his shield formation protects the whole team', () => {
  const campaign = createCampaign(content);
  const actor = resolveCharacter(content, campaign, 'lanceveil');
  assert.equal(actor.roleGroup, 'fighter');
  assert.ok(actor.secondaryRoleGroups.includes('defensive_support'));
  assert.equal(actor.element, 'fire');
  assert.match(skillScaling(content.abilities['lanceveil.breakthrough'], actor, content).join(' '), /220% ATK/);
  for (const [id, expected] of [['lanceveil.thrust', 54], ['lanceveil.breakthrough', 98]]) {
    const battle = setup(['lanceveil'], 'forest_patrol');
    use(battle, 'lanceveil', id, 'enemy_0');
    assert.equal(damage(battle), expected);
    assert.equal(getActor(battle, 'lanceveil').mp, 60 - content.abilities[id].cost.mp);
  }
  for (const protect of [false, true]) {
    const battle = setup(['lanceveil', 'arthur', 'elaine', 'garrek']);
    if (protect) {
      use(battle, 'lanceveil', 'lanceveil.bulwark');
      for (const hero of battle.actors.filter(actor => actor.team === 'party')) assert.ok(hero.statuses.some(status => status.id === 'lanceveil_bulwark'));
    }
    use(battle, 'enemy_0', 'enemy.alice_blade', 'lanceveil');
    assert.equal(damage(battle), Math.floor((46 * 2 - 26 * .55) * (1 - .08 - (protect ? .15 : 0))));
  }
});

test('Lanceveil starts locked, is recruitable and round-trips through old saves without changing their party', () => {
  const old = createCampaign(content); delete old.characters.lanceveil;
  const restored = deserializeCampaign(serializeCampaign(old), content);
  assert.deepEqual(restored.party, old.party);
  assert.deepEqual(restored.characters.lanceveil, { level: 1, xp: 0, allocations: {}, limitBreakRank: 0, skillRanks: {}, upgradeIds: [] });
  assert.equal(restored.unlockedCharacterIds.includes('lanceveil'), false);
  restored.coins = 100; restored.prisma = 10;
  const pool = content.banners.standard.characterPool;
  const values = [.95, (pool.indexOf('lanceveil') + .5) / pool.length];
  const result = pullGacha(restored, content, 'standard', 1, () => values.shift());
  assert.ok(result.campaign.unlockedCharacterIds.includes('lanceveil'));
  assert.ok(deserializeCampaign(serializeCampaign(result.campaign), content).unlockedCharacterIds.includes('lanceveil'));
});
