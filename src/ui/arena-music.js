import {isAlive} from '../core/actor-life.js';
export const ARENA_MUSIC_STAGES=Object.freeze(['start','climax','finale']);
// Only complete suites are eligible; never mix movements from different songs.
export function arenaMusicVariants(content){
 return Object.keys(content.music).filter(id=>/^arena_start_[a-zA-Z0-9_-]+$/.test(id)).map(id=>id.slice('arena_start_'.length)).filter(code=>ARENA_MUSIC_STAGES.every(stage=>content.music[`arena_${stage}_${code}`]?.tracks?.length)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
}
export function createArenaScore(content,actors,random=Math.random){
 const codes=arenaMusicVariants(content);let variant=codes[0]??null;
 if(codes.length>1){const n=random();if(!Number.isFinite(n)||n<0||n>=1)throw Error('Nguồn chọn nhạc Đấu Trường không hợp lệ.');variant=codes[Math.floor(n*codes.length)];}
 return {variant,stage:0,initialTotalHp:actors.reduce((n,a)=>n+Math.max(0,a.stats.maxHp),0)};
}
export function advanceArenaScore(score,actors){
 const hp=actors.reduce((n,a)=>n+Math.max(0,a.hp),0),alive=actors.filter(isAlive).length;
 const reached=alive<=4?2:score.initialTotalHp>0&&hp<=score.initialTotalHp*.6?1:0;
 return reached>score.stage?{...score,stage:reached}:score;
}
export function arenaMusicGroup(score){return score.variant?`arena_${ARENA_MUSIC_STAGES[score.stage]}_${score.variant}`:'normal';}
