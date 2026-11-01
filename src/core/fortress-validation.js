import {FORTRESS_FLAGS} from './fortress-state.js';
export function validateFortressContent(content){
 const errors=[],fail=m=>errors.push('Fortress: '+m),b=content.chronicles.book2;if(!b)return errors;
 const events=Object.values(content.chronicleEvents).filter(e=>e.bookId==='book2'),items=b.items,locations=b.locations;
 if(!Array.isArray(locations)||locations.length!==10||new Set(locations.map(l=>l.id)).size!==10||b.weeklyRewards!==28||!items||!Array.isArray(b.services))return ['Fortress: invalid book'];
 if(events.filter(e=>e.intro).length!==10||events.filter(e=>!e.intro&&!e.finale).length!==40||events.filter(e=>e.finale).length!==1)fail('expected 10 introductions, 40 activities and one finale');
 for(const l of locations)if(!l.name||!l.description||!/^scene-[a-j]-[a-z-]+\.svg$/.test(l.art)||!content.chronicleEvents[l.introId]?.intro||content.chronicleEvents[l.introId].bookId!=='book2'||l.requires.some(id=>!content.chronicleEvents[id])||!Number.isFinite(l.npcWeight)||l.npcWeight<0||l.npcWeight>1)fail('invalid location '+l.id);
 function effects(ef,id){if(!ef)return;if(ef.restParty!==undefined&&(ef.restParty!==true||id!=='infirmary_rest'))fail('invalid rest effect '+id);for(const k of ['grantItems','handOverItems','retrieve'])if(ef[k]?.some(key=>!items[key]))fail('unknown item in '+id);if(ef.flags?.some(key=>!FORTRESS_FLAGS.includes(key)))fail('unknown flag in '+id);}
 function requires(r,id){if(!r)return;if(r.unrested!==undefined&&typeof r.unrested!=='boolean')fail('invalid rest requirement '+id);if(r.location&&!locations.some(l=>l.id===r.location)||r.partyMembers?.some(id=>!content.characters[id])||[...(r.flags??[]),...(r.notFlags??[])].some(k=>!FORTRESS_FLAGS.includes(k))||[...(r.items??[]),...(r.carried??[])].some(k=>!items[k])||r.cleared?.some(id=>!content.chronicleEvents[id])||r.expertiseScope&&r.expertiseScope!=='courier_trace'||r.authorityScope&&!['medical_transfer','powder_transfer'].includes(r.authorityScope))fail('invalid requirement '+id);}
 for(const e of events){
  if(!locations.some(l=>l.id===e.locationId)||!e.name||!e.description||!e.ending||!Array.isArray(e.branches)||typeof e.intro!=='boolean'||typeof e.hidden!=='boolean'||e.requires.some(id=>!content.chronicleEvents[id])||!Array.isArray(e.steps)||!e.steps.length){fail('invalid event '+e.id);continue;}
  if(new Set(e.steps.map(s=>s.id)).size!==e.steps.length)fail('duplicate step '+e.id);
  const valid=id=>id==='complete'||e.steps.some(s=>s.id===id);
  for(const st of e.steps){if(!st.narration||!locations.some(l=>l.id===st.locationId)||st.battle&&(!e.encounterId||!valid(st.after))||!st.battle&&!st.actions?.length)fail('invalid step '+e.id);for(const a of st.actions??[]){if(!a.id||!a.label||!valid(a.next)||a.kind==='chance'&&(!valid(a.success)||!valid(a.failure)))fail('invalid action '+e.id);requires(a.requires,e.id);effects(a.effects,e.id);}}
  if(e.encounterId){const c=content.encounters[e.encounterId];if(c?.bookId!=='book2'||c.category!=='chronicle'||c.rewardPolicy!=='none'||c.chronicleEventId!==e.id||e.steps.filter(s=>s.battle).length!==1)fail('invalid battle '+e.id);}
  effects(e.effects,e.id);
 }
 const seen=new Set();for(const s of b.services){if(seen.has(s.id)||!s.label||!s.result||!locations.some(l=>l.id===s.locationId))fail('invalid service');seen.add(s.id);requires(s.requires,s.id);effects(s.effects,s.id);}
 for(const [id,i]of Object.entries(items))if(!i.displayName||!i.description||!['papers','supplies','evidence'].includes(i.group)||typeof i.military!=='boolean'||!i.scope?.startsWith('book2:'))fail('invalid item '+id);
 return errors;
}
