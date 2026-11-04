import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave} from '../src/core/game-save.js';
import {createArenaBattle} from '../src/core/arena.js';
import {createBattle,executeAction,forecastBattleAction,planAutoBattleTurn} from '../src/core/battle.js';
import {seededRandom} from '../src/core/random.js';
import {snapshotChronicleBattle,restoreChronicleBattle} from '../src/core/chronicle-combat.js';
import {lifeDebt} from '../src/core/life-debt.js';
import {validateContent} from '../src/core/content.js';
import {skillPresentation} from '../src/ui/skill-copy.js';
import {statusDetails} from '../src/ui/combat-presentation.js';
const base=await loadContent();
const debt=(ratio)=>({type:'status',status:'life_mortgage',...(ratio===undefined?{}:{debtMaxHpRatio:ratio})});
function fixture(){const c=structuredClone(base),b=createBattle(c,createGameSave(c),'forest_patrol',seededRandom(7),{enemyLevel:1});
 for(const a of b.actors){a.passive=null;a.gearEffects=[];a.statuses=[];a.hp=a.stats.maxHp=200;a.mp=a.stats.maxMp=100;a.cooldowns={};}
 const allies=b.actors.filter(a=>a.team==='party');return {b,c,a:allies[0],ally:allies[1],t:b.actors.find(a=>a.team==='enemy')};}
function command(b,a,t,effects,target){const id='test.debt.'+a.id;b.content.abilities[id]={id,name:'Kiểm tra',target:target??(a.team===t.team?'ally':'enemy'),effects,cost:{mp:0}};if(!a.abilities.includes(id))a.abilities.push(id);return {actorId:a.id,abilityId:id,targetId:t.id};}
function cast(b,a,t,effects,target){const cmd=command(b,a,t,effects,target);b.queue=[a.id,b.actors.find(x=>x.id!==a.id&&x.id!==t.id).id];b.cursor=0;executeAction(b,cmd);}
test('debt adds in HP, caps at half Max HP and snapshots capacity without resizing old debt',()=>{
 const {b,a,t}=fixture();cast(b,t,a,[debt()]);assert.equal(lifeDebt(a),50);cast(b,t,a,[debt()]);cast(b,t,a,[debt()]);assert.equal(lifeDebt(a),100);assert.equal(a.hp,200);
 a.stats.maxHp=400;assert.equal(lifeDebt(a),100);cast(b,t,a,[debt(.15)]);assert.equal(lifeDebt(a),160);
 a.stats.maxHp=100;a.hp=100;cast(b,t,a,[debt()]);assert.equal(lifeDebt(a),160,'capacity reduction cannot erase old debt');
 assert.equal(a.statuses.filter(s=>s.id==='life_mortgage').length,1);
});
test('healing repays debt first, overflows to HP, and works at full HP',()=>{
 const {b,a,ally,t}=fixture();a.hp=80;cast(b,t,a,[debt(.2)]);cast(b,ally,a,[{type:'heal',flat:25}]);assert.equal(a.hp,80);assert.equal(lifeDebt(a),15);
 cast(b,ally,a,[{type:'heal',flat:50}]);assert.equal(a.hp,115);assert.equal(lifeDebt(a),0);assert.equal(a.statuses.some(s=>s.id==='life_mortgage'),false);
 a.hp=200;cast(b,t,a,[debt()]);const heals=b.events.filter(e=>e.type==='heal').length;cast(b,ally,a,[{type:'heal',flat:30}]);assert.equal(lifeDebt(a),20);assert.equal(a.hp,200);assert.equal(b.events.filter(e=>e.type==='heal').length,heals);
 assert.ok(b.log.some(s=>s.includes('thanh toán 30 Thế Chấp')));
});
test('Wound reduces healing before debt; pure repayment never procs healed MP hooks',()=>{
 const {b,a,ally,t}=fixture();a.hp=80;a.mp=0;a.passive={type:'ally_heal_mp',ratio:.1};
 a.gearEffects=[{id:'test.chime',name:'Chuông',effectGroup:'test.chime',oncePerRound:true,effect:{type:'healed_mp',amount:2}}];
 cast(b,t,a,[debt(),{type:'status',status:'deep_wound',duration:2}]);cast(b,ally,a,[{type:'heal',flat:50}]);assert.equal(lifeDebt(a),20);assert.equal(a.hp,80);assert.equal(a.mp,0);assert.equal(a.gearEffectProcRounds?.['test.chime'],undefined);
 cast(b,ally,a,[{type:'heal',flat:50}]);assert.equal(a.hp,90);assert.equal(a.mp,12,'10 passive + 2 gear only on actual healing');
});
test('Ward blocks hostile debt and cleanse removes it without healing or repayment events',()=>{
 const {b,a,ally,t}=fixture();cast(b,ally,a,[{type:'status',status:'effect_ward'}]);cast(b,t,a,[debt()]);assert.equal(lifeDebt(a),0);assert.equal(a.statuses.length,0);
 cast(b,t,a,[debt()]);const paid=b.events.filter(e=>e.type==='life_debt_paid').length;cast(b,ally,a,[{type:'cleanse',all:true}]);assert.equal(lifeDebt(a),0);assert.equal(b.events.filter(e=>e.type==='life_debt_paid').length,paid);
});
test('lifesteal pays debt using actual HP damage and does not restore HP until debt clears',()=>{
 const {b,a,t}=fixture();a.hp=80;cast(b,t,a,[debt()]);cast(b,a,t,[{type:'damage',damageType:'physical',element:'plain',multiplier:1,lifeStealRatio:1}]);
 const damage=b.events.filter(e=>e.type==='damage'&&e.sourceId===a.id).at(-1).amount;
 assert.ok(damage>0&&damage<50);assert.equal(lifeDebt(a),50-damage);assert.equal(a.hp,80);
});
test('full-HP round regeneration gear still pays debt and uses its cooldown',()=>{
 const {b,a,t}=fixture();cast(b,t,a,[debt()]);
 a.gearEffects=[{id:'test.spring',name:'Suối',effectGroup:'test.spring',hook:'round_start',condition:'missing_hp',cooldownRounds:2,effect:{type:'heal',ratio:.05}}];
 b.queue=[t.id];b.cursor=0;executeAction(b,command(b,t,t,[],'self'));
 assert.equal(lifeDebt(a),40);assert.equal(a.hp,200);assert.equal(a.gearEffectReadyRounds['test.spring'],b.round+2);
});
test('regen in beginTurn pays debt even when HP is full; skipped and extra turns never expire debt',()=>{
 const {b,c,a,ally,t}=fixture();cast(b,t,a,[debt()]);c.statuses.test_regen={id:'test_regen',kind:'buff',regen:.05,persistent:true};a.statuses.push({id:'test_regen',remaining:null,sourceId:a.id});
 const cmd=command(b,ally,ally,[],'self');b.queue=[ally.id,a.id,t.id];b.cursor=0;executeAction(b,cmd);assert.equal(lifeDebt(a),40);
 a.statuses=a.statuses.filter(s=>s.id!=='test_regen');a.statuses.push({id:'stunned',remaining:1,sourceId:t.id});b.queue=[ally.id,a.id,t.id];b.cursor=0;executeAction(b,cmd);assert.equal(lifeDebt(a),40);assert.equal(b.queue[b.cursor],t.id);
 b.phase='extra';cast(b,a,a,[],'self');assert.equal(lifeDebt(a),40);
});
test('snapshot restores exact debt and forecast pays only the trial copy',()=>{
 const {b,c,a,ally,t}=fixture();cast(b,t,a,[debt()]);const before=b.random.getState();const cmd=command(b,ally,a,[{type:'heal',flat:20}]);b.queue=[ally.id,a.id];b.cursor=0;
 const trial=forecastBattleAction(b,cmd);assert.equal(lifeDebt(trial.actors.find(x=>x.id===a.id)),30);assert.equal(lifeDebt(a),50);assert.equal(b.random.getState(),before);
 const restored=restoreChronicleBattle(c,snapshotChronicleBattle(b));assert.equal(lifeDebt(restored.actors.find(x=>x.id===a.id)),50);
});
test('death and final outcomes clear debt, continuing victory preserves it',()=>{
 for(const continuing of [false,true]){const {b,a,t}=fixture();cast(b,t,a,[debt()]);b.continuesOnVictory=continuing;cast(b,a,t,[{type:'damage',damageType:'physical',element:'plain',multiplier:1000}],'all_enemies');assert.equal(b.outcome,'victory');assert.equal(lifeDebt(a),continuing?50:0);}
 const {b,a,t}=fixture();cast(b,t,a,[debt()]);cast(b,t,a,[{type:'damage',damageType:'physical',element:'plain',multiplier:1000}]);assert.equal(a.hp,0);assert.equal(lifeDebt(a),0);
});
test('presentation shows exact debt and validator rejects invalid ratios and timed debt',()=>{
 const {b,c,a,t}=fixture();cast(b,t,a,[debt()]);const details=statusDetails(a.statuses.find(s=>s.id==='life_mortgage'),a,b,c);assert.match(details.lines.join(' '),/50 HP/);assert.match(details.duration,/thanh toán/);
 assert.match(skillPresentation({target:'all_enemies',effects:[debt(.15)]},a,c).facts.join(' '),/15%/);assert.deepEqual(validateContent(base),[]);
 c.statuses.life_mortgage.healingDebt.capMaxHpRatio=.9;assert.ok(validateContent(c).some(e=>e.includes('healing debt')));c.statuses.life_mortgage.healingDebt.capMaxHpRatio=.5;
 c.abilities.test_invalid={id:'test_invalid',name:'Test',target:'enemy',effects:[{...debt(),duration:2,debtMaxHpRatio:.9}],skillLineId:'test_invalid',growthProfile:'fixed',rankable:false,fixedReason:'Test'};assert.ok(validateContent(c).some(e=>e.includes('healing debt')));
});

test('auto-battle values paying debt at full HP when attacks cannot make progress',()=>{
 const {b,a,ally,t}=fixture();cast(b,t,a,[debt(),debt()]);
 for(const enemy of b.actors.filter(x=>x.team==='enemy')){enemy.stats.defense=100000;enemy.stats.resistance=100000;}
 const heal=command(b,ally,a,[{type:'heal',flat:60}]);ally.abilities=[heal.abilityId];b.queue=[ally.id,a.id];b.cursor=0;
 assert.equal(planAutoBattleTurn(b).abilityId,heal.abilityId);
});

test('PvP mirror keeps debt on the correct unique actor and permits enemy-side repayment',()=>{
 const c=structuredClone(base);
 for(const [id,target,effects]of [['test.mortgage','enemy',[debt()]],['test.heal','self',[{type:'heal',flat:10}]]]){c.abilities[id]={id,name:'Ki?m tra',target,effects,skillLineId:id,growthProfile:'fixed',rankable:false,fixedReason:'Ki?m tra'};c.characters.arthur.abilities.push(id);}
 const save=createGameSave(c),b=createArenaBattle(c,save);
 const own=b.actors.find(a=>a.team==='party'&&a.characterId==='arthur'),foe=b.actors.find(a=>a.team==='enemy'&&a.characterId==='arthur');
 assert.ok(own&&foe);for(const a of b.actors){a.statuses=[];a.passive=null;}
 b.queue=[own.id,foe.id];b.cursor=0;executeAction(b,{actorId:own.id,abilityId:'test.mortgage',targetId:foe.id});assert.ok(lifeDebt(foe)>0);assert.equal(lifeDebt(own),0);
 const before=lifeDebt(foe);b.queue=[foe.id,own.id];b.cursor=0;executeAction(b,{actorId:foe.id,abilityId:'test.heal',targetId:foe.id});assert.equal(lifeDebt(foe),before-10);assert.equal(lifeDebt(own),0);
});
test('Agony cannot repay debt, and a dead target cannot be healed to repay it',()=>{
 const {b,a,ally,t}=fixture();cast(b,t,a,[debt()]);a.group='agony';a.agony={damageReduction:.3};a.agonyState={active:true,initialMaxHp:200,expiresAfterRound:99};a.hp=0;
 cast(b,ally,a,[{type:'heal',flat:100}]);assert.equal(a.hp,0);assert.equal(lifeDebt(a),50);
 delete a.agonyState;cast(b,ally,ally,[],'self');assert.equal(lifeDebt(a),0,'a truly defeated owner loses debt');
});
