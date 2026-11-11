import {createGameSave,encodeGameSave} from '../../src/core/game-save.js';
import {claimBattleReward} from '../../src/core/economy.js';
import {allocationLimit,unspentPoints} from '../../src/core/leveling.js';
import {characterSkillIds,skillRankCap,skillRules,skillLineId} from '../../src/core/skill-rules.js';
import {gearSlotCapacity} from '../../src/core/gear-slots.js';
import {isQuestUnlocked} from '../../src/core/quest-catalog.js';
import {resolveCharacter} from '../../src/core/progression.js';

export const SENYA_SEEDS=Object.freeze(Array.from({length:30},(_,i)=>2026111101+i));
export const SENYA_TEAMS=Object.freeze([
 {id:'starter_control',party:['arthur','iris','garrek','elaine']},
 {id:'senya_guard',party:['senya','iris','garrek','elaine']},
 {id:'senya_arthur',party:['senya','arthur','iris','elaine']},
 {id:'senya_fiona',party:['senya','fiona','iris','elaine']},
 {id:'senya_takeshi',party:['senya','takeshi','iris','elaine']},
 {id:'senya_two_guards',party:['senya','arthur','garrek','elaine']},
]);
export const SENYA_BUILDS=Object.freeze([
 {id:'entry35',level:35,gearType:'t2',gearValue:3},
 {id:'progress45',level:45,gearType:'t3_focused',gearValue:5},
 {id:'endgame50',level:50,gearType:'t3_focused',gearValue:5},
]);
export function eastOrdered(content){return Object.values(content.encounters).filter(e=>['east_key','east_hunt'].includes(e.category)).sort((a,b)=>a.eastOrder-b.eastOrder);}
export function senyaCases(content,{full=false}={}){
 const encounters=eastOrdered(content).filter(e=>full||e.category==='east_key'||e.id.match(/east_e_(05|10|15|20|25)$/));
 const cases=[];
 for(const e of encounters)for(const team of SENYA_TEAMS){
  if(team.party.includes('senya')&&e.eastOrder<=content.encounters.east_ke_03.eastOrder)continue;
  for(const build of SENYA_BUILDS)for(const difficulty of full?e.allowedDifficulties:[e.defaultDifficulty])
   cases.push({id:`${team.id}__${build.id}__${e.id}__${difficulty}`,teamId:team.id,buildId:build.id,encounterId:e.id,difficulty});
 }
 for(const build of SENYA_BUILDS)cases.push({id:`senya_arthur__${build.id}__east_ke_03__replay`,teamId:'senya_arthur',buildId:build.id,encounterId:'east_ke_03',difficulty:'east_35',replay:true});
 return cases;
}
export function smokeCases(content){
 return senyaCases(content).filter(c=>
  c.buildId==='endgame50'&&['starter_control','senya_guard'].includes(c.teamId)&&['east_ke_04','east_ke_06','east_ke_08'].includes(c.encounterId)
  ||c.teamId==='starter_control'&&c.buildId==='entry35'&&c.encounterId==='east_ke_01'
  ||c.teamId==='senya_guard'&&c.buildId==='entry35'&&c.encounterId==='east_e_05'
  ||c.teamId==='senya_guard'&&c.buildId==='progress45'&&['east_ke_04','east_ke_06'].includes(c.encounterId));
}

// These are synthetic prerequisites, not victories measured by the benchmark.
// Reward handlers establish the same ownership/upgrade/slot receipts as the game.
function receipt(content,campaign,id,party){
 const e=content.encounters[id];
 if(!isQuestUnlocked(e,campaign))throw Error('Fixture prerequisite not unlocked: '+id);
 if(e.requiredPartyIds?.some(id=>!party.includes(id)))throw Error('Fixture prerequisite party: '+id);
 return claimBattleReward(campaign,{encounterId:id,questDifficulty:e.defaultDifficulty,outcome:'victory',rewardRandom:()=>0,
  actors:party.map(id=>({id,definitionId:id,team:'party'})),
  ...(e.waves?{storyWave:{waveIndex:e.waves.length-1,totalWaves:e.waves.length}}:{})},content);
}
export function senyaFixture(content,spec){
 const team=SENYA_TEAMS.find(t=>t.id===spec.teamId),build=SENYA_BUILDS.find(t=>t.id===spec.buildId),target=content.encounters[spec.encounterId];
 if(!team||!build||!target||!target.allowedDifficulties?.includes(spec.difficulty))throw Error('Unknown Senya fixture');
 let c=createGameSave(content);
 for(const id of ['iris','takeshi','fiona'])for(const chapter of content.travelerStories[id].chapters)c=receipt(content,c,chapter,['arthur','iris','takeshi','fiona']);
 c=receipt(content,c,'ogre_trial',['arthur','iris','garrek','elaine']);
 c=receipt(content,c,'epilogue_shadow_easy',['arthur','iris','garrek','elaine']);
 for(const e of eastOrdered(content)){
  if(e.eastOrder>=target.eastOrder)break;
  c=receipt(content,c,e.id,c.unlockedCharacterIds.includes('senya')?['arthur','senya','iris','elaine']:['arthur','iris','garrek','elaine']);
  // Senya needs a replay WITH Arthur to earn the first slot; recruitment alone cannot grant it.
  if(e.id==='east_ke_03')c=receipt(content,c,e.id,['arthur','senya','iris','elaine']);
 }
 if(spec.replay)c=receipt(content,c,target.id,['arthur','iris','garrek','elaine']);
 if(!isQuestUnlocked(target,c)||team.party.some(id=>!c.unlockedCharacterIds.includes(id)))throw Error('Premature Senya ownership or locked target');
 if(target.requiredPartyIds?.some(id=>!team.party.includes(id)))throw Error('Missing required party');
 c.party=[...team.party];c.partyPresets[0].slots=[...c.party];
 c.gear=[];c.equipment={};c.exclusiveGear=[];c.equippedExclusiveGear={};
 const rank=skillRankCap(build.level,skillRules(content));
 const allocations={};
 for(const id of c.party){
  const state=c.characters[id];Object.assign(state,{level:build.level,xp:0,limitBreakRank:build.level>40?3:2,allocations:{},skillRanks:{}});
  const power=['senya','arthur','takeshi'].includes(id)?'attack':'magic';
  const priorities=id==='garrek'?['defense','maxHp','resistance','maxMp','attack','magic']:id==='iris'?['maxMp','maxHp','magic','resistance','defense','attack']:[power,'maxHp','maxMp','resistance','defense',power==='attack'?'magic':'attack'];
  for(const key of priorities){const amount=Math.min(allocationLimit(content,build.level,key),unspentPoints(content,state));if(amount)state.allocations[key]=amount;}
  state.skillRanks.basic=rank;
  for(const skillId of characterSkillIds(content,state,id)){const s=content.abilities[skillId];if(s.rankable&&s.growthProfile!=='fixed'&&(!s.rankUnlockFlag||c.storyFlags.includes(s.rankUnlockFlag)))state.skillRanks[skillLineId(s)]=rank;}
  const gearStat=id==='garrek'?'defense':id==='iris'?'maxMp':power;
  const gearDefinition=content.economy.default.gearStats.find(s=>s.stat===gearStat);
  const slots=id==='senya'?gearSlotCapacity(c,content,id):3;c.equipment[id]=[];
  for(let slot=0;slot<slots;slot++){
   const gear={id:'gear_'+(c.gear.length+1),typeId:build.gearType,stats:{[gearStat]:gearDefinition.scale*build.gearValue}};
   c.gear.push(gear);c.equipment[id].push(gear.id);
  }
  allocations[id]={level:state.level,rank,allocations:{...state.allocations},slots,gearStat};
 }
 c.gacha.totalPulls=c.gear.length;c.gacha.lastSummon=null;
 // Empty wallet: fixtures grant no consumable, mastery or crafting advantage.
 for(const key of ['coins','prisma','originalPrisma','recruitmentShards','prismaFragments','recruitmentTickets'])c[key]=0;
 encodeGameSave(c,content);
 return {campaign:c,metadata:{...spec,build,party:[...c.party],setup:allocations,
  stats:Object.fromEntries(c.party.map(id=>[id,resolveCharacter(content,c,id).stats])),
  senyaOwned:c.unlockedCharacterIds.includes('senya'),senyaSlots:c.unlockedCharacterIds.includes('senya')?gearSlotCapacity(c,content,'senya'):null,
  assumedClears:[...c.claimedFirstClearRewards],storyFlags:[...c.storyFlags],
  assumptions:'Synthetic cleared prerequisites. No gacha unit, Trấn, T4, consumables or Mastery. Three ordinary gear pieces per starter; Senya equips only slots earned before this stage. Level points and legal skill ranks are applied.'}};
}
