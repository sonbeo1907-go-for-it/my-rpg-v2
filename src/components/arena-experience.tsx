"use client";
import {useEffect,useState,useRef} from 'react';
import {useRouter} from 'next/navigation';
import {useGame} from '../runtime/game-context';
import {arenaIdentity} from '../core/arena-identity.js';
import {arenaTier} from '../core/arena-progression.js';
import {ArenaDraft} from './arena-draft';
import {nextArenaSeed} from '../core/arena-identity.js';
import {ARENA_PACING,arenaLoadDuration} from '../ui/arena-experience.js';
import {Icon,Modal} from './ui';

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
export function ArenaMatchFlow({onCancel,mode='normal'}:{onCancel:()=>void;mode?:string}){
 const {content,campaign,activeProfile,battle,reserveCompetition,beginCompetition,abandonCompetition,busy}=useGame(),router=useRouter();
 const [stage,setStage]=useState('searching'),[pending,setPending]=useState<any>(null),[progress,setProgress]=useState(0),[error,setError]=useState(''),[leave,setLeave]=useState(false);
 const startRef=useRef(beginCompetition);startRef.current=beginCompetition;
 const reserveRef=useRef(reserveCompetition);reserveRef.current=reserveCompetition;
 const [loading,setLoading]=useState<any>(null);
 useEffect(()=>{
  let cancelled=false;const seed=nextArenaSeed(battle?.arena?.seed,crypto.getRandomValues(new Uint32Array(1))[0]);
  const match={id:crypto.randomUUID(),seed,mode,...arenaIdentity(seed,activeProfile?.username??'Người lữ hành')};
  const timer=setTimeout(async()=>{
   try{if(!await reserveRef.current(match)){if(!cancelled){setError('Chưa thể lưu trận mới. Hãy kiểm tra trận đang dở hoặc thử lại.');setStage('error');}return;}if(cancelled)return;
    setPending({...match,rankAtEntry:arenaTier(content,campaign.arenaProgress?.rating??0).id});setStage('found');
   }catch{if(!cancelled){setError('Không thể chuẩn bị trận đấu. Vui lòng thử lại.');setStage('error');}}
  },ARENA_PACING.search);return()=>{cancelled=true;clearTimeout(timer);};
 },[]);
 useEffect(()=>{if(stage!=='found')return;const timer=setTimeout(()=>{if(mode==='ranked')setStage('draft');else{setStage('loading');setLoading({});}},ARENA_PACING.found);return()=>clearTimeout(timer);},[stage,mode]);
 useEffect(()=>{
  if(stage!=='loading'||!pending||!loading)return;
  const begun=Date.now(),duration=arenaLoadDuration(pending.seed),interval=setInterval(()=>setProgress(Math.min(99,Math.round((Date.now()-begun)/duration*100))),100);
  const timer=setTimeout(()=>{clearInterval(interval);if(startRef.current(loading.draft,loading.party)){setProgress(100);router.replace('/battle');}else{setError('Không thể vào trận. Hãy rời trận để lưu kết quả rồi thử lại.');setStage('error');}},duration);
  return()=>{clearTimeout(timer);clearInterval(interval);};
 },[stage,loading,pending]);
 async function cancel(){if(await abandonCompetition())onCancel();}
 const confirmLeave=<Modal title="Rời trận Đấu Trường?" onClose={()=>setLeave(false)} footer={<><button onClick={()=>setLeave(false)}>Ở lại</button><button className="danger" disabled={busy} onClick={cancel}>Rời trận · Xử thua</button></>}><p>Rời sau khi đã tìm được đối thủ sẽ tính là thua. Bạn không nhận Danh Dự cho trận này.</p></Modal>;
 if(stage==='draft')return <><ArenaDraft pending={pending} onReady={(draft,party)=>{setLoading({draft,party});setProgress(0);setStage('loading');}} onLeave={()=>setLeave(true)}/>{leave&&confirmLeave}</>;
 if(stage==='searching'||stage==='error')return <main className="page arena-search-screen"><div className="arena-search-emblem" aria-hidden="true"><Icon name={stage==='error'?'shield':'sword'}/></div><span className="eyebrow">ĐẤU TRƯỜNG · {mode==='ranked'?'ĐẤU HẠNG':'ĐẤU THƯỜNG'}</span><h1>{stage==='error'?'Chưa thể xuất chiến':'Đang tìm đối thủ…'}</h1><p role="status">{error||'Những ngọn đèn trên võ đài đang được thắp sáng.'}</p><button disabled={busy} onClick={()=>pending?setLeave(true):onCancel()}>{stage==='error'?'Trở về':'Hủy tìm trận'}</button>{leave&&confirmLeave}</main>;
 return <main className="arena-cinematic" data-match-stage={stage}><img className="arena-cinematic-art" src="/art/arena-match.svg" alt=""/><div className="arena-cinematic-grain"/><header><span className="eyebrow">{mode==='ranked'?'ĐẤU HẠNG · '+arenaTier(content,campaign.arenaProgress?.rating??0).name:'ĐẤU THƯỜNG'}</span><h1 aria-live="polite">{stage==='found'?'Đã tìm được trận!':'Võ đài đã sẵn sàng'}</h1></header><section className="arena-name-duel" aria-label="Hai người tham gia"><div className="party"><span className="arena-duel-crest"><Icon name="shield"/></span><span className="eyebrow">NGƯỜI CHƠI</span><h2>{pending.playerName}</h2></div><strong className="arena-duel-vs" aria-hidden="true">VS</strong><div className="enemy"><span className="arena-duel-crest"><Icon name="sword"/></span><span className="eyebrow">ĐỐI THỦ</span><h2>{pending.opponentName}</h2></div></section><footer><div className="arena-load-progress" role="progressbar" aria-label="Chuẩn bị trận đấu" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{width:progress+'%'}}/></div><p>{stage==='found'?(mode==='ranked'?'Tiếp theo: chọn và cấm nhân vật.':'Đối thủ đã sẵn sàng.'):`Đang chuẩn bị trận đấu · ${progress}%`}</p><small>Rời trận sau khi tìm được đối thủ sẽ bị xử thua.</small></footer></main>;
}
