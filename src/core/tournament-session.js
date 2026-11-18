import {claimAcademyClark} from './academy-enrollment.js';
import {emptyAcademyWallet,normalizeAcademyWallet,settleAcademyRewards} from './academy-event-economy.js';
import {selectAcademySpecial,revealAcademySpecial,validateAcademySpecial} from './academy-special.js';
import {academySpecialKits} from './academy-special-content.js';
import {prepareTournamentRegistration,validateRegisteredRun} from './tournament-registration.js';
import {tournamentStoryEntries} from './tournament-story.js';
import {selectTournamentParticipants,validateTournamentParticipants} from './tournament-pool.js';
import {drawTournamentGroups,groupFixtures,tournamentShuffle,tournamentStandings,simulateTournamentMatch} from './tournament-schedule.js';
export const emptyTournamentState=()=>({version:1,rulesAccepted:false,rewardClaims:[],nextRunNumber:1,revision:0,firstClear:false,activeRun:null,history:[],completedRuns:0,championships:0,firstRewardClaims:[],bestPlacement:null,wallet:emptyAcademyWallet()});
const object=x=>Boolean(x&&typeof x==='object'&&!Array.isArray(x));
const integer=x=>Number.isSafeInteger(x)&&x>=0;
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function resultValid(match,r){return object(r)&&match.teams.includes(r.winnerId)&&Array.isArray(r.survivors)&&r.survivors.length===2&&r.survivors.every(x=>Number.isInteger(x)&&x>=0&&x<=4)&&r.survivors[match.teams.indexOf(r.winnerId)]>0&&['player','simulation'].includes(r.source);}
function mutate(campaign,runId,revision){const next=structuredClone(campaign),s=next.tournaments??=emptyTournamentState();if(s.revision!==revision||s.revision>=Number.MAX_SAFE_INTEGER||s.activeRun?.runId!==runId||s.activeRun.outcome)throw Error('Giải đấu đã thay đổi. Hãy mở lại.');s.revision++;return next;}
function snapshot(content,d,participants){
 const teams=Object.fromEntries(participants.map(id=>[id,content.tournamentTeams[id]])),builds=Object.fromEntries([...new Set(Object.values(teams).flatMap(t=>t.members.map(m=>m.buildId)))].map(id=>[id,content.tournamentBuilds[id]]));
 const characters=Object.fromEntries([...new Set(Object.values(builds).map(b=>b.templateCharacterId))].map(id=>[id,content.characters[id]]));
 return structuredClone({definition:d,teams,builds,rewards:Object.fromEntries(d.rewardIds.map(id=>[id,content.tournamentRewards[id]])),specialKits:academySpecialKits(),scenes:Object.fromEntries(d.sceneIds.map(id=>[id,content.tournamentScenes[id]])),kits:{characters,abilities:content.abilities,statuses:content.statuses,upgrades:content.upgrades,economy:content.economy,gearTypes:content.gearTypes,progressionRules:content.progressionRules,gearEffects:content.gearEffects,exclusiveGear:content.exclusiveGear,pvpAiProfiles:content.pvpAiProfiles}});
}
/** @param {any} campaign @param {any} content @param {{revision:number,seed:string,tournamentId?:string,teamName?:string,roster?:string[]}} options */
export function beginTournament(campaign,content,{revision,seed,tournamentId='academy_tournament',teamName,roster}={}){
 const next=structuredClone(campaign),s=next.tournaments??=emptyTournamentState(),d=content.tournaments[tournamentId];
 if(!s.rulesAccepted)throw Error('Hãy đọc và xác nhận Luật giải trước khi đăng ký.');
 if(!d||s.revision!==revision||s.nextRunNumber>=Number.MAX_SAFE_INTEGER||s.revision>=Number.MAX_SAFE_INTEGER||s.activeRun&&!s.activeRun.outcome||typeof seed!=='string'||!seed.trim()||seed.length>128)throw Error('Không thể bắt đầu giải đấu.');
 const registration=prepareTournamentRegistration(campaign,content,d,{teamName,roster});
 const prepared=registration?{...content,tournamentTeams:{...content.tournamentTeams,[d.playerTeamId]:registration.team},tournamentBuilds:{...content.tournamentBuilds,...registration.builds}}:content;
 const number=s.nextRunNumber++,runId='academy-run-'+number,drawSeed=s.firstClear?seed+':draw:'+number:d.selection.introduction.drawSeed;
 const participants=selectTournamentParticipants(d,prepared.tournamentTeams,{firstClear:s.firstClear,drawSeed});
 const seeds={draw:drawSeed,simulation:seed+':simulation:'+number,combat:seed+':combat:'+number,encounter:seed+':encounter:'+number};
 const snap=snapshot(prepared,d,participants);if(registration)snap.accountCampaign=registration.loadout;const groups=drawTournamentGroups(d,snap.teams,participants,drawSeed,!s.firstClear);
 s.activeRun={runId,number,tournamentId,rulesetVersion:d.rulesetVersion,firstClearAtCreation:s.firstClear,seeds,participantTeamIds:participants,snapshot:snap,...(registration?{registration:{mode:'account',teamName:registration.teamName,characterIds:registration.characterIds}}:{}),rewardReceipts:[],specialEncounter:selectAcademySpecial(d,s.firstClear,seeds.encounter),storyReadKeys:[],groups,fixtures:groupFixtures(groups),phase:'group',round:1,lineup:snap.teams[d.playerTeamId].members.slice(0,4).map(m=>m.id),seenSceneIds:[],battleCheckpoint:null,pendingResult:null,qualified:null,tieTasks:[],outcome:null,reason:null,placement:null};
 s.revision++;return next;
}
export function currentTournamentMatches(run){if(!run||run.outcome)return [];return run.fixtures.filter(m=>m.phase===run.phase&&m.round===run.round);}
export function currentTournamentPlayerMatch(run){const player=run?.snapshot.definition.playerTeamId;return currentTournamentMatches(run).find(m=>m.teams.includes(player)&&!m.result)??null;}
export function tournamentCombatSeed(run,matchId){if(!run.fixtures.some(m=>m.id===matchId))throw Error('Trận đấu không tồn tại.');return run.seeds.combat+':'+matchId;}
export function arrangeTournament(campaign,{runId,revision,lineup}){const next=mutate(campaign,runId,revision),run=next.tournaments.activeRun,ids=run.snapshot.teams[run.snapshot.definition.playerTeamId].members.map(m=>m.id);if(run.specialEncounter?.status==='active'||run.battleCheckpoint||run.pendingResult||!Array.isArray(lineup)||lineup.length!==4||new Set(lineup).size!==4||lineup.some(id=>!ids.includes(id)))throw Error('Đội hình giải đấu không hợp lệ.');run.lineup=[...lineup];return next;}
export function checkpointTournament(campaign,{runId,revision,matchId,checkpoint}){const next=mutate(campaign,runId,revision),run=next.tournaments.activeRun;if(run.specialEncounter?.status==='active'||run.pendingResult||currentTournamentPlayerMatch(run)?.id!==matchId||!object(checkpoint)||JSON.stringify(checkpoint).length>2_000_000)throw Error('Không thể lưu trận đấu này.');run.battleCheckpoint={matchId,seed:tournamentCombatSeed(run,matchId),data:structuredClone(checkpoint)};return next;}
export function proposeTournamentResult(campaign,{runId,revision,matchId,winnerId,survivors}){const next=mutate(campaign,runId,revision),run=next.tournaments.activeRun,m=currentTournamentPlayerMatch(run),result={winnerId,survivors,source:'player'};if(run.specialEncounter?.status==='active'||run.pendingResult||m?.id!==matchId||!resultValid(m,result))throw Error('Kết quả trận đấu không hợp lệ.');run.pendingResult={matchId,result:structuredClone(result)};return next;}
export function retryTournamentMatch(campaign,{runId,revision}){const next=mutate(campaign,runId,revision),r=next.tournaments.activeRun;if(!r.pendingResult||r.pendingResult.result.winnerId===r.snapshot.definition.playerTeamId)throw Error('Không có trận thua để thử lại.');r.pendingResult=null;r.battleCheckpoint=null;return next;}
function end(s,outcome,reason,placement){const r=s.activeRun;r.outcome=outcome;r.reason=reason;r.placement=placement;r.pendingResult=null;r.battleCheckpoint=null;if(r.specialEncounter&&['waiting','available','active'].includes(r.specialEncounter.status)){r.specialEncounter.status='declined';r.specialEncounter.checkpoint=null;r.specialEncounter.pendingOutcome=null;}s.completedRuns++;if(outcome==='champion'){s.firstClear=true;s.championships++;}if(placement!==null)s.bestPlacement=Math.min(s.bestPlacement??placement,placement);s.history=[{runId:r.runId,rulesetVersion:r.rulesetVersion,outcome,reason,placement},...s.history].slice(0,20);}
function seedKnockout(run){const d=run.snapshot.definition,bracket=d.knockout.bracket.filter(m=>m.round==='quarterfinal');run.phase='quarterfinal';run.round=1;for(const m of bracket)run.fixtures.push({id:m.id,phase:m.round,round:1,teams:m.slots.map(slot=>run.qualified[slot.group][slot.position-1]),result:null});}
function prepareTies(run){run.qualified={};run.tieTasks=[];
 for(const group of ['A','B','C','D']){const rows=tournamentStandings(run,group);run.qualified[group]=rows.map(r=>r.teamId);
  for(let i=0;i<rows.length;){let j=i+1;while(j<rows.length&&rows[j].points===rows[i].points&&rows[j].headToHead===rows[i].headToHead&&rows[j].survivorDifference===rows[i].survivorDifference)j++;
   if(j-i>1&&i<2)run.tieTasks.push({group,start:i,queue:tournamentShuffle(rows.slice(i,j).map(r=>r.teamId),run.seeds.draw+':tie:'+group+':'+i),losers:[],matchIds:[]});i=j;
  }
 }
}
function nextTie(run){
 const task=run.tieTasks.find(t=>t.queue.length>1);
 if(!task)return false;
 const m={id:'playoff-'+task.group+'-'+task.start+'-'+task.matchIds.length,phase:'playoff',round:run.fixtures.filter(m=>m.phase==='playoff').length+1,group:task.group,teams:task.queue.slice(0,2),result:null};task.matchIds.push(m.id);run.fixtures.push(m);run.phase='playoff';run.round=m.round;return true;
}
function advance(s){const r=s.activeRun,player=r.snapshot.definition.playerTeamId;
 while(!r.outcome){const matches=currentTournamentMatches(r);if(matches.some(m=>m.teams.includes(player)&&!m.result))return;
  for(const m of matches)if(!m.result)m.result=simulateTournamentMatch(r,m);
  if(r.phase==='group'){
   if(r.round<3){r.round++;continue;}prepareTies(r);if(nextTie(r))continue;
  }else if(r.phase==='playoff'){
   const m=matches[0],t=r.tieTasks.find(t=>t.matchIds.includes(m.id));t.queue.splice(0,2);t.queue.push(m.result.winnerId);t.losers.push(m.teams.find(id=>id!==m.result.winnerId));
   if(t.queue.length===1)r.qualified[t.group].splice(t.start,t.losers.length+1,t.queue[0],...t.losers.slice().reverse());
   if(nextTie(r))continue;
  }else{
   const pm=matches.find(m=>m.teams.includes(player));if(pm&&pm.result.winnerId!==player){end(s,'eliminated','knockout_loss',r.phase==='quarterfinal'?8:r.phase==='semifinal'?4:2);return;}
   if(r.phase==='final'){end(s,'champion','champion',1);return;}
   const target=r.phase==='quarterfinal'?'semifinal':'final',rules=r.snapshot.definition.knockout.bracket.filter(m=>m.round===target);r.phase=target;r.round=1;
   for(const m of rules)r.fixtures.push({id:m.id,phase:target,round:1,teams:m.slots.map(slot=>r.fixtures.find(x=>x.id===slot.winnerOf).result.winnerId),result:null});continue;
  }
  if(!Object.values(r.qualified).some(ids=>ids.slice(0,2).includes(player))){end(s,'eliminated','group_exit',16);return;}seedKnockout(r);
 }
}
export function confirmTournamentResult(campaign,{runId,revision}){const next=mutate(campaign,runId,revision),s=next.tournaments,r=s.activeRun,p=r.pendingResult,m=currentTournamentPlayerMatch(r);if(!p||p.matchId!==m?.id||!resultValid(m,p.result))throw Error('Không có kết quả chờ xác nhận.');m.result=p.result;r.pendingResult=null;r.battleCheckpoint=null;advance(s);settleAcademyRewards(s,r,m);revealAcademySpecial(r);return claimAcademyClark(next);}
export function withdrawTournament(campaign,{runId,revision}){const next=mutate(campaign,runId,revision);end(next.tournaments,'eliminated','withdrawn',null);return next;}
export function visibleTournamentFixtures(run){return structuredClone(run.fixtures.filter(m=>m.result||m.phase===run.phase&&m.round===run.round));}
export function normalizeTournamentState(input){
 if(input===undefined)return emptyTournamentState();const s=structuredClone(input),fail=()=>{throw Error('Dữ liệu giải đấu học viện không hợp lệ.');};
 if(!object(s)||s.version!==1||!integer(s.nextRunNumber)||s.nextRunNumber<1||!integer(s.revision)||typeof s.firstClear!=='boolean'||!integer(s.completedRuns)||!integer(s.championships)||s.championships>s.completedRuns||s.firstClear!==(s.championships>0)||!Array.isArray(s.history)||s.history.length>20||!Array.isArray(s.firstRewardClaims)||s.firstRewardClaims.some(x=>typeof x!=='string')||new Set(s.firstRewardClaims).size!==s.firstRewardClaims.length||s.bestPlacement!==null&&![1,2,4,8,16].includes(s.bestPlacement))fail();
 if(s.history.length>Math.min(s.completedRuns,20)||s.completedRuns>=s.nextRunNumber||s.history.some(h=>!object(h)||!['champion','eliminated'].includes(h.outcome)||typeof h.runId!=='string')||new Set(s.history.map(h=>h.runId)).size!==s.history.length||!s.firstClear&&s.history.some(h=>h.outcome==='champion'))fail();
 s.rulesAccepted??=false;s.rewardClaims??=[];if(typeof s.rulesAccepted!=='boolean'||!Array.isArray(s.rewardClaims)||new Set(s.rewardClaims).size!==s.rewardClaims.length||s.rewardClaims.some(k=>!['luka','clark'].includes(k)))fail();
 s.wallet=normalizeAcademyWallet(s.wallet);
 const r=s.activeRun;if(r===null)return s;
 try{
  if(!object(r)||!integer(r.number)||r.number<1||r.number>=s.nextRunNumber||r.runId!=='academy-run-'+r.number||!object(r.snapshot)||!object(r.snapshot.definition)||r.rulesetVersion!==r.snapshot.definition.rulesetVersion||r.tournamentId!==r.snapshot.definition.id||typeof r.firstClearAtCreation!=='boolean'||r.firstClearAtCreation&&!s.firstClear)fail();
  const d=r.snapshot.definition;if(d.schemaVersion!==2||!['data_only','playtest'].includes(d.publication)||!object(r.snapshot.teams)||!object(r.snapshot.builds)||!object(r.snapshot.kits?.abilities)||!object(r.snapshot.kits?.statuses)||validateTournamentParticipants(d,r.snapshot.teams,r.participantTeamIds,r.firstClearAtCreation?null:4).length)fail();
  for(const t of Object.values(r.snapshot.teams))for(const m of t.members)if(!r.snapshot.builds[m.buildId]||!r.snapshot.kits.characters[r.snapshot.builds[m.buildId].templateCharacterId])fail();
  if(r.firstClearAtCreation&&![1,2].includes(r.participantTeamIds.filter(id=>r.snapshot.teams[id].narrativeRole==='key').length)||!r.firstClearAtCreation&&!eq(r.participantTeamIds,d.selection.introduction.participantTeamIds))fail();
  if(!object(r.seeds)||['draw','simulation','combat','encounter'].some(k=>typeof r.seeds[k]!=='string'||!r.seeds[k])||!r.firstClearAtCreation&&r.seeds.draw!==d.selection.introduction.drawSeed)fail();
  const groups=drawTournamentGroups(d,r.snapshot.teams,r.participantTeamIds,r.seeds.draw,!r.firstClearAtCreation);if(!eq(groups,r.groups)||!Array.isArray(r.fixtures)||r.fixtures.length>64||new Set(r.fixtures.map(m=>m.id)).size!==r.fixtures.length)fail();
  const initial=groupFixtures(groups);for(let i=0;i<24;i++){const m=r.fixtures[i];if(!m||!eq({...m,result:null},initial[i])||m.result&&!resultValid(m,m.result))fail();}
  for(const m of r.fixtures)if(!object(m)||!Array.isArray(m.teams)||m.teams.length!==2||m.teams[0]===m.teams[1]||m.teams.some(id=>!r.participantTeamIds.includes(id))||m.result&&!resultValid(m,m.result))fail();
  if(!['group','playoff','quarterfinal','semifinal','final'].includes(r.phase)||!integer(r.round)||r.round<1||!Array.isArray(r.tieTasks)||!Array.isArray(r.lineup)||r.lineup.length!==4||new Set(r.lineup).size!==4||r.lineup.some(id=>!r.snapshot.teams[d.playerTeamId].members.some(m=>m.id===id))||!Array.isArray(r.seenSceneIds)||r.seenSceneIds.some(id=>!d.sceneIds.includes(id)))fail();
  if(r.outcome!==null&&!['champion','eliminated'].includes(r.outcome)||r.outcome==='champion'&&!s.firstClear||r.outcome&&!s.history.some(h=>h.runId===r.runId&&h.outcome===r.outcome))fail();
  validateRegisteredRun(r,fail);validateAcademySpecial(r,fail);
  if(r.rewardReceipts!==undefined&&(!Array.isArray(r.rewardReceipts)||r.rewardReceipts.length>80||new Set(r.rewardReceipts.map(x=>x.key)).size!==r.rewardReceipts.length||r.rewardReceipts.some(x=>typeof x.key!=='string'||!integer(x.amount)||x.amount<1)))fail();
  if(r.storyReadKeys!==undefined&&(!Array.isArray(r.storyReadKeys)||new Set(r.storyReadKeys).size!==r.storyReadKeys.length||r.storyReadKeys.some(key=>!tournamentStoryEntries(r).some(e=>e.key===key))))fail();
  // Reconstruct all published fixtures from committed player results. This rejects
  // invented NPC results, premature round advances and malformed tie/bracket state.
  const replay=structuredClone(r);replay.fixtures=groupFixtures(groups);replay.phase='group';replay.round=1;replay.qualified=null;replay.tieTasks=[];replay.outcome=null;replay.reason=null;replay.placement=null;replay.pendingResult=null;replay.battleCheckpoint=null;
  const ledger={activeRun:replay,firstClear:r.firstClearAtCreation,history:[],bestPlacement:null,completedRuns:0,championships:0};
  for(let step=0;step<64&&!replay.outcome;step++){
   const current=currentTournamentPlayerMatch(replay);if(!current)fail();
   const saved=r.fixtures.find(m=>m.id===current.id);if(!saved?.result)break;
   if(saved.result.source!=='player')fail();current.result=structuredClone(saved.result);advance(ledger);
  }
  if(r.reason==='withdrawn'&&!replay.outcome)end(ledger,'eliminated','withdrawn',null);
  for(const key of ['fixtures','phase','round','qualified','tieTasks','outcome','reason','placement'])if(!eq(replay[key],r[key]))fail();
  const match=currentTournamentPlayerMatch(r);if(r.pendingResult!==null&&(!match||r.pendingResult.matchId!==match.id||!resultValid(match,r.pendingResult.result)))fail();
  if(r.battleCheckpoint!==null&&(!match||r.battleCheckpoint.matchId!==match.id||r.battleCheckpoint.seed!==tournamentCombatSeed(r,match.id)||!object(r.battleCheckpoint.data)||JSON.stringify(r.battleCheckpoint).length>2_001_000))fail();
 }catch{fail();}return s;
}
