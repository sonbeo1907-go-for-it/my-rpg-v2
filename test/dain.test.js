import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../scripts/load-content.mjs';
import { createCampaign, resolveCharacter } from '../src/core/progression.js';
import { createBattle, getActor, executeAction } from '../src/core/battle.js';
import { effectiveStat } from '../src/core/combat-math.js';
import { equipGear } from '../src/core/equipment.js';
import { validateContent } from '../src/core/content.js';
import { passiveDescription, skillScaling, skillCost } from '../src/ui/skill-presentation.js';

const content = await loadContent();
function setup(random = () => .99, source = content) {
  const campaign = createCampaign(source); campaign.party = ['dain', 'garrek'];
  campaign.unlockedCharacterIds.push('dain');
  return createBattle(source, campaign, 'ogre_trial', random, {enemyLevel:content.encounters.ogre_trial.referenceLevel});
}
function use(battle, actorId, abilityId, targetId = actorId) {
  battle.cursor = battle.queue.indexOf(actorId);
  executeAction(battle, { actorId, abilityId, targetId });
}

test('Dain gains 15% ATK per Resolve, updates immediately and uses geared base ATK with additive buffs', () => {
  const battle = setup(), dain = getActor(battle, 'dain');
  for (const [points, attack] of [[0, 35], [1, 40.25], [2, 45.5], [3, 50.75]]) {
    dain.resourceValues.resolve = points;
    assert.equal(effectiveStat(dain, 'attack'), attack);
    assert.equal(effectiveStat(dain, 'defense'), 25);
  }
  let campaign = createCampaign(content); campaign.unlockedCharacterIds.push('dain');
  campaign.gacha.totalPulls = 1;
  campaign.gear = [{ id: 'gear_1', typeId: 't2', stats: { attack: 3 } }];
  campaign = equipGear(campaign, content, 'dain', 'gear_1');
  const geared = resolveCharacter(content, campaign, 'dain');
  geared.resourceValues = { resolve: 2 };
  assert.equal(effectiveStat(geared, 'attack', .2), 57); // 38 × (1 + .30 + .20).
  geared.resourceValues.resolve = 0;
  assert.equal(effectiveStat(geared, 'attack'), 38);
});

test('Brace costs 5 MP, lasts through three following actions and retains damage reduction and on-hit Resolve', () => {
  const battle = setup(), dain = getActor(battle, 'dain');
  use(battle, 'dain', 'dain.brace');
  assert.equal(dain.mp, 30);
  assert.equal(dain.statuses.find(status => status.id === 'braced').remaining, 3);
  use(battle, 'enemy_0', '$attack', 'dain');
  assert.equal(dain.stats.maxHp - dain.hp, 21);
  assert.equal(dain.resourceValues.resolve, 1);
  for (const remaining of [2, 1, 0]) {
    use(battle, 'dain', 'dain.strike', 'enemy_0');
    assert.equal(dain.statuses.find(status => status.id === 'braced')?.remaining ?? 0, remaining);
  }
});

test('a tank can intercept attacks while Dain generates Resolve through his own attacks', () => {
  const battle = setup(() => 0), dain = getActor(battle, 'dain');
  use(battle, 'dain', 'dain.brace');
  use(battle, 'garrek', 'garrek.cover', 'dain');
  use(battle, 'enemy_0', '$attack', 'dain');
  assert.equal(dain.hp, dain.stats.maxHp);
  assert.equal(dain.resourceValues.resolve, 0);
  use(battle, 'dain', 'dain.strike', 'enemy_0');
  assert.equal(dain.resourceValues.resolve, 1);
  assert.equal(effectiveStat(dain, 'attack'), 40.25);
  assert.ok(battle.log.some(line => line.includes('tích 1 Quyết tâm từ Gồng mình')));
});

test('Brace rolls exactly once per attack action, with a 50% threshold, never on support or after expiry', () => {
  for (const [draw, expected] of [[.499, 1], [.5, 0]]) {
    const source = structuredClone(content); source.abilities['dain.strike'].effects[0].hits = 2;
    let draws = 0;
    const battle = setup(() => { draws++; return draw; }, source), dain = getActor(battle, 'dain');
    use(battle, 'dain', 'dain.brace'); use(battle, 'dain', '$defend');
    assert.equal(draws, 0);
    use(battle, 'dain', 'dain.strike', 'enemy_0');
    assert.equal(draws, 1);
    assert.equal(dain.resourceValues.resolve, expected);
    use(battle, 'dain', '$defend'); // Third action after Brace: expires here.
    assert.equal(dain.statuses.some(status => status.id === 'braced'), false);
    use(battle, 'dain', 'dain.strike', 'enemy_0');
    assert.equal(draws, 1);
  }
});

test('Crush costs 10 MP and spends stacks after damage, using both per-stack ATK and per-stack multiplier', () => {
  for (const [points, expected] of [[1, 70], [2, 117], [3, 172]]) {
    const battle = setup(), dain = getActor(battle, 'dain'); dain.resourceValues.resolve = points;
    use(battle, 'dain', 'dain.crush', 'enemy_0');
    assert.equal(battle.events.find(event => event.type === 'damage').amount, expected);
    assert.equal(dain.mp, 25);
    assert.equal(dain.resourceValues.resolve, 0);
    assert.equal(effectiveStat(dain, 'attack'), 35);
  }
});

test('Crush can generate a fresh point after spending old points; fresh points do not boost that same hit', () => {
  const battle = setup(() => 0), dain = getActor(battle, 'dain');
  use(battle, 'dain', 'dain.brace'); dain.resourceValues.resolve = 3;
  use(battle, 'dain', 'dain.crush', 'enemy_0');
  assert.equal(battle.events.find(event => event.type === 'damage').amount, 172);
  assert.equal(dain.mp, 20);
  assert.equal(dain.resourceValues.resolve, 1);
  assert.equal(effectiveStat(dain, 'attack'), 40.25);
});

test('failed Crush validation preserves MP, points and turns; Resolve stays capped at three', () => {
  const battle = setup(() => 0), dain = getActor(battle, 'dain');
  dain.resourceValues.resolve = 3; dain.mp = 9;
  assert.throws(() => use(battle, 'dain', 'dain.crush', 'enemy_0'), /Không đủ MP/);
  assert.equal(dain.mp, 9); assert.equal(dain.resourceValues.resolve, 3); assert.equal(battle.actionCount, 0);
  dain.mp = 35; dain.resourceValues.resolve = 0;
  assert.throws(() => use(battle, 'dain', 'dain.crush', 'enemy_0'), /Chưa đủ/);
  assert.equal(dain.mp, 35); assert.equal(battle.actionCount, 0);
  use(battle, 'dain', 'dain.brace'); dain.resourceValues.resolve = 3;
  use(battle, 'dain', 'dain.strike', 'enemy_0');
  use(battle, 'enemy_0', '$attack', 'dain');
  assert.equal(dain.resourceValues.resolve, 3);
});

test('Dain previews describe the passive, probability, duration, post-cast cost and assumed stack ATK', () => {
  const dain = resolveCharacter(content, createCampaign(content), 'dain');
  assert.match(passiveDescription(dain, content), /15% ATK.*3 điểm \(\+45%\)/);
  const brace = skillScaling(content.abilities['dain.brace'], dain, content).join('\n');
  assert.match(brace, /50%.*1 Quyết tâm.*một lần\/hành động.*3 lượt/);
  const crush = content.abilities['dain.crush'];
  assert.match(skillCost(crush, dain), /10 MP.*Tiêu sau khi thi triển/);
  assert.match(skillScaling(crush, dain, content, { spent: 3 }).join('\n'), /360% ATK.*\n.*45% ATK nền → 50,75 ATK/);
});

test('content rejects invalid stack passives, proc chances, resource references and cost timing', () => {
  for (const corrupt of [
    data => { data.characters.dain.passive.ratio = -1; },
    data => { data.characters.dain.passive.resource = 'missing'; },
    data => { data.characters.dain.passive.stat = 'maxHp'; },
    data => { data.statuses.braced.onAttackResource.chance = 1.1; },
    data => { data.statuses.braced.onAttackResource.chance = NaN; },
    data => { data.statuses.braced.onAttackResource.resource = 'missing'; },
    data => { data.abilities['dain.crush'].cost.resource.consumeAt = 'later'; }
  ]) {
    const invalid = structuredClone(content); corrupt(invalid);
    assert.ok(validateContent(invalid).length);
  }
});
