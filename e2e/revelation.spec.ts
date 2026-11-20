import {writeFile} from 'node:fs/promises';
import {test,expect} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
const content:any=await loadContent();
async function seed(page:any){const s=createGameSave(content);s.recruitmentShards=90;s.unlockedCharacterIds.push('noelle','gawain','tywin','rhett','aisha');s.party=['aisha','noelle','gawain','tywin'];s.partyPresets[0].slots=[...s.party];await page.addInitScript(raw=>{if(sessionStorage.getItem('revelation-fixture'))return;sessionStorage.setItem('revelation-fixture','1');localStorage.setItem('northern-prisma.campaign.v7',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));},encodeGameSave(s,content));}
test('revelation purchase, toggle and reload preserve the account and fit all screen widths',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page);await page.goto('/characters/rhett?tab=skills');
 const section=page.getByRole('region',{name:'Nguyệt Quang Hé Lộ'});await expect(section).toContainText('30 Pure Prisma');await section.getByRole('button',{name:/Mở khóa/}).click();
 await page.getByRole('button',{name:'Xác nhận mở khóa'}).click();await expect(section.getByRole('checkbox')).toBeChecked();
 const saved=await page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('northern-prisma.profiles.v1')!).entries[0].text));expect(saved.recruitmentShards).toBe(60);expect(saved.moonlightRevelations.rhett.enabled).toBe(true);
 await section.getByRole('checkbox').uncheck();await expect(section).toContainText('Đã tắt');
 // The fixture initializes once; route reloads verify the persisted profile.
 await page.goto('/characters/gawain?tab=skills');await expect(page.getByRole('region',{name:'Nguyệt Quang Hé Lộ'})).toContainText('180%');await page.goto('/characters/rhett?tab=skills');await expect(section.getByRole('checkbox')).not.toBeChecked();
 await section.getByRole('checkbox').check();await expect(section.getByRole('checkbox')).toBeChecked();
 for(const width of [1440,768,390]){await page.setViewportSize({width,height:960});await section.scrollIntoViewIfNeeded();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:`test-results/revelation-${width}.png`,fullPage:true});}
 await writeFile('.taste-skill/revelation/screen.html',(await page.content()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace('<head>','<head><base href="http://127.0.0.1:3002/">'));
 expect(errors).toEqual([]);
});
test('Aisha skill page shows her mode aura and end-round recovery with Vietnamese copy',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page);await page.goto('/characters/aisha?tab=skills');await expect(page.locator('.character-tab-panel')).toContainText('8%');await expect(page.locator('.character-tab-panel')).toContainText('đồng đội Thủy/Lôi');await expect(page.locator('.character-tab-panel')).toContainText('5 vòng');await expect(page.locator('.character-tab-panel')).toContainText('Xưởng Kẹo Sấm');
 await page.screenshot({path:'test-results/aisha-skills.png',fullPage:true});expect(errors).toEqual([]);
});

test('Aisha mode uses a plain card label, without Selene effects or battle scenery',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page);await page.goto('/quests?tab=hunt&selected=forest_patrol');await page.getByRole('button',{name:/Xuất chiến/}).first().click();
 const act=async(name:string)=>{await page.locator('.skill-command').filter({hasText:name}).click();await page.locator('.execute').click();};
 for(let i=0;i<5;i++){if(await page.locator('.skill-command').filter({hasText:'Xưởng Kẹo Sấm'}).count())break;await act('Phòng thủ');}
 await act('Xưởng Kẹo Sấm');const actor=page.locator('.combatant[data-actor-id="aisha"]');await expect(actor.locator('.local-mode-label')).toContainText('Xưởng Kẹo Sấm');await expect(actor.locator('[data-local-mode]')).toHaveCount(0);await expect(page.locator('.battle-page[data-combat-mode]')).toHaveCount(0);await page.screenshot({path:'test-results/aisha-standard-mode.png',fullPage:true});expect(errors).toEqual([]);
});
