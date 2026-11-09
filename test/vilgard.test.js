import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave} from '../src/core/game-save.js';
import {createBattle,activeActor,getActor,executeAction} from '../src/core/battle.js';
import {battleStat} from '../src/core/stat-values.js';
import {validateContent} from '../src/core/content.js';
import {exclusiveRollRange} from '../src/core/blacksmith-rules.js';
const content=await loadContent();
const ID='vilgard.grudge';
function fixture({gear=false,enemyCount=3}={}){
 const c=structuredClone(content),save=createGameSave(c);
 save.party=['vilgard','iris'];save.partyPresets[0].slots=[...save.party];
 save.unlockedCharacterIds=[...new Set([...save.unlockedCharacterIds,...save.party])];
 if(gear){save.exclusiveGear.push({templateId:ID,statKey:'attack',statValue:exclusiveRollRange(c,'attack').min});save.equippedExclusiveGear.vilgard=ID;save.unlockedExclusiveRecipes.push(ID);}
 const b=createBattle(c,save,'forest_patrol',()=>.99);
 for(const enemy of b.actors.filter(a=>a.team==='enemy')){enemy.hp=enemy.stats.maxHp=100000;enemy.stats.attack=0;enemy.stats.defense=0;enemy.stats.resistance=0;enemy.abilities=['$defend'];enemy.statuses=[];enemy.weaknesses=[];enemy.resistances={};}
 return {b,c,save,v:getActor(b,'vilgard')};
}
function use(b,id,target){const v=getActor(b,'vilgard');b.queue=[v.id,...b.actors.filter(a=>a.id!==v.id&&a.hp>0).map(a=>a.id)];b.cursor=0;b.phase='main';b.outcome=null;executeAction(b,{actorId:v.id,abilityId:id,targetId:target});}
function enemyKill(b,target='vilgard'){
 const id='test.vilgard_kill';b.content.abilities[id]={id,name:'Đòn thử',target:'enemy',effects:[{type:'damage',damageType:'physical',element:'plain',multiplier:99}]};
 const enemy=b.actors.find(a=>a.team==='enemy');if(!enemy.abilities.includes(id))enemy.abilities.push(id);enemy.stats.attack=10000;
 b.queue=[enemy.id,...b.actors.filter(a=>a.id!==enemy.id&&a.hp>0).map(a=>a.id)];b.cursor=0;b.phase='main';b.outcome=null;
 executeAction(b,{actorId:enemy.id,abilityId:id,targetId:getActor(b,target).id});
}
function nextRound(b){const start=b.round;for(let i=0;i<80&&b.round===start;i++){const actor=activeActor(b);executeAction(b,{actorId:actor.id,abilityId:'$defend',targetId:actor.id});}assert.ok(b.round>start);}
const damage=b=>b.events.filter(e=>e.type==='damage'&&e.sourceId==='vilgard');

test('Vilgard is a physical dark DPS of the expedition corps',()=>{
 const c=content.characters.vilgard;
 assert.equal(c.roleGroup,'physical_dps');assert.equal(c.element,'dark');assert.equal(c.affiliation,'expedition_corps');
 assert.deepEqual(c.stats,{maxHp:175,maxMp:90,attack:40,magic:8,defense:18,resistance:18,speed:18});
 assert.deepEqual(c.abilities,['vilgard.pursuit','vilgard.cleave','vilgard.reckoning']);
 assert.equal(c.passive.type,'vengeful_revive');assert.equal(c.passive.cooldownRounds,5);assert.equal(c.passive.hpRatio,1);assert.equal(c.passive.stacks,5);
 assert.ok(content.banners.standard.characterPool.includes('vilgard'));assert.ok(content.pvpAiProfiles.vilgard);
 assert.deepEqual(validateContent(content),[]);
});

test('Ám Ảnh stacks up to five, adds 10% ATK each, and AoE consumes all stacks with penetration',()=>{
 const {b,c,v}=fixture();
 const base=v.stats.attack;
 use(b,'vilgard.pursuit',b.actors.find(a=>a.team==='enemy').id);
 assert.equal(v.statuses.find(s=>s.id==='obsession').stacks,1);
 for(let i=0;i<4;i++)use(b,'vilgard.pursuit',b.actors.find(a=>a.team==='enemy'&&a.hp>0).id);
 assert.equal(v.statuses.find(s=>s.id==='obsession').stacks,5);
 assert.ok(battleStat(c,v,'attack')>base*1.4);
 const enemy=b.actors.find(a=>a.team==='enemy');enemy.stats.defense=1000;
 use(b,'vilgard.reckoning',enemy.id);
 assert.equal(v.statuses.some(s=>s.id==='obsession'),false,'tiêu hết Ám Ảnh sau AoE');
 assert.ok(damage(b).length>=1);
});

test('Pursuit adds a random secondary 180% hit only when another enemy exists',()=>{
 const {b}=fixture();const enemies=b.actors.filter(a=>a.team==='enemy');use(b,'vilgard.pursuit',enemies[0].id);
 const targets=damage(b).map(e=>e.targetId);assert.ok(targets.includes(enemies[0].id));assert.ok(targets.some(id=>id!==enemies[0].id));
 const solo=fixture();const alive=solo.b.actors.filter(a=>a.team==='enemy');for(const enemy of alive.slice(1))enemy.hp=0;
 use(solo.b,'vilgard.pursuit',alive[0].id);
 assert.equal(damage(solo.b).length,1,'không có kẻ khác thì không có hit phụ');
});

test('Cleave hits primary and splash, applies Rạn Khiên and creates two Ám Ảnh',()=>{
 const {b}=fixture();const enemies=b.actors.filter(a=>a.team==='enemy');use(b,'vilgard.cleave',enemies[1].id);
 assert.ok(damage(b).length>=2);assert.equal(getActor(b,'vilgard').statuses.find(s=>s.id==='obsession').stacks,2);
 assert.ok(enemies.some(enemy=>enemy.statuses.some(status=>status.id==='shield_fracture')));
});

test('Death revives once, grants five stacks and an extra turn, then goes on cooldown',()=>{
 const {b,v}=fixture();v.statuses.push({id:'young_oath',remaining:3,sourceId:v.id});v.hp=1;enemyKill(b);
 assert.equal(v.hp,v.stats.maxHp,'hồi sinh đầy HP');
 assert.equal(v.mp,v.stats.maxMp,'hồi sinh đầy MP');
 assert.equal(v.shield,0);
 assert.equal(v.statuses.find(s=>s.id==='obsession').stacks,5);
 assert.equal(v.statuses.some(s=>s.id==='young_oath'),false,'hồi sinh dọn status cũ, chỉ giữ Vết Thương Sâu');
 assert.ok(b.extraTurnGrants.has(v.id));
 assert.equal(v.vengefulReadyRound,b.round+5);
 assert.ok(b.log.some(line=>line.includes('hồi sinh ngay lập tức')));
 v.hp=1;enemyKill(b);
 assert.equal(v.hp,0,'lần chết trong cooldown không hồi sinh');
 const recovered=fixture();recovered.v.hp=1;enemyKill(recovered.b);for(let i=0;i<5;i++)nextRound(recovered.b);recovered.v.hp=1;enemyKill(recovered.b);assert.equal(recovered.v.hp,recovered.v.stats.maxHp,'đủ 5 vòng thì hồi sinh lại');
});

test('Vilgard Trấn resets the AoE cooldown right after revival',()=>{
 const {b,v}=fixture({gear:true});v.cooldowns['vilgard.reckoning']=3;v.hp=1;enemyKill(b);
 assert.equal(v.cooldowns['vilgard.reckoning'],0);
});

test('Iwayn oath ATK buff and Hội Tâm share the same main-turn clock',()=>{
 assert.equal(content.statuses.young_oath.durationClock,'main_turn');
 assert.equal(content.statuses.true_strike.durationClock,'main_turn');
 const oath=content.abilities['iwayn.oath'];
 for(const status of ['young_oath','true_strike'])assert.ok(oath.effects.some(effect=>effect.status===status&&effect.duration===3));
});
