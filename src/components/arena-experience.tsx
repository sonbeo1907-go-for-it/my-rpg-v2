"use client";
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {useGame} from '../runtime/game-context';
import {createArenaBattle} from '../core/arena.js';
import {nextArenaSeed} from '../core/arena-identity.js';
import {ARENA_PACING,arenaLoadDuration} from '../ui/arena-experience.js';
import {Icon,RoleIcon,ElementBadge} from './ui';

export function ArenaPlayerBar({team}:{team:'party'|'enemy'}){
 const {battle,busy}=useGame();if(!battle?.arena)return null;
 const arena=battle.arena,state=arena.activity?.[team],active=battle.actors.find((a:any)=>a.id===battle.activeId);
 const name=team==='party'?arena.playerName:arena.opponentName;
 const acting=state?.phase==='casting',thinking=!acting&&!battle.outcome&&active?.team===team&&(state?.phase!=='resolved'||!busy);
 const status=battle.outcome?'Trận đấu kết thúc':acting?'Đang thi triển':thinking?'Đang suy nghĩ…':'Đang chờ…';
 const detail=acting?`${state.sourceName} đang dùng ${state.skillName}…`:state?.summary??(thinking?`${active?.name} đang chọn hành động`:'Chờ lượt tiếp theo');
 return <section className={'arena-player-bar '+team} data-arena-player={team} data-activity={acting?'casting':thinking?'thinking':'waiting'} aria-label={team==='party'?'Người chơi':'Đối thủ'}>
   <div className="arena-player-identity"><span className="arena-avatar" aria-hidden="true">{name?.slice(0,2).toUpperCase()}</span><div><strong>{name}</strong><span aria-live="polite">{status}</span></div>{(thinking||acting)&&<span className="arena-status-pulse" aria-hidden="true"/>}</div>
   <p className="arena-action-notice" aria-live="polite">{detail}</p>
 </section>;
}
function LoadingTeam({preview,team}:{preview:any;team:'party'|'enemy'}){
 const {content}=useGame(),name=team==='party'?preview.arena.playerName:preview.arena.opponentName;
 return <section className={'arena-loading-team '+team} aria-label={team==='party'?'Đội của bạn':'Đội đối thủ'}><header><span className="arena-avatar" aria-hidden="true">{name.slice(0,2).toUpperCase()}</span><div><span className="eyebrow">{team==='party'?'ĐỘI CỦA BẠN':'ĐỘI ĐỐI THỦ'}</span><h2>{name}</h2></div></header><div className="arena-loading-roster">{preview.actors.filter((a:any)=>a.team===team).map((a:any)=><article key={a.id} data-element={a.element}><ElementBadge element={a.element}/><img src={'/art/silhouette-'+content.characters[a.characterId].roleGroup+'.svg'} alt=""/><div className="arena-loading-character"><RoleIcon roleGroup={content.characters[a.characterId].roleGroup}/><strong>{content.characters[a.characterId].name}</strong><span>Lv. {a.level} · Rank 5</span></div></article>)}</div></section>;
}
export function ArenaMatchFlow({onCancel}:{onCancel:()=>void}){
 const {content,campaign,activeProfile,battle,startArena}=useGame(),router=useRouter();
 const [stage,setStage]=useState('searching'),[preview,setPreview]=useState<any>(null),[progress,setProgress]=useState(0),[error,setError]=useState('');
 useEffect(()=>{
   let cancelled=false;const timers:ReturnType<typeof setTimeout>[]=[],intervals:ReturnType<typeof setInterval>[]=[];
   const later=(fn:()=>void,ms:number)=>timers.push(setTimeout(()=>{if(!cancelled)fn();},ms));
   const seed=nextArenaSeed(battle?.arena?.seed,crypto.getRandomValues(new Uint32Array(1))[0]);
   router.prefetch('/battle');
   later(()=>{
     try{const candidate=createArenaBattle(content,campaign,'match',seed,{playerName:activeProfile?.username??'Người lữ hành'});setPreview(candidate);setStage('found');
       later(()=>{setStage('loading');const started=Date.now(),duration=arenaLoadDuration(seed);
         intervals.push(setInterval(()=>{if(!cancelled)setProgress(Math.min(99,Math.round((Date.now()-started)/duration*100)));},100));
         later(()=>{intervals.forEach(clearInterval);setProgress(100);if(startArena('match',seed))router.replace('/battle');else{setError('Không thể vào trận lúc này. Hãy kiểm tra trận đang dở rồi thử lại.');setStage('error');}},duration);
       },ARENA_PACING.found);
     }catch(e){setError((e as Error).message);setStage('error');}
   },ARENA_PACING.search);
   return ()=>{cancelled=true;timers.forEach(clearTimeout);intervals.forEach(clearInterval);};
 },[]);
 if(stage==='searching'||stage==='error')return <main className="page arena-search-screen"><div className="arena-search-emblem" aria-hidden="true"><Icon name={stage==='error'?'shield':'sword'}/></div><span className="eyebrow">ĐẤU TRƯỜNG</span><h1>{stage==='error'?'Chưa thể xuất chiến':'Đang tìm đối thủ…'}</h1><p role="status">{error||'Những ngọn đèn trên võ đài đang được thắp sáng.'}</p><button onClick={onCancel}>{stage==='error'?'Trở về':'Hủy tìm trận'}</button></main>;
 return <main className="page arena-loading-screen" data-match-stage={stage}>
   <header className="arena-loading-heading"><span className="eyebrow">ĐẤU TRƯỜNG</span><h1 aria-live="polite">{stage==='found'?'Đã tìm được trận!':'Chuẩn bị xuất chiến'}</h1><p>Hai đội · Cùng cấp độ · Cùng một bộ luật</p></header>
   <LoadingTeam preview={preview} team="enemy"/>
   <div className="arena-versus" aria-hidden="true"><span/>VS<span/></div>
   <LoadingTeam preview={preview} team="party"/>
   <footer><div className="arena-load-progress" role="progressbar" aria-label="Chuẩn bị trận đấu" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{width:progress+'%'}}/></div><p>{stage==='found'?'Đối thủ đã sẵn sàng':`Đang chuẩn bị trận đấu · ${progress}%`}</p><small>Rời trận sau khi vào bàn đấu sẽ bị xử thua.</small></footer>
 </main>;
}
