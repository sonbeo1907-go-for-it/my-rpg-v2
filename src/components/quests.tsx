"use client";
import Link from "next/link";
import {firstClearRewardLabel} from "../core/first-clear-labels.js";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useGame } from "../runtime/game-context";
import { ELEMENT_NAMES, DAMAGE_TYPE_NAMES } from "../core/content.js";
import { EmptyState, ElementBadge, Icon, PageHeader, Modal } from "./ui";
import { useSettings } from "../runtime/settings-context";
import { useRouteFilters } from "./characters";
import { STAT_LABELS } from "../core/catalog.js";
import {victoryRewardPreview} from '../core/quest-rewards.js';
import { encounterTier, victoryCoinReward } from "../core/economy.js";
import { QuestLayout, QuestIllustration } from "./quest-layout";
import { questCatalog, questCategory, SINISTER_UNLOCK_FLAG, bountyUnlocked } from "../core/quest-catalog.js";
export function rewardNames(content: any, encounter: any) {
  return (encounter.firstClearRewards ?? [])
    .map((reward: any) =>
      ["currency","exclusive_recipe"].includes(reward.type)?firstClearRewardLabel(content,reward):reward.type === "gear_recipe" ? `Công thức ${content.gearEffects[reward.recipeId].name}` : reward.type === "upgrade"
        ? content.upgrades[reward.upgradeId].name
        : reward.type === "exclusive" ? `${content.exclusiveGear[reward.templateId].name} (${(STAT_LABELS as any)[content.exclusiveGear[reward.templateId].source.statKey]} +${content.exclusiveGear[reward.templateId].source.statValue})`
        : `${reward.type === "duplicate" ? "Bản trùng " : ""}${content.characters[reward.characterId].name}`,
    )
    .join(" · ");
}
export function QuestPage() {
  const { preferences } = useSettings();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const { content, campaign, battle, busy, startBattle } = useGame();
  const router = useRouter();
  const [filters, setFilters] = useRouteFilters();
  const tab = questCategory(filters);
  const sinisterLocked = tab === "sinister" && !campaign.storyFlags.includes(SINISTER_UNLOCK_FLAG);
  const bountyLocked=tab==="bounty"&&!bountyUnlocked(campaign);
  const encounters: any[] = questCatalog(content, campaign, filters);
  const selected =
    encounters.find((encounter) => encounter.id === filters.selected) ??
    encounters[0];
  const list = useRef<HTMLDivElement>(null);
  const tabMemory = useRef<Record<string, Record<string, string>>>({});
  const scrollKey = `quest-list-scroll:${tab}`;
  function changeTab(next: string) {
    if (next === tab) return;
    tabMemory.current[tab] = { ...filters };
    setFilters({ ...(tabMemory.current[next] ?? {}), tab: next });
  }
  useEffect(() => setConfirmId(null), [tab, selected?.id]);
  useEffect(() => {
    try {
      if (list.current)
        list.current.scrollTop = Number(
          sessionStorage.getItem(scrollKey) ?? 0,
        );
    } catch {}
  }, [scrollKey]);
  return (
    <main className={`quest-page quest-categories quest-category-${tab}`}>
      <PageHeader
        title="Bảng nhiệm vụ"
        subtitle="Chọn một lời thách thức, viết tiếp một trang hành trình"
      />
      {battle && (
        <Link href="/battle" className="resume-link">
          {battle.outcome
            ? "Xem kết quả trận gần nhất"
            : "Tiếp tục trận đang diễn ra"}{" "}
          →
        </Link>
      )}
      <QuestLayout>
        <QuestIllustration
          art={tab === "bounty" ? "/art/quest-bounty.svg" : tab === "sinister" ? "/art/quest-sinister.svg" : "/art/quest-extermination.svg"}
          header={
            <nav className="quest-category-tabs" aria-label="Danh mục nhiệm vụ">
              <button className={tab === "extermination" ? "active" : ""} aria-current={tab === "extermination" ? "page" : undefined} onClick={() => changeTab("extermination")}>
                <Icon name="sword" /> Thảo phạt
              </button>
              <button className={tab === "sinister" ? "active" : ""} aria-current={tab === "sinister" ? "page" : undefined} onClick={() => changeTab("sinister")}>
                <Icon name="skull" /> Hiểm Ác
              </button>
              <button className={tab === "bounty" ? "active" : ""} aria-current={tab === "bounty" ? "page" : undefined} onClick={() => changeTab("bounty")}><Icon name="scroll" /> Truy Nã</button>
            </nav>
          }
        >
          <span className="eyebrow">{tab === "bounty" ? "NHỮNG KHẾ ƯỚC TRÊN BẢNG TRUY NÃ" : tab === "sinister" ? "SAU CÁNH CỬA KHÔNG ÁNH SÁNG" : "NHỮNG NẺO ĐƯỜNG PHƯƠNG BẮC"}</span>
          <h2>{selected?.name ?? (bountyLocked ? "Lời mời của Hội Thợ Săn" : sinisterLocked ? "Cánh cửa chưa thức giấc" : "Những miền đất chưa biết")}</h2>
          <p>{selected?.description ?? (bountyLocked ? "Khép lại ba câu chuyện lữ hành để nhận những khế ước mới." : sinisterLocked ? "Những hiểm họa đang chờ một lời thách thức." : "Chưa có lời thách thức phù hợp với tìm kiếm này.")}</p>
          {selected && <div className="quest-rewards">
            <Icon name="coin" />
            <span>
              {victoryRewardPreview(content, selected?.id)} khi chiến thắng
            </span>
          </div>}
          {selected?.firstClearRewards?.length > 0 && (
            <p className="first-clear">
              {campaign.claimedFirstClearRewards.includes(selected.id)
                ? "✓ Đã nhận thưởng lần đầu"
                : `Thưởng lần đầu: ${rewardNames(content, selected)}`}
            </p>
          )}
        </QuestIllustration>
        <section className="quest-board">
          {sinisterLocked || bountyLocked ? (
            <div className="quest-locked" role="status">
              <span className="quest-locked-seal"><Icon name="door" /></span>
              <span className="eyebrow">CHƯA KHAI MỞ</span>
              <h2>{bountyLocked?"Chưa nhận khế ước truy nã":"Hiểm họa chưa khai mở"}</h2>
              {bountyLocked?<><p>Hoàn thành toàn bộ câu chuyện lữ hành của Iris, Takeshi và Fiona để mở Truy Nã.</p><Link href="/stories">Đến Câu Chuyện Lữ Hành →</Link></>:<p>Điều kiện mở khóa sẽ được bổ sung trong bản cập nhật sau.</p>}
            </div>
          ) : <>
          <div className="filter-bar">
            <label>
              Tìm nhiệm vụ
              <input
                placeholder="Tên nhiệm vụ…"
                value={filters.q ?? ""}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              />
            </label>
            {tab === "extermination" && <label>
              Loại nhiệm vụ
              <select
                aria-label="Loại nhiệm vụ"
                value={['normal', 'boss'].includes(filters.type) ? filters.type : ""}
                onChange={(e) =>
                  setFilters({ ...filters, type: e.target.value })
                }
              >
                <option value="">Tất cả</option>
                <option value="normal">Thường</option>
                <option value="boss">Thử thách</option>
              </select>
            </label>}
          </div>
          <div
            className="quest-list"
            ref={list}
            onScroll={() => {
              if (list.current)
                sessionStorage.setItem(
                  scrollKey,
                  String(list.current.scrollTop),
                );
            }}
          >
            {encounters.map((encounter) => (
              <button
                className={`quest-card ${selected?.id === encounter.id ? "selected" : ""}`}
                data-encounter-id={encounter.id}
                data-coin-reward={victoryCoinReward(content, encounter.id)}
                key={encounter.id}
                onClick={() =>
                  setFilters({ ...filters, selected: encounter.id })
                }
              >
                <span className="quest-card-icon">
                  <Icon
                    name={
                      encounterTier(encounter) === "super"
                        ? "skull"
                        : encounterTier(encounter) === "normal"
                          ? "scroll"
                          : "sword"
                    }
                  />
                </span>
                <span>
                  <strong>{encounter.name}</strong>
                  <small>
                    {encounter.enemies.length} đối thủ · {victoryRewardPreview(content, encounter.id)}
                    {campaign.claimedFirstClearRewards.includes(encounter.id)
                      ? " · Đã nhận thưởng lần đầu"
                      : encounter.firstClearRewards?.length
                        ? " · Có thưởng lần đầu"
                        : ""}
                  </small>
                </span>
                <span aria-hidden="true">›</span>
              </button>
            ))}
            {!encounters.length && (
              <EmptyState>Không tìm thấy nhiệm vụ phù hợp.</EmptyState>
            )}
          </div>
          {selected && (
            <div className="quest-details">
              <h3>Đối thủ</h3>
              <div className="quest-enemies">
                {selected.enemies.map((id: string, index: number) => {
                  const enemy = content.enemies[id];
                  return (
                    <div key={`${id}-${index}`}>
                      <ElementBadge element={enemy.element} />
                      <strong>{enemy.name}</strong>
                      <small>
                        HP {enemy.stats.maxHp} · Yếu:{" "}
                        {[...(enemy.weaknesses??[]).map((element:string)=>(ELEMENT_NAMES as any)[element]),...(enemy.damageTypeWeaknesses??[]).map((type:string)=>(DAMAGE_TYPE_NAMES as any)[type])].join(", ") ||
                          "Không có"}
                      </small>
                    </div>
                  );
                })}
              </div>
              <button
                className="gold embark"
                disabled={busy}
                onClick={() => {
                  if (preferences.controlMode === "gamepad")
                    setConfirmId(selected.id);
                  else if (startBattle(selected.id)) router.push("/battle");
                }}
              >
                <Icon name="sword" />
                Xuất chiến<span>→</span>
              </button>
            </div>
          )}
          </>}
        </section>
      </QuestLayout>
      {confirmId && (
        <Modal
          title="Sẵn sàng xuất chiến?"
          onClose={() => setConfirmId(null)}
          footer={
            <>
              <button onClick={() => setConfirmId(null)}>Hủy</button>
              <button
                className="gold"
                disabled={busy}
                onClick={() => {
                  const id = confirmId;
                  setConfirmId(null);
                  if (startBattle(id)) router.push("/battle");
                }}
              >
                Xuất chiến
              </button>
            </>
          }
        >
          <p>{content.encounters[confirmId].name}</p>
          <p>Đội hình hiện tại sẽ bắt đầu một trận mới.</p>
        </Modal>
      )}
    </main>
  );
}
