import {baseStatValue} from './combat-math.js';
import {battleStat,battleMaxMp} from './stat-values.js';
import {shieldAuraBonus} from './shield-aura.js';
export const STATUS_CHANCE_STATS=['maxHp','maxMp','attack','magic','defense','resistance','speed'];
export function validStatusChance(rule){return Boolean(rule&&STATUS_CHANCE_STATS.includes(rule.stat)&&['dynamic','base'].includes(rule.basis)&&Number.isFinite(rule.at)&&rule.at>0&&Number.isFinite(rule.cap)&&rule.cap>0&&rule.cap<=1);}
export function statusApplicationChance(content,source,rule,battle){
 if(!rule)return 1;if(!source)return 0;
 const aura=rule.stat==='magic'?shieldAuraBonus(battle,source):0;
 const value=rule.basis==='base'?baseStatValue(source,rule.stat):rule.stat==='maxMp'?battleMaxMp(content,source):battleStat(content,source,rule.stat,false,aura);
 return Math.min(rule.cap,Math.max(0,value)/rule.at*rule.cap);
}

export function stunImmune(content,actor){return Boolean(actor.boss||actor.controlImmunities?.includes("stun")||content.enemies?.[actor.definitionId]?.controlImmunities?.includes("stun"));}
