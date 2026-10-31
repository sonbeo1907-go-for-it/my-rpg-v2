"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useGame } from "../runtime/game-context";
import { travelerChapters, travelerStoryPage } from "../core/traveler-stories.js";
import { victoryCoinReward } from "../core/economy.js";
import { gearSlotCapacity } from "../core/gear-slots.js";
import { ELEMENT_NAMES } from "../core/content.js";
import { useRouteFilters } from "./characters";
import { ElementBadge, EmptyState, Icon, Modal, PageHeader } from "./ui";
import { QuestIllustration, QuestLayout } from "./quest-layout";

function chapterReward(content:any,encounter:any) {
  return encounter.firstClearRewards.map((reward:any) => reward.type === "gear_slot"
    ? `Mở thêm 1 ô trang bị ${content.characters[reward.characterId].name} (tối đa 6 ô)`
    : `Mở ${content.upgrades[reward.upgradeId].changes.some((change:any)=>change.type==="set_passive")?"nội tại":"nâng cấp"} ${content.upgrades[reward.upgradeId].name}`).join(" · ");
}

function StoryOpponents({content,encounter}:{content:any,encounter:any}) {
  return <div className="story-wave-scouting">{(encounter.waves??[encounter.enemies]).map((wave:string[],waveIndex:number)=><section key={waveIndex}>
    {encounter.waves&&<h4>Đợt {waveIndex+1}/{encounter.waves.length}</h4>}
    <div className="quest-enemies">{wave.map((enemyId,index)=>{const enemy=content.enemies[enemyId];return <div key={enemyId+'-'+index}><ElementBadge element={enemy.element}/><strong>{enemy.name}</strong><small>{enemy.role??'Sinh vật hoang dã'} · HP {enemy.stats.maxHp}{enemy.boss?' · '+enemy.boss.phases.length+' giai đoạn':''}</small><small>Yếu: {enemy.weaknesses?.map((element:string)=>(ELEMENT_NAMES as any)[element]).join(', ')||'Không có'}</small></div>;})}</div>
  </section>)}</div>;
}

export function TravelerStoriesPage() {
  const {content,campaign}=useGame();
  const [filters,setFilters]=useRouteFilters();
  const [perPage,setPerPage]=useState(3);
  useEffect(()=>{const media=matchMedia("(max-width: 700px)");const sync=()=>setPerPage(media.matches?1:3);sync();media.addEventListener("change",sync);return()=>media.removeEventListener("change",sync);},[]);
  const shelf=travelerStoryPage(content,Number(filters.page??1),perPage);
  return <main className="page stories-page">
    <PageHeader title="Câu chuyện lữ hành" subtitle="Mỗi người đồng hành đều mang theo một câu chuyện" />
    <div className="story-shelf" aria-label="Những câu chuyện đồng hành">
      {shelf.stories.map((story:any)=>{
        const cleared=story.chapters.filter((id:string)=>campaign.claimedFirstClearRewards.includes(id)).length;
        return <Link className={`story-book story-book-${story.id}`} href={`/stories/${story.id}`} key={story.id}>
          <img src={story.art} alt="" />
          <span className="story-book-spine" aria-hidden="true" />
          <div className="story-book-copy">
            <span className="eyebrow">{story.subtitle}</span>
            <h2>{story.name}</h2>
            <p>{story.description}</p>
            <span className="story-book-status"><Icon name={story.chapters.length?"book":"door"}/>{story.chapters.length?`${cleared}/${story.chapters.length} chương đã hoàn thành` : "Nội dung đang được viết"}</span>
            <strong>{story.chapters.length?"Mở trang sách":"Xem bìa truyện"}<span aria-hidden="true">↗</span></strong>
          </div>
        </Link>;
      })}
    </div>
    <nav className="story-pagination" aria-label="Phân trang câu chuyện">
      <button aria-label="Trang trước" disabled={shelf.page===1} onClick={()=>setFilters({...filters,page:String(shelf.page-1)})}>←</button>
      <span aria-live="polite">Trang {shelf.page} / {shelf.pages}</span>
      <button aria-label="Trang sau" disabled={shelf.page===shelf.pages} onClick={()=>setFilters({...filters,page:String(shelf.page+1)})}>→</button>
    </nav>
  </main>;
}

export function TravelerStoryPage({id}:{id:string}) {
  const {content,campaign,battle,busy,startBattle}=useGame();
  const [filters,setFilters]=useRouteFilters();
  const [confirm,setConfirm]=useState(false);
  const router=useRouter();
  const story=content.travelerStories[id];
  const chapters:any[]=travelerChapters(content,campaign,id);
  const selected=chapters.find(chapter=>chapter.id===filters.selected)??chapters.find(chapter=>!chapter.cleared&&chapter.unlocked)??chapters[0];
  const missing=selected?.requiredPartyIds?.filter((characterId:string)=>!campaign.party.includes(characterId))??[];
  const canStart=selected?.unlocked&&!missing.length&&!busy;
  useEffect(()=>setConfirm(false),[selected?.id]);
  return <main className="quest-page story-quest-page">
    <PageHeader title={story.name} subtitle={story.subtitle} back="/stories"/>
    {battle&&<Link className="resume-link" href="/battle">{battle.outcome?"Xem kết quả trận gần nhất":"Tiếp tục trận đang diễn ra"} →</Link>}
    <QuestLayout>
      <QuestIllustration art={story.art}>
        <span className="eyebrow">CÂU CHUYỆN LỮ HÀNH · {content.characters[story.characterId].name}</span>
        <h2>{selected?.name??story.name}</h2>
        <p>{selected?.description??story.description}</p>
        {selected&&<><div className="quest-rewards"><Icon name="coin"/>{victoryCoinReward(content,selected.id)} Coin khi chiến thắng</div>
          <p className="first-clear">{selected.cleared?"✓ Đã nhận phần thưởng lần đầu":`Thưởng lần đầu: ${chapterReward(content,selected)}`}</p></>}
      </QuestIllustration>
      <section className="quest-board story-chapter-board" aria-label="Các chương truyện">
        {!chapters.length?<EmptyState>Câu chuyện này chưa khai mở. Các nâng cấp của nhân vật vẫn chờ những chương tiếp theo.</EmptyState>:<>
          <div className="story-board-heading"><span className="eyebrow">NHỮNG TRANG ĐỜI ĐỒNG HÀNH</span><h2>Hành trình của {content.characters[story.characterId].name}</h2><p>{gearSlotCapacity(campaign,content,story.characterId)}/6 ô trang bị đã mở · Phần thưởng đặc biệt chỉ nhận một lần.</p></div>
          <div className="quest-list story-chapter-list">
            {chapters.map((chapter,index)=><button key={chapter.id} data-encounter-id={chapter.id} className={`quest-card ${selected.id===chapter.id?"selected":""}`} aria-pressed={selected.id===chapter.id} onClick={()=>setFilters({...filters,selected:chapter.id})}>
              <span className="quest-card-icon"><Icon name={!chapter.unlocked?"door":chapter.cleared?"check":"scroll"}/></span>
              <span><strong>{String(index+1).padStart(2,"0")} · {chapter.name}</strong><small>{!chapter.unlocked?"Hoàn thành chương trước để mở khóa":chapter.cleared?"Đã hoàn thành · Có thể đánh lại":chapterReward(content,chapter)}</small></span><span aria-hidden="true">›</span>
            </button>)}
          </div>
          <div className="quest-details">
            <h3>Đối thủ{selected.id==="iris_story_revenge"?" · Đấu đội":""}</h3>
            <StoryOpponents content={content} encounter={selected}/>
            {!selected.unlocked&&<p className="warning" role="status">Hoàn thành chương trước để mở khóa chương này.</p>}
            {selected.requiredPartyIds?.length>0&&<p className={missing.length?"warning":"first-clear"} role="status">{missing.length?`Bắt buộc có ${missing.map((id:string)=>content.characters[id].name).join(', ')} trong đội hình để xuất chiến.`:`✓ ${selected.requiredPartyIds.map((id:string)=>content.characters[id].name).join(', ')} đã sẵn sàng tham chiến.`} <Link href="/party">Chỉnh đội hình →</Link></p>}
            <button className="gold embark" disabled={!canStart} onClick={()=>setConfirm(true)}><Icon name="sword"/>Xuất chiến<span>→</span></button>
          </div>
        </>}
      </section>
    </QuestLayout>
    {confirm&&selected&&<Modal title="Sẵn sàng viết tiếp câu chuyện?" onClose={()=>setConfirm(false)} footer={<><button onClick={()=>setConfirm(false)}>Hủy</button><button className="gold" disabled={!canStart} onClick={()=>{setConfirm(false);if(startBattle(selected.id))router.push("/battle");}}>Xuất chiến</button></>}>
      <h3>{selected.name}</h3><p>{selected.description}</p>{selected.waves&&<><p>Giữ HP, MP, khiên, hiệu ứng và hồi chiêu qua các đợt. Thắng toàn bộ chuỗi mới nhận thưởng.</p><StoryOpponents content={content} encounter={selected}/></>}<p>Đội hình: {campaign.party.filter(Boolean).map((characterId:string)=>content.characters[characterId].name).join(" · ")}</p><p>{selected.cleared?"Phần thưởng đặc biệt đã nhận; trận đánh lại vẫn nhận Coin.":chapterReward(content,selected)}</p>
    </Modal>}
  </main>;
}
