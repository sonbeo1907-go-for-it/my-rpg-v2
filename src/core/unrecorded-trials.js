import {announceTrialMechanic} from './trial-warnings.js';
import {dungeonDay} from './dungeon-rules.js';
import {isAlive} from './actor-life.js';
import {damageElements} from './elements.js';

export const TRIAL_BOOK_NAME='Khúc Ca Ngoài Sử Sách';
export const TRIAL_DAILY_LIMIT=30;
export const TRIAL_LEVELS=[60,70,80,90];
const STAT_KEYS=['maxHp','maxMp','attack','magic','defense','resistance','speed'];
const NAMES={plain:'Thường',fire:'Hỏa',water:'Thủy',earth:'Thổ',wind:'Phong',thunder:'Lôi',light:'Quang',dark:'Ám',moon:'Nguyệt',sword_soul:'Hồn Kiếm'};
const fail=()=>{throw Error('Điều kiện thử thách không hợp lệ.');};
export function trialDefinition(content,encounterId){return content.trials?.[content.encounters[encounterId]?.trialId]??null;}
export function trialSelection(content,encounterId,input={}){
 const definition=trialDefinition(content,encounterId);if(!definition)fail();
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['level','conditions'].includes(k)))fail();
 const level=input.level??60,conditions=input.conditions??{};
 if(!TRIAL_LEVELS.includes(level)||!conditions||typeof conditions!=='object'||Array.isArray(conditions))fail();
 const ids=new Set(definition.conditions.map(c=>c.id)),selected={};
 for(const [id,tier]of Object.entries(conditions)){if(!ids.has(id)||!Number.isInteger(tier)||tier<0||tier>3)fail();if(tier)selected[id]=tier;}
 const score=TRIAL_LEVELS.indexOf(level)*2+Object.values(selected).reduce((a,b)=>a+b,0);
 return {level,conditions:selected,score,maxScore:6+definition.conditions.length*3};
}
export function trialPureReward(score){return score>=22?30:score>=19?25:score>=16?20:score>=12?12:score>=8?6:0;}
export function normalizeTrialLedger(input){
 if(input===undefined)return {day:null,earned:0,lastSerial:0,best:{}};
 if(!input||typeof input!=='object'||Array.isArray(input))fail();
 const {day,earned,lastSerial,best}=input;
 if(day!==null&&(typeof day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day+'T00:00:00Z'))||new Date(day+'T00:00:00Z').toISOString().slice(0,10)!==day))fail();
 if(!Number.isSafeInteger(earned)||earned<0||earned>30||!Number.isSafeInteger(lastSerial)||lastSerial<0||(day===null&&earned!==0)||!best||typeof best!=='object'||Array.isArray(best))fail();
 if(Object.keys(best).length>100||Object.entries(best).some(([id,n])=>!/^song_[a-z]+$/.test(id)||!Number.isInteger(n)||n<0||n>33))fail();
 return {day,earned,lastSerial,best:{...best}};
}
export function trialDailyState(campaign,now=new Date()){
 const ledger=normalizeTrialLedger(campaign.unrecordedLedger),day=dungeonDay(now);
 const state=ledger.day===null||day>ledger.day?{...ledger,day,earned:0}:ledger;
 return {...state,remaining:TRIAL_DAILY_LIMIT-state.earned};
}
export function trialRewardPreview(campaign,selection,now=new Date()){
 const raw=trialPureReward(selection.score),state=trialDailyState(campaign,now);
 return {coins:1000,recruitmentShards:Math.min(raw,state.remaining),rawPure:raw,remaining:state.remaining};
}
// This settlement is part of the caller's persistence transaction. No live flags change here.
export function settleTrialReward(campaign,battle,now=new Date()){
 const selection=trialSelection(battle.content,battle.encounterId,{level:battle.trial.selection.level,conditions:battle.trial.selection.conditions}),ledger=trialDailyState(campaign,now);
 if(!Number.isSafeInteger(battle.trial.serial)||battle.trial.serial<1||battle.trial.serial>ledger.lastSerial+1)fail();
 if(battle.trial.serial<=ledger.lastSerial)return {campaign,reward:{},duplicate:true};
 const reward=trialRewardPreview(campaign,selection,now),next=structuredClone(campaign);
 next.unrecordedLedger={day:ledger.day,earned:ledger.earned+reward.recruitmentShards,lastSerial:battle.trial.serial,best:{...ledger.best,[battle.encounterId]:Math.max(ledger.best[battle.encounterId]??0,selection.score)}};
 return {campaign:next,reward:{coins:reward.coins,...(reward.recruitmentShards?{recruitmentShards:reward.recruitmentShards}:{})},duplicate:false};
}
export function initializeTrial(battle,campaign,input,io){
 const definition=trialDefinition(battle.content,battle.encounterId);if(!definition)return;
 const selection=trialSelection(battle.content,battle.encounterId,input);
 if(battle.enemyLevel!==selection.level)fail();
 const state={definition:structuredClone(definition),selection:Object.freeze({...selection,conditions:Object.freeze({...selection.conditions})}),serial:normalizeTrialLedger(campaign.unrecordedLedger).lastSerial+1,deadline:null,damageByElement:{},adaptedAt:0,reverseRound:0};
 battle.trial=state;
 for(const actor of battle.actors){
  for(const condition of definition.conditions){const tier=selection.conditions[condition.id];if(!tier)continue;const rule=condition.tiers[tier-1];
   if(rule.stats&&actor.team===condition.team){for(const[key,factor]of Object.entries(rule.stats)){actor.stats[key]=Math.max(key==='maxMp'?0:1,Math.round(actor.stats[key]*factor));if(actor.baseStats?.[key]!==undefined)actor.baseStats[key]=Math.round(actor.baseStats[key]*factor);}}
  }
  actor.hp=actor.stats.maxHp;actor.mp=actor.stats.maxMp;
 }
 for(const condition of definition.conditions){const tier=selection.conditions[condition.id];if(!tier)continue;const rule=condition.tiers[tier-1];
  if(rule.status)for(const actor of battle.actors.filter(a=>a.team===condition.team))io.status(battle,actor,rule.status,rule.duration,actor.id,{stacks:rule.stacks??1});
 }
 io.write(battle,TRIAL_BOOK_NAME+' · '+selection.score+'/'+selection.maxScore+' điểm · Cấp '+selection.level+'.');
}
export function trialRule(battle,key,fallback){
 const definition=battle.trial?.definition;if(!definition||!battle.trial)return fallback;
 for(const condition of definition.conditions){const tier=battle.trial.selection.conditions[condition.id];if(tier&&Object.hasOwn(condition.tiers[tier-1],key))return condition.tiers[tier-1][key];}
 return fallback;
}
export function observeTrialDefeat(battle,io){
 if(!battle.trial||battle.trial.definition.mechanic!=='linked_heads'||battle.trial.deadline!==null)return;
 const heads=battle.actors.filter(a=>a.team==='enemy');
 if(heads.some(a=>!isAlive(a))&&heads.some(isAlive)){
  battle.trial.deadline=battle.round+2;
  announceTrialMechanic(battle,io,'warning','Một đầu đã gục','Hạ cả ba đầu trước khi kết thúc vòng '+battle.trial.deadline+'. Những đầu đã gục sẽ hồi sinh nếu quá hạn.');
 }
}
export function observeTrialHit(battle,attacker,effect,amount){
 if(!battle.trial||attacker.team!=='party'||amount<=0)return;
 for(const element of damageElements(effect))battle.trial.damageByElement[element]=(battle.trial.damageByElement[element]??0)+amount;
}
export function trialOffenseBonus(battle,actor){
 if(!battle.trial||actor.team!=='enemy')return 0;
 return battle.actors.filter(a=>a.team==='enemy'&&!isAlive(a)).length*trialRule(battle,'fallenOffense',0);
}
// Only the unspent suffix moves. The active turn, spent history and Extra grants are immutable.
export function trialAfterAction(battle,actor,io){
 if(battle.outcome||!battle.trial||!isAlive(actor)||actor.team!=='enemy'||battle.trial.definition.mechanic!=='time_calamity')return;
 const prefix=battle.queue.slice(0,battle.cursor+1),suffix=battle.queue.slice(battle.cursor+1);
 if(suffix.length>1){battle.queue=[...prefix,...suffix.reverse()];if(battle.phase==='main')battle.mainTurnOrder=[...battle.queue];
  announceTrialMechanic(battle,io,'active','Thứ tự lượt bị đảo','Các lượt chưa hành động đã đổi thứ tự. Những lượt đã dùng không được hoàn lại.');io.emit(battle,{type:'trial_time_shift',sourceId:actor.id});}
}
export function trialRoundEnd(battle,io){
 const state=battle.trial,definition=state?.definition;if(!state||!definition||battle.outcome)return;
 const enemies=battle.actors.filter(a=>a.team==='enemy'),boss=enemies.find(isAlive);
 if(!boss||!battle.actors.some(a=>a.team==='party'&&isAlive(a)))return;
 if(definition.mechanic==='linked_heads'){
  const revived=new Set();
  if(state.deadline!==null&&battle.round>=state.deadline){
   for(const head of enemies.filter(a=>!isAlive(a))){revived.add(head.id);head.hp=Math.max(1,Math.round(head.stats.maxHp*trialRule(battle,'reviveRatio',.5)));head.statuses=[];head.shield=0;head.shieldSourceId=null;delete head.shieldExpiresAfterRound;delete head.preparedMove;
    io.write(battle,head.name+' hồi sinh với '+head.hp+' HP.');io.emit(battle,{type:'revive',sourceId:boss.id,targetId:head.id,fallen:true,amount:head.hp,mp:head.mp});}
   state.deadline=null;
   announceTrialMechanic(battle,io,'active','Các đầu đã hồi sinh','Cửa sổ hạ ba đầu được đặt lại. Hạ một đầu để bắt đầu đếm ba vòng mới.');
  }
  const ratio=trialRule(battle,'headRegen',0);if(ratio)for(const head of enemies.filter(a=>isAlive(a)&&!revived.has(a.id)))io.heal(battle,head,Math.ceil(head.stats.maxHp*ratio),head.id);
 }
 if(definition.mechanic==='adaptive_ego'&&battle.round-state.adaptedAt>=trialRule(battle,'adaptCooldown',5)){
  const roster=battle.actors.filter(a=>a.team==='party'&&isAlive(a));
  const affinities=[...new Set(roster.flatMap(a=>[a.element,...(a.basicAttack??[]).flatMap(damageElements),...(a.abilities??[]).flatMap(id=>(battle.content.abilities[id]?.effects??[]).filter(e=>e.type==='damage').flatMap(damageElements))]))].filter(e=>NAMES[e]);
  const ranked=affinities.sort((a,b)=>(state.damageByElement[b]??0)-(state.damageByElement[a]??0)||a.localeCompare(b));
  // Preserve an available opening for varied teams; mono-element teams can still deal reduced damage.
  const resisted=ranked.slice(0,Math.min(2,Math.max(1,ranked.length-1))),weak=ranked.findLast(e=>!resisted.includes(e))??Object.keys(NAMES).find(e=>!resisted.includes(e));
  boss.weaknesses=[weak];boss.resistances=Object.fromEntries(resisted.map(e=>[e,trialRule(battle,'adaptResistance',.7)]));
  state.adaptedAt=battle.round;state.damageByElement={};
  io.write(battle,'Bản Ngã Tiến Hóa thích nghi: yếu '+NAMES[weak]+'; kháng '+resisted.map(e=>NAMES[e]).join(' / ')+' ('+Math.round((1-trialRule(battle,'adaptResistance',.7))*100)+'%). Lần kế tiếp sau '+trialRule(battle,'adaptCooldown',5)+' vòng.');
  announceTrialMechanic(battle,io,'active','Thích nghi hoàn tất','Điểm yếu mới: '+NAMES[weak]+'. Kháng: '+resisted.map(e=>NAMES[e]).join(' / ')+'.');
  io.emit(battle,{type:'trial_adapt',sourceId:boss.id,targetId:boss.id,label:'Thay đổi điểm yếu và kháng'});
  const shield=trialRule(battle,'adaptShield',0);if(shield)io.shield(battle,boss,Math.ceil(boss.stats.maxHp*shield));
 }
 if(definition.mechanic==='time_calamity'){
  const interval=trialRule(battle,'timeInterval',4);
  if(battle.round%interval===0){state.reverseRound=battle.round+1;announceTrialMechanic(battle,io,'warning','Nghịch Thời sắp bắt đầu','Vòng '+state.reverseRound+' xếp lượt từ SPD thấp đến cao.');}
  const echo=trialRule(battle,'timeEcho',0);if(echo)io.pulse(battle,boss,{type:'damage',damageType:'magical',element:'dark',multiplier:echo});
  const drain=trialRule(battle,'timeDrain',0);if(drain)for(const ally of battle.actors.filter(a=>a.team==='party'&&isAlive(a))){const lost=Math.min(ally.mp,Math.ceil(io.maxMp(battle.content,ally)*drain));ally.mp-=lost;if(lost)io.write(battle,ally.name+' mất '+lost+' MP bởi Nợ Thời Gian.');}
 }
}
export function trialMechanicText(battle){
 if(!battle?.trial)return '';
 const s=battle.trial,d=s.definition;
 if(d.mechanic==='linked_heads')return s.deadline===null?'Hạ cả ba đầu trong 3 vòng kể từ đầu đầu tiên gục.':'Hồi sinh các đầu đã gục khi hết vòng '+s.deadline+'.';
 if(d.mechanic==='adaptive_ego')return 'Thích nghi tiếp theo: cuối vòng '+(s.adaptedAt+trialRule(battle,'adaptCooldown',5))+'. Điểm yếu và kháng hiện trên thẻ đối thủ.';
 return 'Sau lượt Tai Ương: đảo các lượt chưa dùng. '+(s.reverseRound===battle.round?'Nghịch Thời đang hiệu lực: SPD thấp đi trước.':'Nghịch Thời tiếp theo sau vòng '+(Math.floor(battle.round/trialRule(battle,'timeInterval',4))*trialRule(battle,'timeInterval',4)+trialRule(battle,'timeInterval',4))+'.');
}
export function validateTrialContent(content){
 const errors=[];
 for(const d of Object.values(content.trials??{})){
  const e=content.encounters[d.encounterId];
  if(!e||e.trialId!==d.id||e.category!=='trial'||e.rewardTier!=='super'||!['linked_heads','adaptive_ego','time_calamity'].includes(d.mechanic)||!/^\/art\/song-[a-z]+\.svg$/.test(d.art)||typeof d.name!=='string'||typeof d.description!=='string'||d.conditions?.length!==9){errors.push(d.id+': invalid trial');continue;}
  const ids=new Set();for(const c of d.conditions){if(ids.has(c.id)||typeof c.id!=='string'||!/^([a-z][a-z0-9_]*)$/.test(c.id)||typeof c.name!=='string'||!['party','enemy'].includes(c.team)||c.tiers?.length!==3)errors.push(d.id+': invalid condition');ids.add(c.id);
   for(const t of c.tiers??[]){if(typeof t.text!=='string'||!t.text)errors.push(c.id+': missing condition copy');for(const[k,v]of Object.entries(t.stats??{}))if(!STAT_KEYS.includes(k)||!Number.isFinite(v)||v<.1||v>5)errors.push(c.id+': invalid stat');if(t.status&&(!content.statuses[t.status]||!Number.isInteger(t.duration)||t.duration<1||t.duration>60))errors.push(c.id+': invalid affliction');
    const limits={reviveRatio:[.5,1],fallenOffense:[0,.5],headRegen:[0,.1],adaptCooldown:[1,5],adaptResistance:[.1,1],adaptShield:[0,.3],timeInterval:[1,4],timeEcho:[0,1],timeDrain:[0,.1]};
    for(const[k,v]of Object.entries(t))if(!['text','stats','status','duration','stacks'].includes(k)&&(!limits[k]||!Number.isFinite(v)||v<limits[k][0]||v>limits[k][1]))errors.push(c.id+': invalid behavior modifier');
   }
  }
  if(e.enemies.length!==(d.mechanic==='linked_heads'?3:1)||e.enemies.some(id=>!content.enemies[id]?.controlImmunities?.includes('stun')))errors.push(d.id+': invalid superboss actors');
 }
 for(const e of Object.values(content.encounters??{}))if(e.trialId&&!content.trials?.[e.trialId])errors.push(e.id+': unknown trial');
 return errors;
}
