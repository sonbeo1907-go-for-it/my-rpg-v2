"use client";
import {useState} from 'react';
import {useGame} from '../runtime/game-context';
import {skillUpgradeQuote} from '../core/skill-progression.js';
import {skillLineId,outputMpFactor} from '../core/skill-rules.js';
import {resolveRankedAbility} from '../core/skill-resolver.js';
import {mpCost} from '../core/conditional-combat.js';
import {skillCost} from '../ui/skill-presentation.js';
import {SkillBody} from './skill-details';
import {Modal,fmt,Icon} from './ui';

export function SkillUpgrade({skill,actor}:{skill:any;actor:any}){
 const {content,campaign,progressionLocked,busy,upgradeCharacterSkill}=useGame();
 const [confirmRank,setConfirmRank]=useState<number|null>(null);
 const line=skillLineId(skill),quote=skillUpgradeQuote(campaign,content,actor.id,line,{battleActive:progressionLocked});
 const owned=campaign.unlockedCharacterIds.includes(actor.id);
 if(quote.fixed)return <div className="skill-upgrade fixed"><span title={skill.fixedReason??'Hiệu quả tiện ích giữ nguyên.'} aria-label={'Cố định · Không có cấp nâng. '+(skill.fixedReason??'Hiệu quả tiện ích giữ nguyên.')}>Cố định · Không có cấp nâng</span></div>;
 const current=resolveRankedAbility(content,actor,skill,quote.rank),next=quote.next?resolveRankedAbility(content,actor,skill,quote.nextRank):null;
 const modalQuote=confirmRank===null?quote:skillUpgradeQuote(campaign,content,actor.id,line,{battleActive:progressionLocked});
 async function commit(){if(confirmRank!==null&&await upgradeCharacterSkill(actor.id,line,confirmRank))setConfirmRank(null);}
 return <div className="skill-upgrade" data-skill-line={line}>
  <div className="skill-rank-heading"><strong>Rank {quote.rank} / 5</strong>{next&&<span>Rank {quote.nextRank} · Cần Lv{quote.requiredLevel}</span>}</div>
  {next?<>
   <p className="skill-rank-cost">MP hiện tại <b>{mpCost(current,actor)}</b> → Rank {quote.nextRank} <b>{mpCost(next,actor)}</b></p>
   {current.growthGroups?.includes('output_buff_mp')&&<p className="muted skill-mp-schedule">MP Rank 1–5: {[1,2,3,4,5].map(rank=>mpCost({...skill,rankMpMultiplier:outputMpFactor(rank,actor.skillProgression)},actor)).join(' / ')} · Tỷ lệ buff giữ nguyên.</p>}
   <div className="skill-rank-actions"><span><Icon name="coin"/> {fmt(quote.coinCost)} Coin</span><button type="button" disabled={!owned||busy} onClick={()=>setConfirmRank(quote.rank)} aria-label={'Xem nâng cấp '+skill.name}>Xem nâng cấp →</button></div>
   {!quote.ok&&<small className="muted">{quote.reason}</small>}
  </>:<span className="muted">Đã đạt Rank tối đa.</span>}
  {confirmRank!==null&&next&&<Modal title={'Nâng cấp · '+skill.name} onClose={()=>{if(!busy)setConfirmRank(null);}} className="skill-upgrade-modal" footer={<><button type="button" disabled={busy} onClick={()=>setConfirmRank(null)}>Hủy</button><button type="button" className="primary" disabled={busy||!modalQuote.ok||confirmRank!==quote.rank} onClick={commit}>Xác nhận · {fmt(quote.coinCost)} Coin</button></>}>
   <p className="muted">Nhân vật Lv{actor.level} · Yêu cầu Lv{quote.requiredLevel} · {fmt(campaign.coins)} Coin hiện có</p>
   <div className="skill-upgrade-comparison">{[{title:'Hiện tại',rank:quote.rank,ability:current},{title:'Sau nâng cấp',rank:quote.nextRank,ability:next}].map(item=><section key={item.title}><h3>{item.title} · Rank {item.rank}</h3><p className="skill-preview-cost">{skillCost(item.ability,actor)}</p><SkillBody skill={item.ability} actor={actor} content={content}/></section>)}</div>
   <p className="muted">Nâng đúng một Rank. Chỉ tiêu Coin khi xác nhận và lưu thành công.</p>
   {!modalQuote.ok&&<p className="warning" role="status">{modalQuote.reason}</p>}
  </Modal>}
 </div>;
}
