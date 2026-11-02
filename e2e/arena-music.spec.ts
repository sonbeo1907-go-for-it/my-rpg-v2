import {test,expect} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
const content:any=await loadContent();
test('Arena route plays menu, then same battle start survives UI publishes and leaving returns to menu',async({page})=>{
 const c=createGameSave(content);c.party=['benard','iris','garrek','elaine'];c.partyPresets[0].slots=[...c.party];c.unlockedCharacterIds.push('benard');
 await page.addInitScript(raw=>{
  localStorage.setItem('northern-prisma.campaign.v7',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:true,musicVolume:.35,controlMode:'mouse'}));
  const native=document.createElement.bind(document);(window as any).__audio=[];
  document.createElement=((tag:string,options?:any)=>{const node=native(tag,options);if(tag==='audio')(window as any).__audio.push(node);return node;}) as typeof document.createElement;
  HTMLMediaElement.prototype.play=function(){(this as any).__playing=true;return Promise.resolve();};HTMLMediaElement.prototype.pause=function(){(this as any).__playing=false;};
 },encodeGameSave(c,content));await page.emulateMedia({reducedMotion:'reduce'});
 const playing=()=>page.evaluate(()=>(window as any).__audio.filter((a:any)=>a.__playing).map((a:any)=>new URL(a.src).pathname));
 await page.goto('/arena/practice');await expect.poll(playing).toEqual(['/bgm/arena_menu.mp3']);
 await page.getByRole('button',{name:/Vào luyện tập/}).click();await expect(page).toHaveURL(/battle$/);await expect.poll(playing).toHaveLength(1);const initial=(await playing())[0];expect(initial).toMatch(/^\/bgm\/arena_start_[12]\.mp3$/);
 await expect(page.locator('.execute')).toBeEnabled();await page.locator('[data-gamepad-skill="$defend"]').click();expect((await playing())[0]).toBe(initial);
 await page.locator('.arena-exit').click();await expect(page).toHaveURL(/arena$/);await expect.poll(playing).toEqual(['/bgm/arena_menu.mp3']);
});
