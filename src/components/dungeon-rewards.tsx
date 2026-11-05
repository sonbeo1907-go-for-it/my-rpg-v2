"use client";
import {useGame} from '../runtime/game-context';
import {grantPartyXp} from '../core/leveling.js';
import {CurrencyAmount,ResourceIcon} from './ui';
function BaseDungeonReward({reward}:{reward:any}){return reward.characterXp?<span className="currency-amount currency-xp"><strong>{reward.characterXp.toLocaleString('vi-VN')}</strong><small>XP / nhân vật</small></span>:reward.limitBreakStones?<CurrencyAmount kind="breakthrough" amount={reward.limitBreakStones}/>:reward.coins?<CurrencyAmount kind="coin" amount={reward.coins}/>:<CurrencyAmount kind="pure" amount={reward.recruitmentShards}/>;}
export function XpCapWarning({amount}:{amount:number}){const {campaign,content}=useGame();if(!amount)return null;const reports=grantPartyXp(structuredClone(campaign),content,campaign.party.filter(Boolean),amount).filter((r:any)=>r.lost>0);return reports.length?<p className="warning xp-cap-warning" role="status">EXP vượt giới hạn không được tích: {reports.map((r:any)=>content.characters[r.characterId].name+' ('+r.lost+' XP)').join(', ')}. Có thể đổi đội hoặc Đột Phá trước khi xuất phát.</p>:null;}

export function DungeonReward({reward,bookDrops=[]}:{reward:any;bookDrops?:any[]}){const {content}=useGame();return <span className="dungeon-reward-bundle"><BaseDungeonReward reward={reward}/>{bookDrops.map((drop:any)=>{const item=content.items[drop.itemId];return <span className={"book-drop-preview currency-"+item.kind} key={drop.itemId}><ResourceIcon kind={item.kind}/><strong>{drop.min}{drop.max!==drop.min?"–"+drop.max:""}</strong><small>{item.name}</small></span>;})}</span>;}
