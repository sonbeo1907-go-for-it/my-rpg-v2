"use client";
import {teamResourceState} from '../core/team-resources.js';
import {CombatPopover} from './combat-popover';
export function SoulFlame(){return <svg viewBox="0 0 36 48" fill="none" aria-hidden="true"><path d="M18 2c5 12-6 12-1 23 1-7 7-8 9-14 2 11 10 15 5 26-5 12-23 12-27 0C0 26 11 22 18 2Z" fill="currentColor" fillOpacity=".7"/><path d="M17 23c0 8-6 9-5 15 1 7 11 7 13 0 1-5-3-8-4-11 0 4-1 6-3 7 1-5-1-8-1-11Z" fill="#e0f8ff"/></svg>}
export function SwordSoulBoard({battle,team='party'}:{battle:any;team?:string}){
 const state=teamResourceState(battle,team,'sword_soul');if(!state)return null;
 const bloom=state.value>=4,rounds=state.growthRounds??{},title=battle.actors.some((a:any)=>a.team===team&&a.passive?.type==='blessed_team_resource'&&a.passive.resource==='sword_soul')?'Hồn Kiếm Chúc Phúc':'Hồn Kiếm';
 return <section className="evidence-board sword-soul-board" data-sword-soul-board={team} data-soul-state={bloom?'blossom':'lake'} aria-label={title}>
  <div className="soul-landscape" aria-hidden="true"><img src="/art/sword-soul-torii.svg" alt=""/><div className="soul-sakura"><img src="/art/sword-soul-sakura.svg" alt=""/>{[0,1,2,3,4].map(i=><i key={i} style={{left:(46+i*10)+'%',animationDelay:(-i*1.3)+'s'}}/>)}</div></div>
  <header><CombatPopover label="Cơ chế Hồn Kiếm" content={<><h3>{title} · Đền Keijo</h3><p>Tài nguyên chung tối đa {state.max}. Mỗi vòng có hai cơ hội tăng tự nhiên: kỹ năng đầu tiên của thành viên Hồn Kiếm và của một thành viên khác, mỗi nhóm tạo 1.</p><p>Không tính đánh thường, Phòng thủ, Liên kích hoặc bỏ lượt. Vòng Chính và Vòng Phụ dùng chung hạn mức. Kỹ năng tạo thêm không dùng hạn mức này.</p><p>Kaguya nâng trần của riêng đội mình lên 10; hai bên Đấu Trường có tài nguyên riêng.</p><p>Tạo khi đầy vẫn được ghi nhận. Hồn Kiếm cũng là một nguyên tố riêng; đòn mang Hỏa và Hồn Kiếm vẫn chỉ là một hit, điểm yếu chỉ áp dụng một lần.</p></>}><button type="button" className="evidence-help"><SoulFlame/><span>{team==='enemy'?'Đối thủ · ':''}{title}</span><span aria-hidden="true">ⓘ</span></button></CombatPopover><strong className="evidence-total" aria-live="polite">{state.value} / {state.max}</strong></header>
  <div className="evidence-masks soul-flames" data-soul-cap={state.max} role="img" aria-label={state.value+' trên '+state.max+' Hồn Kiếm'}>{Array.from({length:state.max},(_,i)=><span key={i} className={i<state.value?'filled':''} data-soul-filled={i<state.value}><SoulFlame/></span>)}</div>
  <footer><span>Kiếm hồn: <b>{rounds.member===battle.round?'Đã tạo':'Sẵn sàng'}</b></span><span>Đồng đội khác: <b>{rounds.other===battle.round?'Đã tạo':'Sẵn sàng'}</b></span></footer>
 </section>;
}
