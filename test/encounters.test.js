import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../scripts/load-content.mjs';
import { ELEMENTS, validateContent } from '../src/core/content.js';
import { createCampaign } from '../src/core/progression.js';
import { createBattle, activeActor, getActor, executeAction, executeEnemyTurn, basicAbility, abilityAvailability, targetsFor } from '../src/core/battle.js';
import { seededRandom } from '../src/core/random.js';

const content = await loadContent();
function setup(encounter, party = ['arthur'], random = () => .99) {
  const campaign = createCampaign(content);
  campaign.storyFlags.push('illusion.sinister_unlocked');
  campaign.party = party;
  if (content.encounters[encounter].travelerStory) {
    campaign.claimedFirstClearRewards = content.travelerStories[content.encounters[encounter].travelerStory].chapters.slice(0,-1);
    const required=content.encounters[encounter].requiredPartyIds??[];campaign.party=[...required,...party.filter(id=>!required.includes(id))].slice(0,4);
    campaign.claimedFirstClearRewards.push(...(content.encounters[encounter].requires?.firstClears??[]));
  }
  if(content.encounters[encounter].category==='bounty')campaign.claimedFirstClearRewards.push(...content.encounters[encounter].requires.firstClears);
  campaign.unlockedCharacterIds = Object.keys(content.characters);
  return createBattle(content, campaign, encounter, random);
}
function strike(encounter, element, damageType, shield = 0, source = content) {
  const campaign = createCampaign(source); campaign.party = ['arthur'];
  const battle = createBattle(source, campaign, encounter);
  const actor = getActor(battle, 'arthur'), target = getActor(battle, 'enemy_0');
  actor.stats.attack = 40; actor.stats.magic = 40; actor.element = element; actor.basicDamageType = damageType;
  target.stats.defense = 0; target.stats.resistance = 0; target.shield = shield;
  battle.cursor = battle.queue.indexOf('arthur');
  executeAction(battle, { actorId: 'arthur', abilityId: '$attack', targetId: target.id });
  return { battle, target, event: battle.events.find(event => event.type === 'damage') };
}

test('new encounters have the requested composition, weaknesses and shared wyvern move set', () => {
  assert.ok(Object.keys(content.encounters).length >= 19);
  assert.deepEqual(content.encounters.goblin_cave.enemies, ['goblin', 'goblin', 'goblin_shaman']);
  assert.deepEqual(content.encounters.wolf_pack.enemies, ['wolf_leader', 'wolf', 'wolf', 'wolf']);
  assert.deepEqual(content.encounters.giant_pangolin_lair.enemies, ['giant_pangolin']);
  assert.deepEqual(content.enemies.wolf.weaknesses, ['fire']);
  assert.deepEqual(content.enemies.wolf_leader.weaknesses, ['fire']);
  assert.deepEqual(content.enemies.giant_pangolin.weaknesses, ['earth']);
  assert.equal(content.enemies.giant_pangolin.stats.defense, 75);
  const wyverns = Array.from({ length: 10 }, (_, index) => {
    const encounter = content.encounters[`wyvern_trial_${index + 1}`];
    assert.equal(encounter.enemies.length, 1);
    return content.enemies[encounter.enemies[0]];
  });
  for (const enemy of wyverns) {
    assert.deepEqual(enemy.abilities, wyverns[0].abilities);
    assert.deepEqual(enemy.stats, wyverns[0].stats);
    assert.equal(enemy.element, wyverns[0].element);
  }
  assert.deepEqual(wyverns.slice(0, 8).map(enemy => enemy.weaknesses), ELEMENTS.map(id => [id]));
  assert.deepEqual(wyverns[8].damageTypeWeaknesses, ['magical']);
  assert.deepEqual(wyverns[9].damageTypeWeaknesses, ['physical']);
  for (const enemy of wyverns.slice(8)) assert.deepEqual(enemy.weaknesses, []);
});

test('every elemental wyvern amplifies only its element, independently of physical/magical damage', () => {
  for (let index = 0; index < ELEMENTS.length; index++) {
    for (const element of ELEMENTS) for (const type of ['physical', 'magical']) {
      const { event } = strike(`wyvern_trial_${index + 1}`, element, type);
      assert.equal(event.amount, element === ELEMENTS[index] ? 60 : 40, `${index + 1}/${element}/${type}`);
    }
  }
});

test('type-weak wyverns amplify all eight matching elements and leave the opposite damage type unchanged', () => {
  for (const [encounter, type] of [['wyvern_trial_9', 'magical'], ['wyvern_trial_10', 'physical']]) {
    for (const element of ELEMENTS) for (const damageType of ['physical', 'magical']) {
      const { event, battle } = strike(encounter, element, damageType);
      assert.equal(event.amount, damageType === type ? 60 : 40);
      assert.equal(event.weakness, damageType === type);
      if (damageType === type) assert.ok(battle.log.some(line => line.includes(type === 'magical' ? 'yếu ma pháp (+50%)' : 'yếu vật lí (+50%)')));
    }
  }
});

test('overlapping element/type weakness grants +50% once, before shield absorption', () => {
  const custom = structuredClone(content);
  custom.enemies.wyvern_magical.weaknesses = ['light'];
  const { event, target, battle } = strike('wyvern_trial_9', 'light', 'magical', 25, custom);
  assert.equal(event.absorbed, 25);
  assert.equal(event.amount, 35);
  assert.equal(target.hp, 715);
  assert.ok(battle.log.some(line => line.includes('yếu Quang / ma pháp (+50%)')));
});

test('type weakness applies to area spells, dodge counters and ally follow-ups', () => {
  const area = setup('wyvern_trial_9', ['fiona']);
  getActor(area, 'fiona').stats.magic = 40; getActor(area, 'enemy_0').stats.resistance = 0;
  executeAction(area, { actorId: 'fiona', abilityId: 'fiona.refraction' });
  assert.equal(area.events.find(event => event.type === 'damage').amount, 36);
  const counter = setup('wyvern_trial_10', ['takeshi'], () => 0);
  getActor(counter, 'enemy_0').stats.defense = 0;
  executeAction(counter, { actorId: 'takeshi', abilityId: 'takeshi.stance' });
  executeAction(counter, { actorId: 'enemy_0', abilityId: 'enemy.wyvern_bite', targetId: 'takeshi' });
  assert.equal(counter.events.find(event => event.type === 'damage').amount, 42);
  const follow = setup('wyvern_trial_9', ['fiona', 'aurora']);
  getActor(follow, 'enemy_0').stats.resistance = 0;
  executeAction(follow, { actorId: 'aurora', abilityId: '$defend', targetId: 'aurora' });
  executeAction(follow, { actorId: 'fiona', abilityId: 'fiona.shard', targetId: 'enemy_0' });
  assert.equal(follow.events.find(event => event.type === 'damage' && event.sourceId === 'aurora').amount, 33);
  assert.equal(getActor(follow, 'aurora').resourceValues.thunder_charge, 1);
});

test('pangolin armor still reduces physical Earth attacks while Earth spells benefit from its weakness', () => {
  const battle = setup('giant_pangolin_lair');
  const actor = getActor(battle, 'arthur'), target = getActor(battle, 'enemy_0');
  actor.stats.attack = 100; actor.stats.magic = 40; actor.element = 'earth';
  executeAction(battle, { actorId: 'arthur', abilityId: '$attack', targetId: 'enemy_0' });
  assert.equal(battle.events.find(event => event.type === 'damage').amount, 88);
  actor.basicDamageType = 'magical'; battle.cursor = battle.queue.indexOf('arthur');
  executeAction(battle, { actorId: 'arthur', abilityId: '$attack', targetId: 'enemy_0' });
  assert.equal(battle.events.find(event => event.type === 'damage').amount, 45);
  assert.equal(target.stats.defense, 75); // Weakness does not remove armor.
});

test('content rejects malformed, unknown and duplicated damage-type weaknesses', () => {
  for (const value of ['magical', ['magic'], ['fire'], ['physical', 'physical'], [null], [['physical']], ['__proto__']]) {
    const custom = structuredClone(content);
    custom.enemies.wyvern_magical.damageTypeWeaknesses = value;
    assert.match(validateContent(custom).join('\n'), /damageTypeWeaknesses|damage type weakness/);
  }
});

test('enemy AI can select every new move with its authored cost and effect', () => {
  for (const [encounter, actorId] of [['goblin_cave', 'enemy_2'], ['wyvern_trial_1', 'enemy_0'], ['wolf_pack', 'enemy_0'], ['wolf_pack', 'enemy_1'], ['giant_pangolin_lair', 'enemy_0']]) {
    const definition = content.enemies[content.encounters[encounter].enemies[Number(actorId.slice(6))]];
    for (let index = 0; index < definition.abilities.length; index++) {
      let draw = 0;
      const values = [.1, (index + .5) / definition.abilities.length, 0];
      const battle = setup(encounter, ['arthur'], () => values[draw++]);
      battle.cursor = battle.queue.indexOf(actorId);
      const actor = getActor(battle, actorId), skill = content.abilities[definition.abilities[index]];
      executeEnemyTurn(battle);
      assert.ok(battle.log.includes(`${actor.name} dùng ${skill.name}.`));
      assert.equal(actor.mp, actor.stats.maxMp - skill.cost.mp);
      assert.ok(battle.events.some(event => event.type === 'damage'));
    }
  }
});

test('every new encounter runs legal enemy AI to a bounded outcome with finite HP and MP', () => {
  const newEncounters = Object.keys(content.encounters).filter(id => !['forest_patrol', 'ogre_trial'].includes(id));
  for (const encounter of newEncounters) {
    const battle = setup(encounter, ['arthur', 'fiona', 'elaine', 'garrek'], seededRandom(42));
    while (!battle.outcome && battle.actionCount < 2000) {
      const actor = activeActor(battle);
      if (actor.team === 'enemy') {
        executeEnemyTurn(battle);
      } else {
        const skills = actor.abilities.map(id => content.abilities[id]).filter(skill => abilityAvailability(battle, actor, skill).ok);
        const skill = skills[battle.actionCount % skills.length] ?? basicAbility(actor);
        executeAction(battle, { actorId: actor.id, abilityId: skill.id, targetId: targetsFor(battle, actor, skill)[0]?.id });
      }
      for (const actor of battle.actors) {
        assert.ok(Number.isFinite(actor.hp) && actor.hp >= 0 && actor.hp <= actor.stats.maxHp);
        assert.ok(Number.isFinite(actor.mp) && actor.mp >= 0 && actor.mp <= actor.stats.maxMp);
      }
    }
    assert.ok(['victory', 'defeat', 'draw'].includes(battle.outcome), encounter);
  }
});
