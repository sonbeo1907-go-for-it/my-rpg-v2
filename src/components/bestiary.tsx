"use client";
import {useMemo,useState} from 'react';
import {useGame} from '../runtime/game-context';
import {normalizeBestiary,inspectBestiary,bestiaryLevelLimit} from '../core/bestiary.js';
import {STAT_LABELS} from '../core/catalog.js';
import {ELEMENT_NAMES} from '../core/content.js';
import {weaknessElements} from '../core/weakness.js';
import {ElementBadge,EmptyState,PageHeader,fmt} from './ui';
import {SkillBody} from './skill-details';

const fold=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
const PAGE_SIZE=12;
export function BestiaryPage(){
 const {content,campaign}=useGame(),[query,setQuery]=useState(''),[element,setElement]=useState(''),[sort,setSort]=useState('name'),[page,setPage]=useState(0),[selected,setSelected]=useState<string|null>(null),[context,setContext]=useState(''),[level,setLevel]=useState(1);
 const records=useMemo(()=>normalizeBestiary(campaign?.bestiary,content),[campaign?.bestiary,content]);
 const rows=records.filter((r:any)=>{const e=content.enemies[r.enemyId];return (!element||e.element===element)&&fold(e.name).includes(fold(query));}).sort((a:any,b:any)=>{const x=content.enemies[a.enemyId],y=content.enemies[b.enemyId];return sort==='hp'?y.stats.maxHp-x.stats.maxHp:x.name.localeCompare(y.name,'vi');});
 const currentPage=Math.min(page,Math.max(0,Math.ceil(rows.length/PAGE_SIZE)-1)),visible=rows.slice(currentPage*PAGE_SIZE,(currentPage+1)*PAGE_SIZE);
 const record=rows.find((r:any)=>r.enemyId===selected)??visible[0],encounterId=record?.encounterIds.includes(context)?context:record?.encounterIds[0],encounter=content.encounters[encounterId],max=encounter?bestiaryLevelLimit(content,encounter):1;
 const shownLevel=Math.min(level,max),enemy=record?inspectBestiary(campaign,content,record.enemyId,encounterId,shownLevel):null;
 const skills=enemy?[...new Set([...(enemy.abilities??[]),...(enemy.boss?.phases??[]).flatMap((p:any)=>(p.rotation??[]).flat())])].filter((id:any)=>content.abilities[id]):[];
 const reset=()=>{setPage(0);setSelected(null);};
 function select(row:any){const id=row.encounterIds[0],e=content.encounters[id];setSelected(row.enemyId);setContext(id);setLevel(Math.min(e.fixedEnemyLevel??e.enemyLevel??1,bestiaryLevelLimit(content,e)));}
 return <main className="page bestiary-page"><PageHeader title="Bách Khoa Quái Vật" subtitle="Ghi chép những kẻ thù đã gặp"/>
 <div className="bestiary-layout" data-detail={Boolean(selected)}>
  <section className="bestiary-index" aria-label="Kẻ thù đã gặp">
   <div className="bestiary-filters"><label>Tìm kẻ thù<input value={query} placeholder="Tên kẻ thù…" onChange={e=>{setQuery(e.target.value);reset();}}/></label><label>Nguyên tố<select value={element} onChange={e=>{setElement(e.target.value);reset();}}><option value="">Tất cả</option>{Object.entries(ELEMENT_NAMES).map(([id,name])=><option key={id} value={id}>{String(name)}</option>)}</select></label><label>Sắp xếp<select value={sort} onChange={e=>{setSort(e.target.value);reset();}}><option value="name">Tên</option><option value="hp">HP gốc cao nhất</option></select></label></div>
   <p className="bestiary-count" aria-live="polite">{rows.length} kẻ thù{rows.length!==records.length?' / '+records.length+' đã ghi nhận':''}</p>
   <div className="bestiary-rows">{visible.map((r:any)=>{const e=content.enemies[r.enemyId];return <button key={r.enemyId} aria-pressed={enemy?.id===r.enemyId} onClick={()=>select(r)}><span>{e.name}</span><small>{ELEMENT_NAMES[e.element as keyof typeof ELEMENT_NAMES]}{e.boss?' · Thủ lĩnh':''}</small></button>;})}</div>
   {!rows.length&&<EmptyState>{records.length?'Không tìm thấy kẻ thù phù hợp.':'Chưa có ghi chép. Gặp kẻ thù trong trận để bổ sung vào bách khoa.'}</EmptyState>}
   {rows.length>PAGE_SIZE&&<nav className="bestiary-pagination" aria-label="Trang bách khoa"><button disabled={!currentPage} onClick={()=>{setPage(currentPage-1);setSelected(null);}}>Trước</button><span>{currentPage+1} / {Math.ceil(rows.length/PAGE_SIZE)}</span><button disabled={(currentPage+1)*PAGE_SIZE>=rows.length} onClick={()=>{setPage(currentPage+1);setSelected(null);}}>Sau</button></nav>}
  </section>
  {enemy&&<article className="bestiary-detail" aria-label="Thông tin kẻ thù">
   <button className="bestiary-mobile-back" onClick={()=>setSelected(null)}>← Danh sách kẻ thù</button>
   <header className="bestiary-heading"><div><ElementBadge element={enemy.element}/><h2>{enemy.name}</h2></div><span>Cấp <strong>{shownLevel}</strong></span></header>
   <div className="bestiary-level"><label>Trận đã gặp<select value={encounterId} onChange={e=>{setContext(e.target.value);setLevel(Math.min(level,bestiaryLevelLimit(content,content.encounters[e.target.value])));}}>{record.encounterIds.map((id:string)=><option key={id} value={id}>{content.encounters[id].name}</option>)}</select></label><label>Cấp tra cứu<input type="number" min={1} max={max} value={shownLevel} onChange={e=>setLevel(Math.max(1,Math.min(max,Math.trunc(Number(e.target.value)||1))))}/></label><input aria-label="Điều chỉnh cấp kẻ thù" type="range" min={1} max={max} value={shownLevel} onChange={e=>setLevel(Number(e.target.value))}/><span>1–{max}</span></div>
   <dl className="bestiary-stats">{Object.entries(STAT_LABELS).map(([id,name])=><div key={id}><dt>{name}</dt><dd>{fmt(enemy.stats[id])}</dd></div>)}</dl>
   <p className="bestiary-stat-note">Chỉ số đầu trận, theo cấp và đường tăng trưởng của trận đã chọn.</p>
   <div className="bestiary-traits"><div><h3>Điểm yếu</h3>{weaknessElements(content,enemy).length?weaknessElements(content,enemy).map((id:string)=><ElementBadge key={id} element={id}/>):<span>Không có</span>}</div>
   {enemy.resistances&&<div><h3>Sát thương nhận theo hệ</h3>{Object.entries(enemy.resistances).map(([id,amount])=><span key={id}><ElementBadge element={id}/> {typeof amount==='number'?'Nhận '+Math.round(amount*100)+'%':''} </span>)}</div>}
   {enemy.agony&&<p>Oán Hận: Khi HP về 0, tiếp tục chiến đấu đến hết vòng sau, nhận giảm {Math.round(enemy.agony.damageReduction*100)}% sát thương và mất HP tối đa khi bị đánh. Hết Oán Hận, hồi đầy phần HP tối đa còn lại. Sát thương Nguyệt đánh thẳng vào HP tối đa; không nhận hồi phục hoặc khiên trong Oán Hận.</p>}
   {enemy.damageTypeWeaknesses?.length>0&&<p>Yếu sát thương {enemy.damageTypeWeaknesses.map((id:string)=>id==='physical'?'vật lí':'ma pháp').join(' / ')}.</p>}
   {enemy.controlImmunities?.includes('stun')&&<p>Miễn Choáng từ đối thủ.</p>}
   {enemy.damageKindMultipliers&&<p>Nhận {Math.round((enemy.damageKindMultipliers.normalDamage??1)*100)}% sát thương thường · {Math.round((enemy.damageKindMultipliers.effectDamage??1)*100)}% sát thương hiệu ứng.</p>}
   </div>
   {enemy.description&&<p>{enemy.description}</p>}
   {enemy.boss?.phases?.length>0&&<section className="bestiary-phases"><h3>Các giai đoạn</h3>{enemy.boss.phases.map((p:any,i:number)=><p key={i}><strong>{p.name??'Giai đoạn '+(i+1)}</strong> · {Math.round((p.atHpRatio??1)*100)}% HP{p.actionsPerTurn?' · '+p.actionsPerTurn+' hành động/lượt':''}{p.damageMultiplier?' · Sát thương ×'+p.damageMultiplier:''}</p>)}</section>}
   <section className="bestiary-skills"><h3>Chiêu thức</h3>{skills.map((id:any)=>{const skill=content.abilities[id];return <details key={id}><summary><strong>{skill.name}</strong><span>{skill.cost?.mp??0} MP · Hồi {skill.cooldown??0} vòng</span></summary><SkillBody skill={skill} actor={{...enemy,baseStats:enemy.stats,resources:enemy.resources??{},statuses:[]}} content={content}/>{skill.windup?.message&&<p className="warning">{skill.windup.message}</p>}</details>;})}</section>
  </article>}
 </div></main>;
}
