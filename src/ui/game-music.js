import { createBattleMusic } from './battle-music.js';

// Separate playback positions, shared controls. Only the current scene can play.
export function createGameMusic({ content, audioFactory = () => document.createElement('audio'), enabled = true, volume = .35, onChange = () => {}, random = Math.random }) {
  let scene = null, visible = true;
  let players;
  const state = () => scene ? players[scene].state() : { enabled, volume, track: null, group: null, finished: false, active: false, visible: false, playing: false, blocked: false, error: false };
  const report = () => onChange(state());
  const create = () => createBattleMusic({ content, audio: audioFactory(), enabled, volume, random, onChange: () => { if (players) report(); } });
  players = { battle: create(), tavern: create(), shop: create() };
  function sync() {
    // Pause the outgoing scene before allowing the incoming scene to play.
    for (const [id, player] of Object.entries(players)) if (id !== scene) player.setVisible(false);
    if (scene) players[scene].setVisible(visible);
    report();
  }
  return {
    start(group) { players.battle.start(group); },
    stop() { for (const player of Object.values(players)) player.stop(); },
    setRoute(path) {
      scene = path === '/home' ? 'tavern' : path === '/shop' ? 'shop' : path === '/battle' ? 'battle' : null;
      if ((scene === 'tavern' || scene === 'shop') && !players[scene].state().active) players[scene].start(scene);
      sync();
    },
    setVisible(value) { visible = Boolean(value); sync(); },
    setEnabled(value) {
      enabled = Boolean(value);
      const current = scene && players[scene];
      if (enabled && current && (current.state().blocked || current.state().error)) current.toggle();
      for (const player of Object.values(players)) player.setEnabled(enabled);
      report();
    },
    toggle() {
      const current = scene && players[scene];
      if (current && (current.state().blocked || current.state().error)) { current.toggle(); enabled = current.state().enabled; }
      else enabled = !enabled;
      for (const player of Object.values(players)) player.setEnabled(enabled);
      report();
    },
    setVolume(value) {
      if (!Number.isFinite(value) || value < 0 || value > 1) return;
      volume = value;
      for (const player of Object.values(players)) player.setVolume(value);
      report();
    },
    state
  };
}
