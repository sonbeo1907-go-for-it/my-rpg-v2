import {unlockDuplicateSlot} from './gear-slots.js';
import {arenaWeek} from './arena-progression.js';

const validWeek=x=>x===null||typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+'T00:00:00Z'))&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x;
const whole=n=>Number.isSafeInteger(n)&&n>=0;
export const emptyAcademyWallet=()=>({tokens:0,lifetimeEarned:0,permanentPurchases:{},weekly:{week:null,purchases:{}}});
export function normalizeAcademyWallet(input){
 if(input===undefined)return emptyAcademyWallet();
 const w=structuredClone(input);w.permanentPurchases??={};if(!w.permanentPurchases||typeof w.permanentPurchases!=='object'||Array.isArray(w.permanentPurchases)||Object.values(w.permanentPurchases).some(n=>!whole(n)))throw Error('Lượt đổi vĩnh viễn không hợp lệ.');
 if(!w||!whole(w.tokens)||!whole(w.lifetimeEarned)||w.tokens>w.lifetimeEarned||!w.weekly||!validWeek(w.weekly.week)||!w.weekly.purchases||typeof w.weekly.purchases!=='object'||Array.isArray(w.weekly.purchases)||Object.values(w.weekly.purchases).some(n=>!whole(n)))throw Error('Ví Huy Hiệu Học Viện không hợp lệ.');
 return w;
}
export function academyShopState(campaign,definition,now=new Date()){
 const wallet=normalizeAcademyWallet(campaign.tournaments?.wallet),week=arenaWeek(now);
 // Moving the clock backwards must not replenish stock a second time.
 if(wallet.weekly.week===null||week>wallet.weekly.week)wallet.weekly={week,purchases:{}};
 return {wallet,offers:definition.eventShop.offers.map(o=>({...o,limit:o.lifetimeLimit??o.weeklyLimit,locked:Boolean(o.characterId&&!campaign.unlockedCharacterIds.includes(o.characterId)),remaining:o.characterId?Math.min(Math.max(0,o.lifetimeLimit-(wallet.permanentPurchases[o.id]??0)),Math.max(0,3-(campaign.extraGearSlots?.[o.characterId]??0))):Math.max(0,o.weeklyLimit-(wallet.weekly.purchases[o.id]??0))}))};
}
/** @param {any} campaign @param {any} content @param {{offerId:string,quantity?:number,revision:number,now?:Date}} options */
export function buyAcademyItem(campaign,content,{offerId,quantity=1,revision,now=new Date()}={}){
 const next=structuredClone(campaign),s=next.tournaments,d=content.tournaments.academy_tournament;
 if(!s||s.revision!==revision||!whole(s.revision+1)||!whole(quantity)||quantity<1||quantity>999)throw Error('Giao dịch đã thay đổi. Hãy mở lại quầy đổi thưởng.');
 const {wallet,offers}=academyShopState(next,d,now),offer=offers.find(o=>o.id===offerId);
 if(!offer||offer.locked||quantity>offer.remaining)throw Error('Không đủ số lượng vật phẩm còn lại trong tuần.');
 const cost=offer.cost*quantity,amount=offer.amount*quantity;
 if(!whole(cost)||!whole(amount)||wallet.tokens<cost)throw Error('Không đủ Huy Hiệu Học Viện.');
 const total=(next[offer.field]??0)+amount;if(!offer.characterId&&!whole(total))throw Error('Số lượng vật phẩm vượt giới hạn.');
 wallet.tokens-=cost;if(offer.characterId){for(let i=0;i<quantity;i++)unlockDuplicateSlot(next,content,offer.characterId);wallet.permanentPurchases[offer.id]=(wallet.permanentPurchases[offer.id]??0)+quantity;}else{wallet.weekly.purchases[offer.id]=(wallet.weekly.purchases[offer.id]??0)+quantity;next[offer.field]=total;}
 s.wallet=wallet;s.revision++;return next;
}
export function awardAcademyTokens(state,run,key,amount){
 run.rewardReceipts??=[];
 if(run.rewardReceipts.some(r=>r.key===key))return;
 const w=state.wallet=normalizeAcademyWallet(state.wallet);
 if(!whole(amount)||amount<1||!whole(w.tokens+amount)||!whole(w.lifetimeEarned+amount))throw Error('Phần thưởng giải đấu vượt giới hạn.');
 w.tokens+=amount;w.lifetimeEarned+=amount;run.rewardReceipts.push({key,amount});
}
export function settleAcademyRewards(state,run,match){
 const rules=run.snapshot.definition.eventEconomy;if(!rules)return;
 const player=run.snapshot.definition.playerTeamId;
 if(match.result.winnerId===player)awardAcademyTokens(state,run,'match:'+match.id,rules.matchWin);
 const milestones={qualified:['quarterfinal','semifinal','final'].includes(run.phase)||run.outcome==='champion',finalist:run.phase==='final',champion:run.outcome==='champion'};
 for(const reward of Object.values(run.snapshot.rewards??{}))if(milestones[reward.trigger])awardAcademyTokens(state,run,'milestone:'+reward.trigger,reward.amount);
}
