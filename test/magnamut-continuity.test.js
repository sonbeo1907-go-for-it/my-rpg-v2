import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave} from '../src/core/game-save.js';
import {setAstoriaEnabled} from '../src/core/developer.js';
import {createBattle,activeActor,getActor,executeAction,abilityAvailability,DEFEND} from '../src/core/battle.js';
import {createDungeonRun,createDungeonPreview,advanceDungeonWave,isFinalDungeonWave} from '../src/core/dungeon.js';
import {effectiveStat} from '../src/core/combat-math.js';
import {battlePresentation,isContinuingVictory} from '../src/core/combat-modes.js';
import {createGameMusic} from '../src/ui/game-music.js';

const content=await loadContent(),now=new Date('2026-10-30T05:00:00Z');
function fixture(party=['astoria','elaine']) {
 const source=structuredClone(content);source.characters.astoria.stats.speed=100;
 const save=setAstoriaEnabled(createGameSave(source),true);save.party=party;save.storyFlags.push('illusion.sinister_unlocked');
 return {source,save};
}
function act(b,skill='$defend',target){const a=activeActor(b);executeAction(b,{actorId:a.id,abilityId:skill,targetId:target??(skill==='$defend'||skill==='astoria.summon'?a.id:b.actors.find(a=>a.team==='enemy'&&a.hp>0).id)});}
function ready(b){for(let i=0;i<80;i++){assert.equal(b.outcome,null);if(activeActor(b)?.id==='astoria')return;act(b);}throw Error('Astoria did not get a turn');}
function summon(b){ready(b);const a=getActor(b,'astoria');a.resourceValues.space_rift=5;a.mp=30;act(b,'astoria.summon');ready(b);return a;}
function finishRoom(b){ready(b);for(const enemy of b.actors.filter(a=>a.team==='enemy'))enemy.hp=1;act(b,'astoria.command');assert.equal(b.outcome,'victory');}

for(const [type,difficulty,initial] of [['gold_mine','easy',3],['gold_mine','medium',5],['gold_mine','hard',5],['dangerous','medium',3],['dangerous','hard',3],['dangerous','easy',3]]) {
 test(`${type}/${difficulty}: carry summon and remaining rifts, refund only on final room`,()=>{
  const {source,save}=fixture();const preview=createDungeonPreview(source,type,difficulty,{now,random:()=>0});
  const run=createDungeonRun(source,save,type,difficulty,{now,preview,random:()=>.99});
  let a=summon(run.battle);a.resourceValues.space_rift=initial;
  for(let index=0;index<run.waveIds.length;index++) {
   const b=run.battle,last=isFinalDungeonWave(run),before=getActor(b,'astoria').resourceValues.space_rift;
   finishRoom(b);a=getActor(b,'astoria');
   assert.equal(a.resourceValues.space_rift,before-1);
   assert.equal(isContinuingVictory(b),!last);
   if(last){assert.equal(a.activeMode,undefined);assert.equal(a.mp,72);assert.equal(effectiveStat(a,'magic'),36);assert.equal(battlePresentation(b.actors),null);}
   else{
    assert.equal(a.activeMode,'magnamut');assert.equal(a.mp,30);assert.equal(effectiveStat(a,'magic'),51);
    assert.equal(b.events.some(e=>e.type==='mode_exit'||e.type==='mp_restore'&&e.targetId==='astoria'),false);
    const previous=JSON.stringify(b.actors),remaining=a.resourceValues.space_rift;
    advanceDungeonWave(source,run);a=getActor(run.battle,'astoria');
    assert.equal(JSON.stringify(b.actors),previous);assert.equal(a.activeMode,'magnamut');assert.equal(a.resourceValues.space_rift,remaining);assert.equal(a.mp,30);
    assert.equal(battlePresentation(run.battle.actors).music,'astoria');assert.equal(abilityAvailability(run.battle,a,DEFEND).ok,false);
   }
  }
  assert.equal(run.battle.log.filter(line=>line==='Magnamut rời sân.').length,1);
 });
}

test('using the last rift to clear an intermediate room exits at the next owner turn without skipping it',()=>{
 const {source,save}=fixture(),run=createDungeonRun(source,save,'gold_mine','easy',{now,random:()=>.99});
 const a=summon(run.battle);a.resourceValues.space_rift=1;finishRoom(run.battle);
 assert.equal(a.resourceValues.space_rift,0);assert.equal(a.activeMode,'magnamut');assert.equal(a.mp,30);
 const next=advanceDungeonWave(source,run),carried=getActor(next,'astoria');
 assert.equal(activeActor(next).id,'astoria');assert.equal(carried.activeMode,undefined);assert.equal(carried.mp,72);assert.equal(abilityAvailability(next,carried,DEFEND).ok,true);
 act(next);assert.equal(carried.mp,78); // Only Defend adds 6; no second exit refund.
 assert.equal(next.log.filter(line=>line==='Magnamut rời sân.').length,1);
});

test('continuation never suppresses owner KO, defeat or draw cleanup',()=>{
 for(const outcome of ['defeat','draw']) {
  const {source,save}=fixture(['astoria']),b=createBattle(source,save,'forest_patrol',()=>.99,{continuesOnVictory:true}),a=getActor(b,'astoria');
  a.activeMode='magnamut';a.resourceValues.space_rift=5;a.mp=0;
  if(outcome==='draw') {b.round=60;b.queue=['astoria'];b.cursor=0;for(const enemy of b.actors.filter(x=>x.team==='enemy'))enemy.hp=enemy.stats.maxHp=100000;act(b,'astoria.command');}
  else {const enemy=b.actors.find(x=>x.team==='enemy');b.queue=[enemy.id,a.id];b.cursor=0;enemy.stats.attack=10000;a.hp=1;executeAction(b,{actorId:enemy.id,abilityId:'$attack',targetId:a.id});}
  assert.equal(b.outcome,outcome);assert.equal(a.activeMode,undefined);assert.equal(a.mp,42);assert.equal(b.log.filter(line=>line==='Magnamut rời sân.').length,1);
 }
});

test('Miraebolis 1→2→3 keeps Magnamut, consumes only real command costs and restores full MP without an exit refund',()=>{
 const {source,save}=fixture(),b=createBattle(source,save,'miraebolis_superboss',()=>.99),a=summon(b),boss=getActor(b,'enemy_0');
 const resources=[4,3];
 for(let i=0;i<2;i++) {
  ready(b);a.mp=0;boss.hp=Math.ceil(boss.stats.maxHp*boss.boss.phases[i+1].atHpRatio)+1;
  act(b,'astoria.command',boss.id);
  assert.equal(boss.bossState.phase,i+2);assert.equal(b.outcome,null);assert.equal(a.activeMode,'magnamut');assert.equal(a.resourceValues.space_rift,resources[i]);assert.equal(effectiveStat(a,'magic'),51);
  assert.equal(a.mp,120);assert.equal(b.events.some(e=>e.type==='mode_exit'),false);
  assert.deepEqual(b.events.filter(e=>e.type==='mp_restore'&&e.targetId===a.id).map(e=>e.amount),[120]);
  assert.equal(battlePresentation(b.actors).music,'astoria');assert.equal(abilityAvailability(b,a,DEFEND).ok,false);
 }
 assert.equal(b.log.filter(line=>line.includes('hồi đầy MP')).length,2);assert.equal(b.log.some(line=>line==='Magnamut rời sân.'),false);
 ready(b);a.mp=0;boss.hp=1;act(b,'astoria.command',boss.id);
 assert.equal(b.outcome,'victory');assert.equal(a.activeMode,undefined);assert.equal(a.resourceValues.space_rift,2);assert.equal(a.mp,42);assert.equal(b.log.filter(line=>line==='Magnamut rời sân.').length,1);
});

test('changing a room backing track retains overlay playback; final victory stops the overlay once',async()=>{
 const audios=[],music=createGameMusic({content,audioFactory:()=>{
  const a={currentTime:0,playing:false,loads:0,addEventListener(){},pause(){this.playing=false;},play(){this.playing=true;return Promise.resolve();},load(){this.loads++;}};audios.push(a);return a;
 }});
 music.start('boss');music.setRoute('/battle');music.setBattleOverride('astoria');audios[3].currentTime=17;
 const loads=audios[3].loads;music.start('wyvern',{preserveOverride:true});music.setBattleOverride('astoria');
 assert.equal(audios[3].currentTime,17);assert.equal(audios[3].loads,loads);assert.equal(audios[0].playing,false);assert.equal(audios[0].src,'/bgm/boss_wyvern.mp3');assert.equal(music.state().group,'astoria');
 music.setBattleOverride(null);assert.equal(music.state().group,'wyvern');assert.equal(audios[0].playing,true);
 music.setBattleOverride('astoria');music.start('victory');assert.equal(music.state().group,'victory');assert.equal(audios[3].playing,false);
 await new Promise(resolve=>setImmediate(resolve));assert.equal(music.state().group,'victory');
});
