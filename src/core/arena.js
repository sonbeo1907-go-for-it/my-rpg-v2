import {arenaIdentity} from './arena-identity.js';
import {preparePvpContent,freezePvp} from './pvp-rules.js';
import {validateContent} from './content.js';
import {characterSkillIds,skillRankCap} from './skill-rules.js';
import {allocationLimit} from './leveling.js';
import {createBattle} from './battle.js';
import {createGameSave} from './game-save.js';
import {seededRandom} from './random.js';
export const ARENA_TEAMS=[
 {id:'mirror',name:'Ảnh gương',description:'Đối thủ sao chép đội hình và trang bị hiện tại của bạn.'},
 {id:'village',name:'Lời thề phương Bắc',party:['arthur','iris','elaine','garrek'],description:'Đội cơ bản: tấn công, hỗ trợ và bảo hộ.'},
 {id:'vertosse',name:'Phiên tòa lúc nửa đêm',party:['selene','simon','genevieve','noctis'],description:'Đội tài nguyên Bằng Chứng Đanh Thép.'},
 {id:'mafia',name:'Hoa Hồng Đen',party:['isabelle','viktor','judy','amelia'],description:'Thuốc Súng, Liên kích và phòng thủ.'},
 {id:'academy',name:'Buổi thực hành học viện',party:['monica','lumine','freya','victorina'],description:'Phối hợp phép thuật, kiếm thuật và kiểm soát nhịp chiến đấu.'}
];
export function normalizedArenaCampaign(content,source,party,rules){
 const c=createGameSave(content);c.party=[...party];c.partyPresets[0].slots=[...party];c.unlockedCharacterIds=[...new Set([...c.unlockedCharacterIds,...party.filter(Boolean)])];
 for(const id of party.filter(Boolean)){
  const level=rules.normalization.level,state=c.characters[id],def=content.characters[id];
  Object.assign(state,{level,limitBreakRank:level>40?3:level>30?2:level>20?1:0,upgradeIds:rules.normalization.storyUpgrades?Object.values(content.upgrades).filter(u=>u.characterId===id).map(u=>u.id):[]});
  let primary=def.roleGroup==='physical_dps'||def.roleGroup==='fighter'?'attack':'magic';
  const keys=def.abilities.flatMap(id=>content.abilities[id].effects).filter(e=>['damage','heal'].includes(e.type)).map(e=>e.scalingStat??(e.damageType==='physical'?'attack':'magic'));
  if(keys.length&&keys.every(k=>k==='attack'))primary='attack';else if(keys.length&&keys.every(k=>k==='magic'))primary='magic';else if(keys.includes('maxHp'))primary='maxHp';
  const goals=def.roleGroup==='tank'||primary==='maxHp'?{maxHp:17,defense:16,resistance:16}:id==='seraphine'?{maxHp:16,attack:17,magic:16}:{maxHp:16,[primary]:17,defense:8,resistance:8};
  let points=level-1;for(const [key,goal]of Object.entries(goals)){const n=Math.min(goal,allocationLimit(content,level,key),points);if(n){state.allocations[key]=n;points-=n;}}
  for(const key of ['maxHp','defense','resistance','maxMp']){const n=Math.min(points,allocationLimit(content,level,key)-(state.allocations[key]??0));if(n>0){state.allocations[key]=(state.allocations[key]??0)+n;points-=n;}}
  const rank=Math.min(rules.normalization.skillRank,skillRankCap(level));state.skillRanks={basic:rank};
  for(const abilityId of characterSkillIds(content,state,id)){const a=content.abilities[abilityId];if(a.rankable!==false&&a.growthProfile!=='fixed'&&a.activation!=='passive')state.skillRanks[a.skillLineId??a.id]=rank;}
 }
 return c;
}
export function randomArenaParty(content,random){
 const taken=new Set(),pool=Object.values(content.characters).filter(c=>!c.developerOnly);
 const pick=roles=>{const choices=pool.filter(c=>!taken.has(c.id)&&roles.includes(c.roleGroup));const c=choices[Math.floor(random()*choices.length)];taken.add(c.id);return c.id;};
 return [pick(['physical_dps','magical_dps','fighter']),pick(['physical_dps','magical_dps','sorcerer']),pick(['offensive_support']),pick(['defensive_support','tank'])];
}
export function createArenaBattle(content,campaign,teamId='mirror',seed=1,options={}){
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('Seed Đấu Trường không hợp lệ.');
 const scoped=preparePvpContent(content,options.rules??content.pvpRules?.default),errors=validateContent(scoped.content);if(errors.length)throw Error(errors.join('; '));
 const match=teamId==='match',team=ARENA_TEAMS.find(t=>t.id===teamId);
 if(!match&&!team)throw Error('Đội Đấu Trường không hợp lệ.');
 if(match&&campaign.party.filter(Boolean).length!==4)throw Error('Tìm Trận cần đủ bốn nhân vật.');
 const setupRandom=seededRandom(seed),opponentParty=match?randomArenaParty(scoped.content,setupRandom):team.party??campaign.party;
 const player=match?normalizedArenaCampaign(scoped.content,campaign,campaign.party,scoped.rules):structuredClone(campaign);
 let opponent=match?normalizedArenaCampaign(scoped.content,campaign,opponentParty,scoped.rules):structuredClone(campaign);
 if(!match&&team.party){
  opponent=createGameSave(scoped.content);opponent.party=[...team.party];opponent.unlockedCharacterIds=[...new Set([...opponent.unlockedCharacterIds,...team.party])];
  const level=Math.max(1,Math.round(campaign.party.filter(Boolean).reduce((n,id)=>n+campaign.characters[id].level,0)/campaign.party.filter(Boolean).length));
  for(const id of team.party)Object.assign(opponent.characters[id],{level,limitBreakRank:level>40?3:level>30?2:level>20?1:0});
 }
 const battle=createBattle(scoped.content,player,'forest_patrol',seededRandom(seed),{opponentCampaign:opponent,opponentName:arenaIdentity(seed,options.playerName).opponentName,pvpRules:scoped.rules});
 Object.defineProperty(battle,'pvpRules',{value:scoped.rules,writable:false,configurable:false,enumerable:true});
 Object.assign(battle.arena,{...arenaIdentity(seed,options.playerName),activity:{},teamId,seed,mode:match?'match':'practice',normalized:match,rulesetVersion:scoped.rules.rulesetVersion,normalization:match?scoped.rules.normalization:null});
 return battle;
}
