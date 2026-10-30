import { createBattleMusic } from './battle-music.js';

// Separate playback positions, shared controls. Only the current scene can play.
export function createGameMusic({ content, audioFactory = () => document.createElement('audio'), enabled = true, volume = .35, onChange = () => {}, random = Math.random }) {
  let scene = null, visible = true, override = null;
  const selected = () => scene === "battle" && override ? "override" : scene;
  let players;
  const state = () => selected() ? players[selected()].state() : { enabled, volume, track: null, group: null, finished: false, active: false, visible: false, playing: false, blocked: false, error: false };
  const report = () => onChange(state());
  const create = () => createBattleMusic({ content, audio: audioFactory(), enabled, volume, random, onChange: () => { if (players) report(); } });
  players = { battle: create(), tavern: create(), shop: create(), override: create() };
  function sync() {
    // Pause the outgoing scene before allowing the incoming scene to play.
    for (const [id, player] of Object.entries(players)) if (id !== selected()) player.setVisible(false);
    if (selected()) players[selected()].setVisible(visible);
    report();
  }
  return {
    start(group, { preserveOverride = false } = {}) {
      // A room change replaces the backing track while the summon keeps its position.
      if (!preserveOverride) { override = null; players.override.stop(); }
      players.battle.start(group);
      sync();
    },
    setBattleOverride(group) {
      const next = group && content.music[group] ? group : null;
      if (next === override) return;
      override = next;
      // Pause the base track before loading the overlay; keep its playback position.
      players.override.setVisible(false);
      players.battle.setVisible(false);
      if (next) players.override.start(next); else players.override.stop();
      sync();
    },
    stop() { override = null; for (const player of Object.values(players)) player.stop(); },
    setRoute(path) {
      scene = path === '/home' ? 'tavern' : path === '/shop' ? 'shop' : path === '/battle' ? 'battle' : null;
      if ((scene === 'tavern' || scene === 'shop') && !players[scene].state().active) players[scene].start(scene);
      sync();
    },
    setVisible(value) { visible = Boolean(value); sync(); },
    setEnabled(value) {
      enabled = Boolean(value);
      const current = selected() && players[selected()];
      if (enabled && current && (current.state().blocked || current.state().error)) current.toggle();
      for (const player of Object.values(players)) player.setEnabled(enabled);
      report();
    },
    toggle() {
      const current = selected() && players[selected()];
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
