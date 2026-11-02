import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {loadContent} from '../scripts/load-content.mjs';
import {arenaMusicVariants,createArenaScore,advanceArenaScore,arenaMusicGroup} from '../src/ui/arena-music.js';
import {createGameMusic} from '../src/ui/game-music.js';
const content=await loadContent();
const actors=()=>Array.from({length:8},(_,i)=>({id:'unit'+i,team:i<4?'party':'enemy',hp:100,stats:{maxHp:100}}));
function fixture(random=()=>0){const audios=[];let rolls=0;const music=createGameMusic({content,random:()=>{rolls++;return random();},audioFactory:()=>{const a={currentTime:0,playing:false,playCalls:0,addEventListener(){},pause(){this.playing=false;},play(){this.playCalls++;this.playing=true;return Promise.resolve();}};audios.push(a);return a;}});return {music,audios,rolls:()=>rolls};}
const flush=()=>new Promise(r=>setImmediate(r));
test('Arena registers two complete same-code suites and every file exists',()=>{
 assert.deepEqual(arenaMusicVariants(content),['1','2']);
 for(const code of ['1','2'])for(const stage of ['start','climax','finale']){const g=content.music[`arena_${stage}_${code}`];assert.deepEqual(g.tracks,[`/bgm/arena_${stage}_${code}.mp3`]);assert.equal(g.loop,true);assert.ok(existsSync(new URL('../public'+g.tracks[0],import.meta.url)));}
 const incomplete=structuredClone(content);incomplete.music.arena_start_3={tracks:['/bgm/arena_start_3.mp3']};assert.deepEqual(arenaMusicVariants(incomplete),['1','2']);
});
test('HP threshold uses both teams, is inclusive at 60%, and never regresses after healing',()=>{
 const a=actors(),start=createArenaScore(content,a,()=>0);assert.equal(start.initialTotalHp,800);assert.equal(arenaMusicGroup(start),'arena_start_1');
 a.forEach(x=>x.hp=61);assert.equal(advanceArenaScore(start,a),start);
 a.forEach(x=>x.hp=60);const climax=advanceArenaScore(start,a);assert.equal(arenaMusicGroup(climax),'arena_climax_1');
 a.forEach(x=>{x.hp=100;x.stats.maxHp=200;});assert.equal(advanceArenaScore(climax,a),climax);assert.equal(climax.initialTotalHp,800);
 const uneven=actors();uneven.slice(0,4).forEach(x=>x.hp=20);assert.equal(advanceArenaScore(start,uneven).stage,1);
});
test('four or fewer survivors selects finale first, including a direct jump and later revives',()=>{
 const a=actors(),start=createArenaScore(content,a,()=>.99);assert.equal(start.variant,'2');
 a.slice(0,3).forEach(x=>x.hp=0);assert.equal(advanceArenaScore(start,a).stage,0);
 a[3].hp=0;const finale=advanceArenaScore(start,a);assert.equal(arenaMusicGroup(finale),'arena_finale_2');
 a[4].hp=0;assert.equal(advanceArenaScore(finale,a),finale);a.forEach(x=>x.hp=100);assert.equal(advanceArenaScore(finale,a),finale);
});
test('playback keeps one suite, does not restart on publish, respects mute/visibility and resets on a new match',async()=>{
 const {music,audios,rolls}=fixture(()=>.99),b={arena:{},actors:actors()};
 music.setRoute('/arena');await flush();assert.equal(music.state().group,'arena_menu');assert.equal(audios[4].src,'/bgm/arena_menu.mp3');audios[4].currentTime=15;
 music.setRoute('/arena/match');assert.equal(audios[4].currentTime,15);
 music.updateArena(b,1);music.setRoute('/battle');await flush();assert.equal(music.state().group,'arena_start_2');assert.equal(audios[4].playing,false);audios[0].currentTime=22;const initialRolls=rolls();
 music.updateArena(b,1);assert.equal(audios[0].currentTime,22);assert.equal(rolls(),initialRolls);
 b.actors.forEach(x=>x.hp=60);music.updateArena(b,1);assert.equal(music.state().group,'arena_climax_2');assert.equal(audios[0].currentTime,0);assert.equal(rolls(),initialRolls);
 music.setEnabled(false);b.actors.slice(0,4).forEach(x=>x.hp=0);music.updateArena(b,1);assert.equal(music.state().group,'arena_finale_2');assert.equal(audios[0].playing,false);
 music.setEnabled(true);await flush();assert.equal(audios[0].playing,true);audios[0].currentTime=9;
 music.setVisible(false);assert.equal(audios[0].playing,false);music.setVisible(true);await flush();assert.equal(audios[0].currentTime,9);
 music.setVolume(.6);for(const a of audios)assert.equal(a.volume,.6);
 b.outcome='victory';music.start('victory');music.updateArena(b,1);assert.equal(music.state().group,'victory');assert.equal(audios[0].loop,false);
 const next={arena:{},actors:actors()};music.updateArena(next,2);assert.equal(music.state().group,'arena_start_2');assert.equal(rolls(),initialRolls+1);assert.equal(audios[0].loop,true);
 music.stop();for(const a of audios)assert.equal(a.playing,false);
});
