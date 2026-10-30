// Public copy contract: docs/SKILL_COPY_AND_UX_SPEC.md
import { ELEMENT_NAMES, DAMAGE_TYPE_NAMES } from '../core/content.js';
import { STAT_LABELS } from '../core/catalog.js';
import { effectiveStat, damageMultiplier, speedDamageRatio, supportAmount, mpRestoreAmount, EMERGENCY_HEAL_MULTIPLIER, EMERGENCY_HP_THRESHOLD } from '../core/combat-math.js';
import { battleStat } from '../core/stat-values.js';

const number=n=>new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2}).format(n);
const pct=n=>number(n*100)+'%';
const unique=lines=>[...new Set(lines.filter(Boolean))];
const signed=n=>(n<0?'−':'+')+pct(Math.abs(n));
const statName=key=>STAT_LABELS[key]??({damageBonus:'sát thương',damageReduction:'giảm sát thương nhận',evasion:'né vật lí'}[key]??key);
const resourceName=(actor,id)=>id==='mp'?'MP':actor.resources?.[id]?.name??id;
const applies=(passive,skill)=>!passive?.abilityIds||passive.abilityIds.includes(skill.id);

// Public copy is built from mechanical values. Prose states intent; facts own numbers and timing.
export function skillPresentation(skill,actor,content,choices={}) {
  const facts=[],rules=[...(skill.rules??[])];
  const exclusive=actor.exclusiveGear?.template?.passive;
  const cost=skill.cost?.resource;
  const spent=choices.spent??(cost?.all?cost.min??1:cost?.amount??0);
  let assumed=actor;
  if (!choices.live && actor.passive?.type==='field_growth' && choices.fieldStacks!==undefined) assumed={...assumed,statuses:[{id:actor.passive.statusId,growth:choices.fieldStacks}]};
  if (!choices.live && cost && actor.passive?.type==='resource_stat_boost' && actor.passive.resource===cost.id) assumed={...assumed,resourceValues:{...actor.resourceValues,[cost.id]:spent}};
  const value=key=>choices.live?battleStat(content,actor,key):effectiveStat(assumed,key);
  function statusFacts(effect,linked=false) {
    const status=content.statuses[effect.status];
    const self=effect.to==='self'||skill.target==='self';
    const prefix=effect.to==='self'&&skill.target!=='self'?'Bản thân: ':'';
    const extension=exclusive?.type==='skill_status_duration'&&applies(exclusive,skill)&&exclusive.statusId===effect.status?exclusive.extraDuration:0;
    const turns=effect.duration===undefined?'':` · ${effect.duration+extension} lượt${self?' kế tiếp':''}`;
    const mods=[];
    for(const[key,n]of Object.entries(status.modifiers??{})) {
      if(key==='damageVsShielded')mods.push(`Địch có khiên: sát thương ×${number(1+n)}`);
      else if(key==='attackMultiplier')mods.push(`Đòn tấn công kế: sát thương ×${number(n)}`);
      else if(key==='damageTakenBonus')mods.push(`${signed(n)} sát thương nhận`);
      else if(key==='damageReduction')mods.push(`Giảm ${pct(n)} sát thương nhận`);
      else mods.push(`${signed(n)} ${statName(key)}${status.modifiersPerStack?'/tầng':''}`);
    }
    if(mods.length)facts.push(prefix+mods.join(' · ')+turns+(status.consumeOnAttack?' · đòn tấn công kế tiếp':''));
    if(status.effectImmunity){
      facts.push(`${status.name}: ${(choices.statusCharges??status.effectImmunity.charges)} lần chặn · đến khi dùng hết`);
      rules.push('Chặn một hiệu ứng, không chặn trọn kỹ năng có nhiều hiệu ứng.');
      if(status.effectImmunity.hostileOnly)rules.push('Không giải hiệu ứng đã có hoặc chặn hình phạt tự gây.');
      rules.push(`Dùng lại làm mới ${status.effectImmunity.charges===1?'một':status.effectImmunity.charges} lần chặn, không cộng dồn.`);
    }
    if(status.taunt)facts.push(prefix+'Khiêu khích'+turns);
    if(status.cover){facts.push(prefix+'Nhận đòn thay'+turns);rules.push('Che chắn chỉ nhận thay đòn đơn mục tiêu.');}
    if(status.regen)facts.push(prefix+`Đầu lượt: hồi ${pct(status.regen)} HP tối đa`+turns);
    if(status.onDamagedResource)facts.push(`Mỗi hit chịu đựng: +1 ${resourceName(actor,status.onDamagedResource)}`);
    if(status.onAttackResource)facts.push(`Sau tấn công: ${pct(status.onAttackResource.chance)} nhận +${status.onAttackResource.amount??1} ${resourceName(actor,status.onAttackResource.resource)}`);
    if(status.blockResourceGain)facts.push(prefix+'Không tích tài nguyên'+turns);
    if(status.skipTurn)facts.push('Choáng'+turns);
    if(status.maxStacks)facts.push(`+1 ${status.name} · tối đa ${status.maxStacks} tầng`+turns);
    if(effect.extraStacksIfPresent)facts.push(`Địch đã có ${status.name} trước chiêu: thêm ${effect.extraStacksIfPresent} tầng`);
    if(status.durationClock==='main_turn')rules.push('Duy trì đến hết lượt Vòng Chính kế tiếp của người nhận; Vòng Phụ không giảm thời hạn.');
    if(status.damageOverTime){
      const dot=status.damageOverTime;
      const formula=[dot.flat?number(dot.flat):'',dot.multiplier?`${pct(dot.multiplier)} ${statName(dot.scalingStat)}`:''].filter(Boolean).join(' + ');
      facts.push(`Độc: ${formula} → ${Math.max(1,supportAmount(dot,value(dot.scalingStat)))} HP/đầu lượt`+turns);
      if(!skill.rules?.length)rules.push('Độc bỏ qua giáp và khiên; lượng độc chốt khi dùng chiêu. Dùng lại làm mới.');
    }
    if(status.turnStartAbility){
      const pulse=content.abilities[status.turnStartAbility];
      const damage=pulse.effects.find(e=>e.type==='damage');
      facts.push(`Đầu lượt: ${pct(damage.multiplier)} ${damage.damageType==='physical'?'ATK':'MAG'} · ${ELEMENT_NAMES[damage.element]} · toàn địch`+turns);
    }
    if(status.modifierGroup)rules.push('Các mức giảm SPD cùng nhóm lấy mức mạnh nhất.');
    if(status.magicRefresh)rules.push(`Phép của phe người gắn dấu làm mới ${status.name}, tối đa một lần/vòng/mục tiêu.`);
    if(status.persistent&&!status.effectImmunity&&!status.consumeOnAttack){
      rules.push(status.expiresOnShieldGain?'Hiệu ứng kết thúc khi nhận khiên mới.':linked?'Hiệu ứng đi kèm được gỡ khi tắt trạng thái chính.':'Duy trì đến khi tắt hoặc kết thúc trận.');
    }
    if(status.modifiers?.damageVsShielded)rules.push('Xét khiên ở đầu từng hit; tăng cả sát thương tràn vào HP.');
    for(const id of effect.linkedStatuses??[])statusFacts({type:'status',status:id},true);
  }
  for(const effect of skill.effects) {
    const prefix=effect.to==='self'&&skill.target!=='self'?'Bản thân: ':'';
    if(effect.type==='damage'){
      const label=effect.damageType==='physical'?'ATK':'MAG';
      let formula=`${pct(effect.multiplier??1)} ${label}`;
      if(effect.perResource)formula+=` + ${pct(effect.perResource)} ${label}/${resourceName(actor,cost?.id)}`;
      if(effect.perStack)formula+=` + ${pct(effect.perStack)} ${label}/${content.statuses[effect.consumeStatus].name}`;
      if(effect.lowHpBonus)formula+=` + tối đa ${pct(effect.lowHpBonus)} ${label} theo HP đã mất`;
      const speed=speedDamageRatio(actor,effect.damageType,effect.speedMultiplier??0);
      if(speed)formula+=` + ${pct(speed)} SPD`;
      facts.push(`${DAMAGE_TYPE_NAMES[effect.damageType]} · ${ELEMENT_NAMES[effect.element]} · ${effect.hits>1?effect.hits+' × (':''}${formula}${effect.hits>1?')':''}`);
      if(effect.penetration)facts.push(`Xuyên ${pct(effect.penetration)} ${effect.damageType==='physical'?'DEF':'RES'}`);
      if(effect.consumeStatus)rules.push(`Tiêu toàn bộ ${content.statuses[effect.consumeStatus].name} trên từng mục tiêu; mỗi địch tính riêng.`);
      if(effect.perResource||effect.perStack||effect.lowHpBonus){
        const ratio=damageMultiplier(effect,{spent,stacks:choices.stacks??0,hpRatio:(choices.hpPercent??100)/100});
        facts.push(`${choices.live?'Hiện tại':'Giả định'}: ${effect.hits>1?effect.hits+' × ':''}${pct(ratio)} ${label}${speed?' + '+pct(speed)+' SPD':''}`);
      }
      if(effect.onHitStatus)statusFacts({type:'status',status:effect.onHitStatus.status,duration:effect.onHitStatus.duration});
      if(effect.unavoidable)facts.push('Không thể né');
    }
    if(effect.type==='heal'||effect.type==='shield'){
      const key=effect.scalingStat??'magic';
      const formula=[effect.multiplier?`${pct(effect.multiplier)} ${statName(key)}`:'',effect.flat?number(effect.flat):''].filter(Boolean).join(' + ')||'0';
      const amount=supportAmount(effect,value(key));
      facts.push(`${prefix}${effect.type==='heal'?'Hồi HP':'Khiên'}: ${formula} → ${number(amount)}${skill.target==='all_allies'?'/người':''}`);
      if(effect.emergency)facts.push(`Mục tiêu ≤${pct(EMERGENCY_HP_THRESHOLD)} HP: hồi ×${number(EMERGENCY_HEAL_MULTIPLIER)} → ${supportAmount(effect,value(key),true)} HP`);
      if(effect.type==='shield')rules.push('Khiên không cộng dồn; chỉ thay khi khiên mới mạnh hơn.');
    }
    if(effect.type==='status'||effect.type==='toggle_status')statusFacts(effect);
    if(effect.type==='resource')facts.push(`${prefix}${effect.resource==='mp'?'Hồi':'Tạo'} ${effect.maxMpRatio?(effect.amount?effect.amount+' + ':'')+pct(effect.maxMpRatio)+' MP tối đa':effect.amount+' '+resourceName(actor,effect.resource)}`);
    if(effect.type==='cleanse')facts.push('Giải toàn bộ hiệu ứng bất lợi');
    if(effect.type==='grant_extra_turn'){
      facts.push('Lượt Thêm: 1 · Vòng Phụ hiện tại');
      rules.push('Mỗi người nhận tối đa một Lượt Thêm mỗi vòng.','Trong Vòng Phụ, chỉ bỏ qua hiệu ứng cấp lượt; vẫn tiêu MP và hồi chiêu.');
    }
  }
  if(cost?.consumeAt==='after')rules.push('Tài nguyên được tiêu sau khi gây sát thương.');
  if(actor.passive?.type==='extra_mp_damage'&&(skill.cost?.mp??0)>0&&skill.effects.some(e=>e.type==='damage')){
    const cap=Math.ceil(skill.cost.mp*actor.passive.extraCostRatio),extra=choices.live?Math.min(cap,Math.max(0,actor.mp-skill.cost.mp)):cap;
    facts.push(`MP nội tại: tối đa +${cap} · sát thương ${choices.live?'hiện tại ':'tối đa '}×${number(1+actor.passive.maxDamageBonus*extra/cap)}`);
    rules.push('MP bổ sung chỉ tính một lần cho cả chiêu; thiếu MP thì bonus giảm theo phần thực tiêu.');
  }
  const relatedExclusive=exclusive && (exclusive.abilityIds ? exclusive.abilityIds.includes(skill.id) : skill.effects.some(effect=>{
    const status=content.statuses[effect.status];
    return exclusive.type==='dodge_heal'&&status?.modifiers?.evasion || exclusive.type==='shield_break_heal_bonus'&&effect.type==='shield' || exclusive.type==='cover_damage_reduction'&&status?.cover;
  }));
  if(relatedExclusive){
    const p=exclusive,tag='Trấn Phái: ';
    if(p.type==='skill_damage')facts.push(tag+`+${pct(p.ratio)} sát thương`);
    if(p.type==='skill_penetration')facts.push(tag+(p.minSpent?`Tiêu từ ${p.minSpent} ${resourceName(actor,cost?.id)} → `:'')+`xuyên thêm ${pct(p.ratio)} DEF`);
    if(p.type==='skill_resource_bonus')facts.push(tag+`+${p.amount} ${resourceName(actor,p.resource)}${p.oncePerRound?' · 1 lần/vòng':''}`);
    if(p.type==='after_skill_status'){
      const start=facts.length;statusFacts({type:'status',status:p.statusId,duration:p.duration,to:p.to==='targets'?'targets':'self'});
      for(let i=start;i<facts.length;i++)facts[i]=tag+facts[i];
    }
    if(p.type==='next_turn_heal')facts.push(tag+`Đầu lượt kế tiếp, hồi ${pct(p.ratio)} HP tối đa một lần`);
    if(p.type==='consumed_targets_mp')facts.push(tag+`Tiêu dấu trên ít nhất ${p.minTargets} địch → hồi ${p.amount} MP sau chiêu`);
    if(p.type==='fresh_mark_bonus')facts.push(tag+`Địch chưa có dấu: gắn thêm ${p.amount} ${content.statuses[p.statusId].name}${p.oncePerRound?' · 1 lần/vòng':''}`);
    if(p.type==='dodge_heal')facts.push(tag+`Né vật lí: hồi ${pct(p.ratio)} HP tối đa · 1 lần/vòng`);
    if(p.type==='shield_break_heal_bonus')facts.push(tag+`+${pct(p.ratio)} lượng hồi từ vỡ khiên`);
    if(p.type==='cover_damage_reduction')facts.push(tag+`Nhận đòn thay: giảm thêm ${pct(p.ratio)} sát thương`);
    rules.push(...(p.rules??[]));
  }
  if(skill.requiresTargetStatus)rules.push(`Cần mục tiêu có ${content.statuses[skill.requiresTargetStatus].name}.`);
  const summary=skill.description??(skill.id==='$defend'?'Phòng thủ và hồi MP để chuẩn bị cho lượt sau.':'Tấn công một kẻ địch.');
  return {summary,facts:unique(facts),rules:unique(rules)};
}

export function passivePresentation(actor,content) {
  const p=actor.passive;
  if(!p)return null;
  const facts=[],rules=[];
  let summary='',name=p.name??({damage_reduction:'Bền bỉ',shield_break_heal:'Dư âm thủy hộ'}[p.type]??'Năng lực đặc trưng');
  switch(p.type){
    case 'damage_reduction':summary=p.requiresStatus?`Bền bỉ khi đang có ${content.statuses[p.requiresStatus].name}.`:'Bền bỉ trước mọi đòn đánh.';facts.push(`Giảm ${pct(p.amount)} sát thương nhận${p.requiresStatus?` · cần ${content.statuses[p.requiresStatus].name}`:''}`);break;
    case 'shield_break_heal':summary='Khi khiên do mình tạo bị phá, hồi HP cho người mang khiên.';facts.push(`Hồi ${pct(p.multiplier*(actor.exclusiveGear?.template?.passive.type==='shield_break_heal_bonus'?1+actor.exclusiveGear.template.passive.ratio:1))} MAG`);rules.push('Cả người tạo và người mang khiên phải còn sống.');break;
    case 'dodge_counter':{
      name=p.name??'Phản kiếm';summary='Né thành công đòn vật lí sẽ phản công và tích Sơ hở.';facts.push(`Phản công: 85% ATK · +1 ${resourceName(actor,p.resource)} · 1 lần/vòng`);
      const slow=content.abilities[p.counterAbility]?.effects.find(effect=>effect.type==='status');
      if(slow){facts.push(`${signed(content.statuses[slow.status].modifiers.speed)} SPD mục tiêu trúng phản công`);rules.push('Đến hết lượt Vòng Chính kế tiếp của mục tiêu; cộng với hiệu ứng làm chậm khác.');}
      break;
    }
    case 'buffed_ally_mp':summary='Đồng đội khác mang buff của Iris gây sát thương sẽ tiếp MP cho cô.';facts.push(`Hồi ${p.amount} MP · khai thác điểm yếu: +${p.weaknessBonus} MP · 1 lần/vòng`);rules.push('Chỉ tính buff do chính Iris cấp. Tính sát thương vào khiên, phản công và liên kích; không tính sát thương 0.','Một đòn diện rộng xét toàn bộ mục tiêu; Vòng Phụ dùng chung hạn mức.');break;
    case 'magic_followup_mp':{
      summary='Liên kích theo phép đơn mục tiêu của đồng đội khác để tích Lôi ấn và tiếp MP cho đội.';
      const effect=content.abilities[p.followUpAbility].effects[0];
      facts.push(`Liên kích: ${pct(effect.multiplier)} MAG · ${ELEMENT_NAMES[effect.element]} · 1 lần/vòng`,`Đầu lượt đủ ${p.threshold} ${resourceName(actor,p.resource)}: tiêu hết → hồi ${pct(p.mpRestoreRatio)} MP toàn đội`);
      rules.push('Đòn diện rộng, đòn của bản thân và liên kích khác không kích hoạt.','Mục tiêu phải còn sống sau đòn mở đầu; sát thương vào khiên vẫn được tính.');break;
    }
    case 'stat_boost':summary='Nhận sức mạnh thường trực từ nội tại.';facts.push(...Object.entries(p.modifiers).map(([key,n])=>`${signed(n)} ${statName(key)}`));break;
    case 'speed_damage':summary='Tốc độ tăng sức mạnh cho từng nhát đánh vật lí.';facts.push(`Mỗi hit: +${pct(p.ratio)} SPD vào sát thương gốc`);rules.push('Cộng trước DEF và điểm yếu; tính SPD gồm trang bị và buff.');break;
    case 'resource_stat_boost':summary=`Mỗi ${resourceName(actor,p.resource)} tăng sức tấn công.`;facts.push(`Mỗi điểm: +${pct(p.ratio)} ${statName(p.stat)} · tối đa ${pct(p.ratio*actor.resources[p.resource].max)}`);break;
    case 'shield_break_attack_buff':summary='Tự đánh vỡ khiên địch sẽ cường hóa đòn tấn công kế tiếp.';facts.push(`Đòn kế: sát thương ×${number(content.statuses[p.statusId].modifiers.attackMultiplier)}`);rules.push('Hiệu lực bắt đầu sau toàn bộ đòn phá khiên. Phòng thủ hoặc hỗ trợ giữ lại buff.');break;
    case 'shield_break_status':summary='Khi khiên vỡ, bản thân chịu hiệu ứng bất lợi.';facts.push(...p.statuses.map(s=>`${content.statuses[s.id].name}${s.duration?' · '+s.duration+' lượt':''}`));break;
    case 'field_growth':summary='Mây càng tồn tại, ATK càng tăng; mây tan sẽ mất toàn bộ bonus.';facts.push(`Mỗi đầu lượt có mây: +${pct(p.ratio)} ${statName(p.stat)} · tối đa ${pct(p.ratio*p.maxStacks)}`);rules.push('Tăng ATK trước khi mây gây sát thương. Đòn mây không hưởng hoặc tiêu buff đòn kế tiếp.');break;
    case 'team_flat_self':summary=`Nhận thêm chỉ số từ mỗi đồng đội ${p.tag==='valmont'?'Valmont':p.tag}${p.excludeSelf?' khác':''}.`;facts.push(...Object.entries(p.modifiers).map(([key,n])=>`+${n} ${statName(key)} nền/người`));rules.push('Chốt theo đội hình lúc xuất chiến; đồng đội gục không làm mất bonus.');break;
    case 'team_flat_aura':summary=`Mỗi thành viên ${p.tag==='valmont'?'Valmont':p.tag} trong đội giúp tăng chỉ số cho mọi người cùng gia tộc.`;facts.push(...Object.entries(p.modifiers).map(([key,n])=>`+${n} ${statName(key)} nền/người${p.countSelf?' · tính cả bản thân':''}`));rules.push('Chốt theo đội hình lúc xuất chiến; đồng đội gục không làm mất bonus.');break;
    case 'end_turn_mp_regen':summary='Cuối lượt của bản thân, tiếp MP cho toàn đội.';facts.push(`Hồi ${pct(p.ratio)} MP tối đa · ${p.tag==='valmont'?'Valmont':p.tag}: ${pct(p.ratio*p.tagMultiplier)}`);rules.push('Tính cả bản thân; bị choáng vẫn kích hoạt nếu còn sống.');break;
    case 'extra_mp_damage':summary='Kỹ năng công kích dùng thêm MP để tăng sát thương.';facts.push(`Tiêu thêm tối đa ${pct(p.extraCostRatio)} MP gốc → tối đa +${pct(p.maxDamageBonus)} sát thương`);rules.push('Tính một lần cho cả chiêu, sau chi phí gốc. Thiếu MP thì giảm bonus theo phần thực tiêu.','Không áp dụng đánh thường hoặc kỹ năng không gây sát thương.');break;
    case 'marked_ally_magic':summary=`Đồng đội khác đánh địch có ${content.statuses[p.statusId].name} được tăng MAG cho hit đó.`;facts.push(`+${pct(p.ratio)} MAG`);rules.push('Tính riêng từng mục tiêu; phần vật lí không hưởng MAG.');break;
    case 'hp_difference_damage':summary='Chênh lệch tỷ lệ HP giữa bản thân và mục tiêu làm tăng sát thương.';facts.push(`Bonus = chênh lệch HP% tuyệt đối · tối đa +${pct(p.cap)}`);rules.push('Tính lại trước mỗi hit.');break;
    case 'ally_heal_mp':summary='Thực nhận HP từ đồng đội khác sẽ hồi thêm MP.';facts.push(`Hồi ${pct(p.ratio)} MP tối đa · 1 lần/vòng`);rules.push('Hồi phục theo lượt của đồng đội được tính; tự hồi và hồi 0 HP không tính.');break;
    case 'stat_conversion':summary='Thể lực tối đa chuyển thành sức mạnh tấn công.';facts.push(`+${pct(p.ratio)} ${statName(p.fromStat)} tối đa vào ${statName(p.toStat)} nền`);rules.push('Tính cả trang bị, trước buff ATK%; không phụ thuộc HP hiện tại.');break;
    case 'end_round_lowest_mp':summary='Cuối vòng, tiếp MP cho đồng minh có tỷ lệ MP thấp nhất.';facts.push(`Hồi ${pct(p.ratio)} MP tối đa · tính cả bản thân`);rules.push('Chỉ kích hoạt sau toàn bộ Vòng Phụ. Hòa tỷ lệ MP thì chọn theo thứ tự đội hình.');break;
    default:summary=p.description??'Xem quy tắc nội tại.';
  }
  return {name,summary,facts:unique(facts),rules:unique(rules)};
}
