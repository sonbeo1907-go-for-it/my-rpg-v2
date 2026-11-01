import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {tobinRecruitmentState,recruitTobin} from '../src/core/tobin-recruitment.js';
import {craftGear,beginGearReforge,finishGearReforge} from '../src/core/gear-forge.js';
import {gearSlotCapacity} from '../src/core/gear-slots.js';
import {createBattle,getActor,executeAction,abilityAvailability} from '../src/core/battle.js';
import {battleStat} from '../src/core/stat-values.js';
import {resolveRankedAbility} from '../src/core/skill-resolver.js';
import {skillPresentation,passivePresentation} from '../src/ui/skill-copy.js';
import {compactSkillScaling} from '../src/ui/combat-presentation.js';
import {snapshotChronicleBattle,restoreChronicleBattle} from '../src/core/chronicle-combat.js';
import {seededRandom} from '../src/core/random.js';
import {checkCombatMode} from '../src/core/combat-modes.js';
import {combatTimeline} from '../src/ui/combat-timeline.js';
const content=await loadContent();
function cleared(s=createGameSave(content)){s.chronicles.firstClearIds=content.chronicles.book1.locations.map(l=>l.introId);return s;}
function funds(s=createGameSave(content)){s.coins=1e7;s.prismaFragments=1e6;s.gear=Array.from({length:40},(_,i)=>({id:'gear_'+(i+1),typeId:'t3_focused',stats:{attack:5}}));s.gacha.totalPulls=40;return s;}
function forge(s,effect=false){return craftGear(s,content,{materialId:s.gear.find(g=>g.typeId==='t3_focused').id,...effect?{effectId:'guardian_talisman'}:{primaryStat:'attack'}},()=>0);}
function setup(party=['astraea','iris','elaine','tobin']){const c=structuredClone(content),s=createGameSave(c);s.party=party;s.partyPresets[0].slots=[...s.party];s.unlockedCharacterIds=[...new Set([...s.unlockedCharacterIds,...party])];const b=createBattle(c,s,'forest_patrol',seededRandom(7));for(const e of b.actors.filter(a=>a.team==='enemy')){e.hp=e.stats.maxHp=100000;e.stats.attack=e.stats.magic=1;e.stats.resistance=e.stats.defense=0;e.weaknesses=[];e.resistances={};}return {b,c,s};}
function cast(b,id,ability,target=id,roundEnd=false){b.queue=roundEnd?[id]:[id,b.actors.find(a=>a.id!==id&&a.hp>0).id];b.cursor=0;executeAction(b,{actorId:id,abilityId:ability,targetId:target});}
const follow=b=>b.events.filter(e=>e.type==='reaction'&&e.abilityId==='astraea.thorns');

test('Tobin requires actual 10 intros, recruits once with no currency charge and never enters gacha',()=>{
 const s=createGameSave(content);assert.throws(()=>recruitTobin(s,content));s.chronicles.firstClearIds=Array(10).fill('book1.intro.f01');assert.equal(tobinRecruitmentState(s,content).ready,false);
 const ready=cleared(),next=recruitTobin(ready,content);assert.equal(ready.unlockedCharacterIds.includes('tobin'),false);assert.ok(next.unlockedCharacterIds.includes('tobin'));assert.equal(next.coins,ready.coins);assert.equal(gearSlotCapacity(next,content,'tobin'),3);assert.throws(()=>recruitTobin(next,content));
 assert.ok(!content.banners.standard.characterPool.includes('tobin'));assert.ok(content.banners.standard.characterPool.includes('astraea'));
});
test('Tobin counts both successful T4 types only after recruitment, grants slots at 10/20/30 and stops at six',()=>{
 let s=funds(cleared());for(let n=0;n<3;n++)s=forge(s);assert.equal(s.tobinCraftCount,0);s=recruitTobin(s,content);
 for(let n=1;n<=31;n++){s=forge(s,n%2===0);assert.equal(s.tobinCraftCount,Math.min(n,30));assert.equal(gearSlotCapacity(s,content,'tobin'),3+Math.min(3,Math.floor(n/10)));if(n%10===0)s=decodeGameSave(encodeGameSave(s,content),content);}
 assert.equal(s.craftedGearSerial,34);
});
test('reforge, rejected crafts and legacy serials never advance Tobin; progress is serialized and validated',()=>{
 let s=recruitTobin(funds(cleared()),content);s=forge(s);const before=JSON.stringify(s);assert.throws(()=>craftGear(s,content,{primaryStat:'attack',materialId:'missing'}));assert.equal(JSON.stringify(s),before);
 const g=s.gear.at(-1);s=beginGearReforge(s,content,g.id,()=>.5);s=finishGearReforge(s,content,s.pendingGearReforge.id,true);assert.equal(s.tobinCraftCount,1);
 const old=JSON.parse(encodeGameSave(s,content));delete old.tobinCraftCount;delete old.characters.tobin;delete old.characters.astraea;old.unlockedCharacterIds=old.unlockedCharacterIds.filter(id=>id!=='tobin');const restored=decodeGameSave(JSON.stringify(old),content);assert.equal(restored.tobinCraftCount,0);assert.equal(restored.characters.astraea.level,1);
 for(const n of [-1,1.5,31]){const bad={...s,tobinCraftCount:n};assert.throws(()=>encodeGameSave(bad,content));}
});
test('non-damaging ally skills including Defend trigger one Earth AoE; own skills and offensive zero-damage skills do not',()=>{
 const {b}=setup();cast(b,'astraea','astraea.dew','iris');assert.equal(follow(b).length,0);cast(b,'iris','iris.formula','tobin');assert.equal(follow(b).length,1);const damage=b.events.filter(e=>e.type==='damage'&&e.sourceId==='astraea');assert.equal(damage.length,3);assert.ok(damage.every(e=>e.element==='earth'));cast(b,'elaine','$defend');assert.equal(follow(b).length,0);
 b.round++;cast(b,'tobin','$defend');assert.equal(follow(b).length,1);b.round++;cast(b,'tobin','tobin.hammer','enemy_0');assert.equal(follow(b).length,0);
});
test('garden grants 50% MAG, 170% MAG followups twice per round; changing mode never resets the counter',()=>{
 const {b}=setup(),a=getActor(b,'astraea');cast(b,'iris','$defend');assert.equal(follow(b).length,1);cast(b,'astraea','astraea.garden');assert.equal(follow(b).length,0);assert.equal(battleStat(b.content,a,'magic'),49.5);assert.equal(a.modeFollowUpBonus,.5);cast(b,'elaine','$defend');assert.equal(follow(b).length,1);assert.equal(a.supportFollowupState.count,2);cast(b,'tobin','$defend');assert.equal(follow(b).length,0);
 b.round++;cast(b,'iris','$defend');const damage=b.events.filter(e=>e.type==='damage'&&e.sourceId==='astraea');assert.equal(damage.length,3);assert.ok(damage.every(e=>e.amount===84));
 a.modeExpiresAfterRound=b.round;checkCombatMode(b,a,'round_end',{write:()=>{},emit:()=>{},restore:()=>{}});assert.equal(a.activeMode,undefined);assert.equal(a.modeFollowUpBonus,undefined);cast(b,'tobin','$defend');assert.equal(follow(b).length,0);
});
test('garden expires after three actual rounds and is ready on the very next main turn',()=>{
 const {b}=setup(),a=getActor(b,'astraea');cast(b,'astraea','astraea.garden','astraea',true);assert.equal(b.round,2);assert.equal(a.activeMode,'black_garden');cast(b,'astraea','$defend','astraea',true);assert.equal(b.round,3);assert.equal(a.activeMode,'black_garden');cast(b,'astraea','$defend','astraea',true);assert.equal(b.round,4);assert.equal(a.activeMode,undefined);assert.equal(abilityAvailability(b,a,b.content.abilities['astraea.garden']).ok,true);cast(b,'astraea','astraea.garden');assert.equal(a.activeMode,'black_garden');
});
test('rank growth affects mode MAG at 5% and only the bonus followup coefficient at 10%; live value freezes on entry',()=>{
 const {b}=setup(),a=getActor(b,'astraea');a.skillRanks['astraea.garden']=5;const resolved=resolveRankedAbility(b.content,a,'astraea.garden');assert.ok(Math.abs(resolved.effects[0].modeAppliedModifiers.magic-.5*1.05**4)<1e-9);assert.ok(Math.abs(resolved.effects[0].followUpBonus-.5*1.1**4)<1e-9);cast(b,'astraea','astraea.garden');assert.equal(a.modeFollowUpBonus,resolved.effects[0].followUpBonus);a.skillRanks['astraea.garden']=1;assert.equal(a.modeFollowUpBonus,resolved.effects[0].followUpBonus);
 assert.ok(skillPresentation(b.content.abilities['astraea.garden'],a,b.content).facts.some(f=>f.includes('Liên kích')));assert.ok(passivePresentation(a,b.content).rules.some(r=>r.includes('Phòng thủ')));assert.ok(compactSkillScaling(resolved,a,a,b.content,b).includes('Liên kích'));
});
test('support followup cannot self-chain, trigger Aurora, fire for enemies, or fire when owner is dead',()=>{
 const {b}=setup();const a=getActor(b,'astraea');b.actors.push({...structuredClone(a),id:'astraea_second',supportFollowupState:undefined});cast(b,'iris','$defend');assert.equal(follow(b).length,2);assert.equal(b.actors.at(-1).supportFollowupState.count,1);a.hp=0;b.actors.at(-1).hp=0;b.round++;cast(b,'iris','$defend');assert.equal(follow(b).length,0);
});
test('garden, coefficient and per-round allowance survive a combat snapshot without retriggering',()=>{
 const {b,c}=setup();cast(b,'astraea','astraea.garden');cast(b,'iris','$defend');const restored=restoreChronicleBattle(c,snapshotChronicleBattle(b));assert.deepEqual(getActor(restored,'astraea').supportFollowupState,{round:1,count:1});assert.equal(getActor(restored,'astraea').modeFollowUpBonus,.5);cast(restored,'elaine','$defend');assert.equal(follow(restored).length,1);cast(restored,'tobin','$defend');assert.equal(follow(restored).length,0);
});
test('Tobin keeps heat ATK through his finisher, then spends heat; overfire trades speed for ATK',()=>{
 const {b}=setup(),a=getActor(b,'tobin');cast(b,'tobin','tobin.stoke');assert.equal(a.resourceValues.forge_heat,2);assert.ok(battleStat(b.content,a,'speed')<11);cast(b,'tobin','tobin.hammer','enemy_0');assert.equal(a.resourceValues.forge_heat,3);cast(b,'tobin','tobin.quench','enemy_0');const damage=b.events.find(e=>e.type==='damage'&&e.sourceId==='tobin');assert.ok(damage.amount>Math.floor(31*3.4));assert.equal(a.resourceValues.forge_heat,0);assert.equal(abilityAvailability(b,a,b.content.abilities['tobin.quench']).ok,false);
});
test('thorn VFX use one formation animation while retaining hit outcomes and bounded timelines',()=>{
 const {b}=setup();cast(b,'iris','$defend');const timeline=combatTimeline(b.events,b.content,{speed:'fast'});const frames=timeline.frames.filter(f=>f.kind==='signature'&&f.presentation==='nature_vines');assert.equal(frames.length,1);assert.equal(frames[0].area,true);assert.ok(timeline.duration<4000);
});

test('Astraea reaction does not feed Aurora and an enemy support action cannot trigger her',()=>{
 const {b}=setup(['astraea','iris','aurora','tobin']);cast(b,'iris','$defend');assert.equal(follow(b).length,1);assert.equal(b.events.filter(e=>e.type==='reaction'&&e.sourceId==='aurora').length,0);const a=getActor(b,'astraea');b.round++;cast(b,'enemy_0','$defend');assert.equal(follow(b).length,0);assert.equal(a.supportFollowupState.round,1);
});
