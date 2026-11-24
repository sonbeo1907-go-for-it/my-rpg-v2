"use client";
import {EclipseGlyph} from './eclipse-glyph';
import {moonlightCyclePhase} from '../core/moonlight-cycle.js';
import {isAlive} from '../core/actor-life.js';
import {CombatPopover} from './combat-popover';
import {moonlightDefinition,moonlightSourceId} from '../core/moonlight-blessings.js';
import {ELEMENT_NAMES} from '../core/content.js';
export function MoonlightGlyph({kind='moon'}:{kind?:string}){
 if(kind==='eclipse_strike')return <EclipseGlyph strike/>;
 return <svg viewBox="0 0 160 160" fill="none" aria-hidden="true">{kind==='storm'?<><path d="M30 72C10 48 40 26 57 40C66 10 113 16 117 43C150 35 159 74 131 83H30Z" fill="#a0b6ec" fillOpacity=".3" stroke="#cce7ff" strokeWidth="3"/><path d="m87 63-27 42h22l-10 37 40-53H88l15-26" fill="#f7f2c5"/><path d="m37 105-9 19m91-17-9 19" stroke="#91caff" strokeWidth="3"/></>:kind==='song'?<><path d="M105 23C50 22 25 101 83 136c-48-2-68-43-49-78 15-28 45-36 71-35Z" fill="#d8d2f5"/><path d="M56 70h87M51 85h92M54 100h89" stroke="#becbea" strokeWidth="2" opacity=".55"/><path d="M98 45v61m0-56 30-8v55" stroke="#e8e4ff" strokeWidth="5"/><ellipse cx="87" cy="108" rx="12" ry="8" fill="#d7d8ff"/><ellipse cx="117" cy="99" rx="12" ry="8" fill="#d7d8ff"/></>:kind==='seed'?<><path d="M80 140V72m0 30C32 104 24 63 32 45c27 3 49 17 48 57Zm0-20c-1-36 22-50 49-52 5 30-7 55-49 52Z" fill="#adcda7" fillOpacity=".3" stroke="#e7eccb" strokeWidth="3"/><ellipse cx="80" cy="140" rx="36" ry="5" fill="#d7e9ff" fillOpacity=".3"/><path d="m80 12 6 12 13 2-10 10 2 13-11-6-12 6 3-13-10-10 13-2Z" fill="#d7e9ff"/></>:<><path d="M101 19C35 19 19 113 83 137c-50 0-77-41-61-83 13-35 47-45 79-35Z" fill="#dceaff"/><circle cx="84" cy="78" r="48" stroke="#dceaff" strokeWidth="2" opacity=".5"/><path d="m113 47 5 13 14 5-14 5-5 13-5-13-14-5 14-5Z" fill="#e8edff"/><path d="M43 143Q91 104 136 132" stroke="#bdd7fa" strokeWidth="2"/></>}</svg>;
}
export function MoonlightBoard({battle,team='party'}:{battle:any;team?:string}){
 const state=battle.moonlight?.[team];if(!state)return null;
 const d=moonlightDefinition(battle,team),active=state.active,amount=active?.statValue??null;
 const cycle=moonlightCyclePhase(battle,team);
 const definitions=state.allowed.map((id:string)=>battle.content.moonlightBlessings[id]);
 const slots=d?.elements??(definitions.length===1?definitions[0].elements:[...state.slots,...Array(Math.max(0,2-state.slots.length)).fill(null)]);
 return <section className={'moonlight-board '+(active?'moonlight-active':'')} data-moonlight-board={team} data-blessing={active?.id??'waiting'} data-moonlight-phase={cycle?.id} aria-label="Nguyệt Quang Chúc Phúc">
  <div className="moonlight-sky" aria-hidden="true"/>
  <div className="moonlight-emblem" data-moonlight-source data-actor-id={moonlightSourceId(team)} data-team={team}>{d?.id==='chaotic_eclipse'?<EclipseGlyph phase={cycle?.id}/>:<MoonlightGlyph kind={d?.id==='thunder_wrath'?'storm':d?.id==='nameless_song'?'song':d?'seed':'moon'}/>}</div>
  <header><CombatPopover label="Cơ chế Nguyệt Quang Chúc Phúc" content={<><h3>Nguyệt Quang Chúc Phúc</h3>{definitions.map((item:any)=><p key={item.id}>{item.description}</p>)}<p>Đủ hai nguyên tố sẽ kích hoạt sau khi toàn bộ chuỗi hành động kết thúc. Tính cả vòng kích hoạt; khi hoạt động không tích nguyên tố hoặc gọi Chúc Phúc khác.</p></>}><button type="button" className="moonlight-help"><span>{team==='enemy'?'Đối thủ · ':''}Nguyệt Quang Chúc Phúc</span><span aria-hidden="true">ⓘ</span></button></CombatPopover>
   <h3>{d?.name??'Chờ ánh trăng thức giấc'}</h3>
   {d?<p className="moonlight-stat"><b>{d.stat==='attack'?'ATK':'MAG'} {Math.round(amount??0)}</b><span>Còn {Math.max(0,active.expiresAfterRound-battle.round+1)} vòng</span></p>:<div className="moonlight-slots" aria-label="Hai ô nguyên tố">{slots.map((element:string|null,i:number)=><span key={i} className={element&&state.slots.includes(element)?'charged':''} data-moonlight-slot={element??'empty'} data-charged={Boolean(element&&state.slots.includes(element))}><i aria-hidden="true">{element==='water'?'◈':element==='thunder'?'ϟ':element==='fire'?'♨':element==='light'?'✧':element==='earth'?'◆':'◇'}</i><b>{element?(ELEMENT_NAMES as any)[element]:'Nguyên tố'}</b><small>{element&&state.slots.includes(element)?'Đã nhận':'Đang chờ'}</small></span>)}</div>}
   {cycle&&<>
    <p className="eclipse-amplification">Khuếch đại phép Hỏa <strong>+{Math.round(cycle.damageAmp*100)}%</strong></p>
    <ol className="eclipse-cycle" aria-label="Chu kỳ Nguyệt Nhật Hỗn Mang">{d.cycle.map((p:any,index:number)=><li key={p.id} aria-current={index===cycle.index?'step':undefined} data-cycle-state={index<cycle.index?'past':index===cycle.index?'current':'next'}><span>{p.name}</span><b>{Math.round(p.damageAmp*100)}%</b><small>{index===cycle.index?'Còn '+cycle.remainingRounds:p.durationRounds} vòng</small></li>)}</ol>
   </>}
  </header>
  {d&&<footer>{d.id==='chaotic_eclipse'?'Chỉ đánh theo hiệu lệnh · Một mục tiêu · Phép Hỏa / Nguyệt':d.id==='thunder_wrath'?'Đầu & cuối vòng · Vật lí Lôi / Nguyệt':d.id==='nameless_song'?'Cuối vòng · Vật lí Ám / Nguyệt · tối đa 3 đòn/địch':'Cuối vòng · Phép Thổ / Nguyệt'}</footer>}
 </section>;
}
export function MoonlightSeedMark({battle,actor}:{battle:any;actor:any}){
 const seeded=Object.values(battle.moonlight??{}).some((state:any)=>state.active?.id==='bountiful_seed'&&state.active.targets.includes(actor.id));
 return seeded&&isAlive(actor)?<span className="moonlight-seed-mark" title="Hạt Giống Bội Thu" aria-label="Hạt Giống Bội Thu"><MoonlightGlyph kind="seed"/></span>:null;
}
