import {battleStat} from './stat-values.js';
export function judgeTournamentLimit(battle){
 if(!battle.tournament||battle.outcome||battle.round<battle.tournament.maxMainRounds)return false;
 const score=team=>{const living=battle.actors.filter(a=>a.team===team&&a.hp>0);return [living.length,living.reduce((n,a)=>n+a.hp/battleStat(battle.content,a,'maxHp'),0),battle.tournament.directHpDamage[team]??0];};
 const a=score('party'),b=score('enemy');let winner=null;
 for(let i=0;i<a.length;i++)if(Math.abs(a[i]-b[i])>1e-9){winner=a[i]>b[i]?'party':'enemy';break;}
 winner??=battle.random()<.5?'party':'enemy';battle.tournament.judged=true;battle.outcome=winner==='party'?'victory':'defeat';battle.log.push('Hết 40 vòng · Phân thắng theo số người trụ sân, tỷ lệ HP, sát thương HP và kết quả bốc thăm nếu bằng nhau.');return true;
}
