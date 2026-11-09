import {test} from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';import {createGameSave,decodeGameSave,encodeGameSave} from '../src/core/game-save.js';
import {buyProgressionItem,useExperienceBook,previewExperienceBook,rollDungeonReward} from '../src/core/progression-items.js';
import {createDungeonRun,advanceDungeonWave,claimDungeonReward,sweepDungeon} from '../src/core/dungeon.js';import {validateContent} from '../src/core/content.js';
const c=await loadContent(),now=new Date('2026-11-05T05:00:00Z'),fresh=()=>createGameSave(c);
const difficulty=id=>c.dungeons.training_grounds.difficulties.find(d=>d.id===id);
test('old saves gain empty book counters, new books round-trip, malformed counters are rejected',()=>{
 const s=fresh(),old=JSON.parse(encodeGameSave(s,c));for(const k of ['xpBooksGreen','xpBooksBlue','xpBooksPurple'])delete old[k];const migrated=decodeGameSave(JSON.stringify(old),c);assert.equal(migrated.xpBooksGreen,0);
 for(const key of ['xpBooksGreen','xpBooksBlue','xpBooksPurple']){s[key]=17;const saved=decodeGameSave(encodeGameSave(s,c),c);assert.equal(saved[key],17);for(const n of [-1,1.2,'5',Number.MAX_SAFE_INTEGER+1])assert.throws(()=>encodeGameSave({...s,[key]:n},c));}
});
test('shop grants the right stone/book counts for exact costs, without mutating its input',()=>{
 for(const [id,field,price]of [['limit_break_stone','limitBreakStones',20000],['xp_book_green','xpBooksGreen',400],['xp_book_blue','xpBooksBlue',2000],['xp_book_purple','xpBooksPurple',6000]]){
  const s=fresh();s.coins=price*3;const n=buyProgressionItem(s,c,id,3);assert.equal(n[field],3);assert.equal(n.coins,0);assert.equal(s[field],0);assert.equal(s.coins,price*3);assert.throws(()=>buyProgressionItem(s,c,id,4));for(const q of [0,-1,.5,NaN,Number.MAX_SAFE_INTEGER])assert.throws(()=>buyProgressionItem(s,c,id,q));
 }
 assert.throws(()=>buyProgressionItem(fresh(),c,'original',1));const s=fresh();s.coins=1000;s.xpBooksGreen=Number.MAX_SAFE_INTEGER;assert.throws(()=>buyProgressionItem(s,c,'xp_book_green',1));
});
test('books grant 400 / 2000 / 6000 XP to only the chosen owned character and preview before consuming',()=>{
 for(const [id,field,xp]of [['xp_book_green','xpBooksGreen',400],['xp_book_blue','xpBooksBlue',2000],['xp_book_purple','xpBooksPurple',6000]]){
  const s=fresh();s[field]=3;const report=previewExperienceBook(s,c,id,'arthur',2);assert.equal(report.amount,xp*2);const n=useExperienceBook(s,c,id,'arthur',2);assert.equal(n[field],1);assert.equal(n.characters.arthur.level,report.toLevel);assert.equal(n.characters.arthur.xp,report.toXp);assert.deepEqual(n.characters.iris,s.characters.iris);assert.equal(s[field],3);assert.equal(s.characters.arthur.level,1);assert.deepEqual(decodeGameSave(encodeGameSave(n,c),c),n);
 }
});
test('book use respects combat/session locks, ownership and level caps; partial XP waste is previewed',()=>{
 const s=fresh();s.xpBooksPurple=2;assert.throws(()=>useExperienceBook(s,c,'xp_book_purple','arthur',1,{battleActive:true}));const session=structuredClone(s);session.chronicles.activeSession={};assert.throws(()=>useExperienceBook(session,c,'xp_book_purple','arthur'));
 assert.throws(()=>useExperienceBook(s,c,'xp_book_purple','lisbeth'));assert.throws(()=>useExperienceBook(s,c,'xp_book_purple','arthur',3));
 s.characters.arthur={...s.characters.arthur,level:20,xp:0};const preview=previewExperienceBook(s,c,'xp_book_purple','arthur');assert.ok(preview.lost>0);assert.ok(preview.accepted>0);const n=useExperienceBook(s,c,'xp_book_purple','arthur');assert.equal(n.characters.arthur.level,20);assert.equal(n.xpBooksPurple,1);assert.throws(()=>useExperienceBook(n,c,'xp_book_purple','arthur'));
 s.characters.arthur={...s.characters.arthur,level:50,limitBreakRank:3,xp:0};assert.throws(()=>useExperienceBook(s,c,'xp_book_purple','arthur'));assert.equal(s.xpBooksPurple,2);
});
test('training XP and inclusive journal drop ranges match all three difficulties',()=>{
 for(const [id,xp,lo,hi]of [['easy',1200,{xpBooksGreen:10,xpBooksBlue:3},{xpBooksGreen:12,xpBooksBlue:5}],['medium',4400,{xpBooksBlue:8,xpBooksGreen:6,xpBooksPurple:1},{xpBooksBlue:12,xpBooksGreen:9,xpBooksPurple:1}],['hard',8800,{xpBooksPurple:4,xpBooksBlue:10},{xpBooksPurple:6,xpBooksBlue:12}]]){
  assert.deepEqual(rollDungeonReward(c,difficulty(id),()=>0),{characterXp:xp,...lo});assert.deepEqual(rollDungeonReward(c,difficulty(id),()=>.999999),{characterXp:xp,...hi});
 }
 for(const n of [-.1,1,NaN])assert.throws(()=>rollDungeonReward(c,difficulty('easy'),()=>n));
});
test('training awards books only at full clear; failed persistence and retry keep the original rolls',()=>{
 const s=fresh();let calls=0;const r=createDungeonRun(c,s,'training_grounds','easy',{now,random:()=>.1,rewardRandom:()=>{calls++;return .99999;}}),reward=structuredClone(r.reward);assert.equal(calls,2);r.battle.outcome='victory';assert.strictEqual(claimDungeonReward(s,r,c,()=>{},now),s);assert.equal(s.xpBooksGreen,0);
 while(r.waveIndex<r.waveIds.length-1){r.battle.outcome='victory';advanceDungeonWave(c,r);}r.battle.outcome='victory';assert.deepEqual(r.reward,reward);assert.throws(()=>claimDungeonReward(s,r,c,()=>{throw Error('disk');},now));assert.equal(r.claimed,false);assert.equal(s.trainingCharges.charges,9);assert.equal(s.xpBooksBlue,0);
 const n=claimDungeonReward(s,r,c,()=>{},now);assert.equal(n.xpBooksGreen,12);assert.equal(n.xpBooksBlue,5);assert.equal(n.characters.arthur.level,8);assert.equal(n.characters.arthur.xp,38);assert.equal(n.trainingCharges.charges,8);assert.equal(calls,2);assert.strictEqual(claimDungeonReward(n,r,c,()=>{},now),n);
});
test('sweep rolls once per attempt, pays books and party XP together and shows the same reward receipt',()=>{
 const s=fresh();s.sweepTickets=2;s.dungeonClearedDifficulties.training_grounds=['hard'];const attempt={};let calls=0;
 assert.throws(()=>sweepDungeon(s,c,'training_grounds','hard',()=>{throw Error('disk');},now,{rewardAttempt:attempt,random:()=>{calls++;return 0;}}));assert.equal(calls,2);assert.equal(s.sweepTickets,2);assert.equal(s.xpBooksPurple,0);
 let receipt;const n=sweepDungeon(s,c,'training_grounds','hard',()=>{},now,{rewardAttempt:attempt,random:()=>{throw Error('reroll');},onResult:r=>receipt=r});assert.equal(n.xpBooksPurple,4);assert.equal(n.xpBooksBlue,10);assert.equal(n.sweepTickets,1);assert.equal(n.trainingCharges.charges,8);assert.equal(receipt.dungeon.reward.xpBooksPurple,4);assert.equal(receipt.dungeon.reward.characterXp,8800);assert.ok(receipt.xpAwards.every(a=>a.amount===8800));
});
test('invalid journal metadata, drop configuration and progression counters do not enter shipping content',()=>{
 for(const alter of [x=>x.items.xp_book_green.xp=0,x=>x.items.xp_book_blue.coinCost=-1,x=>x.items.xp_book_purple.field='coins',x=>x.dungeons.training_grounds.difficulties[0].bookDrops[0].max=1,x=>x.dungeons.training_grounds.difficulties[1].bookDrops.push({itemId:'coin',min:1,max:1}),x=>x.dungeons.gold_mine.difficulties[0].bookDrops=[{itemId:'xp_book_green',min:1,max:1}]]){const x=structuredClone(c);alter(x);assert.ok(validateContent(x).length);}
});

test('repeat-farm totals include all journal tiers once per saved victory',async()=>{
 const {createFarmSession,recordFarmResult}=await import('../src/core/farm-session.js');const before=fresh(),after={...before,xpBooksGreen:11,xpBooksBlue:4,xpBooksPurple:1},battle={outcome:'victory',rewardClaimed:true,xpAwards:[]};
 const state=recordFarmResult(createFarmSession({kind:'dungeon',id:'training_grounds'},1,7),7,battle,before,after);assert.deepEqual(state.totals,{xpBooksGreen:11,xpBooksBlue:4,xpBooksPurple:1});assert.strictEqual(recordFarmResult(state,7,battle,before,after),state);
});
