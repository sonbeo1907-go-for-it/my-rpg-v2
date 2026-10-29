import { test, expect, type Page } from '@playwright/test';
import { loadContent } from '../scripts/load-content.mjs';
import { createGameSave, encodeGameSave } from '../src/core/game-save.js';
import { completeStoryEvent } from '../src/core/story-events.js';
import { SINISTER_UNLOCK_FLAG } from '../src/core/quest-catalog.js';
const content:any=await loadContent();
async function seed(page:Page,unlocked=false,gamepad=false){
 const save=createGameSave(content);if(unlocked)completeStoryEvent(save,content,SINISTER_UNLOCK_FLAG);
 await page.addInitScript(({raw,gamepad})=>{
  if(!localStorage.getItem('northern-prisma.campaign.v4'))localStorage.setItem('northern-prisma.campaign.v4',raw);
  sessionStorage.setItem('northern-prisma.entered','1');
  localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({controlMode:gamepad?'gamepad':'mouse',musicEnabled:false,musicVolume:.35,rumble:false,showHints:true}));
  if(gamepad){(window as any).__pad={id:'Xbox Standard Test Controller',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[(window as any).__pad]});}
 },{raw:encodeGameSave(save,content),gamepad});
 await page.emulateMedia({reducedMotion:'reduce'});
}
const rewards=(page:Page)=>page.locator('.quest-card').evaluateAll(nodes=>nodes.map(node=>Number(node.getAttribute('data-coin-reward'))));

test('Thảo phạt defaults to 50 then 150 Coin, preserves tab selection/filter and places switch inside the illustration',async({page,request})=>{
 await seed(page);await page.goto('/quests');
 const coins=await rewards(page);expect(coins.length).toBe(26);expect([...new Set(coins)]).toEqual([50,150]);expect(coins).toEqual([...coins].sort((a,b)=>a-b));
 await expect(page.locator('.quest-card').first()).toContainText('Quỷ lùn tập kích trong rừng');
 const art=await page.locator('.quest-illustration').boundingBox(),tabs=await page.locator('.quest-category-tabs').boundingBox();expect(tabs!.x).toBeGreaterThan(art!.x);expect(tabs!.y-art!.y).toBeLessThan(80);
 for(const name of ['quest-extermination.svg','quest-sinister.svg']){const response=await request.get(`/art/${name}`);expect(response.ok()).toBe(true);expect(await response.text()).toContain('<svg');}
 await page.getByRole('combobox',{name:'Loại nhiệm vụ',exact:true}).selectOption('boss');await expect(page.locator('.quest-card')).toHaveCount(15);expect(new Set(await rewards(page))).toEqual(new Set([150]));
 await page.getByRole('combobox',{name:'Loại nhiệm vụ',exact:true}).selectOption('normal');await page.locator('[data-encounter-id=boar_field]').click();
 await page.getByRole('button',{name:'Hiểm Ác',exact:true}).click();await expect(page.locator('.quest-locked')).toBeVisible();
 await page.getByRole('button',{name:'Thảo phạt',exact:true}).click();await expect(page.getByRole('combobox',{name:'Loại nhiệm vụ',exact:true})).toHaveValue('normal');await expect(page.locator('.quest-card.selected')).toContainText('Lợn rừng phá ruộng');
 await page.screenshot({path:'test-results/quest-extermination-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:'test-results/quest-extermination-phone.png',fullPage:true});
 await page.reload();await expect(page.locator('.quest-card.selected')).toContainText('Lợn rừng phá ruộng');
});
test('locked Hiểm Ác never reveals boss names/stats/reward or a departure button, including forged/legacy query filters',async({page})=>{
 await seed(page);
 for(const query of ['tab=sinister&selected=alice_superboss&q=Alice','type=super&selected=miraebolis_superboss','tab=extermination&selected=alice_superboss']){
  await page.goto(`/quests?${query}`);await expect(page.locator('.quest-category-tabs')).toBeVisible();await expect(page.locator('main')).not.toContainText('Alice');await expect(page.locator('main')).not.toContainText('Miraebolis');
  if(!query.includes('extermination')){await expect(page.locator('.quest-locked')).toContainText('Hầm Ngục Ảo Ảnh');await expect(page.locator('.quest-card,.quest-enemies,.embark,.quest-rewards')).toHaveCount(0);}
 }
 await page.getByRole('button',{name:'Hiểm Ác',exact:true}).click();await expect(page.getByRole('button',{name:'Hiểm Ác',exact:true})).toHaveAttribute('aria-current','page');await expect(page.locator('.quest-background')).toHaveCSS('background-image',/quest-sinister.svg/);await page.screenshot({path:'test-results/quest-sinister-locked-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:'test-results/quest-sinister-locked-phone.png',fullPage:true});
 await page.getByRole('link',{name:/Đến Hầm Ngục Ảo Ảnh/}).click();await expect(page).toHaveURL(/dungeon\/illusion$/);
});
test('persisted illusion flag reveals 1000 Coin quests, supports scoped search and starts the selected super boss',async({page})=>{
 await seed(page,true);await page.goto('/quests?tab=sinister');await expect(page.locator('.quest-card')).toHaveCount(2);expect(await rewards(page)).toEqual([1000,1000]);await expect(page.locator('.quest-locked')).toHaveCount(0);
 await expect(page.locator('.quest-background')).toHaveCSS('background-image',/quest-sinister.svg/);
 await page.screenshot({path:'test-results/quest-sinister-unlocked-desktop.png',fullPage:true});
 await page.getByLabel('Tìm nhiệm vụ',{exact:true}).fill('Miraebolis');await expect(page.locator('.quest-card')).toHaveCount(1);await expect(page.locator('.quest-illustration h2')).toContainText('Miraebolis');
 await page.reload();await expect(page.locator('.quest-card')).toHaveCount(1);await page.getByRole('button',{name:/Xuất chiến/}).click();await expect(page).toHaveURL(/battle$/);await expect(page.locator('[data-actor-id=enemy_0]')).toContainText('Miraebolis');
});
test('Xbox LB/RB switches quest categories while locked, without revealing hidden quests',async({page})=>{
 await seed(page,false,true);await page.goto('/quests');await expect(page.locator('.quest-card')).toHaveCount(26);
 const press=async(index:number)=>{await page.waitForTimeout(100);await page.evaluate(i=>(window as any).__pad.buttons[i].pressed=true,index);await page.waitForTimeout(120);await page.evaluate(i=>(window as any).__pad.buttons[i].pressed=false,index);await page.waitForTimeout(120);};
 await press(5);await expect(page.getByRole('button',{name:'Hiểm Ác',exact:true})).toHaveAttribute('aria-current','page');await expect(page.locator('.quest-locked')).toBeVisible();await expect(page.locator('.quest-card')).toHaveCount(0);
 await press(4);await expect(page.getByRole('button',{name:'Thảo phạt',exact:true})).toHaveAttribute('aria-current','page');await expect(page.locator('.quest-card')).toHaveCount(26);
});
