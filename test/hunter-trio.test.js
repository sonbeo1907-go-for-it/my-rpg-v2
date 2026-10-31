import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,getActor,activeActor,executeAction,selectedTargets,basicAbility} from '../src/core/battle.js';
import {validateContent} from '../src/core/content.js';
import {recruitCharacter} from '../src/core/economy.js';
import {skillPresentation,passivePresentation} from '../src/ui/skill-copy.js';
import {skillScaling} from '../src/ui/skill-presentation.js';
import {resolveCombatTargets,compactSkillScaling,statusDetails} from '../src/ui/combat-presentation.js';
import {combatTimeline} from '../src/ui/combat-timeline.js';
const content=await loadContent();
function setup(party=['logia','amelia','chloe','arthur']) {
 const c=structuredClone(content),save=createGameSave(c);save.party=party;save.unlockedCharacterIds=[...new Set([...save.unlockedCharacterIds,...party])];
 const b=createBattle(c,save,'forest_patrol',()=>.99);
 for(const actor of b.actors){actor.stats.speed=10;actor.statuses=[];if(actor.team==='enemy'){actor.hp=actor.stats.maxHp=10000;actor.stats.defense=actor.stats.resistance=0;actor.weaknesses=[];actor.resistances={};}}
 return {b,c,save};
}
function cast(b,actorId,abilityId,targetId='enemy_0') {
 const sentinel=b.actors.find(a=>a.id!==actorId&&a.hp>0).id;
 b.queue=[actorId,sentinel];b.cursor=0;b.outcome=null;
 return executeAction(b,{actorId,abilityId,targetId});
}
function attack(b,targetId,extra={}) {
 const e=getActor(b,'enemy_0');b.content.abilities['test.hit']={id:'test.hit',name:'Test hit',target:'enemy',effects:[{type:'damage',damageType:'physical',element:'plain',multiplier:1,...extra}]};e.abilities.push('test.hit');
 cast(b,e.id,'test.hit',targetId);
}
function shield(b,id,amount=200,source='arthur'){Object.assign(getActor(b,id),{shield:amount,shieldSourceId:source});}
const fua=b=>b.events.filter(e=>e.type==='reaction'&&e.sourceId==='amelia');

test('official Hunter Guild recruits use existing roles and are locked at zero duplicates; recruitment/save round trips work',()=>{
 assert.equal(content.characters.logia.element,'thunder');assert.equal(content.characters.logia.roleGroup,'physical_dps');assert.equal(content.characters.amelia.roleGroup,'defensive_support');assert.equal(content.characters.chloe.element,'plain');assert.equal(content.characters.chloe.roleGroup,'offensive_support');
 for(const id of ['logia','amelia','chloe']){const save=createGameSave(content);assert.ok(content.banners.standard.characterPool.includes(id));assert.equal(save.unlockedCharacterIds.includes(id),false);save.recruitmentShards=120;const next=recruitCharacter(save,content,'standard',id);assert.equal(next.extraGearSlots[id]??0,0);assert.deepEqual(decodeGameSave(encodeGameSave(next,content),content),next);}
});
test('Logia has physical Thunder hits and stacking poison snapshots ATK and his native exactly once',()=>{
 const {b}=setup();cast(b,'logia','logia.fang');let e=getActor(b,'enemy_0'),dot=e.statuses.find(s=>s.id==='logia_venom');assert.equal(dot.stacks,1);assert.equal(dot.potency,17);assert.equal(dot.remaining,3);
 cast(b,'logia','logia.agony');dot=e.statuses.find(s=>s.id==='logia_venom');assert.equal(dot.stacks,3);assert.equal(dot.remaining,3);assert.ok(b.events.filter(x=>x.type==='damage').every(x=>x.damageType==='physical'&&x.element==='thunder'));
 const hp=e.hp;e.shield=1000;getActor(b,'logia').stats.attack=999;getActor(b,'logia').hp=0;
 // Advancing into the target's turn resolves its stored poison before any action.
 b.queue=['chloe','enemy_0','arthur'];b.cursor=0;executeAction(b,{actorId:'chloe',abilityId:'$defend',targetId:'chloe'});
 assert.equal(e.hp,hp-51);assert.equal(e.shield,1000);assert.equal(dot.remaining,2);assert.ok(b.events.some(x=>x.periodic&&x.amount===51));
});
test('Logia poison refreshes and caps at three; Kai poison remains distinct and does not inherit the bonus',()=>{
 const {b}=setup(['logia','kai','amelia']);cast(b,'logia','logia.agony');getActor(b,'logia').cooldowns={};cast(b,'logia','logia.agony');const e=getActor(b,'enemy_0');assert.equal(e.statuses.find(s=>s.id==='logia_venom').stacks,3);
 cast(b,'kai','kai.poison');assert.equal(e.statuses.find(s=>s.id==='kai_poison').potency,12);assert.equal(e.statuses.filter(s=>content.statuses[s.id].damageOverTime).length,2);
});
test('misses and wards prevent venom; AoE poisons each surviving enemy separately',()=>{
 const {b}=setup();const e=getActor(b,'enemy_0');e.statuses.push({id:'effect_ward',remaining:null,charges:1,sourceId:'arthur'});cast(b,'logia','logia.fang');assert.equal(e.statuses.some(s=>s.id==='logia_venom'),false);
 b.content.statuses.test_evade={id:'test_evade',name:'Test',kind:'buff',modifiers:{evasion:.85}};e.statuses.push({id:'test_evade',remaining:3});b.random=()=>0;cast(b,'logia','logia.fang');assert.equal(e.statuses.some(s=>s.id==='logia_venom'),false);e.statuses=[];b.random=()=>.99;
 cast(b,'logia','logia.miasma');assert.equal(b.actors.filter(a=>a.team==='enemy'&&a.statuses.some(s=>s.id==='logia_venom')).length,3);
});
test('Amelia reacts once per round to another ally keeping an external shield, AoE hits all living enemies and debuffs',()=>{
 const {b}=setup();shield(b,'arthur');attack(b,'arthur');assert.equal(fua(b).length,1);assert.ok(getActor(b,'arthur').shield>0);assert.equal(getActor(b,'amelia').mp,110);
 const hits=b.events.filter(e=>e.type==='damage'&&e.sourceId==='amelia');assert.equal(hits.length,3);assert.ok(hits.every(e=>e.area&&e.reaction&&e.damageType==='magical'&&e.element==='water'));
 assert.ok(b.actors.filter(a=>a.team==='enemy').every(a=>a.statuses.some(s=>s.id==='frost_echo')));
 attack(b,'arthur');assert.equal(fua(b).length,0);b.phase='extra';attack(b,'arthur');assert.equal(fua(b).length,0);b.round++;attack(b,'arthur');assert.equal(fua(b).length,1);
});
test('Amelia does not self-trigger, react to unshielded or broken shields, periodic damage, dead allies or her own death',()=>{
 for(const mode of ['self','unshielded','broken','dead_owner','dead_ally']){const {b}=setup();if(mode==='self'){shield(b,'amelia');attack(b,'amelia');}else{if(mode!=='unshielded')shield(b,'arthur',mode==='broken'?1:200);if(mode==='dead_owner')getActor(b,'amelia').hp=0;if(mode==='dead_ally')getActor(b,'arthur').hp=1;attack(b,'arthur',{flat:1000,...(mode==='dead_ally'?{multiplier:100}:{})});}assert.equal(fua(b).length,0,mode);}
 const {b}=setup();shield(b,'arthur');getActor(b,'arthur').statuses.push({id:'kai_poison',remaining:3,potency:10,stacks:1,sourceId:'enemy_0'});b.queue=['chloe','arthur'];b.cursor=0;executeAction(b,{actorId:'chloe',abilityId:'$defend',targetId:'chloe'});assert.equal(fua(b).length,0);assert.equal(getActor(b,'arthur').shield,200);
});
test('all hits settle before Amelia checks: a shield surviving hit one but breaking on hit two does not react',()=>{
 const {b}=setup();const ally=getActor(b,'arthur');ally.stats.defense=0;shield(b,'arthur',25);getActor(b,'enemy_0').stats.attack=20;attack(b,'arthur',{hits:2});assert.equal(ally.shield,0);assert.equal(fua(b).length,0);
});
test('AoE makes only one Amelia reaction; any other attacked ally surviving with shield suffices',()=>{
 const {b}=setup();shield(b,'arthur',1);shield(b,'chloe',200);shield(b,'amelia',200);const enemy=getActor(b,'enemy_0');b.content.abilities['test.area']={id:'test.area',name:'Test area',target:'all_enemies',effects:[{type:'damage',damageType:'magical',element:'plain',multiplier:1}]};enemy.abilities.push('test.area');cast(b,enemy.id,'test.area');assert.equal(getActor(b,'arthur').shield,0);assert.equal(fua(b).length,1);
 const plan=combatTimeline(b.events,b.content);assert.ok(plan.frames.some(f=>f.sourceId==='amelia'&&f.kind==='formation'));assert.equal(plan.frames.filter(f=>f.sourceId==='amelia'&&f.kind==='source').length,1);
});
test('Amelia follow-up cannot trigger Aurora, consume extra turns, MP, or chain a second shield follow-up',()=>{
 const {b}=setup(['amelia','aurora','arthur']);shield(b,'arthur');getActor(b,'enemy_1').passive={type:'shield_survival_followup',name:'Enemy echo',followUpAbility:'amelia.echo',oncePerRound:true};shield(b,'enemy_0');attack(b,'arthur');assert.equal(fua(b).length,1);assert.equal(getActor(b,'aurora').resourceValues.thunder_charge,0);assert.equal(b.events.filter(e=>e.type==='reaction').length,1);assert.equal(b.extraTurnGrants.size,0);assert.equal(b.actionCount,1);
});
test('dodges and newly granted shields without an actual hit do not qualify',()=>{
 const {b}=setup();shield(b,'arthur');b.content.statuses.test_evade={id:'test_evade',name:'Test',kind:'buff',modifiers:{evasion:.85}};getActor(b,'arthur').statuses.push({id:'test_evade',remaining:3});b.random=()=>0;attack(b,'arthur');assert.equal(fua(b).length,0);assert.equal(getActor(b,'amelia').procRounds?.shield_survival,undefined);
});
test('Amelia supplies a lasting team shield and a three-round damage reduction buff',()=>{
 const {b}=setup();cast(b,'amelia','amelia.bastion','amelia');for(const a of b.actors.filter(a=>a.team==='party')){assert.equal(a.shield,48);assert.equal(a.shieldSourceId,'amelia');}
 cast(b,'amelia','amelia.curtain','amelia');assert.ok(b.actors.filter(a=>a.team==='party').every(a=>a.statuses.some(s=>s.id==='frost_curtain'&&s.expiresAfterRound===3)));assert.equal(getActor(b,'amelia').mp,84);
});
test('Chloe splash selects main and non-wrapping immediate slots, ignoring taunt and cover',()=>{
 const {b}=setup();assert.deepEqual(selectedTargets(b,getActor(b,'chloe'),content.abilities['chloe.claws'],'enemy_0').map(a=>a.id),['enemy_0','enemy_1']);
 cast(b,'chloe','chloe.claws','enemy_1');let hits=b.events.filter(e=>e.type==='damage');assert.deepEqual(hits.map(e=>e.targetId),['enemy_0','enemy_1','enemy_2']);assert.deepEqual(hits.map(e=>e.amount),[15,30,15]);assert.ok(hits.every(e=>e.area));
 for(const e of b.actors.filter(a=>a.team==='enemy')){assert.equal(e.statuses.some(s=>s.id==='cat_claw_rend'),true);assert.equal(e.statuses.some(s=>s.id==='cat_intimidation'),true);}
});
test('splash keeps dead/empty formation gaps and UI highlights only actual neighbors',()=>{
 const {b}=setup();const enemies=b.actors.filter(a=>a.team==='enemy');enemies.forEach((a,i)=>a.formationSlot=i);enemies[1].hp=0;
 const actor=getActor(b,'chloe'),skill=content.abilities['chloe.claws'];assert.deepEqual(selectedTargets(b,actor,skill,'enemy_0').map(a=>a.id),['enemy_0']);
 assert.deepEqual(resolveCombatTargets(b,actor,skill,{enemyId:'enemy_0'}).affectedIds,['enemy_0']);assert.equal(selectedTargets(b,actor,skill,'missing').length,0);
 enemies[1].hp=100;enemies[1].formationSlot=3;enemies[2].formationSlot=4;assert.deepEqual(selectedTargets(b,actor,skill,'enemy_0').map(a=>a.id),['enemy_0']);
 const mp=actor.mp;assert.throws(()=>cast(b,'chloe',skill.id,'missing'),/Mục tiêu/);assert.equal(actor.mp,mp);
});
test('Chloe native works on basic/single attacks and shield hits, never misses or healing',()=>{
 const {b}=setup();shield(b,'enemy_0');cast(b,'chloe','$attack');let enemy=getActor(b,'enemy_0');assert.equal(enemy.statuses.find(s=>s.id==='cat_intimidation').remaining,1);cast(b,'chloe','$attack');assert.equal(enemy.statuses.filter(s=>s.id==='cat_intimidation').length,1);
 const ally=getActor(b,'arthur');ally.hp=50;cast(b,'chloe','chloe.care','arthur');assert.equal(ally.hp,97);assert.equal(b.events.some(e=>e.type==='status'&&e.statusId==='cat_intimidation'),false);
 enemy.statuses=[];b.content.statuses.test_evade={id:'test_evade',name:'Test',kind:'buff',modifiers:{evasion:.85}};enemy.statuses.push({id:'test_evade',remaining:3});b.random=()=>0;cast(b,'chloe','chloe.pounce');assert.equal(enemy.statuses.some(s=>s.id==='cat_intimidation'),false);
});
test('reusable passive/target data rejects malformed definitions',()=>{
 for(const change of [c=>c.characters.amelia.passive.oncePerRound=false,c=>c.characters.amelia.passive.followUpAbility='aurora.follow_up',c=>c.characters.logia.passive.statusIds=['shaken'],c=>c.characters.logia.passive.ratio=NaN,c=>c.characters.chloe.passive.duration=0,c=>c.characters.chloe.passive.statusId='effect_ward',c=>c.statuses.logia_venom.maxStacks=0]){const c=structuredClone(content);change(c);assert.ok(validateContent(c).length);}
});
test('player-facing previews show real poison scaling, splash geometry, passives and snapshotted tick totals',()=>{
 const {b}=setup();for(const id of ['logia','amelia','chloe']){const a=getActor(b,id),p=passivePresentation(a,content);assert.ok(p.facts.length);assert.ok(p.summary.length<=180);assert.doesNotMatch(JSON.stringify(p),/undefined|NaN/);for(const skillId of a.abilities){const view=skillPresentation(content.abilities[skillId],a,content);assert.doesNotMatch(JSON.stringify(view),/undefined|NaN/);}}
 const actor=getActor(b,'logia'),view=skillPresentation(content.abilities['logia.fang'],actor,content);assert.match(view.facts.join(' '),/17 HP/);assert.match(view.facts.join(' '),/3 tầng/);assert.match(skillScaling(content.abilities['logia.fang'],actor,content).join(' '),/17 HP/);
 cast(b,'logia','logia.agony');let enemy=getActor(b,'enemy_0'),dot=enemy.statuses.find(s=>s.id==='logia_venom');assert.match(statusDetails(dot,enemy,b,content).lines.join(' '),/34 HP mỗi đầu lượt/);
 assert.match(compactSkillScaling(content.abilities['chloe.claws'],getActor(b,'chloe'),enemy,content,b),/120% ATK chính \/ 60% ATK ô kề/);
});

test('splash cannot be redirected by a taunting enemy or a covering neighbor',()=>{
 const {b}=setup();getActor(b,'enemy_2').statuses.push({id:'taunt',remaining:3,sourceId:'enemy_2'});getActor(b,'enemy_0').statuses.push({id:'cover',remaining:3,sourceId:'enemy_2'});
 cast(b,'chloe','chloe.claws','enemy_0');assert.deepEqual(b.events.filter(e=>e.type==='damage').map(e=>e.targetId),['enemy_0','enemy_1']);assert.equal(getActor(b,'enemy_2').statuses.some(s=>s.id==='cat_claw_rend'),false);
});
test('Chloe and Amelia debuffs last through extra turns and expire after the target main turn',()=>{
 const {b}=setup();cast(b,'chloe','chloe.pounce');const enemy=getActor(b,'enemy_0');assert.equal(enemy.statuses.find(s=>s.id==='cat_intimidation').remaining,1);
 b.phase='extra';cast(b,enemy.id,'$defend',enemy.id);assert.equal(enemy.statuses.find(s=>s.id==='cat_intimidation').remaining,1);
 b.phase='main';cast(b,enemy.id,'$defend',enemy.id);assert.equal(enemy.statuses.some(s=>s.id==='cat_intimidation'),false);
 shield(b,'arthur');attack(b,'arthur');assert.equal(enemy.statuses.find(s=>s.id==='frost_echo').remaining,1);
 b.phase='extra';cast(b,enemy.id,'$defend',enemy.id);assert.equal(enemy.statuses.find(s=>s.id==='frost_echo').remaining,1);
 b.phase='main';cast(b,enemy.id,'$defend',enemy.id);assert.equal(enemy.statuses.some(s=>s.id==='frost_echo'),false);
});
test('an AoE leaving only Amelia shielded cannot spend her once-per-round reaction',()=>{
 const {b}=setup();shield(b,'arthur',1);shield(b,'amelia',200);const e=getActor(b,'enemy_0');b.content.abilities['test.area']={id:'test.area',name:'Test',target:'all_enemies',effects:[{type:'damage',damageType:'magical',element:'plain',multiplier:1}]};e.abilities.push('test.area');cast(b,e.id,'test.area');assert.ok(getActor(b,'amelia').shield>0);assert.equal(getActor(b,'arthur').shield,0);assert.equal(fua(b).length,0);assert.equal(getActor(b,'amelia').procRounds?.shield_survival,undefined);
});
