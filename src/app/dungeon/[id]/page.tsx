import { getContent } from "@/runtime/content";
export function generateStaticParams() { return Object.keys(getContent().dungeons).map(id => ({ id })); }
export const dynamicParams = false;
import { DungeonQuestPage } from "@/components/dungeons";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DungeonQuestPage id={id} />;
}
