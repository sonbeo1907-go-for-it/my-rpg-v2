import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {resolveCharacter} from '../src/core/progression.js';
import {skillUpgradeQuote,upgradeSkill} from '../src/core/skill-progression.js';
import {skillLineId} from '../src/core/skill-rules.js';
import {resolveRankedAbility} from '../src/core/skill-resolver.js';
import {createArenaBattle} from '../src/core/arena.js';
const c=await loadContent();
const added=['lionel','charlemagnes','kreider','roland','victorina','sieg','minerva','auguste','amelia','chloe','drake','yufina','karin','yumia','chelsea','astraea','artesia'];
function fresh(){
 const s=createGameSave(c);s.originalPrisma=10000;s.coins=100000;
 s.unlockedCharacterIds=[...new Set([...s.unlockedCharacterIds,...added])];
 for(const id of added)Object.assign(s.characters[id],{level:50,xp:0,limitBreakRank:3});
 return s;
}
test('new mastery roster upgrades every eligible skill sequentially, previews and round-trips without changing fixed utility',()=>{
 let s=fresh();
 for(const id of added){
  const actor=resolveCharacter(c,s,id);
  const skills=actor.abilities.map(key=>c.abilities[key]);
  const lines=new Set(['basic',...skills.filter(a=>a.rankable!==false&&a.growthProfile!=='fixed'&&a.activation!=='passive'&&a.masteryEligible!==false).map(skillLineId)]);
  for(const line of lines){
   s.characters[id].skillRanks={...s.characters[id].skillRanks,[line]:5};
   const coins=s.coins,original=s.originalPrisma;
   for(let tier=1;tier<=3;tier++){
    const q=skillUpgradeQuote(s,c,id,line);assert.ok(q.ok,`${id}/${line}: ${q.reason}`);
    assert.equal(q.next.skillRank,5+tier);assert.equal(q.originalCost,tier);
    s=upgradeSkill(s,c,id,line);
   }
   assert.equal(s.originalPrisma,original-6);assert.equal(s.coins,coins);
   assert.equal(skillUpgradeQuote(s,c,id,line).next,null);
  }
  for(const skill of skills.filter(a=>a.growthProfile==='fixed'||a.rankable===false||a.activation==='passive')){
   assert.equal(skillUpgradeQuote(s,c,id,skillLineId(skill)).ok,false);
  }
 }
 assert.deepEqual(decodeGameSave(encodeGameSave(s,c),c),s);
});
test('new mastery ranks apply in PvE and remain capped at Rank5 on both mirror PvP teams',()=>{
 const s=fresh();for(const id of added)s.characters[id].skillRanks={basic:8};
 for(let offset=0;offset<added.length;offset+=4){
  s.party=[...added.slice(offset,offset+4)];while(s.party.length<4)s.party.push(null);
  s.partyPresets[0].slots=[...s.party];
  const before=structuredClone(s),b=createArenaBattle(c,s,'mirror',42);
  for(const id of s.party.filter(Boolean)){
   const basic={id:'$attack',growthProfile:'basic',effects:[{type:'damage',multiplier:1}]};
   assert.equal(resolveRankedAbility(c,resolveCharacter(c,s,id),basic).skillRank,8);
   const mirrors=b.actors.filter(a=>a.definitionId===id);assert.equal(mirrors.length,2);
   for(const actor of mirrors){
    assert.equal(resolveRankedAbility(c,actor,basic).skillRank,5);
    assert.equal(resolveRankedAbility(c,actor,basic,8).skillRank,5);
   }
  }
  assert.deepEqual(s,before);
 }
});
