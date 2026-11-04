import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,activeActor,getActor,targetsFor,abilityAvailability} from '../src/core/battle.js';
import {normalizedArenaCampaign} from '../src/core/arena.js';
import {preparePvpContent} from '../src/core/pvp-rules.js';
import {validateContent} from '../src/core/content.js';
import {seededRandom} from '../src/core/random.js';
const base=await loadContent();

const UTIL={
 'test.strike':{id:'test.strike',name:'Đòn thử',target:'enemy',effects:[{type:'damage',damageType:'physical',element:'plain',multiplier:1}],skillLineId:'test.strike',growthProfile:'fixed',rankable:false,fixedReason:'kiểm thử'},
 'test.blast':{id:'test.blast',name:'Sóng thử',target:'all_enemies',effects:[{type:'damage',damageType:'physical',element:'plain',multiplier:1}],skillLineId:'test.blast',growthProfile:'fixed',rankable:false,fixedReason:'kiểm thử'},
 'test.guard':{id:'test.guard',name:'Che chắn thử',target:'self',effects:[{type:'status',status:'brant_guard',duration:2}],skillLineId:'test.guard',growthProfile:'fixed',rankable:false,fixedReason:'kiểm thử'},
 'test.exec':{id:'test.exec',name:'Kết liễu thử',target:'enemy',effects:[{type:'damage',damageType:'physical',element:'plain',multiplier:99,unavoidable:true}],skillLineId:'test.exec',growthProfile:'fixed',rankable:false,fixedReason:'kiểm thử'}
};

function fixture(){
 const content=structuredClone(base);Object.assign(content.abilities,UTIL);
 const save=createGameSave(content);
 save.party=['brant','iris','arthur','takeshi'];save.partyPresets[0].slots=[...save.party];
 save.unlockedCharacterIds=Object.keys(content.characters);
 const battle=createBattle(content,save,'forest_patrol',seededRandom(5),{enemyLevel:1});
 const brant=getActor(battle,'brant');
 brant.abilities.push('test.guard');
 for(const enemy of battle.actors.filter(actor=>actor.team==='enemy')){
  enemy.hp=enemy.stats.maxHp=100000;enemy.stats.attack=80;enemy.mp=enemy.stats.maxMp=999;
  enemy.abilities=['test.strike','test.blast'];
 }
 return {battle,content,brant,iris:getActor(battle,'iris'),arthur:getActor(battle,'arthur'),enemy:battle.actors.find(actor=>actor.team==='enemy')};
}
function cast(battle,actorId,abilityId,targetId){
 battle.outcome=null;battle.queue=[actorId];battle.cursor=0;battle.phase='main';
 executeAction(battle,{actorId,abilityId,targetId});
}
function scenario(playerParty,enemyParty,seed){
 // Same path as Arena: scoped content + normalized Lv50/Rank5 + PvP soft caps.
 const scoped=preparePvpContent(base,base.pvpRules.default);
 const player=normalizedArenaCampaign(scoped.content,createGameSave(scoped.content),playerParty,scoped.rules);
 const opponent=normalizedArenaCampaign(scoped.content,createGameSave(scoped.content),enemyParty,scoped.rules);
 const battle=createBattle(scoped.content,player,'forest_patrol',seededRandom(seed),{opponentCampaign:opponent,pvpRules:scoped.rules});
 const party=id=>battle.actors.find(actor=>actor.team==='party'&&actor.characterId===id);
 const enemy=id=>battle.actors.find(actor=>actor.team==='enemy'&&actor.characterId===id);
 return {battle,party,enemy};
}
function world(party=['brant','lionel','iris','arthur']){
 const content=structuredClone(base);Object.assign(content.abilities,UTIL);
 const save=createGameSave(content);
 save.party=[...party];save.partyPresets[0].slots=[...party];save.unlockedCharacterIds=Object.keys(content.characters);
 const battle=createBattle(content,save,'forest_patrol',seededRandom(4),{enemyLevel:1});
 const brant=getActor(battle,'brant'),lionel=getActor(battle,'lionel');
 brant.mp=90;lionel.mp=999;
 brant.abilities.push('test.guard');
 for(const enemy of battle.actors.filter(actor=>actor.team==='enemy')){
  enemy.hp=enemy.stats.maxHp=100000;enemy.stats.attack=0;enemy.mp=enemy.stats.maxMp=999;enemy.abilities=['$defend'];
 }
 return {battle,content,brant,lionel};
}
function step(battle,choose){
 const actor=activeActor(battle);
 const move=choose?.(actor)??{abilityId:'$defend'};
 executeAction(battle,{actorId:actor.id,abilityId:move.abilityId,targetId:move.targetId??actor.id});
}
const guardOf=actor=>actor.statuses.find(status=>status.id==='brant_guard');
const tauntOf=actor=>actor.statuses.find(status=>status.id==='brant_taunt');

test('Brant is a Hunters Guild tank with cover guard, area cover and a thick self shield',()=>{
 const c=base.characters.brant;
 assert.equal(c.roleGroup,'tank');
 assert.equal(c.affiliation,'hunters_guild');
 assert.equal(c.element,'plain');
 assert.equal(c.passive.type,'cover_guard');
 assert.equal(c.passive.ratio,0.2);
 assert.equal(c.stats.maxHp,300);
 assert.equal(c.stats.defense,30);
 assert.deepEqual(c.abilities,['brant.bulwark','brant.challenge']);
 const guard=base.statuses.brant_guard;
 assert.equal(guard.cover,true);
 assert.equal(guard.coverArea,true);
 assert.equal(guard.coverReactions,true);
 assert.equal(guard.coverTeam,true);
 assert.equal(guard.modifiers.damageReduction,0.15);
 assert.equal(base.abilities['brant.challenge'].target,'self');
 const shield=base.abilities['brant.bulwark'];
 assert.equal(shield.effects[0].multiplier,2);
 assert.equal(shield.effects[0].flat,30);
 assert.equal(shield.cooldown,3);
 assert.equal(shield.cost.mp,16);
 assert.equal(base.abilities['brant.challenge'].cooldown,3);
 assert.equal(base.abilities['brant.challenge'].cost.mp,14);
 assert.equal(base.abilities['brant.bulwark'].effects[0].durationRounds,3);
 assert.equal(base.statuses.brant_taunt.taunt,true);
 assert.equal(base.statuses.brant_taunt.durationClock,'main_turn');
 assert.ok(base.banners.standard.characterPool.includes('brant'),'phải có trong pool Chiêu Mộ');
 assert.deepEqual(validateContent(base),[]);
});

test('Lời Hứa Chắn Trước opens a team guard from Brant and taunts for him',()=>{
 const {battle,content,brant,iris,arthur,enemy}=fixture();
 brant.mp=99;
 cast(battle,brant.id,'brant.challenge',brant.id);
 assert.ok(brant.statuses.some(status=>status.id==='brant_guard'),'Brant phải mang trạng thái Che chắn');
 assert.ok(brant.statuses.some(status=>status.id==='brant_taunt'),'Brant phải Khiêu Khích');
 assert.equal(iris.statuses.some(status=>status.id==='brant_guard'),false,'Che chắn là hào quang của Brant, không phải buff từng người');
 assert.equal(arthur.statuses.some(status=>status.id==='brant_guard'),false);
 const legal=targetsFor(battle,enemy,content.abilities['test.strike']);
 assert.deepEqual(legal.map(actor=>actor.id),[brant.id],'đòn đơn mục tiêu bị hút về Brant');
});

test('a single-target hit on an ally is redirected to Brant',()=>{
 const {battle,brant,iris,enemy}=fixture();
 brant.mp=99;
 cast(battle,brant.id,'test.guard',brant.id);
 const irisHp=iris.hp;
 cast(battle,enemy.id,'test.strike',iris.id);
 assert.equal(iris.hp,irisHp,'Iris không được mất HP');
 const damage=battle.events.filter(event=>event.type==='damage');
 assert.deepEqual(damage.map(event=>event.targetId),[brant.id]);
 assert.ok(damage[0].amount>0);
 assert.ok(battle.log.some(line=>line.includes('chắn đòn cho')));
});

test('area damage is pulled to Brant and never reaches the other allies',()=>{
 const {battle,brant,iris,arthur}=fixture();
 brant.mp=99;
 cast(battle,brant.id,'brant.challenge',brant.id);
 const before={iris:iris.hp,arthur:arthur.hp,brant:brant.hp};
 cast(battle,battle.actors.find(actor=>actor.team==='enemy').id,'test.blast',brant.id);
 assert.equal(iris.hp,before.iris,'Iris phải đứng ngoài đòn AoE');
 assert.equal(arthur.hp,before.arthur,'Arthur phải đứng ngoài đòn AoE');
 assert.ok(brant.hp<before.brant,'Brant nhận toàn bộ đòn AoE');
 const targets=battle.events.filter(event=>event.type==='damage').map(event=>event.targetId);
 assert.ok(targets.every(id=>id===brant.id));
 assert.ok(battle.log.filter(line=>line.includes('chắn đòn cho')).length>=1);
});

test('cover guard lowers the damage of a redirected hit',()=>{
 const covering=fixture();
 covering.brant.mp=99;
 cast(covering.battle,covering.brant.id,'test.guard',covering.brant.id);
 cast(covering.battle,covering.enemy.id,'test.strike',covering.iris.id);
 const covered=covering.battle.events.find(event=>event.type==='damage').amount;
 const direct=fixture();
 direct.brant.mp=99;
 cast(direct.battle,direct.brant.id,'test.guard',direct.brant.id);
 cast(direct.battle,direct.enemy.id,'test.strike',direct.brant.id);
 const own=direct.battle.events.find(event=>event.type==='damage').amount;
 assert.ok(covered>0&&own>0);
 assert.ok(covered<own*0.9,'đòn chắn phải giảm hơn đòn trực tiếp ('+covered+' vs '+own+')');
});

test('đồng đội hành động không bào thời hạn Che chắn; chỉ lượt chính của Brant mới giảm',()=>{
 const {battle,brant}=world();
 cast(battle,brant.id,'brant.challenge',brant.id);
 assert.equal(guardOf(brant).remaining,2);
 let allyActed=false;
 for(let i=0;i<80&&!allyActed;i++){
  assert.ok(!battle.outcome,'trận kết thúc ngoài dự kiến');
  const actor=activeActor(battle);
  if(actor.id!==brant.id&&actor.team==='party'){step(battle);allyActed=true;break;}
  step(battle);
 }
 assert.ok(allyActed,'phải có một đồng đội hành động');
 assert.equal(guardOf(brant)?.remaining,2,'đồng đội hành động không làm giảm thời hạn');
 let brantTurn=false;
 for(let i=0;i<120&&!brantTurn;i++){
  const actor=activeActor(battle);
  if(actor.id===brant.id&&battle.phase==='main'){step(battle);brantTurn=true;break;}
  step(battle);
 }
 assert.ok(brantTurn,'phải tới lượt chính của Brant');
 assert.equal(guardOf(brant)?.remaining,1,'Brant kết thúc lượt chính thì giảm một lần');
});

test('Brant gục thì Che chắn mất hiệu lực ngay, đồng đội không còn được chắn',()=>{
 const {battle,brant,iris}=fixture();
 brant.mp=99;
 cast(battle,brant.id,'brant.challenge',brant.id);
 const enemy=battle.actors.find(actor=>actor.team==='enemy');
 enemy.abilities=['test.exec','test.strike'];
 enemy.mp=enemy.stats.maxMp=999;
 cast(battle,enemy.id,'test.exec',brant.id);
 assert.equal(brant.hp,0,'Brant phải gục');
 const before=iris.hp;
 cast(battle,enemy.id,'test.strike',iris.id);
 assert.ok(iris.hp<before,'Iris phải nhận đòn vì Che chắn đã tắt');
 assert.equal(iris.statuses.some(status=>status.id==='brant_guard'),false);
});

test('hào quang che đội là cơ chế dùng chung, không gắn với Brant',()=>{
 const content=structuredClone(base);
 Object.assign(content.abilities,UTIL,{
  'test.aura':{id:'test.aura',name:'Hào quang thử',target:'self',effects:[{type:'status',status:'test_team_cover',duration:2}],skillLineId:'test.aura',growthProfile:'fixed',rankable:false,fixedReason:'kiểm thử'}
 });
 content.statuses['test_team_cover']={id:'test_team_cover',name:'Hào quang thử',kind:'buff',cover:true,coverArea:true,coverTeam:true,durationClock:'main_turn'};
 const save=createGameSave(content);
 save.party=['iris','arthur','takeshi','amaryllis'];save.partyPresets[0].slots=[...save.party];
 save.unlockedCharacterIds=Object.keys(content.characters);
 const battle=createBattle(content,save,'forest_patrol',seededRandom(5),{enemyLevel:1});
 const iris=getActor(battle,'iris'),arthur=getActor(battle,'arthur');
 const enemy=battle.actors.find(actor=>actor.team==='enemy');
 for(const foe of battle.actors.filter(actor=>actor.team==='enemy')){
  foe.hp=foe.stats.maxHp=100000;foe.stats.attack=80;foe.mp=foe.stats.maxMp=999;foe.abilities=['test.strike'];
 }
 iris.abilities.push('test.aura');iris.mp=99;
 cast(battle,iris.id,'test.aura',iris.id);
 const hp=arthur.hp;
 cast(battle,enemy.id,'test.strike',arthur.id);
 assert.equal(arthur.hp,hp,'Arthur phải được Iris chắn đòn');
 assert.deepEqual(battle.events.filter(event=>event.type==='damage').map(event=>event.targetId),[iris.id]);
 assert.ok(battle.log.some(line=>line.includes('Iris chắn đòn cho Arthur')),'hào quang phải do Iris phát, không phải Brant');
});

test('dùng lại Lời Hứa là làm mới hào quang, không cộng dồn; CD hiện dài hơn thời hạn',()=>{
 const {battle,brant}=world();
 cast(battle,brant.id,'brant.challenge',brant.id);
 assert.equal(guardOf(brant).remaining,2);
 let available=false,guardStillUp=null;
 for(let i=0;i<240&&!available;i++){
  assert.ok(!battle.outcome,'trận kết thúc ngoài dự kiến');
  const actor=activeActor(battle);
  if(actor.id===brant.id&&battle.phase==='main'&&abilityAvailability(battle,brant,battle.content.abilities['brant.challenge']).ok){
   available=true;guardStillUp=guardOf(brant)??null;break;
  }
  step(battle);
 }
 assert.ok(available,'phải tới lúc Brant dùng lại được Lời Hứa');
 assert.equal(guardStillUp,null,'với CD3, hào quang đã tắt trước khi chiêu hồi xong');

 // Dùng lại cùng status khi đang hiệu lực chỉ làm mới, không tạo tầng thứ hai.
 const again=world();
 cast(again.battle,again.brant.id,'test.guard',again.brant.id);
 assert.equal(guardOf(again.brant).remaining,2);
 cast(again.battle,again.brant.id,'test.guard',again.brant.id);
 assert.equal(again.brant.statuses.filter(status=>status.id==='brant_guard').length,1,'không cộng dồn trạng thái');
 assert.equal(guardOf(again.brant).remaining,2,'dùng lại làm mới về 2 lượt chính');
});

test('Brant survives a Mori cleave buffed by Artesia in the extra phase under PvP rules',()=>{
 const {battle,party,enemy}=scenario(['brant','iris','arthur','elaine'],['mori','artesia','chloe','karin'],3);
 const brant=party('brant'),mori=enemy('mori'),artesia=enemy('artesia');
 let preStorm=null;
 for(let i=0;i<120&&!battle.outcome;i++){
  const actor=activeActor(battle);
  let move={abilityId:'$defend',targetId:actor.id};
  if(actor.team==='party'&&actor.characterId==='brant') move={abilityId:battle.round===1?'brant.bulwark':'brant.challenge',targetId:actor.id};
  else if(actor.team==='enemy'){
   if(actor.characterId==='artesia') move={abilityId:battle.round===1?'artesia.twinstars':'artesia.destiny',targetId:mori.id};
   else if(actor.characterId==='mori'){
    if(battle.phase==='extra'){preStorm={round:battle.round,hp:Object.fromEntries(battle.actors.filter(item=>item.team==='party').map(item=>[item.characterId,item.hp]))};move={abilityId:'mori.storm',targetId:brant.id};}
    else if(battle.round===1) move={abilityId:'$defend',targetId:actor.id};
    else move={abilityId:'mori.unbound',targetId:actor.id};
   }
  }
  const storm=move.abilityId==='mori.storm';
  executeAction(battle,{actorId:actor.id,abilityId:move.abilityId,targetId:move.targetId});
  if(storm){assert.ok(preStorm);break;}
 }
 assert.ok(preStorm,'phải tới lượt Mori thi triển Vạn Lý Lôi Vũ trong Vòng Phụ');
 assert.equal(battle.pvpRules?.rulesetVersion,'arena-0.2.0','phải chạy dưới luật PvP');
 assert.equal(brant.level,50,'nhân vật phải được chuẩn hóa Lv50');
 assert.ok(battle.log.some(line=>line.includes('[PvP arena-0.2.0]')&&line.includes('soft cap')),'sát thương phải đi qua soft cap PvP');
 assert.ok(brant.hp>0,'Brant phải sống sót qua đòn AoE đã buff');
 assert.ok(brant.hp>brant.stats.maxHp*0.25,'Brant phải còn trên 25% HP sau đòn AoE');
 assert.equal(brant.shield,0,'khiên phải bị đánh thủng sau đòn AoE');
 for(const ally of battle.actors.filter(actor=>actor.team==='party'&&actor.id!==brant.id)){
  assert.equal(ally.hp,preStorm.hp[ally.characterId],ally.name+' không được mất HP');
 }
 assert.ok(battle.log.filter(line=>line.includes('chắn đòn cho')).length>=2,'đòn AoE phải bị Brant chắn');
});

test('Che chắn và Khiêu Khích đồng bộ, Vòng Phụ không bào thời hạn',()=>{
 const {battle,content,brant}=world();
 let encore=false,sawExtra=false;
 for(let i=0;i<140&&!sawExtra;i++){
  const actor=activeActor(battle);
  if(battle.phase==='extra'&&actor.id===brant.id&&guardOf(brant)){
   assert.equal(guardOf(brant).remaining,2,'Vào Vòng Phụ, Che chắn vẫn đủ 2 lượt');
   assert.equal(tauntOf(brant).remaining,2,'Vào Vòng Phụ, Khiêu Khích vẫn đủ 2 lượt');
   const legal=targetsFor(battle,battle.actors.find(item=>item.team==='enemy'),content.abilities['test.strike']);
   assert.deepEqual(legal.map(item=>item.id),[brant.id],'Khiêu Khích còn hiệu lực trong Vòng Phụ');
   executeAction(battle,{actorId:brant.id,abilityId:'$defend',targetId:brant.id});
   assert.equal(guardOf(brant).remaining,2,'Lượt Vòng Phụ không giảm Che chắn');
   assert.equal(tauntOf(brant).remaining,2,'Lượt Vòng Phụ không giảm Khiêu Khích');
   sawExtra=true;break;
  }
  step(battle,(current)=>{
   const key=current.characterId??current.id;
   if(key==='brant'&&battle.round===1)return {abilityId:'brant.challenge'};
   if(key==='lionel'&&!encore&&battle.round===1){encore=true;return {abilityId:'lionel.encore',targetId:brant.id};}
   return {abilityId:'$defend'};
  });
 }
 assert.ok(sawExtra,'Brant phải có Lượt Thêm trong Vòng Phụ');
 let mainTurn=false;
 for(let i=0;i<160&&!mainTurn;i++){
  const actor=activeActor(battle);
  if(actor.id===brant.id&&battle.phase==='main'){step(battle);mainTurn=true;break;}
  step(battle);
 }
 assert.equal(guardOf(brant)?.remaining,1,'Lượt chính kế tiếp giảm Che chắn xuống 1');
 assert.equal(tauntOf(brant)?.remaining,1,'Khiêu Khích giảm cùng nhịp');
 let expired=false;
 for(let i=0;i<160&&!expired;i++){
  const actor=activeActor(battle);
  if(actor.id===brant.id&&battle.phase==='main'){step(battle);expired=true;break;}
  step(battle);
 }
 assert.equal(guardOf(brant),undefined,'Hết 2 lượt chính thì Che chắn rời đi');
 assert.equal(tauntOf(brant),undefined,'Khiêu Khích rời đi cùng lúc');
});

test('lượt bị choáng của Brant vẫn trừ đồng bộ cả Che chắn lẫn Khiêu Khích',()=>{
 const {battle,brant}=world();
 cast(battle,brant.id,'brant.challenge',brant.id);
 assert.equal(guardOf(brant).remaining,2);
 assert.equal(tauntOf(brant).remaining,2);
 brant.statuses.push({id:'stunned',remaining:1,stacks:1});
 const logStart=battle.log.length;
 let skipped=false;
 for(let i=0;i<140&&!skipped;i++){
  assert.ok(!battle.outcome,'trận kết thúc ngoài dự kiến');
  step(battle);
  skipped=battle.log.slice(logStart).some(line=>line.includes(brant.name)&&line.includes('bị choáng'));
 }
 assert.ok(skipped,'Brant phải bị bỏ lượt vì choáng');
 assert.equal(guardOf(brant)?.remaining,1,'Lượt choáng vẫn trừ Che chắn');
 assert.equal(tauntOf(brant)?.remaining,1,'Lượt choáng vẫn trừ Khiêu Khích');
});

test('choáng trong Vòng Phụ không bào thời hạn Che chắn hay Khiêu Khích',()=>{
 const {battle,brant}=world();
 let castDone=false,encore=false,stunned=false,skipped=false;
 const logStart=battle.log.length;
 for(let i=0;i<200&&!skipped;i++){
  assert.ok(!battle.outcome,'trận kết thúc ngoài dự kiến');
  const actor=activeActor(battle);
  if(!castDone&&actor.id===brant.id&&battle.round===1&&battle.phase==='main'){
   step(battle,()=>({abilityId:'brant.challenge'}));castDone=true;continue;
  }
  if(!encore&&actor.id==='lionel'&&battle.round===1){step(battle,()=>({abilityId:'lionel.encore',targetId:brant.id}));encore=true;continue;}
  if(castDone&&!stunned&&battle.phase==='main'&&actor.id!==brant.id){
   brant.statuses.push({id:'stunned',remaining:1,stacks:1});stunned=true;
  }
  step(battle);
  skipped=stunned&&battle.log.slice(logStart).some(line=>line.includes(brant.name)&&line.includes('bị choáng'));
 }
 assert.ok(castDone&&encore&&stunned&&skipped,'phải có lượt Vòng Phụ bị choáng');
 assert.equal(guardOf(brant)?.remaining,2,'Choáng ở Vòng Phụ không giảm Che chắn');
 assert.equal(tauntOf(brant)?.remaining,2,'Choáng ở Vòng Phụ không giảm Khiêu Khích');
});

test('Brant holds both Plan B hits from Joshua under PvP rules and keeps every ally untouched',()=>{
 const {battle,party,enemy}=scenario(['brant','iris','arthur','takeshi'],['joshua','artesia','chloe','karin'],7);
 const brant=party('brant'),joshua=enemy('joshua');
 joshua.hp=Math.round(joshua.stats.maxHp*0.4);
 let preAttack=null;
 for(let i=0;i<80&&!battle.outcome;i++){
  const actor=activeActor(battle);
  let move={abilityId:'$defend',targetId:actor.id};
  if(actor.team==='party'){
   if(actor.characterId==='brant') move={abilityId:battle.round===1?'brant.challenge':'brant.bulwark',targetId:actor.id};
   else if(actor.characterId==='iris'&&battle.round===1&&!joshua.activeMode) move={abilityId:'$attack',targetId:joshua.id};
  }else if(actor.characterId==='joshua'&&battle.phase==='extra'&&joshua.activeMode==='plan_b'){
   preAttack={hp:Object.fromEntries(battle.actors.filter(item=>item.team==='party').map(item=>[item.characterId,item.hp]))};
   move={abilityId:'joshua.bite',targetId:brant.id};
  }
  const attack=move.abilityId==='joshua.bite';
  executeAction(battle,{actorId:actor.id,abilityId:move.abilityId,targetId:move.targetId});
  if(attack)break;
 }
 assert.ok(preAttack,'Joshua phải hành động trong Vòng Phụ khi ở Kế Hoạch B');
 assert.equal(joshua.activeMode,'plan_b');
 assert.equal(battle.pvpRules?.rulesetVersion,'arena-0.2.0','phải chạy dưới luật PvP');
 assert.equal(brant.level,50,'nhân vật phải được chuẩn hóa Lv50');
 assert.ok(battle.log.some(line=>line.includes('[PvP arena-0.2.0]')&&line.includes('soft cap')),'sát thương phải đi qua soft cap PvP');
 const hits=battle.events.filter(event=>event.type==='damage');
 assert.ok(hits.length>=2,'Kế Hoạch B phải quật tối thiểu hai lần');
 assert.ok(brant.hp>0,'Brant phải trụ được chuỗi hai đòn');
 assert.ok(brant.hp>brant.stats.maxHp*0.25,'Brant phải còn trên 25% HP sau chuỗi đòn');
 for(const ally of battle.actors.filter(actor=>actor.team==='party'&&actor.id!==brant.id)){
  assert.equal(ally.hp,preAttack.hp[ally.characterId],ally.name+' không được mất HP');
 }
 assert.ok(battle.log.some(line=>line.includes('chắn đòn cho')),'đòn lan phải bị Brant chắn');
});
