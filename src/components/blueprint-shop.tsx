"use client";
import Link from 'next/link';
import {useState} from 'react';
import {useGame} from '../runtime/game-context';
import {blueprintRecipeUnlocked,buyExclusiveRecipe} from '../core/blueprint-shop.js';
import {GearPagination,useGearPagination} from './gear-pagination';
import {CurrencyAmount,EquipmentIcon,Modal,Icon} from './ui';

export function BlueprintShop(){
 const {campaign,content,busy,transact,progressionLocked}=useGame();const [query,setQuery]=useState(''),[filters,setFilters]=useState<any>({page:'1'}),[selected,setSelected]=useState<string|null>(null);
 const templates=(Object.values(content.exclusiveGear) as any[]).filter(t=>t.enabled&&t.requires?.blueprint&&`${t.name} ${content.characters[t.characterId].name}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')));
 const pager=useGearPagination(templates,filters,setFilters),template=selected?content.exclusiveGear[selected]:null,cost=content.economy.default.blueprintRecipeCost;
 async function purchase(){if(selected&&await transact(c=>buyExclusiveRecipe(c,content,selected,{battleActive:progressionLocked}),'Đã mở công thức Trấn Phái.'))setSelected(null);}
 return <section className="blueprint-shop" aria-label="Công thức Trấn Phái"><div className="panel"><h2><Icon name="scroll"/> Bản Thiết Kế</h2><CurrencyAmount kind="blueprint" amount={campaign.blueprints??0}/><p>Đánh lại Truy Nã từ Level 25: 40% Coin · 40% Vụn Prisma · 20% Bản Thiết Kế. Level 25/35/45 nhận 1/3/5 bản.</p><p>10 bản mở một công thức vĩnh viễn. Chế tạo tại Thợ Rèn cần sở hữu nhân vật và đủ nguyên liệu.</p><label>Tìm công thức<input value={query} onChange={e=>{setQuery(e.target.value);setFilters({page:'1'});}} placeholder="Tên Trấn Phái hoặc nhân vật"/></label></div>
  <GearPagination pager={pager}/><div className="blueprint-grid">{pager.items.map((t:any)=>{const unlocked=blueprintRecipeUnlocked(campaign,t);return <article className="panel exclusive-card" key={t.id}><EquipmentIcon typeId="exclusive" compact/><span className="eyebrow">{content.characters[t.characterId].name}</span><h3>{t.name}</h3><p>{t.passive.description}</p>{unlocked?<Link className="button" href={'/blacksmith?tab=exclusive&character='+t.characterId}>Đã mở · Đến Thợ Rèn →</Link>:<button className="gold" disabled={busy||progressionLocked||(campaign.blueprints??0)<cost} onClick={()=>setSelected(t.id)}>Mở công thức · {cost} Bản Thiết Kế</button>}</article>;})}</div>
  {template&&<Modal title="Mở công thức Trấn Phái" onClose={()=>!busy&&setSelected(null)} footer={<><button disabled={busy} onClick={()=>setSelected(null)}>Hủy</button><button className="gold" disabled={busy||progressionLocked||blueprintRecipeUnlocked(campaign,template)||(campaign.blueprints??0)<cost} onClick={purchase}>Xác nhận · {cost} Bản Thiết Kế</button></>}><h3>{template.name} · {content.characters[template.characterId].name}</h3><p>{template.passive.description}</p><p>Bản Thiết Kế: {campaign.blueprints??0} → {(campaign.blueprints??0)-cost}</p><p>Mở công thức vĩnh viễn; chế tạo và tái rèn thực hiện tại Thợ Rèn.</p></Modal>}
 </section>;
}
