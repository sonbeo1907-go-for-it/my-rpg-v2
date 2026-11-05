"use client";
import Link from 'next/link';
import {usePathname,useSearchParams} from 'next/navigation';
import type {ReactNode} from 'react';
import {partyLinkHref} from '../ui/party-navigation.js';

export function PartyLink({children,className}:{children:ReactNode;className?:string}){
 const path=usePathname(),search=useSearchParams().toString();
 return <Link className={className} href={partyLinkHref(path+(search?'?'+search:''))}>{children}</Link>;
}
