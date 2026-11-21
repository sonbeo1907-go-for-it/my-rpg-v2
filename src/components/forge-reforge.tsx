"use client";
import {useRef,useState} from 'react';
import Link from 'next/link';
import {useGame} from '../runtime/game-context';
import {advancedReforgeUnlocked,beginGearReforge,gearReforgeQuote,reforgeMaterials,secondaryReforgeChance} from '../core/gear-forge.js';
import {GEAR_STAT_KEYS} from '../core/gear-rules.js';
import {STAT_LABELS} from '../core/catalog.js';
import {CurrencyAmount,GearCard,Modal,EmptyState,fmt} from './ui';
import {GearPagination,useGearPagination} from './gear-pagination';

const label=(k:string)=>(STAT_LABELS as any)[k];
export function SecondaryReforgeDialog({gearId,onClose}:{gearId:string;onClose:()=>void}){
 const {campaign,content,busy,transact}=useGame();
 const [advanced,setAdvanced]=useState(false),[target,setTarget]=useState('magic'),[ids,setIds]=useState<string[]>([]),[picker,setPicker]=useState(false),[amount,setAmount]=useState(20),[mf,setMf]=useState<any>({page:'1'});
 const rolling=useRef(false),roll=useRef<number|null>(null);
 const rules=content.blacksmith.default,limit=rules.advancedSecondaryReforge.maxMaterials,unlocked=advancedReforgeUnlocked(campaign,content);
 const gear=campaign.gear.find((g:any)=>g.id===gearId),materials=reforgeMaterials(campaign),pager=useGearPagination(materials,mf,setMf);
 const scale=(k:string)=>content.economy.default.gearStats.find((s:any)=>s.stat===k).scale;
 let quote:any=null,issue='';try{quote=gearReforgeQuote(campaign,content,gearId,advanced?{targetStat:target,materialIds:ids}:null);}catch(e){issue=(e as Error).message;}
 const chance=advanced?Math.round(secondaryReforgeChance(content,ids.length)*1000)/10:null;
 const canPay=campaign.coins>=rules.secondaryReforgeCost.coins&&campaign.prismaFragments>=rules.secondaryReforgeCost.prismaFragments;
 async function confirm(){
  if(rolling.current||!quote)return;rolling.current=true;roll.current??=Math.random();
  try{if(await transact((current:any)=>beginGearReforge(current,content,gearId,()=>roll.current!,advanced?{targetStat:target,materialIds:ids}:null),'Đã lưu kết quả tái rèn. Hãy chọn dòng muốn giữ.'))onClose();}finally{rolling.current=false;}
 }
 function quick(){setIds(materials.slice(0,Math.min(limit,amount)).map((g:any)=>g.id));}
 return <Modal title="Chuẩn bị tái rèn" className="reforge-workbench" onClose={()=>!busy&&onClose()} footer={<><div className="reforge-payment"><strong>Chi phí lần này</strong><div><CurrencyAmount kind="fragments" amount={rules.secondaryReforgeCost.prismaFragments}/><CurrencyAmount kind="coin" amount={rules.secondaryReforgeCost.coins}/>{advanced&&<span>+ {ids.length} trang bị T3</span>}</div></div><button disabled={busy} onClick={onClose}>Hủy</button><button className="gold" disabled={busy||!quote||!canPay} onClick={confirm}>{busy?'Đang lưu…':'Xác nhận tái rèn'}</button></>}>
  {gear?<>
   <div className="reforge-current"><span>Dòng chính giữ nguyên</span><strong>{label(gear.primaryStat)} +{5*scale(gear.primaryStat)}</strong><span>Dòng phụ hiện tại</span><strong>{label(gear.secondaryStat)} +{3*scale(gear.secondaryStat)}</strong></div>
   <div className="forge-subtabs" role="group" aria-label="Cách tái rèn"><button aria-pressed={!advanced} onClick={()=>setAdvanced(false)} disabled={busy}>Ngẫu nhiên</button><button aria-pressed={advanced} onClick={()=>setAdvanced(true)} disabled={busy||!unlocked}>Tái rèn nâng cao{!unlocked?' · Chưa mở':''}</button></div>
   {!unlocked&&<p className="forge-note">Hạ Yamata no Orochi để chọn dòng phụ mong muốn. <Link href="/quests?tab=east&selected=east_ke_08">Đến Bát Kỳ Xà →</Link></p>}
   {advanced?<div className="advanced-reforge-layout">
    <section className="reforge-inputs"><label>Dòng phụ mong muốn<select disabled={busy} value={target} onChange={e=>setTarget(e.target.value)}>{GEAR_STAT_KEYS.map(k=><option key={k} value={k}>{label(k)} +{3*scale(k)}</option>)}</select></label>
     <div className="reforge-material-heading"><strong>Nguyên liệu T3</strong><span>{materials.length} món chưa trang bị</span></div>
     <div className="forge-quick-pick"><label>Số nguyên liệu chọn nhanh<input type="number" min={1} max={limit} value={amount} onChange={e=>setAmount(Math.max(1,Math.min(limit,Math.trunc(Number(e.target.value)||1))))}/></label><button disabled={busy||!materials.length} onClick={quick}>Chọn nhanh</button><button disabled={busy} onClick={()=>setPicker(true)}>Tự chọn T3 ({ids.length}/{limit})</button></div>
     <p className="forge-note">Chọn nhanh lấy các món cũ nhất. Chỉ tiêu nguyên liệu sau khi xác nhận; không nhận Vụn từ các món này.</p>
     {ids.length>0&&<div className="reforge-material-summary"><span>Đã chọn {ids.length} trang bị T3</span><button disabled={busy} onClick={()=>setIds([])}>Bỏ chọn nguyên liệu</button></div>}
    </section>
    <section className="reforge-odds" aria-live="polite"><span>Cơ hội nhận {label(target)}</span><strong>{chance}%</strong><div className="reforge-chance-track" role="progressbar" aria-label="Cơ hội ra dòng phụ mong muốn" aria-valuemin={0} aria-valuemax={100} aria-valuenow={chance!}><span style={{width:chance+'%'}}/></div><div className="reforge-chance-scale"><span>0 món · 14,3%</span><span>{limit} món · 100%</span></div><p>{chance===100?'Bảo đảm nhận đúng dòng đã chọn.':`Cơ hội tăng từ 1/7 đến 100% theo số T3 đã chọn. Nếu không trúng, nhận ngẫu nhiên một trong 6 dòng còn lại.`}</p></section>
   </div>:<p className="forge-note">Bảy chỉ số có cơ hội ngang nhau. Dòng phụ mới có thể trùng dòng cũ hoặc dòng chính.</p>}
   
   <p className="forge-note">Xem kết quả rồi giữ cũ hoặc nhận mới. Chi phí và nguyên liệu đã dùng không được hoàn lại khi giữ dòng cũ.</p>
   {!canPay&&<p className="warning">Không đủ Coin hoặc Vụn Prisma để tái rèn.</p>}{advanced&&!quote&&<p className="warning" role="status">{issue}</p>}
  </>:<EmptyState>Trang bị không còn trong túi đồ.</EmptyState>}
  {picker&&<Modal title="Chọn T3 cho tái rèn nâng cao" className="reforge-material-picker" onClose={()=>setPicker(false)} footer={<><span>Đã chọn {ids.length}/{limit} món · {Math.round(secondaryReforgeChance(content,ids.length)*1000)/10}%</span><button className="gold" onClick={()=>setPicker(false)}>Dùng các nguyên liệu đã chọn</button></>}>
   <div className="forge-actions"><button disabled={!materials.length} onClick={quick}>Chọn nhanh {Math.min(amount,materials.length)} món</button><button disabled={!ids.length} onClick={()=>setIds([])}>Bỏ chọn</button></div><GearPagination pager={pager}/>
   <div className="gear-grid">{pager.items.map((g:any)=><GearCard key={g.id} gear={g} selected={ids.includes(g.id)} disabled={!ids.includes(g.id)&&ids.length>=limit} onClick={()=>setIds(old=>old.includes(g.id)?old.filter(id=>id!==g.id):[...old,g.id])}/>)}</div>{!materials.length&&<EmptyState>Chưa có trang bị T3 chưa sử dụng.</EmptyState>}
  </Modal>}
 </Modal>;
}
