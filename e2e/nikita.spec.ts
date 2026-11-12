import {test,expect} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
const c:any=await loadContent();
test('Nikita appears in owned roster and shows weakness penetration, charges and buff on desktop/mobile',async({page})=>{
 const s=createGameSave(c);s.unlockedCharacterIds.push('nikita');
 await page.addInitScript(raw=>{localStorage.setItem('northern-prisma.campaign.v7',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));},encodeGameSave(s,c));
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/characters?ownership=owned');await page.locator('a[href^="/characters/nikita?"]').click();await page.getByRole('link',{name:'Kỹ Năng',exact:true}).click();
 const panel=page.locator('.character-tab-panel');await expect(panel).toContainText('50% RES');await expect(panel).toContainText('60%');await expect(panel).toContainText('Mật Lệnh');await expect(panel).toContainText('Ám Phong');
 for(const width of [1440,390]){await page.setViewportSize({width,height:960});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:`test-results/nikita-${width}.png`,fullPage:true});}
 expect(errors).toEqual([]);
});
