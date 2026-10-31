export const SETTINGS_KEY = 'northern-prisma.settings.v1';
export const DEFAULT_SETTINGS = Object.freeze({ controlMode: 'mouse', musicEnabled: true, musicVolume: .35, rumble: true, showHints: true, logoStyle: 'en', battleLogs: true });
export function normalizeSettings(value) {
  const input = value && typeof value === 'object' ? value : {};
  return {
    controlMode: input.controlMode === 'gamepad' ? 'gamepad' : 'mouse',
    musicEnabled: typeof input.musicEnabled === 'boolean' ? input.musicEnabled : true,
    musicVolume: Number.isFinite(input.musicVolume) && input.musicVolume >= 0 && input.musicVolume <= 1 ? input.musicVolume : .35,
    rumble: typeof input.rumble === 'boolean' ? input.rumble : true,
    showHints: typeof input.showHints === 'boolean' ? input.showHints : true,
    logoStyle: input.logoStyle === 'jp' ? 'jp' : 'en',
    battleLogs: typeof input.battleLogs === 'boolean' ? input.battleLogs : true
  };
}
export function readSettings(storage) {
  try { return normalizeSettings(JSON.parse((storage ?? globalThis.localStorage).getItem(SETTINGS_KEY) ?? '{}')); }
  catch { return { ...DEFAULT_SETTINGS }; }
}
