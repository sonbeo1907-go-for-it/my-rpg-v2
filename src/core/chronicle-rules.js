import {dungeonDay} from './dungeon-rules.js';
export const CHRONICLE_ROOT='/chronicles/book1';
export const chronicleScenePath=id=>CHRONICLE_ROOT+'?location='+encodeURIComponent(id)+'&scene=1';
export function chronicleWeek(now=new Date()) {
 const day=dungeonDay(now),date=new Date(day+'T00:00:00Z');date.setUTCDate(date.getUTCDate()-((date.getUTCDay()+6)%7));return date.toISOString().slice(0,10);
}
export function chroniclePartyLevel(campaign){const ids=campaign.party.filter(Boolean);if(!ids.length)throw Error('Đội hình chưa sẵn sàng.');return Math.min(40,Math.floor(ids.reduce((n,id)=>n+campaign.characters[id].level,0)/ids.length));}
export function chronicleLocation(content,id){const l=content.chronicles?.book1.locations.find(l=>l.id===id);if(!l)throw Error('Địa điểm không tồn tại.');return l;}
export function chronicleCleared(state,id){return state.firstClearIds.includes(id)||state.eventClearIds.includes(id);}
export function chronicleEventReady(content,state,event){return Boolean(event&&event.requires.every(id=>chronicleCleared(state,id))&&(event.intro||state.firstClearIds.includes(chronicleLocation(content,event.locationId).introId)));}
export function chronicleLocationOpen(content,state,id){return chronicleLocation(content,id).requires.every(req=>chronicleCleared(state,req));}
export function chronicleObservationReady(content,state){return chronicleEventReady(content,state,content.chronicleEvents['book1.j04'])&&!state.aliceFirstEncounterCleared;}
export function chronicleEncounterAllowed(encounter,campaign){const s=campaign.chronicles;if(!s||encounter.category!=='chronicle')return false;return Object.values(s.pendingByLocation).some(p=>p.eventId===encounter.chronicleEventId&&p.status!=='completed'&&p.stepId===p.battleStepId);}
export function validateChronicleContent(content){
 const errors=[],book=content.chronicles?.book1,events=content.chronicleEvents;
 if(!book||!events)return ['Missing chronicles content'];
 const fail=x=>errors.push('Chronicle: '+x),locations=book.locations;
 if(!Array.isArray(locations)||locations.length!==10||new Set(locations.map(l=>l.id)).size!==10||book.weeklyRewards!==28)return ['Invalid chronicle book'];
 for(const l of locations){if(!l.name||!l.description||!/^scene-[a-j]-[a-z-]+\.svg$/.test(l.art)||!events[l.introId]?.intro||events[l.introId].locationId!==l.id||!Array.isArray(l.requires)||l.requires.some(id=>!events[id])||!Number.isFinite(l.npcWeight)||l.npcWeight<0||l.npcWeight>1)fail('invalid location '+l.id);}
 for(const e of Object.values(events)){
  if(e.bookId!=='book1'||!locations.some(l=>l.id===e.locationId)||!e.name||!e.description||!e.ending||typeof e.intro!=='boolean'||typeof e.hidden!=='boolean'||!Array.isArray(e.requires)||e.requires.some(id=>!events[id])||!Array.isArray(e.steps)||!e.steps.length){fail('invalid event '+e.id);continue;}
  const stepIds=e.steps.map(s=>s.id);if(new Set(stepIds).size!==stepIds.length)fail('duplicate step '+e.id);
  for(let i=0;i<e.steps.length;i++){const s=e.steps[i];if(!s.narration||s.battle&&!e.encounterId||!s.battle&&(!s.actions?.length||s.actions.some(a=>!a.id||!a.label||a.next!=='complete'&&!stepIds.slice(i+1).includes(a.next))))fail('invalid step '+e.id);}
  if(e.encounterId){const enc=content.encounters[e.encounterId];if(enc?.category!=='chronicle'||enc.chronicleEventId!==e.id||enc.rewardPolicy!=='none'||e.steps.filter(s=>s.battle).length!==1)fail('invalid combat '+e.id);}
 }
 const visiting=new Set(),done=new Set();function walk(id){if(visiting.has(id)){fail('dependency cycle '+id);return;}if(done.has(id)||!events[id])return;visiting.add(id);for(const dep of events[id].requires)walk(dep);visiting.delete(id);done.add(id);}for(const id of Object.keys(events))walk(id);
 return errors;
}
