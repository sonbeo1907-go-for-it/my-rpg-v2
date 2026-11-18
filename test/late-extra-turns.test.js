import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';import {createGameSave} from '../src/core/game-save.js';
import {createBattle,activeActor,executeAction} from '../src/core/battle.js';import {seededRandom} from '../src/core/random.js';
import {snapshotChronicleBattle,restoreChronicleBattle} from '../src/core/chronicle-combat.js';
const c=await loadContent();
const cases=[['belochkin','belochkin.command','elaine',true],['melpiphia','melpiphia.bless','elaine',false],['melpiphia','melpiphia.undertow',null,true],['kanade','kanade.bloom','kanade',true],['charlotte','charlotte.spotlight','elaine',true]];
for(const[id,skill,target,self]of cases)for(const team of ['party','enemy'])test(`${id} ${skill}: real main-to-extra transition, ${team} side, restore, no repeated extra phase`,()=>{
 const s=createGameSave(c);s.unlockedCharacterIds=Object.keys(c.characters);s.party=[id,'elaine','luka','garrek'];s.partyPresets[0].slots=[...s.party];
 let b=createBattle(c,s,'forest_patrol',seededRandom(70),{opponentCampaign:structuredClone(s),tournament:{runId:'test',matchId:'test',maxMainRounds:40,directHpDamage:{party:0,enemy:0}}});
 for(const a of b.actors){a.hp=a.stats.maxHp=100000;a.mp=a.stats.maxMp=1000;a.passive=null;a.passives=[];}
 const source=b.actors.find(a=>a.team===team&&a.definitionId===id),ally=target?b.actors.find(a=>a.team===team&&a.definitionId===target):b.actors.find(a=>a.team!==team),expected=new Set([...(self?[source.id]:[]),...(target&&target!==id?[ally.id]:[])]);
 function defend(){const a=activeActor(b);executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});}
 for(let i=0;i<20&&activeActor(b).id!==source.id;i++)defend();assert.equal(activeActor(b).id,source.id);
 executeAction(b,{actorId:source.id,abilityId:skill,targetId:ally.id});assert.deepEqual(b.extraTurnGrants,expected);
 b=restoreChronicleBattle(c,snapshotChronicleBattle(b));for(let i=0;i<20&&b.phase==='main';i++)defend();assert.equal(b.phase,'extra');assert.deepEqual(new Set(b.queue),expected);
 const round=b.round,visited=[];while(b.round===round){const a=activeActor(b);visited.push(a.id);if(a.id===source.id){a.cooldowns={};executeAction(b,{actorId:a.id,abilityId:skill,targetId:ally.id});}else defend();assert.ok(visited.length<5);}
 assert.deepEqual(new Set(visited),expected);assert.equal(b.phase,'main');assert.equal(b.round,round+1);
});

test('extra-turn UI accepts arrays and native sets, and late skill text never leaks modifier keys',async()=>{const {hasExtraTurnGrant,compactSkillScaling}=await import('../src/ui/combat-presentation.js');assert.equal(hasExtraTurnGrant(new Set(['a']),'a'),true);assert.equal(hasExtraTurnGrant(['a'],'a'),true);assert.equal(hasExtraTurnGrant(undefined,'a'),false);const a=c.characters.charlotte;const text=compactSkillScaling(c.abilities['charlotte.spotlight'],a,a,c);assert.ok(!text.includes('damageBonusMagical'));assert.match(text,/Bản thân: \+1 Lượt Thêm/);assert.match(text,/Người được chọn: \+1 Lượt Thêm/);});
