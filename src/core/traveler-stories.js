import {INTRO_STORY_FINALS,storyNeedsIntro} from './story-gates.js';
import { isQuestUnlocked } from './quest-catalog.js';

export const STORIES_PER_PAGE = 3;
export function travelerStoryPage(content, page = 1, perPage = STORIES_PER_PAGE) {
  if (![1,STORIES_PER_PAGE].includes(perPage)) perPage=STORIES_PER_PAGE;
  const stories = Object.values(content.travelerStories ?? {}).sort((a,b) => a.order-b.order);
  const pages = Math.max(1, Math.ceil(stories.length/perPage));
  const current = Math.min(pages, Math.max(1, Number.isSafeInteger(Number(page)) ? Number(page) : 1));
  return { stories:stories.slice((current-1)*perPage,current*perPage), page:current, pages };
}
export function travelerChapters(content, campaign, storyId) {
  const story = content.travelerStories?.[storyId];
  return (story?.chapters ?? []).map(id => {
    const encounter=content.encounters[id];
    return {...encounter, cleared:campaign.claimedFirstClearRewards.includes(id), unlocked:isQuestUnlocked(encounter,campaign)};
  });
}
export function storyPrerequisites(content,campaign,storyId) {
  const story=content.travelerStories?.[storyId],first=content.encounters[story?.chapters?.[0]];
  return (first?.requires?.firstClears??[]).map(id=>({id,storyId:content.encounters[id].travelerStory,name:content.travelerStories[content.encounters[id].travelerStory]?.name??content.encounters[id].name,completed:campaign.claimedFirstClearRewards.includes(id)}));
}
export function validateTravelerStories(content) {
  const errors=[];
  for (const story of Object.values(content.travelerStories ?? {})) {
    if (!story.name?.trim() || !/^\/art\/story-[a-z-]+\.svg$/.test(story.art ?? '') || !Number.isInteger(story.order)
      || !content.characters[story.characterId] || !Array.isArray(story.chapters) || new Set(story.chapters).size !== story.chapters.length) {
      errors.push(`${story.id}: invalid traveler story`); continue;
    }
    story.chapters.forEach((id,index) => {
      const encounter=content.encounters[id];
      if(storyNeedsIntro(story)&&INTRO_STORY_FINALS.some(key=>!encounter?.requires?.firstClears?.includes(key)))errors.push(story.id+': later story requires intro trilogy');
      if(Object.values(content.banners??{}).some(b=>b.characterPool.includes(story.characterId))&&encounter?.requiredPartyIds?.includes(story.characterId))errors.push(story.id+': gacha story cannot require its character');
      if (!encounter || encounter.travelerStory !== story.id || (encounter.requires?.firstClear ?? null) !== (story.chapters[index-1] ?? null)) errors.push(`${story.id}: invalid chapter order ${id}`);
    });
  }
  for (const encounter of Object.values(content.encounters)) {
    if (encounter.travelerStory && !content.travelerStories?.[encounter.travelerStory]?.chapters.includes(encounter.id)) errors.push(`${encounter.id}: invalid story reference`);
  }
  return errors;
}
