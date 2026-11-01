"use client";
import Link from 'next/link';
import {useEffect,useRef} from 'react';
import {useGame} from '../runtime/game-context';
import {firstClearRewardLabel} from '../core/first-clear-labels.js';
import {xpResultProgress} from '../ui/battle-result-model.js';
import {victoryRewardText} from '../core/quest-rewards.js';
import {dungeonRewardText} from '../ui/dungeon-presentation.js';
import {CurrencyAmount,Icon,fmt} from './ui';
const currencies:Record<string,any>={coins:'coin',prisma:'prisma',recruitmentShards:'pure',prismaFragments:'fragments',originalPrisma:'original',limitBreakStones:'breakthrough',blueprints:'blueprint'};
function firstClearLabel(content:any,r:any){
 if(r.characterId&&r.type===undefined){const c=content.characters[r.characterId];return `${r.duplicate?'Bản trùng':'Đồng đội mới'} · ${c.name}${r.slotUnlocked?' · Mở thêm ô trang bị':''}${r.shards?' · +'+r.shards+' Pure Prisma':''}`;}
 return firstClearRewardLabel(content,r);
}
export function BattleResult({children}:{children:React.ReactNode}){
 const {battle,campaign,content,busy}=useGame(),heading=useRef<HTMLHeadingElement>(null);
 const progress=battle.dungeon??battle.storyWave;
 const title=battle.dungeon?content.dungeons[battle.dungeon.typeId].name+' · '+content.dungeons[battle.dungeon.typeId].difficulties.find((d:any)=>d.id===battle.dungeon.difficultyId).name:content.encounters[battle.encounterId].name;
 const win=battle.outcome==='victory',reward=win?(battle.dungeon?.reward??battle.victoryReward??{}):{};
 useEffect(()=>{heading.current?.focus({preventScroll:true});heading.current?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});},[battle.sessionId]);
 return <section className={`panel battle-result ${win?'victory':'defeat'}`} aria-labelledby="battle-result-title">
  <header className="battle-result-heading"><span className="result-emblem"><Icon name={win?'sword':'shield'}/></span><div><span className="eyebrow">KẾT QUẢ HÀNH TRÌNH</span><h2 ref={heading} tabIndex={-1} id="battle-result-title">{win?'Chiến thắng':battle.outcome==='defeat'?'Đội hình đã gục ngã':'Trận đấu đã kết thúc'}</h2><p>{title}{progress?` · ${progress.waveIndex+1}/${progress.totalWaves} ${progress.stageLabel?.toLowerCase()??"đợt"}`:""} · {battle.round} vòng</p></div></header>
  <div className="battle-outcome" role="status">{win?battle.rewardClaimed?(battle.chronicle?'Trận chiến đã lưu · Tiếp tục câu chuyện để hoàn thành sự kiện.':content.encounters[battle.encounterId].rewardPolicy==='none'?'Chiến thắng đã lưu · Không cấp tiền tệ hoặc EXP.':`Chiến thắng · +${battle.dungeon?dungeonRewardText(battle.dungeon.reward):victoryRewardText(battle.victoryReward)} đã lưu`):'Đang chờ lưu phần thưởng. Nếu lưu lỗi, hãy bấm Nhận thưởng để thử lại.':'Không nhận phần thưởng hoặc EXP từ trận này.'}</div>
  <section className="result-rewards" aria-label="Phần thưởng trận đấu"><h3>Phần thưởng{win&&!battle.rewardClaimed?' · Chưa nhận':''}</h3><div className="result-currencies">{reward.characterXp>0&&<span className="currency-amount currency-xp"><strong>{fmt(reward.characterXp)}</strong><small>XP / nhân vật</small></span>}{Object.entries(reward).filter(([key])=>currencies[key]).map(([key,amount])=><CurrencyAmount key={key} kind={currencies[key]} amount={amount as number}/>)}{!win&&<span className="muted">Không có</span>}{win&&battle.rewardClaimed&&!Object.keys(reward).length&&<span className="muted">{battle.chronicle?'Hoàn thành đoạn kết để ghi lại sự kiện và nhận thưởng nếu còn lượt.':'Thử thách này không cấp tiền tệ.'}</span>}{win&&busy&&!Object.keys(reward).length&&<span>Đang tổng kết…</span>}</div>
   {battle.firstClearRewards?.length>0&&<div className="recipe-unlocks"><strong>Thưởng lần đầu</strong>{battle.firstClearRewards.map((r:any,i:number)=><span key={i}>{firstClearLabel(content,r)}</span>)}{battle.firstClearRewards.some((r:any)=>r.type==='gear_recipe'||r.type==='exclusive_recipe')&&<Link href="/blacksmith">Đến Thợ Rèn →</Link>}</div>}
  </section>
  <section className="result-experience" aria-label="EXP nhận được"><div className="result-section-title"><h3>Kinh nghiệm đội hình</h3>{battle.xpAwards?.some((r:any)=>r.points>0)&&<Link href="/characters?ownership=owned">Phân bổ điểm →</Link>}</div>
   {battle.xpAwards?.length>0?<div className="battle-xp-awards">{battle.xpAwards.map((r:any)=>{const p=xpResultProgress(content,r,campaign.characters[r.characterId]);return <article key={r.characterId} className="result-xp-row" data-xp-character={r.characterId}><div className="result-xp-heading"><strong>{content.characters[r.characterId].name}</strong><span className="xp-gained">+{fmt(r.accepted)} XP</span></div><div className="result-xp-track" role="progressbar" aria-label={`EXP ${content.characters[r.characterId].name}`} aria-valuemin={0} aria-valuemax={p.need||1} aria-valuenow={p.need?p.xp:1} aria-valuetext={`+${r.accepted} XP · Level ${r.fromLevel} → ${r.toLevel}`}><i className="xp-before" style={{width:p.before+'%'}}/><i className="xp-earned" style={{left:p.before+'%',width:Math.max(0,p.after-p.before)+'%'}}/></div><div className="result-xp-meta"><span>{r.points?`Level ${r.fromLevel} → ${r.toLevel} · +${r.points} điểm`:`Level ${r.toLevel}`}</span><span>{p.atMaximum?'Đã đạt cấp tối đa':`${fmt(p.xp)} / ${fmt(p.need)} XP`}</span></div>{r.lost>0&&<small className="warning">{fmt(r.lost)} XP vượt giới hạn không được tích.</small>}</article>;})}</div>:<p className="muted">{win&&!battle.rewardClaimed?'EXP được ghi nhận khi lưu thưởng thành công.':'Nội dung này không cấp EXP.'}</p>}
  </section>
  <footer className="command-panel result-footer">{children}</footer>
 </section>;
}
