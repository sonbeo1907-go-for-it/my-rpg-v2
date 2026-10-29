import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../scripts/load-content.mjs';
import { createGameMusic } from '../src/ui/game-music.js';
const content = await loadContent();
const flush = () => new Promise(resolve => setImmediate(resolve));
function fixture() {
  const audios = [];
  const music = createGameMusic({ content, audioFactory: () => {
    const audio = { currentTime: 0, playing: false, playCalls: 0, addEventListener() {}, pause() { this.playing = false; }, play() { this.playing = true; this.playCalls++; return this.failure ? Promise.reject(this.failure) : Promise.resolve(); } };
    audios.push(audio); return audio;
  }});
  return { music, battle: audios[0], tavern: audios[1], shop: audios[2] };
}
test('tavern loops on home, pauses in menus/hidden tabs and resumes its position without restarting battle music', async () => {
  const { music, tavern, battle } = fixture();
  music.setRoute('/'); assert.equal(tavern.playCalls, 0);
  music.setRoute('/home'); await flush();
  assert.equal(tavern.src, '/bgm/tavern.mp3'); assert.equal(tavern.loop, true); assert.equal(tavern.playing, true);
  tavern.currentTime = 12; music.setRoute('/party'); assert.equal(tavern.playing, false);
  music.setRoute('/home'); await flush(); assert.equal(tavern.currentTime, 12);
  music.start('boss'); music.setRoute('/battle'); await flush();
  assert.equal(tavern.playing, false); assert.equal(battle.playing, true); battle.currentTime = 42;
  music.setRoute('/home'); await flush(); assert.equal(battle.playing, false); assert.equal(tavern.currentTime, 12);
  music.setRoute('/battle'); await flush(); assert.equal(battle.currentTime, 42);
  music.start('victory'); await flush(); assert.equal(battle.loop, false);
  music.setRoute('/home'); await flush(); assert.equal(tavern.loop, true); assert.equal(battle.playing, false);
  music.setVisible(false); assert.equal(tavern.playing, false);
  music.setVisible(true); await flush(); assert.equal(tavern.playing, true);
});
test('mute/volume apply across scenes and autoplay can be retried on home', async () => {
  const { music, tavern, battle } = fixture();
  tavern.failure = Object.assign(new Error('gesture'), { name: 'NotAllowedError' });
  music.setRoute('/home'); await flush(); assert.equal(music.state().blocked, true);
  tavern.failure = null; music.toggle(); await flush(); assert.equal(tavern.playing, true); assert.equal(music.state().enabled, true);
  music.setVolume(.6); assert.equal(tavern.volume, .6); assert.equal(battle.volume, .6);
  music.toggle(); music.start('normal'); music.setRoute('/battle'); await flush();
  assert.equal(music.state().enabled, false); assert.equal(battle.playing, false);
  music.toggle(); await flush(); assert.equal(battle.playing, true);
  music.setRoute('/home'); await flush(); assert.equal(tavern.playing, true); assert.equal(battle.playing, false);
  music.stop(); assert.equal(tavern.playing, false); assert.equal(battle.playing, false);
});

test('shop loops independently, resumes across tabs/visits and shares visibility and audio controls', async () => {
  const { music, shop, tavern, battle } = fixture();
  music.setRoute('/home'); await flush(); tavern.currentTime = 14;
  music.setRoute('/shop'); await flush();
  assert.equal(shop.src, '/bgm/shop.mp3'); assert.equal(shop.loop, true);
  assert.equal(shop.playing, true); assert.equal(tavern.playing, false); assert.equal(battle.playing, false);
  shop.currentTime = 23; const calls = shop.playCalls;
  music.setRoute('/shop'); await flush(); // Both Shop tabs share usePathname() === /shop.
  assert.equal(shop.currentTime, 23); assert.equal(shop.playCalls, calls);
  music.setVolume(.6); for (const audio of [shop, tavern, battle]) assert.equal(audio.volume, .6);
  music.toggle(); assert.equal(shop.playing, false);
  music.toggle(); await flush(); assert.equal(shop.playing, true);
  music.setVisible(false); assert.equal(shop.playing, false);
  music.setVisible(true); await flush(); assert.equal(shop.playing, true);
  music.setRoute('/home'); await flush(); assert.equal(shop.playing, false); assert.equal(tavern.currentTime, 14);
  music.start('boss'); music.setRoute('/battle'); await flush();
  assert.equal(shop.playing, false); assert.equal(tavern.playing, false); assert.equal(battle.playing, true);
  music.setRoute('/shop'); await flush(); assert.equal(shop.currentTime, 23); assert.equal(battle.playing, false);
  music.setRoute('/inventory'); assert.equal(shop.playing, false);
  music.setRoute('/shop'); await flush(); music.stop();
  for (const audio of [shop, tavern, battle]) { assert.equal(audio.playing, false); assert.equal(audio.currentTime, 0); }
});
