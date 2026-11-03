import {test,expect,type Page} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
const content:any=await loadContent();
async function seed(page:Page){const c=createGameSave(content);c.unlockedCharacterIds=Object.keys(content.characters);c.party=['mori','sandra','tywin','elaine'];c.partyPresets[0].slots=[...c.party];await page.addInitScript(raw=>{localStorage.setItem('northern-prisma.campaign.v7',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({controlMode:'mouse',musicEnabled:false,showHints:false}));},encodeGameSave(c,content));await page.emulateMedia({reducedMotion:'reduce'});}
test('trio detail uses correct elements, role icons and reusable status preview without untranslated keys',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page);
 for(const id of ['mori','sandra','tywin']){await page.goto('/characters/'+id+'?tab=skills');await expect(page.getByRole('heading',{name:new RegExp(content.characters[id].name)}).first()).toBeVisible();await expect(page.locator('.skill-card')).toHaveCount(5);expect(await page.locator('main').textContent()).not.toMatch(/undefined|NaN/);await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:'test-results/'+id+'-skills-phone.png',fullPage:true});}
 await page.goto('/characters/sandra?tab=skills');await expect(page.locator('.skill-card').filter({hasText:'Sắc Lệnh'})).toContainText('2 lần');expect(errors).toEqual([]);
});
test('Mori grants team Ward and extra turn, Sandra displays2-charge seals in an actual fight',async({page})=>{
 await seed(page);await page.goto('/quests?selected=forest_patrol');await page.locator('.embark').click();await expect(page.locator('.execute')).toBeEnabled();await page.locator('[data-gamepad-skill="mori.unbound"]').click();await page.locator('.execute').click();await expect(page.locator('.ally-grid .status-badge').filter({hasText:'Hộ ấn'})).toHaveCount(4);
 for(let i=0;i<6;i++){await expect(page.locator('.execute')).toBeEnabled();if(await page.locator('[data-gamepad-skill="sandra.interdict"]').count())break;await page.locator('[data-gamepad-skill="$defend"]').click();await page.locator('.execute').click();}
 await page.locator('[data-gamepad-skill="sandra.interdict"]').click();await page.locator('.execute').click();await expect(page.locator('.enemy-grid .status-badge').filter({hasText:'Phong Ấn'})).toHaveCount(3);for(const badge of await page.locator('.enemy-grid .status-badge').filter({hasText:'Phong Ấn'}).all())await expect(badge).toContainText('2 lần');await page.screenshot({path:'test-results/sandra-two-seals.png',fullPage:true});
});

test('Sandra decree renders temporary book and individual seals without a combat background',async({page})=>{
 await seed(page);await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/quests?selected=forest_patrol');await page.locator('.embark').click();
 for(let i=0;i<6;i++){await expect(page.locator('.execute')).toBeEnabled();if(await page.locator('[data-gamepad-skill="sandra.interdict"]').count())break;await page.locator('[data-gamepad-skill="$defend"]').click();await page.locator('.execute').click();}
 await page.locator('[data-gamepad-skill="sandra.interdict"]').click();await page.locator('.execute').click();await page.waitForFunction(()=>document.querySelector('.edict-seal-glyph'));await expect(page.locator('.enemy-grid>[data-actor-id]').filter({has:page.locator('.edict-seal-glyph')})).toHaveCount(3);await expect(page.locator('.enemy-grid .edict-glyph')).toHaveCount(1);await expect(page.locator('main')).not.toHaveAttribute('data-combat-mode');
 await page.locator('.edict-glyph,.edict-seal-glyph').evaluateAll(nodes=>{for(const node of nodes)for(const a of node.getAnimations({subtree:true})){a.pause();a.currentTime=Number(a.effect!.getTiming().duration)*.4;}});await page.locator('.enemy-grid').screenshot({path:'test-results/sandra-decree-vfx.png'});await expect(page.locator('.edict-glyph')).toHaveCount(0);await expect(page.locator('.edict-seal-glyph')).toHaveCount(0);
});
