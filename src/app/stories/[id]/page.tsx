import { TravelerStoryPage } from "@/components/traveler-stories";
import { getContent } from "@/runtime/content";
export const dynamicParams=false;
export function generateStaticParams(){return Object.keys(getContent().travelerStories).map(id=>({id}));}
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <TravelerStoryPage id={id}/>;}
