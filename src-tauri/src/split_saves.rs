//! Immutable section objects and one atomic commit pointer. Game/IPC save schema stays v7.
use super::{atomic_write, error, read_text, valid_save, StoreResult, MAX_BYTES};
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use sha2::{Digest, Sha256};
use std::{
    collections::{BTreeMap, BTreeSet},
    fs,
    path::Path,
};

const FORMAT: &str = "the-prisma-origin.split-save";
const SECTIONS: [&str; 7] = [
    "account",
    "equipment",
    "characters",
    "progression",
    "sessions",
    "session-content",
    "extensions",
];
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub(super) struct Manifest {
    format: String,
    storage_version: u32,
    profile_id: u32,
    pub generation: u64,
    #[serde(default)]
    legacy_hash: Option<String>,
    sections: BTreeMap<String, String>,
}
#[derive(Deserialize, Serialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
struct Section {
    storage_version: u32,
    section: String,
    data: Map<String, Value>,
}
pub(super) struct Snapshot {
    pub manifest: Manifest,
    pub text: String,
}
fn invalid() -> String {
    "Bộ dữ liệu lưu không đầy đủ hoặc đã bị thay đổi. Hãy khôi phục bản sao lưu hợp lệ.".into()
}
fn digest(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}
fn safe_hash(hash: &str) -> bool {
    hash.len() == 64
        && hash
            .bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}
pub(super) fn exists(path: &Path) -> bool {
    fs::symlink_metadata(path).is_ok()
}
pub(super) fn safe_dir(path: &Path) -> StoreResult<()> {
    let m =
        fs::symlink_metadata(path).map_err(|_| "Không mở được thư mục lưu dữ liệu.".to_string())?;
    if !m.is_dir() || m.file_type().is_symlink() {
        return Err("Thư mục save không được là liên kết.".into());
    }
    Ok(())
}
fn ensure_dir(path: &Path) -> StoreResult<()> {
    if !exists(path) {
        fs::create_dir(path).map_err(error)?;
    }
    safe_dir(path)
}
pub(super) fn prepared(dir: &Path) -> bool {
    exists(&dir.join("manifest.json")) || exists(&dir.join("manifest.backup.json"))
}
pub(super) fn revision(dir: &Path) -> String {
    if safe_dir(dir).is_err() {
        return "split:unreadable".into();
    }
    match read_text(&dir.join("manifest.json")) {
        Ok(raw) => format!("split:{}", digest(raw.as_bytes())),
        Err(_) => {
            // Hash malformed/non-UTF8 pointer bytes as well, without following a symlink.
            let p = dir.join("manifest.json");
            let raw = fs::symlink_metadata(&p)
                .ok()
                .filter(|m| m.is_file() && !m.file_type().is_symlink() && m.len() <= MAX_BYTES)
                .and_then(|_| fs::read(&p).ok());
            raw.map(|b| format!("split:{}", digest(&b)))
                .unwrap_or_else(|| "split:unreadable".into())
        }
    }
}
fn section_for(key: &str) -> &'static str {
    match key {
        "gear" | "exclusiveGear" | "pendingReforge" | "pendingGearReforge"
        | "blacksmithRevision" | "craftedGearSerial" => "equipment",
        "characters"
        | "unlockedCharacterIds"
        | "party"
        | "partyPresets"
        | "activePartyPresetId"
        | "equipment"
        | "equippedExclusiveGear"
        | "extraGearSlots"
        | "moonlightRevelations"
        | "tobinCraftCount" => "characters",
        "storyFlags"
        | "victories"
        | "claimedFirstClearRewards"
        | "dungeonClearedDifficulties"
        | "unrecordedLedger" | "bestiary" => "progression",
        "chronicles" | "tournaments" | "illusion" => "sessions",
        "version"
        | "levelProgressionVersion"
        | "coins"
        | "prisma"
        | "recruitmentShards"
        | "prismaFragments"
        | "originalPrisma"
        | "blueprints"
        | "unlockedExclusiveRecipes"
        | "recruitmentTickets"
        | "xpBooksGreen"
        | "xpBooksBlue"
        | "xpBooksPurple"
        | "limitBreakStones"
        | "sweepTickets"
        | "trainingCharges"
        | "gacha"
        | "dungeonDaily"
        | "dailyCommissions"
        | "shopDaily"
        | "honor"
        | "arenaProgress" | "homeScene" => "account",
        _ => "extensions", // Forward-compatible fields survive a round trip, never silently dropped.
    }
}
fn partition(text: &str) -> StoreResult<BTreeMap<String, Map<String, Value>>> {
    valid_save(text)?;
    let data: Value = serde_json::from_str(text.trim_start_matches('\u{feff}')).map_err(error)?;
    let mut parts: BTreeMap<String, Map<String, Value>> = SECTIONS
        .iter()
        .map(|s| (s.to_string(), Map::new()))
        .collect();
    for (key, value) in data.as_object().ok_or_else(invalid)? {
        parts
            .get_mut(section_for(key))
            .unwrap()
            .insert(key.clone(), value.clone());
    }
    // A run's frozen rules/builds are immutable but large. Do not rewrite them for each turn.
    if let Some(run) = parts
        .get_mut("sessions")
        .unwrap()
        .get_mut("tournaments")
        .and_then(|v| v.get_mut("activeRun"))
        .and_then(Value::as_object_mut)
    {
        if let Some(value) = run.remove("snapshot") {
            parts
                .get_mut("session-content")
                .unwrap()
                .insert("academySnapshot".into(), value);
        }
    }
    Ok(parts)
}
fn assemble(parts: BTreeMap<String, Map<String, Value>>) -> StoreResult<String> {
    let mut data = Map::new();
    for (section, fields) in &parts {
        if section == "session-content" {
            continue;
        }
        for (key, value) in fields {
            if section_for(key) != section || data.insert(key.clone(), value.clone()).is_some() {
                return Err(invalid());
            }
        }
    }
    for (key, value) in parts.get("session-content").ok_or_else(invalid)? {
        if key != "academySnapshot" {
            return Err(invalid());
        }
        let run = data
            .get_mut("tournaments")
            .and_then(|v| v.get_mut("activeRun"))
            .and_then(Value::as_object_mut)
            .ok_or_else(invalid)?;
        if run.insert("snapshot".into(), value.clone()).is_some() {
            return Err(invalid());
        }
    }
    let text = serde_json::to_string(&data).map_err(error)?;
    valid_save(&text)?;
    Ok(text)
}
fn object_name(section: &str, hash: &str) -> StoreResult<String> {
    if !SECTIONS.contains(&section) || !safe_hash(hash) {
        return Err(invalid());
    }
    Ok(format!("{section}-{hash}.json"))
}
fn read_object(dir: &Path, section: &str, hash: &str) -> StoreResult<Map<String, Value>> {
    let text = read_text(&dir.join(object_name(section, hash)?)).map_err(|_| invalid())?;
    if digest(text.as_bytes()) != hash {
        return Err(invalid());
    }
    let body: Section = serde_json::from_str(&text).map_err(|_| invalid())?;
    if body.storage_version != 1 || body.section != section {
        return Err(invalid());
    }
    Ok(body.data)
}
fn manifest(text: &str, id: u32) -> StoreResult<Manifest> {
    let m: Manifest = serde_json::from_str(text).map_err(|_| invalid())?;
    if m.format != FORMAT
        || m.storage_version != 1
        || m.profile_id != id
        || m.legacy_hash.as_deref().is_some_and(|h| !safe_hash(h))
        || m.sections.len() != SECTIONS.len()
        || SECTIONS
            .iter()
            .any(|s| !m.sections.get(*s).is_some_and(|h| safe_hash(h)))
    {
        return Err(invalid());
    }
    Ok(m)
}
pub(super) fn load(dir: &Path, id: u32, backup: bool) -> StoreResult<Snapshot> {
    safe_dir(dir)?;
    let m = manifest(
        &read_text(&dir.join(if backup {
            "manifest.backup.json"
        } else {
            "manifest.json"
        }))
        .map_err(|_| invalid())?,
        id,
    )?;
    if !backup && m.generation == 0 {
        return Err(invalid());
    }
    let legacy = dir
        .parent()
        .ok_or_else(invalid)?
        .join(format!("savedata{id}.json"));
    if exists(&legacy) {
        let raw = read_text(&legacy)?;
        if m.legacy_hash.as_deref() != Some(digest(raw.as_bytes()).as_str()) {
            return Err("File save cũ đã thay đổi hoặc trùng mã hồ sơ. Hãy giữ cả hai bản và mở thư mục lưu để kiểm tra; game không tự trộn dữ liệu.".into());
        }
    }
    let objects = dir.join(if backup { "backup-objects" } else { "objects" });
    safe_dir(&objects)?;
    let mut parts = BTreeMap::new();
    let mut total = 0usize;
    for (section, hash) in &m.sections {
        let fields = read_object(&objects, section, hash)?;
        total += serde_json::to_vec(&fields).map_err(error)?.len();
        if total as u64 > MAX_BYTES {
            return Err("Bộ save vượt 10 MB.".into());
        }
        parts.insert(section.clone(), fields);
    }
    Ok(Snapshot {
        manifest: m,
        text: assemble(parts)?,
    })
}
fn write_object(
    objects: &Path,
    section: &str,
    fields: &Map<String, Value>,
    repair: bool,
) -> StoreResult<String> {
    let text = serde_json::to_string(&Section {
        storage_version: 1,
        section: section.into(),
        data: fields.clone(),
    })
    .map_err(error)?;
    if text.len() as u64 > MAX_BYTES {
        return Err("Một phần dữ liệu save vượt 10 MB.".into());
    }
    let hash = digest(text.as_bytes());
    let path = objects.join(object_name(section, &hash)?);
    if exists(&path) {
        if read_object(objects, section, &hash).is_ok() {
            return Ok(hash);
        }
        if !repair {
            return Err(invalid());
        }
        // Never replace through a symlink; recovery archives corrupt regular files first.
        if fs::symlink_metadata(&path)
            .map_err(error)?
            .file_type()
            .is_symlink()
        {
            return Err(invalid());
        }
    }
    atomic_write(&path, &text)?;
    Ok(hash)
}
fn prepare(
    dir: &Path,
    id: u32,
    generation: u64,
    text: &str,
    backup: bool,
    repair: bool,
) -> StoreResult<Manifest> {
    ensure_dir(dir)?;
    let objects = dir.join(if backup { "backup-objects" } else { "objects" });
    ensure_dir(&objects)?;
    let mut sections = BTreeMap::new();
    for (section, fields) in partition(text)? {
        sections.insert(
            section.clone(),
            write_object(&objects, &section, &fields, repair)?,
        );
    }
    Ok(Manifest {
        format: FORMAT.into(),
        storage_version: 1,
        profile_id: id,
        generation,
        legacy_hash: None,
        sections,
    })
}
fn publish(dir: &Path, m: &Manifest, backup: bool) -> StoreResult<()> {
    atomic_write(
        &dir.join(if backup {
            "manifest.backup.json"
        } else {
            "manifest.json"
        }),
        &serde_json::to_string_pretty(m).map_err(error)?,
    )
}
fn clean_objects(dir: &Path, m: &Manifest, backup: bool) {
    // Post-commit best effort only. Unknown/user files are never removed.
    let objects = dir.join(if backup { "backup-objects" } else { "objects" });
    let keep: BTreeSet<String> = m
        .sections
        .iter()
        .filter_map(|(s, h)| object_name(s, h).ok())
        .collect();
    if let Ok(rows) = fs::read_dir(&objects) {
        for row in rows.flatten() {
            let name = row.file_name().to_string_lossy().into_owned();
            let managed = SECTIONS.iter().any(|s| {
                name.strip_prefix(&format!("{s}-"))
                    .and_then(|n| n.strip_suffix(".json"))
                    .is_some_and(safe_hash)
            });
            if managed
                && !keep.contains(&name)
                && row
                    .file_type()
                    .is_ok_and(|t| t.is_file() && !t.is_symlink())
            {
                let _ = fs::remove_file(row.path());
            }
        }
    }
}
pub(super) fn create(dir: &Path, id: u32, text: &str) -> StoreResult<()> {
    let m = prepare(dir, id, 1, text, false, false)?;
    if exists(&dir.join("manifest.json")) {
        return Err("Hồ sơ đã tồn tại. Hãy làm mới danh sách.".into());
    }
    publish(dir, &m, false)
}
pub(super) fn write(dir: &Path, id: u32, text: &str, legacy: Option<&str>) -> StoreResult<()> {
    write_with_hook(dir, id, text, legacy, &mut |_| Ok(()))
}
// Hooks are only used by unit tests to inject interruption at real publication boundaries.
fn write_with_hook(
    dir: &Path,
    id: u32,
    text: &str,
    legacy: Option<&str>,
    hook: &mut dyn FnMut(&str) -> StoreResult<()>,
) -> StoreResult<()> {
    let pointer_revision = revision(dir);
    let old = if let Some(raw) = legacy {
        Snapshot {
            manifest: Manifest {
                format: FORMAT.into(),
                storage_version: 1,
                profile_id: id,
                generation: 0,
                legacy_hash: Some(digest(raw.as_bytes())),
                sections: BTreeMap::new(),
            },
            text: raw.into(),
        }
    } else {
        load(dir, id, false)?
    };
    let generation = old.manifest.generation.checked_add(1).ok_or_else(invalid)?;
    // A no-op must not discard a useful previous backup or rewrite large objects.
    if legacy.is_none() && partition(&old.text)? == partition(text)? {
        return Ok(());
    }
    let mut m = prepare(dir, id, generation, text, false, false)?;
    m.legacy_hash = old.manifest.legacy_hash.clone();
    hook("objects")?;
    // Physically independent backup objects: corruption in a shared unchanged file cannot break both copies.
    let mut backup = prepare(dir, id, old.manifest.generation, &old.text, true, true)?;
    backup.legacy_hash = old.manifest.legacy_hash.clone();
    hook("backup_objects")?;
    if revision(dir) != pointer_revision {
        return Err("Save đã thay đổi trong lúc lưu. Hãy tải lại hồ sơ.".into());
    }
    publish(dir, &backup, true)?;
    hook("backup")?;
    if revision(dir) != pointer_revision {
        return Err("Save đã thay đổi trong lúc lưu. Hãy tải lại hồ sơ.".into());
    }
    // Single commit point: before this call readers see old; after it they see all new sections.
    publish(dir, &m, false)?;
    clean_objects(dir, &m, false);
    clean_objects(dir, &backup, true);
    Ok(())
}
fn archive(dir: &Path) -> StoreResult<()> {
    let damaged = dir.join("damaged");
    ensure_dir(&damaged)?;
    let target = tempfile::Builder::new()
        .prefix("recovery-")
        .tempdir_in(&damaged)
        .map_err(error)?
        .keep();
    for name in ["manifest.json"] {
        let path = dir.join(name);
        if exists(&path) {
            let meta = fs::symlink_metadata(&path).map_err(error)?;
            if !meta.is_file() || meta.file_type().is_symlink() || meta.len() > MAX_BYTES {
                return Err(invalid());
            }
            fs::copy(&path, target.join(name)).map_err(error)?;
        }
    }
    let objects = dir.join("objects");
    if exists(&objects) {
        safe_dir(&objects)?;
        for row in fs::read_dir(&objects).map_err(error)? {
            let row = row.map_err(error)?;
            let name = row.file_name().to_string_lossy().into_owned();
            let managed = SECTIONS.iter().any(|s| {
                name.strip_prefix(&format!("{s}-"))
                    .and_then(|n| n.strip_suffix(".json"))
                    .is_some_and(safe_hash)
            });
            if !managed {
                continue;
            }
            let meta = fs::symlink_metadata(row.path()).map_err(error)?;
            if !meta.is_file() || meta.file_type().is_symlink() || meta.len() > MAX_BYTES {
                return Err(invalid());
            }
            fs::copy(row.path(), target.join(name)).map_err(error)?;
        }
    }
    Ok(())
}
pub(super) fn restore(dir: &Path, id: u32) -> StoreResult<()> {
    let backup = load(dir, id, true)?;
    archive(dir)?;
    let generation = load(dir, id, false)
        .ok()
        .map(|s| s.manifest.generation)
        .unwrap_or(backup.manifest.generation)
        .checked_add(1)
        .ok_or_else(invalid)?;
    let mut m = prepare(dir, id, generation, &backup.text, false, true)?;
    m.legacy_hash = backup.manifest.legacy_hash;
    publish(dir, &m, false)?;
    clean_objects(dir, &m, false);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    fn sample(coins: u32) -> String {
        json!({"version":7,"coins":coins,"gear":[{"id":"g1","stats":{"attack":3}}],"characters":{"arthur":{"level":25}},"equipment":{"arthur":["g1"]},"storyFlags":["flag.a"],"tournaments":{"activeRun":{"snapshot":{"definition":{"rulesetVersion":"1"},"kits":{"data":[1,2,3]}},"round":1}},"newFutureField":{"keep":true}}).to_string()
    }
    fn value(s: &str) -> Value {
        serde_json::from_str(s.trim_start_matches('\u{feff}')).unwrap()
    }
    #[test]
    fn all_sections_round_trip_and_unknown_fields_survive() {
        let tmp = tempfile::tempdir().unwrap();
        let dir = tmp.path().join("savedata1");
        let raw = sample(100);
        create(&dir, 1, &raw).unwrap();
        assert_eq!(value(&load(&dir, 1, false).unwrap().text), value(&raw));
        assert_eq!(
            fs::read_dir(dir.join("objects")).unwrap().count(),
            SECTIONS.len()
        );
        let snapshot = load(&dir, 1, false).unwrap();
        let fields = read_object(
            &dir.join("objects"),
            "sessions",
            &snapshot.manifest.sections["sessions"],
        )
        .unwrap();
        assert!(fields["tournaments"]["activeRun"].get("snapshot").is_none());
    }
    #[test]
    fn nested_object_order_and_f64_precision_survive_serialization() {
        // Tournament replay validation uses JSON.stringify equality on nested records.
        // Reordering their keys would reject a valid ongoing tournament on next load.
        let tmp = tempfile::tempdir().unwrap();
        let dir = tmp.path().join("savedata1");
        let raw = r#"{"version":7,"future":{"z":0.30000000000000004,"a":1,"m":{"right":2,"left":3}},"coins":1}"#;
        create(&dir, 1, raw).unwrap();
        let restored = load(&dir, 1, false).unwrap().text;
        assert!(restored
            .contains(r#""future":{"z":0.30000000000000004,"a":1,"m":{"right":2,"left":3}}"#));
        assert_eq!(value(&restored), value(raw));
    }
    #[test]
    fn currency_only_write_reuses_inventory_and_heavy_snapshot_and_prunes_history() {
        let tmp = tempfile::tempdir().unwrap();
        let dir = tmp.path().join("savedata1");
        create(&dir, 1, &sample(1)).unwrap();
        let before = load(&dir, 1, false).unwrap().manifest;
        write(&dir, 1, &sample(2), None).unwrap();
        let after = load(&dir, 1, false).unwrap().manifest;
        assert_ne!(before.sections["account"], after.sections["account"]);
        for s in SECTIONS.iter().filter(|s| **s != "account") {
            assert_eq!(before.sections[*s], after.sections[*s]);
        }
        assert_eq!(value(&load(&dir, 1, true).unwrap().text)["coins"], 1);
        for coins in 3..15 {
            write(&dir, 1, &sample(coins), None).unwrap();
        }
        assert_eq!(
            fs::read_dir(dir.join("objects")).unwrap().count(),
            SECTIONS.len()
        );
        assert_eq!(
            fs::read_dir(dir.join("backup-objects")).unwrap().count(),
            SECTIONS.len()
        );
        let rev = revision(&dir);
        write(&dir, 1, &sample(14), None).unwrap();
        assert_eq!(revision(&dir), rev);
        assert_eq!(value(&load(&dir, 1, true).unwrap().text)["coins"], 13);
    }
    #[test]
    fn interrupted_writes_never_publish_mixed_coin_inventory_and_build() {
        for stage in ["objects", "backup_objects", "backup"] {
            let tmp = tempfile::tempdir().unwrap();
            let dir = tmp.path().join("savedata1");
            let one = sample(1);
            create(&dir, 1, &one).unwrap();
            let mut next = value(&sample(2));
            next["gear"][0]["id"] = json!("g2");
            next["equipment"]["arthur"][0] = json!("g2");
            let rev = revision(&dir);
            let result = write_with_hook(&dir, 1, &next.to_string(), None, &mut |at| {
                if at == stage {
                    Err("injected interruption".into())
                } else {
                    Ok(())
                }
            });
            assert!(result.is_err());
            assert_eq!(revision(&dir), rev);
            assert_eq!(value(&load(&dir, 1, false).unwrap().text), value(&one));
            write(&dir, 1, &next.to_string(), None).unwrap();
            assert_eq!(value(&load(&dir, 1, false).unwrap().text), next);
        }
    }
    #[test]
    fn corrupt_unchanged_object_recovers_from_independent_backup_and_preserves_raw_bytes() {
        let tmp = tempfile::tempdir().unwrap();
        let dir = tmp.path().join("savedata1");
        create(&dir, 1, &sample(1)).unwrap();
        write(&dir, 1, &sample(2), None).unwrap();
        let m = load(&dir, 1, false).unwrap().manifest;
        let name = object_name("equipment", &m.sections["equipment"]).unwrap();
        fs::write(dir.join("objects").join(&name), [0xff, 0xfe, 0x80]).unwrap();
        assert!(load(&dir, 1, false).is_err());
        assert!(load(&dir, 1, true).is_ok());
        restore(&dir, 1).unwrap();
        assert_eq!(value(&load(&dir, 1, false).unwrap().text)["coins"], 1);
        let archive = fs::read_dir(dir.join("damaged"))
            .unwrap()
            .next()
            .unwrap()
            .unwrap()
            .path();
        assert_eq!(fs::read(archive.join(name)).unwrap(), [0xff, 0xfe, 0x80]);
    }
    #[test]
    fn missing_parts_unknown_sections_wrong_profile_or_paths_never_form_a_save() {
        let tmp = tempfile::tempdir().unwrap();
        let dir = tmp.path().join("savedata1");
        create(&dir, 1, &sample(1)).unwrap();
        let original = fs::read_to_string(dir.join("manifest.json")).unwrap();
        for bad in [
            json!({"format":FORMAT,"storageVersion":1,"profileId":2,"generation":1,"sections":{}}),
            {
                let mut m = value(&original);
                m["sections"]["account"] = json!("../../outside.json");
                m
            },
            {
                let mut m = value(&original);
                m["storageVersion"] = json!(2);
                m
            },
        ] {
            fs::write(dir.join("manifest.json"), bad.to_string()).unwrap();
            assert!(load(&dir, 1, false).is_err());
        }
        fs::write(dir.join("manifest.json"), original).unwrap();
        let m = load(&dir, 1, false).unwrap().manifest;
        fs::remove_file(
            dir.join("objects")
                .join(object_name("characters", &m.sections["characters"]).unwrap()),
        )
        .unwrap();
        assert!(load(&dir, 1, false).is_err());
    }
    #[test]
    fn stale_pointer_changed_during_prepare_is_not_overwritten() {
        let tmp = tempfile::tempdir().unwrap();
        let dir = tmp.path().join("savedata1");
        create(&dir, 1, &sample(1)).unwrap();
        let raw = read_text(&dir.join("manifest.json")).unwrap();
        let result = write_with_hook(&dir, 1, &sample(2), None, &mut |at| {
            if at == "objects" {
                fs::write(dir.join("manifest.json"), format!("{raw}\n")).unwrap();
            }
            Ok(())
        });
        assert!(result.is_err());
        assert_eq!(value(&load(&dir, 1, false).unwrap().text)["coins"], 1);
    }
    #[test]
    fn migration_preserves_legacy_bytes_names_ids_and_survives_all_precommit_interruptions() {
        use super::super::SaveStore;
        for stage in ["objects", "backup_objects", "backup"] {
            let tmp = tempfile::tempdir().unwrap();
            let store = SaveStore::new(tmp.path().into()).unwrap();
            let raw = format!(
                "\u{feff}{}\n",
                serde_json::to_string_pretty(&value(&sample(1))).unwrap()
            );
            fs::write(store.path(7).unwrap(), &raw).unwrap();
            let old = store.read(7).unwrap();
            let dir = store.split_path(7).unwrap();
            assert!(
                write_with_hook(&dir, 7, &sample(2), Some(&raw), &mut |at| if at == stage {
                    Err("injected".into())
                } else {
                    Ok(())
                })
                .is_err()
            );
            assert_eq!(store.list().unwrap().len(), 1);
            if stage == "backup" {
                let broken = store.read(7).unwrap();
                assert!(broken.text.is_none());
                assert_eq!(value(broken.backup.as_deref().unwrap()), value(&raw));
                store.restore(7, &broken.revision).unwrap();
            } else {
                assert_eq!(store.read(7).unwrap().text.as_deref(), Some(raw.as_str()));
            }
            let retry = store.read(7).unwrap();
            let saved = store.write(7, &sample(2), &retry.revision).unwrap();
            assert_eq!(value(saved.text.as_deref().unwrap())["coins"], 2);
            assert_eq!(fs::read_to_string(store.path(7).unwrap()).unwrap(), raw);
            store.rename(7, "Iris").unwrap();
            assert_eq!(store.list().unwrap()[0].meta.username, "Iris");
            assert!(store.write(7, &sample(3), &old.revision).is_err());
            assert_eq!(store.create("Arthur", &sample(4)).unwrap().meta.id, 8);
            fs::write(store.path(7).unwrap(), sample(900)).unwrap();
            let fork = store.read(7).unwrap();
            assert!(fork.error.is_some());
            assert!(fork.backup.is_none());
            assert!(store.write(7, &sample(9), &fork.revision).is_err());
        }
    }
    #[test]
    fn incomplete_creation_is_not_listed_and_legacy_never_masks_corrupt_committed_manifest() {
        use super::super::SaveStore;
        let tmp = tempfile::tempdir().unwrap();
        let store = SaveStore::new(tmp.path().into()).unwrap();
        let dir = store.split_path(1).unwrap();
        prepare(&dir, 1, 1, &sample(1), false, false).unwrap();
        assert!(store.list().unwrap().is_empty());
        assert_eq!(store.create("Arthur", &sample(2)).unwrap().meta.id, 2);
        fs::write(store.path(7).unwrap(), sample(1)).unwrap();
        let old = store.read(7).unwrap();
        store.write(7, &sample(2), &old.revision).unwrap();
        let pointer = store.split_path(7).unwrap().join("manifest.json");
        fs::write(&pointer, "broken").unwrap();
        let broken = store.read(7).unwrap();
        assert!(broken.error.is_some());
        assert!(broken.text.is_none());
        assert!(broken.backup.is_some());
        store.restore(7, &broken.revision).unwrap();
        assert_eq!(
            value(store.read(7).unwrap().text.as_deref().unwrap())["coins"],
            1
        );
        fs::remove_file(pointer).unwrap();
        let missing = store.read(7).unwrap();
        assert!(missing.text.is_none());
        assert!(missing.backup.is_some());
    }
    #[test]
    fn backup_failure_does_not_commit_and_unknown_user_files_are_not_collected() {
        let tmp = tempfile::tempdir().unwrap();
        let dir = tmp.path().join("savedata1");
        create(&dir, 1, &sample(1)).unwrap();
        fs::write(dir.join("objects").join("notes.txt"), "keep").unwrap();
        fs::write(dir.join("backup-objects"), "not a directory").unwrap();
        assert!(write(&dir, 1, &sample(2), None).is_err());
        assert_eq!(value(&load(&dir, 1, false).unwrap().text)["coins"], 1);
        fs::remove_file(dir.join("backup-objects")).unwrap();
        write(&dir, 1, &sample(2), None).unwrap();
        assert_eq!(
            fs::read_to_string(dir.join("objects").join("notes.txt")).unwrap(),
            "keep"
        );
    }
    #[test]
    fn optional_real_campaign_fixture_round_trips_without_editing_source() {
        let Some(source) = std::env::var_os("PRISMA_TEST_SAVE_FIXTURE") else {
            return;
        };
        use super::super::SaveStore;
        let raw = fs::read_to_string(&source).unwrap();
        valid_save(&raw).unwrap();
        let tmp = tempfile::tempdir().unwrap();
        let store = SaveStore::new(tmp.path().into()).unwrap();
        fs::write(store.path(1).unwrap(), &raw).unwrap();
        let old = store.read(1).unwrap();
        let modular = store.write(1, &raw, &old.revision).unwrap();
        let restored = modular.text.as_deref().unwrap();
        assert_eq!(value(restored), value(&raw));
        assert_eq!(fs::read_to_string(source).unwrap(), raw);
        if let Some(output) = std::env::var_os("PRISMA_TEST_SAVE_OUTPUT") {
            fs::write(output, restored).unwrap();
        }
        let before = load(&store.split_path(1).unwrap(), 1, false)
            .unwrap()
            .manifest;
        let mut next = value(restored);
        next["coins"] = json!(next["coins"].as_u64().unwrap_or(0) + 1);
        store
            .write(1, &next.to_string(), &modular.revision)
            .unwrap();
        let after = load(&store.split_path(1).unwrap(), 1, false)
            .unwrap()
            .manifest;
        let changed = SECTIONS
            .iter()
            .filter(|s| before.sections[**s] != after.sections[**s])
            .count();
        assert_eq!(changed, 1);
        assert_ne!(before.sections["account"], after.sections["account"]);
        println!("Real fixture: {} bytes -> {} compact bytes; coin-only commit changed {changed}/{} sections",raw.len(),restored.len(),SECTIONS.len());
    }
}

#[cfg(test)]
#[test]
fn bestiary_belongs_to_progression_section() {
    assert_eq!(section_for("bestiary"), "progression");
}
