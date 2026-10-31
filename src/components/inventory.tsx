"use client";
import {gearName} from '../core/gear-rules.js';
import {GearPagination,useGearPagination} from './gear-pagination';
import { useEffect, useState } from "react";
import { useGame } from "../runtime/game-context";
import { Equipped } from "./equipped";
import { gearCatalog, GEAR_NAMES, STAT_LABELS } from "../core/catalog.js";
import { resolveCharacter } from "../core/progression.js";
import {
  equipGear,
  unequipGear,
  gearLocation,
  equipmentSlots,
} from "../core/equipment.js";
import { gearSlotCapacity } from "../core/gear-slots.js";
import {
  EquipmentIcon,
  EmptyState,
  GearCard,
  GearFilters,
  PageHeader,
  ElementBadge,
  fmt,
  Icon,
} from "./ui";
import { useRouteFilters } from "./characters";
import Link from "next/link";
import { CurrencyAmount, ResourceIcon } from "./ui";
import { ExclusiveSlot, ExclusiveInventory } from "./exclusive-equipment";

export function InventoryPage() {
  const { content, campaign } = useGame();
  const [filters, setFilters] = useRouteFilters();
  const [selected, setSelected] = useState<string | null>(null);
  const tab=filters.tab==='items'?'items':filters.tab==='exclusive'?'exclusive':'equipment';
  const gear = gearCatalog(content, campaign, filters);
  const pager=useGearPagination(gear,filters,setFilters);
  const chosen = pager.items.find((item: any) => item.id === selected) ?? pager.items[0];
  return (
    <main className="page inventory-page">
      <PageHeader
        title="Túi đồ"
        subtitle={`${campaign.gear.length} trang bị · ${campaign.exclusiveGear.length} Trấn Phái`}
      ><Link className="button inventory-forge-link" href="/blacksmith">Thợ Rèn →</Link></PageHeader>
      <nav className="inventory-tabs shop-tabs" aria-label="Các mục Túi đồ"><button className={tab==='equipment'?'active':''} aria-current={tab==='equipment'?'page':undefined} onClick={()=>setFilters({...filters,tab:'equipment'})}>Trang bị</button><button className={tab==='exclusive'?'active':''} aria-current={tab==='exclusive'?'page':undefined} onClick={()=>setFilters({...filters,tab:'exclusive'})}>Trấn Phái</button><button className={tab==='items'?'active':''} aria-current={tab==='items'?'page':undefined} onClick={()=>setFilters({...filters,tab:'items'})}>Vật phẩm</button></nav>
      {tab==='exclusive'? <ExclusiveInventory filters={filters} onChange={setFilters}/>:tab==='items'? <section className="resource-grid" aria-label="Vật phẩm trong túi">{Object.values(content.items).map((item:any)=><article className={`panel resource-card currency-${item.kind}`} key={item.id} data-item={item.id}><ResourceIcon kind={item.kind}/><h2>{item.name}</h2><CurrencyAmount kind={item.kind} amount={campaign[item.field]}/><p>{item.description}</p></article>)}</section>: <>
      <GearFilters filters={filters} onChange={values=>setFilters({...values,page:"1"})} />
      <div className="inventory-layout">
        <section>
          <div className="catalog-heading">
            <span>{gear.length} trang bị</span>
            <p>Lựa chọn một món để xem chi tiết.</p>
          </div>
          <GearPagination pager={pager}/>
          <div className="gear-grid">
            {pager.items.map((item: any) => (
              <GearCard
                key={item.id}
                gear={item}
                selected={chosen?.id === item.id}
                onClick={() => setSelected(item.id)}
              />
            ))}
          </div>
          {!gear.length && (
            <EmptyState>
              {campaign.gear.length
                ? "Không có trang bị phù hợp bộ lọc."
                : "Hành trang còn trống. Chiêu mộ để nhận những trang bị đầu tiên."}
            </EmptyState>
          )}
        </section>
        <aside className="panel inventory-inspector">
          {chosen ? (
            <>
              <EquipmentIcon typeId={chosen.typeId}/>
              <span className="eyebrow">VẬT PHẨM TRONG HÀNH TRANG</span>
              <h2>{gearName(content,chosen)}</h2>
              {chosen.effectId&&<p>{content.gearEffects[chosen.effectId].description}</p>}
              <dl className="gear-values">
                {Object.entries(chosen.stats).map(([key, value]) => (
                  <div key={key}>
                    <dt>{(STAT_LABELS as any)[key]}</dt>
                    <dd>+{String(value)}</dd>
                  </div>
                ))}
              </dl>
              <p>
                {gearLocation(campaign, chosen.id)
                  ? `Đang ở ô ${gearLocation(campaign, chosen.id)!.slot + 1} của ${content.characters[gearLocation(campaign, chosen.id)!.characterId].name}.`
                  : "Chưa trang bị."}
              </p>
              <p className="muted">
                Mở Chi tiết nhân vật → Trang bị để lắp, tháo hoặc chuyển món
                này.
              </p>
            </>
          ) : (
            <EmptyState>Chọn trang bị để xem.</EmptyState>
          )}
        </aside>
      </div>
      </>}
    </main>
  );
}
export function EquipmentPage({ id }: { id: string }) {
  const { content, campaign, transact, busy } = useGame();
  const [filters, setFilters] = useRouteFilters();
  const [slot, setSlot] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    setSlot(0);
    setSelected(null);
  }, [id]);
  if (!Object.hasOwn(content.characters, id))
    return (
      <main className="page">
        <PageHeader title="Không tìm thấy nhân vật" back="/characters" />
      </main>
    );
  const actor = resolveCharacter(content, campaign, id);
  const owned = campaign.unlockedCharacterIds.includes(id);
  const capacity = gearSlotCapacity(campaign, content, id);
  const slots = equipmentSlots(campaign, content, id);
  const gear = gearCatalog(content, campaign, filters);
  const pager=useGearPagination(gear,filters,setFilters);
  const chosen = pager.items.find((item: any) => item.id === selected) ?? null;
  const current = campaign.gear.find((item: any) => item.id === slots[slot]);
  const location = chosen ? gearLocation(campaign, chosen.id) : null;
  const same = chosen && location?.characterId === id && location.slot === slot;
  let after = actor;
  let equipError="";
  if (owned)
    try {
      after = resolveCharacter(
        content,
        chosen && !same
          ? equipGear(campaign, content, id, chosen.id, slot)
          : unequipGear(campaign, content, id, slot),
        id,
      );
    } catch(error) {equipError=(error as Error).message;}
  const back = filters.back ? `?back=${encodeURIComponent(filters.back)}` : "";
  return (
    <main className="page">
      <PageHeader
        title={`Trang bị · ${actor.name}`}
        subtitle={`${capacity}/6 ô đã mở · Mỗi bản trùng mở thêm một ô`}
        back={`/characters/${id}${back}`}
      >
        <ElementBadge element={actor.element} />
      </PageHeader>
      <div className="equipment-layout">
        <section>
          <GearFilters filters={filters} onChange={values=>setFilters({...values,page:"1"})} />
          <GearPagination pager={pager}/>
          <div className="gear-grid">
            {pager.items.map((item: any) => (
              <GearCard
                key={item.id}
                gear={item}
                selected={selected === item.id}
                onClick={() => setSelected(item.id)}
              />
            ))}
          </div>
          {!gear.length && <EmptyState>Không có trang bị phù hợp.</EmptyState>}
        </section>
        <aside className="panel equipment-inspector">
          <ExclusiveSlot characterId={id}/>
          <span className="eyebrow">TRANG BỊ CỦA NHÂN VẬT</span>
          <h2>{actor.name}</h2>
          <div className="equipment-slots">
            {Array.from({ length: 6 }, (_, index) => {
              const piece = campaign.gear.find(
                (item: any) => item.id === slots[index],
              );
              const statLines = piece
                ? piece.effectId ? [content.gearEffects[piece.effectId].name] : Object.entries(piece.stats).map(
                    ([key, value]) => `${(STAT_LABELS as any)[key]} +${value}`,
                  )
                : [];
              return (
                <button
                  key={index}
                  aria-label={`Ô ${index + 1}: ${index >= capacity ? "Chưa mở" : piece ? `${(GEAR_NAMES as any)[piece.typeId]}, ${statLines.join(", ")}` : "Trống"}`}
                  disabled={!owned || index >= capacity || busy}
                  className={slot === index ? "selected" : ""}
                  onClick={() => setSlot(index)}
                >
                  {piece && <Equipped ownerName={actor.name} />}
                  {piece ? <EquipmentIcon typeId={piece.typeId} compact/> : <Icon name={index >= capacity ? "door" : "plus"}/>}
                  <strong className={piece ? "equipment-slot-stats" : ""}>
                    {piece
                      ? statLines.map((line) => <span key={line}>{line}</span>)
                      : `Ô ${index + 1}`}
                  </strong>
                  {!piece && (
                    <small>{index >= capacity ? "Chưa mở" : "Trống"}</small>
                  )}
                </button>
              );
            })}
          </div>
          <p>
            Ô {slot + 1}:{" "}
            {current ? (GEAR_NAMES as any)[current.typeId] : "Trống"}
          </p>
          {!owned && (
            <p className="warning">Cần mở khóa nhân vật để sử dụng trang bị.</p>
          )}
          <h3>
            {chosen
              ? (GEAR_NAMES as any)[chosen.typeId]
              : "So sánh khi tháo món đang dùng"}
          </h3>
          {chosen && location && !same && (
            <p className="warning">
              Chuyển từ ô {location.slot + 1} của{" "}
              {content.characters[location.characterId].name}. Món cũ ở ô này
              được trả vào túi.
            </p>
          )}
          {chosen?.effectId&&<p className="gear-effect-description">Trang bị: {content.gearEffects[chosen.effectId].description}</p>}
          {current?.effectId&&chosen?.id!==current.id&&<p className="muted">Tháo: {content.gearEffects[current.effectId].name}</p>}
          {equipError&&<p className="warning">{equipError}</p>}
          <table className="comparison">
            <thead>
              <tr>
                <th>Chỉ số</th>
                <th>Hiện tại</th>
                <th>Sau đổi</th>
                <th>±</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(STAT_LABELS).map(([key, label]) => {
                const delta = after.stats[key] - actor.stats[key];
                return (
                  <tr key={key}>
                    <th>{label}</th>
                    <td>{fmt(actor.stats[key])}</td>
                    <td>{fmt(after.stats[key])}</td>
                    <td
                      className={
                        delta > 0 ? "positive" : delta < 0 ? "negative" : ""
                      }
                    >
                      {delta > 0 ? "+" : ""}
                      {fmt(delta)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="stack-actions">
            <button
              className="gold"
              disabled={!owned || busy || !chosen || Boolean(same) || Boolean(equipError)}
              onClick={() =>
                chosen &&
                transact(
                  (current) => equipGear(current, content, id, chosen.id, slot),
                  "Đã trang bị và lưu. Áp dụng ở trận mới.",
                )
              }
            >
              {same
                ? "Đang trang bị"
                : location
                  ? "Chuyển trang bị"
                  : "Trang bị vào ô này"}
            </button>
            <button
              disabled={!owned || busy || !current}
              onClick={() =>
                transact(
                  (current) => unequipGear(current, content, id, slot),
                  "Đã tháo trang bị và lưu.",
                )
              }
            >
              Tháo món đang dùng
            </button>
          </div>
          <p className="muted">
            Chỉ số đã tính bonus đội hình và nội tại. Trận đang diễn ra giữ
            nguyên snapshot ban đầu.
          </p>
        </aside>
      </div>
    </main>
  );
}
