"use client";
import {OriginalPrismaExchange} from './original-prisma-exchange';
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useRef } from "react";
import { useGame } from "../runtime/game-context";
import {
  convertCoinsToPrisma,
  prismaConversionCost,
  recruitCharacter,
  economyRules,
} from "../core/economy.js";
import {
  CharacterCard,
  CurrencyAmount,
  EmptyState,
  Icon,
  Modal,
  PageHeader,
  fmt,
} from "./ui";
import { MerchantScene } from "./merchant-scene";

const keeperGreetings = [
  "Chào mừng… Tiệm vẫn mở. Còn mắt tôi thì đang cố gắng.",
  "Coin đổi Prisma, Pure Prisma gọi đồng đội. Cà phê thì… không gọi nổi tôi tỉnh nữa.",
  "Cứ chọn thong thả nhé. Tôi chỉ đang đếm xem mình đã tăng ca bao nhiêu đêm thôi.",
  "Hàng mới đã lên kệ. Giấc ngủ của tôi thì vẫn đang trên đường giao tới.",
  "Muốn tìm bạn đồng hành à? Nhớ rủ cả người biết trông tiệm giúp tôi nhé.",
  "Không cần vội đâu… Tôi còn cả chồng sổ sách làm bạn tới sáng.",
  "Prisma đều được kiểm tra rồi. Quầng thâm này là dấu chứng nhận tận tâm đấy.",
  "Cảm ơn đã ghé. Nếu gặp chủ tiệm… nói giúp tôi hai chữ: nghỉ phép.",
];

export function ShopPage() {
  const { content, campaign, transact, busy } = useGame();
  const tab =
    useSearchParams().get("tab") === "recruitment" ? "recruitment" : "prisma";
  const rules = economyRules(content);
  const [quantity, setQuantity] = useState("1");
  const [confirm, setConfirm] = useState<any>(null);
  const [query, setQuery] = useState("");
  const pending = useRef(false);
  const amount = Number(quantity);
  const valid =
    Number.isSafeInteger(amount) &&
    amount > 0 &&
    Number.isSafeInteger(amount * rules.prismaCoinCost);
  const cost = valid ? prismaConversionCost(content, amount) : 0;
  const pool = [
    ...new Set<string>(
      Object.values(content.banners).flatMap(
        (banner: any) => banner.characterPool,
      ),
    ),
  ];
  const locked = pool.filter(
    (id) =>
      !campaign.unlockedCharacterIds.includes(id) &&
      content.characters[id].name
        .toLocaleLowerCase("vi")
        .includes(query.toLocaleLowerCase("vi")),
  );
  async function purchase() {
    if (!confirm || pending.current) return;
    pending.current = true;
    const ok = await transact(
      (current) =>
        confirm.kind === "prisma"
          ? convertCoinsToPrisma(current, content, confirm.quantity)
          : recruitCharacter(
              current,
              content,
              (Object.values(content.banners) as any[]).find((banner: any) =>
                banner.characterPool.includes(confirm.id),
              )!.id,
              confirm.id,
            ),
      confirm.kind === "prisma"
        ? "Đã chuyển Coin thành Prisma."
        : "Đã chiêu mộ đồng đội bằng Pure Prisma.",
    );
    if (ok) setConfirm(null);
    pending.current = false;
  }
  return (
    <main className="page shop-page">
      <MerchantScene art="/art/shop-witch.svg" name="Phù thủy giữ tiệm" badge="CA TRỰC CHƯA KẾT THÚC" lines={keeperGreetings}>
          <PageHeader
            title="Tiệm Prisma"
            subtitle="Ánh đèn còn sáng. Người bán thì sắp ngủ."
          />
          <nav className="shop-tabs" aria-label="Các mục Shop">
            <Link
              className={tab === "prisma" ? "selected" : ""}
              href="/shop"
              aria-current={tab === "prisma" ? "page" : undefined}
            >
              <Icon name="prism" />
              Chuyển đổi Prisma
            </Link>
            <Link
              className={tab === "recruitment" ? "selected" : ""}
              href="/shop?tab=recruitment"
              aria-current={tab === "recruitment" ? "page" : undefined}
            >
              <Icon name="party" />
              Chiêu Mộ
            </Link>
          </nav>
          {tab === "prisma" ? (
            <>
            <section className="panel prisma-exchange">
              <div className="shop-prisma-art" aria-hidden="true">
                <Icon name="prism" />
                <span>PRISMA</span>
              </div>
              <div>
                <span className="eyebrow">NHỮNG MẢNH SÁNG DẪN ĐƯỜNG</span>
                <h2>Chuyển đổi Prisma</h2>
                <p>Mỗi Prisma mở ra một lần chiêu mộ trong Tiếng gọi Prisma.</p>
                <div className="exchange-rate">
                  <CurrencyAmount kind="coin" amount={rules.prismaCoinCost} />
                  <span>→</span>
                  <CurrencyAmount kind="prisma" amount={1} />
                </div>
                <label>
                  Số Prisma muốn đổi
                  <input
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                  />
                </label>
                <div className="shop-quantity-presets">
                  {[1, 10].map((value) => (
                    <button key={value} onClick={() => setQuantity(String(value))}>
                      {value} Prisma
                    </button>
                  ))}
                  <button
                    disabled={campaign.coins < rules.prismaCoinCost}
                    onClick={() =>
                      setQuantity(
                        String(Math.floor(campaign.coins / rules.prismaCoinCost)),
                      )
                    }
                  >
                    Tối đa
                  </button>
                </div>
                <p className="exchange-total">
                  Tổng: <CurrencyAmount kind="coin" amount={cost} />
                </p>
                {!valid ? (
                  <p className="warning">Nhập số nguyên dương hợp lệ.</p>
                ) : (
                  campaign.coins < cost && (
                    <p className="warning">
                      Không đủ Coin để chuyển đổi số Prisma này.
                    </p>
                  )
                )}
                <button
                  className="gold"
                  disabled={busy || !valid || campaign.coins < cost}
                  onClick={() =>
                    setConfirm({ kind: "prisma", quantity: amount, cost })
                  }
                >
                  Chuyển đổi Prisma
                </button>
              </div>
            </section>
            <OriginalPrismaExchange/>
            </>
          ) : (
            <section className="shop-recruitment">
              <div className="panel shop-recruitment-heading">
                <div>
                  <span className="eyebrow">
                    PURE PRISMA · LỜI HẸN ƯỚC THUẦN KHIẾT
                  </span>
                  <h2>Một người đồng hành tự chọn</h2>
                  <p>
                    Mỗi nhân vật chưa sở hữu cần{" "}
                    <strong className="pure-prisma-text">
                      {rules.recruitCost} Pure Prisma
                    </strong>
                    . Bản trùng khi quay vẫn nhận {rules.duplicateShards} Pure
                    Prisma và mở ô trang bị như trước.
                  </p>
                  <small>Chiêu mộ tại Shop không thay đổi pity quay.</small>
                </div>
                <CurrencyAmount kind="pure" amount={campaign.recruitmentShards} />
              </div>
              <label className="shop-search">
                Tìm đồng đội
                <input
                  placeholder="Tên nhân vật…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <div className="character-grid">
                {locked.map((id) => (
                  <CharacterCard
                    key={id}
                    actor={content.characters[id]}
                    owned={false}
                    onClick={() => setConfirm({ kind: "character", id })}
                  />
                ))}
              </div>
              {!locked.length && (
                <EmptyState>
                  {query
                    ? "Không tìm thấy đồng đội phù hợp."
                    : "Bạn đã sở hữu toàn bộ đồng đội trong Shop."}
                </EmptyState>
              )}
            </section>
          )}
      </MerchantScene>
      {confirm && (
        <Modal
          title={
            confirm.kind === "prisma"
              ? "Xác nhận chuyển đổi Prisma"
              : "Xác nhận Chiêu Mộ"
          }
          onClose={() => setConfirm(null)}
          footer={
            <>
              <button onClick={() => setConfirm(null)}>Hủy</button>
              <button
                className="gold"
                disabled={
                  busy ||
                  (confirm.kind === "prisma"
                    ? campaign.coins < confirm.cost
                    : campaign.recruitmentShards < rules.recruitCost)
                }
                onClick={purchase}
              >
                {confirm.kind === "prisma"
                  ? "Xác nhận chuyển đổi"
                  : "Chiêu mộ bằng Pure Prisma"}
              </button>
            </>
          }
        >
          {confirm.kind === "prisma" ? (
            <>
              <p>
                Dùng <strong>{fmt(confirm.cost)} Coin</strong> để nhận{" "}
                <strong className="prisma-text">
                  {fmt(confirm.quantity)} Prisma
                </strong>
                ?
              </p>
              <p>
                Còn lại {fmt(campaign.coins - confirm.cost)} Coin sau khi đổi.
              </p>
            </>
          ) : (
            <>
              <p>
                Chiêu mộ <strong>{content.characters[confirm.id].name}</strong>{" "}
                bằng{" "}
                <strong className="pure-prisma-text">
                  {rules.recruitCost} Pure Prisma
                </strong>
                ?
              </p>
              <p>Pure Prisma hiện có: {fmt(campaign.recruitmentShards)}.</p>
              {campaign.recruitmentShards < rules.recruitCost && (
                <p className="warning">Bạn chưa đủ Pure Prisma.</p>
              )}
            </>
          )}
        </Modal>
      )}
    </main>
  );
}
