import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,getActor,forecastBattleAction} from '../src/core/battle.js';
import {createArenaBattle} from '../src/core/arena.js';
import {criticalMultiplier} from '../src/core/critical.js';
import {resolveCharacter} from '../src/core/progression.js';
import {validateContent} from '../src/core/content.js';
import {skillPresentation} from '../src/ui/skill-copy.js';
import {damageFlags,isOnlyNormalDamage} from '../src/core/damage-kind.js';
const c=await loadContent();
const gearIds=['martial_insight','arcane_insight'];
function save(id){const s=createGameSave(c);s.party=id==='flynn'?['flynn','elaine','iris','arthur']:['bianca','shashthi','iris','arthur'];s.partyPresets[0].slots=[...s.party];s.unlockedCharacterIds=[...new Set([...s.unlockedCharacterIds,...s.party])];return s;}
function fixture(id,gearId,active=false){const b=createBattle(structuredClone(c),save(id),'forest_patrol',()=>.99);for(const a of b.actors){a.hp=a.stats.maxHp=1000000;a.mp=a.stats.maxMp=10000;a.stats.attack=a.stats.magic=150;a.baseStats={...a.stats};if(a.team==='enemy'){a.stats.attack=a.stats.magic=a.stats.defense=a.stats.resistance=0;a.weaknesses=[];a.resistances={};}}if(gearId)getActor(b,id).gearEffects.push(structuredClone(c.gearEffects[gearId]));if(active){if(id==='flynn'){cast(b,id,'flynn.charge');cast(b,'elaine','$attack');}else{cast(b,id,'bianca.opening');cast(b,'arthur','$attack');}assert.equal(b.moonlight.party.active.id,id==='flynn'?'thunder_wrath':'bountiful_seed');}return b;}
function cast(b,id,ability){b.queue=[id,...b.actors.filter(a=>a.id!==id&&a.hp>0).map(a=>a.id)];b.cursor=0;executeAction(b,{actorId:id,abilityId:ability,targetId:'enemy_0'});}
function sample(b,id){return b.events.filter(e=>e.type==='damage'&&(e.sourceId===id||e.commanderId===id)).map(e=>({sourceId:e.sourceId,commanderId:e.commanderId,amount:e.amount,absorbed:e.absorbed,effectDamage:e.effectDamage,normalDamage:e.normalDamage}));}

for(const id of ['flynn','bianca'])for(const gearId of gearIds){
 test(`${id}: ${gearId} uses damage flags: inactive normal hits qualify, active Moon/commands never proc`,()=>{
  for(const active of [false,true])for(const stacks of [0,3]){
   for(const ability of id==='flynn'?['$attack','flynn.charge','flynn.breaker','flynn.burst']:['$attack','bianca.opening','bianca.harvest']){
    const plain=fixture(id,null,active),equipped=fixture(id,gearId,active);
    for(const b of [plain,equipped]){const a=getActor(b,id);a.cooldowns={};a.resourceValues[id==='flynn'?'storm_charge':'harvest_credit']=stacks;cast(b,id,ability);}
    assert.ok(sample(plain,id).length,`${id}/${ability} must actually deal damage`);
    const base=sample(plain,id),actual=sample(equipped,id);assert.equal(actual.length,base.length);
    for(let i=0;i<base.length;i++){
     if(base[i].effectDamage)assert.deepEqual(actual[i],base[i],ability+' Moon damage must not proc');
     else{assert.equal(base[i].normalDamage,true);assert.ok(actual[i].amount>base[i].amount,ability+' pure normal damage must qualify regardless of identity');}
    }
   }
  }
 });
}
test('both Arena sides use the same flag policy, with no character exclusions or rejected-hit RNG',()=>{
 for(const id of ['flynn','bianca']){
  const b=createArenaBattle(c,save(id),'mirror',193);
  assert.equal(b.actors.filter(a=>a.characterId===id).length,2);
  for(const a of b.actors.filter(a=>a.characterId===id)){
   for(const gearId of gearIds)a.gearEffects.push(structuredClone(c.gearEffects[gearId]));
   a.baseStats={...a.stats,attack:75,magic:75};let rolls=0;const ctx={};
   const probe={...b,random:()=>{rolls++;return 0;}};
   assert.equal(criticalMultiplier(probe,a,{element:'plain',additionalElements:['moon']},ctx),1);
   assert.equal(rolls,0);assert.equal(ctx.criticalChecks,undefined);
   assert.equal(criticalMultiplier(probe,a,{element:'plain',normalDamage:true},{}),1.5);assert.equal(rolls,1);
  }
 }
});
test('forecast honors Moon flags; unconditional +20 percent stat remains an ordinary equipment bonus',()=>{
 for(const id of ['flynn','bianca'])for(const gearId of gearIds){
  const b=fixture(id,gearId,true),a=getActor(b,id);b.queue=[id,'enemy_0'];b.cursor=0;
  const f=forecastBattleAction(b,{actorId:id,abilityId:'$attack',targetId:'enemy_0'}),control=fixture(id,null,true);cast(control,id,'$attack');assert.deepEqual(sample(f,id),sample(control,id));
  const copy=skillPresentation(c.abilities[id==='flynn'?'flynn.burst':'bianca.harvest'],a,c);assert.ok(!copy.facts.some(s=>s.includes('Ấn Võ Tâm')||s.includes('Ấn Thuật Tâm')));
  const s=save(id),key=gearId==='martial_insight'?'attack':'magic';const before=resolveCharacter(c,s,id).stats[key];s.craftedGearSerial=1;s.gear.push({id:'rune_1',typeId:'t4_effect',effectId:gearId,stats:{}});s.equipment[id]=['rune_1',null,null];assert.ok(Math.abs(resolveCharacter(c,s,id).stats[key]-before*1.2)<1e-8);
 }
});
test('ordinary eligible characters still proc; recipes cannot reintroduce a character blocklist',()=>{
 const a={id:'arthur',characterId:'arthur',stats:{attack:150,magic:150},gearEffects:[structuredClone(c.gearEffects.martial_insight)]};assert.equal(criticalMultiplier({random:()=>0},a,{element:'plain'},{}),1.5);
 for(const ids of [['missing_character'],['flynn','flynn']]){const bad=structuredClone(c);bad.gearEffects.martial_insight.effect.excludedCharacterIds=ids;assert.ok(validateContent(bad).some(s=>s.includes('martial_insight')));}
});

test('Moon alone classifies effect damage; stale or future annotations cannot create another category',()=>{
 const a={id:'future_unit',stats:{attack:150,magic:150},gearEffects:gearIds.map(id=>structuredClone(c.gearEffects[id]))};
 let rolls=0;const b={random:()=>{rolls++;return 0;}};
 for(const packet of [{element:'moon'},{element:'plain',additionalElements:['moon'],normalDamage:true}]){assert.equal(isOnlyNormalDamage(packet),false);const ctx={};assert.equal(criticalMultiplier(b,a,packet,ctx),1);assert.equal(ctx.criticalChecks,undefined);}
 assert.equal(rolls,0);
 for(const packet of [{element:'plain'},{normalDamage:true,effectDamage:true},{normalDamage:true,futureDamage:true},{normalDamage:false},{normalDamage:true,damageFlags:{otherKind:true}},{normalDamage:true,area:true,reaction:true,automatic:true}])assert.equal(criticalMultiplier(b,a,packet,{}),1.5);
 assert.deepEqual(damageFlags({normalDamage:true,futureDamage:true}),{normalDamage:true,futureDamage:true,effectDamage:false});
});

test('engine preserves explicit and future damage flags through hit and event, including mixed packets',()=>{
 const b=fixture('bianca','arcane_insight'),a=getActor(b,'bianca');a.passive=null;
 for(const e of b.actors.filter(x=>x.team==='enemy'))e.baseStats.defense=e.baseStats.resistance=0;
 const id='test.futureFlags';b.content.abilities[id]={id,name:'Thử cờ sát thương',target:'enemy',cost:{mp:0},effects:[
  {type:'damage',damageType:'magical',element:'earth',scalingStat:'magic',multiplier:1,normalDamage:true},
  {type:'damage',damageType:'magical',element:'earth',scalingStat:'magic',multiplier:1,normalDamage:true,effectDamage:true},
  {type:'damage',damageType:'magical',element:'earth',scalingStat:'magic',multiplier:1,normalDamage:true,damageFlags:{futureKind:true}}
 ]};a.abilities.push(id);cast(b,'bianca',id);
 const hits=b.events.filter(e=>e.type==='damage'&&e.sourceId===a.id);assert.deepEqual(hits.map(h=>h.amount),[225,225,225]);assert.equal(hits[1].effectDamage,false);assert.equal(hits[2].futureKind,true);assert.equal(hits[2].damageFlags.futureKind,true);assert.equal(isOnlyNormalDamage(hits[2]),true);
});
