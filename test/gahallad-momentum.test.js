import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../scripts/load-content.mjs';
import { createCampaign } from '../src/core/progression.js';
import { createBattle, getActor, executeAction, executeEnemyTurn } from '../src/core/battle.js';
import { activeStatuses } from '../src/core/status-state.js';
import { validateContent } from '../src/core/content.js';

const content = await loadContent();
function setup(party = ['gahallad', 'iris'], source = content, encounter = 'giant_spider_lair') {
  const campaign = createCampaign(source); campaign.party = party; campaign.unlockedCharacterIds = Object.keys(source.characters);
  // Isolate kit/shield arithmetic at the encounter base level; scaling has separate coverage.
  return createBattle(source, campaign, encounter, () => .99,{enemyLevel:source.encounters[encounter].referenceLevel??source.encounters[encounter].enemyLevel});
}
function use(battle, actorId, abilityId, targetId = actorId) {
  battle.cursor = battle.queue.indexOf(actorId);
  executeAction(battle, { actorId, abilityId, targetId });
}
const ready = (battle, id = 'gahallad') => getActor(battle, id).statuses.filter(status => status.id === 'cavalry_momentum');
const damage = battle => battle.events.find(event => event.type === 'damage');
function breakShield(battle) {
  getActor(battle, 'enemy_0').shield = 1;
  use(battle, 'gahallad', 'gahallad.trample', 'enemy_0');
  assert.equal(ready(battle).length, 1);
}

test('support, stance changes and invalid actions retain momentum; only the next attacking action consumes it', () => {
  const battle = setup(); breakShield(battle);
  use(battle, 'gahallad', '$defend');
  use(battle, 'gahallad', 'gahallad.mount');
  use(battle, 'gahallad', 'gahallad.mount');
  assert.equal(ready(battle).length, 1);
  const mp = getActor(battle, 'gahallad').mp;
  assert.throws(() => use(battle, 'gahallad', 'gahallad.charge', 'iris'), /Mục tiêu/);
  assert.equal(getActor(battle, 'gahallad').mp, mp); assert.equal(ready(battle).length, 1);
  use(battle, 'gahallad', '$attack', 'enemy_0');
  assert.equal(damage(battle).amount, 118); // 34 ATK, Dark weakness, exposed ×2, momentum ×2.
  assert.equal(ready(battle).length, 0);
  use(battle, 'gahallad', '$attack', 'enemy_0');
  assert.equal(damage(battle).amount, 59);
});

test('an empowered attack that breaks a fresh shield consumes the old buff and grants exactly one new buff', () => {
  const battle = setup(); use(battle, 'gahallad', 'gahallad.mount'); breakShield(battle);
  battle.cursor = battle.queue.indexOf('enemy_0'); executeEnemyTurn(battle); // New shield clears exposure.
  assert.equal(getActor(battle, 'enemy_0').shield, 140);
  use(battle, 'gahallad', 'gahallad.trample', 'enemy_0');
  assert.equal(damage(battle).absorbed, 140); assert.equal(damage(battle).amount, 90);
  assert.equal(ready(battle).length, 1);
  use(battle, 'gahallad', 'gahallad.trample', 'enemy_0');
  assert.equal(damage(battle).amount, 230); assert.equal(ready(battle).length, 0);
});

test('a lethal shield break still arms the passive, which can be spent on a different enemy', () => {
  const battle = setup(['gahallad', 'iris'], content, 'forest_patrol');
  use(battle, 'gahallad', 'gahallad.mount');
  getActor(battle, 'enemy_0').hp = 1; getActor(battle, 'enemy_0').shield = 1;
  use(battle, 'gahallad', '$attack', 'enemy_0');
  assert.equal(getActor(battle, 'enemy_0').hp, 0); assert.equal(ready(battle).length, 1);
  use(battle, 'gahallad', '$attack', 'enemy_1');
  assert.equal(damage(battle).amount, 97); assert.equal(ready(battle).length, 0);
});

test('the passive is data-driven, multiplies independently of Iris and is not granted for an ally breaking a shield', () => {
  const source = structuredClone(content); source.characters.arthur.passive = structuredClone(content.characters.gahallad.passive);
  assert.deepEqual(validateContent(source), []);
  const battle = setup(['arthur', 'iris', 'gahallad'], source, 'forest_patrol');
  getActor(battle, 'enemy_0').shield = 20;
  use(battle, 'arthur', '$attack', 'enemy_0');
  assert.equal(ready(battle, 'arthur').length, 1); assert.equal(ready(battle).length, 0);
  use(battle, 'iris', 'iris.formula', 'arthur');
  use(battle, 'arthur', '$attack', 'enemy_1');
  assert.equal(damage(battle).amount, 115); // (34 − 12 × .55) × 1.5 × 1.4 × 2, not additive 2.4.
  assert.equal(ready(battle, 'arthur').length, 0);
});

test('a dodged attack consumes the next-attack charge without creating another one', () => {
  const battle = setup(['gahallad', 'iris'], content, 'forest_patrol');
  getActor(battle, 'enemy_0').shield = 1;
  use(battle, 'gahallad', '$attack', 'enemy_0');
  getActor(battle, 'enemy_1').statuses.push({ id: 'evasive', remaining: 1, stacks: 1, sourceId: 'enemy_1' });
  battle.random = () => 0;
  use(battle, 'gahallad', '$attack', 'enemy_1');
  assert.equal(battle.events.some(event => event.type === 'dodge'), true);
  assert.equal(ready(battle).length, 0);
});

test('a reaction can spend the next-attack multiplier once without changing ordinary counter limits', () => {
  const battle = setup(['takeshi'], content, 'forest_patrol');
  const actor = getActor(battle, 'takeshi');
  actor.statuses.push({ id: 'cavalry_momentum', remaining: null, sourceId: actor.id, stacks: 1 });
  battle.random = () => 0;
  use(battle, actor.id, 'takeshi.stance');
  use(battle, 'enemy_0', '$attack', actor.id);
  assert.equal(battle.events.find(event => event.sourceId === actor.id && event.type === 'damage').amount, 64);
  assert.equal(ready(battle, actor.id).length, 0);
  assert.equal(actor.resourceValues.opening, 1);
});

test('independent Phá Thành is neither doubled by mounting nor removed on dismount; timed copies can expire under a mount', () => {
  const source = structuredClone(content);
  source.abilities['test.siege'] = { id: 'test.siege', name: 'Phá Thành', target: 'ally', effects: [{ type: 'status', status: 'siegebreaker', duration: 2 }] };
  source.characters.iris.abilities.push('test.siege');
  const battle = setup(['gahallad', 'iris'], source);
  use(battle, 'iris', 'test.siege', 'gahallad');
  use(battle, 'gahallad', 'gahallad.mount');
  assert.equal(activeStatuses(getActor(battle, 'gahallad')).filter(status => status.id === 'siegebreaker').length, 1);
  use(battle, 'gahallad', '$defend'); // Timed copy expires, mount still provides Phá Thành.
  assert.equal(getActor(battle, 'gahallad').statuses.some(status => status.id === 'siegebreaker'), false);
  assert.equal(activeStatuses(getActor(battle, 'gahallad')).some(status => status.id === 'siegebreaker'), true);
  source.abilities['test.siege'].effects[0].duration = undefined;
  use(battle, 'iris', 'test.siege', 'gahallad');
  use(battle, 'gahallad', 'gahallad.mount');
  assert.equal(activeStatuses(getActor(battle, 'gahallad')).some(status => status.id === 'siegebreaker'), true);
  assert.equal(getActor(battle, 'gahallad').statuses.some(status => status.id === 'black_cavalry'), false);
});

test('content rejects malformed linked buffs and invalid next-attack multipliers', () => {
  for (const corrupt of [
    data => { data.characters.gahallad.passive.statusId = 'missing'; },
    data => { data.statuses.cavalry_momentum.modifiers.attackMultiplier = NaN; },
    data => { data.statuses.cavalry_momentum.consumeOnAttack = false; },
    data => { data.abilities['gahallad.mount'].effects[0].linkedStatuses = ['missing']; },
    data => { data.abilities['gahallad.mount'].effects[0].linkedStatuses = ['cavalry_momentum']; },
    data => { data.abilities['gahallad.mount'].effects[0].linkedStatuses = ['siegebreaker', 'siegebreaker']; },
    data => { data.abilities['gahallad.mount'].effects[0].duration = 2; }
  ]) {
    const invalid = structuredClone(content); corrupt(invalid); assert.ok(validateContent(invalid).length);
  }
});
