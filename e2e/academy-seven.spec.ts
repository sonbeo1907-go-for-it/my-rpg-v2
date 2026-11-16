import {test,expect} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
const c:any=await loadContent();
for(const id of ['luka','gairyu'])test(`${id}: data-only character skills render in desktop and mobile synthetic profile`,async({page})=>{
 const s=createGameSave(c);s.unlockedCharacterIds.push(id);
 await page.addInitScript(raw=>{localStorage.setItem('northern-prisma.campaign.v7',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));},encodeGameSave(s,c));
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/characters?ownership=owned');await page.locator(`a[href^="/characters/${id}?"]`).click();await page.getByRole('link',{name:'Kỹ Năng',exact:true}).click();
 const panel=page.locator('.character-tab-panel');
 if(id==='luka'){await expect(panel).toContainText('Nhịp Điệu');await expect(panel).toContainText('20%/12%');await expect(panel).toContainText('Khúc Cao Trào');await expect(panel).toContainText('ATK');}
 else {await expect(panel).toContainText('100% MAG');await expect(panel).toContainText('30% MAG');await expect(panel).toContainText('50% cơ hội Liên kích');await expect(panel).toContainText('Hỏa Khí Bốc Đồng');}
 for(const width of [1440,768,390]){await page.setViewportSize({width,height:960});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:`test-results/academy-${id}-${width}.png`,fullPage:true});}
 expect(errors).toEqual([]);
});
