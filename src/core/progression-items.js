import {grantCharacterXp} from './leveling.js';

export const EXPERIENCE_BOOK_FIELDS=['xpBooksGreen','xpBooksBlue','xpBooksPurple'];
export const EXPERIENCE_BOOK_KINDS=['xp_book_green','xp_book_blue','xp_book_purple'];
export const EXPERIENCE_BOOK_NAMES=['Nhật kí hành trình I','Nhật kí hành trình II','Nhật kí hành trình III'];
export const isExperienceBook=item=>EXPERIENCE_BOOK_KINDS.includes(item?.kind);
const positive=n=>Number.isSafeInteger(n)&&n>0;
export function progressionShopItems(content){return Object.values(content.items).filter(i=>(i.kind==='breakthrough'||isExperienceBook(i))&&positive(i.coinCost));}
export function buyProgressionItem(campaign,content,id,quantity=1){
 const item=progressionShopItems(content).find(i=>i.id===id);
 if(!item||!positive(quantity)||!positive(quantity*item.coinCost))throw Error('Vật phẩm hoặc số lượng mua không hợp lệ.');
 const total=quantity*item.coinCost,before=campaign[item.field]??0;
 if(!Number.isSafeInteger(campaign.coins)||campaign.coins<total)throw Error('Không đủ Coin để mua vật phẩm.');
 if(!Number.isSafeInteger(before)||before<0||!Number.isSafeInteger(before+quantity))throw Error('Số lượng vật phẩm vượt giới hạn.');
 const next=structuredClone(campaign);next.coins-=total;next[item.field]=before+quantity;return next;
}
export function previewExperienceBook(campaign,content,itemId,characterId,quantity=1){
 const item=content.items[itemId];
 if(!isExperienceBook(item)||!positive(quantity)||!positive(item.xp*quantity))throw Error('Sách hoặc số lượng sử dụng không hợp lệ.');
 if((campaign[item.field]??0)<quantity)throw Error('Không đủ Nhật kí hành trình.');
 const next=structuredClone(campaign),report=grantCharacterXp(next,content,characterId,item.xp*quantity);
 if(report.accepted<=0)throw Error('Nhân vật đã đầy EXP ở giới hạn hiện tại. Hãy Đột Phá hoặc chọn đồng đội khác.');
 return report;
}
export function useExperienceBook(campaign,content,itemId,characterId,quantity=1,options={}){
 if(options.battleActive||campaign.chronicles?.activeSession)throw Error('Hãy kết thúc trận hoặc chuyến đang chơi trước khi dùng Nhật kí hành trình.');
 previewExperienceBook(campaign,content,itemId,characterId,quantity);
 const next=structuredClone(campaign);next[content.items[itemId].field]-=quantity;grantCharacterXp(next,content,characterId,content.items[itemId].xp*quantity);return next;
}
export function rollDungeonReward(content,difficulty,random=Math.random){
 const reward=structuredClone(difficulty.reward);
 for(const drop of difficulty.bookDrops??[]){const item=content.items[drop.itemId],roll=random();if(!isExperienceBook(item)||!Number.isFinite(roll)||roll<0||roll>=1)throw Error('Dữ liệu phần thưởng sách không hợp lệ.');reward[item.field]=drop.min+Math.floor(roll*(drop.max-drop.min+1));}
 return reward;
}
export function validateBookDrops(content,difficulty,dungeonId){
 const drops=difficulty.bookDrops;if(drops===undefined)return [];
 return dungeonId!=='training_grounds'||!Array.isArray(drops)||!drops.length||new Set(drops.map(d=>d?.itemId)).size!==drops.length||drops.some(d=>!isExperienceBook(content.items[d?.itemId])||!positive(d.min)||!positive(d.max)||d.max<d.min||d.max>1000)?['Invalid training book drops']:[];
}
