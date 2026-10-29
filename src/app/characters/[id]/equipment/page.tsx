import { getContent } from "@/runtime/content";
export function generateStaticParams() { return Object.keys(getContent().characters).map(id => ({ id })); }
export const dynamicParams = false;
import { EquipmentPage } from "@/components/inventory";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EquipmentPage id={id} />;
}
