"use client";
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useState} from 'react';
import {useGame} from '../runtime/game-context';
import {useRouteFilters} from './characters';
import {PageHeader,Icon,Modal,CurrencyAmount,ElementBadge,fmt} from './ui';
import {PartyLink} from './party-link';
import {trialMilestoneProgress} from '../core/unrecorded-rewards.js';
import {trialUpcomingWarning} from '../core/trial-warnings.js';
import {TRIAL_BOOK_NAME,TRIAL_LEVELS,trialSelection,trialDailyState,trialRewardPreview,trialMechanicText} from '../core/unrecorded-trials.js';
import {levelScaledEnemyStats} from '../core/enemy-scaling.js';
import {ELEMENT_NAMES} from '../core/content.js';
const groupLabels={common:'Điều kiện chung',specific:'Đặc trưng siêu trùm'};

export function UnrecordedTrialPage({id}:{id:string}){
 const {content,campaign,battle,busy,dailyNow,startBattle}=useGame(),router=useRouter();
 const [filters,setFilters]=useRouteFilters(),[confirm,setConfirm]=useState(false);
 const d=content.trials[id],encounter=content.encounters[d.encounterId];
 const conditions=Object.fromEntries(d.conditions.map((c:any)=>[c.id,[1,2,3].includes(Number(filters[c.id]))?Number(filters[c.id]):0]));
 const level=TRIAL_LEVELS.includes(Number(filters.level))?Number(filters.level):60;
 const selection=trialSelection(content,d.encounterId,{level,conditions}),now=new Date(dailyNow),daily=trialDailyState(campaign,now),reward=trialRewardPreview(campaign,selection,now);
 const milestones=trialMilestoneProgress(campaign);
 const group=filters.group==='specific'?'specific':'common',selected=d.conditions.filter((c:any)=>conditions[c.id]>0);
 const live=battle&&!battle.outcome,waiting=battle?.outcome==='victory'&&!battle.rewardClaimed;
 function launch(){setConfirm(false);if(startBattle(d.encounterId,undefined,level,{level,conditions:selection.conditions}))router.push('/battle');}
 function update(key:string,value:string){setFilters({...filters,[key]:value});}
 return <main className="page trial-page">
  <PageHeader title={TRIAL_BOOK_NAME} subtitle="Biên Niên Ký · Những lời thách thức không được ghi trong sử sách" back="/quests?tab=trial"><PartyLink className="button"><Icon name="party"/>Đội hình</PartyLink></PageHeader>
  <nav className="trial-stage-tabs" aria-label="Ba màn trong biên niên ký">{Object.values(content.trials).map((stage:any,i)=><Link key={stage.id} href={'/chronicles/unrecorded/'+stage.id} aria-current={stage.id===id?'page':undefined}><span>{String(i+1).padStart(2,'0')}</span>{stage.name}</Link>)}</nav>
  <section className="trial-intro"><img src={d.art} alt=""/><div><span className="trial-label">Siêu trùm · Điều kiện tùy chọn</span><h2>{d.name}</h2><p>{d.description}</p><div className="trial-level-line"><strong>Cấp đối thủ</strong><div className="quest-difficulty-buttons" aria-label="Cấp đối thủ">{TRIAL_LEVELS.map((n:number,i:number)=><button key={n} aria-pressed={level===n} onClick={()=>update('level',String(n))}>Cấp {n}<small>+{i*2} điểm</small></button>)}</div></div></div></section>
  {live&&<Link className="resume-link" href="/battle">Tiếp tục trận đang diễn ra →</Link>}
  {waiting&&<Link className="resume-link" href="/battle">Nhận thưởng trận vừa kết thúc trước khi bắt đầu trận mới →</Link>}
  <div className="trial-builder">
   <section className="trial-conditions" aria-label="Điều kiện thử thách">
    <div className="trial-group-tabs" role="group" aria-label="Nhóm điều kiện">{Object.entries(groupLabels).map(([key,label])=><button key={key} aria-pressed={group===key} onClick={()=>update('group',key)}>{label}<small>{d.conditions.filter((c:any)=>c.group===key&&conditions[c.id]).length} đã chọn</small></button>)}</div>
    <p className="trial-help">Mỗi điều kiện chọn một mức. Mức I / II / III cộng 1 / 2 / 3 điểm.</p>
    <div className="trial-condition-grid">{d.conditions.filter((c:any)=>c.group===group).map((c:any)=>{
     const tier=conditions[c.id];return <fieldset className={'trial-condition '+(tier?'chosen':'')} key={c.id}><legend>{c.name}</legend><div className="trial-tier-buttons" role="radiogroup" aria-label={c.name}>{[0,1,2,3].map(n=><button type="button" role="radio" aria-checked={tier===n} aria-label={c.name+' · '+(n?'Mức '+n:'Không chọn')} key={n} onClick={()=>update(c.id,String(n))}>{['—','I','II','III'][n]}<small>{n?'+'+n:'Bỏ'}</small></button>)}</div><p>{tier?c.tiers[tier-1].text:'Chưa áp dụng điều kiện này.'}</p></fieldset>;
    })}</div>
    <details className="trial-scout"><summary><Icon name="skull"/>Trinh sát chỉ số sau điều chỉnh</summary><div>{encounter.enemies.map((enemyId:string)=>{
     const enemy=content.enemies[enemyId],stats=levelScaledEnemyStats(enemy,level,content,1,encounter);
     for(const c of selected.filter((c:any)=>c.team==='enemy'))for(const [stat,factor]of Object.entries(c.tiers[conditions[c.id]-1].stats??{}))stats[stat]=Math.round(stats[stat]*(factor as number));
     return <article key={enemyId}><h3>{enemy.name}</h3><ElementBadge element={enemy.element}/><p>Yếu: {enemy.weaknesses.map((e:string)=>(ELEMENT_NAMES as any)[e]).join(' / ')}</p><dl>{[['maxHp','HP'],['maxMp','MP'],['attack','ATK'],['magic','MAG'],['defense','DEF'],['resistance','RES'],['speed','SPD']].map(([key,label])=><div key={key}><dt>{label}</dt><dd>{fmt(stats[key])}</dd></div>)}</dl><ul>{enemy.abilities.filter((value:string,index:number,array:string[])=>array.indexOf(value)===index).map((skill:string)=><li key={skill}>{content.abilities[skill].name}</li>)}</ul></article>;
    })}</div></details>
   </section>
   <aside className="trial-summary" aria-label="Tổng kết thử thách"><span className="trial-label">Điều kiện đã chọn</span><div className="trial-score" aria-live="polite"><strong>{selection.score}</strong><span>/ {selection.maxScore} điểm</span></div><div className="trial-score-track" role="progressbar" aria-label="Tổng điểm thử thách" aria-valuenow={selection.score} aria-valuemin={0} aria-valuemax={selection.maxScore}><span style={{width:selection.score/selection.maxScore*100+'%'}}/></div><p className="trial-best">Kỷ lục: {campaign.unrecordedLedger?.best?.[d.encounterId]??0} điểm</p>
    <ul className="trial-selected"><li><span>Cấp {level}</span><strong>+{TRIAL_LEVELS.indexOf(level)*2}</strong></li>{selected.map((c:any)=><li key={c.id}><span>{c.name} · {['','I','II','III'][conditions[c.id]]}</span><strong>+{conditions[c.id]}</strong></li>)}</ul>
    <section className="trial-reward"><h3>Thưởng chiến thắng</h3><CurrencyAmount kind="coin" amount={reward.coins}/><CurrencyAmount kind="pure" amount={reward.recruitmentShards}/><p>{daily.remaining===0?'Đã nhận đủ Pure Prisma hôm nay. Vẫn nhận Coin khi thắng.':`Còn ${daily.remaining}/30 Pure Prisma hôm nay, dùng chung ba màn.`}</p><small>Làm mới lúc 00:00 giờ Việt Nam. Thua hoặc hòa không nhận thưởng. Không cấp EXP.</small></section>
    <section className="trial-milestones" aria-label="Phần thưởng Remulia"><h3>Thiếu nữ của khúc ca</h3><ul><li>Hoàn thành cả ba màn: Remulia · {milestones.wins}/3</li><li>Mỗi màn từ 12 điểm: thêm một ô trang bị Remulia · {milestones.slots}/3</li><li>Một màn từ 22 điểm: công thức Âm Thoa Thất Truyền · {milestones.recipe?'Đã mở':'Chưa đạt'}</li></ul></section>
    <details><summary>Mốc Pure Prisma</summary><dl className="trial-reward-tiers">{[[8,6],[12,12],[16,20],[19,25],[22,30]].map(([points,n])=><div key={points}><dt>Từ {points} điểm</dt><dd>{n} Pure Prisma</dd></div>)}</dl><p>Thưởng mỗi lần thắng, giới hạn tổng 30/ngày.</p></details>
    <button className="gold trial-enter" disabled={busy||Boolean(waiting)} onClick={()=>setConfirm(true)}><Icon name="sword"/>Bắt đầu thử thách</button><button className="trial-reset" onClick={()=>setFilters({level:'60',group})}>Bỏ các điều kiện</button>
   </aside>
  </div>
  {confirm&&<Modal title="Bước vào trang sử bị lãng quên?" onClose={()=>setConfirm(false)} footer={<><button onClick={()=>setConfirm(false)}>Chưa sẵn sàng</button><button className="gold" disabled={busy} onClick={launch}>Đi vào</button></>}><h3>{d.name} · Cấp {level}</h3><p>{selection.score}/{selection.maxScore} điểm · {selected.length} điều kiện bổ sung.</p><p>Thắng: 1.000 Coin và tối đa {reward.recruitmentShards} Pure Prisma theo hạn mức còn lại lúc nhận thưởng.</p><p>Điều kiện được giữ nguyên suốt trận. Không farm lặp lại tự động.</p>{live&&<p className="warning">Đang có trận chưa kết thúc. Bạn sẽ được hỏi xác nhận trước khi thay trận đó.</p>}</Modal>}
 </main>;
}

export function TrialCombatNotice(){
 const {battle,content}=useGame();if(!battle?.trial)return null;
 const current={...battle,content},upcoming=trialUpcomingWarning(current),alert=battle.trial.alerts?.at(-1);
 return <section className="trial-combat-notice" aria-label="Cơ chế siêu trùm"><strong><Icon name="skull"/>{battle.trial.selection.score} điểm thử thách</strong>{!upcoming&&<p>{trialMechanicText(current)}</p>}{upcoming&&<div className="trial-mechanic-upcoming"><strong>Sắp diễn ra</strong><p>{upcoming}</p></div>}{alert&&<div className={'trial-mechanic-alert '+alert.kind} key={alert.id} role={alert.kind==='warning'?'alert':'status'}><strong>{alert.title}</strong><p>{alert.text}</p><small>Vòng {alert.round}</small></div>}<details><summary>Điều kiện đang áp dụng</summary><ul>{battle.trial.definition.conditions.filter((c:any)=>battle.trial.selection.conditions[c.id]).map((c:any)=><li key={c.id}>{c.name}: {c.tiers[battle.trial.selection.conditions[c.id]-1].text}</li>)}</ul></details></section>;
}
