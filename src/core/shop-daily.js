import {dungeonDay,nextDungeonReset} from './dungeon-rules.js';
export const emptyShopDaily=()=>({day:null,originalExchanges:0});
export function normalizeShopDaily(input) {
 if(input===undefined)return emptyShopDaily();
 const fail=()=>{throw new Error('Dữ liệu đổi Prisma hằng ngày không hợp lệ.');};
 if(!input||typeof input!=='object'||Array.isArray(input))fail();
 const {day,originalExchanges:count}=input;
 if(day!==null&&(typeof day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day+'T00:00:00Z'))||new Date(day+'T00:00:00Z').toISOString().slice(0,10)!==day))fail();
 if(!Number.isSafeInteger(count)||count<0||count>3||(day===null&&count!==0))fail();
 return {day,originalExchanges:count};
}
export function originalExchangeState(campaign,now=new Date()) {
 const old=normalizeShopDaily(campaign.shopDaily),today=dungeonDay(now);
 const state=!old.day||today>old.day?{day:today,originalExchanges:0}:old;
 return {...state,remaining:3-state.originalExchanges,nextReset:nextDungeonReset(now).toISOString()};
}
// Pure transaction: caller must persist before publishing counters or currency.
export function exchangePureForOriginal(campaign,now=new Date()) {
 const state=originalExchangeState(campaign,now);
 if(!state.remaining)throw new Error('Đã hết 3 lượt đổi Original Prisma hôm nay.');
 if(!Number.isSafeInteger(campaign.recruitmentShards)||campaign.recruitmentShards<10)throw new Error('Cần 10 Pure Prisma để chuyển đổi.');
 if(!Number.isSafeInteger(campaign.originalPrisma??0)||(campaign.originalPrisma??0)<0||!Number.isSafeInteger((campaign.originalPrisma??0)+1))throw new Error('Số dư Original Prisma không hợp lệ.');
 const next=structuredClone(campaign);
 next.recruitmentShards-=10;next.originalPrisma=(next.originalPrisma??0)+1;
 next.shopDaily={day:state.day,originalExchanges:state.originalExchanges+1};
 return next;
}
