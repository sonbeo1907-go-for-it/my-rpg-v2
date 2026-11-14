import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,activeActor,executeAction,executeEnemyTurn,targetsFor,abilityAvailability,forecastBattleAction,turnOrderEntries} from '../src/core/battle.js';
import {mpCost} from '../src/core/conditional-combat.js';
import {createArenaBattle} from '../src/core/arena.js';import {battleStat} from '../src/core/stat-values.js';import {boundAlly} from '../src/core/turn-delegation.js';
import {snapshotChronicleBattle,restoreChronicleBattle} from '../src/core/chronicle-combat.js';import {seededRandom} from '../src/core/random.js';import {resolveRankedAbility} from '../src/core/skill-resolver.js';import {validateContent} from '../src/core/content.js';import {skillPresentation,passivePresentation} from '../src/ui/skill-copy.js';
const c=await loadContent();
function save(){const s=createGameSave(c);s.party=['rotary','arthur','elaine','garrek'];s.partyPresets[0].slots=[...s.party];s.unlockedCharacterIds=[...new Set([...s.unlockedCharacterIds,...s.party])];return s;}
function setup(){const s=save(),b=createBattle(c,s,'forest_patrol',seededRandom(12));for(const a of b.actors){a.hp=a.stats.maxHp=100000;a.mp=a.stats.maxMp=10000;if(a.team==='enemy'){a.stats.attack=a.stats.magic=0;a.statuses=[];a.weaknesses=[];}}return {s,b,r:b.actors.find(a=>a.id==='rotary'),t:b.actors.find(a=>a.id==='arthur'),e:b.actors.find(a=>a.team==='enemy')};}
function step(b){const a=activeActor(b);assert.ok(a,'live actor');if(a.team==='enemy')executeEnemyTurn(b);else executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});}
function seek(b,p){let n=0;while(!p()&&n++<300)step(b);assert.ok(n<300,'progress reached expected turn');}
function bind(f,target=f.t.id){seek(f.b,()=>activeActor(f.b)?.id===f.r.id);executeAction(f.b,{actorId:f.r.id,abilityId:'rotary.voodoo',targetId:target});}
const status=f=>f.t.statuses.find(s=>s.id==='rotary_voodoo');
test('Rotary roster, save defaults, rank and copy validate without unlocking her for free',()=>{
 assert.deepEqual(validateContent(c),[]);assert.equal(c.characters.rotary.releaseId,110);assert.ok(c.banners.standard.characterPool.includes('rotary'));const s=createGameSave(c);delete s.characters.rotary;const round=decodeGameSave(encodeGameSave(s,c),c);assert.ok(round.characters.rotary);assert.ok(!round.unlockedCharacterIds.includes('rotary'));
 assert.ok(!targetsFor(setup().b,c.characters.rotary,c.abilities['rotary.voodoo']).some(t=>t.id==='rotary'));const a=c.characters.rotary;assert.equal(resolveRankedAbility(c,a,'rotary.shelter',5).effects[0].multiplier,1.8*1.1**4);assert.ok(mpCost(resolveRankedAbility(c,a,'rotary.voodoo',5),a)<18);assert.equal(c.statuses.rotary_voodoo.modifiers.magic,.25);assert.ok(passivePresentation(a,c).facts.length);assert.ok(skillPresentation(c.abilities['rotary.voodoo'],a,c).facts.some(s=>s.includes('5 lượt chính')));
});
test('actual progression transfers only Rotary main slot, preserves natural turn and grants Rotary one Extra next round',()=>{
 const f=setup(),{b,r,t}=f;bind(f);assert.equal(status(f).remaining,5);assert.equal(b.extraTurnGrants.has(r.id),false);assert.equal(battleStat(c,t,'attack'),t.stats.attack*1.25);
 seek(b,()=>b.round===2&&b.phase==='main'&&b.queue[b.cursor]===r.id);assert.equal(activeActor(b).id,t.id);assert.equal(b.extraTurnGrants.has(r.id),true);const entries=turnOrderEntries(b);assert.equal(entries[0].ownerId,r.id);assert.equal(entries[0].actorId,t.id);assert.ok(entries.some(e=>e.ownerId===t.id&&e.actorId===t.id));assert.equal(new Set(entries.map(e=>e.key)).size,entries.length);
 const current=structuredClone(b.delegatedTurn);step(b);assert.equal(status(f).remaining,3);assert.notDeepEqual(b.delegatedTurn,current);assert.equal(activeActor(b).id,t.id);assert.equal(b.queue[b.cursor],t.id);step(b);assert.equal(status(f).remaining,2);
 seek(b,()=>b.round===2&&b.phase==='extra'&&activeActor(b)?.id===r.id);step(b);assert.equal(status(f).remaining,2);assert.ok(b.log.some(s=>s.includes('Arthur nhận lượt chính từ Rotary')));
});
test('fifth received main turn expires link; already granted Extra remains and next round is not granted again',()=>{
 const f=setup();bind(f);seek(f.b,()=>f.b.round===3&&f.b.phase==='main'&&f.b.queue[f.b.cursor]===f.t.id);assert.equal(status(f).remaining,1);step(f.b);assert.equal(status(f),undefined);assert.equal(battleStat(c,f.t,'attack'),f.t.stats.attack);
 seek(f.b,()=>f.b.round===3&&f.b.phase==='extra'&&activeActor(f.b)?.id===f.r.id);step(f.b);seek(f.b,()=>f.b.round===4);assert.ok(!f.b.extraTurnGrants.has(f.r.id));
});
test('Rotary stun and poison keep ticking in original slot without blocking transfer; recipient stun loses transferred turn',()=>{
 const f=setup();bind(f);seek(f.b,()=>f.b.round===2&&activeActor(f.b)?.id==='elaine');const dot=Object.values(c.statuses).find(s=>s.damageOverTime);f.r.hp=1000;f.r.statuses.push({id:dot.id,remaining:3,stacks:1,potency:10,sourceId:f.e.id},{id:'stunned',remaining:1,stacks:1,sourceId:f.e.id});f.t.statuses.push({id:'stunned',remaining:1,stacks:1,sourceId:f.e.id});
 step(f.b);assert.equal(f.r.hp,990);assert.equal(f.r.statuses.find(s=>s.id===dot.id).remaining,2);assert.ok(!f.r.statuses.some(s=>s.id==='stunned'));assert.ok(!f.t.statuses.some(s=>s.id==='stunned'));assert.equal(f.b.queue[f.b.cursor],f.t.id);assert.equal(activeActor(f.b).id,f.t.id);assert.equal(status(f).remaining,3);assert.ok(f.b.log.some(s=>s.includes('Arthur bị choáng')));
});
test('Rotary dying from turn-start poison ends Voodoo and never hands over a dead source slot',()=>{
 const f=setup();bind(f);seek(f.b,()=>f.b.round===2&&activeActor(f.b)?.id==='elaine');const dot=Object.values(c.statuses).find(s=>s.damageOverTime);f.r.hp=1;f.r.statuses.push({id:dot.id,remaining:2,stacks:1,potency:10,sourceId:f.e.id});step(f.b);assert.equal(f.r.hp,0);assert.equal(status(f),undefined);assert.equal(f.b.delegatedTurn,undefined);assert.equal(f.b.queue[f.b.cursor],f.t.id);
});
test('dead recipient returns original slot to Rotary, links can be changed and blocked changes preserve old ally',()=>{
 const f=setup();bind(f);seek(f.b,()=>f.b.round===2&&activeActor(f.b)?.id==='elaine');f.t.hp=0;step(f.b);assert.equal(activeActor(f.b).id,f.r.id);assert.equal(status(f),undefined);executeAction(f.b,{actorId:f.r.id,abilityId:'rotary.voodoo',targetId:'garrek'});assert.equal(boundAlly(f.b,f.r).id,'garrek');
 seek(f.b,()=>f.b.phase==='extra'&&activeActor(f.b)?.id===f.r.id);const ward=f.b.actors.find(a=>a.id==='elaine');ward.statuses.push({id:'buff_seal',charges:1,remaining:null,stacks:1,sourceId:f.e.id});
 const seal=Object.values(c.statuses).find(s=>s.buffRejection);ward.statuses[ward.statuses.length-1].id=seal.id;executeAction(f.b,{actorId:f.r.id,abilityId:'rotary.voodoo',targetId:ward.id});assert.equal(boundAlly(f.b,f.r).id,'garrek');
});
test('Voodoo shield target gate, Ward, elemental exposure, rejected commands and forecast are source-relative',()=>{
 const f=setup(),{b,r,t}=f;assert.equal(abilityAvailability(b,r,c.abilities['rotary.shelter']).ok,false);bind(f);seek(b,()=>b.phase==='extra'&&activeActor(b)?.id===r.id);assert.deepEqual(targetsFor(b,r,c.abilities['rotary.shelter']).map(a=>a.id),[t.id]);const mp=r.mp;
 assert.throws(()=>executeAction(b,{actorId:r.id,abilityId:'rotary.shelter',targetId:'garrek'}));assert.equal(r.mp,mp);const before=JSON.stringify(b);forecastBattleAction(b,{actorId:r.id,abilityId:'rotary.shelter',targetId:t.id});assert.equal(JSON.stringify(b),before);executeAction(b,{actorId:r.id,abilityId:'rotary.shelter',targetId:t.id});assert.equal(t.shield,Math.round(r.stats.magic*1.8));assert.equal(t.statuses.find(s=>s.id==='effect_ward').charges,1);
 const nf=setup();bind(nf);seek(nf.b,()=>nf.b.phase==='extra'&&activeActor(nf.b)?.id===nf.r.id);executeAction(nf.b,{actorId:nf.r.id,abilityId:'rotary.needle',targetId:nf.e.id});assert.equal(nf.e.statuses.find(s=>s.id==='exposure_light').stacks,1);
});
test('checkpoint restore freezes the current delegate without granting turns or running start hooks twice',()=>{
 const f=setup();bind(f);seek(f.b,()=>f.b.round===2&&f.b.queue[f.b.cursor]===f.r.id);const snapshot=snapshotChronicleBattle(f.b),restored=restoreChronicleBattle(c,snapshot);assert.equal(activeActor(restored).id,f.t.id);assert.deepEqual(restored.delegatedTurn,f.b.delegatedTurn);assert.equal(restored.log.length,f.b.log.length);assert.equal(restored.actors.find(a=>a.id===f.t.id).statuses.find(s=>s.id==='rotary_voodoo').remaining,status(f).remaining);
 step(restored);assert.equal(restored.actors.find(a=>a.id===f.t.id).statuses.find(s=>s.id==='rotary_voodoo').remaining,status(f).remaining-1);
});
test('two mirror teams bind and act independently with unique unit IDs',()=>{
 const b=createArenaBattle(c,save(),'mirror',18),left=b.actors.find(a=>a.team==='party'&&a.definitionId==='rotary'),right=b.actors.find(a=>a.team==='enemy'&&a.definitionId==='rotary'),lt=b.actors.find(a=>a.team==='party'&&a.definitionId==='arthur'),rt=b.actors.find(a=>a.team==='enemy'&&a.definitionId==='arthur');
 for(const a of b.actors){a.hp=a.stats.maxHp=100000;a.mp=a.stats.maxMp=10000;}
 for(const [a,t]of [[left,lt],[right,rt]]){b.queue=[a.id,t.id];b.cursor=0;b.phase='main';executeAction(b,{actorId:a.id,abilityId:'rotary.voodoo',targetId:t.id});}
 assert.equal(boundAlly(b,left).id,lt.id);assert.equal(boundAlly(b,right).id,rt.id);assert.notEqual(lt.id,rt.id);
});

test('Monica evaluates her actual delegated slot rather than her earlier natural slot',()=>{
 const s=save();s.party[1]='monica';s.partyPresets[0].slots=[...s.party];s.unlockedCharacterIds.push('monica');const b=createBattle(c,s,'forest_patrol',seededRandom(3)),r=b.actors.find(a=>a.id==='rotary'),m=b.actors.find(a=>a.id==='monica'),e=b.actors.find(a=>a.team==='enemy');
 for(const a of b.actors){a.hp=a.stats.maxHp=100000;a.mp=a.stats.maxMp=10000;if(a.team==='enemy'){a.stats.attack=a.stats.magic=0;a.stats.defense=a.stats.resistance=0;a.stats.speed=22;a.weaknesses=[];}}
 seek(b,()=>activeActor(b)?.id===r.id);executeAction(b,{actorId:r.id,abilityId:'rotary.voodoo',targetId:m.id});seek(b,()=>b.round===2&&b.phase==='main'&&b.queue[b.cursor]===r.id);assert.equal(activeActor(b).id,m.id);const mag=battleStat(c,m,'magic');executeAction(b,{actorId:m.id,abilityId:'monica.loophole',targetId:e.id});const hit=b.events.find(x=>x.type==='damage'&&x.sourceId===m.id&&x.targetId===e.id);assert.equal(hit.amount,Math.floor(mag*3.2));
});
test('direct enemy damage killing Rotary removes the recipient bonus immediately',()=>{
 const f=setup();bind(f);f.r.hp=1;f.e.stats.attack=100;f.b.queue=[f.e.id,'garrek'];f.b.cursor=0;executeAction(f.b,{actorId:f.e.id,abilityId:'$attack',targetId:f.r.id});assert.equal(f.r.hp,0);assert.equal(status(f),undefined);assert.equal(boundAlly(f.b,f.r),null);assert.equal(battleStat(c,f.t,'magic'),f.t.stats.magic);
});
test('binding validator rejects self links, invalid clock, duration and damage-free exposure',()=>{
 for(const change of [cc=>cc.abilities['rotary.voodoo'].excludeSelf=false,cc=>cc.abilities['rotary.voodoo'].effects[0].duration=0,cc=>cc.statuses.rotary_voodoo.durationClock='round',cc=>cc.characters.rotary.passive.statusId='stunned',cc=>cc.abilities['rotary.needle'].effects.shift()]){const cc=structuredClone(c);change(cc);assert.ok(validateContent(cc).length);}
});
