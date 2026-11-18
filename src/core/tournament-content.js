import {validateTournamentPool} from './tournament-pool.js';
import {normalizeLevelState,allocationSpent} from './leveling.js';
import {skillRankCap,skillRules} from './skill-rules.js';
import {FIRST_CLEAR_CURRENCIES} from './first-clear-labels.js';

// Definitions only. Schedule generation, run saves, battle adapters and payouts are later steps.
const record=x=>Boolean(x&&typeof x==='object'&&!Array.isArray(x));
const text=x=>typeof x==='string'&&x.trim().length>0;
const whole=(x,min,max)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
const unique=x=>Array.isArray(x)&&x.every(text)&&new Set(x).size===x.length;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const includes=(array,id)=>Array.isArray(array)&&array.includes(id);
export const TOURNAMENT_COLLECTIONS=['tournaments','tournamentTeams','tournamentBuilds','tournamentScenes','tournamentRewards'];
export function validateTournamentContent(content){
 const errors=[],fail=x=>errors.push('Tournament: '+x),maps={};
 for(const key of TOURNAMENT_COLLECTIONS){const value=content[key];if(!record(value)||!Object.keys(value).length){fail('missing '+key);maps[key]={};}else maps[key]=value;
  for(const [id,row]of Object.entries(maps[key]))if(!record(row)||row.id!==id||!text(row.name))fail(key+' invalid row '+id);
 }
 if(errors.length)return errors;
 const {tournaments, tournamentTeams:teams,tournamentBuilds:builds,tournamentScenes:scenes,tournamentRewards:rewards}=maps;
 for(const b of Object.values(builds)){
  const source=content.characters?.[b.templateCharacterId];
  if(!source||source.affiliation!=='magic_academy')fail(b.id+': unknown academy template');
  if(!whole(b.level,1,50)||!whole(b.skillRank,1,5)||!whole(b.basicRank,1,5)||b.mastery!==0||b.duplicateCount!==0||!same(b.upgradeIds,[])||b.exclusiveGear!==null||b.tuningStatus!=='playtest')fail(b.id+': invalid trial normalization');
  try{normalizeLevelState(content,{level:b.level,xp:0,limitBreakRank:b.limitBreakRank,skillRanks:{basic:b.basicRank},upgradeIds:b.upgradeIds,allocations:b.allocations});if(b.skillRank>skillRankCap(b.level,skillRules(content)))fail(b.id+': skill Rank exceeds level');}catch{fail(b.id+': invalid level or allocations');}
  if(b.aiProfileId!=='generic'&&(!content.pvpAiProfiles?.[b.aiProfileId]||b.aiProfileId!==b.templateCharacterId))fail(b.id+': unknown AI profile');
  if(!Array.isArray(b.equipment)||!b.equipment.length||b.equipment.length>6)fail(b.id+': invalid number of trial gear pieces');
  else for(const gear of b.equipment){const type=content.gearTypes?.[gear?.typeId];if(!record(gear)||!['t1','t2','t3_focused','t3_dual'].includes(gear.typeId)||!type||!record(gear.bonuses)||Object.keys(gear.bonuses).length!==type.statCount){fail(b.id+': invalid trial gear');continue;}
   for(const [key,n]of Object.entries(gear.bonuses)){const stat=content.economy.default.gearStats.find(s=>s.stat===key);if(!stat||n!==type.points*stat.scale)fail(b.id+': invalid gear stat '+key);}
  }
 }
 const memberIds=new Set();
 for(const team of Object.values(teams)){
  if(!tournaments[team.tournamentId]||!['player','ai'].includes(team.controller)||!whole(team.seedPot,1,4)||!whole(team.simulationRating,1,1000)||!text(team.description))fail(team.id+': invalid team metadata');
  if(!record(team.visual)||!text(team.visual.motif)||!Array.isArray(team.visual.palette)||team.visual.palette.length!==3||team.visual.palette.some(c=>typeof c!=='string'||!/^#[0-9A-Fa-f]{6}$/.test(c)))fail(team.id+': invalid visual brief');
  const roster=team.controller==='player'?6:4;
  if(!Array.isArray(team.members)||team.members.length!==roster){fail(team.id+': invalid roster size');continue;}
  const sources=new Set();
  for(const member of team.members){const build=builds[member?.buildId];if(!record(member)||!text(member.id)||!text(member.name)||memberIds.has(member.id)||!build||!record(member.identity)){fail(team.id+': invalid member');continue;}
   memberIds.add(member.id);if(sources.has(build.templateCharacterId))fail(team.id+': duplicate kit in one team');sources.add(build.templateCharacterId);
   if(team.controller==='player'&&!content.characters[build.templateCharacterId]?.tags?.includes('class_7a'))fail(team.id+': player loan is not class 7A');
  }
 }
 for(const scene of Object.values(scenes))if(!tournaments[scene.tournamentId]||!['registration','opening','group_before','interval','knockout_before','ending'].includes(scene.phase)||scene.draft!==true||!Array.isArray(scene.paragraphs)||!scene.paragraphs.length||scene.paragraphs.some(p=>!text(p)))fail(scene.id+': invalid scene');
 for(const reward of Object.values(rewards)){
  if(!tournaments[reward.tournamentId]||!['qualified','finalist','champion'].includes(reward.trigger)||reward.scope!=='first_ever'||!Array.isArray(reward.rewards)||!reward.rewards.length){fail(reward.id+': invalid reward milestone');continue;}
  for(const r of reward.rewards)if(!record(r)||r.type!=='currency'||!FIRST_CLEAR_CURRENCIES.includes(r.currency)||!whole(r.amount,1,100000))fail(reward.id+': invalid reward currency');
 }
 for(const d of Object.values(tournaments)){
  if(d.schemaVersion!==2||!/^academy-\d+\.\d+\.\d+$/.test(d.rulesetVersion)||!text(d.bookId)||content.chronicles?.[d.bookId]||d.publication!=='data_only'||d.enabled!==false||!text(d.description))fail(d.id+': unpublished definition required');
  const poolErrors=validateTournamentPool(d,teams,builds,content.characters);poolErrors.forEach(fail);
  if(poolErrors.length)continue;
  const members=d.candidateTeamIds.map(id=>teams[id]);
  const normalization=d.trialRules;
  if(!record(normalization)||!whole(normalization.level,1,50)||!whole(normalization.skillRank,1,5)||!whole(normalization.basicRank,1,5)||normalization.duplicateCount!==0||normalization.gearSlots!==3||!unique(normalization.allowedGearTypes)||!normalization.allowedGearTypes.length||normalization.allowedGearTypes.some(id=>!['t1','t2','t3_focused','t3_dual'].includes(id))||normalization.mastery!==false||normalization.exclusiveGear!==false||normalization.storyUpgrades!==false||normalization.requireFullAllocation!==true)fail(d.id+': invalid trial normalization policy');
  else for(const buildId of new Set(members.flatMap(t=>t.members??[]).map(m=>m?.buildId))){const b=builds[buildId];if(!b)continue;
   if(b.level!==normalization.level||b.skillRank!==normalization.skillRank||b.basicRank!==normalization.basicRank||b.duplicateCount!==normalization.duplicateCount||!Array.isArray(b.equipment)||b.equipment.length!==normalization.gearSlots||b.equipment.some(g=>!normalization.allowedGearTypes.includes(g?.typeId))||!record(b.allocations)||Object.keys(b.allocations).some(key=>!Object.hasOwn(content.progressionRules.default.allocations,key))||allocationSpent(content,b.allocations)!==b.level-1)fail(d.id+': build differs from common normalization '+buildId);
  }
  const entry=d.entry,reg=d.registration,g=d.groupStage;
  if(!record(entry)||entry.requiresOwnership!==false||entry.fee!==0||!same(entry.requires,[]))fail(d.id+': entry must not require ownership/payment');
  if(!record(reg)||reg.activeSize!==4||reg.playerRosterSize!==6||reg.opponentRosterSize!==4||reg.allowSubstitutionBetweenMatches!==true||reg.allowEquipmentEditing!==false||reg.banPick!==false)fail(d.id+': invalid registration');
  if(!record(g)||!same(g.labels,['A','B','C','D'])||g.size!==4||g.qualifiersPerGroup!==2||g.format!=='single_round_robin'||g.rounds!==3||!same(g.points,{win:3,loss:0})||!same(g.tiebreakers,['head_to_head','survivor_difference','playoff'])||g.aiResultsReveal!=='after_player_result_committed'||g.regularMatchCount!==24)fail(d.id+': invalid group rules');
  if(!record(g?.draw)||g.draw.method!=='seeded_pots'||g.draw.pots!==4||g.draw.teamsPerPot!==4||g.draw.labelPlayerGroupA!==true)fail(d.id+': invalid draw');
  validateBracket(d,fail);
  const sim=d.simulation,c=d.combat,retry=d.retry,replay=d.replay;
  if(!record(sim)||sim.method!=='rating_and_composition'||!Number.isFinite(sim.maxUpsetInfluence)||sim.maxUpsetInfluence<0||sim.maxUpsetInfluence>.25||!same(sim.rngStreams,['draw','simulation','combat','encounter'])||sim.commitOnce!==true)fail(d.id+': invalid simulation');
  if(!record(c)||c.rulesScope!==d.id||c.normalization!=='trial_builds'||c.mastery!==false||c.arenaRules!==false||c.maxMainRounds!==40||!same(c.timeLimitJudging,['living_count','hp_ratio_sum','direct_hp_damage','seeded_lot'])||!same(c.resetBeforeMatch,['hp','mp','statuses','shield','cooldowns','resources','modes','round_counters'])||c.perMatchRewards!==false||c.grantsXp!==false||c.countsDailyQuest!==false||c.countsArena!==false)fail(d.id+': invalid isolated combat rules');
  if(!record(retry)||!same(retry.onDefeat,['retry_same_match','accept_defeat'])||retry.retryKeepsSeed!==true||retry.commitResultOnce!==true||retry.withdrawDuringBattle!=='defeat_pending_confirmation')fail(d.id+': invalid retry contract');
  if(!record(replay)||replay.enabled!==true||replay.unlimited!==true||!same(replay.after,['champion','eliminated'])||!text(replay.label)||replay.newSeed!==undefined||replay.newRunId!==true||replay.historyLimit!==20||!same(replay.reset,['run','groups','fixtures','lineups','battleSnapshots','rngState'])||!same(replay.preserve,['firstClear','firstRewardClaims','storyFlags','history','bestPlacement','ownership','inventory'])||!same(replay.repeatRewards,[]))fail(d.id+': replay must reset the run and preserve permanent progress');
  if(!unique(d.sceneIds)||!d.sceneIds.length||d.sceneIds.some(id=>scenes[id]?.tournamentId!==d.id)||!record(d.endings)||['champion','eliminated'].some(key=>!d.sceneIds.includes(d.endings[key])||scenes[d.endings[key]]?.phase!=='ending'))fail(d.id+': invalid scene/endings references');
  const hooks=d.sceneHooks,expectedHooks={registration:'registration',opening:'opening',interval:'interval'};
  if(!record(hooks))fail(d.id+': missing scene hooks');
  else{
   for(const [hook,phase]of Object.entries(expectedHooks))if(!includes(d.sceneIds,hooks[hook])||scenes[hooks[hook]]?.phase!==phase)fail(d.id+': invalid '+hook+' scene hook');
   for(const [hook,keys,phase]of [['groupBefore',['1','2','3'],'group_before'],['knockoutBefore',['quarterfinal','semifinal','final'],'knockout_before'],['endings',['champion','eliminated'],'ending']]){
    const map=hooks[hook];if(!record(map)||!same(Object.keys(map).sort(),[...keys].sort())||keys.some(key=>!includes(d.sceneIds,map[key])||scenes[map[key]]?.phase!==phase))fail(d.id+': invalid '+hook+' scene hooks');
   }
   if(!same(hooks.endings,d.endings))fail(d.id+': ending hooks mismatch');
  }
  if(!unique(d.rewardIds)||d.rewardIds.length!==3||d.rewardIds.some(id=>rewards[id]?.tournamentId!==d.id)||new Set(d.rewardIds.map(id=>rewards[id]?.trigger)).size!==3)fail(d.id+': invalid first-ever reward references');
 }
 for(const team of Object.values(teams))if(!includes(tournaments[team.tournamentId]?.candidateTeamIds,team.id))fail(team.id+': orphan team');
 for(const scene of Object.values(scenes))if(!includes(tournaments[scene.tournamentId]?.sceneIds,scene.id))fail(scene.id+': orphan scene');
 for(const reward of Object.values(rewards))if(!includes(tournaments[reward.tournamentId]?.rewardIds,reward.id))fail(reward.id+': orphan reward');
 return errors;
}
function validateBracket(d,fail){
 const k=d.knockout,bracket=k?.bracket;
 if(!record(k)||k.matchFormat!=='single_game'||k.regularMatchCount!==7||!Array.isArray(bracket)||bracket.length!==7){fail(d.id+': invalid knockout structure');return;}
 const seen=new Map(),seeds=new Set(),used=new Map();
 for(const m of bracket){
  if(!record(m)||!text(m.id)||seen.has(m.id)||!['quarterfinal','semifinal','final'].includes(m.round)||!Array.isArray(m.slots)||m.slots.length!==2){fail(d.id+': invalid bracket match');continue;}
  for(const slot of m.slots){if(m.round==='quarterfinal'){
    const seed=slot?.group+':'+slot?.position;
    if(!record(slot)||!['A','B','C','D'].includes(slot.group)||![1,2].includes(slot.position)||slot.winnerOf!==undefined||seeds.has(seed))fail(d.id+': invalid or duplicate group qualifier');else seeds.add(seed);
   }else{const previous=seen.get(slot?.winnerOf),required=m.round==='semifinal'?'quarterfinal':'semifinal';if(!record(slot)||previous?.round!==required||slot.group!==undefined||(used.get(slot.winnerOf)??0)>0)fail(d.id+': invalid forward/repeated winner reference');else used.set(slot.winnerOf,1);}
  }
  if(m.round==='quarterfinal'&&m.slots[0]?.group===m.slots[1]?.group)fail(d.id+': same-group quarterfinal');
  seen.set(m.id,m);
 }
 const final=[...seen.values()].find(m=>m.round==='final');
 const qualifierGroups=(id,visited=new Set())=>{const m=seen.get(id);if(!m||visited.has(id))return [];const next=new Set([...visited,id]);return m.round==='quarterfinal'?m.slots.map(s=>s?.group):m.slots.flatMap(s=>qualifierGroups(s?.winnerOf,next));};
 if(final&&final.slots.some(slot=>{const groups=qualifierGroups(slot?.winnerOf);return groups.length!==4||new Set(groups).size!==4;}))fail(d.id+': same-group teams must be in opposite final halves');
 if(seeds.size!==8||[...seen.values()].filter(m=>m.round==='quarterfinal').length!==4||[...seen.values()].filter(m=>m.round==='semifinal').length!==2||[...seen.values()].filter(m=>m.round==='final').length!==1||[...seen.values()].some(m=>m.round!=='final'&&!used.has(m.id)))fail(d.id+': incomplete bracket');
}
