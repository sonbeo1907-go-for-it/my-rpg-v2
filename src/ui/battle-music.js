// Audio is UI state. It never consumes battle RNG or enters campaign saves.
export function chooseBattleTrack(content, groupId, random = Math.random) {
  const group = content.music[groupId];
  if (!group?.tracks?.length) throw new Error('Không tìm thấy nhóm nhạc trận.');
  if (group.tracks.length === 1) return group.tracks[0];
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error('Nguồn chọn nhạc không hợp lệ.');
  return group.tracks[Math.floor(value * group.tracks.length)];
}

export function createBattleMusic({ content, audio = document.createElement('audio'), random = Math.random, enabled = true, volume = .35, onChange = () => {} }) {
  audio.loop = true;
  audio.preload = 'none';
  let active = false, visible = false, playing = false, pending = false, blocked = false, error = false;
  let track = null, group = null, finished = false, generation = 0;
  audio.volume = volume;
  const state = () => ({ enabled, volume: audio.volume, track, group, finished, active, visible, playing, blocked, error });
  const report = () => onChange(state());

  function pause() {
    generation++;
    audio.pause(); playing = false; pending = false;
  }
  function sync() {
    if (!active || !visible || !enabled || error) { pause(); report(); return; }
    if (blocked) { report(); return; }
    if (playing || pending) { report(); return; }
    const request = ++generation;
    pending = true;
    let promise;
    try { promise = audio.play(); }
    catch (failure) { promise = Promise.reject(failure); }
    Promise.resolve(promise).then(() => {
      if (request !== generation) return;
      pending = false; playing = true; blocked = false; error = false; report();
    }, failure => {
      if (request !== generation) return;
      pending = false; playing = false;
      if (failure?.name === 'AbortError') return;
      blocked = failure?.name === 'NotAllowedError';
      error = !blocked;
      report();
    });
    report();
  }
  audio.addEventListener('error', () => { if (!active) return; error = true; pause(); report(); });
  audio.addEventListener('ended', () => {
    if (!active || audio.loop) return;
    generation++; active = false; playing = false; pending = false; finished = true;
    report();
  });

  return {
    start(groupId) {
      const selected = chooseBattleTrack(content, groupId ?? 'normal', random);
      pause(); track = selected; active = true; blocked = false; error = false;
      group = groupId ?? 'normal'; finished = false;
      audio.loop = content.music[group].loop ?? true;
      audio.src = selected; audio.currentTime = 0;
      sync();
    },
    stop() { active = false; pause(); audio.currentTime = 0; track = null; group = null; finished = false; blocked = false; error = false; report(); },
    setVisible(value) { visible = Boolean(value); sync(); },
    setEnabled(value) { enabled = Boolean(value); sync(); },
    toggle() {
      if (blocked || error) {
        const reload = error;
        enabled = true; blocked = false; error = false;
        if (reload && typeof audio.load === 'function') audio.load();
      } else enabled = !enabled;
      sync();
    },
    setVolume(value) {
      if (!Number.isFinite(value) || value < 0 || value > 1) return;
      audio.volume = value; report();
    },
    state
  };
}
