import {xpRequired} from '../core/leveling.js';
export function isBattleFinished(battle){
 if(!battle?.outcome)return false;
 const wave=battle.dungeon??battle.storyWave;
 return battle.outcome!=='victory'||!wave||wave.waveIndex+1>=wave.totalWaves;
}
export function xpResultProgress(content,report,state){
 const level=report.toLevel,need=xpRequired(content,level),xp=report.toXp??state.xp;
 const before=report.toLevel===report.fromLevel?(report.fromXp??Math.max(0,xp-report.accepted)):0;
 return {level,xp,need,before:need?100*before/need:0,after:need?100*xp/need:100,atMaximum:need===0};
}
