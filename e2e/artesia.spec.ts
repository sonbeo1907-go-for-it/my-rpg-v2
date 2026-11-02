import {test,expect,type Page} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
const content:any=await loadContent();
async function seed(page:Page){const c=createGameSave(content);c.unlockedCharacterIds=Object.keys(content.characters);c.party=['arthur','artesia','chelsea','elaine'];c.partyPresets[0].slots=[...c.party];c.coins=10000;Object.assign(c.characters.artesia,{level:50,limitBreakRank:3});
 await page.addInitScript(raw=>{if(!localStorage.getItem('northern-prisma.campaign.v7'))localStorage.setItem('northern-prisma.campaign.v7',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));localStorage.setItem('northern-prisma.combat.speed','fast');},encodeGameSave(c,content));await page.emulateMedia({reducedMotion:'reduce'});
}
test('Artesia detail has localised mechanics and correct next-Rank capacity/amplification previews',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page);await page.goto('/characters/artesia?tab=skills');
 await expect(page.getByRole('heading',{name:/Artesia/}).first()).toBeVisible();const cap=page.locator('[data-skill-line="artesia.starsea"]');await expect(page.locator('.skill-card').filter({has:cap})).toContainText('+40% MP tối đa');await cap.getByRole('button').click();let dialog=page.getByRole('dialog');await expect(dialog.locator('.skill-upgrade-comparison section').nth(1)).toContainText('+42% MP tối đa');await dialog.getByRole('button',{name:'Hủy',exact:true}).click();
 const amp=page.locator('[data-skill-line="artesia.destiny"]');await expect(page.locator('.skill-card').filter({has:amp})).toContainText('3 lần gây sát thương/người');await amp.getByRole('button').click();dialog=page.getByRole('dialog');await expect(dialog.locator('.skill-upgrade-comparison section').nth(1)).toContainText('+30%');await dialog.getByRole('button',{name:'Hủy',exact:true}).click();
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:'test-results/artesia-skills-mobile.png',fullPage:true});expect(errors).toEqual([]);
});
test('combat targets both neighbors, displays effective MP capacity and shows separate charge counters',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page);await page.goto('/quests?selected=forest_patrol');await page.getByRole('button',{name:/Xuất chiến/}).click();await expect(page).toHaveURL(/battle$/);
 const command=(id:string)=>page.locator(`[data-gamepad-skill="${id}"]`);await expect(command('$defend')).toBeVisible();await command('$defend').click();await page.locator('.execute').click();await expect(command('artesia.starsea')).toBeVisible();await command('artesia.starsea').click();
 for(const id of ['arthur','chelsea'])await expect(page.locator(`.combatant[data-actor-id="${id}"]`)).toHaveClass(/is-affected/);await expect(page.locator('.combatant[data-actor-id="elaine"]')).not.toHaveClass(/is-affected/);
 await expect(command('artesia.starsea')).toContainText('MP tối đa');await page.locator('.execute').click();await expect(page.locator('.combatant[data-actor-id="arthur"]')).toContainText('MP 40 / 56');
 // Advance a complete round via Defend until Artesia returns, then inspect both counters.
 for(let i=0;i<9;i++){await expect(page.locator('.execute')).toBeEnabled();if(await command('artesia.destiny').count())break;await command('$defend').click();await page.locator('.execute').click();}
 await expect(command('artesia.destiny')).toBeVisible();await command('artesia.destiny').click();await page.locator('.execute').click();
 for(const id of ['arthur','chelsea'])await expect(page.locator(`.combatant[data-actor-id="${id}"] .status-badge`).filter({hasText:'Ánh Sao Định Mệnh'})).toContainText('3 lần');
 await page.screenshot({path:'test-results/artesia-combat.png',fullPage:true});expect(errors).toEqual([]);
});
