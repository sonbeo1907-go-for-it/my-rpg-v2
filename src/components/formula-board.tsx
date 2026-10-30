"use client";
import {useEffect,useState} from 'react';
import {Modal,Icon} from './ui';
import {useSettings} from '../runtime/settings-context';
import {activeFormula,formulaDefinition,formulaCounts,formulaPower,formulaDamage,formulaForecast,editedFormulaEntries,validateFormulaEdit,FORMULA_NAMES,FORMULA_TAGS} from '../core/formula-field.js';

const pct=(n:number)=>new Intl.NumberFormat('vi-VN',{maximumFractionDigits:1}).format(n*100)+'%';
export function Rune({tag}:{tag:string}){
 return <svg viewBox="0 0 40 40" className="formula-rune" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
  <circle cx="20" cy="20" r="17"/>{tag==='lead'?<><path d="M8 12q6-3 12 1v16q-6-4-12-1Zm24 0q-6-3-12 1v16q6-4 12-1Z"/><path d="M12 17h4m8 0h4m-16 5h4m8 0h4"/></>:tag==='break'?<><path d="m22 5-7 13 9 3-7 14m-8-17 8 2m8 2 7 2"/><path d="m11 10 3 3m14 14 3 3"/></>:<><path d="m12 29 15-20 4 1-1 4-16 17m-4-8 9 7m-8-3-4 5m-1-3 5 4"/></>}
 </svg>;
}
function FormulaRow({entries,sequence=['lead','break','strike']}:{entries:any[];sequence?:string[]}){
 return <ol className="formula-slots">{sequence.map((expected,index)=>{const entry=entries[index];return <li key={index} data-tag={entry?.tag??'empty'} data-correct={Boolean(entry&&entry.tag===expected)}>
  <span className="formula-position">{index+1} · Cần {(FORMULA_NAMES as any)[expected]} {entry&&<span aria-label={entry.tag===expected?"Đúng vị trí":"Sai vị trí"}>{entry.tag===expected?"✓":"×"}</span>}</span>
  {entry?<><Rune tag={entry.tag}/><strong>{(FORMULA_NAMES as any)[entry.tag]}</strong><span className="formula-source">{entry.sourceName}{entry.rewritten?' · viết lại':''}</span><small>{entry.abilityName}</small></>:<><span className="formula-empty">＋</span><strong>Chờ luận cứ</strong><span className="formula-source">Kỹ năng đồng đội</span></>}
 </li>;})}</ol>;
}
function PowerLine({owner,field,content}:{owner:any;field:any;content:any}){
 const counts=formulaCounts(content,owner,field),power=formulaPower(owner,counts);
 const authored=owner.abilities.flatMap((id:string)=>content.abilities[id].effects).find((effect:any)=>effect.formulaScaling);
 const effect=authored?formulaDamage(authored,power):null;
 return <div className="formula-power" aria-live="polite"><strong>{counts.ready?counts.perfect?'Tam đoạn luận · Đã chứng minh':'Đã đủ ba dấu':`Cần thêm ${3-field.entries.length} dấu`}</strong><span>{power.correct}/3 vị trí đúng · +{power.baseMagic} MAG căn bản{effect?` · ${effect.hits} × ${pct(effect.multiplier)} MAG (tổng ${pct(effect.hits*effect.multiplier)})`:''}{counts.perfect&&effect?` · Xuyên ${pct(effect.penetration)} RES`:''}</span></div>;
}
export function FormulaBoards({battle,content}:{battle:any;content:any}){
 return <>{battle.actors.filter((owner:any)=>activeFormula(battle,owner)).map((owner:any)=>{const field=owner.formulaField,definition=formulaDefinition(content,field);return <section className="formula-board" key={owner.id} data-formula-owner={owner.id} data-formula-perfect={formulaCounts(content,owner,field).perfect} aria-label={`Đại Đồ Thức của ${owner.name}`}>
  <header><div><span className="eyebrow">ĐẠI GIẢNG ĐƯỜNG</span><h3>{definition.name} <small>· {owner.name}</small></h3></div><span className="formula-duration">{field.expiresAfterRound-battle.round+1} vòng còn lại</span></header>
  <FormulaRow entries={field.entries} sequence={definition.sequence}/><PowerLine owner={owner} field={field} content={content}/>
 </section>;})}</>;
}
export function FormulaForecast({battle,actor,skill}:{battle:any;actor:any;skill:any}){
 const forecasts=formulaForecast(battle,actor,skill);
 return <>{forecasts.map((next:any)=><p className="formula-forecast" key={next.ownerId} data-forecast-owner={next.ownerId}><span data-tag={next.tag}>Tạo {(FORMULA_NAMES as any)[next.tag]}</span> → {next.entries.map((entry:any)=>(FORMULA_NAMES as any)[entry.tag]).join(' · ')} <small>· {next.correct}/3 đúng · +{next.baseMagic} MAG{next.perfect?' · Tam đoạn luận':''}</small></p>)}</>;
}
export function FormulaSkillTag({battle,actor,skill}:{battle:any;actor:any;skill:any}){
 const next=formulaForecast(battle,actor,skill)[0];
 return next?<span className="formula-command-tag" data-tag={next.tag} aria-label={`Kỹ năng này ghi dấu ${(FORMULA_NAMES as any)[next.tag]}`}>{(FORMULA_NAMES as any)[next.tag]}</span>:null;
}
export function FormulaScene({battle,content}:{battle:any;content:any}){
 const owner=battle.actors.find((item:any)=>activeFormula(battle,item));if(!owner)return null;
 const definition=formulaDefinition(content,owner.formulaField);
 return <div className="academic-scene" aria-hidden="true" style={{backgroundImage:`url("${definition.background}")`}}><span className="academic-seal"/></div>;
}
export function FormulaEditControl({owner,battle,content,skill,value,onChange,busy}:{owner:any;battle:any;content:any;skill:any;value:any;onChange:(value:any)=>void;busy:boolean}){
 const {preferences}=useSettings();const field=activeFormula(battle,owner);
 const [open,setOpen]=useState(false),[draft,setDraft]=useState<any>(value);
 const show=()=>{setDraft(value);setOpen(true);};
 useEffect(()=>{const handler=(event:Event)=>{const e=event as CustomEvent;if(e.detail==='x'&&!busy&&!document.querySelector('dialog[open]')){e.preventDefault();setDraft(value);setOpen(true);}};window.addEventListener('rpg:gamepad',handler);return()=>window.removeEventListener('rpg:gamepad',handler);},[busy,value]);
 if(!field||!field.entries.length)return null;
 let entries:any[]|null=null;
 try{entries=editedFormulaEntries(field,draft,owner,skill);}catch{}
 let selected:any[]|null=null;
 try{selected=editedFormulaEntries(field,value,owner,skill);}catch{}
 const pick=(key:string,index:number)=>{
  if(draft.kind==='swap')setDraft({...draft,[key]:index,...(key==='left'&&draft.right===index?{right:(index+1)%field.entries.length}:{})});
  else setDraft({...draft,index,tag:draft.tag===field.entries[index].tag?FORMULA_TAGS.find(tag=>tag!==field.entries[index].tag):draft.tag});
 };
 const slots=(key:string)=><div className="formula-choice-row">{field.entries.map((entry:any,index:number)=><button key={index} type="button" aria-label={`Chọn ${key==='left'?'ô thứ nhất':key==='right'?'ô thứ hai':'ô viết lại'} ${index+1}`} aria-pressed={draft[key]===index} disabled={key==='right'&&draft.left===index} onClick={()=>pick(key,index)} data-tag={entry.tag}>Ô {index+1} · {(FORMULA_NAMES as any)[entry.tag]}</button>)}</div>;
 return <section className="formula-edit-control"><button type="button" className="formula-edit-open" disabled={busy} onClick={show}><Icon name="book"/>{preferences.controlMode==='gamepad'&&<kbd>X</kbd>} Chọn cách hiệu chỉnh</button>
  <p className="muted">Đang chọn: {value.kind==='swap'?`đổi ô ${value.left+1} ↔ ${value.right+1}`:`viết ô ${value.index+1} thành ${(FORMULA_NAMES as any)[value.tag]}`}.</p>
  {selected&&<div className="formula-mini-preview">Sau hiệu chỉnh: {selected.map((entry:any)=>(FORMULA_NAMES as any)[entry.tag]).join(' · ')}</div>}
  {open&&<Modal title="Hiệu chỉnh luận cứ" onClose={()=>setOpen(false)} footer={<><button onClick={()=>setOpen(false)}>Hủy</button><button className="gold" disabled={!entries} onClick={()=>{validateFormulaEdit(field,draft);onChange(draft);setOpen(false);}}>Xác nhận cách sửa</button></>}>
   <p>Chọn cách sửa công thức. Xác nhận ở đây chưa thi triển và chưa tiêu MP.</p>
   <div className="formula-choice-row"><button aria-pressed={draft.kind==='swap'} disabled={field.entries.length<2} onClick={()=>setDraft({kind:'swap',left:0,right:1})}>Đổi chỗ hai dấu</button><button aria-pressed={draft.kind==='rewrite'} onClick={()=>setDraft({kind:'rewrite',index:0,tag:FORMULA_TAGS.find(tag=>tag!==field.entries[0].tag)})}>Viết lại một dấu</button></div>
   {draft.kind==='swap'?<><p>Ô thứ nhất</p>{slots('left')}<p>Ô thứ hai</p>{slots('right')}</>:<><p>Ô muốn viết lại</p>{slots('index')}<p>Dấu mới</p><div className="formula-choice-row">{FORMULA_TAGS.map(tag=><button key={tag} data-tag={tag} aria-pressed={draft.tag===tag} disabled={field.entries[draft.index]?.tag===tag} onClick={()=>setDraft({...draft,tag})}>{(FORMULA_NAMES as any)[tag]}</button>)}</div></>}
   {entries&&<><h3>Công thức sau hiệu chỉnh</h3><FormulaRow entries={entries} sequence={formulaDefinition(content,field).sequence}/><PowerLine owner={owner} field={{...field,entries}} content={content}/></>}
   <p className="muted">Đổi chỗ giữ nguồn. Viết lại mang nguồn {owner.name}, không góp MAG từ nội tại của chính mình.</p>
  </Modal>}
 </section>;
}
