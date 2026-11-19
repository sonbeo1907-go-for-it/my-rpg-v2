export function academyMusicGroup(run,{combat=false,special=false,outcome=null}={}){
 if(outcome==='victory')return 'victory';
 if(special)return 'tournament_emergent';
 const late=Boolean(run&&['quarterfinal','semifinal','final'].includes(run.phase));
 return combat&&!outcome?(late?'tournament_battle_sec_half':'tournament_battle_first_half'):(late?'tournament_second_half':'tournament_first_half');
}
