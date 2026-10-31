import {loadContent} from './load-content.mjs';
import {createGameSave} from '../src/core/game-save.js';
import {claimBattleReward} from '../src/core/economy.js';
import {createBattle,activeActor,executeEnemyTurn,executeAction,abilityAvailability} from '../src/core/battle.js';
import {seededRandom} from '../src/core/random.js';
const content=await loadContent(),seeds=Number(process.argv[2]??20),bosses=Object.values(content.encounters).filter(e=>e.category==='bounty');
function campaign(dps,tier){let c=createGameSave(content);for(const story of Object.values(content.travelerStories).filter(s=>['iris','takeshi','fiona'].includes(s.id)))for(const id of story.chapters){const e=content.encounters[id];c=claimBattleReward(c,{encounterId:id,outcome:'victory',rewardRandom:()=>0,actors:(e.requiredPartyIds??[]).map(id=>({id,team:'party'})),...(e.waves?{storyWave:{waveIndex:e.waves.length-1,totalWaves:e.waves.length}}:{})},content);}
 c=claimBattleReward(c,{encounterId:'ogre_trial',outcome:'victory',rewardRandom:()=>0},content);c.party=[dps,'iris','garrek','elaine'];c.partyPresets[0].slots=[...c.party];
 if(tier){for(const id of c.party){const stat=id===dps?(dps==='fiona'?'magic':'attack'):id==='garrek'?'defense':'magic';c.equipment[id]=[];for(let i=0;i<3;i++){const gear={id:'gear_'+(c.gear.length+1),typeId:tier===2?'t2':'t3_focused',stats:{[stat]:tier===2?3:5}};c.gear.push(gear);c.equipment[id].push(gear.id);}}c.gacha.totalPulls=c.gear.length;}
 return c;
}
function command(b,a,dps){const team=b.actors.filter(t=>t.team==='party'&&t.hp>0),enemy=b.actors.find(t=>t.team==='enemy'&&t.hp>0),carry=team.find(t=>t.id===dps)??team[0];
 const has=(t,id)=>t.statuses.some(s=>s.id===id),ok=id=>a.abilities.includes(id)&&abilityAvailability(b,a,content.abilities[id]).ok;
 const choose=(id,target)=>({actorId:a.id,abilityId:id,targetId:target?.id??a.id});
 if(a.id==='arthur'){for(const id of ['arthur.ogres_bane_controlled','arthur.light_slash','arthur.release'])if(ok(id))return choose(id,enemy);}
 if(a.id==='fiona'){const mark=enemy.statuses.find(s=>s.id==='prisma')?.stacks??0;const candidates=mark>=3?['fiona.convergence']:mark>0?['fiona.refraction_complete','fiona.shard']:['fiona.shard'];for(const id of candidates)if(ok(id))return choose(id,enemy);if(a.mp<12)return choose('$defend');}
 if(a.id==='iris'){if(!has(carry,'calibrated')&&ok('iris.calibrate'))return choose('iris.calibrate',carry);if(!has(carry,'empowered')&&ok('iris.formula'))return choose('iris.formula',carry);return choose('$defend');}
 if(a.id==='garrek'){if(!has(carry,'cover')&&ok('garrek.cover'))return choose('garrek.cover',carry);if(a.hp/a.stats.maxHp<.65&&ok('garrek.fortress'))return choose('garrek.fortress');if(a.mp<12)return choose('$defend');}
 if(a.id==='elaine'){const vulnerable=team.filter(t=>t.shield<12).sort((x,y)=>x.hp/x.stats.maxHp-y.hp/y.stats.maxHp);if(vulnerable.length>1&&ok('elaine.sanctuary'))return choose('elaine.sanctuary',team[0]);if(vulnerable.length&&ok('elaine.shield'))return choose('elaine.shield',vulnerable[0]);return choose('$defend');}
 return choose('$attack',enemy);
}
console.log('Reference simulation: starter characters after required stories + controlled Arthur; exactly 0/3 suitable gear pieces per person. Simple fixed policy, not an optimal player.');
console.log('boss,dps,gear,seeds,wins,meanWinRound,meanEndMP,meanHpLost,meanShieldLost,meanKOs');
for(const boss of bosses)for(const dps of ['arthur','fiona'])for(const tier of [0,2,3]){const results=[];for(let seed=1;seed<=seeds;seed++){const b=createBattle(content,campaign(dps,tier),boss.id,seededRandom(seed));let hp=0,shield=0,kos=0;
 for(let actions=0;!b.outcome&&actions<1000;actions++){const a=activeActor(b);if(!a)break;const before=new Map(b.actors.map(t=>[t.id,t.hp]));if(a.team==='enemy')executeEnemyTurn(b);else executeAction(b,command(b,a,dps));for(const e of b.events)if(e.type==='damage'&&b.actors.some(t=>t.id===e.targetId&&t.team==='party')){hp+=e.amount;shield+=e.absorbed??0;}kos+=b.actors.filter(t=>t.team==='party'&&before.get(t.id)>0&&t.hp===0).length;}
 results.push({win:b.outcome==='victory',round:b.round,mp:b.actors.filter(t=>t.team==='party').reduce((n,t)=>n+t.mp,0),hp,shield,kos});}
 const mean=key=>(results.reduce((n,r)=>n+r[key],0)/results.length).toFixed(1),wins=results.filter(r=>r.win);console.log([boss.id,dps,tier,seeds,wins.length,wins.length?(wins.reduce((n,r)=>n+r.round,0)/wins.length).toFixed(1):'-',mean('mp'),mean('hp'),mean('shield'),mean('kos')].join(','));
}
