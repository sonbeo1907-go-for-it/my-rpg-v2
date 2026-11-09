import {test} from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';import {createGameSave} from '../src/core/game-save.js';
import {characterCatalog} from '../src/core/catalog.js';import {partyLinkHref,partyReturnPath} from '../src/ui/party-navigation.js';
import {combatTimeline} from '../src/ui/combat-timeline.js';
const c=await loadContent();
test('Sword Soul filtering uses actor membership and composes with ownership, role and primary elements',()=>{
 const s=createGameSave(c);s.unlockedCharacterIds.push('chiyoko','tsukiha','amiya');
 const all=characterCatalog(c,s,{element:'sword_soul',ownership:'all'});
 assert.ok(all.length>8);assert.ok(all.every(a=>a.tags.includes('sword_soul')));assert.ok(all.some(a=>a.id==='chiyoko'));assert.ok(!all.some(a=>a.id==='arthur'));
 assert.deepEqual(characterCatalog(c,s,{element:'sword_soul',ownership:'owned'}).map(a=>a.id).sort(),['amiya','chiyoko','tsukiha']);
 assert.ok(characterCatalog(c,s,{element:'fire',ownership:'owned'}).some(a=>a.id==='tsukiha'));
 assert.ok(characterCatalog(c,s,{element:'sword_soul',role:'magical_dps',ownership:'owned'}).every(a=>a.id==='chiyoko'));
 assert.equal(characterCatalog(c,s,{element:'sword_soul',ownership:'locked'}).length,all.length-3);
});
test('party return is explicit, preserves source filters and rejects external or recursive destinations',()=>{
 for(const origin of ['/arena/match','/arena/practice','/stories/iris?selected=iris.revenge','/quests?category=bounty&difficulty=hard','/chronicles/book1?location=a','/home']){
  const href=partyLinkHref(origin);assert.equal(partyReturnPath(new URL(href,'https://game.local').searchParams.get('back')),origin);
 }
 for(const unsafe of ['https://example.com','//example.com','/\\example.com','/party?back=/party','javascript:alert(1)','/battle',null])assert.equal(partyReturnPath(unsafe),'/home');
 assert.equal(partyReturnPath(null,'/dungeon/gold_mine?selected=medium'),'/dungeon/gold_mine?selected=medium');
});
const cast=p=>({type:'ability_cast',sourceId:'chiyoko',targetId:'enemy',abilityId:'test',presentation:p,area:p!=='iaido_draw'});
const hit=(n,targetId='enemy',primaryOnly=false)=>({type:'damage',sourceId:'chiyoko',targetId,hitIndex:n,amount:20,primaryOnly});
function plan(p,events,options={}){return combatTimeline([cast(p),...events],{abilities:{test:{target:p==='iaido_draw'?'enemy':'all_enemies',effects:[{type:'damage'}]}}},options);}
test('draw has source hilt anticipation, then a synchronized thin cut and damage',()=>{
 const {frames}=plan('iaido_draw',[hit(0)]),prep=frames.find(f=>f.kind==='anticipation'),fx=frames.find(f=>f.kind==='signature'),damage=frames.find(f=>f.kind==='hurt');
 assert.equal(prep.targetId,'chiyoko');assert.equal(prep.presentation,'iaido_hilt');assert.ok(prep.at+prep.duration<=fx.at);assert.equal(fx.at,damage.at);
});
test('twin cuts have separate beats, and finale has five synchronized formation cuts plus a pause before the sixth',()=>{
 const twin=plan('iaido_twin',[hit(0),hit(1)]).frames.filter(f=>f.kind==='signature');assert.ok(twin[1].at>twin[0].at+100);assert.ok(twin[1].duration<twin[0].duration);
 const events=[...Array.from({length:5},(_,i)=>hit(i)),...Array.from({length:5},(_,i)=>hit(i,'other')),hit(5,'enemy',true)];
 for(const speed of ['normal','fast']){const {frames,duration}=plan('iaido_eclipse',events,{speed});const fx=frames.filter(f=>f.kind==='signature');assert.equal(fx.length,6);assert.ok(fx.slice(0,5).every(f=>f.area));assert.equal(fx[5].area,false);assert.ok(fx[5].at-fx[4].at>fx[1].at-fx[0].at);for(const f of frames.filter(f=>f.kind==='hurt'))assert.equal(f.at,fx[f.hitIndex].at);assert.ok(duration>=fx[5].at+fx[5].duration);}
 const reduced=plan('iaido_eclipse',events,{reduced:true});assert.ok(reduced.frames.every(f=>f.at===0));assert.ok(!reduced.frames.some(f=>f.kind==='anticipation'));
});
test('ancestral convergence is cosmetic and has a bounded cleanup deadline',()=>{const {frames,duration}=plan('iaido_awaken',[]);const fx=frames.find(f=>f.kind==='signature');assert.equal(fx.targetId,'chiyoko');assert.equal(fx.area,false);assert.equal(fx.duration,900);assert.ok(duration<=1100);});
