"use client";
import {isAlive} from '../core/actor-life.js';
import {CombatPopover} from './combat-popover';
import {moonlightDefinition,moonlightSourceId} from '../core/moonlight-blessings.js';
import {ELEMENT_NAMES} from '../core/content.js';
export function MoonlightGlyph({kind='moon'}:{kind?:string}){
 return <svg viewBox="0 0 160 160" fill="none" aria-hidden="true">{kind==='storm'?<><path d="M30 72C10 48 40 26 57 40C66 10 113 16 117 43C150 35 159 74 131 83H30Z" fill="#a0b6ec" fillOpacity=".3" stroke="#cce7ff" strokeWidth="3"/><path d="m87 63-27 42h22l-10 37 40-53H88l15-26" fill="#f7f2c5"/><path d="m37 105-9 19m91-17-9 19" stroke="#91caff" strokeWidth="3"/></>:kind==='seed'?<><path d="M80 140V72m0 30C32 104 24 63 32 45c27 3 49 17 48 57Zm0-20c-1-36 22-50 49-52 5 30-7 55-49 52Z" fill="#adcda7" fillOpacity=".3" stroke="#e7eccb" strokeWidth="3"/><ellipse cx="80" cy="140" rx="36" ry="5" fill="#d7e9ff" fillOpacity=".3"/><path d="m80 12 6 12 13 2-10 10 2 13-11-6-12 6 3-13-10-10 13-2Z" fill="#d7e9ff"/></>:<><path d="M101 19C35 19 19 113 83 137c-50 0-77-41-61-83 13-35 47-45 79-35Z" fill="#dceaff"/><circle cx="84" cy="78" r="48" stroke="#dceaff" strokeWidth="2" opacity=".5"/><path d="m113 47 5 13 14 5-14 5-5 13-5-13-14-5 14-5Z" fill="#e8edff"/><path d="M43 143Q91 104 136 132" stroke="#bdd7fa" strokeWidth="2"/></>}</svg>;
}
export function MoonlightBoard({battle,team='party'}:{battle:any;team?:string}){
 const state=battle.moonlight?.[team];if(!state)return null;
 const d=moonlightDefinition(battle,team),active=state.active,amount=active?.statValue??null;
 const definitions=state.allowed.map((id:string)=>battle.content.moonlightBlessings[id]);
 const slots=d?.elements??(definitions.length===1?definitions[0].elements:[...state.slots,...Array(Math.max(0,2-state.slots.length)).fill(null)]);
 return <section className={'moonlight-board '+(active?'moonlight-active':'')} data-moonlight-board={team} data-blessing={active?.id??'waiting'} aria-label="Nguyệt Quang Chúc Phúc">
  <div className="moonlight-sky" aria-hidden="true"/>
  <div className="moonlight-emblem" data-moonlight-source data-actor-id={moonlightSourceId(team)} data-team={team}><MoonlightGlyph kind={d?.id==='thunder_wrath'?'storm':d?'seed':'moon'}/></div>
  <header><CombatPopover label="Cơ chế Nguyệt Quang Chúc Phúc" content={<><h3>Nguyệt Quang Chúc Phúc</h3>{definitions.map((item:any)=><p key={item.id}>{item.description}</p>)}<p>Đủ hai nguyên tố sẽ kích hoạt sau khi toàn bộ chuỗi hành động kết thúc. Tính cả vòng kích hoạt; khi hoạt động không tích nguyên tố hoặc gọi Chúc Phúc khác.</p></>}><button type="button" className="moonlight-help"><span>{team==='enemy'?'Đối thủ · ':''}Nguyệt Quang Chúc Phúc</span><span aria-hidden="true">ⓘ</span></button></CombatPopover>
   <h3>{d?.name??'Chờ ánh trăng thức giấc'}</h3>
   {d?<p className="moonlight-stat"><b>{d.stat==='attack'?'ATK':'MAG'} {Math.round(amount??0)}</b><span>Còn {Math.max(0,active.expiresAfterRound-battle.round+1)} vòng</span></p>:<div className="moonlight-slots" aria-label="Hai ô nguyên tố">{slots.map((element:string|null,i:number)=><span key={i} className={element&&state.slots.includes(element)?'charged':''} data-moonlight-slot={element??'empty'} data-charged={Boolean(element&&state.slots.includes(element))}><i aria-hidden="true">{element==='water'?'◈':element==='thunder'?'ϟ':element==='light'?'✧':element==='earth'?'◆':'◇'}</i><b>{element?(ELEMENT_NAMES as any)[element]:'Nguyên tố'}</b><small>{element&&state.slots.includes(element)?'Đã nhận':'Đang chờ'}</small></span>)}</div>}
  </header>
  {d&&<footer>{d.id==='thunder_wrath'?'Đầu & cuối vòng · Vật lí Lôi / Nguyệt':'Cuối vòng · Phép Thổ / Nguyệt'}</footer>}
 </section>;
}
export function MoonlightSeedMark({battle,actor}:{battle:any;actor:any}){
 const seeded=Object.values(battle.moonlight??{}).some((state:any)=>state.active?.id==='bountiful_seed'&&state.active.targets.includes(actor.id));
 return seeded&&isAlive(actor)?<span className="moonlight-seed-mark" title="Hạt Giống Bội Thu" aria-label="Hạt Giống Bội Thu"><MoonlightGlyph kind="seed"/></span>:null;
}
