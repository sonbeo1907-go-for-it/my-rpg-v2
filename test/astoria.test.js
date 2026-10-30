import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {setAstoriaEnabled} from '../src/core/developer.js';
import {createBattle,activeActor,getActor,executeAction,abilityAvailability,basicAbility,DEFEND} from '../src/core/battle.js';
import {effectiveStat} from '../src/core/combat-math.js';
import {leaveCombatMode,battlePresentation} from '../src/core/combat-modes.js';
import {characterCatalog} from '../src/core/catalog.js';
import {createGameMusic} from '../src/ui/game-music.js';
import {recruitCharacter} from '../src/core/economy.js';
const content=await loadContent();
function setup(party=['astoria']) {
 const c=structuredClone(content);c.characters.astoria.stats.speed=100;
 let save=setAstoriaEnabled(createGameSave(c),true);save.party=[...party];save.unlockedCharacterIds=[...new Set([...save.unlockedCharacterIds,...party])];
 const b=createBattle(c,save,'forest_patrol',()=>.99);
 for(const e of b.actors.filter(a=>a.team==='enemy')){e.hp=e.stats.maxHp=100000;e.stats.defense=e.stats.resistance=0;e.statuses=[];e.weaknesses=[];e.resistances={};delete e.passive;}
 return b;
}
function act(b,id='$defend',target){const a=activeActor(b),s=id==='$defend'?DEFEND:id==='$attack'?basicAbility(a):b.content.abilities[id];executeAction(b,{actorId:a.id,abilityId:id,targetId:target??(s.target==='self'?a.id:'enemy_0')});}
function until(b,predicate){for(let i=0;i<160;i++){if(predicate())return;assert.ok(!b.outcome);act(b);}throw Error('No turn');}
function astoriaTurn(b){until(b,()=>activeActor(b)?.id==='astoria');}
function summon(b){const a=getActor(b,'astoria');a.resourceValues.space_rift=5;act(b,'astoria.summon');return a;}
const hits=b=>b.events.filter(e=>e.type==='damage'&&e.sourceId==='astoria');

test('developer option is per save, defaults off, grants duplicate zero and never changes banners',()=>{
 const original=createGameSave(content),banner=structuredClone(content.banners);
 assert.equal(characterCatalog(content,original).some(a=>a.id==='astoria'),false);
 const enabled=setAstoriaEnabled(original,true);
 assert.equal(original.unlockedCharacterIds.includes('astoria'),false);
 assert.equal(enabled.unlockedCharacterIds.filter(id=>id==='astoria').length,1);
 assert.equal(enabled.extraGearSlots.astoria??0,0);
 assert.equal(characterCatalog(content,enabled,{},true).some(a=>a.id==='astoria'),true);
 assert.deepEqual(decodeGameSave(encodeGameSave(enabled,content),content),enabled);
 for(const b of Object.values(content.banners))assert.equal(b.characterPool.includes('astoria'),false);
 assert.throws(()=>recruitCharacter(original,content,'standard','astoria'));
 assert.deepEqual(content.banners,banner);
 assert.throws(()=>setAstoriaEnabled(enabled,false,{battleActive:true}),/Kết thúc/);
});
test('disabling returns gear without deleting it and cleans every preset including a solo Astoria party',()=>{
 let save=setAstoriaEnabled(createGameSave(content),true);
 save.gear=[{id:'gear_1',typeId:'t2',stats:{magic:3}}];save.gacha.totalPulls=1;
 save.equipment.astoria=['gear_1',null,null];save.party=['astoria',null,null,null];save.partyPresets[0].slots=[...save.party];save.partyPresets[1].slots=['iris','astoria',null,null];
 const off=setAstoriaEnabled(save,false);
 assert.deepEqual(off.gear,save.gear);assert.equal(off.equipment.astoria,undefined);
 assert.deepEqual(off.party,['arthur',null,null,null]);assert.deepEqual(off.partyPresets[1].slots,['iris',null,null,null]);
 assert.equal(off.storyFlags.includes('developer.astoria'),false);
 assert.equal(off.unlockedCharacterIds.includes('astoria'),false);
 assert.doesNotThrow(()=>encodeGameSave(off,content));
});
test('Astoria has the specified class and stats; basic attack is two separate 60% magical hits',()=>{
 assert.equal(content.characters.astoria.roleGroup,'sorcerer');assert.equal(content.characters.astoria.stats.speed,16);
 assert.deepEqual(content.characters.astoria.stats,{maxHp:175,maxMp:120,attack:12,magic:36,defense:18,resistance:22,speed:16});
 const b=setup();act(b,'$attack');assert.deepEqual(hits(b).map(e=>e.amount),[21,21]);assert.equal(getActor(b,'astoria').resourceValues.space_rift,0);
});
test('primary AoE uses one hit at 160%, other targets 80%, one resource per cast, and validates anchor atomically',()=>{
 const b=setup(),a=getActor(b,'astoria');
 assert.throws(()=>act(b,'astoria.slash','missing'),/chính/);assert.equal(a.mp,120);assert.equal(a.resourceValues.space_rift,0);
 act(b,'astoria.slash','enemy_1');assert.deepEqual(hits(b).map(e=>[e.targetId,e.amount]),[['enemy_0',28],['enemy_1',57],['enemy_2',28]]);
 assert.equal(a.mp,110);assert.equal(a.resourceValues.space_rift,1);
 assert.equal(b.events.filter(e=>e.type==='ability_cast').length,1);
});
test('rift has cooldown 3, one real hit, two stacks, and its debuff ignores extra actions',()=>{
 const b=setup(),a=getActor(b,'astoria'),enemy=getActor(b,'enemy_0');act(b,'astoria.rift');
 assert.equal(hits(b).length,1);assert.equal(hits(b)[0].amount,57);assert.equal(a.resourceValues.space_rift,2);assert.equal(a.mp,108);assert.equal(a.cooldowns['astoria.rift'],4);
 assert.equal(enemy.statuses.find(s=>s.id==='space_fracture').remaining,4);
 // Give the target an extra action after its main action this round.
 b.extraTurnGrants.add(enemy.id);b.extraPhaseRequired=true;
 until(b,()=>b.phase==='extra');assert.equal(enemy.statuses.find(s=>s.id==='space_fracture').remaining,3);
 act(b);assert.equal(enemy.statuses.find(s=>s.id==='space_fracture').remaining,3);
});
test('summon requires five without spending them, grants one extra right and locks all other commands in the engine',()=>{
 const b=setup(),a=getActor(b,'astoria');a.resourceValues.space_rift=4;
 assert.equal(abilityAvailability(b,a,content.abilities['astoria.summon']).ok,false);
 a.mp=0;const mp=a.mp;summon(b);assert.equal(a.resourceValues.space_rift,5);assert.equal(a.mp,mp);assert.equal(effectiveStat(a,'magic',.5),76.5);
 assert.equal(b.extraTurnGrants.has(a.id),true);assert.equal(b.phase,'main');assert.equal(battlePresentation(b.actors).music,'astoria');
 until(b,()=>b.phase==='extra');assert.equal(activeActor(b).id,'astoria');
 for(const skill of [basicAbility(a),DEFEND,...a.abilities.filter(id=>id!=='astoria.command').map(id=>content.abilities[id])]) {
   assert.equal(abilityAvailability(b,a,skill).ok,false);assert.throws(()=>act(b,skill.id),/Magnamut đang hiện diện/);
 }
 assert.equal(abilityAvailability(b,a,content.abilities['astoria.command']).ok,true);
});
test('last command still has +15 base MAG through all hits, spends after damage and leaves at round end once',()=>{
 const b=setup(),a=summon(b);until(b,()=>b.phase==='extra');a.resourceValues.space_rift=1;a.mp=0;
 for(const e of b.actors.filter(a=>a.team==='enemy'))e.statuses=[];
 act(b,'astoria.command','enemy_1');assert.deepEqual(hits(b).map(e=>e.amount),[102,183,102]);
 assert.equal(a.resourceValues.space_rift,0);assert.equal(a.activeMode,undefined);assert.equal(a.mp,42);assert.equal(effectiveStat(a,'magic'),36);
 assert.equal(b.events.filter(e=>e.type==='mode_exit').length,1);assert.equal(battlePresentation(b.actors),null);
 const count=b.log.filter(l=>l==='Magnamut rời sân.').length;astoriaTurn(b);act(b,'$defend');astoriaTurn(b);assert.equal(b.log.filter(l=>l==='Magnamut rời sân.').length,count);
});
test('zero stacks at start of an extra turn exits without skipping the turn; no second refund at round end',()=>{
 const b=setup(),a=getActor(b,'astoria');a.activeMode='magnamut';a.resourceValues.space_rift=1;a.mp=0;
 b.extraTurnGrants.add(a.id);b.extraPhaseRequired=true;act(b,'astoria.command');
 assert.equal(a.activeMode,'magnamut');assert.equal(a.resourceValues.space_rift,0);assert.equal(a.mp,0);
 until(b,()=>b.phase==='extra');assert.equal(activeActor(b).id,'astoria');assert.equal(a.activeMode,undefined);assert.equal(a.mp,42);
 assert.equal(abilityAvailability(b,a,basicAbility(a)).ok,true);act(b,'$attack');assert.equal(a.mp,42);assert.equal(b.round,2);
 assert.equal(b.log.filter(l=>l==='Magnamut rời sân.').length,1);
});
test('normal command is unavailable and resources cap at five',()=>{
 const b=setup(),a=getActor(b,'astoria');assert.equal(abilityAvailability(b,a,content.abilities['astoria.command']).ok,false);
 a.resourceValues.space_rift=4;act(b,'astoria.rift');assert.equal(a.resourceValues.space_rift,5);
 astoriaTurn(b);summon(b);until(b,()=>b.phase==='extra');a.resourceValues.space_rift=1;act(b,'astoria.command'); // Round end already exits.
 assert.equal(a.activeMode,undefined);
});
test('AoE never triggers Aurora; a two-hit basic triggers only once, never from Astoria herself',()=>{
 const b=setup(['astoria','aurora']);act(b,'astoria.slash');assert.equal(getActor(b,'aurora').resourceValues.thunder_seal??Object.values(getActor(b,'aurora').resourceValues)[0],0);
 astoriaTurn(b);act(b,'$attack');assert.equal(b.events.filter(e=>e.type==='reaction'&&e.sourceId==='aurora').length,1);
});
test('victory, draw and owner death all leave through one lifecycle event',()=>{
 for(const reason of ['victory','draw','death']) {
  const b=setup(reason==='death'?['astoria','elaine']:['astoria']),a=getActor(b,'astoria');a.activeMode='magnamut';a.resourceValues.space_rift=reason==='draw'?5:1;a.mp=0;
  if(reason==='victory'){for(const e of b.actors.filter(x=>x.team==='enemy'))e.hp=1;act(b,'astoria.command');assert.equal(b.outcome,'victory');}
  else if(reason==='draw'){b.round=60;act(b,'astoria.command');until(b,()=>Boolean(b.outcome));assert.equal(b.outcome,'draw');}
  else {const enemy=getActor(b,'enemy_0');b.queue=[enemy.id,a.id];b.cursor=0;enemy.stats.attack=10000;a.hp=1;act(b,'$attack',a.id);assert.equal(a.hp,0);assert.equal(b.outcome,null);}
  assert.equal(a.activeMode,undefined);assert.equal(b.log.filter(l=>l==='Magnamut rời sân.').length,1);
  assert.equal(a.mp,42);
 }
});
test('mode-exit refund belongs to exit, is capped by max MP and is idempotent independent of round end',()=>{
 const b=setup(),a=getActor(b,'astoria');a.activeMode='magnamut';a.mp=100;let calls=0;
 const io={write(){},emit(){},restore(b,target,id,value){calls++;target.mp=Math.min(target.stats.maxMp,target.mp+value);}};
 assert.equal(leaveCombatMode(b,a,'test',io),true);assert.equal(a.mp,120);assert.equal(leaveCombatMode(b,a,'round_end',io),false);assert.equal(calls,1);
});
test('music overlay pauses/resumes base position; repeated publish, route changes and victory do not replay the summon',async()=>{
 const audios=[];const music=createGameMusic({content,audioFactory:()=>{const audio={currentTime:0,playing:false,addEventListener(){},pause(){this.playing=false;},play(){this.playing=true;return Promise.resolve();}};audios.push(audio);return audio;}});
 music.start('wyvern');music.setRoute('/battle');audios[0].currentTime=25;music.setBattleOverride('astoria');assert.equal(audios[0].playing,false);assert.equal(audios[3].src,'/bgm/bgm_astoria.mp3');
 audios[3].currentTime=7;music.setBattleOverride('astoria');assert.equal(audios[3].currentTime,7);
 music.setRoute('/party');assert.equal(audios[3].playing,false);music.setRoute('/battle');assert.equal(audios[3].currentTime,7);
 music.setBattleOverride(null);assert.equal(audios[0].currentTime,25);assert.equal(music.state().group,'wyvern');
 music.setBattleOverride('astoria');music.start('victory');assert.equal(music.state().group,'victory');assert.equal(audios[3].playing,false);assert.equal(audios[0].loop,false);
 await new Promise(resolve=>setImmediate(resolve));assert.equal(music.state().group,'victory');
});

test('replenishing before the boundary keeps Magnamut present without a refund',()=>{
 const b=setup(),a=getActor(b,'astoria');a.activeMode='magnamut';a.resourceValues.space_rift=1;a.mp=0;act(b,'astoria.command');assert.equal(a.activeMode,'magnamut');a.resourceValues.space_rift=2;astoriaTurn(b);assert.equal(a.activeMode,'magnamut');assert.equal(a.mp,0);assert.equal(a.resourceValues.space_rift,2);
});
