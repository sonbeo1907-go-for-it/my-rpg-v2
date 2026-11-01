import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {completeStoryEvent,resolveCharacter} from '../src/core/progression.js';
import {createBattle,executeAction,executeEnemyTurn,getActor,abilityAvailability,targetsFor} from '../src/core/battle.js';
import {createStoryRun,advanceStoryWave,isFinalStoryWave} from '../src/core/story-waves.js';
import {claimBattleReward} from '../src/core/economy.js';
import {gearSlotCapacity} from '../src/core/gear-slots.js';
import {isQuestUnlocked,questCatalog} from '../src/core/quest-catalog.js';
import {dungeonQuestPool} from '../src/core/dungeon.js';
import {storyPrerequisites,travelerChapters,travelerStoryPage} from '../src/core/traveler-stories.js';
import {validateContent} from '../src/core/content.js';
const content=await loadContent(),epilogue='epilogue_unfinished',finals=content.encounters[epilogue].requires.firstClears;
function save(){const c=createGameSave(content);c.party=['arthur','iris','fiona','takeshi'];c.partyPresets[0].slots=[...c.party];return c;}
function win(c,id){let b;if(content.encounters[id].waves){const run=createStoryRun(content,c,id,()=>.99);while(!isFinalStoryWave(run)){run.battle.outcome='victory';advanceStoryWave(content,run);}b=run.battle;}else b=createBattle(content,c,id,()=>.99);b.outcome='victory';return claimBattleReward(c,b,content);}
function allStories(){let c=save();for(const story of ['iris','fiona','takeshi'])for(const id of content.travelerStories[story].chapters)c=win(c,id);return c;}
function use(b,id,skill,target='enemy_0'){b.queue=[id,...b.actors.filter(a=>a.id!==id&&a.hp>0).map(a=>a.id)];b.cursor=0;executeAction(b,{actorId:id,abilityId:skill,targetId:target});}
function bossTurn(b,round){b.queue=['enemy_0','arthur'];b.cursor=0;b.round=round;executeEnemyTurn(b);}

test('Takeshi must participate in all three chapters; the middle chapter contains all five bandit archetypes',()=>{
 const c=save(),ids=content.travelerStories.takeshi.chapters;assert.equal(ids.length,3);
 for(let i=0;i<ids.length;i++){c.claimedFirstClearRewards=ids.slice(0,i);c.party=['arthur','iris','elaine','garrek'];assert.throws(()=>createBattle(content,c,ids[i]),/Takeshi/);c.party=['arthur','iris','fiona','takeshi'];assert.ok(createBattle(content,c,ids[i]).actors.some(a=>a.id==='takeshi'));}
 assert.equal(content.encounters[ids[0]].enemies.length,4);const waves=content.encounters[ids[1]].waves;assert.equal(waves.length,3);assert.deepEqual([...new Set(waves.flat())].sort(),['bandit_archer','bandit_brute','bandit_chief','bandit_mage','bandit_vanguard']);
 const fresh=save();assert.equal(travelerChapters(content,fresh,'takeshi').filter(c=>c.unlocked).length,1);
});

test('Takeshi chapters grant three capped slots and the awakened counter exactly once; wave clears do not pay',()=>{
 let c=save();const ids=content.travelerStories.takeshi.chapters;
 c=win(c,ids[0]);assert.equal(gearSlotCapacity(c,content,'takeshi'),4);assert.equal(resolveCharacter(content,c,'takeshi').passive.counterAbility,undefined);
 const run=createStoryRun(content,c,ids[1],()=>.99);for(let i=0;i<2;i++){run.battle.outcome='victory';assert.equal(claimBattleReward(c,run.battle,content),c);advanceStoryWave(content,run);}run.battle.outcome='victory';c=claimBattleReward(c,run.battle,content);assert.equal(gearSlotCapacity(c,content,'takeshi'),5);
 c=win(c,ids[2]);assert.equal(gearSlotCapacity(c,content,'takeshi'),6);assert.equal(resolveCharacter(content,c,'takeshi').passive.counterAbility,'takeshi.counter_awakened');const before=c.recruitmentShards;c=win(c,ids[2]);assert.equal(gearSlotCapacity(c,content,'takeshi'),6);assert.equal(c.recruitmentShards,before);assert.equal(c.characters.takeshi.upgradeIds.filter(id=>id==='takeshi.swordsman_eye').length,1);assert.deepEqual(decodeGameSave(encodeGameSave(c,content),content),c);
});

test('Ryoga attacks instead of evading/countering, keeps Wind weakness and requires no stolen opening stacks',()=>{
 const r=content.enemies.ryoga;assert.deepEqual(r.weaknesses,['wind']);assert.equal(r.passive,undefined);assert.equal(r.resources,undefined);assert.equal(r.ai,undefined);
 assert.ok(r.abilities.every(id=>{const skill=content.abilities[id];return skill.effects.some(e=>e.type==='damage')&&skill.effects.filter(e=>e.type==='damage').every(e=>e.damageType==='physical'&&!e.unavoidable);}));
 assert.equal(content.abilities['ryoga.stance'],undefined);assert.equal(content.abilities['ryoga.counter'],undefined);assert.equal(content.statuses.ryoga_evasion,undefined);
 const c=save();c.claimedFirstClearRewards=content.travelerStories.takeshi.chapters.slice(0,2);const b=createBattle(content,c,'takeshi_story_horizon',()=>0),boss=getActor(b,'enemy_0');
 assert.equal(abilityAvailability(b,boss,content.abilities['ryoga.finish']).ok,true);b.queue=[boss.id,'arthur','takeshi','iris','fiona'];b.cursor=0;executeEnemyTurn(b);
 assert.ok(b.events.some(e=>e.type==='damage'&&e.sourceId===boss.id));assert.equal(b.events.some(e=>e.type==='reaction'&&e.sourceId===boss.id),false);
 const hp=boss.hp;use(b,'takeshi','takeshi.slash');assert.ok(boss.hp<hp);assert.equal(b.events.some(e=>e.type==='dodge'||e.type==='reaction'),false);
});

function ryogaFight(random=()=>0){const c=save();c.claimedFirstClearRewards=content.travelerStories.takeshi.chapters.slice(0,2);const b=createBattle(content,c,'takeshi_story_horizon',random);return {b,t:getActor(b,'takeshi'),boss:getActor(b,'enemy_0')};}

test('Takeshi can taunt Ryoga physical skills, dodge, counter and gain his own opening before awakening',()=>{
 for(const id of content.enemies.ryoga.abilities){
  const {b,t,boss}=ryogaFight();use(b,t.id,'takeshi.stance',t.id);assert.equal(t.passive.counterAbility,undefined);
  const skill=content.abilities[id];if(skill.target==='enemy')assert.deepEqual(targetsFor(b,boss,skill).map(a=>a.id),[t.id]);const before=t.hp,bossBefore=boss.hp;
  use(b,boss.id,id,t.id);assert.equal(t.hp,before);assert.equal(t.resourceValues.opening,1);assert.ok(boss.hp<bossBefore);
  assert.equal(b.events.filter(e=>e.type==='reaction'&&e.sourceId===t.id).length,1);assert.equal(b.events.some(e=>e.type==='reaction'&&e.sourceId===boss.id),false);
  assert.equal(t.statuses.some(s=>s.id==='ryoga_slow'),false);
 }
});

test('Ryoga heavy strike exposes him before the incoming dodge counter and still threatens players who fail to evade',()=>{
 const light=ryogaFight(),heavy=ryogaFight();for(const {b,t}of[light,heavy])use(b,t.id,'takeshi.stance',t.id);
 use(light.b,light.boss.id,'ryoga.cut',light.t.id);use(heavy.b,heavy.boss.id,'ryoga.finish',heavy.t.id);
 const hit=b=>b.events.find(e=>e.type==='damage'&&e.sourceId==='takeshi').amount;assert.ok(hit(heavy.b)>hit(light.b));
 const events=heavy.b.events;assert.ok(events.findIndex(e=>e.type==='status'&&e.statusId==='ryoga_overextended')<events.findIndex(e=>e.type==='reaction'&&e.sourceId==='takeshi'));
 assert.equal(heavy.boss.statuses.find(s=>s.id==='ryoga_overextended').remaining,1);
 const failed=ryogaFight(()=>.99);use(failed.b,failed.t.id,'takeshi.stance',failed.t.id);const hp=failed.t.hp;use(failed.b,failed.boss.id,'ryoga.finish',failed.t.id);assert.ok(failed.t.hp<=hp-70);assert.equal(failed.t.resourceValues.opening,0);assert.ok(failed.boss.cooldowns['ryoga.finish']>0);
});

test('Takeshi dodge counter stays limited to once per round; Ryoga opening window expires on his next main turn',()=>{
 const {b,t,boss}=ryogaFight();use(b,t.id,'takeshi.stance',t.id);use(b,boss.id,'ryoga.finish',t.id);assert.equal(t.resourceValues.opening,1);
 use(b,boss.id,'ryoga.cut',t.id);assert.equal(t.resourceValues.opening,1);assert.equal(b.events.some(e=>e.type==='reaction'),false);assert.equal(boss.statuses.some(s=>s.id==='ryoga_overextended'),false);
 b.round++;use(b,boss.id,'ryoga.cut',t.id);assert.equal(t.resourceValues.opening,2);
});


test('epilogue requires all three completed stories, cannot be opened by the old sinister flag, and requires Arthur',()=>{
 const c=save(),encounter=content.encounters[epilogue];c.storyFlags.push('illusion.sinister_unlocked');
 for(let i=0;i<3;i++){c.claimedFirstClearRewards=finals.slice(0,i);assert.equal(isQuestUnlocked(encounter,c),false);assert.throws(()=>createBattle(content,c,epilogue),/chương trước/);const b={encounterId:epilogue,outcome:'victory',actors:[{id:'arthur',team:'party'}]};assert.throws(()=>claimBattleReward(c,b,content),/câu chuyện/);assert.equal(b.rewardClaimed,undefined);}
 const earned=allStories();assert.equal(earned.storyFlags.includes('illusion.sinister_unlocked'),false);assert.equal(isQuestUnlocked(encounter,earned),true);assert.equal(storyPrerequisites(content,earned,'epilogue').filter(x=>x.completed).length,3);assert.ok(createBattle(content,earned,epilogue));
 earned.party=['iris','fiona','takeshi',null];assert.throws(()=>createBattle(content,earned,epilogue),/Arthur/);
 assert.equal(isQuestUnlocked(content.encounters.alice_superboss,earned),false);
});

test('epilogue reward persists both Arthur skills only after victory, retries disk failures, pays 1000 Coin and never duplicates',()=>{
 let c=allStories();assert.equal(c.characters.arthur.upgradeIds.includes('arthur.complete_control'),false);const b=createBattle(content,c,epilogue);for(const outcome of [null,'defeat','draw']){b.outcome=outcome;assert.equal(claimBattleReward(c,b,content),c);}b.outcome='victory';const before=structuredClone(c);assert.throws(()=>claimBattleReward(c,b,content,()=>{throw Error('disk');}),/disk/);assert.deepEqual(c,before);assert.equal(b.rewardClaimed,undefined);
 const next=claimBattleReward(c,b,content);assert.equal(next.coins,c.coins+1000);assert.equal(next.victories,c.victories+1);assert.equal(next.characters.arthur.upgradeIds.filter(id=>id==='arthur.complete_control').length,1);const arthur=resolveCharacter(content,next,'arthur');assert.ok(arthur.abilities.includes('arthur.ogres_bane_mastered'));assert.ok(arthur.abilities.includes('arthur.ogres_bane_flash'));assert.equal(getActor(b,'arthur').abilities.includes('arthur.ogres_bane_mastered'),false);
 const loaded=decodeGameSave(encodeGameSave(next,content),content);assert.deepEqual(loaded,next);assert.equal(claimBattleReward(next,b,content),next);const repeat=win(next,epilogue);assert.equal(repeat.coins,next.coins+1000);assert.equal(repeat.characters.arthur.upgradeIds.length,next.characters.arthur.upgradeIds.length);
});

test('shadow Arthur gains resonance on attacks, telegraphs a resource-ready burst, then pays 3 stacks exactly once',()=>{
 const b=createBattle(content,allStories(),epilogue,()=>.99),boss=getActor(b,'enemy_0');for(const ally of b.actors.filter(a=>a.team==='party'))ally.hp=ally.stats.maxHp=10000;
 for(let round=1;round<=3;round++){bossTurn(b,round);assert.equal(boss.resourceValues.resonance,round);assert.equal(boss.bossState.pendingMoves.length,0);}
 const mp=boss.mp;bossTurn(b,4);assert.equal(boss.resourceValues.resonance,3);assert.equal(boss.mp,mp);assert.equal(boss.bossState.pendingMoves.length,1);assert.equal(boss.bossState.pendingMoves[0].abilityId,'shadow_arthur.unbound');assert.ok(b.log.some(s=>s.includes('vận sức: Ogre’s Bane')));
 bossTurn(b,5);assert.equal(boss.resourceValues.resonance,0);assert.equal(boss.mp,mp-10);assert.equal(b.events.filter(e=>e.type==='damage'&&e.sourceId===boss.id).length,1);assert.equal(boss.bossState.pendingMoves.length,0);
});

test('shadow phase boundaries cannot be skipped and preserve MP/resonance; final burst is an AoE and can grant its ATK buff',()=>{
 const b=createBattle(content,allStories(),epilogue,()=>.99),boss=getActor(b,'enemy_0'),a=getActor(b,'arthur');a.stats.attack=100000;boss.resourceValues.resonance=2;boss.mp=123;
 use(b,'arthur','$attack');assert.equal(boss.hp,Math.ceil(boss.stats.maxHp*boss.boss.phases[1].atHpRatio));assert.equal(boss.bossState.phase,2);assert.equal(boss.resourceValues.resonance,2);assert.equal(boss.mp,123);assert.equal(b.events.some(e=>e.type==='mp_restore'),false);
 use(b,'arthur','$attack');assert.equal(boss.hp,Math.ceil(boss.stats.maxHp*boss.boss.phases[2].atHpRatio));assert.equal(boss.bossState.phase,3);assert.equal(boss.resourceValues.resonance,2);boss.resourceValues.resonance=3;
 for(const ally of b.actors.filter(a=>a.team==='party'))ally.hp=ally.stats.maxHp=10000;
 bossTurn(b,10);assert.equal(boss.bossState.pendingMoves[0].abilityId,'shadow_arthur.eclipse');bossTurn(b,11);assert.equal(b.events.filter(e=>e.type==='damage'&&e.sourceId===boss.id).length,4);assert.equal(boss.resourceValues.resonance,0);assert.equal(boss.statuses.find(s=>s.id==='arthur_complete_control').remaining,null);assert.equal(boss.boss.phases.every(p=>p.actionsPerTurn===1),true);
});

test('new stories paginate without entering Quest/dungeon pools; prerequisite and boss resource schemas reject invalid data',()=>{
 const c=save();assert.equal(travelerStoryPage(content,2).stories[0].id,'epilogue');assert.equal(travelerStoryPage(content,4,1).stories[0].id,'epilogue');
 for(const pool of [questCatalog(content,c),...['gold_mine','dangerous'].map(id=>dungeonQuestPool(content,id).map(key=>content.encounters[key]))])assert.ok(pool.every(e=>!e.travelerStory));
 for(const mutate of [c=>c.encounters.epilogue_unfinished.requires.firstClears=[],c=>c.encounters.epilogue_unfinished.requires.firstClears=['missing'],c=>c.encounters.epilogue_unfinished.requires.firstClears=['iris_story_revenge','iris_story_revenge'],c=>c.enemies.shadow_arthur.boss.phases[1].resourceBurst='bandit.advance']){const c=structuredClone(content);mutate(c);assert.ok(validateContent(c).length);}
});
