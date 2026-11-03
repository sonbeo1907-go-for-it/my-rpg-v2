import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {validateContent} from '../src/core/content.js';
import {affiliationLabel} from '../src/core/catalog.js';
const content=await loadContent();

// affiliation lưu tiếng Anh; tag danh xưng giữ tiếng Anh dạng slug; UI hiển thị tiếng Việt.
const KNIGHTS={
 benard:'gale_knight',lanceveil:'firelance_knight',gahallad:'black_knight',gawain:'storm_knight',
 iwayn:'young_knight',percival:'tide_knight',mandred:'lion_knight',lionel:'guide_knight',
 charlemagnes:'grand_general',roland:'order_captain',victorina:'rose_knight',sieg:'silver_tide_knight',
 rivia:'dusk_knight',valery:'blackwind_archer',albeldo:'windshield_knight',sandra:'order_librarian',
 cerise:'recon_knight'
};

test('Capital Knight roster carries one affiliation and one designation tag',()=>{
 const actual=Object.values(content.characters).filter(c=>c.affiliation==='Capital_Knight').map(c=>c.id).sort();
 assert.deepEqual(actual,Object.keys(KNIGHTS).sort());
 for(const [id,tag] of Object.entries(KNIGHTS)){
  const c=content.characters[id];
  assert.equal(c.affiliation,'Capital_Knight',`${id} affiliation`);
  assert.ok(c.tags.includes('capital_knights'),`${id} thiếu tag nhóm capital_knights`);
  assert.ok(c.tags.includes(tag),`${id} thiếu tag danh xưng ${tag}`);
 }
});

test('designation tag is exclusive to its own character',()=>{
 for(const [id,tag] of Object.entries(KNIGHTS)){
  const holders=Object.values(content.characters).filter(c=>(c.tags??[]).includes(tag)).map(c=>c.id);
  assert.deepEqual(holders,[id],`tag ${tag} phải chỉ thuộc ${id}`);
 }
});

test('other factions keep their own affiliation string',()=>{
 for(const c of Object.values(content.characters)){
  if(c.affiliation==='Capital_Knight')continue;
  assert.ok(!/Kị sĩ|Hiệp sĩ/i.test(c.affiliation??''),`${c.id} còn nhãn Kị sĩ cũ: ${c.affiliation}`);
 }
});

test('affiliation label renders Vietnamese and passes unknown values through',()=>{
 assert.equal(affiliationLabel('Capital_Knight'),'Kị sĩ đoàn Thủ đô');
 assert.equal(affiliationLabel('Hội Thợ Săn'),'Hội Thợ Săn');
 assert.equal(affiliationLabel(undefined),'');
 assert.equal(affiliationLabel(''),'');
});

test('content still validates with the new tags',()=>{
 assert.deepEqual(validateContent(content),[]);
});
