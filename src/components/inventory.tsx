"use client";
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
  EmptyState,
  GearCard,
  GearFilters,
  PageHeader,
  ElementBadge,
  fmt,
  Icon,
} from "./ui";
import { useRouteFilters } from "./characters";

export function InventoryPage() {
  const { content, campaign } = useGame();
  const [filters, setFilters] = useRouteFilters();
  const [selected, setSelected] = useState<string | null>(null);
  const gear = gearCatalog(content, campaign, filters);
  const chosen = gear.find((item: any) => item.id === selected) ?? gear[0];
  return (
    <main className="page">
      <PageHeader
        title="Túi đồ"
        subtitle={`${campaign.gear.length} món trang bị trong hành trang`}
      />
      <GearFilters filters={filters} onChange={setFilters} />
      <div className="inventory-layout">
        <section>
          <div className="catalog-heading">
            <span>{gear.length} trang bị</span>
            <p>Lựa chọn một món để xem chi tiết.</p>
          </div>
          <div className="gear-grid">
            {gear.map((item: any) => (
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
              <Icon name="shield" />
              <span className="eyebrow">VẬT PHẨM TRONG HÀNH TRANG</span>
              <h2>{(GEAR_NAMES as any)[chosen.typeId]}</h2>
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
  const chosen = gear.find((item: any) => item.id === selected) ?? null;
  const current = campaign.gear.find((item: any) => item.id === slots[slot]);
  const location = chosen ? gearLocation(campaign, chosen.id) : null;
  const same = chosen && location?.characterId === id && location.slot === slot;
  let after = actor;
  if (owned)
    try {
      after = resolveCharacter(
        content,
        chosen && !same
          ? equipGear(campaign, content, id, chosen.id, slot)
          : unequipGear(campaign, content, id, slot),
        id,
      );
    } catch {}
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
          <GearFilters filters={filters} onChange={setFilters} />
          <div className="gear-grid">
            {gear.map((item: any) => (
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
          <span className="eyebrow">TRANG BỊ CỦA NHÂN VẬT</span>
          <h2>{actor.name}</h2>
          <div className="equipment-slots">
            {Array.from({ length: 6 }, (_, index) => {
              const piece = campaign.gear.find(
                (item: any) => item.id === slots[index],
              );
              const statLines = piece
                ? Object.entries(piece.stats).map(
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
                  <Icon
                    name={
                      index >= capacity
                        ? "door"
                        : slots[index]
                          ? "shield"
                          : "plus"
                    }
                  />
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
              disabled={!owned || busy || !chosen || Boolean(same)}
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
