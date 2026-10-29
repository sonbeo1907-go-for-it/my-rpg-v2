import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../scripts/load-content.mjs';
import { createCampaign, resolveCharacter, serializeCampaign, deserializeCampaign } from '../src/core/progression.js';
import { createBattle, getActor, executeAction, basicAbility, abilityAvailability } from '../src/core/battle.js';
import { effectiveStat } from '../src/core/combat-math.js';
import { validateContent } from '../src/core/content.js';
import { equipGear } from '../src/core/equipment.js';
import { pullGacha } from '../src/core/economy.js';
import { skillScaling, passiveDescription } from '../src/ui/skill-presentation.js';

const content = await loadContent();
const family = ['lucien', 'seraphine', 'lyon', 'cedric'];
function campaignFor(party, source = content) {
  const campaign = createCampaign(source);
  campaign.storyFlags.push('illusion.sinister_unlocked');
  campaign.party = [...party]; campaign.unlockedCharacterIds = Object.keys(source.characters);
  return campaign;
}
function setup(party = family, source = content, encounter = 'forest_patrol') {
  const battle = createBattle(source, campaignFor(party, source), encounter, () => .99);
  for (const actor of battle.actors.filter(actor => actor.team === 'enemy')) actor.hp = actor.stats.maxHp = 100000;
  return battle;
}
function use(battle, actorId, abilityId, targetId = actorId) {
  battle.cursor = battle.queue.indexOf(actorId);
  return executeAction(battle, { actorId, abilityId, targetId });
}
const status = (battle, actorId, id) => getActor(battle, actorId).statuses.find(value => value.id === id);
function hostileSkill(source, effects) {
  source.abilities['test.hex'] = { id: 'test.hex', name: 'Test hex', target: 'enemy', effects };
  source.enemies.goblin.abilities.push('test.hex');
}

test('four Valmont share flat base bonuses, counting Lyon and Cedric by tag', () => {
  const campaign = campaignFor(family);
  const actors = Object.fromEntries(family.map(id => [id, resolveCharacter(content, campaign, id)]));
  assert.equal(actors.lucien.stats.magic, 42);
  assert.equal(actors.seraphine.stats.attack, 34); assert.equal(actors.seraphine.stats.magic, 33);
  assert.equal(actors.lyon.stats.defense, 38); assert.equal(actors.lyon.stats.resistance, 28);
  assert.equal(actors.cedric.stats.defense, 21); assert.equal(actors.cedric.stats.resistance, 27);
  for (const actor of Object.values(actors)) {
    assert.equal(actor.teamBonuses.defense, 4); assert.equal(actor.teamBonuses.resistance, 4);
    assert.deepEqual(actor.tags, ['valmont']);
  }
  assert.equal(resolveCharacter(content, campaignFor(['lucien']), 'lucien').stats.magic, 36);
  assert.equal(resolveCharacter(content, campaignFor(['seraphine']), 'seraphine').stats.attack, 31);
  assert.equal(resolveCharacter(content, campaignFor(['lyon']), 'lyon').stats.defense, 35);
  const mixed = campaignFor(['lyon', 'cedric', 'arthur']);
  assert.equal(resolveCharacter(content, mixed, 'lyon').stats.defense, 36);
  assert.deepEqual(resolveCharacter(content, mixed, 'arthur').teamBonuses, {});
  assert.equal(resolveCharacter(content, mixed, 'lucien').stats.magic, 36);
});

test('gear and family flat bonuses precede percentage buffs; battle snapshots composition', () => {
  const source = structuredClone(content);
  source.characters.lucien.passive = { type: 'stat_boost', modifiers: { magic: .2 } };
  source.characters.lyon.passive.modifiers.magic = 2;
  let campaign = campaignFor(family, source);
  campaign.gacha.totalPulls = 1; campaign.gear = [{ id: 'gear_1', typeId: 't3_focused', stats: { magic: 5 } }];
  campaign = equipGear(campaign, source, 'lucien', 'gear_1');
  const preview = resolveCharacter(source, campaign, 'lucien');
  assert.equal(preview.baseStats.magic, 49); assert.equal(preview.stats.magic, 58.8);
  assert.ok(Math.abs(effectiveStat(preview, 'magic', .3) - 73.5) < 1e-9);
  const battle = createBattle(source, campaign, 'forest_patrol');
  assert.equal(getActor(battle, 'lucien').stats.magic, preview.stats.magic);
  campaign.party = ['lucien']; getActor(battle, 'lyon').hp = 0;
  assert.equal(getActor(battle, 'lucien').stats.magic, 58.8);
  assert.ok(Math.abs(resolveCharacter(source, campaign, 'lucien').stats.magic - 49.2) < 1e-9);
});

test('Lucien attacks every enemy with magic and buffs party RES', () => {
  const battle = setup(); use(battle, 'lucien', 'lucien.sweep');
  assert.equal(battle.events.filter(event => event.type === 'damage' && event.sourceId === 'lucien').length, 3);
  assert.ok(battle.events.filter(event => event.type === 'damage').every(event => event.element === 'plain'));
  use(battle, 'lucien', 'lucien.ward');
  for (const id of family) assert.ok(status(battle, id, 'valmont_resistance'));
  assert.equal(content.statuses.valmont_resistance.modifiers.resistance, .25);
  assert.match(skillScaling(content.abilities['lucien.ward'], getActor(battle, 'lucien'), content).join('\n'), /25% RES/);
});

test('Seraphine self buff improves both parts of her hybrid skills', () => {
  const battle = setup(); const target = getActor(battle, 'enemy_0');
  target.stats.defense = 100; target.stats.resistance = 0;
  use(battle, 'seraphine', 'seraphine.crest');
  assert.ok(status(battle, 'seraphine', 'valmont_heir'));
  assert.deepEqual(content.statuses.valmont_heir.modifiers, { attack: .3, magic: .3 });
  use(battle, 'seraphine', 'seraphine.blade', target.id);
  assert.deepEqual(battle.events.filter(event => event.type === 'damage').map(event => event.amount), [1, 64]);
  use(battle, 'seraphine', 'seraphine.spell', target.id);
  assert.deepEqual(battle.events.filter(event => event.type === 'damage').map(event => event.amount), [50, 128]);
});

test('Seraphine basic and skills calculate ATK against DEF and MAG against RES independently', () => {
  for (const [ability, multiplier, mpCost, expected] of [
    ['$attack', .6, 0, [49, 15]], ['seraphine.blade', 1, 5, [89, 47]], ['seraphine.spell', 2, 15, [189, 127]]
  ]) {
    const battle = setup(['seraphine']); const actor = getActor(battle, 'seraphine'); const target = getActor(battle, 'enemy_0');
    actor.stats.attack = 100; actor.stats.magic = 80; target.stats.defense = 20; target.stats.resistance = 60; target.weaknesses = [];
    const skill = ability === '$attack' ? basicAbility(actor) : content.abilities[ability];
    assert.deepEqual(skill.effects.map(effect => [effect.damageType, effect.multiplier]), [['physical', multiplier], ['magical', multiplier]]);
    const scaling = skillScaling(skill, actor, content).join('\n');
    assert.match(scaling, new RegExp(`phần vật lí \\(tính DEF\\): ${multiplier * 100}% ATK`));
    assert.match(scaling, new RegExp(`phần ma pháp \\(tính RES\\): ${multiplier * 100}% MAG`));
    use(battle, actor.id, ability, target.id);
    const damage = battle.events.filter(event => event.type === 'damage');
    assert.deepEqual(damage.map(event => event.amount), expected);
    assert.deepEqual(damage.map(event => event.damageType), ['physical', 'magical']);
    assert.equal(actor.mp, actor.stats.maxMp - mpCost); assert.equal(battle.actionCount, 1);
    assert.ok(battle.log.some(line => line.includes('sát thương vật lí')));
    assert.ok(battle.log.some(line => line.includes('sát thương ma pháp')));
    if (ability === 'seraphine.spell') {
      assert.equal(skill.cooldown, 2); assert.equal(abilityAvailability(battle, actor, skill).ok, false);
    }
  }
});

test('hybrid strikes trigger only one Aurora follow-up and stop after a lethal physical part', () => {
  const battle = setup(['seraphine', 'aurora']);
  use(battle, 'seraphine', 'seraphine.spell', 'enemy_0');
  assert.deepEqual(battle.events.filter(event => event.type === 'damage').map(event => event.sourceId), ['seraphine', 'seraphine', 'aurora']);
  assert.equal(getActor(battle, 'aurora').resourceValues.thunder_charge, 1);
  use(battle, 'seraphine', 'seraphine.blade', 'enemy_0');
  assert.equal(getActor(battle, 'aurora').resourceValues.thunder_charge, 1);
  const lethal = setup(['seraphine', 'aurora']); getActor(lethal, 'enemy_0').hp = 1;
  use(lethal, 'seraphine', 'seraphine.blade', 'enemy_0');
  assert.equal(lethal.events.filter(event => event.type === 'damage').length, 1);
  assert.equal(getActor(lethal, 'aurora').resourceValues.thunder_charge, 0);
});

test('hybrid parts check physical and magical weaknesses separately; custom basics are reusable without mutating content', () => {
  for (const [weakness, expected] of [['physical', [150, 80]], ['magical', [100, 120]]]) {
    const battle = setup(['seraphine']); const actor = getActor(battle, 'seraphine'); const target = getActor(battle, 'enemy_0');
    actor.stats.attack = 100; actor.stats.magic = 80; target.stats.defense = target.stats.resistance = 0;
    target.weaknesses = []; target.damageTypeWeaknesses = [weakness];
    use(battle, actor.id, 'seraphine.blade', target.id);
    assert.deepEqual(battle.events.filter(event => event.type === 'damage').map(event => event.amount), expected);
  }
  const future = { ...content.characters.arthur, basicAttack: structuredClone(content.characters.seraphine.basicAttack) };
  const skill = basicAbility(future);
  assert.deepEqual(skill.effects.map(effect => effect.multiplier), [.6, .6]);
  skill.effects[0].multiplier = 10;
  assert.equal(future.basicAttack[0].multiplier, .6);
  assert.equal(basicAbility(content.characters.arthur).effects.length, 1);
});

test('Lyon shields all allies using effective DEF, including his party DEF buff', () => {
  const battle = setup(); use(battle, 'lyon', 'lyon.shield');
  for (const id of family) assert.equal(getActor(battle, id).shield, 57);
  use(battle, 'lyon', 'lyon.formation');
  for (const id of family) { assert.ok(status(battle, id, 'valmont_defense')); getActor(battle, id).shield = 0; }
  getActor(battle, 'lyon').cooldowns = {}; getActor(battle, 'lyon').stats.magic = 999;
  use(battle, 'lyon', 'lyon.shield');
  for (const id of family) assert.equal(getActor(battle, id).shield, 71);
  const preview = resolveCharacter(content, campaignFor(family), 'lyon');
  assert.match(skillScaling(content.abilities['lyon.shield'], preview, content).join('\n'), /150% DEF → 57 khiên\/người/);
});

test('Cedric heals everyone from ATK and party attack buff improves healing', () => {
  const battle = setup();
  for (const id of family) getActor(battle, id).hp -= 100;
  use(battle, 'cedric', 'cedric.aid');
  assert.deepEqual(battle.events.filter(event => event.type === 'heal').map(event => event.amount), [33, 33, 33, 33]);
  use(battle, 'cedric', 'cedric.rally');
  for (const id of family) assert.ok(status(battle, id, 'valmont_rally'));
  getActor(battle, 'cedric').cooldowns = {};
  use(battle, 'cedric', 'cedric.aid');
  assert.deepEqual(battle.events.filter(event => event.type === 'heal').map(event => event.amount), [39, 39, 39, 39]);
  assert.match(skillScaling(content.abilities['cedric.aid'], content.characters.cedric, content).join('\n'), /100% ATK \+ 8 → 33 HP\/người/);
});

test('Cedric restores MP once at his own turn end, 2% normally and 4% for Valmont, rounded up and capped', () => {
  const battle = setup(['cedric', 'lyon', 'arthur', 'elaine']);
  for (const id of ['cedric', 'lyon', 'arthur', 'elaine']) getActor(battle, id).mp = 0;
  use(battle, 'arthur', '$attack', 'enemy_0'); assert.equal(getActor(battle, 'cedric').mp, 0);
  use(battle, 'cedric', '$attack', 'enemy_0');
  assert.deepEqual(['cedric', 'lyon', 'arthur', 'elaine'].map(id => getActor(battle, id).mp), [4, 3, 1, 2]);
  assert.equal(battle.events.filter(event => event.type === 'mp_restore' && event.sourceId === 'cedric').length, 4);
  getActor(battle, 'lyon').mp = 69; getActor(battle, 'elaine').hp = 0;
  use(battle, 'cedric', '$attack', 'enemy_0');
  assert.equal(getActor(battle, 'lyon').mp, 70); assert.equal(getActor(battle, 'elaine').mp, 2);
  assert.equal(battle.events.find(event => event.targetId === 'lyon' && event.type === 'mp_restore').amount, 1);
});

test('Cedric still restores MP on a stunned skipped turn, but does not after poison kills him', () => {
  for (const lethal of [false, true]) {
    const battle = setup(['cedric', 'lyon']);
    getActor(battle, 'cedric').mp = getActor(battle, 'lyon').mp = 0;
    getActor(battle, 'cedric').statuses.push({ id: lethal ? 'kai_poison' : 'stunned', remaining: 1, stacks: 1, potency: 999, sourceId: 'enemy_0' });
    // Advancing the previous actor enters Cedric's next turn through the normal scheduler.
    battle.queue = ['enemy_0', 'cedric', 'lyon', 'enemy_1', 'enemy_2'];
    use(battle, 'enemy_0', '$defend');
    assert.equal(getActor(battle, 'lyon').mp, lethal ? 0 : 3);
    assert.equal(battle.log.filter(line => line.includes('Hậu cần gia tộc cuối lượt')).length, lethal ? 0 : 1);
    assert.equal(getActor(battle, 'cedric').hp === 0, lethal);
  }
});

test('single-use immunity blocks only the first hostile debuff, keeps incoming damage and does not cleanse', () => {
  const source = structuredClone(content);
  hostileSkill(source, [
    { type: 'damage', damageType: 'physical', element: 'plain', multiplier: 1 },
    { type: 'status', status: 'stunned', duration: 1 },
    { type: 'status', status: 'kai_poison', duration: 3 }
  ]);
  const battle = setup(['lyon', 'arthur'], source);
  getActor(battle, 'arthur').statuses.push({ id: 'eroded', remaining: 3, stacks: 1, sourceId: 'enemy_0' });
  use(battle, 'lyon', 'lyon.ward', 'arthur');
  assert.equal(status(battle, 'arthur', 'effect_ward').charges, 1);
  assert.ok(status(battle, 'arthur', 'eroded'));
  const hp = getActor(battle, 'arthur').hp;
  use(battle, 'enemy_0', 'test.hex', 'arthur');
  assert.ok(getActor(battle, 'arthur').hp < hp);
  assert.equal(status(battle, 'arthur', 'stunned'), undefined);
  assert.equal(status(battle, 'arthur', 'effect_ward'), undefined);
  assert.ok(status(battle, 'arthur', 'kai_poison'));
  assert.equal(battle.events.filter(event => event.type === 'effect_blocked').length, 1);
});

test('immunity refreshes without stacking, persists across turns and never blocks self-inflicted penalties', () => {
  const battle = setup(['lyon', 'arthur']);
  use(battle, 'lyon', 'lyon.ward', 'arthur');
  getActor(battle, 'lyon').cooldowns = {};
  use(battle, 'lyon', 'lyon.ward', 'arthur');
  assert.equal(getActor(battle, 'arthur').statuses.filter(value => value.id === 'effect_ward').length, 1);
  getActor(battle, 'arthur').resourceValues.resonance = 3;
  use(battle, 'arthur', 'arthur.ogres_bane', 'enemy_0');
  assert.equal(status(battle, 'arthur', 'effect_ward').charges, 1);
  assert.ok(getActor(battle, 'arthur').statuses.some(value => content.statuses[value.id].kind === 'debuff'));
  assert.equal(battle.events.some(event => event.type === 'effect_blocked'), false);
});

test('immunity can block poison and boss suppression through the shared data-driven status path', () => {
  const source = structuredClone(content);
  hostileSkill(source, [{ type: 'status', status: 'kai_poison', duration: 3 }]);
  const battle = setup(['lyon', 'arthur'], source);
  use(battle, 'lyon', 'lyon.ward', 'arthur'); use(battle, 'enemy_0', 'test.hex', 'arthur');
  assert.equal(status(battle, 'arthur', 'kai_poison'), undefined);
  const bossBattle = setup(['lucien'], source, 'miraebolis_superboss');
  const boss = getActor(bossBattle, 'enemy_0');
  boss.statuses.push({ id: 'effect_ward', remaining: null, charges: 1, stacks: 1, sourceId: boss.id });
  getActor(bossBattle, 'lucien').element = 'thunder';
  use(bossBattle, 'lucien', '$attack', boss.id);
  assert.equal(status(bossBattle, boss.id, 'dragon_suppressed'), undefined);
  assert.equal(status(bossBattle, boss.id, 'effect_ward'), undefined);
  use(bossBattle, 'lucien', '$attack', boss.id);
  assert.equal(status(bossBattle, boss.id, 'dragon_suppressed').stacks, 1);
});

test('previews explain team bonuses, MP cadence and one-debuff immunity', () => {
  for (const id of ['lucien', 'seraphine', 'lyon']) assert.match(passiveDescription(content.characters[id], content), /căn bản.*Cộng trước buff %/);
  assert.match(passiveDescription(content.characters.cedric, content), /cuối lượt của chính mình.*2%.*4%/);
  assert.match(skillScaling(content.abilities['lyon.ward'], content.characters.lyon, content).join('\n'), /chặn 1 hiệu ứng bất lợi mới từ kẻ địch/);
});

test('older saves gain locked Valmont, every new character is recruitable and resolved bonuses never enter saves', () => {
  for (const id of family) {
    const old = createCampaign(content); for (const name of family) delete old.characters[name];
    let campaign = deserializeCampaign(serializeCampaign(old), content);
    assert.deepEqual(campaign.characters[id], { level: 1, upgradeIds: [] });
    assert.equal(campaign.unlockedCharacterIds.includes(id), false);
    const pool = content.banners.standard.characterPool;
    const draws = [.95, (pool.indexOf(id) + .5) / pool.length];
    campaign.coins = 100; campaign.prisma = 10;
    campaign = pullGacha(campaign, content, 'standard', 1, () => draws.shift()).campaign;
    assert.equal(campaign.unlockedCharacterIds.includes(id), true);
    assert.equal(serializeCampaign(campaign).includes('teamBonuses'), false);
  }
});

test('validation rejects invalid tags, family bonuses, end-turn MP, scaling stats and immunity charges', () => {
  for (const corrupt of [
    data => { data.characters.lyon.tags = ['valmont', 'valmont']; },
    data => { data.characters.lucien.passive.modifiers.magic = -2; },
    data => { data.characters.seraphine.passive.excludeSelf = 'yes'; },
    data => { data.characters.lyon.passive.countSelf = 1; },
    data => { data.characters.cedric.passive.ratio = NaN; },
    data => { data.characters.cedric.passive.tagMultiplier = 0; },
    data => { data.abilities['lyon.shield'].effects[0].scalingStat = 'speed'; },
    data => { data.statuses.effect_ward.effectImmunity.charges = 0; },
    data => { data.statuses.effect_ward.kind = 'debuff'; },
    data => { data.abilities['gahallad.mount'].effects[0].linkedStatuses.push('effect_ward'); },
    data => { data.characters.seraphine.basicAttack = []; },
    data => { data.characters.seraphine.basicAttack[0].multiplier = NaN; },
    data => { data.characters.seraphine.basicAttack[0].damageType = 'hybrid'; },
    data => { data.characters.seraphine.basicAttack[0].element = 'missing'; },
    data => { data.characters.seraphine.basicAttack[0].hits = 2; }
  ]) { const invalid = structuredClone(content); corrupt(invalid); assert.ok(validateContent(invalid).length); }
});
