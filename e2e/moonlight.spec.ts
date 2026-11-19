import {writeFile} from 'node:fs/promises';
import {test,expect} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
const c:any=await loadContent();
async function seed(page:any){const s=createGameSave(c);s.unlockedCharacterIds.push('noelle');s.party=['noelle','elaine','iris','garrek'];s.partyPresets[0].slots=[...s.party];await page.addInitScript((raw:string)=>{localStorage.setItem('northern-prisma.campaign.v7',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));localStorage.setItem('northern-prisma.combat.speed','fast');},encodeGameSave(s,c));}
test('Noelle skills, two elemental sockets, active storm and responsive panel work in actual combat',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page);
 await page.goto('/characters/noelle?tab=skills');await expect(page.locator('.character-tab-panel')).toContainText('Liên kích');await expect(page.locator('.character-tab-panel')).toContainText('150% ATK');
 await page.goto('/quests?tab=hunt&selected=forest_patrol');await page.getByRole('button',{name:/Xuất chiến/}).first().click();const board=page.locator('[data-moonlight-board="party"]');await expect(board).toBeVisible();await expect(board.locator('[data-moonlight-slot]')).toHaveCount(2);await board.screenshot({path:'test-results/moonlight-waiting-panel.png'});
 const act=async(name:string)=>{await page.locator('.skill-command').filter({hasText:name}).click();await page.locator('.execute').click();};
 for(let i=0;i<5;i++){if(await page.locator('.skill-command').filter({hasText:'Mạch Sét Dẫn Lối'}).count())break;await act('Phòng thủ');}
 await act('Mạch Sét Dẫn Lối');await expect(board.locator('[data-moonlight-slot="thunder"]')).toHaveAttribute('data-charged','true');
 for(let i=0;i<8;i++){if(await page.locator('.skill-command').filter({hasText:'Thủy thuẫn'}).count())break;await act('Phòng thủ');}
 await act('Phép cơ bản');await expect(board).toHaveAttribute('data-blessing','thunder_wrath');await expect(board).toContainText('ATK');await expect(board).toContainText('3 vòng');
 await writeFile('.taste-skill/moonlight/screen.html',(await page.content()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace('<head>','<head><base href="http://127.0.0.1:3002/">'));
 for(const width of [1440,768,390]){await page.setViewportSize({width,height:960});await board.scrollIntoViewIfNeeded();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:`test-results/moonlight-storm-${width}.png`,fullPage:true});}
 await page.emulateMedia({reducedMotion:'reduce'});await expect(board).toBeVisible();expect(errors).toEqual([]);
});
