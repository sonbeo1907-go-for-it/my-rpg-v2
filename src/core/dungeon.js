import { createBattle } from "./battle.js";
import { dungeonDay, dungeonDailyState } from "./dungeon-rules.js";
import { encounterTier } from "./economy.js";

export function dungeonDifficulty(content, id, difficultyId) {
  return content.dungeons[id]?.difficulties.find(
    (item) => item.id === difficultyId,
  );
}
export function dungeonQuestPool(content, id = "gold_mine") {
  const tier = content.dungeons[id]?.encounterTier ?? "normal";
  return Object.values(content.encounters)
    .filter((item) => !item.travelerStory && encounterTier(item) === tier)
    .map((item) => item.id);
}
function checkedRoll(random) {
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1)
    throw new Error("Nguồn chọn đợt quái không hợp lệ.");
  return value;
}
export function createDungeonPreview(
  content,
  id,
  difficultyId,
  { random = Math.random, now = new Date() } = {},
) {
  const definition = content.dungeons[id],
    difficulty = dungeonDifficulty(content, id, difficultyId);
  if (!definition || definition.closed || !difficulty?.enabled)
    throw new Error("Mức hầm ngục này chưa mở.");
  const pool = dungeonQuestPool(content, id);
  if (pool.length < difficulty.waves)
    throw new Error("Chưa đủ đối thủ cho chuỗi hầm ngục.");
  const waveIds = [];
  for (let i = 0; i < difficulty.waves; i++)
    waveIds.push(
      pool.splice(Math.floor(checkedRoll(random) * pool.length), 1)[0],
    );
  return { typeId: id, difficultyId, day: dungeonDay(now), waveIds };
}
export function validDungeonPreview(
  content,
  preview,
  id,
  difficultyId,
  now = new Date(),
) {
  const difficulty = dungeonDifficulty(content, id, difficultyId),
    pool = dungeonQuestPool(content, id);
  return Boolean(
    difficulty?.enabled &&
    preview?.typeId === id &&
    preview.difficultyId === difficultyId &&
    preview.day === dungeonDay(now) &&
    Array.isArray(preview.waveIds) &&
    preview.waveIds.length === difficulty.waves &&
    new Set(preview.waveIds).size === preview.waveIds.length &&
    preview.waveIds.every((quest) => pool.includes(quest)),
  );
}
export function createDungeonRun(
  content,
  campaign,
  id,
  difficultyId,
  { random = Math.random, now = new Date(), preview = null } = {},
) {
  const definition = content.dungeons[id],
    difficulty = dungeonDifficulty(content, id, difficultyId);
  if (!definition || definition.closed || !difficulty?.enabled)
    throw new Error("Mức hầm ngục này chưa mở.");
  if (dungeonDailyState(campaign, content, id, now).remaining <= 0)
    throw new Error("Đã hết lượt nhận thưởng hầm ngục hôm nay.");
  if (
    definition.revealRooms &&
    !validDungeonPreview(content, preview, id, difficultyId, now)
  )
    throw new Error(
      "Hãy xem danh sách phòng hiện tại trước khi bắt đầu thám hiểm.",
    );
  const waveIds = definition.revealRooms
    ? [...preview.waveIds]
    : createDungeonPreview(content, id, difficultyId, { random, now }).waveIds;
  const run = {
    typeId: id,
    difficultyId,
    waveIds,
    waveIndex: 0,
    enemyScale: structuredClone(difficulty.enemyScale),
    reward: structuredClone(difficulty.reward),
    partyCampaign: structuredClone(campaign),
    random,
    claimed: false,
    battle: null,
  };
  run.battle = makeWave(content, run);
  return run;
}
function makeWave(content, run, previous = null) {
  const partyActors = previous?.actors.filter(
    (actor) => actor.team === "party",
  );
  const sources = previous
    ? [
        ...(previous.sourceActors ?? []),
        ...previous.actors.filter((actor) => actor.team === "enemy"),
      ]
    : [];
  const battle = createBattle(
    content,
    run.partyCampaign,
    run.waveIds[run.waveIndex],
    run.random,
    {
      enemyScale: structuredClone(run.enemyScale),
      partyActors,
      roundOffset: previous?.round ?? 0,
      enemyIdPrefix: `wave_${run.waveIndex + 1}_enemy_`,
      sourceActors: sources,
      log: [
        ...(previous?.log ?? []).slice(-197),
        `— ${content.dungeons[run.typeId].name} · ${content.dungeons[run.typeId].stageLabel ?? "Đợt"} ${run.waveIndex + 1}/${run.waveIds.length} —`,
      ],
    },
  );
  battle.dungeon = {
    typeId: run.typeId,
    stageLabel: content.dungeons[run.typeId].stageLabel ?? "Đợt",
    revealRooms: Boolean(content.dungeons[run.typeId].revealRooms),
    difficultyId: run.difficultyId,
    waveIndex: run.waveIndex,
    totalWaves: run.waveIds.length,
    enemyScale: structuredClone(run.enemyScale),
    reward: structuredClone(run.reward),
  };
  return battle;
}
export function isFinalDungeonWave(run) {
  return run.waveIndex === run.waveIds.length - 1;
}
export function advanceDungeonWave(content, run) {
  if (
    run.battle.outcome !== "victory" ||
    isFinalDungeonWave(run) ||
    run.claimed
  )
    throw new Error("Chưa thể chuyển sang đợt tiếp theo.");
  const nextIndex = run.waveIndex + 1;
  const next = makeWave(content, { ...run, waveIndex: nextIndex }, run.battle);
  run.waveIndex = nextIndex;
  run.battle = next;
  return next;
}
export function claimDungeonReward(
  campaign,
  run,
  content,
  persist = () => {},
  now = new Date(),
) {
  if (
    !run ||
    run.claimed ||
    run.battle.outcome !== "victory" ||
    !isFinalDungeonWave(run)
  )
    return campaign;
  if (dungeonDailyState(campaign, content, run.typeId, now).remaining <= 0)
    throw new Error("Đã hết lượt nhận thưởng hầm ngục hôm nay.");
  const next = structuredClone(campaign),
    today = dungeonDay(now);
  const ledger = next.dungeonDaily ?? { day: null, clears: {} };
  if (!ledger.day || today > ledger.day)
    next.dungeonDaily = { day: today, clears: {} };
  else next.dungeonDaily = ledger;
  const add = (value, amount) => {
    if (
      !Number.isSafeInteger(value) ||
      !Number.isSafeInteger(value + amount) ||
      value < 0
    )
      throw new Error("Số dư vượt giới hạn cho phép.");
    return value + amount;
  };
  for (const [currency, amount] of Object.entries(run.reward))
    next[currency] = add(next[currency], amount);
  next.victories = add(next.victories, 1);
  next.dungeonDaily.clears[run.typeId] = add(
    next.dungeonDaily.clears[run.typeId] ?? 0,
    1,
  );
  persist(next);
  run.claimed = true;
  run.battle.rewardClaimed = true;
  return next;
}
