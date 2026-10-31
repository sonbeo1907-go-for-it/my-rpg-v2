// Pure presentation plan. Reads resolved outcomes; never rolls RNG or changes combat.
export const COMBAT_COLORS={plain:'#e4d5b0',fire:'#ff9861',water:'#69caff',earth:'#c4b17b',wind:'#8ce4bc',thunder:'#d8a3ff',light:'#fff0a3',dark:'#bf91ed'};
const custom=skill=>/^(cosmic|academic|hero)_/.test(skill?.presentation??'');
export function combatTimeline(events,content,{speed='normal',reduced=false}={}){
 const frames=[],actions=new Map(),passives=new Set();let cursor=0,lastImpact=-100;
 const lead=reduced?0:speed==='fast'?35:120,step=reduced?0:speed==='fast'?25:85,duration=reduced?50:speed==='fast'?125:300;
 const add=(event,kind,at,extra={})=>frames.push({...event,...extra,kind,at:reduced?0:at,duration,id:String(event.key??event.visualId??events.indexOf(event))+':'+kind+':'+frames.length});
 for(const event of events){
  if(event.type==='ability_cast'||event.type==='reaction'){
   const skill=content.abilities[event.abilityId],reaction=event.type==='reaction';
   const start=Math.max(cursor,lastImpact+(lastImpact<0?0:step));
   const attack=event.attack??skill?.effects?.some(effect=>effect.type==='damage')??true;
   const action={start,presentation:event.presentation??skill?.presentation,custom:custom(event.presentation?event:skill),targetId:event.targetId,area:skill?.target!=='random_enemies'&&(event.area??(skill?.target?.startsWith('all_')||skill?.target==='enemy_splash')),primary:skill?.effects?.some(effect=>effect.primaryMultiplier!==undefined),automatic:event.automaticCast};
   actions.set(event.sourceId,action);cursor=start+lead;
   add(event,'source',start,{attack,automatic:action.automatic,label:reaction?event.label:event.label??skill?.name??(event.abilityId==='$defend'?'Phòng thủ':'Đánh thường'),reaction});
   if(!action.custom&&action.area&&attack){
    const types=[...new Set((skill?.effects??[]).filter(effect=>effect.type==='damage').map(effect=>effect.damageType))];
    for(const damageType of types)add(event,'formation',start+lead,{damageType,element:skill.effects.find(effect=>effect.type==='damage'&&effect.damageType===damageType)?.element});
   }
   continue;
  }
  if(event.type==='passive'||event.type==='skill_base_bonus'||event.type==='mode_exit') {const label=event.label??content.characters[event.sourceId]?.passive?.name??'Nội tại',key=event.sourceId+':'+label;if(!passives.has(key)){passives.add(key);add(event,'passive',Math.max(cursor,lastImpact+35),{label});}continue;}
  if(!['damage','dodge','heal','mp_restore','shield','status','effect_blocked','cleanse','dispel','hp_spent'].includes(event.type))continue;
  const action=actions.get(event.sourceId);
  let at=Math.max(cursor,action? action.start+lead+(event.hitIndex??0)*step:0);
  if(['heal','mp_restore'].includes(event.type)&&lastImpact>=0)at=Math.max(at,lastImpact+step/2);
  if((event.type==='damage'||event.type==='dodge')&&action?.presentation?.startsWith('hero_')&&!action.signature){action.signature=true;add(event,'signature',at,{presentation:action.presentation,area:action.area,custom:true});frames.at(-1).duration=reduced?80:speed==='fast'?190:560;}
  if(event.type==='damage'||event.type==='dodge')lastImpact=Math.max(lastImpact,at);
  const kind=event.type==='damage'?event.amount>0?'hurt':event.absorbed>0?'block':'zero':event.type;
  add(event,kind,at,{custom:action?.custom&&!event.periodic&&!event.automatic,primary:Boolean(action?.primary&&event.targetId===action.targetId)});
 }
 return {frames,duration:frames.length?Math.max(reduced?60:speed==='fast'?180:620,...frames.map(frame=>frame.at+frame.duration+20)):reduced?60:speed==='fast'?180:620};
}
export function combatFeedbackDuration(events,content,speed,reduced=false){return combatTimeline(events,content,{speed,reduced}).duration;}
