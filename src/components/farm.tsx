"use client";
import {useState,type ReactNode} from 'react';
import {useRouter} from 'next/navigation';
import {useGame} from '../runtime/game-context';
import {MAX_FARM_RUNS} from '../core/farm-session.js';
import {dungeonDailyState} from '../core/dungeon-rules.js';
import {Modal,Icon,CurrencyAmount,fmt} from './ui';
const currency:Record<string,any>={coins:'coin',prisma:'prisma',recruitmentShards:'pure',originalPrisma:'original',prismaFragments:'fragments',blueprints:'blueprint',limitBreakStones:'breakthrough'};
export function FarmLaunch({target,disabled=false,label,children}:{target:any;disabled?:boolean;label:string;children?:ReactNode}){
 const {content,campaign,battle,busy,farm,startFarming}=useGame(),router=useRouter();
 const [open,setOpen]=useState(false),[count,setCount]=useState('10');const n=Number(count),valid=Number.isSafeInteger(n)&&n>=1&&n<=MAX_FARM_RUNS;
 const blocked=Boolean(battle&&(!battle.outcome||battle.outcome==='victory'&&!battle.rewardClaimed)||campaign.chronicles?.activeSession);
 const remaining=target.kind==='dungeon'?dungeonDailyState(campaign,content,target.id).remaining:null;
 return <><button className="farm-launch" disabled={disabled||busy||farm?.enabled} onClick={()=>setOpen(true)}><Icon name="sword"/>Farm lặp lại</button>{open&&<Modal title="Farm lặp lại" onClose={()=>setOpen(false)} className={children?'farm-config dungeon-scouting-modal':'farm-config'} footer={<><button onClick={()=>setOpen(false)}>Hủy</button><button className="gold" disabled={!valid||busy||blocked||remaining===0} onClick={()=>{if(startFarming(target,n)){setOpen(false);router.push('/battle');}}}>Bắt đầu farm · {valid?n:'—'} lượt</button></>}>
  <p className="farm-target-name">{label}</p><label htmlFor="farm-run-count">Số lượt muốn chơi</label><div className="farm-count-control"><button aria-label="Giảm số lượt" onClick={()=>setCount(String(Math.max(1,(valid?n:1)-1)))}>−</button><input id="farm-run-count" type="number" inputMode="numeric" min={1} max={MAX_FARM_RUNS} step={1} value={count} onChange={e=>setCount(e.target.value)} aria-describedby="farm-count-hint"/><button aria-label="Tăng số lượt" onClick={()=>setCount(String(Math.min(MAX_FARM_RUNS,(valid?n:0)+1)))}>+</button></div><p id="farm-count-hint" className={!valid?'warning':'muted'}>{valid?'Tối đa 999 lượt · Dùng đội hình và trang bị hiện tại.':'Nhập số nguyên từ 1 đến 999.'}</p><div className="farm-count-presets" role="group" aria-label="Chọn nhanh số lượt">{[1,10,100,999].map(v=><button key={v} aria-pressed={n===v} onClick={()=>setCount(String(v))}>{v} lượt</button>)}</div>
  {remaining!==null&&<p className="farm-quota">Còn {remaining} lượt hầm ngục hiện có. Phiên farm tự dừng khi hết lượt; không dùng Thẻ Quét.</p>}{blocked&&<p className="warning">Kết thúc trận hoặc chuyến đang dở và nhận thưởng trước khi farm.</p>}
  <p>AI chiến đấu trực tiếp. Mỗi trận thắng phải lưu thưởng thành công trước khi bắt đầu lượt tiếp theo.</p><p className="muted">Tự dừng khi thua, hòa, hết lượt hoặc lỗi lưu. Bạn có thể dừng tự động để tiếp quản trận.</p>{children}
 </Modal>}</>;
}
export function FarmPanel(){
 const {farm,battle,content,stopFarming}=useGame();if(!farm||farm.sessionId!==battle?.sessionId&&!farm.enabled)return null;
 const name=farm.target.kind==='quest'?content.encounters[farm.target.id]?.name:farm.target.kind==='dungeon'?content.dungeons[farm.target.id]?.name:'Trận hiện tại';
 return <section className={'farm-session panel '+(farm.enabled?'active':'stopped')} aria-label="Phiên farm" data-farm-active={farm.enabled}>
  <header><div><span className="eyebrow">{farm.target.kind==='battle'?'TỰ ĐỘNG CHIẾN ĐẤU':'FARM LẶP LẠI'}</span><h2>{name}</h2></div>{farm.enabled&&<button onClick={stopFarming}>Dừng farm</button>}</header>
  <div className="farm-progress-line"><strong>{farm.completed} / {farm.limit} lượt</strong><span>{farm.wins} thắng · {farm.losses} thua{farm.draws?' · '+farm.draws+' hòa':''}</span></div><progress max={farm.limit} value={farm.completed} aria-label="Tiến độ farm"/>
  <p role="status">{farm.reason}</p>{Object.keys(farm.totals).length>0&&<div className="farm-total-rewards" aria-label="Tổng phần thưởng đã lưu">{Object.entries(farm.totals).map(([key,n])=><CurrencyAmount key={key} kind={currency[key]} amount={n as number}/>)}</div>}
  {Object.keys(farm.xp).length>0&&<div className="farm-total-xp" aria-label="Tổng EXP đã lưu">{Object.entries(farm.xp).map(([id,n])=><span key={id}>{content.characters[id]?.name}: +{fmt(n as number)} XP</span>)}</div>}
  {farm.enabled&&<small>Dừng farm để điều khiển thủ công. Rời màn hình chiến đấu cũng dừng phiên farm.</small>}
 </section>;
}
