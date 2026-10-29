import test from 'node:test';import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createCampaign,resolveCharacter} from '../src/core/progression.js';
import {basicAbility,DEFEND} from '../src/core/battle.js';
import {skillPresentation,passivePresentation} from '../src/ui/skill-copy.js';
import {skillCost} from '../src/ui/skill-presentation.js';
import {statusDetails} from '../src/ui/combat-presentation.js';
const content=await loadContent();
function owner(skill){return Object.values({...content.characters,...content.enemies}).find(a=>a.abilities.includes(skill.id))??content.characters[skill.id.split('.')[0]]??content.characters.arthur;}
test('all 32 identities, 144 skills and 13 exclusive summaries are reviewed, concise and free of encoding/internal-value leaks',()=>{
 for(const a of Object.values(content.characters)){assert.ok(a.description.length<=160,a.id);for(const s of [basicAbility(a),DEFEND,...a.abilities.map(id=>content.abilities[id])]){const copy=skillPresentation(s,a,content);assert.ok(copy.summary.length<=180,s.id);assert.ok(copy.facts.length,s.id);assert.doesNotMatch(JSON.stringify(copy),/NaN|undefined|Ã|áº|á»|â€|\uFFFD/,s.id);}}
 for(const s of Object.values(content.abilities)){const copy=skillPresentation(s,owner(s),content);assert.ok(copy.summary.length<=180,s.id);assert.ok(copy.facts.length,s.id);assert.equal(new Set(copy.rules).size,copy.rules.length,s.id);assert.doesNotMatch(JSON.stringify(copy),/NaN|undefined|Ã|áº|á»|â€|\uFFFD/,s.id);}
 for(const t of Object.values(content.exclusiveGear))assert.ok(t.passive.description.length<=180,t.id);
});
test('Lyon ward separates its one-line intent, one charge fact and exactly three distinct exceptions',()=>{
 const copy=skillPresentation(content.abilities['lyon.ward'],content.characters.lyon,content);
 assert.equal(copy.summary,'Bảo vệ một đồng đội khỏi hiệu ứng bất lợi kế tiếp.');assert.deepEqual(copy.facts,['Hộ ấn: 1 lần chặn · đến khi dùng hết']);assert.equal(copy.rules.length,3);assert.ok(copy.rules.some(line=>line.includes('nhiều hiệu ứng')));assert.ok(copy.rules.some(line=>line.includes('hình phạt tự gây')));assert.ok(copy.rules.some(line=>line.includes('không cộng dồn')));
});
test('shield and mixed damage facts retain effective scaling, distinct defenses and speed passive without copied constants',()=>{
 const shield=skillPresentation(content.abilities['lyon.shield'],content.characters.lyon,content);assert.match(shield.facts.join(' '),/150% DEF → 51\/người/);
 const hybrid=skillPresentation(content.abilities['seraphine.spell'],content.characters.seraphine,content);assert.ok(hybrid.facts.some(line=>line.includes('vật lí')&&line.includes('200% ATK')));assert.ok(hybrid.facts.some(line=>line.includes('ma pháp')&&line.includes('200% MAG')));assert.ok(hybrid.rules.some(line=>line.includes('DEF')&&line.includes('RES')));
 const speed=skillPresentation(content.abilities['benard.flash'],content.characters.benard,content);assert.match(speed.facts.join(' '),/70% ATK \+ 150% SPD/);
 const changed=structuredClone(content);changed.abilities['lyon.shield'].effects[0].multiplier=2;assert.match(skillPresentation(changed.abilities['lyon.shield'],changed.characters.lyon,changed).facts.join(' '),/200% DEF → 68/);
});
test('facts retain source-specific targets, all status durations, stack application and offensive penalties',()=>{
 const cover=skillPresentation(content.abilities['leonardo.cover'],content.characters.leonardo,content);assert.ok(cover.facts.some(line=>line.startsWith('Bản thân: +30% RES')&&line.includes('2 lượt')));assert.ok(cover.facts.some(line=>line.includes('Nhận đòn thay')&&line.includes('2 lượt')));
 const mark=skillPresentation(content.abilities['kyle.mischief'],content.characters.kyle,content);assert.match(mark.facts.join(' '),/−12% RES\/tầng/);assert.match(mark.facts.join(' '),/\+1 Trò quậy · tối đa 3 tầng · 3 lượt/);
 const bane=skillPresentation(content.abilities['arthur.ogres_bane'],content.characters.arthur,content);assert.match(bane.facts.join(' '),/Bản thân: Không tích tài nguyên · 1 lượt kế tiếp/);
});
test('player-facing variable cost is total affordable MP; added MP bonus remains per-cast rather than per-target',()=>{
 const a=content.characters.helena,s=content.abilities['helena.rain'];assert.match(skillCost(s,a),/12–18 MP/);assert.match(skillCost(s,{...a,mp:15}),/12–15 MP/);assert.match(skillCost(s,{...a,mp:12}),/12 MP/);
 const info=skillPresentation(s,{...a,mp:15},content,{live:true});assert.match(info.facts.join(' '),/×1,25/);assert.ok(info.rules.some(line=>line.includes('một lần cho cả chiêu')));
});
test('preview labels assumptions and defaults to minimum resource count; live values use actual spending',()=>{
 const a=content.characters.takeshi,s=content.abilities['takeshi.riposte'];assert.match(skillPresentation(s,a,content).facts.join(' '),/Giả định: 200% ATK/);assert.match(skillPresentation(s,a,content,{live:true,spent:3}).facts.join(' '),/Hiện tại: 360% ATK/);
});
test('equipped exclusive duration is reflected in main facts while full passive stays in rules',()=>{
 const c=createCampaign(content);c.exclusiveGear=[{templateId:'elaine.mirror',statKey:'magic',statValue:5}];c.equippedExclusiveGear.elaine='elaine.mirror';const a=resolveCharacter(content,c,'elaine');const info=skillPresentation(content.abilities['elaine.veil'],a,content);assert.match(info.facts.join(' '),/50% RES · 3 lượt/);assert.ok(!info.facts.some(line=>line.includes('2 lượt')));
});
test('exclusive benefits are facts on relevant skills only, with conditions retained and unrelated passives omitted',()=>{
 for(const[id,skillId,needle]of [['arthur.intro','arthur.light_slash','+8% sát thương'],['takeshi.insight','takeshi.riposte','Tiêu từ 2 Sơ hở'],['garrek.armor','garrek.fortress','Đầu lượt kế tiếp'],['fiona.crown','fiona.collapse','ít nhất 2 địch']]){
  const t=content.exclusiveGear[id],c=createCampaign(content);c.exclusiveGear=[{templateId:id,statKey:'attack',statValue:5}];c.equippedExclusiveGear[t.characterId]=id;const a=resolveCharacter(content,c,t.characterId);assert.ok(skillPresentation(content.abilities[skillId],a,content).facts.some(line=>line.includes(needle)),id);
 }
 const t=content.exclusiveGear['takeshi.cloak'];const a={...content.characters.takeshi,exclusiveGear:{template:t}};assert.ok(skillPresentation(content.abilities['takeshi.stance'],a,content).facts.some(line=>line.includes('Trấn Phái')));assert.ok(!skillPresentation(content.abilities['takeshi.slash'],a,content).facts.some(line=>line.includes('Trấn Phái')));
});
test('all native passives have a compact identity, readable facts and preserve important trigger distinctions',()=>{
 for(const a of Object.values(content.characters)){const info=passivePresentation(a,content);if(!a.passive){assert.equal(info,null);continue;}assert.ok(info.summary.length<=180,a.id);assert.ok(info.facts.length,a.id);assert.doesNotMatch(JSON.stringify(info),/NaN|undefined/);}
 const aurora=passivePresentation(content.characters.aurora,content);assert.match(aurora.summary,/đơn mục tiêu của đồng đội khác/);assert.match(aurora.facts.join(' '),/1 lần\/vòng/);
 assert.match(passivePresentation(content.characters.cedric,content).summary,/Cuối lượt/);const lionel=passivePresentation(content.characters.lionel,content);assert.match(lionel.summary,/Cuối vòng/);assert.match(lionel.facts.join(' '),/tính cả bản thân/);assert.match(lionel.rules.join(' '),/sau toàn bộ Vòng Phụ/);
 const p=passivePresentation(content.characters.percival,content);assert.match(p.summary,/đồng đội khác/);assert.match(p.facts.join(' '),/1 lần\/vòng/);
});
test('existing status uses actual remaining charges and poison potency instead of recasting a full-charge/base-stat preview',()=>{
 const a=content.characters.lyon;const ward=statusDetails({id:'effect_ward',remaining:null,charges:0,sourceId:'lyon'},a,{actors:[{...a,id:'lyon'}]},content);assert.match(ward.lines.join(' '),/0 lần chặn/);
 const poison=statusDetails({id:'kai_poison',remaining:2,potency:21,sourceId:'kai'},a,{actors:[{...content.characters.kai,statuses:[],resourceValues:{}}]},content);assert.match(poison.lines.join(' '),/21 HP mỗi đầu lượt/);
});
