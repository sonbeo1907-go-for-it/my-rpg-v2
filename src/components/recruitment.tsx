"use client";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useGame } from "../runtime/game-context";
import {
  pullGacha,
  convertCoinsToPrisma,
  economyRules,
} from "../core/economy.js";
import {characterDrawChance,rateUpPityKey} from "../core/rate-up.js";
import {useRecruitmentSchedule,FactionArtwork,bannerWindow,bannerStyle} from "./rate-up-banner";
import { gearSlotCapacity } from "../core/gear-slots.js";
import { GEAR_NAMES } from "../core/catalog.js";
import {
  bannerRates,
  highestSummonRarity,
} from "../core/summon-presentation.js";
import { rarityStyle } from "./summon-cards";
import { PrismaCrystal } from "./prisma-crystal";
import { Icon, PageHeader, Modal, CurrencyAmount, fmt } from "./ui";

function RecruitmentInfo({ banner }: { banner: any }) {
  const { content, campaign } = useGame();
  const rules = economyRules(content);
  const rates = bannerRates(banner);
  const pity = campaign.gacha.pity?.[rateUpPityKey(banner)] ?? 0;
  const threshold = banner.pity?.characterAt;
  const batch = campaign.gacha.lastSummon;
  return (
    <section className="panel recruitment-status">
      <div className="recruitment-status-heading">
        <div>
          <span className="eyebrow">NHỮNG DẤU ẤN TRÊN HÀNH TRÌNH</span>
          <h2>Nhật ký Chiêu Mộ</h2>
        </div>
        <Link className="button" href="/shop">
          <Icon name="shop" />
          Mở Shop
        </Link>
      </div>
      <div className="recruitment-status-grid">
        <div className="summon-wallets">
          <CurrencyAmount kind="coin" amount={campaign.coins} />
          <CurrencyAmount kind="prisma" amount={campaign.prisma} />
        </div>
        <p>{fmt(campaign.gacha.totalPulls)} lượt đã chiêu mộ</p>
        {threshold && (
          <div className="pity-panel">
            <div>
              <span>Bảo hiểm nhân vật</span>
              <strong>
                {pity}/{threshold}
              </strong>
            </div>
            <progress max={threshold} value={pity} />
            <p>Còn tối đa {threshold - pity} lượt đến nhân vật tiếp theo.</p>
            <small>Đặt lại khi ra nhân vật, kể cả bản trùng.{banner.featured?" Mỗi banner có bộ đếm riêng. Hết đợt, pity về 0 và không chuyển sang banner khác.":" Bộ đếm riêng của Chiêu Mộ thường."}</small>
          </div>
        )}
        {batch && (
          <Link
            className="button recent-summon"
            href={`/recruitment/results?draw=${batch.id}`}
          >
            Kết quả gần nhất →
          </Link>
        )}
        <details>
          <summary>Tỷ lệ & đồng đội</summary>
          <p>
            Tỷ lệ cơ bản: {fmt(rates.low * 100)}% cấp thấp ·{" "}
            {fmt(rates.mid * 100)}% cấp trung · {fmt(rates.high * 100)}% cấp cao
            · {fmt(rates.character * 100)}% nhân vật.
          </p>
          <p>
            Tỷ lệ chưa gồm pity. Quay 10 xét tuần tự từng lượt; bảo đảm nhân vật
            ở lượt thứ {threshold}, reset ngay khi có nhân vật.
          </p>
          {banner.gearRates.map((rate: any) => (
            <p key={rate.typeId}>
              {(GEAR_NAMES as any)[rate.typeId]}:{" "}
              {fmt(rates.byType[rate.typeId] * 100)}% mỗi lượt.
            </p>
          ))}
          {banner.featured?<><p>Khi ra nhân vật: 50% thuộc nhóm tăng cơ hội, 50% thuộc các nhân vật còn lại. Chưa có bảo hiểm thắng tăng cơ hội sau khi lệch.</p><table className="rateup-odds"><caption>Tỷ lệ theo đợt đang chọn</caption><thead><tr><th>Nhân vật</th><th>Khi ra nhân vật</th><th>Mỗi lượt cơ bản</th></tr></thead><tbody>{banner.featured.map((id:string)=><tr key={id}><td>{content.characters[id].name}</td><td>{fmt(characterDrawChance(banner,id)*100)}%</td><td>{new Intl.NumberFormat('vi-VN',{maximumFractionDigits:3}).format(characterDrawChance(banner,id)*rates.character*100)}%</td></tr>)}<tr><td>Các nhân vật còn lại</td><td>50%</td><td>2,5%</td></tr></tbody></table><p>Nhân vật chính thuộc phe; hai phụ có 50% khả năng một người đến từ phe khác. Mọi nhân vật được tăng cơ hội đều vào hàng đợi chống lặp 15 người. Hàng đợi tính theo lượt xuất hiện, không phải số ngày.</p></>:<p>Mỗi nhân vật trong danh sách: {new Intl.NumberFormat('vi-VN',{maximumFractionDigits:4}).format(rates.character/banner.characterPool.length*100)}% mỗi lượt cơ bản.</p>}
          <p>
            Bản trùng mở thêm một ô trang bị đến 6 và nhận{" "}
            <strong className="pure-prisma-text">
              {rules.duplicateShards} Pure Prisma
            </strong>
            . Chiêu mộ bằng Pure Prisma tại Shop không thay đổi pity quay.
          </p>
          <details><summary>Danh sách {banner.characterPool.length} nhân vật</summary><div className="banner-pool">
            {banner.characterPool.map((id: string) => (
              <span key={id}>
                {content.characters[id].name} ·{" "}
                {campaign.unlockedCharacterIds.includes(id)
                  ? `${gearSlotCapacity(campaign, content, id)}/6 ô`
                  : "Chưa sở hữu"}
              </span>
            ))}
          </div></details>
        </details>
      </div>
    </section>
  );
}

export function RecruitmentPage() {
  const { content, campaign, transact, busy } = useGame();
  const router = useRouter();
  const {banners,now}=useRecruitmentSchedule();
  const params=useSearchParams();
  const [bannerId, setBannerId] = useState("");
  const [awakening, setAwakening] = useState<any>(null);
  const [conversion, setConversion] = useState<{
    count: 1 | 10;
    missing: number;
    cost: number;
    bannerId: string;
  } | null>(null);
  const inFlight = useRef(false);
  const skipped = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const banner = banners.find((b:any)=>b.id===bannerId)??banners.find((b:any)=>b.id===params.get("banner"))??banners[0];
  useEffect(()=>{setConversion(null);},[banner.id]);
  const rules = economyRules(content);
  useEffect(() => {
    if (!awakening) return;
    timer.current = setTimeout(
      () => {
        if (!skipped.current)
          router.push(`/recruitment/reveal?draw=${awakening.id}&card=0`);
      },
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 300
        : 2600,
    );
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [awakening, router]);
  async function summon(count: 1 | 10, convertMissing = false) {
    if (inFlight.current) return;
    if(convertMissing&&conversion?.bannerId!==banner.id){setConversion(null);return;}
    const price = count === 10 ? rules.tenPullCost : rules.singlePullCost;
    const missing = Math.max(0, price - campaign.prisma);
    if (missing && !convertMissing) {
      setConversion({ count, missing, cost: missing * rules.prismaCoinCost, bannerId:banner.id });
      return;
    }
    inFlight.current = true;
    let outcome: any;
    const ok = await transact((current) => {
      const shortfall = Math.max(0, price - current.prisma);
      if (shortfall && convertMissing && shortfall > (conversion?.missing ?? 0))
        throw new Error("Số Prisma cần đổi đã thay đổi. Hãy xác nhận lại.");
      const funded =
        shortfall && convertMissing
          ? convertCoinsToPrisma(current, content, shortfall)
          : current;
      outcome = pullGacha(funded, content, banner.id, count);
      return outcome.campaign;
    }, "");
    if (ok) {
      setConversion(null);
      skipped.current = false;
      setAwakening(outcome.campaign.gacha.lastSummon);
    } else inFlight.current = false;
  }
  function skip() {
    skipped.current = true;
    if (timer.current) clearTimeout(timer.current);
    router.push(`/recruitment/results?draw=${awakening.id}`);
  }
  const highest = awakening ? highestSummonRarity(awakening.results) : "low";
  return (
    <main
      className={`recruitment-page summon-hub ${awakening ? "is-awakening" : ""}`}
    >
      <PageHeader
        title="Tiếng gọi Prisma"
        subtitle="Nơi những con đường chưa gặp nhau cùng hội tụ"
      />
      {awakening ? (
        <section
          className="stone-awakening"
          data-rarity={highest}
          style={rarityStyle(highest)}
          aria-label="Hoạt ảnh Chiêu Mộ"
        >
          <div className="centered-summon-background" />
          <div className="stone-aura" />
          <PrismaCrystal />
          <span className="awakening-orbit orbit-one" />
          <span className="awakening-orbit orbit-two" />
          <div className="awakening-copy">
            <span className="eyebrow">NHỮNG LỜI GỌI ĐÃ ĐƯỢC HỒI ĐÁP</span>
            <h2>Prisma đang thức giấc…</h2>
            <p>
              {awakening.results.length === 10
                ? "Mười sợi chỉ định mệnh đang tìm đến ngươi."
                : "Một cuộc gặp gỡ đang vượt qua màn đêm."}
            </p>
          </div>
          <button className="summon-skip" onClick={skip}>
            Bỏ qua → Kết quả
          </button>
          <span className="summon-saved-note">
            Kết quả đã được lưu · Có thể bỏ qua an toàn
          </span>
        </section>
      ) : (
        <>
          <div className={"summon-layout rateup-layout"}>
            <section className={"summon-stage"+(banner.featured?" rateup-stage":"")} style={bannerStyle(banner)} data-active-banner={banner.id}>
              {banner.featured?<FactionArtwork banner={banner}/>:<div className="scene-background summon-background" /> }
              <div className="summon-stage-content">
                {banner.featured?<><span className="rateup-period">{bannerWindow(banner)} · Kết thúc 23:59</span><h2>{banner.title}</h2><p>{banner.description}</p><div className="rateup-featured" aria-label="Nhân vật được tăng cơ hội">{banner.featured.map((id:string,i:number)=><Link key={id} href={'/characters/'+id}><small>{i===0?'Nhân vật chính':'Đồng hành'}</small><strong>{content.characters[id].name}</strong><b>{i===0?'25%':'12,5%'} khi ra nhân vật</b></Link>)}</div></>:<><h2>Ai đang chờ<br/>bước cùng ngươi?</h2><p>Arthur… giữa những ngả đường định mệnh,<br/>một linh hồn khác đang nghe thấy lời gọi.</p><div className="summon-caption"><Icon/><span>{banner.name}<small>{banner.description}</small></span></div></>}
                <div className="summon-actions">
                  <button disabled={busy||!now} onClick={() => summon(1)}>
                    <span>Chiêu mộ 1 lần</span>
                    <CurrencyAmount
                      kind="prisma"
                      amount={rules.singlePullCost}
                    />
                  </button>
                  <button
                    className="gold"
                    disabled={busy||!now}
                    onClick={() => summon(10)}
                  >
                    <span>Chiêu mộ 10 lần</span>
                    <CurrencyAmount kind="prisma" amount={rules.tenPullCost} />
                  </button>
                </div>
                {banner.featured&&<p className="rateup-terms">Điều khoản: Mỗi banner có pity riêng, kể cả hai banner Chủ Nhật. Hết thời hạn banner, pity đặt lại về 0; không chuyển hoặc cộng dồn sang banner khác. Lượt 50 bảo đảm nhân vật, không bảo đảm nhân vật tăng cơ hội.</p>}
              </div>
            </section>
            <aside className="banner-sidebar">
              <h2>Chọn lời mời</h2>
              {banners.map((item: any) => (
                <button
                  className={`banner-card ${item.id === banner.id ? "selected" : ""}`}
                  key={item.id}
                  style={bannerStyle(item)}
                  aria-pressed={item.id===banner.id}
                  onClick={() => setBannerId(item.id)}
                >
                  <FactionArtwork banner={item} compact/>
                  <strong>{item.name}</strong>
                  <small>{item.featured?'Tăng cơ hội · '+bannerWindow(item):'Chiêu Mộ thường'}</small>
                </button>
              ))}
            </aside>
          </div>
          <RecruitmentInfo banner={banner} />
        </>
      )}
      {conversion && (
        <Modal
          title="Chuyển đổi Prisma để chiêu mộ?"
          onClose={() => setConversion(null)}
          footer={
            <>
              <button onClick={() => setConversion(null)}>Hủy</button>
              <button
                className="gold"
                disabled={busy || campaign.coins < conversion.cost}
                onClick={() => summon(conversion.count, true)}
              >
                Đổi & Chiêu mộ {conversion.count} lần
              </button>
            </>
          }
        >
          <p>
            Bạn còn thiếu{" "}
            <strong className="prisma-text">{conversion.missing} Prisma</strong>{" "}
            cho {conversion.count} lượt chiêu mộ.
          </p>
          <div className="conversion-quote">
            <CurrencyAmount kind="coin" amount={conversion.cost} />
            <span>→</span>
            <CurrencyAmount kind="prisma" amount={conversion.missing} />
          </div>
          <p>
            Tỷ lệ: {rules.prismaCoinCost} Coin = 1 Prisma. Chỉ đổi số còn thiếu
            và dùng ngay cho lượt chiêu mộ này.
          </p>
          <p>
            Coin hiện có: <strong>{fmt(campaign.coins)}</strong>.
          </p>
          {campaign.coins < conversion.cost && (
            <p className="warning">
              Không đủ Coin. Cần thêm {fmt(conversion.cost - campaign.coins)}{" "}
              Coin để tiếp tục.
            </p>
          )}
        </Modal>
      )}
    </main>
  );
}
