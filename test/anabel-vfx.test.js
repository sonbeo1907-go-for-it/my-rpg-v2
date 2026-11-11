import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction} from '../src/core/battle.js';
import {combatTimeline,anabelHitDelay} from '../src/ui/combat-timeline.js';
const c=await loadContent();
function action(id='anabel.judgment'){
 const s=createGameSave(c);s.unlockedCharacterIds.push('anabel');s.party=['anabel','iris','elaine','garrek'];const b=createBattle(c,s,'forest_patrol',()=>.99),a=b.actors.find(a=>a.id==='anabel'),target=b.actors.find(a=>a.team==='enemy');for(const e of b.actors.filter(a=>a.team==='enemy'))e.hp=e.stats.maxHp=100000;b.queue=[a.id,...b.actors.filter(x=>x.id!==a.id).map(x=>x.id)];b.cursor=0;
 executeAction(b,{actorId:a.id,abilityId:id,targetId:id==='anabel.command'?a.id:target.id});return b;
}
test('basic and Trảm Quang use distinct gold slash presentations; command gets local gold aura',()=>{
 for(const [id,presentation]of [['$attack','anabel_slash'],['anabel.advance','anabel_cleave'],['anabel.command','anabel_command']]){
  const b=action(id),plan=combatTimeline(b.events,c),signatures=plan.frames.filter(f=>f.kind==='signature');assert.ok(signatures.length);assert.ok(signatures.every(f=>f.presentation===presentation&&!f.area));assert.ok(!plan.frames.some(f=>f.kind==='formation'));
 }
});
test('dawn sword contact and damage timestamps match, with exactly 250ms before repeat cue at both speeds',()=>{
 const b=action(),events=structuredClone(b.events),hp=b.actors.map(a=>a.hp);
 for(const speed of ['normal','fast']){const plan=combatTimeline(events,c,{speed}),swords=plan.frames.filter(f=>f.kind==='signature'),hits=plan.frames.filter(f=>f.kind==='hurt'),repeat=plan.frames.find(f=>f.kind==='source'&&f.reaction);
  assert.equal(swords.length,2);assert.equal(hits.length,2);assert.equal(repeat.at-hits[0].at,250);
  swords.forEach((f,i)=>{assert.equal(f.at+f.contactDelay,hits[i].at);assert.equal(f.contactDelay,anabelHitDelay('anabel_dawn',speed));assert.equal(f.presentation,'anabel_dawn');assert.equal(f.targetId,hits[i].targetId);});assert.ok(plan.duration>swords.at(-1).at+swords.at(-1).duration);
 }
 assert.deepEqual(b.events,events);assert.deepEqual(b.actors.map(a=>a.hp),hp);
});
test('reduced motion removes waiting and movement without losing either hit or sword cue',()=>{
 const b=action(),plan=combatTimeline(b.events,c,{reduced:true});assert.ok(plan.frames.every(f=>f.at===0));assert.equal(plan.frames.filter(f=>f.kind==='signature').length,2);assert.equal(plan.frames.filter(f=>f.kind==='hurt').length,2);
});
test('visuals anchor to the actual cover recipient, not the originally chosen target',()=>{
 const events=[{type:'ability_cast',sourceId:'anabel',abilityId:'anabel.judgment',targetId:'intended',attack:true},{type:'damage',sourceId:'anabel',targetId:'cover',amount:20,damageType:'physical',element:'light'}];
 const plan=combatTimeline(events,c);assert.equal(plan.frames.find(f=>f.kind==='signature').targetId,'cover');
});
