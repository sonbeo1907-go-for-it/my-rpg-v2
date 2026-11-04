import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,executeEnemyTurn,activeActor,getActor} from '../src/core/battle.js';
import {createArenaBattle} from '../src/core/arena.js';
import {seededRandom} from '../src/core/random.js';
import {battleStat} from '../src/core/stat-values.js';
import {validateContent} from '../src/core/content.js';
const base=await loadContent();

const UTIL={
 'test.barrier':{id:'test.barrier',name:'Khiên thử',target:'self',effects:[{type:'shield',flat:60}],skillLineId:'test.barrier',growthProfile:'fixed',rankable:false,fixedReason:'kiểm thử'},
 'test.strike':{id:'test.strike',name:'Đòn thử',target:'enemy',effects:[{type:'damage',damageType:'physical',element:'wind',multiplier:1}],skillLineId:'test.strike',growthProfile:'fixed',rankable:false,fixedReason:'kiểm thử'}
};

function fixture(encounterId='forest_patrol',rank){
 const content=structuredClone(base);Object.assign(content.abilities,UTIL);
 const save=createGameSave(content);
 save.party=['flammelapis','arthur','iris','takeshi'];save.partyPresets[0].slots=[...save.party];
 save.unlockedCharacterIds=Object.keys(content.characters);
 if(rank)save.characters.flammelapis.skillRanks={...save.characters.flammelapis.skillRanks,'flammelapis.edict':rank};
 const battle=createBattle(content,save,encounterId,seededRandom(5),{enemyLevel:1});
 const flam=getActor(battle,'flammelapis');
 flam.mp=95;
 const enemies=battle.actors.filter(actor=>actor.team==='enemy');
 for(const enemy of enemies){enemy.hp=enemy.stats.maxHp=100000;enemy.stats.attack=0;enemy.mp=enemy.stats.maxMp=999;}
 return {battle,content,flam,enemies,enemy:enemies[0],ally:getActor(battle,'arthur')};
}
function cast(battle,actorId,abilityId,targetId){
 battle.outcome=null;battle.queue=[actorId];battle.cursor=0;battle.phase='main';
 executeAction(battle,{actorId,abilityId,targetId});
}
// Đi qua vòng/lượt thật: không gán battle.round, không tự gọi tick.
function world(encounterId='forest_patrol',party=['flammelapis','lionel','iris','arthur'],mutate){
 const content=structuredClone(base);Object.assign(content.abilities,UTIL);mutate?.(content);
 const save=createGameSave(content);
 save.party=party;save.partyPresets[0].slots=[...party];
 save.unlockedCharacterIds=Object.keys(content.characters);
 const battle=createBattle(content,save,encounterId,seededRandom(5),{enemyLevel:1});
 const flam=getActor(battle,'flammelapis');
 flam.mp=95;
 for(const actor of battle.actors.filter(a=>a.team==='enemy')){
  actor.hp=actor.stats.maxHp=300000;actor.stats.attack=0;actor.mp=actor.stats.maxMp=999;
  if(!actor.boss)actor.abilities=['test.barrier'];
 }
 return {battle,content,flam};
}
function stepBattle(battle,choose){
 const actor=activeActor(battle);
 if(actor.boss){executeEnemyTurn(battle);return;}
 const move=choose?.(actor)??(actor.team==='enemy'?{abilityId:'test.barrier'}:{abilityId:'$defend'});
 executeAction(battle,{actorId:actor.id,abilityId:move.abilityId,targetId:move.targetId??actor.id});
}
const hasSiegebreaker=actor=>actor.statuses.some(status=>status.id==='siegebreaker');

test('Flammelapis is a Water physical Hunters Guild sword keeper with 95 MP',()=>{
 const c=base.characters.flammelapis;
 assert.equal(c.element,'water');
 assert.equal(c.roleGroup,'physical_dps');
 assert.equal(c.affiliation,'hunters_guild');
 assert.equal(c.stats.maxMp,95);
 assert.deepEqual(c.abilities,['flammelapis.slash','flammelapis.edict','flammelapis.tidebreak']);
 assert.equal(c.passive.type,'enemy_shield_mode');
 assert.equal(c.passive.modeId,'ancient_sword');
 const mode=c.combatModes.ancient_sword;
 assert.equal(mode.lifetime,'turns');
 assert.equal(mode.durationTurns,2);
 assert.equal(mode.statModifiers.attack,0.35);
 assert.deepEqual(mode.entryEffects,[{type:'status',status:'siegebreaker',duration:2}]);
 assert.deepEqual(validateContent(base),[]);
});

test('skill costs stay at or below 15 MP and only the burst has downtime',()=>{
 const costs=Object.values(base.abilities).filter(skill=>skill.id.startsWith('flammelapis.')).map(skill=>skill.cost?.mp??0);
 assert.ok(costs.every(cost=>cost<=15),'không kỹ năng nào vượt 15 MP');
 assert.equal(Math.max(...costs),15);
 assert.equal(base.abilities['flammelapis.slash'].cost.mp,5,'Trảm Thủy 5 MP');
 assert.equal(base.abilities['flammelapis.edict'].cost.mp,8);
 assert.equal(base.abilities['flammelapis.tidebreak'].cost.mp,15);
 assert.equal(base.abilities['flammelapis.slash'].cooldown??0,0);
 assert.equal(base.abilities['flammelapis.edict'].cooldown??0,0);
 assert.equal(base.abilities['flammelapis.tidebreak'].cooldown,2);
 const {battle,flam,enemies}=fixture();
 const enemy=enemies[0],mp=flam.mp;
 cast(battle,flam.id,'flammelapis.slash',enemy.id);
 assert.equal(flam.cooldowns?.['flammelapis.slash']??0,0,'Trảm Thủy không tạo hồi chiêu');
 assert.equal(flam.mp,mp-5);
 cast(battle,flam.id,'flammelapis.edict',flam.id);
 assert.equal(flam.cooldowns?.['flammelapis.edict']??0,0,'Kiếm Ấn không tạo hồi chiêu');
});

test('an enemy shield skill wakes the ancient sword once per round with +35% ATK and Phá Thành',()=>{
 const {battle,content,flam,enemies}=fixture();
 const enemy=enemies[0];
 enemy.abilities=[...enemy.abilities,'test.barrier','test.strike'];
 const baseAttack=battleStat(content,flam,'attack');
 cast(battle,enemy.id,'test.barrier',enemy.id);
 assert.equal(flam.activeMode,'ancient_sword');
 assert.equal(flam.modeTurnsRemaining,2);
 assert.ok(hasSiegebreaker(flam),'vào dạng phải nhận Phá Thành');
 assert.equal(flam.statuses.find(status=>status.id==='siegebreaker').remaining,2);
 assert.ok(Math.abs(battleStat(content,flam,'attack')-baseAttack*1.35)<1e-9,'mode phải cộng 35% ATK');
 assert.ok(battle.events.some(event=>event.type==='mode_enter'&&event.mode==='ancient_sword'));
 cast(battle,enemy.id,'test.barrier',enemy.id);
 assert.equal(flam.modeTurnsRemaining,2,'đang ở dạng thì không vào lại, không refresh');
});

test('a shield that is refused or weaker than the old one still rouses the mode',()=>{
 const {battle,flam,enemies}=fixture();
 const enemy=enemies[0];
 enemy.abilities=[...enemy.abilities,'test.barrier'];
 enemy.shield=999;
 cast(battle,enemy.id,'test.barrier',enemy.id);
 assert.equal(enemy.shield,999,'khiên yếu không thay được khiên cũ');
 assert.equal(flam.activeMode,'ancient_sword','vẫn kích hoạt vì kỹ năng có hiệu ứng tạo khiên');
});

test('a real enemy shield skill from content triggers the mode too',()=>{
 const {battle,flam,enemies}=fixture();
 const enemy=enemies[0];
 enemy.abilities=[...enemy.abilities,'enemy.fortress_shield'];
 cast(battle,enemy.id,'enemy.fortress_shield',enemies[1].id);
 assert.equal(flam.activeMode,'ancient_sword');
 assert.ok(enemies[1].shield>0);
});

test('damaging enemy skills and ally shields never trigger the mode',()=>{ const {battle,flam,enemies,ally}=fixture();
 const enemy=enemies[0];
 enemy.abilities=[...enemy.abilities,'test.strike','test.barrier'];
 cast(battle,enemy.id,'test.strike',flam.id);
 assert.equal(flam.activeMode,undefined,'kỹ năng sát thương không kích');
 ally.abilities=[...ally.abilities,'test.barrier'];
 ally.mp=99;
 cast(battle,ally.id,'test.barrier',ally.id);
 assert.equal(flam.activeMode,undefined,'khiên phe mình không kích');
});

test('the mode lasts two of Flammelapis own turns and then releases Phá Thành',()=>{
 const {battle,content,flam,enemies}=fixture();
 const enemy=enemies[0];
 enemy.abilities=[...enemy.abilities,'test.barrier'];
 const baseAttack=battleStat(content,flam,'attack');
 cast(battle,enemy.id,'test.barrier',enemy.id);
 cast(battle,flam.id,'flammelapis.slash',enemy.id);
 assert.equal(flam.activeMode,'ancient_sword');
 assert.equal(flam.modeTurnsRemaining,1);
 cast(battle,flam.id,'flammelapis.slash',enemy.id);
 assert.equal(flam.activeMode,undefined,'hết lượt thứ hai phải rời dạng');
 assert.equal(hasSiegebreaker(flam),false,'Phá Thành đi cùng dạng');
 assert.equal(battleStat(content,flam,'attack'),baseAttack);
});

test('Kiếm Ấn gives one ally Phá Thành for two turns, not Flammelapis alone',()=>{
 const {battle,flam,ally}=fixture();
 flam.mp=95;
 cast(battle,flam.id,'flammelapis.edict',ally.id);
 assert.ok(hasSiegebreaker(ally));
 assert.equal(ally.statuses.find(status=>status.id==='siegebreaker').remaining,2);
 assert.equal(hasSiegebreaker(flam),false);
 cast(battle,ally.id,'$defend',ally.id);
 assert.equal(ally.statuses.find(status=>status.id==='siegebreaker')?.remaining,1);
 cast(battle,ally.id,'$defend',ally.id);
 assert.equal(hasSiegebreaker(ally),false,'hết 2 lượt thì mất Phá Thành');
});

test('Kiếm Ấn rank reduces MP cost while keeping the two-turn buff',()=>{
 const {battle,flam,ally}=fixture('forest_patrol',5);
 const mp=flam.mp;
 cast(battle,flam.id,'flammelapis.edict',ally.id);
 assert.equal(flam.mp,mp-6,'Rank 5 dùng 6 MP');
 assert.equal(ally.statuses.find(status=>status.id==='siegebreaker').remaining,2);
});

test('Triều Kiếm Bạo Phá hits the anchor and only its adjacent slots',()=>{
 const three=fixture('granary_rats');
 const {battle,flam,enemies}=three;
 enemies.forEach((enemy,index)=>{enemy.formationSlot=index;});
 flam.mp=95;flam.cooldowns={};
 cast(battle,flam.id,'flammelapis.tidebreak',enemies[1].id);
 const hit=battle.events.filter(event=>event.type==='damage'&&event.sourceId===flam.id);
 assert.deepEqual(hit.map(event=>event.targetId).sort(),enemies.map(enemy=>enemy.id).sort());
 const byTarget=new Map(hit.map(event=>[event.targetId,event.amount]));
 assert.ok(byTarget.get(enemies[1].id)>byTarget.get(enemies[0].id),'mục tiêu chính phải nặng hơn ô kề');
 assert.ok((flam.cooldowns?.['flammelapis.tidebreak']??0)>0,'burst có hồi chiêu');
 for(const enemy of enemies){
  const crack=enemy.statuses.find(status=>status.id==='shield_fracture');
  assert.ok(crack,enemy.id+' phải nhận Rạn Khiên');
  assert.equal(crack.remaining,3,'Rạn Khiên 3 lượt');
 }
 assert.equal(base.statuses.shield_fracture.durationClock,'main_turn');
 assert.equal(base.statuses.shield_fracture.shieldReceivedReduction,0.35);

 const edge=fixture('granary_rats');
 edge.enemies.forEach((enemy,index)=>{enemy.formationSlot=index;});
 edge.flam.mp=95;edge.flam.cooldowns={};
 cast(edge.battle,edge.flam.id,'flammelapis.tidebreak',edge.enemies[0].id);
 const edgeHits=edge.battle.events.filter(event=>event.type==='damage'&&event.sourceId===edge.flam.id).map(event=>event.targetId).sort();
 assert.deepEqual(edgeHits,[edge.enemies[0].id,edge.enemies[1].id].sort(),'ô biên chỉ lan sang một bên');
});

test('giới hạn một lần mỗi vòng đi qua chuyển vòng thật',()=>{
 const {battle,flam}=world();
 const entries=[];let last;
 for(let i=0;i<260&&entries.length<2;i++){
  assert.ok(!battle.outcome,'trận kết thúc ngoài dự kiến');
  stepBattle(battle);
  if(flam.activeMode&&last!==flam.activeMode)entries.push({round:battle.round,turns:flam.modeTurnsRemaining,proc:flam.procRounds.enemy_shield_mode});
  last=flam.activeMode;
 }
 assert.equal(entries.length,2,'phải vào dạng lần hai ở một vòng sau');
 assert.equal(entries[0].turns,2);
 assert.equal(entries[0].proc,entries[0].round,'lần kích ghi đúng vòng');
 assert.ok(entries[1].round>entries[0].round,'không được vào dạng hai lần trong cùng vòng');
 assert.equal(entries[1].proc,entries[1].round);
});

test('lượt bị choáng khi đang ở dạng vẫn trừ một lượt mode',()=>{
 const {battle,flam}=world();
 for(let i=0;i<120&&!flam.activeMode;i++){assert.ok(!battle.outcome,'trận kết thúc ngoài dự kiến');stepBattle(battle);}
 assert.equal(flam.activeMode,'ancient_sword');
 flam.statuses.push({id:'stunned',remaining:1,sourceId:'test'});
 const before=flam.modeTurnsRemaining,logStart=battle.log.length;
 let skipped=false;
 for(let i=0;i<120&&!skipped;i++){
  assert.ok(!battle.outcome,'trận kết thúc ngoài dự kiến');
  stepBattle(battle);
  skipped=battle.log.slice(logStart).some(line=>line.includes(flam.name)&&line.includes('bị choáng'));
 }
 assert.ok(skipped,'phải có lượt bị choáng');
 if(before===1)assert.equal(flam.activeMode,undefined,'lượt choáng cuối phải rời dạng');
 else{assert.equal(flam.modeTurnsRemaining,before-1,'choáng vẫn tính một lượt');assert.equal(flam.activeMode,'ancient_sword');}
});

test('Lượt Thêm của Flammelapis trừ thêm đúng một lượt mode',()=>{
 const {battle,flam}=world('forest_patrol',['flammelapis','lionel','iris','arthur']);
 const lionel=getActor(battle,'lionel');lionel.mp=999;
 let granted=false,reached=false;
 for(let i=0;i<220&&!reached;i++){
  assert.ok(!battle.outcome,'trận kết thúc ngoài dự kiến');
  if(battle.phase==='extra'&&flam.activeMode&&activeActor(battle)?.id===flam.id){reached=true;break;}
  stepBattle(battle,(actor)=>{
   if(actor.id===lionel.id&&!granted&&battle.phase==='main'){granted=true;return {abilityId:'lionel.encore',targetId:flam.id};}
   return undefined;
  });
 }
 assert.ok(reached,'phải tới Vòng Phụ của Flammelapis khi đang ở dạng');
 assert.equal(battle.phase,'extra');
 const before=flam.modeTurnsRemaining;
 executeAction(battle,{actorId:flam.id,abilityId:'$defend',targetId:flam.id});
 if(before===1)assert.equal(flam.activeMode,undefined,'lượt thêm cuối phải rời dạng');
 else{assert.equal(flam.modeTurnsRemaining,before-1,'lượt thêm trừ đúng một lượt');assert.equal(flam.activeMode,'ancient_sword');}
 assert.equal(battle.events.filter(event=>event.type==='mode_exit').length,before===1?1:0,'rời dạng đúng một lần');
});

test('trùm nhiều hành động trong một lượt chỉ kích nội tại một lần',()=>{
 const {battle,flam}=world('test_boss_encounter',['flammelapis','arthur','iris','takeshi'],(content)=>{
  content.enemies.test_boss={id:'test_boss',name:'Trùm thử',element:'plain',referenceLevel:1,stats:{maxHp:400000,maxMp:999,attack:0,magic:0,defense:10,resistance:10,speed:1},abilities:['test.barrier'],boss:{type:'phased',restorePartyMpOnTransition:false,phases:[{name:'Thử một',atHpRatio:1,actionsPerTurn:2,rotation:[['test.barrier','test.barrier']]},{name:'Thử hai',atHpRatio:0.5,actionsPerTurn:1,rotation:[['test.barrier']]}]}};
  content.encounters.test_boss_encounter={...content.encounters.forest_patrol,id:'test_boss_encounter',name:'Trùm thử',enemies:['test_boss']};
 });
 let snapshot=null;
 for(let i=0;i<120&&!snapshot;i++){
  assert.ok(!battle.outcome,'trận kết thúc ngoài dự kiến');
  const actor=activeActor(battle);
  if(actor.boss){
   executeEnemyTurn(battle);
   const casts=battle.events.filter(event=>event.type==='ability_cast'&&event.abilityId==='test.barrier').length;
   if(casts)snapshot={casts,enters:battle.events.filter(event=>event.type==='mode_enter').length};
  }else stepBattle(battle);
 }
 assert.ok(snapshot,'phải tới lượt trùm');
 assert.equal(snapshot.casts,2,'trùm phải thi triển hai hành động');
 assert.equal(snapshot.enters,1,'chỉ được vào dạng một lần');
 assert.equal(flam.activeMode,'ancient_sword');
});

test('Arena mirror: mỗi bản sao chỉ phản ứng với kỹ năng khiên của phe đối diện',()=>{
 const save=createGameSave(base);
 save.party=['flammelapis','elaine','iris','arthur'];save.partyPresets[0].slots=[...save.party];
 save.unlockedCharacterIds=[...new Set([...save.unlockedCharacterIds,...save.party])];
 const battle=createArenaBattle(base,save);
 const unit=(team,id)=>battle.actors.find(actor=>actor.team===team&&actor.characterId===id);
 const partyFlam=unit('party','flammelapis'),enemyFlam=unit('enemy','flammelapis');
 const partyElaine=unit('party','elaine'),enemyElaine=unit('enemy','elaine');
 partyElaine.mp=enemyElaine.mp=999;
 const baseParty=battleStat(base,partyFlam,'attack'),baseEnemy=battleStat(base,enemyFlam,'attack');
 const arenaCast=(actor,ability,target)=>{
  battle.outcome=null;battle.phase='main';battle.queue=[actor.id,...battle.actors.filter(other=>other.id!==actor.id).map(other=>other.id)];battle.cursor=0;
  executeAction(battle,{actorId:actor.id,abilityId:ability,targetId:target});
 };
 arenaCast(partyElaine,'elaine.shield',partyFlam.id);
 assert.equal(enemyFlam.activeMode,'ancient_sword','bản sao địch phản ứng với khiên của phe ta');
 assert.equal(partyFlam.activeMode,undefined,'khiên cùng phe không kích bản sao của mình');
 assert.ok(Math.abs(battleStat(base,enemyFlam,'attack')-baseEnemy*1.35)<1e-9);
 assert.equal(battleStat(base,partyFlam,'attack'),baseParty,'mode của địch không cộng cho bản sao phe ta');
 arenaCast(enemyElaine,'elaine.shield',enemyFlam.id);
 assert.equal(partyFlam.activeMode,'ancient_sword','khiên của địch kích bản sao phe ta');
 assert.ok(Math.abs(battleStat(base,partyFlam,'attack')-baseParty*1.35)<1e-9);
 assert.notEqual(partyFlam.procRounds?.enemy_shield_mode,undefined);
 assert.notEqual(enemyFlam.procRounds?.enemy_shield_mode,undefined);
 assert.notEqual(partyFlam.id,enemyFlam.id,'hai bản sao phải là actor khác nhau');
});

test('Arena AI profile, banner pool and content validation',()=>{
 assert.ok(base.pvpAiProfiles.flammelapis,'thiếu AI profile');
 assert.equal(base.pvpAiProfiles.flammelapis.role,'physical_dps');
 assert.ok(base.banners.standard.characterPool.includes('flammelapis'),'phải có trong pool Chiêu Mộ');
 assert.equal(base.banners.standard.characterPool.filter(id=>id==='flammelapis').length,1,'không trùng pool');
 assert.deepEqual(validateContent(base),[]);
});
