import {test,expect,type Page} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
import {createBattle} from '../src/core/battle.js';
import {createStoryRun,advanceStoryWave,isFinalStoryWave} from '../src/core/story-waves.js';
import {completeStoryEvent} from '../src/core/progression.js';
import {claimBattleReward} from '../src/core/economy.js';
const content:any=await loadContent();
async function seed(page:Page,{stories=0,missing=false,strong=false}={}){
 let c=createGameSave(content);c.party=['arthur','iris','fiona','takeshi'];c.partyPresets[0].slots=[...c.party];
 for(const story of ['iris','fiona','takeshi'].slice(0,stories))for(const id of content.travelerStories[story].chapters){let b;if(content.encounters[id].waves){const run=createStoryRun(content,c,id,()=>.99);while(!isFinalStoryWave(run)){run.battle.outcome='victory';advanceStoryWave(content,run);}b=run.battle;}else b=createBattle(content,c,id);b.outcome='victory';c=claimBattleReward(c,b,content);}
 if(missing)c.party=['arthur','iris','elaine','garrek'];else if(strong)c.party=['arthur','iris','elaine','takeshi'];
 if(strong){completeStoryEvent(c,content,'arthur_completed_sword_training');for(const id of c.party){c.extraGearSlots[id]=3;c.equipment[id]=[];for(let i=0;i<6;i++){const item={id:'gear_'+(c.gear.length+1),typeId:'t3_focused',stats:{[id==='arthur'||id==='takeshi'?'attack':'magic']:5}};c.gear.push(item);c.equipment[id].push(item.id);}}c.gacha.totalPulls=c.gear.length;}
 c.partyPresets[0].slots=[...c.party];
 await page.addInitScript(raw=>{if(!localStorage.getItem('northern-prisma.campaign.v6'))localStorage.setItem('northern-prisma.campaign.v6',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));localStorage.setItem('northern-prisma.combat.speed','fast');},encodeGameSave(c,content));await page.emulateMedia({reducedMotion:'reduce'});
}
async function state(page:Page){return page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('northern-prisma.profiles.v1')!).entries[0].text));}

test('Takeshi chapters show all bandit types and three-wave scouting, require Takeshi and fit phone width',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page,{missing:true});await page.goto('/stories/takeshi');await expect(page.locator('.quest-card')).toHaveCount(3);await expect(page.locator('.quest-enemies>div')).toHaveCount(4);await expect(page.locator('.quest-details')).toContainText('Bắt buộc có Takeshi');await expect(page.locator('.embark')).toBeDisabled();
 await page.locator('[data-encounter-id=takeshi_story_wanderer]').click();await expect(page.locator('.story-wave-scouting section')).toHaveCount(3);for(const type of ['Tiên phong','Xạ thủ','Lực lưỡng','Pháp sư','Tướng cướp'])await expect(page.locator('.quest-details')).toContainText(type);
 await page.locator('[data-encounter-id=takeshi_story_horizon]').click();await expect(page.locator('.quest-details')).toContainText('Ryoga');await expect(page.locator('.quest-illustration')).toContainText('Tâm nhãn kiếm sĩ');await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/takeshi-story-phone.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);expect(errors).toEqual([]);
});

test('locked epilogue has a new sword cover, cross-story checklist and no departure even by direct URL; desktop/mobile pagination works',async({page,request})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page,{stories:2});await page.goto('/stories?page=2');await expect(page.locator('.story-book')).toHaveCount(2);await expect(page.locator('.story-book-epilogue')).toContainText('2/3 hành trình');const response=await request.get('/art/story-epilogue.svg');expect(response.ok()).toBe(true);expect(await response.text()).toContain('crescent blade');await page.screenshot({path:'test-results/epilogue-cover.png',fullPage:true});
 await page.locator('.story-book-epilogue').click();await expect(page.locator('.story-prerequisites li')).toHaveCount(3);await expect(page.locator('.story-prerequisites')).toContainText('Chưa hoàn thành');await expect(page.locator('.embark')).toHaveCount(0);await expect(page.locator('.quest-enemies')).toHaveCount(0);await page.reload();await expect(page.locator('.embark')).toHaveCount(0);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/epilogue-locked-phone.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.goto('/stories?page=4');await expect(page.locator('.story-book')).toContainText('Một hành trình kết thúc');expect(errors).toEqual([]);
});

test('unlocked epilogue requires Arthur, runs all three phases with resonance, then persists both upgrades once',async({page})=>{
 test.setTimeout(150000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page,{stories:3,strong:true});const before=await (async()=>{await page.goto('/stories/epilogue');return state(page);})();await expect(page.locator('.story-prerequisites')).toHaveCount(0);await expect(page.locator('.quest-details')).toContainText('Hắc ảnh Arthur');await expect(page.locator('.quest-details')).toContainText('3 giai đoạn');await expect(page.locator('.quest-illustration')).toContainText('Thiểm Quang Kiếm');await page.locator('.embark').click();await page.getByRole('dialog').getByRole('button',{name:'Xuất chiến',exact:true}).click();
 const phases=new Set<string>();
 for(let step=0;step<180;step++){
  phases.add((await page.locator('.boss-phase-panel .eyebrow').innerText()).trim());
  if(await page.locator('.battle-outcome').filter({hasText:/đã lưu|gục ngã/}).count())break;
  const execute=page.locator('.execute');if(!await execute.count()){await page.waitForTimeout(100);continue;}await expect(execute).toBeEnabled();const heading=await page.locator('.command-panel h2').innerText();let skill='$defend',target='';
  if(heading.includes('Arthur')){skill=await page.locator('[data-gamepad-skill="arthur.ogres_bane_controlled"][aria-disabled=false]').count()?'arthur.ogres_bane_controlled':'arthur.light_slash';target='enemy_0';}
  else if(heading.includes('Takeshi')){const card=await page.locator('[data-actor-id=takeshi]').innerText();skill=/Sơ hở:\s*[23]/.test(card)?'takeshi.riposte':'takeshi.stance';if(skill==='takeshi.riposte')target='enemy_0';}
  else if(heading.includes('Iris')){const arthur=await page.locator('[data-actor-id=arthur] .status-list').innerText();skill=arthur.includes('Hiệu chỉnh')?'iris.formula':'iris.calibrate';target='arthur';}
  else if(heading.includes('Elaine'))skill='elaine.sanctuary';
  const button=page.locator(`[data-gamepad-skill="${skill}"][aria-disabled=false]`);if(await button.count()){await button.click();if(target)await page.locator(`[data-actor-id="${target}"] .target-hitbox`).click();}else await page.locator('[data-gamepad-skill="$defend"]').click();
  await page.keyboard.press('Escape');await execute.click();await page.waitForTimeout(110);
 }
 await expect(page.locator('.battle-outcome')).toContainText('đã lưu');expect(phases.has('GIAI ĐOẠN 1 / 3')).toBe(true);expect(phases.has('GIAI ĐOẠN 2 / 3')).toBe(true);expect(phases.has('GIAI ĐOẠN 3 / 3')).toBe(true);await expect(page.locator('.enemy-grid .resource-value')).toContainText('Cộng hưởng');
 const after=await state(page);expect(after.coins).toBe(before.coins+1000);expect(after.characters.arthur.upgradeIds).toContain('arthur.complete_control');expect(after.claimedFirstClearRewards).toContain('epilogue_unfinished');await page.screenshot({path:'test-results/epilogue-victory.png',fullPage:true});
 await page.getByRole('link',{name:/Trở về chọn trận/}).click();await page.goto('/characters/arthur');await expect(page.locator('main')).toContainText('Kiểm soát hoàn toàn');await expect(page.locator('main')).toContainText('Thiểm Quang Kiếm');expect(errors).toEqual([]);
});
