import {test,expect,type Page} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
import {claimBattleReward} from '../src/core/economy.js';
const content:any=await loadContent();
async function seed(page:Page,{stories=false,recipes=false}={}){
 let c=createGameSave(content);
 if(stories)for(const story of Object.values(content.travelerStories).filter((s:any)=>['iris','takeshi','fiona'].includes(s.id)) as any[])for(const id of story.chapters){const e=content.encounters[id];c=claimBattleReward(c,{encounterId:id,outcome:'victory',rewardRandom:()=>0,actors:(e.requiredPartyIds??[]).map((id:string)=>({id,team:'party'})),...(e.waves?{storyWave:{waveIndex:e.waves.length-1,totalWaves:e.waves.length}}:{})},content);}
 if(recipes)for(const e of Object.values(content.encounters).filter((e:any)=>e.category==='bounty') as any[])c=claimBattleReward(c,{encounterId:e.id,outcome:'victory',rewardRandom:()=>0},content);
 Object.assign(c,{coins:100000,prismaFragments:10000});c.gear=[1,2,3].map(i=>({id:'gear_'+i,typeId:'t3_focused',stats:{attack:5}}));c.gacha.totalPulls=3;
 await page.addInitScript(raw=>{if(!localStorage.getItem('northern-prisma.campaign.v6'))localStorage.setItem('northern-prisma.campaign.v6',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));},encodeGameSave(c,content));await page.emulateMedia({reducedMotion:'reduce'});
}
test('locked Truy Nã is a third illustration tab, hides boss details and fits mobile',async({page,request})=>{
 await seed(page);await page.goto('/quests?tab=bounty&selected=bounty_black_script_cleric');await expect(page.locator('.quest-category-tabs button')).toHaveCount(3);await expect(page.locator('.quest-locked')).toContainText('Iris, Takeshi và Fiona');await expect(page.locator('.quest-card,.embark,.quest-enemies')).toHaveCount(0);await expect(page.locator('main')).not.toContainText('Giáo Sĩ Hắc Văn');
 await expect(page.locator('.quest-background')).toHaveCSS('background-image',/quest-bounty.svg/);expect((await request.get('/art/quest-bounty.svg')).ok()).toBe(true);await page.screenshot({path:'test-results/bounty-locked-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);for(const name of ['Thảo phạt','Hiểm Ác','Truy Nã'])await expect(page.getByRole('button',{name,exact:true})).toBeVisible();await page.screenshot({path:'test-results/bounty-locked-phone.png',fullPage:true});
});
test('story completion reveals five bounty quests, scoped search, source recipes and real battle entry',async({page})=>{
 await seed(page,{stories:true});await page.goto('/quests?tab=bounty');await expect(page.locator('.quest-card')).toHaveCount(5);await expect(page.locator('.quest-illustration')).toContainText('Công thức Giáp Lót Phản Chấn');await expect(page.locator('.quest-rewards')).toContainText('15 Vụn Prisma');
 await page.getByLabel('Tìm nhiệm vụ',{exact:true}).fill('Lầy Muối');await expect(page.locator('.quest-card')).toHaveCount(1);await expect(page.locator('.quest-details')).toContainText('Lôi, Thổ');await page.screenshot({path:'test-results/bounty-unlocked-desktop.png',fullPage:true});
 await page.getByRole('button',{name:/Xuất chiến/}).click();await expect(page).toHaveURL(/battle$/);await expect(page.locator('[data-actor-id=enemy_0]')).toContainText('Phù Thủy Lầy Muối');
});
test('22 effect recipes paginate, locked recipe links to its boss and mobile uses six per page',async({page})=>{
 await seed(page,{stories:true});await page.goto('/blacksmith?tab=effects');await expect(page.locator('.t4-recipe')).toHaveCount(12);await expect(page.locator('.gear-pagination')).toContainText('22 món');await page.getByRole('button',{name:'Trang sau',exact:true}).click();await expect(page.locator('.t4-recipe')).toHaveCount(10);await page.getByRole('button',{name:/Nhẫn Thợ Săn/}).click();await expect(page.getByRole('button',{name:'Rèn Gear Siêu Cấp',exact:true})).toBeDisabled();await expect(page.getByRole('link',{name:/Thắng Du Kiếm Khách Áo Tro/})).toHaveAttribute('href','/quests?tab=bounty&selected=bounty_ash_cloaked_swordsman');await page.screenshot({path:'test-results/bounty-recipe-page2.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await expect(page.locator('.t4-recipe')).toHaveCount(6);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:'test-results/bounty-recipes-phone.png',fullPage:true});
});
test('unlocked bounty recipe can be forged, paid once and persisted through reload',async({page})=>{
 await seed(page,{stories:true,recipes:true});await page.goto('/blacksmith?tab=effects');await page.getByRole('button',{name:'Trang sau',exact:true}).click();await page.getByRole('button',{name:/Nhẫn Thợ Săn/}).click();await page.getByRole('button',{name:'Chọn nguyên liệu Gear T3',exact:true}).click();await page.getByRole('dialog').locator('.gear-card').first().click();await page.getByRole('button',{name:'Rèn Gear Siêu Cấp',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Xác nhận chế tạo',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
 const state=()=>page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('northern-prisma.profiles.v1')!).entries[0].text));await expect.poll(async()=>{const raw=await state();return (raw.campaign??raw).gear.some((g:any)=>g.effectId==='hunter_ring');}).toBe(true);await page.goto('/inventory');await expect(page.locator('.gear-card')).toContainText(['Nhẫn Thợ Săn']);await page.reload();await expect(page.locator('.gear-card').filter({hasText:'Nhẫn Thợ Săn'})).toHaveCount(1);
});
