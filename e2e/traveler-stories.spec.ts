import {test,expect,type Page} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
const content:any=await loadContent();
async function seed(page:Page,options:{missingIris?:boolean;cleared?:boolean;strong?:boolean}={}){
 const c=createGameSave(content);c.unlockedCharacterIds=Object.keys(content.characters);
 if(options.cleared)c.claimedFirstClearRewards=['iris_story_growth','iris_story_pride'];
 if(options.missingIris)c.party=['arthur','elaine','garrek','fiona'];
 if(options.strong){c.party=['lisbeth','iris','aurora','elaine'];c.extraGearSlots.lisbeth=3;c.gacha.totalPulls=6;c.gear=Array.from({length:6},(_,i)=>({id:`gear_${i+1}`,typeId:'t3_focused',stats:{magic:5}}));c.equipment.lisbeth=c.gear.map((g:any)=>g.id);}
 c.partyPresets[0].slots=[...c.party];
 await page.addInitScript(raw=>{if(!localStorage.getItem('northern-prisma.campaign.v4'))localStorage.setItem('northern-prisma.campaign.v4',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({controlMode:'mouse',musicEnabled:false,musicVolume:.3,rumble:false,showHints:true}));},encodeGameSave(c,content));
 await page.emulateMedia({reducedMotion:'reduce'});
}
const state=(page:Page)=>page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('northern-prisma.profiles.v1')!).entries[0].text));
test('book shelf opens from Tavern, serves original SVG covers and paginates one book at a time on mobile',async({page,request})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await seed(page);await page.goto('/home');await page.getByRole('link',{name:/Câu chuyện lữ hành/}).click();await expect(page.locator('.story-book')).toHaveCount(3);
 for(const id of ['iris','takeshi','fiona']){const response=await request.get(`/art/story-${id}.svg`);expect(response.ok()).toBe(true);expect(await response.text()).toContain('<svg');}
 await page.screenshot({path:'test-results/traveler-books-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await expect(page.locator('.story-book')).toHaveCount(1);await expect(page.locator('.story-book')).toContainText('Cô phù thủy vụng về');
 await page.getByRole('button',{name:'Trang sau',exact:true}).click();await expect(page.locator('.story-book')).toContainText('Thanh gươm vượt biển');await page.reload();await expect(page.locator('.story-book')).toContainText('Thanh gươm vượt biển');
 await page.getByRole('button',{name:'Trang sau',exact:true}).click();await expect(page.locator('.story-book')).toContainText('Cội nguồn của sự sống');await page.screenshot({path:'test-results/traveler-books-phone.png',fullPage:true});
 await page.locator('.story-book').click();await expect(page.locator('.quest-card')).toHaveCount(3);await expect(page.locator('.quest-illustration')).toContainText('Eins');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);expect(errors).toEqual([]);
});
test('Iris chapter gates cannot be bypassed by URL; final PvP preview requires Iris and exposes all four roles',async({page})=>{
 await seed(page,{cleared:true,missingIris:true});await page.goto('/stories/iris?selected=iris_story_revenge');await expect(page.locator('.quest-card')).toHaveCount(3);await expect(page.locator('.quest-enemies')).toContainText('Keith');await expect(page.locator('.quest-enemies')).toContainText('Mac');await expect(page.locator('.quest-enemies')).toContainText('Sunny');await expect(page.locator('.quest-enemies')).toContainText('Amy');await expect(page.locator('.quest-details')).toContainText('Bắt buộc có Iris');await expect(page.locator('.embark')).toBeDisabled();await page.screenshot({path:'test-results/traveler-iris-pvp.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/traveler-iris-phone.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('first Iris battle grants a saved gear slot once and returns to the story; later chapters remain locked initially',async({page})=>{
 test.setTimeout(90000);await seed(page,{strong:true});await page.goto('/stories/iris?selected=iris_story_revenge');await expect(page.locator('.embark')).toBeDisabled();await expect(page.locator('.quest-details')).toContainText('Hoàn thành chương trước');
 await page.locator('[data-encounter-id=iris_story_growth]').click();await expect(page.locator('.quest-enemies>div')).toHaveCount(3);await page.locator('.embark').click();await page.getByRole('dialog').getByRole('button',{name:'Xuất chiến',exact:true}).click();await expect(page).toHaveURL(/battle$/);
 for(let i=0;i<45;i++){
  if((await page.locator('.battle-outcome').count())>0)break;
  const execute=page.locator('.execute');await expect(execute).toBeEnabled({timeout:10000});
  const heading=await page.locator('.command-panel h2').innerText();let id='$attack';
  if(heading.includes('Lisbeth')){for(const candidate of ['lisbeth.judgment','lisbeth.lance'])if(await page.locator(`[data-gamepad-skill="${candidate}"][aria-disabled=false]`).count()){id=candidate;break;}}
  else if(heading.includes('Iris'))id='iris.formula';else if(heading.includes('Aurora'))id='aurora.amplify';else if(heading.includes('Elaine'))id='$defend';
  const button=page.locator(`[data-gamepad-skill="${id}"][aria-disabled=false]`);if(await button.count())await button.click();else await page.locator('[data-gamepad-skill="$attack"]').click();
  if(['iris.formula','aurora.amplify'].includes(id)&&await button.count()){await page.locator('[data-actor-id=lisbeth] .target-hitbox').click();await page.keyboard.press('Escape');}
  await execute.click();await page.waitForTimeout(180);
 }
 await expect(page.locator('.battle-outcome')).toContainText('Chiến thắng');await expect.poll(async()=>(await state(page)).extraGearSlots.iris).toBe(1);await expect.poll(async()=>(await state(page)).claimedFirstClearRewards).toContain('iris_story_growth');
 await page.getByRole('link',{name:/Trở về chọn trận/}).click();await expect(page).toHaveURL(/stories\/iris\?selected=iris_story_growth/);await expect(page.locator('.story-board-heading')).toContainText('4/6');await page.reload();await expect(page.locator('.story-board-heading')).toContainText('4/6');await expect(page.locator('.quest-illustration')).toContainText('Đã nhận');
});
