"use client";
import { useState, type ReactNode } from 'react';

export function MerchantKeeper({name,badge,lines,action}:{name:string;badge:string;lines:string[];action?:ReactNode}) {
 const [index,setIndex]=useState(0);
 return <aside className="shop-keeper" aria-label={name}>
  {action}
  <span className="keeper-shift"><span />{badge}</span>
  <div className="witch-dialogue"><span className="eyebrow">{name}</span>
   <p aria-live="polite">“{lines[index]}”</p>
   <button className="keeper-next" aria-label="Nghe lời chào tiếp theo" onClick={()=>setIndex(i=>(i+1)%lines.length)}>Nói tiếp… <span aria-hidden="true">→</span></button>
  </div>
 </aside>;
}
export function MerchantScene({art,name,badge,lines,children,keeperAction}:{art:string;name:string;badge:string;lines:string[];children:ReactNode;keeperAction?:ReactNode}) {
 return <><div className="shop-scene" aria-hidden="true"><img src={art} alt="" /></div>
  <div className="shop-layout"><div className="shop-stock">{children}</div><MerchantKeeper name={name} badge={badge} lines={lines} action={keeperAction}/></div>
 </>;
}
