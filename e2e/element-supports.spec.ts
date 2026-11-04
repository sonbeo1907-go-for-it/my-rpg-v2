import {test,expect,type Page} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
const content:any=await loadContent();
async function seed(page:Page){const c=createGameSave(content);c.unlockedCharacterIds=Object.keys(content.characters);c.party=['ember','freya','myonne','fiona'];c.partyPresets[0].slots=[...c.party];await page.addInitScript(raw=>{localStorage.setItem('northern-prisma.campaign.v7',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));localStorage.setItem('northern-prisma.combat.speed','fast');},encodeGameSave(c,content));await page.emulateMedia({reducedMotion:'reduce'});}
test('element supports expose localized kit/filters and fit phone screens',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page);
 for(const [id,passive,skill,scope]of [['ember','Ơ, Nó Cháy Tiếp Kìa!','Lần Này Chắc Chắn Thành Công!','Chỉ đồng đội hệ Hỏa'],['myonne','Khách Quen Được Hoàn Phí','Ưu Đãi Dành Riêng Cho Ngài','Chỉ đồng đội hệ Ám']]){
  await page.goto('/characters/'+id);await expect(page.locator('.passive-copy')).toContainText(passive);if(id==='myonne')await expect(page.locator('.character-overview')).toContainText('Hội Thương Nhân Drageshelmfjall');
  await page.locator('.character-tabs [data-tab-id=skills]').click();await expect(page.locator('.skill-card').filter({hasText:skill})).toContainText(scope);
  await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:'test-results/'+id+'-skills-mobile.png',fullPage:true});
 }
 expect(errors).toEqual([]);
});
test('combat allows Fire-only recipients then Dark-only recipients and applies the selected buffs',async({page})=>{
 await seed(page);await page.goto('/quests?selected=forest_patrol&difficulty=very_easy');await page.getByRole('button',{name:/^Xuất chiến/}).click();await expect(page).toHaveURL(/battle$/);
 await page.locator('[data-gamepad-skill="ember.cheer"]').click();
 for(const id of ['ember','freya'])await expect(page.locator(`[data-gamepad-target="${id}"]`)).toHaveAttribute('data-gamepad-legal','true');for(const id of ['myonne','fiona'])await expect(page.locator(`[data-gamepad-target="${id}"]`)).toHaveAttribute('data-gamepad-legal','false');
 await page.locator('.execute').click();await expect(page.locator('[data-actor-id=freya]')).toContainText('Lần Này Chắc Chắn Thành Công!');await expect(page.locator('[data-gamepad-skill="myonne.offer"]')).toBeVisible();await page.locator('[data-gamepad-skill="myonne.offer"]').click();
 await expect(page.locator('[data-gamepad-target=fiona]')).toHaveAttribute('data-gamepad-legal','true');await expect(page.locator('[data-gamepad-target=freya]')).toHaveAttribute('data-gamepad-legal','false');await page.locator('[data-gamepad-target=fiona]').click();await page.locator('.execute').click();await expect(page.locator('[data-actor-id=fiona]')).toContainText('Ưu Đãi Riêng');
 await page.screenshot({path:'test-results/element-supports-combat.png',fullPage:true});
});
