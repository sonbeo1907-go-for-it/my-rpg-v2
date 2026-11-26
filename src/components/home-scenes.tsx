"use client";
import {useRef,useState} from 'react';
import {useGame} from '../runtime/game-context';
import {HOME_SCENES,homeSceneUnlocked,selectedHomeScene,changeHomeScene} from '../core/home-scenes.js';
import {Icon,Modal} from './ui';
export function HomeSceneDialog({onClose}:{onClose:()=>void}){
 const {campaign,busy,transact}=useGame(),current=selectedHomeScene(campaign),[selected,setSelected]=useState(current.id),pending=useRef(false);
 async function apply(){if(pending.current)return;pending.current=true;try{if(await transact(c=>changeHomeScene(c,selected),'Đã đổi cảnh nền và nhạc màn hình chờ.'))onClose();}finally{pending.current=false;}}
 return <Modal title="Nơi dừng chân" onClose={()=>!busy&&onClose()} footer={<><button disabled={busy} onClick={onClose}>Trở về</button><button className="primary" disabled={busy||selected===current.id} onClick={apply}>Áp dụng cảnh nền</button></>}>
  <p className="muted">Chọn cảnh nền và giai điệu cho hành trình này.</p>
  <div className="home-scene-options" aria-label="Cảnh nền màn hình chờ">{HOME_SCENES.map(scene=>{const unlocked=homeSceneUnlocked(campaign,scene);return <button key={scene.id} type="button" className="home-scene-option" data-home-option={scene.id} aria-pressed={selected===scene.id} disabled={!unlocked||busy} onClick={()=>setSelected(scene.id)}>
   <img src={scene.art} alt="" className="home-scene-preview"/><span className="home-scene-name">{scene.name}</span>
   <span className="home-scene-state">{!unlocked?<><Icon name="lock"/> Chưa mở khóa</>:current.id===scene.id?<><Icon name="check"/> Đang sử dụng</>:selected===scene.id?'Đã chọn':'Có thể sử dụng'}</span>
   {!unlocked&&<small>Hoàn thành toàn bộ “{scene.name}” {scene.id==='snow_town'?'sau hai nhiệm vụ Thảo Phạt Phương Bắc.':'trong Thảo Phạt Phương Đông.'}</small>}
  </button>;})}</div>
 </Modal>;
}
