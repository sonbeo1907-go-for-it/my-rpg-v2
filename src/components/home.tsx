"use client";
import Link from "next/link";
import { useState } from "react";
import { useGame } from "../runtime/game-context";
import { Icon, Modal, fmt } from "./ui";
import { DailyCommissions } from "./daily-commissions";
import { TavernRecruitment } from "./rate-up-banner";
import { BrandLogo } from "./brand-logo";
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
      <div className="title-content origin-title-content">
        <h1 className="title-logo" aria-label="The Prisma Origin"><BrandLogo /></h1>
      </div>
      <ProfileSelection />
      <span className="title-version">THE PRISMA ORIGIN · v2</span>
    </main>
  );
}
const menu = [
  {
    href: "/quests",
    name: "Quest",
    sub: "Những trang truyện chưa kể",
    icon: "scroll",
    side: "right",
  },
  {href:"/stories",name:"Câu chuyện lữ hành",sub:"Những trang đời đồng hành",icon:"book",side:"right"},
  {href:"/blacksmith",name:"Thợ Rèn",sub:"Lửa lò & những món Trấn Phái",icon:"anvil",side:"left"},
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
  {href:"/chronicles",name:"Biên Niên Ký",sub:"Những miền đất đang sống",icon:"book",side:"right"},
  {
    href: "/dungeon",
    name: "Khám Phá Hầm Ngục",
    sub: "Vàng bạc & thử thách mỗi ngày",
    icon: "door",
    side: "right",
  },
  {
    href: "/arena",
    name: "Đấu Trường",
    sub: "So tài cùng những ảnh gương",
    icon: "sword",
    side: "right",
  },
];
export function HomePage() {
  const {
    campaign,
    battle,
    activeProfile,
    renameProfile,
    busy,
  } = useGame();
  const [profileMenu,setProfileMenu]=useState(false);
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
        aria-label="Hồ sơ người chơi"
        disabled={busy}
        onClick={() => setProfileMenu(true)}
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
      <DailyCommissions />
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
      <TavernRecruitment />
      {profileMenu&&<Modal title="Hồ sơ người chơi" onClose={()=>setProfileMenu(false)}><div className="stack-actions"><button onClick={()=>{setProfileMenu(false);setRenaming(true);}}>Đổi tên người chơi</button><SwitchProfileButton className="button" onLeave={()=>setProfileMenu(false)}/></div></Modal>}
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
