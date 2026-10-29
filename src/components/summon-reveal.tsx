"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useGame } from "../runtime/game-context";
import { summonRarity, SUMMON_RARITIES } from "../core/summon-presentation.js";
import { SummonCardBack, SummonCardFront, rarityStyle } from "./summon-cards";
import { EmptyState, PageHeader } from "./ui";

export function useSummonBatch() {
  const { campaign } = useGame();
  const query = useSearchParams();
  const batch = campaign.gacha.lastSummon;
  return batch && (!query.get("draw") || query.get("draw") === batch.id)
    ? batch
    : null;
}
function RevealCard({
  result,
  index,
  count,
  onNext,
}: {
  result: any;
  index: number;
  count: number;
  onNext: () => void;
}) {
  const [phase, setPhase] = useState<"back" | "revealing" | "front">("back");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const card = useRef<HTMLButtonElement>(null);
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    card.current?.focus({ preventScroll: true });
    timers.current = [
      setTimeout(() => setPhase("revealing"), reduced ? 100 : 650),
      setTimeout(() => setPhase("front"), reduced ? 130 : 1550),
    ];
    return clear;
  }, []);
  function advance() {
    clear();
    if (phase === "front") onNext();
    else setPhase("front");
  }
  const rarity = summonRarity(result);
  return (
    <>
      <button
        ref={card}
        className={`reveal-card ${phase}`}
        style={rarityStyle(rarity)}
        data-reveal-phase={phase}
        aria-label={
          phase === "front"
            ? index + 1 === count
              ? "Xem tất cả kết quả"
              : "Thẻ tiếp theo"
            : `Mở thẻ ${index + 1}`
        }
        onClick={advance}
      >
        <SummonCardBack result={result} />
        <div className="card-front-reveal" aria-hidden={phase !== "front"}>
          <SummonCardFront result={result} />
        </div>
        {phase === "revealing" && <span className="card-reveal-edge" />}
      </button>
      <div className="reveal-instructions">
        <span>
          {phase === "front"
            ? "MỘT LỜI HỒI ĐÁP ĐÃ THÀNH HÌNH"
            : "NHỮNG DẤU ẤN ĐANG THỨC GIẤC"}
        </span>
        <p>
          {phase === "front"
            ? "Đã lưu phần thưởng vào hành trình của bạn."
            : "Chạm thẻ để hoàn tất reveal ngay."}
        </p>
        <button className="gold" onClick={advance}>
          {phase !== "front"
            ? "Mở thẻ ngay"
            : index + 1 === count
              ? "Xem tất cả kết quả"
              : `Tiếp tục · ${index + 2}/${count}`}
        </button>
      </div>
    </>
  );
}
export function SummonRevealPage() {
  const router = useRouter();
  const query = useSearchParams();
  const batch = useSummonBatch();
  if (!batch)
    return (
      <main className="page">
        <PageHeader title="Dấu ấn chưa xuất hiện" back="/recruitment" />
        <EmptyState>
          Chưa có lượt chiêu mộ này. Kết quả gần nhất vẫn có thể xem từ trang
          Chiêu Mộ.
        </EmptyState>
        <Link className="button gold" href="/recruitment">
          Về Chiêu Mộ
        </Link>
      </main>
    );
  const parsed = Number(query.get("card") ?? 0);
  const index =
    Number.isInteger(parsed) && parsed >= 0 && parsed < batch.results.length
      ? parsed
      : 0;
  const result = batch.results[index];
  const rarity = summonRarity(result);
  function next() {
    if (index + 1 >= batch.results.length)
      router.push(`/recruitment/results?draw=${batch.id}`);
    else
      router.replace(`/recruitment/reveal?draw=${batch.id}&card=${index + 1}`, {
        scroll: false,
      });
  }
  return (
    <main className="summon-reveal-page" style={rarityStyle(rarity)}>
      <PageHeader
        title="Những dấu ấn định mệnh"
        subtitle={`Thẻ ${index + 1} / ${batch.results.length}`}
        back="/recruitment"
      >
        <Link
          className="button summon-skip"
          href={`/recruitment/results?draw=${batch.id}`}
        >
          Bỏ qua → Kết quả
        </Link>
      </PageHeader>
      <div className="reveal-scene">
        <div className="centered-summon-background" />
        <div className="reveal-halo" />
        <div
          className="reveal-progress"
          aria-label={`Đang xem thẻ ${index + 1} trên ${batch.results.length}`}
        >
          {batch.results.map((_: any, i: number) => (
            <i key={i} className={i <= index ? "seen" : ""} />
          ))}
        </div>
        <RevealCard
          key={`${batch.id}-${index}`}
          result={result}
          index={index}
          count={batch.results.length}
          onNext={next}
        />
      </div>
    </main>
  );
}
