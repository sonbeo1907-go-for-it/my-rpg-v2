import {createBattle} from './battle.js';
// A chapter is one run: immutable departure loadout, persistent actors, one final reward.
function makeWave(content,run,previous=null) {
  return createBattle(content,run.partyCampaign,run.encounterId,run.random,{
    storyWaveIndex:run.waveIndex,
    partyActors:previous?.actors.filter(actor=>actor.team==='party'),
    sourceActors:previous?[...(previous.sourceActors??[]),...previous.actors.filter(actor=>actor.team==='enemy')]:[],
    turnOrderField:previous?.turnOrderField,
    roundOffset:previous?.round??0,
    enemyIdPrefix:'story_'+(run.waveIndex+1)+'_enemy_',
    log:[...(previous?.log??[]).slice(-197),'— '+content.encounters[run.encounterId].name+' · Đợt '+(run.waveIndex+1)+'/'+run.waveCount+' —']
  });
}
export function createStoryRun(content,campaign,encounterId,random) {
  const encounter=content.encounters[encounterId];
  if (!encounter?.travelerStory || !encounter.waves) throw new Error('Chương không có chuỗi đợt quái.');
  const run={kind:'story',encounterId,waveIndex:0,waveCount:encounter.waves.length,partyCampaign:structuredClone(campaign),random,claimed:false,battle:null};
  run.battle=makeWave(content,run);return run;
}
export function isFinalStoryWave(run) {return run.waveIndex===run.waveCount-1;}
export function advanceStoryWave(content,run) {
  if(run.kind!=='story'||run.battle.outcome!=='victory'||isFinalStoryWave(run)||run.claimed)throw new Error('Chưa thể chuyển đợt truyện.');
  const nextIndex=run.waveIndex+1;
  const next=makeWave(content,{...run,waveIndex:nextIndex},run.battle);
  run.waveIndex=nextIndex;run.battle=next;return next;
}
