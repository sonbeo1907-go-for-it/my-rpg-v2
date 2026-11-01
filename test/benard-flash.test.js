import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../scripts/load-content.mjs';
import { createCampaign, resolveCharacter } from '../src/core/progression.js';
import { createBattle, getActor, executeAction } from '../src/core/battle.js';
import { equipGear } from '../src/core/equipment.js';
import { skillScaling } from '../src/ui/skill-presentation.js';
import { validateContent } from '../src/core/content.js';

const content = await loadContent();
function setup(stat = 'speed') {
  let campaign = createCampaign(content);
  campaign.party = ['benard', 'iris']; campaign.unlockedCharacterIds.push('benard');
  campaign.extraGearSlots.benard = 1; campaign.gacha.totalPulls = 4;
  campaign.gear = Array.from({ length: 4 }, (_, i) => ({ id: `gear_${i + 1}`, typeId: 't2', stats: { [stat]: 3 } }));
  for (let i = 0; i < 4; i++) campaign = equipGear(campaign, content, 'benard', `gear_${i + 1}`, i);
  return { campaign, battle: createBattle(content, campaign, 'wyvern_trial_5', () => .99, {enemyLevel:1}) };
}
function use(battle, actorId, abilityId, targetId = actorId) {
  battle.cursor = battle.queue.indexOf(actorId);
  executeAction(battle, { actorId, abilityId, targetId });
}
function flash(stat, calibrated = false) {
  const { battle } = setup(stat);
  use(battle, 'benard', 'benard.gale');
  if (calibrated) use(battle, 'iris', 'iris.calibrate', 'benard');
  use(battle, 'iris', 'iris.formula', 'benard');
  use(battle, 'benard', 'benard.flash', 'enemy_0');
  return battle;
}

test('four SPD +3 pieces reach about 200 against the Wind-weak wyvern with Gale and Iris empowerment', () => {
  for (const [calibrated, expected] of [[false, 196], [true, 203]]) {
    const battle = flash('speed', calibrated);
    const events = battle.events.filter(event => event.type === 'damage' && event.sourceId === 'benard');
    assert.equal(events.length, 1);
    assert.equal(events[0].amount, expected);
    assert.equal(events[0].weakness, true);
    assert.equal(getActor(battle, 'benard').mp, 41); // Gale 10 + Flash 14, same costs.
    assert.equal(getActor(battle, 'benard').cooldowns['benard.flash'], 3);
  }
});

test('Flash now rewards SPD gear over ATK gear and still uses real defense and elemental weakness', () => {
  assert.equal(flash('attack').events.find(event => event.type === 'damage').amount, 160);
  const { battle } = setup();
  getActor(battle, 'enemy_0').weaknesses = [];
  use(battle, 'benard', 'benard.flash', 'enemy_0');
  assert.equal(battle.events.find(event => event.type === 'damage').amount, 68); // 27 × .7 + 42 × 1.5 − 25 × .55.
});

test('preview includes skill SPD and passive SPD once; twin blades and normal attacks retain their scaling', () => {
  const { campaign } = setup();
  const benard = resolveCharacter(content, campaign, 'benard');
  const preview = skillScaling(content.abilities['benard.flash'], benard, content).join('\n');
  assert.match(preview, /70% ATK \+ 150% SPD/);
  assert.match(preview, /63 sát thương mỗi nhát.*đã gồm nội tại/);
  assert.match(skillScaling(content.abilities['benard.twin_blades'], benard, content).join('\n'), /70% ATK \+ 50% SPD/);
});

test('ability-specific SPD scaling rejects non-finite, negative and nonphysical definitions', () => {
  for (const value of [-1, NaN, Infinity, '1', null]) {
    const invalid = structuredClone(content);
    invalid.abilities['benard.flash'].effects[0].speedMultiplier = value;
    assert.match(validateContent(invalid).join('\n'), /invalid effect speedMultiplier/);
  }
  const invalid = structuredClone(content);
  invalid.abilities['benard.flash'].effects[0].damageType = 'magical';
  assert.match(validateContent(invalid).join('\n'), /speedMultiplier requires physical damage/);
});
