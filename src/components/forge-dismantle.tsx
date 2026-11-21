"use client";
import {useEffect,useRef,useState} from 'react';
import {useGame} from '../runtime/game-context';
import {gearCatalog,GEAR_NAMES,STAT_LABELS} from '../core/catalog.js';
import {blacksmithRules} from '../core/blacksmith-rules.js';
import {dismantleGear,dismantleQuote} from '../core/blacksmith.js';
import {gearDismantleYield} from '../core/gear-rules.js';
import {CurrencyAmount,EmptyState,GearCard,GearFilters,Modal,fmt} from './ui';
import {GearPagination,useGearPagination} from './gear-pagination';

export function DismantlePanel({filters,onChange}:{filters:any;onChange:(filters:any)=>void}){
 const {content,campaign,busy,transact}=useGame(),lock=useRef(false);
 const [selected,setSelected]=useState<string[]>([]),[confirm,setConfirm]=useState<string[]|null>(null),[amount,setAmount]=useState(999),[result,setResult]=useState<any>(null),[showFilters,setShowFilters]=useState(false);
 const gear=gearCatalog(content,campaign,{...filters,status:'free'}).filter((g:any)=>g.id!==campaign.pendingGearReforge?.gearId),rules=blacksmithRules(content),pager=useGearPagination(gear,filters,onChange);
 const byId=new Map<string,any>(campaign.gear.map((g:any)=>[g.id,g]));
 useEffect(()=>{const q=window.matchMedia('(min-width:701px)'),update=()=>setShowFilters(q.matches);update();q.addEventListener('change',update);return()=>q.removeEventListener('change',update);},[]);
 useEffect(()=>setSelected([]),[filters.tier,filters.stat]);
 useEffect(()=>{const equipped=new Set(Object.values(campaign.equipment).flat());setSelected(old=>old.filter(id=>byId.has(id)&&!equipped.has(id)&&id!==campaign.pendingGearReforge?.gearId));},[campaign]);
 let quote:any=null,error='';try{if(confirm?.length)quote=dismantleQuote(campaign,content,confirm);}catch(e){error=(e as Error).message;}
 const fragments=selected.reduce((n,id)=>n+gearDismantleYield(content,byId.get(id)),0),low=gear.filter((g:any)=>['t1','t2'].includes(g.typeId));
 const hidden=selected.filter(id=>!pager.items.some((g:any)=>g.id===id)).length;
 function choose(list:any[]){setSelected(list.slice(0,Math.min(amount,rules.maxDismantle)).map(g=>g.id));setResult(null);}
 async function dismantle(){if(lock.current||!confirm||!quote)return;lock.current=true;const receipt={count:quote.count,fragments:quote.fragments};try{if(await transact((s:any)=>dismantleGear(s,content,confirm),'Đã phân rã '+receipt.count+' trang bị và nhận '+fmt(receipt.fragments)+' Vụn Prisma.')){setConfirm(null);setSelected([]);setResult(receipt);}}finally{lock.current=false;}}
 return <>
  <div className="forge-list-heading"><h2>Phân rã hàng loạt</h2><span>{fmt(gear.length)} món phù hợp · Tối đa {rules.maxDismantle}/lần</span></div>
  <details className="forge-filter-disclosure" open={showFilters} onToggle={e=>setShowFilters(e.currentTarget.open)}><summary>Lọc trang bị</summary><GearFilters filters={filters} onChange={f=>onChange({...f,page:'1'})} hideStatus/></details>
  <section className="forge-bulk-controls panel"><div className="forge-quick-pick"><label>Số món chọn nhanh<input type="number" min={1} max={rules.maxDismantle} value={amount} onChange={e=>setAmount(Math.max(1,Math.min(rules.maxDismantle,Math.trunc(Number(e.target.value)||1))))}/></label><button disabled={busy||!gear.length} onClick={()=>choose(gear)}>Chọn theo bộ lọc ({Math.min(amount,gear.length)})</button><button disabled={busy||!low.length} onClick={()=>choose(low)}>Chọn cấp thấp & trung ({Math.min(amount,low.length)})</button></div><p className="forge-note">Áp dụng trên toàn bộ kết quả lọc, kể cả các trang khác. Trang bị đang dùng và món đang tái rèn được giữ lại.</p></section>
  <div className="forge-selection panel"><div><strong>Đã chọn {selected.length}/{rules.maxDismantle}</strong><span>Nhận được <CurrencyAmount kind="fragments" amount={fragments}/></span></div><div className="forge-actions"><button disabled={busy||!pager.items.length} onClick={()=>setSelected(old=>[...new Set([...old,...pager.items.map((g:any)=>g.id)])].slice(0,rules.maxDismantle))}>Chọn trang này</button><button disabled={busy||!selected.length} onClick={()=>setSelected([])}>Bỏ chọn</button><button className="gold" disabled={busy||!selected.length} onClick={()=>setConfirm([...selected])}>Phân rã ({selected.length})</button></div>{hidden>0&&<p className="forge-note">{hidden} món đã chọn ở trang khác. Đổi trang hoặc sắp xếp vẫn giữ lựa chọn.</p>}</div>
  {result&&<p className="forge-inline-result" role="status">Đã phân rã {result.count} món · Nhận <CurrencyAmount kind="fragments" amount={result.fragments}/></p>}
  <GearPagination pager={pager}/><div className="gear-grid forge-gear-grid">{pager.items.map((g:any)=><GearCard key={g.id} gear={g} selected={selected.includes(g.id)} disabled={busy||(!selected.includes(g.id)&&selected.length>=rules.maxDismantle)} onClick={()=>setSelected(old=>old.includes(g.id)?old.filter(id=>id!==g.id):[...old,g.id])}><small className="forge-yield"><CurrencyAmount kind="fragments" amount={gearDismantleYield(content,g)}/></small></GearCard>)}</div>
  {!gear.length&&<EmptyState>Không có trang bị chưa sử dụng phù hợp để phân rã.</EmptyState>}
  {confirm&&<Modal title="Xác nhận phân rã trang bị" className="dismantle-confirm" onClose={()=>!busy&&setConfirm(null)} footer={<><button disabled={busy} onClick={()=>setConfirm(null)}>Hủy</button><button className="danger" disabled={busy||!quote} onClick={dismantle}>{busy?'Đang xử lý…':'Xác nhận phân rã'}</button></>}>
   <p>Bạn sắp phân rã <strong>{confirm.length} trang bị</strong>, bao gồm các món đã chọn ở trang khác. Không thể hoàn tác.</p>
   {quote?<><dl className="forge-batch-breakdown">{Object.entries(quote.groups).filter(([,n])=>Number(n)>0).map(([id,n])=><div key={id}><dt>{(GEAR_NAMES as any)[id]}</dt><dd>{String(n)} món</dd></div>)}</dl><p>Nhận được: <CurrencyAmount kind="fragments" amount={quote.fragments}/></p><p>Vụn Prisma: {fmt(campaign.prismaFragments)} → <strong>{fmt(quote.after)}</strong></p><details><summary>Xem mẫu các món đã chọn</summary><ul>{confirm.slice(0,20).map(id=>{const g=byId.get(id);return <li key={id}>{(GEAR_NAMES as any)[g.typeId]} · {Object.entries(g.stats).map(([k,n])=>(STAT_LABELS as any)[k]+' +'+n).join(' · ')} · #{id.slice(5)}</li>;})}</ul>{confirm.length>20&&<p>Và {confirm.length-20} món còn lại trong lựa chọn đã xác nhận.</p>}</details></>:<p className="warning">{error}</p>}
  </Modal>}
 </>;
}
