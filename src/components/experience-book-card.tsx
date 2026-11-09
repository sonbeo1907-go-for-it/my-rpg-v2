"use client";
import {useMemo,useRef,useState} from 'react';
import {useGame} from '../runtime/game-context';
import {previewExperienceBook,useExperienceBook} from '../core/progression-items.js';
import {characterCatalog} from '../core/catalog.js';
import {CurrencyAmount,ResourceIcon,Modal,fmt} from './ui';

export function ExperienceBookCard({item}:{item:any}){
 const {campaign,busy,progressionLocked}=useGame(),[open,setOpen]=useState(false);
 return <article className={'panel resource-card currency-'+item.kind} data-item={item.id}><ResourceIcon kind={item.kind}/><h2>{item.name}</h2><CurrencyAmount kind={item.kind} amount={campaign[item.field]??0}/><p>{fmt(item.xp)} EXP / quyển</p><button disabled={busy||progressionLocked||!(campaign[item.field]>0)} onClick={()=>setOpen(true)}>Dùng sách</button>{open&&<BookUseDialog item={item} onClose={()=>setOpen(false)}/>}</article>;
}
function BookUseDialog({item,onClose}:{item:any;onClose:()=>void}){
 const {campaign,content,transact,busy,progressionLocked}=useGame(),[id,setId]=useState(campaign.party.find(Boolean)??campaign.unlockedCharacterIds[0]),[quantity,setQuantity]=useState('1'),[query,setQuery]=useState(''),pending=useRef(false);
 const roster=useMemo(()=>characterCatalog(content,campaign,{q:query,ownership:'owned',sort:'name'}),[campaign,content,query]),n=Number(quantity);
 let report:any=null,error='';try{report=previewExperienceBook(campaign,content,item.id,id,n);}catch(e){error=(e as Error).message;}
 async function apply(){if(pending.current||!report)return;pending.current=true;try{if(await transact(current=>useExperienceBook(current,content,item.id,id,n,{battleActive:progressionLocked}),'Đã dùng Nhật kí hành trình và lưu EXP.'))onClose();}finally{pending.current=false;}}
 return <Modal title={'Dùng '+item.name} onClose={()=>!busy&&onClose()} footer={<><button disabled={busy} onClick={onClose}>Hủy</button><button className="gold" disabled={busy||progressionLocked||!report} onClick={apply}>Xác nhận dùng sách</button></>}>
  <p>Trong túi: {fmt(campaign[item.field]??0)} quyển · {fmt(item.xp)} EXP / quyển.</p><label>Số sách muốn dùng<input type="number" min="1" max={campaign[item.field]??0} step="1" inputMode="numeric" disabled={busy} value={quantity} onChange={e=>setQuantity(e.target.value)}/></label>
  <label>Tìm người nhận<input disabled={busy} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tên đồng đội…"/></label>
  <div className="book-recipient-grid" role="group" aria-label="Chọn người nhận EXP">{roster.map((actor:any)=><button key={actor.id} disabled={busy} aria-pressed={id===actor.id} className={id===actor.id?'selected':''} onClick={()=>setId(actor.id)}><strong>{actor.name}</strong><small>Level {actor.level}</small></button>)}</div>
  {report&&<section className="book-xp-preview" aria-label="Xem trước EXP"><h3>{content.characters[id].name}</h3><p>Level {report.fromLevel} → {report.toLevel}</p><strong>+{fmt(report.accepted)} EXP</strong>{report.points>0&&<p>+{report.points} điểm phân bổ.</p>}{report.lost>0&&<p className="warning">{fmt(report.lost)} EXP vượt giới hạn sẽ bị bỏ. Bạn có thể giảm số sách trước khi xác nhận.</p>}</section>}
  {error&&<p className="warning" role="status">{error}</p>}{progressionLocked&&<p className="warning">Kết thúc trận hoặc chuyến đang chơi trước khi dùng sách.</p>}
 </Modal>;
}
