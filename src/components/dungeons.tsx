"use client";
import {DungeonReward,XpCapWarning} from "./dungeon-rewards";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useGame } from "../runtime/game-context";
import {
  dungeonDailyState,
  nextDungeonReset,
  dungeonDay,
} from "../core/dungeon-rules.js";
import { validDungeonPreview, dungeonQuestPool } from "../core/dungeon.js";
import { enemyScaleSummary } from "../ui/dungeon-presentation.js";
import { useRouteFilters } from "./characters";
import { CurrencyAmount, EmptyState, Icon, Modal, PageHeader, fmt } from "./ui";
import { QuestLayout, QuestIllustration } from "./quest-layout";
import { DungeonRooms } from "./dungeon-rooms";

function useDungeonClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      const date = new Date();
      setNow(date);
      clearTimeout(timer);
      timer = setTimeout(
        refresh,
        Math.min(60_000-date.getTime()%60_000+100,nextDungeonReset(date).getTime() - date.getTime() + 100),
      );
    };
    const visible = () => {
      if (!document.hidden) refresh();
    };
    refresh();
    document.addEventListener("visibilitychange", visible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);
  return now;
}
export function DungeonSelectionPage() {
  const { content, campaign, battle } = useGame();
  const now = useDungeonClock();
  return (
    <main className="page dungeon-selection">
      <PageHeader
        title="Khám Phá Hầm Ngục"
        subtitle="Chọn một lối đi, thử sức qua những đợt quái liên tiếp"
      />
      {battle?.dungeon && !battle.outcome && (
        <Link className="resume-link" href="/battle">
          Tiếp tục thám hiểm · {battle.dungeon.stageLabel ?? "Đợt"}{" "}
          {battle.dungeon.waveIndex + 1}/{battle.dungeon.totalWaves} →
        </Link>
      )}
      <div className="dungeon-choices">
        {Object.values(content.dungeons).map((item: any) => {
          const daily:any = dungeonDailyState(campaign, content, item.id, now);
          const body = (
            <>
              <img src={item.art} alt="" />
              <div className="dungeon-choice-shade" />
              <div className="dungeon-choice-content">
                <span className="dungeon-choice-icon">
                  <Icon name={item.icon} />
                </span>
                <span className="eyebrow">
                  {item.id === "gold_mine"
                    ? "KHO BÁU DƯỚI LÒNG ĐẤT"
                    : item.id === "dangerous"
                      ? "THỬ THÁCH NƠI VỰC SÂU"
                      : "THÁM HIỂM HẰNG NGÀY"}
                </span>
                <h2>{item.name}</h2>
                <p>{item.description}</p>
                <div className="dungeon-choice-limit">
                  {daily.limit
                    ? `${daily.remaining}/${daily.limit} ${daily.recharge?"lượt tích trữ":"lượt nhận thưởng hôm nay"}`
                    : "Thám hiểm"}
                </div>
                <strong>{item.closed ? "Tạm đóng" : "Chọn mức độ →"}</strong>
              </div>
            </>
          );
          return item.closed ? (
            <button className="dungeon-choice closed" disabled key={item.id}>
              {body}
            </button>
          ) : (
            <Link
              className="dungeon-choice"
              href={`/dungeon/${item.id}`}
              key={item.id}
            >
              {body}
            </Link>
          );
        })}
      </div>
      <p className="page-note">Rèn Luyện hồi 3 lượt lúc 00:00 / 08:00 / 16:00, tối đa 9 lượt. Thẻ Quét chỉ dùng cho mức hầm ngục đã chiến thắng.</p>
      <p className="page-note">
        Mỏ Vàng, Hiểm Trở và Phá Giới đặt lại lúc 00:00 giờ Việt Nam. Mỏ vàng dùng chung 3 lượt giữa
        các mức độ.
      </p>
    </main>
  );
}
export function DungeonQuestPage({ id }: { id: string }) {
  const {
    content,
    campaign,
    battle,
    busy,
    startDungeon,
    prepareDungeonPreview,
    activeProfile,
    sweepDungeon,progressionLocked,
  } = useGame();
  const router = useRouter();
  const now = useDungeonClock();
  const [filters, setFilters] = useRouteFilters();
  const [confirm, setConfirm] = useState(false);
  const [entryMethod,setEntryMethod]=useState<'battle'|'sweep'>('battle');
  const [preview, setPreview] = useState<any>(null);
  const [previewError, setPreviewError] = useState("");
  const definition = Object.hasOwn(content.dungeons, id)
    ? content.dungeons[id]
    : null;
  const selected =
    definition?.difficulties.find(
      (item: any) => item.id === filters.selected,
    ) ?? definition?.difficulties[0];
  const scoutingDay = dungeonDay(now);
  useEffect(() => {
    setConfirm(false);setEntryMethod('battle');
    setPreview(null);
    setPreviewError("");
    if (!definition?.revealRooms || !selected?.enabled) return;
    try {
      setPreview({
        ...prepareDungeonPreview(id, selected.id, now),
        profileId: activeProfile?.id,
      });
    } catch (error) {
      setPreviewError(String((error as Error).message ?? error));
    }
    // The provider function uses refs; selecting a day/profile/level is what refreshes scouting.
  }, [id, selected?.id, scoutingDay, activeProfile?.id, content]);
  if (!definition)
    return (
      <main className="page">
        <PageHeader title="Không tìm thấy hầm ngục" back="/dungeon" />
        <EmptyState>Con đường này chưa xuất hiện trên bản đồ.</EmptyState>
      </main>
    );
  if (definition.closed)
    return (
      <main className="page">
        <PageHeader title={definition.name} back="/dungeon" />
        <EmptyState>Hầm ngục này đang tạm đóng.</EmptyState>
      </main>
    );

  const daily:any = dungeonDailyState(campaign, content, id, now);
  const pool = dungeonQuestPool(content, id);
  const previewReady =
    !definition.revealRooms ||
    (preview?.profileId === activeProfile?.id &&
      validDungeonPreview(content, preview, id, selected.id, now));
  const canStart =
    selected.enabled && !busy && (daily.remaining ?? 0) > 0 && previewReady;
  const stageLabel = definition.stageLabel ?? "Đợt";
  const reward=(item:any)=><DungeonReward reward={item.reward}/>;
  const cleared=campaign.dungeonClearedDifficulties?.[id]?.includes(selected.id);
  const canSweep=!busy&&!progressionLocked&&daily.remaining>0&&campaign.sweepTickets>0&&cleared;
  const recovery=daily.recharge?`Hồi 3 lượt lúc ${new Intl.DateTimeFormat("vi-VN",{hour:"2-digit",minute:"2-digit",timeZone:"Asia/Ho_Chi_Minh"}).format(daily.nextRecovery)} · tối đa 9 lượt`:"Đặt lại lượt lúc 00:00 giờ Việt Nam";
  return (
    <main className="quest-page dungeon-quest">
      <PageHeader
        title={definition.name}
        subtitle={`${daily.remaining}/${daily.limit} ${daily.recharge?"lượt tích trữ":"lượt nhận thưởng còn lại hôm nay"}`}
        back="/dungeon"
      />
      {battle?.dungeon && (
        <Link className="resume-link" href="/battle">
          {battle.outcome
            ? "Xem chuyến thám hiểm gần nhất"
            : "Tiếp tục chuyến thám hiểm đang diễn ra"}{" "}
          →
        </Link>
      )}
      <QuestLayout>
        <QuestIllustration art={definition.art}>
          <span className="eyebrow">
            {selected.enabled
              ? "HÀNH TRÌNH QUA NHỮNG ĐỢT QUÁI"
              : "ĐƯỜNG ĐI CHƯA KHAI MỞ"}
          </span>
          <h2>
            {definition.name} · {selected.name}
          </h2>
          <p>
            {selected.enabled
              ? `${selected.waves} ${stageLabel.toLocaleLowerCase("vi")}, chọn ngẫu nhiên từ ${definition.encounterTier === "boss" ? "nhóm trùm" : "Quest thường"}, không trùng trong cùng chuyến. Chỉ số quái: ${selected.enemyLevel?"Level "+selected.enemyLevel+" · "+enemyScaleSummary(selected.enemyScale):enemyScaleSummary(selected.enemyScale)}.`
              : "Mức độ này sẽ được bổ sung ở hành trình sau."}
          </p>
          <div className="dungeon-reward-preview">{reward(selected)}</div>
          <XpCapWarning amount={selected.reward.characterXp??0}/>
          <p>
            {selected.enabled
              ? "Giữ HP, MP, khiên, buff/debuff, hồi chiêu và tài nguyên giữa các đợt. Chỉ nhận thưởng khi vượt hết chuỗi."
              : "Phần thưởng dự kiến khi hoàn thành."}
          </p>
        </QuestIllustration>
        <section className="quest-board">
          <div className="dungeon-board-heading">
            <span className="eyebrow">CHỌN MỨC ĐỘ</span>
            <p>{recovery}</p>
          </div>
          <div className="quest-list dungeon-difficulty-list">
            {definition.difficulties.map((item: any) => (
              <button
                key={item.id}
                className={`quest-card ${selected.id === item.id ? "selected" : ""} ${item.enabled ? "" : "unreleased"}`}
                onClick={() => setFilters({ ...filters, selected: item.id })}
              >
                <span className="quest-card-icon">
                  <Icon name={item.enabled ? "door" : "shield"} />
                </span>
                <span>
                  <strong>{item.name}</strong>
                  <small>
                    {item.enabled
                      ? `${item.waves} ${stageLabel.toLocaleLowerCase("vi")} · ${item.enemyLevel?"Level "+item.enemyLevel+" · "+enemyScaleSummary(item.enemyScale):enemyScaleSummary(item.enemyScale)}`
                      : "Chưa mở"}
                  </small>
                </span>
                {reward(item)}
              </button>
            ))}
          </div>
          <div className="quest-details">
            <h3>{selected.enabled ? "Chuẩn bị thám hiểm" : "Chưa mở"}</h3>
            {selected.enabled ? (
              <>
                <p className="dungeon-rules">
                  Nguồn đối thủ: {pool.length}{" "}
                  {definition.encounterTier === "boss"
                    ? "nhiệm vụ trùm. Danh sách phòng được công khai trước khi xuất phát."
                    : "Quest thường, gồm thú rừng, quỷ lùn và các sinh vật hoang dã."}
                </p>
                {definition.revealRooms &&
                  (previewReady ? (
                    <p className="dungeon-rules">
                      Xem đối thủ, chỉ số và điểm yếu ngay trong bước xác nhận
                      xuất phát.
                    </p>
                  ) : (
                    <p
                      className={previewError ? "warning" : "muted"}
                      role="status"
                    >
                      {previewError || "Đang trinh sát các phòng…"}
                    </p>
                  ))}
                <ul className="dungeon-rules">
                  <li>
                    Đội hình và trang bị được giữ cố định trong chuyến đi.
                  </li>
                  <li>Không hồi đầy hoặc hồi sinh khi sang đợt.</li>
                  <li>
                    Không nhận Coin hay thưởng Quest lần đầu ở từng{" "}
                    {stageLabel.toLocaleLowerCase("vi")}.
                  </li>
                  <li>
                    Hoàn thành chuỗi mới trừ 1 lượt và nhận {reward(selected)}.
                  </li>
                  <li>Thất bại hoặc bỏ dở không mất lượt nhận thưởng.</li>
                </ul>
                <p className="dungeon-session-note">
                  Chuyến đang chơi chỉ giữ trong phiên hiện tại. Tải lại trang
                  sẽ kết thúc chuyến; lượt và thưởng đã nhận vẫn được lưu.
                </p>
                {daily.remaining === 0 && (
                  <p className="warning" role="status">
                    Đã hết lượt nhận thưởng hôm nay. {daily.recharge?"Mỗi mốc 00:00 / 08:00 / 16:00 hồi 3 lượt.":"Hãy trở lại sau 00:00 giờ Việt Nam."}
                  </p>
                )}
              </>
            ) : (
              <p className="dungeon-rules">
                Bạn có thể xem trước phần thưởng. Chưa thể vào mức độ này.
              </p>
            )}
            <button
              className="gold embark"
              disabled={!canStart}
              onClick={() => {setEntryMethod('battle');setConfirm(true);}}
            >
              <Icon name="door" />
              {selected.enabled ? "Bắt đầu thám hiểm" : "Chưa mở"}
            </button>

          </div>
        </section>
      </QuestLayout>

      {confirm && (
        <Modal
          className={definition.revealRooms ? "dungeon-scouting-modal" : ""}
          title={`Vào ${definition.name} — ${selected.name}?`}
          onClose={() => setConfirm(false)}
          footer={
            <>
              {definition.revealRooms && (
                <Link
                  className="button scouting-party-link"
                  href={`/party?fromDungeon=${id}&difficulty=${selected.id}`}
                >
                  <Icon name="party" /> Chỉnh đội hình
                </Link>
              )}
              <button onClick={() => setConfirm(false)}>Hủy</button>
              <button
                className="gold"
                disabled={entryMethod==='sweep'?!canSweep:!canStart}
                onClick={async () => {
                  if(entryMethod==='sweep'){if(await sweepDungeon(id,selected.id))setConfirm(false);}
                  else {setConfirm(false);if(startDungeon(id,selected.id))router.push('/battle');}
                }}
              >
                {entryMethod==='sweep'?'Xác nhận Quét · 1 Thẻ':'Bắt đầu thám hiểm'}
              </button>
            </>
          }
        >
          <section className="dungeon-entry-method" aria-label="Cách vào hầm ngục"><div className="result-section-title"><h3>Cách xuất phát</h3><CurrencyAmount kind="ticket" amount={campaign.sweepTickets}/></div><div className="entry-method-options"><button className={entryMethod==='battle'?'active':''} aria-pressed={entryMethod==='battle'} onClick={()=>setEntryMethod('battle')}>Đánh trực tiếp</button><button className="sweep-button" aria-pressed={entryMethod==='sweep'} disabled={!canSweep} onClick={()=>setEntryMethod('sweep')}>Dùng Thẻ Quét</button></div><p>{entryMethod==='sweep'?'Tiêu 1 Thẻ Quét và 1 lượt nhận thưởng cho cả chuyến. Nhận đủ phần thưởng; EXP dành cho đội hiện tại.':!cleared?'Chiến thắng mức này một lần để mở Quét.':progressionLocked?'Kết thúc trận hoặc chuyến đang chơi trước khi Quét.':campaign.sweepTickets<1?'Chưa có Thẻ Quét. Có thể nhận từ Ủy Thác Hằng Ngày.':'Có thể dùng 1 Thẻ Quét để nhận thưởng cả chuyến.'}</p><XpCapWarning amount={selected.reward.characterXp??0}/></section>
          <p className="scouting-run-info">
            {selected.waves} {stageLabel.toLocaleLowerCase("vi")} liên tiếp ·{" "}
            {selected.enemyLevel?"Level "+selected.enemyLevel+" · "+enemyScaleSummary(selected.enemyScale):enemyScaleSummary(selected.enemyScale)}.
          </p>
          <p>Thưởng hoàn thành: {reward(selected)}</p>
          <p>
            HP, MP và hiệu ứng của đội được giữ giữa các đợt. Lượt chỉ trừ khi
            vượt hết chuỗi và nhận thưởng.
          </p>
          {definition.revealRooms && previewReady && (
            <DungeonRooms
              content={content}
              preview={preview}
              scale={selected.enemyScale} enemyLevel={selected.enemyLevel}
            />
          )}
        </Modal>
      )}
    </main>
  );
}
