import {createBattle,executeAction,executeEnemyTurn,activeActor} from './battle.js';
import {createGameSave} from './game-save.js';
import {seededRandom} from './random.js';
import {characterSkillIds} from './skill-rules.js';
import {snapshotChronicleBattle,restoreChronicleBattle} from './chronicle-combat.js';
import {currentTournamentPlayerMatch,tournamentCombatSeed,checkpointTournament,proposeTournamentResult} from './tournament-session.js';
function seedNumber(text){let n=2166136261;for(const c of text)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
export function tournamentContent(content,run){return {...content,...run.snapshot.kits,characters:{...content.characters,...run.snapshot.kits.characters}};}
export function tournamentLoanCampaign(content,run,teamId){
 const team=run.snapshot.teams[teamId],campaign=createGameSave(content),members=team.controller==='player'?run.lineup.map(id=>team.members.find(m=>m.id===id)):team.members;
 campaign.party=members.map(m=>run.snapshot.builds[m.buildId].templateCharacterId);campaign.partyPresets[0].slots=[...campaign.party];campaign.unlockedCharacterIds=[...new Set([...campaign.unlockedCharacterIds,...team.members.map(m=>run.snapshot.builds[m.buildId].templateCharacterId)])];
 for(const m of team.members){const b=run.snapshot.builds[m.buildId],id=b.templateCharacterId;Object.assign(campaign.characters[id],{level:b.level,limitBreakRank:b.limitBreakRank,allocations:structuredClone(b.allocations),upgradeIds:[],skillRanks:{basic:b.basicRank}});
  for(const key of characterSkillIds(content,campaign.characters[id],id)){const a=content.abilities[key];if(a.rankable!==false&&a.growthProfile!=='fixed'&&a.activation!=='passive')campaign.characters[id].skillRanks[a.skillLineId??a.id]=b.skillRank;}
  campaign.equipment[id]=b.equipment.map(g=>{const gearId='gear_'+(campaign.gear.length+1);campaign.gear.push({id:gearId,typeId:g.typeId,stats:structuredClone(g.bonuses)});return gearId;});
 }
 return campaign;
}
export function createTournamentBattle(content,campaign){
 const run=campaign.tournaments?.activeRun,match=currentTournamentPlayerMatch(run);if(!match||run.pendingResult&&!run.battleCheckpoint)throw Error('Không có trận đấu chờ xuất chiến.');
 const scoped=tournamentContent(content,run);
 if(run.battleCheckpoint){const snap=run.battleCheckpoint.data;if(!snap.state||snap.matchId!==match.id)throw Error('Bản lưu trận tỷ thí không hợp lệ.');const battle=restoreChronicleBattle(scoped,snap);if(battle.tournament?.runId!==run.runId||battle.tournament.matchId!==match.id||battle.actors.length!==8||battle.actors.some(a=>!a.id.startsWith(run.runId+':')||!Number.isFinite(a.hp)||a.hp<0||!scoped.characters[a.definitionId]))throw Error('Không thể khôi phục trận tỷ thí.');return battle;}
 const player=run.snapshot.definition.playerTeamId,enemy=match.teams.find(id=>id!==player),tournament={runId:run.runId,matchId:match.id,playerTeamId:player,enemyTeamId:enemy,maxMainRounds:run.snapshot.definition.combat.maxMainRounds,directHpDamage:{party:0,enemy:0}};
 const b=createBattle(scoped,tournamentLoanCampaign(scoped,run,player),'forest_patrol',seededRandom(seedNumber(tournamentCombatSeed(run,match.id))),{opponentCampaign:tournamentLoanCampaign(scoped,run,enemy),tournament,unitIdPrefix:run.runId+':'});
 for(const a of b.actors){const t=run.snapshot.teams[a.team==='party'?player:enemy],m=t.members.find(m=>run.snapshot.builds[m.buildId].templateCharacterId===a.definitionId);a.name=m.name;a.characterName=m.name;}
 b.log=['— Tỷ thí học viện · Vòng Chính 1 —'];return b;
}
export function saveTournamentBattle(campaign,battle){const run=campaign.tournaments.activeRun,args={runId:run.runId,revision:campaign.tournaments.revision,matchId:battle.tournament.matchId};const data={...snapshotChronicleBattle(battle),matchId:args.matchId};let next=checkpointTournament(campaign,{...args,checkpoint:data});
 if(battle.outcome){const player=run.snapshot.definition.playerTeamId,winnerId=battle.outcome==='victory'?player:battle.tournament.enemyTeamId,match=run.fixtures.find(m=>m.id===args.matchId),survivors=match.teams.map(id=>battle.actors.filter(a=>a.team===(id===player?'party':'enemy')&&a.hp>0).length);next=proposeTournamentResult(next,{...args,revision:next.tournaments.revision,winnerId,survivors});}return next;}
export function stepTournamentBattle(content,campaign,command){const b=createTournamentBattle(content,campaign);if(activeActor(b)?.team==='enemy')executeEnemyTurn(b);else if(command)executeAction(b,command);else throw Error('Hãy chọn kỹ năng.');return {battle:b,campaign:saveTournamentBattle(campaign,b)};}
