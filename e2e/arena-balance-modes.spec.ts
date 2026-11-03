import {test,expect} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
const content:any=await loadContent();
test('Arena Monica tooltip and field show SPD shift without team separators',async({page})=>{
 const c=createGameSave(content);c.party=['monica','iris','elaine','garrek'];c.partyPresets[0].slots=[...c.party];c.unlockedCharacterIds.push('monica');
 await page.addInitScript(raw=>{localStorage.setItem('northern-prisma.campaign.v7',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));localStorage.setItem('northern-prisma.combat.speed','fast');},encodeGameSave(c,content));await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/arena/practice');await page.getByRole('button',{name:/Vào luyện tập/}).click();await expect(page).toHaveURL(/battle$/);await expect(page.locator('.execute')).toBeEnabled();
 const skill=page.locator('[data-gamepad-skill="monica.distortion"]');await expect(skill).toContainText('SPD');await skill.hover();await expect(page.getByRole('tooltip')).toContainText('không phải buff/debuff');await page.keyboard.press('Escape');await skill.click();await page.locator('.execute').click();
 await expect(page.locator('.turn-order')).toHaveAttribute('data-turn-field','speed_shift');await expect(page.locator('.turn-team-divider')).toHaveCount(0);await page.locator('.turn-field-badge').hover();await expect(page.getByRole('tooltip',{name:'Đảo lộn thời không',exact:true})).toContainText('không phải buff/debuff');await page.mouse.move(0,0);await page.screenshot({path:'test-results/arena-time-spd-field.png',fullPage:true});
});
