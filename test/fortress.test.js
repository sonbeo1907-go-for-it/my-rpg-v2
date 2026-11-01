import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {enterFortress,moveFortress,leaveFortress,beginFortressEvent,performFortressService,actFortressEvent,fortressToken,fortressRequirement,fortressEventReady,fortressSupport} from '../src/core/fortress.js';
import {createChronicleBattle,checkpointChronicleBattle,finishChronicleBattle,restoreChronicleBattle,activeChronicleSnapshot} from '../src/core/chronicle-combat.js';
import {createBattle,executeAction,activeActor,executeEnemyTurn} from '../src/core/battle.js';
import {effectiveStat} from '../src/core/combat-math.js';
import {isQuestUnlocked,questCatalog,encounterReturnPath} from '../src/core/quest-catalog.js';
import {transitionBossPhases} from '../src/core/boss-mechanics.js';
const content=await loadContent(),book=content.chronicles.book2;
const token=c=>fortressToken(c),state=c=>c.chronicles.books.book2,pending=c=>c.chronicles.activeSession.activeEvent;
function campaign(intros=true){const c=createGameSave(content);c.chronicles.firstClearIds=content.chronicles.book1.locations.map(l=>l.introId);let n=enterFortress(c,content,{random:()=>0});if(intros){state(n).firstClearIds=book.locations.map(l=>l.introId);state(n).supportFlags.powderTransferDelegation=true;state(n).supportFlags.assignedMedicalTransfer=true;}return n;}
const move=(c,id)=>moveFortress(c,content,{token:token(c),locationId:id});
const service=(c,id)=>performFortressService(c,content,{token:token(c),serviceId:id});
function act(c,id){const p=pending(c);return actFortressEvent(c,content,{token:token(c),instanceId:p.instanceId,stepId:p.stepId,actionId:id});}
function begin(c,id){const e=content.chronicleEvents[id];c=move(c,e.locationId);if(e.hidden)return beginFortressEvent(c,content,{token:token(c),hiddenId:e.finale?null:id,finale:!!e.finale});for(let seed=0;seed<100000;seed++){const x=structuredClone(c);x.chronicles.activeSession.rngState=seed;const n=beginFortressEvent(x,content,{token:token(x)});if(pending(n).eventId===id)return n;}throw Error('No scheduler seed '+id);}
function finish(c){while(pending(c)){const p=pending(c),e=content.chronicleEvents[p.eventId],step=e.steps.find(s=>s.id===p.stepId);if(c.chronicles.activeSession.currentLocation!==step.locationId)c=move(c,step.locationId);if(step.battle){let b=createChronicleBattle(content,c,'book2',p.instanceId);b.outcome='victory';c=finishChronicleBattle(c,content,b);}else c=act(c,step.actions.find(a=>fortressRequirement(c,content,a.requires)).id);}return c;}
function supplies(c){c=begin(c,'book2.g01');c=move(c,'e');c=service(c,'request_transfer');c=move(c,'d');c=service(c,'verify_transfer');c=move(c,'g');c=act(c,'paper');c=act(c,'receive-act');c=move(c,'h');c=service(c,'deliver_powder');c=move(c,'g');c=service(c,'receive_fuse');c=move(c,'h');c=service(c,'replace_fuse');c=service(c,'signal');c=service(c,'calibrate');c=move(c,'f');c=service(c,'receive_medical');c=service(c,'deliver_medical');c=service(c,'verify_manifest');return c;}
test('old saves keep Book I, Alice and shared quota, Book II requires F10 and enter does not roll an event',()=>{
 const c=createGameSave(content);assert.throws(()=>enterFortress(c,content));const raw=JSON.parse(encodeGameSave(c,content));delete raw.chronicles.books;delete raw.chronicles.activeSession;delete raw.chronicles.inventory;delete raw.chronicles.nextSessionId;const restored=decodeGameSave(JSON.stringify(raw),content);assert.deepEqual(restored.chronicles.pendingByLocation,c.chronicles.pendingByLocation);assert.equal(state(restored).finaleCleared,false);
 const n=campaign(false);assert.equal(n.chronicles.activeSession.currentLocation,'a');assert.equal(pending(n),null);assert.deepEqual(enterFortress(n,content),n);assert.equal(n.chronicles.weeklyRewardLedger.count,0);assert.throws(()=>move(n,'j'));
});
test('G01 vertical slice obtains papers cross-area without G02, hands over once, and unlocks independent supports',()=>{
 let c=begin(campaign(),'book2.g01');const instance=pending(c).instanceId,seed=c.chronicles.activeSession.rngState;c=move(c,'e');assert.equal(c.chronicles.activeSession.rngState,seed);c=service(c,'request_transfer');c=move(c,'d');c=service(c,'verify_transfer');c=decodeGameSave(encodeGameSave(c,content),content);assert.equal(pending(c).instanceId,instance);c=move(c,'g');c=act(c,'paper');c=act(c,'receive-act');assert.equal(state(c).eventClearIds.includes('book2.g02'),false);assert.equal(c.chronicles.inventory.filter(i=>i.itemId==='gunpowder_crate').length,1);
 c=move(c,'h');c=service(c,'deliver_powder');assert.throws(()=>service(c,'deliver_powder'));c=move(c,'g');c=service(c,'receive_fuse');c=move(c,'h');c=service(c,'replace_fuse');c=service(c,'signal');c=service(c,'calibrate');assert.equal(state(c).supportFlags.cannonSupportReady,true);assert.equal(state(c).eventClearIds.includes('book2.h04'),false);
 c=move(c,'f');c=service(c,'receive_medical');c=service(c,'deliver_medical');c=service(c,'verify_manifest');assert.equal(state(c).supportFlags.supplySupportReady,true);assert.doesNotThrow(()=>decodeGameSave(encodeGameSave(c,content),content));
});
test('gate exit suspends the same event, stores military custody and resumes exact outcomes without duplicating items',()=>{
 let c=supplies(campaign());c=move(c,'g');assert.throws(()=>service(c,'receive_fuse')); // consumed fuse cannot be granted twice
 assert.equal(c.chronicles.inventory.filter(i=>i.itemId==='fuse_replacement').length,1);
 c=begin(c,'book2.a01');const p=structuredClone(pending(c));assert.throws(()=>leaveFortress(c,content,{token:token(c),confirmed:false}));c=move(c,'a');c=leaveFortress(c,content,{token:token(c),confirmed:true});assert.deepEqual(state(c).suspendedEvent,p);assert.equal(c.chronicles.activeSession,null);c=decodeGameSave(encodeGameSave(c,content),content);c=enterFortress(c,content,{random:()=>.9});assert.deepEqual(pending(c),p);assert.equal(state(c).supportFlags.cannonSupportReady,true);assert.equal(state(c).suspendedEvent,null);assert.throws(()=>beginFortressEvent(c,content,{token:token(c)}));
});
test('G01 sneak result and incident survive reload/gate exit, legal papers do not erase it, Roland resolves one case',()=>{
 let c=begin(campaign(),'book2.g01');c.chronicles.activeSession.rngState=1000;c=act(c,'sneak');assert.equal(pending(c).chanceResults.sneak,false);assert.equal(state(c).securityConcern,1);c=act(c,'failed-act');c=move(c,'a');c=leaveFortress(c,content,{token:token(c),confirmed:true});c=decodeGameSave(encodeGameSave(c,content),content);c=enterFortress(c,content);c=move(c,'g');assert.throws(()=>act(c,'sneak'));c=move(c,'e');c=service(c,'request_transfer');c=move(c,'d');c=service(c,'verify_transfer');c=move(c,'g');c=act(c,'paper');c=act(c,'receive-act');assert.equal(state(c).securityConcern,1);c=move(c,'e');c=service(c,'explain_incident');assert.equal(state(c).securityConcern,0);assert.equal(state(c).incidentLedger.length,1);assert.equal(state(c).incidentLedger[0].resolved,true);
});
test('authority is scoped to actual party, courier cannot issue orders, stale service commands fail without mutation',()=>{
 let c=begin(campaign(),'book2.g01');assert.throws(()=>act(c,'authority'));c.unlockedCharacterIds.push('victorina');c.party[0]='victorina';assert.equal(fortressRequirement(c,content,{authorityScope:'powder_transfer'}),true);const n=act(c,'authority');assert.equal(pending(n).selectedBranchId,'authority');assert.equal(c.chronicles.inventory.length,0);
 c.party[0]='chelsea';c.unlockedCharacterIds.push('chelsea');assert.throws(()=>act(c,'authority'));assert.equal(fortressRequirement(c,content,{authorityScope:'medical_transfer'}),false);const before=structuredClone(c);assert.throws(()=>performFortressService(c,content,{token:token(c),serviceId:'verify_transfer'}));assert.deepEqual(c,before);
 c=move(c,'e');const command={token:token(c),serviceId:'request_transfer'};c=performFortressService(c,content,command);assert.throws(()=>performFortressService(c,content,command));
});
test('noncombat branches of combat-capable events complete and share weekly rewards, service and hidden do not consume quota',()=>{
 let c=begin(campaign(),'book2.b02');assert.ok(content.chronicleEvents[pending(c).eventId].encounterId);c=act(c,'peace');c=act(c,'peace-act');assert.equal(state(c).eventClearIds.includes('book2.b02'),true);assert.equal(c.chronicles.weeklyRewardLedger.count,1);assert.equal(c.dailyCommissions.questClears,0);
 const raw=encodeGameSave(c,content);assert.deepEqual(decodeGameSave(raw,content).chronicles.weeklyRewardLedger,c.chronicles.weeklyRewardLedger);
});
test('battle snapshots resume correct RNG and event, retreat retries and no movement/exit while battle active',()=>{
 let c=begin(campaign(),'book2.g01');c=act(c,'force');const p=pending(c);let b=createChronicleBattle(content,c,'book2',p.instanceId);assert.equal(state(c).securityConcern,2);c=checkpointChronicleBattle(c,content,b);assert.equal(c.chronicles.activeBattle,'book2');assert.throws(()=>move(c,'a'));assert.throws(()=>leaveFortress(c,content,{token:token(c),confirmed:true}));c=decodeGameSave(encodeGameSave(c,content),content);b=restoreChronicleBattle(content,activeChronicleSnapshot(c));assert.equal(b.chronicle.instanceId,p.instanceId);const actor=activeActor(b);if(actor.team==='party')executeAction(b,{actorId:actor.id,abilityId:'$defend'});else executeEnemyTurn(b);c=checkpointChronicleBattle(c,content,b);b.outcome='defeat';c=checkpointChronicleBattle(c,content,b);assert.equal(pending(c).status,'retry');b=createChronicleBattle(content,c,'book2',p.instanceId);assert.equal(b.outcome,null);b.outcome='victory';c=finishChronicleBattle(c,content,b);assert.equal(pending(c).stepId,'receive');assert.equal(state(c).eventClearIds.includes('book2.g01'),false);c=act(c,'receive-act');assert.equal(state(c).eventClearIds.includes('book2.g01'),true);
});
test('both supports are additive encounter modifiers, retained through phases and reload, never leak to internal/quest',()=>{
 let c=supplies(campaign());state(c).eventClearIds.push('book2.j04');state(c).supportFlags.spyInvestigationResolved=true;c=begin(c,'book2.finale');c=act(c,'s0-act');let b=createChronicleBattle(content,c,'book2',pending(c).instanceId);assert.equal(b.enemyLevel,1);assert.equal(b.actors.find(a=>a.team==='enemy').stats.maxHp,3600);let ar=b.actors.find(a=>a.id==='arthur');assert.equal(effectiveStat(ar,'attack'),ar.stats.attack*1.3);assert.equal(ar.statuses.length,0);c=checkpointChronicleBattle(c,content,b);b=restoreChronicleBattle(content,activeChronicleSnapshot(c));ar=b.actors.find(a=>a.id==='arthur');assert.deepEqual(b.encounterSupport.modifiers,{attack:.30000000000000004,magic:.2,resistance:.1});
 const boss=b.actors.find(a=>a.team==='enemy');ar.mp=0;const dead=b.actors.find(a=>a.id==='iris');dead.hp=0;dead.mp=0;for(const ratio of [.65,.35]){boss.hp=Math.ceil(boss.stats.maxHp*ratio);transitionBossPhases(b,{write:()=>{},restoreMp:(_b,a,_,amount)=>a.mp=Math.min(a.stats.maxMp,a.mp+amount)});assert.equal(ar.mp,ar.stats.maxMp);assert.equal(dead.mp,0);assert.equal(effectiveStat(ar,'attack'),ar.stats.attack*1.3);}assert.equal(boss.bossState.phase,3);
 assert.equal(fortressSupport(c,content,content.encounters.miraebolis_superboss,pending(c).instanceId),null);assert.equal(fortressSupport(c,content,content.encounters.book2_g01,pending(c).instanceId),null);
});
test('finale is hidden, Level 1, unlocks Miraebolis only after aftermath, legacy flag and Alice keep their independent rights',()=>{
 let c=campaign();assert.equal(fortressEventReady(c,content,content.chronicleEvents['book2.finale']),false);assert.throws(()=>begin(c,'book2.finale'));assert.throws(()=>createBattle(content,c,'book2.mira_intro_lv1'));
 state(c).eventClearIds.push('book2.j04');state(c).supportFlags.spyInvestigationResolved=true;c=begin(c,'book2.finale');c=act(c,'s0-act');let b=createChronicleBattle(content,c,'book2',pending(c).instanceId);b.outcome='victory';c=finishChronicleBattle(c,content,b);assert.equal(isQuestUnlocked(content.encounters.miraebolis_superboss,c),false);c=act(c,'after-act');assert.equal(isQuestUnlocked(content.encounters.miraebolis_superboss,c),true);assert.equal(isQuestUnlocked(content.encounters.alice_superboss,c),false);assert.equal(c.chronicles.weeklyRewardLedger.count,0);assert.equal(encounterReturnPath(content,b.encounterId),'/chronicles/book2');assert.ok(questCatalog(content,c,{tab:'sinister'}).every(e=>e.category!=='chronicle'));assert.doesNotThrow(()=>decodeGameSave(encodeGameSave(c,content),content));
});
test('every introduction completes continuously, progress only includes ten introductions, reward quota untouched',()=>{
 let c=campaign(false);for(const l of book.locations){c=begin(c,l.introId);c=finish(c);}assert.equal(state(c).firstClearIds.length,10);assert.equal(state(c).eventClearIds.length,0);assert.equal(c.chronicles.activeSession.currentLocation,'j');assert.equal(c.chronicles.weeklyRewardLedger.count,0);assert.equal(state(c).supportFlags.assignedMedicalTransfer,true);assert.doesNotThrow(()=>decodeGameSave(encodeGameSave(c,content),content));
});

test('all forty activities and the investigation DAG are completable without gacha characters or hidden support requirements',()=>{
 let c=campaign(),remaining=Object.values(content.chronicleEvents).filter(e=>e.bookId==='book2'&&!e.intro&&!e.finale);
 for(let pass=0;remaining.length&&pass<40;pass++){
  const e=remaining.find(e=>fortressEventReady(c,content,e));assert.ok(e,'DAG must have an available activity');c=begin(c,e.id);
  if(e.id==='book2.g01'||e.id==='book2.g02'){c=move(c,'e');if(!state(c).supportFlags.transferRequested)c=service(c,'request_transfer');c=move(c,'d');if(!c.chronicles.inventory.some(i=>i.itemId==='transfer_order'))c=service(c,'verify_transfer');c=move(c,'g');}
  if(e.id==='book2.f02'&&!state(c).supportFlags.medicalCrateReceived)c=service(c,'receive_medical');
  if(e.id==='book2.h02'&&!state(c).supportFlags.fuseReplaced){c=move(c,'g');c=service(c,'receive_fuse');c=move(c,'h');c=service(c,'replace_fuse');}
  if(e.id==='book2.j04'){c=move(c,'d');c=service(c,'drainage_map');c=move(c,'j');}
  c=finish(c);c=decodeGameSave(encodeGameSave(c,content),content);remaining=remaining.filter(x=>x.id!==e.id);
 }
 assert.equal(remaining.length,0);assert.equal(state(c).eventClearIds.length,40);assert.equal(state(c).supportFlags.spyInvestigationResolved,true);assert.equal(state(c).supportFlags.cannonSupportReady,false);assert.equal(state(c).supportFlags.supplySupportReady,false);assert.ok(fortressEventReady(c,content,content.chronicleEvents['book2.finale']));assert.equal(c.chronicles.weeklyRewardLedger.count,28);
});
test('shared weekly budget includes Book I and new week preserves the active session and pinned reward',()=>{
 let c=campaign();c.chronicles.weeklyRewardLedger={weekKey:'2026-10-26',count:28,claimedInstanceIds:Array.from({length:28},(_,i)=>'book1-a-'+(i+500))};c=begin(c,'book2.a01');const p=structuredClone(pending(c)),session=c.chronicles.activeSession.sessionId;
 while(pending(c)){const q=pending(c),e=content.chronicleEvents[q.eventId],step=e.steps.find(x=>x.id===q.stepId);c=actFortressEvent(c,content,{token:token(c),instanceId:q.instanceId,stepId:q.stepId,actionId:step.actions[0].id},new Date('2026-11-01T17:01:00Z'));}
 assert.equal(c.chronicles.activeSession.sessionId,session);assert.equal(c.chronicles.weeklyRewardLedger.weekKey,'2026-11-02');assert.equal(c.chronicles.weeklyRewardLedger.count,1);assert.equal(c[p.rewardRoll.currency],p.rewardRoll.amount);
});
test('G02 paperwork remains available after G01 succeeds by authority, and departing cargo is reclaimed once',()=>{
 let c=begin(campaign(),'book2.g01');c.party[0]='victorina';c.unlockedCharacterIds.push('victorina');c=act(c,'authority');c=act(c,'receive-act');c=begin(c,'book2.g02');const work=pending(c).instanceId;c=move(c,'e');c=service(c,'request_transfer');c=move(c,'d');c=service(c,'verify_transfer');c=move(c,'g');c=finish(c);assert.ok(state(c).eventClearIds.includes('book2.g02'));assert.ok(work);
 c=move(c,'a');c=leaveFortress(c,content,{token:token(c),confirmed:true});assert.equal(c.chronicles.inventory.find(i=>i.itemId==='gunpowder_crate').custody,'stored');c=enterFortress(c,content);c=move(c,'g');c=service(c,'retrieve_gunpowder_crate');assert.throws(()=>service(c,'retrieve_gunpowder_crate'));assert.equal(c.chronicles.inventory.filter(i=>i.itemId==='gunpowder_crate').length,1);
});
test('Chelsea courier choices supplement evidence and do not bypass military permissions or J04 combat',()=>{
 let c=campaign();c.party[0]='chelsea';c.unlockedCharacterIds.push('chelsea');c=begin(c,'book2.a02');const p=pending(c),e=content.chronicleEvents[p.eventId];while(pending(c)){const step=e.steps.find(x=>x.id===pending(c).stepId);c=act(c,step.actions.find(a=>a.id==='courier')?.id??step.actions[0].id);}assert.ok(state(c).evidenceNotes.some(n=>n.includes('Chelsea')));c=begin(c,'book2.g01');assert.equal(fortressRequirement(c,content,{authorityScope:'powder_transfer'}),false);assert.throws(()=>act(c,'authority'));assert.throws(()=>act(c,'paper'));
});

test('Book II art manifest has exactly 35 self-contained SVGs without embedded text, scripts, remote references or spoilers',()=>{
 const path=new URL('../public/art/chronicles/book2/',import.meta.url),files=fs.readdirSync(path).filter(n=>n.endsWith('.svg'));assert.equal(files.length,35);
 for(const name of files){const svg=fs.readFileSync(new URL(name,path),'utf8');assert.match(svg,/viewBox=/);assert.doesNotMatch(svg,/<script|<text|<foreignObject|href=|url\(https|Miraebolis|Chelsea|Roland/i);}
 for(const l of book.locations)assert.ok(files.includes(l.art));for(const e of Object.values(content.chronicleEvents).filter(e=>e.bookId==='book2'))assert.ok(files.includes(e.prop));
});
