import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction} from '../src/core/battle.js';
import {createArenaBattle} from '../src/core/arena.js';
import {battleStat,statusModifier} from '../src/core/stat-values.js';
import {activeTurnOrderField,expireTurnOrderField,copyTurnOrderField} from '../src/core/turn-order.js';
import {hasTrueStrike} from '../src/core/evasion.js';
import {battlePresentation,checkCombatMode} from '../src/core/combat-modes.js';
import {skillPresentation} from '../src/ui/skill-copy.js';
import {compactSkillScaling} from '../src/ui/combat-presentation.js';
const content=await loadContent(),noop={write(){},emit(){},restore(){}};
function campaign(party){const c=createGameSave(content);c.party=party;c.unlockedCharacterIds=[...new Set([...c.unlockedCharacterIds,...party])];return c;}
function actor(b,team,id){return b.actors.find(a=>a.team===team&&(a.characterId??a.id)===id);}
function cast(b,a,id,target=a){b.outcome=null;b.phase='main';b.queue=[a.id,...b.actors.filter(x=>x.id!==a.id&&x.hp>0).map(x=>x.id)];b.mainTurnOrder=[...b.queue];b.cursor=0;executeAction(b,{actorId:a.id,abilityId:id,targetId:target.id});}
test('Arena time distortion changes SPD as a field, without team priority or status entries',()=>{
 const b=createArenaBattle(content,campaign(['monica','iris','garrek','elaine']),'mirror',1),m=actor(b,'party','monica'),enemy=actor(b,'enemy','monica');
 for(const a of b.actors){a.statuses=[];a.baseStats??={...a.stats};a.stats.speed=a.baseStats.speed=20;}
 enemy.stats.speed=enemy.baseStats.speed=100;
 const statuses=structuredClone(b.actors.map(a=>a.statuses));cast(b,m,'monica.distortion');
 assert.equal(b.turnOrderField.kind,'speed_shift');assert.equal(battleStat(b.content,m,'speed'),23);assert.equal(battleStat(b.content,enemy,'speed'),85);
 assert.equal(b.queue[b.cursor],enemy.id);assert.deepEqual(b.actors.map(a=>a.statuses),statuses);assert.equal(statusModifier(b.content,m,'speed'),0);
 const copy=copyTurnOrderField(b.turnOrderField);assert.deepEqual(copy,b.turnOrderField);assert.throws(()=>copyTurnOrderField({...copy,allySpeed:2}));
 const info=skillPresentation(b.content.abilities['monica.distortion'],m,b.content);assert.ok(info.facts.some(x=>x.includes('+15%')&&x.includes('−15%')));assert.ok(!info.facts.some(x=>x.includes('Đồng minh trước')));assert.ok(info.rules.some(x=>x.includes('không phải buff/debuff')));assert.ok(compactSkillScaling(b.content.abilities['monica.distortion'],m,m,b.content,b).includes('SPD'));
 b.round=b.turnOrderField.expiresAfterRound;expireTurnOrderField(b,noop,true);assert.equal(activeTurnOrderField(b),null);assert.equal(battleStat(b.content,m,'speed'),20);assert.equal(battleStat(b.content,enemy,'speed'),100);
});
test('enemy field is relative to its caster, replaces the old field and PvE keeps the original priority',()=>{
 const c=campaign(['monica','iris','garrek','elaine']),b=createArenaBattle(content,c,'mirror',1),m=actor(b,'party','monica'),e=actor(b,'enemy','monica');
 const ms=battleStat(b.content,m,'speed'),es=battleStat(b.content,e,'speed');cast(b,m,'monica.distortion');cast(b,e,'monica.distortion');assert.equal(b.turnOrderField.priorityTeam,'enemy');assert.equal(battleStat(b.content,m,'speed'),ms*.85);assert.equal(battleStat(b.content,e,'speed'),es*1.15);
 const pve=createBattle(content,c,'forest_patrol',()=>.99),pm=actor(pve,'party','monica');const before=battleStat(content,pm,'speed');cast(pve,pm,'monica.distortion');assert.equal(pve.turnOrderField.kind,'team_priority');assert.equal(battleStat(content,pm,'speed'),before);assert.equal(content.abilities['monica.distortion'].effects[0].kind,undefined);
});
test('Yufina mode is card-local in PvE and grants actual unavoidable attacks only while active',()=>{
 const b=createBattle(content,campaign(['yufina','gahallad']),'forest_patrol',()=>0),y=actor(b,'party','yufina'),target=b.actors.find(a=>a.team==='enemy');
 target.passive=structuredClone(content.characters.chelsea.passive);target.stats.speed=100;target.baseStats={...target.stats,speed:100};target.hp=target.stats.maxHp=10000;target.shield=0;target.statuses=[];
 cast(b,y,'$attack',target);assert.ok(b.events.some(e=>e.type==='dodge'));cast(b,y,'yufina.ignite');assert.equal(hasTrueStrike(b.content,y),true);assert.equal(y.combatModes.radiant_fists.presentationScope,'none');assert.equal(battlePresentation(b.actors),null);
 const hp=target.hp;cast(b,y,'$attack',target);assert.ok(target.hp<hp);assert.equal(b.events.some(e=>e.type==='dodge'),false);
 y.modeExpiresAfterRound=b.round;checkCombatMode(b,y,'round_end',noop);assert.equal(hasTrueStrike(b.content,y),false);
 const g=actor(b,'party','gahallad');cast(b,g,'gahallad.mount');assert.equal(hasTrueStrike(b.content,g),true);cast(b,g,'$attack',target);assert.equal(b.events.some(e=>e.type==='dodge'),false);cast(b,g,'gahallad.mount');assert.equal(hasTrueStrike(b.content,g),false);
});
test('Astraea ignores Defend without spending her allowance, while shields and other support still trigger',()=>{
 const b=createBattle(content,campaign(['astraea','iris','elaine']),'forest_patrol',()=>.99),a=actor(b,'party','astraea'),i=actor(b,'party','iris'),e=actor(b,'party','elaine');for(const x of b.actors.filter(x=>x.team==='enemy'))x.hp=x.stats.maxHp=100000;
 const count=()=>b.events.filter(x=>x.type==='reaction'&&x.abilityId==='astraea.thorns').length;
 cast(b,i,'$defend');assert.equal(count(),0);assert.equal(a.supportFollowupState,undefined);cast(b,i,'iris.formula',a);assert.equal(count(),1);cast(b,a,'astraea.garden');cast(b,e,'$defend');assert.equal(count(),0);assert.equal(a.supportFollowupState.count,1);cast(b,e,'elaine.shield',a);assert.equal(count(),1);assert.equal(a.supportFollowupState.count,2);
});

