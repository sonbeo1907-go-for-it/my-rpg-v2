import {unlockCharacter,ownsCharacter} from './ownership.js';
import {unlockDuplicateSlot,gearSlotCapacity} from './gear-slots.js';
export function tobinRecruitmentState(campaign,content){
 const intros=content.chronicles.book1.locations.map(l=>l.introId),clears=new Set(campaign.chronicles?.firstClearIds??[]);
 const completed=intros.filter(id=>clears.has(id)).length,owned=ownsCharacter(campaign,'tobin'),crafts=campaign.tobinCraftCount??0;
 return {owned,completed,total:intros.length,ready:completed===intros.length,crafts,nextAt:Math.min(30,(Math.floor(crafts/10)+1)*10),capacity:gearSlotCapacity(campaign,content,'tobin')};
}
export function recruitTobin(campaign,content){
 const state=tobinRecruitmentState(campaign,content);if(!state.ready)throw Error('Hãy hoàn thành 10/10 phần truyện chính Quyển I trước.');
 if(state.owned)throw Error('Tobin đã đồng hành cùng bạn.');
 const next=structuredClone(campaign);unlockCharacter(next,content,'tobin');next.tobinCraftCount=0;return next;
}
export function recordTobinCraft(campaign,content){
 if(!ownsCharacter(campaign,'tobin'))return;
 const before=campaign.tobinCraftCount??0,after=Math.min(30,before+1);campaign.tobinCraftCount=after;
 if(Math.floor(after/10)>Math.floor(before/10))unlockDuplicateSlot(campaign,content,'tobin');
}
