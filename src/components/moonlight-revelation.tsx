"use client";
import {useRef,useState} from 'react';
import {useGame} from '../runtime/game-context';
import {Modal,CurrencyAmount} from './ui';
import {REVELATION_COST} from '../core/moonlight-revelation.js';

export function MoonlightRevelation({actor}:{actor:any}){
 const {content,campaign,busy,progressionLocked,updateMoonlightRevelation}=useGame();
 const [confirm,setConfirm]=useState(false),pending=useRef(false),rule=actor.moonlightRevelation;
 if(!rule)return null;
 const state=campaign.moonlightRevelations?.[actor.id],owned=campaign.unlockedCharacterIds.includes(actor.id),blocked=busy||progressionLocked||!owned;
 async function change(enabled:boolean){if(pending.current)return;pending.current=true;try{if(await updateMoonlightRevelation(actor.id,enabled))setConfirm(false);}finally{pending.current=false;}}
 return <section className="moonlight-revelation" aria-label="Nguyệt Quang Hé Lộ">
  <div className="section-heading"><div><h3>Nguyệt Quang Hé Lộ</h3><p>{content.moonlightBlessings[rule.blessingId].name}</p></div>{state?<label className="revelation-switch"><input type="checkbox" checked={state.enabled} disabled={blocked} onChange={e=>change(e.target.checked)}/><span>{state.enabled?'Đang bật':'Đã tắt'}</span></label>:<button disabled={blocked} onClick={()=>setConfirm(true)}>Mở khóa · {REVELATION_COST} Pure Prisma</button>}</div>
  <p>{rule.description}</p><p className="muted">Chỉ có hiệu lực khi Chúc Phúc đang tồn tại. Không mở quyền gọi Chúc Phúc.{progressionLocked?' Kết thúc chuyến đi để thay đổi.':''}</p>
  {confirm&&<Modal title="Mở khóa Nguyệt Quang Hé Lộ" onClose={()=>!busy&&setConfirm(false)} footer={<><button disabled={busy} onClick={()=>setConfirm(false)}>Hủy</button><button className="primary" disabled={blocked||campaign.recruitmentShards<REVELATION_COST} onClick={()=>change(true)}>Xác nhận mở khóa</button></>}><p>{rule.description}</p><CurrencyAmount kind="pure" amount={REVELATION_COST}/><p>Mở khóa một lần cho {actor.name}. Sau đó có thể bật/tắt miễn phí.</p>{campaign.recruitmentShards<REVELATION_COST&&<p className="warning">Không đủ Pure Prisma.</p>}</Modal>}
 </section>;
}
