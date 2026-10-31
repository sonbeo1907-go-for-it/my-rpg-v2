"use client";
import Link from 'next/link';
import {useState} from 'react';
import {useGame} from '../runtime/game-context';
import {dailyCommissionView} from '../core/daily-commissions.js';
import {CurrencyAmount,Icon,Modal} from './ui';
const kinds:any={coins:'coin',prisma:'prisma',recruitmentShards:'pure',originalPrisma:'original'};
function Reward({reward}:{reward:any}){return <span className="daily-reward">{Object.entries(reward).map(([key,value])=><CurrencyAmount key={key} kind={kinds[key]} amount={value as number}/>)}</span>;}
export function DailyCommissions(){
 const {campaign,busy,dailyNow,claimCommissions,refreshCommissions}=useGame();
 const [open,setOpen]=useState(false),view=dailyCommissionView(campaign,new Date(dailyNow));
 const claim=(key?:string)=>claimCommissions(key?[key]:undefined);
 return <><button className="home-export daily-launcher" aria-label={`Ủy Thác Hằng Ngày${view.available.length?' · Có thưởng để nhận':''}`} title="Ủy Thác Hằng Ngày" onClick={()=>{setOpen(true);void refreshCommissions();}}><Icon name="scroll"/><span>Ủy Thác Hằng Ngày</span>{view.available.length>0&&<span className="daily-alert" aria-label="Có phần thưởng nhận được">!</span>}</button>
 {open&&<Modal title="Ủy Thác Hằng Ngày" className="daily-commissions-modal" onClose={()=>setOpen(false)} footer={<><button onClick={()=>setOpen(false)}>Đóng</button><button className="gold" disabled={busy||!view.available.length} onClick={()=>claim()}>Nhận tất cả{view.available.length?` (${view.available.length})`:''}</button></>}>
  <div className="daily-heading"><div><span className="eyebrow">SỔ ỦY THÁC CỦA LỮ KHÁCH</span><p>Ngày {view.day.split('-').reverse().join('/')} · Đặt lại lúc 00:00 giờ Việt Nam</p></div><strong>{view.count}/5 hoàn thành</strong></div>
  <p className="muted daily-rules">Quest Thảo phạt thường hoặc boss đều được tính, kể cả đánh lại và dù nhận Coin hay Vụn Prisma. Hầm ngục chỉ tính khi hoàn thành toàn bộ lượt Mỏ Vàng hoặc Hiểm Trở.</p>
  {!view.loggedIn&&<button disabled={busy} onClick={()=>refreshCommissions()}>Ghi nhận đăng nhập</button>}
  <section className="daily-task-list" aria-label="Nhiệm vụ hôm nay">{view.tasks.map((task:any)=><article className={`daily-task ${task.complete?'complete':''}`} key={task.id} data-daily-task={task.id}>
   <div><h3>{task.name}</h3><span className="daily-progress">{task.progress}/{task.target}</span><Reward reward={task.reward}/></div>
   <div className="daily-task-actions">{!task.complete&&task.id!=='login'&&<Link href={task.id==='dungeon'?'/dungeon':'/quests'} onClick={()=>setOpen(false)}>Đi đến →</Link>}<button disabled={busy||!task.complete||task.claimed} className={task.complete&&!task.claimed?'gold':''} onClick={()=>claim(task.key)}>{task.claimed?'✓ Đã nhận':task.complete?'Nhận thưởng':'Chưa hoàn thành'}</button></div>
  </article>)}</section>
  <section className="daily-milestone-section" aria-label="Mốc hoàn thành"><h3>Thưởng mốc hoàn thành</h3><p className="muted">Tính theo số nhiệm vụ đã hoàn thành, không cần nhận thưởng nhiệm vụ trước.</p><progress max={5} value={view.count} aria-label="Tiến độ mốc ngày"/><div className="daily-milestones">{view.milestones.map((m:any)=><article data-daily-milestone={m.id} className={m.complete?'complete':''} key={m.id}><strong>{m.target} nhiệm vụ</strong><Reward reward={m.reward}/><button disabled={busy||!m.complete||m.claimed} className={m.complete&&!m.claimed?'gold':''} onClick={()=>claim(m.key)}>{m.claimed?'✓ Đã nhận':m.complete?'Nhận thưởng':'Chưa đạt'}</button></article>)}</div></section>
 </Modal>}</>;
}
