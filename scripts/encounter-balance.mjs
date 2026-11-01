import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {loadContent} from './load-content.mjs';
import {campaign,command} from './level-balance.mjs';
import {allocationLimit,unspentPoints} from '../src/core/leveling.js';
import {createBattle,activeActor,executeAction,executeEnemyTurn} from '../src/core/battle.js';
import {createDungeonRun,createDungeonPreview,advanceDungeonWave,isFinalDungeonWave} from '../src/core/dungeon.js';
import {seededRandom} from '../src/core/random.js';
const content=await loadContent(),seeds=Number(process.argv[2]??30);
if(!Number.isInteger(seeds)||seeds<30||seeds>1000)throw Error('Use 30–1000 seeds.');
const oldDungeons=JSON.parse(execFileSync('git',['-c','safe.directory=E:/MyRPGv2','show','0ae296b:data/dungeons.json'],{encoding:'utf8'}));
const now=new Date('2026-11-01T05:00:00Z');
function account(level){const c=campaign('arthur',3);
 c.storyFlags.push('illusion.sinister_unlocked');
 for(const id of c.party){const s=c.characters[id];Object.assign(s,{level,xp:0,limitBreakRank:level>40?3:level>30?2:level>20?1:0,allocations:{}});
  const priority=id==='arthur'?['attack','maxHp','resistance','defense','maxMp','magic']:id==='garrek'?['defense','maxHp','resistance','maxMp','attack','magic']:id==='elaine'?['magic','maxMp','maxHp','resistance','defense','attack']:['maxMp','magic','maxHp','defense','resistance','attack'];
  for(const k of priority){const n=Math.min(allocationLimit(content,level,k),unspentPoints(content,s));if(n)s.allocations[k]=n;}
 }return c;
}
function simulate(source,c,seed,quest,dungeon,difficulty='hard'){
 const random=seededRandom(seed),run=dungeon?createDungeonRun(source,c,dungeon,difficulty,{now,random,preview:createDungeonPreview(source,dungeon,difficulty,{now,random})}):null;
 let b=run?.battle??createBattle(source,c,quest,random,{questDifficulty:difficulty}),kos=0,waves=1,actions=0,hpDamage=0,shieldAbsorbed=0;
 const waveIds=run?.waveIds??[quest];
 while(actions++<2500&&b.round<120){
  if(b.outcome){if(run&&b.outcome==='victory'&&!isFinalDungeonWave(run)){b=advanceDungeonWave(source,run);waves++;continue;}break;}
  const actor=activeActor(b);if(!actor)break;const before=new Map(b.actors.map(a=>[a.id,a.hp]));
  if(actor.team==='enemy')executeEnemyTurn(b);else executeAction(b,command(b,actor,'arthur'));
  kos+=b.actors.filter(a=>a.team==='party'&&a.hp===0&&before.get(a.id)>0).length;
  for(const e of b.events)if(e.type==='damage'&&e.sourceId?.includes('enemy_')){hpDamage+=e.amount??0;shieldAbsorbed+=e.absorbed??0;}
 }
 const party=b.actors.filter(a=>a.team==='party');
 return {seed,waveIds,outcome:b.outcome??'bounded',waves,rounds:b.round,kos,hpDamage,shieldAbsorbed,endHp:party.reduce((n,a)=>n+a.hp,0),endMp:party.reduce((n,a)=>n+a.mp,0)};
}
const scenarios=[];
const legacy=structuredClone(content);legacy.dungeons.gold_mine=oldDungeons.find(d=>d.id==='gold_mine');
scenarios.push({id:'legacy_gold_hard',content:legacy,level:1,dungeon:'gold_mine',difficulty:'hard'});
for(const level of [35,45,50])for(const dungeon of ['gold_mine','dangerous'])scenarios.push({id:dungeon+'_hard',content,level,dungeon,difficulty:'hard'});
for(const [difficulty,level]of [['medium',25],['hard',35],['very_hard',45]])for(const quest of ['ogre_trial','bounty_black_script_cleric'])scenarios.push({id:quest,content,level,quest,difficulty});
for(const quest of ['alice_superboss','miraebolis_superboss'])scenarios.push({id:quest,content,level:50,quest,difficulty:'very_hard'});
const rows=[];
for(const s of scenarios){const trials=[];for(let seed=1;seed<=seeds;seed++)trials.push(simulate(s.content,account(s.level),seed,s.quest,s.dungeon,s.difficulty));
 const wins=trials.filter(t=>t.outcome==='victory'),mean=(key,items=trials)=>items.length?+(items.reduce((n,t)=>n+t[key],0)/items.length).toFixed(2):null;
 rows.push({id:s.id,partyLevel:s.level,difficulty:s.difficulty,seeds,wins:wins.length,draws:trials.filter(t=>t.outcome==='draw'||t.outcome==='bounded').length,meanWinRounds:mean('rounds',wins),meanKOs:mean('kos'),meanEndHp:mean('endHp'),meanEndMp:mean('endMp'),minEndHp:Math.min(...trials.map(t=>t.endHp)),maxEndHp:Math.max(...trials.map(t=>t.endHp)),trials});
 console.log(s.id,s.level,wins.length+'/'+seeds,'wins',mean('rounds',wins),'rounds');
}
const result={note:'Deterministic smoke test, not proof of final balance. F2P Arthur/Iris/Garrek/Elaine; 3 T3 stat items each, starter-story upgrades, no gacha, exclusives, consumables or effect gear. Same gear across levels. Fixed heuristic policy from level-balance.mjs; 2500 actions / 120 rounds bound. Historical A uses raw template stats and old dungeon multipliers at player Lv1 (no allocation); this reproduces stat conditions, not an executable of the old engine. B/C use current allocations. Recorded individual seeds/waves expose RNG variation. End MP after victory may include legitimate phase/end-mode effects.',seeds,rows};
fs.writeFileSync(process.argv[3]??'docs/ENCOUNTER_SCALING_PLAYTEST.json',JSON.stringify(result,null,2)+'\n');
