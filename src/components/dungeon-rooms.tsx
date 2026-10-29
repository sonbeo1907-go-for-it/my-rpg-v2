"use client";
import {
  ELEMENT_NAMES,
  DAMAGE_TYPE_NAMES,
  WEAKNESS_MULTIPLIER,
} from "../core/content.js";
import { scaleEnemyStats } from "../core/enemy-scaling.js";
import { STAT_LABELS } from "../core/catalog.js";
import {
  passiveDescription,
} from "../ui/skill-presentation.js";
import { SkillBody, RulesDisclosure } from "./skill-details";
import { skillPresentation } from "../ui/skill-copy.js";
import { skillCost } from "../ui/skill-presentation.js";
import { ElementBadge, Icon, fmt } from "./ui";

function roomEnemies(content: any, encounterId: string) {
  const counts: Record<string, number> = {};
  for (const id of content.encounters[encounterId].enemies)
    counts[id] = (counts[id] ?? 0) + 1;
  return Object.entries(counts).map(([id, count]) => ({
    ...content.enemies[id],
    count,
  }));
}
export function DungeonRooms({
  content,
  preview,
  scale,
}: {
  content: any;
  preview: any;
  scale: any;
}) {
  return (
    <section
      id="dungeon-rooms"
      className="dungeon-rooms"
      aria-labelledby="room-scouting-title"
    >
      <div className="room-scouting-heading">
        <div>
          <span className="eyebrow">TRINH SÁT TRƯỚC KHI XUẤT PHÁT</span>
          <h2 id="room-scouting-title">Những đối thủ đang chờ</h2>
          <p>
            Đội hình địch theo đúng thứ tự phòng. Chỉ số đã tính hệ số độ khó.
          </p>
        </div>
      </div>
      <div className="dungeon-room-grid">
        {preview.waveIds.map((id: string, index: number) => (
          <article
            className="dungeon-room-card"
            data-encounter-id={id}
            key={index}
          >
            <header>
              <span className="room-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3>Phòng {index + 1}</h3>
              <Icon name="skull" />
            </header>
            {roomEnemies(content, id).map((enemy) => {
              const actor = {
                ...enemy,
                stats: scaleEnemyStats(enemy.stats, scale),
              };
              const weaknesses = [
                ...(enemy.weaknesses?.length === 8
                  ? ["Tất cả hệ"]
                  : (enemy.weaknesses ?? []).map(
                      (element: string) =>
                        (ELEMENT_NAMES as Record<string, string>)[element],
                    )),
                ...(enemy.damageTypeWeaknesses ?? []).map(
                  (type: string) =>
                    `Mọi đòn ${(DAMAGE_TYPE_NAMES as Record<string, string>)[type].toLowerCase()}`,
                ),
              ];
              const passive = passiveDescription(actor, content);
              return (
                <div
                  className="room-enemy"
                  data-enemy-id={enemy.id}
                  key={enemy.id}
                >
                  <div className="room-enemy-heading">
                    <h4>
                      {enemy.name}
                      {enemy.count > 1 && <span> ×{enemy.count}</span>}
                    </h4>
                    <ElementBadge element={enemy.element} />
                  </div>
                  {enemy.role && (
                    <p className="room-enemy-role">{enemy.role}</p>
                  )}
                  <p className="room-weakness">
                    Yếu:{" "}
                    {weaknesses.length
                      ? `${weaknesses.join(" / ")} (+${Math.round((WEAKNESS_MULTIPLIER - 1) * 100)}%)`
                      : "Không có điểm yếu bẩm sinh"}
                  </p>
                  <dl className="room-stats">
                    {Object.entries(STAT_LABELS).map(([key, label]) => (
                      <div key={key}>
                        <dt>{label as string}</dt>
                        <dd>{fmt(actor.stats[key])}</dd>
                      </div>
                    ))}
                  </dl>
                  <details>
                    <summary>Chiêu thức & đặc tính</summary>
                    {passive && <p>{passive}</p>}
                    <ul>
                      {(enemy.abilities ?? []).map((abilityId: string) => {
                        const skill = content.abilities[abilityId];
                        return (
                          <li key={abilityId}>
                            <strong>{skill.name}</strong>
                            <small>{skillCost(skill,actor)}</small>
                            <SkillBody skill={skill} actor={actor} content={content}/>
                            <RulesDisclosure rules={skillPresentation(skill,actor,content).rules}/>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                </div>
              );
            })}
          </article>
        ))}
      </div>
    </section>
  );
}
