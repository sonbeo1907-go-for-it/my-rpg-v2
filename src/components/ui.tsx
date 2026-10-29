"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { useGame } from "../runtime/game-context";
import { ELEMENT_NAMES, ROLE_GROUPS } from "../core/content.js";
import { STAT_LABELS, GEAR_NAMES } from "../core/catalog.js";
import { gearOwner } from "../core/equipment.js";
import { useSettings } from "../runtime/settings-context";
import { gearRarity, EQUIPMENT_RARITIES } from "../ui/equipment-presentation.js";
import { Equipped } from "./equipped";

export const fmt = (value: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value);
const paths: Record<string, ReactNode> = {
  anvil: <><path d="M2 7h20l-4 5h-5v4l5 3v2H6v-2l4-3v-4H6L2 9Zm5-3h7v3" /></>,
  fragments: <><path d="m7 3 5 5-4 4-5-5zM16 4l5 5-6 3-2-5zM10 15l5-2 5 5-7 4-5-4zM3 16l3-2 1 5-4 1z"/></>,
  folder: <path d="M3 6h6l2 2h10v12H3V6Zm0 3V4h6l2 2h8v2" />,
  settings: (
    <>
      <path
        d="m9 3 1-2h4l1 2 2 1 2-.3 2 3.5-1.3 1.5v2.6L21 13l-2 3.5-2-.3-2 1-1 2h-4l-1-2-2-1-2 .3L3 13l1.3-1.4V9L3 7.2l2-3.5 2 .3Z"
        transform="translate(0 2)"
      />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  gamepad: (
    <>
      <path d="M7 6h10c3 0 4 3 5 10 .4 3-2 4-4 2l-3-3H9l-3 3c-2 2-4.4 1-4-2C3 9 4 6 7 6Z" />
      <path d="M7 8v5m-2.5-2.5h5M16 9h.01M19 12h.01" />
    </>
  ),
  mouse: (
    <>
      <rect x="5" y="2" width="14" height="20" rx="7" />
      <path d="M12 2v8M5 10h14" />
    </>
  ),
  prism: (
    <>
      <path d="m12 2 8 7-8 13L4 9Z" />
      <path d="m4 9 8 3 8-3M12 2v10l-4 6m4-6 4 6" />
    </>
  ),
  party: (
    <>
      <circle cx="12" cy="7" r="3" />
      <circle cx="4.5" cy="10" r="2" />
      <circle cx="19.5" cy="10" r="2" />
      <path d="M6 22v-4a6 6 0 0 1 12 0v4M1 21v-3a4 4 0 0 1 4-4m18 7v-3a4 4 0 0 0-4-4" />
    </>
  ),
  bag: (
    <>
      <path d="M6 8 4 21h16L18 8Zm3 0V5a3 3 0 0 1 6 0v3M4 14h16m-9-2h2v4h-2z" />
    </>
  ),
  shop: (
    <>
      <path d="M3 9 5 3h14l2 6M4 13v8h16v-8M8 21v-7h5v7" />
      <path d="M3 9v2a3 3 0 0 0 5 2 3 3 0 0 0 4 0 3 3 0 0 0 4 0 3 3 0 0 0 5-2V9ZM8 9l1-6m7 6-1-6" />
    </>
  ),
  book: (
    <>
      <path d="M12 5v17M3 3c4-1 7 0 9 2 2-2 5-3 9-2v16c-4-1-7 0-9 2-2-2-5-3-9-2z" />
      <path d="m6 7 3 1m-3 3 3 1m6-4 3-1m-3 5 3-1" />
    </>
  ),
  scroll: (
    <>
      <path d="M6 3h13v15a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-2h12v2a3 3 0 0 0 6 0M6 3a3 3 0 0 0-3 3v2h5V6a3 3 0 0 0-2-3Z" />
      <path d="M10 7h6m-6 4h6" />
    </>
  ),
  sword: (
    <>
      <path d="m5 20 5-5m-7 3 3 3m1-9 5 5m-3-5L19 2l3 1-1 4-10 9M3 2l8 8m2 4 7 7m-4-2 3-3" />
    </>
  ),
  skull: (
    <>
      <path d="M9 18v3h6v-3h2a2 2 0 0 0 2-2v-1.18a8 8 0 1 0-14 0V16a2 2 0 0 0 2 2Z" />
      <circle cx="9" cy="10" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="1.6" fill="currentColor" stroke="none" />
      <path d="m12 13-1 2h2Z" fill="currentColor" stroke="none" />
      <path d="M11 18v3m2-3v3" />
    </>
  ),
  door: (
    <>
      <path d="M3 22V11a9 9 0 0 1 18 0v11M7 22V11a5 5 0 0 1 10 0v11M7 22h10m-4-6h1" />
    </>
  ),
  save: (
    <>
      <path d="M12 2v13m-5-5 5 5 5-5M4 16v6h16v-6" />
    </>
  ),
  arrow: <path d="m14 5-7 7 7 7M7 12h15" />,
  close: <path d="m5 5 14 14M19 5 5 19" />,
  plus: <path d="M12 4v16M4 12h16" />,
  sound: (
    <>
      <path d="m3 9 5-1 5-5v18l-5-5-5-1zM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="6" />
      <path d="m12 7 3 5-3 5-3-5z" />
    </>
  ),
  shield: (
    <>
      <path d="m12 2 9 4-1 8c-1 4-5 7-8 9-3-2-7-5-8-9L3 6z" />
      <path d="M12 6v12M7 11h10" />
    </>
  ),
  moon: <path d="M19 16A9 9 0 0 1 8 3a9 9 0 1 0 11 13Z" />,
};
export function Icon({
  name = "prism",
  className = "",
}: {
  name?: string;
  className?: string;
}) {
  return (
    <svg
      className={`icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? paths.prism}
    </svg>
  );
}
const roleGlyphs: Record<string, ReactNode> = {
  physical_dps: (
    <>
      <g transform="rotate(-42 12 12)">
        <path d="m10.7 3 1.3-1.5L13.3 3v10.6h-2.6Z" />
        <path d="M8.5 14.3h7M12 14.3v6M10.6 21h2.8" />
      </g>
      <g transform="rotate(42 12 12)">
        <path d="m10.7 3 1.3-1.5L13.3 3v10.6h-2.6Z" />
        <path d="M8.5 14.3h7M12 14.3v6M10.6 21h2.8" />
      </g>
    </>
  ),
  magical_dps: (
    <>
      <circle cx="16" cy="5" r="3.2" />
      <path d="m14.6 8-7.8 14M12.5 11.7l3 1.7M9.2 17.6l3 1.6M16 3.5v3M14.5 5h3" />
      <path d="m19.4 1.5 1-1M21 5h1.5" />
    </>
  ),
  offensive_support: (
    <>
      <g transform="translate(0 5) scale(.67)">{paths.book}</g>
      <g transform="rotate(24 18.5 8)">
        <path d="m17.3 2 1.2-1.4L19.7 2v7.2h-2.4Z" />
        <path d="M15.6 10h5.8M18.5 10v4.5M17.4 15h2.2" />
      </g>
    </>
  ),
  defensive_support: (
    <>
      <g transform="translate(0 5) scale(.67)">{paths.book}</g>
      <path d="M17 1h3v3h3v3h-3v3h-3V7h-3V4h3Z" />
    </>
  ),
  tank: paths.shield,
  fighter: (
    <>
      <path d="m16.8 7 5.7 2.5-.7 5.6c-.5 2.6-2.5 4.8-5 6.5-2.6-1.7-4.6-3.9-5.1-6.5L11 9.5Z" />
      <path d="M16.8 10v8" />
      <g transform="rotate(-24 7 11)">
        <path d="m5.8 2 1.2-1.3L8.2 2v10.4H5.8Z" />
        <path d="M3.6 13.5h6.8M7 13.5v6M5.6 20.5h2.8" />
      </g>
    </>
  ),
};
/** One role-to-icon mapping for roster cards, party slots and the picker modal. */
export function RoleIcon({ roleGroup }: { roleGroup: string }) {
  return (
    <svg
      className="icon role-icon"
      data-role-icon={roleGroup}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {roleGlyphs[roleGroup] ?? paths.book}
    </svg>
  );
}
export function ElementBadge({ element }: { element: string }) {
  return (
    <span className="element-badge" data-element={element}>
      <span aria-hidden="true">◆</span> {(ELEMENT_NAMES as any)[element]}
    </span>
  );
}
export function ResourceIcon({kind}:{kind:string}) {
  const id=useId().replace(/:/g,'');
  if(kind!=='original')return <Icon name={kind==='coin'?'coin':kind==='fragments'?'fragments':'prism'}/>;
  return <svg className="icon original-prisma-icon" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id={`rainbow-${id}`} x2="1" y2="1"><stop stopColor="#ff9eac"/><stop offset=".2" stopColor="#ffe195"/><stop offset=".4" stopColor="#a4e5ad"/><stop offset=".6" stopColor="#8bd8ed"/><stop offset=".8" stopColor="#aca5f2"/><stop offset="1" stopColor="#eda7e7"/></linearGradient></defs><path d="m12 2 8 7-8 13L4 9z" fill={`url(#rainbow-${id})`} fillOpacity=".25" stroke={`url(#rainbow-${id})`} strokeWidth="1.4"/><path d="m12 2-3 7 3 13 3-13zM4 9h16" fill="none" stroke={`url(#rainbow-${id})`} strokeWidth="1"/></svg>;
}
export function CurrencyAmount({
  kind,
  amount,
  label = true,
}: {
  kind: "coin" | "prisma" | "pure" | "original" | "fragments";
  amount: number;
  label?: boolean;
}) {
  const name =
    kind === "coin" ? "Coin" : kind === "pure" ? "Pure Prisma" : kind === "original" ? "Original Prisma" : kind === "fragments" ? "Vụn Prisma" : "Prisma";
  return (
    <span
      className={`currency-amount currency-${kind}`}
      data-currency={kind}
      aria-label={`${fmt(amount)} ${name}`}
      title={name}
    >
      <ResourceIcon kind={kind}/>
      <strong>{fmt(amount)}</strong>
      {label && <small>{name}</small>}
    </span>
  );
}
export function StatGrid({
  actor,
  compact = false,
  showGearBonuses = false,
}: {
  actor: any;
  compact?: boolean;
  showGearBonuses?: boolean;
}) {
  return (
    <dl className={`stat-grid ${compact ? "compact" : ""}`}>
      {Object.entries(STAT_LABELS)
        .filter(([key]) => !compact || key !== "speed")
        .map(([key, label]) => (
          <div key={key} data-stat={key}>
            <dt>{label}</dt>
            <dd>
              <span className="stat-total">{fmt(actor.stats[key])}</span>
              {showGearBonuses && (
                <small
                  className={`stat-gear-bonus ${actor.gearBonuses?.[key] ? "has-bonus" : ""}`}
                >
                  Trang bị: +{fmt(actor.gearBonuses?.[key] ?? 0)}
                </small>
              )}
              {showGearBonuses && actor.exclusiveBonuses?.[key] ? <small className="stat-exclusive-bonus">Trấn Phái: +{fmt(actor.exclusiveBonuses[key])}</small> : null}
              {actor.teamBonuses?.[key] ? (
                <small> +{actor.teamBonuses[key]} đội</small>
              ) : null}
            </dd>
          </div>
        ))}
    </dl>
  );
}
export function CharacterCard({
  actor,
  owned = true,
  selected = false,
  onClick,
}: {
  actor: any;
  owned?: boolean;
  selected?: boolean;
  onClick?: () => void;
}) {
  const body = (
    <>
      <div className="card-top">
        <ElementBadge element={actor.element} />
        <span className="ownership">
          {owned ? "ĐÃ SỞ HỮU" : "CHƯA MỞ KHÓA"}
        </span>
      </div>
      <div className="character-seal" aria-hidden="true">
        <RoleIcon roleGroup={actor.roleGroup} />
      </div>
      <div>
        <h3>{actor.name}</h3>
        <p>{actor.title}</p>
        <small>{actor.role}</small>
      </div>
    </>
  );
  const props = {
    className: `character-card ${owned ? "" : "locked"} ${selected ? "selected" : ""}`,
    "data-element": actor.element,
  };
  return onClick ? (
    <button {...props} onClick={onClick} aria-pressed={selected}>
      {body}
    </button>
  ) : (
    <article {...props}>{body}</article>
  );
}
export function EquipmentIcon({ typeId, compact = false }: { typeId: string; compact?: boolean }) {
  const rarity = gearRarity(typeId);
  const definition = EQUIPMENT_RARITIES[rarity];
  return <span className={"equipment-icon " + (compact ? "equipment-icon-compact" : "gear-symbol")} data-rarity={rarity} title={definition.label} aria-hidden="true">
    <Icon name={rarity === "exclusive" ? "anvil" : typeId === "t3_dual" ? "prism" : "shield"}/>
    <span className="equipment-icon-rank">{definition.mark}</span>
  </span>;
}

export function GearCard({
  gear,
  selected,
  onClick,
  disabled,
  children,
}: {
  gear: any;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  children?: ReactNode;
}) {
  const { content, campaign } = useGame();
  const owner = gearOwner(campaign, gear.id);
  const body = (
    <>
      {owner && <Equipped ownerName={content.characters[owner].name} />}
      <EquipmentIcon typeId={gear.typeId}/>
      <h3>{(GEAR_NAMES as any)[gear.typeId]}</h3>
      <p>
        {Object.entries(gear.stats)
          .map(([key, value]) => `${(STAT_LABELS as any)[key]} +${value}`)
          .join(" · ")}
      </p>
      <small>
        {owner ? (
          <strong className="gear-equipped-owner">
            Đang dùng: {content.characters[owner].name}
          </strong>
        ) : (
          "Chưa trang bị"
        )}{" "}
        · #{gear.id.slice(5)}
      </small>
    </>
  );
  return (
    <button
      className={`gear-card ${gear.typeId} ${selected ? "selected" : ""}`}
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
    >
      {body}
      {children}
    </button>
  );
}
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="empty-state">
      <Icon name="moon" />
      <p>{children}</p>
    </div>
  );
}
let modalSequence = 0;
export function Modal({
  title,
  children,
  footer,
  onClose,
  initialFocus,
  className = "",
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  initialFocus?: string;
  className?: string;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const node = dialog.current;
    node?.showModal();
    if (node) node.dataset.modalOrder = String(++modalSequence);
    const chosen = initialFocus
      ? node?.querySelector<HTMLElement>(initialFocus)
      : Array.from(
          node?.querySelectorAll<HTMLButtonElement>("footer button") ?? [],
        ).find((button) =>
          /^(Hủy|Đóng)/.test(button.textContent?.trim() ?? ""),
        );
    chosen?.focus({ preventScroll: true });
    return () => {
      node?.close();
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className={`modal ${className}`.trim()}
      aria-labelledby={id}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <header>
        <h2 id={id}>{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="Đóng">
          <Icon name="close" />
        </button>
      </header>
      <div className="modal-body">{children}</div>
      {footer && <footer>{footer}</footer>}
    </dialog>
  );
}
export function PageHeader({
  title,
  subtitle,
  back = "/home",
  children,
}: {
  title: string;
  subtitle?: string;
  back?: string;
  children?: ReactNode;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [title]);
  return (
    <header className="page-header">
      <Link className="back-button" href={back} aria-label="Trở về">
        <Icon name="arrow" />
      </Link>
      <div>
        <span className="eyebrow">NORTHERN PRISMA</span>
        <h1 ref={heading} tabIndex={-1}>
          {title}
        </h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="header-actions">{children}</div>
    </header>
  );
}
export function CharacterFilters({
  filters,
  onChange,
  ownedOnly = false,
}: {
  filters: any;
  onChange: (values: any) => void;
  ownedOnly?: boolean;
}) {
  const set = (key: string, value: string) =>
    onChange({ ...filters, [key]: value });
  return (
    <div className="filter-bar">
      <label>
        Tìm đồng đội
        <input
          placeholder="Tên, gia tộc, vai trò…"
          value={filters.q ?? ""}
          onChange={(e) => set("q", e.target.value)}
        />
      </label>
      <label>
        Nguyên tố
        <select
          value={filters.element ?? ""}
          onChange={(e) => set("element", e.target.value)}
        >
          <option value="">Tất cả</option>
          {Object.entries(ELEMENT_NAMES).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Vai trò
        <select
          value={filters.role ?? ""}
          onChange={(e) => set("role", e.target.value)}
        >
          <option value="">Tất cả</option>
          {Object.entries(ROLE_GROUPS).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </label>
      {!ownedOnly && (
        <label>
          Sở hữu
          <select
            value={filters.ownership ?? ""}
            onChange={(e) => set("ownership", e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="owned">Đã sở hữu</option>
            <option value="locked">Chưa sở hữu</option>
          </select>
        </label>
      )}
      <SortControl
        value={filters.sort ?? "name"}
        direction={filters.direction ?? "asc"}
        onSort={(v) => set("sort", v)}
        onDirection={(v) => set("direction", v)}
        options={[["name", "Tên"], ...Object.entries(STAT_LABELS)]}
      />
    </div>
  );
}
export function SortControl({
  value,
  direction,
  onSort,
  onDirection,
  options,
}: {
  value: string;
  direction: string;
  onSort: (value: string) => void;
  onDirection: (value: string) => void;
  options: string[][];
}) {
  return (
    <>
      <label>
        Sắp xếp
        <select value={value} onChange={(e) => onSort(e.target.value)}>
          {options.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Thứ tự
        <select value={direction} onChange={(e) => onDirection(e.target.value)}>
          <option value="asc">Tăng dần ↑</option>
          <option value="desc">Giảm dần ↓</option>
        </select>
      </label>
    </>
  );
}
export function GearFilters({
  filters,
  onChange,
  hideStatus = false,
}: {
  filters: any;
  onChange: (values: any) => void;
  hideStatus?: boolean;
}) {
  const set = (key: string, value: string) =>
    onChange({ ...filters, [key]: value });
  return (
    <div className="filter-bar">
      <label>
        Cấp trang bị
        <select
          value={filters.tier ?? ""}
          onChange={(e) => set("tier", e.target.value)}
        >
          <option value="">Tất cả</option>
          {Object.entries(GEAR_NAMES).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Chỉ số
        <select
          value={filters.stat ?? ""}
          onChange={(e) => set("stat", e.target.value)}
        >
          <option value="">Tất cả</option>
          {Object.entries(STAT_LABELS).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </label>
      {!hideStatus && <label>
        Trạng thái
        <select
          value={filters.status ?? ""}
          onChange={(e) => set("status", e.target.value)}
        >
          <option value="">Tất cả</option>
          <option value="equipped">Đang dùng</option>
          <option value="free">Chưa trang bị</option>
        </select>
      </label>}
      <SortControl
        value={filters.sort ?? "received"}
        direction={filters.direction ?? "desc"}
        onSort={(v) => set("sort", v)}
        onDirection={(v) => set("direction", v)}
        options={[
          ["received", "Thứ tự nhận"],
          ["tier", "Cấp"],
          ...Object.entries(STAT_LABELS),
        ]}
      />
    </div>
  );
}
export function GameShell({ children }: { children: ReactNode }) {
  const {
    ready,
    entered,
    campaign,
    notice,
    audio,
    toggleAudio,
    setVolume,
    busy,
  } = useGame();
  const path = usePathname();
  const { setOpen } = useSettings();
  const router = useRouter();
  useEffect(() => {
    if (ready && !entered && path !== "/") router.replace("/");
  }, [ready, entered, path, router]);
  // Restore each route's scroll, including returning from details/equipment.
  useEffect(() => {
    const key = `scroll:${path}`;
    let y = 0;
    try {
      y = Number(sessionStorage.getItem(key) ?? 0);
    } catch {}
    const frame = requestAnimationFrame(() => window.scrollTo(0, y));
    const save = () => {
      try {
        sessionStorage.setItem(key, String(window.scrollY));
      } catch {}
    };
    window.addEventListener("scroll", save, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", save);
    };
  }, [path]);
  if (!ready || !campaign)
    return (
      <div className="loading">
        <Icon />
        <p>Những mảnh Prisma đang hội tụ…</p>
      </div>
    );
  if (!entered && path !== "/")
    return <div className="loading">Trở về khởi đầu…</div>;
  return (
    <>
      <div
        className={`app-frame ${path === "/" || path === "/home" ? "immersive" : ""}`}
      >
        {path !== "/" && (
          <div className="utility-bar">
            <Link href="/home" className="brand">
              <Icon /> NORTHERN PRISMA <small>THE NORTHERN JOURNEY</small>
            </Link>
            <div className="utility-wallet" aria-label="Ví tiền">
              <CurrencyAmount kind="prisma" amount={campaign.prisma} />
              <CurrencyAmount kind="pure" amount={campaign.recruitmentShards} />
              <CurrencyAmount kind="coin" amount={campaign.coins} />
            </div>
            <Link href="/shop" className="header-shop" aria-label="Shop">
              <Icon name="shop" />
              <span>Shop</span>
            </Link>
            {busy && (
              <span className="busy-marker">Đang diễn ra hành động…</span>
            )}
            <button
              className="settings-trigger"
              aria-label="Mở Settings"
              onClick={() => setOpen(true)}
            >
              <Icon name="settings" />
            </button>
          </div>
        )}
        {children}
        {entered && campaign.pendingReforge && <Link className="pending-reforge-link" href="/blacksmith?tab=exclusive" onClick={()=>window.dispatchEvent(new Event('rpg:resume-reforge'))}>Có kết quả tái rèn chờ chọn · Xem kết quả →</Link>}
        {path === "/" && (
          <button
            className="settings-trigger title-settings"
            aria-label="Mở Settings"
            onClick={() => setOpen(true)}
          >
            <Icon name="settings" />
          </button>
        )}
      </div>
      {notice && (
        <div className="notice" role="status" aria-live="polite">
          {notice}
        </div>
      )}
    </>
  );
}
