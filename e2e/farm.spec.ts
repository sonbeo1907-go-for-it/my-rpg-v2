import {test,expect,type Page} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
import {normalizedArenaCampaign} from '../src/core/arena.js';
import {dungeonDay} from '../src/core/dungeon-rules.js';
const content:any=await loadContent(),now=new Date('2026-11-03T00:00:00Z');
test.setTimeout(90000);
async function seed(page:Page,{strong=false,quota=false,solo=false,fail=false}={}){
 let c=createGameSave(content);if(strong)c=normalizedArenaCampaign(content,c,c.party,{...content.pvpRules.default,normalization:{...content.pvpRules.default.normalization,storyUpgrades:false}});
 if(solo)c.party=['arthur',null,null,null];c.partyPresets[0].slots=[...c.party];c.sweepTickets=2;
 if(quota)c.dungeonDaily={day:dungeonDay(now),clears:{gold_mine:2}};
 await page.addInitScript(({raw,fail})=>{localStorage.setItem('northern-prisma.campaign.v7',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));localStorage.setItem('northern-prisma.combat.speed','fast');(window as any).__farmFail=fail;
  const native=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if((window as any).__farmFail&&key==='northern-prisma.profiles.v1'){const d=JSON.parse(value);if(d.entries?.some((e:any)=>JSON.parse(e.text).victories>0))throw Error('Lỗi ghi thử nghiệm');}return native.call(this,key,value);};
 },{raw:encodeGameSave(c,content),fail});await page.emulateMedia({reducedMotion:'reduce'});await page.clock.install({time:now});await page.clock.pauseAt(now);
}
async function saved(page:Page){return page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('northern-prisma.profiles.v1')!).entries[0].text));}
async function launch(page:Page,n:number,url='/quests?selected=goblin_forest_ambush&difficulty=very_easy'){
 await page.goto(url);await page.getByRole('button',{name:'Farm lặp lại',exact:true}).click();await page.getByLabel('Số lượt muốn chơi').fill(String(n));await page.getByRole('button',{name:new RegExp('Bắt đầu farm · '+n+' lượt')}).click();await expect(page).toHaveURL(/battle$/);
}
async function untilStopped(page:Page){for(let i=0;i<90;i++){await page.clock.runFor(2000);if(await page.locator('[data-farm-active="false"]').count())return;}throw Error('Farm did not stop');}
test('split deployment, bounded 999 config, responsive modal and manual entry remain available',async({page})=>{
 await seed(page);await page.goto('/quests?selected=goblin_forest_ambush');await expect(page.locator('.deployment-actions button')).toHaveCount(2);await page.getByRole('button',{name:'Farm lặp lại',exact:true}).click();
 const input=page.getByLabel('Số lượt muốn chơi');for(const n of ['0','1000','1.5']){await input.fill(n);await expect(page.getByRole('button',{name:/Bắt đầu farm/})).toBeDisabled();}
 await page.getByRole('button',{name:'999 lượt',exact:true}).click();await expect(input).toHaveValue('999');await expect(page.getByRole('button',{name:/Bắt đầu farm/})).toBeEnabled();
 for(const width of [1440,768,390]){await page.setViewportSize({width,height:900});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:'test-results/farm-modal-'+width+'.png',fullPage:true});}
 await page.getByRole('button',{name:'Hủy',exact:true}).click();await page.locator('.embark').click();await expect(page).toHaveURL(/battle$/);await expect(page.getByRole('button',{name:'Tự động: Tắt',exact:true})).toBeVisible();await expect(page.locator('.farm-session')).toHaveCount(0);
});
test('two real quests auto-farm, commit rewards/XP once, stop at requested count and keep original save party',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page);await launch(page,2);await untilStopped(page);await expect(page.locator('.farm-session')).toContainText('2 / 2 lượt');await expect(page.locator('.farm-session')).toContainText('2 thắng');const s=await saved(page);expect(s.victories).toBe(2);expect(s.party).toEqual(createGameSave(content).party);expect(s.claimedFirstClearRewards.filter((x:string)=>x==='goblin_forest_ambush')).toHaveLength(1);await page.clock.runFor(10000);expect((await saved(page)).victories).toBe(2);await page.screenshot({path:'test-results/farm-completed.png',fullPage:true});expect(errors).toEqual([]);
});
test('stop returns manual control and does not begin another run',async({page})=>{
 await seed(page,{strong:true});await launch(page,999);await expect(page.locator('[data-farm-active="true"]')).toBeVisible();await page.getByRole('button',{name:'Dừng farm',exact:true}).click();await expect(page.locator('[data-farm-active="false"]')).toBeVisible();await page.clock.runFor(5000);expect((await saved(page)).victories).toBeLessThanOrEqual(1);await expect(page.getByRole('button',{name:'Tự động: Tắt',exact:true})).toBeVisible();
});
test('dungeon stops at actual remaining quota and never spends sweep tickets',async({page})=>{
 await seed(page,{strong:true,quota:true});await launch(page,999,'/dungeon/gold_mine?selected=easy');await untilStopped(page);await expect(page.locator('.farm-session')).toContainText('1 / 999 lượt');await expect(page.locator('.farm-session')).toContainText('hết lượt');const s=await saved(page);expect(s.dungeonDaily.clears.gold_mine).toBe(3);expect(s.sweepTickets).toBe(2);expect(s.victories).toBe(1);
});
test('defeat halts repeat with no rewards',async({page})=>{
 await seed(page,{solo:true});await launch(page,999,'/quests?selected=ogre_trial&difficulty=very_hard');await untilStopped(page);await expect(page.locator('.farm-session')).toContainText('1 thua');expect((await saved(page)).victories).toBe(0);await expect(page.locator('.farm-total-rewards')).toHaveCount(0);
});
test('failed award save halts; manual retry commits only once without resuming repeat',async({page})=>{
 await seed(page,{strong:true,fail:true});await launch(page,2);await untilStopped(page);await expect(page.locator('.farm-session')).toContainText('chưa lưu');expect((await saved(page)).victories).toBe(0);await page.evaluate(()=>(window as any).__farmFail=false);await page.getByRole('button',{name:/Nhận thưởng/}).click();await expect(page.locator('.farm-session')).toContainText('1 thắng');await page.clock.runFor(10000);expect((await saved(page)).victories).toBe(1);await expect(page.locator('[data-farm-active="false"]')).toBeVisible();
});
