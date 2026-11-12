import {test,expect} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
const c:any=await loadContent();
test('new effect gear recipes show descriptions and shared team limit on desktop/mobile',async({page})=>{
 const s=createGameSave(c);await page.addInitScript(raw=>{localStorage.setItem('northern-prisma.campaign.v7',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));},encodeGameSave(s,c));
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:960});await page.goto('/blacksmith?tab=effects');
  for(let i=0;i<8;i++){const next=page.getByRole('button',{name:'Trang sau',exact:true});if(await page.getByRole('button',{name:/Chuông Đồng Tâm/}).count())break;if(await next.isDisabled())break;await next.click();}
  await expect(page.getByRole('button',{name:/Chuông Đồng Tâm/})).toContainText('1 lần / vòng / đội');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:`test-results/utility-recipes-${width}.png`,fullPage:true});
 }
 expect(errors).toEqual([]);
});
