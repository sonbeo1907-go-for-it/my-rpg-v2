import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {resolveCharacter} from '../src/core/progression.js';
import {createBattle,getActor,executeAction} from '../src/core/battle.js';
import {battleStat,statusModifier} from '../src/core/stat-values.js';
import {effectiveStat} from '../src/core/combat-math.js';
import {resolveRankedAbility} from '../src/core/skill-resolver.js';
import {mpCost} from '../src/core/conditional-combat.js';
import {buyExclusiveRecipe} from '../src/core/blueprint-shop.js';
import {exclusiveCraftUnlocked,exclusiveRollRange} from '../src/core/blacksmith-rules.js';
import {craftExclusive} from '../src/core/blacksmith.js';
import {claimBattleReward} from '../src/core/economy.js';
import {prepareVictoryReward,victoryRewardPreview} from '../src/core/quest-rewards.js';
import {levelScaledEnemyStats} from '../src/core/enemy-scaling.js';
import {questDifficulty} from '../src/core/quest-difficulty.js';
import {skillPresentation} from '../src/ui/skill-copy.js';
const content=await loadContent(),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const template=id=>Object.values(content.exclusiveGear).find(t=>t.characterId===id&&t.requires?.blueprint);
function save(party,owners=party){const c=createGameSave(content);c.unlockedCharacterIds=Object.keys(content.characters);c.party=party;c.partyPresets[0].slots=[...party];for(const id of owners){const t=template(id);if(!t)continue;c.exclusiveGear.push({templateId:t.id,statKey:'maxMp',statValue:exclusiveRollRange(content,'maxMp').min});c.equippedExclusiveGear[id]=t.id;c.unlockedExclusiveRecipes.push(t.id);}return c;}
function fixture(party=['dain','arthur','iris','elaine'],owners=[party[0]],source=content){const c=save(party,owners),b=createBattle(source,c,'forest_patrol',()=>.99,{enemyLevel:1});for(const a of b.actors){if(a.team==='enemy'){a.hp=a.stats.maxHp=100000;a.stats.defense=a.stats.resistance=0;a.weaknesses=[];a.resistances={};}else{a.stats.maxMp=1000;a.mp=1000;}}return b;}
function use(b,id,ability,target=id){b.queue=[id,id==='enemy_0'?'arthur':'enemy_0'];b.cursor=0;b.phase='main';b.outcome=null;getActor(b,id).cooldowns={};executeAction(b,{actorId:id,abilityId:ability,targetId:target});}
const a=(b,id)=>getActor(b,id),damage=b=>b.events.filter(e=>e.type==='damage'&&!e.periodic);
function enemyHit(b,target,type='physical',status){const id='test.enemy';b.content=structuredClone(b.content);b.content.abilities[id]={id,name:'Test',target:'enemy',effects:status?[{type:'status',status,duration:2}]:[{type:'damage',damageType:type,element:'plain',multiplier:1}]};a(b,'enemy_0').abilities.push(id);a(b,'enemy_0').stats.attack=a(b,'enemy_0').stats.magic=100;use(b,'enemy_0',id,target);}

test('new recipes require exactly 10 Blueprints, save v7 migrates and purchase/craft validation is atomic',()=>{
 const c=createGameSave(content),id=template('dain').id;c.blueprints=20;assert.equal(exclusiveCraftUnlocked(c,content.exclusiveGear[id]),false);const n=buyExclusiveRecipe(c,content,id);assert.equal(n.blueprints,10);assert.equal(c.blueprints,20);assert.equal(exclusiveCraftUnlocked(n,content.exclusiveGear[id]),true);assert.throws(()=>buyExclusiveRecipe(n,content,id),/đã được mở/);assert.throws(()=>buyExclusiveRecipe(c,content,id,{battleActive:true}),/kết thúc/);
 const old=structuredClone(c);delete old.blueprints;delete old.unlockedExclusiveRecipes;const migrated=decodeGameSave(encodeGameSave(old,content),content);assert.equal(migrated.blueprints,0);assert.deepEqual(migrated.unlockedExclusiveRecipes,[]);
 const r=decodeGameSave(encodeGameSave(n,content),content);assert.deepEqual(r.unlockedExclusiveRecipes,[id]);assert.deepEqual(r.partyPresets,c.partyPresets);
 for(const value of [null,-1,1.5,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>encodeGameSave({...c,blueprints:value},content));assert.throws(()=>encodeGameSave({...c,unlockedExclusiveRecipes:['missing']},content));
 assert.throws(()=>encodeGameSave({...c,unlockedExclusiveRecipes:null},content));
 const poor={...c,blueprints:9};assert.throws(()=>buyExclusiveRecipe(poor,content,id));assert.equal(poor.blueprints,9);assert.throws(()=>craftExclusive(c,content,id),/Shop/);
 for(const t of Object.values(content.exclusiveGear).filter(t=>content.economy.default.starterCharacters.includes(t.characterId)))assert.ok(!t.requires?.blueprint);
});
test('repeat Bounty Lv25/35/45 splits exactly 40/40/20; first clears, lower levels and ordinary bosses keep their pool',()=>{
 const c=createGameSave(content),id='bounty_black_script_cleric';c.claimedFirstClearRewards.push(id);
 for(const[difficulty,count]of [['medium',1],['hard',3],['very_hard',5]]){
  for(const[roll,field]of [[0,'coins'],[.3999,'coins'],[.4,'prismaFragments'],[.7999,'prismaFragments'],[.8,'blueprints'],[.9999,'blueprints']]){const b={encounterId:id,questDifficulty:difficulty};const r=prepareVictoryReward(b,content,()=>roll,c);assert.ok(r[field]>0);if(field==='blueprints')assert.equal(r.blueprints,count);assert.strictEqual(prepareVictoryReward(b,content,()=>{throw Error('reroll');},c),r);}
 }
 for(const [encounterId,difficulty,ledger]of [[id,'easy',true],[id,'medium',false],['ogre_trial','very_hard',true]]){const account=structuredClone(c);account.claimedFirstClearRewards=ledger?[encounterId]:[];assert.equal(prepareVictoryReward({encounterId,questDifficulty:difficulty},content,()=>.99,account).blueprints,undefined);}
 assert.match(victoryRewardPreview(content,id,'very_hard',c),/5 Bản Thiết Kế \(20%\)/);
});
test('Blueprint reward retries reuse the roll, persist once, grant XP and keep daily Quest progress',()=>{
 const c=createGameSave(content),id='bounty_black_script_cleric';c.claimedFirstClearRewards.push('iris_story_revenge','takeshi_story_horizon','fiona_story_drei',id);const b={encounterId:id,outcome:'victory',questDifficulty:'medium',rewardRandom:()=>.99,actors:c.party.map(id=>({id,team:'party'}))};assert.throws(()=>claimBattleReward(c,b,content,()=>{throw Error('disk');}));assert.equal(c.blueprints,0);assert.equal(b.rewardClaimed,undefined);const n=claimBattleReward(c,b,content);assert.equal(n.blueprints,1);assert.ok(n.characters.arthur.xp>0||n.characters.arthur.level>1);assert.equal(n.dailyCommissions.questClears,1);assert.strictEqual(claimBattleReward(n,b,content),n);
});
test('Dain retains the 50% floor and reaches 100% chance at 200 current ATK without changing unequipped behavior',()=>{
 const b=fixture(),d=a(b,'dain');d.stats.attack=200;use(b,'dain','dain.brace');use(b,'dain','dain.strike','enemy_0');assert.equal(d.resourceValues.resolve,1);
 const no=fixture(['dain','arthur','iris','elaine'],[]);a(no,'dain').stats.attack=200;use(no,'dain','dain.brace');use(no,'dain','dain.strike','enemy_0');assert.equal(a(no,'dain').resourceValues.resolve,0);
});
test('Rowan gains 40% ATK only on the resource-paying skill, with no permanent stat mutation',()=>{
 const b=fixture(['rowan','arthur','iris','elaine']),r=a(b,'rowan'),attack=battleStat(content,r,'attack');r.resourceValues.aim=1;use(b,'rowan','rowan.pierce','enemy_0');assert.equal(damage(b)[0].amount,Math.floor(attack*1.4*2.1));near(battleStat(content,r,'attack'),attack);use(b,'rowan','rowan.volley','enemy_0');assert.equal(damage(b)[0].amount,Math.floor(attack*.9));
});
test('Freya stacks on actual creation/spending, benefits the consuming hit, caps at 3 and refreshes four turns',()=>{
 const b=fixture(['freya','arthur','iris','elaine']),f=a(b,'freya'),magic=battleStat(content,f,'magic');use(b,'freya','freya.fireball','enemy_0');assert.equal(f.statuses.find(s=>s.id==='freya_exclusive_heat').stacks,1);near(battleStat(content,f,'magic'),magic*1.08);use(b,'freya','freya.inferno','enemy_0');assert.equal(damage(b)[0].amount,Math.floor(magic*1.16*1.2));use(b,'freya','freya.fireball','enemy_0');assert.equal(f.statuses.find(s=>s.id==='freya_exclusive_heat').stacks,3);near(battleStat(content,f,'magic'),magic*1.24);assert.equal(f.statuses.find(s=>s.id==='freya_exclusive_heat').remaining,4);
});
test('Galliard creates 120% current DEF on taunt and preserves the strongest-shield rule',()=>{
 const b=fixture(['galliard','arthur','iris','elaine']),g=a(b,'galliard');use(b,'galliard','galliard.taunt');assert.equal(g.shield,Math.round(battleStat(content,g,'defense')*1.2));g.shield=999;use(b,'galliard','galliard.taunt');assert.equal(g.shield,999);
});
test('Armie threshold checks pre-heal HP strictly below 50%; bonus is independent from Skill Rank',()=>{
 for(const ratio of [.49,.5]){const b=fixture(['armie','arthur','iris','elaine']),armie=a(b,'armie'),target=a(b,'arthur');target.stats.maxHp=1000;target.hp=1000*ratio;const before=target.hp,e=content.abilities['armie.first_aid'].effects[0],magic=battleStat(content,armie,'magic');use(b,'armie','armie.first_aid','arthur');assert.equal(target.hp-before,Math.round((e.flat??0)+magic*e.multiplier)+Math.round(ratio<.5?magic*.5:0));}
});
test('Rhett Defend restores HP and one Charge; Fran applies stronger, longer debuffs and the correct MP cost',()=>{
 const b=fixture(['rhett','arthur','iris','elaine']),r=a(b,'rhett');r.hp-=50;const before=r.hp;use(b,'rhett','$defend');assert.equal(r.resourceValues.charge,1);assert.equal(r.hp-before,Math.round(r.stats.maxHp*.05));
 const f=fixture(['fran','arthur','iris','elaine']),fran=a(f,'fran');assert.equal(mpCost(content.abilities['fran.night'],fran),24);use(f,'fran','fran.night','enemy_0');near(statusModifier(content,a(f,'enemy_0'),'defense'),-.35);near(statusModifier(content,a(f,'enemy_0'),'resistance'),-.35);assert.equal(a(f,'enemy_0').statuses.find(s=>s.id==='starless').remaining,3);assert.equal(content.statuses.starless.modifiers.defense,-.2);
});
test('Kai RES follows rank explicitly, leaving the shared status definition and original kit untouched',()=>{
 const c=save(['kai','arthur','iris','elaine']);Object.assign(c.characters.kai,{level:50,limitBreakRank:3,skillRanks:{'kai.formation':5}});const actor=resolveCharacter(content,c,'kai'),skill=resolveRankedAbility(content,actor,'kai.formation');const extra=skill.effects.find(e=>e.status==='kai_exclusive_resistance');near(extra.appliedModifiers.resistance,.15*1.05**4);assert.equal(content.abilities['kai.formation'].effects.length,1);assert.match(skillPresentation(skill,actor,content).facts.join(' '),/18,23% RES/);
});
test('Lisbeth refunds after casting only when pride existed at cast start',()=>{
 for(const pride of [false,true]){const b=fixture(['lisbeth','arthur','iris','elaine']),l=a(b,'lisbeth');if(pride)use(b,'lisbeth','lisbeth.pride');const before=l.mp;use(b,'lisbeth','lisbeth.judgment','enemy_0');assert.equal(before-l.mp,content.abilities['lisbeth.judgment'].cost.mp-(pride?8:0));}
});
test('Benard adds 25% current SPD per twin-blade hit, only during Gale; Trấn contribution does not grow with Rank',()=>{
 const b=fixture(['benard','arthur','iris','elaine']),g=a(b,'benard');use(b,'benard','benard.gale');const atk=battleStat(content,g,'attack'),speed=battleStat(content,g,'speed'),e=content.abilities['benard.twin_blades'].effects[0];use(b,'benard','benard.twin_blades','enemy_0');for(const hit of damage(b))assert.equal(hit.amount,Math.floor(atk*e.multiplier+speed*((g.passive.ratio??0)+(e.speedMultiplier??0)+.25)));
 g.level=50;g.skillRanks={'benard.twin_blades':5};use(b,'benard','benard.twin_blades','enemy_0');for(const hit of damage(b))assert.equal(hit.amount,Math.floor(atk*e.multiplier*1.1**4+speed*((g.passive.ratio??0)+(e.speedMultiplier??0)*1.1**4+.25)));
});
test('Lanceveil protects the lowest HP ratio living ally; Gahallad refunds only once per round on a real shield break',()=>{
 const b=fixture(['lanceveil','arthur','iris','elaine']),l=a(b,'lanceveil');a(b,'iris').hp=1;use(b,'lanceveil','lanceveil.bulwark');assert.equal(a(b,'iris').shield,Math.round(battleStat(content,l,'defense')));assert.equal(a(b,'arthur').shield,0);
 const g=fixture(['gahallad','arthur','iris','elaine']),owner=a(g,'gahallad');for(let i=0;i<3;i++){if(i===2)g.round++;a(g,'enemy_0').shield=1;const before=owner.mp;use(g,'gahallad','gahallad.trample','enemy_0');assert.equal(before-owner.mp,content.abilities['gahallad.trample'].cost.mp-(i===1?0:5));}
});
test('Gawain refunds on a damaging automatic cloud pulse, once per round rather than per target or extra turn',()=>{
 const b=fixture(['gawain','arthur','iris','elaine']),g=a(b,'gawain');use(b,'gawain','gawain.cloud');const before=g.mp;const pulse=()=>{b.queue=['arthur','gawain'];b.cursor=0;executeAction(b,{actorId:'arthur',abilityId:'$defend',targetId:'arthur'});};pulse();assert.equal(g.mp,before+3);pulse();assert.equal(g.mp,before+3);b.round++;pulse();assert.equal(g.mp,before+6);
});
test('Lucien refund counts living Valmont including self; Seraphine scales with other Valmont and conditional penetration',()=>{
 const b=fixture(['lucien','seraphine','lyon','cedric']),l=a(b,'lucien');a(b,'cedric').hp=0;const before=l.mp;use(b,'lucien','lucien.ward');assert.equal(before-l.mp,content.abilities['lucien.ward'].cost.mp-12);
 for(const party of [['seraphine','lyon','lucien','cedric'],['seraphine','lyon','arthur','elaine'],['seraphine']]){const c=save(party),s=resolveCharacter(content,c,'seraphine'),count=party.filter(id=>id!=='seraphine'&&content.characters[id].tags?.includes('valmont')).length;near(s.stats.attack,s.baseStats.attack*(1+count*.15));near(s.stats.magic,s.baseStats.magic*(1+count*.15));assert.equal(s.exclusiveTeamPenetration,count>0&&count===party.length-1?.15:0);}
});
test('Lyon shields the actual ward holder only on a hostile blocked debuff, not on ward creation or later unblocked hits',()=>{
 const b=fixture(['lyon','arthur','iris','elaine']),l=a(b,'lyon');use(b,'lyon','lyon.ward','arthur');assert.equal(a(b,'arthur').shield,0);enemyHit(b,'arthur','magical','starless');assert.equal(a(b,'arthur').shield,Math.round(battleStat(content,l,'defense')));assert.ok(!a(b,'arthur').statuses.some(s=>s.id==='starless'));a(b,'arthur').shield=0;enemyHit(b,'arthur','magical','starless');assert.equal(a(b,'arthur').shield,0);assert.ok(a(b,'arthur').statuses.some(s=>s.id==='starless'));
});
test('Cedric bonus counts living rally recipients and adds its own unranked flat recovery to each healed ally',()=>{
 const b=fixture(['cedric','lucien','lyon','seraphine']),c=a(b,'cedric');use(b,'cedric','cedric.rally');a(b,'lyon').hp=0;for(const t of b.actors.filter(t=>t.team==='party'&&t.hp>0)){t.stats.maxHp=1000;t.hp=100;}const atk=battleStat(content,c,'attack'),e=content.abilities['cedric.aid'].effects[0];use(b,'cedric','cedric.aid');assert.equal(a(b,'lucien').hp-100,Math.round((e.flat??0)+atk*e.multiplier)+Math.round(atk*.25*3));
});
test('Helena skill gets +35% MAG only when its additional MP payment is full; Leonardo aura uses maximum MP and only magic',()=>{
 for(const mp of [18,15]){const b=fixture(['helena','arthur','iris','elaine']),h=a(b,'helena'),magic=battleStat(content,h,'magic');h.mp=mp;use(b,'helena','helena.rain','enemy_0');assert.equal(damage(b)[0].amount,Math.floor(magic*(mp===18?1.35:1)*.95*(mp===18?1.5:1.25)));}
 const source=structuredClone(content);for(const id of ['leonardo','arthur','iris','elaine'])source.characters[id].stats.maxMp=200;const b=fixture(['leonardo','arthur','iris','elaine'],['leonardo'],source);near(a(b,'arthur').teamMagicDamageReduction,.3);a(b,'arthur').stats.defense=a(b,'arthur').stats.resistance=0;enemyHit(b,'arthur','magical');assert.equal(damage(b)[0].amount,70);enemyHit(b,'arthur','physical');assert.equal(damage(b)[0].amount,100);
});
test('Kyle improves only other living allies hitting a fully marked target',()=>{
 const b=fixture(['kyle','freya','arthur','elaine']),f=a(b,'freya'),magic=battleStat(content,f,'magic'),e=content.abilities['freya.fireball'].effects[0];for(const stacks of [2,3]){a(b,'enemy_0').statuses=[{id:'mischief',stacks,remaining:3,sourceId:'kyle'}];use(b,'freya','freya.fireball','enemy_0');assert.equal(damage(b)[0].amount,Math.floor(magic*(stacks===3?1.25:1.15)*e.multiplier));}
});
test('always-on MP conversion uses max MP, floors the value and caps at 25 independently of current MP',()=>{
 for(const mp of [0,100,499,500,800]){const source=structuredClone(content);source.characters.arthur.stats.maxMp=mp;const c=save(['arthur','iris','elaine','garrek'],[]);for(const[id,stat]of [['rune_1','attack'],['rune_2','magic']]){c.gear.push({id,typeId:'t4_effect',stats:{},effectId:'mana_'+stat+'_conversion'});}(c.equipment.arthur=['rune_1','rune_2']);const actor=resolveCharacter(source,c,'arthur'),expected=Math.min(25,Math.floor(mp*.05));assert.equal(actor.gearEffectBonuses.attack,expected);assert.equal(actor.stats.attack,source.characters.arthur.stats.attack+expected);assert.equal(actor.stats.magic,source.characters.arthur.stats.magic+expected);actor.mp=0;near(effectiveStat(actor,'attack'),actor.stats.attack);}
});
test('every selectable Quest defaults to very easy and traveler chapters use their actual fixed level for scaling',()=>{
 for(const e of Object.values(content.encounters)){const d=questDifficulty(content,e);if(d)assert.equal(d.level,5);if(e.travelerStory)for(const id of (e.waves??[e.enemies]).flat()){const stats=levelScaledEnemyStats(content.enemies[id],e.enemyLevel,content,1,e);assert.ok(stats.maxHp>=content.enemies[id].stats.maxHp);}}
});
