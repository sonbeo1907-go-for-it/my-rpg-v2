import {createBattle} from './battle.js';
import {levelScaledEnemyStats} from './enemy-scaling.js';
import {ELEMENT_NAMES} from './content.js';
import {seededRandom} from './random.js';
export const TRAINING_ID='$training';
export const TRAINING_MAX_TARGETS=12;
export const TRAINING_STATS=['maxHp','maxMp','attack','magic','defense','resistance','speed'];
export function trainingPreset(content,id='goblin',level=1){
 const source=content.enemies[id];if(!source)throw Error('Mẫu bù nhìn không hợp lệ.');
 const stats=levelScaledEnemyStats(source,level,content,1,{rewardTier:'normal',hpScalingProfile:level>55?'superboss':'normal'});
 return {templateId:id,level,stats,element:source.element,weaknesses:[...source.weaknesses??[]],damageTypeWeaknesses:[...source.damageTypeWeaknesses??[]],resistances:{...source.resistances??{}},infiniteHp:true,behavior:'idle',shield:0,stunImmune:false,attack:{damageType:source.basicDamageType??'physical',multiplier:1,hits:1,area:false}};
}
export function validateTrainingConfig(content,config){
 if(!config||!Array.isArray(config.targets)||config.targets.length<1||config.targets.length>TRAINING_MAX_TARGETS)throw Error('Chọn từ 1 đến 12 bù nhìn.');
 for(const target of config.targets){
  if(!content.enemies[target.templateId]||!Number.isInteger(target.level)||target.level<1||target.level>90)throw Error('Mẫu hoặc cấp bù nhìn không hợp lệ.');
  if(TRAINING_STATS.some(k=>!Number.isSafeInteger(target.stats?.[k])||target.stats[k]<(k==='maxHp'?1:0)||target.stats[k]>1000000000))throw Error('Chỉ số bù nhìn phải là số nguyên từ 0 đến 1 tỷ; HP ít nhất là 1.');
  if(!Object.hasOwn(ELEMENT_NAMES,target.element)||!['weaknesses','damageTypeWeaknesses'].every(k=>Array.isArray(target[k])&&new Set(target[k]).size===target[k].length))throw Error('Nguyên tố hoặc điểm yếu không hợp lệ.');
  if(target.weaknesses.some(e=>!Object.hasOwn(ELEMENT_NAMES,e))||target.damageTypeWeaknesses.some(e=>!['physical','magical'].includes(e)))throw Error('Điểm yếu bù nhìn không hợp lệ.');
  if(!target.resistances||Object.entries(target.resistances).some(([k,n])=>!Object.hasOwn(ELEMENT_NAMES,k)||!Number.isFinite(n)||n<0||n>5))throw Error('Hệ số nhận sát thương phải nằm trong khoảng 0 đến 5.');
  if(!target.attack||!['physical','magical'].includes(target.attack.damageType)||!Number.isFinite(target.attack.multiplier)||target.attack.multiplier<=0||target.attack.multiplier>20||!Number.isInteger(target.attack.hits)||target.attack.hits<1||target.attack.hits>10||typeof target.attack.area!=='boolean')throw Error('Đòn thử sức cần hệ số lớn hơn 0, tối đa 2000%, từ 1 đến 10 hit.');
  if(typeof target.infiniteHp!=='boolean'||typeof target.stunImmune!=='boolean'||!['idle','basic','skills'].includes(target.behavior)||!Number.isSafeInteger(target.shield)||target.shield<0||target.shield>1000000000)throw Error('Thiết lập hành vi bù nhìn không hợp lệ.');
 }
 return config;
}
export function createTrainingBattle(content,campaign,config,seed=1){
 validateTrainingConfig(content,config);
 if(campaign.chronicles?.activeSession||campaign.arenaProgress?.pending||campaign.tournaments?.activeRun&&!campaign.tournaments.activeRun.outcome)throw Error('Hãy hoàn tất hoặc rời phiên chơi hiện tại trước khi luyện tập.');
 const local={...content,enemies:{...content.enemies},encounters:{...content.encounters},abilities:{...content.abilities}};
 local.abilities['training.wait']={id:'training.wait',name:'Chờ quan sát',target:'self',cost:{mp:0},cooldown:0,effects:[],description:'Bù nhìn đứng yên.',rankable:false};
 const ids=config.targets.map((target,i)=>{
  const id='$dummy_'+i,attackId='training.strike_'+i;
  local.abilities[attackId]={id:attackId,name:'Đòn thử sức',target:target.attack.area?'all_enemies':'enemy',cost:{mp:0},cooldown:0,effects:[{type:'damage',damageType:target.attack.damageType,scalingStat:target.attack.damageType==='physical'?'attack':'magic',element:target.element,multiplier:target.attack.multiplier,hits:target.attack.hits}],rankable:false};
  local.enemies[id]={id,name:'Bù nhìn '+(i+1),stats:{...target.stats},element:target.element,weaknesses:[...target.weaknesses],damageTypeWeaknesses:[...target.damageTypeWeaknesses],resistances:{...target.resistances},referenceLevel:1,abilities:target.behavior==='skills'?[attackId]:['training.wait'],basicDamageType:target.attack.damageType,trainingDummy:true,trainingInfiniteHp:target.infiniteHp,trainingBehavior:target.behavior,trainingShield:target.shield,...(target.stunImmune?{controlImmunities:['stun']}:{})};return id;
 });
 local.encounters[TRAINING_ID]={id:TRAINING_ID,name:'Khu Luyện Tập',category:'training',travelerStory:'training',rewardTier:'normal',enemyLevel:1,referenceLevel:1,enemies:ids,rewards:{coins:0}};
 const battle=createBattle(local,structuredClone(campaign),TRAINING_ID,seededRandom(seed),{training:{config:structuredClone(config),seed}});
 for(const [i,actor]of battle.actors.filter(a=>a.trainingDummy).entries())actor.level=config.targets[i].level;
 battle.rewardClaimed=true;return battle;
}
