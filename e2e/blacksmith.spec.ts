import { test,expect,type Page } from '@playwright/test';
import { loadContent } from '../scripts/load-content.mjs';
import { createGameSave,encodeGameSave } from '../src/core/game-save.js';
const content:any=await loadContent();
async function seed(page:Page,count=6,legacy=false){
 const save=createGameSave(content);Object.assign(save,{coins:20000,prisma:2,prismaFragments:120,originalPrisma:4,recruitmentShards:10});
 save.gear=Array.from({length:count},(_,i)=>{const typeId=count===6?['t1','t2','t3_focused','t3_dual','t1','t1'][i]:'t1';return{id:`gear_${i+1}`,typeId,stats:typeId==='t3_dual'?{attack:2,magic:2}:{attack:typeId==='t1'?1:typeId==='t2'?3:5}};});save.gacha.totalPulls=count;save.equipment.arthur=['gear_1',null,null];
 if(count===6)save.gacha.lastSummon={id:'summon_6',bannerId:'standard',results:[{kind:'gear',gear:structuredClone(save.gear[5])}]};
 const data=JSON.parse(encodeGameSave(save,content));if(legacy){data.version=4;for(const key of ['prismaFragments','originalPrisma','exclusiveGear','equippedExclusiveGear','pendingReforge','blacksmithRevision'])delete data[key];}
 await page.addInitScript(raw=>{if(!localStorage.getItem('northern-prisma.campaign.v4'))localStorage.setItem('northern-prisma.campaign.v4',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({controlMode:'mouse',musicEnabled:false,musicVolume:.35}));},JSON.stringify(data));
 await page.emulateMedia({reducedMotion:'reduce'});
}
const state=(page:Page)=>page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('northern-prisma.profiles.v1')!).entries[0].text));

test('Thợ Rèn has warm SVG, 60/40 layout, four tabs, known costs and 17 authored exclusive templates; phone fits',async({page,request})=>{
 await seed(page);await page.goto('/home');await page.locator('.home-menu-link[href="/blacksmith"]').click();await expect(page).toHaveURL(/blacksmith$/);
 await expect(page.locator('.shop-scene img')).toHaveAttribute('src','/art/blacksmith.svg');const response=await request.get('/art/blacksmith.svg');expect(response.ok()).toBe(true);expect(await response.text()).not.toContain('base64');
 await expect(page.locator('.forge-wallet')).toContainText('120');await expect(page.locator('.forge-wallet [data-currency=original]')).toContainText('4');
 const stock=await page.locator('.shop-stock').boundingBox(),keeper=await page.locator('.shop-keeper').boundingBox();expect(stock!.x+stock!.width).toBeLessThan(keeper!.x);expect(stock!.width/(stock!.width+keeper!.width)).toBeCloseTo(.6,1);
 await page.screenshot({path:'test-results/blacksmith-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'Trấn Phái',exact:true}).click();await expect(page.locator('.blacksmith-tabs button')).toHaveCount(4);await expect(page.locator('.exclusive-card')).toHaveCount(17);await expect(page.locator('.exclusive-card')).toHaveCount(17);
 await page.locator('.forge-policy summary').click();await expect(page.locator('.forge-cost')).toContainText('10.000');await expect(page.locator('.forge-cost')).toContainText('2.400');await expect(page.locator('.forge-policy .forge-roll-ranges')).toContainText('HP +25–50');await expect(page.locator('.forge-policy')).toContainText('Mặc định thử nghiệm');
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:'test-results/blacksmith-phone.png',fullPage:true});
 await page.goto('/dungeon');await expect(page.locator('.dungeon-choice')).toHaveCount(2);await expect(page.locator('main')).not.toContainText('ảo ảnh');
});
test('dismantle confirms 1–99 unequipped items, cancels safely, rolls back disk errors and preserves summon history',async({page})=>{
 await seed(page);await page.goto('/blacksmith');await expect(page.locator('.gear-card')).toHaveCount(5);await expect(page.getByRole('combobox',{name:'Trạng thái',exact:true})).toHaveCount(0);
 for(const id of [2,3,6])await page.getByRole('button',{name:new RegExp(`Chưa trang bị · #${id} `)}).click();
 await expect(page.locator('.forge-selection')).toContainText('Đã chọn 3/99');await expect(page.locator('.forge-selection [data-currency=fragments]')).toContainText('60');
 await page.getByRole('button',{name:'Phân rã (3)',exact:true}).click();const dialog=page.getByRole('dialog');await expect(dialog).toContainText('3 trang bị');await expect(dialog).toContainText('120 → 180');await expect(dialog.getByRole('button',{name:'Hủy',exact:true})).toBeFocused();
 await dialog.getByRole('button',{name:'Hủy',exact:true}).click();expect((await state(page)).gear).toHaveLength(6);expect((await state(page)).prismaFragments).toBe(120);
 await page.getByRole('button',{name:'Phân rã (3)',exact:true}).click();await page.evaluate(()=>{(window as any).__setItem=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='northern-prisma.profiles.v1')throw new DOMException('Disk full','QuotaExceededError');return(window as any).__setItem.call(this,key,value);};});
 await dialog.getByRole('button',{name:'Xác nhận phân rã',exact:true}).click();await expect(page.locator('.notice')).toContainText('Disk full');await expect(dialog).toBeVisible();expect((await state(page)).gear).toHaveLength(6);expect((await state(page)).prismaFragments).toBe(120);
 await page.evaluate(()=>Storage.prototype.setItem=(window as any).__setItem);await dialog.getByRole('button',{name:'Xác nhận phân rã',exact:true}).dblclick();await expect(dialog).toHaveCount(0);
 const after=await state(page);expect(after.version).toBe(6);expect(after.gear).toHaveLength(3);expect(after.prismaFragments).toBe(180);expect(after.gacha.totalPulls).toBe(6);expect(after.gacha.lastSummon.results[0].dismantled).toBe(true);expect(after.equipment.arthur[0]).toBe('gear_1');
 await page.reload();await expect(page.locator('.gear-card')).toHaveCount(2);await page.goto('/recruitment/results');await expect(page.locator('main')).toContainText('Đã phân rã');expect((await state(page)).gear).toHaveLength(3);
});
test('select visible caps at 99; filtering clears hidden selections; one-piece confirm cancels without spending',async({page})=>{
 await seed(page,101);await page.goto('/blacksmith');await expect(page.locator('.gear-card')).toHaveCount(12);await page.getByRole('button',{name:'Chọn các món đang hiển thị'}).click();await expect(page.locator('.forge-selection')).toContainText('12/99');await expect(page.getByRole('button',{name:'Trang sau'})).toBeEnabled();
 await page.getByRole('combobox',{name:'Chỉ số',exact:true}).selectOption('magic');await expect(page.locator('.forge-selection')).toContainText('0/99');await expect(page.getByRole('button',{name:'Phân rã (0)',exact:true})).toBeDisabled();
 await page.getByRole('combobox',{name:'Chỉ số',exact:true}).selectOption('attack');await page.locator('.gear-card').first().click();await page.getByRole('button',{name:'Phân rã (1)',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('1 trang bị');await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);expect((await state(page)).gear).toHaveLength(101);
});
test('old v4 profile retains gear/presets; item grid has five resources including zero balances and separate exclusive slot',async({page})=>{
 await seed(page,6,true);await page.goto('/inventory?tab=items');await expect(page.locator('.resource-card')).toHaveCount(5);await expect(page.locator('[data-item=original] .currency-amount')).toContainText('0');await expect(page.locator('[data-item=fragments] .currency-amount')).toContainText('0');await expect(page.locator('[data-item=original] svg linearGradient')).toHaveCount(2);
 await page.getByRole('button',{name:'Trang bị',exact:true}).click();await expect(page.locator('.gear-card')).toHaveCount(6);await page.goto('/characters/arthur/equipment');await expect(page.locator('.equipment-slots button')).toHaveCount(6);await expect(page.getByRole('region',{name:'Ô Trấn Phái riêng'})).toContainText('không chiếm 3–6 ô');
 await page.setViewportSize({width:390,height:844});await page.goto('/inventory?tab=items');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:'test-results/inventory-items-phone.png',fullPage:true});
});
