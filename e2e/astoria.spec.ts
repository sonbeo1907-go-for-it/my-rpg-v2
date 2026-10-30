import {test,expect,type Page} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
import {setAstoriaEnabled} from '../src/core/developer.js';
const content:any=await loadContent();
async function seed(page:Page,enabled=false){
 let save=createGameSave(content);if(enabled)save=setAstoriaEnabled(save,true);
 if(enabled){save.unlockedCharacterIds.push('lyon','lionel');save.party=['astoria','elaine','lyon','lionel'];save.partyPresets[0].slots=[...save.party];}
 await page.addInitScript(raw=>{if(!localStorage.getItem('northern-prisma.campaign.v6'))localStorage.setItem('northern-prisma.campaign.v6',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false}));localStorage.setItem('northern-prisma.combat.speed','fast');},encodeGameSave(save,content));
}
const saved=(page:Page)=>page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('northern-prisma.profiles.v1')!).entries[0].text));
async function developer(page:Page){await page.getByRole('button',{name:'Mở Settings',exact:true}).click();await page.getByRole('button',{name:'Developer Option',exact:true}).click();return page.getByRole('dialog',{name:'Developer Option',exact:true});}
async function closeSettings(page:Page){await page.getByRole('button',{name:'Đóng Developer Option',exact:true}).click();await page.getByRole('button',{name:'Đóng Settings',exact:true}).click();}

test('Developer Option toggles a profile grant with zero duplicates, persists and stays out of recruitment',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page);await page.goto('/characters?ownership=owned');await expect(page.locator('.character-grid a[href*="/astoria"]')).toHaveCount(0);
 const dialog=await developer(page);await expect(dialog).toContainText('Bản trùng: 0');await expect(dialog.getByRole('switch')).toHaveAttribute('aria-checked','false');await dialog.getByRole('switch').click();await expect(dialog.getByRole('switch')).toHaveAttribute('aria-checked','true');await page.screenshot({path:'test-results/astoria-developer-option.png',fullPage:true});await closeSettings(page);
 await expect(page.locator('.character-grid a[href*="/astoria"]')).toHaveCount(1);await page.reload();await expect(page.locator('.character-grid a[href*="/astoria"]')).toHaveCount(1);expect((await saved(page)).extraGearSlots.astoria??0).toBe(0);
 await page.goto('/characters/astoria');await expect(page.locator('[data-role-icon=sorcerer]')).toBeVisible();await expect(page.locator('.passive-copy')).toContainText('35%');await expect(page.locator('.skill-card').filter({has:page.getByRole('heading',{name:'Không gian rạn nứt',exact:true})})).toContainText('4 lượt chính');await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:'test-results/astoria-character-phone.png',fullPage:true});
 await developer(page);await page.getByRole('switch').click();await expect(page.getByRole('switch')).toHaveAttribute('aria-checked','false');await closeSettings(page);await page.goto('/characters?ownership=owned');await expect(page.locator('.character-grid a[href*="/astoria"]')).toHaveCount(0);expect((await saved(page)).unlockedCharacterIds).not.toContain('astoria');expect(Object.values(content.banners).every((banner:any)=>!banner.characterPool.includes('astoria'))).toBe(true);expect(errors).toEqual([]);
});

test('Astoria rotates into Magnamut, locks normal commands, restores the scene on victory, and never duplicates VFX',async({page,request})=>{
 test.setTimeout(90000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page,true);await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/quests?selected=forest_patrol');await page.getByRole('button',{name:/Xuất chiến/}).click();await expect(page.locator('.execute')).toBeEnabled();
 let summoned=false;
 for(let i=0;i<30;i++){
   await expect(page.locator('.execute')).toBeEnabled();const name=await page.locator('.command-panel h2').textContent();let skill='$defend';
   const available=async(id:string)=>(await page.locator(`[data-gamepad-skill="${id}"]`).getAttribute('aria-disabled'))==='false';
   if(name?.includes('Astoria')){
     if(await available('astoria.summon')){skill='astoria.summon';summoned=true;}
     else if(await available('astoria.rift'))skill='astoria.rift';else skill='astoria.slash';
   }else if(name?.includes('Elaine')){if(await available('elaine.sanctuary'))skill='elaine.sanctuary';else if(await available('elaine.shield'))skill='elaine.shield';}
   else if(name?.includes('Lyon')&&await available('lyon.shield'))skill='lyon.shield';
   await page.locator(`[data-gamepad-skill="${skill}"]`).click();await page.keyboard.press('Escape');
   if(['elaine.shield'].includes(skill))await page.locator('[data-actor-id=astoria] .target-hitbox').click();
   if(skill==='astoria.rift')await page.locator('[data-actor-id=enemy_2] .target-hitbox').click();
   await page.locator('.execute').click();if(summoned)break;
 }
 expect(summoned).toBe(true);for(let i=0;i<4;i++){await expect(page.locator('.execute')).toBeEnabled();if((await page.locator('.command-panel h2').textContent())?.includes('Astoria'))break;await page.locator('[data-gamepad-skill="$defend"]').click();await page.keyboard.press('Escape');await page.locator('.execute').click();}await expect(page.locator('.battle-page')).toHaveAttribute('data-combat-mode','magnamut');await expect(page.locator('.summon-backdrop')).toBeVisible();await expect(page.locator('.command-panel h2')).toContainText('Astoria');await expect(page.locator('.execute')).toBeEnabled();
 await expect(page.locator('[data-gamepad-skill="astoria.command"]')).toHaveAttribute('aria-disabled','false');for(const id of ['$attack','$defend','astoria.slash','astoria.rift','astoria.summon'])await expect(page.locator(`[data-gamepad-skill="${id}"]`)).toHaveAttribute('aria-disabled','true');await expect(page.locator('.skill-command.selected')).toHaveAttribute('data-gamepad-skill','astoria.command');await expect(page.locator('.target-summary')).toContainText('Chính:');
 await page.locator('[data-gamepad-skill="$attack"]').hover();await expect(page.getByRole('tooltip')).toContainText('Magnamut đang hiện diện');await page.mouse.move(0,0);await page.screenshot({path:'test-results/astoria-magnamut-desktop.png',fullPage:true});
 const d=await developer(page);await expect(d.getByRole('switch')).toBeDisabled();await closeSettings(page);
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:'test-results/astoria-magnamut-phone.png',fullPage:true});await page.setViewportSize({width:1440,height:1000});
 // A real cast with motion on: primary selection changes, formation anchor stays centered.
 await page.emulateMedia({reducedMotion:'no-preference'});await page.getByRole('button',{name:'Bình thường',exact:true}).click();await page.locator('.execute').click();await expect(page.locator('.cosmic-fx[data-fx-anchor=formation]')).toBeVisible();await expect(page.locator('.cosmic-fx')).toHaveCount(1);await page.screenshot({path:'test-results/astoria-cosmic-explosion.png',fullPage:true});
 await expect(page.locator('.battle-outcome')).toContainText('Chiến thắng');await expect(page.locator('.summon-backdrop')).toHaveCount(0);await expect(page.locator('.battle-log')).toContainText('Magnamut rời sân.');await expect(page.locator('.cosmic-fx')).toHaveCount(0);expect((await request.get('/art/magnamut.svg')).ok()).toBe(true);expect((await request.get('/bgm/bgm_astoria.mp3')).ok()).toBe(true);expect(errors).toEqual([]);
});
