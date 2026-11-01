import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {resolveCharacter,completeStoryEvent} from '../src/core/progression.js';
import {skillRankCap,skillUpgradeCost,coefficientFactor,statBuffFactor,outputMpFactor,validateSkillProgression} from '../src/core/skill-rules.js';
import {skillUpgradeQuote,upgradeSkill,upgradeSkillAndPersist} from '../src/core/skill-progression.js';
import {resolveRankedAbility} from '../src/core/skill-resolver.js';
import {mpCost} from '../src/core/conditional-combat.js';
import {createBattle,executeAction,getActor,basicAbility} from '../src/core/battle.js';
import {battleStat,statusModifier} from '../src/core/stat-values.js';
import {activeStatuses} from '../src/core/status-state.js';
import {exclusiveDamageEffect} from '../src/core/exclusive-hooks.js';
import {damageMultiplier} from '../src/core/combat-math.js';
import {skillPresentation} from '../src/ui/skill-copy.js';
import {skillScaling} from '../src/ui/skill-presentation.js';
import {createStoryRun,advanceStoryWave} from '../src/core/story-waves.js';
const content=await loadContent(),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
function save(party=['yufina','iris','elaine','arthur']){const c=createGameSave(content);c.coins=100000;c.unlockedCharacterIds=Object.keys(content.characters);c.party=party;c.partyPresets[0].slots=[...party];for(const s of Object.values(c.characters))Object.assign(s,{level:50,xp:0,limitBreakRank:3});return c;}
function fixture(c=save(),source=content){const b=createBattle(source,c,'forest_patrol',()=>.5,{enemyLevel:1});for(const actor of b.actors){actor.passive=null;actor.statuses=[];if(actor.team==='enemy'){actor.hp=actor.stats.maxHp=100000;actor.stats.defense=actor.stats.resistance=20;actor.weaknesses=[];actor.resistances={};}}return b;}
function use(b,id,ability,target=id){b.outcome=null;b.phase='main';b.queue=[id,'enemy_0'];b.cursor=0;const a=getActor(b,id);a.cooldowns={};executeAction(b,{actorId:id,abilityId:ability,targetId:target});}
const hits=b=>b.events.filter(e=>e.type==='damage'&&!e.periodic);

test('common rank formulas, all gates and total Coin investment are exact',()=>{
 assert.deepEqual([1,14,15,29,30,39,40,49,50].map(l=>skillRankCap(l)),[1,1,2,2,3,3,4,4,5]);
 near(coefficientFactor(5),1.4641);near(statBuffFactor(5),1.21550625);near(outputMpFactor(5),.7);
 assert.deepEqual([1,2,3,4].map(r=>skillUpgradeCost(r)),[400,800,1600,3200]);assert.equal([1,2,3,4].reduce((n,r)=>n+skillUpgradeCost(r),0),6000);
 assert.deepEqual(validateSkillProgression(content),[]);
});
test('manual sequential upgrades only spend Coins and do not mutate the original campaign',()=>{
 const original=save();let c=original;const balances={prisma:c.prisma,recruitmentShards:c.recruitmentShards,prismaFragments:c.prismaFragments};
 assert.equal(skillUpgradeQuote(c,content,'iris','iris.formula').rank,1);
 for(let rank=1;rank<5;rank++){c=upgradeSkill(c,content,'iris','iris.formula',{expectedRank:rank});assert.equal(c.characters.iris.skillRanks['iris.formula'],rank+1);}
 assert.equal(c.coins,original.coins-6000);assert.deepEqual(original.characters.iris.skillRanks,{});for(const[k,n]of Object.entries(balances))assert.equal(c[k],n);
 assert.throws(()=>upgradeSkill(c,content,'iris','iris.formula'),/tối đa/);
});
test('ownership, level, unlock, fixed, stale quote and all progression locks reject without changes',()=>{
 const c=save(),before=structuredClone(c);
 for(const opts of [{battleActive:true},{dungeonActive:true},{locked:true},{expectedRank:2}])assert.throws(()=>upgradeSkill(c,content,'iris','iris.formula',opts));
 assert.throws(()=>upgradeSkill(c,content,'arthur','arthur.ogres_bane_mastered'),/chưa mở khóa/);
 assert.throws(()=>upgradeSkill(c,content,'arthur','arthur.ogres_bane'),/cốt truyện/);
 assert.throws(()=>upgradeSkill(c,content,'iris','iris.fake'));
 assert.deepEqual(c,before);c.coins=399;assert.throws(()=>upgradeSkill(c,content,'iris','basic'),/Coin/);
 c.coins=10000;c.characters.iris.level=14;assert.throws(()=>upgradeSkill(c,content,'iris','basic'),/Lv15/);
 c.characters.iris.level=50;c.unlockedCharacterIds=c.unlockedCharacterIds.filter(id=>id!=='iris');assert.throws(()=>upgradeSkill(c,content,'iris','basic'),/sở hữu/);
});
test('failed asynchronous persistence rolls back Coins and Rank, successful persistence publishes one candidate',async()=>{
 const c=save(),before=structuredClone(c);let calls=0;
 await assert.rejects(upgradeSkillAndPersist(c,content,'iris','iris.formula',async next=>{calls++;assert.equal(next.coins,c.coins-400);throw Error('disk full');}),/disk full/);
 assert.deepEqual(c,before);const next=await upgradeSkillAndPersist(c,content,'iris','iris.formula',async()=>{calls++;});assert.equal(calls,2);assert.equal(next.characters.iris.skillRanks['iris.formula'],2);
});
test('v7 sparse migration, all presets and upgraded ranks round-trip; invalid or foreign ranks reject',()=>{
 const c=save();for(const s of Object.values(c.characters))delete s.skillRanks;const old=decodeGameSave(encodeGameSave(c,content),content);
 assert.deepEqual(old.characters.iris.skillRanks,{});assert.equal(old.coins,c.coins);assert.deepEqual(old.partyPresets,c.partyPresets);
 let next=upgradeSkill(old,content,'iris','iris.formula');assert.equal(decodeGameSave(encodeGameSave(next,content),content).characters.iris.skillRanks['iris.formula'],2);
 for(const ranks of [{'iris.formula':0},{'iris.formula':6},{'iris.formula':2.5},{'yufina.pierce':2},{'iris.missing':2},{'arthur.ogres_bane_mastered':2}]){const bad=save();bad.characters.iris.skillRanks=ranks;assert.throws(()=>encodeGameSave(bad,content));}
 const locked=save();locked.characters.arthur.skillRanks={'arthur.partial_release':2};assert.throws(()=>encodeGameSave(locked,content));
 const low=save();low.characters.iris.level=15;low.characters.iris.limitBreakRank=0;low.characters.iris.skillRanks={'iris.formula':3};assert.throws(()=>encodeGameSave(low,content));
});
test('story replacement inherits Fiona rank; all Ogre Bane forms and post-buff remain fixed',()=>{
 let c=save();c=upgradeSkill(c,content,'fiona','fiona.refraction');completeStoryEvent(c,content,'fiona.refraction_story_cleared');
 const f=resolveCharacter(content,c,'fiona');assert.ok(f.abilities.includes('fiona.refraction_complete'));assert.equal(resolveRankedAbility(content,f,'fiona.refraction_complete').skillRank,2);assert.doesNotThrow(()=>encodeGameSave(c,content));
 for(const id of ['arthur.ogres_bane','arthur.ogres_bane_controlled','arthur.ogres_bane_mastered','arthur.ogres_bane_flash']){const s=resolveRankedAbility(content,resolveCharacter(content,c,'arthur'),id,5);assert.equal(s.skillRank,1);assert.deepEqual(s.effects,content.abilities[id].effects);}
});
test('damage override precedes Rank exactly once, including all dynamic coefficients',()=>{
 const c=save(),actor=resolveCharacter(content,c,'yufina');actor.skillRanks={'yufina.pierce':5};const s=resolveRankedAbility(content,actor,'yufina.pierce');const e=exclusiveDamageEffect(actor,s.id,s.effects[0]);near(e.multiplier,3.80666);assert.equal(e.penetration,.25);assert.deepEqual(exclusiveDamageEffect(actor,s.id,e),e);
 actor.exclusiveGear={template:{passive:{type:'skill_scaling_override',abilityIds:[s.id],multiplier:4}}};near(exclusiveDamageEffect(actor,s.id,s.effects[0]).multiplier,4*1.4641);
 const dynamic={type:'damage',multiplier:1,primaryMultiplier:2,perResource:.5,perStack:.4,lowHpBonus:1,perTargetBuff:.2,maxTargetBuffs:3,rankDamageFactor:1.4641};const scaled=exclusiveDamageEffect({},'test',dynamic),ctx={spent:3,stacks:2,hpRatio:.5,buffs:2};near(damageMultiplier(scaled,ctx),damageMultiplier(dynamic,ctx)*1.4641);near(scaled.primaryMultiplier,2*1.4641);
});
test('actual direct magic uses ATK coefficient Rank before RES and MP cost matches preview',()=>{
 const c=save();c.characters.yufina.skillRanks={'yufina.pierce':5};const b=fixture(c),actor=getActor(b,'yufina'),before=actor.mp;
 const preview=skillPresentation(content.abilities['yufina.pierce'],actor,content);assert.match(preview.facts.join(' '),/380,67%/);
 use(b,'yufina','yufina.pierce','enemy_0');assert.equal(hits(b)[0].amount,Math.floor(actor.stats.attack*3.80666-20*.75*.55));assert.equal(actor.mp,before-mpCost(content.abilities['yufina.pierce'],actor));
 assert.equal(content.abilities['yufina.pierce'].effects[0].multiplier,2.6);
});
test('multi-hit and primary/splash AoE grow per hit, once each; enemy and passive never inherit player rank',()=>{
 const source=structuredClone(content),c=save();const id='arthur.test';source.abilities[id]={id,skillLineId:id,growthProfile:'damage',target:'all_enemies',effects:[{type:'damage',damageType:'physical',element:'plain',multiplier:.8,primaryMultiplier:1.6,hits:2}]};source.characters.arthur.abilities.push(id);c.characters.arthur.skillRanks={[id]:5,basic:5};const b=fixture(c,source),actor=getActor(b,'arthur');
 use(b,'arthur',id,'enemy_0');const damage=hits(b);assert.equal(damage.length,6);for(const hit of damage)assert.equal(hit.amount,Math.floor(actor.stats.attack*(hit.targetId==='enemy_0'?1.6:.8)*1.4641-11));
 const enemy=getActor(b,'enemy_0');enemy.skillRanks={basic:5};assert.equal(resolveRankedAbility(source,enemy,basicAbility(enemy)).effects[0].rankDamageFactor,1);
 const passive=resolveRankedAbility(source,actor,'takeshi.counter_awakened',5);assert.equal(passive.skillRank,1);assert.equal(passive.effects[0].rankDamageFactor,undefined);
});
test('Ranked basic affects playable attacks only and remains snapshotted after campaign changes',()=>{
 const c=save();c.characters.arthur.skillRanks={basic:5};const b=fixture(c),actor=getActor(b,'arthur');c.characters.arthur.skillRanks.basic=1;use(b,'arthur','$attack','enemy_0');assert.equal(hits(b)[0].amount,Math.floor(actor.stats.attack*1.4641-11));assert.equal(actor.skillRanks.basic,5);
});
test('heal and shield scale direct output and all eligible side-buffs while preserving HP caps and strongest shield',()=>{
 const c=save(['chloe','iris','elaine','arthur']);c.characters.chloe.skillRanks={'chloe.care':5};c.characters.elaine.skillRanks={'elaine.shield':5};const b=fixture(c),e=getActor(b,'elaine'),target=getActor(b,'arthur');
 use(b,'elaine','elaine.shield','arthur');assert.equal(target.shield,Math.round(e.stats.magic*1.8*1.4641));target.shield=999;use(b,'elaine','elaine.shield','arthur');assert.equal(target.shield,999);
 target.hp=1;use(b,'chloe','chloe.care','arthur');assert.equal(target.hp,Math.min(target.stats.maxHp,1+Math.round((getActor(b,'chloe').stats.magic*content.abilities['chloe.care'].effects[0].multiplier+(content.abilities['chloe.care'].effects[0].flat??0))*1.4641)));
 near(statusModifier(content,target,'attack'),.15*1.21550625);near(statusModifier(content,target,'defense'),.15*1.21550625);assert.equal(statusModifier(content,target,'speed'),.15);
});
test('active buff strength is source-local, refresh replaces it, modifiers groups and linked statuses stay valid',()=>{
 const c=save();c.characters.iris.skillRanks={'iris.calibrate':5};const b=fixture(c),target=getActor(b,'arthur');use(b,'iris','iris.calibrate','arthur');near(statusModifier(content,target,'attack'),.2*1.21550625);near(target.statuses.find(s=>s.id==='calibrated').appliedModifiers.magic,.2*1.21550625);
 const raw=structuredClone(content.abilities['iris.calibrate']);raw.id='arthur.test';raw.skillLineId=raw.id;b.content=structuredClone(content);b.content.abilities[raw.id]=raw;target.abilities.push(raw.id);use(b,'arthur',raw.id,'arthur');near(statusModifier(content,target,'attack'),.2);assert.equal(target.statuses.filter(s=>s.id==='calibrated').length,1);assert.equal(content.statuses.calibrated.modifiers.attack,.2);
 const linked={statuses:[{id:'black_cavalry',remaining:2,sourceId:'gahallad',linkedStatuses:['calibrated'],linkedAppliedModifiers:{calibrated:{attack:.3,magic:.3}}}]};near(activeStatuses(linked).find(s=>s.id==='calibrated').appliedModifiers.attack,.3);near(statusModifier(content,linked,'magic'),.3);
});
test('Yufina mode adapter scales ATK alone, leaves SPD/MP/refund/lifetime and shared template unchanged',()=>{
 const c=save();c.characters.yufina.skillRanks={'yufina.ignite':5};const b=fixture(c),actor=getActor(b,'yufina');use(b,'yufina','yufina.ignite');near(battleStat(content,actor,'attack'),actor.stats.attack*(1+.35*1.21550625));near(battleStat(content,actor,'speed'),actor.stats.speed*1.2);assert.equal(actor.combatModes.radiant_fists.statModifiers.attack,.35);assert.equal(actor.combatModes.radiant_fists.exitMpRatio,.2);
});
test('output buffs keep 40%, ceil once across all discounts and preserve preferred-resource zero branch',()=>{
 const actor=resolveCharacter(content,save(),'iris');for(const[id,schedule]of [['iris.formula',[7,7,6,6,5]],['iris.assault',[12,11,10,9,9]]]){
  assert.deepEqual([1,2,3,4,5].map(rank=>mpCost(resolveRankedAbility(content,actor,id,rank),actor)),schedule);
  for(let rank=1;rank<=5;rank++)assert.equal(resolveRankedAbility(content,actor,id,rank).effects[0].appliedModifiers,undefined);
 }
 actor.skillRanks={'iris.formula':5};actor.passive={type:'kill_mp_discount',ratio:.12,statusId:'discount'};actor.statuses=[{id:'discount',remaining:2}];actor.activeMode='test';actor.combatModes={test:{mpCostReduction:.12,discountAbilityIds:['iris.formula']}};assert.equal(mpCost(content.abilities['iris.formula'],actor),Math.ceil(7*.7*.88*.88));
 const preferred={...content.abilities['iris.formula'],cost:{mp:7,preferResource:{id:'opening',amount:4}}};actor.resourceValues={opening:4};assert.equal(mpCost(preferred,actor),0);
 const b=fixture(save()),iris=getActor(b,'iris');iris.skillRanks={'iris.formula':3};const before=iris.mp;use(b,'iris','iris.formula','yufina');assert.equal(before-iris.mp,6);assert.equal(statusModifier(content,getActor(b,'yufina'),'damageBonus'),.4);
});
test('ranked mixed SPD buffs scale eligible stats only; utility, DoT/HoT/field/companion remain fixed',()=>{
 const actor=resolveCharacter(content,save(),'chloe');const s=resolveRankedAbility(content,actor,'chloe.care',5);near(s.effects[1].appliedModifiers.attack,.15*1.21550625);assert.equal(s.effects[1].appliedModifiers.speed,.15);
 for(const id of ['arden.poultice','gawain.cloud','drake.golem','astoria.summon','monica.distortion','takeshi.stance','fran.night'])assert.equal(content.abilities[id].growthProfile,'fixed');
 const custom={id:'test',growthProfile:'stat_buff',target:'self',effects:[{type:'status',status:'chloe_comfort'}]};const r=resolveRankedAbility(content,actor,custom,5);near(r.effects[0].appliedModifiers.attack,.15*1.21550625);near(r.effects[0].appliedModifiers.defense,.15*1.21550625);assert.equal(r.effects[0].appliedModifiers.speed,.15);
 assert.match(skillScaling(r,actor,content).join(' '),/18,23%/);
});
test('three-chapter stories are 10/20/30; waves preserve locked ranks without rereading the campaign',()=>{
 for(const story of Object.values(content.travelerStories))if(story.chapters.length===3)assert.deepEqual(story.chapters.map(id=>content.encounters[id].enemyLevel),[10,20,30]);
 const c=save(['arthur','fiona','iris','elaine']);c.claimedFirstClearRewards.push('iris_story_growth','iris_story_pride');c.characters.arthur.skillRanks={basic:4};const run=createStoryRun(content,c,'fiona_story_eins',()=>.5);assert.equal(getActor(run.battle,'arthur').skillRanks.basic,4);c.characters.arthur.skillRanks.basic=1;run.battle.outcome='victory';advanceStoryWave(content,run);assert.equal(run.battle.enemyLevel,10);assert.equal(getActor(run.battle,'arthur').skillRanks.basic,4);
});

test('all authoring profiles require a legitimate growth group and fixed sources cannot masquerade as active growth',()=>{
 for(const [id,change]of [['iris.formula',{growthProfile:'heal'}],['yufina.ignite',{growthAdapter:undefined}],['arthur.ogres_bane_mastered',{growthProfile:'damage',rankable:true}],['takeshi.counter_awakened',{growthProfile:'damage',rankable:true}],['iris.formula',{cost:{mp:1}}]]){const copy=structuredClone(content);Object.assign(copy.abilities[id],change);assert.ok(validateSkillProgression(copy).length,id);}
});
test('random-target four-hit and hybrid skills scale every authored component, not hits or final mitigation',()=>{
 const copy=structuredClone(content),c=save(['seraphine','iris','elaine','arthur']),id='arthur.random';copy.abilities[id]={id,name:'Test random',skillLineId:id,growthProfile:'damage',rankable:true,target:'random_enemies',effects:[{type:'damage',damageType:'physical',element:'plain',multiplier:1.8,hits:4}]};copy.characters.arthur.abilities.push(id);c.characters.arthur.skillRanks={[id]:5};c.characters.seraphine.skillRanks={'seraphine.blade':5};const b=fixture(c,copy),a=getActor(b,'arthur');use(b,'arthur',id,'enemy_0');assert.equal(hits(b).length,4);for(const hit of hits(b))assert.equal(hit.amount,Math.floor(a.stats.attack*1.8*1.4641-11));
 const seraphine=getActor(b,'seraphine');use(b,'seraphine','seraphine.blade','enemy_0');assert.equal(hits(b).length,2);content.abilities['seraphine.blade'].effects.forEach((effect,i)=>assert.equal(hits(b)[i].amount,Math.floor(seraphine.stats[effect.damageType==='physical'?'attack':'magic']*effect.multiplier*1.4641-11)));
});
test('ranked shield plus stat grows both groups and linked toggle snapshots preserve output amplification',()=>{
 const c=save(['sieg','gahallad','iris','elaine']);c.characters.sieg.skillRanks={'sieg.sanctuary':5};c.characters.gahallad.skillRanks={'gahallad.mount':5};const b=fixture(c),sieg=getActor(b,'sieg');use(b,'sieg','sieg.sanctuary');near(statusModifier(content,sieg,'defense'),content.statuses.silver_tide.modifiers.defense*1.21550625);assert.equal(sieg.shield,Math.round(sieg.stats.defense*content.abilities['sieg.sanctuary'].effects[0].multiplier*1.4641));
 use(b,'gahallad','gahallad.mount');const g=getActor(b,'gahallad');near(statusModifier(content,g,'attack'),.15*1.21550625);assert.equal(statusModifier(content,g,'damageVsShielded'),1);
});
test('compact combat scaling and full tooltip use the same ranked effect and source-owned overrides',async()=>{
 const {compactSkillScaling}=await import('../src/ui/combat-presentation.js');const c=save();c.characters.yufina.skillRanks={'yufina.pierce':5};const b=fixture(c),actor=getActor(b,'yufina'),raw=content.abilities['yufina.pierce'];assert.match(compactSkillScaling(raw,actor,getActor(b,'enemy_0'),content,b),/380,67%/);
 const upgraded=resolveRankedAbility(content,actor,raw);const other=getActor(b,'enemy_0');assert.equal(resolveRankedAbility(content,other,upgraded).skillRank,1);
 const shield=resolveRankedAbility(content,resolveCharacter(content,c,'elaine'),'elaine.shield',2);near(resolveRankedAbility(content,resolveCharacter(content,c,'elaine'),shield,3).effects[0].multiplier,1.8*1.21);
});



test('one Rank grows damage, heal, shield and stat buffs together, preserves amplification and uses its MP discount',()=>{
 const copy=structuredClone(content),id='arthur.combined';
 copy.statuses.test_combined={id:'test_combined',name:'Combined',kind:'buff',modifiers:{attack:.2,magic:.25,defense:.3,resistance:.35,speed:.15,damageBonus:.4,damageReduction:.1}};
 copy.abilities[id]={id,name:'Combined',skillLineId:id,growthProfile:'damage',rankable:true,growthGroups:['damage','heal','shield','stat_buff','output_buff_mp'],target:'enemy',cost:{mp:10},effects:[{type:'damage',damageType:'physical',element:'plain',multiplier:2},{type:'heal',to:'self',multiplier:1,flat:10},{type:'shield',to:'self',multiplier:1.5,flat:5},{type:'status',to:'self',status:'test_combined',duration:3}]};
 copy.characters.arthur.abilities.push(id);const c=save();c.characters.arthur.skillRanks={[id]:5};const b=fixture(c,copy),actor=getActor(b,'arthur');actor.hp=1;const before=actor.mp;use(b,'arthur',id,'enemy_0');assert.equal(before-actor.mp,7);assert.equal(hits(b)[0].amount,Math.floor(actor.stats.attack*2*1.4641-11));assert.equal(actor.hp,Math.min(actor.stats.maxHp,1+Math.round((actor.stats.magic+10)*1.4641)));assert.equal(actor.shield,Math.round((actor.stats.magic*1.5+5)*1.4641));
 for(const stat of ['attack','magic','defense','resistance'])near(statusModifier(copy,actor,stat),copy.statuses.test_combined.modifiers[stat]*1.21550625);
 assert.equal(statusModifier(copy,actor,'speed'),.15);assert.equal(statusModifier(copy,actor,'damageBonus'),.4);assert.equal(statusModifier(copy,actor,'damageReduction'),.1);
 const next=resolveRankedAbility(copy,actor,resolveRankedAbility(copy,actor,id,4),5);near(next.effects[1].flat,10*1.4641);assert.equal(copy.abilities[id].effects[1].flat,10);
});
test('mounted stat/output skill keeps its zero MP cost and authored amplification',()=>{
 const c=save(['gahallad','iris','elaine','arthur']);c.characters.gahallad.skillRanks={'gahallad.mount':5};const b=fixture(c),g=getActor(b,'gahallad'),raw=content.abilities['gahallad.mount'];assert.deepEqual(raw.growthGroups,['stat_buff']);assert.equal(mpCost(raw,g),0);assert.equal(mpCost(resolveRankedAbility(content,g,raw),g),mpCost(raw,g));const before=g.mp;use(b,'gahallad','gahallad.mount');assert.equal(before-g.mp,0);near(statusModifier(content,g,'attack'),.15*1.21550625);assert.equal(statusModifier(content,g,'damageVsShielded'),1);
});

test('status-only tooltips preserve an applied rank snapshot instead of resolving it as a new active cast',()=>{
 const c=save();c.characters.iris.skillRanks={'iris.calibrate':5};const actor=resolveCharacter(content,c,'iris'),applied={attack:.2*1.21550625,magic:.2*1.21550625};const info=skillPresentation({target:'self',effects:[{type:'status',status:'calibrated',appliedModifiers:applied}]},actor,content);assert.match(info.facts.join(' '),/24,31% ATK/);assert.equal(content.statuses.calibrated.modifiers.attack,.2);
});
