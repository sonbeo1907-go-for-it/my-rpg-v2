import test from 'node:test';import assert from 'node:assert/strict';
import { loadContent } from '../scripts/load-content.mjs';
import { createCampaign,resolveCharacter,serializeCampaign,deserializeCampaign } from '../src/core/progression.js';
import { createBattle,executeAction,getActor,basicAbility } from '../src/core/battle.js';
import { battleStat } from '../src/core/stat-values.js';
import { passiveDescription,skillScaling,skillCost } from '../src/ui/skill-presentation.js';
import { validateContent } from '../src/core/content.js';
const content=await loadContent();
function setup(party,source=content){const c=createCampaign(source);c.party=party;c.unlockedCharacterIds=Object.keys(source.characters);const b=createBattle(source,c,'forest_patrol',()=>.99);for(const e of b.actors.filter(a=>a.team==='enemy'))e.hp=e.stats.maxHp=10000;return b;}
function use(b,id,ability,target=id){b.queue=[id,...b.actors.filter(a=>a.id!==id&&a.hp>0).map(a=>a.id)];b.cursor=0;executeAction(b,{actorId:id,abilityId:ability,targetId:target});}
const damage=b=>b.events.filter(e=>e.type==='damage');
test('seven recruits have exact final stats, three skills, authored basics and locked migration/gacha availability',()=>{
 const expected={helena:[120,180,8,35,10,27,13],leonardo:[290,105,18,12,23,38,12],kyle:[150,95,9,26,13,24,23],iwayn:[175,80,35,10,19,18,16],percival:[210,70,30,11,27,25,13],mandred:[240,55,29,8,24,17,13],lionel:[170,105,10,28,16,25,21]};
 const c=createCampaign(content);for(const[id,stats]of Object.entries(expected)){
  const a=content.characters[id];assert.deepEqual(Object.values(a.stats),stats);assert.equal(a.abilities.length,3);assert.ok(content.banners.standard.characterPool.includes(id));assert.ok(!c.unlockedCharacterIds.includes(id));assert.equal(basicAbility(a).effects[0].element,a.element);
  assert.ok(passiveDescription(a,content));
 }
 const old=JSON.parse(serializeCampaign(c));for(const id of Object.keys(expected))delete old.characters[id];const restored=deserializeCampaign(JSON.stringify(old),content);for(const id of Object.keys(expected)){assert.ok(restored.characters[id]);assert.ok(!restored.unlockedCharacterIds.includes(id));}
});
test('Helena extra MP is charged once per AoE cast, scales with partial MP and excludes shields/basics',()=>{
 for(const[mp,remaining,bonus]of[[180,162,1.5],[15,0,1.25],[12,0,1]]){
  const b=setup(['helena']),a=getActor(b,'helena');a.mp=mp;use(b,a.id,'helena.rain','enemy_0');assert.equal(a.mp,remaining);assert.equal(damage(b).length,3);
  const control=setup(['helena']);getActor(control,'helena').passive=null;use(control,a.id,'helena.rain','enemy_0');
  for(let i=0;i<3;i++)assert.ok(Math.abs(damage(b)[i].amount-damage(control)[i].amount*bonus)<2);
 }
 const shield=setup(['helena']);use(shield,'helena','helena.parasol');assert.equal(getActor(shield,'helena').mp,168);assert.equal(getActor(shield,'helena').shield,53);
 const basic=setup(['helena']);use(basic,'helena','$attack','enemy_0');assert.equal(getActor(basic,'helena').mp,180);
 assert.match(skillCost(content.abilities['helena.ball'],content.characters.helena),/36–54 MP/);
});
test('Helena AoE never triggers Aurora; new active damage skill follows generic extra-cost rules',()=>{
 const c=structuredClone(content);c.abilities['helena.test']={id:'helena.test',name:'Thử',target:'all_enemies',cost:{mp:5},effects:[{type:'damage',damageType:'magical',element:'water',multiplier:1}]};c.characters.helena.abilities.push('helena.test');
 const b=setup(['helena','aurora'],c);use(b,'helena','helena.test','enemy_0');assert.equal(getActor(b,'helena').mp,172);assert.equal(getActor(b,'aurora').resourceValues[getActor(b,'aurora').passive.resource],0);
});
test('Leonardo RES permanent, self RES buff and ally Cover redirect magic single hits but never AoE; cleanse keeps buffs',()=>{
 const b=setup(['leonardo','helena']);const l=getActor(b,'leonardo'),h=getActor(b,'helena');assert.ok(Math.abs(battleStat(content,l,'resistance')-45.6)<1e-9);
 use(b,l.id,'leonardo.cover',h.id);assert.ok(Math.abs(battleStat(content,l,'resistance')-57)<1e-9);
 getActor(b,'enemy_0').abilities.push('helena.rain','lionel.light');getActor(b,'enemy_0').mp=100;
 use(b,'enemy_0','lionel.light','helena');assert.equal(damage(b)[0].targetId,'leonardo');
 use(b,'enemy_0','helena.rain','helena');assert.deepEqual(damage(b).map(e=>e.targetId),['leonardo','helena']);
 h.statuses.push({id:'fractured',remaining:2,sourceId:'enemy_0'});use(b,l.id,'leonardo.home');use(b,l.id,'leonardo.cleanse');assert.ok(!h.statuses.some(s=>s.id==='fractured'));assert.ok(h.statuses.some(s=>s.id==='ranoc_home'));assert.equal(h.hp<h.stats.maxHp,true);
});
test('Kyle adds a mark per resolved hit, stacks RES loss and leaves refresh quota unused on new mark cast',()=>{
 const b=setup(['kyle','iris']);use(b,'kyle','kyle.mischief','enemy_0');const target=getActor(b,'enemy_0'),mark=target.statuses.find(s=>s.id==='mischief');assert.equal(mark.stacks,3);assert.equal(mark.remaining,3);assert.equal(mark.refreshedRound,undefined);assert.ok(Math.abs(battleStat(content,target,'resistance')-target.stats.resistance*.64)<1e-9);
 mark.remaining=1;use(b,'iris','$attack','enemy_0');assert.equal(mark.remaining,3);assert.equal(mark.refreshedRound,b.round);mark.remaining=1;
 use(b,'iris','$attack','enemy_0');assert.equal(mark.remaining,1);
 b.phase='extra';use(b,'iris','$attack','enemy_0');assert.equal(mark.remaining,1);
 b.round++;use(b,'iris','$attack','enemy_0');assert.equal(mark.remaining,3);
});
test('Kyle AoE refreshes existing marks independently and cannot create marks; dead targets and immunity stop mark application',()=>{
 const b=setup(['kyle']);for(const id of ['enemy_0','enemy_1'])getActor(b,id).statuses.push({id:'mischief',stacks:2,remaining:1,sourceId:'kyle'});
 use(b,'kyle','kyle.escape','enemy_0');assert.equal(getActor(b,'enemy_0').statuses[0].remaining,3);assert.equal(getActor(b,'enemy_1').statuses[0].remaining,3);assert.equal(getActor(b,'enemy_2').statuses.length,0);
 const dead=setup(['kyle']);getActor(dead,'enemy_0').hp=1;use(dead,'kyle','kyle.mischief','enemy_0');assert.equal(damage(dead).length,1);assert.equal(getActor(dead,'enemy_0').statuses.length,0);
 const immune=setup(['kyle']);getActor(immune,'enemy_0').statuses.push({id:'effect_ward',charges:1,remaining:null,sourceId:'enemy_0'});use(immune,'kyle','kyle.mischief','enemy_0');assert.equal(getActor(immune,'enemy_0').statuses.find(s=>s.id==='mischief').stacks,2);
});
test('Kyle grants MAG per marked target only, excludes self and physical damage; combined RES debuffs honor stat floor',()=>{
 const run=(party,ability,marked,disable)=>{const b=setup(party);if(disable)getActor(b,'kyle').passive=null;if(marked)getActor(b,'enemy_0').statuses.push({id:'mischief',stacks:3,remaining:3,sourceId:'kyle'});use(b,party[0],ability,'enemy_0');return damage(b).map(e=>e.amount);};
 const enabled=run(['helena','kyle'],'helena.rain',true,false),disabled=run(['helena','kyle'],'helena.rain',true,true);assert.ok(enabled[0]>disabled[0]);assert.equal(enabled[1],disabled[1]);
 assert.deepEqual(run(['kyle'],'kyle.wind',true,false),run(['kyle'],'kyle.wind',true,true));
 assert.deepEqual(run(['iwayn','kyle'],'iwayn.advance',true,false),run(['iwayn','kyle'],'iwayn.advance',true,true));
 const b=setup(['kyle']);const t=getActor(b,'enemy_0');t.statuses.push({id:'mischief',stacks:3,remaining:3},{id:'fractured',remaining:3},{id:'starless',remaining:3});assert.ok(Math.abs(battleStat(content,t,'resistance')-t.stats.resistance*.1)<1e-9);
});
test('Iwayn uses absolute HP ratio, caps damage at 30%, and applies authored 10% penetration',()=>{
 const run=(own,target,disable=false)=>{const b=setup(['iwayn']),a=getActor(b,'iwayn'),e=getActor(b,'enemy_0');a.hp=a.stats.maxHp*own;e.hp=e.stats.maxHp*target;if(disable)a.passive=null;use(b,'iwayn','iwayn.victory','enemy_0');return damage(b)[0].amount;};
 assert.ok(Math.abs(run(.8,1)/run(.8,1,true)-1.2)<.02);assert.ok(Math.abs(run(1,.8)/run(1,.8,true)-1.2)<.02);assert.ok(Math.abs(run(.1,1)/run(.1,1,true)-1.3)<.02);assert.equal(run(1,1),run(1,1,true));
 for(const id of ['iwayn.advance','iwayn.victory'])assert.equal(content.abilities[id].effects[0].penetration,.1);
});
test('Percival slows use strongest group; expires separately rather than stacking to 40%',()=>{
 const b=setup(['percival']);const e=getActor(b,'enemy_0');use(b,'percival','percival.undertow',e.id);use(b,'percival','percival.sea',e.id);assert.equal(battleStat(content,e,'speed'),e.stats.speed*.75);e.statuses=e.statuses.filter(s=>s.id!=='sea_slow');assert.equal(battleStat(content,e,'speed'),e.stats.speed*.85);
});
test('Percival MP requires actual healing by another ally; external HoT counts once across main and extra',()=>{
 const b=setup(['percival','armie','arden']);const p=getActor(b,'percival');p.mp=0;use(b,'armie','armie.first_aid',p.id);assert.equal(p.mp,0);
 p.hp-=60;getActor(b,'armie').cooldowns={};use(b,'armie','armie.first_aid',p.id);assert.equal(p.mp,6);
 b.phase='extra';p.hp-=20;getActor(b,'armie').cooldowns={};use(b,'armie','armie.first_aid',p.id);assert.equal(p.mp,6);
 const h=setup(['percival','arden']);const q=getActor(h,'percival');q.mp=0;q.hp-=50;use(h,'arden','arden.poultice',q.id);h.queue=[q.id,'enemy_0'];h.cursor=1;executeAction(h,{actorId:'enemy_0',abilityId:'$defend',targetId:'enemy_0'});assert.equal(q.mp,6);
 const self=setup(['percival']);const r=getActor(self,'percival');r.hp-=50;r.mp=30;use(self,r.id,'percival.stillness');self.queue=[r.id,'enemy_0'];self.cursor=1;executeAction(self,{actorId:'enemy_0',abilityId:'$defend',targetId:'enemy_0'});assert.equal(r.mp,20);
});
test('Mandred converts geared max HP before ATK buffs once, identical preview/battle and independent of current HP',()=>{
 const c=createCampaign(content);c.unlockedCharacterIds.push('mandred');c.party=['mandred'];c.gear=[{id:'gear_1',typeId:'t3_focused',stats:{maxHp:25}}];c.gacha.totalPulls=1;c.equipment.mandred=['gear_1',null,null];
 const preview=resolveCharacter(content,c,'mandred');assert.ok(Math.abs(preview.stats.attack-50.2)<1e-9);
 const b=createBattle(content,c,'forest_patrol');const a=getActor(b,'mandred');assert.equal(battleStat(content,a,'attack'),preview.stats.attack);a.hp=10;assert.equal(battleStat(content,a,'attack'),preview.stats.attack);
 use(b,a.id,'mandred.roar');assert.ok(Math.abs(battleStat(content,a,'attack')-60.24)<1e-9);
});
test('new data-driven fields reject malformed ratios, references, marks and groups; extra-turn preview explains restrictions',()=>{
 for(const mutate of [c=>c.characters.lionel.passive.ratio=2,c=>c.characters.mandred.passive.fromStat='currentHp',c=>c.characters.kyle.passive.statusId='missing',c=>c.statuses.mischief.magicRefresh.duration=0,c=>c.statuses.sea_slow.modifierGroup=[],c=>c.abilities['kyle.mischief'].effects[0].onHitStatus.duration=-1]){const c=structuredClone(content);mutate(c);assert.ok(validateContent(c).length);}
 assert.match(skillScaling(content.abilities['lionel.encore'],content.characters.lionel,content).join(' '),/Vòng Phụ/);
});
test('localized catalog keeps UTF-8 text and Kyle adds 15% base MAG alongside other MAG buffs',()=>{
 assert.doesNotMatch(JSON.stringify(content),/Ã|áº|á»|â€|\uFFFD/);
 const run=disable=>{const b=setup(['helena','kyle']);const a=getActor(b,'helena'),e=getActor(b,'enemy_0');a.passive=null;a.statuses.push({id:'ranoc_pride',remaining:3,sourceId:a.id});e.statuses.push({id:'mischief',remaining:3,stacks:1,sourceId:'kyle'});if(disable)getActor(b,'kyle').passive=null;use(b,'helena','$attack','enemy_0');return damage(b)[0].amount;};
 // Additive MAG%: 150% -> 165% base MAG, then defense and weakness apply normally.
 const base=run(true),boosted=run(false);assert.ok(Math.abs((boosted-base)-35*.15*1.5)<1);
});
