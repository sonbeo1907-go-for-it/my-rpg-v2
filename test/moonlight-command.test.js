import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';import {pullGacha} from '../src/core/economy.js';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,activeActor,getActor,executeAction,abilityAvailability,forecastBattleAction} from '../src/core/battle.js';
import {createArenaBattle} from '../src/core/arena.js';import {validateContent} from '../src/core/content.js';
import {commandMoonlight,canCommandMoonlight} from '../src/core/moonlight-blessings.js';
const c=await loadContent(),command='test.command_storm';
function content(){const cc=structuredClone(c);cc.abilities[command]={id:command,name:'Hiệu Lệnh Thử Nghiệm',target:'self',cost:{mp:2},cooldown:0,effects:[{type:'command_moonlight',blessingId:'thunder_wrath'}],description:'Ra lệnh Chúc Phúc Liên kích.',growthProfile:'fixed',skillLineId:command,rankable:false,fixedReason:'Chỉ dùng trong fixture kiểm thử.'};cc.characters.iris.abilities.push(command);return cc;}
function save(cc){const s=createGameSave(cc);s.unlockedCharacterIds.push('noelle');s.party=['noelle','elaine','iris',null];s.partyPresets[0].slots=[...s.party];return s;}
function setup(){const cc=content(),s=save(cc),b=createBattle(cc,s,'forest_patrol',()=>.99);for(const a of b.actors.filter(a=>a.team==='enemy')){a.hp=a.stats.maxHp=100000;a.stats.defense=0;a.weaknesses=[];}return b;}
function cast(b,id,ability,target){b.queue=[id,...b.actors.filter(a=>a.id!==id&&a.hp>0).map(a=>a.id)];b.cursor=0;executeAction(b,{actorId:id,abilityId:ability,targetId:target??(ability===command?id:'enemy_0')});}
function activate(b){cast(b,'noelle','noelle.thunder');cast(b,'elaine','$attack');}
function nextRound(b){const r=b.round;for(let i=0;i<50&&b.round===r&&!b.outcome;i++){const a=activeActor(b);executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});}assert.equal(b.round,r+1);}
const reactions=(b,id)=>b.events.filter(e=>e.type==='reaction'&&e.sourceId===id);
test('official Noelle remains owned through ordinary gacha rules, without any developer or data-only gate',()=>{
 const n=c.characters.noelle;assert.ok(!n.developerOnly&&!n.recruitmentOnly);assert.ok(!n.tags?.includes('data_only'));assert.ok(c.banners.standard.characterPool.includes(n.id));assert.equal(n.passive.perRound,3);
 assert.deepEqual(validateContent(content()),[]);
});
test('commanded blessing FuA triggers Noelle, uses dynamic ATK and preserves natural pulse slots and expiry',()=>{
 const b=setup();activate(b);nextRound(b);const state=b.moonlight.party,old=structuredClone(state.active),mp=getActor(b,'noelle').mp;
 getActor(b,'noelle').stats.attack=80;getActor(b,'elaine').stats.attack=120;cast(b,'iris',command);
 assert.equal(reactions(b,'moonlight_party').length,1);assert.equal(reactions(b,'noelle').length,1);assert.ok(b.events.some(e=>e.type==='damage'&&e.sourceId==='moonlight_party'&&e.elements.includes('moon')));
 assert.equal(getActor(b,'moonlight_party').stats.attack,100);assert.equal(getActor(b,'noelle').mp,mp);assert.equal(state.active.followUps.noelle.count,2);
 assert.deepEqual(state.active.pulses,old.pulses);assert.equal(state.active.startedRound,old.startedRound);assert.equal(state.active.expiresAfterRound,old.expiresAfterRound);assert.equal(state.lastActivatedRound,old.startedRound);assert.deepEqual(state.slots,[]);assert.equal(state.attackInProgress,undefined);
});
test('three Noelle responses per round are shared by natural and commanded attacks; fourth command still attacks',()=>{
 const b=setup();activate(b);nextRound(b);const s=b.moonlight.party;assert.equal(s.active.followUps.noelle.count,1);
 cast(b,'iris',command);assert.equal(s.active.followUps.noelle.count,2);cast(b,'iris',command);assert.equal(s.active.followUps.noelle.count,3);
 cast(b,'iris',command);assert.equal(reactions(b,'moonlight_party').length,1);assert.equal(reactions(b,'noelle').length,0);assert.equal(s.active.followUps.noelle.count,3);
 nextRound(b);assert.equal(b.events.filter(e=>e.type==='ability_cast'&&e.sourceId==='moonlight_party').length,2);assert.equal(reactions(b,'noelle').length,1);assert.equal(s.active.followUps.noelle.round,3);assert.equal(s.active.followUps.noelle.count,1);
});
test('one command between two natural pulses makes Noelle respond a third time in that round',()=>{
 const b=setup();activate(b);nextRound(b);cast(b,'iris',command);assert.equal(b.moonlight.party.active.followUps.noelle.count,2);nextRound(b);
 // End of R2 gives the third response, then start of R3 has its own first response.
 assert.equal(reactions(b,'noelle').length,2);assert.equal(b.moonlight.party.active.followUps.noelle.count,1);
});
test('absent, wrong or expired blessing rejects a command before paying MP',()=>{
 const b=setup(),a=getActor(b,'iris'),mp=a.mp;assert.equal(abilityAvailability(b,a,b.content.abilities[command]).ok,false);assert.throws(()=>cast(b,'iris',command));assert.equal(a.mp,mp);
 activate(b);b.moonlight.party.active.expiresAfterRound=b.round-1;assert.throws(()=>cast(b,'iris',command));assert.equal(a.mp,mp);
 const bad=content();bad.abilities[command].effects[0].blessingId='unknown';assert.ok(validateContent(bad).some(e=>e.includes('moonlight command')));
});
test('commands after Noelle falls still attack, and cannot recurse into themselves',()=>{
 const b=setup();activate(b);getActor(b,'noelle').hp=0;cast(b,'iris',command);assert.equal(reactions(b,'moonlight_party').length,1);assert.equal(reactions(b,'noelle').length,0);
 let calls=0;const io={stat:()=>10,outcome:()=>false,followUp(){},pulse(){calls++;assert.equal(commandMoonlight(b,getActor(b,'iris'),'thunder_wrath',io),false);}};
 assert.equal(commandMoonlight(b,getActor(b,'iris'),'thunder_wrath',io),true);assert.equal(calls,1);assert.equal(b.moonlight.party.attackInProgress,undefined);
});
test('forecast of commanded attacks neither consumes live MP nor advances live guardian quota',()=>{
 const b=setup();activate(b);b.queue=['iris','noelle','elaine','enemy_0'];b.cursor=0;const before=structuredClone(b.moonlight),mp=getActor(b,'iris').mp;
 const trial=forecastBattleAction(b,{actorId:'iris',abilityId:command,targetId:'iris'});assert.equal(trial.moonlight.party.active.followUps.noelle.count,1);assert.deepEqual(b.moonlight,before);assert.equal(getActor(b,'iris').mp,mp);
});
test('enemy can command its own blessing and guardian, without spending the player quota',()=>{
 const cc=content(),b=createArenaBattle(cc,save(cc),'mirror',15);for(const a of b.actors)a.hp=a.stats.maxHp=100000;
 const id=(team,name)=>b.actors.find(a=>a.team===team&&a.definitionId===name).id,target=id('party','noelle');
 cast(b,id('enemy','noelle'),'noelle.thunder',target);cast(b,id('enemy','elaine'),'$attack',target);cast(b,id('enemy','iris'),command,id('enemy','iris'));
 assert.equal(reactions(b,'moonlight_enemy').length,1);assert.equal(reactions(b,id('enemy','noelle')).length,1);assert.equal(b.moonlight.enemy.active.followUps[id('enemy','noelle')].count,1);assert.equal(b.moonlight.party.active,null);
});

test('official recruitment can obtain Noelle and save her without developer flags or extra grants',()=>{
 const s=createGameSave(c);s.prisma=1;let rolls=0;const result=pullGacha(s,c,'standard',1,()=>rolls++===0?.999999:(c.banners.standard.characterPool.indexOf('noelle')+.5)/c.banners.standard.characterPool.length,new Date('2026-11-20T05:00:00Z')).campaign;assert.ok(result.unlockedCharacterIds.includes('noelle'));assert.equal(result.prisma,0);assert.deepEqual(decodeGameSave(encodeGameSave(result,c),c),result);
});
test('missing or mismatched command ID is safely rejected',()=>{
 const b=setup();activate(b);assert.equal(canCommandMoonlight(b,getActor(b,'iris')),false);assert.equal(canCommandMoonlight(b,getActor(b,'iris'),'bountiful_seed'),false);
});
