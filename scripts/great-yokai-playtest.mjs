import fs from 'node:fs';
import {loadContent} from './load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
import {completeStoryEvent} from '../src/core/story-events.js';
import {resolveCharacter} from '../src/core/progression.js';
import {allocationLimit,unspentPoints} from '../src/core/leveling.js';
import {characterSkillIds,skillLineId,masteryEnabled} from '../src/core/skill-rules.js';
import {createBattle,activeActor,executeAction,executeEnemyTurn,planAutoBattleTurn} from '../src/core/battle.js';
import {seededRandom} from '../src/core/random.js';

const content=await loadContent();
const arg=(key,fallback)=>process.argv.find(a=>a.startsWith('--'+key+'='))?.split('=')[1]??fallback;
const count=Number(arg('seeds','30')),levels=arg('levels','60,70,80,90').split(',').map(Number);
if(!Number.isInteger(count)||count<1||count>1000||levels.some(l=>![60,70,80,90].includes(l)))throw Error('Invalid benchmark arguments');
const teams=[
  {id:'free_senya',party:['senya','iris','garrek','elaine'],power:['attack','maxMp','defense','magic']},
  {id:'old_mastery',party:['arthur','iris','takeshi','elaine'],power:['attack','maxMp','attack','magic']},
  {id:'sword_soul',party:['chiyoko','shion','amiya','kaguya'],power:['attack','attack','magic','magic']},
  {id:'cleanse_guard',party:['anabel','artesia','minerva','geoffrey'],power:['attack','magic','magic','defense']},
];
const selected=arg('teams',teams.map(t=>t.id).join(',')).split(',');
const fixtures=[];
for(const team of teams.filter(t=>selected.includes(t.id))){
  const c=createGameSave(content);c.unlockedCharacterIds=Object.keys(content.characters);c.party=[...team.party];c.partyPresets[0].slots=[...team.party];
  c.storyFlags.push('east_campaign_completed','illusion.sinister_unlocked');
  for(const u of Object.values(content.upgrades))completeStoryEvent(c,content,u.requires.storyFlag);
  c.storyFlags.push('arthur.ogre_rank_unlocked');
  c.gear=[];c.equipment={};
  for(const [index,id] of team.party.entries()){
    const state=c.characters[id],power=team.power[index];
    Object.assign(state,{level:50,xp:0,limitBreakRank:3,allocations:{},skillRanks:{basic:masteryEnabled(content,id)?8:5}});
    for(const key of [power,'maxHp',power==='defense'?'resistance':'maxMp','resistance','defense','attack','magic']){
      if(state.allocations[key])continue;
      const amount=Math.min(allocationLimit(content,50,key),unspentPoints(content,state));if(amount>0)state.allocations[key]=amount;
    }
    for(const skillId of characterSkillIds(content,state,id)){
      const skill=content.abilities[skillId];
      if(skill.rankUnlockFlag&&!c.storyFlags.includes(skill.rankUnlockFlag))c.storyFlags.push(skill.rankUnlockFlag);
      if(skill.rankable&&skill.growthProfile!=='fixed')state.skillRanks[skillLineId(skill)]=masteryEnabled(content,id)&&skill.masteryEligible!==false?8:5;
    }
    c.extraGearSlots[id]=3;c.equipment[id]=[];
    for(let slot=0;slot<6;slot++){
      const stat=slot<4?power:'maxHp',scale=content.economy.default.gearStats.find(s=>s.stat===stat).scale;
      const g={id:'gear_'+(c.gear.length+1),typeId:'t3_focused',stats:{[stat]:5*scale}};
      c.gear.push(g);c.equipment[id].push(g.id);
    }
  }
  c.gacha.totalPulls=c.gear.length;encodeGameSave(c,content);
  fixtures.push({id:team.id,campaign:c,stats:Object.fromEntries(team.party.map(id=>[id,resolveCharacter(content,c,id).stats]))});
}
const cases=[],results=[];
for(const f of fixtures)for(const level of levels)for(const encounterId of ['miraebolis_superboss','east_super_mountain','east_super_fox','east_super_twins'])cases.push({f,level,encounterId});
for(const [index,{f,level,encounterId}] of cases.entries()){
  const runs=[];
  for(let i=0;i<count;i++){
    const seed=2026111501+i,b=createBattle(content,f.campaign,encounterId,seededRandom(seed),{enemyLevel:level});
    let steps=0,error=null;
    try{
      while(!b.outcome&&steps++<2000){
        const a=activeActor(b);if(!a)throw Error('Missing active actor');
        if(a.team==='enemy')executeEnemyTurn(b);
        else executeAction(b,planAutoBattleTurn(b));
        for(const actor of b.actors)if(![actor.hp,actor.mp,actor.shield].every(Number.isFinite))throw Error('Non-finite actor state');
      }
    }catch(e){error=e.message;}
    runs.push({seed,outcome:b.outcome??'step_limit',round:b.round,steps,error,
      survivors:b.actors.filter(a=>a.team==='party'&&a.hp>0).length,
      remaining:b.actors.filter(a=>a.team==='party').map(a=>({id:a.id,hp:a.hp,mp:a.mp})),
      mechanics:{breaks:b.log.filter(l=>l.includes('đã phá')).length,interrupted:b.log.filter(l=>l.includes('đã bị hủy')).length}});
  }
  const wins=runs.filter(r=>r.outcome==='victory'),rounds=wins.map(r=>r.round).sort((a,b)=>a-b);
  const row={team:f.id,level,encounterId,wins:wins.length,total:count,winRate:wins.length/count,
    medianWinRound:rounds.length?rounds[Math.floor(rounds.length/2)]:null,errors:runs.filter(r=>r.error).length,runs};
  results.push(row);
  process.stdout.write(`${index+1}/${cases.length} ${f.id} Lv${level} ${encounterId}: ${row.wins}/${count}, median ${row.medianWinRound??'-'}, errors ${row.errors}\n`);
}
const report={date:'2026-11-15',policy:'current planAutoBattleTurn / arena AI, no bespoke boss strategy',
  assumptions:'Synthetic endgame unlocks; Lv50 legal allocation; 6 T3 focused gear/actor (four power + two HP); R5 or published PvE Mastery3; no exclusive, T4 or consumables; same fixtures and paired seeds for all four encounters.',
  fixtures:fixtures.map(f=>({id:f.id,stats:f.stats,campaign:f.campaign})),results};
fs.mkdirSync('test-results',{recursive:true});
const output=arg('out','test-results/great-yokai-playtest.json');fs.writeFileSync(output,JSON.stringify(report,null,2));
if(results.some(r=>r.errors))process.exitCode=1;
