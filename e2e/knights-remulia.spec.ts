import {test,expect} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
const c:any=await loadContent();
test.beforeEach(async({page})=>{
 const s=createGameSave(c);s.unlockedCharacterIds.push('geoffrey','anabel');s.unrecordedLedger.best={song_chimera:8,song_ego:16,song_calamity:8};
 await page.addInitScript(raw=>{if(!localStorage.getItem('northern-prisma.campaign.v7'))localStorage.setItem('northern-prisma.campaign.v7',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));},encodeGameSave(s,c));
});
test('new knights use existing character cards and expose native and repeat rules without overflow',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const id of ['geoffrey','anabel']){
  await page.goto('/characters?ownership=owned');await page.locator('a[href^="/characters/'+id+'?"]').click();await page.getByRole('link',{name:'Kỹ Năng',exact:true}).click();
  await expect(page.locator('.character-tab-panel')).toContainText(id==='geoffrey'?'35% DEF':'15 ATK căn bản');
  if(id==='anabel')await expect(page.locator('.character-tab-panel')).toContainText('tái kích cùng chiêu');
  for(const width of [1440,768,390]){await page.setViewportSize({width,height:960});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:`test-results/${id}-skills-${width}.png`,fullPage:true});}
 }
 expect(errors).toEqual([]);
});
test('saved records at 8/16 unlock Remulia slots and recipe while 22-point daily reward stays visible',async({page})=>{
 await page.goto('/chronicles/unrecorded/chimera');await expect(page.locator('.trial-milestones')).toContainText('Mỗi màn từ 8 điểm');await expect(page.locator('.trial-milestones')).toContainText('Một màn từ 16 điểm');await expect(page.locator('.trial-milestones')).toContainText('Đã mở');
 await page.locator('.trial-summary').getByText('Mốc Pure Prisma',{exact:true}).click();await expect(page.locator('.trial-reward-tiers')).toContainText('Từ 22 điểm');await expect(page.locator('.trial-reward-tiers')).toContainText('30 Pure Prisma');
 await page.goto('/characters/remulia?tab=skills');await expect(page.locator('.character-tab-panel')).toContainText('Đánh trúng điểm yếu: +100% sát thương · 4 lượt chính');
 await page.screenshot({path:'test-results/remulia-exploitation-fixed.png',fullPage:true});
});
