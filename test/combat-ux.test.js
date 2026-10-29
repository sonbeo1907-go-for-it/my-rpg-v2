import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../scripts/load-content.mjs';
import { createCampaign } from '../src/core/progression.js';
import { createBattle, getActor, executeAction, basicAbility, DEFEND } from '../src/core/battle.js';
import { battleStat } from '../src/core/stat-values.js';
import { FOLLOW_UP_LABEL } from '../src/core/follow-up.js';
import { compactSkillScaling, combatSkillDetails, liveSkillChoices, resolveCombatTargets, statusDetails } from '../src/ui/combat-presentation.js';
const content = await loadContent();
function setup(party = ['arthur', 'elaine']) {
  const campaign = createCampaign(content); campaign.party = party; campaign.unlockedCharacterIds = Object.keys(content.characters);
  return createBattle(content, campaign, 'forest_patrol', () => 0);
}
function use(battle, id, skill, target = id) { battle.cursor = battle.queue.indexOf(id); executeAction(battle, { actorId: id, abilityId: skill, targetId: target }); }
test('enemy and ally anchors persist independently and only invalid/dead targets fall back', () => {
  const battle = setup(); const actor = getActor(battle, 'arthur');
  const selected = { allyId: 'elaine', enemyId: 'enemy_1' };
  const initial = resolveCombatTargets(battle, actor, basicAbility(actor), selected);
  assert.equal(initial.allyId, 'elaine'); assert.equal(initial.enemyId, 'enemy_1'); assert.equal(initial.targetId, 'enemy_1');
  const heal = resolveCombatTargets(battle, getActor(battle, 'elaine'), content.abilities['elaine.shield'], selected);
  assert.equal(heal.targetId, 'elaine'); assert.equal(heal.enemyId, 'enemy_1');
  getActor(battle, 'enemy_1').hp = 0;
  assert.equal(resolveCombatTargets(battle, actor, basicAbility(actor), selected).enemyId, 'enemy_0');
  assert.equal(selected.enemyId, 'enemy_1');
});
test('self, AoE and taunt obey legal targeting without changing remembered ally', () => {
  const battle = setup(); const actor = getActor(battle, 'arthur'); const selected = { allyId: 'elaine', enemyId: 'enemy_1' };
  const self = resolveCombatTargets(battle, actor, DEFEND, selected);
  assert.equal(self.allyId, actor.id); assert.equal(self.rememberedAlly, 'elaine'); assert.equal(self.targetId, actor.id);
  const area = resolveCombatTargets(battle, getActor(battle, 'elaine'), content.abilities['elaine.sanctuary'], selected);
  assert.deepEqual(area.affectedIds, ['arthur', 'elaine']); assert.equal(area.enemyId, 'enemy_1');
  getActor(battle, 'enemy_0').statuses.push({ id: 'taunt', remaining: 2, sourceId: 'enemy_0', stacks: 1 });
  const taunted = resolveCombatTargets(battle, actor, basicAbility(actor), selected);
  assert.deepEqual(taunted.legalIds, ['enemy_0']); assert.equal(taunted.enemyId, 'enemy_0');
});
test('live scaling uses actual charges, current target marks and current buffed DEF', () => {
  const battle = setup(['dain', 'fiona', 'lyon', 'cedric']);
  const dain = getActor(battle, 'dain'); dain.resourceValues.resolve = 2;
  assert.match(compactSkillScaling(content.abilities['dain.crush'], dain, getActor(battle, 'enemy_0'), content), /280% ATK/);
  const fiona = getActor(battle, 'fiona'); const collapse = content.abilities['fiona.collapse'];
  getActor(battle, 'enemy_0').statuses.push({ id: 'prisma', stacks: 2, remaining: 3, sourceId: 'fiona' });
  assert.equal(liveSkillChoices(collapse, fiona, getActor(battle, 'enemy_0')).stacks, 2);
  assert.equal(liveSkillChoices(collapse, fiona, getActor(battle, 'enemy_1')).stacks, 0);
  const lyon = getActor(battle, 'lyon'); lyon.statuses.push({ id: 'valmont_defense', remaining: 2, stacks: 1, sourceId: 'lyon' });
  assert.equal(battleStat(content, lyon, 'defense'), 45);
  assert.match(compactSkillScaling(content.abilities['lyon.shield'], lyon, lyon, content), /150% DEF → 68 khiên/);
  assert.match(combatSkillDetails(content.abilities['lyon.shield'], lyon, lyon, content).join(' '), /68 khiên/);
});
test('status info uses stored poison potency, source, remaining duration and ward charges', () => {
  const battle = setup(); const actor = getActor(battle, 'arthur');
  const info = statusDetails({ id: 'kai_poison', potency: 19, remaining: 2, sourceId: 'enemy_0', stacks: 1 }, actor, battle, content);
  assert.equal(info.source, getActor(battle, 'enemy_0').name); assert.match(info.duration, /2 lượt/); assert.ok(info.lines.some(line => line.includes('19 HP')));
  assert.equal(statusDetails({ id: 'effect_ward', charges: 1, remaining: null, sourceId: 'arthur' }, actor, battle, content).duration, '1 lần chặn còn lại');
});
test('duplicate enemy labels stay unique in actor cards and combat logs, without editing content', () => {
  const battle = setup();
  assert.equal(getActor(battle, 'enemy_0').name, `${content.enemies.goblin.name} A`);
  assert.equal(getActor(battle, 'enemy_1').name, `${content.enemies.goblin.name} B`);
  use(battle, 'arthur', '$attack', 'enemy_1');
  assert.ok(battle.log.some(line => line.includes(`${content.enemies.goblin.name} B:`)));
  assert.equal(content.enemies.goblin.name.endsWith(' A'), false);
});
test('FuA emits one generic linked-attack event and retains no-self/no-chain rules', () => {
  const battle = setup(['freya', 'aurora']); getActor(battle, 'enemy_0').hp = 1000;
  use(battle, 'freya', 'freya.fireball', 'enemy_0');
  const events = battle.events.filter(event => event.type === 'reaction');
  assert.equal(events.length, 1); assert.equal(events[0].kind, 'follow_up'); assert.equal(events[0].label, FOLLOW_UP_LABEL); assert.equal(events[0].sourceId, 'aurora');
  assert.ok(battle.log.some(line => line.includes('Liên kích (FuA)')));
  assert.equal(getActor(battle, 'aurora').resourceValues.thunder_charge, 1);
});
test('dodge counters have a separate counter reaction event', () => {
  const battle = setup(['takeshi']);
  use(battle, 'takeshi', 'takeshi.stance'); use(battle, 'enemy_0', '$attack', 'takeshi');
  assert.ok(battle.events.some(event => event.type === 'reaction' && event.kind === 'counter' && event.label === 'Phản công'));
  assert.equal(battle.events.some(event => event.type === 'reaction' && event.kind === 'follow_up'), false);
});
