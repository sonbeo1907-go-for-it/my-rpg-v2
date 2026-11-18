import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {beginTournament as rawBeginTournament,currentTournamentPlayerMatch,proposeTournamentResult,confirmTournamentResult,arrangeTournament} from '../src/core/tournament-session.js';
import {academyShopState,buyAcademyItem} from '../src/core/academy-event-economy.js';
import {selectAcademySpecial,finishAcademySpecial} from '../src/core/academy-special.js';
import {academySpecialKits} from '../src/core/academy-special-content.js';
import {createTournamentBattle,saveTournamentBattle,tournamentContent} from '../src/core/tournament-combat.js';
import {activeActor,executeAction,executeEnemyTurn,planAutoBattleTurn} from '../src/core/battle.js';
import {validateContent} from '../src/core/content.js';
const c=await loadContent(),d=c.tournaments.academy_tournament,args=s=>({runId:s.tournaments.activeRun.runId,revision:s.tournaments.revision}),roundtrip=s=>decodeGameSave(encodeGameSave(s,c),c);
function win(s){const r=s.tournaments.activeRun,m=currentTournamentPlayerMatch(r),player=r.snapshot.definition.playerTeamId;s=proposeTournamentResult(s,{...args(s),matchId:m.id,winnerId:player,survivors:m.teams.map(id=>id===player?4:0)});return confirmTournamentResult(s,args(s));}
function start(){return beginTournament(createGameSave(c),c,{revision:0,seed:'event'});}
function specialStart(characterId){let s=createGameSave(c);Object.assign(s.tournaments,{firstClear:true,championships:1,completedRuns:1,nextRunNumber:2});s=beginTournament(s,c,{revision:0,seed:'special-test'});s.tournaments.activeRun.specialEncounter={characterId,status:'waiting',checkpoint:null,pendingOutcome:null};for(let i=0;i<3;i++)s=win(s);return s;}

test('confirmed wins and milestones pay once, survive save/reload, and do not award global match EXP/coins',()=>{
 let s=start();const coins=s.coins;s=win(s);assert.equal(s.tournaments.wallet.tokens,20);assert.throws(()=>confirmTournamentResult(s,args(s)));s=roundtrip(s);s=win(win(s));assert.equal(s.tournaments.wallet.tokens,100);assert.equal(s.coins,coins);
 for(let n=0;n<15&&!s.tournaments.activeRun.outcome;n++)s=win(s);
 const r=s.tournaments.activeRun,expected=r.fixtures.filter(m=>m.result?.source==='player'&&m.result.winnerId===d.playerTeamId).length*20+200;
 assert.equal(s.tournaments.wallet.tokens,expected);assert.equal(s.tournaments.firstClear,true);assert.equal(roundtrip(s).tournaments.wallet.tokens,expected);
 const oldWallet=structuredClone(s.tournaments.wallet);s=beginTournament(s,c,{revision:s.tournaments.revision,seed:'replay'});assert.deepEqual(s.tournaments.wallet,oldWallet);
});
test('weekly shop resets only purchases at Monday 00:00 Vietnam; prevents clock rollback, stale and overspend transactions',()=>{
 let s=createGameSave(c);s.tournaments.wallet={tokens:2000,lifetimeEarned:2000,weekly:{week:null,purchases:{}}};
 const sunday=new Date('2026-11-22T16:59:59Z'),monday=new Date('2026-11-22T17:00:00Z');
 s=buyAcademyItem(s,c,{offerId:'original',revision:0,now:sunday});assert.equal(s.originalPrisma,1);assert.equal(s.tournaments.wallet.tokens,1800);
 assert.throws(()=>buyAcademyItem(s,c,{offerId:'original',revision:0,now:sunday}));assert.throws(()=>buyAcademyItem(s,c,{offerId:'original',revision:1,now:sunday}));
 assert.equal(academyShopState(s,d,monday).offers.find(o=>o.id==='original').remaining,1);
 s=buyAcademyItem(s,c,{offerId:'original',revision:1,now:monday});assert.equal(s.originalPrisma,2);assert.equal(academyShopState(s,d,sunday).offers.find(o=>o.id==='original').remaining,0);
 const before=structuredClone(s);assert.throws(()=>buyAcademyItem(s,c,{offerId:'coins',quantity:21,revision:2,now:monday}));assert.throws(()=>buyAcademyItem(s,c,{offerId:'pure',quantity:-1,revision:2,now:monday}));assert.deepEqual(s,before);assert.deepEqual(roundtrip(s).tournaments.wallet,s.tournaments.wallet);
});
test('shop grants all goods, exact quantities and does not alter frozen account roster',()=>{
 let s=specialStart('eri');s.tournaments.wallet.tokens=s.tournaments.wallet.lifetimeEarned=10000;const frozen=JSON.stringify(s.tournaments.activeRun.snapshot);
 for(const o of d.eventShop.offers.filter(o=>!o.characterId)){const before=s[o.field];s=buyAcademyItem(s,c,{offerId:o.id,quantity:2>o.weeklyLimit?1:2,revision:s.tournaments.revision});assert.equal(s[o.field]-before,o.amount*Math.min(2,o.weeklyLimit));}
 assert.equal(JSON.stringify(s.tournaments.activeRun.snapshot),frozen);assert.ok(roundtrip(s));
});
test('legacy state migrates wallet without retroactively paying old committed results',()=>{
 let s=win(start());delete s.tournaments.wallet;delete s.tournaments.activeRun.snapshot.definition.eventEconomy;delete s.tournaments.activeRun.snapshot.rewards;delete s.tournaments.activeRun.rewardReceipts;delete s.tournaments.activeRun.specialEncounter;delete s.tournaments.activeRun.snapshot.specialKits;
 s=roundtrip(s);assert.equal(s.tournaments.wallet.tokens,0);s=win(s);assert.equal(s.tournaments.wallet.tokens,0);
});
test('special draw is deterministic, First Clear gated, at most one/run, with all four outcomes reachable',()=>{
 const found=new Set();let count=0;for(let i=0;i<1000;i++){assert.equal(selectAcademySpecial(d,false,'seed'+i),null);const e=selectAcademySpecial(d,true,'seed'+i);assert.deepEqual(e,selectAcademySpecial(d,true,'seed'+i));if(e){found.add(e.characterId);count++;}}
 assert.equal(found.size,4);assert.ok(count>100&&count<200);
});
test('special content validates separately and does not add bosses to public Quest pools',()=>{
 const x=academySpecialKits(),scoped={...c,...Object.fromEntries(Object.entries(x).map(([k,rows])=>[k,{...c[k],...rows}]))};
 assert.deepEqual(validateContent(scoped),[]);for(const id of Object.keys(x.encounters)){assert.equal(c.encounters[id],undefined);assert.equal(x.encounters[id].referenceLevel,1);}
});
for(const id of ['rotary','monica','lumine','eri'])test(id+' special: real combat telegraphs, checkpoint/RNG resume, boss immunity, defeat retry and isolated reward',()=>{
 let s=specialStart(id),r=s.tournaments.activeRun;assert.equal(r.specialEncounter.status,'available');
 let b=createTournamentBattle(c,s,{special:true});assert.equal(b.actors.length,5);const boss=b.actors.find(a=>a.team==='enemy');assert.equal(boss.level,40);assert.ok(boss.controlImmunities.includes('stun'));assert.equal(b.arena,null);assert.ok(!b.pvpRules);
 const fixtures=JSON.stringify(r.fixtures),tokens=s.tournaments.wallet.tokens;
 // Keep actors alive until the actual rotation enters and resolves its windup.
 for(const a of b.actors){a.hp=a.stats.maxHp=100000;}
 let warned=false,prepared=false,resolved=false;
 for(let i=0;i<45&&!b.outcome;i++){const a=activeActor(b);if(a.team==='enemy'){const had=!!a.preparedMove;executeEnemyTurn(b);prepared||=!!a.preparedMove;resolved||=had&&!a.preparedMove;}else executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});warned||=b.log.some(x=>/lượt chính kế tiếp/.test(x));if(prepared&&resolved)break;}
 assert.ok(warned&&prepared&&resolved,'windup is telegraphed and actually resolves through normal engine');
 s=saveTournamentBattle(s,b);assert.throws(()=>arrangeTournament(s,{...args(s),lineup:r.lineup}));
 const loaded=roundtrip(s),restored=createTournamentBattle(c,loaded,{special:true});assert.equal(restored.random.getState(),b.random.getState());assert.deepEqual(restored.actors,b.actors);assert.equal(restored.round,b.round);
 b.outcome='defeat';s=saveTournamentBattle(s,b);s=finishAcademySpecial(s,{...args(s),retry:true});assert.equal(s.tournaments.wallet.tokens,tokens);b=createTournamentBattle(c,s,{special:true});b.outcome='victory';s=saveTournamentBattle(s,b);s=roundtrip(s);s=finishAcademySpecial(s,args(s));assert.equal(s.tournaments.wallet.tokens,tokens+100);assert.equal(JSON.stringify(s.tournaments.activeRun.fixtures),fixtures);assert.throws(()=>finishAcademySpecial(s,args(s)));assert.equal(s.tournaments.completedRuns,1);assert.ok(roundtrip(s));
});
test('declining special trial keeps tournament playable and does not pay',()=>{let s=specialStart('rotary'),tokens=s.tournaments.wallet.tokens;s=finishAcademySpecial(s,{...args(s),decline:true});assert.equal(s.tournaments.activeRun.specialEncounter.status,'declined');assert.equal(s.tournaments.wallet.tokens,tokens);assert.ok(createTournamentBattle(c,s));});

test('special timeout is defeat, never a four-versus-one survivor-score win',async()=>{const {judgeTournamentLimit}=await import('../src/core/tournament-judging.js');const b=createTournamentBattle(c,specialStart('eri'),{special:true});b.round=60;assert.equal(judgeTournamentLimit(b),true);assert.equal(b.outcome,'defeat');});
test('special trial cannot bypass its gate through ordinary Quest creation',async()=>{const {createBattle}=await import('../src/core/battle.js');const s=start(),scoped=tournamentContent(c,s.tournaments.activeRun);assert.throws(()=>createBattle(scoped,s,'academy_trial_eri'));});

function beginTournament(campaign,...args){campaign=structuredClone(campaign);campaign.tournaments.rulesAccepted=true;return rawBeginTournament(campaign,...args);}
