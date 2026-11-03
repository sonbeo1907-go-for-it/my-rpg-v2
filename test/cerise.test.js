import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,getActor} from '../src/core/battle.js';
import {resolveRankedAbility} from '../src/core/skill-resolver.js';
import {seededRandom} from '../src/core/random.js';
import {battleStat} from '../src/core/stat-values.js';
import {evasionChance} from '../src/core/evasion.js';
import {validateContent} from '../src/core/content.js';
const base=await loadContent();

const SUPPORT={
 'test.support':{id:'test.support',name:'Hiệu lệnh thử',target:'self',effects:[{type:'resource',resource:'mp',amount:1}],skillLineId:'test.support',growthProfile:'fixed',rankable:false,fixedReason:'kiểm thử'},
 'test.strike':{id:'test.strike',name:'Đòn thử',target:'enemy',effects:[{type:'damage',damageType:'physical',element:'wind',multiplier:1}],skillLineId:'test.strike',growthProfile:'fixed',rankable:false,fixedReason:'kiểm thử'}
};

function fixture(){
 const content=structuredClone(base);Object.assign(content.abilities,SUPPORT);
 const save=createGameSave(content);save.party=['cerise','arthur','iris','takeshi'];save.partyPresets[0].slots=[...save.party];
 save.unlockedCharacterIds=Object.keys(content.characters);
 const battle=createBattle(content,save,'forest_patrol',seededRandom(7),{enemyLevel:1});
 const cerise=getActor(battle,'cerise'),enemy=battle.actors.find(actor=>actor.team==='enemy');
 enemy.hp=enemy.stats.maxHp=100000;enemy.stats.attack=0;enemy.abilities=[...enemy.abilities,'test.support','test.strike'];
 return {battle,content,cerise,enemy,ally:getActor(battle,'arthur')};
}
function cast(battle,actorId,abilityId,targetId,round){
 if(round!==undefined)battle.round=round;
 battle.outcome=null;battle.queue=[actorId];battle.cursor=0;battle.phase='main';
 executeAction(battle,{actorId,abilityId,targetId});
}
const debuffs=(content,actor)=>actor.statuses.filter(status=>content.statuses[status.id].kind==='debuff');
const counters=battle=>battle.events.filter(event=>event.type==='reaction'&&event.kind==='counter');

test('Cerise carries the Capital Knight affiliation and her own designation',()=>{
 const c=base.characters.cerise;
 assert.equal(c.affiliation,'capital_knights');
 assert.deepEqual(c.tags,['capital_knights','recon_knight']);
 assert.equal(c.element,'wind');assert.equal(c.roleGroup,'physical_dps');
 assert.deepEqual(c.abilities,['cerise.slash','cerise.strike','cerise.formation']);
 assert.equal(c.passive.type,'enemy_support_counter');
 assert.equal(c.passive.cooldownRounds,2);
 // counter ability stays automatic, so it must not be a command
 assert.equal(base.abilities['cerise.riposte'].activation,'passive');
 assert.ok(!c.abilities.includes('cerise.riposte'));
});

test('an enemy support skill cleanses every debuff and triggers the 420% counter',()=>{
 const {battle,content,cerise,enemy}=fixture();
 cerise.statuses.push({id:'cerise_disarm',remaining:2,stacks:1});
 const before=enemy.hp;
 cast(battle,enemy.id,'test.support',enemy.id);
 assert.equal(debuffs(content,cerise).length,0,'mọi debuff phải bị giải');
 assert.equal(counters(battle).length,1,'phải phản đòn đúng một lần');
 const damage=battle.events.filter(event=>event.type==='damage'&&event.sourceId===cerise.id);
 assert.ok(damage.length>0,'đòn phản kích phải gây sát thương');
 assert.ok(enemy.hp<before);
 assert.ok(battle.log.some(line=>line.includes('giải 1 hiệu ứng bất lợi')));
});

test('defend, damaging skills and ally skills never trigger the counter',()=>{
 const {battle,cerise,enemy,ally}=fixture();
 cast(battle,enemy.id,'$defend',enemy.id);
 assert.equal(counters(battle).length,0,'Phòng thủ không được kích');
 cast(battle,enemy.id,'test.strike',cerise.id);
 assert.equal(counters(battle).length,0,'kỹ năng có sát thương không được kích');
 ally.abilities=[...ally.abilities,'test.support'];
 cast(battle,ally.id,'test.support',ally.id);
 assert.equal(counters(battle).length,0,'kỹ năng của đồng đội không được kích');
});

test('the counter respects its shared two-round cooldown',()=>{
 const {battle,cerise,enemy}=fixture();
 cast(battle,enemy.id,'test.support',enemy.id,1);
 assert.equal(counters(battle).length,1);
 cast(battle,enemy.id,'test.support',enemy.id,2);
 assert.equal(counters(battle).length,0,'vòng kế tiếp vẫn trong hạn mức');
 assert.equal(debuffs(base,cerise).length,0);
 cast(battle,enemy.id,'test.support',enemy.id,3);
 assert.equal(counters(battle).length,1,'đủ hai vòng thì kích lại');
});

test('Viễn Trinh Xuất Kích grants +30% ATK and 50% evasion for three of her turns',()=>{
 const {battle,content,cerise,enemy}=fixture();
 const attackBefore=battleStat(content,cerise,'attack');
 assert.equal(evasionChance(cerise,{damageType:'physical'}),0);
 assert.equal(evasionChance(cerise,{damageType:'magical'}),0);
 cast(battle,cerise.id,'cerise.formation',cerise.id);
 assert.equal(cerise.activeMode,'recon_mode');
 assert.ok(Math.abs(battleStat(content,cerise,'attack')-attackBefore*1.3)<1e-9,'+30% ATK');
 assert.equal(evasionChance(cerise,{damageType:'physical'}),0.5);
 assert.equal(evasionChance(cerise,{damageType:'magical'}),0.5);
 assert.equal(cerise.modeTurnsRemaining,2,'lượt thi triển tính là lượt đầu');
 cast(battle,cerise.id,'$attack',enemy.id);
 assert.equal(cerise.activeMode,'recon_mode','còn lượt thứ hai');
 cast(battle,cerise.id,'$attack',enemy.id);
 assert.equal(cerise.activeMode,undefined,'hết lượt thứ ba thì rời dạng');
 assert.equal(evasionChance(cerise,{damageType:'physical'}),0);
 assert.ok(Math.abs(battleStat(content,cerise,'attack')-attackBefore)<1e-9,'ATK trở lại sau khi rời dạng');
});

test('a stunned turn still counts against the mode duration',()=>{
 const {battle,cerise,ally}=fixture();
 cast(battle,cerise.id,'cerise.formation',cerise.id);
 assert.equal(cerise.modeTurnsRemaining,2);
 cerise.statuses.push({id:'stunned',remaining:1,stacks:1});
 battle.outcome=null;battle.queue=[ally.id,cerise.id];battle.cursor=0;battle.phase='main';
 executeAction(battle,{actorId:ally.id,abilityId:'$defend',targetId:ally.id});
 assert.ok(battle.log.some(line=>line.includes('bị choáng')),'lượt phải bị bỏ qua');
 assert.equal(cerise.modeTurnsRemaining,1,'lượt bị choáng vẫn trừ thời hạn dạng');
 assert.equal(cerise.activeMode,'recon_mode');
});

test('skill rank raises the mode ATK bonus and the damage coefficients',()=>{
 const {content,cerise}=fixture();
 cerise.skillRanks={'cerise.formation':1};
 const rank1=resolveRankedAbility(content,cerise,content.abilities['cerise.formation']);
 assert.ok(Math.abs(rank1.effects[0].modeAppliedModifiers.attack-0.3)<1e-9);
 cerise.skillRanks={'cerise.formation':2};
 const rank2=resolveRankedAbility(content,cerise,content.abilities['cerise.formation']);
 assert.ok(Math.abs(rank2.effects[0].modeAppliedModifiers.attack-0.3*1.05)<1e-9,'stat buff ×1.05 mỗi Rank');
 cerise.skillRanks={'cerise.slash':2};
 const slash=resolveRankedAbility(content,cerise,content.abilities['cerise.slash']);
 assert.ok(Math.abs(slash.effects[0].rankDamageFactor-1.1)<1e-9,'damage ×1.1 mỗi Rank');
});

test('Nhát Chém Chớp cannot be evaded while Lướt Gió Cắt still can',()=>{
 const {content,cerise}=fixture();
 const strike=resolveRankedAbility(content,cerise,content.abilities['cerise.strike']).effects[0];
 const slash=resolveRankedAbility(content,cerise,content.abilities['cerise.slash']).effects[0];
 const dodgy={stats:{speed:10},passive:{evasion:{baseChance:.5,perBaseSpeed:0,cap:.5,damageTypes:['physical']}}};
 assert.equal(strike.unavoidable,true);
 assert.equal(evasionChance(dodgy,strike),0);
 assert.equal(evasionChance(dodgy,slash),0.5);
});

test('MAG reduction debuff is a reusable -20% magic modifier',()=>{
 const status=base.statuses.cerise_disarm;
 assert.equal(status.kind,'debuff');
 assert.equal(status.modifiers.magic,-0.2);
 const {battle,content,cerise,enemy}=fixture();
 enemy.stats.magic=20;
 cast(battle,cerise.id,'cerise.slash',enemy.id);
 const applied=enemy.statuses.find(status=>status.id==='cerise_disarm');
 assert.ok(applied,'đòn đánh phải gắn hiệu ứng giảm MAG');
 assert.ok(Math.abs(battleStat(content,enemy,'magic')-16)<1e-9,'MAG còn 80%');
});

test('Cerise content passes every schema check',()=>{
 const content=structuredClone(base);
 assert.deepEqual(validateContent(content),[]);
});
