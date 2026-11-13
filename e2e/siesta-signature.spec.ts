import {test,expect} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
const c:any=await loadContent();
test('Siesta recipe can be purchased, crafted and its equipped passive shows the correct starting pool',async({page})=>{
 const s=createGameSave(c);s.unlockedCharacterIds.push('siesta');Object.assign(s,{coins:100000,blueprints:20,prismaFragments:10000,recruitmentShards:100,originalPrisma:10});
 await page.addInitScript(raw=>{if(!localStorage.getItem('northern-prisma.campaign.v7'))localStorage.setItem('northern-prisma.campaign.v7',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));},encodeGameSave(s,c));
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/shop?tab=blueprints');await page.getByLabel('Tìm công thức').fill('Siesta');const card=page.locator('.blueprint-grid article');await expect(card).toHaveCount(1);await expect(card).toContainText('Nanh Rìu Bầy Sói');await expect(card).toContainText('150 ATK');
 await card.getByRole('button',{name:/Mở công thức/}).click();await page.getByRole('dialog').getByRole('button',{name:'Xác nhận · 10 Bản Thiết Kế'}).click();await card.getByRole('link').click();await page.locator('.exclusive-card').getByRole('button',{name:'Chế tạo',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Xác nhận chế tạo',exact:true}).click();
 const raw=await page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('northern-prisma.profiles.v1')!).entries[0].text));expect(raw.exclusiveGear.some((g:any)=>g.templateId==='siesta.signature')).toBe(true);
 // Use the same persisted campaign with the crafted item equipped for passive inspection.
 raw.equippedExclusiveGear.siesta='siesta.signature';await page.evaluate(text=>{localStorage.removeItem('northern-prisma.profiles.v1');localStorage.removeItem('northern-prisma.activeProfile.v1');localStorage.setItem('northern-prisma.campaign.v7',text);},encodeGameSave(raw,c));
 await page.goto('/characters/siesta?tab=skills');await expect(page.locator('.character-tab-panel')).toContainText('Bắt đầu trận: 3 Dã Tính');await expect(page.locator('.character-tab-panel')).toContainText('150 ATK căn bản');expect(errors).toEqual([]);
 await page.screenshot({path:'test-results/siesta-signature.png',fullPage:true});
});
