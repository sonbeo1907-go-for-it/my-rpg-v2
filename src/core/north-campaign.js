// Northern opening: all authored stats are Lv1; difficulty is fixed at Lv50.
const damage=(multiplier,element='earth',damageType='physical')=>({type:'damage',multiplier,element,damageType});
const skill=(id,name,target,effects,extra={})=>({id,name,description:extra.description??name,target,cost:{mp:extra.mp??8},cooldown:extra.cooldown??0,effects,skillLineId:id,growthProfile:'fixed',growthGroups:[],rankable:false,fixedReason:'Kỹ năng của kẻ địch.',...extra});
export const northAbilities=[
 skill('north.cleave','Chém Xuyên Gió Tuyết','enemy',[damage(1.4)]),
 skill('north.volley','Loạt Tên Qua Đèo','all_enemies',[damage(.8,'wind')]),
 skill('north.frost','Hơi Lạnh Cắt Da','all_enemies',[damage(.85,'water','magical')]),
 skill('north.crush','Đèo Tuyết Sụp Đổ','all_enemies',[damage(1.65)],{mp:18,cooldown:3,bossHeavy:true,windup:{rounds:1,message:'Thủ lĩnh giương búa: đòn đánh toàn đội sắp tới. Hãy dựng khiên hoặc Phòng Thủ!'}}),
 skill('north.shade_snap','Vết Cắn Bám Đèn','enemy',[damage(1.4,'dark')]),
 skill('north.shade_bite','Cơn Đói Sau Cửa Kính','enemy',[damage(1.8,'dark')]),
 skill('north.shade_wave','Tiếng Gào Dưới Mái Trọ','all_enemies',[damage(1.5,'dark','magical')],{mp:18,cooldown:3,bossHeavy:true,windup:{rounds:1,message:'Bóng đen tụ lại dưới mái trọ: một đợt sóng ma lực sẽ quét toàn đội ở lượt kế tiếp!'}}),
];
const unit=(id,name,element,hp,attack,magic,defense,resistance,speed,weaknesses,abilities,extra={})=>({id,name,role:'Kẻ địch Phương Bắc',element,stats:{maxHp:hp,maxMp:200,attack,magic,defense,resistance,speed},referenceLevel:1,weaknesses,abilities,...extra});
const phases=(first,second)=>({type:'phased',restorePartyMpOnTransition:false,phases:[{name:'Giao chiến',atHpRatio:1,actionsPerTurn:1,rotation:[['enemy.east_basic'],...first.map(x=>[x])]},{name:'Dồn vào đường cùng',atHpRatio:.5,actionsPerTurn:1,damageMultiplier:1.2,rotation:second.map(x=>[x])}]});
const veil={normalDamage:.7,effectDamage:1.1};
export const northEnemies=[
 unit('north_bandit','Cướp Đèo Tuyết','earth',460,34,14,26,22,18,['fire','wind'],['north.cleave']),
 unit('north_archer','Xạ Thủ Bên Vách Núi','wind',380,34,14,22,24,23,['earth','thunder'],['north.volley','north.cleave']),
 unit('north_mage','Pháp Sư Cướp Đường','water',400,15,36,20,28,20,['fire','earth'],['north.frost']),
 unit('north_chief','Hagen — Kẻ Thu Phí Đường Núi','earth',2550,58,32,34,30,20,['water','wind'],['enemy.east_basic','north.cleave','north.volley','north.crush'],{controlImmunities:['stun'],boss:phases(['north.cleave','north.volley','north.crush'],['north.volley','north.crush','north.cleave'])}),
 unit('north_tavern_shade','Bóng Đen Bám Đèn','dark',530,36,43,26,28,21,['light','fire'],['north.shade_snap','north.frost'],{damageKindMultipliers:veil}),
 unit('north_tavern_horror','Kẻ Gõ Cửa Sau Nửa Đêm','dark',3150,60,54,34,34,22,['light','earth'],['enemy.east_basic','north.shade_bite','north.frost','north.shade_wave'],{damageKindMultipliers:veil,controlImmunities:['stun'],boss:phases(['north.shade_bite','north.frost','north.shade_wave'],['north.frost','north.shade_wave','north.shade_bite'])}),
];
const quest=(id,name,description,order,waves,requires,extra={})=>({id,name,description,category:'north_key',northOrder:order,enemyLevel:50,referenceLevel:1,fixedEnemyLevel:50,defaultDifficulty:'north_50',allowedDifficulties:['north_50'],fixed:true,rewardTier:'boss',hpScalingProfile:'boss',enemies:waves[0],waves,requires,bgm:order===1?'drageshelmfjall':'drageshelmfjall_boss',...extra});
export const northEncounters=[
 quest('north_ke_01','Qua Đèo, Về Phía Đèn Xa','Sau trận chiến với Yamata no Orochi, Arthur và những người bạn vượt đèo tuyết đến Drageshelmfjall. Bọn cướp chặn đường trên sườn núi; phía sau chúng là một thủ lĩnh quen lấy bão tuyết làm đồng minh.',1,[['north_bandit','north_archer','north_mage'],['north_chief']],{firstClear:'east_ke_08'}),
 quest('north_ke_02','Đêm Không Yên Dưới Mái Trọ','Một quán trọ sáng đèn giữa thị trấn tuyết tưởng như là chỗ nghỉ an toàn. Khi cánh cửa đóng lại, những bóng đen bò khỏi gầm bàn. Chúng nhận 70% sát thương thường và 110% sát thương hiệu ứng.',2,[['north_tavern_shade','north_tavern_shade','north_tavern_shade'],['north_tavern_horror']],{firstClears:['east_ke_08','north_ke_01']},{firstClearRewards:[{type:'gear_recipe',recipeId:'moonlit_duet'},{type:'gear_recipe',recipeId:'moonlit_covenant'}]}),
];
export const northMusic=[{id:'home_snow_town',name:'Thị Trấn Dưới Tuyết',tracks:['/bgm/bgm_snow_town.mp3'],loop:true}];
