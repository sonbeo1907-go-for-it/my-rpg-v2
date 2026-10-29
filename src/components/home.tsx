"use client";
import Link from "next/link";
import { useState } from "react";
import { useGame } from "../runtime/game-context";
import { Icon, fmt } from "./ui";
import {
  ProfileSelection,
  ProfileNameDialog,
  SwitchProfileButton,
} from "./profiles";

export function TitlePage() {
  return (
    <main className="title-screen profile-title-screen">
      <div className="scene-background tavern-background" />
      <div className="title-vignette" />
      <div className="title-content">
        <span className="title-overline">MỘT LỜI HỨA TỪ PHƯƠNG BẮC</span>
        <div className="title-crest">
          <Icon />
        </div>
        <h1>
          Northern
          <br />
          <em>Prisma</em>
        </h1>
        <span className="title-rule" />
        <p>
          Giữa những mảnh sáng lạc lối,
          <br />
          một hành trình đang chờ được đánh thức.
        </p>
      </div>
      <ProfileSelection />
      <span className="title-version">CHRONICLES OF THE NORTH · v2</span>
    </main>
  );
}
const menu = [
  {
    href: "/shop",
    name: "Shop",
    sub: "Prisma & những cuộc gặp gỡ",
    icon: "shop",
    side: "left",
  },
  {
    href: "/inventory",
    name: "Túi Đồ",
    sub: "Hành trang của lữ khách",
    icon: "bag",
    side: "left",
  },
  {
    href: "/party",
    name: "Đội Hình",
    sub: "Những lời thề sát cánh",
    icon: "party",
    side: "left",
  },
  {
    href: "/characters?ownership=owned",
    name: "Nhân Vật",
    sub: "Những người đồng hành",
    icon: "book",
    side: "left",
  },
  {
    href: "/quests",
    name: "Quest",
    sub: "Những trang truyện chưa kể",
    icon: "scroll",
    side: "right",
  },
  {
    href: "/dungeon",
    name: "Khám Phá Hầm Ngục",
    sub: "Cánh cửa chưa khai mở",
    icon: "door",
    side: "right",
  },
  {
    href: "/recruitment",
    name: "Chiêu Mộ",
    sub: "Lời gọi từ định mệnh",
    icon: "prism",
    side: "right",
  },
];
export function HomePage() {
  const {
    campaign,
    battle,
    activeProfile,
    renameProfile,
    openSaveDirectory,
    busy,
  } = useGame();
  const [renaming, setRenaming] = useState(false);
  const preset = campaign.partyPresets.find(
    (item: any) => item.id === campaign.activePartyPresetId,
  );
  return (
    <main className="home-screen">
      <div className="scene-background tavern-background" />
      <div className="home-shade" />
      <button
        className="home-profile"
        aria-label="Đổi tên người chơi"
        disabled={busy}
        onClick={() => setRenaming(true)}
      >
        <div className="profile-seal">
          <Icon name="shield" />
        </div>
        <div>
          <span className="eyebrow">LỮ KHÁCH PHƯƠNG BẮC</span>
          <h1>{activeProfile?.username ?? "Người lữ hành"}</h1>
          <p>
            {preset.name} <span>·</span> {campaign.victories} chiến thắng
          </p>
        </div>
      </button>
      <button className="home-export" onClick={openSaveDirectory}>
        <Icon name="folder" />
        <span>Mở thư mục lưu dữ liệu game</span>
      </button>
      <nav className="home-nav home-nav-left" aria-label="Chuẩn bị hành trình">
        {menu
          .filter((item) => item.side === "left")
          .map((item) => (
            <Link className="home-menu-link" href={item.href} key={item.href}>
              <Icon name={item.icon} />
              <span>
                {item.name}
                <small>{item.sub}</small>
              </span>
            </Link>
          ))}
      </nav>
      <nav className="home-nav home-nav-right" aria-label="Tiếp tục hành trình">
        {menu
          .filter((item) => item.side === "right")
          .map((item) => (
            <Link className="home-menu-link" href={item.href} key={item.href}>
              <Icon name={item.icon} />
              <span>
                {item.name}
                <small>{item.sub}</small>
              </span>
            </Link>
          ))}
      </nav>
      <div className="home-caption">
        <span>QUÁN TRỌ PHƯƠNG BẮC</span>
        <p>Chưa có cuộc hành trình nào bắt đầu bằng một lời từ biệt.</p>
      </div>
      {battle && (
        <Link className="continue-battle button gold" href="/battle">
          {battle.outcome ? "Xem kết quả trận" : "Tiếp tục trận đang chơi"} →
        </Link>
      )}
      <SwitchProfileButton />
      {renaming && (
        <ProfileNameDialog
          title="Đổi tên người chơi"
          initialName={activeProfile?.username ?? ""}
          onClose={() => setRenaming(false)}
          onSave={renameProfile}
        />
      )}
    </main>
  );
}
