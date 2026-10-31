import { encounterTier, victoryCoinReward } from './economy.js';

export const SINISTER_UNLOCK_FLAG = 'illusion.sinister_unlocked';
export function questUnlockFlag(encounter) {
  return encounter?.requires?.storyFlag ?? (encounterTier(encounter) === 'super' && !encounter.travelerStory ? SINISTER_UNLOCK_FLAG : null);
}
export function isQuestUnlocked(encounter, campaign) {
  if (!encounter) return false;
  const flag = questUnlockFlag(encounter);
  return (!flag || Boolean(campaign?.storyFlags?.includes(flag)))
    && (!encounter.requires?.firstClear || Boolean(campaign?.claimedFirstClearRewards?.includes(encounter.requires.firstClear)))
    && (encounter.requires?.firstClears??[]).every(id=>campaign?.claimedFirstClearRewards?.includes(id));
}
export function assertQuestUnlocked(encounter, campaign) {
  if (!isQuestUnlocked(encounter, campaign))
    throw new Error(encounter?.travelerStory ? 'Hãy hoàn thành chương trước để mở khóa chương này.' : 'Nhiệm vụ chưa mở khóa. Điều kiện mở khóa sẽ được bổ sung sau.');
}
export function assertEncounterParty(encounter, campaign, content) {
  if (encounter.requiredPartyIds?.some(id => !campaign.party.includes(id)))
    throw new Error(`Trận này bắt buộc có ${encounter.requiredPartyIds.map(id => content.characters[id].name).join(', ')} trong đội hình.`);
}
export function encounterReturnPath(content, id) {
  const story = content.encounters[id]?.travelerStory;
  return story ? `/stories/${story}?selected=${id}` : `/quests?selected=${id}`;
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
        && !encounter.travelerStory
        && (category === 'sinister' ? tier === 'super' : tier !== 'super')
        && (!query || encounter.name.toLocaleLowerCase('vi').includes(query))
        && (category === 'sinister' || !['normal', 'boss'].includes(filters.type) || tier === filters.type);
    })
    // Stable sort retains authored/story order inside a reward group.
    .sort((a, b) => victoryCoinReward(content, a.id) - victoryCoinReward(content, b.id));
}
