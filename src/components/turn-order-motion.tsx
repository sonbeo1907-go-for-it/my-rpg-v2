"use client";
import {useLayoutEffect,useRef} from 'react';
type Snapshot={x:number;y:number;width:number;height:number;clone:HTMLElement};
// FLIP the actual resolved queue. Exiting clones never participate in layout or input.
export function useTurnOrderMotion(signature:string,group:string,extra:boolean){
 const root=useRef<HTMLDivElement>(null),previous=useRef(new Map<string,Snapshot>()),lastGroup=useRef<string|null>(null);
 const animations=useRef(new Set<Animation>()),frame=useRef(0);
 const capture=()=>{
  const node=root.current;if(!node)return new Map<string,Snapshot>();const box=node.getBoundingClientRect();
  return new Map(Array.from(node.querySelectorAll<HTMLElement>('[data-turn-key]')).map(el=>{const rect=el.getBoundingClientRect();return [el.dataset.turnKey!,{x:rect.left-box.left+node.scrollLeft,y:rect.top-box.top,width:rect.width,height:rect.height,clone:el.cloneNode(true) as HTMLElement}];}));
 };
 const stop=()=>{cancelAnimationFrame(frame.current);for(const a of animations.current)a.cancel();animations.current.clear();root.current?.querySelector('[data-turn-exits]')?.replaceChildren();};
 const play=(node:HTMLElement,keys:Keyframe[],options:KeyframeAnimationOptions,done?:()=>void)=>{
  const a=node.animate(keys,options);animations.current.add(a);a.onfinish=()=>{animations.current.delete(a);done?.();};return a;
 };
 useLayoutEffect(()=>{
  const node=root.current;if(!node)return;
  const old=previous.current,changed=lastGroup.current!==null&&lastGroup.current!==group,initial=lastGroup.current===null;
  // Previous positions are sampled while animations run, so rapid updates start from
  // the current visual location instead of an obsolete target position.
  stop();const next=capture(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  lastGroup.current=group;
  if(reduced||typeof node.animate!=='function'){previous.current=next;return;}
  const layer=node.querySelector<HTMLElement>('[data-turn-exits]')!;
  for(const [key,s]of old)if(changed||!next.has(key)){
   const ghost=s.clone;ghost.removeAttribute('data-turn-key');ghost.removeAttribute('data-turn-actor');ghost.removeAttribute('id');ghost.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
   ghost.dataset.turnExit=key;ghost.setAttribute('aria-hidden','true');ghost.setAttribute('tabindex','-1');ghost.setAttribute('inert','');
   Object.assign(ghost.style,{position:'absolute',left:s.x+'px',top:s.y+'px',width:s.width+'px',height:s.height+'px',margin:'0',pointerEvents:'none'});
   layer.append(ghost);play(ghost,[{opacity:.85,transform:'translateX(0)'},{opacity:0,transform:'translateX(-18px)'}],{duration:230,easing:'ease-out',fill:'forwards'},()=>ghost.remove());
  }
  const track=node.querySelector<HTMLElement>('.turn-chips')!;
  if(extra&&(changed||initial)){
   node.dataset.turnTransition='extra';
   play(track,[{transform:`translateX(-${Math.min(node.clientWidth,460)}px)`,opacity:0},{transform:'translateX(0)',opacity:1}],{duration:480,easing:'cubic-bezier(.22,.72,.24,1)'},()=>delete node.dataset.turnTransition);
  }else{
   delete node.dataset.turnTransition;
   for(const el of node.querySelectorAll<HTMLElement>('[data-turn-key]')){
    const key=el.dataset.turnKey!,s=next.get(key)!,from=changed?undefined:old.get(key);
    if(from){const x=from.x-s.x,y=from.y-s.y;if(Math.abs(x)>.5||Math.abs(y)>.5)play(el,[{transform:`translate(${x}px,${y}px)`},{transform:'translate(0,0)'}],{duration:380,easing:'cubic-bezier(.22,.72,.24,1)'});}
    else if(!initial)play(el,[{opacity:0,transform:'translateX(-24px)'},{opacity:1,transform:'translateX(0)'}],{duration:300,easing:'ease-out'});
   }
  }
  const sample=()=>{previous.current=capture();if(animations.current.size)frame.current=requestAnimationFrame(sample);};
  previous.current=next;frame.current=requestAnimationFrame(sample);
 },[signature,group,extra]);
 useLayoutEffect(()=>{
  const node=root.current;if(!node)return;const media=matchMedia('(prefers-reduced-motion: reduce)');
  const reset=()=>{stop();delete node.dataset.turnTransition;previous.current=capture();};
  media.addEventListener('change',reset);let width=node.clientWidth;
  const observer=new ResizeObserver(()=>{if(node.clientWidth!==width){width=node.clientWidth;reset();}});observer.observe(node);
  return()=>{observer.disconnect();media.removeEventListener('change',reset);stop();previous.current.clear();};
 },[]);
 return root;
}
