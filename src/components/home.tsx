"use client";
import Link from "next/link";
import {selectedHomeScene} from "../core/home-scenes.js";
import {HomeSceneDialog} from "./home-scenes";
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
  {href:"/bestiary",name:"Bách Khoa Quái Vật",sub:"Ghi chép những kẻ thù đã gặp",icon:"book",side:"left"},
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
  const [scenePicker,setScenePicker]=useState(false);
  const scene=selectedHomeScene(campaign);
  const [renaming, setRenaming] = useState(false);
  const preset = campaign.partyPresets.find(
    (item: any) => item.id === campaign.activePartyPresetId,
  );
  return (
    <main className="home-screen" data-home-scene={scene.id}>
      <div className="scene-background home-scene-background" style={{backgroundImage:`url(${scene.art})`}} />
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
      {!battle&&campaign.tournaments?.activeRun&&(campaign.tournaments.activeRun.battleCheckpoint||campaign.tournaments.activeRun.specialEncounter?.checkpoint)&&<Link className="continue-battle button gold" href="/chronicles/academy">Tiếp tục trận tự thí →</Link>}
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
        <span>{scene.name}</span>
        <p>{scene.caption}</p>
      </div>
      {battle && (
        <Link className="continue-battle button gold" href="/battle">
          {battle.outcome ? "Xem kết quả trận" : "Tiếp tục trận đang chơi"} →
        </Link>
      )}
      <TavernRecruitment />
      {profileMenu&&<Modal title="Hồ sơ người chơi" onClose={()=>setProfileMenu(false)}><div className="stack-actions"><button onClick={()=>{setProfileMenu(false);setScenePicker(true);}}>Đổi cảnh nền và nhạc</button><button onClick={()=>{setProfileMenu(false);setRenaming(true);}}>Đổi tên người chơi</button><SwitchProfileButton className="button" onLeave={()=>setProfileMenu(false)}/></div></Modal>}
      {scenePicker&&<HomeSceneDialog onClose={()=>setScenePicker(false)}/>}
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
