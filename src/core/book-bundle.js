import {grantCharacterXp} from './leveling.js';
import {isExperienceBook} from './progression-items.js';

export function previewBookBundle(campaign,content,characterId,quantities){
 if(!quantities||typeof quantities!=='object'||Array.isArray(quantities))throw Error('Số lượng sách không hợp lệ.');
 let amount=0;const items=[];
 for(const [id,n] of Object.entries(quantities)){
  const item=content.items[id];
  if(!isExperienceBook(item)||!Number.isSafeInteger(n)||n<0)throw Error('Số lượng sách không hợp lệ.');
  if(n>(campaign[item.field]??0))throw Error('Không đủ Nhật kí hành trình.');
  amount+=n*item.xp;if(!Number.isSafeInteger(amount))throw Error('EXP vượt giới hạn.');
  if(n)items.push({item,quantity:n});
 }
 if(!amount)throw Error('Chọn ít nhất một quyển Nhật kí hành trình.');
 const next=structuredClone(campaign),report=grantCharacterXp(next,content,characterId,amount);
 if(report.accepted<=0)throw Error('Nhân vật đã đầy EXP ở giới hạn hiện tại. Hãy Đột Phá trước khi dùng sách.');
 return {report,items};
}
export function useBookBundle(campaign,content,characterId,quantities,options={}){
 if(options.battleActive||campaign.chronicles?.activeSession)throw Error('Hãy kết thúc trận hoặc chuyến đang chơi trước khi dùng Nhật kí hành trình.');
 const {report,items}=previewBookBundle(campaign,content,characterId,quantities),next=structuredClone(campaign);
 for(const {item,quantity}of items)next[item.field]-=quantity;
 grantCharacterXp(next,content,characterId,report.amount);return next;
}
