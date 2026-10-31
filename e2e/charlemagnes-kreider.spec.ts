import {test,expect,type Page} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
const content:any=await loadContent();
async function seed(page:Page,party:string[]){
 const save=createGameSave(content);save.party=party;save.partyPresets[0].slots=[...party];save.unlockedCharacterIds=[...new Set([...save.unlockedCharacterIds,...party])];
 await page.addInitScript(raw=>{if(!localStorage.getItem('northern-prisma.campaign.v6'))localStorage.setItem('northern-prisma.campaign.v6',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.combat.speed','fast');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false}));},encodeGameSave(save,content));await page.emulateMedia({reducedMotion:'reduce'});
}
async function cast(page:Page,id:string,target?:string){await expect(page.locator('.execute')).toBeEnabled();await page.locator(`[data-gamepad-skill="${id}"]`).click();await page.keyboard.press('Escape');if(target)await page.locator(`[data-actor-id="${target}"] .target-hitbox`).click();await page.locator('.execute').click();}
async function ready(page:Page,name:string){for(let i=0;i<12;i++){await expect(page.locator('.execute')).toBeEnabled();if((await page.locator('.command-panel h2').textContent())?.includes(name))return;await cast(page,'$defend');}throw Error('Turn did not reach '+name);}

test('Charlemagnes shows random hit targeting and switches costs after his first kill',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page,['charlemagnes','iris','elaine','garrek']);await page.goto('/quests?selected=ogre_trial');await page.getByRole('button',{name:/Xuất chiến/}).click();await ready(page,'Charlemagnes');
 await page.locator('[data-gamepad-skill="charlemagnes.campaign"]').click();await page.keyboard.press('Escape');await expect(page.locator('.command-panel')).toContainText('Ngẫu nhiên · 4 đòn');await expect(page.locator('.command-panel')).toContainText('2 đối thủ có thể bị chọn');await expect(page.locator('[data-gamepad-skill="charlemagnes.campaign"]')).toContainText('4 × 180% ATK');await page.screenshot({path:'test-results/charlemagnes-random-targets.png',fullPage:true});await page.locator('.execute').click();
 // Ensure a personal kill regardless of the random spread. The ogre remains alive.
 for(let i=0;i<6;i++){
  await ready(page,'Charlemagnes');
  if(await page.getByRole('button',{name:'Xem hiệu ứng Tiết kiệm quân lực',exact:true}).count())break;
  await cast(page,'$attack','enemy_1');
 }
 await expect(page.getByRole('button',{name:'Xem hiệu ứng Tiết kiệm quân lực',exact:true})).toBeVisible();await ready(page,'Charlemagnes');await page.locator('[data-gamepad-skill="charlemagnes.charge"]').hover();await expect(page.getByRole('tooltip',{name:'Kỹ năng Kị đoàn xung kích'})).toContainText('18 MP (gốc 20)');await expect(page.locator('.battle-log')).toContainText('giảm 12% MP tiêu hao');await page.mouse.move(0,0);expect(errors).toEqual([]);
});

test('Kreider hover follows the actual selected enemy debuffs and applies its capped bonus',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page,['kreider','monica','fran','elaine']);await page.goto('/quests?selected=ogre_trial');await page.getByRole('button',{name:/Xuất chiến/}).click();await expect(page.locator('.command-panel h2')).toContainText('Monica');await cast(page,'monica.formula');await cast(page,'fran.night');await cast(page,'$defend');await expect(page.locator('.command-panel h2')).toContainText('Kreider');await cast(page,'kreider.dissonance','enemy_0');
 await ready(page,'Monica');await cast(page,'monica.formula');await cast(page,'$defend');await cast(page,'$defend');await expect(page.locator('.command-panel h2')).toContainText('Kreider');await page.locator('[data-gamepad-skill="kreider.finale"]').click();await page.keyboard.press('Escape');await page.locator('[data-actor-id="enemy_0"] .target-hitbox').click();await page.locator('[data-gamepad-skill="kreider.finale"]').hover();await expect(page.getByRole('tooltip',{name:'Kỹ năng Đại hợp tấu: Chung chương'})).toContainText('3 loại debuff · +90% sát thương');await expect(page.locator('[data-gamepad-skill="kreider.finale"]')).toContainText('+90% ST theo debuff');await page.screenshot({path:'test-results/kreider-live-debuffs.png',fullPage:true});await page.keyboard.press('Escape');await page.locator('.execute').click();await expect(page.locator('.battle-log')).toContainText('Kreider dùng Đại hợp tấu: Chung chương');await expect(page.locator('[data-actor-id="kreider"]')).toContainText(/MP\s*74\s*\/\s*110/);expect(errors).toEqual([]);
});

test('both detail pages load and Kreider exposes a controllable debuff assumption on mobile',async({page})=>{
 await seed(page,['charlemagnes','kreider','iris','elaine']);await page.goto('/characters/charlemagnes');await expect(page.locator('.character-overview')).toContainText('Đại tướng Kị sĩ đoàn');await page.locator('.character-tabs [data-tab-id=skills]').click();await expect(page.locator('.skill-grid')).toContainText('Kẻ địch ngẫu nhiên');await page.goto('/characters/kreider');await page.locator('.character-tabs [data-tab-id=skills]').click();const skill=page.locator('.skill-card').filter({has:page.getByRole('heading',{name:'Đại hợp tấu: Chung chương',exact:true})});await expect(skill).toContainText('0 loại debuff · +0% sát thương');await skill.locator('summary').click();await skill.getByRole('slider').fill('3');await expect(skill).toContainText('3 loại debuff · +90% sát thương');await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:'test-results/kreider-detail-phone.png',fullPage:true});
});
