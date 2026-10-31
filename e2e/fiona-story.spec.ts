import {test,expect,type Page} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
import {completeStoryEvent} from '../src/core/progression.js';
const content:any=await loadContent();
async function seed(page:Page,{cleared=0,missing=false,strong=false}={}) {
 const c=createGameSave(content);c.party=missing?['arthur','iris','elaine','garrek']:['fiona','iris','elaine','garrek'];
 c.claimedFirstClearRewards=content.travelerStories.fiona.chapters.slice(0,cleared);
 for(const id of c.claimedFirstClearRewards)for(const reward of content.encounters[id].firstClearRewards)if(reward.type==='upgrade')completeStoryEvent(c,content,content.upgrades[reward.upgradeId].requires.storyFlag);
 if(strong){c.extraGearSlots.fiona=3;c.gacha.totalPulls=6;c.gear=Array.from({length:6},(_,i)=>({id:'gear_'+(i+1),typeId:'t3_focused',stats:{magic:5}}));c.equipment.fiona=c.gear.map((g:any)=>g.id);}
 c.partyPresets[0].slots=[...c.party];
 await page.addInitScript(raw=>{if(!localStorage.getItem('northern-prisma.campaign.v4'))localStorage.setItem('northern-prisma.campaign.v4',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({controlMode:'mouse',musicEnabled:false,showHints:true}));},encodeGameSave(c,content));await page.emulateMedia({reducedMotion:'reduce'});
}
test('Fiona story previews all waves, sequential gates, meaningful upgrade rewards and participation on desktop/mobile',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page,{missing:true});await page.goto('/stories/fiona');await expect(page.locator('.quest-card')).toHaveCount(3);await expect(page.locator('.story-wave-scouting section')).toHaveCount(3);await expect(page.locator('.quest-illustration')).toContainText('Khúc xạ hoàn thiện');await expect(page.locator('.quest-details')).toContainText('Bắt buộc có Fiona');await expect(page.locator('.embark')).toBeDisabled();
 await page.locator('[data-encounter-id=fiona_story_drei]').click();await expect(page.locator('.quest-enemies')).toContainText('Vua Chằn');await expect(page.locator('.quest-enemies')).toContainText('2 giai đoạn');await expect(page.locator('.embark')).toBeDisabled();await expect(page.locator('.quest-illustration')).toContainText('Tia sáng le lói');
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/fiona-story-mobile.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);expect(errors).toEqual([]);
});
test('Eins confirmation includes scouting and combat moves through all three waves before saving one chapter reward',async({page})=>{
 test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page,{strong:true});await page.goto('/stories/fiona');await page.locator('.embark').click();await expect(page.getByRole('dialog').locator('.story-wave-scouting section')).toHaveCount(3);await page.getByRole('dialog').getByRole('button',{name:'Xuất chiến',exact:true}).click();await expect(page.getByRole('region',{name:'Tiến độ chương truyện'})).toContainText('Đợt 1/3');
 const seen=new Set<string>();
 for(let i=0;i<160;i++) {
  if(await page.locator('.battle-outcome').filter({hasText:/đã lưu/}).count())break;
  if(await page.getByRole('region',{name:'Tiến độ chương truyện'}).count()){const progress=await page.getByRole('region',{name:'Tiến độ chương truyện'}).innerText();seen.add(progress.match(/Đợt \d\/3/)?.[0]??'');}
  const execute=page.locator('.execute');if(!await execute.count()){await page.waitForTimeout(100);continue;}await expect(execute).toBeEnabled();
  const heading=await page.locator('.command-panel h2').innerText();let skill='$attack';
  if(heading.includes('Fiona')){
   const marked=await page.locator('.enemy-grid .status-list').filter({hasText:'Prisma'}).count();
   skill=marked?'fiona.collapse':'fiona.refraction';
  }else if(heading.includes('Elaine'))skill='elaine.sanctuary';else if(heading.includes('Iris'))skill='iris.formula';else if(heading.includes('Garrek'))skill='garrek.fortress';
  const btn=page.locator(`[data-gamepad-skill="${skill}"][aria-disabled=false]`);if(await btn.count())await btn.click();else await page.locator('[data-gamepad-skill="$attack"]').click();
  if(skill==='iris.formula'&&await btn.count())await page.locator('[data-actor-id=fiona] .target-hitbox').click();
  await execute.click();await page.waitForTimeout(110);
 }
 await expect(page.locator('.battle-outcome')).toContainText('đã lưu');expect(seen.has('Đợt 2/3')).toBe(true);expect(seen.has('Đợt 3/3')).toBe(true);
 const state=await page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('northern-prisma.profiles.v1')!).entries[0].text));expect(state.claimedFirstClearRewards).toContain('fiona_story_eins');expect(state.characters.fiona.upgradeIds).toContain('fiona.complete_refraction');expect(state.victories).toBe(1);expect(state.coins).toBe(50);
 await page.getByRole('link',{name:/Trở về chọn trận/}).click();await expect(page).toHaveURL(/stories\/fiona\?selected=fiona_story_eins/);expect(errors).toEqual([]);
});
test('Drei shows the ordinary two-phase boss UI without suppression and unlocked passive copy is readable',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page,{cleared:2});await page.goto('/stories/fiona?selected=fiona_story_drei');await page.locator('.embark').click();await page.getByRole('dialog').getByRole('button',{name:'Xuất chiến',exact:true}).click();await expect(page.locator('.boss-phase-panel')).toContainText('GIAI ĐOẠN 1 / 2');await expect(page.locator('.boss-phase-panel')).not.toContainText('Kìm hãm');await expect(page.locator('.boss-phase-panel')).toContainText('1 hành động/lượt');await page.screenshot({path:'test-results/fiona-ogre-king.png',fullPage:true});expect(errors).toEqual([]);
});
