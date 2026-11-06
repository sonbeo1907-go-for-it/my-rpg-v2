"use client";
import {useState} from 'react';
import {useGame} from '../runtime/game-context';
import {characterCatalog} from '../core/catalog.js';
import {Modal,CharacterFilters,RoleIcon,ElementBadge} from './ui';

export function ArenaPreban({draft,pending,onBan,onLeave}:{draft:any;pending:any;onBan:(id:string)=>void;onLeave:()=>void}){
 const {content,campaign,busy}=useGame();
 const [expanded,setExpanded]=useState(false);
 const [filters,setFilters]=useState<any>({ownership:'all',sort:'name',direction:'asc'}),[selection,setSelection]=useState({cursor:-1,id:''});
 const all=characterCatalog(content,campaign,filters).filter((c:any)=>!c.developerOnly);
 const banned=[...draft.preBans.party,...draft.preBans.enemy],playerTurn=draft.preBanOrder[draft.preBanCursor]==='party';
 const selected=selection.cursor===draft.preBanCursor?selection.id:'';
 const heading=playerTurn?'Chọn nhân vật cấm chung':`${pending.opponentName} đang cấm…`;
 return <Modal title="Cấm trước khi chọn" className={"arena-preban-modal"+(expanded?" show-extended-filters":"")} initialFocus=".filter-bar input" onClose={onLeave} footer={<div className="arena-preban-footer"><span role="status">{heading}</span><button className="danger arena-preban-confirm" disabled={busy||!playerTurn||!selected||banned.includes(selected)} onClick={()=>onBan(selected)}>Xác nhận cấm</button></div>}>
   <div className="arena-preban-heading"><p role="status">{heading}</p><strong>Lượt cấm {draft.preBanCursor+1}/{draft.preBanOrder.length}</strong></div>
   <p>Mọi nhân vật bị cấm ở bước này đều không thể được chọn bởi cả hai bên.</p>
   <div className="arena-preban-records">{(['party','enemy'] as const).map(team=><section key={team}><strong>{team==='party'?pending.playerName:pending.opponentName}</strong><div>{draft.preBans[team].length?draft.preBans[team].map((id:string)=><span key={id}>{content.characters[id].name}</span>):<small>Chưa cấm nhân vật nào</small>}</div></section>)}</div>
   <button className="preban-filter-toggle" aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}>{expanded?"Thu gọn bộ lọc":"Thêm bộ lọc"}</button><CharacterFilters filters={filters} onChange={setFilters}/>
   <p className="muted">{all.length} nhân vật · Bao gồm nhân vật chưa sở hữu · Astoria chưa tham gia Đấu Hạng</p>
   <div className="arena-preban-grid" aria-label="Toàn bộ nhân vật chính thức">{all.map((c:any)=>{const disabled=banned.includes(c.id);return <button key={c.id} className={(selected===c.id?'selected ':'')+(disabled?'prebanned':'')} aria-pressed={selected===c.id} disabled={disabled||!playerTurn||busy} onClick={()=>setSelection({cursor:draft.preBanCursor,id:c.id})}><RoleIcon roleGroup={c.roleGroup}/><strong>{c.name}</strong><ElementBadge element={c.element}/><small>{disabled?'Đã cấm':campaign.unlockedCharacterIds.includes(c.id)?`Đã sở hữu · Lv. ${c.level}`:'Chưa sở hữu'}</small></button>;})}</div>
   {!all.length&&<p>Không có nhân vật phù hợp với bộ lọc.</p>}
 </Modal>;
}
