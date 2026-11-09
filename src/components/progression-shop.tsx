"use client";
import {useRef,useState} from 'react';
import {useGame} from '../runtime/game-context';
import {buyProgressionItem,progressionShopItems} from '../core/progression-items.js';
import {CurrencyAmount,ResourceIcon,Modal,fmt} from './ui';

function SupplyOffer({item}:{item:any}){
 const {campaign,content,transact,busy}=useGame(),[quantity,setQuantity]=useState('1'),[confirm,setConfirm]=useState<number|null>(null),pending=useRef(false);
 const n=Number(quantity),valid=Number.isSafeInteger(n)&&n>0&&Number.isSafeInteger(n*item.coinCost),total=valid?n*item.coinCost:0;
 async function buy(){if(pending.current||confirm===null)return;pending.current=true;try{if(await transact(current=>buyProgressionItem(current,content,item.id,confirm),'Đã mua '+item.name+'.'))setConfirm(null);}finally{pending.current=false;}}
 return <article className={'panel shop-supply-card currency-'+item.kind} data-shop-item={item.id}>
  <span className="supply-icon"><ResourceIcon kind={item.kind}/></span><div><h2>{item.name}</h2><p>{item.xp?`${fmt(item.xp)} EXP cho một nhân vật.`:'Mở giới hạn cấp độ tại các mốc Đột Phá.'}</p><div className="exchange-rate"><CurrencyAmount kind="coin" amount={item.coinCost}/><span>→</span><CurrencyAmount kind={item.kind} amount={1}/></div>
  <small>Trong túi: {fmt(campaign[item.field]??0)}</small><label>Số lượng {item.name}<input type="number" min="1" step="1" inputMode="numeric" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label><p>Tổng: <CurrencyAmount kind="coin" amount={total}/></p>
  <button className="gold" disabled={busy||!valid||campaign.coins<total} onClick={()=>setConfirm(n)}>{item.xp?'Mua sách':'Đổi Tinh Thạch'}</button></div>
  {confirm!==null&&<Modal title={'Xác nhận '+(item.xp?'mua sách':'đổi Tinh Thạch')} onClose={()=>!busy&&setConfirm(null)} footer={<><button disabled={busy} onClick={()=>setConfirm(null)}>Hủy</button><button className="gold" disabled={busy||campaign.coins<confirm*item.coinCost} onClick={buy}>Xác nhận</button></>}><p>Dùng <CurrencyAmount kind="coin" amount={confirm*item.coinCost}/> để nhận {fmt(confirm)} {item.name}.</p><p>Vật phẩm được đưa vào Túi đồ. Không giới hạn lượt mua mỗi ngày.</p></Modal>}
 </article>;
}
export function ProgressionShop({books=false}:{books?:boolean}){const {content}=useGame();return <section className={books?'shop-supplies':'stone-exchange'} aria-label={books?'Nhật kí hành trình':'Đổi Tinh Thạch Phá Giới'}>{progressionShopItems(content).filter((item:any)=>Boolean(item.xp)===books).map((item:any)=><SupplyOffer key={item.id} item={item}/>)}</section>;}
