import { test, expect, type Page } from '@playwright/test';
import { loadContent } from '../scripts/load-content.mjs';
import { createGameSave, encodeGameSave } from '../src/core/game-save.js';
const content:any=await loadContent();
const day='2026-10-29';
const plans:any={easy:['ogre_trial'],medium:['ogre_trial','wyvern_trial_7'],hard:['ogre_trial','wyvern_trial_7']};
async function seed(page:Page){
 const save=createGameSave(content);save.party=['lisbeth','iris','elaine','garrek'];save.partyPresets[0].slots=[...save.party];save.unlockedCharacterIds.push('lisbeth');
 for(const id of ['lisbeth','iris','elaine']){save.extraGearSlots[id]=3;save.equipment[id]=[];for(let i=0;i<6;i++){const gear={id:`gear_${save.gear.length+1}`,typeId:'t3_focused',stats:{magic:5}};save.gear.push(gear);save.equipment[id].push(gear.id);}}
 save.gacha.totalPulls=save.gear.length;
 await page.clock.install({time:new Date('2026-10-29T05:00:00Z')});
 await page.addInitScript(({raw,plans,day})=>{
  if(!localStorage.getItem('northern-prisma.campaign.v4'))localStorage.setItem('northern-prisma.campaign.v4',raw);
  sessionStorage.setItem('northern-prisma.entered','1');
  localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({controlMode:'mouse',musicEnabled:false,musicVolume:.35}));
  Object.defineProperty(crypto,'getRandomValues',{configurable:true,value:(array:Uint32Array)=>{array.fill(42);return array;}});
  for(const[difficultyId,waveIds]of Object.entries(plans)){const key=`northern-prisma.scouting:1:dangerous:${difficultyId}:${day}`;if(!sessionStorage.getItem(key))sessionStorage.setItem(key,JSON.stringify({typeId:'dangerous',difficultyId,day,waveIds}));}
 },{raw:encodeGameSave(save,content),plans,day});
 await page.emulateMedia({reducedMotion:'reduce'});
}
const saved=(page:Page)=>page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('northern-prisma.profiles.v1')!).entries[0].text));

test('room scouting reveals every enemy and scaled stats, survives party/equipment navigation, difficulty switches and reload',async({page})=>{
 await seed(page);await page.goto('/dungeon/dangerous?selected=medium');
 await expect(page.locator('.dungeon-room-card')).toHaveCount(0);
 await page.locator('.embark').click();
 const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
 const rooms=page.locator('.dungeon-room-card');await expect(rooms.locator('h3')).toHaveText(['Phòng 1','Phòng 2']);
 expect(await rooms.evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-encounter-id')))).toEqual(plans.medium);
 const ogre=page.locator('.room-enemy[data-enemy-id=ogre_underling]');await expect(ogre).toContainText('Tay sai vua chằn');await expect(ogre.locator('.room-weakness')).toContainText('Quang');await expect(ogre.locator('.room-stats')).toContainText('960');await expect(page.locator('.room-enemy[data-enemy-id=goblin]')).toBeVisible();
 for(const id of plans.medium)await expect(page.locator('.dungeon-rooms')).not.toContainText(content.encounters[id].name);
 await ogre.locator('summary').click();await expect(ogre.locator('details')).toHaveAttribute('open','');
 await dialog.getByRole('link',{name:'Chỉnh đội hình',exact:true}).click();await expect(page).toHaveURL(/party\?fromDungeon=dangerous&difficulty=medium/);
 await page.locator('.detail-button').first().click();await expect(page).toHaveURL(/characters\/lisbeth/);await page.getByRole('link',{name:'Trang bị',exact:true}).click();await expect(page).toHaveURL(/lisbeth\/equipment/);
 await page.getByRole('link',{name:'Trở về',exact:true}).click();await page.getByRole('link',{name:'Trở về',exact:true}).click();await expect(page).toHaveURL(/party\?fromDungeon/);
 await page.getByLabel('Tên đội',{exact:true}).fill('Đội trinh sát');await page.getByRole('button',{name:'Lưu tên',exact:true}).click();await expect(page.getByLabel('Tên đội',{exact:true})).toHaveValue('Đội trinh sát');
 await page.getByRole('link',{name:'Trở về',exact:true}).click();await expect(page).toHaveURL(/dangerous\?selected=medium/);
 await page.locator('.embark').click();
 expect(await rooms.evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-encounter-id')))).toEqual(plans.medium);
 await dialog.getByRole('button',{name:'Hủy',exact:true}).click();await expect(dialog).not.toBeVisible();await expect(page.locator('.embark')).toBeFocused();
 await page.getByRole('button',{name:/Khó/}).click();await page.locator('.embark').click();await expect(rooms).toHaveCount(2);await expect(dialog).toContainText('ATK ×1,5');await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();
 await page.getByRole('button',{name:/Trung bình/}).click();await page.reload();await page.locator('.embark').click();await expect(rooms).toHaveCount(2);expect(await rooms.evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-encounter-id')))).toEqual(plans.medium);
 const departure=dialog.getByRole('button',{name:'Bắt đầu thám hiểm',exact:true});
 const footerVisible=async()=>departure.evaluate(node=>{const bounds=node.getBoundingClientRect();return bounds.top>=0&&bounds.bottom<=innerHeight&&bounds.left>=0&&bounds.right<=innerWidth;});
 expect(await footerVisible()).toBe(true);
 await page.screenshot({path:'test-results/dangerous-scouting-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);expect(await footerVisible()).toBe(true);
 await expect.poll(()=>dialog.locator('.modal-body').evaluate(node=>node.scrollHeight>node.clientHeight)).toBe(true);
 await dialog.locator('.modal-body').evaluate(node=>node.scrollTop=node.scrollHeight);expect(await footerVisible()).toBe(true);
 await page.screenshot({path:'test-results/dangerous-scouting-phone.png',fullPage:true});
 await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(page.locator('.embark')).toBeFocused();await expect(rooms).toHaveCount(0);
});

for(const[level,amount]of[['easy',1],['medium',3],['hard',5]]as const){
 test(`dangerous ${level} clears the scouted rooms, carries resources and grants ${amount} Pure Prisma only once`,async({page})=>{
  test.setTimeout(120000);await seed(page);await page.goto(`/dungeon/dangerous?selected=${level}`);
  await page.locator('.embark').click();await expect(page.locator('.dungeon-room-card')).toHaveCount(plans[level].length);await expect(page.getByRole('dialog')).toContainText('Phòng 1');await page.getByRole('dialog').getByRole('button',{name:'Bắt đầu thám hiểm',exact:true}).click();await expect(page).toHaveURL(/battle$/);
  const seen=new Set<number>();let blocked=false;
  for(let action=0;action<260;action++){
   await expect.poll(async()=>await page.locator('.command-panel h2').filter({hasText:/Hoàn thành thám hiểm|Chuyến đi đã kết thúc/}).count()>0||await page.locator('.execute').isEnabled()).toBe(true);
   if(await page.locator('.command-panel h2').filter({hasText:/Hoàn thành thám hiểm|Chuyến đi đã kết thúc/}).count())break;
   const room=Number(await page.locator('main').getAttribute('data-dungeon-wave'));seen.add(room);
   await expect(page.locator('.page-header')).toContainText(`Phòng ${room}/`);await expect(page.locator('.dungeon-wave-progress')).toContainText(`${amount} Pure Prisma`);
   await expect(page.locator('.page-header')).not.toContainText(content.encounters[plans[level][room-1]].name);
   if(room===1)await expect(page.locator('[data-actor-id=wave_1_enemy_0]')).toContainText('Tay sai vua chằn');else await expect(page.locator('[data-actor-id=wave_2_enemy_0]')).toContainText('Phi long bóng đêm');
   if(room>1){const state=await saved(page);expect(state.coins).toBe(0);expect(state.recruitmentShards).toBe(0);expect(state.dungeonDaily.day).toBeNull();const mp=await page.locator('[data-actor-id=lisbeth] .mp-bar').evaluate(node=>({value:(node as HTMLProgressElement).value,max:(node as HTMLProgressElement).max}));expect(mp.value).toBeLessThan(mp.max);}
   if(level==='medium'&&room>1&&!blocked){blocked=true;await page.evaluate(()=>{(window as any).__originalSave=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='northern-prisma.profiles.v1')throw new DOMException('Disk full','QuotaExceededError');return (window as any).__originalSave.call(this,key,value);};});}
   const name=await page.locator('.command-panel h2').textContent();const choices=name?.includes('Lisbeth')?['lisbeth.judgment','lisbeth.lance']:name?.includes('Elaine')?['elaine.sanctuary','elaine.shield']:name?.includes('Iris')?['iris.formula']:[];
   for(const id of choices){const skill=page.locator(`.skill-command[data-gamepad-skill="${id}"][aria-disabled=false]`);if(await skill.count()){await skill.click();break;}}
   await page.locator('.execute').click();
  }
  await expect(page.locator('.command-panel h2')).toContainText('Hoàn thành thám hiểm');expect(seen.size).toBe(plans[level].length);
  if(blocked){await expect(page.locator('.notice')).toContainText('Disk full');const before=await saved(page);expect(before.recruitmentShards).toBe(0);expect(before.dungeonDaily.day).toBeNull();await page.evaluate(()=>{Storage.prototype.setItem=(window as any).__originalSave;});await page.getByRole('button',{name:'Nhận thưởng chiến thắng'}).click();}
  await expect(page.locator('.battle-outcome')).toContainText(`+${amount} Pure Prisma đã lưu`);const state=await saved(page);expect(state.coins).toBe(0);expect(state.recruitmentShards).toBe(amount);expect(state.victories).toBe(1);expect(state.dungeonDaily.clears.dangerous).toBe(1);expect(state.claimedFirstClearRewards).toEqual([]);expect(state.characters.arthur.upgradeIds).toEqual([]);
  await page.screenshot({path:`test-results/dangerous-${level}-clear.png`,fullPage:true});await page.getByRole('link',{name:/Trở về chọn mức độ/}).click();await expect(page.locator('.page-header')).toContainText('0/1');
  for(const label of ['Dễ','Trung bình','Khó']){await page.locator('.dungeon-difficulty-list').getByRole('button',{name:new RegExp(label)}).click();await expect(page.locator('.embark')).toBeDisabled();}
  await page.reload();expect((await saved(page)).recruitmentShards).toBe(amount);await page.goto('/dungeon/gold_mine');await expect(page.locator('.page-header')).toContainText('3/3');
 });
}
