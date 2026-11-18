import {normalizeLevelState} from './leveling.js';
import {createGameSave} from './game-save.js';
import {resolveCharacter} from './progression.js';
export function tournamentRegistrationFlags(state){return {customTeamName:Boolean(state?.firstClear),customRoster:Boolean(state?.firstClear),accountBuild:Boolean(state?.firstClear)};}
export function prepareTournamentRegistration(campaign,content,definition,{teamName,roster}={}){
 if(teamName===undefined&&roster===undefined)return null;
 if(!campaign.tournaments?.firstClear)throw Error('Hãy vô địch giải lần đầu để tự đăng ký đội.');
 if(typeof teamName!=='string'||teamName.trim().length<1||teamName.trim().length>40||/[\x00-\x1f\x7f]/.test(teamName))throw Error('Tên đội cần từ 1 đến 40 ký tự và không có ký tự điều khiển.');
 if(!Array.isArray(roster)||roster.length!==6||new Set(roster).size!==6||roster.some(id=>!content.characters[id]||!campaign.unlockedCharacterIds.includes(id)||content.characters[id].developerOnly))throw Error('Hãy chọn sáu nhân vật khác nhau đã sở hữu.');
 const loadout=createGameSave(content);
 loadout.unlockedCharacterIds=[...new Set([...loadout.unlockedCharacterIds,...roster])];loadout.storyFlags=[...campaign.storyFlags];
 for(const id of roster)loadout.characters[id]=structuredClone(campaign.characters[id]);
 for(const key of ['equipment','extraGearSlots','equippedExclusiveGear'])loadout[key]=Object.fromEntries(roster.filter(id=>Object.hasOwn(campaign[key]??{},id)).map(id=>[id,structuredClone(campaign[key][id])]));
 const gearIds=new Set(Object.values(loadout.equipment).flat().filter(Boolean));loadout.gear=structuredClone(campaign.gear.filter(g=>gearIds.has(g.id)));
 const exclusiveIds=new Set(Object.values(loadout.equippedExclusiveGear));loadout.exclusiveGear=structuredClone(campaign.exclusiveGear.filter(g=>exclusiveIds.has(g.templateId)));
 loadout.gacha.totalPulls=campaign.gacha.totalPulls;loadout.craftedGearSerial=campaign.craftedGearSerial??0;loadout.illusion.gearSerial=campaign.illusion?.gearSerial??0;
 loadout.party=roster.slice(0,4);loadout.partyPresets[0].slots=[...loadout.party];
 const team=structuredClone(content.tournamentTeams[definition.playerTeamId]);team.name=teamName.trim();team.members=roster.map(id=>({id:'registered.'+id,name:content.characters[id].name,identity:{kind:'player_loan',characterId:id},buildId:'registered.'+id}));
 const builds=Object.fromEntries(roster.map(id=>['registered.'+id,{id:'registered.'+id,templateCharacterId:id,source:'account'}]));
 // Resolve now to reject impossible build data before committing a season.
 for(const id of roster){normalizeLevelState(content,loadout.characters[id]);resolveCharacter(content,loadout,id);}
 return {mode:'account',teamName:team.name,characterIds:[...roster],team,builds,loadout};
}
export function validateRegisteredRun(run,fail){
 const reg=run.registration;if(reg===undefined)return;
 if(!reg||reg.mode!=='account'||!run.firstClearAtCreation||typeof reg.teamName!=='string'||!reg.teamName.trim()||reg.teamName.length>40||!Array.isArray(reg.characterIds)||reg.characterIds.length!==6||new Set(reg.characterIds).size!==6)fail();
 const team=run.snapshot.teams[run.snapshot.definition.playerTeamId];
 if(team.members.some(m=>m.identity.kind!=='player_loan'||run.snapshot.builds[m.buildId]?.templateCharacterId!==m.identity.characterId))fail();
 for(const id of reg.characterIds)normalizeLevelState(run.snapshot.kits,run.snapshot.accountCampaign?.characters?.[id]);
 if(team.name!==reg.teamName||JSON.stringify(team.members.map(m=>m.identity.characterId))!==JSON.stringify(reg.characterIds)||!run.snapshot.accountCampaign||!reg.characterIds.every(id=>run.snapshot.accountCampaign.unlockedCharacterIds.includes(id)&&run.snapshot.accountCampaign.characters[id]&&run.snapshot.kits.characters[id]))fail();
}
