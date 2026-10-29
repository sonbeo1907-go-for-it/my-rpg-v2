"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useGame } from "../runtime/game-context";
import { equippedExclusive } from "../core/blacksmith-state.js";
import { equipExclusive, unequipExclusive } from "../core/blacksmith.js";
import { resolveCharacter } from "../core/progression.js";
import { STAT_LABELS } from "../core/catalog.js";
import { EquipmentIcon, Modal, fmt, EmptyState } from "./ui";
import { Equipped } from "./equipped";
import { RulesDisclosure } from "./skill-details";

const stat = (item: any) => `${(STAT_LABELS as any)[item.statKey]} +${fmt(item.statValue)}`;

function ExclusivePicker({ characterId, onClose }: { characterId: string; onClose: () => void }) {
  const { campaign, content, transact, busy } = useGame();
  const current = equippedExclusive(campaign, content, characterId);
  const items = campaign.exclusiveGear.filter((item: any) => content.exclusiveGear[item.templateId].characterId === characterId);
  const [selected, setSelected] = useState(current?.templateId ?? items[0]?.templateId);
  const choices = useRef<HTMLDivElement>(null);
  const candidate = items.find((item: any) => item.templateId === selected) ?? items[0];
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const list = choices.current;
      const active = list?.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (!list || !active || list.scrollWidth <= list.clientWidth) return;
      const left = active.getBoundingClientRect().left - list.getBoundingClientRect().left + list.scrollLeft - (list.clientWidth - active.clientWidth) / 2;
      list.scrollTo({ left, behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [candidate?.templateId]);
  const template = candidate && content.exclusiveGear[candidate.templateId];
  const same = candidate?.templateId === current?.templateId;
  const before = resolveCharacter(content, campaign, characterId);
  const after = candidate ? resolveCharacter(content, {
    ...campaign, equippedExclusiveGear: { ...campaign.equippedExclusiveGear, [characterId]: candidate.templateId },
  }, characterId) : before;
  const changed = Object.keys(STAT_LABELS).filter(key => Math.abs(after.stats[key] - before.stats[key]) > .000001);
  async function confirm() {
    if (!candidate || same || busy) return;
    if (await transact(save => equipExclusive(save, content, characterId, candidate.templateId), "Đã trang bị Trấn Phái. Áp dụng từ trận kế tiếp.")) onClose();
  }
  return <Modal className="exclusive-picker" title={`Trấn Phái · ${content.characters[characterId].name}`} onClose={() => !busy && onClose()} footer={<>
    <button disabled={busy} onClick={onClose}>Hủy</button>
    <button className="gold" disabled={busy || !candidate || same} onClick={confirm}>{same ? "Đang trang bị" : current ? "Thay Trấn Phái" : "Trang bị Trấn Phái"}</button>
  </>}>
    <p className="exclusive-picker-hint">Chọn một món để xem nội tại và so sánh trước khi trang bị.</p>
    <div className="exclusive-picker-layout">
      <div className="exclusive-choices" aria-label="Trấn Phái đã sở hữu" ref={choices}>
        {items.map((item: any) => {
          const definition = content.exclusiveGear[item.templateId], equipped = current?.templateId === item.templateId;
          return <button key={item.templateId} className="exclusive-choice" aria-pressed={candidate?.templateId === item.templateId} disabled={busy} onClick={() => setSelected(item.templateId)}>
            <EquipmentIcon typeId="exclusive" compact/>
            <span className="exclusive-choice-copy"><strong>{definition.name}</strong><span>{stat(item)}</span><small>{equipped ? "Đang trang bị" : "Trong hành trang"}</small></span>
            {equipped && <Equipped ownerName={content.characters[characterId].name}/>}
          </button>;
        })}
      </div>
      <section className="exclusive-preview" aria-label="Xem trước Trấn Phái">
        {candidate && <>
          <div className="exclusive-preview-heading"><EquipmentIcon typeId="exclusive" compact/><div><span className="eyebrow">ĐANG XEM</span><h3>{template.name}</h3></div></div>
          <strong className="exclusive-stat-pill">{stat(candidate)}</strong>
          <div className="exclusive-passive"><span>Nội tại · {template.passive.name}</span><p>{template.passive.description}</p></div>
          <RulesDisclosure rules={template.passive.rules}/>
          <h4>Thay đổi chỉ số</h4>
          {changed.length ? <table className="exclusive-comparison"><thead><tr><th>Chỉ số</th><th>Hiện tại</th><th>Sau đổi</th><th>±</th></tr></thead><tbody>{changed.map(key => {
            const delta = after.stats[key] - before.stats[key];
            return <tr key={key} data-stat={key}><th>{(STAT_LABELS as any)[key]}</th><td>{fmt(before.stats[key])}</td><td>{fmt(after.stats[key])}</td><td className={delta > 0 ? "positive" : "negative"}>{delta > 0 ? "+" : ""}{fmt(delta)}</td></tr>;
          })}</tbody></table> : <p className="muted">{same ? "Bạn đang trang bị món này." : "Chỉ số không đổi. Nội tại sẽ thay đổi theo món được chọn."}</p>}
          <p className="exclusive-apply-note">Áp dụng từ trận kế tiếp.{current && " Món cũ được giữ trong hành trang."}</p>
        </>}
      </section>
    </div>
  </Modal>;
}

export function ExclusiveSlot({ characterId }: { characterId: string }) {
  const { campaign, content, transact, busy } = useGame();
  const [open, setOpen] = useState(false);
  const current = equippedExclusive(campaign, content, characterId);
  const items = campaign.exclusiveGear.filter((item: any) => content.exclusiveGear[item.templateId].characterId === characterId);
  const owned = campaign.unlockedCharacterIds.includes(characterId);
  return <section className={`exclusive-slot panel ${current ? "has-exclusive" : "is-empty"}`} aria-label="Ô Trấn Phái riêng">
    <header className="exclusive-slot-heading">
      <EquipmentIcon typeId="exclusive" compact/>
      <div><span className="eyebrow">TRẤN PHÁI · 1 Ô RIÊNG</span><h3>{current?.template.name ?? "Chưa trang bị Trấn Phái"}</h3></div>
      {current && <Equipped ownerName={content.characters[characterId].name}/>}
    </header>
    {current ? <>
      <strong className="exclusive-stat-pill">{stat(current)}</strong>
      <div className="exclusive-passive"><span>Nội tại · {current.template.passive.name}</span><p>{current.template.passive.description}</p></div>
      <RulesDisclosure rules={current.template.passive.rules}/>
    </> : <p>{items.length ? `Có ${items.length} Trấn Phái sẵn sàng. Chọn một món phù hợp với lối chơi.` : "Chưa sở hữu Trấn Phái cho nhân vật này. Tìm mẫu tại Thợ Rèn."}</p>}
    <p className="exclusive-slot-note">Ô riêng, không chiếm 3–6 ô trang bị thường.</p>
    <div className="exclusive-slot-actions">
      {items.length > 0 && <button className="gold" disabled={busy || !owned} onClick={() => setOpen(true)}>{current ? items.length > 1 ? "Đổi Trấn Phái" : "Xem Trấn Phái" : "Trang bị Trấn Phái"}</button>}
      {current && <button disabled={busy} onClick={() => transact(save => unequipExclusive(save, content, characterId), "Đã tháo Trấn Phái.")}>Tháo Trấn Phái</button>}
      <Link className="button exclusive-forge-link" href={`/blacksmith?tab=exclusive&character=${characterId}`}>Đến Thợ Rèn →</Link>
    </div>
    {open && <ExclusivePicker characterId={characterId} onClose={() => setOpen(false)}/>}
  </section>;
}

export function ExclusiveInventory({ filters, onChange }: { filters: any; onChange: (next: any) => void }) {
  const { campaign, content } = useGame();
  const owned = campaign.exclusiveGear.map((item: any) => ({ ...item, template: content.exclusiveGear[item.templateId] }));
  const owners = [...new Set(owned.map((item: any) => item.template.characterId))] as string[];
  const query = (filters.exclusiveQ ?? "").trim().toLocaleLowerCase("vi");
  const items = owned.filter((item: any) => (!filters.exclusiveCharacter || item.template.characterId === filters.exclusiveCharacter) && `${item.template.name} ${content.characters[item.template.characterId].name}`.toLocaleLowerCase("vi").includes(query));
  return <section aria-label="Trấn Phái trong túi đồ">
    <div className="filter-bar exclusive-inventory-filters"><label>Tìm Trấn Phái<input value={filters.exclusiveQ ?? ""} placeholder="Tên món hoặc nhân vật…" onChange={event => onChange({ ...filters, exclusiveQ: event.target.value })}/></label><label>Nhân vật<select value={filters.exclusiveCharacter ?? ""} onChange={event => onChange({ ...filters, exclusiveCharacter: event.target.value })}><option value="">Tất cả</option>{owners.map(id => <option key={id} value={id}>{content.characters[id].name}</option>)}</select></label></div>
    <div className="catalog-heading"><span>{items.length}/{owned.length} Trấn Phái</span><p>Mỗi nhân vật có một ô Trấn Phái riêng.</p></div>
    <div className="exclusive-inventory-grid">{items.map((item: any) => {
      const actor = content.characters[item.template.characterId], equipped = campaign.equippedExclusiveGear[actor.id] === item.templateId;
      return <Link className="exclusive-inventory-card panel" href={`/characters/${actor.id}/equipment`} key={item.templateId} aria-label={`Quản lý ${item.template.name} của ${actor.name}, ${equipped ? "đang trang bị" : "chưa trang bị"}`}>
        {equipped && <Equipped ownerName={actor.name}/>}<EquipmentIcon typeId="exclusive"/><span className="eyebrow">TRẤN PHÁI · {actor.name}</span><h3>{item.template.name}</h3><strong className="exclusive-stat-pill">{stat(item)}</strong><p>{item.template.passive.description}</p><span className="exclusive-inventory-state">{equipped ? "Đang trang bị" : "Chưa trang bị"}</span><span className="exclusive-manage">Quản lý trang bị →</span>
      </Link>;
    })}</div>
    {!items.length && <EmptyState>{owned.length ? "Không có Trấn Phái phù hợp bộ lọc." : "Chưa sở hữu Trấn Phái. Ghé Thợ Rèn để xem các mẫu và nhiệm vụ nhận thưởng."}</EmptyState>}
  </section>;
}
