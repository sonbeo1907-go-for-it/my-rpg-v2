"use client";
import {useRef,useState} from 'react';
import {useGame} from '../runtime/game-context';
import {originalExchangeState,exchangePureForOriginal} from '../core/shop-daily.js';
import {CurrencyAmount,Modal,fmt} from './ui';
export function OriginalPrismaExchange(){
 const {campaign,transact,busy,dailyNow}=useGame();
 const state=originalExchangeState(campaign,new Date(dailyNow));
 const [confirm,setConfirm]=useState(false),pending=useRef(false);
 const canExchange=state.remaining>0&&campaign.recruitmentShards>=10;
 async function exchange(){if(pending.current)return;pending.current=true;try{if(await transact(current=>exchangePureForOriginal(current,new Date()),'Đã đổi 10 Pure Prisma thành 1 Original Prisma.'))setConfirm(false);}finally{pending.current=false;}}
 return <section className="panel original-exchange" data-original-exchange>
  <span className="eyebrow">TINH LUYỆN ÁNH SÁNG</span><h2>Đổi Original Prisma</h2>
  <p>Nguyên liệu chế tạo và tái rèn Trấn Phái.</p>
  <div className="exchange-rate"><CurrencyAmount kind="pure" amount={10}/><span>→</span><CurrencyAmount kind="original" amount={1}/></div>
  <p className="original-exchange-quota">Đã đổi {state.originalExchanges}/3 hôm nay · Còn {state.remaining} lượt</p>
  <p className="muted">Làm mới lúc 00:00 giờ Việt Nam. Hạn mức dùng riêng cho hồ sơ này.</p>
  <div className="original-exchange-wallet"><CurrencyAmount kind="pure" amount={campaign.recruitmentShards}/><CurrencyAmount kind="original" amount={campaign.originalPrisma??0}/></div>
  {state.remaining===0?<p className="warning">Đã hết lượt đổi hôm nay.</p>:campaign.recruitmentShards<10?<p className="warning">Cần thêm {fmt(10-campaign.recruitmentShards)} Pure Prisma.</p>:null}
  <button className="gold" disabled={busy||!canExchange} onClick={()=>setConfirm(true)}>Đổi 10 Pure Prisma</button>
  {confirm&&<Modal title="Xác nhận đổi Original Prisma" onClose={()=>!busy&&setConfirm(false)} footer={<><button disabled={busy} onClick={()=>setConfirm(false)}>Hủy</button><button className="gold" disabled={busy||!canExchange} onClick={exchange}>Xác nhận đổi</button></>}>
   <p>Dùng <CurrencyAmount kind="pure" amount={10}/> để nhận <CurrencyAmount kind="original" amount={1}/>.</p>
   <p>Sau khi đổi: {fmt(campaign.recruitmentShards-10)} Pure Prisma · {fmt((campaign.originalPrisma??0)+1)} Original Prisma.</p><p>Còn {Math.max(0,state.remaining-1)} lượt đổi hôm nay sau lần này.</p>
  </Modal>}
 </section>;
}
