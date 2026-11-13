import {test,expect} from '@playwright/test';import {loadContent} from '../scripts/load-content.mjs';import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
const c:any=await loadContent();
test('new Wind knights show targeted support and resource follow-up rules without overflow',async({page})=>{
 const s=createGameSave(c);s.unlockedCharacterIds.push('cyrus','siesta');await page.addInitScript(raw=>{localStorage.setItem('northern-prisma.campaign.v7',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));},encodeGameSave(s,c));
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const id of ['cyrus','siesta']){
  await page.goto('/characters?ownership=owned');await page.locator('a[href^="/characters/'+id+'?"]').click();await page.getByRole('link',{name:'Kỹ Năng',exact:true}).click();const panel=page.locator('.character-tab-panel');await expect(panel).toContainText(id==='cyrus'?'5% MP':'Dã Tính');await expect(panel).toContainText(id==='cyrus'?'Trang Sách Đồng Hành':'Liên kích');
  for(const width of [1440,390]){await page.setViewportSize({width,height:960});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:`test-results/${id}-skills-${width}.png`,fullPage:true});}
 }
 expect(errors).toEqual([]);
});
