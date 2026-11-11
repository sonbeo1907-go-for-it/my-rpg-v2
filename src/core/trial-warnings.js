import {isAlive} from './actor-life.js';
import {trialRule} from './unrecorded-trials.js';

export function announceTrialMechanic(battle,io,kind,title,text){
 if(!battle.trial)return;
 const state=battle.trial,source=battle.actors.find(a=>a.team==='enemy'&&isAlive(a));
 const alert={id:(state.alertSerial??0)+1,kind,title,text,round:battle.round,sourceId:source?.id};
 state.alertSerial=alert.id;state.alerts=[...(state.alerts??[]).slice(-11),alert];
 io.write(battle,title+': '+text);io.emit?.(battle,{type:'boss_mechanic',...alert});
}
export function trialRoundStart(battle,io){
 const state=battle.trial;if(!state||battle.outcome)return;
 const mechanic=state.definition.mechanic;
 if(mechanic==='linked_heads'&&state.deadline===battle.round)announceTrialMechanic(battle,io,'warning','Cơ hội cuối','Hạ các đầu còn lại trong vòng này. Nếu chưa đủ ba đầu, những đầu đã gục sẽ hồi sinh khi hết vòng.');
 if(mechanic==='adaptive_ego'&&battle.round===state.adaptedAt+trialRule(battle,'adaptCooldown',5))announceTrialMechanic(battle,io,'warning','Thích nghi sắp xảy ra','Cuối vòng này, đối thủ đổi điểm yếu và kháng theo sát thương đội bạn đã gây.');
 if(mechanic==='time_calamity'&&state.reverseRound===battle.round)announceTrialMechanic(battle,io,'active','Nghịch Thời đang hiệu lực','Trong vòng này, SPD thấp hành động trước. Theo dõi thứ tự lượt trước khi chọn kỹ năng.');
}
export function trialUpcomingWarning(battle){
 const state=battle?.trial;if(!state||battle.outcome)return '';
 const prepared=battle.actors.filter(a=>a.team==='enemy'&&isAlive(a)&&a.preparedMove);
 if(prepared.length)return prepared.map(a=>a.name+' chuẩn bị '+battle.content.abilities[a.preparedMove.abilityId]?.name).join(' · ');
 if(state.definition.mechanic==='linked_heads'&&state.deadline!==null)return 'Hạn hạ đủ ba đầu: cuối vòng '+state.deadline+'. Còn '+Math.max(1,state.deadline-battle.round+1)+' vòng tính cả vòng này.';
 if(state.definition.mechanic==='adaptive_ego')return 'Đổi điểm yếu và kháng ở cuối vòng '+(state.adaptedAt+trialRule(battle,'adaptCooldown',5))+'.';
 if(state.definition.mechanic==='time_calamity')return 'Sau lượt của Tai Ương: đảo thứ tự những lượt chưa dùng. Nghịch Thời kế tiếp sau vòng '+(Math.floor(battle.round/trialRule(battle,'timeInterval',4))*trialRule(battle,'timeInterval',4)+trialRule(battle,'timeInterval',4))+'.';
 return '';
}
