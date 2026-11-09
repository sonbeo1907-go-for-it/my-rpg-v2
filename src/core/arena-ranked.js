import {createGameSave} from './game-save.js';
import {normalizedArenaCampaign} from './arena.js';
import {arenaRules,rankedOwnedCount} from './arena-progression.js';
import {preparePvpContent} from './pvp-rules.js';
import {createBattle} from './battle.js';
import {seededRandom} from './random.js';
import {arenaIdentity} from './arena-identity.js';
import {resolveCharacter} from './progression.js';
import {allocationLimit,allocationSpent} from './leveling.js';
import {t4Stats,GEAR_STAT_KEYS} from './gear-rules.js';
import {exclusiveRollRange} from './blacksmith-rules.js';

export function arenaParty(campaign,party){const c=structuredClone(campaign);c.party=[...party];c.partyPresets.find(p=>p.id===c.activePartyPresetId).slots=[...party];return c;}
export function buildWeights(content,id){
 const d=content.characters[id],weights={maxHp:.11,maxMp:.12,attack:.1,magic:.1,defense:.45,resistance:.45,speed:.8};
 const skills=d.abilities.flatMap(k=>content.abilities[k].effects),damage=skills.filter(e=>e.type==='damage');
 for(const e of damage){const k=e.scalingStat??(e.damageType==='physical'?'attack':'magic');weights[k]=Math.max(weights[k]??0,k==='maxHp'?.55:2.4);}
 if(d.roleGroup==='tank'){weights.maxHp=.4;weights.defense=2;weights.resistance=1.8;}else if(d.roleGroup==='defensive_support'){weights.maxHp=.22;weights.maxMp=.5;}
 for(const e of skills.filter(e=>['heal','shield'].includes(e.type))){if(e.scalingStat)weights[e.scalingStat]=Math.max(weights[e.scalingStat]??0,2);}
 const p=d.passive??{};
 if(p.type==='mp_stat_conversion'||id==='aldric'){weights.maxMp=.65;}
 if(['benard','chelsea','albedo','mori'].includes(id))weights.speed=3;
 if(['heimdall','mandred'].includes(id))weights.maxHp=.6;
 if(id==='susanoo'){weights.defense=1.8;weights.resistance=1.8;}
 return weights;
}
const support=d=>['tank','defensive_support','offensive_support'].includes(d.roleGroup);
// Bounded greedy search evaluates legal marginal stat gains, rather than granting hidden bonuses.
function optimizePoints(c,content,id,weights){
 const s=c.characters[id];s.allocations={};
 for(let i=0;i<49;i++){
  let best=null,value=-Infinity;const before=resolveCharacter(content,c,id).stats;
  for(const key of GEAR_STAT_KEYS){const rule=content.progressionRules.default.allocations[key];if((s.allocations[key]??0)>=allocationLimit(content,s.level,key)||allocationSpent(content,s.allocations)+rule.cost>s.level-1)continue;
   s.allocations[key]=(s.allocations[key]??0)+1;const after=resolveCharacter(content,c,id).stats;s.allocations[key]--;
   const score=GEAR_STAT_KEYS.reduce((n,k)=>n+(after[k]-before[k])*weights[k],0)/rule.cost;
   if(score>value){value=score;best=key;}
  }
  if(!best)break;s.allocations[best]=(s.allocations[best]??0)+1;
 }
}
function statScore(stats,weights){return GEAR_STAT_KEYS.reduce((n,k)=>n+(stats[k]??0)*weights[k],0);}
export function buildRankedOpponent(content,party,tierId,seed=1,enemyParty=[]){
 const tier=arenaRules(content).tiers.find(t=>t.id===tierId);if(!tier||party.length!==4||new Set(party).size!==4||party.some(id=>!content.characters[id]||content.characters[id].developerOnly))throw Error('Đội Đấu Hạng không hợp lệ.');
 const random=seededRandom(seed),pick=(a,b)=>a+Math.floor(random()*(b-a+1));
 let c=arenaParty(createGameSave(content),party);c.unlockedCharacterIds=[...new Set([...c.unlockedCharacterIds,...party])];
 for(const id of party){
  const level=pick(tier.levelMin,tier.levelMax),rank=pick(tier.skillMin,tier.skillMax),one={normalization:{level,skillRank:Math.min(rank,level>=40?5:level>=30?4:level>=20?3:2),storyUpgrades:['gold','diamond','prisma'].includes(tierId)}};
  const normalized=normalizedArenaCampaign(content,c,[id,null,null,null],one);c.characters[id]=normalized.characters[id];c.storyFlags=[...new Set([...c.storyFlags,...normalized.storyFlags])];
  for(const ability of Object.values(content.abilities))if(ability.rankUnlockFlag&&!c.storyFlags.includes(ability.rankUnlockFlag))delete c.characters[id].skillRanks[ability.skillLineId??ability.id];
  c.extraGearSlots[id]=tier.slots-3;
 }
 for(const id of party){
  const weights=buildWeights(content,id),keys=[...GEAR_STAT_KEYS].sort((a,b)=>weights[b]*content.economy.default.gearStats.find(s=>s.stat===b).scale-weights[a]*content.economy.default.gearStats.find(s=>s.stat===a).scale);
  if(tierId==='prisma')optimizePoints(c,content,id,weights);
  c.equipment[id]=[];
  for(let slot=0;slot<tier.slots;slot++){
   const primary=keys[tierId==='prisma'?0:slot%Math.min(3,keys.length)],secondary=keys[slot%2],number=c.gear.length+1;
   const type=tierId==='bronze'?(slot===2?'t2':'t1'):tierId==='silver'?(slot===2?'t3_focused':'t2'):tierId==='gold'?(slot%2?'t3_focused':'t2'):tierId==='diamond'?(slot===4?'t4_stats':'t3_focused'):'t4_stats';
   let gear=type==='t4_stats'?{id:'rune_'+number,typeId:type,primaryStat:primary,secondaryStat:secondary,stats:t4Stats(content,primary,secondary)}:{id:'gear_'+number,typeId:type,stats:{[primary]:content.gearTypes[type].points*content.economy.default.gearStats.find(s=>s.stat===primary).scale}};
   if(tierId==='prisma'){
    // Compare all 49 legal stat pairs and a small role/matchup-specific effect set.
    let best=gear,bestScore=-Infinity;
    for(const main of GEAR_STAT_KEYS)for(const sub of GEAR_STAT_KEYS){const candidate={id:'rune_'+number,typeId:'t4_stats',primaryStat:main,secondaryStat:sub,stats:t4Stats(content,main,sub)};c.gear.push(candidate);c.equipment[id].push(candidate.id);const score=statScore(resolveCharacter(content,c,id).stats,weights);c.gear.pop();c.equipment[id].pop();if(score>bestScore){bestScore=score;best=candidate;}}
    const hasDodge=enemyParty.some(k=>['chelsea','takeshi'].includes(k)),effect=slot===5?(hasDodge&&!support(content.characters[id])?'unerring_signet':support(content.characters[id])?'mana_talisman':null):null;
    // Only install defined effects, with normal group uniqueness enforced by engine validation.
    if(effect&&content.gearEffects[effect])best={id:'rune_'+number,typeId:'t4_effect',effectId:effect,stats:{}};
    gear=best;
   }
   c.gear.push(gear);c.equipment[id].push(gear.id);
  }
  if(['diamond','prisma'].includes(tierId)){
   const template=Object.values(content.exclusiveGear).find(t=>t.characterId===id);
   if(template){const key=keys[0];c.exclusiveGear.push({templateId:template.id,statKey:key,statValue:exclusiveRollRange(content,key)[tierId==='prisma'?'max':'min']});c.equippedExclusiveGear[id]=template.id;}
  }
 }
 c.gacha.totalPulls=c.gear.length;c.craftedGearSerial=c.gear.length;return c;
}
export function createCompetitiveArena(content,campaign,pending,{playerParty,opponentParty}={}){
 if(!pending||!['normal','ranked'].includes(pending.mode))throw Error('Chưa tìm được trận.');
 const ranked=pending.mode==='ranked';
 if(ranked&&rankedOwnedCount(content,campaign)<arenaRules(content).rankedMinimumOwned)throw Error('Đấu Hạng cần ít nhất 16 nhân vật chính thức.');
 const scoped=preparePvpContent(content,content.pvpRules.default),ids=playerParty??campaign.party;
 if(ids.length!==4||new Set(ids).size!==4||ids.some(id=>!campaign.unlockedCharacterIds.includes(id)||content.characters[id]?.developerOnly))throw Error('Cần bốn nhân vật đã sở hữu.');
 let enemy=opponentParty;
 if(!ranked){const pool=Object.values(content.characters).filter(d=>!d.developerOnly),random=seededRandom(pending.seed);enemy=[];for(const roles of [['physical_dps','fighter'],['magical_dps','sorcerer'],['offensive_support'],['defensive_support','tank']]){const available=pool.filter(c=>!enemy.includes(c.id)&&roles.includes(c.roleGroup));enemy.push(available[Math.floor(random()*available.length)].id);}}
 if(!enemy||enemy.length!==4||new Set(enemy).size!==4||enemy.some(id=>!content.characters[id]||content.characters[id].developerOnly)||ranked&&enemy.some(id=>ids.includes(id)))throw Error('Đội đối thủ không hợp lệ.');
 const player=ranked?arenaParty(campaign,ids):normalizedArenaCampaign(scoped.content,campaign,ids,scoped.rules),opponent=ranked?buildRankedOpponent(scoped.content,enemy,pending.rankAtEntry,pending.seed,ids):normalizedArenaCampaign(scoped.content,campaign,enemy,scoped.rules);
 const b=createBattle(scoped.content,player,'forest_patrol',seededRandom(pending.seed),{opponentCampaign:opponent,opponentName:pending.opponentName,pvpRules:scoped.rules});
 Object.defineProperty(b,'pvpRules',{value:scoped.rules,writable:false,configurable:false,enumerable:true});
 Object.assign(b.arena,{...arenaIdentity(pending.seed,pending.playerName),opponentName:pending.opponentName,activity:{},teamId:'match',seed:pending.seed,matchId:pending.id,matchType:pending.mode,rankAtEntry:pending.rankAtEntry,mode:'match',normalized:!ranked,rulesetVersion:scoped.rules.rulesetVersion,normalization:ranked?null:scoped.rules.normalization});return b;
}
