import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,activeActor,getActor,abilityAvailability} from '../src/core/battle.js';
import {resolveRankedAbility} from '../src/core/skill-resolver.js';
import {validateContent} from '../src/core/content.js';
import {seededRandom} from '../src/core/random.js';
import {battleStat} from '../src/core/stat-values.js';
import {lifeDebt} from '../src/core/life-debt.js';
const base=await loadContent();

function fixture(){
 const save=createGameSave(base);
 save.party=['amaryllis','arthur','iris','takeshi'];save.partyPresets[0].slots=[...save.party];
 save.unlockedCharacterIds=Object.keys(base.characters);
 const battle=createBattle(base,save,'forest_patrol',seededRandom(5),{enemyLevel:1});
 const am=getActor(battle,'amaryllis');
 for(const enemy of battle.actors.filter(actor=>actor.team==='enemy')){enemy.hp=enemy.stats.maxHp=100000;enemy.stats.attack=0;}
 return {battle,am,arthur:getActor(battle,'arthur'),iris:getActor(battle,'iris'),takeshi:getActor(battle,'takeshi')};
}
function cast(battle,actorId,abilityId,targetId){
 battle.outcome=null;battle.queue=[actorId];battle.cursor=0;battle.phase='main';
 executeAction(battle,{actorId,abilityId,targetId});
}
const healAt=actor=>actor.hp;

test('Amaryllis is a Earth survival support of Rhett facility with 150 MP',()=>{
 const c=base.characters.amaryllis;
 assert.equal(c.element,'earth');
 assert.equal(c.roleGroup,'defensive_support');
 assert.equal(c.affiliation,'rhett_research_facility');
 assert.equal(c.stats.maxMp,150);
 assert.equal(c.stats.magic,40);
 assert.deepEqual(c.abilities,['amaryllis.mend','amaryllis.blessing','amaryllis.litany']);
 assert.equal(c.passive.type,'heal_mp_regen');
 assert.equal(c.passive.ratio,0.1);
 assert.equal(c.passive.cap,10);
 assert.ok(base.banners.standard.characterPool.includes('amaryllis'),'phải có trong pool Chiêu Mộ');
 assert.deepEqual(validateContent(base),[]);
});

test('Mend heals 180% MAG to one ally and gives that ally 10% of the authored heal as MP',()=>{
 const {battle,am,arthur}=fixture();
 arthur.hp=1;arthur.mp=0;
 const magic=battleStat(base,am,'magic'),startMp=am.mp;
 cast(battle,am.id,'amaryllis.mend',arthur.id);
 const healed=Math.round(magic*1.8);
 assert.equal(arthur.hp,1+healed);
 assert.equal(arthur.mp,Math.min(arthur.stats.maxMp,Math.min(10,Math.floor(healed*0.1))),'MP phải về người được hồi');
 assert.equal(am.mp,startMp-10,'Amaryllis không tự nhận MP từ Mend');
 assert.equal(am.cooldowns?.['amaryllis.mend']??0,0,'không hồi chiêu');
});

test('Blessing heals 80% MAG per ally and gives each healed person their own MP, capped 10',()=>{
 const {battle,am,arthur,iris,takeshi}=fixture();
 am.stats.magic=200;
 arthur.hp=10;iris.hp=10;takeshi.hp=10;
 arthur.mp=0;iris.mp=0;takeshi.mp=0;
 const magic=battleStat(base,am,'magic');
 am.mp=100;
 cast(battle,am.id,'amaryllis.blessing',am.id);
 const each=Math.round(magic*0.8);
 assert.equal(arthur.hp,10+Math.min(each,arthur.stats.maxHp-10));
 assert.equal(iris.hp,10+Math.min(each,iris.stats.maxHp-10));
 assert.equal(takeshi.hp,10+Math.min(each,takeshi.stats.maxHp-10));
 const perPerson=Math.min(10,Math.floor(each*0.1));
 assert.equal(perPerson,10,'mỗi người chạm trần 10 MP');
 for(const ally of [arthur,iris,takeshi])assert.equal(ally.mp,perPerson,'mỗi người được hồi nhận MP riêng');
 assert.equal(am.mp,100-16+perPerson,'Amaryllis cũng được hồi vì là mục tiêu của Blessing');
 assert.equal(am.cooldowns?.['amaryllis.blessing']??0,0,'không hồi chiêu');
});

test('the MP gift follows Amaryllis authored heal even when the ally is already full HP',()=>{
 const {battle,am,arthur}=fixture();
 arthur.hp=arthur.stats.maxHp;arthur.mp=0;
 am.mp=am.stats.maxMp;
 const magic=battleStat(base,am,'magic'),authored=Math.round(magic*1.8);
 cast(battle,am.id,'amaryllis.mend',arthur.id);
 assert.equal(arthur.hp,arthur.stats.maxHp,'mục tiêu đầy HP không tăng thêm');
 assert.equal(arthur.mp,Math.min(10,Math.floor(authored*0.1)),'vẫn hồi MP cho người nhận dù HP đầy');
 assert.equal(am.mp,am.stats.maxMp-10,'Amaryllis chỉ trả MP của chiêu');
});

test('healing a target at full MP never overflows capacity',()=>{
 const {battle,am,arthur}=fixture();
 am.stats.magic=200;arthur.hp=1;
 arthur.mp=arthur.stats.maxMp;
 am.mp=am.stats.maxMp;
 cast(battle,am.id,'amaryllis.mend',arthur.id);
 assert.equal(arthur.mp,arthur.stats.maxMp,'MP người nhận đầy thì phần vượt bị chặn');
 assert.equal(am.mp,am.stats.maxMp-10,'Amaryllis chỉ trả chi phí chiêu');
});

test('Litany revives the team full and clears every status on the fallen',()=>{
 const {battle,am,arthur,iris,takeshi}=fixture();
 am.mp=am.stats.maxMp;
 arthur.hp=0;iris.hp=1;takeshi.hp=0;
 arthur.statuses.push({id:'shield_fracture',remaining:3,stacks:1},{id:'life_mortgage',remaining:null,stacks:1},{id:'deep_wound',remaining:2,stacks:1});
 iris.statuses.push({id:'shield_fracture',remaining:3,stacks:1},{id:'life_mortgage',remaining:null,stacks:1},{id:'deep_wound',remaining:2,stacks:1});
 battle.queue=[am.id];battle.cursor=0;battle.phase='main';
 am.cooldowns['amaryllis.litany']=0;
 executeAction(battle,{actorId:am.id,abilityId:'amaryllis.litany',targetId:am.id});
 for(const ally of [arthur,iris,takeshi,am]){
  assert.equal(ally.hp,ally.stats.maxHp,ally.name+' phải hồi đầy HP');
  assert.equal(ally.mp,ally.stats.maxMp,ally.name+' phải hồi đầy MP');
 }
 assert.deepEqual(arthur.statuses,[],'người đã gục được hồi sinh phải sạch mọi status');
 assert.deepEqual(takeshi.statuses,[],'người đã gục được hồi sinh phải sạch mọi status');
 const irisIds=iris.statuses.map(status=>status.id);
 assert.ok(!irisIds.includes('life_mortgage'),'người còn sống vẫn trả nợ Kế Ước');
 assert.ok(irisIds.includes('shield_fracture'),'debuff khác trên người còn sống được giữ');
 assert.ok(irisIds.includes('deep_wound'),'Vết Thương Sâu trên người còn sống không bị cleanse');
 assert.equal(arthur.statuses.some(status=>status.id==='shield_fracture'),false,'debuff khác trên người đã gục bị xóa');
 const revives=battle.events.filter(event=>event.type==='revive');
 assert.equal(revives.length,4);
 assert.equal(revives.filter(event=>event.fallen).length,2);
 assert.ok((am.cooldowns?.['amaryllis.litany']??0)>0,'bắt đầu hồi chiêu');
 assert.deepEqual(revives.map(event=>event.targetId).sort(),[am.id,arthur.id,iris.id,takeshi.id].sort());
 assert.equal(battle.extraTurnGrants.size,0,'hồi sinh không cấp Lượt Thêm');
});

test('Litany ranks down MP cost only, caps at Rank 5, and keeps the 10-round cooldown',()=>{
 const skill=base.abilities['amaryllis.litany'];
 assert.equal(skill.growthProfile,'output_buff_mp');
 assert.equal(skill.rankable,true);
 assert.equal(skill.masteryEligible,false,'chỉ tối đa Rank 5, không mở mastery');
 assert.equal(skill.cooldown,10);
 assert.equal(skill.initialCooldown,6,'vào trận đã hồi chiêu 6 vòng');
 let previous=Infinity;
 for(const rank of [1,3,5]){
  const resolved=resolveRankedAbility(base,{...base.characters.amaryllis,skillRanks:{'amaryllis.litany':rank}},skill,rank);
  assert.equal(resolved.cooldown,10,'không được giảm hồi chiêu theo Rank');
  assert.equal(resolved.skillRank,rank);
  assert.deepEqual(resolved.effects,[{type:'revive',hpRatio:1,mpRatio:1}]);
  const cost=Math.ceil(skill.cost.mp*resolved.rankMpMultiplier);
  assert.ok(cost<previous,'MP phải giảm khi Rank tăng');previous=cost;
 }
 assert.equal(resolveRankedAbility(base,{...base.characters.amaryllis,skillRanks:{'amaryllis.litany':6}},skill,6).skillRank,5,'trần Rank 5');
});

test('Kinh Cầu khóa 6 vòng đầu trận và sẵn sàng từ vòng 7 như Aldric',()=>{
 const skill=base.abilities['amaryllis.litany'];
 const {battle,am}=fixture();
 for(const foe of battle.actors.filter(actor=>actor.team==='enemy')){foe.abilities=['$defend'];foe.stats.attack=0;}
 const step=()=>{const actor=activeActor(battle);executeAction(battle,{actorId:actor.id,abilityId:'$defend',targetId:actor.id});};
 assert.equal(abilityAvailability(battle,am,skill).ok,false,'vòng 1 phải đang khóa');
 while(battle.round<6){assert.ok(!battle.outcome,'trận kết thúc ngoài dự kiến');step();}
 assert.equal(battle.round,6);
 assert.equal(abilityAvailability(battle,am,skill).ok,false,'vòng 6 vẫn còn 1 vòng hồi chiêu');
 while(battle.round<7){assert.ok(!battle.outcome,'trận kết thúc ngoài dự kiến');step();}
 assert.equal(battle.round,7);
 assert.equal(abilityAvailability(battle,am,skill).ok,true,'vòng 7 mới mở khóa');
});

test('cái chết chỉ xóa Kế Ước cùng nợ HP; các buff/debuff khác vẫn nằm trên người gục',()=>{
 const content=structuredClone(base);
 content.abilities['test.load']={id:'test.load',name:'Nạp thử',target:'self',effects:[
  {type:'status',status:'life_mortgage'},
  {type:'status',status:'deep_wound',duration:3},
  {type:'status',status:'twinstar_guidance',duration:3},
  {type:'status',status:'taunt',duration:3}
 ],skillLineId:'test.load',growthProfile:'fixed',rankable:false,fixedReason:'kiểm thử'};
 content.abilities['test.exec']={id:'test.exec',name:'Kết liễu',target:'enemy',effects:[{type:'damage',damageType:'physical',element:'plain',multiplier:99,unavoidable:true}],skillLineId:'test.exec',growthProfile:'fixed',rankable:false,fixedReason:'kiểm thử'};
 const save=createGameSave(content);
 save.party=['amaryllis','arthur','iris','takeshi'];save.partyPresets[0].slots=[...save.party];
 save.unlockedCharacterIds=Object.keys(content.characters);
 const battle=createBattle(content,save,'forest_patrol',seededRandom(5),{enemyLevel:1});
 const am=getActor(battle,'amaryllis'),arthur=getActor(battle,'arthur');
 const enemy=battle.actors.find(actor=>actor.team==='enemy');
 for(const foe of battle.actors.filter(actor=>actor.team==='enemy')){
  foe.hp=foe.stats.maxHp=999999;foe.stats.attack=9999;foe.mp=999;foe.abilities=['test.exec'];
 }
 arthur.abilities.push('test.load');
 cast(battle,arthur.id,'test.load',arthur.id);
 assert.ok(lifeDebt(arthur)>0,'phải tạo nợ HP từ Kế Ước');
 const before=arthur.statuses.map(status=>status.id);
 for(const id of ['life_mortgage','deep_wound','twinstar_guidance','taunt'])assert.ok(before.includes(id),'thiếu '+id);
 cast(battle,enemy.id,'test.exec',arthur.id);
 assert.equal(arthur.hp,0,'Arthur phải gục');
 assert.equal(lifeDebt(arthur),0,'nợ HP bị xóa khi chết');
 const afterDeath=arthur.statuses.map(status=>status.id);
 assert.ok(!afterDeath.includes('life_mortgage'),'Kế Ước bị xóa khi chết');
 for(const id of ['deep_wound','twinstar_guidance','taunt'])assert.ok(afterDeath.includes(id),id+' phải còn trên người gục');
 am.mp=999;
 am.cooldowns['amaryllis.litany']=0;
 cast(battle,am.id,'amaryllis.litany',am.id);
 assert.equal(arthur.hp,arthur.stats.maxHp,'hồi sinh đưa Arthur về đầy HP');
 assert.deepEqual(arthur.statuses,[],'hồi sinh xóa mọi status, kể cả Vết Thương Sâu');
 assert.equal(lifeDebt(arthur),0);
});
