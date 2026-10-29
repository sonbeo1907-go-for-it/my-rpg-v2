import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../scripts/load-content.mjs';
import { validateContent } from '../src/core/content.js';
import { chooseBattleTrack, createBattleMusic } from '../src/ui/battle-music.js';

const content = await loadContent();
const flush = () => new Promise(resolve => setImmediate(resolve));
class AudioStub {
  constructor() { this.currentTime = 0; this.playCalls = 0; this.pauseCalls = 0; this.listeners = {}; }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  pause() { this.pauseCalls++; }
  play() { this.playCalls++; return this.failure ? Promise.reject(this.failure) : this.nextPromise ?? Promise.resolve(); }
}

test('encounter music groups map to existing files and normal selection splits at 50%', () => {
  for (const id of ['goblin_forest_ambush', 'forest_patrol', 'goblin_cave']) assert.equal(content.encounters[id].bgm, 'normal');
  for (const id of ['ogre_trial', 'wolf_pack', 'giant_pangolin_lair']) assert.equal(content.encounters[id].bgm, 'boss');
  for (let index = 1; index <= 10; index++) assert.equal(content.encounters[`wyvern_trial_${index}`].bgm, 'wyvern');
  assert.equal(chooseBattleTrack(content, 'normal', () => 0), '/bgm/bt1.mp3');
  assert.equal(chooseBattleTrack(content, 'normal', () => .49999), '/bgm/bt1.mp3');
  assert.equal(chooseBattleTrack(content, 'normal', () => .5), '/bgm/bt2.mp3');
  assert.equal(chooseBattleTrack(content, 'normal', () => .999), '/bgm/bt2.mp3');
  const noDraw = () => { throw new Error('single-track group must not draw RNG'); };
  assert.equal(chooseBattleTrack(content, 'boss', noDraw), '/bgm/boss_1.mp3');
  assert.equal(chooseBattleTrack(content, 'wyvern', noDraw), '/bgm/boss_wyvern.mp3');
  assert.equal(chooseBattleTrack(content, 'victory', noDraw), '/bgm/victory.mp3');
  assert.equal(content.encounters.alice_superboss.bgm, 'alice');
  assert.equal(chooseBattleTrack(content, 'alice', noDraw), '/bgm/spboss_alice.mp3');
  assert.equal(content.encounters.miraebolis_superboss.bgm, 'miraebolis');
  assert.equal(chooseBattleTrack(content, 'miraebolis', noDraw), '/bgm/spboss_miraebolis.mp3');
});

test('one song per battle loops, pauses without resetting on navigation and resumes without rerolling', async () => {
  const audio = new AudioStub(); let draws = 0;
  const music = createBattleMusic({ content, audio, random: () => { draws++; return .9; } });
  assert.equal(audio.playCalls, 0);
  assert.equal(audio.loop, true);
  assert.equal(audio.volume, .35);
  music.setVisible(true); music.start('normal'); await flush();
  assert.equal(audio.src, '/bgm/bt2.mp3'); assert.equal(audio.playCalls, 1);
  for (let i = 0; i < 10; i++) music.setVisible(true);
  assert.equal(audio.playCalls, 1); assert.equal(draws, 1);
  audio.currentTime = 42;
  music.setVisible(false); assert.equal(music.state().playing, false);
  music.setVisible(true); await flush();
  assert.equal(audio.playCalls, 2); assert.equal(audio.currentTime, 42); assert.equal(draws, 1);
  music.stop(); assert.equal(audio.currentTime, 0); assert.equal(music.state().active, false);
  music.setVisible(true); await flush(); assert.equal(audio.playCalls, 2);
  music.start('boss'); await flush(); assert.equal(audio.src, '/bgm/boss_1.mp3');
  assert.equal(draws, 1);
});

test('mute/volume controls preserve the track and hidden menus cannot start playback', async () => {
  const audio = new AudioStub(); const music = createBattleMusic({ content, audio });
  music.start('wyvern'); await flush(); assert.equal(audio.playCalls, 0);
  music.toggle(); music.setVisible(true); await flush(); assert.equal(audio.playCalls, 0);
  music.toggle(); await flush(); assert.equal(audio.playCalls, 1);
  assert.equal(audio.src, '/bgm/boss_wyvern.mp3');
  music.setVolume(.6); assert.equal(audio.volume, .6);
  for (const value of [-1, 2, NaN]) music.setVolume(value);
  assert.equal(audio.volume, .6);
  music.toggle(); assert.equal(music.state().enabled, false); assert.equal(music.state().playing, false);
});

test('autoplay rejection and missing media are contained and can be retried explicitly', async () => {
  const audio = new AudioStub(); const music = createBattleMusic({ content, audio });
  audio.failure = Object.assign(new Error('gesture needed'), { name: 'NotAllowedError' });
  music.setVisible(true); music.start('normal'); await flush();
  assert.equal(music.state().blocked, true); assert.equal(music.state().playing, false);
  music.setVisible(true); assert.equal(audio.playCalls, 1);
  audio.failure = null; music.toggle(); await flush();
  assert.equal(music.state().blocked, false); assert.equal(music.state().playing, true);
  audio.listeners.error(); assert.equal(music.state().error, true);
  music.stop(); assert.equal(music.state().error, false);
});

test('late play promises cannot revive stopped music or overwrite a newer battle state', async () => {
  let resolve;
  const audio = new AudioStub(); audio.nextPromise = new Promise(done => { resolve = done; });
  const music = createBattleMusic({ content, audio }); music.setVisible(true); music.start('boss');
  music.stop(); resolve(); await flush();
  assert.equal(music.state().playing, false); assert.equal(music.state().active, false);
  audio.nextPromise = null; music.start('wyvern'); await flush();
  assert.equal(music.state().track, '/bgm/boss_wyvern.mp3'); assert.equal(music.state().playing, true);
});

test('content rejects broken music groups and nonlocal or unsafe track URLs', () => {
  for (const mutate of [
    value => { value.encounters.ogre_trial.bgm = 'missing'; },
    value => { value.music.normal.tracks = []; },
    value => { value.music.normal.tracks = ['/bgm/../secret.mp3']; },
    value => { value.music.normal.tracks = ['https://example.com/track.mp3']; },
    value => { value.music.victory.loop = 'false'; }
  ]) { const invalid = structuredClone(content); mutate(invalid); assert.ok(validateContent(invalid).length); }
});

test('victory replaces battle music, plays once, pauses/resumes and restores looping for the next battle', async () => {
  const audio = new AudioStub(); const music = createBattleMusic({ content, audio });
  music.setVisible(true); music.start('boss'); await flush();
  audio.currentTime = 30;
  music.start('victory'); await flush();
  assert.equal(audio.src, '/bgm/victory.mp3');
  assert.equal(audio.loop, false); assert.equal(audio.currentTime, 0);
  assert.equal(music.state().group, 'victory'); assert.equal(music.state().playing, true);
  audio.currentTime = 3;
  music.setVisible(false); music.setVisible(true); await flush();
  assert.equal(audio.currentTime, 3);
  audio.listeners.ended();
  assert.equal(music.state().finished, true); assert.equal(music.state().active, false);
  const calls = audio.playCalls;
  music.setVisible(false); music.setVisible(true); music.toggle(); music.toggle(); await flush();
  assert.equal(audio.playCalls, calls); assert.equal(music.state().group, 'victory');
  music.start('normal'); await flush();
  assert.equal(audio.loop, true); assert.equal(music.state().finished, false);
});

test('muting a battle also mutes victory, and loading/resetting cannot resume its fanfare', async () => {
  const audio = new AudioStub(); const music = createBattleMusic({ content, audio, enabled: false });
  music.setVisible(true); music.start('victory'); await flush();
  assert.equal(audio.playCalls, 0); assert.equal(music.state().enabled, false);
  music.toggle(); await flush(); assert.equal(audio.playCalls, 1);
  music.stop(); music.setVisible(true); await flush();
  assert.equal(audio.playCalls, 1); assert.equal(music.state().group, null);
});
