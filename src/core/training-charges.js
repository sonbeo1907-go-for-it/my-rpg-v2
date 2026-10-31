const HOUR=3600000,STEP=8*HOUR,OFFSET=7*HOUR;
export const trainingSlot=(now=new Date())=>{const t=now.getTime();if(!Number.isFinite(t)||t<0)throw Error('Thời gian hồi lượt không hợp lệ.');return Math.floor((t+OFFSET)/STEP);};
export function normalizeTrainingCharges(input){if(input===undefined)return {charges:9,lastSlot:null};if(!input||!Number.isInteger(input.charges)||input.charges<0||input.charges>9||input.lastSlot!==null&&(!Number.isSafeInteger(input.lastSlot)||input.lastSlot<0)||input.lastSlot===null&&input.charges!==9)throw Error('Lượt Rèn Luyện không hợp lệ.');return {charges:input.charges,lastSlot:input.lastSlot};}
export function trainingChargeState(campaign,now=new Date()){
 const saved=normalizeTrainingCharges(campaign.trainingCharges),slot=Math.max(trainingSlot(now),saved.lastSlot??0);
 const remaining=Math.min(9,saved.charges+Math.max(0,slot-(saved.lastSlot??slot))*3);
 return {used:9-remaining,remaining,limit:9,recharge:true,nextRecovery:new Date((slot+1)*STEP-OFFSET),state:{charges:remaining,lastSlot:slot}};
}
export function consumeTrainingCharge(campaign,now=new Date()){const view=trainingChargeState(campaign,now);if(view.remaining<1)throw Error('Đã hết lượt Rèn Luyện. Mỗi mốc 00:00 / 08:00 / 16:00 hồi 3 lượt.');campaign.trainingCharges={...view.state,charges:view.remaining-1};}
