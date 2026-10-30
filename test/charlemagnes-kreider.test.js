import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,getActor,activeActor,targetsFor,abilityAvailability,DEFEND,basicAbility} from '../src/core/battle.js';
import {mpCost,debuffTypeCount,debuffDamageBonus} from '../src/core/conditional-combat.js';
import {createDungeonRun,advanceDungeonWave} from '../src/core/dungeon.js';
import {recruitCharacter} from '../src/core/economy.js';
import {validateContent} from '../src/core/content.js';
import {skillCost} from '../src/ui/skill-presentation.js';
import {skillPresentation} from '../src/ui/skill-copy.js';
import {liveSkillChoices,resolveCombatTargets,compactSkillScaling} from '../src/ui/combat-presentation.js';
const content=await loadContent();
function setup(id='charlemagnes',random=()=>.99,others=[],change=()=>{}){
 const source=structuredClone(content);source.characters[id].stats.speed=100;change(source);
 const save=createGameSave(source);save.party=[id,...others];save.unlockedCharacterIds=[...new Set([...save.unlockedCharacterIds,...save.party])];
 const b=createBattle(source,save,'forest_patrol',random);
 for(const e of b.actors.filter(a=>a.team==='enemy')){e.hp=e.stats.maxHp=100000;e.stats.defense=e.stats.resistance=0;e.statuses=[];e.weaknesses=[];e.resistances={};delete e.passive;}
 return b;
}
function act(b,id='$defend',target){const a=activeActor(b),skill=id==='$defend'?DEFEND:id==='$attack'?basicAbility(a):b.content.abilities[id];executeAction(b,{actorId:a.id,abilityId:id,targetId:target??(skill.target==='self'?a.id:b.actors.find(a=>a.team==='enemy'&&a.hp>0).id)});}
function ready(b,id){for(let i=0;i<100;i++){assert.equal(b.outcome,null);if(activeActor(b)?.id===id)return;act(b);}throw Error('No turn');}
const damage=(b,id)=>b.events.filter(e=>e.type==='damage'&&e.sourceId===id);
const debuffs=['commanders_breach','orchestra_dissonance','time_weakened','space_fracture'];
function mark(target,count){target.statuses=debuffs.slice(0,count).map(id=>({id,remaining:3,sourceId:'test',stacks:1}));}

test('two official recruits have the authored identities and costs, preserve save format, and do not unlock for free',()=>{
 const save=createGameSave(content);for(const id of ['charlemagnes','kreider']){assert.ok(content.banners.standard.characterPool.includes(id));assert.equal(save.unlockedCharacterIds.includes(id),false);save.recruitmentShards=120;const next=recruitCharacter(save,content,'standard',id);assert.equal(next.extraGearSlots[id]??0,0);assert.deepEqual(decodeGameSave(encodeGameSave(next,content),content),next);}
 assert.equal(content.characters.charlemagnes.element,'fire');assert.equal(content.characters.charlemagnes.roleGroup,'physical_dps');assert.equal(content.characters.kreider.element,'dark');assert.equal(content.characters.kreider.roleGroup,'magical_dps');
 assert.deepEqual(content.abilities['charlemagnes.charge'].effects.map(e=>[e.multiplier,e.hits]),[[2,2]]);assert.deepEqual(content.abilities['charlemagnes.campaign'].effects.map(e=>[e.multiplier,e.hits]),[[1.8,4]]);
 assert.equal(content.abilities['kreider.finale'].effects[0].multiplier,3);assert.equal(content.statuses.orchestra_dissonance.modifiers.resistance,-.35);
});
for(const [id,rolls,expected]of [['charlemagnes.charge',[0,.99],60],['charlemagnes.campaign',[0,.99,.49,.99],54]]){
 test(`${id}: exact total random hits, uniform per-hit choices, not hits per enemy`,()=>{
  let calls=0;const b=setup('charlemagnes',()=>rolls[calls++]);act(b,id,'enemy_2');const hits=damage(b,'charlemagnes');assert.equal(hits.length,rolls.length);assert.deepEqual(hits.map(e=>e.targetId),rolls.map(x=>'enemy_'+Math.floor(x*3)));assert.ok(hits.every(e=>e.amount===expected));assert.equal(calls,rolls.length);assert.equal(hits.reduce((s,e)=>s+e.amount,0),expected*rolls.length);
 });
}
test('random selection permits repeats and ignores the selected anchor',()=>{
 const b=setup('charlemagnes',()=>0);act(b,'charlemagnes.campaign','enemy_2');assert.deepEqual(damage(b,'charlemagnes').map(e=>e.targetId),Array(4).fill('enemy_0'));
});
test('remaining hits retarget living enemies after a kill, activate the discount once and never refund the casting skill',()=>{
 const b=setup('charlemagnes',()=>0),a=getActor(b,'charlemagnes');getActor(b,'enemy_0').hp=1;act(b,'charlemagnes.campaign');assert.deepEqual(damage(b,a.id).map(e=>e.targetId),['enemy_0','enemy_1','enemy_1','enemy_1']);assert.equal(a.mp,60);assert.equal(a.statuses.filter(s=>s.id==='commanders_economy').length,1);assert.equal(a.statuses.find(s=>s.id==='commanders_economy').remaining,null);assert.equal(b.log.filter(l=>l.includes('kích hoạt Tiết kiệm quân lực')).length,1);
});
test('all targets defeated ends the random sequence without phantom hits or extra RNG draws',()=>{
 let calls=0;const b=setup('charlemagnes',()=>{calls++;return 0;});getActor(b,'enemy_0').hp=1;getActor(b,'enemy_1').hp=getActor(b,'enemy_2').hp=0;act(b,'charlemagnes.campaign');assert.equal(b.outcome,'victory');assert.equal(calls,1);assert.equal(damage(b,'charlemagnes').length,1);
});
test('multi-target random attacks ignore taunt and cover, while the single-target armor command still obeys taunt',()=>{
 const b=setup('charlemagnes',()=>.5,[],c=>{c.statuses.test_cover={id:'test_cover',name:'Cover',kind:'buff',cover:true};});
 getActor(b,'enemy_0').statuses.push({id:'taunt',remaining:2,sourceId:'enemy_0'});getActor(b,'enemy_1').statuses.push({id:'test_cover',remaining:2,sourceId:'enemy_2'});
 assert.equal(targetsFor(b,getActor(b,'charlemagnes'),b.content.abilities['charlemagnes.breach']).length,1);assert.equal(targetsFor(b,getActor(b,'charlemagnes'),b.content.abilities['charlemagnes.charge']).length,3);act(b,'charlemagnes.charge');assert.deepEqual(damage(b,'charlemagnes').map(e=>e.targetId),['enemy_1','enemy_1']);assert.equal(getActor(b,'enemy_2').hp,100000);
});
test('a lethal dodge-counter cancels later random hits and never grants the attacker kill credit',()=>{
 let calls=0;const b=setup('charlemagnes',()=>{calls++;return 0;},[],c=>{c.statuses.test_evade={id:'test_evade',name:'Evade',kind:'buff',modifiers:{evasion:.85}};});const e=getActor(b,'enemy_0');e.statuses.push({id:'test_evade',remaining:2,sourceId:e.id});e.passive={type:'dodge_counter',resource:'opening'};e.resources={opening:{name:'Opening',max:3}};e.resourceValues={opening:0};e.stats.attack=10000;act(b,'charlemagnes.campaign');assert.equal(getActor(b,'charlemagnes').hp,0);assert.equal(b.outcome,'defeat');assert.equal(calls,2);assert.equal(b.events.filter(e=>e.type==='random_target').length,1);assert.equal(getActor(b,'charlemagnes').statuses.some(s=>s.id==='commanders_economy'),false);
});
test('discount uses the same rounded costs in UI, affordability and actual spending; free actions remain free',()=>{
 const b=setup(),a=getActor(b,'charlemagnes');a.statuses.push({id:'commanders_economy',remaining:null,stacks:1,sourceId:a.id});
 for(const [id,cost]of [['charlemagnes.charge',18],['charlemagnes.campaign',36],['charlemagnes.breach',9]]){assert.equal(mpCost(b.content.abilities[id],a),cost);assert.match(skillCost(b.content.abilities[id],a),new RegExp('^'+cost+' MP'));}
 a.mp=18;assert.equal(abilityAvailability(b,a,b.content.abilities['charlemagnes.charge']).ok,true);a.mp=17;assert.equal(abilityAvailability(b,a,b.content.abilities['charlemagnes.charge']).ok,false);a.mp=18;act(b,'charlemagnes.charge');assert.equal(a.mp,0);assert.equal(mpCost(DEFEND,a),0);assert.equal(mpCost(basicAbility(a),a),0);
});
test('kills by another party member do not activate Charlemagnes native',()=>{
 const b=setup('charlemagnes',()=>.99,['arthur']);act(b);ready(b,'arthur');const a=getActor(b,'arthur');a.stats.attack=100000;getActor(b,'enemy_0').hp=1;act(b,'$attack','enemy_0');assert.equal(getActor(b,'charlemagnes').statuses.some(s=>s.id==='commanders_economy'),false);
});
test('discount persists through dungeon waves but resets in a fresh independent battle',()=>{
 const source=structuredClone(content);source.characters.charlemagnes.stats.speed=100;const save=createGameSave(source);save.party=['charlemagnes'];save.unlockedCharacterIds.push('charlemagnes');const run=createDungeonRun(source,save,'gold_mine','easy',{now:new Date('2026-10-30T05:00:00Z'),random:()=>0});for(const e of run.battle.actors.filter(a=>a.team==='enemy'))e.hp=1;
 act(run.battle,'charlemagnes.campaign');assert.equal(run.battle.outcome,'victory');assert.equal(getActor(run.battle,'charlemagnes').mp,60);advanceDungeonWave(source,run);const a=getActor(run.battle,'charlemagnes');assert.equal(a.mp,60);assert.equal(mpCost(source.abilities['charlemagnes.campaign'],a),36);act(run.battle,'charlemagnes.breach');assert.equal(a.mp,51);assert.equal(mpCost(source.abilities['charlemagnes.charge'],getActor(createBattle(source,save,'forest_patrol'),'charlemagnes')),20);assert.equal(save.characters.charlemagnes.statuses,undefined);
});
test('random targeting previews never consume RNG and light the whole candidate pool',()=>{
 let calls=0;const b=setup('charlemagnes',()=>{calls++;return 0;}),a=getActor(b,'charlemagnes'),skill=b.content.abilities['charlemagnes.campaign'];
 const targets=resolveCombatTargets(b,a,skill,{enemyId:'enemy_2'});assert.deepEqual(targets.affectedIds,['enemy_0','enemy_1','enemy_2']);assert.match(compactSkillScaling(skill,a,getActor(b,'enemy_2'),b.content,b),/4 × 180% ATK/);assert.ok(skillPresentation(skill,a,b.content).rules.some(x=>x.includes('Có thể trúng lặp')));assert.equal(calls,0);
});
for(const [count,expected]of [[0,102],[1,132],[2,163],[3,193],[4,193]]){
 test(`Kreider counts ${count} distinct debuffs and caps native at +90%`,()=>{
  const b=setup('kreider'),target=getActor(b,'enemy_0');mark(target,count);act(b,'kreider.finale');assert.equal(damage(b,'kreider')[0].amount,expected);assert.equal(getActor(b,'kreider').mp,84);
 });
}
test('multiple stats and multiple layers in one effect count as one debuff type; buffs and expired effects do not count',()=>{
 const b=setup('kreider',()=>.99,[],c=>{c.statuses.test_stacked={id:'test_stacked',kind:'debuff',name:'Stacked',maxStacks:3,modifiers:{attack:-.1,magic:-.1}};});const target=getActor(b,'enemy_0');target.statuses=[{id:'test_stacked',stacks:3,remaining:3},{id:'test_stacked',stacks:2,remaining:3},{id:'time_weakened',stacks:1,remaining:0},{id:'commanders_economy',remaining:null},{id:'fractured',stacks:0,remaining:3}];assert.equal(debuffTypeCount(b.content,target),1);act(b,'kreider.finale');assert.equal(damage(b,'kreider')[0].amount,132);
});
test('Kreider native adds to ordinary damage bonuses rather than multiplying them again',()=>{
 const b=setup('kreider');mark(getActor(b,'enemy_0'),3);getActor(b,'kreider').statuses.push({id:'empowered',remaining:3,sourceId:'iris'});act(b,'kreider.finale');assert.equal(damage(b,'kreider')[0].amount,234);
});
test('RES skill places a real 35% main-turn debuff without damage; basic then benefits from one debuff',()=>{
 const b=setup('kreider');act(b,'kreider.dissonance');const target=getActor(b,'enemy_0'),status=target.statuses.find(s=>s.id==='orchestra_dissonance');assert.equal(damage(b,'kreider').length,0);assert.equal(status.remaining,3);assert.equal(getActor(b,'kreider').mp,100);ready(b,'kreider');target.statuses=target.statuses.filter(s=>s.id!=='guard');act(b,'$attack');assert.equal(damage(b,'kreider')[0].amount,44);
});
test('Kreider bonus does not leak into Aurora follow-ups',()=>{
 const b=setup('kreider',()=>.99,['aurora']);mark(getActor(b,'enemy_0'),3);act(b,'kreider.finale');assert.equal(damage(b,'kreider')[0].amount,193);const effect=b.content.abilities['aurora.follow_up'].effects[0];assert.equal(damage(b,'aurora')[0].amount,Math.floor(getActor(b,'aurora').stats.magic*effect.multiplier));assert.equal(getActor(b,'aurora').resourceValues.thunder_charge,1);
});
test('new UI facts use actual target debuffs and all authored data reject malformed random/passive configurations',()=>{
 const b=setup('kreider'),a=getActor(b,'kreider'),target=getActor(b,'enemy_0');mark(target,3);const skill=b.content.abilities['kreider.finale'],choices=liveSkillChoices(skill,a,target,b);assert.equal(choices.debuffCount,3);assert.ok(skillPresentation(skill,a,b.content,choices).facts.some(x=>x.includes('+90% sát thương')));assert.equal(debuffDamageBonus(a.passive,20),.9);
 for(const mutate of [c=>c.characters.charlemagnes.passive.ratio=1,c=>c.statuses.commanders_economy.mpCostReduction=.2,c=>c.characters.kreider.passive.cap=.1,c=>c.abilities['charlemagnes.charge'].effects.push({type:'status',status:'shaken',duration:1})]){const c=structuredClone(content);mutate(c);assert.ok(validateContent(c).length);}
});
