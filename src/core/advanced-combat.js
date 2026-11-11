export function mpConversionBonus(actor,maxMp=actor.stats.maxMp){const p=actor.passive;return p?.type==='mp_stat_conversion'?Math.min(p.cap,maxMp*p.ratio):0;}
export function formationStance(actor){const p=actor.passive;if(p?.type!=='formation_stance')return null;return (actor.formationSlot??0)%2===0?p.odd:p.even;}
export function formationAbility(skill,actor){
 const variant=skill.formationVariants?.[(actor.formationSlot??0)%2===0?'odd':'even'];
 return variant?{...skill,target:variant.target,effects:skill.effects.map(e=>e.type==='damage'?{...e,multiplier:variant.multiplier}:e)}:skill;
}
export function validateAdvancedCombat(content){
 const errors=[],fail=m=>errors.push(m);
 for(const a of [...Object.values(content.characters),...Object.values(content.enemies)]){const p=a.passive;
  if(p?.type==='received_damage_counter'&&(!p.name||!p.description||!Number.isFinite(p.minimum)||p.minimum<=0||!Number.isFinite(p.maximum)||p.maximum<p.minimum||p.maximum>3||content.abilities[p.counterAbility]?.activation!=='passive'||content.abilities[p.counterAbility]?.target!=='enemy'||content.abilities[p.counterAbility]?.cost||content.abilities[p.counterAbility]?.cooldown||content.abilities[p.counterAbility]?.effects.some(e=>e.type!=='damage'||e.scalingStat!=='maxHp')))fail(a.id+': invalid received damage counter');
  if(p?.type==='element_ally_charge'&&(!p.name||!p.description||!a.resources?.[p.resource]||!['plain','fire','water','earth','wind','thunder','light','dark','moon','sword_soul'].includes(p.element)||p.amount!==1||p.elementMatch!==undefined&&!['same','different'].includes(p.elementMatch)||p.elementSource!==undefined&&!['actor','damage'].includes(p.elementSource)))fail(a.id+': invalid elemental ally charge');
  if(p?.type==='mp_stat_conversion'&&(!p.name||!p.description||p.toStat!=='magic'||!Number.isFinite(p.ratio)||p.ratio<=0||!Number.isFinite(p.cap)||p.cap<=0))fail(a.id+': invalid MP conversion');
  if(p?.type==='formation_stance'&&(!p.name||!p.description||[p.odd,p.even].some(s=>!s?.name||!s.modifiers||Object.entries(s.modifiers).some(([k,n])=>!['attack','magic','defense','resistance','speed'].includes(k)||!Number.isFinite(n)||n<=0||n>1))))fail(a.id+': invalid formation stance');
  if(p?.type==='mode_support_charge'&&(!p.name||!p.description||!a.combatModes?.[p.modeId]||!a.resources?.[p.resource]||p.amount!==1))fail(a.id+': invalid mode support charge');
  if(p?.type==='enemy_shield_mode'&&(!p.name||!p.description||!a.combatModes?.[p.modeId]||a.combatModes[p.modeId].lifetime!=='turns'||!Number.isInteger(a.combatModes[p.modeId].durationTurns)||a.combatModes[p.modeId].durationTurns<1||a.combatModes[p.modeId].durationTurns>3))fail(a.id+': invalid enemy shield mode');
  if(p?.type==='life_mortgage_pact'&&(!p.name||!p.description||!Number.isFinite(p.damageBonus)||p.damageBonus<=0||p.damageBonus>1||p.blockExternalHealing!==true))fail(a.id+': invalid life mortgage pact');
  if(p?.blockExternalHealing!==undefined&&p.type!=='life_mortgage_pact')fail(a.id+': healing block requires life mortgage pact');
  if(p?.type==='heal_mp_regen' &&(!p.name||!p.description||!Number.isFinite(p.ratio)||p.ratio<=0||p.ratio>1||!Number.isInteger(p.cap)||p.cap<1||p.cap>99))fail(a.id+': invalid heal MP regeneration');
  if(['element_ally_followup','element_ally_weakness_mp'].includes(p?.type)){
   if(!p.name||!p.description||!['plain','fire','water','earth','wind','thunder','light','dark','moon','sword_soul'].includes(p.element))fail(a.id+': invalid elemental support');
   if(p.type==='element_ally_followup'){
    const skill=content.abilities[p.followUpAbility];
    if(!skill||skill.activation!=='passive'||skill.target!=='enemy'||skill.cost||skill.cooldown||skill.effects.some(e=>e.type!=='damage'||e.element!==p.element)||a.abilities?.includes(p.followUpAbility))fail(a.id+': invalid elemental follow-up');
   }else if(!Number.isInteger(p.amount)||p.amount<1||p.amount>20)fail(a.id+': invalid elemental refund');
  }
  if(p?.type==='element_weakness_skill'&&(!p.name||!p.description||!['plain','fire','water','earth','wind','thunder','light','dark','moon','sword_soul'].includes(p.element)||p.weaknessMultiplier!==2||!Number.isFinite(p.damageBonus)||p.damageBonus<=0||p.damageBonus>2))fail(a.id+': invalid elemental weakness skill');
  if(p?.type==='element_skill_echo'){
   const skill=content.abilities[p.followUpAbility];
   if(!p.name||!p.description||!['plain','fire','water','earth','wind','thunder','light','dark','moon','sword_soul'].includes(p.element)||!['physical','magical'].includes(p.damageType)||!Number.isInteger(p.perRound)||p.perRound<1||p.perRound>4||!skill||!a.abilities?.includes(skill.id)||skill.activation==='passive'||skill.target!=='all_enemies'||!skill.effects.some(e=>e.type==='damage')||skill.effects.some(e=>e.type!=='damage'||e.damageType!==p.damageType||e.element!==p.element||e.consumeStatus||e.formulaScaling))fail(a.id+': invalid elemental skill echo');
  }
  if(p?.type==='exposure_attunement'&&(!p.name||!p.description||!a.resources?.[p.resource]||a.resources[p.resource].max!==10||p.amount!==2))fail(a.id+': invalid exposure attunement');
  if(p?.type==='team_stat_aura'&&(!p.name||!p.description||!p.modifiers||!Object.keys(p.modifiers).length||Object.entries(p.modifiers).some(([k,n])=>!['defense','resistance'].includes(k)||!Number.isFinite(n)||n<=0||n>1)))fail(a.id+': invalid team stat aura');
  if(p?.type==='self_buff_offense'&&(!p.name||!p.description||!p.baseStatBonuses||Object.entries(p.baseStatBonuses).some(([k,n])=>k!=='attack'||!Number.isFinite(n)||n<=0)||!Number.isFinite(p.damagePerBuff)||p.damagePerBuff<=0||!Number.isFinite(p.penetrationPerBuff)||p.penetrationPerBuff<=0||!Number.isFinite(p.cap)||p.cap<=0||p.cap>1))fail(a.id+': invalid self buff offense');
  if(p?.type==='cover_guard' &&(!p.name||!p.description||!Number.isFinite(p.ratio)||p.ratio<=0||p.ratio>0.5))fail(a.id+': invalid cover guard');
 }
 for(const s of Object.values(content.abilities)){
  if(s.survivingTargetRepeat&&(!s.survivingTargetRepeat||s.survivingTargetRepeat.perRound!==1||Object.keys(s.survivingTargetRepeat).length!==1||s.target!=='enemy'||s.activation==='passive'||!s.effects?.length||s.effects.some(e=>e.type!=='damage')))fail(s.id+': invalid surviving-target repeat');
  if(s.initialCooldown!==undefined&&(!Number.isInteger(s.initialCooldown)||s.initialCooldown<1||s.initialCooldown>10))fail(s.id+': invalid initial cooldown');
  if(s.maxSelfStatus&&(!content.statuses[s.maxSelfStatus]?.maxStacks||s.target!=='self'||!s.effects.some(e=>e.status===s.maxSelfStatus)))fail(s.id+': invalid status ceiling');
  if(s.formationVariants&&(['odd','even'].some(k=>!s.formationVariants[k]||!['enemy','all_enemies'].includes(s.formationVariants[k].target)||!Number.isFinite(s.formationVariants[k].multiplier)||s.formationVariants[k].multiplier<=0)||!s.effects.some(e=>e.type==='damage')))fail(s.id+': invalid formation variants');
  for(const e of s.effects??[])if(e.type==='end_mode'&&(e.to!=='self'||!e.mode))fail(s.id+': invalid mode exit');
 }
 return errors;
}
