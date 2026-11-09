import {test} from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {previewBookBundle,useBookBundle} from '../src/core/book-bundle.js';
import {bannerRates} from '../src/core/summon-presentation.js';import {activeRecruitmentBanners,characterDrawChance} from '../src/core/rate-up.js';
const c=await loadContent();
test('journal bundle grants combined XP once, previews identical levels and persists all inventory counters',()=>{
 const s=createGameSave(c);s.xpBooksGreen=4;s.xpBooksBlue=2;s.xpBooksPurple=1;const q={xp_book_green:2,xp_book_blue:1,xp_book_purple:1};const p=previewBookBundle(s,c,'arthur',q).report,n=useBookBundle(s,c,'arthur',q);
 assert.equal(p.amount,8800);assert.equal(n.characters.arthur.level,p.toLevel);assert.equal(n.characters.arthur.xp,p.toXp);assert.equal(n.xpBooksGreen,2);assert.equal(n.xpBooksBlue,1);assert.equal(n.xpBooksPurple,0);assert.equal(s.characters.arthur.level,1);assert.equal(s.xpBooksPurple,1);assert.equal(n.characters.iris.level,1);assert.deepEqual(decodeGameSave(encodeGameSave(n,c),c),n);
});
test('bundle rejects empty, overstock, unknown items, fractional amounts, locked gameplay and full XP cap',()=>{
 const s=createGameSave(c);s.xpBooksGreen=3;for(const q of [{},{xp_book_green:0},{xp_book_green:4},{xp_book_green:-1},{xp_book_green:1.5},{coin:1}])assert.throws(()=>previewBookBundle(s,c,'arthur',q));
 assert.throws(()=>useBookBundle(s,c,'arthur',{xp_book_green:1},{battleActive:true}));s.chronicles.activeSession={};assert.throws(()=>useBookBundle(s,c,'arthur',{xp_book_green:1}));s.chronicles.activeSession=null;s.characters.arthur={...s.characters.arthur,level:50,limitBreakRank:3,xp:0};assert.throws(()=>useBookBundle(s,c,'arthur',{xp_book_green:1}));assert.equal(s.xpBooksGreen,3);
});
test('all active banners use 1.5% characters and 18.5% T3, while conditional featured odds and pity stay unchanged',()=>{
 for(const b of activeRecruitmentBanners(c,new Date('2026-11-08T05:00:00Z'))){const rates=bannerRates(b);for(const [key,n]of Object.entries({low:.3,mid:.5,high:.185,character:.015}))assert.ok(Math.abs(rates[key]-n)<1e-12);assert.equal(b.pity.characterAt,50);if(b.featured)assert.deepEqual(b.featured.map(id=>characterDrawChance(b,id)),[.25,.125,.125]);}
 assert.deepEqual(c.dungeons.gold_mine.difficulties.map(d=>d.reward.coins),[3000,6000,9000]);assert.deepEqual(c.dungeons.dangerous.difficulties.map(d=>d.reward.recruitmentShards),[3,6,10]);assert.equal(c.dungeons.breakthrough_trial.dailyLimit,3);
});
