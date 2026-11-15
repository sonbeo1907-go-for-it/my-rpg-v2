import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';import {createGameSave} from '../src/core/game-save.js';import {characterCatalog} from '../src/core/catalog.js';import {masteryEnabled} from '../src/core/skill-rules.js';
const c=await loadContent(),ids=list=>list.map(a=>a.id).sort();
test('released exclusive filter uses enabled published templates, not ownership, crafting, equipment or recipe gates',()=>{
 const s=createGameSave(c),expected=[...new Set(Object.values(c.exclusiveGear).filter(t=>t.enabled===true).map(t=>t.characterId))].sort();
 assert.deepEqual(ids(characterCatalog(c,s,{ownership:'all',exclusive:'released'})),expected);assert.ok(expected.includes('charlemagnes'));assert.ok(!s.unlockedCharacterIds.includes('charlemagnes'));assert.equal(s.exclusiveGear.length,0);
 const next=structuredClone(s);next.unlockedExclusiveRecipes=Object.values(c.exclusiveGear).filter(t=>t.requires?.blueprint).map(t=>t.id);assert.deepEqual(ids(characterCatalog(c,next,{exclusive:'released'})),expected);
 const cc=structuredClone(c);for(const t of Object.values(cc.exclusiveGear).filter(t=>t.characterId==='charlemagnes'))t.enabled=false;assert.ok(!characterCatalog(cc,s,{exclusive:'released'}).some(a=>a.id==='charlemagnes'));
});
test('released mastery filter is independent of level, Rank, mastery upgrades and unlocked characters',()=>{
 const s=createGameSave(c),list=characterCatalog(c,s,{mastery:'released'});assert.deepEqual(ids(list),Object.keys(c.characters).filter(id=>masteryEnabled(c,id)).sort());assert.ok(list.some(a=>!s.unlockedCharacterIds.includes(a.id)));assert.ok(list.every(a=>a.level===1));
 const updated=structuredClone(s);Object.assign(updated.characters.arthur,{level:50,limitBreakRank:3,skillRanks:{basic:8}});assert.deepEqual(ids(characterCatalog(c,updated,{mastery:'released'})),ids(list));
});
test('availability filters combine with ownership, search, element and role; complements partition the roster',()=>{
 const s=createGameSave(c),all=characterCatalog(c,s),both=characterCatalog(c,s,{exclusive:'released',mastery:'released'});assert.ok(both.every(a=>masteryEnabled(c,a.id)&&Object.values(c.exclusiveGear).some(t=>t.enabled&&t.characterId===a.id)));
 for(const field of ['exclusive','mastery']){const yes=characterCatalog(c,s,{[field]:'released'}),no=characterCatalog(c,s,{[field]:'unreleased'});assert.equal(yes.length+no.length,all.length);assert.deepEqual(ids([...yes,...no]),ids(all));assert.deepEqual(ids(characterCatalog(c,s,{[field]:'unknown'})),ids(all));}
 const owned=characterCatalog(c,s,{ownership:'owned',exclusive:'released',mastery:'released'});assert.ok(owned.every(a=>s.unlockedCharacterIds.includes(a.id)));const filtered=characterCatalog(c,s,{exclusive:'released',mastery:'released',element:'light',role:'physical_dps',q:'arthur'});assert.deepEqual(ids(filtered),['arthur']);
});
test('numeric release sorting includes Astoria at 93, skips deprecated 33 and obeys ascending/descending',()=>{
 const s=createGameSave(c),asc=characterCatalog(c,s,{sort:'releaseId',direction:'asc'}),desc=characterCatalog(c,s,{sort:'releaseId',direction:'desc'});assert.deepEqual(desc.map(a=>a.id),asc.map(a=>a.id).reverse());assert.equal(asc[0].releaseId,1);assert.ok(asc.every((a,i)=>i===0||a.releaseId>asc[i-1].releaseId));assert.ok(!asc.some(a=>a.releaseId===33));assert.equal(asc.find(a=>a.id==='astoria').releaseId,93);assert.equal(asc[asc.findIndex(a=>a.id==='astoria')-1].id,'chiyoko');
 const subset=characterCatalog(c,s,{exclusive:'released',mastery:'released',sort:'releaseId',direction:'desc'});assert.ok(subset.every((a,i)=>i===0||a.releaseId<subset[i-1].releaseId));
});
