"use client";
import {useGame} from '../runtime/game-context';
import {grantPartyXp} from '../core/leveling.js';
import {CurrencyAmount} from './ui';
export function DungeonReward({reward}:{reward:any}){return reward.characterXp?<span className="currency-amount currency-xp"><strong>{reward.characterXp.toLocaleString('vi-VN')}</strong><small>XP / nhân vật</small></span>:reward.limitBreakStones?<CurrencyAmount kind="breakthrough" amount={reward.limitBreakStones}/>:reward.coins?<CurrencyAmount kind="coin" amount={reward.coins}/>:<CurrencyAmount kind="pure" amount={reward.recruitmentShards}/>;}
export function XpCapWarning({amount}:{amount:number}){const {campaign,content}=useGame();if(!amount)return null;const reports=grantPartyXp(structuredClone(campaign),content,campaign.party.filter(Boolean),amount).filter((r:any)=>r.lost>0);return reports.length?<p className="warning xp-cap-warning" role="status">EXP vượt giới hạn không được tích: {reports.map((r:any)=>content.characters[r.characterId].name+' ('+r.lost+' XP)').join(', ')}. Có thể đổi đội hoặc Đột Phá trước khi xuất phát.</p>:null;}
