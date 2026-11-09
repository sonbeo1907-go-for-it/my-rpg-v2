import {chronicleEncounterAllowed} from './chronicle-rules.js';
import { encounterTier, victoryCoinReward } from './economy.js';

export const BOUNTY_PREREQUISITES=['iris_story_revenge','takeshi_story_horizon','fiona_story_drei'];
export const bountyUnlocked=campaign=>BOUNTY_PREREQUISITES.every(id=>campaign.claimedFirstClearRewards?.includes(id));
export const SINISTER_UNLOCK_FLAG = 'illusion.sinister_unlocked';
export function questUnlockFlag(encounter) {
  return encounter?.requires?.storyFlag ?? (encounterTier(encounter) === 'super' && encounter.category!=='chronicle'
        && !encounter.travelerStory && encounter.category!=='chronicle' ? SINISTER_UNLOCK_FLAG : null);
}
export function isQuestUnlocked(encounter, campaign) {
  if (!encounter) return false;
  if(encounter.id==='miraebolis_superboss'&&campaign?.chronicles?.books?.book2?.finaleCleared)return true;
  if(encounter.id==='alice_superboss')return campaign?.chronicles?.aliceFirstEncounterCleared===true;
  if(encounter.category==='chronicle')return chronicleEncounterAllowed(encounter,campaign);
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
export function encounterReturnPath(content, id,difficultyId,enemyLevel) {
  if(content.encounters[id]?.category==='chronicle'){const e=content.chronicleEvents[content.encounters[id].chronicleEventId];return e.bookId==='book2'?'/chronicles/book2':'/chronicles/book1?location='+e.locationId+'&scene=1';}
  if(content.encounters[id]?.superLevels)return '/quests?tab=sinister&selected='+id+'&superLevel='+(content.encounters[id].superLevels.includes(enemyLevel)?enemyLevel:60);
  const story = content.encounters[id]?.travelerStory;
  const east = ['east_key','east_hunt'].includes(content.encounters[id]?.category);
  return story ? `/stories/${story}?selected=${id}` : east?`/quests?tab=east&selected=${id}${difficultyId?"&difficulty="+encodeURIComponent(difficultyId):""}`:content.encounters[id]?.category==='bounty'?`/quests?tab=bounty&selected=${id}${difficultyId?"&difficulty="+encodeURIComponent(difficultyId):""}`:`/quests?selected=${id}${difficultyId?"&difficulty="+encodeURIComponent(difficultyId):""}`;
}
export function questCategory(filters = {}) {
  if(filters.tab==='east')return 'east';
  if(filters.tab==='bounty')return 'bounty';
  if (filters.tab === 'extermination') return 'extermination';
  return filters.tab === 'sinister' || filters.type === 'super' ? 'sinister' : 'extermination';
}
export function questCatalog(content, campaign, filters = {}) {
  const category = questCategory(filters);
  const query = (filters.q ?? '').trim().toLocaleLowerCase('vi');
  return Object.values(content.encounters)
    .filter(encounter => {
      const tier = encounterTier(encounter);
      const east = ['east_key','east_hunt'].includes(encounter.category);
      return isQuestUnlocked(encounter, campaign)
        && !encounter.travelerStory
        && (category==='east'?east:category === 'bounty' ? encounter.category==='bounty' : !east && encounter.category!=='bounty' && (category === 'sinister' ? tier === 'super' : tier !== 'super'))
        && (!query || encounter.name.toLocaleLowerCase('vi').includes(query))
        && (category !== 'extermination' || !['normal', 'boss'].includes(filters.type) || tier === filters.type);
    })
    // East uses its unlock route as the default order; legacy tabs keep reward-group order.
    .sort((a, b) => category === 'east'
      ? (a.eastOrder ?? 999) - (b.eastOrder ?? 999)
      : victoryCoinReward(content, a.id) - victoryCoinReward(content, b.id));
}
