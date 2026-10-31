"use client";
import {gearEffectTiming,gearRecipeRequirement,gearRecipeSource} from '../core/gear-effect-schema.js';
import {PrismaSparkles} from "./prisma-sparkles";
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useGame} from '../runtime/game-context';
import {craftGear,beginGearReforge,finishGearReforge} from '../core/gear-forge.js';
import {gearRecipeUnlocked,t4Stats,GEAR_STAT_KEYS} from '../core/gear-rules.js';
import {gearOwner} from '../core/equipment.js';
import {STAT_LABELS} from '../core/catalog.js';
import {CurrencyAmount,GearCard,Modal,EmptyState,fmt,EquipmentIcon,Icon} from './ui';
import {GearPagination,useGearPagination} from './gear-pagination';
const label=(k:string)=>(STAT_LABELS as any)[k];
function Costs({cost}:{cost:any}){return <div className="t4-costs"><CurrencyAmount kind="fragments" amount={cost.prismaFragments}/><CurrencyAmount kind="coin" amount={cost.coins}/><span>+ 1 Gear T3 chưa trang bị</span></div>;}
export function GearForgePanel({kind}:{kind:'stats'|'effects'}){
 const {campaign,content,busy,transact}=useGame();
 const [primary,setPrimary]=useState('attack'),[material,setMaterial]=useState(''),[picker,setPicker]=useState(false),[recipe,setRecipe]=useState<string|null>(null),[confirm,setConfirm]=useState(false),[filters,setFilters]=useState<any>({page:'1'});
 const reforgeCost=content.blacksmith.default.secondaryReforgeCost;
 const owned=campaign.gear.filter((g:any)=>g.typeId==='t4_stats'),pager=useGearPagination(owned,filters,setFilters);
 const materials=campaign.gear.filter((g:any)=>['t3_focused','t3_dual'].includes(g.typeId)&&!gearOwner(campaign,g.id));
 const [mf,setMf]=useState<any>({page:'1'}),mp=useGearPagination(materials,mf,setMf);
 const [rf,setRf]=useState<any>({page:'1'}),rp=useGearPagination(Object.values(content.gearEffects),rf,setRf);
 const effect=recipe?content.gearEffects[recipe]:null,cost=content.blacksmith.default.gearCraftCosts[kind==='stats'?'stats':effect?.costClass??'common'];
 const piece=materials.find((g:any)=>g.id===material),canPay=campaign.coins>=cost.coins&&campaign.prismaFragments>=cost.prismaFragments;
 async function forge(){if(await transact((current:any)=>craftGear(current,content,{materialId:material,primaryStat:kind==='stats'?primary:undefined,effectId:kind==='effects'?recipe:undefined}),'Đã rèn Gear Siêu Cấp và lưu vào túi đồ.')){setConfirm(false);setMaterial('');}}
 return <>
  <section className="panel t4-forge-form">
   <h2>{kind==='stats'?'Rèn Chỉ Số':'Rèn Hiệu Ứng'}</h2>
   {kind==='stats'?<><label>Dòng chính<select value={primary} onChange={e=>setPrimary(e.target.value)}>{GEAR_STAT_KEYS.map(k=><option key={k} value={k}>{label(k)} +{content.economy.default.gearStats.find((s:any)=>s.stat===k).scale*5}</option>)}</select></label><p>Dòng phụ ngẫu nhiên đều giữa 7 chỉ số, ở mức Cấp 2 (+3 điểm). Có thể trùng dòng chính; giữ riêng hai dòng khi tái rèn.</p></>:<><GearPagination pager={rp}/><div className="t4-recipes">{rp.items.map((r:any)=>{const unlocked=gearRecipeUnlocked(campaign,r);return <button key={r.id} className={`panel t4-recipe ${recipe===r.id?'selected':''} ${!unlocked?'is-locked':''}`} data-recipe-class={r.costClass} onClick={()=>setRecipe(r.id)} aria-pressed={recipe===r.id}><PrismaSparkles/><span className="t4-recipe-heading"><EquipmentIcon typeId="t4_effect"/><span className="t4-recipe-copy"><strong>{r.name}</strong><span className="t4-recipe-kind">{r.costClass==='special'?'Công thức đặc biệt':'Công thức phổ thông'}{!unlocked?' · Chưa mở':''}</span></span></span><p>{r.description}</p><span className="t4-recipe-footer"><span>{!unlocked?gearRecipeRequirement(content,r):'Một món cùng nhóm hiệu ứng / nhân vật.'}</span><span><Icon name="hourglass"/>{gearEffectTiming(r)}</span></span></button>;})}</div></>}
   <button disabled={busy} onClick={()=>setPicker(true)}>{piece?`Đã chọn nguyên liệu: ${Object.entries(piece.stats).map(([k,n])=>label(k)+' +'+n).join(' · ')} · #${piece.id.slice(5)}`:'Chọn nguyên liệu Gear T3'}</button>
   {(kind==='stats'||effect)&&<><Costs cost={cost}/><button className="gold" disabled={busy||!piece||!canPay||Boolean(effect&&!gearRecipeUnlocked(campaign,effect))} onClick={()=>setConfirm(true)}>Rèn Gear Siêu Cấp</button>{effect&&!gearRecipeUnlocked(campaign,effect)&&<Link href={gearRecipeSource(effect)}>{gearRecipeRequirement(content,effect)} →</Link>}</>}
   <p className="muted">Nguyên liệu T3 sẽ bị tiêu hao. Món mới không tự trang bị. Gear hiệu ứng chiếm ô thường; mỗi nhân vật chỉ mang một món cùng nhóm hiệu ứng.</p>
  </section>
  {kind==='stats'&&<section className="t4-owned"><h2>Tái rèn dòng phụ</h2><p>{fmt(reforgeCost.prismaFragments)} Vụn Prisma + {fmt(reforgeCost.coins)} Coin mỗi lần roll. Dòng chính giữ nguyên; xem kết quả rồi giữ cũ hoặc nhận mới, không tốn thêm. Có thể roll trùng kết quả cũ.</p><GearPagination pager={pager}/><div className="gear-grid">{pager.items.map((g:any)=><div className="t4-reforge-card" key={g.id}><GearCard gear={g}/><button disabled={busy||Boolean(campaign.pendingReforge||campaign.pendingGearReforge)||campaign.prismaFragments<reforgeCost.prismaFragments||campaign.coins<reforgeCost.coins} onClick={()=>transact((s:any)=>beginGearReforge(s,content,g.id),'Đã roll dòng phụ và lưu kết quả chờ chọn.')}>Tái rèn dòng phụ</button></div>)}</div>{!owned.length&&<EmptyState>Chưa có Gear Cấp 4 chỉ số để tái rèn.</EmptyState>}</section>}
  {picker&&<Modal title="Chọn nguyên liệu Gear T3" onClose={()=>setPicker(false)}><p>Chỉ hiện Gear T3 chưa được trang bị. Chọn một món sẽ quay lại bản thiết kế; chưa tiêu hao nguyên liệu.</p><GearPagination pager={mp}/><div className="gear-grid">{mp.items.map((g:any)=><GearCard gear={g} key={g.id} selected={g.id===material} onClick={()=>{setMaterial(g.id);setPicker(false);}}/>)}</div>{!materials.length&&<EmptyState>Không có Gear T3 chưa sử dụng.</EmptyState>}</Modal>}
  {confirm&&<Modal title="Xác nhận rèn Gear Siêu Cấp" onClose={()=>!busy&&setConfirm(false)} footer={<><button disabled={busy} onClick={()=>setConfirm(false)}>Hủy</button><button className="gold" disabled={busy||!canPay||!piece} onClick={forge}>Xác nhận chế tạo</button></>}><h3>{kind==='stats'?label(primary)+' +'+content.economy.default.gearStats.find((s:any)=>s.stat===primary).scale*5:effect?.name}</h3><Costs cost={cost}/><p>Tiêu hao Gear T3 #{piece?.id.slice(5)}. {kind==='stats'?'Dòng phụ được tạo khi xác nhận, không chọn trước.':effect?.description}</p></Modal>}
 </>;
}
export function GearReforgePending(){
 const {campaign,content,busy,transact}=useGame(),p=campaign.pendingGearReforge,[open,setOpen]=useState(Boolean(p));
 useEffect(()=>{if(p)setOpen(true);},[p?.id]);if(!p)return null;
 const scale=(k:string)=>content.economy.default.gearStats.find((s:any)=>s.stat===k).scale;
 const finish=async(useNew:boolean)=>{if(await transact((s:any)=>finishGearReforge(s,content,p.id,useNew),useNew?'Đã nhận dòng phụ mới.':'Đã giữ dòng phụ cũ.'))setOpen(false);};
 return <><button className="gold" onClick={()=>setOpen(true)}>Xem kết quả dòng phụ đang chờ</button>{open&&<Modal title="Chọn dòng phụ" onClose={()=>!busy&&setOpen(false)} footer={<><button disabled={busy} onClick={()=>finish(false)}>Giữ dòng cũ</button><button className="gold" disabled={busy} onClick={()=>finish(true)}>Nhận dòng mới</button></>}><p>Dòng chính cố định: <strong>{label(p.primaryStat)} +{5*scale(p.primaryStat)}</strong></p><div className="reforge-comparison"><div><span>Dòng phụ hiện tại</span><strong>{label(p.previousSecondaryStat)} +{3*scale(p.previousSecondaryStat)}</strong></div><div><span>Dòng phụ mới</span><strong>{label(p.nextSecondaryStat)} +{3*scale(p.nextSecondaryStat)}</strong></div></div><p>450 Vụn Prisma và 2.500 Coin đã tiêu hao. Giữ dòng cũ không hoàn lại chi phí. Đóng game vẫn giữ nguyên hai kết quả này.</p><small>Tổng chỉ số mới: {Object.entries(t4Stats(content,p.primaryStat,p.nextSecondaryStat)).map(([k,n])=>label(k)+' +'+n).join(' · ')}</small></Modal>}</>;
}
