"use client";
import Link from 'next/link';
import {useRef,useState} from 'react';
import {useGame} from '../runtime/game-context';
import {Modal,Icon} from './ui';
import {tobinRecruitmentState,recruitTobin} from '../core/tobin-recruitment.js';
export function TobinRecruitment(){
 const {campaign,content,busy,transact}=useGame(),[open,setOpen]=useState(false),lock=useRef(false),ignoreUntil=useRef(0),state=tobinRecruitmentState(campaign,content);
 async function recruit(){if(lock.current)return;lock.current=true;try{if(await transact(current=>recruitTobin(current,content),'Tobin Ironroot đã gia nhập đội ngũ.')){ignoreUntil.current=Date.now()+500;setOpen(false);}}finally{lock.current=false;}}
 return <><button className="tobin-interact" aria-label="Trò chuyện với Tobin Ironroot" onClick={()=>{if(Date.now()>=ignoreUntil.current)setOpen(true);}}><span className="tobin-invite"><Icon name="anvil"/>{state.owned?'Tobin Ironroot':state.ready?'Mời Tobin đồng hành':'Trò chuyện với Tobin'}{state.ready&&!state.owned&&<b aria-label="Có thể chiêu mộ">!</b>}</span></button>
 <div className="tobin-forge-progress" aria-label="Tiến độ Tobin">{state.owned?<><strong>{state.capacity}/6 ô trang bị</strong><span>{state.crafts>=30?'Tay nghề đã đạt mốc cuối':state.crafts+' / '+state.nextAt+' món Tier IV đã rèn'}</span><progress value={state.crafts} max={30}/></>:<span>Quyển I · {state.completed}/{state.total} phần truyện chính</span>}</div>
 {open&&<Modal title="Tobin Ironroot" onClose={()=>!busy&&setOpen(false)} footer={<><button disabled={busy} onClick={()=>setOpen(false)}>Để sau</button>{!state.owned&&<button className="gold" disabled={busy||!state.ready} onClick={recruit}>Mời đồng hành · Miễn phí</button>}{state.owned&&<Link className="button gold" href="/characters/tobin">Xem nhân vật</Link>}</>}>
 <p>“Làng đã yên ổn hơn rồi. Búa còn chắc, chân còn bước được… cho ta đi cùng một đoạn nhé?”</p>
 {!state.owned?<><p>Hoàn thành <strong>10/10 phần truyện chính Quyển I</strong> để mời Tobin đồng hành.</p><p>Tiến độ hiện tại: {state.completed}/{state.total}.</p></>:<p>Tobin đã đồng hành. Mỗi 10 trang bị Tier IV mới rèn mở thêm một ô, tối đa 6 ô.</p>}
 <p>Chỉ tính chế tạo thành công sau khi nhận Tobin, gồm cả Gear Chỉ Số và Hiệu Ứng. Không tính tái rèn, phân rã hoặc chế tạo Trấn Phái.</p>
 </Modal>}</>;
}
