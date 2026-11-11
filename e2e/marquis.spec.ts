import {test,expect} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
const content:any=await loadContent();

test('Marquis characters appear in the roster and expose localized skill/passive details on desktop and mobile',async({page})=>{
 const save=createGameSave(content);save.unlockedCharacterIds.push('kanade','wilson');
 await page.addInitScript(raw=>{
  if(!localStorage.getItem('northern-prisma.campaign.v7'))localStorage.setItem('northern-prisma.campaign.v7',raw);
  sessionStorage.setItem('northern-prisma.entered','1');
  localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));
 },encodeGameSave(save,content));
 for(const [id,name,skill]of [['kanade','Kanade Hanasato','Hoa Nở Nơi Đất Khách'],['wilson','Wilson Marquis','Hoa Đất Mở Đường']]){
  await page.goto('/characters?ownership=owned&q='+id);
  await expect(page.locator('.character-grid .character-card')).toHaveCount(1);
  await expect(page.locator('.character-grid')).toContainText(name);
  await page.locator('.character-card').first().click();await expect(page).toHaveURL(new RegExp('/characters/'+id));
  await page.goto('/characters/'+id+'?tab=skills');
  await expect(page.locator('main')).toContainText(skill);
  await expect(page.locator('main')).toContainText(id==='kanade'?'Kỹ năng khai thác mạnh điểm yếu Thổ.':'Đồng đội Thổ khác hành động');
  await page.setViewportSize({width:390,height:844});
  await expect(page.locator('main')).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);expect(overflow).toBe(false);
  await page.screenshot({path:`test-results/marquis-${id}-mobile.png`,fullPage:true});
  await page.setViewportSize({width:1440,height:960});
 }
});
