import {test,expect,type Page} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
import {craftGear} from '../src/core/gear-forge.js';
const content:any=await loadContent();
async function seed(page:Page,{unlocked=true,bulk=false}={}){
 let c=createGameSave(content);Object.assign(c,{coins:200000,prismaFragments:10000});
 c.gear=Array.from({length:bulk?1005:30},(_,i)=>({id:'gear_'+(i+1),typeId:bulk?'t1':'t3_focused',stats:{attack:bulk?1:5}}));c.gacha.totalPulls=c.gear.length;
 if(unlocked)c.claimedFirstClearRewards.push('east_ke_08');
 if(bulk)c.equipment.arthur=['gear_1',null,null];else c=craftGear(c,content,{materialId:'gear_30',primaryStat:'attack'},()=>2/7);
 await page.addInitScript(raw=>{if(!localStorage.getItem('northern-prisma.campaign.v6'))localStorage.setItem('northern-prisma.campaign.v6',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false}));},encodeGameSave(c,content));
}
const state=(page:Page)=>page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('northern-prisma.profiles.v1')!).entries[0].text));
async function openReforge(page:Page){await page.goto('/blacksmith?tab=stats');await page.getByRole('button',{name:'Tái rèn trang bị',exact:true}).click();await page.getByRole('button',{name:'Tái rèn dòng phụ',exact:true}).click();}

test('locked advanced option stays visible and regular reforge remains usable',async({page})=>{
 await seed(page,{unlocked:false});await openReforge(page);await expect(page.getByRole('button',{name:'Tái rèn nâng cao · Chưa mở',exact:true})).toBeDisabled();await expect(page.getByRole('dialog')).toContainText('Hạ Yamata no Orochi');
 await page.getByRole('button',{name:'Xác nhận tái rèn',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Chọn dòng phụ');await page.getByRole('button',{name:'Giữ dòng cũ',exact:true}).click();expect((await state(page)).pendingGearReforge).toBeNull();
});
test('advanced workbench previews exact odds, consumes 20 across pages and persists result after reload',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page);await openReforge(page);
 await page.getByRole('button',{name:'Tái rèn nâng cao',exact:true}).click();await page.getByRole('combobox',{name:'Dòng phụ mong muốn',exact:true}).selectOption('magic');await page.getByRole('spinbutton',{name:'Số nguyên liệu chọn nhanh'}).fill('1');await page.getByRole('button',{name:'Chọn nhanh',exact:true}).click();await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow','18.6');
 await page.getByRole('spinbutton',{name:'Số nguyên liệu chọn nhanh'}).fill('20');await page.getByRole('button',{name:'Chọn nhanh',exact:true}).click();await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow','100');
 await page.getByRole('button',{name:'Tự chọn T3 (20/20)',exact:true}).click();const picker=page.getByRole('dialog',{name:'Chọn T3 cho tái rèn nâng cao',exact:true});await expect(picker.locator('.gear-card[aria-pressed=true]')).toHaveCount(12);await picker.getByRole('button',{name:'Trang sau',exact:true}).click();await expect(picker.locator('.gear-card[aria-pressed=true]')).toHaveCount(8);await page.getByRole('button',{name:'Dùng các nguyên liệu đã chọn',exact:true}).click();
 await page.screenshot({path:'.taste-skill/forge-qol/advanced-1440.png',fullPage:true});
 await page.setViewportSize({width:768,height:1024});await page.screenshot({path:'.taste-skill/forge-qol/advanced-768.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'.taste-skill/forge-qol/advanced-390.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.getByRole('button',{name:'Xác nhận tái rèn',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Đã dùng thêm 20 trang bị T3');const n=await state(page);expect(n.gear).toHaveLength(10);expect(n.pendingGearReforge.nextSecondaryStat).toBe('magic');expect(n.coins).toBe(189500);
 await page.reload();await expect(page.getByRole('dialog')).toContainText('Đã dùng thêm 20 trang bị T3');await page.getByRole('button',{name:'Nhận dòng mới',exact:true}).click();const result=await state(page);expect(result.pendingGearReforge).toBeNull();expect(result.gear.find((g:any)=>g.id==='rune_1').stats).toEqual({attack:5,magic:3});expect(errors).toEqual([]);
});
test('bulk dismantle selects 999 from every page, keeps equipped gear, and confirms the exact yield',async({page})=>{
 await seed(page,{bulk:true});await page.goto('/blacksmith');await page.getByRole('button',{name:'Chọn theo bộ lọc (999)',exact:true}).click();await expect(page.locator('.forge-selection')).toContainText('Đã chọn 999/999');await expect(page.locator('.forge-selection')).toContainText('4.995');await page.getByRole('button',{name:'Trang sau',exact:true}).click();await expect(page.locator('.forge-selection')).toContainText('Đã chọn 999/999');
 await page.getByRole('combobox',{name:'Thứ tự',exact:true}).selectOption('asc');await expect(page.locator('.forge-selection')).toContainText('Đã chọn 999/999');
 await page.screenshot({path:'.taste-skill/forge-qol/dismantle-1440.png',fullPage:true});
 await page.getByRole('button',{name:'Phân rã (999)',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('999 trang bị');await expect(page.getByRole('dialog')).toContainText('4.995');await page.getByRole('button',{name:'Xác nhận phân rã',exact:true}).click();await expect(page.locator('.forge-inline-result')).toContainText('999 món');
 const n=await state(page);expect(n.gear).toHaveLength(6);expect(n.gear.some((g:any)=>g.id==='gear_1')).toBe(true);expect(n.prismaFragments).toBe(14995);await page.reload();expect((await state(page)).gear).toHaveLength(6);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'.taste-skill/forge-qol/dismantle-390.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('controller triggers paginate the T3 picker and B closes the picker before the workbench',async({page})=>{
 await seed(page);await page.addInitScript(()=>{localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'gamepad'}));(window as any).__pad={id:'Xbox Forge QoL',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};(window as any).__samples=0;Object.defineProperty(navigator,'getGamepads',{value:()=>{(window as any).__samples++;return[(window as any).__pad];}});});
 await openReforge(page);await page.getByRole('button',{name:'Tái rèn nâng cao',exact:true}).click();await page.getByRole('button',{name:'Chọn nhanh',exact:true}).click();await page.getByRole('button',{name:'Tự chọn T3 (20/20)',exact:true}).click();
 async function press(index:number){await page.waitForTimeout(100);const samples=await page.evaluate(()=>(window as any).__samples);await page.evaluate(i=>(window as any).__pad.buttons[i].pressed=true,index);await expect.poll(()=>page.evaluate(()=>(window as any).__samples)).toBeGreaterThan(samples+3);await page.evaluate(i=>(window as any).__pad.buttons[i].pressed=false,index);await page.waitForTimeout(100);}
 const picker=page.getByRole('dialog',{name:'Chọn T3 cho tái rèn nâng cao',exact:true});await expect.poll(()=>page.evaluate(()=>(window as any).__samples)).toBeGreaterThan(5);await press(7);await expect(picker.locator('.gear-pagination')).toContainText('Trang 2 / 3');await press(1);await expect(picker).toHaveCount(0);await expect(page.getByRole('dialog',{name:'Chuẩn bị tái rèn',exact:true})).toBeVisible();await press(1);await expect(page.getByRole('dialog')).toHaveCount(0);expect((await state(page)).pendingGearReforge).toBeNull();
});

test('failed persistence keeps inventory and currency; retry reuses the same advanced roll',async({page})=>{
 await seed(page);await page.addInitScript(()=>{const put=Storage.prototype.setItem;(window as any).__denyForge=false;(window as any).__rejectedForge=0;Storage.prototype.setItem=function(k,v){if(k==='northern-prisma.profiles.v1'&&(window as any).__denyForge){(window as any).__rejectedForge++;throw new DOMException('Kiểm thử lỗi ghi','QuotaExceededError');}return put.call(this,k,v);};});
 await openReforge(page);await page.getByRole('button',{name:'Tái rèn nâng cao',exact:true}).click();await page.getByRole('spinbutton',{name:'Số nguyên liệu chọn nhanh'}).fill('1');await page.getByRole('button',{name:'Chọn nhanh',exact:true}).click();const before=await state(page);await page.evaluate(()=>{(window as any).__denyForge=true;Math.random=()=>.01;});await page.getByRole('button',{name:'Xác nhận tái rèn',exact:true}).click();await expect.poll(()=>page.evaluate(()=>(window as any).__rejectedForge)).toBeGreaterThan(0);await expect(page.getByRole('button',{name:'Xác nhận tái rèn',exact:true})).toBeEnabled();expect((await state(page)).coins).toBe(before.coins);expect((await state(page)).gear).toHaveLength(before.gear.length);expect((await state(page)).pendingGearReforge).toBeNull();
 await page.evaluate(()=>{(window as any).__denyForge=false;Math.random=()=>.99;});await page.getByRole('button',{name:'Xác nhận tái rèn',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Chọn dòng phụ');const after=await state(page);expect(after.pendingGearReforge.nextSecondaryStat).toBe('magic');expect(after.coins).toBe(before.coins-2500);expect(after.gear).toHaveLength(before.gear.length-1);
});
