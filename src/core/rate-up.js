import {seededRandom} from './random.js';
import {dungeonDay} from './dungeon-rules.js';

const DAY=86400000, OFFSET=7*3600000;
const cache=new WeakMap();
const pick=(items,random)=>items[Math.floor(random()*items.length)];
const hash=text=>{let n=2166136261;for(const char of text)n=Math.imul(n^char.charCodeAt(0),16777619);return n>>>0;};
const atDay=day=>Date.parse(day+'T00:00:00Z');
const dayText=ms=>new Date(ms).toISOString().slice(0,10);
export const rateUpPityKey=banner=>banner.pityKey??banner.id;
export function rateUpGroups(content){return content.banners.standard.rateUpRotation?.groups??[];}
export function inRateUpGroup(actor,group){return Boolean(actor&&(group.tag?actor.tags?.includes(group.tag):group.affiliations?.includes(actor.affiliation)));}

// Calendar replay is profile-independent: opening the game or pulling never rerolls its lineup.
// The versioned roster is pinned in content so simply adding a character does not rewrite history.
export function rotationSchedule(content,now=new Date()){
 const base=content.banners.standard,cfg=base.rateUpRotation;if(!cfg)return {banners:[],queue:[]};
 const day=dungeonDay(now),target=atDay(day),epoch=atDay(cfg.epoch);
 if(target<epoch)return {banners:[],queue:[]};
 let memo=cache.get(content);if(memo?.day===day)return structuredClone(memo.value);
 const random=seededRandom(hash(cfg.seed+':'+cfg.version)),queue=[];
 const pinned=cfg.roster.filter(id=>base.characterPool.includes(id));
 let active=[];
 for(let week=epoch;week<=target;week+=7*DAY){
  let firstGroup=null;
  for(const period of [{offset:0,length:3,slots:1},{offset:3,length:3,slots:1},{offset:6,length:1,slots:2}]){
   const start=week+period.offset*DAY;if(start>target)break;
   const current=[],excluded=[];if(period.offset===3)excluded.push(firstGroup);
   for(let slot=0;slot<period.slots;slot++){
    const roster=[...pinned,...(cfg.rosterAdditions??[]).filter(a=>atDay(a.from)<=start).map(a=>a.id)];
    const available=roster.filter(id=>!queue.includes(id));
    const groups=cfg.groups.filter(g=>!excluded.includes(g.id)&&available.filter(id=>inRateUpGroup(content.characters[id],g)).length>=3);
    if(!groups.length)throw Error('Chưa đủ nhân vật để lập đợt Chiêu Mộ không trùng.');
    const group=pick(groups,random);excluded.push(group.id);if(period.offset===0)firstGroup=group.id;
    const own=available.filter(id=>inRateUpGroup(content.characters[id],group)),featured=[];
    for(let i=0;i<2;i++){const id=pick(own,random);featured.push(id);own.splice(own.indexOf(id),1);}
    const outside=available.filter(id=>!inRateUpGroup(content.characters[id],group));
    featured.push(pick(random()<.5&&outside.length?outside:own,random));
    queue.push(...featured);queue.splice(0,Math.max(0,queue.length-cfg.queueLimit));
    const end=start+period.length*DAY;
    current.push({...base,id:'rateup_'+dayText(start)+'_'+slot,baseBannerId:base.id,pityKey:'rateup_'+dayText(start)+'_'+slot,groupId:group.id,name:group.name,title:group.title,description:group.description,art:group.art,accent:group.accent,featured,startDate:dayText(start),endDate:dayText(end),startsAt:start-OFFSET,endsAt:end-OFFSET,scheduleVersion:cfg.version});
   }
   if(target>=start&&target<start+period.length*DAY)active=current;
  }
 }
 const value={banners:active,queue:[...queue]};cache.set(content,{day,value:structuredClone(value)});return value;
}
export function activeRecruitmentBanners(content,now=new Date()){return [...rotationSchedule(content,now).banners,content.banners.standard];}
export function resolveRecruitmentBanner(content,id,now=new Date()){
 const fixed=Object.hasOwn(content.banners,id)?content.banners[id]:null;
 if(fixed)return fixed;
 return rotationSchedule(content,now).banners.find(b=>b.id===id)??null;
}
export function characterDrawChance(banner,id){
 if(!banner.characterPool.includes(id))return 0;
 if(!banner.featured)return 1/banner.characterPool.length;
 const index=banner.featured.indexOf(id);return index===0?.25:index>0?.125:.5/(banner.characterPool.length-3);
}
// One independent uniform roll conditional on a character: 25 / 12.5 / 12.5 / 50.
export function drawBannerCharacter(banner,value){
 if(!Number.isFinite(value)||value<0||value>=1)throw Error('Nguồn ngẫu nhiên không hợp lệ.');
 if(!banner.featured)return banner.characterPool[Math.floor(value*banner.characterPool.length)];
 if(value<.25)return banner.featured[0];if(value<.375)return banner.featured[1];if(value<.5)return banner.featured[2];
 const off= banner.characterPool.filter(id=>!banner.featured.includes(id));return off[Math.floor((value-.5)*2*off.length)];
}
export function rateUpSnapshot(banner){return banner.featured?{id:banner.id,groupId:banner.groupId,featured:[...banner.featured],startDate:banner.startDate,endDate:banner.endDate,version:banner.scheduleVersion}:null;}
export function validateRateUpSnapshot(value,banner){
 if(!value||!Number.isInteger(value.version)||value.version<1||!/^rateup_\d{4}-\d{2}-\d{2}_[01]$/.test(value.id)||value.id.slice(7,17)!==value.startDate||!rateUpGroups({banners:{standard:banner}}).some(g=>g.id===value.groupId)||!Array.isArray(value.featured)||value.featured.length!==3||new Set(value.featured).size!==3||value.featured.some(id=>!banner.characterPool.includes(id)))return false;
 const start=atDay(value.startDate),end=atDay(value.endDate);return Number.isFinite(start)&&Number.isFinite(end)&&dayText(start)===value.startDate&&dayText(end)===value.endDate&&[DAY,3*DAY].includes(end-start);
}
export function validateRateUpContent(content){
 const b=content.banners?.standard,cfg=b?.rateUpRotation;if(!cfg)return [];
 const errors=[],fail=message=>errors.push('rate-up: '+message);
 if(cfg.version!==1||cfg.queueLimit!==15||typeof cfg.seed!=='string'||!cfg.seed||!Number.isFinite(atDay(cfg.epoch))||new Date(atDay(cfg.epoch)).getUTCDay()!==1)fail('invalid calendar');
 if(!Array.isArray(cfg.roster)||new Set(cfg.roster).size!==cfg.roster.length||cfg.roster.length<24||cfg.roster.some(id=>!b.characterPool.includes(id)))fail('invalid pinned roster');
 if(cfg.rosterAdditions!==undefined&&(!Array.isArray(cfg.rosterAdditions)||new Set(cfg.rosterAdditions.map(a=>a.id)).size!==cfg.rosterAdditions.length||cfg.rosterAdditions.some(a=>cfg.roster.includes(a.id)||!b.characterPool.includes(a.id)||!Number.isFinite(atDay(a.from))||dayText(atDay(a.from))!==a.from)))fail('invalid roster additions');
 if(!Array.isArray(cfg.groups)||cfg.groups.length!==5||new Set(cfg.groups.map(g=>g.id)).size!==cfg.groups.length)fail('invalid groups');
 for(const g of cfg.groups??[]){if(!/^[a-z_]+$/.test(g.id)||!g.name||!g.title||!g.description||!/^\/art\/rateup-[a-z]+\.svg$/.test(g.art)||!/^#[a-fA-F0-9]{6}$/.test(g.accent)||Boolean(g.tag)===Boolean(g.affiliations)||(cfg.roster?.filter(id=>inRateUpGroup(content.characters[id],g)).length??0)<3)fail('invalid group '+g.id);}
 return errors;
}

export function rateUpPeriod(id){
 if(typeof id!=='string'||!/^rateup_\d{4}-\d{2}-\d{2}_[01]$/.test(id))return null;
 const day=id.slice(7,17),start=atDay(day);if(!Number.isFinite(start)||dayText(start)!==day)return null;
 const weekday=new Date(start).getUTCDay(),slot=Number(id.at(-1));if(![0,1,4].includes(weekday)||(weekday!==0&&slot!==0))return null;
 return {startsAt:start-OFFSET,endsAt:start+(weekday===0?1:3)*DAY-OFFSET};
}
export function pruneRateUpPity(pity,now=new Date()){
 return Object.fromEntries(Object.entries(pity).filter(([id])=>id!=='rate_up'&&(!id.startsWith('rateup_')||(rateUpPeriod(id)?.endsAt??0)>now.getTime())));
}
