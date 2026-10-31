"use client";
import {commandAbilityIds} from '../core/combat-modes.js';
import { SummonScenes } from './summon-scenes';
import { FormulaBoards, FormulaForecast, FormulaSkillTag, FormulaScene, FormulaEditControl } from './formula-board';
import { CombatEffects } from "./combat-effects";
import { AcademicEffects } from './academic-effects';
import { activeFormula, defaultFormulaEdit, validateFormulaEdit } from '../core/formula-field.js';
import { TurnOrder } from "./turn-order";
import { CosmicEffects } from "./cosmic-effects";
import { targetsAsGroup, randomTargetLabel, resourceCost } from "../core/conditional-combat.js";
import { encounterReturnPath } from "../core/quest-catalog.js";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useGame } from "../runtime/game-context";
import { basicAbility, DEFEND, abilityAvailability, targetsFor } from "../core/battle.js";
import { activeStatuses } from "../core/status-state.js";
import { ELEMENT_NAMES, DAMAGE_TYPE_NAMES } from "../core/content.js";
import { bossPhase, bossFireMultiplier } from "../core/boss-mechanics.js";
import { battleStat } from "../core/stat-values.js";
import { FOLLOW_UP_LABEL } from "../core/follow-up.js";
import {
  skillCost,
  TARGET_NAMES,
} from "../ui/skill-presentation.js";
import {
  resolveCombatTargets,
  compactSkillScaling,
  statusDetails,
  liveSkillChoices,
  compactNumber,
} from "../ui/combat-presentation.js";
import { ElementBadge, EmptyState, Icon, PageHeader } from "./ui";
import { SkillBody } from "./skill-details";
import { CombatPopover } from "./combat-popover";
import { victoryCoinReward } from "../core/economy.js";
import { useSettings } from "../runtime/settings-context";
import { dungeonDailyState } from "../core/dungeon-rules.js";
import {
  dungeonRewardText,
  enemyScaleSummary,
} from "../ui/dungeon-presentation.js";

function StatusBadge({ status, actor }: { status: any; actor: any }) {
  const { content, battle } = useGame();
  const definition = content.statuses[status.id];
  const info = statusDetails(status, actor, battle, content);
  return (
    <CombatPopover
      label={`Hiệu ứng ${definition.name}`}
      content={
        <>
          <span className="eyebrow">
            {definition.kind === "debuff"
              ? "HIỆU ỨNG BẤT LỢI"
              : "HIỆU ỨNG CÓ LỢI"}
          </span>
          <h3>{definition.name}</h3>
          <p>Nguồn: {info.source}</p>
          <p className="popover-duration">
            {info.duration}
            {status.stacks > 1 ? ` · ${status.stacks} tầng` : ""}
          </p>
          {info.lines.map((line: string, index: number) => (
            <p key={index}>{line}</p>
          ))}
        </>
      }
    >
      <button
        type="button"
        className={`status-badge ${definition.kind}`}
        aria-label={`Xem hiệu ứng ${definition.name}`}
        onClick={(event) => event.stopPropagation()}
      >
        {definition.name}
        {status.stacks > 1 ? ` ×${status.stacks}` : ""} (
        {definition.effectImmunity
          ? `${status.charges} lần`
          : status.remaining === null
            ? definition.consumeOnAttack
              ? "đòn kế"
              : "duy trì"
            : status.remaining}
        )
      </button>
    </CombatPopover>
  );
}
export function CombatantCard({
  actor,
  selected,
  affected,
  hovered,
  selectable,
  legal,
  onSelect,
}: {
  actor: any;
  selected: boolean;
  affected: boolean;
  hovered: boolean;
  selectable: boolean;
  legal: boolean;
  onSelect: () => void;
}) {
  const { battle } = useGame();
  const acting = battle.activeId === actor.id && !battle.outcome;
  return (
    <article
      className={`combatant ${actor.hp <= 0 ? "fallen" : ""} ${acting ? "current-turn" : ""} ${actor.shield > 0 ? "has-shield" : ""} ${selected ? "is-target" : ""} ${affected ? "is-affected" : ""} ${hovered ? "turn-hovered" : ""}`}
      data-actor-id={actor.id}
      data-team={actor.team}
      data-element={actor.element}
    >
      <button
        className="target-hitbox"
        data-gamepad-target={actor.id}
        data-gamepad-legal={legal}
        aria-label={`Chọn mục tiêu: ${actor.name}`}
        aria-pressed={selected}
        disabled={!selectable || actor.hp <= 0}
        onClick={onSelect}
      />
      {selected && (
        <span className="target-corners" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
      )}
      {acting && <span className="acting-label">◆ Đang hành động</span>}
      <ElementBadge element={actor.element} />
      <h3>{actor.name}</h3>
      <small>{actor.role ?? (actor.boss ? "Siêu trùm" : "Đối thủ")}</small>
      {actor.team === "enemy" &&
        Boolean(
          actor.weaknesses?.length || actor.damageTypeWeaknesses?.length,
        ) && (
          <p className="weakness">
            Yếu:{" "}
            {[
              ...(actor.weaknesses?.map(
                (element: string) => (ELEMENT_NAMES as any)[element],
              ) ?? []),
              ...(actor.damageTypeWeaknesses?.map(
                (type: string) => `Mọi đòn ${(DAMAGE_TYPE_NAMES as any)[type]}`,
              ) ?? []),
            ].join(" / ")}{" "}
            (+50%)
          </p>
        )}
      <div className="combat-bars">
        <label>
          <span>
            HP {actor.hp} / {actor.stats.maxHp}
          </span>
          <progress
            className="hp-bar"
            max={actor.stats.maxHp}
            value={actor.hp}
          />
        </label>
        <label>
          <span>
            MP {actor.mp} / {actor.stats.maxMp}
          </span>
          <progress
            className="mp-bar"
            max={Math.max(1, actor.stats.maxMp)}
            value={actor.mp}
          />
        </label>
      </div>
      {actor.shield > 0 && (
        <p className="shield-value">
          <Icon name="shield" />
          Khiên: {actor.shield}
          {actor.shieldExpiresAfterRound !== undefined && <small> · đến cuối vòng {actor.shieldExpiresAfterRound}</small>}
        </p>
      )}
      {Object.entries(actor.resources ?? {}).map(
        ([id, definition]: [string, any]) => (
          <p key={id} className="resource-value">
            {definition.name}: {actor.resourceValues[id]} / {definition.max}
          </p>
        ),
      )}
      {actor.passive?.type==='detonation_base_growth' && <p className="resource-value">Tia sáng: +{actor.detonationBonus??0} / {actor.passive.cap} MAG</p>}
      <div className="status-list">
        {activeStatuses(actor).map((status: any) => (
          <StatusBadge key={status.id} status={status} actor={actor} />
        ))}
      </div>
    </article>
  );
}
function SkillInfo({
  skill,
  actor,
  target,
  reason,
}: {
  skill: any;
  actor: any;
  target: any;
  reason: string;
}) {
  const { content, battle } = useGame();
  const choices = liveSkillChoices(skill, actor, target, {...battle,content});
  const cost = resourceCost(skill,actor);
  return (
    <>
      <span className="eyebrow">THÔNG TIN KỸ NĂNG</span>
      <h3>{skill.name}</h3>
      <div className="popover-meta">
        <span>{skillCost(skill, actor)}</span>
        <span>{(TARGET_NAMES as any)[skill.target]}</span>
      </div>
      {reason && <p className="unavailable-reason">{reason}</p>}
      <SkillBody skill={skill} actor={actor} content={content} choices={choices} combat/>
      <FormulaForecast battle={{...battle,content}} actor={actor} skill={skill}/>
      {cost && (
        <p>
          {actor.resources[cost.id].name}: {actor.resourceValues[cost.id] ?? 0}/
          {actor.resources[cost.id].max} ·{" "}
          {reason
            ? "Chưa đủ điều kiện thi triển."
            : `Sẽ tiêu ${choices.spent} khi dùng.`}
        </p>
      )}
      {skill.effects.some((effect: any) => effect.consumeStatus) && (
        <p>
          Mảnh trên {target?.name ?? "mục tiêu"}: {choices.stacks}.{" "}
          {skill.target === "all_enemies"
            ? "Mỗi đối thủ tính riêng số mảnh đang có."
            : ""}
        </p>
      )}
      <p className="popover-target">
        {skill.target === "adjacent_allies" ? "Hai ô kề: " + targetsFor({...battle,content},actor,skill).map((item:any)=>item.name).join(" · ") : skill.target === "random_enemies" ? randomTargetLabel(skill) : skill.target.startsWith("all_")
          ? (TARGET_NAMES as any)[skill.target] + (skill.effects.some((effect:any)=>effect.primaryMultiplier!==undefined) ? ` · Chính: ${target?.name ?? ""}` : "")
          : `Mục tiêu: ${target?.name ?? actor.name}`}
      </p>

    </>
  );
}
function SkillCommand({
  skill,
  actor,
  target,
  selected,
  onSelect,
}: {
  skill: any;
  actor: any;
  target: any;
  selected: boolean;
  onSelect: () => void;
}) {
  const { content, battle, busy, battleUI } = useGame();
  const available = abilityAvailability({ ...battle, content }, actor, skill);
  const previewTargets = resolveCombatTargets(
    { ...battle, content },
    actor,
    skill,
    battleUI,
  );
  const previewTarget =
    battle.actors.find((item: any) => item.id === previewTargets.targetId) ??
    target;
  return (
    <CombatPopover
      label={`Kỹ năng ${skill.name}`}
      content={
        <SkillInfo
          skill={skill}
          actor={actor}
          target={previewTarget}
          reason={available.reason}
        />
      }
    >
      <button
        className={`skill-command ${selected ? "selected" : ""}`}
        data-gamepad-skill={skill.id}
        aria-pressed={selected}
        aria-disabled={busy || !available.ok}
        onClick={() => {
          if (!busy && available.ok) onSelect();
        }}
      >
        <strong>{skill.name}<FormulaSkillTag battle={{...battle,content}} actor={actor} skill={skill}/></strong>
        <span className="command-scaling">
          {compactSkillScaling(skill, actor, previewTarget, content, battle)}
        </span>
      </button>
    </CombatPopover>
  );
}
function BossPhasePanel({ boss }: { boss: any }) {
  const { content } = useGame();
  const phase = bossPhase(boss);
  if (!phase) return null;
  const suppression = boss.statuses.find(
    (status: any) => status.id === boss.boss.suppression?.statusId,
  );
  return (
    <section className="boss-phase-panel">
      <div>
        <span className="eyebrow">
          GIAI ĐOẠN {boss.bossState.phase} / {boss.boss.phases.length}
        </span>
        <h3>{phase.name}</h3>
      </div>
      {boss.boss.suppression && <span>
        Kìm hãm {suppression?.stacks ?? 0}/{boss.boss.suppression.maxStacks}
        {suppression ? ` · ${suppression.remaining} lượt boss` : ""}
      </span>}
      <span>
        {boss.boss.suppression ? `Sát thương Hỏa ×${bossFireMultiplier(boss, {element:'fire'})}` : `Sát thương ×${phase.damageMultiplier??1}`} ·{" "}
        {phase.actionsPerTurn} hành động/lượt
      </span>
      {boss.bossState.pendingMoves?.map((move: any, index: number) => (
        <strong className="telegraph" key={index}>
          Đang chuẩn bị: {content.abilities[move.abilityId].name}
        </strong>
      ))}
    </section>
  );
}
function BattleLog() {
  const { battle } = useGame();
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    if (list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [battle?.log]);
  return (
    <section className="panel battle-log">
      <div className="section-heading">
        <h2>Nhật ký chiến đấu</h2>
        <span>Mới nhất ở cuối</span>
      </div>
      <ol ref={list}>
        {battle.log.map((line: string, index: number) => (
          <li key={index}>{line}</li>
        ))}
      </ol>
    </section>
  );
}
function BattleResultControls() {
  const {
    battle,
    campaign,
    content,
    busy,
    claimReward,
    startBattle,
    startDungeon,
    runBattle,
  } = useGame();
  const dungeon = battle.dungeon;
  const progress = dungeon ?? battle.storyWave;
  const betweenWaves =
    progress &&
    battle.outcome === "victory" &&
    progress.waveIndex + 1 < progress.totalWaves;
  const remaining = dungeon
    ? (dungeonDailyState(campaign, content, dungeon.typeId).remaining ?? 0)
    : 1;
  if (betweenWaves)
    return (
      <>
        <h2>
          Đã vượt {(progress.stageLabel ?? "Đợt").toLocaleLowerCase("vi")}{" "}
          {progress.waveIndex + 1}
        </h2>
        <p>
          Đội đang tiến sang màn tiếp theo, giữ nguyên thể trạng và hiệu ứng.
        </p>
        <button className="gold" disabled={busy} onClick={() => runBattle()}>
          Tiếp tục {(progress.stageLabel ?? "Đợt").toLocaleLowerCase("vi")}{" "}
          {progress.waveIndex + 2}
        </button>
      </>
    );
  return (
    <>
      <h2>
        {dungeon
          ? battle.outcome === "victory"
            ? "Hoàn thành thám hiểm"
            : "Chuyến đi đã kết thúc"
          : "Trận đấu kết thúc"}
      </h2>
      <p>Những người đồng hành đang chờ cuộc hành trình tiếp theo.</p>
      <div className="stack-actions result-actions">
        {battle.outcome === "victory" && !battle.rewardClaimed && (
          <button className="gold" onClick={claimReward}>
            Nhận thưởng chiến thắng
          </button>
        )}
        <button
          className="gold"
          disabled={
            busy ||
            remaining <= 0 ||
            (battle.outcome === "victory" && !battle.rewardClaimed)
          }
          onClick={() =>
            dungeon
              ? startDungeon(dungeon.typeId, dungeon.difficultyId)
              : startBattle(battle.encounterId)
          }
        >
          {dungeon ? "↻ Thám hiểm lại" : "↻ Đánh lại"}
        </button>
        <Link
          className="button"
          href={
            dungeon
              ? `/dungeon/${dungeon.typeId}?selected=${dungeon.difficultyId}`
              : encounterReturnPath(content, battle.encounterId)
          }
        >
          {dungeon ? "↑ Trở về chọn mức độ" : "↑ Trở về chọn trận"}
        </Link>
      </div>
      {dungeon && remaining <= 0 && (
        <p className="warning">Đã hết lượt nhận thưởng hôm nay.</p>
      )}
    </>
  );
}
export function BattlePage() {
  const { preferences } = useSettings();
  const [gamepadPhase, setGamepadPhase] = useState<"skill" | "target">("skill");
  const {
    content,
    battle,
    busy,
    runBattle,
    battleUI,
    updateBattleUI,
    animationSpeed,
    setAnimationSpeed,
    events,
    notify,
  } = useGame();
  const [hovered, setHovered] = useState("");
  const [visualAction,setVisualAction]=useState<any>(null);
  const visualName=battle?.actors.find((item:any)=>item.id===visualAction?.sourceId)?.name;
  const [savedFormulaEdit,setSavedFormulaEdit]=useState<any>(null);
  useEffect(()=>setSavedFormulaEdit(null),[battle?.sessionId,battle?.activeId,battle?.round,battle?.phase,battleUI.skillId]);
  const actor = battle?.actors.find((item: any) => item.id === battle.activeId);
  const commandActor = actor?.team === "party" ? actor : null;
  const skills = commandActor
    ? commandAbilityIds(commandActor).map((id:string)=>id==="$attack"?basicAbility(commandActor):id==="$defend"?DEFEND:content.abilities[id])
    : [];
  const skill =
    skills.find((item: any) => item.id === battleUI.skillId) ??
    skills[0] ??
    null;
  const targets = battle
    ? resolveCombatTargets(
        { ...battle, content },
        commandActor,
        skill,
        battleUI,
      )
    : null;
  const target = battle?.actors.find(
    (item: any) => item.id === targets?.targetId,
  );
  useEffect(() => {
    if (
      targets &&
      (targets.rememberedAlly !== battleUI.allyId ||
        targets.enemyId !== battleUI.enemyId)
    )
      updateBattleUI({
        allyId: targets.rememberedAlly,
        enemyId: targets.enemyId,
      });
  }, [
    targets?.rememberedAlly,
    targets?.enemyId,
    battleUI.allyId,
    battleUI.enemyId,
  ]);
  useEffect(() => {
    if (battle && !busy && !battle.outcome && actor?.team === "enemy")
      void runBattle();
  }, [battle?.sessionId, battle?.activeId, battle?.round, busy]);
  useEffect(
    () => setGamepadPhase("skill"),
    [battle?.sessionId, battle?.activeId, battle?.round],
  );
  useEffect(() => {
    if (
      preferences.controlMode !== "gamepad" ||
      busy ||
      !commandActor ||
      battle?.outcome
    )
      return;
    const frame = requestAnimationFrame(() => {
      const element =
        gamepadPhase === "target"
          ? Array.from(
              document.querySelectorAll<HTMLButtonElement>(
                ".target-hitbox[data-gamepad-legal=true]",
              ),
            ).find(
              (button) => button.dataset.gamepadTarget === targets?.targetId,
            )
          : document.querySelector<HTMLButtonElement>(
              ".skill-command.selected",
            );
      element?.focus({ preventScroll: true });
      element?.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
    return () => cancelAnimationFrame(frame);
  }, [
    gamepadPhase,
    busy,
    battle?.activeId,
    skill?.id,
    preferences.controlMode,
  ]);
  useEffect(() => {
    const input = (event: Event) => {
      if (
        preferences.controlMode !== "gamepad" ||
        !battle ||
        battle.outcome ||
        !commandActor
      )
        return;
      const action = (event as CustomEvent).detail;
      if (busy) {
        if (["a", "up", "down", "left", "right", "lb", "rb"].includes(action))
          event.preventDefault();
        return;
      }
      const focused = document.activeElement as HTMLElement;
      const focusSkill = () =>
        requestAnimationFrame(() =>
          document
            .querySelector<HTMLButtonElement>(".skill-command.selected")
            ?.focus(),
        );
      if (action === "b" && gamepadPhase === "target") {
        event.preventDefault();
        setGamepadPhase("skill");
        focusSkill();
        return;
      }
      if (action === "y") {
        event.preventDefault();
        const anchor =
          focused.closest(".combat-popover-anchor") ??
          document
            .querySelector(".skill-command.selected")
            ?.closest(".combat-popover-anchor");
        anchor?.dispatchEvent(new Event("rpg:help"));
        return;
      }
      if (gamepadPhase === "target") {
        if (["up", "down", "left", "right", "lb", "rb"].includes(action)) {
          event.preventDefault();
          const buttons = Array.from(
            document.querySelectorAll<HTMLButtonElement>(
              ".target-hitbox[data-gamepad-legal=true]:not(:disabled)",
            ),
          );
          const index = buttons.indexOf(focused as HTMLButtonElement);
          const direction = ["left", "up", "lb"].includes(action) ? -1 : 1;
          const next =
            buttons[
              (Math.max(0, index) + direction + buttons.length) % buttons.length
            ];
          next?.click();
          next?.focus();
          next?.scrollIntoView({ block: "nearest", inline: "nearest" });
        } else if (action === "a") {
          event.preventDefault();
          document
            .querySelector<HTMLButtonElement>(".execute:not(:disabled)")
            ?.click();
        }
        return;
      }
      if (
        ["up", "down", "lb", "rb"].includes(action) &&
        focused.matches(".skill-command")
      ) {
        event.preventDefault();
        const buttons = Array.from(
          document.querySelectorAll<HTMLButtonElement>(".skill-command"),
        );
        const index = buttons.indexOf(focused as HTMLButtonElement);
        const next =
          buttons[
            (index +
              (["up", "lb"].includes(action) ? -1 : 1) +
              buttons.length) %
              buttons.length
          ];
        next?.focus();
        next?.scrollIntoView({ block: "nearest" });
      } else if (
        action === "a" &&
        (focused.matches(".skill-command") || focused.matches(".execute"))
      ) {
        event.preventDefault();
        if (focused.getAttribute("aria-disabled") === "true") {
          focused
            .closest(".combat-popover-anchor")
            ?.dispatchEvent(new Event("rpg:help"));
          return;
        }
        if (focused.matches(".skill-command")) focused.click();
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        setGamepadPhase("target");
      }
    };
    window.addEventListener("rpg:gamepad", input);
    return () => window.removeEventListener("rpg:gamepad", input);
  }, [
    preferences.controlMode,
    battle,
    busy,
    commandActor,
    gamepadPhase,
    targets?.targetId,
  ]);
  if (!battle || !targets)
    return (
      <main className="page">
        <PageHeader title="Chiến trường" back="/quests" />
        <EmptyState>
          Chưa có trận đang diễn ra. Chọn một nhiệm vụ để xuất phát.
        </EmptyState>
        <Link className="button gold" href="/quests">
          Về chọn Quest
        </Link>
      </main>
    );
  function selectTarget(item: any) {
    if (busy || battle.outcome || item.hp <= 0) return;
    if (
      item.team === "enemy" &&
      skill?.target === "enemy" &&
      !targets!.legalIds.includes(item.id)
    ) {
      notify("Khiêu khích đang giới hạn mục tiêu của đòn đơn mục tiêu.");
      return;
    }
    if (
      item.team === "party" &&
      skill?.target === "self" &&
      item.id !== actor?.id
    ) {
      notify("Kỹ năng này chỉ tác động lên người sử dụng.");
      return;
    }
    updateBattleUI(
      item.team === "party" ? { allyId: item.id } : { enemyId: item.id },
    );
  }
  function renderActor(item: any) {
    return (
      <CombatantCard
        key={item.id}
        actor={item}
        selected={
          !battle.outcome &&
          [targets!.allyId, targets!.enemyId].includes(item.id)
        }
        affected={
          !battle.outcome &&
          targetsAsGroup(skill) &&
          targets!.affectedIds.includes(item.id)
        }
        hovered={hovered === item.id}
        selectable={!busy && !battle.outcome}
        legal={targets?.legalIds.includes(item.id) ?? false}
        onSelect={() => selectTarget(item)}
      />
    );
  }
  const available =
    commandActor && skill
      ? abilityAvailability({ ...battle, content }, commandActor, skill)
      : { ok: false, reason: "" };
  const ownFormula=commandActor?activeFormula({...battle,content},commandActor):null;
  let formulaEdit=defaultFormulaEdit(ownFormula);
  if(savedFormulaEdit){try{validateFormulaEdit(ownFormula,savedFormulaEdit);formulaEdit=savedFormulaEdit;}catch{}}
  const hasFormulaField=battle.actors.some((item:any)=>activeFormula({...battle,content},item));
  const targetLabel = skill?.target === "adjacent_allies" ? targetsFor({...battle,content},commandActor,skill).map((item:any)=>item.name).join(" · ") || "Không có đồng đội ở ô kề" : skill?.target === "random_enemies" ? randomTargetLabel(skill) : skill?.target.startsWith("all_")
    ? (TARGET_NAMES as any)[skill.target] + (skill.effects.some((effect:any)=>effect.primaryMultiplier!==undefined) ? ` · Chính: ${target?.name ?? ""}` : "")
    : (target?.name ?? "");
  return (
    <main
      className="page battle-page"
      data-speed={animationSpeed}
      data-combat-mode={battle.presentation?.mode}
      data-gamepad-phase={gamepadPhase}
      data-dungeon-wave={
        battle.dungeon ? battle.dungeon.waveIndex + 1 : undefined
      }
    >
      <PageHeader
        title={
          battle.dungeon
            ? `${content.dungeons[battle.dungeon.typeId].name} · ${content.dungeons[battle.dungeon.typeId].difficulties.find((item: any) => item.id === battle.dungeon.difficultyId).name}`
            : content.encounters[battle.encounterId].name
        }
        subtitle={
          battle.dungeon
            ? `${battle.dungeon.stageLabel ?? "Đợt"} ${battle.dungeon.waveIndex + 1}/${battle.dungeon.totalWaves}${battle.dungeon.revealRooms ? "" : ` · ${content.encounters[battle.encounterId].name}`} · Vòng ${battle.phase === "extra" ? "Phụ" : "Chính"} ${battle.round}`
            : `${battle.storyWave ? 'Đợt '+(battle.storyWave.waveIndex+1)+'/'+battle.storyWave.totalWaves+' · ' : ''}Vòng ${battle.phase === "extra" ? "Phụ" : "Chính"} ${battle.round}`
        }
        back={
          battle.dungeon
            ? `/dungeon/${battle.dungeon.typeId}?selected=${battle.dungeon.difficultyId}`
            : encounterReturnPath(content, battle.encounterId)
        }
      >
        <div className="combat-speed" role="group" aria-label="Tốc độ hiệu ứng">
          <button
            aria-pressed={animationSpeed === "normal"}
            onClick={() => setAnimationSpeed("normal")}
          >
            Bình thường
          </button>
          <button
            aria-pressed={animationSpeed === "fast"}
            onClick={() => setAnimationSpeed("fast")}
          >
            Nhanh
          </button>
        </div>
      </PageHeader>
      {battle.storyWave && <section className="dungeon-wave-progress" aria-label="Tiến độ chương truyện"><div aria-live="polite"><strong>Đợt {battle.storyWave.waveIndex+1}/{battle.storyWave.totalWaves}</strong><span>Giữ HP, MP và trạng thái qua các đợt · Thắng toàn chương mới nhận thưởng</span></div></section>}
      {battle.dungeon && (
        <section
          className="dungeon-wave-progress"
          aria-label="Tiến độ hầm ngục"
        >
          <div aria-live="polite">
            <strong>
              {battle.dungeon.stageLabel ?? "Đợt"}{" "}
              {battle.dungeon.waveIndex + 1}/{battle.dungeon.totalWaves}
            </strong>
            <span>
              {enemyScaleSummary(battle.dungeon.enemyScale)} · Thưởng hoàn thành{" "}
              {dungeonRewardText(battle.dungeon.reward)}
            </span>
          </div>
          <ol>
            {Array.from({ length: battle.dungeon.totalWaves }, (_, index) => (
              <li
                key={index}
                className={
                  index < battle.dungeon.waveIndex
                    ? "cleared"
                    : index === battle.dungeon.waveIndex
                      ? "current"
                      : ""
                }
              >
                {index < battle.dungeon.waveIndex ? "✓" : index + 1}
              </li>
            ))}
          </ol>
        </section>
      )}
      {battle.actors
        .filter((item: any) => item.boss)
        .map((boss: any) => (
          <BossPhasePanel key={boss.id} boss={boss} />
        ))}
      <SummonScenes presentation={battle.presentation} actors={battle.actors} round={battle.round}/>
      <CombatEffects events={events} content={content} sessionId={battle.sessionId} speed={animationSpeed} onCue={setVisualAction}/>
      <AcademicEffects events={events} sessionId={battle.sessionId} speed={animationSpeed}/>
      <CosmicEffects events={events} sessionId={battle.sessionId} speed={animationSpeed}/>

      <div className="battle-layout">
        <section className={`battlefield panel ${hasFormulaField?"has-academic-field":""}`}>
          <FormulaScene battle={{...battle,content}} content={content}/>
          <div className="battle-reactions" aria-live="polite">
            {events
              .filter((event) => event.type === "reaction")
              .map((event) => (
                <div
                  key={event.key}
                  className={`reaction-ribbon ${event.kind}`}
                >
                  <strong>{event.label}</strong>
                  <span>
                    {
                      battle.actors.find(
                        (item: any) => item.id === event.sourceId,
                      )?.name
                    }{" "}
                    →{" "}
                    {
                      battle.actors.find(
                        (item: any) => item.id === event.targetId,
                      )?.name
                    }
                  </span>
                </div>
              ))}
          </div>
          <div className="enemy-grid">
            {battle.actors
              .filter((item: any) => item.team === "enemy")
              .map(renderActor)}
          </div>
          <TurnOrder onHover={setHovered} />
          <FormulaBoards battle={{...battle,content}} content={content}/>
          <div className="ally-grid">
            {battle.actors
              .filter((item: any) => item.team === "party")
              .map(renderActor)}
          </div>
          {battle.outcome && (
            <div className="battle-outcome">
              {battle.outcome === "victory"
                ? battle.rewardClaimed
                  ? `Chiến thắng · +${battle.dungeon ? dungeonRewardText(battle.dungeon.reward) : `${victoryCoinReward(content, battle.encounterId)} coin`} đã lưu`
                  : battle.dungeon &&
                      battle.dungeon.waveIndex + 1 < battle.dungeon.totalWaves
                    ? `Đã vượt ${(battle.dungeon.stageLabel ?? "Đợt").toLocaleLowerCase("vi")} ${battle.dungeon.waveIndex + 1} · Đang tiến vào ${(battle.dungeon.stageLabel ?? "đợt").toLocaleLowerCase("vi")} tiếp theo`
                    : battle.storyWave && battle.storyWave.waveIndex+1 < battle.storyWave.totalWaves
                      ? 'Đã vượt đợt '+(battle.storyWave.waveIndex+1)+' · Đang tiến vào đợt tiếp theo'
                      : "Chiến thắng · Chưa nhận thưởng"
                : battle.outcome === "defeat"
                  ? "Đội hình đã gục ngã"
                  : "Cuộc giao tranh tạm dừng"}
            </div>
          )}
        </section>
        <aside className="command-panel panel">
          <span className="eyebrow">HÀNH ĐỘNG</span>
          {battle.outcome ? (
            <BattleResultControls />
          ) : actor?.team === "enemy" ? (
            <>
              <h2>{busy&&visualName?visualName+" đang thi triển":"Lượt của "+actor.name}</h2>
              <p>{busy&&visualAction?visualAction.label:"Đối thủ đang hành động…"}</p>
            </>
          ) : (
            <>
              <h2>{busy&&visualName?visualName+" đang thi triển":"Lượt của "+actor?.name}</h2>
              <p className="command-hint">
                Chọn kỹ năng và bấm trực tiếp vào thẻ mục tiêu. Rê chuột hoặc
                chạm giữ kỹ năng để xem chi tiết.
              </p>
              <div className="abilities">
                {skills.map((item: any) => (
                  <SkillCommand
                    key={item.id}
                    skill={item}
                    actor={actor}
                    target={target}
                    selected={item.id === skill?.id}
                    onSelect={() => updateBattleUI({ skillId: item.id })}
                  />
                ))}
              </div>
              {skill && (
                <>
                  {skill.effects.some((effect:any)=>effect.type==='edit_formula') && ownFormula?.entries.length>0 && <FormulaEditControl owner={actor} skill={skill} battle={{...battle,content}} content={content} value={formulaEdit} onChange={setSavedFormulaEdit} busy={busy}/>}
                  <FormulaForecast battle={{...battle,content}} actor={actor} skill={skill}/>
                  <div className="target-summary" aria-live="polite">
                    <span>MỤC TIÊU THỰC THI</span>
                    <strong>{targetLabel}</strong>
                    {skill.effects.some((effect:any)=>effect.type==="grant_extra_turn") && <small>{battle.phase==="extra" ? "Vòng Phụ: hiệu ứng cấp Lượt Thêm bị bỏ qua; vẫn tiêu MP và hồi chiêu." : battle.extraTurnGrants?.includes(targets.targetId) ? "Mục tiêu đã có Lượt Thêm trong vòng này; không cộng thêm lượt." : "Lượt Thêm sẽ thực hiện sau lượt chính, theo SPD ở đầu Vòng Phụ."}</small>}
                    {skill.target === "adjacent_allies" && <small>Hai ô kề cố định · nối vòng ô 1 ↔ 4. Ô trống và người đã gục bị bỏ qua.</small>}
                    {skill.target === "enemy_splash" && <small>{targets.affectedIds.length} mục tiêu · chính và hai ô kề, không nối vòng.</small>}
                    {skill.target === "random_enemies" && <small>{targets.affectedIds.length} đối thủ có thể bị chọn · mỗi đòn chọn lại, có thể trúng lặp.</small>}
                    {skill.target.startsWith("all_") && (
                      <small>
                        {targets.affectedIds.length} mục tiêu · không cần chọn
                        từng thẻ
                      </small>
                    )}
                  </div>
                  <button
                    className="gold execute"
                    aria-label={`Thực hiện: ${skill.name} → ${targetLabel}`}
                    disabled={busy || !available.ok || !targets.targetId}
                    onClick={() =>
                      runBattle({
                        actorId: actor.id,
                        abilityId: skill.id,
                        targetId: targets.targetId,
                        ...(skill.effects.some((effect:any)=>effect.type==='edit_formula') ? {formulaEdit} : {}),
                      })
                    }
                  >
                    <strong>{skill.name}</strong>
                    <span>→ {targetLabel}</span>
                  </button>
                </>
              )}
            </>
          )}
        </aside>
      </div>
      <BattleLog />
    </main>
  );
}
