import { createDungeonPreview, validDungeonPreview } from "../core/dungeon.js";
import { dungeonDay } from "../core/dungeon-rules.js";

// Room scouting survives route changes and reloads in the same window, isolated by profile/day.
export function createDungeonPreviewCache(
  content,
  storage,
  random = Math.random,
) {
  const memory = new Map();
  const keyFor = (profileId, id, difficultyId, now) =>
    `northern-prisma.scouting:${profileId}:${id}:${difficultyId}:${dungeonDay(now)}`;
  function read(profileId, id, difficultyId, now = new Date()) {
    const key = keyFor(profileId, id, difficultyId, now);
    let preview = memory.get(key);
    if (!preview) {
      try {
        preview = JSON.parse(storage.getItem(key) ?? "null");
      } catch {}
    }
    if (!validDungeonPreview(content, preview, id, difficultyId, now))
      return null;
    memory.set(key, preview);
    return structuredClone(preview);
  }
  return {
    read,
    prepare(profileId, id, difficultyId, now = new Date()) {
      if (!Number.isSafeInteger(profileId) || profileId < 1)
        throw new Error("Hãy chọn hồ sơ trước khi xem phòng.");
      const existing = read(profileId, id, difficultyId, now);
      if (existing) return existing;
      const preview = createDungeonPreview(content, id, difficultyId, {
        random,
        now,
      });
      memory.set(keyFor(profileId, id, difficultyId, now), preview);
      try {
        storage.setItem(
          keyFor(profileId, id, difficultyId, now),
          JSON.stringify(preview),
        );
      } catch {}
      return structuredClone(preview);
    },
  };
}
