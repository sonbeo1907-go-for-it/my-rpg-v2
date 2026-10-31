import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,getActor,executeAction,executeEnemyTurn,abilityAvailability} from '../src/core/battle.js';
import {nativeEvasion,evasionBaseSpeed,evasionChance} from '../src/core/evasion.js';import {resolveCharacter} from '../src/core/progression.js';
import {unlockCharacter} from '../src/core/ownership.js';import {equipGear} from '../src/core/equipment.js';import {craftExclusive,equipExclusive,beginReforge,finishReforge} from '../src/core/blacksmith.js';
import {exclusiveCraftUnlocked} from '../src/core/blacksmith-rules.js';import {claimBattleReward} from '../src/core/economy.js';
import {createStoryRun,advanceStoryWave} from '../src/core/story-waves.js';import {isQuestUnlocked,questCatalog} from '../src/core/quest-catalog.js';
import {travelerStoryPage,storyPrerequisites} from '../src/core/traveler-stories.js';import {dungeonQuestPool} from '../src/core/dungeon.js';
import {passivePresentation,skillPresentation} from '../src/ui/skill-copy.js';import {passiveDescription,skillScaling} from '../src/ui/skill-presentation.js';
import {validateContent} from '../src/core/content.js';import {firstClearRewardLabel} from '../src/core/first-clear-labels.js';
const content=await loadContent(),chapters=content.travelerStories.chelsea.chapters;
function owned(){const c=createGameSave(content);unlockCharacter(c,content,'chelsea');c.party=['chelsea','iris','elaine','garrek'];c.partyPresets[0].slots=[...c.party];return c;}
function fixture(random=()=>.01){const b=createBattle(structuredClone(content),owned(),'forest_patrol',random);for(const a of b.actors){a.hp=a.stats.maxHp=10000;a.shield=0;a.statuses=[];a.weaknesses=[];a.stats.attack=100;a.stats.magic=100;a.stats.defense=a.stats.resistance=0;delete a.baseStats;if(a.id!=='chelsea')a.passive=null;}return b;}
const a=(b,id='chelsea')=>getActor(b,id),hits=b=>b.events.filter(e=>e.type==='damage'&&!e.periodic);
function use(b,owner,ability,target=owner,phase='main'){b.outcome=null;b.phase=phase;b.queue=[owner,owner==='enemy_0'?'iris':'enemy_0'];b.cursor=0;executeAction(b,{actorId:owner,abilityId:ability,targetId:target});}
function enemyHit(b,{type='physical',hits=1,unavoidable=false,target='chelsea',area=false}={}){b.content.abilities['test.enemy']={id:'test.enemy',name:'Test',target:area?'all_enemies':'enemy',effects:[{type:'damage',damageType:type,element:'plain',multiplier:1,hits,unavoidable}]};if(!a(b,'enemy_0').abilities.includes('test.enemy'))a(b,'enemy_0').abilities.push('test.enemy');use(b,'enemy_0','test.enemy',target,b.phase);}
function win(c,id,persist=()=>{}){const e=content.encounters[id];return claimBattleReward(c,{encounterId:id,outcome:'victory',rewardRandom:()=>0,actors:(e.requiredPartyIds??[]).map(id=>({id,team:'party'})),...(e.waves?{storyWave:{waveIndex:e.waves.length-1,totalWaves:e.waves.length}}:{})},content,persist);}
function intro(){let c=createGameSave(content);for(const story of ['iris','fiona','takeshi'])for(const id of content.travelerStories[story].chapters)c=win(c,id);return c;}

test('Chelsea is official Light physical DPS in standard gacha; all authored data validate',()=>{
 assert.deepEqual(validateContent(content),[]);const c=content.characters.chelsea;assert.equal(c.element,'light');assert.equal(c.roleGroup,'physical_dps');assert.ok(content.banners.standard.characterPool.includes(c.id));assert.ok(!c.developerOnly);assert.equal(content.abilities['chelsea.seal'].cost.mp,6);assert.equal(content.abilities['chelsea.seal'].cooldown,undefined);assert.equal(content.abilities['chelsea.delivery'].cost.mp,16);assert.equal(content.abilities['chelsea.delivery'].cooldown,2);
});
test('evasion uses 40% plus 0.6% per base SPD, caps at 100 and covers both direct damage types',()=>{
 const x=structuredClone(content.characters.chelsea);for(const [speed,chance]of[[0,.4],[28,.568],[50,.7],[100,1],[150,1]]){x.stats.speed=speed;for(const type of ['physical','magical'])assert.ok(Math.abs(nativeEvasion(x,type)-chance)<1e-10);}
 x.stats.speed=100;assert.equal(evasionChance(x,{damageType:'magical',unavoidable:true}),0);assert.equal(evasionChance(x,{damageType:'physical'}),1);
 const takeshi=content.characters.takeshi;assert.equal(evasionChance(takeshi,{damageType:'magical'},.7),0);assert.equal(evasionChance(takeshi,{damageType:'physical'},.9),.85);
});
test('gear and exclusive flat SPD improve native evasion; temporary SPD percent does not',()=>{
 let c=owned();c.gear=[{id:'gear_1',typeId:'t3_focused',stats:{speed:5}}];c.gacha.totalPulls=1;c=equipGear(c,content,'chelsea','gear_1');c.exclusiveGear=[{templateId:'chelsea.compass',statKey:'speed',statValue:5}];c=equipExclusive(c,content,'chelsea','chelsea.compass');const x=resolveCharacter(content,c,'chelsea');assert.equal(evasionBaseSpeed(x),38);assert.ok(Math.abs(nativeEvasion(x,'physical')-.628)<1e-10);
 x.statuses=[{id:'benard_gale',remaining:2,stacks:1,sourceId:'chelsea'}];assert.ok(Math.abs(nativeEvasion(x,'physical')-.628)<1e-10);x.baseStats={...x.stats,speed:38};x.stats.speed=200;assert.ok(Math.abs(nativeEvasion(x,'magical')-.628)<1e-10);
});
test('physical and magical dodges counter once at 50% ATK then grant two Light exposures after damage',()=>{
 for(const type of ['physical','magical']){const b=fixture();enemyHit(b,{type});const own=hits(b).filter(e=>e.sourceId==='chelsea');assert.equal(own.length,1);assert.equal(own[0].amount,50);assert.equal(own[0].weakness,false);assert.equal(a(b,'enemy_0').statuses.find(s=>s.id==='exposure_light').stacks,2);assert.equal(a(b).hp,10000);assert.deepEqual(a(b).resourceValues,{});}
});
test('many hits and both phases share one counter per round; next round resets the opportunity',()=>{
 const b=fixture();enemyHit(b,{hits:3,type:'magical'});assert.equal(b.events.filter(e=>e.type==='dodge').length,3);assert.equal(b.events.filter(e=>e.type==='reaction').length,1);b.phase='extra';enemyHit(b,{type:'magical'});assert.equal(b.events.filter(e=>e.type==='reaction').length,0);b.round++;b.phase='main';enemyHit(b);assert.equal(b.events.filter(e=>e.type==='reaction').length,1);
});
test('AoE still lets Chelsea dodge and counter while other allies take their own hits',()=>{
 const b=fixture();enemyHit(b,{type:'magical',area:true});assert.equal(a(b).hp,10000);assert.equal(a(b,'iris').hp,9900);assert.equal(b.events.filter(e=>e.type==='reaction'&&e.sourceId==='chelsea').length,1);
});
test('100 base SPD guarantees normal direct dodge, but cannot dodge unavoidable attacks or DoT',()=>{
 const b=fixture(()=>.999999);a(b).stats.speed=100;enemyHit(b,{type:'magical'});assert.equal(a(b).hp,10000);enemyHit(b,{type:'magical',unavoidable:true});assert.equal(a(b).hp,9900);
 a(b).statuses=[{id:'kai_poison',remaining:1,stacks:1,potency:13,sourceId:'enemy_0'}];b.queue=['iris','chelsea','enemy_0'];b.cursor=0;executeAction(b,{actorId:'iris',abilityId:'$defend',targetId:'iris'});assert.equal(a(b).hp,9887);assert.ok(!b.events.some(e=>e.type==='dodge'));
});
test('failed evasion does not counter; hostile ward blocks the whole two-stack application',()=>{
 const b=fixture(()=>.99);enemyHit(b);assert.equal(a(b).hp,9900);assert.ok(!b.events.some(e=>e.type==='reaction'));
 const c=fixture();a(c,'enemy_0').statuses=[{id:'effect_ward',remaining:null,stacks:1,charges:1,sourceId:'enemy_0'}];enemyHit(c);assert.ok(c.events.some(e=>e.type==='effect_blocked'&&e.statusId==='exposure_light'));assert.ok(!a(c,'enemy_0').statuses.some(s=>s.id==='exposure_light'));
});
test('counter-on-counter chains stop even when both sides can dodge magic and physical',()=>{
 const b=fixture();const foe=a(b,'enemy_0');foe.passive=structuredClone(a(b).passive);foe.stats.speed=a(b).stats.speed=100;use(b,'chelsea','chelsea.seal','enemy_0');assert.equal(b.events.filter(e=>e.type==='dodge').length,2);assert.equal(b.events.filter(e=>e.type==='reaction').length,1);
});
test('delivery gains 30% additive damage bonus on any elemental exposure, only correct element consumes stacks',()=>{
 for(const element of [null,'light','water']){const b=fixture(()=>.99),t=a(b,'enemy_0');if(element)t.statuses=[{id:'exposure_'+element,remaining:null,stacks:2,sourceId:'chelsea'}];use(b,'chelsea','chelsea.delivery','enemy_0');assert.equal(hits(b)[0].amount,element==='light'?624:element?416:320);if(element)assert.equal(t.statuses[0].stacks,element==='light'?1:2);}
 const b=fixture(()=>.99);a(b).statuses=[{id:'empowered',remaining:3,stacks:1,sourceId:'iris'}];a(b,'enemy_0').statuses=[{id:'exposure_water',remaining:null,stacks:1,sourceId:'chelsea'}];use(b,'chelsea','chelsea.delivery','enemy_0');assert.equal(hits(b)[0].amount,544);
});
test('urgent gives ATK and taunt for two main turns, extra turn does not shorten duration',()=>{
 const b=fixture(()=>.99);use(b,'chelsea','chelsea.urgent');const status=a(b).statuses.find(s=>s.id==='chelsea_urgent');assert.equal(status.remaining,2);assert.equal(a(b).mp,65);use(b,'chelsea','$defend','chelsea','extra');assert.equal(status.remaining,2);use(b,'chelsea','$defend');assert.equal(status.remaining,1);use(b,'chelsea','$defend');assert.ok(!a(b).statuses.some(s=>s.id==='chelsea_urgent'));assert.equal(content.statuses.chelsea_urgent.taunt,true);
});
test('compass replaces counter coefficient with 85% before DEF and adds no extra hit or stacks',()=>{
 const b=fixture();a(b).exclusiveGear={template:content.exclusiveGear['chelsea.compass']};a(b,'enemy_0').stats.defense=40;enemyHit(b);const own=hits(b).filter(e=>e.sourceId==='chelsea');assert.equal(own.length,1);assert.equal(own[0].amount,63);assert.equal(a(b,'enemy_0').statuses.find(s=>s.id==='exposure_light').stacks,2);assert.equal(content.abilities['chelsea.counter'].effects[0].multiplier,.5);
 const copy=passivePresentation(a(b),b.content);assert.ok(copy.facts.some(s=>s.includes('85% ATK')));assert.ok(skillScaling(content.abilities['chelsea.counter'],a(b),b.content).some(s=>s.includes('85%')));assert.ok(passiveDescription(a(b),b.content).includes('né vật lý và phép'));assert.ok(!skillScaling(content.abilities['chelsea.counter'],a(b),b.content).join(' ').includes('undefined'));assert.ok(skillScaling(content.abilities['chelsea.counter'],a(b),b.content).some(s=>s.includes('gắn 2')));
});
test('all stories after canonical first shelf require completed intro trilogy, irrespective of mobile page',()=>{
 const c=createGameSave(content);assert.equal(travelerStoryPage(content,2,1).stories[0].id,'takeshi');assert.ok(isQuestUnlocked(content.encounters.takeshi_story_justice,c));assert.equal(travelerStoryPage(content,2).stories[1].id,'chelsea');assert.equal(storyPrerequisites(content,c,'chelsea').length,3);
 for(const id of chapters)assert.throws(()=>createBattle(content,c,id));for(const story of Object.values(content.travelerStories).filter(s=>s.order>3))for(const id of story.chapters)assert.equal(content.encounters[id].requires.firstClears.length,3);
});
test('Chelsea story progresses without owning or fielding Chelsea; all three first-clear rewards persist once',()=>{
 let c=intro();const initial={coins:c.coins,pure:c.recruitmentShards,original:c.originalPrisma};assert.ok(!c.unlockedCharacterIds.includes('chelsea'));assert.ok(createBattle(content,c,chapters[0]).actors.every(a=>a.definitionId!=='chelsea'));
 c=win(c,chapters[0]);assert.equal(c.coins,initial.coins+550);assert.equal(c.recruitmentShards,initial.pure+5);
 const run=createStoryRun(content,c,chapters[1],()=>.99);for(let i=0;i<2;i++){run.battle.outcome='victory';assert.equal(claimBattleReward(c,run.battle,content),c);advanceStoryWave(content,run);}run.battle.outcome='victory';c=claimBattleReward(c,run.battle,content);assert.equal(c.coins,initial.coins+1100);assert.equal(c.recruitmentShards,initial.pure+10);assert.equal(exclusiveCraftUnlocked(c,content.exclusiveGear['chelsea.compass']),true);
 c=win(c,chapters[2]);assert.equal(c.recruitmentShards,initial.pure+15);assert.equal(c.originalPrisma,initial.original+1);assert.equal(c.coins,initial.coins+1250);assert.ok(!c.unlockedCharacterIds.includes('chelsea'));assert.deepEqual(decodeGameSave(encodeGameSave(c,content),content),c);const repeat=win(c,chapters[2]);assert.equal(repeat.recruitmentShards,c.recruitmentShards);assert.equal(repeat.originalPrisma,c.originalPrisma);assert.equal(repeat.coins,c.coins+150);
});
test('first-clear currency + unlock failure rolls back all rewards and remains retryable',()=>{
 const c=intro(),raw=JSON.stringify(c),b={encounterId:chapters[0],outcome:'victory',rewardRandom:()=>0};assert.throws(()=>claimBattleReward(c,b,content,()=>{throw Error('disk');}),/disk/);assert.equal(JSON.stringify(c),raw);assert.equal(b.rewardClaimed,undefined);const n=claimBattleReward(c,b,content);assert.equal(n.recruitmentShards,c.recruitmentShards+5);assert.equal(n.coins,c.coins+550);assert.equal(claimBattleReward(n,b,content),n);
});
test('compass unlocks after chapter II even unowned; crafting requires ownership and starts at SPD+5',()=>{
 let c=intro();Object.assign(c,{coins:100000,prismaFragments:10000,recruitmentShards:100,originalPrisma:10});const template=content.exclusiveGear['chelsea.compass'];assert.equal(exclusiveCraftUnlocked(c,template),false);assert.throws(()=>craftExclusive(c,content,template.id),/chương truyện/);c=win(win(c,chapters[0]),chapters[1]);assert.equal(exclusiveCraftUnlocked(c,template),true);assert.throws(()=>craftExclusive(c,content,template.id),/sở hữu/);unlockCharacter(c,content,'chelsea');const before=structuredClone(c);c=craftExclusive(c,content,template.id,()=>{throw Error('no RNG on initial stat');});assert.deepEqual(c.exclusiveGear[0],{templateId:template.id,statKey:'speed',statValue:5});assert.equal(c.coins,before.coins-10000);assert.equal(c.prismaFragments,before.prismaFragments-2400);assert.equal(c.recruitmentShards,before.recruitmentShards-3);assert.equal(c.originalPrisma,before.originalPrisma-1);assert.deepEqual(decodeGameSave(encodeGameSave(c,content),content),c);
 c=beginReforge(c,content,template.id,()=>0);c=finishReforge(c,content,c.pendingReforge.id,true);assert.equal(c.exclusiveGear[0].statKey,'maxHp');
});
test('Vesper uses exact authored stats, ward/healing compatible on-hit RES debuff and renewable 70 shield',()=>{
 const e=content.enemies.vesper;assert.deepEqual(Object.values(e.stats),[960,100,35,28,24,25,20]);assert.deepEqual(e.weaknesses,['water']);let c=intro();c=win(win(c,chapters[0]),chapters[1]);const b=createBattle(content,c,chapters[2],()=>.99);b.queue=['enemy_0','arthur'];b.cursor=0;executeEnemyTurn(b);assert.equal(a(b,'enemy_0').shield,70);a(b,'enemy_0').mp=0;b.queue=['enemy_0','arthur'];b.cursor=0;executeEnemyTurn(b);assert.ok(b.events.some(e=>e.type==='damage'&&e.damageType==='physical'&&e.element==='wind'));
 assert.equal(content.statuses.vesper_false_warrant.durationClock,'main_turn');assert.equal(content.abilities['vesper.warrant'].effects[0].onHitStatus.duration,2);
});
test('bandit weaknesses are genuinely diverse and reused definitions also update Takeshi story',()=>{
 const ids=['bandit_vanguard','bandit_archer','bandit_brute','bandit_mage','bandit_chief'];assert.equal(new Set(ids.map(id=>content.enemies[id].weaknesses.join(','))).size,5);assert.ok(ids.some(id=>!content.enemies[id].weaknesses.includes('wind')));assert.ok(content.encounters.takeshi_story_wanderer.waves.flat().some(id=>!content.enemies[id].weaknesses.includes('wind')));assert.ok(questCatalog(content,intro()).every(e=>e.travelerStory!=='chelsea'));assert.ok(dungeonQuestPool(content).every(id=>content.encounters[id].travelerStory!=='chelsea'));
});
test('copy exposes native scaling, conditional bonus and reward names without undefined resource text',()=>{
 const x=resolveCharacter(content,owned(),'chelsea'),p=passivePresentation(x,content);assert.ok(p.facts.some(t=>t.includes('56,8%')));assert.ok(!JSON.stringify(p).includes('undefined'));assert.ok(skillPresentation(content.abilities['chelsea.delivery'],x,content).facts.some(t=>t.includes('+30%')));assert.equal(firstClearRewardLabel(content,{type:'currency',currency:'recruitmentShards',amount:5}),'5 Pure Prisma');
});
test('schemas reject invalid evasion, exposure bonus, recipe gate, story requirements and currency rewards',()=>{
 for(const change of [c=>c.characters.chelsea.passive.evasion.cap=1.1,c=>c.characters.chelsea.passive.evasion.damageTypes=['healing'],c=>c.characters.chelsea.passive.evasion.perBaseSpeed=-1,c=>c.characters.chelsea.passive.counterAbility='missing',c=>c.abilities['chelsea.delivery'].effects[0].bonusVsExposure=Infinity,c=>c.exclusiveGear['chelsea.compass'].initialStat.statValue=0,c=>c.exclusiveGear['chelsea.compass'].requires.firstClear=chapters[0],c=>delete c.encounters[chapters[2]].requires.firstClears,c=>c.encounters[chapters[0]].requiredPartyIds=['chelsea'],c=>c.encounters[chapters[0]].firstClearRewards[0].currency='password',c=>c.encounters[chapters[0]].firstClearRewards[0].amount=-5]){const copy=structuredClone(content);change(copy);assert.ok(validateContent(copy).length);}
});
