import { createCampaign, serializeCampaign, deserializeCampaign } from './progression.js';
import { parseSaveImport, MAX_SAVE_FILE_BYTES } from './save-file.js';
import { isValidParty, partySlots, assignPartySlot, removePartySlot } from './party.js';

export const GAME_SAVE_VERSION = 4;
export const GAME_SAVE_KEY = 'northern-prisma.campaign.v4';
const presetId = index => `party-${index + 1}`;
export function withPresets(campaign) {
  return { ...campaign, activePartyPresetId: 'party-1', partyPresets: Array.from({ length: 5 }, (_, index) => ({ id: presetId(index), name: `Đội ${index + 1}`, slots: index === 0 ? partySlots(campaign.party) : null })) };
}
export function createGameSave(content) { return withPresets(createCampaign(content)); }
export function decodeGameSave(text, content) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_SAVE_FILE_BYTES) throw new Error('File save không hợp lệ hoặc vượt 10 MB.');
  const input = JSON.parse(text.replace(/^\uFEFF/, ''));
  if (input?.version !== GAME_SAVE_VERSION) return withPresets(parseSaveImport(text, content));
  // Retain the tested v1-v3 engine migration contract; the application envelope adds five presets.
  const base = deserializeCampaign(JSON.stringify({ ...input, version: 3 }), content);
  const presets = input.partyPresets;
  if (!Array.isArray(presets) || presets.length !== 5) throw new Error('Save cần đúng năm ô đội hình.');
  for (const [index, preset] of presets.entries()) {
    if (!preset || preset.id !== presetId(index) || typeof preset.name !== 'string' || !preset.name.trim() || preset.name.length > 40) throw new Error('Tên hoặc mã đội hình không hợp lệ.');
    if (preset.slots !== null && (!isValidParty(preset.slots, content.characters) || preset.slots.length !== 4 || preset.slots.some(id => id !== null && !base.unlockedCharacterIds.includes(id)))) throw new Error('Thành viên đội hình không hợp lệ.');
  }
  const active = presets.find(preset => preset.id === input.activePartyPresetId);
  if (!active?.slots || JSON.stringify(partySlots(base.party)) !== JSON.stringify(active.slots)) throw new Error('Đội đang dùng không khớp đội hình đã lưu.');
  return { ...base, activePartyPresetId: active.id, partyPresets: structuredClone(presets) };
}
export function encodeGameSave(campaign, content) {
  const data = { ...JSON.parse(serializeCampaign(campaign)), version: GAME_SAVE_VERSION, activePartyPresetId: campaign.activePartyPresetId, partyPresets: campaign.partyPresets };
  const text = JSON.stringify(data, null, 2);
  decodeGameSave(text, content);
  return text;
}
export function selectPreset(campaign, id) {
  const preset = campaign.partyPresets.find(item => item.id === id);
  if (!preset) throw new Error('Đội hình không tồn tại.');
  const next = structuredClone(campaign);
  const chosen = next.partyPresets.find(item => item.id === id);
  // An unused preset starts with the current composition, never an illegal empty party.
  chosen.slots ??= partySlots(campaign.party);
  next.party = [...chosen.slots]; next.activePartyPresetId = id;
  return next;
}
export function changePresetSlot(campaign, slot, characterId) {
  const next = structuredClone(campaign);
  next.party = characterId === null ? removePartySlot(next.party, slot) : assignPartySlot(next.party, slot, characterId, next);
  next.partyPresets.find(item => item.id === next.activePartyPresetId).slots = [...next.party];
  return next;
}
export function renamePreset(campaign, name) {
  if (!name.trim() || name.trim().length > 40) throw new Error('Tên đội phải có 1–40 ký tự.');
  const next = structuredClone(campaign);
  next.partyPresets.find(item => item.id === next.activePartyPresetId).name = name.trim();
  return next;
}
