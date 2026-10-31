import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,getActor,executeAction} from '../src/core/battle.js';import {resolveCharacter} from '../src/core/progression.js';
import {equipGear} from '../src/core/equipment.js';import {craftGear,beginGearReforge,finishGearReforge} from '../src/core/gear-forge.js';
import {dismantleGear,craftExclusive,beginReforge} from '../src/core/blacksmith.js';import {validateGear,claimBattleReward,pullGacha} from '../src/core/economy.js';
import {validateContent} from '../src/core/content.js';import {dailyCommissionView} from '../src/core/daily-commissions.js';import {prepareVictoryReward} from '../src/core/quest-rewards.js';
const content=await loadContent();
function funded(){const c=createGameSave(content);Object.assign(c,{coins:200000,prismaFragments:50000,originalPrisma:20,recruitmentShards:100});c.party=['arthur','iris',null,null];c.partyPresets[0].slots=[...c.party];c.gear=Array.from({length:10},(_,i)=>({id:'gear_'+(i+1),typeId:'t3_focused',stats:{attack:5}}));c.gacha.totalPulls=10;return c;}
function stats(c=funded(),primaryStat='attack',random=()=>2/7){return craftGear(c,content,{materialId:c.gear.find(g=>g.typeId==='t3_focused').id,primaryStat,effectId:undefined},random);}
function effect(id='guardian_talisman',c=funded()){return craftGear(c,content,{effectId:id,primaryStat:undefined,materialId:c.gear.find(g=>g.typeId==='t3_focused').id});}
function battle(c){const b=createBattle(content,c,'forest_patrol',()=>.99);for(const a of b.actors.filter(a=>a.team==='enemy'))a.hp=a.stats.maxHp=10000;return b;}
function round(b){b.queue=['iris'];b.cursor=0;executeAction(b,{actorId:'iris',abilityId:'$defend',targetId:'iris'});}

test('T4 crafting pays exact costs and T3 material, preserves gacha IDs and supports duplicate main/sub stats',()=>{
 const old=funded(),raw=JSON.stringify(old),next=stats(old),gear=next.gear.at(-1);assert.equal(JSON.stringify(old),raw);assert.equal(next.coins,192000);assert.equal(next.prismaFragments,48800);assert.equal(next.gear.length,old.gear.length);assert.equal(next.gear.some(g=>g.id==='gear_1'),false);assert.equal(gear.id,'rune_1');assert.equal(gear.primaryStat,'attack');assert.equal(gear.secondaryStat,'attack');assert.deepEqual(gear.stats,{attack:8});assert.equal(next.gacha.totalPulls,10);assert.equal(validateGear(gear,content),true);assert.deepEqual(decodeGameSave(encodeGameSave(next,content),content),next);
});

test('HP/MP scales match normal gear and secondary stat is uniform across seven options',()=>{
 for(let index=0;index<7;index++){const c=stats(funded(),'maxHp',()=>(index+.01)/7),g=c.gear.at(-1);assert.equal(g.secondaryStat,content.economy.default.gearStats[index].stat);assert.equal(g.stats.maxHp,index===0?40:25);if(index===1)assert.equal(g.stats.maxMp,6);assert.ok(validateGear(g,content));}
});

test('craft validation rejects wrong/equipped material, insufficient resources, locked recipe and invalid RNG atomically',()=>{
 const old=funded(),raw=JSON.stringify(old);for(const options of [{primaryStat:'oops',materialId:'gear_1'},{primaryStat:'attack',materialId:'missing'},{effectId:'prisma_lens',materialId:'gear_1'}])assert.throws(()=>craftGear(old,content,options));
 for(const c of [{...old,coins:7999},{...old,prismaFragments:1199},equipGear(old,content,'arthur','gear_1')])assert.throws(()=>stats(c));
 for(const x of [-1,1,NaN])assert.throws(()=>stats(old,'attack',()=>x));assert.equal(JSON.stringify(old),raw);
});

test('effect recipes pay their tier, require formula flag, have no stats and occupy ordinary equipment slots',()=>{
 let c=effect();assert.equal(c.coins,188000);assert.equal(c.prismaFragments,47600);assert.deepEqual(c.gear.at(-1).stats,{});c=equipGear(c,content,'arthur','rune_1');const a=resolveCharacter(content,c,'arthur');assert.equal(a.stats.attack,34);assert.equal(a.gearEffects[0].id,'guardian_talisman');assert.deepEqual(decodeGameSave(encodeGameSave(c,content),content),c);
 const base=funded();base.storyFlags.push('arthur.full_control_story_cleared');const special=effect('prisma_lens',base);assert.equal(special.coins,182000);assert.equal(special.prismaFragments,46800);assert.equal(special.gear.at(-1).effectId,'prisma_lens');
});

test('duplicate effect groups cannot be equipped twice on the same character; other characters can use their own copies',()=>{
 let c=effect('guardian_talisman',effect());c=equipGear(c,content,'arthur','rune_1',0);assert.throws(()=>equipGear(c,content,'arthur','rune_2',1),/cùng nhóm/);c=equipGear(c,content,'iris','rune_2');assert.equal(resolveCharacter(content,c,'iris').gearEffects.length,1);
});

test('secondary reforge commits payment/results before choice, survives reload, and keeping old never refunds',()=>{
 const c=stats(),original=JSON.stringify(c),next=beginGearReforge(c,content,'rune_1',()=>1/7);assert.equal(JSON.stringify(c),original);assert.equal(next.coins,c.coins-2500);assert.equal(next.prismaFragments,c.prismaFragments-450);assert.equal(next.gear.at(-1).secondaryStat,'attack');
 const restored=decodeGameSave(encodeGameSave(next,content),content);assert.deepEqual(restored.pendingGearReforge,next.pendingGearReforge);assert.throws(()=>beginGearReforge(restored,content,'rune_1'));assert.throws(()=>dismantleGear(restored,content,['rune_1']));
 const kept=finishGearReforge(restored,content,restored.pendingGearReforge.id,false);assert.deepEqual(kept.gear,c.gear);assert.equal(kept.coins,next.coins);assert.equal(kept.prismaFragments,next.prismaFragments);assert.equal(kept.pendingGearReforge,null);
 const accepted=finishGearReforge(restored,content,restored.pendingGearReforge.id,true),g=accepted.gear.at(-1);assert.equal(g.primaryStat,'attack');assert.equal(g.secondaryStat,'maxMp');assert.deepEqual(g.stats,{attack:5,maxMp:6});assert.deepEqual(decodeGameSave(encodeGameSave(accepted,content),content),accepted);
});

test('reforge permits identical secondary results but rejects non-T4 gear, stale decisions, tampered main and missing owner item',()=>{
 const c=stats();assert.throws(()=>beginGearReforge(c,content,'gear_2'));let p=beginGearReforge(c,content,'rune_1',()=>2/7);assert.equal(p.pendingGearReforge.nextSecondaryStat,'attack');assert.throws(()=>finishGearReforge(p,content,999,true));
 for(const change of [s=>s.pendingGearReforge.primaryStat='magic',s=>s.pendingGearReforge.nextSecondaryStat='oops',s=>s.gear.pop()]){const x=structuredClone(p);change(x);assert.throws(()=>encodeGameSave(x,content));}
});

test('new forged IDs never collide with summon IDs; consumed T3 gacha receipts remain valid history',()=>{
 let c=funded();c.prisma=2;c=pullGacha(c,content,'standard',1,()=>.9).campaign;const material=c.gear.at(-1);assert.ok(material.typeId.startsWith('t3'));c=craftGear(c,content,{materialId:material.id,primaryStat:'attack',effectId:undefined},()=>0);c=decodeGameSave(encodeGameSave(c,content),content);assert.equal(c.gacha.lastSummon.results[0].dismantled,true);c=pullGacha(c,content,'standard',1,()=>0).campaign;assert.equal(c.gear.at(-1).id,'gear_12');assert.ok(c.gear.some(g=>g.id==='rune_1'));
});

test('T4 dismantle returns only ten percent of craft shards and cannot recover craft Coin or material',()=>{
 let c=stats();const before=c.prismaFragments;c=dismantleGear(c,content,['rune_1']);assert.equal(c.prismaFragments,before+120);let e=effect();const n=e.prismaFragments;e=dismantleGear(e,content,['rune_1']);assert.equal(e.prismaFragments,n+240);
});

test('guardian checks wards from any source, triggers at rounds 1/4 and does not overwrite an existing ward',()=>{
 let c=equipGear(effect(),content,'arthur','rune_1');const b=battle(c),a=getActor(b,'arthur');assert.equal(a.statuses.find(s=>s.id==='effect_ward').charges,1);assert.equal(a.gearEffectReadyRounds.gear_ward,4);a.statuses=[];round(b);assert.equal(a.statuses.length,0);round(b);assert.equal(a.statuses.length,0);round(b);assert.equal(a.statuses.find(s=>s.id==='effect_ward').charges,1);const instance=a.statuses[0];round(b);round(b);round(b);assert.equal(a.statuses[0],instance);assert.equal(a.gearEffectReadyRounds.gear_ward,7);
});

test('HP/MP effects wait until needed, cap at max, and use round cooldown independent from extra turns',()=>{
 for(const[id,field,max,group]of[['spring_talisman','hp','maxHp','gear_heal'],['mana_talisman','mp','maxMp','gear_mana']]){const b=battle(equipGear(effect(id),content,'arthur','rune_1')),a=getActor(b,'arthur');assert.equal(a.gearEffectReadyRounds?.[group],undefined);a[field]=a.stats[max]-1;round(b);assert.equal(a[field],a.stats[max]);const ready=a.gearEffectReadyRounds[group];a[field]=0;round(b);assert.equal(a[field],0);assert.equal(a.gearEffectReadyRounds[group],ready);}
});

test('special exploitation gear uses the new weakness buff without mutating character stats',()=>{
 const c=funded();c.storyFlags.push('arthur.full_control_story_cleared');const b=battle(equipGear(effect('prisma_lens',c),content,'arthur','rune_1')),a=getActor(b,'arthur');assert.ok(a.statuses.some(s=>s.id==='weakness_exploitation'));assert.equal(a.gearEffectReadyRounds.gear_exploit,5);assert.equal(a.stats.attack,34);
});

test('T4 save migration adds defaults to old v6 saves without replacing existing equipment; forged stat tampering fails',()=>{
 const old=JSON.parse(encodeGameSave(funded(),content));delete old.craftedGearSerial;delete old.pendingGearReforge;const restored=decodeGameSave(JSON.stringify(old),content);assert.equal(restored.craftedGearSerial,0);assert.equal(restored.pendingGearReforge,null);
 for(const change of [s=>s.gear.at(-1).stats.attack=9,s=>s.craftedGearSerial=0,s=>s.gear.at(-1).secondaryStat='magic']){const c=stats();change(c);assert.throws(()=>encodeGameSave(c,content));}
});

test('recipe validation catches malformed costs/effects and Trấn Phái now costs 2400 shards',()=>{
 assert.equal(content.blacksmith.default.craftCost.prismaFragments,2400);for(const change of [c=>c.gearEffects.guardian_talisman.cooldownRounds=0,c=>c.gearEffects.guardian_talisman.effect.status='bad',c=>c.blacksmith.default.secondaryReforgeCost.coins=-1]){const c=structuredClone(content);change(c);assert.ok(validateContent(c).length);}
});

test('ordinary and boss Quest rewards split exactly at 0.5, preserve daily counts and first-clear rewards',()=>{
 for(const[id,coins,fragments]of[['forest_patrol',50,5],['ogre_trial',150,15]])for(const value of [0,.499999,.5,.99999]){const c=funded(),b={questDifficulty:'very_easy',encounterId:id,outcome:'victory',rewardRandom:()=>value};const next=claimBattleReward(c,b,content,()=>{},new Date('2026-10-31T05:00:00Z'));assert.equal(next.coins-c.coins,value<.5?coins:0);assert.equal(next.prismaFragments-c.prismaFragments,value<.5?0:fragments);assert.equal(dailyCommissionView(next,new Date('2026-10-31T05:00:00Z')).state,undefined);assert.equal(next.dailyCommissions.questClears,1);if(id==='ogre_trial')assert.ok(next.characters.arthur.upgradeIds.includes('arthur.control_training'));assert.equal(claimBattleReward(next,b,content),next);}
});

test('failed disk commit does not reroll or pay twice; super bosses and traveler stories retain their fixed Coin reward',()=>{
 let calls=0;const c=funded(),b={encounterId:'forest_patrol',outcome:'victory',rewardRandom:()=>{calls++;return .8;}};assert.throws(()=>claimBattleReward(c,b,content,()=>{throw Error('disk');}));assert.equal(b.rewardClaimed,undefined);assert.deepEqual(b.victoryReward,{prismaFragments:5});const next=claimBattleReward(c,b,content);assert.equal(calls,1);assert.equal(next.prismaFragments,c.prismaFragments+5);
 for(const id of ['alice_superboss','iris_story_growth'])if(content.encounters[id]){const battle={encounterId:id,rewardRandom:()=>{throw Error('must not roll');}};const reward=prepareVictoryReward(battle,content);assert.ok(reward.coins);assert.equal(reward.prismaFragments,undefined);}
});
