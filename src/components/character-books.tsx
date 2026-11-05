"use client";
import {useRef,useState} from 'react';
import {useGame} from '../runtime/game-context';
import {previewBookBundle,useBookBundle} from '../core/book-bundle.js';
import {isExperienceBook} from '../core/progression-items.js';
import {xpRequired} from '../core/leveling.js';
import {Modal,ResourceIcon,fmt} from './ui';

export function CharacterBookDialog({id,onClose}:{id:string;onClose:()=>void}){
 const {campaign,content,transact,busy,progressionLocked}=useGame(),[quantities,setQuantities]=useState<Record<string,number>>({}),pending=useRef(false);
 const books:any[]=Object.values(content.items).filter(isExperienceBook),state=campaign.characters[id];
 let report:any=null,error='';try{report=previewBookBundle(campaign,content,id,quantities).report;}catch(e){error=(e as Error).message;}
 const level=report?.toLevel??state.level,need=xpRequired(content,level),xp=report?.toXp??state.xp;
 function adjust(item:any,value:number){if(!Number.isFinite(value))return;setQuantities(q=>({...q,[item.id]:Math.max(0,Math.min(campaign[item.field]??0,Math.floor(value)))}));}
 async function apply(){if(pending.current||!report)return;pending.current=true;try{if(await transact(current=>useBookBundle(current,content,id,quantities,{battleActive:progressionLocked}),'Đã dùng Nhật kí hành trình và lưu EXP.'))onClose();}finally{pending.current=false;}}
 return <Modal title={'Nhật kí hành trình · '+content.characters[id].name} onClose={()=>!busy&&onClose()} footer={<><button disabled={busy} onClick={onClose}>Hủy</button><button className="gold" disabled={busy||progressionLocked||!report} onClick={apply}>Xác nhận dùng sách</button></>}>
  <div className="character-book-list">{books.map(item=><div key={item.id} className={'character-book-row currency-'+item.kind}><ResourceIcon kind={item.kind}/><div><strong>{item.name}</strong><small>{fmt(item.xp)} EXP · Có {fmt(campaign[item.field]??0)} quyển</small></div><div className="allocation-stepper"><button disabled={busy||!(quantities[item.id]>0)} aria-label={'Bớt '+item.name} onClick={()=>adjust(item,(quantities[item.id]??0)-1)}>−</button><input aria-label={'Số lượng '+item.name} type="number" inputMode="numeric" min={0} max={campaign[item.field]??0} disabled={busy} value={quantities[item.id]??0} onChange={e=>adjust(item,Number(e.target.value))}/><button disabled={busy||(quantities[item.id]??0)>=(campaign[item.field]??0)} aria-label={'Thêm '+item.name} onClick={()=>adjust(item,(quantities[item.id]??0)+1)}>+</button></div></div>)}</div>
  <section className="book-level-preview" aria-label="Xem trước kinh nghiệm"><div><strong>Level {state.level} → {level}</strong><strong>+{fmt(report?.accepted??0)} EXP</strong></div><div className="book-preview-track" role="progressbar" aria-label="EXP sau khi dùng sách" aria-valuemin={0} aria-valuemax={need||1} aria-valuenow={need?xp:1}><span className="book-preview-before" style={{width:(level===state.level&&need?state.xp/need*100:0)+'%'}}/><span className="book-preview-gain" style={{width:(need?xp/need*100:100)+'%'}}/></div><p>{need?`${fmt(xp)} / ${fmt(need)} EXP`:'Đã đạt Level tối đa'}{report?.points>0?` · +${report.points} điểm phân bổ`:''}</p>{report?.lost>0&&<p className="warning">{fmt(report.lost)} EXP vượt giới hạn sẽ bị bỏ. Bạn có thể bớt sách trước khi xác nhận.</p>}</section>
  {!report&&<p role="status" className="muted">{error}</p>}{progressionLocked&&<p className="warning">Kết thúc trận hoặc chuyến đang chơi trước khi dùng sách.</p>}
 </Modal>;
}
