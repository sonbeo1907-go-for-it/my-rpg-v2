"use client";
import type {CSSProperties} from 'react';
import {useGame} from '../runtime/game-context';
import {teamResourceState,teamResourceSpent} from '../core/team-resources.js';
import {CombatPopover} from './combat-popover';

export function MasqueradeMask({className=''}:{className?:string}){
 return <svg className={className} viewBox="0 0 64 44" fill="none" aria-hidden="true"><path d="M3 9C15 16 20 4 32 14 44 4 49 16 61 9L55 31C47 41 38 37 32 27 26 37 17 41 9 31Z" fill="currentColor" fillOpacity=".15" stroke="currentColor" strokeWidth="2"/><path d="M11 21Q20 13 27 23 17 30 11 21ZM37 23Q44 13 53 21 47 30 37 23Z" fill="currentColor"/><path d="M32 15V25M7 10L2 2M57 10L62 2M18 9L16 2M46 9L48 2" stroke="currentColor" strokeWidth="1.5"/></svg>;
}
export function EvidenceBoard({battle}:{battle:any}){
 const state=teamResourceState(battle,'party','evidence');if(!state)return null;
 const spent=teamResourceSpent(battle,'party','evidence');
 return <section className="evidence-board" data-evidence-board="party" aria-label="Bằng Chứng Đanh Thép">
  <span key={state.revision} className="evidence-flash" aria-hidden="true"/>
  <header><CombatPopover label="Cơ chế Bằng Chứng Đanh Thép" content={<><h3>Bằng Chứng Đanh Thép</h3><p>Tài nguyên chung của toàn đội khi có thành viên Vertosse. Mỗi mặt nạ là một Bằng Chứng, tối đa 6.</p><p>Tạo khi đã đầy vẫn ghi nhận sự kiện tạo, nhưng không tích quá 6. Bằng Chứng không phải buff có thể bị xóa.</p><p>Liên kích Simon tính một lần mỗi kỹ năng đồng đội khác tiêu Bằng Chứng. Genevieve tính tổng lượng thực tiêu trong cả Vòng Chính và Vòng Phụ.</p><p>Giữ qua đợt quái và giai đoạn trong cùng trận/chuyến; trận độc lập bắt đầu từ 0.</p></>}><button type="button" className="evidence-help"><MasqueradeMask/><span>Bằng Chứng Đanh Thép <small>Tài nguyên chung · Vertosse</small></span><span aria-hidden="true">ⓘ</span></button></CombatPopover><strong className="evidence-total" aria-live="polite">{state.value} / {state.max}</strong></header>
  <div className="evidence-masks" role="img" aria-label={`${state.value} trên ${state.max} Bằng Chứng`}>{Array.from({length:state.max},(_,i)=><span key={i} className={i<state.value?'filled':''} data-evidence-filled={i<state.value}><MasqueradeMask/></span>)}</div>
  <footer><span>Đã tiêu trong vòng: <b>{spent}</b></span>{battle.actors.some((a:any)=>a.team==='party'&&a.hp>0&&a.passive?.type==='spent_resource_team_mp')&&<span>Cuối vòng: <b>{Math.min(12,spent*4)}% MP</b></span>}</footer>
 </section>;
}
export function LocalCombatMode({actor}:{actor:any}){
 const {events}=useGame(),mode=actor.combatModes?.[actor.activeMode],last=events.filter((e:any)=>e.sourceId===actor.id&&e.mode&&actor.combatModes?.[e.mode]?.presentationScope==='actor'&&['mode_enter','mode_exit'].includes(e.type)).at(-1);
 if(mode?.presentationScope==='none')return <span className="local-mode-label">{mode.name} · {mode.summary}</span>;
 if(mode?.presentationScope!=='actor'&&!last)return null;
 return <><div className="local-mode-veil" data-local-mode={mode?.presentationScope==='actor'?actor.activeMode:undefined} aria-hidden="true">{mode?.presentationScope==='actor'&&<><MasqueradeMask/><i/><i/></>}</div>{mode?.presentationScope==='actor'&&<span className="local-mode-label">{mode.name} · {Object.entries(mode.baseStatBonuses??{}).map(([key,n])=>'+'+n+' '+({attack:'ATK',magic:'MAG',defense:'DEF',resistance:'RES',speed:'SPD'} as any)[key]+' căn bản').join(' · ')}</span>}{last&&<div className={'local-mode-burst '+(last.type==='mode_exit'?'leaving':'')} data-local-mode-fx={last.type} key={last.key} aria-hidden="true" style={{'--mode-fx-duration':'700ms'} as CSSProperties}><MasqueradeMask/><span/></div>}</>;
}
