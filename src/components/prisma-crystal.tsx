"use client";
import { useId } from "react";

// Shared geometry for the recruitment awakening and the game's wordmark.
export function PrismaCrystal({className="awakening-crystal",isolated=false}:{className?:string;isolated?:boolean}) {
  const id=`prisma-${useId().replace(/[^a-zA-Z0-9_-]/g,"")}`;
  return <svg className={className} viewBox={isolated?"810 300 300 470":"0 0 1920 1080"} preserveAspectRatio={isolated?"xMidYMid meet":"xMidYMid slice"} aria-hidden="true" focusable="false">
    {isolated&&<defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f3dcff"/><stop offset=".3" stopColor="#b48aef"/><stop offset=".68" stopColor="#8050bc"/><stop offset="1" stopColor="#dba8ff"/></linearGradient></defs>}
    <polygon points="960,340 1070,500 960,740 850,500" {...(isolated?{fill:`url(#${id})`,stroke:"#f8efff",strokeWidth:7}: {})}/>
    {isolated&&<><path d="m960 340-41 160 41 58z" fill="#fff" opacity=".32"/><path d="m960 558 110-58-110 240z" fill="#532083" opacity=".48"/><path d="m850 500 69 0 41 240z" fill="#d2b6ff" opacity=".35"/></>}
    <path d="m960 340 0 400m-110-240 110 58 110-58M850 500h220" fill="none" {...(isolated?{stroke:"#fff2ff",strokeWidth:3,opacity:.85}:{})}/>
    {isolated&&<path d="m1047 371 5 18 18 5-18 5-5 18-5-18-18-5 18-5z" fill="#fff8ff"/>}
  </svg>;
}
