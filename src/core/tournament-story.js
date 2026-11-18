export function tournamentStoryEntries(run){
 if(!run)return [];
 const scenes=run.snapshot.scenes??{},d=run.snapshot.definition,player=d.playerTeamId,roster=run.snapshot.teams[player].members.map(m=>run.snapshot.builds[m.buildId].templateCharacterId),account=run.registration?.mode==='account',entries=[];
 const add=(id,matchId=null)=>{const scene=scenes[id];if(!scene||scene.requiresCharacterId&&!roster.includes(scene.requiresCharacterId))return;entries.push({key:id+(matchId?':'+matchId:''),sceneId:id,matchId,...scene});};
 if(account)add('academy.custom_registration');else {add(d.sceneHooks.registration);add(d.sceneHooks.opening);}
 const current=run.fixtures.filter(m=>m.phase===run.phase&&m.round===run.round);
 for(const m of run.fixtures.filter(m=>m.teams.includes(player)&&(m.result||current.includes(m)))){
  if(!account){if(m.phase==='group')add(d.sceneHooks.groupBefore[String(m.round)]);else if(m.phase!=='playoff')add(d.sceneHooks.knockoutBefore[m.phase]);}
  const enemy=m.teams.find(id=>id!==player),team=run.snapshot.teams[enemy];
  for(const id of team.storySceneIds??[]){const scene=scenes[id];if(scene?.trigger==='before_match')add(id,m.id);if(m.result&&scene?.trigger===(m.result.winnerId===player?'after_win':'after_loss'))add(id,m.id);}
 }
 for(const team of Object.values(run.snapshot.teams)){
  if(team.controller==='player')continue;
  for(const id of team.storySceneIds??[]){const scene=scenes[id];if(scene?.trigger==='meet')add(id);
   if(scene?.trigger==='eliminated_elsewhere'){
    const exited=run.fixtures.some(m=>['quarterfinal','semifinal','final'].includes(m.phase)&&m.teams.includes(team.id)&&!m.teams.includes(player)&&m.result&&m.result.winnerId!==team.id)||run.qualified&&!run.qualified[Object.keys(run.groups).find(g=>run.groups[g].includes(team.id))].slice(0,2).includes(team.id)&&run.phase!=='playoff';
    if(exited)add(id);
   }
  }
 }
 if(run.outcome&&!account&&run.reason!=='withdrawn')add(d.endings[run.outcome]);
 return entries.filter((e,i,a)=>a.findIndex(x=>x.key===e.key)===i);
}
export function readTournamentStory(campaign,{runId,revision,key}){
 const next=structuredClone(campaign),s=next.tournaments,r=s?.activeRun;if(!r||r.runId!==runId||s.revision!==revision||!tournamentStoryEntries(r).some(e=>e.key===key))throw Error('Câu chuyện chưa xuất hiện trong mùa giải này.');
 r.storyReadKeys??=[];if(!r.storyReadKeys.includes(key)){r.storyReadKeys.push(key);s.revision++;}return next;
}
