import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,activeActor,targetsFor,abilityAvailability,forecastBattleAction,planAutoBattleTurn} from '../src/core/battle.js';
import {createArenaBattle} from '../src/core/arena.js';
import {resolveRankedAbility} from '../src/core/skill-resolver.js';
import {battleStat} from '../src/core/stat-values.js';
import {validateContent} from '../src/core/content.js';
import {seededRandom} from '../src/core/random.js';
import {skillPresentation,passivePresentation} from '../src/ui/skill-copy.js';
const base=await loadContent();
const effect=(element='fire',extra={})=>({type:'damage',damageType:'magical',element,multiplier:1,...extra});
function setup(party=['ember','freya','myonne','fiona']){const c=structuredClone(base),save=createGameSave(c);save.party=party;save.partyPresets[0].slots=[...party];save.unlockedCharacterIds=Object.keys(c.characters);
 const b=createBattle(c,save,'forest_patrol',seededRandom(5),{enemyLevel:1});for(const a of b.actors){a.hp=a.stats.maxHp=10000;a.mp=100;a.stats.maxMp=1000;a.statuses=[];a.gearEffects=[];a.cooldowns={};if(!['ember','myonne'].includes(a.characterId??a.id))a.passive=null;}const unit=id=>b.actors.find(a=>(a.characterId??a.id)===id);const enemies=b.actors.filter(a=>a.team==='enemy');for(const t of enemies){t.weaknesses=[];t.damageTypeWeaknesses=[];t.resistances={};}
 return {c,b,save,ember:unit('ember'),myonne:unit('myonne'),freya:unit('freya'),fiona:unit('fiona'),enemies,t:enemies[0]};}
function command(b,a,target,effects){const id='test.support.'+a.id;b.content.abilities[id]={id,name:'Thử nghiệm',target,effects,cost:{mp:0},skillLineId:id,growthProfile:'fixed',rankable:false,fixedReason:'Kiểm tra'};if(!a.abilities.includes(id))a.abilities.push(id);return id;}
function cast(b,a,id,t=a){b.queue=[a.id,b.actors.find(x=>x.id!==a.id&&x.id!==t.id).id];b.cursor=0;executeAction(b,{actorId:a.id,abilityId:id,targetId:t.id});}
const fua=(b,e)=>b.events.filter(x=>x.type==='reaction'&&x.sourceId===e.id);
test('official recruitment, faction labels and old-save reconciliation include both supports without free unlocks',()=>{
 assert.ok(base.banners.standard.characterPool.includes('ember'));assert.ok(base.banners.standard.characterPool.includes('myonne'));assert.equal(base.characters.ember.affiliation,'hunters_guild');assert.equal(base.characters.myonne.affiliation,'drageshelmfjall_merchants');
 const save=createGameSave(base);assert.ok(!save.unlockedCharacterIds.includes('ember'));delete save.characters.ember;delete save.characters.myonne;
 const loaded=decodeGameSave(encodeGameSave(save,base),base);assert.ok(loaded.characters.ember);assert.ok(loaded.characters.myonne);assert.deepEqual(validateContent(base),[]);
});
test('element filters restrict legal and actual recipients, including the support herself',()=>{
 const {b,c,ember,myonne,freya,fiona}=setup();assert.deepEqual(targetsFor(b,ember,c.abilities['ember.cheer']).map(a=>a.id),[ember.id,freya.id]);assert.deepEqual(targetsFor(b,myonne,c.abilities['myonne.offer']).map(a=>a.id),[myonne.id,fiona.id]);
 const mp=myonne.mp;b.queue=[myonne.id,ember.id];b.cursor=0;assert.throws(()=>executeAction(b,{actorId:myonne.id,abilityId:'myonne.offer',targetId:freya.id}));assert.equal(myonne.mp,mp);assert.equal(myonne.cooldowns['myonne.offer'],undefined);
 cast(b,ember,'ember.cheer');for(const a of [ember,freya])assert.equal(a.statuses.find(s=>s.id==='ember_fervor').remaining,3);for(const a of [myonne,fiona])assert.ok(!a.statuses.some(s=>s.id==='ember_fervor'));
 const fake={...c.abilities['myonne.offer'],targetElement:'moon'};assert.equal(abilityAvailability(b,myonne,fake).ok,false);
});
test('Rank scales both ATK/MAG while exploitation, MP, durations and exposures stay authored',()=>{
 const {c,ember,myonne}=setup();const fire=resolveRankedAbility(c,ember,c.abilities['ember.cheer'],5),dark=resolveRankedAbility(c,myonne,c.abilities['myonne.offer'],5);
 assert.ok(Math.abs(fire.effects[0].appliedModifiers.attack-.3*1.05**4)<1e-9);assert.equal(fire.effects[0].appliedModifiers.magic,fire.effects[0].appliedModifiers.attack);assert.equal(fire.effects[0].duration,3);assert.equal(dark.effects[0].duration,2);assert.equal(c.statuses.myonne_vip.weaknessMultiplier,2);
 assert.ok(Math.abs(dark.effects[0].appliedModifiers.magic-.25*1.05**4)<1e-9);assert.equal(resolveRankedAbility(c,ember,c.abilities['ember.mark'],5).effects[0].stacks,3);
});
test('Ember follows another Fire ally once per round, spending a separate exposure after the source cast',()=>{
 const {b,ember,freya,t}=setup();cast(b,ember,'ember.mark',t);assert.equal(t.statuses.find(s=>s.id==='exposure_fire').stacks,3);
 const id=command(b,freya,'enemy',[effect()]);cast(b,freya,id,t);assert.equal(fua(b,ember).length,1);assert.equal(t.statuses.find(s=>s.id==='exposure_fire').stacks,1);
 const payments=b.events.filter(e=>e.type==='status_consumed');assert.equal(payments.length,2);assert.deepEqual(payments.map(e=>e.sourceId),[freya.id,ember.id]);
 cast(b,freya,id,t);assert.equal(fua(b,ember).length,0,'second cast in round has no FuA');assert.ok(!t.statuses.some(s=>s.id==='exposure_fire'));
});
test('Ember cannot self-trigger, use basics or another character element, and reactions cannot recurse',()=>{
 const {b,ember,freya,myonne,t}=setup();cast(b,ember,'ember.firebreak',t);cast(b,freya,'$attack',t);cast(b,myonne,command(b,myonne,'enemy',[effect()]),t);assert.equal(fua(b,ember).length,0);
 cast(b,freya,command(b,freya,'enemy',[effect('water')]),t);assert.equal(fua(b,ember).length,0);
 cast(b,freya,command(b,freya,'enemy',[effect()]),t);assert.equal(fua(b,ember).length,1);assert.equal(b.events.filter(e=>e.type==='damage'&&e.sourceId===ember.id).length,1,'only the FuA belongs to this action');
});
test('AoE and multi-hit select one living damaged target; dead anchor falls back and all dead consumes no quota',()=>{
 const {b,ember,freya,enemies}=setup();const id=command(b,freya,'all_enemies',[effect('fire',{hits:2})]);enemies[1].hp=1;cast(b,freya,id,enemies[1]);assert.equal(fua(b,ember).length,1);assert.equal(fua(b,ember)[0].targetId,enemies[0].id);
 const single=setup();single.t.hp=1;cast(single.b,single.freya,command(single.b,single.freya,'enemy',[effect()]),single.t);assert.equal(fua(single.b,single.ember).length,0);
 cast(single.b,single.freya,command(single.b,single.freya,'enemy',[effect()]),single.enemies[1]);assert.equal(fua(single.b,single.ember).length,1,'kill with no survivor did not reserve quota');
});
test('shield-only hits qualify for Ember and Myonne, dodges do not',()=>{
 const {b,ember,freya,myonne,fiona,t}=setup();t.shield=999;const hp=t.hp;cast(b,freya,command(b,freya,'enemy',[effect()]),t);assert.equal(t.hp,hp);assert.equal(fua(b,ember).length,1);
 t.weaknesses=['dark'];const mp=fiona.mp;cast(b,fiona,command(b,fiona,'enemy',[effect('dark')]),t);assert.equal(fiona.mp,mp+3);
 const missed=setup();missed.t.combatModes={dodge:{name:'Dodge',lifetime:'permanent',allowedAbilities:['$attack','$defend'],evasion:{damageTypes:['physical','magical'],baseChance:1,perBaseSpeed:0,cap:1}}};missed.t.activeMode='dodge';missed.b.random=()=>0;
 cast(missed.b,missed.freya,command(missed.b,missed.freya,'enemy',[effect()]),missed.t);assert.ok(missed.b.events.some(e=>e.type==='dodge'));assert.equal(fua(missed.b,missed.ember).length,0);
});
test('Myonne refunds only another Dark ally active Dark weakness hit once per round, without an extra attack',()=>{
 const {b,myonne,fiona,t}=setup();cast(b,myonne,'myonne.clause',t);assert.equal(t.statuses.find(s=>s.id==='exposure_dark').stacks,2);
 const id=command(b,fiona,'enemy',[effect('dark',{hits:2})]),mp=fiona.mp;cast(b,fiona,id,t);assert.equal(fiona.mp,mp+3);assert.equal(t.statuses.find(s=>s.id==='exposure_dark').stacks,1);assert.equal(fua(b,myonne).length,0);
 cast(b,fiona,id,t);assert.equal(fiona.mp,mp+3);
});
test('refund excludes basics, self, wrong ally element and nonweak hits; full MP preserves quota',()=>{
 const {b,myonne,fiona,freya,t}=setup();const mp=fiona.mp;cast(b,fiona,command(b,fiona,'enemy',[effect('dark')]),t);assert.equal(fiona.mp,mp);
 t.weaknesses=['dark'];cast(b,fiona,'$attack',t);cast(b,myonne,'myonne.collect',t);const fireMp=freya.mp;cast(b,freya,command(b,freya,'enemy',[effect('dark')]),t);assert.equal(freya.mp,fireMp);assert.equal(fiona.mp,mp);
 fiona.mp=fiona.stats.maxMp;const id=command(b,fiona,'enemy',[effect('dark')]);cast(b,fiona,id,t);fiona.mp-=10;cast(b,fiona,id,t);assert.equal(fiona.mp,fiona.stats.maxMp-7);
});
test('VIP grants exploitation only to a Dark ally; two main turns, extra does not tick, damage is x2',()=>{
 const {b,c,myonne,fiona,t}=setup();cast(b,myonne,'myonne.offer',fiona);assert.equal(fiona.statuses.find(s=>s.id==='myonne_vip').remaining,2);t.weaknesses=['dark'];
 const id=command(b,fiona,'enemy',[effect('dark')]);b.phase='extra';cast(b,fiona,id,t);assert.equal(fiona.statuses.find(s=>s.id==='myonne_vip').remaining,2);assert.equal(b.events.filter(e=>e.type==='damage'&&e.sourceId===fiona.id).at(-1).weaknessMultiplier,2);
 b.phase='main';cast(b,fiona,id,t);assert.equal(fiona.statuses.find(s=>s.id==='myonne_vip').remaining,1);cast(b,fiona,id,t);assert.ok(!fiona.statuses.some(s=>s.id==='myonne_vip'));
});
test('Myonne on-hit dispel removes one real target buff, never on dodge',()=>{
 const {b,myonne,t}=setup();t.statuses.push({id:'guard',remaining:3},{id:'taunt',remaining:3});cast(b,myonne,'myonne.collect',t);assert.equal(t.statuses.filter(s=>['guard','taunt'].includes(s.id)).length,1);assert.equal(b.events.find(e=>e.type==='dispel').amount,1);
 const miss=setup();miss.t.combatModes={dodge:{name:'Dodge',lifetime:'turns',durationTurns:3,allowedAbilities:['$attack','$defend'],evasion:{damageTypes:['physical','magical'],baseChance:1,perBaseSpeed:0,cap:1}}};miss.t.activeMode='dodge';miss.t.modeTurnsRemaining=3;miss.t.statuses=[{id:'guard',remaining:3}];miss.b.random=()=>0;
 cast(miss.b,miss.myonne,'myonne.collect',miss.t);assert.ok(miss.b.events.some(e=>e.type==='dodge'));assert.ok(miss.t.statuses.some(s=>s.id==='guard'));assert.ok(!miss.b.events.some(e=>e.type==='dispel'));
});
test('forecast cannot consume live quota, MP or exposure and new round re-arms both passives',()=>{
 const {b,ember,freya,t}=setup();cast(b,ember,'ember.mark',t);const id=command(b,freya,'enemy',[effect()]);b.queue=[freya.id,t.id];b.cursor=0;const trial=forecastBattleAction(b,{actorId:freya.id,abilityId:id,targetId:t.id});assert.equal(fua(trial,ember).length,1);assert.equal(fua(b,ember).length,0);assert.equal(t.statuses.find(s=>s.id==='exposure_fire').stacks,3);
 cast(b,freya,id,t);assert.equal(fua(b,ember).length,1);b.round++;cast(b,freya,id,t);assert.equal(fua(b,ember).length,1);
});
test('Ward and Seal block the data-defined exposure and element buffs',()=>{
 const {b,ember,myonne,fiona,t}=setup();t.statuses=[{id:'effect_ward',remaining:null,charges:1}];cast(b,ember,'ember.mark',t);assert.ok(!t.statuses.some(s=>s.id==='exposure_fire'));assert.equal(t.statuses.length,0);
 fiona.statuses=[{id:'buff_seal',remaining:null,charges:1}];cast(b,myonne,'myonne.offer',fiona);assert.ok(!fiona.statuses.some(s=>s.id==='myonne_vip'));assert.equal(fiona.statuses.length,0);
});
test('validator rejects invalid targeting/passives/on-hit dispel; preview stays Vietnamese',()=>{
 const {c,ember,myonne}=setup();assert.match(skillPresentation(c.abilities['ember.cheer'],ember,c).facts.join(' '),/đồng đội hệ Hỏa/);assert.match(passivePresentation(myonne,c).facts.join(' '),/3 MP/);
 c.abilities['ember.cheer'].targetElement='unknown';c.abilities['myonne.collect'].effects[0].onHitDispelCount=-1;let errors=validateContent(c);assert.ok(errors.some(e=>e.includes('elemental ally filter')));assert.ok(errors.some(e=>e.includes('on-hit dispel')));c.characters.ember.passive.followUpAbility='bad';errors=validateContent(c);assert.ok(errors.some(e=>e.includes('elemental follow-up')));
});

test('real main/extra progression shares the FuA quota and resets it next round',()=>{
 const {b,ember,freya,t}=setup(['ember','freya','lionel','myonne']);const fire=command(b,freya,'enemy',[effect()]);let extra=false,next=false,marked=false;
 for(let i=0;i<65&&!next;i++){
  const a=activeActor(b);let abilityId='$defend',targetId=a.id;
  if(a.id===ember.id&&!marked){abilityId='ember.mark';targetId=t.id;marked=true;}
  if(a.id==='lionel'&&b.round===1){abilityId='lionel.encore';targetId=freya.id;}
  if(a.id===freya.id){abilityId=fire;targetId=t.id;}
  const round=b.round,phase=b.phase;executeAction(b,{actorId:a.id,abilityId,targetId});
  if(a.id===freya.id&&phase==='extra'&&round===1){extra=true;assert.equal(fua(b,ember).length,0,'extra does not get a second activation');}
  if(a.id===freya.id&&round===2){next=true;assert.equal(fua(b,ember).length,1,'new round re-arms');}
 }
 assert.ok(marked&&extra&&next);assert.equal(b.log.filter(s=>s.includes('Ember Liên kích')).length,2);
});
test('stun on a support does not disable its passive, and fallen support cannot react',()=>{
 const {b,ember,freya,t}=setup();ember.statuses.push({id:'stunned',remaining:2});const id=command(b,freya,'enemy',[effect()]);cast(b,freya,id,t);assert.equal(fua(b,ember).length,1);
 b.round++;ember.hp=0;cast(b,freya,id,t);assert.equal(fua(b,ember).length,0);
});
test('elemental ally AI prioritizes a Dark damage dealer for the VIP window',()=>{
 const {b,myonne,fiona}=setup();myonne.mp=myonne.stats.maxMp;b.queue=[myonne.id,fiona.id];b.cursor=0;const plan=planAutoBattleTurn(b);assert.equal(plan.abilityId,'myonne.offer');assert.equal(plan.targetId,fiona.id);
});

test('PvP mirror separates both specialist quotas and MP recipients by unique actor ID',()=>{
 const c=structuredClone(base);for(const [id,element]of [['freya','fire'],['fiona','dark']]){const skill={id:'test.'+id,name:'Thử nghiệm',target:'enemy',cost:{mp:5},effects:[effect(element)],skillLineId:'test.'+id,growthProfile:'fixed',rankable:false,fixedReason:'Kiểm tra'};c.abilities[skill.id]=skill;c.characters[id].abilities.push(skill.id);}
 const save=createGameSave(c);save.party=['ember','freya','myonne','fiona'];save.partyPresets[0].slots=[...save.party];save.unlockedCharacterIds=Object.keys(c.characters);const b=createArenaBattle(c,save);for(const a of b.actors){a.hp=a.stats.maxHp=10000;a.mp=30;a.statuses=[];a.gearEffects=[];if(!['ember','myonne'].includes(a.characterId))a.passive=null;}
 const unit=(team,id)=>b.actors.find(a=>a.team===team&&a.characterId===id),run=(a,id,t)=>{b.queue=[a.id,b.actors.find(x=>x.id!==a.id&&x.id!==t.id).id];b.cursor=0;executeAction(b,{actorId:a.id,abilityId:id,targetId:t.id});};
 run(unit('party','freya'),'test.freya',unit('enemy','freya'));assert.equal(fua(b,unit('party','ember')).length,1);assert.equal(fua(b,unit('enemy','ember')).length,0);
 run(unit('enemy','freya'),'test.freya',unit('party','freya'));assert.equal(fua(b,unit('enemy','ember')).length,1);
 const victim=unit('party','ember'),caster=unit('enemy','fiona');victim.weaknesses=['dark'];run(caster,'test.fiona',victim);assert.equal(caster.mp,28);const refund=b.events.find(e=>e.type==='mp_restore');assert.equal(refund.sourceId,unit('enemy','myonne').id);assert.equal(refund.targetId,caster.id);assert.equal(unit('party','fiona').mp,30);
});
test('on-hit dispel follows a guardian and synchronizes removed HP/MP capacity buffs immediately',()=>{
 const {b,c,myonne,t,enemies}=setup();const guardian=enemies[1];t.statuses=[{id:'cover',remaining:3,sourceId:guardian.id}];guardian.statuses=[{id:'guard',remaining:3}];
 // Use the existing personal-cover status without changing the target slot.
 const coverId=Object.values(c.statuses).find(s=>s.cover&&!s.coverTeam&&!s.coverArea).id;t.statuses[0].id=coverId;
 cast(b,myonne,'myonne.collect',t);assert.equal(b.events.find(e=>e.type==='dispel').targetId,guardian.id);assert.ok(t.statuses.some(s=>s.id===coverId));
 const fresh=setup();fresh.t.hpCapacityBase=10000;fresh.t.stats.maxHp=13500;fresh.t.hp=13000;fresh.t.statuses=[{id:'heimdall_vitality',remaining:3}];cast(fresh.b,fresh.myonne,'myonne.collect',fresh.t);assert.equal(fresh.t.stats.maxHp,10000);assert.ok(fresh.t.hp<=10000);
});
