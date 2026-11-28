import {createTournamentBattle,saveTournamentBattle} from './tournament-combat.js';
export function abandonTournamentBattle(content,campaign,options={}){
 const battle=createTournamentBattle(content,campaign,options);
 if(battle.outcome)throw Error('Trận đã kết thúc. Hãy xác nhận kết quả.');
 battle.outcome='defeat';
 return saveTournamentBattle(campaign,battle);
}
