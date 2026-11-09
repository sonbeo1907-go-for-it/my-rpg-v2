import {dungeonDay} from './dungeon-rules.js';
export const arenaRules=content=>content.economy.default.arena;
const whole=n=>Number.isSafeInteger(n)&&n>=0;
const dateKey=value=>value===null||typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value);
export function arenaWeek(now=new Date()){const d=new Date(dungeonDay(now)+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return d.toISOString().slice(0,10);}
export function emptyArenaProgress(){return {rating:0,wins:0,losses:0,draws:0,daily:{day:null,earned:0,wins:0,claimed:[]},weekly:{week:null,purchases:{pure:0,original:0}},pending:null,lastResult:null};}
export function arenaTier(content,rating=0){return [...arenaRules(content).tiers].reverse().find(t=>rating>=t.minimumRating)??arenaRules(content).tiers[0];}
export function rankedOwnedCount(content,campaign){return campaign.unlockedCharacterIds.filter(id=>content.characters[id]&&!content.characters[id].developerOnly).length;}
export function normalizeArenaProgress(input,content){
 if(input===undefined)return emptyArenaProgress();
 const p=input,r=arenaRules(content),m=p?.pending,l=p?.lastResult;
 if(!p||[p.rating,p.wins,p.losses,p.draws,p.daily?.earned,p.daily?.wins,p.weekly?.purchases?.pure,p.weekly?.purchases?.original].some(n=>!whole(n))||!dateKey(p.daily?.day)||!dateKey(p.weekly?.week)||p.daily.earned>r.dailyHonorLimit||!Array.isArray(p.daily.claimed)||new Set(p.daily.claimed).size!==p.daily.claimed.length||p.daily.claimed.some(n=>!r.milestones.some(x=>x.wins===n))||p.weekly.purchases.pure>r.shop.pure.weeklyLimit||p.weekly.purchases.original>r.shop.original.weeklyLimit)throw Error('Tiến trình Đấu Trường không hợp lệ.');
 if(m!==null&&(!m||typeof m.id!=='string'||m.id.length<1||m.id.length>100||!whole(m.seed)||m.seed>0xffffffff||!['normal','ranked'].includes(m.mode)||!r.tiers.some(t=>t.id===m.rankAtEntry)||typeof m.playerName!=='string'||typeof m.opponentName!=='string'||!Number.isFinite(Date.parse(m.startedAt))))throw Error('Trận Đấu Trường đang chờ không hợp lệ.');
 if(l!==null&&(!l||typeof l.id!=='string'||!['victory','defeat','draw'].includes(l.outcome)||!whole(l.honorAwarded)||!whole(l.ratingBefore)||!whole(l.ratingAfter)||typeof l.forfeited!=='boolean'||!['normal','ranked'].includes(l.mode)||!Number.isFinite(Date.parse(l.completedAt))))throw Error('Kết quả Đấu Trường không hợp lệ.');
 return structuredClone(p);
}
export function arenaCalendar(campaign,content,now=new Date()){
 const p=normalizeArenaProgress(campaign.arenaProgress,content),day=dungeonDay(now),week=arenaWeek(now);
 if(p.daily.day!==day)p.daily={day,earned:0,wins:0,claimed:[]};
 if(p.weekly.week!==week)p.weekly={week,purchases:{pure:0,original:0}};
 return p;
}
export function reserveArenaMatch(campaign,content,match,now=new Date()){
 if(campaign.arenaProgress?.pending)throw Error('Hãy hoàn tất kết quả trận Đấu Trường trước.');
 if(campaign.chronicles?.activeSession)throw Error('Hãy rời phiên pháo đài trước.');
 if(match.mode==='ranked'&&rankedOwnedCount(content,campaign)<arenaRules(content).rankedMinimumOwned)throw Error('Đấu Hạng cần sở hữu ít nhất '+arenaRules(content).rankedMinimumOwned+' nhân vật chính thức.');
 if(campaign.arenaProgress?.lastResult?.id===match.id)throw Error('Trận Đấu Trường này đã kết thúc.');
 const next=structuredClone(campaign),p=arenaCalendar(next,content,now);p.pending={...match,rankAtEntry:arenaTier(content,p.rating).id,startedAt:now.toISOString()};next.arenaProgress=normalizeArenaProgress(p,content);return next;
}
export function settleArenaMatch(campaign,content,id,outcome,{forfeited=false,now=new Date()}={}){
 if(!['victory','defeat','draw'].includes(outcome)||forfeited&&outcome!=='defeat')throw Error('Kết quả Đấu Trường không hợp lệ.');
 if(!campaign.arenaProgress?.pending){if(campaign.arenaProgress?.lastResult?.id===id)return campaign;throw Error('Không có trận Đấu Trường để kết toán.');}
 if(campaign.arenaProgress.pending.id!==id)throw Error('Kết quả không khớp trận Đấu Trường.');
 const next=structuredClone(campaign),p=arenaCalendar(next,content,now),r=arenaRules(content),pending=p.pending;
 const requested=forfeited?0:r.honor[outcome],honor=Math.min(requested,Math.max(0,r.dailyHonorLimit-p.daily.earned)),before=p.rating;
 next.honor=(next.honor??0)+honor;if(!whole(next.honor))throw Error('Danh Dự vượt giới hạn.');p.daily.earned+=honor;
 if(outcome==='victory'){p.wins++;p.daily.wins++;}else if(outcome==='defeat')p.losses++;else p.draws++;
 if(pending.mode==='ranked')p.rating=Math.max(0,p.rating+(outcome==='victory'?r.rating.win:outcome==='defeat'?-r.rating.loss:0));
 p.lastResult={id,mode:pending.mode,opponentName:pending.opponentName,outcome,forfeited,honorAwarded:honor,honorRequested:requested,capped:honor<requested,ratingBefore:before,ratingAfter:p.rating,rankBefore:arenaTier(content,before).id,rankAfter:arenaTier(content,p.rating).id,completedAt:now.toISOString()};
 p.pending=null;next.arenaProgress=p;return next;
}
export function claimArenaMilestone(campaign,content,wins,now=new Date()){
 const next=structuredClone(campaign),p=arenaCalendar(next,content,now),m=arenaRules(content).milestones.find(m=>m.wins===wins);
 if(!m||p.daily.wins<wins||p.daily.claimed.includes(wins))throw Error('Mốc thưởng chưa sẵn sàng hoặc đã nhận.');
 next.recruitmentShards+=m.pure;if(!whole(next.recruitmentShards))throw Error('Pure Prisma vượt giới hạn.');p.daily.claimed.push(wins);next.arenaProgress=p;return next;
}
export function buyHonorItem(campaign,content,key,quantity=1,now=new Date()){
 const offer=arenaRules(content).shop[key];if(!offer||!Number.isSafeInteger(quantity)||quantity<1)throw Error('Vật phẩm đổi Danh Dự không hợp lệ.');
 const next=structuredClone(campaign),p=arenaCalendar(next,content,now),cost=offer.cost*quantity;
 if(p.pending)throw Error('Hãy kết thúc trận Đấu Trường trước khi đổi vật phẩm.');
 if(p.weekly.purchases[key]+quantity>offer.weeklyLimit)throw Error('Đã hết lượt đổi vật phẩm trong tuần.');
 if((next.honor??0)<cost)throw Error('Không đủ Danh Dự.');next.honor-=cost;next[offer.field]+=quantity*offer.amount;if(!whole(next[offer.field]))throw Error('Số lượng vật phẩm vượt giới hạn.');p.weekly.purchases[key]+=quantity;next.arenaProgress=p;return next;
}
export function validateArenaProgressionRules(content){
 const r=content.economy?.default?.arena,errors=[];if(!r)return ['Thiếu cấu hình tiến trình Đấu Trường.'];
 if(r.rankedMinimumOwned!==16||r.dailyHonorLimit!==100||!r.honor||r.honor.victory!==20||r.honor.defeat!==5||r.honor.draw!==5||r.rating?.win!==20||r.rating.loss!==10)errors.push('Cấu hình thưởng Đấu Trường không hợp lệ.');
 if(!r.preBansPerSide||Object.keys(r.preBansPerSide).length!==5||['bronze','silver','gold','diamond','prisma'].some((id,i)=>r.preBansPerSide[id]!== (i<2?1:2)))errors.push('Cấu hình cấm trước khi chọn không hợp lệ.');
 if(JSON.stringify(r.milestones)!=='[{"wins":1,"pure":1},{"wins":3,"pure":1},{"wins":5,"pure":2}]')errors.push('Mốc thưởng Đấu Trường không hợp lệ.');
 if(!Array.isArray(r.tiers)||r.tiers.length!==5||r.tiers.some((t,i)=>!t.name||!whole(t.minimumRating)||i>0&&t.minimumRating<=r.tiers[i-1].minimumRating||!Number.isInteger(t.levelMin)||t.levelMin<1||t.levelMax<t.levelMin||t.levelMax>50||!whole(t.slots)||t.slots<3||t.slots>6))errors.push('Cấu hình hạng không hợp lệ.');
 for(const [key,field]of [['pure','recruitmentShards'],['original','originalPrisma']]){const o=r.shop?.[key];if(!o||o.field!==field||!whole(o.cost)||!o.cost||o.amount!==1||!whole(o.weeklyLimit)||!o.weeklyLimit)errors.push('Cửa hàng Danh Dự không hợp lệ.');}return errors;
}
