import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {ELEMENTS, validateContent} from '../src/core/content.js';
import {createCampaign} from '../src/core/progression.js';
import {createBattle, getActor, executeAction} from '../src/core/battle.js';
import {weaknessElements} from '../src/core/weakness.js';
import {debuffTypeCount} from '../src/core/conditional-combat.js';
import {skillPresentation} from '../src/ui/skill-copy.js';
import {statusDetails} from '../src/ui/combat-presentation.js';
import {createStoryRun, advanceStoryWave} from '../src/core/story-waves.js';

const content=await loadContent();
function setup(party=['arthur','iris'], encounter='forest_patrol', random=()=>.99){
  const data=structuredClone(content),c=createCampaign(data);c.party=party;c.unlockedCharacterIds=Object.keys(data.characters);c.storyFlags.push('illusion.sinister_unlocked');
  const b=createBattle(data,c,encounter,random);
  for(const actor of b.actors){actor.stats.attack=40;actor.stats.magic=40;actor.stats.defense=0;actor.stats.resistance=0;actor.hp=actor.stats.maxHp=10000;actor.weaknesses=[];actor.resistances={};}
  return b;
}
function use(b,id,skill,target='enemy_0'){
  b.queue=[id,...b.actors.filter(a=>a.hp>0&&a.id!==id).map(a=>a.id)];b.cursor=0;
  executeAction(b,{actorId:id,abilityId:skill,targetId:target});
}
function custom(b,id,target,effects,owner='arthur'){
  b.content.abilities[id]={id,name:id,target,effects};getActor(b,owner).abilities.push(id);return id;
}
function grant(b,target,status,stacks=1,duration){
  const skill=custom(b,'test.grant',getActor(b,target).team==='party'?'ally':'enemy',[{type:'status',status,...(stacks>1?{stacks}:{}),...(duration===undefined?{}:{duration})}]);
  use(b,'arthur',skill,target);
}
function expose(b,target='enemy_0',element='fire',stacks=3){grant(b,target,'exposure_'+element,stacks);}
function attack(b,{element='fire',hits=1,type='physical',target='enemy',owner='arthur',extra=[],onHitStatus}={}){
  return custom(b,'test.attack',target,[{type:'damage',damageType:type,element,multiplier:1,hits,...(onHitStatus?{onHitStatus}:{})},...extra],owner);
}
function cast(b,options={},target='enemy_0'){const id=attack(b,options);use(b,options.owner??'arthur',id,target);return b.events.filter(e=>e.type==='damage');}
const exposure=(b,target='enemy_0')=>getActor(b,target).statuses.find(s=>b.content.statuses[s.id].exposedElement);
function buff(b,id='arthur'){grant(b,id,'weakness_exploitation',1,3);}

test('all eight elemental exposures exist; no playable character gains these mechanics automatically',()=>{
  assert.equal(content.statuses.weakness_exploitation.weaknessMultiplier,2);
  for(const element of ELEMENTS){const s=content.statuses['exposure_'+element];assert.equal(s.exposedElement,element);assert.equal(s.maxStacks,3);assert.equal(s.kind,'debuff');}
  assert.ok(Object.values(content.characters).flatMap(c=>c.abilities.map(id=>content.abilities[id])).every(s=>s.effects.every(e=>!content.statuses[e.status]?.exposedElement&&e.status!=='weakness_exploitation')));
});

test('exploitation replaces 150% with 200%, applies to innate/type weaknesses and never creates weakness itself',()=>{
  for(const type of ['physical','magical'])for(const innate of [false,true])for(const typed of [false,true]){
    const b=setup(),target=getActor(b,'enemy_0');if(innate)target.weaknesses=['fire'];if(typed)target.damageTypeWeaknesses=[type];buff(b);
    const [hit]=cast(b,{type});assert.equal(hit.amount,innate||typed?80:40);assert.equal(hit.weaknessMultiplier,innate||typed?2:1);
  }
});

test('reapplying exploitation refreshes one buff; different sources do not add multipliers',()=>{
  const b=setup();buff(b);buff(b);getActor(b,'arthur').statuses.push({id:'second_exploit',remaining:2,stacks:1,sourceId:'iris'});b.content.statuses.second_exploit={...b.content.statuses.weakness_exploitation,id:'second_exploit'};
  expose(b);assert.equal(cast(b)[0].amount,80);assert.equal(getActor(b,'arthur').statuses.filter(s=>s.id==='weakness_exploitation').length,1);
});

test('same element adds up to three; different element replaces it and preserves innate weaknesses',()=>{
  const b=setup(),t=getActor(b,'enemy_0');t.weaknesses=['light'];
  expose(b,'enemy_0','fire',1);expose(b,'enemy_0','fire',3);assert.equal(exposure(b).stacks,3);
  expose(b,'enemy_0','water',2);assert.equal(exposure(b).id,'exposure_water');assert.equal(exposure(b).stacks,2);
  assert.deepEqual(weaknessElements(b.content,t),['light','water']);assert.deepEqual(t.weaknesses,['light']);
  assert.equal(debuffTypeCount(b.content,t),1);
});

test('one multi-hit cast consumes one charge, including physical/magical hits and repeated random targets',()=>{
  for(const type of ['physical','magical'])for(const target of ['enemy','random_enemies']){
    const b=setup();b.random=()=>0;expose(b,'enemy_0','fire',3);const hits=cast(b,{type,target,hits:4});assert.equal(hits.length,4);assert.ok(hits.every(h=>h.amount===60));assert.equal(exposure(b).stacks,2);assert.equal(b.events.filter(e=>e.type==='status_consumed').length,1);
  }
});

test('last charge benefits every hit in the cast, then disappears; a later cast is neutral',()=>{
  const b=setup();expose(b,'enemy_0','fire',1);assert.deepEqual(cast(b,{hits:4}).map(h=>h.amount),[60,60,60,60]);assert.equal(exposure(b),undefined);assert.equal(cast(b)[0].amount,40);
});

test('AoE and split primary damage consume independently on each actual target',()=>{
  const b=setup();expose(b,'enemy_0','fire',1);expose(b,'enemy_1','fire',3);expose(b,'enemy_2','water',3);
  const skill=custom(b,'test.area','all_enemies',[{type:'damage',element:'fire',damageType:'magical',primaryMultiplier:2,multiplier:1,hits:2}]);
  use(b,'arthur',skill);const hits=b.events.filter(e=>e.type==='damage');assert.equal(hits.length,6);assert.deepEqual(hits.map(e=>e.amount),[120,120,60,60,40,40]);
  assert.equal(exposure(b),undefined);assert.equal(exposure(b,'enemy_1').stacks,2);assert.equal(exposure(b,'enemy_2').stacks,3);
});

test('hybrid damage and different elements share one cast charge; wrong elements do not spend it',()=>{
  const b=setup();expose(b);const skill=custom(b,'test.hybrid','enemy',[
    {type:'damage',damageType:'physical',element:'water',multiplier:1},
    {type:'damage',damageType:'magical',element:'fire',multiplier:1},
    {type:'damage',damageType:'physical',element:'fire',multiplier:1}]);
  use(b,'arthur',skill);assert.deepEqual(b.events.filter(e=>e.type==='damage').map(e=>e.amount),[40,60,60]);assert.equal(exposure(b).stacks,2);
});

test('natural matching weakness still spends exposure; shield damage counts',()=>{
  const b=setup(),t=getActor(b,'enemy_0');t.weaknesses=['fire'];t.shield=1000;expose(b);const [hit]=cast(b);assert.equal(hit.amount,0);assert.equal(hit.absorbed,60);assert.equal(exposure(b).stacks,2);
});

test('fully dodged physical casts spend no charges; magic is not subject to physical evasion',()=>{
  const b=setup(['arthur','iris'],'forest_patrol',()=>0);expose(b);getActor(b,'enemy_0').statuses.push({id:'evasive',remaining:2,stacks:1,sourceId:'enemy_0'});b.content.statuses.evasive={id:'evasive',name:'Test',kind:'buff',modifiers:{evasion:.85}};
  assert.equal(cast(b,{hits:4}).length,0);assert.equal(exposure(b).stacks,3);assert.equal(cast(b,{type:'magical'})[0].amount,60);assert.equal(exposure(b).stacks,2);
});

test('new exposure on hit benefits the next cast, not later hits of the applying cast',()=>{
  const b=setup();assert.deepEqual(cast(b,{hits:2,onHitStatus:{status:'exposure_fire'}}).map(e=>e.amount),[40,40]);assert.equal(exposure(b).stacks,2);
  assert.equal(cast(b)[0].amount,60);assert.equal(exposure(b).stacks,1);
});

test('refresh on hit does not refund the charge already reserved by that cast',()=>{
  const b=setup();expose(b,'enemy_0','fire',1);const hits=cast(b,{hits:2,onHitStatus:{status:'exposure_fire'}});assert.deepEqual(hits.map(e=>e.amount),[60,60]);assert.equal(exposure(b).stacks,2);
});

test('changing element mid-cast retains the claimed benefit but never transfers old charges to the new element',()=>{
  const b=setup();expose(b,'enemy_0','fire',3);const hits=cast(b,{hits:2,onHitStatus:{status:'exposure_water'}});
  assert.deepEqual(hits.map(e=>e.amount),[60,60]);assert.equal(exposure(b).id,'exposure_water');assert.equal(exposure(b).stacks,2);
  assert.equal(b.events.find(e=>e.type==='status_consumed').remaining,0);assert.equal(cast(b)[0].amount,40);assert.equal(exposure(b).stacks,2);
});

test('nested Aurora follow-up cannot borrow the last charge, while remaining original hits retain it',()=>{
  for(const stacks of [1,2,3]){
    const b=setup(['arthur','aurora']);expose(b,'enemy_0','thunder',stacks);
    const hits=cast(b,{element:'thunder',type:'magical',hits:2});
    assert.deepEqual(hits.filter(e=>e.sourceId==='arthur').map(e=>e.amount),[60,60]);
    const follow=hits.find(e=>e.sourceId==='aurora');assert.equal(follow.amount,stacks>1?48:32);assert.equal(follow.weakness,stacks>1);
    assert.equal(exposure(b)?.stacks??0,Math.max(0,stacks-2));
  }
});

test('follow-ups read the follower own exploitation buff, not the initiating ally buff',()=>{
  for(const owner of ['arthur','aurora']){
    const b=setup(['arthur','aurora']);expose(b,'enemy_0','thunder',3);buff(b,owner);
    const hits=cast(b,{element:'thunder',type:'magical'});assert.equal(hits.find(e=>e.sourceId==='arthur').amount,owner==='arthur'?80:60);assert.equal(hits.find(e=>e.sourceId==='aurora').amount,owner==='aurora'?64:48);
  }
});

test('Hộ ấn blocks the entire application before replacing the old elemental exposure; cleanse removes all stacks',()=>{
  const b=setup(),t=getActor(b,'enemy_0');expose(b,'enemy_0','water',2);
  const ward=Object.values(b.content.statuses).find(s=>s.effectImmunity);t.statuses.push({id:ward.id,remaining:null,stacks:1,charges:1,sourceId:t.id});expose(b);
  assert.equal(exposure(b).id,'exposure_water');assert.equal(exposure(b).stacks,2);
  const cleanse=custom(b,'test.cleanse','self',[{type:'cleanse'}],'enemy_0');use(b,'enemy_0',cleanse,'enemy_0');assert.equal(exposure(b),undefined);
});

test('dispel removes exploitation and restores the ordinary weakness multiplier',()=>{
  const b=setup();expose(b);buff(b);const id=custom(b,'test.dispel','enemy',[{type:'dispel',all:true}],'enemy_0');use(b,'enemy_0',id,'arthur');assert.equal(cast(b)[0].amount,60);
});

test('timed exposure expires on target main turns but does not tick during an extra turn',()=>{
  const b=setup();grant(b,'enemy_0','exposure_fire',2,1);b.phase='extra';use(b,'enemy_0','$defend','enemy_0');assert.equal(exposure(b).remaining,1);b.phase='main';use(b,'enemy_0','$defend','enemy_0');assert.equal(exposure(b),undefined);
});

test('basic attacks and dodge counterattacks spend charges like other direct casts',()=>{
  const b=setup(['arthur','takeshi'],'forest_patrol',()=>0);expose(b,'enemy_0','wind',3);const a=getActor(b,'arthur');a.element='wind';use(b,'arthur','$attack');assert.equal(exposure(b).stacks,2);
  use(b,'takeshi','takeshi.stance','takeshi');use(b,'enemy_0','enemy.slash','takeshi');assert.equal(exposure(b).stacks,1);assert.ok(b.events.some(e=>e.type==='damage'&&e.sourceId==='takeshi'&&e.weakness));
});

test('periodic damage and HP costs neither exploit nor consume exposure',()=>{
  const b=setup();expose(b,'enemy_0','plain',3);const t=getActor(b,'enemy_0');t.statuses.push({id:'kai_poison',remaining:2,stacks:1,potency:10,sourceId:'arthur'});
  b.queue=['arthur','enemy_0','iris','enemy_1','enemy_2'];b.cursor=0;executeAction(b,{actorId:'arthur',abilityId:'$defend',targetId:'arthur'});
  assert.equal(exposure(b).stacks,3);const tick=b.events.find(e=>e.periodic);assert.equal(tick.amount,10);assert.equal(tick.weakness,false);
  const self=getActor(b,'arthur');self.statuses.push({id:'exposure_plain',remaining:null,stacks:3,sourceId:'enemy_0'});const skill=custom(b,'test.hp','self',[{type:'resource',resource:'mp',amount:1}]);b.content.abilities[skill].cost={hpMaxRatio:.1};use(b,'arthur',skill,'arthur');assert.equal(exposure(b,'arthur').stacks,3);
});

test('artificial weakness triggers Miraebolis suppression once per cast and Iris weakness MP bonus',()=>{
  const b=setup(['arthur','iris'],'miraebolis_superboss');expose(b,'enemy_0','fire',3);const boss=getActor(b,'enemy_0');boss.stats.maxHp=boss.hp=3600;
  const iris=getActor(b,'iris');iris.passive={type:'buffed_ally_mp',name:'Test',amount:3,weaknessBonus:2,statusIds:['empowered']};iris.mp=0;getActor(b,'arthur').statuses.push({id:'empowered',remaining:3,stacks:1,sourceId:'iris'});
  cast(b,{hits:3});assert.equal(boss.statuses.find(s=>s.id==='dragon_suppressed').stacks,1);assert.equal(iris.mp,5);assert.equal(exposure(b).stacks,2);
});

test('UI descriptions show stacks, element and the replacement 100% bonus; logs reflect the real multiplier',()=>{
  const b=setup();expose(b);buff(b);const t=getActor(b,'enemy_0');const info=statusDetails(exposure(b),t,b,b.content);assert.match(info.lines.join(' '),/Hỏa/);assert.match(info.lines.join(' '),/Còn 3 tầng/);assert.doesNotMatch(info.lines.join(' '),/khi tắt/);
  const copy=skillPresentation({target:'ally',effects:[{type:'status',status:'weakness_exploitation',duration:2}]},getActor(b,'arthur'),b.content);assert.match(copy.facts.join(' '),/100%/);
  cast(b);assert.ok(b.log.some(line=>line.includes('yếu Hỏa (+100%)')));assert.deepEqual(weaknessElements(b.content,t),['fire']);
});

test('content rejects invalid element/cap/kind/multiplier/stacks and accepts reusable definitions',()=>{
  assert.deepEqual(validateContent(content),[]);
  for(const patch of [{exposedElement:'ice'},{maxStacks:4},{kind:'buff'}]){const c=structuredClone(content);Object.assign(c.statuses.exposure_fire,patch);assert.match(validateContent(c).join('\n'),/invalid elemental exposure/);}
  for(const value of [1.5,3,NaN,'2']){const c=structuredClone(content);c.statuses.weakness_exploitation.weaknessMultiplier=value;assert.match(validateContent(c).join('\n'),/invalid weakness multiplier/);}
  for(const stacks of [0,4,1.5]){const c=structuredClone(content);c.abilities['arthur.light_slash'].effects.push({type:'status',status:'exposure_fire',stacks});assert.match(validateContent(c).join('\n'),/invalid exposure stacks/);}
  const c=structuredClone(content);c.abilities['arthur.light_slash'].effects[0].onHitStatus={status:'exposure_fire',stacks:3};assert.deepEqual(validateContent(c),[]);
});

test('Kreider-style debuff scaling stays active on every hit using the last exposure charge',()=>{
  const b=setup();getActor(b,'arthur').passive={type:'target_debuff_damage',ratio:.3,cap:.9};expose(b,'enemy_0','fire',1);
  assert.deepEqual(cast(b,{hits:3}).map(h=>h.amount),[78,78,78]);assert.equal(exposure(b),undefined);
});

test('cover consumes the actual recipient exposure, never the selected protected target charge',()=>{
  const b=setup();expose(b,'enemy_0','fire',3);expose(b,'enemy_1','fire',3);
  const definition=Object.values(b.content.statuses).find(s=>s.cover);getActor(b,'enemy_0').statuses.push({id:definition.id,remaining:2,stacks:1,sourceId:'enemy_1'});
  const hits=cast(b,{hits:2});assert.ok(hits.every(h=>h.targetId==='enemy_1'&&h.weakness));assert.equal(exposure(b).stacks,3);assert.equal(exposure(b,'enemy_1').stacks,2);
});

test('phase changes preserve exposure and exploitation; independent battles start without them',()=>{
  const b=setup(['arthur','iris'],'miraebolis_superboss');expose(b,'enemy_0','fire',3);buff(b);const boss=getActor(b,'enemy_0');boss.stats.maxHp=3600;boss.hp=2400;
  cast(b);assert.equal(boss.bossState.phase,2);assert.equal(exposure(b).stacks,2);assert.ok(getActor(b,'arthur').statuses.some(s=>s.id==='weakness_exploitation'));
  const fresh=setup();assert.equal(exposure(fresh),undefined);assert.equal(getActor(fresh,'arthur').statuses.length,0);
});

test('story waves carry party statuses and never carry enemy exposure into new opponents',()=>{
  const c=createCampaign(content);c.party=['fiona','arthur'];const run=createStoryRun(content,c,'fiona_story_eins',()=>.99),b=run.battle;
  getActor(b,'arthur').statuses.push({id:'exposure_fire',remaining:null,stacks:2,sourceId:b.actors.find(a=>a.team==='enemy').id},{id:'weakness_exploitation',remaining:3,stacks:1,sourceId:'fiona'});
  b.actors.find(a=>a.team==='enemy').statuses.push({id:'exposure_fire',remaining:null,stacks:3,sourceId:'arthur'});b.outcome='victory';
  const next=advanceStoryWave(content,run);assert.equal(exposure(next,'arthur').stacks,2);assert.ok(getActor(next,'arthur').statuses.some(s=>s.id==='weakness_exploitation'));assert.ok(next.actors.filter(a=>a.team==='enemy').every(a=>!exposure(next,a.id)));
});
