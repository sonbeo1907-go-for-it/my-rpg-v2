"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "../runtime/game-context";
import { ExclusiveSlot } from "./exclusive-equipment";
import { characterCatalog } from "../core/catalog.js";
import { resolveCharacter } from "../core/progression.js";
import {
  selectPreset,
  changePresetSlot,
  renamePreset,
} from "../core/game-save.js";
import { SkillBody, PassiveBody, RulesDisclosure } from "./skill-details";
import { skillPresentation } from "../ui/skill-copy.js";
import { basicAbility, DEFEND } from "../core/battle.js";
import {
  skillCost,
  TARGET_NAMES,
  skillPreviewOptions,
} from "../ui/skill-presentation.js";
import {
  CharacterCard,
  CharacterFilters,
  ElementBadge,
  EmptyState,
  Icon,
  RoleIcon,
  Modal,
  PageHeader,
  StatGrid,
} from "./ui";

export function useRouteFilters() {
  const search = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const [filters, setLocalFilters] = useState<Record<string, string>>(() =>
    Object.fromEntries(search.entries()),
  );
  const pending = useRef<string | null>(null);
  const previousPath = useRef(path);
  useEffect(() => {
    const changedPath = previousPath.current !== path;
    previousPath.current = path;
    if (
      !changedPath &&
      pending.current !== null &&
      pending.current !== search.toString()
    )
      return;
    pending.current = null;
    setLocalFilters(Object.fromEntries(search.entries()));
  }, [search, path]);
  useEffect(() => {
    const pop = () => {
      pending.current = null;
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  return [
    filters,
    (values: any) => {
      const next = new URLSearchParams();
      for (const [key, value] of Object.entries(values))
        if (value) next.set(key, String(value));
      pending.current = next.toString();
      setLocalFilters(Object.fromEntries(next.entries()));
      router.replace(`${path}?${next}`, { scroll: false });
    },
  ] as const;
}
export function CharactersPage() {
  const { content, campaign } = useGame();
  const [filters, setFilters] = useRouteFilters();
  const roster: any[] = characterCatalog(content, campaign, filters);
  const back = `/characters?${new URLSearchParams(filters)}`;
  return (
    <main className="page">
      <PageHeader
        title="Những người đồng hành"
        subtitle={`${campaign.unlockedCharacterIds.length} đã sở hữu · ${Object.keys(content.characters).length} nhân vật`}
      />
      <CharacterFilters filters={filters} onChange={setFilters} />
      <div className="catalog-heading">
        <span>{roster.length} nhân vật</span>
        <p>Chọn một đồng đội để xem câu chuyện và kỹ năng.</p>
      </div>
      <div className="character-grid">
        {roster.map((actor) => (
          <Link
            href={`/characters/${actor.id}?back=${encodeURIComponent(back)}`}
            key={actor.id}
          >
            <CharacterCard
              actor={actor}
              owned={campaign.unlockedCharacterIds.includes(actor.id)}
            />
          </Link>
        ))}
      </div>
      {!roster.length && (
        <EmptyState>Không có nhân vật phù hợp bộ lọc.</EmptyState>
      )}
    </main>
  );
}
export function SkillCard({ skill, actor }: { skill: any; actor: any }) {
  const { content } = useGame();
  const [choices, setChoices] = useState<any>({});
  const controls = skillPreviewOptions(skill, actor, content);
  return (
    <article className="skill-card">
      <div className="skill-heading">
        <h3>{skill.name}</h3>
        <span>{skillCost(skill, actor)}</span>
      </div>
      <div className="skill-meta">
        <span>{(TARGET_NAMES as any)[skill.target]}</span>
        {skill.activation === "passive" && <span>Tự động</span>}
      </div>
      <SkillBody skill={skill} actor={actor} content={content} choices={Object.fromEntries(controls.map((control:any)=>[control.key,choices[control.key]??control.min]))}/>
      <RulesDisclosure rules={skillPresentation(skill,actor,content).rules} title={controls.length ? "Chi tiết cơ chế & giả định" : "Chi tiết cơ chế"}>
        {controls.length>0 ? controls.map((control:any)=><label className="skill-assumption" key={control.key}>
          {control.label}: {choices[control.key]??control.min}
          <input type="range" min={control.min} max={control.max} value={choices[control.key]??control.min} onChange={event=>setChoices({...choices,[control.key]:Number(event.target.value)})}/>
        </label>) : undefined}
      </RulesDisclosure>
    </article>
  );
}
export function CharacterDetail({ id }: { id: string }) {
  const { content, campaign } = useGame();
  const search = useSearchParams();
  const requested = search.get("back") ?? "/characters";
  const back =
    requested === "/party" ||
    requested.startsWith("/party?") ||
    requested === "/characters" ||
    requested.startsWith("/characters?")
      ? requested
      : "/characters";
  if (!Object.hasOwn(content.characters, id))
    return (
      <main className="page">
        <PageHeader title="Không tìm thấy nhân vật" back="/characters" />
        <EmptyState>Đồng đội này chưa có trong hành trình.</EmptyState>
      </main>
    );
  const actor = resolveCharacter(content, campaign, id);
  const owned = campaign.unlockedCharacterIds.includes(id);
  const skills = [
    basicAbility(actor),
    ...actor.abilities.map((ability: string) => content.abilities[ability]),
    DEFEND,
  ];
  if (actor.passive?.followUpAbility)
    skills.push(content.abilities[actor.passive.followUpAbility]);
  if (actor.passive?.type === "field_growth")
    skills.push(
      content.abilities[
        content.statuses[actor.passive.statusId].turnStartAbility
      ],
    );
  return (
    <main className="page">
      <PageHeader title={actor.name} subtitle={actor.title} back={back}>
        <Link
          className="button gold"
          href={`/characters/${id}/equipment?back=${encodeURIComponent(back)}`}
        >
          <Icon name="shield" />
          Trang bị
        </Link>
      </PageHeader>
      <div className="character-overview" data-element={actor.element}>
        <CharacterCard actor={actor} owned={owned} />
        <section className="panel">
          <ElementBadge element={actor.element} />
          <h2>{actor.role}</h2>
          <p className="muted">{actor.affiliation}</p>
          <p>{actor.description}</p>
          {actor.biography && <RulesDisclosure title="Bối cảnh nhân vật"><p>{actor.biography}</p></RulesDisclosure>}
          <StatGrid actor={actor} showGearBonuses />
          <ExclusiveSlot characterId={id}/>
          <p className="stat-breakdown-note">
            Chỉ số trên đã bao gồm trang bị, đội hình và nội tại. Phần cộng từ
            trang bị hiển thị trước các hiệu ứng tăng theo phần trăm.
          </p>
          <PassiveBody actor={actor} content={content}/>
          {actor.teamBonusSources?.length > 0 && (
            <p className="muted">
              Bonus đội hình:{" "}
              {actor.teamBonusSources
                .map((source: any) => `${source.name} (${source.count})`)
                .join(" · ")}
            </p>
          )}
          {!owned && (
            <p className="warning">
              Chưa sở hữu. Có thể xem trước bộ kỹ năng; cần mở khóa để xếp đội
              hoặc trang bị.
            </p>
          )}
        </section>
      </div>
      <div className="section-heading">
        <div>
          <span className="eyebrow">SỨC MẠNH & DẤU ẤN</span>
          <h2>Kỹ năng</h2>
        </div>
        <p>Hệ số theo tiến trình và chỉ số chuẩn bị hiện tại.</p>
      </div>
      <RulesDisclosure title="Quy ước chiến đấu"><div className="character-copy-guide"><p>ATK/MAG quyết định sức mạnh; đòn vật lí tính DEF, phép tính RES. Hệ số sát thương hiển thị trước phòng thủ và điểm yếu.</p><p>Lượt là lượt của người mang hiệu ứng; buff tự dùng bắt đầu tính từ lượt kế tiếp. Vòng gồm lượt chính và Vòng Phụ; giới hạn một lần/vòng dùng chung cả hai. “Cuối lượt” khác “cuối vòng”.</p><p>Hồi HP/MP không vượt tối đa; hồi MP theo tỷ lệ làm tròn lên. Khiên không cộng dồn, giữ khiên mạnh hơn. Hiệu ứng cùng tên làm mới; chỉ cộng tầng khi có ghi rõ.</p></div></RulesDisclosure>
      <div className="skill-grid">
        {skills.map((skill: any) => (
          <SkillCard key={skill.id} skill={skill} actor={actor} />
        ))}
      </div>
    </main>
  );
}
export function PartyPage() {
  const { content, campaign, transact, busy } = useGame();
  const [slot, setSlot] = useState<number | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>({
    sort: "name",
    direction: "asc",
  });
  const active = campaign.partyPresets.find(
    (preset: any) => preset.id === campaign.activePartyPresetId,
  );
  const returnParams = useSearchParams();
  const fromDungeon = returnParams.get("fromDungeon");
  const difficulty = ["easy", "medium", "hard"].includes(
    returnParams.get("difficulty") ?? "",
  )
    ? returnParams.get("difficulty")!
    : "easy";
  const partyPath =
    fromDungeon && Object.hasOwn(content.dungeons, fromDungeon)
      ? `/party?fromDungeon=${fromDungeon}&difficulty=${difficulty}`
      : "/party";
  const partyBack =
    partyPath === "/party"
      ? "/home"
      : `/dungeon/${fromDungeon}?selected=${difficulty}`;
  const [name, setName] = useState(active.name);
  useEffect(() => setName(active.name), [active.name]);
  const roster: any[] = useMemo(
    () => characterCatalog(content, campaign, filters, true),
    [content, campaign, filters],
  );
  const open = (index: number) => {
    setSlot(index);
    setSelected(campaign.party[index] ?? null);
  };
  const changeSlot = async (id: string | null) => {
    if (
      slot !== null &&
      (await transact(
        (current) => changePresetSlot(current, slot, id),
        id
          ? "Đã lưu đội hình. Áp dụng ở trận tiếp theo."
          : "Đã gỡ nhân vật khỏi vị trí.",
      ))
    )
      setSlot(null);
  };
  return (
    <main className="page party-page">
      <PageHeader
        title="Đội hình"
        back={partyBack}
        subtitle="Bốn người đồng hành · Năm đội hình · Một hành trình"
      />
      <div className="preset-bar" aria-label="Đội hình đã lưu">
        {campaign.partyPresets.map((preset: any, i: number) => (
          <button
            key={preset.id}
            className={active.id === preset.id ? "active" : ""}
            disabled={busy}
            onClick={() =>
              transact(
                (current) => selectPreset(current, preset.id),
                `Đang dùng ${preset.name}.`,
              )
            }
          >
            <span>0{i + 1}</span>
            {preset.name}
            <small>{preset.slots ? "Đã lưu" : "Chưa dùng"}</small>
          </button>
        ))}
      </div>
      <div className="party-name">
        <Icon name="party" />
        <label>
          Tên đội
          <input
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button
          disabled={busy || !name.trim() || name.trim() === active.name}
          onClick={() => transact((current) => renamePreset(current, name))}
        >
          Lưu tên
        </button>
        <span className="muted">Đội hình tự lưu sau mỗi thay đổi.</span>
      </div>
      <div className="party-grid">
        {Array.from({ length: 4 }, (_, index) => {
          const id = campaign.party[index];
          const actor = id ? resolveCharacter(content, campaign, id) : null;
          return (
            <article
              className={`party-member ${actor ? "" : "empty"}`}
              data-element={actor?.element}
              key={index}
            >
              <span className="slot-number">VỊ TRÍ 0{index + 1}</span>
              {actor ? (
                <>
                  <button
                    className="party-member-select"
                    disabled={busy}
                    onClick={() => open(index)}
                  >
                    <ElementBadge element={actor.element} />
                    <div className="party-emblem">
                      <RoleIcon roleGroup={actor.roleGroup} />
                    </div>
                    <h2>{actor.name}</h2>
                    <p>{actor.role}</p>
                    <StatGrid actor={actor} compact />
                  </button>
                  <Link
                    className="button detail-button"
                    href={`/characters/${id}?back=${encodeURIComponent(partyPath)}`}
                  >
                    Chi Tiết <span>↗</span>
                  </Link>
                </>
              ) : (
                <button
                  className="add-member"
                  disabled={busy}
                  aria-label={`Chọn nhân vật vị trí ${index + 1}`}
                  onClick={() => open(index)}
                >
                  <Icon name="plus" />
                  <span>Thêm đồng đội</span>
                </button>
              )}
            </article>
          );
        })}
      </div>
      <p className="page-note">
        Trang bị dùng chung theo nhân vật giữa các đội. Thay đổi đội hình không
        tác động trận đang diễn ra.
      </p>
      {slot !== null && (
        <Modal
          title={`Chọn đồng đội · Vị trí ${slot + 1}`}
          initialFocus=".modal-grid button"
          onClose={() => setSlot(null)}
          footer={
            <>
              <span>
                {selected
                  ? content.characters[selected].name
                  : "Chọn một đồng đội"}
              </span>
              <button
                className="danger"
                disabled={
                  busy ||
                  !campaign.party[slot] ||
                  campaign.party.filter(Boolean).length === 1
                }
                onClick={() => changeSlot(null)}
              >
                − Gỡ khỏi vị trí
              </button>
              <button
                className="confirm"
                disabled={busy || !selected}
                onClick={() => changeSlot(selected)}
              >
                ✓ Xếp vào vị trí
              </button>
            </>
          }
        >
          <CharacterFilters filters={filters} onChange={setFilters} ownedOnly />
          <div className="character-grid modal-grid">
            {roster.map((actor) => (
              <CharacterCard
                key={actor.id}
                actor={actor}
                selected={selected === actor.id}
                onClick={() => setSelected(actor.id)}
              />
            ))}
          </div>
          {!roster.length && (
            <EmptyState>
              Không có đồng đội phù hợp. Modal chỉ hiển thị nhân vật đã sở hữu.
            </EmptyState>
          )}
        </Modal>
      )}
    </main>
  );
}
