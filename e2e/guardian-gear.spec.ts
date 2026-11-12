import {test,expect} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';import {createGameSave,encodeGameSave} from '../src/core/game-save.js';import {craftGear} from '../src/core/gear-forge.js';
const c:any=await loadContent();
test('eight guardian/echo recipes craft valid inventory gear and stay readable on desktop/mobile',async({page})=>{
 let s=createGameSave(c);s.coins=200000;s.prismaFragments=50000;s.gacha.totalPulls=8;s.gear=Array.from({length:8},(_,i)=>({id:'gear_'+(i+1),typeId:'t3_focused',stats:{attack:5}}));
 const ids=['aegis_covenant','shelter_relay','restoration_clock','unbroken_crest','desperate_crest','echoing_edge','affliction_prism','healers_chorus'];for(let i=0;i<ids.length;i++)s=craftGear(s,c,{effectId:ids[i],materialId:'gear_'+(i+1)});
 await page.addInitScript(raw=>{localStorage.setItem('northern-prisma.campaign.v7',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));},encodeGameSave(s,c));
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/inventory');await expect(page.locator('.gear-card')).toHaveCount(8);
 for(const width of [1440,390]){await page.setViewportSize({width,height:960});await page.goto('/blacksmith?tab=effects');for(let i=0;i<9;i++){if(await page.getByRole('button',{name:/Khúc Hòa Ca Hồi Sinh/}).count())break;await page.getByRole('button',{name:'Trang sau',exact:true}).click();}
  await expect(page.getByRole('button',{name:/Khúc Hòa Ca Hồi Sinh/})).toContainText('1 lần / vòng / đội');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:`test-results/guardian-recipes-${width}.png`,fullPage:true});
 }
 expect(errors).toEqual([]);
});
