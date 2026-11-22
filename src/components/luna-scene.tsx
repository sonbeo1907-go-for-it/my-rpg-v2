"use client";
import {useEffect,useId,useState,type CSSProperties} from 'react';

const OPEN_MS=3200,BLOOM_MS=11200;
const AMBIENT=Array.from({length:10},(_,i)=>({left:i<5?-2:(i-5)*12.5,top:i<5?i*17: -2,delay:i*3.6,turn:i*47-30,duration:38+i%3*4}));
// Same linear aperture keyframes as CSS. Emit just inside its moving lower rim.
function apertureAt(t:number){const p=t/OPEN_MS;return p<.45?{rx:80+(240-80)*p/.45,ry:6+(50-6)*p/.45}:p<.7?{rx:240+(620-240)*(p-.45)/.25,ry:50+(280-50)*(p-.45)/.25}:{rx:620+(1300-620)*(p-.7)/.3,ry:280+(1300-280)*(p-.7)/.3};}
const BLOOM=Array.from({length:24},(_,i)=>{const delay=1540+i*32,angle=Math.PI*(.12+(i%12)/11*.76),r=apertureAt(delay),x=500+r.rx*Math.cos(angle)*.94,y=560+r.ry*Math.sin(angle)-13;const landX=Math.max(55,Math.min(945,x+(x-500)*.65)),landY=955+i%3*9,side=x<480?-1:x>520?1:i%2?-1:1;
 return {x,y,delay,dx:landX-x,dy:landY-y,drift:side*(150+i%4*30),rise:120+i%5*20,duration:6500+(i%4)*300,turn:i*53};});
function Petal(){return <><path d="M-5 2C-4-4 3-6 6-2C5 3 0 6-5 2Z" fill="#8cc6f4"/><path d="M-3 2 4-2" stroke="#d4edff" strokeWidth=".6" opacity=".7"/></>;}

/** Local scene presentation only. No fullscreen veil and no combat-clock callbacks. */
export function LunaScene({scene,opacity=1}:{scene:any;opacity?:number}){
 const [aspect,setAspect]=useState(16/9);
 useEffect(()=>{const resize=()=>setAspect(innerWidth/innerHeight);resize();window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);},[]);
 const [shown,setShown]=useState<any>(null),[opening,setOpening]=useState(false),[blooming,setBlooming]=useState(false);
 const maskId='luna-eye-'+useId().replace(/[^a-zA-Z0-9_-]/g,''),sceneKey=scene?scene.ownerId+':'+scene.background:'';
 useEffect(()=>{
  const media=matchMedia('(prefers-reduced-motion: reduce)');setShown(scene??null);
  if(!scene||media.matches){setOpening(false);setBlooming(false);return;}
  const art=new Image();art.src=scene.background;setOpening(true);setBlooming(true);
  const eye=window.setTimeout(()=>setOpening(false),OPEN_MS),bloom=window.setTimeout(()=>setBlooming(false),BLOOM_MS);
  const reduce=()=>{if(media.matches){window.clearTimeout(eye);window.clearTimeout(bloom);setOpening(false);setBlooming(false);}};media.addEventListener('change',reduce);
  return()=>{window.clearTimeout(eye);window.clearTimeout(bloom);media.removeEventListener('change',reduce);};
 // Combat snapshots are replaced each action; only a different scene restarts its opening.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[sceneKey]);
 const imageWidth=aspect<16/9?1000*(16/9)/aspect:1000,imageHeight=aspect>=16/9?1000*aspect/(16/9):1000;
 return shown?<>
  <div key={sceneKey} data-scene-owner={shown.ownerId} data-scene-mode="moon_song" data-luna-iris={opening?'opening':undefined} data-luna-bloom={blooming?'true':undefined} className="summon-backdrop mode-scene mode-scene-moon_song luna-garden-scene" aria-hidden="true" style={{opacity,zIndex:0}}>
   <svg className="luna-garden" viewBox="0 0 1000 1000" preserveAspectRatio="none" focusable="false">
    <defs><filter id={maskId+'-soft'} filterUnits="userSpaceOnUse" x="-100" y="-100" width="1200" height="1200"><feGaussianBlur stdDeviation="22"/></filter><mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000"><rect width="1000" height="1000" fill="black"/><ellipse className="luna-eye-aperture" cx="500" cy="560" rx="1300" ry="1300" fill="white" filter={`url(#${maskId}-soft)`}/></mask></defs>
    <g mask={`url(#${maskId})`}><g className="luna-garden-wind"><image href={shown.background} x={(1000-imageWidth)/2} y={(1000-imageHeight)/2} width={imageWidth} height={imageHeight} preserveAspectRatio="none"/><rect width="1000" height="1000" fill="#071525" opacity=".12"/></g>
     {blooming&&<g className="luna-bloom-petals" data-luna-bloom-petals="true">{BLOOM.map((p,i)=><g key={i} transform={`translate(${p.x} ${p.y})`}><g className="luna-bloom-petal" style={{'--bloom-x':p.dx+'px','--bloom-y':p.dy+'px','--bloom-drift':p.drift+'px','--bloom-rise':p.rise+'px','--petal-turn':p.turn+'deg',animationDelay:p.delay+'ms',animationDuration:p.duration+'ms'} as CSSProperties}><Petal/></g></g>)}</g>}
    </g>
   </svg>
  </div>
  {!opening&&<div className="luna-petals" data-luna-petals="true" aria-hidden="true">{AMBIENT.map((p,i)=><span className="luna-petal-track" key={i} style={{left:p.left+'vw',top:p.top+'vh',animationDelay:p.delay+'s',animationDuration:p.duration+'s','--petal-turn':p.turn+'deg'} as CSSProperties}><svg viewBox="-7 -7 14 14" className="luna-petal" focusable="false"><Petal/></svg></span>)}</div>}
 </>:null;
}
