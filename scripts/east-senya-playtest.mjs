import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {loadContent} from './load-content.mjs';
import {SENYA_SEEDS,SENYA_TEAMS,SENYA_BUILDS,senyaCases,smokeCases,senyaFixture} from './fixtures/east-senya.mjs';
import {createBattle,activeActor,executeAction,executeEnemyTurn,abilityAvailability,targetsFor,planAutoBattleTurn,basicAbility,DEFEND} from '../src/core/battle.js';
import {createStoryRun,advanceStoryWave,isFinalStoryWave} from '../src/core/story-waves.js';
import {seededRandom} from '../src/core/random.js';
import {resolveRankedAbility} from '../src/core/skill-resolver.js';
import {isAlive} from '../src/core/actor-life.js';
import {encodeGameSave} from '../src/core/game-save.js';

export const SENYA_POLICY='senya-f2p-heuristic-v1';
export function senyaCommand(b,a){
 const team=b.actors.filter(t=>t.team===a.team&&isAlive(t));
 const carry=team.find(t=>t.definitionId==='senya'||t.id==='senya')??team.find(t=>t.id==='arthur')??team[0];
 const has=(t,id)=>t.statuses.some(s=>s.id===id&&(s.remaining==null||s.remaining>0));
 const make=(id,target)=>{
  if(!id.startsWith('$')&&!a.abilities.includes(id))return null;
  const raw=id==='$attack'?basicAbility(a):id==='$defend'?DEFEND:b.content.abilities[id];if(!raw)return null;
  const skill=resolveRankedAbility(b.content,a,raw);if(!abilityAvailability(b,a,skill).ok)return null;
  let legal=targetsFor(b,a,skill);if(!legal.length)return null;
  if(!['ally','all_allies','self','adjacent_allies'].includes(skill.target))legal=[...legal].sort((x,y)=>{
   const add=t=>t.eastSummonTag||t.spawnTag||t.id.includes('summon');
   return Number(Boolean(add(y)))-Number(Boolean(add(x)))||x.hp-y.hp;
  });
  return {actorId:a.id,abilityId:id,targetId:legal.find(t=>t.id===target?.id)?.id??legal[0].id};
 };
 const first=(ids,t)=>ids.map(id=>make(id,t)).find(Boolean);
 const id=a.characterId??a.definitionId??a.id;
 if(id==='senya'){
  const souls=b.teamResources?.[a.team]?.sword_soul?.value??0;
  if(a.hp/a.stats.maxHp<.6||souls<3&&!has(a,'senya_blood_hunt')){const c=make('senya.hunt',a);if(c)return c;}
  if(souls>=3||a.mp/a.stats.maxMp>.5){const c=make('senya.fulfill');if(c)return c;}
  if(a.mp<8)return make('$defend');
  return first(['senya.slash','$attack']);
 }
 if(id==='iris'){
  if(!has(carry,'calibrated')){const c=make('iris.calibrate',carry);if(c)return c;}
  if(!has(carry,'empowered')){const c=make('iris.formula',carry);if(c)return c;}
  return make('$defend');
 }
 if(id==='elaine'){
  const unsafe=team.filter(t=>t.shield<Math.max(12,t.stats.maxHp*.1)).sort((x,y)=>x.hp/x.stats.maxHp-y.hp/y.stats.maxHp);
  if(unsafe.length>1){const c=make('elaine.sanctuary',team[0]);if(c)return c;}
  if(unsafe.length){const c=make('elaine.shield',unsafe[0]);if(c)return c;}
  if(!has(a,'water_veil')&&b.actors.some(t=>t.team!==a.team&&isAlive(t)&&t.abilities.some(id=>b.content.abilities[id]?.effects.some(e=>e.type==='damage'&&e.damageType==='magical')))){
   const c=make('elaine.veil',a);if(c)return c;
  }
  return make('$defend');
 }
 if(id==='garrek'){
  if(!has(carry,'cover')){const c=make('garrek.cover',carry);if(c)return c;}
  if(a.hp/a.stats.maxHp<.7){const c=make('garrek.fortress',a);if(c)return c;}
  return make('$defend');
 }
 if(id==='takeshi'){
  if((a.resourceValues?.opening??0)>=2){const c=make('takeshi.riposte');if(c)return c;}
  return first(['takeshi.stance','takeshi.slash','$defend']);
 }
 if(id==='fiona'){
  const foe=b.actors.find(t=>t.team!==a.team&&isAlive(t));
  const stacks=foe?.statuses.find(s=>s.id==='prisma')?.stacks??0;
  if(a.mp<10)return make('$defend');
  return first(stacks>=3?['fiona.convergence','fiona.refraction_complete','fiona.collapse','fiona.shard']:['fiona.shard','$attack'],foe);
 }
 if(id==='arthur'){
  const c=first(['arthur.ogres_bane_controlled','arthur.light_slash','arthur.partial_release','arthur.release']);if(c)return c;
 }
 return make('$attack')??make('$defend');
}

export function simulateSenya(content,campaign,spec,seed,{policy='heuristic',maxRounds=100,maxActions=1800}={}){
 const random=seededRandom(seed),e=content.encounters[spec.encounterId];
 const run=e.waves?createStoryRun(content,campaign,e.id,random,{questDifficulty:spec.difficulty}):null;
 let b=run?.battle??createBattle(content,campaign,e.id,random,{questDifficulty:spec.difficulty}),actions=0,wavesCleared=0,error=null;
 const phases={},waveResults=[],minMp={},minHp={},skills={},soul={created:0,spent:0},observedEvents=[];
 let waveStartActions=0;
 const observe=()=>{for(const a of b.actors.filter(a=>a.team==='party')){minHp[a.definitionId??a.id]=Math.min(minHp[a.definitionId??a.id]??a.hp,a.hp);minMp[a.definitionId??a.id]=Math.min(minMp[a.definitionId??a.id]??a.mp,a.mp);}for(const a of b.actors.filter(a=>a.bossState)){const id=a.definitionId??a.id;phases[id]??=[];if(!phases[id].includes(a.bossState.phase))phases[id].push(a.bossState.phase);}};
 const waveEnd=()=>waveResults.push({index:run?.waveIndex??0,outcome:b.outcome??'bounded',enemyLevel:b.enemyLevel,round:b.round,actions:actions-waveStartActions});
 observe();
 try{
  while(actions<maxActions&&b.round<=maxRounds){
   if(b.outcome){
    if(b.outcome==='victory'){wavesCleared++;waveEnd();if(run&&!isFinalStoryWave(run)){b=advanceStoryWave(content,run);waveStartActions=actions;observe();continue;}}
    break;
   }
   const actor=activeActor(b);if(!actor){error='No active actor without outcome';break;}
   const previousEvents=b.events,previousCount=b.events.length;
   if(actor.team==='enemy')executeEnemyTurn(b);else{
    const command=policy==='arena'?planAutoBattleTurn(b):senyaCommand(b,actor);
    if(!command)throw Error('No legal party command');
    skills[command.abilityId]=(skills[command.abilityId]??0)+1;
    executeAction(b,command);
   }
   actions++;observe();
   // executeAction may replace events; retain only this real action, never AI forecast events.
   const events=b.events===previousEvents?b.events.slice(previousCount):b.events;
   for(const event of events){
    if(event.type==='boss_soul_break')observedEvents.push({round:b.round,...event});
    if(event.resource==='sword_soul'&&event.type==='team_resource_created')soul.created+=event.created??event.amount??0;
    if(event.resource==='sword_soul'&&event.type==='team_resource_spent')soul.spent+=event.spent??event.amount??0;
   }
  }
 }catch(e){error=e.stack??String(e);}
 if(!waveResults.length||waveResults.at(-1).index!==(run?.waveIndex??0))waveEnd();
 return {seed,outcome:error?'error':b.outcome??'bounded',error,actions,rounds:b.round,wavesCleared,waveCount:run?.waveCount??1,waves:waveResults,
  party:b.actors.filter(a=>a.team==='party').map(a=>({id:a.definitionId??a.id,hp:a.hp,mp:a.mp,maxHp:a.stats.maxHp,maxMp:a.stats.maxMp,minHp:minHp[a.definitionId??a.id],minMp:minMp[a.definitionId??a.id]})),
  bossPhases:phases,soul,sealBreaks:observedEvents,skills,lastLog:b.log.slice(-10)};
}

async function main(){
 const args=process.argv.slice(2),value=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
 const seedCount=Number(value('--seeds',30)),policy=value('--policy','heuristic'),suite=value('--suite','smoke');
 if(!Number.isInteger(seedCount)||seedCount<1||seedCount>30||!['heuristic','arena'].includes(policy)||!['smoke','milestones','full'].includes(suite))throw Error('Use --seeds 1..30 --policy heuristic|arena --suite smoke|milestones|full');
 const singleSeed=value('--seed',null),seeds=singleSeed===null?SENYA_SEEDS.slice(0,seedCount):[Number(singleSeed)];
 if(seeds.some(seed=>!Number.isInteger(seed)||seed<0||seed>0xffffffff))throw Error('Seed must be an unsigned 32-bit integer');
 const content=await loadContent(),out=path.resolve(value('--out','test-results/east-senya'));
 fs.mkdirSync(out,{recursive:true});fs.mkdirSync(path.join(out,'fixtures'),{recursive:true});
 const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const cases=senyaCases(content,{full:suite==='full'}),selected=(suite==='smoke'?smokeCases(content):cases).filter(s=>!value('--case',null)||s.id===value('--case',null));
 if(!selected.length)throw Error('No matching cases');
 const manifest={schemaVersion:1,commit,seedPool:SENYA_SEEDS,seeds,teams:SENYA_TEAMS,builds:SENYA_BUILDS,cases,selectedCaseIds:selected.map(c=>c.id),
  note:'Each case is independent. Prerequisite clears are fixture assumptions, not measured progression. Before KE3 only starters; Senya and slot receipts are staged. Same seed list across builds/teams. No player save or production content modified.'};
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 const rows=[];const started=Date.now();
 for(const spec of selected){
  const {campaign,metadata}=senyaFixture(content,spec);fs.writeFileSync(path.join(out,'fixtures',spec.id+'.json'),encodeGameSave(campaign,content));
  if(args.includes('--generate-only')){rows.push({id:spec.id,fixture:metadata});continue;}
  const trials=seeds.map(seed=>simulateSenya(content,campaign,spec,seed,{policy}));
  fs.writeFileSync(path.join(out,spec.id+'.json'),JSON.stringify({commit,policy:policy==='heuristic'?SENYA_POLICY:'engine-auto-farm',fixture:metadata,trials},null,2)+'\n');
  const wins=trials.filter(r=>r.outcome==='victory'),mean=(list,get)=>list.length?Number((list.reduce((n,r)=>n+get(r),0)/list.length).toFixed(2)):null;
  const row={id:spec.id,enemyLevel:content.progressionRules.default.questDifficulties[spec.difficulty].level,partyLevel:metadata.build.level,senyaSlots:metadata.senyaSlots,seeds:seeds.length,wins:wins.length,defeats:trials.filter(t=>t.outcome==='defeat').length,bounded:trials.filter(t=>t.outcome==='bounded'||t.outcome==='draw').length,errors:trials.filter(t=>t.outcome==='error').length,meanWinRounds:mean(wins,t=>t.rounds),meanEndHp:mean(trials,t=>t.party.reduce((n,a)=>n+a.hp,0)),meanEndMp:mean(trials,t=>t.party.reduce((n,a)=>n+a.mp,0))};
  rows.push(row);console.log(spec.id,`${row.wins}/${seeds.length}`,`bounded=${row.bounded}`,`errors=${row.errors}`,`rounds=${row.meanWinRounds}`);
  fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify({commit,policy:policy==='heuristic'?SENYA_POLICY:'engine-auto-farm',suite,maxRounds:100,maxActions:1800,elapsedMs:Date.now()-started,rows},null,2)+'\n');
 }
 if(args.includes('--generate-only'))fs.writeFileSync(path.join(out,'fixture-index.json'),JSON.stringify(rows,null,2)+'\n');
 if(rows.some(r=>r.errors))process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
