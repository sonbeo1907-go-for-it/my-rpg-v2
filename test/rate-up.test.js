import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {rotationSchedule,resolveRecruitmentBanner,characterDrawChance,drawBannerCharacter,inRateUpGroup,validateRateUpSnapshot} from '../src/core/rate-up.js';
import {pullGacha} from '../src/core/economy.js';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {validateContent} from '../src/core/content.js';
const c=await loadContent(),date=s=>new Date(s),day=s=>date(s+'T05:00:00Z');
const schedule=s=>rotationSchedule(c,s),first=s=>schedule(day(s)).banners[0];
test('calendar changes at midnight Vietnam, Monday/Thursday distinct factions and Sunday two triples',()=>{
 const m=first('2026-11-02'),t=first('2026-11-05'),s=schedule(day('2026-11-08')).banners;
 assert.equal(schedule(date('2026-11-04T16:59:59Z')).banners[0].id,m.id);
 assert.equal(schedule(date('2026-11-04T17:00:00Z')).banners[0].id,t.id);
 assert.notEqual(m.groupId,t.groupId);assert.equal(s.length,2);assert.notEqual(s[0].groupId,s[1].groupId);
 for(const b of s){assert.equal(b.featured.length,3);assert.equal(new Set(b.featured).size,3);}
 assert.deepEqual(first('2026-11-04'),m);assert.deepEqual(first('2026-11-07'),t);
 assert.equal(schedule(date('2026-11-08T16:59:59Z')).banners.length,2);assert.equal(schedule(date('2026-11-08T17:00:00Z')).banners.length,1);
});
test('one hundred weeks never repeat a character still in the last-15 queue; Sunday uses the same queue',()=>{
 let queue=[],foreign=0,seen=0;const start=Date.parse('2026-11-02T05:00:00Z');
 for(let week=0;week<100;week++)for(const offset of [0,3,6]){
  const {banners,queue:actual}=schedule(new Date(start+(week*7+offset)*86400000));
  for(const b of banners){const g=c.banners.standard.rateUpRotation.groups.find(g=>g.id===b.groupId);assert.ok(inRateUpGroup(c.characters[b.featured[0]],g));assert.ok(inRateUpGroup(c.characters[b.featured[1]],g));if(!inRateUpGroup(c.characters[b.featured[2]],g))foreign++;seen++;
   assert.ok(b.featured.every(id=>!queue.includes(id)));queue.push(...b.featured);queue=queue.slice(-15);
  }assert.deepEqual(actual,queue);
 }assert.ok(foreign/seen>.35&&foreign/seen<.65);
});
test('calendar is deterministic across content instances and returned data cannot mutate cache',()=>{
 const a=first('2026-11-05');a.featured[0]='arthur';assert.notEqual(first('2026-11-05').featured[0],'arthur');
 assert.deepEqual(rotationSchedule(structuredClone(c),day('2026-11-05')),schedule(day('2026-11-05')));
});
test('conditional probabilities partition 25%, 12.5%, 12.5%, 50% exactly and off-rate excludes featured',()=>{
 const b=first('2026-11-05');let tally={};for(let i=0;i<8000;i++){const id=drawBannerCharacter(b,(i+.5)/8000);tally[id]=(tally[id]??0)+1;}
 assert.deepEqual(b.featured.map(id=>tally[id]),[2000,1000,1000]);assert.ok(Math.abs(b.characterPool.reduce((sum,id)=>sum+characterDrawChance(b,id),0)-1)<1e-12);
 assert.deepEqual([0,.25,.375].map(n=>drawBannerCharacter(b,n)),b.featured);assert.ok(!b.featured.includes(drawBannerCharacter(b,.5)));
 assert.ok(characterDrawChance(b,'astoria')>0);assert.equal(characterDrawChance(c.banners.standard,'dain'),1/c.banners.standard.characterPool.length);
});
test('each Sunday banner has its own pity and cannot borrow from its neighbor or standard',()=>{
 const now=day('2026-11-08'),b=schedule(now).banners;let s=createGameSave(c);s.prisma=100;s.gacha.totalPulls=49;s.gacha.pity={[b[0].id]:49,standard:7};
 const out=pullGacha(s,c,b[1].id,1,()=>0,now);assert.equal(out.results[0].kind,'gear');assert.equal(out.campaign.gacha.pity[b[1].id],1);assert.equal(out.campaign.gacha.pity[b[0].id],49);assert.equal(out.campaign.gacha.pity.standard,7);
 const hit=pullGacha(out.campaign,c,b[0].id,1,()=>0,now);assert.equal(hit.results[0].guaranteed,true);assert.equal(hit.campaign.gacha.pity[b[0].id],0);assert.equal(hit.campaign.gacha.pity[b[1].id],1);
 assert.deepEqual(decodeGameSave(encodeGameSave(hit.campaign,c),c).gacha.lastSummon.rateUp,hit.campaign.gacha.lastSummon.rateUp);
});
test('expired pity is discarded on the next transaction; new banner starts at zero',()=>{
 const s=createGameSave(c),old=first('2026-11-02'),current=first('2026-11-05');s.prisma=20;s.gacha.totalPulls=49;s.gacha.pity={[old.id]:49};const out=pullGacha(s,c,current.id,1,()=>0,day('2026-11-05'));
 assert.equal(out.results[0].kind,'gear');assert.equal(out.campaign.gacha.pity[old.id],undefined);assert.equal(out.campaign.gacha.pity[current.id],1);
});
test('old saves without rate-up still load and expired banners cannot debit wallet or RNG',()=>{
 const s=createGameSave(c);s.prisma=100;assert.deepEqual(decodeGameSave(encodeGameSave(s,c),c).gacha,s.gacha);
 assert.throws(()=>pullGacha(s,c,first('2026-11-02').id,10,()=>{throw Error('RNG must not run');},day('2026-11-05')),/đã thay đổi/);assert.equal(s.prisma,100);assert.equal(s.gacha.totalPulls,0);
 assert.equal(resolveRecruitmentBanner(c,'rateup_fake',day('2026-11-05')),null);
});
test('ten pulls settle pity sequentially and historical rate-up survives a calendar change',()=>{
 const now=day('2026-11-05'),b=first('2026-11-05'),s=createGameSave(c);s.prisma=20;s.gacha.totalPulls=48;s.gacha.pity={[b.id]:48};let values=[0,0,0,0, .25, ...Array.from({length:8},()=>[0,0,0]).flat()];
 // First gear uses outcome/type/stat; next guaranteed character uses a single conditional roll.
 values=[0,0,0,.25,...Array.from({length:8},()=>[0,0,0]).flat()];const out=pullGacha(s,c,b.id,10,()=>{assert.ok(values.length);return values.shift();},now);
 assert.equal(out.results[1].characterId,b.featured[1]);assert.equal(out.campaign.gacha.pity[b.id],8);assert.equal(out.campaign.prisma,10);
 assert.deepEqual(decodeGameSave(encodeGameSave(out.campaign,c),c).gacha.lastSummon,out.campaign.gacha.lastSummon);
 assert.ok(validateRateUpSnapshot(out.campaign.gacha.lastSummon.rateUp,c.banners.standard));const bad=structuredClone(out.campaign);bad.gacha.lastSummon.rateUp.featured[0]='unknown_character';assert.throws(()=>encodeGameSave(bad,c),/lịch sử|Lịch sử/);
});
test('rate-up roster excludes starters, developer and free recruitment-only characters; definitions validate',()=>{
 assert.deepEqual(validateContent(c),[]);for(const id of c.banners.standard.rateUpRotation.roster){assert.ok(!c.characters[id].developerOnly);assert.ok(!c.characters[id].recruitmentOnly);assert.ok(!c.economy.default.starterCharacters.includes(id));}
});
