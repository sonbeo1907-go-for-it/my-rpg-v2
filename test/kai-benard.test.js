import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../scripts/load-content.mjs';
import { createCampaign, serializeCampaign, deserializeCampaign, resolveCharacter } from '../src/core/progression.js';
import { createBattle, getActor, activeActor, executeAction } from '../src/core/battle.js';
import { claimBattleReward, pullGacha } from '../src/core/economy.js';
import { equipGear } from '../src/core/equipment.js';
import { validateContent } from '../src/core/content.js';
import { skillScaling, passiveDescription } from '../src/ui/skill-presentation.js';
import { createSaveExport, parseSaveImport } from '../src/core/save-file.js';

const content = await loadContent();
const quest = 'goblin_forest_ambush';
function setup(party) {
  const campaign = createCampaign(content); campaign.party = party;
  campaign.unlockedCharacterIds = Object.keys(content.characters);
  return createBattle(content, campaign, quest, () => .99);
}
function use(battle, actorId, abilityId, targetId = actorId) {
  battle.cursor = battle.queue.indexOf(actorId);
  executeAction(battle, { actorId, abilityId, targetId });
}
const restore = campaign => deserializeCampaign(serializeCampaign(campaign), content);

test('ambush is two small goblins; Kai is a village poison defender and Benard a Wind twin-blade knight', () => {
  assert.deepEqual(content.encounters[quest].enemies, ['small_goblin', 'small_goblin']);
  assert.ok(content.enemies.small_goblin.stats.maxHp < content.enemies.goblin.stats.maxHp);
  assert.equal(content.characters.kai.element, 'earth');
  assert.match(content.characters.kai.biography, /Garrek/);
  assert.equal(content.characters.benard.element, 'wind');
  assert.match(content.characters.benard.biography, /song kiếm/);
  assert.ok(content.banners.standard.characterPool.includes('benard'));
  assert.equal(content.banners.standard.characterPool.includes('kai'), false);
  assert.equal(content.characters.benard.abilities.every(id => ['enemy', 'self'].includes(content.abilities[id].target)), true);
});

test('first victory atomically grants Kai and Arthur/Garrek duplicates once, including after save and import', () => {
  let campaign = createCampaign(content);
  const battle = { encounterId: quest, outcome: 'victory',rewardRandom:()=>0 };
  let writes = 0;
  campaign = claimBattleReward(campaign, battle, content, next => { writes++; assert.ok(next.unlockedCharacterIds.includes('kai')); assert.deepEqual(next.claimedFirstClearRewards, [quest]); });
  assert.equal(writes, 1);
  assert.equal(campaign.coins, 50);
  assert.equal(campaign.victories, 1);
  assert.equal(campaign.recruitmentShards, 20);
  assert.deepEqual(campaign.extraGearSlots, { arthur: 1, garrek: 1 });
  assert.deepEqual(battle.firstClearRewards.map(item => [item.characterId, item.duplicate]), [['kai', false], ['arthur', true], ['garrek', true]]);
  assert.equal(claimBattleReward(campaign, battle, content), campaign);
  campaign = parseSaveImport(createSaveExport(restore(campaign), content).text, content);
  const repeat = { encounterId: quest, outcome: 'victory',rewardRandom:()=>0 };
  campaign = claimBattleReward(campaign, repeat, content);
  assert.equal(campaign.coins, 100);
  assert.equal(campaign.recruitmentShards, 20);
  assert.deepEqual(campaign.extraGearSlots, { arthur: 1, garrek: 1 });
  assert.deepEqual(repeat.firstClearRewards, []);
});

test('failed reward persistence or shard overflow preserves first-clear eligibility and every balance', () => {
  const campaign = createCampaign(content), before = serializeCampaign(campaign);
  const battle = { encounterId: quest, outcome: 'victory',rewardRandom:()=>0 };
  assert.throws(() => claimBattleReward(campaign, battle, content, () => { throw new Error('quota'); }));
  assert.equal(serializeCampaign(campaign), before);
  assert.equal(battle.rewardClaimed, undefined);
  assert.equal(battle.firstClearRewards, undefined);
  const capped = createCampaign(content); capped.extraGearSlots = { arthur: 3, garrek: 3 };
  const granted = claimBattleReward(capped, battle, content);
  assert.equal(granted.recruitmentShards, 20);
  assert.deepEqual(granted.extraGearSlots, capped.extraGearSlots);
  const overflow = createCampaign(content); overflow.recruitmentShards = Number.MAX_SAFE_INTEGER;
  assert.throws(() => claimBattleReward(overflow, { encounterId: quest, outcome: 'victory' }, content));
  assert.equal(overflow.coins, 0);
  assert.equal(overflow.unlockedCharacterIds.includes('kai'), false);
  assert.deepEqual(overflow.claimedFirstClearRewards, []);
});

test('older v3 saves gain locked character states and an empty first-clear ledger; bad ledger is rejected', () => {
  const old = createCampaign(content); delete old.claimedFirstClearRewards; delete old.characters.kai; delete old.characters.benard;
  const restored = deserializeCampaign(JSON.stringify(old), content);
  assert.deepEqual(restored.claimedFirstClearRewards, []);
  assert.deepEqual(restored.characters.kai, { level: 1, xp: 0, allocations: {}, limitBreakRank: 0, upgradeIds: [] });
  assert.equal(restored.unlockedCharacterIds.includes('kai'), false);
  for (const ledger of [[quest], ['missing'], [quest, quest], 'bad']) {
    const invalid = createCampaign(content); invalid.claimedFirstClearRewards = ledger;
    assert.throws(() => restore(invalid));
  }
});

test('poison ticks exactly three turn starts, ignores shields/armor/weakness and does not double-tick after actions', () => {
  const battle = setup(['kai']);
  const enemy = getActor(battle, 'enemy_0'); enemy.shield = 100;
  use(battle, 'kai', 'kai.poison', 'enemy_0');
  assert.equal(enemy.hp, 53); // First tick: round(4 + 24 × .35) = 12.
  assert.equal(enemy.statuses.find(status => status.id === 'kai_poison').remaining, 2);
  assert.equal(battle.events.find(event => event.periodic).weakness, false);
  use(battle, 'enemy_0', '$defend'); assert.equal(enemy.hp, 53);
  use(battle, 'enemy_1', '$defend'); use(battle, 'kai', '$defend'); assert.equal(enemy.hp, 41);
  use(battle, 'enemy_0', '$defend'); use(battle, 'enemy_1', '$defend'); use(battle, 'kai', '$defend');
  assert.equal(enemy.hp, 29);
  assert.equal(enemy.shield, 100);
  assert.equal(enemy.statuses.some(status => status.id === 'kai_poison'), false);
  use(battle, 'enemy_0', '$defend'); use(battle, 'enemy_1', '$defend'); use(battle, 'kai', '$defend'); assert.equal(enemy.hp, 29);
});

test('poison snapshots attack, refreshes instead of stacking and continues after its source falls', () => {
  const battle = setup(['kai', 'arthur']);
  const enemy = getActor(battle, 'enemy_0'); enemy.hp = 1000; enemy.stats.maxHp = 1000;
  use(battle, 'kai', 'kai.poison', enemy.id);
  getActor(battle, 'kai').stats.attack = 100;
  use(battle, 'arthur', '$defend'); assert.equal(enemy.hp, 988);
  use(battle, 'kai', 'kai.poison', enemy.id);
  assert.equal(enemy.statuses.filter(status => status.id === 'kai_poison').length, 1);
  assert.equal(enemy.statuses.find(status => status.id === 'kai_poison').potency, 39);
  getActor(battle, 'kai').hp = 0;
  use(battle, 'arthur', '$defend'); assert.equal(enemy.hp, 949);
});

test('poison lethal damage skips the victim action, determines victory/defeat and cannot be undone by regen', () => {
  const win = setup(['kai', 'arthur']); getActor(win, 'enemy_0').hp = 5; getActor(win, 'enemy_1').hp = 0;
  use(win, 'kai', 'kai.poison', 'enemy_0'); use(win, 'arthur', '$defend');
  assert.equal(win.outcome, 'victory'); assert.equal(activeActor(win), null);
  const lose = setup(['kai']); const kai = getActor(lose, 'kai'); kai.hp = 5;
  kai.statuses = [{ id: 'kai_poison', sourceId: 'enemy_0', potency: 12, remaining: 3 }, { id: 'regen', sourceId: 'kai', remaining: 3 }];
  use(lose, 'enemy_1', '$defend');
  assert.equal(lose.outcome, 'defeat'); assert.equal(kai.hp, 0);
  assert.equal(lose.events.some(event => event.type === 'heal'), false);
});

test('poison can be cleansed; Kai shield and weak formation agree with preview', () => {
  const battle = setup(['kai', 'armie', 'garrek']);
  const target = getActor(battle, 'garrek'); target.hp = 100;
  target.statuses = [{ id: 'kai_poison', sourceId: 'enemy_0', potency: 12, remaining: 3 }];
  battle.queue = ['armie', 'garrek']; battle.cursor = 0;
  executeAction(battle, { actorId: 'armie', abilityId: 'armie.treatment', targetId: 'garrek' });
  assert.equal(target.statuses.some(status => status.id === 'kai_poison'), false);
  assert.equal(battle.events.some(event => event.periodic), false);
  const defence = setup(['kai', 'arthur']);
  use(defence, 'kai', 'kai.shield', 'arthur'); assert.equal(getActor(defence, 'arthur').shield, 26);
  use(defence, 'kai', 'kai.formation');
  assert.ok(defence.actors.filter(actor => actor.team === 'party').every(actor => actor.statuses.some(status => status.id === 'kai_formation')));
  const kai = resolveCharacter(content, createCampaign(content), 'kai');
  assert.match(skillScaling(content.abilities['kai.poison'], kai, content).join('\n'), /12 HP mỗi đầu lượt/);
  assert.match(skillScaling(content.abilities['kai.shield'], kai, content).join('\n'), /26 khiên/);
});

test('Benard speed from gear and buffs increases each physical hit and basic attacks with shared preview math', () => {
  let campaign = createCampaign(content); campaign.unlockedCharacterIds.push('benard'); campaign.party = ['benard'];
  campaign.gacha.totalPulls = 1; campaign.gear = [{ id: 'gear_1', typeId: 't3_focused', stats: { speed: 5 } }];
  campaign = equipGear(campaign, content, 'benard', 'gear_1');
  const battle = createBattle(content, campaign, quest);
  const enemy = getActor(battle, 'enemy_0'); enemy.hp = 1000; enemy.stats.maxHp = 1000; enemy.stats.defense = 0;
  use(battle, 'benard', 'benard.twin_blades', 'enemy_0');
  assert.deepEqual(battle.events.filter(event => event.type === 'damage').map(event => event.amount), [54, 54]);
  use(battle, 'benard', 'benard.gale');
  use(battle, 'benard', 'benard.twin_blades', 'enemy_0');
  assert.deepEqual(battle.events.filter(event => event.type === 'damage').map(event => event.amount), [65, 65]);
  use(battle, 'benard', '$attack', 'enemy_0');
  assert.equal(battle.events.find(event => event.type === 'damage').amount, 77); // (27 + 49 × .5) × 1.5.
  assert.equal(getActor(battle, 'enemy_1').hp, 65);
  const preview = resolveCharacter(content, campaign, 'benard');
  assert.match(passiveDescription(preview, content), /50% SPD/);
  assert.match(skillScaling(content.abilities['benard.twin_blades'], preview, content).join('\n'), /2 hit × \(70% ATK \+ 50% SPD\)/);
});

test('poison never triggers Aurora and Benard is obtainable in the normal banner', () => {
  const battle = setup(['kai', 'aurora']); use(battle, 'kai', 'kai.poison', 'enemy_0');
  assert.equal(getActor(battle, 'aurora').resourceValues.thunder_charge, 0);
  assert.equal(battle.events.some(event => event.sourceId === 'aurora'), false);
  const campaign = createCampaign(content); campaign.coins = 100; campaign.prisma = 1;
  let draw = 0; const index = content.banners.standard.characterPool.indexOf('benard');
  const result = pullGacha(campaign, content, 'standard', 1, () => draw++ === 0 ? .95 : (index + .5) / content.banners.standard.characterPool.length);
  assert.ok(result.campaign.unlockedCharacterIds.includes('benard'));
});

test('content rejects broken first-clear rewards, poison definitions and speed scaling', () => {
  for (const corrupt of [
    value => { value.encounters[quest].firstClearRewards = 'bad'; },
    value => { value.encounters[quest].firstClearRewards[0].characterId = 'missing'; },
    value => { value.encounters[quest].firstClearRewards[0].type = 'coins'; },
    value => { value.statuses.kai_poison.damageOverTime.multiplier = -1; },
    value => { value.statuses.kai_poison.damageOverTime.scalingStat = 'unknown'; },
    value => { value.characters.benard.passive.ratio = -1; }
  ]) {
    const invalid = structuredClone(content); corrupt(invalid); assert.ok(validateContent(invalid).length);
  }
});
