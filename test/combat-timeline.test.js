import test from 'node:test';
import assert from 'node:assert/strict';
import {combatTimeline,combatFeedbackDuration} from '../src/ui/combat-timeline.js';
const content={characters:{mage:{passive:{name:'Dư âm'}}},abilities:{slash:{name:'Quét kiếm',target:'all_enemies',effects:[{type:'damage',damageType:'physical',element:'wind',hits:2}]},burst:{name:'Bùng nổ',target:'all_enemies',effects:[{type:'damage',damageType:'magical',element:'fire',primaryMultiplier:2}]},random:{target:'random_enemies',effects:[{type:'damage',damageType:'physical',element:'fire',hits:4}]},cosmic:{presentation:'cosmic_wave',target:'all_enemies',effects:[{type:'damage',damageType:'magical'}]},fu:{target:'enemy',effects:[{type:'damage',damageType:'magical'}]}}};
const cast=(id,rest={})=>({type:'ability_cast',sourceId:'mage',abilityId:id,area:true,targetId:'a',...rest});
const hit=(targetId,hitIndex=0,rest={})=>({type:'damage',sourceId:'mage',targetId,hitIndex,amount:20,damageType:'physical',element:'wind',...rest});
test('physical AoE has one sweep; all first hits are simultaneous and second hits get a later beat',()=>{
 const events=[cast('slash'),hit('a'),hit('a',1),hit('b'),hit('b',1)];const plan=combatTimeline(events,content);
 assert.equal(plan.frames.filter(f=>f.kind==='formation').length,1);const hits=plan.frames.filter(f=>f.kind==='hurt');assert.equal(hits[0].at,hits[2].at);assert.equal(hits[1].at,hits[3].at);assert.ok(hits[1].at>hits[0].at);assert.ok(plan.frames[0].at<hits[0].at);assert.deepEqual(events[1],hit('a'));
});
test('magical blast highlights only the chosen primary and keeps damage type independent of scaling stat',()=>{
 const {frames}=combatTimeline([cast('burst'),hit('a',0,{damageType:'magical'}),hit('b',0,{damageType:'magical'})],content);assert.equal(frames.find(f=>f.kind==='formation').damageType,'magical');assert.equal(frames.find(f=>f.kind==='hurt'&&f.targetId==='a').primary,true);assert.equal(frames.find(f=>f.kind==='hurt'&&f.targetId==='b').primary,false);
});
test('random strikes never create a formation sweep and retain their chosen targets',()=>{
 const {frames}=combatTimeline([cast('random'),hit('a'),hit('b',1),hit('b',2),hit('a',3)],content);assert.equal(frames.some(f=>f.kind==='formation'),false);assert.deepEqual(frames.filter(f=>f.kind==='hurt').map(f=>f.targetId),['a','b','b','a']);
});
test('custom skills reserve their own VFX; generic hit feedback still exists for the resolved recipients',()=>{
 const {frames}=combatTimeline([cast('cosmic'),hit('b')],content);assert.equal(frames.some(f=>f.kind==='formation'),false);assert.equal(frames.find(f=>f.kind==='hurt').custom,true);
});
test('blocked, dodged and zero damage never become red HP-loss reactions; healing follows a shield break',()=>{
 const {frames}=combatTimeline([cast('slash'),hit('a',0,{amount:0,absorbed:25}),{type:'dodge',sourceId:'mage',targetId:'b'},hit('c',0,{amount:0}),hit('d'),{type:'heal',sourceId:'healer',targetId:'d',amount:11}],content);assert.deepEqual(frames.filter(f=>!['source','formation'].includes(f.kind)).map(f=>f.kind),['block','dodge','zero','hurt','heal']);assert.ok(frames.at(-1).at>frames.at(-2).at);
});
test('follow-ups have a distinct later source cue and the actual target gets a separate impact',()=>{
 const {frames}=combatTimeline([cast('slash'),hit('a'),{type:'reaction',sourceId:'ally',targetId:'a',abilityId:'fu',kind:'follow_up',label:'Liên kích (FuA)'},{type:'damage',sourceId:'ally',targetId:'a',amount:10,damageType:'magical'}],content);const cue=frames.find(f=>f.reaction===true);assert.ok(cue.at>frames.find(f=>f.kind==='hurt').at);assert.equal(cue.label,'Liên kích (FuA)');assert.ok(frames.at(-1).at>cue.at);
});
test('passive pulses deduplicate a team trigger, basics use cast metadata, and periodic damage has no source motion',()=>{
 const {frames}=combatTimeline([{type:'passive',sourceId:'mage',label:'Dư âm'},{type:'passive',sourceId:'mage',label:'Dư âm'},cast('$defend',{attack:false}),hit('a',0,{periodic:true})],content);assert.equal(frames.filter(f=>f.kind==='passive').length,1);assert.equal(frames.find(f=>f.kind==='source').attack,false);assert.equal(combatTimeline([hit('a',0,{periodic:true})],content).frames.some(f=>f.kind==='source'),false);
});
test('fast mode compresses beats and reduced motion resolves the same outcomes with no movement delay',()=>{
 const events=[cast('slash'),hit('a'),hit('a',1),cast('burst'),hit('b')];const normal=combatFeedbackDuration(events,content,'normal'),fast=combatFeedbackDuration(events,content,'fast'),reduced=combatTimeline(events,content,{reduced:true});assert.ok(fast<normal);assert.equal(reduced.duration,70);assert.ok(reduced.frames.every(f=>f.at===0));assert.equal(reduced.frames.filter(f=>f.kind==='hurt').length,3);
});
