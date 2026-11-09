import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const D = './data';
const enemies = JSON.parse(fs.readFileSync(`${D}/enemies.json`, 'utf8'));
const encounters = JSON.parse(fs.readFileSync(`${D}/encounters.json`, 'utf8'));
const music = JSON.parse(fs.readFileSync(`${D}/music.json`, 'utf8'));

const ALL_ELEMENTS = ['fire','water','earth','wind','thunder','light','dark','moon','sword_soul'];
const E = (id, name, element, hp, weaknesses, abilities = ['enemy.slash'], extra = {}) => ({
  id, name, role: extra.role ?? 'Quái Phương Đông', element,
  stats: {
    maxHp: hp, maxMp: extra.maxMp ?? 80,
    attack: extra.attack ?? 24, magic: extra.magic ?? 16,
    defense: extra.defense ?? 14, resistance: extra.resistance ?? 14,
    speed: extra.speed ?? 14,
  },
  weaknesses,
  ...(extra.resistances ? { resistances: extra.resistances } : {}),
  abilities,
  referenceLevel: 1,
  ...(extra.boss ? { boss: true, controlImmunities: ['stun'] } : {}),
});
const boss = (id, name, element, hp, weaknesses, abilities, extra = {}) => E(id, name, element, hp, weaknesses, abilities, { ...extra, boss: true, role: 'Thủ lĩnh Phương Đông', attack: 48, magic: 30, defense: 30, resistance: 30, speed: 17 });

const newEnemies = [
  E('east_pirate', 'Cướp biển tiên phong', 'water', 260, ['thunder','water'], ['enemy.slash']),
  E('east_archer', 'Cướp biển cung thủ', 'wind', 220, ['thunder'], ['enemy.double_hit'], { speed: 20 }),
  E('east_mage', 'Cướp biển pháp sư', 'water', 230, ['earth'], ['enemy.shaman_ember','enemy.splash'], { magic: 28 }),
  E('east_guard', 'Cướp biển đỡ đòn', 'earth', 420, ['water'], ['enemy.smash'], { defense: 22 }),
  boss('east_captain', 'Thuyền Trưởng Hải Tặc', 'water', 1400, ['thunder','water'], ['enemy.smash','enemy.quake','enemy.splash'], { resistances: { fire: 0.85 }, attack: 50, defense: 32 }),
  E('east_kasa', 'Kasa-obake', 'wind', 210, ['fire'], ['enemy.slash']),
  E('east_tsukumogami', 'Tsukumogami', 'earth', 280, ['fire'], ['enemy.smash'], { defense: 18 }),
  E('east_kappa', 'Kappa non', 'water', 240, ['thunder'], ['enemy.splash','enemy.shaman_ember'], { magic: 20 }),
  E('east_tanuki', 'Bake-danuki', 'wind', 260, ['wind'], ['enemy.slash','enemy.double_hit'], { speed: 19 }),
  E('east_rokuro', 'Rokurokubi', 'dark', 230, ['water'], ['enemy.shaman_hex'], { magic: 24 }),
  boss('east_tree', 'Cổ Mộc Nhiễm Yêu Khí', 'earth', 1420, ['fire','earth'], ['enemy.smash','enemy.quake'], { resistances: { water: 0.85 }, defense: 34, magic: 24 }),
  E('east_spiderling', 'Nhện con', 'earth', 220, ['fire'], ['enemy.spider_web'], { speed: 18 }),
  E('east_spider_guard', 'Nhện hộ vệ', 'earth', 360, ['fire','light'], ['enemy.spider_bite','enemy.spider_cocoon'], { defense: 20 }),
  E('east_kamaitachi', 'Kamaitachi', 'wind', 280, ['earth','water'], ['enemy.wolf_rend','enemy.double_hit'], { speed: 22, resistances: { wind: 0.85 } }),
  boss('east_jorogumo', 'Jorōgumo — Chủ Nhân Mạng Tơ', 'dark', 1480, ['fire','light','sword_soul'], ['enemy.spider_web','enemy.spider_bite','enemy.spider_cocoon'], { resistances: { earth: 0.85 }, speed: 18 }),
  boss('east_karasu', 'Karasu-Tengu Sa Đọa', 'wind', 1480, ['earth'], ['enemy.wyvern_wings','enemy.slash','enemy.double_hit'], { resistances: { wind: 0.85 }, speed: 22 }),
  E('east_raven', 'Quạ canh miếu', 'wind', 230, ['thunder'], ['enemy.slash'], { speed: 21 }),
  boss('east_tengu', 'Đại Tengu — Hộ Pháp Keijo', 'wind', 1500, ['earth','dark','sword_soul'], ['enemy.wyvern_wings','enemy.smash','enemy.quake'], { resistances: { wind: 0.85 }, speed: 23 }),
  boss('east_chiyoko', 'Chiyoko — Tổ Kiếm Trấn Quân', 'plain', 1900, [], ['enemy.slash','enemy.double_hit','enemy.smash'], { resistances: { fire: 0.85, water: 0.85, earth: 0.85, wind: 0.85, thunder: 0.85, light: 0.85, dark: 0.85, moon: 0.85, sword_soul: 0.85 }, speed: 20 }),
  E('east_snow_spirit', 'Linh thể tuyết', 'water', 240, ['fire'], ['enemy.shaman_ember'], { magic: 22 }),
  E('east_snow_beast', 'Yêu thú tuyết', 'water', 380, ['fire','thunder'], ['enemy.wolf_rend','enemy.smash'], { defense: 20 }),
  boss('east_yuki_onna', 'Yuki-onna — Bóng Trắng Không Tan', 'water', 2050, ['fire','light','sword_soul'], ['enemy.shaman_hex','enemy.splash','enemy.smash'], { resistances: { water: 0.85 }, magic: 38 }),
  E('east_tsurara', 'Tsurara-onna', 'water', 280, ['fire','thunder'], ['enemy.shaman_ember','enemy.splash'], { magic: 24 }),
  boss('east_yamauba', 'Yamauba — Chủ Quán Mù Sương', 'dark', 1800, ['moon','wind'], ['enemy.shaman_hex','enemy.smash'], { resistances: { dark: 0.85 }, magic: 34 }),
  boss('east_white_oni', 'Bạch Quỷ Trấn Sơn', 'earth', 1950, ['fire'], ['enemy.smash','enemy.quake','enemy.wolf_rend'], { resistances: { water: 0.85 }, attack: 56, defense: 34 }),
  E('east_oni_guard', 'Oni hộ vệ', 'earth', 420, ['water','wind'], ['enemy.smash'], { defense: 22 }),
  boss('east_onyudo', 'Ōnyūdō — Bóng Khổng Lồ', 'dark', 1650, ['thunder','dark'], ['enemy.quake','enemy.shaman_hex'], { magic: 34 }),
  boss('east_oni_commander', 'Xích Quỷ Đốc Chiến', 'fire', 1720, ['water'], ['enemy.smash','enemy.quake','enemy.shaman_ember'], { resistances: { fire: 0.85 }, attack: 52 }),
  boss('east_nue', 'Nue — Hung Thú Dị Hình', 'dark', 2100, ['earth','water'], ['enemy.smash','enemy.wyvern_breath','enemy.shaman_hex'], { resistances: { thunder: 0.85 }, magic: 36 }),
  boss('east_snake_shade', 'Xà Ảnh Phá Giới', 'dark', 2150, ['wind','dark'], ['enemy.snake_fang','enemy.quake','enemy.shaman_hex'], { resistances: { moon: 0.85 }, magic: 38 }),
  boss('east_orochi', 'Tàn Hồn Yamata no Orochi', 'dark', 2200, ['sword_soul'], ['enemy.snake_fang','enemy.miraebolis_tail','enemy.quake'], { resistances: { fire: 0.85, water: 0.85, earth: 0.85, wind: 0.85, thunder: 0.85, light: 0.85, dark: 0.85, moon: 0.85 }, attack: 58, magic: 40 }),
  boss('east_hunter', 'Thợ Săn Youkai Hống Hách', 'wind', 1450, ['light'], ['enemy.slash','enemy.double_hit','enemy.smash'], { resistances: { wind: 0.85 }, speed: 24 }),
  E('east_snake_spirit', 'Xà linh', 'dark', 260, ['thunder','light'], ['enemy.snake_fang','enemy.shaman_hex'], { magic: 26 }),
];

const newMusic = [
  ['east_harbor','Bến cảng Phương Đông','/bgm/bt1_east.mp3'],
  ['east_city','Thành phố Phương Đông','/bgm/bt2_east.mp3'],
  ['east_village','Làng Phương Đông','/bgm/bt1_east.mp3'],
  ['east_forest','Rừng Phương Đông','/bgm/bt2_east.mp3'],
  ['east_forest_boss','Thủ lĩnh rừng Phương Đông','/bgm/bt_boss_east.mp3'],
  ['east_mountain','Núi Phương Đông','/bgm/bt1_east.mp3'],
  ['east_mountain_boss','Thủ lĩnh núi Phương Đông','/bgm/bt_boss_east.mp3'],
  ['east_shrine','Đền Phương Đông','/bgm/bt2_east.mp3'],
  ['east_snow','Tuyết Phương Đông','/bgm/bt1_east.mp3'],
  ['east_snow_boss','Thủ lĩnh tuyết Phương Đông','/bgm/bt_boss_east.mp3'],
  ['east_snow_cave','Hang băng Phương Đông','/bgm/bt2_east.mp3'],
  ['east_ruins','Phế tích Phương Đông','/bgm/bt2_east.mp3'],
  ['east_army_boss','Quân đoàn Phương Đông','/bgm/bt_boss_east.mp3'],
  ['east_village_boss','Thủ lĩnh làng Phương Đông','/bgm/bt_boss_east.mp3'],
  ['east_night_parade','Bách quỷ dạ hành','/bgm/bt2_east.mp3'],
  ['east_seal','Phong ấn Phương Đông','/bgm/bt_key_east.mp3'],
  ['east_abyss','Vực Phương Đông','/bgm/bt2_east.mp3'],
  ['east_abyss_boss','Thủ lĩnh vực Phương Đông','/bgm/bt_boss_east.mp3'],
  ['east_final_prelude','Tiền sảnh Phương Đông','/bgm/bt_key_east.mp3'],
  ['east_key','Key Event Phương Đông','/bgm/bt_key_east.mp3'],
  ['east_boss','Boss Phương Đông','/bgm/bt_boss_east.mp3'],
  ['east_chiyoko','Chiyoko · Tổ Kiếm','/bgm/bt_east_chiyoko.mp3'],
].map(([id,name,track])=>({id,name,tracks:[track],loop:true}));

const wave = (...ids) => ids;
const make = (id, name, category, level, bgm, requires, waves, bossTier = false, extra = {}) => {
  const rows = waves ? waves : extra.enemies;
  const first = waves ? waves[0] : rows;
  const all = waves ? waves.flat() : rows;
  const hasBoss = all.length === 1 && newEnemies.find(e => e.id === all[0])?.boss;
  return {
    id, name, description: extra.description ?? '',
    category, eastGroup: extra.eastGroup,
    enemyLevel: level, referenceLevel: 1,
    defaultDifficulty: `east_${level}`,
    allowedDifficulties: extra.allowed ?? [`east_${level}`],
    ...(extra.fixed ? { fixedEnemyLevel: level } : {}),
    ...(waves ? { enemies: first, waves } : { enemies: first }),
    bgm,
    rewardTier: hasBoss || bossTier ? 'boss' : 'normal',
    hpScalingProfile: hasBoss || bossTier ? 'boss' : 'normal',
    requires,
    ...(extra.group ? { eastGroup: extra.group } : {}),
  };
};
const keyReq = (id) => id ? { firstClear: id } : undefined;
const groupReq = (ids) => ({ firstClears: ids });
const hunts = [];
const addHunt = (id, name, group, level, bgm, waves, weak, req, extra = {}) => hunts.push(make(id, name, 'east_hunt', level, bgm, req, waves, false, { eastGroup: group, allowed: ['east_35','east_45','east_55'], description: `Điểm yếu trọng tâm: ${weak}.`, ...extra }));
const H = (id, name, group, level, bgm, waves, weak, req, extra = {}) => addHunt(id, name, group, level, bgm, waves, weak, req, extra);

H('east_e_01','Ô Dù Nở Hoa Dưới Mưa',1,35,'east_harbor',[wave('east_kasa','east_tsukumogami','east_tsukumogami'),wave('east_kasa','east_tsukumogami','east_tanuki')],'Phong',keyReq('east_ke_03'));
H('east_e_02','Mặt Nạ Giữa Chợ Đêm',1,35,'east_city',[wave('east_tanuki','east_tsukumogami','east_tsukumogami'),wave('east_tanuki','east_rokuro','east_kasa')],'Phong / Thổ',keyReq('east_ke_03'));
H('east_e_03','Tiếng Nước Dưới Cầu Gỗ',1,35,'east_village',[wave('east_kappa','east_kappa','east_tanuki'),wave('east_kappa','east_rokuro','east_tsukumogami')],'Lôi / Ám',keyReq('east_ke_03'));
H('east_e_04','Đêm Dài Ở Làng Takehana',1,35,'east_village',[wave('east_rokuro','east_kasa','east_tsukumogami'),wave('east_rokuro','east_tanuki','east_tanuki')],'Thủy',keyReq('east_ke_03'));
H('east_e_05','Gốc Cây Không Ngủ',1,35,'east_forest_boss',null,'Hỏa / Thổ',keyReq('east_ke_03'),{enemies:['east_tree'],description:'Cổ Mộc có khiên tái tạo; rễ cây hỗ trợ hồi phục. Điểm yếu: Hỏa / Thổ.',boss:true});
H('east_e_06','Mạng Tơ Trước Bình Minh',2,45,'east_forest',[wave('east_spiderling','east_spider_guard','east_spiderling'),wave('east_spider_guard','east_spiderling','east_kamaitachi')],'Hỏa / Quang',keyReq('east_ke_04'));
H('east_e_07','Lưỡi Đao Lướt Qua Tán Trúc',2,45,'east_forest',[wave('east_kamaitachi','east_kamaitachi','east_spiderling'),wave('east_kamaitachi','east_spider_guard','east_spiderling')],'Thổ / Thủy',keyReq('east_ke_04'));
H('east_e_08','Người Không Mặt Trên Đường Núi',2,45,'east_mountain',[wave('east_raven','east_raven','east_tsukumogami'),wave('east_raven','east_rokuro','east_kamaitachi')],'Ám / Phong',keyReq('east_ke_04'));
H('east_e_09','Lá Bùa Trên Cổng Torii',2,45,'east_shrine',[wave('east_tanuki','east_kasa','east_tsukumogami'),wave('east_tanuki','east_rokuro','east_kasa')],'Ám / Lôi',keyReq('east_ke_04'));
H('east_e_10','Cánh Quạ Dưới Vách Đá',2,45,'east_mountain_boss',null,'Thổ',keyReq('east_ke_04'),{enemies:['east_karasu'],description:'Karasu-Tengu tăng né tránh, gây giảm DEF. Điểm yếu: Thổ.',boss:true});
H('east_e_11','Khói Đen Từ Lò Rèn',3,55,'east_city',[wave('east_tsukumogami','east_spider_guard','east_tsukumogami'),wave('east_oni_guard','east_tsukumogami','east_tsukumogami')],'Lôi / Thủy',keyReq('east_ke_05'));
H('east_e_12','Lửa Ma Trong Khu Mộ',3,55,'east_ruins',[wave('east_snow_spirit','east_snow_spirit','east_rokuro'),wave('east_snow_spirit','east_rokuro','east_snow_spirit')],'Thủy / Quang',keyReq('east_ke_05'));
H('east_e_13','Cỗ Kiệu Không Người Khiêng',3,55,'east_city',[wave('east_oni_guard','east_oni_guard','east_tsukumogami'),wave('east_oni_guard','east_oni_guard','east_oni_guard')],'Thổ / Phong',keyReq('east_ke_05'));
H('east_e_14','Bóng Khổng Lồ Trên Ruộng Lúa',3,55,'east_village_boss',[wave('east_oni_guard','east_oni_guard'),wave('east_onyudo')],'Lôi / Ám',keyReq('east_ke_05'),{description:'Ōnyūdō đánh AoE và giảm ATK/MAG. Điểm yếu: Lôi / Ám.',boss:true});
H('east_e_15','Tiếng Trống Trước Cổng Thành',3,55,'east_army_boss',null,'Thủy',keyReq('east_ke_05'),{enemies:['east_oni_commander'],description:'Oni chỉ huy tiếp viện; có dấu quân đội giả. Điểm yếu: Thủy.',boss:true});
H('east_e_16','Con Đường Bị Tuyết Nuốt Chửng',4,55,'east_snow',[wave('east_snow_spirit','east_snow_spirit','east_snow_beast'),wave('east_snow_spirit','east_snow_beast','east_tsurara')],'Hỏa / Ám',keyReq('east_ke_06'));
H('east_e_17','Nhát Chém Giữa Cơn Bão Trắng',4,55,'east_snow',[wave('east_kamaitachi','east_kamaitachi','east_snow_beast'),wave('east_kamaitachi','east_kamaitachi','east_tsurara')],'Thổ / Quang',keyReq('east_ke_06'));
H('east_e_18','Nữ Chủ Quán Trọ Trong Sương',4,55,'east_snow_boss',null,'Nguyệt / Phong',keyReq('east_ke_06'),{enemies:['east_yamauba'],description:'Yamauba hút HP và gây sai lệch nhận diện. Điểm yếu: Nguyệt / Phong.',boss:true});
H('east_e_19','Lời Hứa Trong Hang Băng',4,55,'east_snow_cave',[wave('east_tsurara','east_snow_spirit','east_tsurara'),wave('east_tsurara','east_snow_beast','east_snow_spirit')],'Hỏa / Lôi',keyReq('east_ke_06'));
H('east_e_20','Cổng Đá Dưới Tuyết',4,55,'east_snow_boss',null,'Hỏa',keyReq('east_ke_06'),{enemies:['east_white_oni'],description:'Bạch Quỷ phá khiên, tụ lực, đổi rotation dưới 40% HP. Điểm yếu: Hỏa.',boss:true});
H('east_e_21','Tiếng Rít Dưới Lớp Băng',5,55,'east_abyss',[wave('east_snake_spirit','east_snake_spirit','east_rokuro'),wave('east_snake_spirit','east_rokuro','east_snake_spirit')],'Lôi / Quang',keyReq('east_ke_07'));
H('east_e_22','Bách Quỷ Dạ Hành',5,55,'east_night_parade',[wave('east_oni_guard','east_oni_guard','east_tsukumogami'),wave('east_raven','east_raven','east_rokuro'),wave('east_kappa','east_kappa','east_snow_spirit')],'Nhiều hệ theo nhóm',keyReq('east_ke_07'));
H('east_e_23','Ngôi Miếu Đã Quên Tên',5,55,'east_seal',[wave('east_rokuro','east_rokuro','east_snake_spirit'),wave('east_snake_spirit','east_raven','east_snake_spirit')],'Quang / Hồn Kiếm',keyReq('east_ke_07'));
H('east_e_24','Tiếng Gầm Trên Đỉnh Xám',5,55,'east_abyss_boss',null,'Thổ / Thủy',keyReq('east_ke_07'),{enemies:['east_nue'],description:'Nue đổi hình thái vật lí/ma pháp. Điểm yếu: Thổ / Thủy.',boss:true});
H('east_e_25','Bảy Vòng Phong Ấn',5,55,'east_final_prelude',null,'Phong / Ám',keyReq('east_ke_07'),{enemies:['east_snake_shade'],description:'Xà Ảnh phòng thủ theo chu kỳ; phá phong ấn bằng điểm yếu hoặc đủ sát thương. Điểm yếu: Phong / Ám.',boss:true});

const eastKeys = [
  make('east_ke_01','Sóng Dữ Trên Hải Trình','east_key',35,'east_harbor',undefined,[wave('east_pirate','east_pirate','east_archer'),wave('east_mage','east_guard','east_guard','east_pirate'),wave('east_captain')],true,{fixed:true,description:'Toán cướp tập kích giữa biển; W2 có hỏa hoạn báo trước, boss dồn hit sau khi đánh dấu. Điểm yếu: Lôi / Thủy.',allowed:['east_35']}),
  make('east_ke_02','Bến Cảng Không Chào Đón','east_key',35,'east_city',keyReq('east_ke_01'),[wave('east_kasa','east_tsukumogami','east_tsukumogami'),wave('east_kappa','east_kappa','east_tanuki')],false,{fixed:true,description:'Youkai cấp yếu chặn đường. Không có boss lớn; xử lý quái hỗ trợ trước. Điểm yếu: Hỏa / Phong.',allowed:['east_35']}),
  make('east_ke_03','Thanh Kiếm Của Kẻ Hống Hách','east_key',35,'east_city',keyReq('east_ke_02'),null,true,{enemies:['east_hunter'],fixed:true,description:'Hội thợ săn địa phương thử thách nhóm Arthur. Điểm yếu: Quang.',allowed:['east_35']}),
  make('east_ke_04','Lối Mòn Không Có Trên Bản Đồ','east_key',45,'east_forest_boss',groupReq(['east_e_01','east_e_02','east_e_03','east_e_04','east_e_05']),[wave('east_kamaitachi','east_spiderling','east_spiderling'),wave('east_spider_guard','east_spiderling','east_kamaitachi'),wave('east_jorogumo')],true,{fixed:true,description:'Gặp Shion và Akane, vượt rừng lên núi. Điểm yếu: Hỏa / Lôi / Hồn Kiếm.',allowed:['east_45']}),
  make('east_ke_05','Chuông Đền Vang Giữa Vực Sâu','east_key',45,'east_mountain_boss',groupReq(['east_e_06','east_e_07','east_e_08','east_e_09','east_e_10']),[wave('east_raven','east_raven'),wave('east_tengu')],true,{fixed:true,description:'Đền Keijo và phong ấn cổ. Điểm yếu: Thổ / Ám / Hồn Kiếm.',allowed:['east_45']}),
  make('east_ke_06','Lưỡi Kiếm Của Sự Hiểu Lầm','east_key',45,'east_chiyoko',groupReq(['east_e_11','east_e_12','east_e_13','east_e_14','east_e_15']),null,true,{enemies:['east_chiyoko'],fixed:true,description:'Quân đội triệu tập và hiểu lầm; Chiyoko là boss riêng, 2 phase. Không có điểm yếu.',allowed:['east_45']}),
  make('east_ke_07','Lời Thì Thầm Dưới Tuyết Trắng','east_key',55,'east_snow_boss',groupReq(['east_e_16','east_e_17','east_e_18','east_e_19','east_e_20']),[wave('east_snow_spirit','east_snow_spirit','east_tsurara'),wave('east_yuki_onna')],true,{fixed:true,description:'Thủ hộ phong ấn bị hiểu nhầm. Điểm yếu: Hỏa / Quang / Hồn Kiếm.',allowed:['east_55']}),
  make('east_ke_08','Bát Kỳ Xà — Đêm Nuốt Trời','east_key',55,'east_abyss_boss',groupReq(['east_e_21','east_e_22','east_e_23','east_e_24','east_e_25']),null,true,{enemies:['east_orochi'],fixed:true,description:'Ngăn tàn hồn đại xà tái sinh. Điểm yếu: Hồn Kiếm.',allowed:['east_55']}),
];

const newEncounters = [...eastKeys, ...hunts];

const out = {
  enemies: [...enemies, ...newEnemies],
  encounters: [...encounters, ...newEncounters],
  music: [...music, ...newMusic],
};
const tmp = path.join(os.tmpdir(), 'east-gen');
fs.mkdirSync(tmp, { recursive: true });
fs.writeFileSync(path.join(tmp, 'new-enemies.json'), JSON.stringify(newEnemies, null, 2) + '\n');
fs.writeFileSync(path.join(tmp, 'new-encounters.json'), JSON.stringify(newEncounters, null, 2) + '\n');
fs.writeFileSync(path.join(tmp, 'new-music.json'), JSON.stringify(newMusic, null, 2) + '\n');
console.log(tmp);
