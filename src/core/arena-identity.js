import {ARENA_USERNAMES} from '../../data/arena-usernames.js';
import {seededRandom} from './random.js';
export {ARENA_USERNAMES};
export function arenaIdentity(seed,playerName='Người lữ hành'){
 const pool=ARENA_USERNAMES.filter(name=>name.toLocaleLowerCase()!==playerName.toLocaleLowerCase());
 const random=seededRandom((seed^0x51f15e)>>>0);
 return {playerName,opponentName:pool[Math.floor(random()*pool.length)]};
}
export function nextArenaSeed(previous,randomValue){const n=randomValue>>>0;return n===previous?(n+1)>>>0:n;}
export function forfeitArenaBattle(battle){
 if(!battle?.arena||battle.outcome)return false;
 battle.outcome='defeat';battle.rewardClaimed=true;battle.events=[];battle.arena.forfeited=true;
 battle.arena.activity={};battle.log.push('Bạn đã rời trận · Xử thua.');return true;
}
