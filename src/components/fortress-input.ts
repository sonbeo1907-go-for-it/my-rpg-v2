"use client";
import {useEffect} from 'react';

export function useFortressInput(active:boolean,busy:boolean,onParty:()=>void){
 useEffect(()=>{
  if(!active)return;
  function focus(node:HTMLElement|null){node?.focus({preventScroll:true});node?.scrollIntoView({block:'nearest',behavior:'instant'});}
  const handler=(raw:Event)=>{
   const event=raw as CustomEvent<string>;if(document.querySelector('dialog[open]'))return;
   const root=document.querySelector<HTMLElement>('.fortress-page');if(!root)return;
   const current=document.activeElement as HTMLElement,action=event.detail;
   if(busy){event.preventDefault();return;}
   if(action==='y'){event.preventDefault();onParty();return;}
   if(action==='x'||action==='rt'){event.preventDefault();focus(root.querySelector('[data-fortress-primary]:not(:disabled)')??root.querySelector('.fortress-services button:not(:disabled)')??root.querySelector('[data-fortress-resume]:not(:disabled)'));return;}
   if(action==='lt'||action==='b'&&!current?.closest('.fortress-area-list')){event.preventDefault();focus(root.querySelector('.fortress-area-list [aria-current=location]'));return;}
   if(['up','down'].includes(action)&&current?.closest('.fortress-area-list')){
    event.preventDefault();const buttons=Array.from(root.querySelectorAll<HTMLButtonElement>('.fortress-area-list button:not(:disabled)')),index=buttons.indexOf(current as HTMLButtonElement),next=Math.max(0,Math.min(buttons.length-1,index+(action==='up'?-1:1)));focus(buttons[next]);
   }
  };
  window.addEventListener('rpg:gamepad',handler);return()=>window.removeEventListener('rpg:gamepad',handler);
 },[active,busy,onParty]);
}
