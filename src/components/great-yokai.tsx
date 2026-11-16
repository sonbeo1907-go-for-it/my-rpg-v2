"use client";
import {bossRitualNotices} from '../core/encounter-rituals.js';
import {Icon} from './ui';

export function GreatYokaiNotices({battle}:{battle:any}){
  const notices=bossRitualNotices(battle);
  if(!notices.length)return null;
  return <section className="yokai-notices" aria-label="Cơ chế Đại Yêu Ma" aria-live="polite">
    {notices.map((notice:any)=><article key={notice.id} className={`yokai-notice ${notice.cancelled?'interrupted':''}`} data-ritual-kind={notice.kind} data-ritual-owner={notice.actorId}>
      <Icon name={notice.cancelled?'shield':notice.kind==='exposed'?'sword':'hourglass'}/>
      <div className="yokai-notice-body">
        <small>{notice.name}</small>
        <strong>{notice.ability??(notice.kind==='exposed'?'Vỡ Thế':'Độc Giữ Thiên Môn')}{notice.ability&&` · ${notice.cancelled?'Đã ngắt':'Vòng '+notice.readyRound}`}</strong>
        {notice.targets?<><p>Giải hiệu ứng bất lợi do Cửu Vĩ gây ra để giảm sát thương nghi thức.</p><ul className="yokai-curse-targets">{notice.targets.map((target:any)=><li key={target.id}><span>{target.name}</span><b>+{Math.round(target.bonus*100)}%</b></li>)}</ul></>:<p>{notice.cancelled?'Nghi thức bị hủy; đòn lớn được thay bằng đòn đơn mục tiêu.':notice.maxMarks>0&&battle.round<notice.warningRound?'Đang lấy đà · Cửa sổ phá dấu mở từ đầu vòng '+notice.warningRound+'.':notice.advice}</p>}
        {notice.maxMarks>0&&<div className="yokai-ritual-marks" aria-label={`Đã phá ${notice.marks} trên ${notice.maxMarks} dấu`}>
          {Array.from({length:notice.maxMarks},(_,i)=><span key={i} className={i<notice.marks?'broken':''} aria-hidden="true">{i<notice.marks?'×':'◆'}</span>)}
          <span>{notice.kind==='stance'?'Sơn Thế':'Liên Kết'} · đã phá {notice.marks}/{notice.maxMarks}</span>
        </div>}
      </div>
    </article>)}
  </section>;
}
