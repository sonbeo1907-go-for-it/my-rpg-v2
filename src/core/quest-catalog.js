import { encounterTier, victoryCoinReward } from './economy.js';

export const SINISTER_UNLOCK_FLAG = 'illusion.sinister_unlocked';
export function questUnlockFlag(encounter) {
  return encounter?.requires?.storyFlag ?? (encounterTier(encounter) === 'super' ? SINISTER_UNLOCK_FLAG : null);
}
export function isQuestUnlocked(encounter, campaign) {
  if (!encounter) return false;
  const flag = questUnlockFlag(encounter);
  return !flag || Boolean(campaign?.storyFlags?.includes(flag));
}
export function assertQuestUnlocked(encounter, campaign) {
  if (!isQuestUnlocked(encounter, campaign))
    throw new Error('Nhiệm vụ chưa mở khóa. Hãy tìm dấu vết trong Hầm Ngục Ảo Ảnh.');
}
export function questCategory(filters = {}) {
  if (filters.tab === 'extermination') return 'extermination';
  return filters.tab === 'sinister' || filters.type === 'super' ? 'sinister' : 'extermination';
}
export function questCatalog(content, campaign, filters = {}) {
  const category = questCategory(filters);
  const query = (filters.q ?? '').trim().toLocaleLowerCase('vi');
  return Object.values(content.encounters)
    .filter(encounter => {
      const tier = encounterTier(encounter);
      return isQuestUnlocked(encounter, campaign)
        && (category === 'sinister' ? tier === 'super' : tier !== 'super')
        && (!query || encounter.name.toLocaleLowerCase('vi').includes(query))
        && (category === 'sinister' || !['normal', 'boss'].includes(filters.type) || tier === filters.type);
    })
    // Stable sort retains authored/story order inside a reward group.
    .sort((a, b) => victoryCoinReward(content, a.id) - victoryCoinReward(content, b.id));
}
