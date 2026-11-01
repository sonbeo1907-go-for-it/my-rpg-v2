import fs from 'node:fs';
import {loadContent} from './load-content.mjs';
import {campaign as introCampaign} from './level-balance.mjs';
import {allocationLimit,unspentPoints} from '../src/core/leveling.js';
import {skillRankCap,characterSkillIds,skillLineId} from '../src/core/skill-rules.js';
import {upgradeSkill} from '../src/core/skill-progression.js';
import {createBattle,activeActor,executeAction,executeEnemyTurn,abilityAvailability} from '../src/core/battle.js';
import {seededRandom} from '../src/core/random.js';
const content=await loadContent(),seeds=Number(process.argv[2]??30);
if(!Number.isInteger(seeds)||seeds<30||seeds>1000)throw Error('Use 30–1000 seeds.');
const party=['yufina','chloe','victorina','elaine'];
function account(levels,ranked){let c=introCampaign('arthur',0);c.party=[...party];c.partyPresets[0].slots=[...party];c.coins=200000;
 for(const [index,id]of party.entries()){
  if(!c.unlockedCharacterIds.includes(id))c.unlockedCharacterIds.push(id);
  const level=levels[index],state=c.characters[id];Object.assign(state,{level,xp:0,limitBreakRank:level>40?3:level>30?2:level>20?1:0,allocations:{},skillRanks:{}});
  const priority=id==='yufina'?['attack','maxHp','resistance','defense','maxMp']:id==='victorina'?['defense','resistance','maxHp','maxMp','magic']:['magic','maxMp','maxHp','resistance','defense'];
  for(const key of priority){const n=Math.min(allocationLimit(content,level,key),unspentPoints(content,state));if(n)state.allocations[key]=n;}
  c.equipment[id]=[];const stats=id==='yufina'?['attack','attack','attack']:id==='victorina'?['defense','defense','resistance']:id==='chloe'?['magic','magic','attack']:['magic','magic','magic'];
  for(const stat of stats){const gear={id:'gear_'+(c.gear.length+1),typeId:'t3_focused',stats:{[stat]:5}};c.gear.push(gear);c.equipment[id].push(gear.id);}
  if(ranked)for(const line of ['basic',...characterSkillIds(content,state,id).filter(key=>content.abilities[key].rankable).map(key=>skillLineId(content.abilities[key]))])for(let rank=1;rank<skillRankCap(level);rank++)c=upgradeSkill(c,content,id,line);
 }
 c.gacha.totalPulls=c.gear.length;return c;
}
function command(b,a){const team=b.actors.filter(t=>t.team==='party'&&t.hp>0),target=b.actors.find(t=>t.team==='enemy'&&t.hp>0),injured=[...team].sort((x,y)=>x.hp/x.stats.maxHp-y.hp/y.stats.maxHp),has=(who,id)=>who.statuses.some(s=>s.id===id),ok=id=>a.abilities.includes(id)&&abilityAvailability(b,a,content.abilities[id]).ok,choose=(id,t)=>({actorId:a.id,abilityId:id,targetId:t?.id??a.id});
 if(a.id==='yufina'){
  if(!a.activeMode&&ok('yufina.ignite'))return choose('yufina.ignite');
  if(!has(target,'yufina_dazed')&&ok('yufina.daze'))return choose('yufina.daze',target);
  for(const id of ['yufina.pierce','yufina.jab'])if(ok(id))return choose(id,target);
 }
 if(a.id==='chloe'){
  if(injured[0]?.hp/injured[0]?.stats.maxHp<.68&&ok('chloe.care'))return choose('chloe.care',injured[0]);
  if(!has(target,'cat_claw_rend')&&ok('chloe.claws'))return choose('chloe.claws',target);
  if(ok('chloe.pounce'))return choose('chloe.pounce',target);
 }
 if(a.id==='victorina'){
  if(team.some(t=>t.shield<15)&&ok('victorina.petals'))return choose('victorina.petals',team[0]);
  for(const [id,status]of [['victorina.vow','rose_sanctuary'],['victorina.thorns','rose_bastion']])if(team.some(t=>!has(t,status))&&ok(id))return choose(id,team[0]);
 }
 if(a.id==='elaine'){
  const bare=team.filter(t=>t.shield<12);
  if(bare.length>1&&ok('elaine.sanctuary'))return choose('elaine.sanctuary',team[0]);
  if(bare.length&&ok('elaine.shield'))return choose('elaine.shield',bare.sort((x,y)=>x.hp/x.stats.maxHp-y.hp/y.stats.maxHp)[0]);
  if(team.some(t=>!has(t,'water_veil'))&&ok('elaine.veil'))return choose('elaine.veil',team[0]);
 }
 return choose('$defend');
}
const rows=[];
for(const levels of [[16,1,1,20],[45,45,45,45],[50,50,50,50]])for(const ranked of [false,true]){
 const c=account(levels,ranked),results=[];
 for(let seed=1;seed<=seeds;seed++){
  const b=createBattle(content,c,'bounty_black_script_cleric',seededRandom(seed),{questDifficulty:'very_hard'});let actions=0,kos=0;
  while(!b.outcome&&b.round<=120&&actions++<1500){const a=activeActor(b);if(!a)break;const alive=b.actors.filter(t=>t.team==='party'&&t.hp>0).length;if(a.team==='enemy')executeEnemyTurn(b);else executeAction(b,command(b,a));kos+=Math.max(0,alive-b.actors.filter(t=>t.team==='party'&&t.hp>0).length);}
  const team=b.actors.filter(t=>t.team==='party');results.push({seed,outcome:b.outcome??'bounded',round:b.round,kos,hp:team.reduce((n,a)=>n+a.hp,0),mp:team.reduce((n,a)=>n+a.mp,0)});
 }
 const wins=results.filter(r=>r.outcome==='victory'),mean=key=>+(results.reduce((n,r)=>n+r[key],0)/seeds).toFixed(1);
 rows.push({levels,ranked,coinsSpent:200000-c.coins,seeds,wins:wins.length,bounded:results.filter(r=>r.outcome==='bounded').length,meanWinRound:wins.length?+(wins.reduce((n,r)=>n+r.round,0)/wins.length).toFixed(1):null,meanHp:mean('hp'),meanMp:mean('mp'),meanKOs:mean('kos'),results});
}
const output={description:'Synthetic fixed-policy comparison, not a reproduction of the user 28-round clear. Same party/gear/allocations/random seeds; only paid legal skill ranks differ. No Trấn Phái, T4 or consumables; 120-round bound is not proof of infinite sustain.',boss:'Giáo Sĩ Hắc Văn Lv45',bossHp:4753,party,gear:'Exactly three T3 focused +5 each: Yufina ATK/ATK/ATK, Chloe MAG/MAG/ATK, Victorina DEF/DEF/RES, Elaine MAG/MAG/MAG. All available level points allocated by documented policy.',rows};
fs.writeFileSync('docs/SKILL_RANK_PLAYTEST.json',JSON.stringify(output,null,2)+'\n');console.table(rows.map(({results,...r})=>({...r,levels:r.levels.join('/')})));
