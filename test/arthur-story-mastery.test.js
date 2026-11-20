import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {resolveCharacter} from '../src/core/progression.js';
import {createBattle,executeAction,getActor} from '../src/core/battle.js';
import {createStoryRun,advanceStoryWave,isFinalStoryWave} from '../src/core/story-waves.js';
import {claimBattleReward} from '../src/core/economy.js';
import {skillUpgradeQuote,upgradeSkill} from '../src/core/skill-progression.js';
import {resolveRankedAbility} from '../src/core/skill-resolver.js';
import {createArenaBattle} from '../src/core/arena.js';
import {validateContent} from '../src/core/content.js';
import {travelerChapters} from '../src/core/traveler-stories.js';
const c=await loadContent(),lines=['arthur.ogres_bane','arthur.ogres_bane_flash'],skills=['arthur.ogres_bane_mastered','arthur.ogres_bane_flash'];
function win(s,id,persist=()=>{}){let b;if(c.encounters[id].waves){const r=createStoryRun(c,s,id,()=>.99);while(!isFinalStoryWave(r)){r.battle.outcome='victory';advanceStoryWave(c,r);}b=r.battle;}else b=createBattle(c,s,id,()=>.99);b.outcome='victory';return claimBattleReward(s,b,c,persist);}
function ready(){let s=createGameSave(c);s.party=['arthur','iris','fiona','takeshi'];s.partyPresets[0].slots=[...s.party];for(const story of ['iris','fiona','takeshi'])for(const id of c.travelerStories[story].chapters)s=win(s,id);for(const id of ['epilogue_shadow_easy','epilogue_unfinished','epilogue_shadow_hard'])s=win(s,id);s.coins=0;s.originalPrisma=0;return s;}
test('new chapters are sequential fixed Lv70/80/90 superbosses with original three phases and music',()=>{
 let s=ready(),hp=[];
 for(const level of [70,80,90]){const id='epilogue_shadow_'+level,e=c.encounters[id];assert.equal(e.enemyLevel,level);assert.equal(e.fixedEnemyLevel,level);assert.equal(e.rewardTier,'super');assert.equal(e.bgm,'ogrebane');assert.deepEqual(e.requiredPartyIds,['arthur']);const b=createBattle(c,s,id),boss=getActor(b,'enemy_0');assert.equal(boss.level,level);assert.equal(boss.boss.phases.length,3);hp.push(boss.stats.maxHp);s=win(s,id);}
 assert.ok(hp[0]<hp[1]&&hp[1]<hp[2]);assert.deepEqual(validateContent(c),[]);
});
test('each victory grants the two Ogre lines immediately, preserving level, allocations and normal skills',()=>{
 let s=ready();const before=structuredClone(s.characters.arthur);
 for(const[tier,level]of [[1,70],[2,80],[3,90]]){const coins=s.coins;s=win(s,'epilogue_shadow_'+level);const a=resolveCharacter(c,s,'arthur');assert.deepEqual(s.characters.arthur.skillRanks,before.skillRanks);assert.equal(s.characters.arthur.level,before.level);assert.deepEqual(s.characters.arthur.allocations,before.allocations);assert.equal(s.originalPrisma,0);assert.ok(s.coins>=coins);
  for(let i=0;i<2;i++){assert.equal(a.skillRanks[lines[i]],5+tier);const q=skillUpgradeQuote(s,c,'arthur',lines[i]);assert.equal(q.rank,5+tier);assert.equal(q.current.skillRank,5+tier);assert.equal(q.maxRank,5+tier);assert.equal(q.originalCost,0);assert.equal(q.next,null);assert.throws(()=>upgradeSkill(s,c,'arthur',lines[i]));assert.equal(resolveRankedAbility(c,a,skills[i],8).skillRank,5+tier);}
  assert.equal(resolveRankedAbility(c,a,'arthur.light_slash').skillRank,1);assert.equal(resolveRankedAbility(c,a,{id:'$attack',effects:c.characters.arthur.basicAttack??[],growthProfile:'basic'}).skillRank,1);
  assert.deepEqual(decodeGameSave(encodeGameSave(s,c),c),s);
 }
});
test('no preview or currency can bypass later victories; roster and level restrictions hold',()=>{
 const s=ready();s.originalPrisma=10000;assert.throws(()=>createBattle(c,s,'epilogue_shadow_80'));assert.throws(()=>createBattle(c,s,'epilogue_shadow_90'));assert.throws(()=>createBattle(c,s,'epilogue_shadow_70',()=>.99,{enemyLevel:1}));
 const noArthur=structuredClone(s);noArthur.party=['iris','fiona','takeshi',null];assert.throws(()=>createBattle(c,noArthur,'epilogue_shadow_70'));
 for(const line of lines)assert.equal(skillUpgradeQuote(s,c,'arthur',line).maxRank,5);
 const listed=travelerChapters(c,s,'epilogue');assert.equal(listed.find(e=>e.enemyLevel===70).unlocked,true);assert.equal(listed.find(e=>e.enemyLevel===80).unlocked,false);
});
test('failed persistence and rematches do not duplicate mastery or charge Original Prisma',()=>{
 let s=ready(),before=structuredClone(s);assert.throws(()=>win(s,'epilogue_shadow_70',()=>{throw Error('disk');}));assert.deepEqual(s,before);s=win(s,'epilogue_shadow_70');const ids=[...s.characters.arthur.upgradeIds],ranks=resolveCharacter(c,s,'arthur').skillRanks;s=win(s,'epilogue_shadow_70');assert.deepEqual(s.characters.arthur.upgradeIds,ids);assert.deepEqual(resolveCharacter(c,s,'arthur').skillRanks,ranks);assert.equal(s.originalPrisma,0);
});
test('earned mastery increases actual PvE damage and remains capped at rank5 on both PvP sides',()=>{
 let s=ready(),damages=[];for(const level of [null,70,80,90]){if(level)s=win(s,'epilogue_shadow_'+level);else s.characters.arthur.skillRanks={'arthur.ogres_bane':5};const b=createBattle(c,s,'forest_patrol',()=>.99),a=getActor(b,'arthur');a.mp=100;a.resourceValues.resonance=3;for(const e of b.actors.filter(a=>a.team==='enemy')){e.hp=e.stats.maxHp=100000;e.stats.defense=0;e.weaknesses=[];}b.queue=['arthur',...b.actors.filter(a=>a.id!=='arthur').map(a=>a.id)];b.cursor=0;executeAction(b,{actorId:'arthur',abilityId:skills[0],targetId:'enemy_0'});damages.push(b.events.find(e=>e.type==='damage'&&e.sourceId==='arthur').amount);}
 assert.ok(damages.every((d,i)=>i===0||d>damages[i-1]));const copy=structuredClone(s),pvp=createArenaBattle(c,s,'mirror',32);for(const a of pvp.actors.filter(a=>a.definitionId==='arthur'))for(const id of skills)assert.equal(resolveRankedAbility(c,a,id,8).skillRank,5);assert.deepEqual(s,copy);
});

test('ordinary skill rank overrides still reject invalid ranks instead of silently clamping',()=>{const a=resolveCharacter(c,createGameSave(c),'arthur');assert.throws(()=>resolveRankedAbility(c,a,'arthur.light_slash',9));assert.throws(()=>resolveRankedAbility(c,a,'arthur.light_slash',0));assert.throws(()=>resolveRankedAbility(c,a,'arthur.light_slash',1.5));});
