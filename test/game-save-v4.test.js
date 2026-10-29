import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../scripts/load-content.mjs';
import { createCampaign, serializeCampaign } from '../src/core/progression.js';
import { createGameSave, encodeGameSave, decodeGameSave, selectPreset, changePresetSlot, renamePreset } from '../src/core/game-save.js';
import { characterCatalog, gearCatalog } from '../src/core/catalog.js';
const content = await loadContent();
test('v1-v3 saves migrate to five presets and keep currencies and progression', () => {
  const old = createCampaign(content); old.coins = 789; old.victories = 5;
  const migrated = decodeGameSave(serializeCampaign(old), content);
  assert.equal(migrated.coins, 789); assert.equal(migrated.victories, 5);
  assert.equal(migrated.partyPresets.length, 5); assert.deepEqual(migrated.partyPresets[0].slots, old.party);
  assert.equal(migrated.partyPresets[1].slots, null);
  for (const version of [1, 2]) {
    const legacy = { ...old, version }; if (version === 2) delete legacy.equipment;
    const save = decodeGameSave(JSON.stringify(legacy), content); assert.equal(save.partyPresets.length, 5);
  }
});
test('v4 round trips all five teams independently without storing battle or temporary UI', () => {
  let save = createGameSave(content);
  save = selectPreset(save, 'party-2'); save = changePresetSlot(save, 0, 'fiona'); save = renamePreset(save, 'Đội Prisma');
  const text = encodeGameSave({ ...save, battle: { hp: 7 }, filters: { sort: 'attack' } }, content);
  assert.equal(JSON.parse(text).version, 4); assert.equal(text.includes('"battle"'), false); assert.equal(text.includes('"filters"'), false);
  const restored = decodeGameSave('\uFEFF' + text, content);
  assert.equal(restored.partyPresets[1].name, 'Đội Prisma'); assert.equal(restored.party[0], 'fiona');
  assert.equal(selectPreset(restored, 'party-1').party[0], 'arthur');
});
test('preset swaps preserve unique positions, block locked members and never mutate existing saves', () => {
  const original = createGameSave(content); const before = JSON.stringify(original);
  const next = changePresetSlot(original, 0, 'elaine');
  assert.deepEqual(next.party, ['elaine', 'iris', 'arthur', 'garrek']); assert.equal(JSON.stringify(original), before);
  assert.throws(() => changePresetSlot(original, 0, 'lisbeth'));
  let solo = original; for (const slot of [3, 2, 1]) solo = changePresetSlot(solo, slot, null);
  assert.throws(() => changePresetSlot(solo, 0, null));
  assert.throws(() => renamePreset(original, ' ')); assert.throws(() => selectPreset(original, 'party-6'));
});
test('v4 validates team IDs, ownership, slots, active membership and malformed imports', () => {
  for (const corrupt of [
    save => { save.partyPresets.pop(); }, save => { save.partyPresets[0].id = 'unknown'; },
    save => { save.partyPresets[1].slots = ['lisbeth', null, null, null]; },
    save => { save.partyPresets[0].slots = ['fiona', 'iris', 'elaine', 'garrek']; },
    save => { save.partyPresets[0].slots = [null, null, null, null]; },
    save => { save.partyPresets[0].name = ''; }, save => { save.activePartyPresetId = 'party-5'; }
  ]) { const data = JSON.parse(encodeGameSave(createGameSave(content), content)); corrupt(data); assert.throws(() => decodeGameSave(JSON.stringify(data), content)); }
  assert.throws(() => decodeGameSave('not json', content)); assert.throws(() => decodeGameSave('{"version":99}', content));
});
test('gear sort works after filtering, asc/desc is numeric and input collection remains intact', () => {
  const save = createGameSave(content);
  save.gear = [{ id: 'gear_1', typeId: 't1', stats: { attack: 1 } }, { id: 'gear_2', typeId: 't3_focused', stats: { attack: 5 } }, { id: 'gear_3', typeId: 't2', stats: { magic: 3 } }, { id: 'gear_10', typeId: 't2', stats: { attack: 3 } }];
  const ids = save.gear.map(item => item.id);
  assert.deepEqual(gearCatalog(content, save, { stat: 'attack', sort: 'attack', direction: 'desc' }).map(item => item.stats.attack), [5, 3, 1]);
  assert.deepEqual(gearCatalog(content, save, { stat: 'attack', sort: 'attack', direction: 'asc' }).map(item => item.stats.attack), [1, 3, 5]);
  assert.equal(gearCatalog(content, save, { sort: 'received', direction: 'desc' })[0].id, 'gear_10');
  assert.deepEqual(save.gear.map(item => item.id), ids);
});
test('owned-only character modal never exposes locked units even with conflicting filters', () => {
  const save = createGameSave(content);
  assert.equal(characterCatalog(content, save, {}, true).length, 6);
  assert.equal(characterCatalog(content, save, { ownership: 'locked' }, true).length, 0);
  assert.equal(characterCatalog(content, save, { element: 'light' }, true)[0].id, 'arthur');
  assert.equal(characterCatalog(content, save, { q: 'phía bắc' }, true).every(actor => save.unlockedCharacterIds.includes(actor.id)), true);
});
