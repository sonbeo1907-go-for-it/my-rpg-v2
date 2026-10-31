import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../scripts/load-content.mjs';
import { createGameSave, encodeGameSave, decodeGameSave } from '../src/core/game-save.js';
import { resolveCharacter, completeStoryEvent } from '../src/core/progression.js';
import { createBattle, executeAction, executeEnemyTurn, getActor, abilityAvailability } from '../src/core/battle.js';
import { claimBattleReward } from '../src/core/economy.js';
import { gearSlotCapacity } from '../src/core/gear-slots.js';
import { questCatalog, isQuestUnlocked, encounterReturnPath } from '../src/core/quest-catalog.js';
import { dungeonQuestPool } from '../src/core/dungeon.js';
import { travelerChapters, travelerStoryPage } from '../src/core/traveler-stories.js';
import { battleStat } from '../src/core/stat-values.js';
import { validateContent } from '../src/core/content.js';
const content=await loadContent();
function save(){const c=createGameSave(content);c.unlockedCharacterIds=Object.keys(content.characters);return c;}
function upgraded(party=['iris','arthur','freya','takeshi'],source=content,random=()=>.99){const c=save();c.party=party;for(const id of ['iris.field_conclusions','fiona.complete_refraction','fiona.prisma_convergence','takeshi.swordsman_eye'])completeStoryEvent(c,source,source.upgrades[id].requires.storyFlag);const b=createBattle(source,c,'forest_patrol',random);for(const e of b.actors.filter(a=>a.team==='enemy')){e.hp=e.stats.maxHp=10000;e.shield=0;e.weaknesses=[];e.stats.resistance=0;}return b;}
function use(b,id,skill,target=id){b.queue=[id,...b.actors.filter(a=>a.id!==id&&a.hp>0).map(a=>a.id)];b.cursor=0;executeAction(b,{actorId:id,abilityId:skill,targetId:target});}
const buff=(b,id,status='empowered',source='iris')=>getActor(b,id).statuses.push({id:status,remaining:3,stacks:1,sourceId:source});
function win(c,id){const b=createBattle(content,c,id);b.outcome='victory';return claimBattleReward(c,b,content);}

test('story shelves paginate; unopened books contain no playable chapters or free upgrades',()=>{
 const c=save();assert.equal(travelerStoryPage(content).stories.length,3);assert.equal(travelerStoryPage(content,2,1).stories[0].id,'takeshi');assert.equal(travelerStoryPage(content,-5,1).page,1);assert.equal(travelerStoryPage(content,999,1).page,4);
 assert.equal(travelerChapters(content,c,'takeshi').length,3);assert.equal(resolveCharacter(content,c,'takeshi').passive.counterAbility,undefined);assert.equal(resolveCharacter(content,c,'fiona').abilities.includes('fiona.convergence'),false);
});
test('story chapters cannot leak into Quest or either random dungeon pool',()=>{
 const c=save();c.claimedFirstClearRewards=['iris_story_growth','iris_story_pride'];
 for(const pool of [questCatalog(content,c),...['gold_mine','dangerous'].map(id=>dungeonQuestPool(content,id).map(key=>content.encounters[key]))])assert.ok(pool.every(e=>!e.travelerStory));
 assert.equal(encounterReturnPath(content,'iris_story_revenge'),'/stories/iris?selected=iris_story_revenge');
});
test('Iris chapters unlock in order, persist rewards once, and cap gear slots without awarding duplicate shards',()=>{
 let c=save();assert.throws(()=>createBattle(content,c,'iris_story_pride'),/chương trước/);
 const b=createBattle(content,c,'iris_story_growth');b.outcome='victory';assert.equal(b.actors.filter(a=>a.team==='enemy').length,3);
 assert.throws(()=>claimBattleReward(c,b,content,()=>{throw Error('disk');}),/disk/);assert.equal(gearSlotCapacity(c,content,'iris'),3);assert.equal(b.rewardClaimed,undefined);
 c=claimBattleReward(c,b,content);assert.equal(gearSlotCapacity(c,content,'iris'),4);assert.equal(c.recruitmentShards,0);assert.equal(claimBattleReward(c,b,content),c);
 c=win(c,'iris_story_growth');assert.equal(gearSlotCapacity(c,content,'iris'),4);
 assert.equal(isQuestUnlocked(content.encounters.iris_story_pride,c),true);c=win(c,'iris_story_pride');assert.equal(gearSlotCapacity(c,content,'iris'),5);
 c=win(c,'iris_story_revenge');assert.equal(resolveCharacter(content,c,'iris').passive.type,'buffed_ally_mp');assert.equal(resolveCharacter(content,decodeGameSave(encodeGameSave(c,content),content),'iris').passive.name,'Đúc kết thực địa');
 c=save();c.extraGearSlots.iris=3;c=win(c,'iris_story_growth');assert.equal(gearSlotCapacity(c,content,'iris'),6);
});
test('Iris must participate in the final battle, including reward claims after party edits',()=>{
 const c=save();c.claimedFirstClearRewards=['iris_story_growth','iris_story_pride'];c.party=['arthur'];assert.throws(()=>createBattle(content,c,'iris_story_revenge'),/Iris/);
 c.party=['iris','arthur'];const b=createBattle(content,c,'iris_story_revenge');assert.deepEqual(b.actors.filter(a=>a.team==='enemy').map(a=>a.name),['Keith','Mac','Sunny','Amy']);b.outcome='victory';c.party=['arthur'];assert.ok(claimBattleReward(c,b,content).characters.iris.upgradeIds.includes('iris.field_conclusions'));
 b.rewardClaimed=false;b.actors=b.actors.filter(a=>a.id!=='iris');assert.throws(()=>claimBattleReward(c,b,content),/bắt buộc/);
});
test('Fiona conditional marks use pre-cast state independently per target and obey cap',()=>{
 const b=upgraded(['fiona']);for(const[index,e]of b.actors.filter(a=>a.team==='enemy').entries())if(index)e.statuses.push({id:'prisma',stacks:index,remaining:4,sourceId:'fiona'});
 use(b,'fiona','fiona.refraction_complete','enemy_0');assert.deepEqual(b.actors.filter(a=>a.team==='enemy').map(a=>a.statuses.find(s=>s.id==='prisma').stacks),[1,3,3]);
 const c=save();assert.equal(resolveCharacter(content,c,'fiona').abilities.includes('fiona.refraction'),true);completeStoryEvent(c,content,'fiona.refraction_story_cleared');assert.equal(resolveCharacter(content,c,'fiona').abilities.includes('fiona.refraction'),false);
});
test('Fiona convergence forbids zero marks without spending MP, consumes 1-3 marks, and preserves cooldown semantics',()=>{
 const empty=upgraded(['fiona']),f=getActor(empty,'fiona');assert.equal(abilityAvailability(empty,f,content.abilities['fiona.convergence']).ok,false);assert.throws(()=>use(empty,'fiona','fiona.convergence','enemy_0'));assert.equal(f.mp,100);
 for(let stacks=1;stacks<=3;stacks++){const b=upgraded(['fiona']);getActor(b,'enemy_0').statuses=[{id:'prisma',stacks,remaining:4,sourceId:'fiona'}];use(b,'fiona','fiona.convergence','enemy_0');assert.equal(b.events.find(e=>e.type==='damage').amount,Math.floor(38*(.5+stacks)));assert.equal(getActor(b,'enemy_0').statuses.length,0);assert.equal(getActor(b,'fiona').cooldowns['fiona.convergence'],2);}
});
test('Iris requires her own buff on another ally; a kill and shield-only damage qualify',()=>{
 for(const shield of [false,true]){const b=upgraded();const iris=getActor(b,'iris');iris.mp=20;buff(b,'arthur');const e=getActor(b,'enemy_0');e.weaknesses=['light'];if(shield)e.shield=10000;else e.hp=1;use(b,'arthur','$attack','enemy_0');assert.equal(iris.mp,25);}
 for(const[source,attacker]of [['arthur','arthur'],['iris','iris']]){const b=upgraded();getActor(b,'iris').mp=20;buff(b,attacker,'calibrated',source);use(b,attacker,'$attack','enemy_0');assert.equal(getActor(b,'iris').mp,20);}
});
test('Iris aggregates weakness across AoE and limits the recovery to once across Main/Extra',()=>{
 const b=upgraded();const iris=getActor(b,'iris');iris.mp=20;buff(b,'freya','calibrated');getActor(b,'enemy_1').weaknesses=['fire'];const aoe=content.characters.freya.abilities.find(id=>content.abilities[id].target==='all_enemies');const cost=content.abilities[aoe].cost.resource;getActor(b,'freya').resourceValues[cost.id]=3;use(b,'freya',aoe,'enemy_0');assert.equal(iris.mp,25);
 b.phase='extra';use(b,'freya','$attack','enemy_1');assert.equal(iris.mp,25);b.round++;b.phase='main';use(b,'freya','$attack','enemy_0');assert.equal(iris.mp,28);assert.equal(iris.resourceValues.data,0);
});
test('Iris reserves quota before nested Aurora follow-up, and normal nonweak attacks restore only 3 MP',()=>{
 const b=upgraded(['iris','freya','aurora']);const iris=getActor(b,'iris');iris.mp=20;buff(b,'freya');buff(b,'aurora');use(b,'freya','freya.fireball','enemy_0');assert.equal(iris.mp,23);assert.equal(b.events.filter(e=>e.type==='mp_restore'&&e.targetId==='iris').length,1);assert.ok(b.events.some(e=>e.type==='reaction'&&e.kind==='follow_up'));
});
test('Iris does not restore MP for an evaded attack',()=>{
 const b=upgraded(undefined,content,()=>0);getActor(b,'iris').mp=20;buff(b,'arthur');buff(b,'enemy_0','evasive','enemy_0');use(b,'arthur','$attack','enemy_0');assert.equal(getActor(b,'iris').mp,20);
});
test('Takeshi awakened counter stacks with Percival, survives Extra, expires after next Main action, and retains one counter per round',()=>{
 const b=upgraded(['takeshi'],content,()=>0);const t=getActor(b,'takeshi');buff(b,'takeshi','evasive','takeshi');use(b,'enemy_0','$attack','takeshi');const e=getActor(b,'enemy_0');assert.equal(t.resourceValues.opening,1);assert.equal(e.statuses.find(s=>s.id==='sword_eye_slow').remaining,1);
 e.statuses.push({id:'sea_slow',remaining:3,sourceId:'takeshi'});assert.ok(Math.abs(battleStat(content,e,'speed')-e.stats.speed*.6)<1e-8);
 use(b,'enemy_1','$attack','takeshi');assert.equal(getActor(b,'enemy_1').statuses.some(s=>s.id==='sword_eye_slow'),false);assert.equal(t.resourceValues.opening,1);
 b.phase='extra';use(b,'enemy_0','$defend');assert.ok(e.statuses.some(s=>s.id==='sword_eye_slow'));b.phase='main';b.round++;use(b,'enemy_0','$defend');assert.equal(e.statuses.some(s=>s.id==='sword_eye_slow'),false);
});
test('PvP support AI heals its own wounded team and Mac taunts, buffs DEF, then shields allies',()=>{
 const c=save();c.claimedFirstClearRewards=['iris_story_growth','iris_story_pride'];const b=createBattle(content,c,'iris_story_revenge');
 function enemyTurn(id){b.queue=[id,...b.actors.filter(a=>a.id!==id).map(a=>a.id)];b.cursor=0;executeEnemyTurn(b);}
 enemyTurn('enemy_1');assert.ok(getActor(b,'enemy_1').statuses.some(s=>s.id==='taunt'));enemyTurn('enemy_1');assert.ok(b.actors.filter(a=>a.team==='enemy').every(a=>a.statuses.some(s=>s.id==='traveler_mac_defense')));enemyTurn('enemy_1');enemyTurn('enemy_1');assert.ok(b.actors.filter(a=>a.team==='enemy').every(a=>a.shield>0));
 getActor(b,'enemy_0').hp=100;enemyTurn('enemy_3');assert.ok(getActor(b,'enemy_0').hp>100);assert.ok(b.events.filter(e=>e.type==='heal').every(e=>getActor(b,e.targetId).team==='enemy'));
});
test('Takeshi failed evasion and magical attacks never grant opening or apply the slow',()=>{
 for(const magical of [false,true]){const b=upgraded(['takeshi'],content,()=>.99);buff(b,'takeshi','evasive','takeshi');if(magical)getActor(b,'enemy_0').abilities.push('traveler.sunny');use(b,'enemy_0',magical?'traveler.sunny':'$attack','takeshi');assert.equal(getActor(b,'takeshi').resourceValues.opening,0);assert.equal(getActor(b,'enemy_0').statuses.some(s=>s.id==='sword_eye_slow'),false);}
});
test('content validators reject invalid story chains, passive upgrades, counter hooks and AI rules',()=>{
 for(const change of [c=>c.travelerStories.iris.chapters.reverse(),c=>c.upgrades['iris.field_conclusions'].changes[0].passive.amount=-1,c=>c.upgrades['takeshi.swordsman_eye'].changes[0].passive.counterAbility='missing',c=>c.encounters.iris_story_revenge.requiredPartyIds=['missing'],c=>c.enemies.traveler_amy.ai.priorities[0].ratio=2]){const c=structuredClone(content);change(c);assert.ok(validateContent(c).length);}
});
