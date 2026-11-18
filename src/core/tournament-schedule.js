export function tournamentRandom(seed){let state=2166136261;for(const c of String(seed))state=Math.imul(state^c.charCodeAt(0),16777619);return()=>{state=(state+0x6D2B79F5)|0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
export function tournamentShuffle(ids,seed){const a=[...ids].sort(),rng=tournamentRandom(seed);for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function drawTournamentGroups(definition,teams,participants,seed,introduction){
 const groups={A:[],B:[],C:[],D:[]},labels=Object.keys(groups),pair=introduction?definition.selection.introduction.sameGroupTeamIds:[definition.playerTeamId];
 for(let pot=1;pot<=4;pot++){
  const ids=tournamentShuffle(participants.filter(id=>teams[id].seedPot===pot),seed+':'+pot),locked=ids.find(id=>pair.includes(id));
  if(locked){groups.A.push(locked);ids.splice(ids.indexOf(locked),1);}
  const open=locked?labels.slice(1):labels;open.forEach((label,i)=>groups[label].push(ids[i]));
 }
 return groups;
}
export function groupFixtures(groups){
 const pairs=[[[0,3],[1,2]],[[0,2],[3,1]],[[0,1],[2,3]]],fixtures=[];
 for(let round=1;round<=3;round++)for(const[group,ids]of Object.entries(groups))for(const[a,b]of pairs[round-1])fixtures.push({id:`group-${group}-${round}-${a}`,phase:'group',round,group,teams:[ids[a],ids[b]],result:null});
 return fixtures;
}
export function tournamentStandings(run,group){
 const ids=run.groups[group],matches=run.fixtures.filter(m=>m.phase==='group'&&m.group===group&&m.result),rows=ids.map(id=>({teamId:id,points:0,survivorDifference:0,played:0}));
 for(const m of matches)for(let i=0;i<2;i++){const r=rows.find(r=>r.teamId===m.teams[i]);r.played++;if(m.result.winnerId===r.teamId)r.points+=3;r.survivorDifference+=m.result.survivors[i]-m.result.survivors[1-i];}
 for(const r of rows){const tied=rows.filter(x=>x.points===r.points).map(x=>x.teamId);r.headToHead=matches.filter(m=>m.teams.every(id=>tied.includes(id))&&m.result.winnerId===r.teamId).length*3;}
 rows.sort((a,b)=>b.points-a.points||b.headToHead-a.headToHead||b.survivorDifference-a.survivorDifference||a.teamId.localeCompare(b.teamId));
 return rows;
}
export function simulateTournamentMatch(run,match){
 const rng=tournamentRandom(run.seeds.simulation+':'+match.id),[a,b]=match.teams.map(id=>run.snapshot.teams[id]);
 const strength=t=>{const sources=t.members.map(m=>run.snapshot.builds[m.buildId].templateCharacterId),roles=sources.map(id=>run.snapshot.kits.characters[id].roleGroup);return t.simulationRating+(new Set(roles).size*3)+(roles.includes('defensive_support')?4:0);};
 const probability=Math.max(.05,Math.min(.95,strength(a)/(strength(a)+strength(b))+(rng()-.5)*run.snapshot.definition.simulation.maxUpsetInfluence));
 const index=rng()<probability?0:1,survivors=[0,0];survivors[index]=1+Math.floor(rng()*4);
 return {winnerId:match.teams[index],survivors,source:'simulation'};
}
