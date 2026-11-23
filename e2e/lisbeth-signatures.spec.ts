import {test,expect} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
const c:any=await loadContent();
test('both Lisbeth recipes/cards exist and the single signature slot can switch between owned items',async({page})=>{
 const s=createGameSave(c);s.unlockedCharacterIds.push('lisbeth');s.blueprints=20;
 for(const id of ['lisbeth.pride_staff','lisbeth.judgment_staff']){s.unlockedExclusiveRecipes.push(id);s.exclusiveGear.push({templateId:id,statKey:'maxMp',statValue:20});}
 s.equippedExclusiveGear.lisbeth='lisbeth.pride_staff';
 await page.addInitScript(raw=>{if(sessionStorage.getItem('lisbeth-signatures-fixture'))return;sessionStorage.setItem('lisbeth-signatures-fixture','1');localStorage.setItem('northern-prisma.campaign.v7',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));},encodeGameSave(s,c));
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/shop?tab=blueprints');await page.getByRole('textbox',{name:'Tìm công thức'}).fill('Lisbeth');await expect(page.locator('.blueprint-grid article')).toHaveCount(2);
 await page.goto('/blacksmith?tab=exclusive&character=lisbeth');await expect(page.locator('.exclusive-grid article')).toHaveCount(2);await expect(page.getByRole('heading',{name:'Quang Trượng Kiêu Hãnh',exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'Quang Trượng Phán Quyết',exact:true})).toBeVisible();
 await page.goto('/characters/lisbeth?tab=equipment');const slot=page.getByRole('region',{name:'Ô Trấn Phái riêng'});await expect(slot).toContainText('Quang Trượng Kiêu Hãnh');
 await slot.getByRole('button',{name:'Đổi Trấn Phái',exact:true}).click();const modal=page.getByRole('dialog');await expect(modal.locator('.exclusive-choice')).toHaveCount(2);await modal.locator('.exclusive-choice').filter({hasText:'Quang Trượng Phán Quyết'}).click();await modal.getByRole('button',{name:'Thay Trấn Phái',exact:true}).click();await expect(slot.getByRole('heading')).toHaveText('Quang Trượng Phán Quyết');
 await page.reload();await expect(slot.getByRole('heading')).toHaveText('Quang Trượng Phán Quyết');await page.setViewportSize({width:390,height:900});await slot.getByRole('button',{name:'Đổi Trấn Phái',exact:true}).click();await expect(modal.locator('.exclusive-choice')).toHaveCount(2);await modal.locator('.exclusive-choice').filter({hasText:'Quang Trượng Kiêu Hãnh'}).click();await modal.getByRole('button',{name:'Thay Trấn Phái',exact:true}).click();await expect(slot.getByRole('heading')).toHaveText('Quang Trượng Kiêu Hãnh');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);expect(errors).toEqual([]);
});
