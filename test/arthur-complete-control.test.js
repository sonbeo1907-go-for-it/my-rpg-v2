import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {completeStoryEvent,resolveCharacter} from '../src/core/progression.js';
import {createBattle,getActor,executeAction,abilityAvailability} from '../src/core/battle.js';
import {claimBattleReward} from '../src/core/economy.js';
import {battleStat} from '../src/core/stat-values.js';
import {skillPresentation} from '../src/ui/skill-copy.js';
const content=await loadContent(),flag='arthur.full_control_story_cleared',upgrade='arthur.complete_control',single='arthur.ogres_bane_mastered',area='arthur.ogres_bane_flash',status='arthur_complete_control';
function campaign(trained=true,mastered=true){const c=createGameSave(content);c.party=['arthur','iris',null,null];c.partyPresets[0].slots=[...c.party];if(trained)completeStoryEvent(c,content,'arthur_completed_sword_training');if(mastered)completeStoryEvent(c,content,flag);return c;}
function setup(exclusive=false){const c=campaign();if(exclusive){c.exclusiveGear=[{templateId:'arthur.unbound',statKey:'attack',statValue:5}];c.equippedExclusiveGear.arthur='arthur.unbound';}const b=createBattle(content,c,'forest_patrol',()=>.99);for(const enemy of b.actors.filter(a=>a.team==='enemy')){enemy.hp=enemy.stats.maxHp=10000;enemy.stats.defense=0;enemy.weaknesses=[];}return b;}
function use(b,id,skill,target='enemy_0'){b.queue=[id,...b.actors.filter(a=>a.id!==id&&a.hp>0).map(a=>a.id)];b.cursor=0;executeAction(b,{actorId:id,abilityId:skill,targetId:target});}
const hits=b=>b.events.filter(e=>e.type==='damage'&&e.sourceId==='arthur');

test('future Arthur upgrade is locked in new/old saves, ordinary quests and existing training reward',()=>{
 for(const trained of [false,true]){const c=campaign(trained,false),restored=decodeGameSave(encodeGameSave(c,content),content),a=resolveCharacter(content,restored,'arthur');assert.equal(a.abilities.includes(single),false);assert.equal(a.abilities.includes(area),false);assert.equal(restored.characters.arthur.upgradeIds.includes(upgrade),false);assert.ok(a.abilities.includes(trained?'arthur.ogres_bane_controlled':'arthur.ogres_bane'));}
 let c=campaign(false,false);c=claimBattleReward(c,{encounterId:'ogre_trial',outcome:'victory'},content);assert.deepEqual(c.characters.arthur.upgradeIds,['arthur.control_training']);
 assert.deepEqual(Object.values(content.encounters).filter(e=>e.firstClearRewards?.some(r=>r.upgradeId===upgrade)).map(e=>e.id),['epilogue_unfinished']);assert.ok(Object.values(content.encounters).every(e=>e.requires?.storyFlag!==flag));assert.equal(content.abilities['arthur.ogres_bane_controlled'].effects[0].multiplier,4.2);
 const b=createBattle(content,c,'forest_patrol'),a=getActor(b,'arthur');a.resourceValues.resonance=3;const before=a.mp;assert.throws(()=>use(b,'arthur',single),/chưa có kỹ năng/);assert.equal(a.mp,before);assert.equal(a.resourceValues.resonance,3);
});

test('future flag resolves replacement once, preserves old partial release and survives save roundtrip',()=>{
 for(const trained of [false,true]){const c=campaign(trained);completeStoryEvent(c,content,flag);const a=resolveCharacter(content,c,'arthur');assert.equal(a.abilities.filter(id=>id===single).length,1);assert.equal(a.abilities.filter(id=>id===area).length,1);assert.equal(a.abilities.some(id=>['arthur.ogres_bane','arthur.ogres_bane_controlled'].includes(id)),false);assert.equal(a.abilities.includes('arthur.partial_release'),trained);assert.equal(c.characters.arthur.upgradeIds.filter(id=>id===upgrade).length,1);assert.deepEqual(decodeGameSave(encodeGameSave(c,content),content),c);}
});

test('both moves require 3 resonance and 10 MP; failed casts cannot spend partial costs',()=>{
 for(const skill of [single,area])for(const [mp,stacks]of [[9,3],[10,2]]){const b=setup(),a=getActor(b,'arthur');a.mp=mp;a.resourceValues.resonance=stacks;assert.equal(abilityAvailability(b,a,content.abilities[skill]).ok,false);assert.throws(()=>use(b,a.id,skill));assert.equal(a.mp,mp);assert.equal(a.resourceValues.resonance,stacks);assert.equal(a.statuses.some(s=>s.id===status),false);}
});

test('600% single hit grants 20% ATK after damage, never stacks or self-debuffs and survives extra actions',()=>{
 const b=setup(),a=getActor(b,'arthur');a.resourceValues.resonance=3;use(b,a.id,single);assert.equal(hits(b)[0].amount,204);assert.equal(a.mp,30);assert.equal(a.resourceValues.resonance,0);assert.ok(Math.abs(battleStat(content,a,'attack')-40.8)<1e-8);assert.equal(a.statuses.find(s=>s.id===status).remaining,null);assert.equal(a.statuses.some(s=>content.statuses[s.id].kind==='debuff'),false);
 b.phase='extra';a.resourceValues.resonance=3;use(b,a.id,single);assert.equal(hits(b)[0].amount,Math.floor(34*1.2*6));assert.equal(a.statuses.filter(s=>s.id===status).length,1);assert.equal(a.statuses.find(s=>s.id===status).stacks,1);assert.ok(Math.abs(battleStat(content,a,'attack')-40.8)<1e-8);
 use(b,a.id,'$defend',a.id);assert.equal(a.statuses.find(s=>s.id===status).remaining,null);
});

test('persistent ATK buff is dispellable and the next mastered strike grants it again',()=>{
 const b=setup(),a=getActor(b,'arthur');a.resourceValues.resonance=3;use(b,a.id,single);
 const id='test.enemy_dispel';b.content={...content,abilities:{...content.abilities,[id]:{id,name:'Xóa buff',target:'enemy',effects:[{type:'dispel',all:true}]}}};getActor(b,'enemy_0').abilities.push(id);use(b,'enemy_0',id,'arthur');assert.equal(a.statuses.some(s=>s.id===status),false);assert.equal(battleStat(content,a,'attack'),34);
 a.resourceValues.resonance=3;use(b,a.id,single);assert.equal(hits(b)[0].amount,204);assert.ok(a.statuses.some(s=>s.id===status));assert.equal(getActor(setup(),'arthur').statuses.some(s=>s.id===status),false);
});

test('280% AoE hits all enemies but pays resources once, grants no new buff and uses existing ATK buffs',()=>{
 const b=setup(),a=getActor(b,'arthur');a.resourceValues.resonance=3;use(b,a.id,area);assert.equal(hits(b).length,3);assert.ok(hits(b).every(e=>e.amount===95&&e.damageType==='physical'&&e.element==='light'));assert.equal(a.mp,30);assert.equal(a.resourceValues.resonance,0);assert.equal(a.statuses.some(s=>s.id===status),false);
 a.statuses.push({id:status,remaining:null,stacks:1,sourceId:a.id});a.resourceValues.resonance=3;use(b,a.id,area);assert.ok(hits(b).every(e=>e.amount===Math.floor(34*1.2*2.8)));assert.equal(a.mp,20);
});

test('single-target replacement inherits Arthur weapon penetration; new AoE does not expand that scope',()=>{
 for(const skill of [single,area]){const b=setup(true),a=getActor(b,'arthur');for(const enemy of b.actors.filter(a=>a.team==='enemy'))enemy.stats.defense=60;a.resourceValues.resonance=3;use(b,a.id,skill);const pen=skill===single?.25:0;assert.ok(hits(b).every(e=>e.amount===Math.floor(39*(skill===single?6:2.8)-60*(1-pen)*.55)));const view=skillPresentation(content.abilities[skill],a,content);assert.equal(view.facts.some(line=>line.includes('xuyên thêm')),skill===single);}
});
