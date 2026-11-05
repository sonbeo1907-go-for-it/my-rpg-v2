import {test} from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';import {resolveCharacter} from '../src/core/progression.js';
import {createBattle,executeAction,getActor,forecastBattleAction} from '../src/core/battle.js';import {createArenaBattle} from '../src/core/arena.js';
import {battleStat,statusModifier} from '../src/core/stat-values.js';import {coefficientFactor,statBuffFactor,skillRules,outputMpFactor} from '../src/core/skill-rules.js';import {resolveRankedAbility} from '../src/core/skill-resolver.js';import {mpCost} from '../src/core/conditional-combat.js';
import {exclusiveRollRange} from '../src/core/blacksmith-rules.js';import {buyExclusiveRecipe} from '../src/core/blueprint-shop.js';import {craftExclusive} from '../src/core/blacksmith.js';import {validateContent} from '../src/core/content.js';import {passivePresentation,skillPresentation} from '../src/ui/skill-copy.js';
const c=await loadContent(),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`),ids=['iwayn','percival','mandred','kreider','logia','yufina','elise','yumia','valery','tobin','rivia','bennett','judy'];
function save(party,owners=party,source=c){const s=createGameSave(source);s.party=[...party];s.partyPresets[0].slots=[...party];s.unlockedCharacterIds=Object.keys(source.characters);for(const id of owners){s.exclusiveGear.push({templateId:id+'.signature',statKey:'maxMp',statValue:exclusiveRollRange(source,'maxMp').min});s.equippedExclusiveGear[id]=id+'.signature';s.unlockedExclusiveRecipes.push(id+'.signature');}return s;}
function fixture(party,owners=[party[0]]){const content=structuredClone(c),s=save(party,owners,content),b=createBattle(content,s,'forest_patrol',()=>.99);for(const e of b.actors){if(e.team==='enemy'){e.hp=e.stats.maxHp=100000;e.stats.defense=e.stats.resistance=0;e.weaknesses=[];e.resistances={};}else{e.stats.maxMp=1000;e.mp=1000;}}return b;}
const a=(b,id)=>getActor(b,id),hits=(b,id)=>b.events.filter(e=>e.type==='damage'&&e.sourceId===id&&!e.periodic);
function use(b,id,skill,target=id,phase='main'){b.queue=[id,b.actors.find(x=>x.id!==id&&x.team===a(b,id).team&&x.hp>0)?.id??'enemy_0'];b.cursor=0;b.phase=phase;b.outcome=null;a(b,id).cooldowns={};executeAction(b,{actorId:id,abilityId:skill,targetId:target});}
function statusSkill(b,id,status,teamTarget='enemy'){b.content.abilities[id]={id,name:'Hiệu ứng thử nghiệm',target:teamTarget,effects:[{type:'status',status,duration:2}]};return id;}

test('mastery tier products are exact, mixed groups grow once, utility and MP-only policy remain fixed',()=>{
 const r=skillRules(c);for(const [rank,out,buff]of [[5,1,1],[6,1.12,1.06],[7,1.2544,1.1236],[8,1.44256,1.20787]]){near(coefficientFactor(rank,r)/coefficientFactor(5,r),out);near(statBuffFactor(rank,r)/statBuffFactor(5,r),buff);}near(outputMpFactor(8,r),.7*.9**3);
 const s=save(['garrek','iris'],[]);for(const id of s.party)Object.assign(s.characters[id],{level:50,limitBreakRank:3});const g=resolveCharacter(c,s,'garrek'),v5=resolveRankedAbility(c,g,'garrek.fortress',5),v8=resolveRankedAbility(c,g,'garrek.fortress',8);for(let i=0;i<v5.effects.length;i++){const x=v5.effects[i],y=v8.effects[i];if(x.type==='shield')near(y.multiplier/x.multiplier,1.44256);if(x.appliedModifiers?.defense)near(y.appliedModifiers.defense/x.appliedModifiers.defense,1.20787);}assert.equal(v8.cooldown,v5.cooldown);assert.deepEqual(v8.cost,v5.cost);
});
test('thirteen recipes buy/craft through Blueprints, round-trip saves and never alter unequipped data',()=>{
 let s=createGameSave(c);s.unlockedCharacterIds=Object.keys(c.characters);Object.assign(s,{blueprints:130,coins:200000,prismaFragments:40000,recruitmentShards:100,originalPrisma:20});for(const id of ids){const t=c.exclusiveGear[id+'.signature'];assert.equal(t.characterId,id);s=buyExclusiveRecipe(s,c,t.id);s=craftExclusive(s,c,t.id,()=>0);assert.ok(s.exclusiveGear.some(x=>x.templateId===t.id));}assert.equal(s.blueprints,0);assert.deepEqual(decodeGameSave(encodeGameSave(s,c),c),s);
 assert.equal(c.characters.logia.passive.ratio,.25);assert.equal(c.characters.mandred.passive.ratio,.08);assert.equal(c.characters.tobin.passive.ratio,.08);assert.equal(c.characters.rivia.passive.odd.modifiers.attack,.2);assert.equal(c.characters.yufina.combatModes.radiant_fists.mpCostReduction,.12);
});
test('Iwayn receives per-skill ATK from absolute HP% difference capped at 75%; basics do not inherit it',()=>{
 for(const [self,target]of [[.8,.3],[.3,.8],[1,.1],[.5,.5]]){const b=fixture(['iwayn','iris']),w=a(b,'iwayn'),e=a(b,'enemy_0');w.stats.maxHp=1000;w.hp=self*1000;e.hp=target*e.stats.maxHp;const atk=battleStat(b.content,w,'attack'),diff=Math.abs(self-target),boost=Math.min(.75,diff*1.5);use(b,w.id,'iwayn.advance',e.id);assert.equal(hits(b,w.id)[0].amount,Math.floor(atk*(1+boost)*1.1*(1+Math.min(.3,diff))));near(battleStat(b.content,w,'attack'),atk);}
 const bare=fixture(['iwayn','iris'],[]),equipped=fixture(['iwayn','iris']);for(const b of [bare,equipped]){a(b,'iwayn').hp=1;use(b,'iwayn','$attack','enemy_0');}assert.equal(hits(bare,'iwayn')[0].amount,hits(equipped,'iwayn')[0].amount);
});
test('Percival strengthens only Sea slow and amplifies its damage, retaining shared strongest slow behavior',()=>{
 const b=fixture(['percival','iris']),p=a(b,'percival'),atk=battleStat(b.content,p,'attack');use(b,p.id,'percival.sea','enemy_0');assert.equal(hits(b,p.id)[0].amount,Math.floor(atk*2.2*1.35));near(statusModifier(b.content,a(b,'enemy_0'),'speed'),-.4);assert.equal(a(b,'enemy_0').statuses.find(s=>s.id==='sea_slow').remaining,2);assert.equal(c.statuses.sea_slow.modifiers.speed,-.25);
 use(b,p.id,'percival.undertow','enemy_1');near(statusModifier(b.content,a(b,'enemy_1'),'speed'),c.statuses.undertow_slow.modifiers.speed);
});
test('Mandred/Tobin/Rivia/Bennett update the exact native values once, before percentage buffs',()=>{
 const s=save(['mandred','rivia','tobin','bennett']);const m=resolveCharacter(c,s,'mandred');near(m.stats.attack,m.baseStats.attack+m.baseStats.maxHp*.15);assert.equal(m.passive.ratio,.15);assert.deepEqual(resolveCharacter(c,s,'mandred').stats,m.stats);
 for(const [slot,attack]of [[0,.45],[1,.2],[2,.45],[3,.2]]){const q=structuredClone(s);q.party=['mandred','tobin','bennett',null];q.party[slot]='rivia';const unit=resolveCharacter(c,q,'rivia');near(unit.stats.attack,unit.baseStats.attack*(1+attack));}
 const b=fixture(['tobin','bennett'],['tobin','bennett']),t=a(b,'tobin');t.resourceValues.forge_heat=3;near(battleStat(b.content,t,'attack'),t.stats.attack*1.36);const bennett=a(b,'bennett');near(battleStat(b.content,bennett,'attack'),bennett.baseStats.attack*1.25);assert.equal(bennett.passive.ratio,.5);
});
test('Kreider reacts to successful enemy debuffs, not blocked applications; stack refresh and expiry include extra and stunned turns',()=>{
 const b=fixture(['kreider','iris']),k=a(b,'kreider'),iris=a(b,'iris'),enemy=a(b,'enemy_0'),skill=statusSkill(b,'test.debuff','starless');iris.abilities.push(skill);
 const ward=Object.values(b.content.statuses).find(x=>x.effectImmunity);enemy.statuses.push({id:ward.id,remaining:2,charges:1,sourceId:enemy.id});use(b,iris.id,skill,enemy.id);assert.ok(!k.statuses.some(s=>s.id==='kreider_exclusive_magic'));
 for(let i=0;i<3;i++)use(b,iris.id,skill,enemy.id);let buff=k.statuses.find(s=>s.id==='kreider_exclusive_magic');assert.equal(buff.stacks,2);assert.equal(buff.remaining,4);near(battleStat(b.content,k,'magic'),k.stats.magic*1.5);
 use(b,k.id,'$defend');assert.equal(k.statuses.find(s=>s.id===buff.id).remaining,3);use(b,k.id,'$defend',k.id,'extra');assert.equal(k.statuses.find(s=>s.id===buff.id).remaining,2);
 k.statuses.push({id:'stunned',remaining:1,stacks:1,sourceId:enemy.id});b.queue=[iris.id,k.id,enemy.id];b.cursor=0;b.phase='main';executeAction(b,{actorId:iris.id,abilityId:'$defend',targetId:iris.id});assert.ok(b.log.some(line=>line.includes('Kreider bị choáng')));assert.equal(k.statuses.find(s=>s.id===buff.id).remaining,1);use(b,k.id,'$defend');assert.ok(!k.statuses.some(s=>s.id===buff.id));
});
test('Elise observer is symmetric in mirror PvP and reactive buff grants cannot recurse across teams',()=>{
 const s=save(['elise','iwayn'],['elise']),b=createArenaBattle(c,s,'mirror',7),left=b.actors.find(x=>x.team==='party'&&x.definitionId==='elise'),right=b.actors.find(x=>x.team==='enemy'&&x.definitionId==='elise'),enemy=b.actors.find(x=>x.team==='enemy'&&x.definitionId==='iwayn'),ally=b.actors.find(x=>x.team==='party'&&x.definitionId==='iwayn');
 use(b,enemy.id,'iwayn.oath');assert.equal(left.statuses.find(s=>s.id==='elise_exclusive_magic').stacks,2);assert.equal(right.statuses.some(s=>s.id==='elise_exclusive_magic'),false);
 use(b,ally.id,'iwayn.oath');assert.equal(right.statuses.find(s=>s.id==='elise_exclusive_magic').stacks,2);assert.ok(b.events.filter(e=>e.type==='status').length<10);
});
test('Logia venom snapshots the upgraded 50% native potency, without changing other sources',()=>{
 for(const owners of [[],['logia']]){const b=fixture(['logia','iris'],owners),l=a(b,'logia'),atk=battleStat(b.content,l,'attack');use(b,l.id,'logia.fang','enemy_0');const dot=a(b,'enemy_0').statuses.find(s=>s.id==='logia_venom');assert.equal(dot.potency,Math.round(atk*.45*(owners.length?1.5:1.25)));}
});
test('Yufina mode costs use 24% instead of 12%, then restore after mode exit; authored costs/CD stay unchanged',()=>{
 const b=fixture(['yufina','iris']),y=a(b,'yufina');assert.equal(mpCost(c.abilities['yufina.pierce'],y),12);use(b,y.id,'yufina.ignite');assert.equal(y.combatModes.radiant_fists.mpCostReduction,.24);assert.equal(mpCost(c.abilities['yufina.pierce'],y),10);const before=y.mp;use(b,y.id,'yufina.pierce','enemy_0');assert.equal(before-y.mp,10);delete y.activeMode;assert.equal(mpCost(c.abilities['yufina.pierce'],y),12);assert.equal(c.abilities['yufina.pierce'].cooldown,undefined);assert.equal(c.characters.yufina.combatModes.radiant_fists.mpCostReduction,.12);
});
test('Yumia counter deals 558.8%, keeps true-strike/once-per-round and passive preview agrees',()=>{
 const b=fixture(['yumia','iris']),y=a(b,'yumia'),enemy=a(b,'enemy_0');y.stats.defense=0;enemy.stats.defense=0;b.content.abilities['test.hit']={id:'test.hit',name:'Đánh thử',target:'enemy',effects:[{type:'damage',damageType:'physical',element:'plain',multiplier:.1}]};enemy.abilities.push('test.hit');const atk=battleStat(b.content,y,'attack');use(b,enemy.id,'test.hit','iris');assert.equal(hits(b,y.id)[0].amount,Math.floor(atk*5.588));assert.match(passivePresentation(y,b.content).facts.join(' '),/558,8%/);use(b,enemy.id,'test.hit','iris');assert.equal(hits(b,y.id).length,0);assert.equal(c.abilities['yumia.counter'].effects[0].unavoidable,true);
});
test('Valery uses actually spent Wind Focus for flat penetration independent of Rank',()=>{
 for(const [stacks,rank]of [[1,1],[6,1],[6,5]]){const b=fixture(['valery','iris']),v=a(b,'valery'),e=a(b,'enemy_0');use(b,v.id,'valery.focus');v.resourceValues.wind_focus=stacks;v.skillRanks={'valery.tempest':rank};e.stats.resistance=100;const mag=battleStat(b.content,v,'magic');use(b,v.id,'valery.tempest',e.id);assert.equal(hits(b,v.id)[0].amount,Math.floor(mag*(3+.6*stacks)*1.1**(rank-1)-100*(1-.05*stacks)*.55));assert.equal(v.resourceValues.wind_focus,0);}
});
test('Judy bonus chance rises by 15 percentage points on each failure, resets only on extra gain and ignores capped/invalid triggers',()=>{
 const b=fixture(['judy','iris']),j=a(b,'judy'),iris=a(b,'iris');b.content.abilities['test.lightning']={id:'test.lightning',name:'Sét thử',target:'enemy',effects:[{type:'damage',damageType:'magical',element:'thunder',multiplier:1}]};iris.abilities.push('test.lightning');const chances=[];for(let i=0;i<5;i++){use(b,iris.id,'test.lightning','enemy_0');chances.push(b.events.find(e=>e.type==='resource_bonus_roll').chance);}assert.deepEqual(chances.map(n=>Math.round(n*100)),[50,65,80,95,100]);assert.equal(j.resourceValues.storm_charge,6);assert.equal(j.exclusiveResourceFailures.storm_charge,0);
 b.random=()=>.49;use(b,iris.id,'test.lightning','enemy_0');assert.equal(j.resourceValues.storm_charge,8);assert.equal(j.exclusiveResourceFailures.storm_charge,0);j.resourceValues.storm_charge=9;use(b,iris.id,'test.lightning','enemy_0');assert.equal(j.resourceValues.storm_charge,10);assert.equal(b.events.some(e=>e.type==='resource_bonus_roll'),false);
 j.resourceValues.storm_charge=0;use(b,iris.id,'$attack','enemy_0');assert.equal(j.resourceValues.storm_charge,0);b.queue=[iris.id,j.id];b.cursor=0;const before=structuredClone({actors:b.actors,events:b.events});forecastBattleAction(b,{actorId:iris.id,abilityId:'test.lightning',targetId:'enemy_0'});assert.deepEqual({actors:b.actors,events:b.events},before);
});
test('new passive validators reject malformed tiers, resources, buffs and incompatible owners',()=>{
 assert.deepEqual(validateContent(c),[]);for(const change of [x=>x.progressionRules.default.skillProgression.mastery.coefficientGrowthByTier=[1.12],x=>x.exclusiveGear['judy.signature'].passive.failureStep=-1,x=>x.exclusiveGear['logia.signature'].passive.passiveType='stat_conversion',x=>x.exclusiveGear['yufina.signature'].passive.modeId='missing',x=>x.exclusiveGear['kreider.signature'].passive.statusKind='other',x=>x.exclusiveGear['valery.signature'].passive.resourceId='unknown']){const content=structuredClone(c);change(content);assert.ok(validateContent(content).length);}
});

test('Elise ignores blocked and friendly buff grants, while successful enemy refreshes stack to two',()=>{
 const b=fixture(['elise','iris']),e=a(b,'elise'),enemy=a(b,'enemy_0'),iris=a(b,'iris'),id=statusSkill(b,'test.buff','young_oath','self');enemy.abilities.push(id);iris.abilities.push(id);
 use(b,iris.id,id);assert.ok(!e.statuses.some(s=>s.id==='elise_exclusive_magic'));
 const seal=Object.values(b.content.statuses).find(s=>s.buffRejection);enemy.statuses.push({id:seal.id,remaining:null,charges:1,sourceId:e.id});use(b,enemy.id,id);assert.ok(!e.statuses.some(s=>s.id==='elise_exclusive_magic'));
 use(b,enemy.id,id);assert.equal(e.statuses.find(s=>s.id==='elise_exclusive_magic').stacks,1);use(b,enemy.id,id);assert.equal(e.statuses.find(s=>s.id==='elise_exclusive_magic').stacks,2);
});
test('Judy failure state carries across dungeon rooms but a new independent run starts clean',async()=>{
 const {createDungeonRun,advanceDungeonWave}=await import('../src/core/dungeon.js');const source=structuredClone(c),s=save(['judy','iris'],['judy'],source),run=createDungeonRun(source,s,'gold_mine','easy',{random:()=>.99});
 const j=a(run.battle,'judy'),enemy=run.battle.actors.find(a=>a.team==='enemy');enemy.hp=enemy.stats.maxHp=100000;use(run.battle,'judy','judy.sparks',enemy.id);assert.equal(j.exclusiveResourceFailures.storm_charge,2);run.battle.outcome='victory';advanceDungeonWave(source,run);assert.equal(a(run.battle,'judy').exclusiveResourceFailures.storm_charge,2);const fresh=createBattle(source,s,'forest_patrol');assert.equal(a(fresh,'judy').exclusiveResourceFailures,undefined);
});
