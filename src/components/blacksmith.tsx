"use client";
import {GearForgePanel,GearReforgePending} from './gear-forge';
import {GearPagination,useGearPagination} from './gear-pagination';
import {gearDismantleYield} from '../core/gear-rules.js';
import { RulesDisclosure } from "./skill-details";

import Link from "next/link";
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../runtime/game-context';
import { useRouteFilters } from './characters';
import { MerchantScene } from './merchant-scene';
import { CurrencyAmount, EquipmentIcon, EmptyState, GearCard, GearFilters, Icon, Modal, PageHeader, fmt } from './ui';
import { gearCatalog, GEAR_NAMES, STAT_LABELS } from '../core/catalog.js';
import { blacksmithRules, exclusiveRollRange, FORGE_STATS, exclusiveCraftUnlocked } from '../core/blacksmith-rules.js';
import { beginReforge, craftExclusive, dismantleGear, dismantleQuote, equipExclusive, finishReforge, unequipExclusive } from '../core/blacksmith.js';

const lines=[
 'Đồ cũ chưa chắc đã vô dụng. Đưa đây, ta lấy lại phần Prisma còn tốt cho cháu.',
 'Lửa phải đủ nóng, tay phải đủ vững. Còn nguyên liệu thì… phải đủ thật.',
 'Một món Trấn Phái cần đúng người cầm. Đừng chỉ nhìn vào lớp thép sáng.',
 'Tái rèn xong cứ xem cả hai kết quả. Không vừa ý thì giữ món cũ, chẳng ai giục cháu cả.',
 'Cứ ngắm đi. Ta tranh thủ gõ thêm vài nhát trước khi lò nguội.',
];
const stat=(key:string,value:number)=>`${(STAT_LABELS as any)[key]} +${fmt(value)}`;
function useSmithTransaction() {
 const {transact}=useGame(),lock=useRef(false);
 return async(operation:(save:any)=>any,message:string,done:()=>void=()=>{})=>{
  if(lock.current)return;lock.current=true;
  try{if(await transact(operation,message))done();}finally{lock.current=false;}
 };
}
function RollRanges(){
 const {content}=useGame();
 return <div className="forge-roll-ranges">{FORGE_STATS.map(key=>{const range=exclusiveRollRange(content,key);return <span key={key}>{(STAT_LABELS as any)[key]} +{range.min}–{range.max}</span>;})}</div>;
}
function CostTable({cost}:{cost:Record<string,number>}) {
 const {campaign,content}=useGame();
 return <table className="forge-cost"><thead><tr><th>Nguyên liệu</th><th>Cần</th><th>Đang có</th><th>Còn lại</th></tr></thead><tbody>{Object.entries(cost).map(([field,amount])=>{const item:any=Object.values(content.items).find((item:any)=>item.field===field),have=campaign[field];return <tr key={field} className={have<amount?'warning':''}><th>{item.name}</th><td>{fmt(amount)}</td><td>{fmt(have)}</td><td>{have<amount?`Thiếu ${fmt(amount-have)}`:fmt(have-amount)}</td></tr>;})}</tbody></table>;
}
function DismantlePanel({filters,onChange}:{filters:any;onChange:(filters:any)=>void}) {
 const {content,campaign,busy}=useGame(),save=useSmithTransaction();
 const [selected,setSelected]=useState<string[]>([]),[confirm,setConfirm]=useState<string[]|null>(null);
 const gear=gearCatalog(content,campaign,{...filters,status:'free'}).filter((g:any)=>g.id!==campaign.pendingGearReforge?.gearId),rules=blacksmithRules(content),pager=useGearPagination(gear,filters,onChange);
 useEffect(()=>setSelected([]),[filters.tier,filters.stat,filters.sort,filters.direction]);
 useEffect(()=>setSelected(ids=>ids.filter(id=>campaign.gear.some((item:any)=>item.id===id)&&!Object.values(campaign.equipment).some((slots:any)=>slots.includes(id)))),[campaign]);
 let quote:any=null,error='';try{if(confirm?.length)quote=dismantleQuote(campaign,content,confirm);}catch(failure){error=(failure as Error).message;}
 const fragments=selected.reduce((sum,id)=>sum+gearDismantleYield(content,campaign.gear.find((item:any)=>item.id===id)),0);
 return <>
  <GearFilters filters={filters} onChange={f=>onChange({...f,page:"1"})} hideStatus/>
  <div className="forge-selection panel"><div><strong>Đã chọn {selected.length}/{rules.maxDismantle}</strong><span>Nhận được <CurrencyAmount kind="fragments" amount={fragments}/></span></div><div className="forge-actions">
   <button disabled={busy||!gear.length} onClick={()=>setSelected(ids=>[...new Set([...ids,...pager.items.map((item:any)=>item.id)])].slice(0,rules.maxDismantle))}>Chọn các món đang hiển thị</button>
   <button disabled={busy||!selected.length} onClick={()=>setSelected([])}>Bỏ chọn</button>
   <button className="gold" disabled={busy||!selected.length} onClick={()=>setConfirm([...selected])}>Phân rã ({selected.length})</button>
  </div></div>
  <p className="forge-note">Chỉ hiện trang bị chưa được sử dụng. Đổi bộ lọc hoặc sắp xếp sẽ bỏ lựa chọn hiện tại.</p>
  <GearPagination pager={pager}/><div className="gear-grid forge-gear-grid">{pager.items.map((item:any)=><GearCard key={item.id} gear={item} selected={selected.includes(item.id)} disabled={busy||(!selected.includes(item.id)&&selected.length>=rules.maxDismantle)} onClick={()=>setSelected(ids=>ids.includes(item.id)?ids.filter(id=>id!==item.id):ids.length<rules.maxDismantle?[...ids,item.id]:ids)}><small className="forge-yield"><CurrencyAmount kind="fragments" amount={gearDismantleYield(content,item)}/></small></GearCard>)}</div>
  {!gear.length&&<EmptyState>Không có trang bị chưa sử dụng phù hợp để phân rã.</EmptyState>}
  {confirm&&<Modal title="Xác nhận phân rã trang bị" onClose={()=>!busy&&setConfirm(null)} footer={<><button disabled={busy} onClick={()=>setConfirm(null)}>Hủy</button><button className="danger" disabled={busy||!quote} onClick={()=>save(current=>dismantleGear(current,content,confirm),'Đã phân rã trang bị và nhận Vụn Prisma.',()=>{setConfirm(null);setSelected([]);})}>{busy?'Đang xử lý…':'Xác nhận phân rã'}</button></>}>
   <p>Bạn sắp phân rã <strong>{confirm.length} trang bị</strong>. Thao tác này không thể hoàn tác.</p>
   {quote?<><ul>{Object.entries(quote.groups).filter(([,n])=>Number(n)>0).map(([id,n])=><li key={id}>{(GEAR_NAMES as any)[id]}: {String(n)} món</li>)}</ul><p>Nhận được: <CurrencyAmount kind="fragments" amount={quote.fragments}/></p><p>Vụn Prisma: {fmt(campaign.prismaFragments)} → <strong>{fmt(quote.after)}</strong></p><details><summary>Xem các món sẽ phân rã</summary><ul>{confirm.map(id=>{const item=campaign.gear.find((item:any)=>item.id===id);return <li key={id}>{(GEAR_NAMES as any)[item.typeId]} · {Object.entries(item.stats).map(([key,n])=>stat(key,Number(n))).join(' · ')} · #{id.slice(5)}</li>;})}</ul></details></>:<p className="warning">{error}</p>}
  </Modal>}
 </>;
}
function ExclusiveForge({filters,onChange}:{filters:any;onChange:(filters:any)=>void}) {
 const {campaign,content,busy}=useGame(),save=useSmithTransaction(),rules=blacksmithRules(content);
 const [confirm,setConfirm]=useState<{kind:'craft'|'reforge';id:string}|null>(null);
 const templates:any[]=Object.values(content.exclusiveGear).filter((template:any)=>{
  const owned=campaign.exclusiveGear.some((item:any)=>item.templateId===template.id),equipped=campaign.equippedExclusiveGear[template.characterId]===template.id;
  return (template.enabled||owned)&&(!filters.character||template.characterId===filters.character)&&(!filters.owned||(filters.owned==='owned'?owned:filters.owned==='equipped'?equipped:!owned))&&`${template.name} ${content.characters[template.characterId].name}`.toLocaleLowerCase('vi').includes((filters.q??'').toLocaleLowerCase('vi'));
 });
 const template=confirm?content.exclusiveGear[confirm.id]:null,owned=confirm?campaign.exclusiveGear.find((item:any)=>item.templateId===confirm.id):null;
 const enough=Object.entries(rules.craftCost).every(([field,n])=>campaign[field]>=Number(n));
 return <>
  <div className="filter-bar forge-template-filters"><label>Tìm Trấn Phái<input placeholder="Tên trang bị hoặc nhân vật…" value={filters.q??''} onChange={event=>onChange({...filters,q:event.target.value})}/></label><label>Nhân vật<select value={filters.character??''} onChange={event=>onChange({...filters,character:event.target.value})}><option value="">Tất cả</option>{Object.values(content.characters).map((actor:any)=><option key={actor.id} value={actor.id}>{actor.name}</option>)}</select></label><label>Trạng thái<select value={filters.owned??''} onChange={event=>onChange({...filters,owned:event.target.value})}><option value="">Tất cả</option><option value="new">Chưa chế tạo</option><option value="owned">Đã sở hữu</option><option value="equipped">Đang trang bị</option></select></label></div>
  <details className="forge-policy panel"><summary>Chi phí chế tạo & quy tắc chỉ số</summary><p>Mỗi mẫu chỉ cần chế tạo một lần; không tự động trang bị sau khi chế tạo.</p><CostTable cost={rules.craftCost}/><RollRanges/><p>Mặc định thử nghiệm: 7 loại chỉ số có cơ hội ngang nhau; các mức nguyên của mỗi loại có cơ hội ngang nhau. Tái rèn có thể trùng kết quả cũ.</p></details>
  <div className="exclusive-grid">{templates.map(template=>{
   const item=campaign.exclusiveGear.find((item:any)=>item.templateId===template.id),equipped=campaign.equippedExclusiveGear[template.characterId]===template.id;
   return <article className={`panel exclusive-card ${equipped?'equipped':''}`} key={template.id}><EquipmentIcon typeId="exclusive" compact/><span className="eyebrow">{content.characters[template.characterId].name} · {equipped?'Đang trang bị':item?'Đã sở hữu':'Chưa chế tạo'}</span><h2>{template.name}</h2><p>{template.description}</p>{template.requires?.firstClear&&!exclusiveCraftUnlocked(campaign,template)&&<p className="warning">Mở công thức: <Link href={`/stories/${content.encounters[template.requires.firstClear].travelerStory}?selected=${template.requires.firstClear}`}>{content.encounters[template.requires.firstClear].name} →</Link></p>}<p><strong>Nội tại:</strong> {template.passive.description}</p><RulesDisclosure rules={template.passive.rules}/>{item?<strong className="exclusive-stat">{stat(item.statKey,item.statValue)}</strong>:template.source?.type==='quest'?<p>Thưởng lần đầu: {content.encounters[template.source.encounterId].name} · {stat(template.source.statKey,template.source.statValue)} cố định</p>:<div className="forge-cost-summary">{Object.entries(rules.craftCost).map(([field,n])=>{const resource:any=Object.values(content.items).find((item:any)=>item.field===field);return <CurrencyAmount key={field} kind={resource.kind} amount={Number(n)}/>;})}</div>}<details><summary>{template.initialStat?"Khoảng chỉ số khi tái rèn":"Khoảng chỉ số có thể nhận"}</summary><RollRanges/></details>
   <div className="forge-actions">{!item?template.source?.type==='quest'?<Link className="button gold" href={`/quests?selected=${template.source.encounterId}`}>Đến nhiệm vụ</Link>:<button className="gold" disabled={busy||!campaign.unlockedCharacterIds.includes(template.characterId)||!exclusiveCraftUnlocked(campaign,template)} onClick={()=>setConfirm({kind:'craft',id:template.id})}>Chế tạo</button>:<><button disabled={busy||campaign.originalPrisma<rules.reforgeCost||Boolean(campaign.pendingReforge||campaign.pendingGearReforge)} onClick={()=>setConfirm({kind:'reforge',id:template.id})}>Tái rèn</button><button disabled={busy} onClick={()=>save(current=>equipped?unequipExclusive(current,content,template.characterId):equipExclusive(current,content,template.characterId,template.id),equipped?'Đã tháo Trấn Phái.':'Đã trang bị Trấn Phái. Áp dụng ở trận mới.')}>{equipped?'Tháo':'Trang bị'}</button></>}</div></article>;
  })}</div>
  {!templates.length&&<EmptyState>{Object.keys(content.exclusiveGear).length?'Không có Trấn Phái phù hợp bộ lọc.':'Chưa mở mẫu Trấn Phái nào. Các bản thiết kế và nội tại sẽ được bổ sung sau.'}</EmptyState>}
  {confirm&&template&&<Modal title={confirm.kind==='craft'?'Xác nhận chế tạo Trấn Phái':'Xác nhận tái rèn'} onClose={()=>!busy&&setConfirm(null)} footer={<><button disabled={busy} onClick={()=>setConfirm(null)}>Hủy</button><button className="gold" disabled={busy||(confirm.kind==='craft'?!enough||Boolean(owned)||!exclusiveCraftUnlocked(campaign,template):campaign.originalPrisma<rules.reforgeCost||Boolean(campaign.pendingReforge)||!owned)} onClick={()=>save(current=>confirm.kind==='craft'?craftExclusive(current,content,confirm.id):beginReforge(current,content,confirm.id),confirm.kind==='craft'?`Đã chế tạo ${template.name}.`:'Đã tạo kết quả tái rèn. Hãy chọn giữ cũ hoặc dùng mới.',()=>setConfirm(null))}>{busy?'Đang xử lý…':confirm.kind==='craft'?'Xác nhận chế tạo':`Tái rèn (${rules.reforgeCost} Original Prisma)`}</button></>}>
   <h3>{template.name} · {content.characters[template.characterId].name}</h3><p>Nội tại cố định: {template.passive.description}</p>
   {confirm.kind==='craft'?<><CostTable cost={rules.craftCost}/><p>{template.initialStat?`Chế tạo lần đầu: ${stat(template.initialStat.statKey,template.initialStat.statValue)}. Tái rèn theo quy tắc chung.`:"Chỉ số được tạo ngẫu nhiên."} Mẫu Trấn Phái này chỉ cần chế tạo một lần.</p></>:<><p>Chỉ số hiện tại: <strong>{owned&&stat(owned.statKey,owned.statValue)}</strong></p><CostTable cost={{originalPrisma:rules.reforgeCost}}/><p>Tái rèn sẽ tạo chỉ số mới. Bạn sẽ được xem kết quả và quyết định giữ cũ hay dùng mới. Nội tại không thay đổi.</p></>}
   <RollRanges/>
  </Modal>}
 </>;
}
function ReforgeResult({onClose}:{onClose:()=>void}) {
 const {campaign,content,busy}=useGame(),save=useSmithTransaction(),pending=campaign.pendingReforge;
 if(!pending)return null;
 const template=content.exclusiveGear[pending.templateId];
 return <Modal title="Chọn kết quả tái rèn" onClose={()=>!busy&&onClose()} footer={<><button disabled={busy} onClick={()=>save(current=>finishReforge(current,content,pending.id,false),'Đã giữ chỉ số cũ.',onClose)}>Giữ chỉ số cũ</button><button className="gold" disabled={busy} onClick={()=>save(current=>finishReforge(current,content,pending.id,true),'Đã dùng chỉ số mới. Áp dụng ở trận mới.',onClose)}>Dùng chỉ số mới</button></>}>
  <h3>{template.name}</h3><p>Nội tại giữ nguyên: {template.passive.description}</p><div className="reforge-comparison"><div><span>Chỉ số cũ</span><strong>{stat(pending.previousStatKey,pending.previousStatValue)}</strong></div><div><span>Chỉ số mới</span><strong>{stat(pending.nextStatKey,pending.nextStatValue)}</strong></div></div><p>Original Prisma đã được tiêu hao khi tạo kết quả, dù bạn chọn phương án nào. Đóng cửa sổ này sẽ giữ kết quả chờ chọn; không roll lại.</p>
 </Modal>;
}
export function BlacksmithPage() {
 const {campaign}=useGame(),[filters,setFilters]=useRouteFilters(),tab=['exclusive','stats','effects'].includes(filters.tab)?filters.tab:'dismantle';
 const [showResult,setShowResult]=useState(Boolean(campaign.pendingReforge));
 useEffect(()=>{if(campaign.pendingReforge)setShowResult(true);},[campaign.pendingReforge?.id]);
 useEffect(()=>{const show=()=>setShowResult(true);window.addEventListener('rpg:resume-reforge',show);return()=>window.removeEventListener('rpg:resume-reforge',show);},[]);
 return <main className="page shop-page blacksmith-page"><MerchantScene art="/art/blacksmith.svg" name="Tobin · Thợ Rèn" badge="LỬA LÒ CHƯA TẮT" lines={lines}>
  <PageHeader title="Thợ Rèn" subtitle="Từ mảnh vỡ cũ, rèn nên một lời hứa mới"/>
  <div className="forge-wallet panel" aria-label="Nguyên liệu Thợ Rèn"><CurrencyAmount kind="coin" amount={campaign.coins}/><CurrencyAmount kind="fragments" amount={campaign.prismaFragments}/><CurrencyAmount kind="original" amount={campaign.originalPrisma}/><CurrencyAmount kind="pure" amount={campaign.recruitmentShards}/></div>
  <nav className="shop-tabs blacksmith-tabs" aria-label="Các mục Thợ Rèn"><button className={tab==='dismantle'?'active':''} aria-current={tab==='dismantle'?'page':undefined} onClick={()=>setFilters({...filters,tab:'dismantle'})}><Icon name="fragments"/>Phân rã</button><button className={tab==='exclusive'?'active':''} aria-current={tab==='exclusive'?'page':undefined} onClick={()=>setFilters({...filters,tab:'exclusive'})}><Icon name="anvil"/>Trấn Phái</button><button className={tab==='stats'?'active':''} aria-current={tab==='stats'?'page':undefined} onClick={()=>setFilters({...filters,tab:'stats',page:'1'})}><Icon name="shield"/>Rèn Chỉ Số</button><button className={tab==='effects'?'active':''} aria-current={tab==='effects'?'page':undefined} onClick={()=>setFilters({...filters,tab:'effects',page:'1'})}><Icon name="prism"/>Rèn Hiệu Ứng</button></nav>
  <section className="forge-content">{tab==='dismantle'?<DismantlePanel filters={filters} onChange={setFilters}/>:tab==='exclusive'?<ExclusiveForge filters={filters} onChange={setFilters}/>:<GearForgePanel key={tab} kind={tab as 'stats'|'effects'}/>}</section><GearReforgePending/>
  {campaign.pendingReforge&&!showResult&&<button className="button gold" onClick={()=>setShowResult(true)}>Xem kết quả tái rèn đang chờ</button>}
 </MerchantScene>{showResult&&campaign.pendingReforge&&<ReforgeResult onClose={()=>setShowResult(false)}/>}</main>;
}
