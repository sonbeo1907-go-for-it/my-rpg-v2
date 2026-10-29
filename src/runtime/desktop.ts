import { isTauri, invoke } from "@tauri-apps/api/core";
export function desktopInvoke() {
  return isTauri() ? invoke : null;
}
