import test from "node:test";
import assert from "node:assert/strict";
import { loadContent } from "../scripts/load-content.mjs";
import {
  createGameSave,
  encodeGameSave,
  GAME_SAVE_KEY,
} from "../src/core/game-save.js";
import {
  createProfileStore,
  normalizeUsername,
  PROFILES_KEY,
} from "../src/runtime/profile-store.js";
const content = await loadContent();
function storage() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
    data,
  };
}

test("profiles migrate existing JSON once, preserve legacy data, and isolate progress / names", async () => {
  const disk = storage(),
    old = createGameSave(content);
  old.coins = 1234;
  const raw = encodeGameSave(old, content);
  disk.setItem(GAME_SAVE_KEY, raw);
  const store = createProfileStore({ content, storage: disk });
  await store.initialize();
  assert.equal(store.entries.length, 1);
  assert.equal(store.entries[0].campaign.coins, 1234);
  const second = await store.create("  Iris  ");
  assert.equal(second.id, 2);
  assert.equal(second.username, "Iris");
  const next = structuredClone(store.entries[0].campaign);
  next.coins = 42;
  await store.save(1, next);
  assert.equal(store.entries[0].campaign.coins, 42);
  assert.equal(store.entries[1].campaign.coins, 0);
  const before = store.entries[0].text;
  await store.rename(1, "Takeshi");
  assert.equal(store.entries[0].text, before);
  assert.equal(store.entries[0].username, "Takeshi");
  assert.equal(disk.getItem(GAME_SAVE_KEY), raw);
  await store.initialize();
  assert.equal(store.entries.length, 2);
  const reopened = createProfileStore({ content, storage: disk });
  await reopened.initialize();
  assert.equal(reopened.entries[0].campaign.coins, 42);
});
test("failed writes never publish new progress; stale writers cannot overwrite another window", async () => {
  const disk = storage(),
    a = createProfileStore({ content, storage: disk });
  await a.initialize();
  await a.create("Arthur");
  const b = createProfileStore({ content, storage: disk });
  await b.initialize();
  const next = structuredClone(a.entries[0].campaign);
  next.coins = 50;
  const original = disk.setItem;
  disk.setItem = () => {
    throw new Error("disk full");
  };
  await assert.rejects(a.save(1, next), /disk full/);
  assert.equal(a.entries[0].campaign.coins, 0);
  disk.setItem = original;
  await a.save(1, next);
  await assert.rejects(b.save(1, { ...next, coins: 999 }), /cửa sổ khác/);
  assert.equal(
    JSON.parse(JSON.parse(disk.getItem(PROFILES_KEY)).entries[0].text).coins,
    50,
  );
});
test("broken files remain visible, recover only validated backups, and never reset silently", async () => {
  const disk = storage(),
    store = createProfileStore({ content, storage: disk });
  await store.initialize();
  await store.create("Arthur");
  await store.save(1, { ...store.entries[0].campaign, coins: 100 });
  const bundle = JSON.parse(disk.getItem(PROFILES_KEY));
  bundle.entries[0].text = "broken";
  bundle.entries[0].revision = "broken";
  disk.setItem(PROFILES_KEY, JSON.stringify(bundle));
  await store.refresh();
  assert.ok(store.entries[0].error);
  assert.equal(store.entries[0].recoverable, true);
  await assert.rejects(store.save(1, createGameSave(content)), /chưa sẵn sàng/);
  await store.restore(1);
  assert.equal(store.entries[0].campaign.coins, 0);
  assert.equal(store.entries[0].error, "");
  assert.equal(
    JSON.parse(disk.getItem(PROFILES_KEY)).entries[0].damaged,
    "broken",
  );
});
test("native profiles discover files via IPC, wait for durable commit, and open a fixed save directory", async () => {
  const disk = storage(),
    calls = [];
  const raw = encodeGameSave(createGameSave(content), content);
  let entry = {
    id: 7,
    username: "Kai",
    text: raw,
    revision: "r1",
    backup: null,
    updatedAt: 1,
  };
  let finish;
  const invoke = async (command, args) => {
    calls.push({ command, args });
    if (command === "save_directory") return "C:/Test/NorthernPrisma/saves";
    if (command === "list_profiles") return [entry];
    if (command === "read_profile") return entry;
    if (command === "write_profile")
      return new Promise((resolve) => {
        finish = () =>
          resolve((entry = { ...entry, text: args.text, revision: "r2" }));
      });
    if (command === "open_save_directory") return null;
    throw new Error("unexpected command");
  };
  const store = createProfileStore({
    content,
    storage: disk,
    nativeInvoke: invoke,
  });
  await store.initialize();
  assert.equal(store.entries[0].id, 7);
  const pending = store.save(7, { ...store.entries[0].campaign, coins: 100 });
  assert.equal(store.entries[0].campaign.coins, 0);
  finish();
  await pending;
  assert.equal(store.entries[0].campaign.coins, 100);
  await store.openDirectory();
  assert.deepEqual(calls.at(-1), {
    command: "open_save_directory",
    args: undefined,
  });
  assert.equal(disk.data.size, 0);
});
test("username validation accepts Vietnamese and rejects blank / control / oversized names", () => {
  assert.equal(normalizeUsername("  Người lữ hành  "), "Người lữ hành");
  for (const value of ["", "  ", "a\nb", "a".repeat(33)])
    assert.throws(() => normalizeUsername(value));
});
