import {seededRandom} from './random.js';
import {rankedOwnedCount,arenaRules,arenaTier} from './arena-progression.js';
export function createArenaDraft(content,campaign,seed,rankId=arenaTier(content,campaign.arenaProgress?.rating??0).id){
 if(rankedOwnedCount(content,campaign)<arenaRules(content).rankedMinimumOwned)throw Error('Đấu Hạng cần sở hữu ít nhất 16 nhân vật chính thức.');
 const first=seededRandom(seed)()<.5?'party':'enemy',other=first==='party'?'enemy':'party';
 const count=arenaRules(content).preBansPerSide?.[rankId];if(!Number.isSafeInteger(count)||count<1)throw Error('Hạng Đấu Trường không hợp lệ.');
 const preBanOrder=Array.from({length:count*2},(_,i)=>i%2?'enemy':'party');
 return {seed,rankId,preBans:{party:[],enemy:[]},preBanOrder,preBanCursor:0,order:[first,other,other,first,first,other,other,first,first,other],cursor:0,picks:{party:[],enemy:[]},bans:{party:null,enemy:null},phase:preBanOrder.length?'preban':'pick'};
}
export function prebanCandidates(content,draft){const banned=new Set([...draft.preBans.party,...draft.preBans.enemy]);return Object.values(content.characters).filter(c=>!c.developerOnly&&!banned.has(c.id));}
export function prebanDraftCharacter(content,draft,team,id){
 if(draft.phase!=='preban'||draft.preBanOrder[draft.preBanCursor]!==team||!prebanCandidates(content,draft).some(c=>c.id===id))throw Error('Không thể cấm nhân vật này ở lượt hiện tại.');
 const d=structuredClone(draft);d.preBans[team].push(id);d.preBanCursor++;if(d.preBanCursor===d.preBanOrder.length)d.phase='pick';return d;
}
export function chooseDraftPreban(content,campaign,draft){
 const pool=prebanCandidates(content,draft),owned=pool.filter(c=>campaign.unlockedCharacterIds.includes(c.id));
 const random=seededRandom((draft.seed+draft.preBanCursor*7919)^0x71bd);let best=null,max=-Infinity;
 for(const c of owned.length?owned:pool){const state=campaign.characters[c.id],rank=Object.values(state?.skillRanks??{}).reduce((n,r)=>n+r,0),gear=(campaign.equipment[c.id]??[]).filter(Boolean).length;
  const score=(state?.level??1)*2+rank+gear*4+(campaign.equippedExclusiveGear[c.id]?8:0)+(c.stats.speed*.25)+random()*15;
  if(score>max){best=c.id;max=score;}
 }return best;
}
export function draftCandidates(content,campaign,draft,team){
 const used=new Set([...draft.picks.party,...draft.picks.enemy,...draft.preBans.party,...draft.preBans.enemy]);
 const pool=Object.values(content.characters).filter(c=>!c.developerOnly&&!used.has(c.id));
 const freeOwned=pool.filter(c=>campaign.unlockedCharacterIds.includes(c.id)).length,needed=5-draft.picks.party.length;
 // An AI pick cannot consume the last available options needed by a 16-character player roster.
 return pool.filter(c=>team==='party'?campaign.unlockedCharacterIds.includes(c.id):!campaign.unlockedCharacterIds.includes(c.id)||freeOwned>needed);
}
export function pickDraftCharacter(content,campaign,draft,team,id){
 if(draft.phase!=='pick'||draft.order[draft.cursor]!==team||!draftCandidates(content,campaign,draft,team).some(c=>c.id===id))throw Error('Không thể chọn nhân vật này.');
 const d=structuredClone(draft);d.picks[team].push(id);d.cursor++;if(d.cursor===10)d.phase='ban';return d;
}
export function banDraftCharacter(draft,team,id){const opponent=team==='party'?'enemy':'party';if(draft.phase!=='ban'||draft.bans[team]||!draft.picks[opponent].includes(id))throw Error('Không thể cấm nhân vật này.');const d=structuredClone(draft);d.bans[team]=id;if(d.bans.party&&d.bans.enemy)d.phase='formation';return d;}
export function draftSurvivors(draft,team){const other=team==='party'?'enemy':'party';return draft.picks[team].filter(id=>id!==draft.bans[other]);}
const kind=d=>['tank','defensive_support'].includes(d.roleGroup)?'protect':d.roleGroup==='offensive_support'?'support':'damage';
function faction(c){return c.affiliations??c.affiliation??c.faction??[];}
function synergy(content,ids){let score=0;for(const id of ids){const a=content.characters[id];for(const other of ids.filter(k=>k!==id)){const f=JSON.stringify([faction(a),a.tags]),g=JSON.stringify([faction(content.characters[other]),content.characters[other].tags]);if(['valmont','vertosse','black_rose','sword_soul'].some(k=>f.includes(k)&&g.includes(k)))score+=2;}}return score;}
export function chooseDraftPick(content,campaign,draft){const rng=seededRandom(draft.seed+draft.cursor*7919),own=draft.picks.enemy,opposing=draft.picks.party,counts={protect:0,support:0,damage:0};own.forEach(k=>counts[kind(content.characters[k])]++);let best=null,max=-Infinity;
 for(const c of draftCandidates(content,campaign,draft,'enemy')){const k=kind(c),score=(counts[k]<(k==='damage'?2:1)?8:0)+synergy(content,[...own,c.id])-synergy(content,own)+rng()*6+(opposing.some(id=>['chelsea','takeshi'].includes(id))&&['rowan','lumine','yumia','yufina'].includes(c.id)?5:0);if(score>max){best=c.id;max=score;}}return best;
}
export function chooseDraftBan(content,draft){const ids=draft.picks.party,enemy=draft.picks.enemy;const random=seededRandom(draft.seed^0xa1b2c3);let best=null,max=-Infinity;for(const id of ids){const role=kind(content.characters[id]),remaining=ids.filter(k=>k!==id),score=synergy(content,ids)-synergy(content,remaining)+(ids.filter(k=>kind(content.characters[k])===role).length===1?10:0)+(enemy.some(k=>['chelsea','takeshi'].includes(k))&&['rowan','lumine','yufina','yumia'].includes(id)?7:0)+random()*3;if(score>max){max=score;best=id;}}return best;}
export function validateDraftFormation(draft,party,content){
 const expected=draftSurvivors(draft,'party'),pre=[...draft.preBans.party,...draft.preBans.enemy],picks=[...draft.picks.party,...draft.picks.enemy];
 const invalid=draft.phase!=='formation'||draft.cursor!==10||draft.picks.party.length!==5||draft.picks.enemy.length!==5||new Set(picks).size!==10||draft.preBanCursor!==draft.preBanOrder.length||pre.length!==draft.preBanOrder.length||new Set(pre).size!==pre.length||pre.some(id=>picks.includes(id))||!draft.picks.enemy.includes(draft.bans.party)||!draft.picks.party.includes(draft.bans.enemy);
 if(invalid||content&&draft.preBanCursor!==2*arenaRules(content).preBansPerSide[draft.rankId]||!Array.isArray(party)||party.length!==4||new Set(party).size!==4||party.some(k=>!expected.includes(k)))throw Error('Đội hình không khớp kết quả cấm và chọn.');return [...party];
}
export function arrangeDraftAI(content,draft){const ids=draftSurvivors(draft,'enemy');const buffer=ids.find(id=>['artesia','roland'].includes(id));if(buffer){const damage=ids.filter(id=>id!==buffer&&kind(content.characters[id])==='damage'),right=damage[0]??ids.find(id=>id!==buffer),left=damage[1]??ids.find(id=>id!==buffer&&id!==right),middle=ids.find(id=>id!==buffer&&id!==right&&id!==left);return [buffer,right,middle,left];}const rivia=ids.indexOf('rivia');if(rivia>0)[ids[0],ids[rivia]]=[ids[rivia],ids[0]];return ids;}
