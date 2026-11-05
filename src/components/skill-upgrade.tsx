"use client";
import {useRef,useState} from 'react';
import {useGame} from '../runtime/game-context';
import {skillUpgradeQuote} from '../core/skill-progression.js';
import {skillLineId,outputMpFactor,skillRankLabel} from '../core/skill-rules.js';
import {resolveRankedAbility} from '../core/skill-resolver.js';
import {mpCost} from '../core/conditional-combat.js';
import {skillCost} from '../ui/skill-presentation.js';
import {SkillBody} from './skill-details';
import {Modal,fmt,CurrencyAmount} from './ui';

export function SkillUpgrade({skill,actor}:{skill:any;actor:any}){
 const {content,campaign,progressionLocked,busy,upgradeCharacterSkill}=useGame(),pending=useRef(false);
 const [confirmRank,setConfirmRank]=useState<number|null>(null),line=skillLineId(skill),quote=skillUpgradeQuote(campaign,content,actor.id,line,{battleActive:progressionLocked});
 const owned=campaign.unlockedCharacterIds.includes(actor.id);
 if(quote.fixed)return <div className="skill-upgrade fixed"><span title={skill.fixedReason??'Hiệu quả tiện ích giữ nguyên.'}>Cố định · Không có cấp nâng</span></div>;
 const current=resolveRankedAbility(content,actor,skill,quote.rank),next=quote.next?resolveRankedAbility(content,actor,skill,quote.nextRank):null;
 const kind=quote.mastery?'original':'coin',price=quote.mastery?quote.originalCost:quote.coinCost;
 async function commit(){if(confirmRank===null||pending.current)return;pending.current=true;try{if(await upgradeCharacterSkill(actor.id,line,confirmRank))setConfirmRank(null);}finally{pending.current=false;}}
 return <div className="skill-upgrade" data-skill-line={line}>
  <div className="skill-rank-heading"><strong>{skillRankLabel(quote.rank)}{quote.rank<5?' / 5':''}</strong>{next&&<span>{skillRankLabel(quote.nextRank)} · Cần Lv{quote.requiredLevel}</span>}</div>
  {next?<><p className="skill-rank-cost">MP hiện tại <b>{mpCost(current,actor)}</b> → Sau nâng cấp <b>{mpCost(next,actor)}</b></p>
   {current.growthGroups?.includes('output_buff_mp')&&<p className="muted skill-mp-schedule">{quote.mastery?'Thông Thạo giảm tiếp 10% MP mỗi mức; khuếch đại giữ nguyên.':'MP Rank 1–5: '+[1,2,3,4,5].map(rank=>mpCost({...skill,rankMpMultiplier:outputMpFactor(rank,actor.skillProgression)},actor)).join(' / ')+' · Tỷ lệ khuếch đại giữ nguyên.'}</p>}
   <div className="skill-rank-actions"><CurrencyAmount kind={kind} amount={price}/><button type="button" disabled={!owned||busy} onClick={()=>setConfirmRank(quote.rank)} aria-label={'Xem nâng cấp '+skill.name}>{quote.mastery?'Xem Thông Thạo':'Xem nâng cấp'} →</button></div>{!quote.ok&&<small className="muted">{quote.reason}</small>}
  </>:<span className="muted">{quote.rank>5?'Đã đạt Thông Thạo tối đa.':'Đã đạt Rank tối đa.'}</span>}
  {confirmRank!==null&&next&&<Modal title={(quote.mastery?'Thông Thạo · ':'Nâng cấp · ')+skill.name} onClose={()=>!busy&&setConfirmRank(null)} className="skill-upgrade-modal" footer={<><button disabled={busy} onClick={()=>setConfirmRank(null)}>Hủy</button><button className="primary" disabled={busy||!quote.ok||confirmRank!==quote.rank} onClick={commit}>Xác nhận · {fmt(price)} {quote.mastery?'Original Prisma':'Coin'}</button></>}>
   <p className="muted">Nhân vật Lv{actor.level} · Yêu cầu Lv{quote.requiredLevel} · {fmt(quote.mastery?campaign.originalPrisma:campaign.coins)} {quote.mastery?'Original Prisma':'Coin'} hiện có</p>
   <div className="skill-upgrade-comparison">{[{title:'Hiện tại',rank:quote.rank,ability:current},{title:'Sau nâng cấp',rank:quote.nextRank,ability:next}].map(item=><section key={item.title}><h3>{item.title} · {skillRankLabel(item.rank)}</h3><p className="skill-preview-cost">{skillCost(item.ability,actor)}</p><SkillBody skill={item.ability} actor={actor} content={content}/></section>)}</div>
   <p className="muted">{quote.mastery?'Sát thương, hồi HP và khiên +'+fmt((actor.skillProgression.mastery.coefficientGrowthByTier[quote.rank-5]-1)*100)+'%; buff chỉ số +'+fmt((actor.skillProgression.mastery.statBuffGrowthByTier[quote.rank-5]-1)*100)+'% so với mức trước. Các hiệu quả khác giữ nguyên. Thông Thạo chỉ có hiệu lực trong PvE.':'Nâng đúng một Rank.'} Chỉ tiêu nguyên liệu khi xác nhận và lưu thành công.</p>{!quote.ok&&<p className="warning" role="status">{quote.reason}</p>}
  </Modal>}
 </div>;
}
