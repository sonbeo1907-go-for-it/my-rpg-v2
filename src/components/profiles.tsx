"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "../runtime/game-context";
import { normalizeUsername } from "../runtime/profile-store.js";
import { Icon, Modal, fmt } from "./ui";

export function ProfileNameDialog({
  title,
  initialName = "",
  onClose,
  onSave,
}: {
  title: string;
  initialName?: string;
  onClose: () => void;
  onSave: (name: string) => Promise<boolean>;
}) {
  const { busy, notice } = useGame();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");
  const [failed, setFailed] = useState(false);
  const valid = (() => {
    try {
      normalizeUsername(name);
      return true;
    } catch {
      return false;
    }
  })();
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    try {
      if (await onSave(normalizeUsername(name))) onClose();
      else setFailed(true);
    } catch (issue) {
      setError(String((issue as Error).message ?? issue));
    }
  }
  return (
    <Modal
      title={title}
      initialFocus="input"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form className="profile-name-form" onSubmit={submit}>
        <label>
          Tên người chơi
          <input
            autoComplete="off"
            maxLength={64}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError(""); setFailed(false);
            }}
          />
        </label>
        <small>1–32 ký tự. Tên này thuộc hồ sơ của bạn.</small>
        {(error || failed) && (
          <p role="alert" className="warning">
            {error || notice || "Chưa lưu được hồ sơ. Hãy thử lại."}
          </p>
        )}
        <div className="profile-dialog-actions">
          <button type="button" disabled={busy} onClick={onClose}>
            Hủy
          </button>
          <button className="gold" disabled={busy || !valid} type="submit">
            {busy ? "Đang lưu…" : "Lưu"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ProfileSelection() {
  const {
    profiles,
    profileError,
    desktop,
    saveDirectory,
    busy,
    notice,
    enterProfile,
    createProfile,
    refreshProfiles,
    restoreProfile,
    openSaveDirectory,
  } = useGame();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<number | null>(
    profiles[0]?.id ?? null,
  );
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<number | null>(null);
  useEffect(() => {
    if (!profiles.some((p) => p.id === selectedId))
      setSelectedId(profiles[0]?.id ?? null);
  }, [profiles, selectedId]);
  const selected = profiles.find((p) => p.id === selectedId);
  return (
    <section className="profile-selection" aria-labelledby="profiles-heading">
      <span className="eyebrow">NHỮNG DẤU CHÂN PHƯƠNG BẮC</span>
      <h2 id="profiles-heading">Chọn hành trình</h2>
      <p className="profile-intro">
        Mỗi cái tên, một câu chuyện đang chờ được viết tiếp.
      </p>
      <div className="profile-list" role="group" aria-label="Các hồ sơ lưu">
        {profiles.map((profile) => (
          <button
            key={profile.id}
            disabled={busy}
            aria-pressed={selectedId === profile.id}
            className={`profile-card ${selectedId === profile.id ? "selected" : ""} ${profile.error ? "damaged" : ""}`}
            onClick={() => setSelectedId(profile.id)}
          >
            <span className="profile-card-crest">
              <Icon name="shield" />
            </span>
            <span className="profile-card-content">
              <strong>{profile.username}</strong>
              <span>
                {profile.error
                  ? "Không đọc được tiến trình"
                  : `${fmt(profile.campaign.victories)} chiến thắng · ${profile.campaign.unlockedCharacterIds.length} đồng đội`}
              </span>
              <small>
                {profile.updatedAt
                  ? new Date(profile.updatedAt).toLocaleString("vi-VN")
                  : "Hành trình đã lưu"}
              </small>
            </span>
            <span className="profile-slot-number">
              {String(profile.id).padStart(2, "0")}
            </span>
          </button>
        ))}
        {!profiles.length && !profileError && (
          <div className="profile-empty">
            <Icon name="book" />
            <p>
              Chưa có hành trình nào.
              <br />
              Hãy để lại dấu chân đầu tiên.
            </p>
          </div>
        )}
      </div>
      {profileError && (
        <p className="warning" role="alert">
          Không đọc được kho lưu dữ liệu: {profileError}
        </p>
      )}
      {selected?.error && (
        <div className="profile-error" role="alert">
          <p>{selected.error}</p>
          {selected.recoverable && (
            <button disabled={busy} onClick={() => setRestoring(selected.id)}>
              Khôi phục bản sao lưu
            </button>
          )}
        </div>
      )}
      <div className="profile-primary-actions">
        <button
          className="gold profile-continue"
          disabled={
            busy ||
            !selected ||
            Boolean(selected.error) ||
            Boolean(profileError)
          }
          onClick={async () => {
            if (selected && (await enterProfile(selected.id)))
              router.push("/home");
          }}
        >
          Tiếp tục <span>→</span>
        </button>
        <button
          className="profile-create"
          disabled={busy || Boolean(profileError)}
          onClick={() => setCreating(true)}
        >
          <Icon name="plus" /> Tạo hành trình mới
        </button>
      </div>
      <div className="profile-secondary-actions">
        <button disabled={busy} onClick={refreshProfiles}>
          Làm mới danh sách
        </button>
        <button disabled={busy} onClick={openSaveDirectory}>
          <Icon name="folder" /> Mở thư mục lưu dữ liệu game
        </button>
      </div>
      {desktop && saveDirectory && <small className="profile-save-location">{saveDirectory}</small>}
      {!desktop && (
        <small className="profile-preview-note">
          Bản xem trước trên trình duyệt · Hồ sơ được lưu trên trình duyệt này.
        </small>
      )}
      {notice && (
        <p className="title-notice" role="status">
          {notice}
        </p>
      )}
      {creating && (
        <ProfileNameDialog
          title="Tạo hành trình mới"
          onClose={() => setCreating(false)}
          onSave={async (name) => {
            const ok = await createProfile(name);
            if (ok) router.push("/home");
            return ok;
          }}
        />
      )}
      {restoring !== null && (
        <Modal
          title="Khôi phục hành trình?"
          onClose={() => {
            if (!busy) setRestoring(null);
          }}
          footer={
            <>
              <button disabled={busy} onClick={() => setRestoring(null)}>
                Hủy
              </button>
              <button
                className="gold"
                disabled={busy}
                onClick={async () => {
                  if (await restoreProfile(restoring)) setRestoring(null);
                }}
              >
                Khôi phục
              </button>
            </>
          }
        >
          <p>
            Tiến trình sẽ trở về lần lưu dự phòng gần nhất. File hiện tại được
            giữ lại để có thể kiểm tra sau.
          </p>
        </Modal>
      )}
    </section>
  );
}

export function SwitchProfileButton({
  className = "home-title-link",
  onLeave,
}: {
  className?: string;
  onLeave?: () => void;
}) {
  const { battle, busy, leaveProfile } = useGame();
  const { push } = useRouter();
  const [confirm, setConfirm] = useState(false);
  const leave = () => {
    if (leaveProfile()) {
      setConfirm(false);
      onLeave?.();
      push("/");
    }
  };
  return (
    <>
      <button
        className={className}
        disabled={busy}
        onClick={() => {
          if (battle) setConfirm(true);
          else leave();
        }}
      >
        Đổi hồ sơ
      </button>
      {confirm && (
        <Modal
          title="Đổi hồ sơ?"
          onClose={() => setConfirm(false)}
          footer={
            <>
              <button onClick={() => setConfirm(false)}>Hủy</button>
              <button className="gold" disabled={busy} onClick={leave}>
                Đổi hồ sơ
              </button>
            </>
          }
        >
          <p>
            Tiến trình đã lưu được giữ lại. Trận đấu hoặc chuyến thám hiểm đang
            diễn ra sẽ kết thúc khi đổi hồ sơ.
          </p>
        </Modal>
      )}
    </>
  );
}
