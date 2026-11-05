"use client";
import Link from 'next/link';
import {useEffect,useState,type CSSProperties} from 'react';
import {useGame} from '../runtime/game-context';
import {activeRecruitmentBanners,rotationSchedule} from '../core/rate-up.js';
import {nextDungeonReset} from '../core/dungeon-rules.js';

export function useRecruitmentSchedule(){
 const {content}=useGame();const [now,setNow]=useState<Date|null>(null);
 useEffect(()=>{let timer:ReturnType<typeof setTimeout>;const update=()=>{const date=new Date();setNow(date);clearTimeout(timer);timer=setTimeout(update,Math.max(10,nextDungeonReset(date).getTime()-date.getTime()+20));};update();window.addEventListener('focus',update);const visible=()=>{if(!document.hidden)update();};document.addEventListener('visibilitychange',visible);return()=>{clearTimeout(timer);window.removeEventListener('focus',update);document.removeEventListener('visibilitychange',visible);};},[]);
 return {now,banners:now?activeRecruitmentBanners(content,now):[content.banners.standard]};
}
export const bannerStyle=(banner:any)=>({'--banner-accent':banner.accent??'#b8aed6'} as CSSProperties);
export function bannerWindow(banner:any){const format=(date:number)=>new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit'}).format(new Date(date));return banner.endsAt?`${format(banner.startsAt)} – ${format(banner.endsAt-1)} · Giờ Việt Nam`:null;}
export function FactionArtwork({banner,compact=false}:{banner:any;compact?:boolean}){
 const {content}=useGame();return <div className={'faction-artwork'+(compact?' compact':'')} aria-hidden="true"><img className="faction-scene" src={banner.art??'/art/summon-invitation.svg'} alt=""/>{banner.featured&&<div className="faction-figures">{[1,2,0].map((index:number)=><img key={index} className={'faction-figure figure-'+index} src={'/art/silhouette-'+content.characters[banner.featured[index]].roleGroup+'.svg'} alt=""/>)}</div>}</div>;
}
export function TavernRecruitment(){
 const {content}=useGame(),{now}=useRecruitmentSchedule();const banners=now?rotationSchedule(content,now).banners:[];
 const [slide,setSlide]=useState(0),[paused,setPaused]=useState(false),[hover,setHover]=useState(false),[reduced,setReduced]=useState(false);
 const key=banners.map((b:any)=>b.id).join('|');
 useEffect(()=>{setSlide(0);},[key]);
 useEffect(()=>{const mq=window.matchMedia('(prefers-reduced-motion: reduce)'),update=()=>setReduced(mq.matches);update();mq.addEventListener('change',update);return()=>mq.removeEventListener('change',update);},[]);
 useEffect(()=>{if(banners.length<2||paused||hover||reduced)return;const timer=setInterval(()=>{if(!document.hidden)setSlide(i=>(i+1)%banners.length);},10000);return()=>clearInterval(timer);},[key,banners.length,paused,hover,reduced]);
 const entries=banners.length?banners:[content.banners.standard];
 return <section className="home-rateup-carousel" aria-label="Chiêu Mộ theo phe" aria-roledescription="băng chuyền" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onFocusCapture={()=>setHover(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setHover(false);}}>
  <div className="home-rateup-window"><div className="home-rateup-track" style={{transform:`translateX(-${Math.min(slide,entries.length-1)*100}%)`}}>{entries.map((b:any,i:number)=><Link key={b.id} className="home-rateup-slide" href={'/recruitment?banner='+b.id} aria-label={'Chiêu Mộ · '+b.name} aria-hidden={i!==slide} tabIndex={i===slide?0:-1} style={bannerStyle(b)} data-banner-id={b.id}><FactionArtwork banner={b} compact/><span className="home-rateup-copy"><small>{b.featured?'Chiêu Mộ tăng cơ hội':'Tiếng gọi Prisma'}</small><strong>{b.name}</strong><span>{b.featured?b.featured.map((id:string)=>content.characters[id].name).join(' · '):'Ai đang chờ bước cùng ngươi?'}</span><b>Chiêu Mộ →</b></span></Link>)}</div></div>
  {entries.length>1&&<div className="home-rateup-controls"><div className="carousel-dots" aria-label="Chọn banner">{entries.map((b:any,i:number)=><button key={b.id} className={'carousel-dot'+(slide===i?' active':'')} aria-label={'Xem banner '+b.name} aria-current={slide===i?'true':undefined} onClick={()=>setSlide(i)}><span/></button>)}</div><button aria-label={paused?'Tiếp tục chuyển banner tự động':'Tạm dừng chuyển banner tự động'} aria-pressed={paused} onClick={()=>setPaused(p=>!p)}>{paused?'Chạy':'Dừng'}</button></div>}
 </section>;
}
