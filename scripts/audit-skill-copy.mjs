import {writeFile} from 'node:fs/promises';
import {loadContent} from './load-content.mjs';
import {skillPresentation,passivePresentation} from '../src/ui/skill-copy.js';
const c=await loadContent(),lines=['# Rà soát mô tả nhân vật và kỹ năng — 05/11/2026','','Ảnh chụp biên tập từ dữ liệu hiện hành; không thay thế bảng cân bằng. Thông số được sinh từ resolver khi chơi. Các mô tả không cần sửa được giữ nguyên. Tạo lại: `node scripts/audit-skill-copy.mjs`.',''];
let count=0;const errors=[];
for(const a of Object.values(c.characters)){
 lines.push('## '+a.name,'',a.description,'');
 const passive=passivePresentation(a,c);if(passive)lines.push('**'+passive.name+':** '+passive.summary,'');
 const ids=new Set([...a.abilities,...Object.values(c.upgrades).filter(u=>u.characterId===a.id).flatMap(u=>u.changes.flatMap(x=>[x.ability,x.to].filter(Boolean)))]);
 lines.push('| Kỹ năng | Mô tả |','|---|---|');
 for(const id of ids){const skill=c.abilities[id];if(!skill){errors.push(id+': missing');continue;}const copy=skillPresentation(skill,a,c);count++;lines.push('| '+skill.name+' | '+copy.summary.replaceAll('|','/')+' |');if(copy.summary.length>180||!copy.facts.length||/undefined|NaN|combatMode|snapshot|callback|handler|\uFFFD/.test(JSON.stringify(copy)))errors.push(id+': public copy incomplete');}
 if(a.description.length>160||passive&&(!passive.facts.length||passive.summary.length>180))errors.push(a.id+': identity incomplete');lines.push('');
}
lines.splice(4,0,`Phạm vi: **${Object.keys(c.characters).length} nhân vật, ${count} kỹ năng chủ động/nâng cấp/dạng** và nội tại tương ứng.`, '');
if(errors.length)throw Error(errors.join('\n'));
await writeFile(new URL('../docs/SKILL_COPY_REVIEW_2026_11_05.md',import.meta.url),lines.join('\n')+'\n');console.log(`Reviewed ${Object.keys(c.characters).length} characters / ${count} skills.`);
