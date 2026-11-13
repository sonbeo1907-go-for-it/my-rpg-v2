import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,executeEnemyTurn,activeActor,forecastBattleAction} from '../src/core/battle.js';
import {resolveRankedAbility} from '../src/core/skill-resolver.js';import {createArenaBattle} from '../src/core/arena.js';import {validateContent} from '../src/core/content.js';import {skillPresentation,passivePresentation} from '../src/ui/skill-copy.js';
const c=await loadContent(),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function save(){const s=createGameSave(c);s.party=['cyrus','siesta','rowan','elaine'];s.partyPresets[0].slots=[...s.party];s.unlockedCharacterIds=[...new Set([...s.unlockedCharacterIds,...s.party])];return s;}
function fixture(){const s=save(),b=createBattle(c,s,'forest_patrol',()=>.99);for(const a of b.actors.filter(a=>a.team==='enemy')){a.hp=a.stats.maxHp=100000;a.stats.attack=a.stats.magic=0;a.stats.defense=a.stats.resistance=0;a.statuses=[];a.weaknesses=[];a.resistances={};}return {b,s,cy:b.actors.find(a=>a.id==='cyrus'),si:b.actors.find(a=>a.id==='siesta'),enemies:b.actors.filter(a=>a.team==='enemy')};}
function cast(b,a,id,target=a.id){b.queue=[a.id,...b.actors.filter(x=>x.id!==a.id&&x.hp>0).map(x=>x.id)];b.cursor=0;executeAction(b,{actorId:a.id,abilityId:id,targetId:target});}
const fua=(b,a)=>b.events.filter(e=>e.type==='reaction'&&e.sourceId===a.id),damage=(b,a)=>b.events.filter(e=>e.type==='damage'&&e.sourceId===a.id);
test('new release IDs, recruitment/AI and old saves validate without free unlocks',()=>{
 assert.deepEqual(validateContent(c),[]);assert.equal(c.characters.cyrus.releaseId,108);assert.equal(c.characters.siesta.releaseId,109);
 const s=createGameSave(c);for(const id of ['cyrus','siesta']){assert.ok(c.banners.standard.characterPool.includes(id));assert.ok(c.pvpAiProfiles[id]);delete s.characters[id];}
 const r=decodeGameSave(encodeGameSave(s,c),c);for(const id of ['cyrus','siesta']){assert.ok(r.characters[id]);assert.ok(!r.unlockedCharacterIds.includes(id));assert.ok(passivePresentation(c.characters[id],c).facts.length);}
});
test('Cyrus defend restores five percent only to living Wind allies, including himself, also in Extra',()=>{
 const {b,cy,si}=fixture();const rowan=b.actors.find(a=>a.id==='rowan'),elaine=b.actors.find(a=>a.id==='elaine');for(const a of b.actors)a.mp=0;
 cast(b,cy,'$defend');assert.equal(cy.mp,14);assert.equal(si.mp,5);assert.equal(rowan.mp,3);assert.equal(elaine.mp,0);
 b.phase='extra';rowan.hp=0;cast(b,cy,'$defend');assert.equal(si.mp,10);assert.equal(rowan.mp,3);assert.equal(elaine.mp,0);
});
test('Cyrus Wind filter applies both buff and healing; exposure and defense reduction hit all enemies',()=>{
 const {b,cy,enemies}=fixture();cast(b,cy,'cyrus.codex');for(const a of b.actors.filter(x=>x.team==='party'))assert.equal(a.statuses.some(s=>s.id==='cyrus_codex'),a.element==='wind');
 for(const a of b.actors.filter(x=>x.team==='party'))a.hp=10;cy.mp=100;cast(b,cy,'cyrus.guidance');for(const a of b.actors.filter(x=>x.team==='party')){assert.equal(a.statuses.some(s=>s.id==='weakness_exploitation'),a.element==='wind');assert.equal(a.hp>10,a.element==='wind');}
 cy.mp=100;cast(b,cy,'cyrus.gale',enemies[1].id);for(const e of enemies){assert.equal(e.statuses.find(s=>s.id==='exposure_wind').stacks,2);assert.equal(e.statuses.find(s=>s.id==='cyrus_fracture').remaining,3);}
});
test('Cyrus four-main-turn buff stays up through cooldown, Extra does not shorten it, main stun does',()=>{
 const {b,cy}=fixture();for(const a of b.actors){a.hp=a.stats.maxHp=100000;a.mp=a.stats.maxMp=10000;}
 function step(){const a=activeActor(b);if(a.team==='enemy')executeEnemyTurn(b);else executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});}
 function seek(phase='main'){let n=0;while((activeActor(b)?.id!==cy.id||b.phase!==phase)&&n++<200)step();assert.ok(n<200);}
 seek();executeAction(b,{actorId:cy.id,abilityId:'cyrus.codex',targetId:cy.id});b.extraTurnGrants.add(cy.id);b.extraPhaseRequired=true;seek('extra');step();assert.equal(cy.statuses.find(s=>s.id==='cyrus_codex').remaining,4);
 for(let i=0;i<3;i++){seek();step();}seek();assert.equal(cy.statuses.find(s=>s.id==='cyrus_codex').remaining,1);assert.equal(cy.cooldowns['cyrus.codex'],0);
 executeAction(b,{actorId:cy.id,abilityId:'cyrus.codex',targetId:cy.id});cy.statuses.push({id:'stunned',remaining:1,stacks:1});let n=0;while(cy.statuses.some(s=>s.id==='stunned')&&n++<200)step();assert.equal(cy.statuses.find(s=>s.id==='cyrus_codex').remaining,3);
});
test('Siesta basics gain one resource per cast, cap at three, skills/defend/reactions do not generate it',()=>{
 const {b,si,enemies}=fixture();assert.equal(si.resourceValues.ferocity,0);for(let i=0;i<4;i++)cast(b,si,'$attack',enemies[1].id);assert.equal(si.resourceValues.ferocity,3);cast(b,si,'$defend');assert.equal(si.resourceValues.ferocity,3);
 si.resourceValues.ferocity=0;cast(b,si,'siesta.rend',enemies[1].id);assert.equal(si.resourceValues.ferocity,0);assert.equal(fua(b,si).length,0);
});
test('Siesta 0/1/2/3 charge paths execute exactly rend -> howl -> ravage -> ravage with one root cost',()=>{
 for(const stacks of [0,1,2,3]){const {b,si,enemies}=fixture();si.resourceValues.ferocity=stacks;si.mp=85;si.cooldowns['siesta.howl']=7;si.cooldowns['siesta.ravage']=8;
  cast(b,si,'siesta.rend',enemies[1].id);
  assert.equal(si.resourceValues.ferocity,0);assert.equal(si.mp,75);assert.deepEqual(fua(b,si).map(e=>e.abilityId),['siesta.howl','siesta.ravage','siesta.ravage'].slice(0,stacks));
  assert.equal(si.cooldowns['siesta.howl'],7);assert.equal(si.cooldowns['siesta.ravage'],8);assert.equal(damage(b,si).length,3+Math.max(0,stacks-1)*6);
  if(stacks){assert.equal(si.statuses.find(s=>s.id==='siesta_howl').remaining,3);assert.equal(si.statuses.find(s=>s.id==='weakness_exploitation').remaining,3);}
  assert.ok(damage(b,si).every(e=>enemies.some(t=>t.id===e.targetId)));
  if(stacks>=2)assert.ok(damage(b,si).filter(e=>e.reaction).every(e=>e.targetId!==si.id));
 }
});

test('chain quotas include automatic steps, stop self-loop, persist into Extra and reset next round',()=>{
 const {b,si,enemies}=fixture();si.resourceValues.ferocity=3;cast(b,si,'siesta.rend',enemies[1].id);assert.equal(fua(b,si).length,3);
 for(const id of ['rend','howl','ravage'])assert.equal(si.procRounds['resource_followup:siesta.'+id],b.round);
 si.resourceValues.ferocity=3;si.cooldowns['siesta.rend']=0;b.phase='extra';cast(b,si,'siesta.rend',enemies[1].id);assert.equal(si.resourceValues.ferocity,3);assert.equal(fua(b,si).length,0);
 b.round++;si.resourceValues.ferocity=1;si.cooldowns['siesta.rend']=0;cast(b,si,'siesta.rend',enemies[1].id);assert.equal(si.resourceValues.ferocity,0);assert.deepEqual(fua(b,si).map(e=>e.abilityId),['siesta.howl']);
});

test('starting at howl skips rend and starting at ravage only repeats ravage once',()=>{
 for(const id of ['siesta.howl','siesta.ravage']){const {b,si,enemies}=fixture();si.resourceValues.ferocity=3;const mp=si.mp;cast(b,si,id,id==='siesta.howl'?si.id:enemies[1].id);assert.equal(si.resourceValues.ferocity,id==='siesta.howl'?1:2);assert.equal(mp-si.mp,id==='siesta.howl'?10:24);assert.deepEqual(fua(b,si).map(e=>e.abilityId),id==='siesta.howl'?['siesta.ravage','siesta.ravage']:['siesta.ravage']);}
});

test('Siesta splash never wraps, forecast does not spend live charges, rejected actions do not proc',()=>{
 const {b,si,enemies}=fixture();si.resourceValues.ferocity=1;b.queue=[si.id,...enemies.map(e=>e.id)];b.cursor=0;
 const f=forecastBattleAction(b,{actorId:si.id,abilityId:'siesta.rend',targetId:enemies[0].id});assert.equal(si.resourceValues.ferocity,1);assert.equal(f.actors.find(a=>a.id===si.id).resourceValues.ferocity,0);assert.ok(f.events.filter(e=>e.type==='damage').every(e=>e.targetId!==enemies[2].id));
 si.mp=0;assert.throws(()=>executeAction(b,{actorId:si.id,abilityId:'siesta.rend',targetId:enemies[0].id}));assert.equal(si.resourceValues.ferocity,1);assert.equal(si.procRounds?.['resource_followup:siesta.rend'],undefined);
});
test('rank scales buff/heal/damage only and follow-up inherits current burst rank; both Arena teams own charges and procs',()=>{
 near(resolveRankedAbility(c,c.characters.cyrus,'cyrus.codex',5).effects[0].appliedModifiers.attack,.3*1.05**4);near(resolveRankedAbility(c,c.characters.cyrus,'cyrus.guidance',5).effects[1].multiplier,.6*1.1**4);
 const {b,si,enemies}=fixture();si.resourceValues.ferocity=2;si.skillRanks['siesta.ravage']=5;cast(b,si,'siesta.rend',enemies[1].id);assert.ok(skillPresentation(c.abilities['siesta.rend'],si,c).facts.some(s=>s.includes('Dã Tính')));assert.equal(damage(b,si).filter(e=>e.reaction&&e.targetId===enemies[1].id).length,2);assert.ok(damage(b,si).filter(e=>e.reaction&&e.targetId===enemies[1].id).every(e=>e.amount>160));
 const arena=createArenaBattle(c,save(),'mirror',999),enemy=arena.actors.find(a=>a.team==='enemy'&&a.definitionId==='siesta'),player=arena.actors.find(a=>a.team==='party'&&a.definitionId==='siesta');for(const a of arena.actors)a.hp=a.stats.maxHp=100000;enemy.resourceValues.ferocity=1;player.resourceValues.ferocity=2;cast(arena,enemy,'siesta.rend',player.id);assert.equal(enemy.resourceValues.ferocity,0);assert.equal(player.resourceValues.ferocity,2);assert.equal(fua(arena,enemy).length,1);assert.ok(damage(arena,enemy).every(e=>e.pvpDamage));
});
