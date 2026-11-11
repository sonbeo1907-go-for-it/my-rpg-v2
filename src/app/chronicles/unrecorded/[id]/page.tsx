import {UnrecordedTrialPage} from '@/components/unrecorded-trials';
import {getContent} from '@/runtime/content';
export const dynamicParams=false;
export function generateStaticParams(){return Object.keys(getContent().trials).map(id=>({id}));}
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <UnrecordedTrialPage id={id}/>;}
