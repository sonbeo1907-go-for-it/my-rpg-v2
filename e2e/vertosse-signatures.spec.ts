import {test,expect,type Page} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
import {exclusiveRollRange} from '../src/core/blacksmith-rules.js';
const c:any=await loadContent(),ids=['selene.signature','simon.signature','genevieve.signature'];
async function seed(page:Page,equip=true){
 const s=createGameSave(c);s.party=['selene','simon','genevieve','arthur'];s.partyPresets[0].slots=[...s.party];s.unlockedCharacterIds=[...new Set([...s.unlockedCharacterIds,...s.party])];s.blueprints=30;
 if(equip)for(const id of ids){s.unlockedExclusiveRecipes.push(id);s.exclusiveGear.push({templateId:id,statKey:'maxMp',statValue:exclusiveRollRange(c,'maxMp').min});s.equippedExclusiveGear[c.exclusiveGear[id].characterId]=id;}
 await page.addInitScript(raw=>{if(!localStorage.getItem('northern-prisma.campaign.v7'))localStorage.setItem('northern-prisma.campaign.v7',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));},encodeGameSave(s,c));await page.emulateMedia({reducedMotion:'reduce'});
}
test('equipped Vertosse descriptions match effective signatures on desktop and mobile',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page);
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:960});
  await page.goto('/characters/simon?tab=skills');await expect(page.locator('main')).toContainText('3 Sơ Hở Thủy');
  await page.goto('/characters/selene?tab=skills');await expect(page.locator('main')).toContainText('+18 ATK căn bản');
  await page.goto('/characters/genevieve/equipment');await expect(page.locator('[data-tab-id="equipment"]')).toHaveAttribute('aria-current','page');await expect(page.locator('.exclusive-passive')).toContainText('Đầu vòng, tạo 1 Bằng Chứng');await expect(page.locator('.exclusive-passive')).toContainText('6 DEF, RES căn bản');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:`test-results/vertosse-signatures-${width}.png`,fullPage:true});
 }expect(errors).toEqual([]);
});
test('all three new Blueprint recipes are searchable and confirmation explains their cost and effect',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page,false);await page.goto('/shop?tab=blueprints');
 for(const id of ids){const recipe=c.exclusiveGear[id];await page.getByLabel('Tìm công thức').fill(recipe.name);const card=page.locator('.blueprint-grid .exclusive-card');await expect(card).toHaveCount(1);await expect(card).toContainText(recipe.passive.description);await card.getByRole('button',{name:'Mở công thức · 10 Bản Thiết Kế'}).click();const modal=page.getByRole('dialog');await expect(modal).toContainText(recipe.name);await expect(modal).toContainText('30 → 20');await modal.getByRole('button',{name:'Hủy',exact:true}).click();}
 expect(errors).toEqual([]);
});
