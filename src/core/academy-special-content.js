// Enemy-only trials. These never replace or rebalance the four playable characters.
const damage=(element,multiplier,extra={})=>({type:'damage',damageType:'magical',element,multiplier,...extra});
const status=(id,duration,target)=>({type:'status',status:id,...(duration?{duration}:{}),...(target?{target}:{})});
const ability=(id,name,target,mp,cooldown,effects,description,windup)=>({id,name,target,cost:{mp},cooldown,effects,description,skillLineId:id,growthProfile:'fixed',growthGroups:[],rankable:false,fixedReason:'Kỹ năng thử thách học viện.',...(windup?{windup:{rounds:1,message:windup}}:{})});
export const academySpecialStatuses=[
 {id:'academy.doll_guard',name:'Màn Chỉ Rối',kind:'buff',durationClock:'main_turn',modifiers:{damageReduction:.25}},
 {id:'academy.slow',name:'Sai Nhịp',kind:'debuff',durationClock:'main_turn',modifiers:{speed:-.2}},
 {id:'academy.paint',name:'Sắc Mực Ăn Mòn',kind:'debuff',durationClock:'main_turn',modifiers:{resistance:-.25}},
 {id:'academy.focus',name:'Nét Cọ Hội Tụ',kind:'buff',durationClock:'main_turn',modifiers:{magic:.35}},
];
export const academySpecialAbilities=[
 ability('academy.rotary.thread','Chỉ Rối Siết Chặt','all_enemies',10,0,[damage('dark',.85),{type:'status',status:'buff_seal',charges:1}],'Gây phép Ám toàn đội và gắn 1 Phong Ấn.'),
 ability('academy.rotary.doll','Búp Bê Gánh Hạn','self',12,2,[{type:'shield',scalingStat:'magic',multiplier:3},status('academy.doll_guard',2)],'Tạo khiên 300% MAG và giảm 25% sát thương trong 2 lượt chính.'),
 ability('academy.rotary.finale','Khúc Múa Giật Dây','all_enemies',18,3,[damage('dark',1.15,{hits:2})],'Vận sức một vòng rồi gây hai đợt phép Ám toàn đội.','Rotary đang căng những sợi chỉ: hai đợt sát thương Ám sẽ tới ở lượt chính kế tiếp. Chuẩn bị khiên hoặc Phòng thủ.'),
 ability('academy.monica.tick','Tích Tắc Lạc Nhịp','all_enemies',10,0,[damage('wind',.85),status('academy.slow',2)],'Gây phép Phong toàn đội và giảm 20% SPD trong 2 lượt chính.'),
 ability('academy.monica.clock','Một Nhịp Đi Trước','self',14,3,[{type:'turn_order_field',name:'Một Nhịp Đi Trước',durationRounds:2}],'Trong 2 vòng, phe Monica hành động trước, vẫn xếp theo SPD trong mỗi phe.'),
 ability('academy.monica.finale','Giây Cuối Cùng','all_enemies',22,3,[damage('wind',1.05,{hits:2,penetration:.2})],'Vận sức một vòng rồi tấn công hai lần, xuyên 20% RES.','Kim đồng hồ đang dừng lại: hai đợt phép Phong xuyên RES sẽ đánh toàn đội ở lượt chính kế tiếp.'),
 ability('academy.lumine.edict','Điều Lệ — Trấn Áp','enemy',8,0,[damage('water',1.8,{damageType:'physical',scalingStat:'magic'})],'Dùng MAG gây sát thương vật lí Thủy đơn mục tiêu.'),
 ability('academy.lumine.guard','Kỷ Cương Hội Học Sinh','self',12,2,[{type:'shield',scalingStat:'magic',multiplier:3},status('true_strike',3)],'Tạo khiên 300% MAG và nhận Hội Tâm trong 3 lượt.'),
 ability('academy.lumine.finale','Phán Quyết Của Hội Trưởng','all_enemies',22,3,[damage('water',1.1,{damageType:'physical',scalingStat:'magic',hits:2,penetration:.25})],'Vận sức một vòng rồi gây hai đợt vật lí Thủy, xuyên 25% DEF.','Lumine đã giương lưỡi kiếm: đòn vật lí Thủy hai nhịp sẽ đánh toàn đội ở lượt chính kế tiếp. Phòng thủ hoặc dựng khiên.'),
 ability('academy.eri.ink','Mực Chưa Khô','enemy',8,0,[damage('earth',2),status('academy.paint',2)],'Gây phép Thổ và giảm 25% RES trong 2 lượt chính.'),
 ability('academy.eri.focus','Nét Cọ Hội Tụ','self',12,2,[status('academy.focus',3)],'Tăng 35% MAG trong 3 lượt chính.'),
 ability('academy.eri.finale','Bức Họa Không Lối Thoát','enemy',24,3,[damage('earth',1.65,{hits:3})],'Vận sức một vòng rồi gây ba nhát phép Thổ lên một mục tiêu.','Eri đang phác nét cuối: ba đòn phép Thổ sẽ tập trung vào mục tiêu đã chọn ở lượt chính kế tiếp. Hãy che chắn hoặc Phòng thủ.'),
];
const specs=[
 ['rotary','Rotary — Búp Bê Không Ngủ','dark',['light'],'thread','doll',1600,32,30,22,'Những sợi chỉ siết cả sân tập. Phong Ấn tiêu buff mới; khiên và Phòng thủ vẫn giúp chống đợt tấn công đã báo trước.'],
 ['monica','Monica — Nhịp Chuông Ngoài Thời Gian','wind',['fire','earth'],'tick','clock',1450,34,25,28,'Monica đổi nhịp hành động của cả bàn đấu. Chuẩn bị phòng thủ trước khi đồng hồ của cô dừng lại.'],
 ['lumine','Lumine — Điều Lệ Cuối Cùng','water',['thunder','earth'],'edict','guard',1750,34,30,22,'Lưỡi kiếm dùng MAG nhưng gây sát thương vật lí. Khiên của hội trưởng và Hội Tâm khiến né tránh đơn thuần không đủ.'],
 ['eri','Eri — Sắc Màu Ngoài Khung Vẽ','earth',['wind','water'],'ink','focus',1400,37,25,18,'Mực Thổ hạ RES trước chuỗi ba nhát cọ. Giải hiệu ứng và che chắn đúng người để ngăn áp lực dồn mục tiêu.'],
];
export const academySpecialEnemies=specs.map(([id,name,element,weaknesses,attack,setup,hp,mag,res,spd])=>({id:'academy_special_'+id,name,element,referenceLevel:1,stats:{maxHp:hp,maxMp:450,attack:24,magic:mag,defense:25,resistance:res,speed:spd},weaknesses,controlImmunities:['stun'],abilities:['academy.'+id+'.'+attack,'academy.'+id+'.'+setup,'academy.'+id+'.finale'],basicAttack:[damage(element,1)],ai:{priorities:[],rotation:['academy.'+id+'.'+setup,'academy.'+id+'.'+attack,'academy.'+id+'.finale','academy.'+id+'.'+attack]}}));
export const academySpecialEncounters=specs.map(row=>{const [id,name]=row;return {id:'academy_trial_'+id,name,description:row[10],enemies:['academy_special_'+id],category:'academy_special',rewardTier:'super',enemyLevel:40,referenceLevel:1,hpReferenceLevel:1,rewardPolicy:'none',bgm:'boss'};});
export function academySpecialKits(){return Object.fromEntries([['enemies',academySpecialEnemies],['encounters',academySpecialEncounters],['abilities',academySpecialAbilities],['statuses',academySpecialStatuses]].map(([key,rows])=>[key,Object.fromEntries(rows.map(r=>[r.id,r]))]));}
