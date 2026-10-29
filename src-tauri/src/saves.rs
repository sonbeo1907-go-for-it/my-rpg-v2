use serde::{Deserialize, Serialize};
use std::{
    collections::BTreeMap,
    fs,
    hash::{Hash, Hasher},
    io::{self, Write},
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};

const MAX_BYTES: u64 = 10 * 1024 * 1024;
type StoreResult<T> = Result<T, String>;

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfileMeta {
    pub id: u32,
    pub username: String,
    pub updated_at: u64,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveEntry {
    #[serde(flatten)]
    pub meta: ProfileMeta,
    pub text: Option<String>,
    pub backup: Option<String>,
    pub revision: String,
    pub error: Option<String>,
}

pub struct SaveStore {
    root: PathBuf,
    saves: PathBuf,
}
fn error(e: impl std::fmt::Display) -> String {
    e.to_string()
}
fn now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}
fn revision(bytes: &[u8]) -> String {
    let mut hash = std::collections::hash_map::DefaultHasher::new();
    bytes.hash(&mut hash);
    format!("{:016x}", hash.finish())
}
fn username(name: &str) -> StoreResult<String> {
    let name = name.trim();
    if name.is_empty() || name.chars().count() > 32 || name.chars().any(char::is_control) {
        return Err("Tên người chơi cần 1–32 ký tự, không chứa ký tự điều khiển.".into());
    }
    Ok(name.into())
}
fn valid_save(text: &str) -> StoreResult<()> {
    if text.len() as u64 > MAX_BYTES {
        return Err("File save vượt 10 MB.".into());
    }
    let data: serde_json::Value =
        serde_json::from_str(text.trim_start_matches('\u{feff}')).map_err(error)?;
    if !data.is_object() || !data.get("version").is_some_and(|value| value.is_u64()) {
        return Err("File không có định dạng save hợp lệ.".into());
    }
    Ok(())
}
fn read_text(path: &Path) -> StoreResult<String> {
    if fs::symlink_metadata(path)
        .map_err(error)?
        .file_type()
        .is_symlink()
    {
        return Err("Không đọc save qua liên kết thư mục.".into());
    }
    if fs::metadata(path).map_err(error)?.len() > MAX_BYTES {
        return Err("File save vượt 10 MB.".into());
    }
    fs::read_to_string(path).map_err(error)
}
fn atomic_write(path: &Path, text: &str) -> StoreResult<()> {
    let parent = path.parent().ok_or("Đường dẫn không hợp lệ.")?;
    let mut temp = tempfile::NamedTempFile::new_in(parent).map_err(error)?;
    temp.write_all(text.as_bytes()).map_err(error)?;
    temp.as_file().sync_all().map_err(error)?;
    // tempfile uses an atomic replace on Windows, including when the destination exists.
    temp.persist(path).map_err(error)?;
    Ok(())
}
impl SaveStore {
    pub fn new(root: PathBuf) -> io::Result<Self> {
        let saves = root.join("saves");
        fs::create_dir_all(saves.join("backups"))?;
        // Refuse directory junctions / symlinks rather than escaping the app's data directory.
        for path in [&root, &saves, &saves.join("backups")] {
            if fs::symlink_metadata(path)?.file_type().is_symlink() {
                return Err(io::Error::new(
                    io::ErrorKind::PermissionDenied,
                    "Thư mục save không được là liên kết.",
                ));
            }
        }
        // Windows can virtualize AppData when a packaged launcher starts the game.
        // Resolve the opened directory to its physical path so Explorer and the UI
        // receive the same path the filesystem actually uses.
        let root = dunce::canonicalize(root)?;
        let saves = dunce::canonicalize(saves)?;
        Ok(Self { root, saves })
    }
    pub fn directory(&self) -> &Path {
        &self.saves
    }
    fn path(&self, id: u32) -> StoreResult<PathBuf> {
        if id == 0 {
            return Err("Mã hồ sơ không hợp lệ.".into());
        }
        Ok(self.saves.join(format!("savedata{id}.json")))
    }
    fn backup_path(&self, id: u32) -> PathBuf {
        self.saves
            .join("backups")
            .join(format!("savedata{id}.json"))
    }
    fn index(&self) -> BTreeMap<u32, ProfileMeta> {
        // Save files remain discoverable even if the optional profile-name index is damaged.
        read_text(&self.root.join("profiles.json"))
            .ok()
            .and_then(|text| serde_json::from_str(&text).ok())
            .unwrap_or_default()
    }
    fn put_meta(&self, meta: ProfileMeta) -> StoreResult<()> {
        let mut index = self.index();
        index.insert(meta.id, meta);
        atomic_write(
            &self.root.join("profiles.json"),
            &serde_json::to_string_pretty(&index).map_err(error)?,
        )
    }
    fn ids(&self) -> StoreResult<Vec<u32>> {
        let mut ids = vec![];
        for entry in fs::read_dir(&self.saves).map_err(error)? {
            let entry = entry.map_err(error)?;
            let name = entry.file_name().to_string_lossy().into_owned();
            if let Some(id) = name
                .strip_prefix("savedata")
                .and_then(|s| s.strip_suffix(".json"))
                .and_then(|s| s.parse::<u32>().ok())
                .filter(|id| *id > 0)
            {
                if name == format!("savedata{id}.json") {
                    ids.push(id);
                }
            }
        }
        ids.sort_unstable();
        Ok(ids)
    }
    pub fn read(&self, id: u32) -> StoreResult<SaveEntry> {
        let path = self.path(id)?;
        let data = read_text(&path);
        let (text, issue, rev) = match data {
            Ok(text) => {
                let rev = revision(text.as_bytes());
                (Some(text), None, rev)
            }
            Err(issue) if path.exists() => (None, Some(issue), "unreadable".into()),
            Err(issue) => return Err(issue),
        };
        let mut meta = self.index().remove(&id).unwrap_or(ProfileMeta {
            id,
            username: format!("Người lữ hành {id}"),
            updated_at: 0,
        });
        meta.id = id;
        if let Ok(modified) = fs::metadata(&path).and_then(|m| m.modified()) {
            meta.updated_at = modified
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis() as u64;
        }
        let backup = read_text(&self.backup_path(id)).ok();
        Ok(SaveEntry {
            meta,
            text,
            backup,
            revision: rev,
            error: issue,
        })
    }
    pub fn list(&self) -> StoreResult<Vec<SaveEntry>> {
        self.ids()?.into_iter().map(|id| self.read(id)).collect()
    }
    pub fn create(&self, name: &str, text: &str) -> StoreResult<SaveEntry> {
        let name = username(name)?;
        valid_save(text)?;
        let id = self
            .ids()?
            .last()
            .copied()
            .unwrap_or(0)
            .checked_add(1)
            .ok_or("Hết mã hồ sơ.")?;
        let path = self.path(id)?;
        let mut temp = tempfile::NamedTempFile::new_in(&self.saves).map_err(error)?;
        temp.write_all(text.as_bytes()).map_err(error)?;
        temp.as_file().sync_all().map_err(error)?;
        temp.persist_noclobber(path).map_err(error)?;
        // Metadata failure never invalidates the already durable campaign file.
        let meta = ProfileMeta {
            id,
            username: name,
            updated_at: now(),
        };
        if let Err(issue) = self.put_meta(meta) {
            return Err(format!("Đã tạo savedata{id}.json nhưng chưa lưu được tên: {issue}. Hãy làm mới danh sách, không tạo lại."));
        }
        self.read(id)
    }
    pub fn write(&self, id: u32, text: &str, expected: &str) -> StoreResult<SaveEntry> {
        valid_save(text)?;
        let path = self.path(id)?;
        let old = read_text(&path)?;
        if revision(old.as_bytes()) != expected {
            return Err("File save đã được thay đổi bên ngoài. Hãy quay lại chọn hồ sơ để tải lại, tránh ghi đè.".into());
        }
        valid_save(&old)?;
        atomic_write(&self.backup_path(id), &old)?;
        atomic_write(&path, text)?;
        self.read(id)
    }
    pub fn rename(&self, id: u32, name: &str) -> StoreResult<ProfileMeta> {
        let mut meta = self.read(id)?.meta;
        meta.username = username(name)?;
        self.put_meta(meta.clone())?;
        Ok(meta)
    }
    pub fn restore(&self, id: u32, expected: &str) -> StoreResult<SaveEntry> {
        let current = self.read(id)?;
        if current.revision != expected {
            return Err("File đã thay đổi. Hãy làm mới danh sách.".into());
        }
        let backup = current.backup.ok_or("Không có bản sao lưu.")?;
        valid_save(&backup)?;
        let path = self.path(id)?;
        // Preserve the broken file for manual recovery; never replace the good backup with it.
        if fs::symlink_metadata(&path)
            .map_err(error)?
            .file_type()
            .is_symlink()
        {
            return Err("Không khôi phục qua liên kết file.".into());
        }
        // Preserve raw bytes too: a damaged file may no longer be valid UTF-8 text.
        fs::copy(
            &path,
            self.saves
                .join("backups")
                .join(format!("savedata{id}.damaged-{}.json", now())),
        )
        .map_err(error)?;
        atomic_write(&path, &backup)?;
        self.read(id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn restore_preserves_non_utf8_file_bytes() {
        let temp = tempfile::tempdir().unwrap();
        let store = SaveStore::new(temp.path().into()).unwrap();
        let one = r#"{"version":4,"coins":1}"#;
        let created = store.create("Arthur", one).unwrap();
        store
            .write(1, r#"{"version":4,"coins":2}"#, &created.revision)
            .unwrap();
        let bytes = [0xff, 0xfe, 0x80];
        fs::write(store.path(1).unwrap(), bytes).unwrap();
        let broken = store.read(1).unwrap();
        assert!(broken.error.is_some());
        let restored = store.restore(1, &broken.revision).unwrap();
        assert_eq!(restored.text.as_deref(), Some(one));
        let damaged = fs::read_dir(store.saves.join("backups"))
            .unwrap()
            .map(|entry| entry.unwrap().path())
            .find(|path| path.to_string_lossy().contains(".damaged-"))
            .unwrap();
        assert_eq!(fs::read(damaged).unwrap(), bytes);
    }
    #[test]
    fn discovers_manual_files_and_keeps_json_unchanged() {
        let temp = tempfile::tempdir().unwrap();
        let store = SaveStore::new(temp.path().into()).unwrap();
        fs::write(store.path(7).unwrap(), r#"{"version":4,"coins":12}"#).unwrap();
        let list = store.list().unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].meta.id, 7);
        let created = store
            .create("Arthur", r#"{"version":4,"coins":20}"#)
            .unwrap();
        assert_eq!(created.meta.id, 8);
        assert_eq!(created.meta.username, "Arthur");
        assert_eq!(created.text.unwrap(), r#"{"version":4,"coins":20}"#);
    }
    #[test]
    fn backups_recovery_stale_writes_and_rename() {
        let temp = tempfile::tempdir().unwrap();
        let store = SaveStore::new(temp.path().into()).unwrap();
        let one = r#"{"version":4,"coins":1}"#;
        let two = r#"{"version":4,"coins":2}"#;
        let entry = store.create("Arthur", one).unwrap();
        let saved = store.write(1, two, &entry.revision).unwrap();
        assert_eq!(saved.backup.as_deref(), Some(one));
        assert!(store.write(1, one, &entry.revision).is_err());
        store.rename(1, "Iris").unwrap();
        assert_eq!(store.read(1).unwrap().meta.username, "Iris");
        fs::write(store.path(1).unwrap(), "broken").unwrap();
        let broken = store.read(1).unwrap();
        let restored = store.restore(1, &broken.revision).unwrap();
        assert_eq!(restored.text.as_deref(), Some(one));
        assert!(store.write(1, "broken", &restored.revision).is_err());
        assert!(store.path(0).is_err());
        assert!(store.create("\n", one).is_err());
    }
}
