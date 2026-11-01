"use client";
import {useGame} from '../runtime/game-context';
import {resolveCharacter} from '../core/progression.js';
import {ElementBadge,Modal,RoleIcon,PageHeader} from './ui';

export function FortressPartyStatus(){
 const {campaign,content}=useGame(),session=campaign.chronicles.activeSession;
 if(!session)return null;
 return <><p className="fortress-party-lock">Đội hình, kỹ năng và trang bị đã khóa trong phiên này. Rời pháo đài qua cổng để thay đổi.</p><div className="fortress-party-grid">{session.partyIds.filter(Boolean).map((id:string)=>{
  const character=resolveCharacter(content,campaign,id),v=session.partyVitals[id];
  return <article key={id} tabIndex={0} className="fortress-party-member" data-fortress-member={id} aria-label={'Trạng thái '+character.name}>
   <header><RoleIcon roleGroup={character.roleGroup}/><div><h3>{character.name}</h3><small>Cấp {character.level} · {character.role}</small></div><ElementBadge element={character.element}/></header>
   <label>HP {v.hp} / {v.maxHp}<progress className="hp-bar" max={v.maxHp} value={v.hp}/></label>
   <label>MP {v.mp} / {v.maxMp}<progress className="mp-bar" max={Math.max(1,v.maxMp)} value={v.mp}/></label>
   <dl>{[['attack','ATK'],['magic','MAG'],['defense','DEF'],['resistance','RES'],['speed','SPD']].map(([key,label])=><div key={key}><dt>{label}</dt><dd>{character.stats[key]}</dd></div>)}</dl>
  </article>;
 })}</div></>;
}
export function FortressPartyModal({onClose}:{onClose:()=>void}){return <Modal title="Đội hình trong phiên" className="fortress-party-modal" onClose={onClose} footer={<button onClick={onClose}>Đóng</button>}><FortressPartyStatus/></Modal>;}
export function FortressPartyPage(){return <main className="page"><PageHeader title="Đội hình trong phiên" subtitle="Chỉ xem trạng thái · Đội hình và trang bị đã khóa" back="/chronicles/book2"/><FortressPartyStatus/></main>;}
