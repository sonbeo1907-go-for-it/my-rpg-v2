// Post-Orochi encounters. All authored stats are Lv1; encounter selects the HP curve.
const damage = (damageType, element, multiplier) => ({type:'damage',damageType,element,multiplier});
const status = (id,duration) => ({type:'status',status:id,...(duration?{duration}:{})});
const ability = (id,name,target,mp,cooldown,effects,description,extra={}) => ({
  id,name,target,cost:{mp},cooldown,effects,description,...extra,
  skillLineId:id,growthProfile:'fixed',growthGroups:[],rankable:false,
  fixedReason:'Kỹ năng Đại Yêu Ma giữ hệ số cố định.',
});
export const eastSuperAbilities = [
  ability('east_great.mountain_palm','Bàn Tay Lấp Thung','enemy',0,0,[damage('physical','earth',1.4)],'Giáng bàn tay khổng lồ lên một mục tiêu.'),
  ability('east_great.mountain_step','Bước Chân Chôn Lối','all_enemies',10,1,[damage('physical','earth',.9),status('east_great_slow',2)],'Tấn công toàn đội, giảm 15% SPD trong 2 lượt chính.'),
  ability('east_great.mountain_boulder','Đá Tảng Xuyên Mây','enemy',12,2,[damage('physical','earth',1.8)],'Ném đá vào một mục tiêu đã được báo trước.',{bossHeavy:true,windup:{rounds:1,message:'Mục tiêu bị nhắm nên chuẩn bị Phòng Thủ hoặc Che Chắn.'}}),
  ability('east_great.mountain_collapse','Núi Đổ Không Trời','all_enemies',24,3,[damage('physical','earth',2)],'Đánh toàn đội. Phá Sơn Thế bằng đòn trúng điểm yếu để giảm hoặc ngắt chiêu.',{bossHeavy:true,windup:{rounds:2,message:'Đánh điểm yếu để phá ba dấu Sơn Thế, hoặc chuẩn bị phòng thủ.'}}),
  ability('east_great.fox_flame','Hồ Hỏa Lạc Hồn','enemy',0,0,[damage('magical','dark',1.1)],'Hồ hỏa tấn công một mục tiêu.'),
  ability('east_great.fox_mask','Lời Mời Dưới Mặt Nạ','all_enemies',12,2,[damage('magical','dark',.65),status('buff_seal')],'Tấn công toàn đội, gắn 1 Phong Ấn mỗi người.'),
  ability('east_great.fox_thread','Sợi Chỉ Trói Phép','enemy',10,2,[damage('magical','dark',1.4),status('mana_disruption')],'Tấn công một mục tiêu, gắn 1 Nhiễu Ma Lực.'),
  ability('east_great.fox_incense','Hương Chú Mòn Thân','all_enemies',18,3,[damage('magical','dark',.7),status('deep_wound',2),status('shield_fracture',2)],'Tấn công toàn đội, gắn Vết Thương Sâu và Rạn Khiên trong 2 lượt chính.'),
  ability('east_great.fox_ritual','Bách Chú Quy Tâm','all_enemies',24,3,[damage('magical','dark',1.6)],'Tấn công toàn đội. Mỗi loại debuff do Cửu Vĩ gây ra còn trên người nhận tăng 15% sát thương, tối đa 45%.',{bossHeavy:true,windup:{rounds:2,message:'Giải hiệu ứng bất lợi do Cửu Vĩ gây ra để giảm sức mạnh nghi thức.'}}),
  ability('east_great.thunder_maul','Chùy Sấm Giáng Môn','enemy',0,0,[damage('physical','thunder',1.4)],'Chùy sấm đánh một mục tiêu.'),
  ability('east_great.thunder_shock','Lôi Chấn Phá Trận','all_enemies',12,2,[damage('physical','thunder',.9),status('shield_fracture',2)],'Tấn công toàn đội, gắn Rạn Khiên trong 2 lượt chính.'),
  ability('east_great.wind_blade','Phong Nhận Trấn Môn','enemy',0,0,[damage('magical','wind',1.4)],'Phong nhận đánh một mục tiêu.'),
  ability('east_great.wind_shield','Màn Gió Hộ Huynh','all_allies',14,3,[{type:'shield',scalingStat:'resistance',multiplier:1.8},status('east_great_wind_guard',2)],'Tạo khiên bằng 180% RES và giảm 15% sát thương nhận cho hai boss trong 2 lượt chính. Có thể xóa buff.'),
  ability('east_great.thunder_ritual','Thiên Môn Lôi Bạo — Lôi','all_enemies',16,0,[damage('physical','thunder',1.1)],'Nửa Lôi của nghi thức song quỷ. Đánh điểm yếu hai lần vào Lôi Quỷ để ngắt phần này.',{bossHeavy:true}),
  ability('east_great.wind_ritual','Thiên Môn Lôi Bạo — Phong','all_enemies',16,0,[damage('magical','wind',1.1)],'Nửa Phong của nghi thức song quỷ. Đánh điểm yếu hai lần vào Phong Quỷ để ngắt phần này.',{bossHeavy:true}),
];
export const eastSuperStatuses = [
  {id:'east_great_slow',name:'Bước Nặng Sơn Quỷ',kind:'debuff',durationClock:'main_turn',modifiers:{speed:-.15}},
  {id:'east_great_wind_guard',name:'Màn Gió Trấn Môn',kind:'buff',durationClock:'main_turn',modifiers:{damageReduction:.15}},
];
const phase = (name,atHpRatio,actionsPerTurn,rotation) => ({name,atHpRatio,actionsPerTurn,rotation});
const enemy = (id,name,element,stats,weaknesses,abilities,phases,extra={}) => ({
  id,name,element,stats,weaknesses,abilities,role:'Đại Yêu Ma',referenceLevel:1,
  controlImmunities:['stun'],...extra,
  boss:{type:phases.length===1?'scripted':'phased',restorePartyMpOnTransition:false,pendingFiller:abilities[0],phases,...extra.boss},
});
export const eastSuperEnemies = [
  enemy('east_great_mountain','Daidarabotchi — Cự Quỷ Gánh Núi','earth',
    {maxHp:6200,maxMp:620,attack:55,magic:36,defense:36,resistance:30,speed:12},['wind','water','sword_soul'],
    ['east_great.mountain_palm','east_great.mountain_step','east_great.mountain_collapse','east_great.mountain_boulder'],[
      phase('Sơn Thế Trấn Địa',1,1,[['east_great.mountain_palm'],['east_great.mountain_step'],['east_great.mountain_collapse'],['east_great.mountain_boulder']]),
      phase('Núi Thức Giấc',.5,2,[['east_great.mountain_palm','east_great.mountain_palm'],['east_great.mountain_step','east_great.mountain_palm'],['east_great.mountain_collapse','east_great.mountain_palm'],['east_great.mountain_boulder','east_great.mountain_palm']]),
    ],{formationSpan:3,bossArt:'mountain',boss:{ritual:{kind:'stance',abilityId:'east_great.mountain_collapse',marks:3,reductionPerMark:.15,exposedDamage:.2}}}),
  enemy('east_great_fox','Tamamo-no-Mae — Cửu Vĩ Dệt Chú','dark',
    {maxHp:5600,maxMp:700,attack:20,magic:49,defense:26,resistance:40,speed:23},['fire','light','sword_soul'],
    ['east_great.fox_flame','east_great.fox_mask','east_great.fox_thread','east_great.fox_incense','east_great.fox_ritual'],[
      phase('Hồ Hỏa Dẫn Lối',1,1,[['east_great.fox_flame'],['east_great.fox_mask'],['east_great.fox_thread'],['east_great.fox_incense'],['east_great.fox_ritual']]),
      phase('Cửu Vĩ Khép Chú',.5,2,[['east_great.fox_flame','east_great.fox_flame'],['east_great.fox_mask','east_great.fox_flame'],['east_great.fox_thread','east_great.fox_flame'],['east_great.fox_incense','east_great.fox_flame'],['east_great.fox_ritual','east_great.fox_flame']]),
    ],{bossArt:'fox',boss:{ritual:{kind:'curse',abilityId:'east_great.fox_ritual',perDebuff:.15,maxTypes:3}}}),
  enemy('east_great_thunder','Lôi Quỷ Trấn Môn','thunder',
    {maxHp:3400,maxMp:380,attack:53,magic:28,defense:33,resistance:28,speed:20},['earth','water','sword_soul'],
    ['east_great.thunder_maul','east_great.thunder_shock','east_great.thunder_ritual'],[
      phase('Lôi Quỷ Giữ Cổng',1,1,[['east_great.thunder_maul'],['east_great.thunder_shock']]),
    ],{bossArt:'thunder'}),
  enemy('east_great_wind','Phong Quỷ Trấn Môn','wind',
    {maxHp:3200,maxMp:420,attack:30,magic:48,defense:28,resistance:34,speed:22},['fire','thunder','sword_soul'],
    ['east_great.wind_blade','east_great.wind_shield','east_great.wind_ritual'],[
      phase('Phong Quỷ Giữ Cổng',1,1,[['east_great.wind_blade'],['east_great.wind_shield']]),
    ],{bossArt:'wind'}),
];
const encounter = (id,name,enemies,eastOrder,description,bgm,extra={}) => ({
  id,name,enemies,description,bgm,category:'east_super',eastOrder,rewardTier:'super',
  hpScalingProfile:'superboss',enemyLevel:60,referenceLevel:1,hpReferenceLevel:1,
  superLevels:[60,70,80,90],requires:{storyFlag:'east_campaign_completed'},...extra,
});
export const eastSuperEncounters = [
  encounter('east_super_mountain','Đại Yêu Ma — Cự Quỷ Gánh Núi',['east_great_mountain'],34,
    'Một thân hình chiếm ba ô, một thanh sinh mệnh. Đánh điểm yếu phá Sơn Thế trước khi Núi Đổ Không Trời giáng xuống.','east_great_mountain'),
  encounter('east_super_fox','Đại Yêu Ma — Cửu Vĩ Dệt Chú',['east_great_fox'],35,
    'Hồ hỏa dệt Phong Ấn, Nhiễu Ma Lực, Vết Thương Sâu và Rạn Khiên. Giải chú trước nghi thức Bách Chú Quy Tâm.','east_great_fox'),
  encounter('east_super_twins','Đại Yêu Ma — Song Quỷ Trấn Môn',['east_great_thunder','east_great_wind'],36,
    'Hai quỷ giữ cổng, hai nhịp tấn công. Ngắt nghi thức Thiên Môn Lôi Bạo; chuẩn bị khi chỉ còn một quỷ trấn môn.','east_great_twins',{
      bossEncounter:{type:'linked_bosses',firstWarningRound:3,cycleRounds:4,marks:2,
        rituals:[{enemyId:'east_great_thunder',abilityId:'east_great.thunder_ritual'},{enemyId:'east_great_wind',abilityId:'east_great.wind_ritual'}],
        survivor:{actionsPerTurn:2,damageMultiplier:1.15}},
    }),
];
// Valid shipped tracks until dedicated music is supplied; IDs remain stable for replacement.
export const eastSuperMusic = [
  {id:'east_great_mountain',name:'Đại Yêu Ma · Cự Quỷ',tracks:['/bgm/bt_boss_east.mp3'],loop:true},
  {id:'east_great_fox',name:'Đại Yêu Ma · Cửu Vĩ',tracks:['/bgm/bt_boss_east.mp3'],loop:true},
  {id:'east_great_twins',name:'Đại Yêu Ma · Song Quỷ',tracks:['/bgm/bt_boss_east.mp3'],loop:true},
];
