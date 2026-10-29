"use client";
import { useId, type CSSProperties } from "react";
import { useGame } from "../runtime/game-context";
import { GEAR_NAMES, STAT_LABELS } from "../core/catalog.js";
import { SUMMON_RARITIES, summonRarity } from "../core/summon-presentation.js";
import { RoleIcon, Icon, ElementBadge } from "./ui";

export function rarityStyle(rarity: string): CSSProperties {
  return {
    "--rarity-color": (SUMMON_RARITIES as any)[rarity].color,
  } as CSSProperties;
}
export function GearEmblem({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`gear-emblem ${className}`}
      viewBox="0 0 120 160"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="59" cy="48" r="23" />
      <circle cx="59" cy="48" r="16" />
      <path d="m50 22 9-14 10 14-10 9z" />
      <g transform="rotate(32 61 90)">
        <path d="m57 25 5-9 5 9v78H57z" />
        <path d="M46 107h32M62 107v31M55 142h14" />
      </g>
      <path d="m52 77 36 13-4 29c-2 15-16 25-32 33-16-8-29-18-31-33l-4-29z" />
      <path d="M52 88v48m-24-39 24-9 24 9-3 19c-1 9-11 17-21 22-10-5-20-13-21-22z" />
    </svg>
  );
}
export function SummonCardBack({ result }: { result: any }) {
  const { content } = useGame();
  const rarity = summonRarity(result);
  const level = (SUMMON_RARITIES as any)[rarity].rank;
  const id = useId().replace(/:/g, "");
  const actor =
    result.kind === "character" ? content.characters[result.characterId] : null;
  return (
    <div
      className={`summon-card-back ${rarity}`}
      style={rarityStyle(rarity)}
      data-cardback-tier={level}
    >
      <svg
        className="cardback-ornament"
        viewBox="0 0 320 520"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id={`runes-${id}`}
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path d="m20 8 12 12-12 12L8 20z" strokeWidth=".7" opacity=".22" />
          </pattern>
        </defs>
        <rect
          width="320"
          height="520"
          fill={`url(#runes-${id})`}
          stroke="none"
        />
        <path
          d="M20 50V20h30m220 0h30v30M20 470v30h30m220 0h30v-30"
          strokeWidth="3"
        />
        <rect x="29" y="29" width="262" height="462" rx="3" />
        {level >= 2 && (
          <>
            <rect x="40" y="40" width="240" height="440" />
            <path d="m160 57 22 22-22 22-22-22Zm0 362 22 22-22 22-22-22Z" />
            <circle cx="160" cy="260" r="110" />
            <circle cx="160" cy="260" r="102" strokeDasharray="2 8" />
          </>
        )}
        {level >= 3 && (
          <>
            <path d="M44 120c40-50 74-63 116-63s76 13 116 63M44 400c40 50 74 63 116 63s76-13 116-63" />
            <path d="m52 65 15-15 15 15-15 15Zm186 0 15-15 15 15-15 15ZM52 455l15-15 15 15-15 15Zm186 0 15-15 15 15-15 15Z" />
            <circle cx="160" cy="260" r="122" strokeDasharray="9 5 2 5" />
            {Array.from({ length: 12 }, (_, index) => (
              <path
                key={index}
                d="m160 119 5 10-5 10-5-10Z"
                transform={`rotate(${index * 30} 160 260)`}
              />
            ))}
          </>
        )}
        {level >= 4 && (
          <>
            <path d="M14 95 7 83l7-12 7 12Zm292 0 7-12-7-12-7 12ZM14 449l-7-12 7-12 7 12Zm292 0 7-12-7-12-7 12" />
            <path d="M65 29 90 12h140l25 17M65 491l25 17h140l25-17" />
            <circle cx="160" cy="260" r="138" />
          </>
        )}
      </svg>
      <div className="cardback-center">
        {actor ? <RoleIcon roleGroup={actor.roleGroup} /> : <GearEmblem />}
      </div>
      <span className="cardback-inscription">NORTHERN PRISMA</span>
      <div className="cardback-marks">
        {Array.from({ length: level }, (_, index) => (
          <span key={index}>◆</span>
        ))}
      </div>
    </div>
  );
}
export function SummonCardFront({
  result,
  compact = false,
}: {
  result: any;
  compact?: boolean;
}) {
  const { content } = useGame();
  const rarity = summonRarity(result);
  const actor =
    result.kind === "character" ? content.characters[result.characterId] : null;
  return (
    <div
      className={`summon-card-front ${rarity} ${compact ? "compact" : ""}`}
      style={rarityStyle(rarity)}
    >
      <div className="summon-card-rays" />
      {actor ? (
        <img
          className="summon-silhouette"
          src={`/art/silhouette-${actor.roleGroup}.svg`}
          alt=""
        />
      ) : (
        <div className="summon-gear-art">
          <GearEmblem />
        </div>
      )}
      <div className="summon-card-top">
        <span>{(SUMMON_RARITIES as any)[rarity].name}</span>
        {actor && !result.duplicate && (
          <strong className="summon-new">NEW</strong>
        )}
        {result.guaranteed && <span className="pity-badge">PITY</span>}
      </div>
      <div className="summon-card-copy">
        {actor ? (
          <>
            <span className="summon-role-seal">
              <RoleIcon roleGroup={actor.roleGroup} />
            </span>
            <ElementBadge element={actor.element} />
            <h3>{actor.name}</h3>
            <p>{actor.role}</p>
            <div className="summon-card-reward">
              {result.duplicate
                ? `Bản trùng · +${result.shards} Pure Prisma`
                : "Đồng đội mới"}
              <small>
                {result.slotUnlocked
                  ? `Mở ô trang bị ${result.gearSlots}/6`
                  : `${result.gearSlots}/6 ô trang bị`}
              </small>
            </div>
          </>
        ) : (
          <>
            <span className="summon-tier-seal">
              <Icon name="shield" />
            </span>
            <h3>{(GEAR_NAMES as any)[result.gear.typeId]}</h3>
            <p>
              {Object.entries(result.gear.stats)
                .map(([key, value]) => `${(STAT_LABELS as any)[key]} +${value}`)
                .join(" · ")}
            </p>
            <div className="summon-card-reward">
              {result.dismantled ? 'Đã phân rã' : 'Đã vào túi đồ'}<small>#{result.gear.id.slice(5)}</small>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
