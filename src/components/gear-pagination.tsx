"use client";
import {useEffect,useState} from 'react';
export function useGearPagination(items:any[],filters:any,onChange:(f:any)=>void){
 const [size,setSize]=useState(12);
 useEffect(()=>{const query=window.matchMedia('(max-width: 640px)'),update=()=>setSize(query.matches?6:12);update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
 const pages=Math.max(1,Math.ceil(items.length/size)),requested=Number(filters.page)||1,page=Math.max(1,Math.min(pages,Math.floor(requested)));
 return {items:items.slice((page-1)*size,page*size),page,pages,total:items.length,size,change:(n:number)=>onChange({...filters,page:String(Math.max(1,Math.min(pages,n)))})};
}
export function GearPagination({pager}:{pager:ReturnType<typeof useGearPagination>}){
 return <nav className="gear-pagination" aria-label="Phân trang trang bị"><button data-gamepad-page="previous" aria-label="Trang trước" disabled={pager.page<=1} onClick={()=>pager.change(pager.page-1)}>LT · ←</button><span>Trang {pager.page} / {pager.pages} · {pager.total} món</span><button data-gamepad-page="next" aria-label="Trang sau" disabled={pager.page>=pager.pages} onClick={()=>pager.change(pager.page+1)}>→ · RT</button></nav>;
}
