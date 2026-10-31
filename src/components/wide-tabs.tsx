"use client";
import Link from 'next/link';
export type WideTab={id:string;label:string;href?:string};
export function WideTabs({tabs,active,label,onChange,className=''}:{tabs:WideTab[];active:string;label:string;onChange?:(id:string)=>void;className?:string}){
 return <nav className={`page-wide-tabs ${className}`} aria-label={label} style={{gridTemplateColumns:`repeat(${tabs.length},minmax(0,1fr))`}}>{tabs.map(tab=>tab.href?<Link key={tab.id} href={tab.href} className={active===tab.id?'active':''} aria-current={active===tab.id?'page':undefined} data-tab-id={tab.id}>{tab.label}</Link>:<button key={tab.id} className={active===tab.id?'active':''} aria-pressed={active===tab.id} aria-current={active===tab.id?'page':undefined} data-tab-id={tab.id} onClick={()=>onChange?.(tab.id)}>{tab.label}</button>)}</nav>;
}
export function CharacterTabs({id,active,back}:{id:string;active:string;back:string}){
 const context=new URLSearchParams({back});
 return <WideTabs className="character-tabs" label="Các mục nhân vật" active={active} tabs={[
  {id:'overview',label:'Tổng Quan',href:`/characters/${id}?${context}&tab=overview`},
  {id:'level',label:'Cấp Độ',href:`/characters/${id}?${context}&tab=level`},
  {id:'skills',label:'Kỹ Năng',href:`/characters/${id}?${context}&tab=skills`},
  {id:'equipment',label:'Trang Bị',href:`/characters/${id}/equipment?${context}`},
 ]}/>;
}
