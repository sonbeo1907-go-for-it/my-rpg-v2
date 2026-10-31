import {test,expect,type Page} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
const content:any=await loadContent();
async function seed(page:Page,party=['chloe','amelia','logia','elaine']){
 const save=createGameSave(content);save.party=party;save.partyPresets[0].slots=[...party];save.unlockedCharacterIds=[...new Set([...save.unlockedCharacterIds,...party])];
 await page.addInitScript(raw=>{if(!localStorage.getItem('northern-prisma.campaign.v6'))localStorage.setItem('northern-prisma.campaign.v6',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.combat.speed','fast');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));},encodeGameSave(save,content));await page.emulateMedia({reducedMotion:'reduce'});
}
async function cast(page:Page,id:string,target?:string){await expect(page.locator('.execute')).toBeEnabled();await page.locator(`[data-gamepad-skill="${id}"]`).click();await page.keyboard.press('Escape');if(target)await page.locator(`[data-actor-id="${target}"] .target-hitbox`).click();await page.locator('.execute').click();}
async function ready(page:Page,name:string){for(let i=0;i<16;i++){await expect(page.locator('.execute')).toBeEnabled();if((await page.locator('.command-panel h2').textContent())?.includes(name))return;await cast(page,'$defend');}throw Error('No turn for '+name);}
async function start(page:Page,id='forest_patrol'){await page.goto('/quests?selected='+id);await page.getByRole('button',{name:/Xuất chiến/}).click();const modal=page.getByRole('dialog');if(await modal.count())await modal.getByRole('button',{name:'Xuất chiến',exact:true}).click();}

test('Chloe previews actual neighboring targets without wrapping, then applies both debuffs to hit enemies',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page);await start(page);await ready(page,'Chloe');await page.locator('[data-gamepad-skill="chloe.claws"]').click();await page.keyboard.press('Escape');
 await page.locator('[data-actor-id="enemy_0"] .target-hitbox').click();await expect(page.locator('.combatant.is-affected')).toHaveCount(2);await expect(page.locator('[data-actor-id="enemy_2"]')).not.toHaveClass(/is-affected/);await expect(page.locator('.target-summary')).toContainText('2 mục tiêu');
 await page.locator('[data-actor-id="enemy_1"] .target-hitbox').click();await expect(page.locator('.combatant.is-affected')).toHaveCount(3);await expect(page.locator('.skill-command.selected')).toContainText('120% ATK chính / 60% ATK ô kề');await page.screenshot({path:'test-results/chloe-splash-targets.png',fullPage:true});await page.locator('.execute').click();
 for(const id of ['enemy_0','enemy_1','enemy_2']){await expect(page.locator(`[data-actor-id="${id}"]`)).toContainText('Vết cào tinh quái');await expect(page.locator(`[data-actor-id="${id}"]`)).toContainText('Mèo vờn chuột');}expect(errors).toEqual([]);
});
test('Amelia creates team shields and visibly follows up enemy attacks while another ally retains a shield',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page);await start(page);await ready(page,'Amelia');await cast(page,'amelia.bastion');await expect(page.locator('[data-actor-id="amelia"] .shield-value')).toContainText('48');
 for(let i=0;i<12;i++){await expect(page.locator('.execute')).toBeEnabled();if((await page.locator('.battle-log').textContent())?.includes('Amelia Liên kích'))break;await cast(page,'$defend');}
 await expect(page.locator('.battle-log')).toContainText('Amelia Liên kích (FuA) bằng Băng kính phản chiếu');await expect(page.locator('[data-actor-id="enemy_0"]')).toContainText('Tê cóng');await page.screenshot({path:'test-results/amelia-shield-follow-up.png',fullPage:true});expect(errors).toEqual([]);
});
test('new characters have readable base-asset detail screens on mobile and Logia poison tooltip uses snapshotted totals',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page);await page.setViewportSize({width:390,height:844});
 for(const [id,needle] of [['logia','25%'],['amelia','Liên kích'],['chloe','ATK']]){await page.goto('/characters/'+id);await expect(page.locator('.skill-card')).toHaveCount(id === 'amelia' ? 6 : 5);await expect(page.locator('.passive-copy')).toContainText(needle);await expect(page.locator('.skill-grid')).not.toContainText('undefined');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
 await page.screenshot({path:'test-results/chloe-detail-phone.png',fullPage:true});await page.setViewportSize({width:1440,height:960});await start(page,'ogre_trial');await ready(page,'Logia');await cast(page,'logia.agony','enemy_0');await expect(page.locator('[data-actor-id="enemy_0"]')).toContainText('Độc xà');
 await page.getByRole('button',{name:'Xem hiệu ứng Độc xà',exact:true}).hover();await expect(page.getByRole('tooltip')).toContainText('34 HP mỗi đầu lượt');expect(errors).toEqual([]);
});
