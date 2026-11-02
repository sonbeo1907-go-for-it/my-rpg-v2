const STATS=['maxHp','maxMp','attack','magic','defense','resistance','speed'];
const KINDS=['single','multi','random','area','follow_up','counter','reaction_area','periodic'];
const own=(o,k)=>Boolean(o&&Object.hasOwn(o,k));
const object=o=>Boolean(o&&typeof o==='object'&&!Array.isArray(o));
const integer=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const number=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max;
export function freezePvp(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const x of Object.values(value))freezePvp(x);Object.freeze(value);}return value;}
export function validatePvpRules(rule,content){
 const errors=[],bad=m=>errors.push('PvP: '+m);
 if(!object(rule))return ['PvP: missing rules'];
 const keys=['id','schemaVersion','rulesetVersion','maxRounds','debugDamage','normalization','softCaps','loopGuards','ai','characterOverrides','abilityOverrides','statusOverrides'];
 if(Object.keys(rule).some(k=>!keys.includes(k)))bad('unknown root field');
 if(rule.schemaVersion!==1||typeof rule.rulesetVersion!=='string'||!rule.rulesetVersion||rule.rulesetVersion.length>80)bad('invalid version');
 if(!integer(rule.maxRounds,1,200)||typeof rule.debugDamage!=='boolean')bad('invalid round/log settings');
 if(!integer(rule.normalization?.level,1,50)||!integer(rule.normalization?.skillRank,1,5)||typeof rule.normalization?.storyUpgrades!=='boolean')bad('invalid normalization');
 for(const kind of KINDS){const c=rule.softCaps?.[kind];if(!object(c)||!number(c.threshold,1,100000)||!number(c.overflowRatio,.001,1)||c.totalThreshold!==undefined&&!number(c.totalThreshold,1,100000)||Object.keys(c).some(k=>!['threshold','overflowRatio','totalThreshold'].includes(k)))bad('invalid cap '+kind);}
 if(Object.keys(rule.softCaps??{}).some(k=>!KINDS.includes(k)))bad('unknown cap kind');
 const g=rule.loopGuards;if(!object(g)||g.maxExtraTurnsPerRound!==1||g.allowReactiveChains!==false||!integer(g.maxAutomaticActionsPerUnitPerRound,1,32)||!integer(g.maxDamageHitsPerAction,1,128))bad('invalid loop guard');
 if(!integer(rule.ai?.maxCandidates,1,32))bad('invalid AI budget');
 for(const name of ['characterOverrides','abilityOverrides','statusOverrides'])if(!object(rule[name]))bad('invalid '+name);
 for(const [id,p]of Object.entries(rule.characterOverrides??{})){
  if(!own(content.characters,id)||!object(p)||Object.keys(p).some(k=>!['stats','passive'].includes(k))){bad('invalid character '+id);continue;}
  if(p.stats&&(!object(p.stats)||Object.entries(p.stats).some(([k,n])=>!STATS.includes(k)||!number(n,k==='maxHp'?1:0,100000))))bad('invalid stats '+id);
  if(p.passive&&(!object(p.passive)||Object.entries(p.passive).some(([k,n])=>typeof content.characters[id].passive?.[k]!=='number'||!number(n,0,10000))))bad('invalid passive patch '+id);
 }
 for(const [id,p]of Object.entries(rule.abilityOverrides??{})){
  const a=content.abilities[id];if(!own(content.abilities,id)||!object(p)||Object.keys(p).some(k=>!['mp','cooldown','effects'].includes(k))){bad('invalid ability '+id);continue;}
  if(p.mp!==undefined&&!integer(p.mp,0,999)||p.cooldown!==undefined&&!integer(p.cooldown,0,40))bad('invalid cost/cooldown '+id);
  if(p.effects!==undefined&&!object(p.effects))bad('invalid effects '+id);
  for(const [index,e]of Object.entries(p.effects??{})){
   if(!/^(0|[1-9][0-9]*)$/.test(index)||!a.effects[Number(index)]||!object(e)){bad('invalid effect index '+id);continue;}
   for(const [k,n]of Object.entries(e))if(!['multiplier','primaryMultiplier','flat','duration','hits','penetration','perStack','perResource','onHitDuration'].includes(k)||!number(n,0,10000)||['duration','hits','onHitDuration'].includes(k)&&!integer(n,1,k==='hits'?20:40)||k==='penetration'&&n>1||k==='onHitDuration'&&!a.effects[Number(index)].onHitStatus)bad('invalid effect patch '+id+'.'+index+'.'+k);
  }
 }
 for(const[id,p]of Object.entries(rule.statusOverrides??{}))if(!own(content.statuses,id)||!object(p)||Object.keys(p).some(k=>k!=='modifiers')||!object(p.modifiers)||Object.entries(p.modifiers).some(([k,n])=>!own(content.statuses[id].modifiers,k)||!number(n,-1,10)))bad('invalid status patch '+id);
 return errors;
}
export function preparePvpContent(content,input=content.pvpRules?.default){
 const rules=structuredClone(input),errors=validatePvpRules(rules,content);if(errors.length)throw Error(errors.join('; '));
 const scoped=structuredClone(content);if(scoped.pvpRules)scoped.pvpRules.default=rules;
 for(const[id,p]of Object.entries(rules.characterOverrides)){const c=scoped.characters[id];if(p.stats)Object.assign(c.stats,p.stats);if(p.passive)Object.assign(c.passive,p.passive);}
 for(const[id,p]of Object.entries(rules.abilityOverrides)){const a=scoped.abilities[id];if(p.mp!==undefined)a.cost={...a.cost,mp:p.mp};if(p.cooldown!==undefined)a.cooldown=p.cooldown;for(const[index,patch]of Object.entries(p.effects??{})){const {onHitDuration,...rest}=patch;Object.assign(a.effects[index],rest);if(onHitDuration!==undefined)a.effects[index].onHitStatus.duration=onHitDuration;}}
 for(const[id,p]of Object.entries(rules.statusOverrides))Object.assign(scoped.statuses[id].modifiers,p.modifiers);
 return {content:freezePvp(scoped),rules:freezePvp(rules)};
}
