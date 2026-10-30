import {test,expect} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
import {pullGacha} from '../src/core/economy.js';
import {ROLE_GROUPS} from '../src/core/content.js';
const content:any=await loadContent();

for(const count of [1,10] as const){
 test(`Monica ${count}-pull reveal and results load the witch-hat sorcerer silhouette`,async({page,request})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  // Every supported role must have real artwork; this catches the missing sorcerer asset.
  for(const role of Object.keys(ROLE_GROUPS))expect((await request.get(`/art/silhouette-${role}.svg`)).ok()).toBe(true);
  let save=createGameSave(content);save.prisma=20;
  const pool=content.banners.standard.characterPool;
  const choose=(id:string)=>(pool.indexOf(id)+.5)/pool.length;
  const values=count===1?[.99,choose('monica')]:[.99,choose('monica'),.99,choose('freya'),...Array.from({length:8},()=>[0,.5,0]).flat()];let index=0;
  save=pullGacha(save,content,'standard',count,()=>values[index++]).campaign;
  await page.addInitScript(raw=>{if(!localStorage.getItem('northern-prisma.campaign.v6'))localStorage.setItem('northern-prisma.campaign.v6',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false}));},encodeGameSave(save,content));
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/recruitment/reveal');
  await expect(page.locator('.reveal-card')).toHaveAttribute('data-reveal-phase','front');await expect(page.locator('.cardback-center [data-role-icon=sorcerer]')).toHaveCount(1);
  const image=page.locator('.card-front-reveal .summon-silhouette');await expect(image).toHaveAttribute('src','/art/silhouette-sorcerer.svg');await expect.poll(()=>image.evaluate((node:HTMLImageElement)=>node.complete&&node.naturalWidth>0)).toBe(true);
  await page.screenshot({path:`test-results/monica-sorcerer-reveal-${count}.png`,fullPage:true});
  await page.goto('/recruitment/results');await expect(page.locator('.summon-result')).toHaveCount(count);
  const monica=page.getByRole('button',{name:'Xem kết quả Monica',exact:true});await expect(monica.locator('.summon-silhouette')).toHaveAttribute('src','/art/silhouette-sorcerer.svg');await expect.poll(()=>monica.locator('img').evaluate((node:HTMLImageElement)=>node.complete&&node.naturalWidth>0)).toBe(true);
  if(count===10)await expect(page.getByRole('button',{name:'Xem kết quả Freya',exact:true}).locator('img')).toHaveAttribute('src','/art/silhouette-magical_dps.svg');
  await page.screenshot({path:`test-results/monica-sorcerer-results-${count}.png`,fullPage:true});await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:`test-results/monica-sorcerer-results-phone-${count}.png`,fullPage:true});expect(errors).toEqual([]);
 });
}
