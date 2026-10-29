import { getContent } from "@/runtime/content";
export function generateStaticParams() { return Object.keys(getContent().characters).map(id => ({ id })); }
export const dynamicParams = false;
import { CharacterDetail } from "@/components/characters";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CharacterDetail id={id} />;
}
