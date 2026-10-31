import {test,expect,type Page} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';import {createGameSave,encodeGameSave} from '../src/core/game-save.js';import {craftGear} from '../src/core/gear-forge.js';
const content:any=await loadContent();
async function seed(page:Page,{effect=false,gamepad=false,strong=false}={}){
 let c=createGameSave(content);Object.assign(c,{coins:200000,prismaFragments:10000,originalPrisma:10,recruitmentShards:50});c.gear=Array.from({length:30},(_,i)=>({id:'gear_'+(i+1),typeId:'t3_focused',stats:{attack:5}}));c.gacha.totalPulls=30;
 if(effect)c=craftGear(c,content,{materialId:'gear_1',effectId:'guardian_talisman',primaryStat:undefined});
 if(strong){c.party=['arthur',null,null,null];c.partyPresets[0].slots=[...c.party];c.extraGearSlots.arthur=3;c.equipment.arthur=c.gear.slice(0,6).map((g:any)=>g.id);}
 await page.addInitScript(({raw,gamepad})=>{if(!localStorage.getItem('northern-prisma.campaign.v6'))localStorage.setItem('northern-prisma.campaign.v6',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:gamepad?'gamepad':'mouse'}));localStorage.setItem('northern-prisma.combat.speed','fast');
  (window as any).__pad={id:'Xbox T4 Test',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};(window as any).__samples=0;
  Object.defineProperty(navigator,'getGamepads',{value:()=>{(window as any).__samples++;return[(window as any).__pad];}});
 },{raw:encodeGameSave(c,content),gamepad});await page.emulateMedia({reducedMotion:'reduce'});
}
const state=(page:Page)=>page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('northern-prisma.profiles.v1')!).entries[0].text));
async function press(page:Page,index:number){await page.waitForTimeout(80);const n=await page.evaluate(()=>(window as any).__samples);await page.evaluate(i=>(window as any).__pad.buttons[i].pressed=true,index);await expect.poll(()=>page.evaluate(()=>(window as any).__samples)).toBeGreaterThan(n+2);await page.evaluate(i=>(window as any).__pad.buttons[i].pressed=false,index);await page.waitForTimeout(80);}

test('four forge tabs craft a T4 stat item, then save both paid reforge choices across reload without altering its main stat',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page);await page.goto('/blacksmith?tab=stats');await expect(page.locator('.blacksmith-tabs button')).toHaveCount(4);
 await page.getByRole('combobox',{name:'Dòng chính',exact:true}).selectOption('attack');await page.getByRole('button',{name:'Chọn nguyên liệu Gear T3',exact:true}).click();await expect(page.getByRole('dialog').locator('.gear-card')).toHaveCount(12);await page.getByRole('dialog').locator('.gear-card').first().click();
 await page.getByRole('button',{name:'Rèn Gear Siêu Cấp',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('1.200');await page.getByRole('button',{name:'Xác nhận chế tạo',exact:true}).click();await expect(page.locator('.t4-owned .gear-card')).toHaveCount(1);await expect(page.locator('.t4-owned .gear-affixes')).toContainText('Dòng chính: ATK +5');
 const made=await state(page);expect(made.coins).toBe(192000);expect(made.prismaFragments).toBe(8800);expect(made.gear.at(-1).typeId).toBe('t4_stats');
 await page.getByRole('button',{name:'Tái rèn dòng phụ',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Dòng chính cố định');const rolled=await state(page);expect(rolled.coins).toBe(189500);expect(rolled.prismaFragments).toBe(8350);expect(rolled.pendingGearReforge).not.toBeNull();
 await page.reload();await expect(page.getByRole('dialog')).toContainText('Chọn dòng phụ');const reloaded=await state(page);expect(reloaded.pendingGearReforge).toEqual(rolled.pendingGearReforge);await page.getByRole('button',{name:'Giữ dòng cũ',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);const kept=await state(page);expect(kept.coins).toBe(rolled.coins);expect(kept.gear.at(-1)).toEqual(made.gear.at(-1));expect(kept.pendingGearReforge).toBeNull();
 expect(errors).toEqual([]);await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:'test-results/t4-forge-phone.png',fullPage:true});
});

test('an effect item equips in a normal slot, shows its identity, and grants the wearer a ward at combat start',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page,{effect:true});await page.goto('/characters/arthur/equipment?tier=t4_effect');await expect(page.locator('.gear-card')).toHaveCount(1);await expect(page.locator('.gear-card')).toContainText('Bùa Hộ Vệ');await page.locator('.gear-card').click();await page.getByRole('button',{name:'Trang bị vào ô này',exact:true}).click();await expect(page.locator('.equipment-slots button').first()).toContainText('Bùa Hộ Vệ');
 const c=await state(page);expect(c.equipment.arthur[0]).toBe('rune_1');expect(c.gear.find((g:any)=>g.id==='rune_1').stats).toEqual({});
 await page.goto('/quests?selected=forest_patrol');await page.getByRole('button',{name:/Xuất chiến/}).click();const dialog=page.getByRole('dialog');if(await dialog.count())await dialog.getByRole('button',{name:'Xuất chiến',exact:true}).click();await expect(page.locator('[data-actor-id=arthur]')).toContainText('Hộ ấn');await expect(page.locator('.battle-log')).toContainText('Bùa Hộ Vệ');expect(errors).toEqual([]);
});

test('LT/RT paginate inventory and equipment; filters reset the page and mobile shows six cards',async({page})=>{
 await seed(page,{gamepad:true});await page.goto('/inventory');await expect(page.locator('.gear-card')).toHaveCount(12);await expect(page.locator('.gamepad-guide')).toContainText('LT / RT');await expect.poll(()=>page.evaluate(()=>(window as any).__samples)).toBeGreaterThan(4);
 await press(page,7);await expect(page.locator('.gear-pagination')).toContainText('Trang 2 / 3');await press(page,6);await expect(page.locator('.gear-pagination')).toContainText('Trang 1 / 3');await press(page,7);await page.getByRole('combobox',{name:'Chỉ số',exact:true}).selectOption('magic');await expect(page.locator('.gear-pagination')).toContainText('Trang 1 / 1');
 await page.goto('/characters/arthur/equipment');await expect(page.locator('.gear-card')).toHaveCount(12);await press(page,7);await expect(page.locator('.gear-pagination')).toContainText('Trang 2 / 3');
 await page.setViewportSize({width:390,height:844});await page.goto('/inventory');await expect(page.locator('.gear-card')).toHaveCount(6);await expect(page.locator('.gear-pagination')).toContainText('Trang 1 / 5');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('effect recipes show locked special formula and updated Trấn Phái cost',async({page})=>{
 await seed(page);await page.goto('/blacksmith?tab=effects');await expect(page.locator('.t4-recipe')).toHaveCount(12);await page.getByRole('button',{name:/Kính Săn Điểm Yếu/}).click();await expect(page.locator('.t4-forge-form')).toContainText('3.200');await expect(page.getByRole('button',{name:'Rèn Gear Siêu Cấp',exact:true})).toBeDisabled();await expect(page.getByRole('link',{name:/Hoàn thành vĩ thanh Arthur để mở công thức/ })).toHaveAttribute('href','/stories/epilogue');await page.getByRole('button',{name:'Trấn Phái',exact:true}).click();await page.locator('.forge-policy summary').click();await expect(page.locator('.forge-cost')).toContainText('2.400');
});

for(const roll of [0,.99])test(`Quest victory shows and saves the ${roll===0?'Coin':'fragment'} branch while retaining first-clear rewards`,async({page})=>{
 await seed(page,{strong:true});await page.addInitScript(n=>Math.random=()=>n,roll);await page.goto('/quests?selected=goblin_forest_ambush');await expect(page.locator('.quest-rewards')).toContainText('5 Vụn Prisma');await page.getByRole('button',{name:/Xuất chiến/}).click();const modal=page.getByRole('dialog');if(await modal.count())await modal.getByRole('button',{name:'Xuất chiến',exact:true}).click();
 for(let i=0;i<2;i++){await expect(page.locator('.execute')).toBeEnabled();await page.locator('[data-gamepad-skill="$attack"]').click();await page.keyboard.press('Escape');await page.locator('.execute').click();}
 await expect(page.locator('.battle-outcome')).toContainText(roll===0?'50 Coin đã lưu':'5 Vụn Prisma đã lưu');const c=await state(page);expect(c.coins).toBe(200000+(roll===0?50:0));expect(c.prismaFragments).toBe(10000+(roll===0?0:5));expect(c.unlockedCharacterIds).toContain('kai');expect(c.dailyCommissions.questClears).toBe(1);
});
