"use client";
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useGame} from '../runtime/game-context';
import {ALLOCATION_STATS,allocationLimit,allocationSpent,levelCap,levelRules,unspentPoints,xpRequired} from '../core/leveling.js';
import {resolveCharacter} from '../core/progression.js';
import {STAT_LABELS} from '../core/catalog.js';
import {CurrencyAmount,Modal,fmt} from './ui';
export function CharacterProgression({id}:{id:string}){
 const {content,campaign,busy,progressionLocked,updateAllocations,breakCharacterLimit}=useGame();
 const state=campaign.characters[id],owned=campaign.unlockedCharacterIds.includes(id),r=levelRules(content),cap=levelCap(state,content);
 const [draft,setDraft]=useState<Record<string,number>>({...state.allocations}),[confirm,setConfirm]=useState<'reset'|'break'|null>(null);
 useEffect(()=>setDraft({...state.allocations}),[id,state.level,JSON.stringify(state.allocations)]);
 const remaining=state.level-1-allocationSpent(content,draft),changed=JSON.stringify(Object.fromEntries(Object.entries(draft).filter(([,n])=>n)))!==JSON.stringify(Object.fromEntries(Object.entries(state.allocations).filter(([,n])=>n)));
 const preview=resolveCharacter(content,{...campaign,characters:{...campaign.characters,[id]:{...state,allocations:draft}}},id),current=resolveCharacter(content,campaign,id);
 const locked=busy||progressionLocked||!owned,need=xpRequired(content,state.level),cost=r.limitBreakCosts[state.limitBreakRank];
 const adjust=(key:string,count:number)=>{const old=draft[key]??0,max=Math.min(allocationLimit(content,state.level,key),old+Math.floor(remaining/r.allocations[key].cost));setDraft({...draft,[key]:Math.max(0,Math.min(max,Math.floor(count)||0))});};
 return <section className="panel character-progression" aria-label="Cấp độ và Đột Phá">
  <header className="level-heading"><div><span className="eyebrow">HÀNH TRÌNH TRƯỞNG THÀNH</span><h2>Level {state.level}<small> / {cap}</small></h2></div><div className="level-points"><strong>{remaining}</strong> điểm chưa dùng<small>Đột Phá {state.limitBreakRank}/3</small></div></header>
  <progress className="xp-progress" max={need||1} value={need?state.xp:1} aria-label="Kinh nghiệm nhân vật"/>
  <p className="level-xp">{need?`${fmt(state.xp)} / ${fmt(need)} XP${state.level===cap?' · Đã đạt giới hạn hiện tại — cần Đột Phá':''}`:'Đã đạt Level 50 · EXP nhận thêm không được tích trữ.'}</p>
  {progressionLocked&&<p className="warning">Kết thúc trận và nhận thưởng trước khi phân bổ hoặc Đột Phá.</p>}
  <p className="muted">Mỗi Level nhận 1 điểm. Điểm cộng vào chỉ số căn bản trước trang bị và các hiệu ứng %. Có thể đặt lại miễn phí ngoài trận.</p>
  <details className="allocation-disclosure" open={unspentPoints(content,state)>0||state.level===cap&&cap<50}><summary>Phân bổ chỉ số · {unspentPoints(content,state)} điểm khả dụng</summary>
  <div className="allocation-table" role="group" aria-label="Phân bổ điểm chỉ số"><div className="allocation-row allocation-labels"><span>Chỉ số</span><span>Số lần nâng</span><span>Kết quả</span></div>
   {ALLOCATION_STATS.map(key=>{const rule=r.allocations[key],count=draft[key]??0,limit=allocationLimit(content,state.level,key);return <div className="allocation-row" key={key} data-allocation={key}>
    <div><strong>{(STAT_LABELS as any)[key]}</strong><small>+{rule.gain} / {rule.cost} điểm · tối đa {limit} lần</small></div>
    <div className="allocation-stepper"><button disabled={locked||!count} aria-label={`Giảm ${(STAT_LABELS as any)[key]}`} onClick={()=>adjust(key,count-1)}>−</button><input aria-label={`Số lần nâng ${(STAT_LABELS as any)[key]}`} type="number" inputMode="numeric" min={0} max={limit} value={count} disabled={locked} onChange={e=>adjust(key,Number(e.target.value))}/><button disabled={locked||remaining<rule.cost||count>=limit} aria-label={`Tăng ${(STAT_LABELS as any)[key]}`} onClick={()=>adjust(key,count+1)}>+</button></div>
    <span className={preview.stats[key]!==current.stats[key]?'allocation-changed':''}>{fmt(current.stats[key])} → {fmt(preview.stats[key])}<small>Phân bổ: +{count*rule.gain}</small></span>
   </div>;})}
  </div>
  <div className="level-actions"><button className="gold" disabled={locked||!changed} onClick={()=>updateAllocations(id,draft)}>Áp dụng phân bổ</button><button disabled={locked||!allocationSpent(content,state.allocations)} onClick={()=>setConfirm('reset')}>Đặt lại điểm</button><button disabled={locked||state.level!==cap||cap===50||campaign.limitBreakStones<cost} onClick={()=>setConfirm('break')}>Đột Phá{cost?` · ${cost} Tinh Thạch`:''}</button><CurrencyAmount kind="breakthrough" amount={campaign.limitBreakStones}/></div>
  </details>
  {cap<50&&<p className="muted">Đột Phá ở Level {cap}: mở giới hạn {cap+10}. <Link href="/dungeon/breakthrough_trial">Tìm Tinh Thạch →</Link></p>}
  {confirm&&<Modal title={confirm==='reset'?'Đặt lại điểm phân bổ?':'Đột Phá giới hạn?'} onClose={()=>setConfirm(null)} footer={<><button onClick={()=>setConfirm(null)}>Hủy</button><button className="gold" disabled={locked} onClick={async()=>{const ok=confirm==='reset'?await updateAllocations(id,{}):await breakCharacterLimit(id);if(ok)setConfirm(null);}}>Xác nhận</button></>}>
   <p>{confirm==='reset'?`Hoàn lại ${allocationSpent(content,state.allocations)} điểm đã phân bổ. Miễn phí; giữ nguyên Level và EXP.`:`Tiêu ${cost} Tinh Thạch Phá Giới để mở Level tối đa ${cap+10}. EXP đã tích đủ sẽ được xử lý ngay.`}</p>
  </Modal>}
 </section>;
}
