import {nativeEvasion,evasionBaseSpeed} from '../core/evasion.js';
import {exclusiveDamageEffect} from '../core/exclusive-hooks.js';
import {periodicPotency} from '../core/periodic-damage.js';
import { formulaDamage, formulaPower, FORMULA_NAMES } from '../core/formula-field.js';
import { scalingValue, scalingLabel } from '../core/scaling.js';
// Public copy contract: docs/SKILL_COPY_AND_UX_SPEC.md
import { debuffDamageBonus, buffDamageBonus, lowHpDamageBonus, hpCost, resourceCost } from '../core/conditional-combat.js';
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
  const cost=resourceCost(skill,actor);
  const spent=choices.spent??(cost?.all?cost.min??1:cost?.amount??0);
  let assumed=actor;
  if (!choices.live && actor.passive?.type==='field_growth' && choices.fieldStacks!==undefined) assumed={...assumed,statuses:[{id:actor.passive.statusId,growth:choices.fieldStacks}]};
  if (!choices.live && cost && actor.passive?.type==='resource_stat_boost' && actor.passive.resource===cost.id) assumed={...assumed,resourceValues:{...actor.resourceValues,[cost.id]:spent}};
  const value=key=>choices.live?battleStat(content,actor,key,false,0,choices.baseStatBonuses?.[key]??0):effectiveStat(assumed,key);
  function statusFacts(effect,linked=false) {
    const status=content.statuses[effect.status];
    const self=effect.to==='self'||skill.target==='self';
    const prefix=effect.to==='self'&&skill.target!=='self'?'Bản thân: ':'';
    const extension=exclusive?.type==='skill_status_duration'&&applies(exclusive,skill)&&exclusive.statusId===effect.status?exclusive.extraDuration:0;
    const turns=effect.duration===undefined?'':status.durationClock==='round'?` · ${effect.duration+extension} vòng`:` · ${effect.duration+extension} lượt${status.durationClock==='main_turn'?' chính của mục tiêu':self?' kế tiếp':''}`;
    const mods=[];
    for(const[key,n]of Object.entries(status.modifiers??{})) {
      if(key==='damageVsShielded')mods.push(`Địch có khiên: sát thương ×${number(1+n)}`);
      else if(key==='attackMultiplier')mods.push(`Đòn tấn công kế: sát thương ×${number(n)}`);
      else if(key==='damageTakenBonus')mods.push(`${signed(n)} sát thương nhận`);
      else if(key==='damageReduction')mods.push(`Giảm ${pct(n)} sát thương nhận`);
      else mods.push(`${signed(n)} ${statName(key)}${status.modifiersPerStack?'/tầng':''}`);
    }
    if(mods.length)facts.push(prefix+mods.join(' · ')+turns+(status.consumeOnAttack?' · đòn tấn công kế tiếp':''));
    if(status.mpCostReduction){facts.push('Giảm '+pct(status.mpCostReduction)+' MP tiêu hao');rules.push('Làm tròn chi phí lên; chiêu có tốn MP luôn cần ít nhất 1 MP.','Không cộng dồn; duy trì hết trận hoặc chuyến hầm ngục.');}
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
    if(status.weaknessMultiplier){facts.push(prefix+`Đánh trúng điểm yếu: +${pct(status.weaknessMultiplier-1)} sát thương`+turns);rules.push('Thay mức +50% mặc định; nhiều nguồn lấy mức mạnh nhất, không cộng dồn.','Liên kích và phản công xét buff của người gây sát thương.');}
    if(status.exposedElement){facts.push(prefix+`Yếu ${ELEMENT_NAMES[status.exposedElement]} · +${effect.stacks??1} tầng · tối đa 3`+turns);rules.push('Cùng hệ cộng tầng; khác hệ thay Sơ hở cũ. Giữ nguyên điểm yếu tự nhiên.','Mỗi chiêu trúng đúng hệ tiêu 1 tầng/mục tiêu, dù nhiều hit. Liên kích và phản công tính riêng.','Né không tiêu tầng; đánh trúng khiên vẫn tiêu. Không tính Độc hoặc mất HP do chi phí.','Sơ hở mới tạo trong chiêu chỉ dùng từ chiêu kế tiếp; có thể bị giải hoặc Hộ ấn chặn.');}
    if(status.maxStacks&&!status.exposedElement)facts.push(`+1 ${status.name} · tối đa ${status.maxStacks} tầng`+turns);
    if(effect.extraStacksIfPresent)facts.push(`Địch đã có ${status.name} trước chiêu: thêm ${effect.extraStacksIfPresent} tầng`);
    if(status.durationClock==='round')rules.push('Tính cả vòng thi triển; thời hạn giảm sau toàn bộ Vòng Phụ, không theo lượt riêng của người nhận.');
    if(status.durationClock==='main_turn')rules.push('Thời hạn giảm theo lượt Vòng Chính của người nhận; Vòng Phụ không giảm thời hạn.');
    if(status.damageOverTime){
      const dot=status.damageOverTime;
      const bonus=actor.passive?.type==='dot_potency_bonus' && actor.passive.statusIds.includes(status.id) ? 1+actor.passive.ratio : 1;
      const formula=[dot.flat?number(dot.flat):'',dot.multiplier?`${pct(dot.multiplier)} ${statName(dot.scalingStat)}`:''].filter(Boolean).join(' + ');
      facts.push(`Độc: ${formula} → ${periodicPotency(status,actor,value)} HP/đầu lượt${status.maxStacks?' mỗi tầng':''}${bonus>1?' (nội tại ×'+number(bonus)+')':''}`+turns);
      if(!skill.rules?.length)rules.push('Độc bỏ qua giáp và khiên; lượng độc chốt khi dùng chiêu. Dùng lại làm mới.');
    }
    if(status.turnStartAbility){
      const pulse=content.abilities[status.turnStartAbility];
      const damage=pulse.effects.find(e=>e.type==='damage');
      facts.push(`Đầu lượt: ${pct(damage.multiplier)} ${damage.damageType==='physical'?'ATK':'MAG'} · ${ELEMENT_NAMES[damage.element]} · toàn địch`+turns);
    }
    if(status.modifierGroup)rules.push('Các mức giảm SPD cùng nhóm lấy mức mạnh nhất.');
    if(status.magicRefresh)rules.push(`Phép của phe người gắn dấu làm mới ${status.name}, tối đa một lần/vòng/mục tiêu.`);
    if(status.persistent&&!status.effectImmunity&&!status.consumeOnAttack&&!status.exposedElement){
      rules.push(status.expiresOnShieldGain?'Hiệu ứng kết thúc khi nhận khiên mới.':linked?'Hiệu ứng đi kèm được gỡ khi tắt trạng thái chính.':'Duy trì đến khi tắt hoặc kết thúc trận.');
    }
    if(status.exposedElement&&effect.duration===undefined)rules.push('Duy trì đến khi hết tầng, bị giải hoặc kết thúc trận; giữ qua phòng theo luật của hầm ngục.');
    if(status.modifiers?.damageVsShielded)rules.push('Xét khiên ở đầu từng hit; tăng cả sát thương tràn vào HP.');
    for(const id of effect.linkedStatuses??[])statusFacts({type:'status',status:id},true);
  }
  for(const authoredEffect of skill.effects) {
    const effect=exclusiveDamageEffect(actor,skill.id,formulaDamage(authoredEffect,{correct:choices.formulaCorrect??0}));
    if(effect.type==='formula_field'){facts.push(effect.durationRounds+' vòng · '+effect.sequence.map(tag=>FORMULA_NAMES[tag]).join(' → '));rules.push('Ba kỹ năng chủ động gần nhất của đồng đội khác; mỗi kỹ năng ghi một dấu. Kích ưu tiên trước Phá, rồi Dẫn.','Không ghi đánh thường, Phòng thủ, nội tại, phản công, Liên kích hoặc kỹ năng của chính người dựng.','Vòng thi triển được tính; hết sau Vòng Phụ của vòng '+effect.durationRounds+'.');}
    if(effect.type==='edit_formula'){facts.push('Đổi chỗ 2 dấu hoặc viết lại 1 dấu');rules.push('Đổi chỗ giữ người góp dấu. Viết lại mang nguồn người hiệu chỉnh.','Tốn một hành động; không ghi thêm dấu vào công thức của chính mình.');}
    if(effect.type==='end_formula')rules.push('Thi triển xong sẽ kết thúc Đại Đồ Thức, kể cả khi mục tiêu gục trước hit cuối.');
    const prefix=effect.to==='self'&&skill.target!=='self'?'Bản thân: ':'';
    if(effect.type==='damage'){
      const label=scalingLabel(effect,STAT_LABELS);
      let formula=effect.primaryMultiplier!==undefined?`${pct(effect.primaryMultiplier)} ${label} chính / ${pct(effect.multiplier)} ${label} còn lại`:`${pct(effect.multiplier??1)} ${label}`;
      if(effect.perResource)formula+=` + ${pct(effect.perResource)} ${label}/${resourceName(actor,cost?.id)}`;
      if(effect.perStack)formula+=` + ${pct(effect.perStack)} ${label}/${content.statuses[effect.consumeStatus].name}`;
      if(effect.perTargetBuff)formula+=` + ${pct(effect.perTargetBuff)} ${label}/buff địch (tối đa ${effect.maxTargetBuffs})`;
      if(effect.lowHpBonus)formula+=` + tối đa ${pct(effect.lowHpBonus)} ${label} theo HP đã mất`;
      const speed=speedDamageRatio(actor,effect.damageType,effect.speedMultiplier??0);
      if(speed)formula+=` + ${pct(speed)} SPD`;
      facts.push(`${DAMAGE_TYPE_NAMES[effect.damageType]} · ${ELEMENT_NAMES[effect.element]} · ${effect.hits>1?effect.hits+' × (':''}${formula}${effect.hits>1?')':''}`);
      if(effect.scalingStat && effect.scalingStat!==(effect.damageType==='physical'?'attack':'magic'))rules.push(effect.damageType==='physical'?'Lấy chỉ số đã chọn để gây sát thương vật lí: tính DEF, có thể bị né; không kích hoạt Liên kích phép đơn mục tiêu.':'Lấy chỉ số đã chọn để gây sát thương ma pháp: tính RES.');
      if(effect.bonusVsExposure)facts.push('Địch có Sơ hở bất kỳ: +'+pct(effect.bonusVsExposure)+' sát thương');
      if(effect.penetration)facts.push(`Xuyên ${pct(effect.penetration)} ${effect.damageType==='physical'?'DEF':'RES'}`);
      if(effect.consumeStatus)rules.push(`Tiêu toàn bộ ${content.statuses[effect.consumeStatus].name} trên từng mục tiêu; mỗi địch tính riêng.`);
      if(effect.perResource||effect.perStack||effect.lowHpBonus||effect.perTargetBuff){
        const ratio=damageMultiplier(effect,{spent,stacks:choices.stacks??0,hpRatio:(choices.hpPercent??100)/100,buffs:choices.buffCount??0});
        facts.push(`${choices.live?'Hiện tại':'Giả định'}: ${effect.hits>1?effect.hits+' × ':''}${pct(ratio)} ${label}${speed?' + '+pct(speed)+' SPD':''}`);
      }
      if(effect.onHitStatus){statusFacts({type:'status',status:effect.onHitStatus.status,duration:effect.onHitStatus.duration,stacks:effect.onHitStatus.stacks});if(content.statuses[effect.onHitStatus.status].maxStacks)rules.push(`Mỗi hit trúng gắn ${effect.onHitStatus.stacks??1} tầng; né không gắn hiệu ứng.`);}
      if(effect.unavoidable)facts.push('Không thể né');
    }
    if(effect.type==='heal'||effect.type==='shield'){
      const label=scalingLabel(effect,STAT_LABELS);
      const formula=[effect.multiplier?`${pct(effect.multiplier)} ${label}`:'',effect.flat?number(effect.flat):''].filter(Boolean).join(' + ')||'0';
      const amount=supportAmount(effect,scalingValue(effect,value));
      facts.push(`${prefix}${effect.type==='heal'?'Hồi HP':'Khiên'}: ${formula} → ${number(amount)}${skill.target==='all_allies'?'/người':''}`);
      if(effect.emergency)facts.push(`Mục tiêu ≤${pct(EMERGENCY_HP_THRESHOLD)} HP: hồi ×${number(EMERGENCY_HEAL_MULTIPLIER)} → ${supportAmount(effect,scalingValue(effect,value),true)} HP`);
      if(effect.durationRounds){facts.push('Khiên: '+effect.durationRounds+' vòng');rules.push('Hết thời hạn không kích hoạt hiệu ứng vỡ khiên.');}
      if(effect.type==='shield')rules.push('Khiên không cộng dồn; chỉ thay khi khiên mới mạnh hơn.');
    }
    if(effect.type==='status'||effect.type==='toggle_status')statusFacts(effect);
    if(effect.type==='resource')facts.push(`${prefix}${effect.resource==='mp'?'Hồi':'Tạo'} ${effect.maxMpRatio?(effect.amount?effect.amount+' + ':'')+pct(effect.maxMpRatio)+' MP tối đa':effect.amount+' '+resourceName(actor,effect.resource)}`);
    if(['enter_mode','prepare_mode'].includes(effect.type)) {const mode=actor.combatModes[effect.mode];facts.push((effect.type==='prepare_mode'?'Đầu vòng sau: ':'Triển khai ')+mode.name);for(const [key,n]of Object.entries(mode.baseStatBonuses)) facts.push('+'+n+' '+statName(key)+' căn bản');for(const [key,n]of Object.entries(mode.statModifiers??{}))facts.push(signed(n)+' '+statName(key));if(mode.mpCostReduction)facts.push('Chiêu công kích: −'+pct(mode.mpCostReduction)+' MP');if(mode.entryEffects) facts.push('Khi lên giáp: khiên '+pct(mode.entryEffects[0].multiplier)+' HP tối đa → '+Math.round(actor.stats.maxHp*mode.entryEffects[0].multiplier));if(mode.durationRounds) facts.push(mode.durationRounds+' vòng, tính cả vòng gọi');rules.push(mode.description);}
    if(effect.type==='summon_companion'){const c=actor.companions[effect.companion];facts.push('Đầu vòng sau: '+c.name+' · '+c.durationRounds+' vòng');facts.push('Đầu/cuối vòng: '+pct(content.abilities[c.roundStartAbility].effects[0].multiplier)+' DEF · Thổ · toàn địch');rules.push('Tính một lần mỗi đầu và cuối vòng, sau Vòng Phụ; không chiếm lượt hay ô đội hình.','Là Liên kích theo thời điểm, không được kích hoạt thêm bởi đòn của Drake, đồng đội hoặc Liên kích khác.');}
    if(effect.type==='turn_order_field') {facts.push('Đồng minh trước · đối thủ sau · '+effect.durationRounds+' vòng');rules.push('Vòng thi triển được tính là vòng đầu; kết thúc sau Vòng Phụ.');}
    if(effect.type==='cleanse')facts.push('Giải toàn bộ hiệu ứng bất lợi');
    if(effect.type==='dispel'){facts.push('Xóa '+(effect.all?'toàn bộ':effect.count)+' buff địch');rules.push('Không xóa khiên, combatMode hoặc hiệu ứng bàn đấu. Buff cùng loại nhiều tầng vẫn tính một loại.');}
    if(effect.type==='grant_extra_turn'){
      facts.push('Lượt Thêm: 1 · Vòng Phụ hiện tại');
      rules.push('Mỗi người nhận tối đa một Lượt Thêm mỗi vòng.','Trong Vòng Phụ, chỉ bỏ qua hiệu ứng cấp lượt; vẫn tiêu MP và hồi chiêu.');
    }
  }
  if(skill.effects.some(effect=>effect.formulaScaling)){
    const power=formulaPower(actor,{correct:choices.formulaCorrect??0,contributors:choices.formulaContributors??0});
    facts.push((choices.live?'Hiện tại':'Giả định')+': '+power.correct+'/3 dấu đúng · +'+power.baseMagic+' MAG căn bản');
    const authored=skill.effects.find(effect=>effect.formulaScaling),perfect=formulaDamage(authored,{correct:3});rules.push('Mỗi dấu đúng vị trí tăng '+pct(authored.formulaScaling.perCorrect)+' MAG cho từng hit. Đúng cả ba: mỗi hit '+pct(perfect.multiplier)+' MAG và xuyên '+pct(perfect.penetration)+' RES.','Công thức và MAG nội tại được chốt một lần khi thi triển; buff MAG hiện có áp dụng sau phần cộng căn bản.');
  }
  if(skill.cost?.hpMaxRatio){facts.push('Tiêu '+pct(skill.cost.hpMaxRatio)+' HP tối đa → '+hpCost(skill,actor)+' HP');rules.push('Chi phí không thể tự hạ gục; cần còn nhiều HP hơn số phải trả. Không bị khiên chặn, không kích hoạt phản đòn.');}
  if(actor.passive?.type==='target_buff_damage'&&skill.effects.some(effect=>effect.type==='damage')){const count=choices.buffCount??0;facts.push((choices.live?'Hiện tại':'Giả định')+': '+count+' loại buff địch · +'+pct(buffDamageBonus(actor.passive,count))+' sát thương');}
  if(actor.passive?.type==='low_hp_damage'&&skill.effects.some(effect=>effect.type==='damage'))facts.push((choices.live?'Hiện tại':'Giả định')+': nội tại +'+pct(lowHpDamageBonus(actor.passive,(choices.hpPercent??100)/100))+' sát thương');
  if(skill.target==='adjacent_allies'){facts.push('Hai ô kề · nối vòng ô 1 ↔ 4');rules.push('Không tự chọn người nhận và không cấp lượt cho bản thân.','Ô trống hoặc đồng đội đã gục không được thay bằng ô khác.','Lượt đã có không cộng dồn; người nhận vẫn cần đủ MP và kỹ năng hết hồi chiêu để dùng chiêu mong muốn.');}
  if(skill.target==='enemy_splash'){facts.push('Mục tiêu chính và hai ô kề');rules.push('Không nối vòng hai đầu đội hình; ô trống hoặc địch đã gục không kéo mục tiêu khác vào.','Là đòn diện rộng: không bị Khiêu khích/Che chắn chuyển hướng, không kích hoạt Liên kích phép đơn mục tiêu.');}
  if(skill.target==='random_enemies'){facts.push('Mỗi đòn chọn ngẫu nhiên một địch còn sống');rules.push('Có thể trúng lặp; một địch còn sống sẽ nhận toàn bộ các đòn.','Không ưu tiên mục tiêu đang chọn. Như đòn đa mục tiêu: bỏ qua Khiêu khích và Che chắn, không kích hoạt Liên kích phép đơn mục tiêu.');}
  if(actor.passive?.type==='target_debuff_damage' && skill.effects.some(effect=>effect.type==='damage')){const count=choices.debuffCount??0;facts.push((choices.live?'Hiện tại':'Giả định')+': '+count+' loại debuff · +'+pct(debuffDamageBonus(actor.passive,count))+' sát thương');}
  if(skill.cost?.preferResource){const preferred=skill.cost.preferResource;rules.push('Đủ '+preferred.amount+' '+resourceName(actor,preferred.id)+': tự dùng tầng, không tốn MP. Thiếu tầng: trả '+skill.cost.mp+' MP và giữ nguyên tầng.','Cách trả được chốt khi thi triển; không đổi sang cách còn lại giữa chừng.');}
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
  if(skill.requiresResource)facts.push('Cần '+skill.requiresResource.min+' '+resourceName(actor,skill.requiresResource.id)+' · không tiêu tầng');
  if(skill.requiresMode)rules.push('Chỉ dùng khi '+actor.combatModes[skill.requiresMode].name+' hiện diện.');
  const orderPassive=actor.passive;
  if (orderPassive?.type==='detonation_base_growth' && skill.effects.some(effect=>effect.type==='damage'&&effect.consumeStatus===orderPassive.statusId)) {
    facts.push('Tia sáng: +'+orderPassive.increment+' MAG căn bản khi kích nổ · tối đa +'+orderPassive.cap);
    rules.push('Tăng một lần mỗi chiêu nếu có Prisma thực sự bị tiêu; dùng chung tiến độ giữa các chiêu kích nổ.');
  }
  if (orderPassive?.type==='later_target_base_stat' && !skill.id?.startsWith('$') && skill.activation!=='passive' && skill.effects.some(effect=>effect.type==='damage')) {
    const bonus='+'+number(orderPassive.amount)+' '+statName(orderPassive.stat)+' căn bản';
    facts.push(orderPassive.name+': '+(choices.live ? (choices.baseStatBonuses?.[orderPassive.stat] ? bonus+' · đang kích hoạt' : 'chưa đủ điều kiện') : bonus+' khi có mục tiêu đứng sau'));
  }
  const summary=skill.description??(skill.id==='$defend'?'Phòng thủ và hồi MP để chuẩn bị cho lượt sau.':'Tấn công một kẻ địch.');
  return {summary,facts:unique(facts),rules:unique(rules)};
}

export function passivePresentation(actor,content) {
  const p=actor.passive;
  if(!p)return null;
  const facts=[],rules=[];
  let summary='',name=p.name??({damage_reduction:'Bền bỉ',shield_break_heal:'Dư âm thủy hộ'}[p.type]??'Năng lực đặc trưng');
  switch(p.type){
    case 'low_hp_damage':summary='Thương tích biến thành sức công phá.';facts.push('Mất 1% HP tối đa: +'+number(p.ratio)+'% sát thương · tối đa +'+pct(p.ratio));rules.push('Xét tỷ lệ HP hiện tại trước mỗi hit; cộng với các buff tăng sát thương cùng nhóm.','Chỉ áp dụng sát thương trực tiếp, không tăng chi phí HP.');break;
    case 'target_buff_damage':summary='Trừng phạt những đặc ân mà đối thủ đang mang.';facts.push('+'+pct(p.ratio)+' sát thương/loại buff địch · tối đa +'+pct(p.cap));rules.push('Đếm từng loại buff đang hoạt động, không đếm số tầng hoặc số chỉ số trong một buff.','Khiên, combatMode và hiệu ứng bàn đấu không tính là buff trạng thái. Xét lại mỗi hit; xóa buff sẽ giảm bonus ở đòn sau.');break;
    case 'ally_skill_counter':summary='Phản đòn khi kỹ năng địch làm hại đồng đội khác.';facts.push('Phản đòn: '+pct(content.abilities[p.counterAbility].effects[0].multiplier)+' ATK · Ám · 1 lần/vòng');rules.push('Chờ toàn bộ chiêu; cần đánh trúng HP hoặc khiên của ít nhất một đồng đội khác. Người đó gục vẫn kích hoạt.','Đánh thường, chỉ đánh bản thân, né, độc và phản ứng khác không kích hoạt.','Bản thân và kẻ tấn công phải còn sống. Vòng Chính/Vòng Phụ dùng chung giới hạn; không tạo chuỗi phản đòn.');break;
    case 'dot_potency_bonus':summary='Nọc độc tự gây bào mòn con mồi mạnh hơn.';facts.push('+'+pct(p.ratio)+' sát thương '+p.statusIds.map(id=>content.statuses[id].name).join(', '));rules.push('Chốt khi gắn độc; không tăng độc do đồng đội tạo.','Mỗi tầng cùng loại dùng lượng độc mỗi tầng mới nhất; dùng lại làm mới thời hạn.');break;
    case 'attack_status':summary='Mỗi đòn trực tiếp trúng địch làm suy yếu sức tấn công của họ.';facts.push(...Object.entries(content.statuses[p.statusId].modifiers).map(([key,n])=>signed(n)+' '+statName(key)),p.duration+' lượt chính của mục tiêu');rules.push('Tính đánh thường và kỹ năng; trúng khiên vẫn kích hoạt. Né, hồi máu và sát thương định kỳ không kích hoạt.','Mỗi mục tiêu tính riêng; làm mới, không cộng tầng.');break;
    case 'shield_survival_followup': {
      summary='Đồng đội khác bị đánh mà còn khiên sau toàn bộ chiêu sẽ gọi Liên kích diện rộng.';
      const follow=content.abilities[p.followUpAbility];
      facts.push(...follow.effects.map(effect=>'Liên kích: '+pct(effect.multiplier)+' '+scalingLabel(effect,STAT_LABELS)+' · '+ELEMENT_NAMES[effect.element]+' · toàn địch · 1 lần/vòng'));
      for(const effect of follow.effects) if(effect.onHitStatus){const mark=content.statuses[effect.onHitStatus.status];facts.push(...Object.entries(mark.modifiers??{}).map(([key,n])=>signed(n)+' '+statName(key)),effect.onHitStatus.duration+' lượt'+(mark.durationClock==='main_turn'?' chính':'')+' của mục tiêu');}
      rules.push('Khiên từ bất kỳ nguồn nào; chỉ xét người thực sự bị đánh trúng và vẫn còn khiên cuối chiêu.','Nếu chỉ bản thân bị đánh, không kích hoạt. Né, sát thương định kỳ và phản ứng khác không kích hoạt.','Đòn nhiều hit/diện rộng chỉ xét một lần; Vòng Chính và Vòng Phụ dùng chung hạn mức.');break;
    }
    case 'formula_scholar':summary='Kế thừa tri thức từ những đồng đội đã góp vào công thức.';facts.push('+'+p.amount+' MAG căn bản/đồng đội khác nhau · tối đa +'+(p.amount*p.maxSources));rules.push('Chỉ áp dụng cho Đại định lý; cộng một lần cho toàn bộ các hit, trước buff MAG%.','Dấu viết lại bởi bản thân không tính. Nhiều dấu của một người chỉ tính một nguồn.','Luận cứ đã ghi vẫn được tính khi người góp dấu đã gục.');break;
    case 'kill_mp_discount':summary='Hạ một đối thủ để tiết kiệm quân lực cho phần còn lại của trận.';facts.push('Giảm '+pct(p.ratio)+' MP tiêu hao sau lần tự hạ địch đầu tiên');rules.push('Không cộng dồn. Không hoàn MP cho chiêu vừa gây hạ gục.','Hiệu lực giữ qua các phòng trong một chuyến; trận mới độc lập sẽ đặt lại.','Chi phí làm tròn lên, tối thiểu 1 MP với chiêu có tốn MP.');break;
    case 'target_debuff_damage':summary='Biến hiệu ứng bất lợi trên mục tiêu thành sức mạnh của bản nhạc.';facts.push('+'+pct(p.ratio)+' sát thương mỗi loại debuff · tối đa +'+pct(p.cap));rules.push('Đếm số loại hiệu ứng khác nhau; nhiều tầng hoặc nhiều chỉ số trong cùng một hiệu ứng vẫn chỉ tính một loại.','Đếm lại ở từng hit, bất kể người gây debuff. Áp dụng cho đánh thường và đòn đánh trực tiếp.','Cộng với các buff tăng sát thương cùng nhóm; giới hạn chỉ áp dụng cho nội tại này.');break;
    case 'detonation_base_growth':summary='Kích nổ Prisma để nuôi dưỡng tia sáng.';facts.push('+'+p.increment+' MAG căn bản mỗi chiêu kích nổ · tối đa +'+p.cap);rules.push('Dùng chung tiến độ cho các chiêu kích nổ; cộng trước buff MAG% và áp dụng ngay cho chiêu đang dùng.','Cần tiêu ít nhất một Prisma; diện rộng hoặc nhiều tầng vẫn chỉ tăng một lần mỗi chiêu.','Chỉ tăng sức mạnh chiêu kích nổ. Giữ qua các đợt trong một chương và các giai đoạn của trùm; đặt lại khi bắt đầu trận/chương mới.');break;
    case 'later_target_base_stat':summary='Khai thác đối thủ đứng sau mình trong thứ tự lượt.';facts.push('+'+number(p.amount)+' '+statName(p.stat)+' căn bản cho kỹ năng đủ điều kiện');rules.push('Cần ít nhất một mục tiêu đứng sau trong thứ tự Vòng Chính; Vòng Phụ dùng lại bảng này.','Chốt lúc thi triển; cộng trước buff %. Chỉ cộng một lần cho cả chiêu, không nhân theo số địch hoặc số hit.','Không áp dụng cho đánh thường, phản công và liên kích.');break;
    case 'combat_mode': {summary=p.description;for(const mode of Object.values(actor.combatModes??{})){for(const [key,n]of Object.entries(mode.baseStatBonuses)) facts.push('+'+number(n)+' '+statName(key)+' căn bản khi '+mode.name+' hiện diện');for(const [key,n]of Object.entries(mode.statModifiers??{}))facts.push(signed(n)+' '+statName(key)+' khi chuyển dạng');if(mode.mpCostReduction)facts.push('Giảm '+pct(mode.mpCostReduction)+' MP chiêu công kích');if(mode.exitMpRatio>0) facts.push(mode.name+' rời sân: hồi '+pct(mode.exitMpRatio)+' MP tối đa');if(mode.durationRounds) facts.push(mode.name+': '+mode.durationRounds+' vòng, tính cả vòng gọi');if(mode.entryEffects) facts.push('Lên giáp: khiên '+pct(mode.entryEffects[0].multiplier)+' HP tối đa');if((mode.lifetime??'resource')==='resource') rules.push('Hết tầng: kiểm tra đầu mọi lượt của người triệu hồi và cuối vòng sau Vòng Phụ.','Khi rời sân, hồi MP đúng một lần; không mất lượt hiện tại.');else rules.push(mode.description);}break;}
    case 'damage_reduction':summary=p.requiresStatus?`Bền bỉ khi đang có ${content.statuses[p.requiresStatus].name}.`:'Bền bỉ trước mọi đòn đánh.';facts.push(`Giảm ${pct(p.amount)} sát thương nhận${p.requiresStatus?` · cần ${content.statuses[p.requiresStatus].name}`:''}`);break;
    case 'shield_break_heal':summary='Khi khiên do mình tạo bị phá, hồi HP cho người mang khiên.';facts.push(`Hồi ${pct(p.multiplier*(actor.exclusiveGear?.template?.passive.type==='shield_break_heal_bonus'?1+actor.exclusiveGear.template.passive.ratio:1))} MAG`);rules.push('Cả người tạo và người mang khiên phải còn sống.');break;
    case 'dodge_counter':{
      if(p.evasion){const counter=exclusiveDamageEffect(actor,p.counterAbility,content.abilities[p.counterAbility].effects.find(e=>e.type==='damage'));summary='Né vật lý lẫn phép; phản công tạo Sơ hở Quang.';facts.push('Né hiện tại: '+pct(nativeEvasion(actor,'physical'))+' · '+number(evasionBaseSpeed(actor))+' SPD căn bản',pct(p.evasion.baseChance)+' + '+pct(p.evasion.perBaseSpeed)+'/SPD căn bản · tối đa '+pct(p.evasion.cap),'Phản công: '+pct(counter.multiplier)+' ATK · Quang · +2 Sơ hở Quang · 1 lần/vòng');rules.push('SPD căn bản tính trang bị, Trấn Phái và bonus căn bản; không tính buff/debuff SPD theo %.','Né được đòn thường, kỹ năng đơn mục tiêu và từng hit diện rộng, kể cả phép; không né Độc hoặc đòn không thể né.','Vòng Chính/Vòng Phụ dùng chung giới hạn phản công; không phản công lồng từ phản ứng khác.','Sơ hở được gắn sau sát thương phản công, có thể bị Hộ ấn chặn.');break;}

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
    case 'shielded_damage_bonus':summary='Đang có khiên sẽ tăng sức mạnh kiếm thuật.';facts.push('+'+pct(p.ratio)+' sát thương khi còn khiên');rules.push('Nhận khiên từ bất kỳ nguồn nào đều được tính. Xét lại trước từng hit; khiên mất thì bonus mất.','Cộng với các buff tăng sát thương cùng nhóm.');break;
    case 'debuff_received_heal':summary='Xoa dịu đồng đội thực sự chịu hiệu ứng bất lợi từ kẻ địch.';facts.push('Hồi '+pct(p.multiplier)+' MAG HP/người · 1 lần/người/vòng');rules.push('Gồm bản thân; người cấp nội tại và người nhận phải còn sống.','Hộ Ấn đã chặn, debuff tự gây hoặc chỉ bị sát thương đều không kích hoạt.','Làm mới debuff từ địch vẫn được tính; Vòng Chính và Vòng Phụ dùng chung hạn mức. Đầy HP không tiêu hạn mức.');break;
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
    case 'end_round_team_mp':summary='Cuối vòng, tiếp MP cho toàn đội mà không cần tích tầng.';facts.push('Hồi '+pct(p.ratio)+' MP tối đa/người');rules.push('Sau toàn bộ Vòng Phụ, đúng một lần mỗi vòng; gồm bản thân và chỉ nhận khi còn sống.','Người cấp nội tại phải còn sống. Làm tròn lên, không vượt MP tối đa.');break;
    case 'shield_break_mp':summary='Khiên hoa hồng vỡ sẽ tiếp MP cho người mang khiên.';facts.push('Hồi '+pct(p.multiplier)+' '+scalingLabel(p,STAT_LABELS)+' → '+Math.ceil(scalingValue(p,key=>battleStat(content,{...actor,statuses:actor.statuses??[]},key))*p.multiplier)+' MP/người · 1 lần/người/vòng');rules.push('Lấy DEF và RES hiện tại của người tạo khiên. Làm tròn lên, không vượt MP tối đa.','Cả người tạo và người nhận phải còn sống. Chỉ khi bị đánh vỡ; thay khiên không kích hoạt.','Vòng Chính và Vòng Phụ dùng chung hạn mức. Người đang đầy MP không tiêu hạn mức.');break;
    case 'end_round_lowest_mp':summary='Cuối vòng, tiếp MP cho đồng minh có tỷ lệ MP thấp nhất.';facts.push(`Hồi ${pct(p.ratio)} MP tối đa · tính cả bản thân`);rules.push('Chỉ kích hoạt sau toàn bộ Vòng Phụ. Hòa tỷ lệ MP thì chọn theo thứ tự đội hình.');break;
    default:summary=p.description??'Xem quy tắc nội tại.';
  }
  return {name,summary,facts:unique(facts),rules:unique(rules)};
}
