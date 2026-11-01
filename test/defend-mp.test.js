import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../scripts/load-content.mjs';
import { createCampaign, resolveCharacter } from '../src/core/progression.js';
import { createBattle, getActor, executeAction, DEFEND } from '../src/core/battle.js';
import { equipGear } from '../src/core/equipment.js';
import { validateContent } from '../src/core/content.js';
import { skillDescription, skillScaling } from '../src/ui/skill-presentation.js';

const content = await loadContent();
function setup() {
  let campaign = createCampaign(content);
  campaign.party = ['iris', 'elaine'];
  campaign.gacha.totalPulls = 1;
  campaign.gear = [{ id: 'gear_1', typeId: 't1', stats: { maxMp: 2 } }];
  campaign = equipGear(campaign, content, 'iris', 'gear_1');
  return { campaign, battle: createBattle(content, campaign, 'forest_patrol', () => .99,{enemyLevel:1}) };
}
function use(battle, actorId, abilityId, targetId = actorId) {
  battle.cursor = battle.queue.indexOf(actorId);
  executeAction(battle, { actorId, abilityId, targetId });
}

test('defending at zero MP immediately restores a rounded-up 5% of geared max MP to the user only', () => {
  const { battle } = setup();
  const iris = getActor(battle, 'iris'), elaine = getActor(battle, 'elaine');
  iris.mp = 0; elaine.mp = 4;
  assert.equal(iris.stats.maxMp, 92);
  use(battle, 'iris', '$defend');
  assert.equal(iris.mp, 5);
  assert.equal(elaine.mp, 4);
  assert.equal(battle.actionCount, 1);
  assert.equal(iris.statuses.find(status => status.id === 'guard').remaining, 1);
  assert.deepEqual(battle.events.filter(event => event.type === 'mp_restore'), [{ type: 'mp_restore', targetId: 'iris', sourceId: 'iris', amount: 5 }]);
  assert.ok(battle.log.includes('Iris hồi 5 MP.'));
  use(battle, 'enemy_0', '$attack', 'iris');
  assert.equal(battle.events.find(event => event.type === 'damage').amount, Math.floor((24 - 12 * .55) * .6));
});

test('defend MP is capped, emits only actual restoration and is safe at full or zero max MP', () => {
  for (const [maxMp, before, after, restored] of [[100, 4, 9, 5], [100, 98, 100, 2], [100, 100, 100, 0], [40, 0, 2, 2], [1, 0, 1, 1], [0, 0, 0, 0]]) {
    const { battle } = setup(), iris = getActor(battle, 'iris');
    iris.stats.maxMp = maxMp; iris.mp = before;
    use(battle, 'iris', '$defend');
    assert.equal(iris.mp, after);
    const events = battle.events.filter(event => event.type === 'mp_restore');
    assert.equal(events.length, restored ? 1 : 0);
    if (restored) assert.equal(events[0].amount, restored);
  }
});

test('only a valid defend action restores MP; ordinary attacks do not restore it', () => {
  const { battle } = setup();
  const iris = getActor(battle, 'iris'), elaine = getActor(battle, 'elaine');
  iris.mp = 0; elaine.mp = 0;
  assert.throws(() => executeAction(battle, { actorId: 'elaine', abilityId: '$defend' }), /Chưa đến lượt/);
  assert.equal(elaine.mp, 0); assert.equal(battle.actionCount, 0);
  use(battle, 'iris', '$attack', 'enemy_0');
  assert.equal(iris.mp, 0);
  use(battle, 'elaine', '$defend');
  assert.equal(elaine.mp, 5);
  battle.outcome = 'defeat';
  assert.throws(() => use(battle, 'iris', '$defend'), /kết thúc/);
  assert.equal(iris.mp, 0);
});

test('defend preview shows the same geared amount and fixed MP skills retain their existing scaling', () => {
  const { campaign } = setup(), iris = resolveCharacter(content, campaign, 'iris');
  const preview = skillScaling(DEFEND, iris, content).join('\n');
  assert.match(skillDescription(DEFEND), /5% MP tối đa/);
  assert.match(preview, /Giảm 40% sát thương nhận/);
  assert.match(preview, /5% MP tối đa → 5 MP cho bản thân/);
  assert.match(preview, /làm tròn lên, không vượt MP tối đa/);
  assert.match(skillScaling(content.abilities['freya.cool'], content.characters.freya, content).join('\n'), /Hồi 12 MP cho bản thân/);
});

test('MP percentage effects validate only finite positive ratios up to 100% and cannot target other resource types', () => {
  const custom = structuredClone(content);
  custom.abilities['test.defend'] = { ...structuredClone(DEFEND), id: 'test.defend', skillLineId:'test.defend', growthProfile:'fixed', rankable:false, fixedReason:'Test utility' };
  assert.deepEqual(validateContent(custom), []);
  for (const value of [-.1, 0, 1.1, NaN, Infinity, '0.05', null]) {
    const invalid = structuredClone(custom);
    invalid.abilities['test.defend'].effects[1].maxMpRatio = value;
    assert.match(validateContent(invalid).join('\n'), /invalid MP restore ratio/);
  }
  custom.abilities['test.defend'].effects[1].resource = 'data';
  assert.match(validateContent(custom).join('\n'), /invalid MP restore ratio/);
});
