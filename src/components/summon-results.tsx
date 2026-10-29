"use client";
import Link from "next/link";
import { useState } from "react";
import { useGame } from "../runtime/game-context";
import { SummonCardFront } from "./summon-cards";
import { useSummonBatch } from "./summon-reveal";
import { EmptyState, PageHeader, Modal, StatGrid, RoleIcon } from "./ui";
import { GEAR_NAMES, STAT_LABELS } from "../core/catalog.js";
import { resolveCharacter } from "../core/progression.js";

export function SummonResultsPage() {
  const batch = useSummonBatch();
  const { content, campaign } = useGame();
  const [selected, setSelected] = useState<any>(null);
  if (!batch)
    return (
      <main className="page">
        <PageHeader title="Kết quả Chiêu Mộ" back="/recruitment" />
        <EmptyState>Chưa có kết quả cho lượt này.</EmptyState>
        <Link className="button gold" href="/recruitment">
          Về Chiêu Mộ
        </Link>
      </main>
    );
  const characters = batch.results.filter(
    (item: any) => item.kind === "character",
  );
  const gearCount = batch.results.length - characters.length;
  const newCount = characters.filter((item: any) => !item.duplicate).length;
  const shards = characters.reduce(
    (sum: number, item: any) => sum + item.shards,
    0,
  );
  return (
    <main className="summon-results-page">
      <PageHeader
        title="Những hồi đáp từ Prisma"
        subtitle={`${content.banners[batch.bannerId].name} · ${batch.results.length} kết quả đã lưu`}
        back="/recruitment"
      />
      <div className="results-intro">
        <span className="eyebrow">MỖI CUỘC GẶP ĐỀU ĐỂ LẠI MỘT DẤU ẤN</span>
        <p>Những món quà và người đồng hành đã gia nhập hành trình.</p>
      </div>
      <div
        className={`summon-result-scroll ${batch.results.length === 1 ? "single" : ""}`}
      >
        <div
          className="summon-result-grid"
          style={{
            gridTemplateColumns: `repeat(${batch.results.length}, minmax(0, 1fr))`,
          }}
        >
          {batch.results.map((result: any, index: number) => (
            <button
              className="summon-result summon-result-panel"
              key={index}
              style={{ animationDelay: `${index * 45}ms` }}
              onClick={() => setSelected(result)}
              aria-label={
                result.kind === "character"
                  ? `Xem kết quả ${content.characters[result.characterId].name}`
                  : `Xem kết quả ${(GEAR_NAMES as any)[result.gear.typeId]} ${index + 1}`
              }
            >
              <SummonCardFront result={result} compact />
            </button>
          ))}
        </div>
      </div>
      <div className="summon-result-summary">
        <span>{gearCount} trang bị</span>
        <span>
          {characters.length} nhân vật · {newCount} đồng đội mới
        </span>
        <span className="pure-prisma-text">+{shards} Pure Prisma</span>
        {characters.some((item: any) => item.guaranteed) && (
          <strong>Đã kích hoạt bảo hiểm nhân vật</strong>
        )}
      </div>
      <footer className="summon-result-actions">
        <Link
          className="button"
          href={`/recruitment/reveal?draw=${batch.id}&card=0`}
        >
          Xem lại reveal
        </Link>
        <span>Phần thưởng đã được lưu · Xem lại không tiêu coin</span>
        <Link className="button gold" href="/recruitment">
          Về Chiêu Mộ →
        </Link>
      </footer>
      {selected && (
        <Modal
          title={
            selected.kind === "character"
              ? content.characters[selected.characterId].name
              : (GEAR_NAMES as any)[selected.gear.typeId]
          }
          onClose={() => setSelected(null)}
          footer={
            <button className="gold" onClick={() => setSelected(null)}>
              Đóng
            </button>
          }
        >
          {selected.kind === "character" ? (
            <div className="result-detail">
              <RoleIcon
                roleGroup={content.characters[selected.characterId].roleGroup}
              />
              <p>{content.characters[selected.characterId].description}</p>
              <StatGrid
                actor={resolveCharacter(
                  content,
                  campaign,
                  selected.characterId,
                )}
              />
              <p>
                {selected.duplicate
                  ? `Bản trùng · +${selected.shards} Pure Prisma`
                  : "Đồng đội mới đã mở khóa"}{" "}
                · {selected.gearSlots}/6 ô trang bị
              </p>
              {selected.guaranteed && (
                <p className="warning">Nhận từ bảo hiểm lượt 50.</p>
              )}
            </div>
          ) : (
            <div className="result-detail">
              <dl className="gear-values">
                {Object.entries(selected.gear.stats).map(([key, value]) => (
                  <div key={key}>
                    <dt>{(STAT_LABELS as any)[key]}</dt>
                    <dd>+{String(value)}</dd>
                  </div>
                ))}
              </dl>
              <p>
                Mã trang bị #{selected.gear.id.slice(5)} · Đã nằm trong túi đồ.
              </p>
            </div>
          )}
        </Modal>
      )}
    </main>
  );
}
