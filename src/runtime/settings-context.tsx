"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useGame } from "./game-context";
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  normalizeSettings,
  readSettings,
} from "../ui/preferences.js";
type Preferences = {
  battleLogs:boolean;
  logoStyle: "en" | "jp";
  controlMode: "mouse" | "gamepad";
  musicEnabled: boolean;
  musicVolume: number;
  rumble: boolean;
  showHints: boolean;
};
type Connection = {
  connected: boolean;
  supported: boolean;
  id: string;
  haptics: boolean;
};
type SettingsValue = {
  preferences: Preferences;
  update: (changes: Partial<Preferences>) => void;
  open: boolean;
  setOpen: (value: boolean) => void;
  connection: Connection;
  setConnection: (value: Connection) => void;
  storageError: string;
};
const SettingsContext = createContext<SettingsValue | null>(null);
export function useSettings() {
  const value = useContext(SettingsContext);
  if (!value) throw new Error("Thiếu SettingsProvider");
  return value;
}
export function SettingsProvider({ children }: { children: ReactNode }) {
  const { ready, setAudioEnabled, setVolume } = useGame();
  const [preferences, setPreferences] = useState<Preferences>({
    ...DEFAULT_SETTINGS,
  });
  const current = useRef(preferences);
  const [open, setOpen] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [connection, setConnection] = useState<Connection>({
    connected: false,
    supported: false,
    id: "",
    haptics: false,
  });
  useEffect(() => {
    if (!ready) return;
    const loaded = readSettings() as Preferences;
    current.current = loaded;
    setPreferences(loaded);
    setAudioEnabled(loaded.musicEnabled);
    setVolume(loaded.musicVolume);
  }, [ready]);
  function update(changes: Partial<Preferences>) {
    const next = normalizeSettings({
      ...current.current,
      ...changes,
    }) as Preferences;
    current.current = next;
    setPreferences(next);
    if (changes.musicEnabled !== undefined) setAudioEnabled(next.musicEnabled);
    if (changes.musicVolume !== undefined) setVolume(next.musicVolume);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      setStorageError("");
    } catch {
      setStorageError(
        "Thiết lập đang áp dụng cho phiên này nhưng chưa lưu được trên thiết bị.",
      );
    }
  }
  return (
    <SettingsContext.Provider
      value={{
        preferences,
        update,
        open,
        setOpen,
        connection,
        setConnection,
        storageError,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}
