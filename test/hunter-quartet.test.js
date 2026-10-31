import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,getActor,executeAction,abilityAvailability,basicAbility} from '../src/core/battle.js';
import {battleStat} from '../src/core/stat-values.js';
import {buffTypeCount,mpCost,hpCost} from '../src/core/conditional-combat.js';
import {checkCombatMode} from '../src/core/combat-modes.js';
import {validateContent} from '../src/core/content.js';
import {skillPresentation,passivePresentation} from '../src/ui/skill-copy.js';
import {skillCost,skillPreviewOptions} from '../src/ui/skill-presentation.js';
import {compactSkillScaling} from '../src/ui/combat-presentation.js';
import {recruitCharacter} from '../src/core/economy.js';
import {classifyFormulaSkill} from '../src/core/formula-field.js';
const content=await loadContent();
function setup(party=['yufina','karin','elise','yumia']){const c=structuredClone(content),save=createGameSave(c);save.party=party;save.unlockedCharacterIds=[...new Set([...save.unlockedCharacterIds,...party])];const b=createBattle(c,save,'forest_patrol',()=>.99);for(const e of b.actors.filter(a=>a.team==='enemy')){e.hp=e.stats.maxHp=100000;e.stats.attack=e.stats.magic=20;e.stats.defense=e.stats.resistance=0;e.weaknesses=[];e.resistances={};}return {b,c,save};}
function cast(b,id,skill,target='enemy_0'){const sentinel=b.actors.find(a=>a.hp>0&&a.id!==id).id;b.queue=[id,sentinel];b.cursor=0;executeAction(b,{actorId:id,abilityId:skill,targetId:target});}
const hits=(b,id)=>b.events.filter(e=>e.type==='damage'&&e.sourceId===id);
function enemySkill(b,{target='enemy',hits:count=1,type='physical',multiplier=1}={}){const id='test.enemy';b.content.abilities[id]={id,name:'Enemy skill',target,effects:[{type:'damage',damageType:type,element:'plain',multiplier,hits:count}]};getActor(b,'enemy_0').abilities.push(id);return id;}
const counters=b=>b.events.filter(e=>e.type==='reaction'&&e.sourceId==='yumia');
function nextRound(b){b.queue=['enemy_0'];b.cursor=0;executeAction(b,{actorId:'enemy_0',abilityId:'$defend',targetId:'enemy_0'});}

test('four official recruits preserve roles, elements, zero duplicates and the save schema',()=>{
 for(const [id,element,role]of [['yufina','light','magical_dps'],['karin','plain','physical_dps'],['elise','water','magical_dps'],['yumia','dark','physical_dps']]){const a=content.characters[id];assert.equal(a.element,element);assert.equal(a.roleGroup,role);assert.ok(content.banners.standard.characterPool.includes(id));const save=createGameSave(content);assert.equal(save.unlockedCharacterIds.includes(id),false);save.recruitmentShards=120;const next=recruitCharacter(save,content,'standard',id);assert.equal(next.extraGearSlots[id]??0,0);assert.deepEqual(decodeGameSave(encodeGameSave(next,content),content),next);}
});
test('Yufina takes power from ATK, uses RES, cannot be physically dodged and can trigger Aurora',()=>{
 const {b}=setup(['yufina','aurora']);const y=getActor(b,'yufina'),e=getActor(b,'enemy_0');e.stats.defense=999;e.statuses.push({id:'evasive',remaining:3});b.random=()=>0;cast(b,y.id,'yufina.jab');assert.equal(hits(b,y.id)[0].amount,49);assert.equal(hits(b,y.id)[0].damageType,'magical');assert.equal(getActor(b,'aurora').resourceValues.thunder_charge,1);
 y.stats.magic=999;e.statuses=[];cast(b,y.id,'yufina.jab');assert.equal(hits(b,y.id)[0].amount,49);y.stats.attack=66;cast(b,y.id,'$attack');assert.equal(hits(b,y.id)[0].amount,66);
});
test('Yufina mode adds MAG/SPD percentages, discounts only the three combat skills and never changes ATK scaling',()=>{
 const {b}=setup(),y=getActor(b,'yufina');cast(b,y.id,'yufina.ignite',y.id);assert.ok(Math.abs(battleStat(b.content,y,'magic')-29.7)<1e-8);assert.ok(Math.abs(battleStat(b.content,y,'speed')-26.4)<1e-8);assert.equal(battleStat(b.content,y,'attack'),33);assert.equal(mpCost(content.abilities['yufina.pierce'],y),11);assert.equal(mpCost(content.abilities['yufina.daze'],y),8);assert.equal(mpCost(content.abilities['yufina.jab'],y),4);assert.equal(mpCost(content.abilities['yufina.ignite'],y),12);const mp=y.mp;cast(b,y.id,'yufina.pierce');assert.equal(y.mp,mp-11);assert.equal(y.cooldowns['yufina.pierce'],undefined);assert.equal(hits(b,y.id)[0].amount,85);assert.equal(abilityAvailability(b,y,content.abilities['yufina.ignite']).ok,false);assert.equal(content.abilities['yufina.ignite'].cooldown,2);assert.equal(content.characters.yufina.abilities.filter(id=>id!=='yufina.ignite').every(id=>!content.abilities[id].cooldown),true);
});
test('mode expiry refunds 20% maximum MP once and normal costs return; cooldown is ready on the first turn after the mode ends',()=>{
 const {b}=setup(),y=getActor(b,'yufina');cast(b,y.id,'yufina.ignite',y.id);y.mp=0;nextRound(b);nextRound(b);assert.equal(y.activeMode,'radiant_fists');nextRound(b);assert.equal(y.activeMode,undefined);assert.equal(y.mp,20);assert.equal(mpCost(content.abilities['yufina.pierce'],y),12);assert.equal(b.round,4);assert.equal(y.cooldowns['yufina.ignite'],0);assert.equal(abilityAvailability(b,y,content.abilities['yufina.ignite']).ok,true);cast(b,y.id,'yufina.ignite',y.id);assert.equal(y.activeMode,'radiant_fists');assert.equal(y.mp,8);let duplicate=0;checkCombatMode(b,y,'round_end',{write(){},emit(){},restore(){duplicate++;}});assert.equal(duplicate,0);
});
test('each Yufina attack has a distinct tactical value: budget, RES penetration, or MAG suppression',()=>{
 const {b}=setup(),e=getActor(b,'enemy_0');e.stats.resistance=40;cast(b,'yufina','yufina.pierce');assert.equal(hits(b,'yufina')[0].amount,69);cast(b,'yufina','yufina.daze');assert.equal(e.statuses.find(s=>s.id==='yufina_dazed').remaining,2);assert.equal(battleStat(b.content,e,'magic'),16);assert.equal(content.abilities['yufina.jab'].cost.mp,4);
});
test('Karin grows monotonically stronger as HP falls, across all enemy targets',()=>{
 const values=[];for(const hp of [225,112,1]){const {b}=setup(),k=getActor(b,'karin');k.hp=hp;cast(b,k.id,'karin.sweep');const damage=hits(b,k.id);assert.equal(damage.length,3);assert.equal(new Set(damage.map(d=>d.amount)).size,1);values.push(damage[0].amount);}assert.equal(values[0],29);assert.ok(values[0]<values[1]&&values[1]<values[2]);
});
test('Karin pays a real max-HP cost before buffing; shields cannot pay it, and insufficient HP or invalid targets are atomic',()=>{
 const {b}=setup(),k=getActor(b,'karin');k.shield=1000;cast(b,k.id,'karin.blood_oath',k.id);assert.equal(k.hp,180);assert.equal(k.shield,1000);assert.ok(k.statuses.some(s=>s.id==='karin_oath'));assert.equal(hpCost(content.abilities['karin.blood_oath'],k),45);assert.equal(b.events.some(e=>e.type==='damage'&&e.sourceId===k.id),false);k.hp=45;const mp=k.mp;assert.equal(abilityAvailability(b,k,content.abilities['karin.blood_oath']).ok,false);assert.throws(()=>cast(b,k.id,'karin.blood_oath',k.id),/Không đủ HP/);assert.equal(k.mp,mp);assert.equal(k.hp,45);
});
test('Elise counts buff types rather than stacks, stat modifiers, shields, or debuffs, with a capped bonus',()=>{
 const {b}=setup(),e=getActor(b,'enemy_0');e.shield=100;e.statuses=[{id:'effect_ward',remaining:null,charges:1,stacks:99},{id:'yumia_shelter',remaining:3},{id:'yufina_dazed',remaining:3}];assert.equal(buffTypeCount(b.content,e),2);e.shield=0;cast(b,'elise','elise.scripture');assert.equal(hits(b,'elise')[0].amount,83);e.statuses.push({id:'taunt',remaining:3},{id:'karin_oath',remaining:3});assert.equal(buffTypeCount(b.content,e),4);cast(b,'elise','elise.scripture');assert.equal(hits(b,'elise')[0].amount,95);
});
test('Elise nuke scales against actual live buffs; absolution damages before removing the oldest stored buff',()=>{
 const {b}=setup(),e=getActor(b,'enemy_0');e.statuses=[{id:'effect_ward',remaining:null,charges:1},{id:'taunt',remaining:3},{id:'yumia_shelter',remaining:3}];cast(b,'elise','elise.judgment');assert.equal(hits(b,'elise')[0].amount,201);e.statuses=e.statuses.slice(0,2);cast(b,'elise','elise.absolve');assert.equal(hits(b,'elise')[0].amount,68);assert.equal(e.statuses.some(s=>s.id==='effect_ward'),false);assert.equal(e.statuses.some(s=>s.id==='taunt'),true);assert.ok(b.events.some(e=>e.type==='dispel'&&e.amount===1));
});
test('Yumia counter is her strongest strike, fires once after an entire AoE/multi-hit skill, and uses shared main/extra quota',()=>{
 const {b}=setup(),id=enemySkill(b,{target:'all_enemies',hits:2});cast(b,'enemy_0',id);assert.equal(counters(b).length,1);assert.equal(hits(b,'yumia').length,1);assert.equal(hits(b,'yumia')[0].amount,134);const index=b.events.findIndex(e=>e.type==='reaction'&&e.sourceId==='yumia');assert.equal(b.events.slice(index+1).some(e=>e.type==='damage'&&e.sourceId==='enemy_0'),false);cast(b,'enemy_0',id);assert.equal(counters(b).length,0);b.phase='extra';cast(b,'enemy_0',id);assert.equal(counters(b).length,0);b.round++;cast(b,'enemy_0',id);assert.equal(counters(b).length,1);
});
test('Yumia excludes basic attacks, self-only hits, dodges and pure debuffs',()=>{
 for(const mode of ['basic','self','dodge','debuff']){const {b}=setup();const id=enemySkill(b);if(mode==='basic')cast(b,'enemy_0','$attack','yufina');if(mode==='self')cast(b,'enemy_0',id,'yumia');if(mode==='dodge'){getActor(b,'yufina').statuses.push({id:'evasive',remaining:3});b.random=()=>0;cast(b,'enemy_0',id,'yufina');}if(mode==='debuff'){b.content.abilities[id].effects=[{type:'status',status:'shaken',duration:2}];cast(b,'enemy_0',id,'yufina');}assert.equal(counters(b).length,0,mode);assert.equal(getActor(b,'yumia').procRounds?.ally_skill_counter,undefined);}
});
test('Yumia reacts to shield damage and even a fallen other ally, but cannot act after her own defeat',()=>{
 for(const mode of ['shield','dead_ally','dead_owner']){const {b}=setup();const ally=getActor(b,'yufina');const id=enemySkill(b,{target:mode==='dead_owner'?'all_enemies':'enemy',multiplier:mode==='dead_owner'?10:1});if(mode==='shield')ally.shield=1000;if(mode==='dead_ally')ally.hp=1;if(mode==='dead_owner')getActor(b,'yumia').hp=1;cast(b,'enemy_0',id,ally.id);assert.equal(counters(b).length,mode==='dead_owner'?0:1,mode);}
});
test('counter reaction cannot retrigger Aurora or another Yumia through a magical test counter',()=>{
 const {b}=setup(['yumia','aurora','yufina']);b.content.abilities['yumia.counter'].effects[0].damageType='magical';const id=enemySkill(b);cast(b,'enemy_0',id,'yufina');assert.equal(counters(b).length,1);assert.equal(getActor(b,'aurora').resourceValues.thunder_charge,0);assert.equal(b.actionCount,1);
});
test('Yumia strips all buff statuses without touching debuffs or shield; utility skills remain distinct',()=>{
 const {b}=setup(),e=getActor(b,'enemy_0');e.statuses=[{id:'taunt',remaining:3},{id:'effect_ward',remaining:null,charges:1},{id:'shaken',remaining:3}];e.shield=100;cast(b,'yumia','yumia.strip');assert.deepEqual(e.statuses.map(s=>s.id),['shaken']);assert.equal(e.shield,100);assert.equal(classifyFormulaSkill(b.content,content.abilities['yumia.strip']),'break');cast(b,'yumia','yumia.watch');assert.equal(e.statuses.find(s=>s.id==='yumia_watch').remaining,2);cast(b,'yumia','yumia.shelter','yumia');assert.ok(b.actors.filter(a=>a.team==='party').every(a=>a.statuses.some(s=>s.id==='yumia_shelter')));
});
test('new passives, HP costs, dispel and buff-count fields reject invalid definitions',()=>{
 for(const mutate of [c=>c.characters.yumia.passive.oncePerRound=false,c=>c.characters.yumia.passive.counterAbility='drake.golem_start',c=>c.characters.karin.passive.ratio=-1,c=>c.characters.elise.passive.cap=Infinity,c=>c.abilities['karin.blood_oath'].cost.hpMaxRatio=1,c=>c.abilities['elise.judgment'].effects[0].maxTargetBuffs=0,c=>c.abilities['yumia.strip'].effects[0].count=1,c=>c.characters.yufina.combatModes.radiant_fists.mpCostReduction=1]){const c=structuredClone(content);mutate(c);assert.ok(validateContent(c).length);}
});
test('previews expose actual ATK magical scaling, mode discounts, HP costs and adjustable enemy buff counts',()=>{
 for(const id of ['yufina','karin','elise','yumia']){const a=content.characters[id];assert.doesNotMatch(JSON.stringify(passivePresentation(a,content)),/undefined|NaN/);for(const s of a.abilities)assert.doesNotMatch(JSON.stringify(skillPresentation(content.abilities[s],a,content)),/undefined|NaN/);}
 assert.match(skillPresentation(content.abilities['yufina.jab'],content.characters.yufina,content).facts.join(' '),/ma pháp.*150% ATK/);assert.match(skillCost(content.abilities['karin.blood_oath'],content.characters.karin),/45 HP/);assert.ok(skillPreviewOptions(content.abilities['elise.judgment'],content.characters.elise,content).some(c=>c.key==='buffCount'));const {b}=setup(),e=getActor(b,'enemy_0');e.statuses=[{id:'taunt',remaining:3},{id:'effect_ward',remaining:null,charges:1},{id:'yumia_shelter',remaining:3}];assert.match(compactSkillScaling(content.abilities['elise.judgment'],getActor(b,'elise'),e,content,b),/360% MAG.*60% ST/);
});
