"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useGame } from "../runtime/game-context";
import { useSettings } from "../runtime/settings-context";
import { Icon, Modal } from "./ui";
import { GamepadNavigation } from "./gamepad-navigation";
import { GamepadEditor } from "./gamepad-editor";
import { SwitchProfileButton } from "./profiles";
import { BrandLogo } from "./brand-logo";

function SettingsDialog() {
  const { audio, entered, openSaveDirectory, campaign, battle, busy, setAstoriaEnabled } = useGame();
  const [developerOpen, setDeveloperOpen] = useState(false);
  const { preferences, update, open, setOpen, connection, storageError } =
    useSettings();
  const [tab, setTab] = useState("audio");
  if (!open) return null;
  return (
    <Modal
      title="Settings"
      onClose={() => setOpen(false)}
      initialFocus=".settings-tabs [aria-selected=true]"
      footer={<button onClick={() => setOpen(false)}>Đóng Settings</button>}
    >
      <div className="settings-tabs" role="tablist" aria-label="Thiết lập">
        <button
          role="tab"
          aria-selected={tab === "audio"}
          aria-controls="settings-audio"
          onClick={() => setTab("audio")}
        >
          <Icon name="sound" />
          Âm thanh
        </button>
        <button
          role="tab"
          aria-selected={tab === "controls"}
          aria-controls="settings-controls"
          onClick={() => setTab("controls")}
        >
          <Icon name="gamepad" />
          Điều khiển
        </button>
        <button role="tab" aria-selected={tab === "appearance"} aria-controls="settings-appearance" onClick={() => setTab("appearance")}>
          <Icon name="prism" /> Giao diện
        </button>
      </div>
      {tab === "audio" ? (
        <section
          id="settings-audio"
          role="tabpanel"
          className="settings-panel"
          aria-label="Âm thanh"
        >
          <div className="settings-row">
            <div>
              <h3>Nhạc nền</h3>
              <p>Nhạc quán trọ, chiến đấu và chiến thắng.</p>
            </div>
            <button
              className="audio-toggle"
              aria-pressed={preferences.musicEnabled}
              onClick={() =>
                update({
                  musicEnabled:
                    audio.blocked || audio.error
                      ? true
                      : !preferences.musicEnabled,
                })
              }
            >
              {audio.blocked || audio.error
                ? "Phát nhạc"
                : preferences.musicEnabled
                  ? "Đang bật"
                  : "Đang tắt"}
            </button>
          </div>
          <label className="settings-volume">
            Âm lượng nhạc nền{" "}
            <strong>{Math.round(preferences.musicVolume * 100)}%</strong>
            <input
              className="volume"
              type="range"
              min="0"
              max="1"
              step=".05"
              value={preferences.musicVolume}
              onChange={(event) =>
                update({ musicVolume: Number(event.target.value) })
              }
            />
          </label>
          {audio.blocked && (
            <p className="settings-notice">
              Bấm Phát nhạc để cho phép phát âm thanh.
            </p>
          )}
        </section>
      ) : tab === "controls" ? (
        <section
          id="settings-controls"
          role="tabpanel"
          className="settings-panel"
          aria-label="Điều khiển"
        >
          <fieldset>
            <legend>Phương thức điều khiển</legend>
            <div className="control-modes">
              <button
                aria-pressed={preferences.controlMode === "mouse"}
                onClick={() => update({ controlMode: "mouse" })}
              >
                <Icon name="mouse" />
                Chuột
              </button>
              <button
                aria-pressed={preferences.controlMode === "gamepad"}
                onClick={() => update({ controlMode: "gamepad" })}
              >
                <Icon name="gamepad" />
                Tay cầm Xbox
              </button>
            </div>
          </fieldset>
          <div
            className={`controller-status ${connection.supported ? "connected" : ""}`}
            role="status"
          >
            <span>
              {connection.supported
                ? "● Đã kết nối tay cầm"
                : connection.connected
                  ? "● Tay cầm chưa có bố trí nút chuẩn"
                  : "○ Chưa kết nối tay cầm"}
            </span>
            <small>
              {connection.connected
                ? connection.id
                : "Kết nối tay cầm rồi bấm một nút để nhận diện."}
            </small>
          </div>
          <label className="settings-check">
            <input
              type="checkbox"
              checked={preferences.showHints}
              onChange={(event) => update({ showHints: event.target.checked })}
            />
            Hiện hướng dẫn nút ở góc dưới bên phải
          </label>
          <label className="settings-check">
            <input
              type="checkbox"
              checked={preferences.rumble}
              onChange={(event) => update({ rumble: event.target.checked })}
            />
            Rung khi xác nhận{" "}
            <small>
              {connection.haptics ? "Tay cầm có hỗ trợ" : "Nếu tay cầm hỗ trợ"}
            </small>
          </label>
          <div
            className="controller-diagram"
            aria-label="Sơ đồ điều khiển Xbox"
          >
            {[
              ["D-pad / LS", "Di chuyển"],
              ["A", "Chọn / Xác nhận"],
              ["B", "Hủy / Trở về"],
              ["X", "Hành động phụ"],
              ["Y", "Chi tiết / Bộ lọc"],
              ["LB / RB", "Chuyển tab / đội"],
              ["RS", "Cuộn nội dung"],
              ["☰", "Settings"],
            ].map(([key, text]) => (
              <div key={key}>
                <kbd>{key}</kbd>
                <span>{text}</span>
              </div>
            ))}
          </div>
          <p className="settings-notice">
            Chuột luôn dùng được. Trong combat: A chọn chiêu → chọn mục tiêu → A
            thực hiện. B quay lại chọn chiêu.
          </p>
        </section>
      ) : (
        <section id="settings-appearance" role="tabpanel" className="settings-panel" aria-label="Giao diện">
          <fieldset className="logo-style-fieldset">
            <legend>Kiểu logo</legend>
            <p>Chọn dấu ấn của hành trình. Áp dụng ngay và lưu trên thiết bị này.</p>
            <div className="logo-style-options">
              {(["en","jp"] as const).map(style=><button key={style} type="button" className="logo-style-option" aria-label={style==="en"?"EN — Logo tiếng Anh":"JP — Logo tiếng Nhật"} aria-pressed={preferences.logoStyle===style} onClick={()=>update({logoStyle:style})}>
                <BrandLogo compact variant={style}/>
                <span><strong>{style.toUpperCase()}</strong><small>{style==="en"?"Tiếng Anh":"日本語 · Tiếng Nhật"}</small></span>
              </button>)}
            </div>
          </fieldset>
        </section>
      )}
      <div className="profile-dialog-actions">
        <button onClick={() => setDeveloperOpen(true)}>Developer Option</button>
        <button onClick={openSaveDirectory}>
          <Icon name="folder" /> Mở thư mục lưu dữ liệu game
        </button>
        {entered && (
          <SwitchProfileButton className="" onLeave={() => setOpen(false)} />
        )}
      </div>
      {developerOpen && <Modal title="Developer Option" onClose={() => setDeveloperOpen(false)} footer={<button onClick={() => setDeveloperOpen(false)}>Đóng Developer Option</button>}>
        <div className="developer-astoria">
          <span className="eyebrow">THỬ NGHIỆM · THỜI KHÔNG</span>
          <h3>Astoria</h3>
          <p>Thuật Sư hệ Ám · Kẻ du hành xuyên không thời gian.</p>
          <p>Bản trùng: <strong>0</strong> · 3 ô trang bị. Nhân vật không xuất hiện trong Chiêu Mộ.</p>
          <button role="switch" aria-checked={Boolean(campaign?.storyFlags.includes("developer.astoria"))} disabled={!entered || busy || Boolean(battle && !battle.outcome)} onClick={() => void setAstoriaEnabled(!campaign?.storyFlags.includes("developer.astoria"))}>
            {campaign?.storyFlags.includes("developer.astoria") ? "Tắt Astoria" : "Bật Astoria"}
          </button>
          {!entered && <p className="settings-notice">Chọn một hành trình trước khi bật nhân vật thử nghiệm.</p>}
          {battle && !battle.outcome && <p className="settings-notice">Kết thúc trận hoặc chuyến đi trước khi thay đổi.</p>}
          <small>Tắt sẽ gỡ Astoria khỏi đội hình và trả trang bị về túi đồ.</small>
        </div>
      </Modal>}
      {storageError && (
        <p className="warning" role="status">
          {storageError}
        </p>
      )}
    </Modal>
  );
}
function BattleLeaveDialog() {
  const {
    pendingBattleId,
    pendingDungeon,
    content,
    cancelNewBattle,
    confirmNewBattle,
    busy,
  } = useGame();
  const router = useRouter();
  if (!pendingBattleId && !pendingDungeon) return null;
  return (
    <Modal
      title="Bắt đầu trận mới?"
      onClose={cancelNewBattle}
      footer={
        <>
          <button onClick={cancelNewBattle}>Hủy</button>
          <button
            className="gold"
            disabled={busy}
            onClick={() => {
              if (confirmNewBattle()) router.push("/battle");
            }}
          >
            Bắt đầu trận mới
          </button>
        </>
      }
    >
      <p>
        Rời trận đang chơi để bắt đầu{" "}
        <strong>
          {pendingDungeon
            ? content.dungeons[pendingDungeon.typeId].name
            : content.encounters[pendingBattleId!].name}
        </strong>
        ? Tiến độ của trận đang chơi sẽ kết thúc.
      </p>
    </Modal>
  );
}
export function ControllerLayer() {
  const { ready } = useGame();
  if (!ready) return null;
  return (
    <>
      <GamepadNavigation />
      <SettingsDialog />
      <BattleLeaveDialog />
      <GamepadEditor />
    </>
  );
}
