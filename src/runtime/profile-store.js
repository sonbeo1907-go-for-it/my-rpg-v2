import {
  createGameSave,
  decodeGameSave,
  encodeGameSave,
  GAME_SAVE_KEY,
} from "../core/game-save.js";

export const PROFILES_KEY = "northern-prisma.profiles.v1";
export function normalizeUsername(value) {
  const name = typeof value === "string" ? value.trim() : "";
  if (
    !name ||
    Array.from(name).length > 32 ||
    /\p{Cc}/u.test(name)
  )
    throw new Error(
      "Tên người chơi cần 1–32 ký tự, không chứa ký tự điều khiển.",
    );
  return name;
}
const stamp = (text) => {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++)
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return `${text.length}:${hash >>> 0}`;
};
/** @param {{ content: any, storage: Storage | any, nativeInvoke?: ((command: string, args?: any) => Promise<any>) | null }} options */
export function createProfileStore({ content, storage, nativeInvoke = null }) {
  const native = Boolean(nativeInvoke);
  let entries = [];
  let directory = "";
  const view = (entry) => {
    let campaign = null,
      issue = entry.error ?? "";
    try {
      if (!entry.text) throw new Error(issue || "Không đọc được file save.");
      campaign = decodeGameSave(entry.text, content);
    } catch (error) {
      issue = String(error.message ?? error);
    }
    let recoverable = false;
    try {
      if (entry.backup) {
        decodeGameSave(entry.backup, content);
        recoverable = true;
      }
    } catch {}
    return {
      ...entry,
      username: entry.username || `Người lữ hành ${entry.id}`,
      campaign,
      error: issue,
      recoverable,
    };
  };
  const readBundle = () => {
    const raw = storage.getItem(PROFILES_KEY);
    if (!raw) return { version: 1, entries: [] };
    const bundle = JSON.parse(raw);
    if (
      bundle?.version !== 1 ||
      !Array.isArray(bundle.entries) ||
      bundle.entries.some((e) => !Number.isSafeInteger(e.id) || e.id < 1) ||
      new Set(bundle.entries.map((e) => e.id)).size !== bundle.entries.length
    )
      throw new Error(
        "Danh sách hồ sơ trên trình duyệt không hợp lệ. Dữ liệu cũ vẫn được giữ nguyên.",
      );
    return bundle;
  };
  const writeBundle = (bundle) =>
    storage.setItem(PROFILES_KEY, JSON.stringify(bundle));
  const replace = (entry) => {
    entries = [...entries.filter((e) => e.id !== entry.id), view(entry)].sort(
      (a, b) => a.id - b.id,
    );
    return entries.find((e) => e.id === entry.id);
  };
  const webEntry = (id) => {
    const bundle = readBundle(),
      entry = bundle.entries.find((e) => e.id === id);
    if (!entry)
      throw new Error("Hồ sơ không còn tồn tại. Hãy làm mới danh sách.");
    return { bundle, entry };
  };
  async function refresh() {
    const raw = native
      ? await nativeInvoke("list_profiles")
      : readBundle().entries;
    entries = raw.map(view).sort((a, b) => a.id - b.id);
    return entries;
  }
  async function create(username, campaign = createGameSave(content)) {
    username = normalizeUsername(username);
    const text = encodeGameSave(campaign, content);
    let entry;
    if (native)
      entry = await nativeInvoke("create_profile", { username, text });
    else {
      const bundle = readBundle();
      const id = Math.max(0, ...bundle.entries.map((e) => e.id)) + 1;
      if (!Number.isSafeInteger(id)) throw new Error("Hết mã hồ sơ.");
      entry = {
        id,
        username,
        text,
        backup: null,
        revision: stamp(text),
        updatedAt: Date.now(),
      };
      bundle.entries.push(entry);
      writeBundle(bundle);
    }
    return replace(entry);
  }
  return {
    native,
    get directory() { return directory; },
    get entries() {
      return entries;
    },
    refresh,
    async initialize() {
      if (native) directory = await nativeInvoke("save_directory");
      await refresh();
      // One-way migration only when no profiles exist. The legacy key is never removed.
      // A desktop WebView cannot read another browser's localStorage.
      if (!entries.length) {
        const raw = [
          GAME_SAVE_KEY,
          "northern-prisma.campaign.v3",
          "northern-prisma.campaign.v2",
          "northern-prisma.campaign.v1",
        ]
          .map((k) => storage.getItem(k))
          .find(Boolean);
        if (raw) await create("Arthur", decodeGameSave(raw, content));
      }
      return entries;
    },
    create,
    async load(id) {
      const entry = native
        ? await nativeInvoke("read_profile", { id })
        : webEntry(id).entry;
      return replace(entry);
    },
    async save(id, campaign) {
      const known = entries.find((e) => e.id === id);
      if (!known || known.error) throw new Error("Hồ sơ chưa sẵn sàng để lưu.");
      const text = encodeGameSave(campaign, content);
      let saved;
      if (native)
        saved = await nativeInvoke("write_profile", {
          id,
          text,
          revision: known.revision,
        });
      else {
        const { bundle, entry } = webEntry(id);
        if (entry.revision !== known.revision)
          throw new Error(
            "Save đã thay đổi ở cửa sổ khác. Hãy chọn lại hồ sơ.",
          );
        decodeGameSave(entry.text, content);
        saved = {
          ...entry,
          text,
          backup: entry.text,
          revision: stamp(text),
          updatedAt: Date.now(),
        };
        bundle.entries[bundle.entries.indexOf(entry)] = saved;
        writeBundle(bundle);
      }
      return replace(saved);
    },
    async rename(id, username) {
      username = normalizeUsername(username);
      if (native) {
        const meta = await nativeInvoke("rename_profile", { id, username });
        return replace({ ...entries.find((e) => e.id === id), ...meta });
      }
      const { bundle, entry } = webEntry(id);
      const renamed = { ...entry, username };
      bundle.entries[bundle.entries.indexOf(entry)] = renamed;
      writeBundle(bundle);
      return replace(renamed);
    },
    async restore(id) {
      // Re-read and validate the backup before requesting any disk replacement.
      const loaded = await this.load(id);
      if (!loaded.recoverable) throw new Error("Không có bản sao lưu hợp lệ.");
      let restored;
      if (native)
        restored = await nativeInvoke("restore_profile", {
          id,
          revision: loaded.revision,
        });
      else {
        const { bundle, entry } = webEntry(id);
        if (entry.revision !== loaded.revision)
          throw new Error("Save đã thay đổi. Hãy làm mới danh sách.");
        restored = {
          ...entry,
          text: entry.backup,
          damaged: entry.text,
          error: null,
          revision: stamp(entry.backup),
          updatedAt: Date.now(),
        };
        bundle.entries[bundle.entries.indexOf(entry)] = restored;
        writeBundle(bundle);
      }
      return replace(restored);
    },
    async openDirectory() {
      if (!native)
        throw new Error(
          "Mở thư mục lưu dữ liệu được hỗ trợ trong bản ứng dụng Windows. Bản xem trước này lưu trong trình duyệt.",
        );
      await nativeInvoke("open_save_directory");
    },
  };
}
