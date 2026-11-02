import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {resolveCharacter} from '../src/core/progression.js';
import {createBattle,executeAction,getActor,basicAbility,DEFEND,abilityAvailability,targetsFor,selectedTargets} from '../src/core/battle.js';
import {battleStat,battleMaxMp,statusModifier} from '../src/core/stat-values.js';
import {resolveRankedAbility} from '../src/core/skill-resolver.js';
import {battlePresentation} from '../src/core/combat-modes.js';
import {validateContent} from '../src/core/content.js';
import {skillPresentation,passivePresentation} from '../src/ui/skill-copy.js';
import {skillPreviewOptions,skillCost} from '../src/ui/skill-presentation.js';
import {compactSkillScaling} from '../src/ui/combat-presentation.js';
import {seededRandom} from '../src/core/random.js';
import {snapshotChronicleBattle,restoreChronicleBattle} from '../src/core/chronicle-combat.js';
import {createDungeonRun,advanceDungeonWave} from '../src/core/dungeon.js';
const content=await loadContent(),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function fixture(party=['aldric','rivia','valery','elaine'],mutate=()=>{}){const c=structuredClone(content);mutate(c);const save=createGameSave(c);save.party=party;save.partyPresets[0].slots=[...party];save.unlockedCharacterIds=Object.keys(c.characters);const b=createBattle(c,save,'forest_patrol',seededRandom(81),{enemyLevel:1});for(const e of b.actors.filter(a=>a.team==='enemy')){e.hp=e.stats.maxHp=100000;e.stats.defense=e.stats.resistance=0;e.weaknesses=[];e.resistances={};}return {b,c,save};}
function use(b,id,ability,target,{phase='main',clear=true}={}){b.outcome=null;b.phase=phase;b.queue=[id,id==='enemy_0'?b.actors.find(a=>a.team==='party'&&a.hp>0).id:'enemy_0'];b.cursor=0;const a=getActor(b,id);if(clear)a.cooldowns={};const s=ability==='$attack'?basicAbility(a):ability==='$defend'?DEFEND:b.content.abilities[ability];executeAction(b,{actorId:id,abilityId:ability,targetId:target??(s.target==='enemy'?'enemy_0':id)});}
function nextRound(b){const a=getActor(b,'enemy_0');b.queue=[a.id];b.cursor=0;executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});}
const hits=(b,id)=>b.events.filter(e=>e.type==='damage'&&e.sourceId===id&&!e.periodic),status=(b,id,key)=>getActor(b,id).statuses.find(s=>s.id===key);
function grant(b,id,key,remaining=3){const d=b.content.statuses[key];getActor(b,id).statuses.push({id:key,remaining:d.persistent?null:remaining,stacks:1,sourceId:id,...(d.damageUses?{charges:d.damageUses}:{})});}
const charge=b=>getActor(b,'valery').resourceValues.wind_focus;

test('three recruits are formal gacha characters; previous saves migrate without granting ownership',()=>{const {c}=fixture();assert.deepEqual(validateContent(c),[]);const save=createGameSave(c);for(const id of ['aldric','rivia','valery']){assert.ok(c.banners.standard.characterPool.includes(id));delete save.characters[id];}const loaded=decodeGameSave(JSON.stringify(save),c);for(const id of ['aldric','rivia','valery']){assert.equal(loaded.characters[id].level,1);assert.ok(!loaded.unlockedCharacterIds.includes(id));}});
test('Iris, Artesia, Simon and Karin use one maximum but all applicable consumables are spent',()=>{
 const {b}=fixture(['arthur','iris','artesia','simon']);for(const id of ['empowered','destined_radiance','closing_argument','karin_oath'])grant(b,'arthur',id,10);const a=getActor(b,'arthur');near(statusModifier(b.content,a,'damageBonus'),.4);use(b,a.id,'$attack','enemy_0');assert.equal(hits(b,a.id)[0].amount,Math.floor(a.stats.attack*1.4));assert.equal(status(b,a.id,'empowered'),undefined);assert.equal(status(b,a.id,'destined_radiance').charges,2);assert.equal(status(b,a.id,'closing_argument').charges,1);use(b,a.id,'$attack','enemy_0');assert.equal(hits(b,a.id)[0].amount,Math.floor(a.stats.attack*1.3));assert.equal(status(b,a.id,'closing_argument'),undefined);
});
test('conditional shield amplification and next-hit multiplier compete with other buffs on each hit',()=>{
 const {b}=fixture(['arthur','iris','elaine','garrek']),a=getActor(b,'arthur'),e=getActor(b,'enemy_0');for(const id of ['empowered','siegebreaker','cavalry_momentum'])grant(b,a.id,id);e.shield=1000;use(b,a.id,'$attack',e.id);assert.equal(hits(b,a.id)[0].absorbed,Math.floor(a.stats.attack*2));assert.equal(status(b,a.id,'empowered'),undefined);assert.equal(status(b,a.id,'cavalry_momentum'),undefined);
 e.shield=0;grant(b,a.id,'empowered');use(b,a.id,'$attack',e.id);assert.equal(hits(b,a.id)[0].amount,Math.floor(a.stats.attack*1.4));
});
test('an AoE multi-hit consumes weaker charge buffs once and honors the largest on the whole action',()=>{
 const {b,c}=fixture(['arthur','iris','artesia','simon'],c=>{c.abilities.test_multi={id:'test_multi',name:'Test',target:'all_enemies',effects:[{type:'damage',damageType:'physical',element:'plain',multiplier:1,hits:2}]};c.characters.arthur.abilities.push('test_multi');});for(const key of ['empowered','destined_radiance','closing_argument'])grant(b,'arthur',key);use(b,'arthur','test_multi','enemy_0');assert.equal(hits(b,'arthur').length,6);assert.ok(hits(b,'arthur').every(h=>h.amount===Math.floor(getActor(b,'arthur').stats.attack*1.4)));assert.equal(status(b,'arthur','destined_radiance').charges,2);assert.equal(status(b,'arthur','closing_argument').charges,1);
});
test('counter attacks spend Iris and weaker charges separately without adding their amplification',()=>{
 const {b}=fixture(['takeshi','artesia','iris','elaine']);use(b,'takeshi','takeshi.stance');for(const key of ['empowered','destined_radiance'])grant(b,'takeshi',key);b.random=()=>0;use(b,'enemy_0','$attack','takeshi');assert.equal(status(b,'takeshi','empowered'),undefined);assert.equal(status(b,'takeshi','destined_radiance').charges,2);assert.ok(hits(b,'takeshi').length>0);
});
test('weakness and incoming-damage debuffs remain independent of the strongest skill amp',()=>{const {b}=fixture(['arthur','iris','artesia','elaine']),a=getActor(b,'arthur'),e=getActor(b,'enemy_0');grant(b,a.id,'empowered');grant(b,a.id,'destined_radiance');e.weaknesses=['light'];b.content.statuses.test_incoming={id:'test_incoming',name:'Test',kind:'debuff',modifiers:{damageTakenBonus:1}};e.statuses.push({id:'test_incoming',remaining:3});use(b,a.id,'$attack',e.id);assert.equal(hits(b,a.id)[0].amount,Math.floor(a.stats.attack*1.4*1.5*2));});
test('Aldric reaches permanent MP stacks no earlier than rounds 2, 6, 10 and cannot waste a fourth cast',()=>{
 const {b,c}=fixture(),a=getActor(b,'aldric'),rounds=[];assert.equal(a.cooldowns['aldric.reservoir'],1);assert.equal(abilityAvailability(b,a,c.abilities['aldric.reservoir']).ok,false);
 for(let i=1;i<=10;i++){assert.equal(b.round,i);if(abilityAvailability(b,a,c.abilities['aldric.reservoir']).ok){rounds.push(i);use(b,a.id,'aldric.reservoir',a.id,{clear:false});}if(i<10)nextRound(b);}
 assert.deepEqual(rounds,[2,6,10]);assert.equal(status(b,a.id,'archmage_reservoir').stacks,3);assert.equal(battleMaxMp(c,a),315);a.cooldowns={};assert.equal(abilityAvailability(b,a,c.abilities['aldric.reservoir']).ok,false);
});
test('Aldric MP conversion follows current maximum, is flat before MAG percent, and does not depend on current MP',()=>{
 const {b,c,save}=fixture(),a=getActor(b,'aldric');near(a.stats.magic,51);a.mp=100;use(b,a.id,'aldric.reservoir');assert.equal(a.mp,88);assert.equal(battleMaxMp(c,a),225);near(battleStat(c,a,'magic'),53.25);a.mp=0;near(battleStat(c,a,'magic'),53.25);grant(b,a.id,'calibrated');near(battleStat(c,a,'magic'),53.25*1.2);assert.equal(resolveCharacter(c,save,a.id).stats.maxMp,180);
});
test('Aldric caps native conversion at 25 MAG at 500 MP, rank increases MP buff and nuke matches Astoria coefficients',()=>{
 const {b,c}=fixture(undefined,c=>c.characters.aldric.stats.maxMp=500),a=getActor(b,'aldric');near(battleStat(c,a,'magic'),67);use(b,a.id,'aldric.reservoir');assert.equal(battleMaxMp(c,a),625);near(battleStat(c,a,'magic'),67);const ranked=resolveRankedAbility(c,a,'aldric.reservoir',5);near(ranked.effects[0].appliedModifiers.maxMp,.25*1.05**4);const ast=c.abilities['astoria.command'].effects[0],nuke=c.abilities['aldric.zenith'].effects[0];assert.equal(nuke.primaryMultiplier,ast.primaryMultiplier);assert.equal(nuke.multiplier,ast.multiplier);
});
test('Aldric AoE differentiates the selected primary from all other targets and MP/status survives dungeon waves',()=>{
 const {b,c,save}=fixture();use(b,'aldric','aldric.zenith','enemy_1');const a=getActor(b,'aldric'),damage=hits(b,a.id);assert.equal(damage.length,3);for(const h of damage)assert.equal(h.amount,Math.floor(51*(h.targetId==='enemy_1'?3.6:2)));
 const run=createDungeonRun(c,save,'gold_mine','easy',seededRandom(4));getActor(run.battle,'aldric').cooldowns={};use(run.battle,'aldric','aldric.reservoir');run.battle.outcome='victory';advanceDungeonWave(c,run);assert.equal(battleMaxMp(c,getActor(run.battle,'aldric')),225);assert.equal(status(run.battle,'aldric','archmage_reservoir').stacks,1);assert.ok(getActor(run.battle,'aldric').cooldowns['aldric.reservoir']>0);
});
test('Rivia burst and passive distinguish all four fixed slots, including empty slots',()=>{
 for(let slot=0;slot<4;slot++){const party=['arthur','elaine','iris'];party.splice(slot,0,'rivia');const {b,c}=fixture(party),a=getActor(b,'rivia'),odd=slot%2===0;near(battleStat(c,a,'attack'),30*(odd?1.2:1.15));const skill=resolveRankedAbility(c,a,'rivia.horizon');assert.equal(skill.target,odd?'enemy':'all_enemies');use(b,a.id,skill.id,'enemy_1');assert.equal(hits(b,a.id).length,odd?1:3);assert.ok(hits(b,a.id).every(h=>h.amount===Math.floor(30*(odd?1.2:1.15)*(odd?3.6:2))));}
 const {b}=fixture([null,'rivia',null,'elaine']);assert.equal(resolveRankedAbility(b.content,getActor(b,'rivia'),'rivia.horizon').target,'all_enemies');
});
test('Rivia cache re-resolves parity, targeting and Rank without double growth',()=>{
 const {b,c}=fixture(['rivia','aldric','valery','elaine']),a=getActor(b,'rivia');a.skillRanks={'rivia.horizon':5};const odd=resolveRankedAbility(c,a,'rivia.horizon');a.formationSlot=1;const even=resolveRankedAbility(c,a,odd);assert.equal(even.target,'all_enemies');assert.equal(even.effects[0].multiplier,2);assert.equal(even.effects[0].rankDamageFactor,1.1**4);near(battleStat(c,a,'resistance'),17*1.15);assert.equal(selectedTargets(b,a,c.abilities['rivia.horizon'],'enemy_0').length,3);
});
test('Valery uses MAG, receives mode MAG bonus, counts own/allied/enemy Guard, and cannot charge outside mode',()=>{
 const {b,c}=fixture(),a=getActor(b,'valery');use(b,'enemy_0','$defend');assert.equal(charge(b),0);use(b,a.id,'valery.focus');near(battleStat(c,a,'magic'),36*1.4);near(battleStat(c,a,'attack'),12);use(b,a.id,'$defend');use(b,'elaine','$defend');use(b,'enemy_0','$defend');assert.equal(charge(b),3);assert.equal(battlePresentation(b.actors),null);
});
test('AoE shield charges once, unchanged weaker shield does not charge, and actual enemy shield counts',()=>{
 const {b,c}=fixture();use(b,'valery','valery.focus');use(b,'elaine','elaine.sanctuary');assert.equal(charge(b),1);use(b,'elaine','elaine.sanctuary');assert.equal(charge(b),1);use(b,'elaine','elaine.shield','valery');assert.equal(charge(b),2);use(b,'elaine','elaine.shield','valery');assert.equal(charge(b),2);c.abilities.test_shield={id:'test_shield',name:'Test',target:'self',effects:[{type:'shield',flat:100}]};getActor(b,'enemy_0').abilities.push('test_shield');use(b,'enemy_0','test_shield');assert.equal(charge(b),3);
});
test('Guard plus a shield in the same action charges once; stack cap is six and fallen Valery does not charge',()=>{
 const {b}=fixture();use(b,'valery','valery.focus');const e=getActor(b,'elaine');e.exclusiveGear={template:{passive:{type:'after_skill_shield',name:'Test',description:'Test',abilityIds:['$defend'],target:'self',stat:'defense',ratio:1}}};use(b,e.id,'$defend');assert.equal(charge(b),1);assert.ok(e.shield>0);for(let i=0;i<9;i++)use(b,e.id,'$defend');assert.equal(charge(b),6);getActor(b,'valery').hp=0;getActor(b,'valery').resourceValues.wind_focus=2;use(b,e.id,'$defend');assert.equal(charge(b),0);
});
test('Valery burst spends every stack, retains mode MAG for damage, then exits and clears stale stacks',()=>{
 const {b,c}=fixture(),a=getActor(b,'valery');use(b,a.id,'valery.focus');a.resourceValues.wind_focus=6;use(b,a.id,'valery.tempest','enemy_0');assert.equal(hits(b,a.id)[0].damageType,'magical');assert.equal(hits(b,a.id)[0].amount,Math.floor(36*1.4*6.6));assert.equal(charge(b),0);assert.equal(a.activeMode,undefined);assert.equal(abilityAvailability(b,a,c.abilities['valery.tempest']).ok,false);a.resourceValues.wind_focus=5;use(b,a.id,'valery.focus');assert.equal(charge(b),0);assert.equal(abilityAvailability(b,a,c.abilities['valery.tempest']).ok,false);
});
test('Valery timed mode expires after three rounds and snapshots preserve charges without transient scopes',()=>{
 const {b,c}=fixture(),a=getActor(b,'valery');use(b,a.id,'valery.focus');use(b,'elaine','$defend');const copy=restoreChronicleBattle(c,snapshotChronicleBattle(b));assert.equal(getActor(copy,a.id).resourceValues.wind_focus,1);assert.equal(copy.supportChargeScope,undefined);nextRound(b);nextRound(b);assert.equal(a.activeMode,'wind_aim');nextRound(b);assert.equal(a.activeMode,undefined);assert.equal(charge(b),0);
});
test('copy and previews expose strongest amp rule, Aldric setup, Rivia slot choices and Valery mode exit',()=>{
 const {b,c}=fixture();assert.match(skillPresentation(c.abilities['iris.formula'],getActor(b,'aldric'),c).rules.join(' '),/mức lớn nhất/);assert.match(skillCost(c.abilities['aldric.reservoir'],getActor(b,'aldric')),/Khởi đầu: 1 vòng/);const r=getActor(b,'rivia');assert.ok(skillPreviewOptions(c.abilities['rivia.horizon'],r,c).some(x=>x.key==='formationPosition'));assert.match(skillPresentation(c.abilities['rivia.horizon'],r,c,{formationPosition:4}).facts.join(' '),/200%/);assert.match(skillPresentation(c.abilities['valery.tempest'],getActor(b,'valery'),c).facts.join(' '),/rời Thế Ngắm/);for(const id of ['aldric','rivia','valery'])assert.ok(passivePresentation(getActor(b,id),c).facts.length>0);
});
test('invalid new passive, formation metadata, initial CD and mode resets fail content validation',()=>{
 for(const edit of [c=>c.characters.aldric.passive.cap=-1,c=>c.characters.rivia.passive.even.modifiers.attack=2,c=>c.abilities['aldric.reservoir'].initialCooldown=-1,c=>c.abilities['rivia.horizon'].formationVariants.even.target='ally',c=>c.characters.valery.combatModes.wind_aim.clearResourceOnExit='missing']){const c=structuredClone(content);edit(c);assert.ok(validateContent(c).length>0);}
});

test('largest eligible amp is re-evaluated after the first hit removes the shield',()=>{
 const {b}=fixture(['arthur','iris','elaine','garrek'],c=>{c.abilities.test_double={id:'test_double',name:'Test',target:'enemy',effects:[{type:'damage',damageType:'physical',element:'plain',multiplier:1,hits:2}]};c.characters.arthur.abilities.push('test_double');});
 grant(b,'arthur','empowered');grant(b,'arthur','siegebreaker');getActor(b,'enemy_0').shield=1;use(b,'arthur','test_double','enemy_0');const h=hits(b,'arthur');assert.equal(h[0].amount+h[0].absorbed,68);assert.equal(h[1].amount,47);assert.equal(status(b,'arthur','empowered'),undefined);
});
