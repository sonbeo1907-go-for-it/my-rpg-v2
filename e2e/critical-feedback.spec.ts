import {mkdir,writeFile} from 'node:fs/promises';
import {test,expect} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
const c:any=await loadContent();
async function fixture(page:any){
 const s=createGameSave(c);s.party=['anabel'];s.partyPresets[0].slots=['anabel',null,null,null];s.unlockedCharacterIds.push('anabel');s.characters.anabel={...s.characters.arthur,level:50,limitBreakRank:3,allocations:{attack:17}};s.extraGearSlots.anabel=3;s.craftedGearSerial=6;
 s.gear=[{id:'rune_1',typeId:'t4_effect',effectId:'martial_insight',stats:{}},...Array.from({length:5},(_,i)=>({id:'rune_'+(i+2),typeId:'t4_stats',stats:{attack:8},primaryStat:'attack',secondaryStat:'attack'}))];s.equipment.anabel=s.gear.map((g:any)=>g.id);
 await page.addInitScript(raw=>{if(!sessionStorage.getItem('critical.fixture')){sessionStorage.setItem('critical.fixture','1');localStorage.setItem('northern-prisma.campaign.v7',raw);}sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.combat.speed','normal');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));Object.defineProperty(crypto,'getRandomValues',{value:(a:any)=>{a.fill(1);return a;}});},encodeGameSave(s,c));
}
for(const width of [1440,768,390])test('resolved critical number is larger and labeled at '+width,async({page})=>{
 await page.setViewportSize({width,height:width===390?844:960});await fixture(page);await page.emulateMedia({reducedMotion:width===390?'reduce':'no-preference'});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/chronicles/training');await page.getByRole('button',{name:'Bắt đầu luyện tập',exact:true}).click();await expect(page.locator('.execute')).toBeEnabled();await page.locator('[data-gamepad-skill="$attack"]').click();await page.keyboard.press('Escape');await page.locator('.enemy-grid .target-hitbox').first().scrollIntoViewIfNeeded();
 await page.locator('.execute').scrollIntoViewIfNeeded();await page.locator('.execute').focus();await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+20));await page.locator('.execute').press('Enter');for(let n=0;n<50&&!await page.locator('.critical-label').count();n++)await page.clock.runFor(16);await page.clock.runFor(16);
 const hit=page.locator('[data-fx-critical="true"]').filter({has:page.locator('.critical-label')}).first();await expect(hit.locator('.critical-label')).toHaveText('BẠO KÍCH!');await expect(hit.locator('.vfx-number>span')).toContainText(/−\d+/);
 const size=await hit.locator('.vfx-number').evaluate((n:any)=>parseFloat(getComputedStyle(n).fontSize));expect(size).toBeGreaterThanOrEqual(width===390?18:19);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await mkdir('.taste-skill/critical',{recursive:true});await page.screenshot({path:'.taste-skill/critical/critical-'+width+'.png',fullPage:true});
 if(width===1440)await writeFile('.taste-skill/critical/critical.html',await page.evaluate(()=>{const n=document.documentElement.cloneNode(true) as HTMLElement;n.querySelectorAll('script').forEach(e=>e.remove());n.querySelector('head')!.insertAdjacentHTML('afterbegin','<base href="http://127.0.0.1:3002/">');return '<!doctype html>'+n.outerHTML;}));
 expect(errors).toEqual([]);await page.clock.runFor(1000);await expect(page.locator('.critical-label')).toHaveCount(0);
});
