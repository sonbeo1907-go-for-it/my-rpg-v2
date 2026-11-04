import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {AFFILIATION_LABELS,affiliationLabel,characterCatalog} from '../src/core/catalog.js';
import {createGameSave} from '../src/core/game-save.js';
import {validateContent} from '../src/core/content.js';
const content=await loadContent();

// Quyết định 04/11/2026: chuẩn hóa phe phái về slug ổn định và bổ sung thành viên.
const EXPECTED={
 northern_village:['armie','arthur','astraea','elaine','fiona','garrek','kai','tobin'],
 hunters_guild:['bennett','brant','chloe','dain','flammelapis','freya','galliard','henrris','iris','joshua','judy','karin','logia','rowan','sylva','takeshi','tywin','yumia'],
 magic_academy:['artesia','auguste','aurora','drake','finmel','fran','kreider','lumine','monica'],
 house_ranoc:['helena','kyle','leonardo','lisbeth'],
 rhett_research_facility:['amaryllis','arden','rhett'],
};
const members=faction=>Object.values(content.characters).filter(c=>c.affiliation===faction).map(c=>c.id).sort();

test('affiliation lưu slug ổn định, không lưu chuỗi hiển thị',()=>{
 for(const c of Object.values(content.characters)){
  if(c.affiliation===undefined)continue;
  assert.match(c.affiliation,/^[a-z][a-z0-9_]*$/,`${c.id} phải dùng slug, đang là "${c.affiliation}"`);
  assert.ok(!/\s/.test(c.affiliation),`${c.id} còn khoảng trắng trong affiliation`);
 }
});

test('thành viên phe theo quyết định 04/11/2026',()=>{
 for(const [faction,ids] of Object.entries(EXPECTED))assert.deepEqual(members(faction),ids.sort(),`${faction} sai thành viên`);
});

test('mọi slug đều có nhãn tiếng Việt, không lộ key ra UI',()=>{
 for(const c of Object.values(content.characters)){
  const label=affiliationLabel(c.affiliation);
  if(!c.affiliation){assert.equal(label,'');continue;}
  assert.ok(Object.hasOwn(AFFILIATION_LABELS,c.affiliation),`${c.affiliation} thiếu nhãn trong AFFILIATION_LABELS`);
  assert.notEqual(label,c.affiliation,`${c.affiliation} đang hiển thị nguyên slug`);
  assert.ok(/[^\x00-\x7F]/.test(label),`${label} chưa được Việt hóa`);
 }
});

test('bộ lọc sở hữu: owned là tập con, all bỏ lọc, locked phần bù',()=>{
 const save=createGameSave(content);
 const owned=characterCatalog(content,save,{ownership:'owned'});
 const all=characterCatalog(content,save,{ownership:'all'});
 const snapshot=characterCatalog(content,save);
 assert.equal(owned.length,characterCatalog(content,save,{},true).length);
 assert.equal(all.length,snapshot.length);
 assert.ok(all.length>owned.length,'save mặc định phải còn nhân vật chưa sở hữu');
 assert.equal(characterCatalog(content,save,{ownership:'locked'}).length,all.length-owned.length);
 assert.deepEqual(validateContent(content),[]);
});
