export const HOME_SCENES=Object.freeze([
 {id:'tavern',name:'Quán Trọ Phương Bắc',art:'/art/tavern.svg',music:'tavern',caption:'Chưa có cuộc hành trình nào bắt đầu bằng một lời từ biệt.'},
 {id:'east_town',name:'Bến Cảng Không Chào Đón',art:'/art/home-east-town.svg',music:'home_east_town',firstClear:'east_ke_02',caption:'Đèn đã lên trên những mái nhà xa lạ.'},
 {id:'snow_town',name:'Thị Trấn Dưới Tuyết',art:'/art/home-snow-town.svg',music:'home_snow_town',firstClear:'north_ke_02',caption:'Dưới cực quang, vẫn có những ngọn đèn đợi người trở về.'},
 {id:'keijo_shrine',name:'Chuông Đền Vang Giữa Vực Sâu',art:'/art/home-keijo-shrine.svg',music:'home_shrine',firstClear:'east_ke_05',caption:'Một tiếng chuông vượt qua rừng núi, tìm đến người lữ khách.'},
]);
export const homeSceneUnlocked=(campaign,scene)=>!scene.firstClear||Boolean(campaign?.claimedFirstClearRewards?.includes(scene.firstClear));
export function normalizeHomeScene(value){if(value===undefined)return 'tavern';if(typeof value!=='string'||!HOME_SCENES.some(s=>s.id===value))throw Error('Cảnh nền đã lưu không hợp lệ.');return value;}
export function selectedHomeScene(campaign){const scene=HOME_SCENES.find(s=>s.id===campaign?.homeScene)??HOME_SCENES[0];return homeSceneUnlocked(campaign,scene)?scene:HOME_SCENES[0];}
export function changeHomeScene(campaign,id){const scene=HOME_SCENES.find(s=>s.id===id);if(!scene)throw Error('Cảnh nền không hợp lệ.');if(!homeSceneUnlocked(campaign,scene))throw Error('Hoàn thành toàn bộ “'+scene.name+'” để mở cảnh nền này.');return {...campaign,homeScene:id};}
