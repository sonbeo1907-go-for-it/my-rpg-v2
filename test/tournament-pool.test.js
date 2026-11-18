import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {selectTournamentParticipants,validateTournamentParticipants} from '../src/core/tournament-pool.js';
import {validateTournamentContent} from '../src/core/tournament-content.js';
const c=await loadContent(),d=c.tournaments.academy_tournament,teams=c.tournamentTeams;
function rejects(change,pattern){const x=structuredClone(c);change(x);let e;assert.doesNotThrow(()=>e=validateTournamentContent(x));assert.ok(e.length);if(pattern)assert.match(e.join('\n'),pattern);}
test('introduction remains fixed before First Clear regardless of supplied draw seed',()=>{
 const a=selectTournamentParticipants(d,teams,{drawSeed:'one'}),b=selectTournamentParticipants(d,teams,{drawSeed:'two',firstClear:false});
 assert.deepEqual(a,b);assert.deepEqual(validateTournamentParticipants(d,teams,a,4),[]);
 assert.equal(teams['academy.old_friend'].seedPot,3);assert.equal(teams[d.playerTeamId].seedPot,4);
 assert.deepEqual(d.selection.introduction.sameGroupTeamIds,[d.playerTeamId,'academy.old_friend']);
});
test('100 seeds for both post-clear quotas preserve pot slots, identity and reproducibility without mutating content',()=>{
 const before=structuredClone(c),results=new Set();
 for(let seed=0;seed<100;seed++)for(const keyCount of [1,2]){
  const options={firstClear:true,drawSeed:String(seed),keyCount},ids=selectTournamentParticipants(d,teams,options);
  assert.deepEqual(validateTournamentParticipants(d,teams,ids,keyCount),[]);
  assert.equal(ids.filter(id=>teams[id].narrativeRole==='filler').length,15-keyCount);
  assert.deepEqual(selectTournamentParticipants(d,teams,options),ids);results.add(ids.join('|'));
 }
 assert.ok(results.size>50);assert.deepEqual(c,before);
});
test('weighted default selection uses only allowed quotas and all named teams can participate',()=>{
 const seen=new Set(),counts=new Set();for(let seed=0;seed<200;seed++){
  const ids=selectTournamentParticipants(d,teams,{firstClear:true,drawSeed:seed});ids.forEach(id=>seen.add(id));
  counts.add(ids.filter(id=>teams[id].narrativeRole==='key').length);
 }
 assert.deepEqual([...counts].sort(),[1,2]);for(const id of ['rotary','monica','lumine','eri'])assert.ok(seen.has('academy.named_'+id));
});
test('First Clear, separate seed streams and identity lifetime are explicit; old newSeed schema rejected',()=>{
 assert.equal(d.progression.firstClear.outcome,'champion');assert.equal(d.specialEncounters.gate,'first_clear_at_run_creation');
 assert.equal(d.seedPolicy.unitIdentity,'run_team_member');assert.ok(d.replay.preserve.includes('firstClear'));
 rejects(x=>x.tournaments.academy_tournament.replay.newSeed=true,/replay/);
 rejects(x=>x.tournaments.academy_tournament.progression.firstClear.outcome='eliminated',/First Clear/);
 rejects(x=>x.tournaments.academy_tournament.specialEncounters.gate='first_run',/encounter/);
 rejects(x=>x.tournaments.academy_tournament.seedPolicy.beforeFirstClear='new',/seed/);
});
test('same kit is not same person; named identity must match template and cannot be duplicated among participants',()=>{
 const ids=selectTournamentParticipants(d,teams);assert.deepEqual(validateTournamentParticipants(d,teams,ids),[]);
 rejects(x=>x.tournamentTeams['academy.named_monica'].members[0].identity.characterId='rotary',/identity/);
 const copy=structuredClone(teams),named=copy['academy.named_monica'].members[0];
 copy['academy.old_friend'].members[0]={...named,id:'independent-member-id'};
 const selected=[...ids];selected[selected.indexOf('academy.rival')]='academy.named_monica';
 assert.ok(validateTournamentParticipants(d,copy,selected).some(e=>e.includes('duplicate participant identity')));
});
test('unreachable quota, impossible old-friend pairing and malformed policies are rejected before save operations',()=>{
 rejects(x=>{for(const t of Object.values(x.tournamentTeams))if(t.seedPot===4&&t.controller==='ai')t.seedPot=3;},/seed pots|feasible/);
 rejects(x=>x.tournamentTeams['academy.old_friend'].seedPot=4,/seed pots|same-group/);
 rejects(x=>x.tournaments.academy_tournament.selection=null,/selection/);
 rejects(x=>x.tournaments.academy_tournament.selection.keyCountWeights=[null],/selection/);
 rejects(x=>x.tournamentTeams['academy.named_eri'].members[0].identity=null,/identity|member/);
});
