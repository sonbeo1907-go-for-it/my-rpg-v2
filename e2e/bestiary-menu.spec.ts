import {test,expect,type Page} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
import {beginTournament} from '../src/core/tournament-session.js';
import {legacyBestiary} from '../src/core/bestiary.js';
const c:any=await loadContent();
async function seed(page:Page,filled=false,override:any=null){const s=override??createGameSave(c);if(filled){s.bestiary=legacyBestiary({claimedFirstClearRewards:Object.keys(c.encounters)},c);}
 await page.addInitScript(raw=>{if(!sessionStorage.getItem('bestiary.fixture')){sessionStorage.setItem('bestiary.fixture','1');localStorage.setItem('northern-prisma.campaign.v7',raw);}sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));localStorage.setItem('northern-prisma.combat.speed','fast');},encodeGameSave(s,c));await page.emulateMedia({reducedMotion:'reduce'});
}
test('journal filters, context scaling and skill details work across desktop, tablet and phone',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page,true);await page.goto('/bestiary');await expect(page.getByRole('heading',{name:'Bách Khoa Quái Vật',exact:true})).toBeVisible();
 await page.getByRole('textbox',{name:'Tìm kẻ thù'}).fill('Bóng Đen Bám Đèn');await page.locator('.bestiary-rows button').click();await page.getByRole('spinbutton',{name:'Cấp tra cứu'}).fill('50');await expect(page.locator('.bestiary-stats').getByText('72',{exact:true})).toBeVisible();await page.locator('.bestiary-skills summary').first().click();await expect(page.locator('.bestiary-skills')).toContainText('140%');
 for(const [width,height]of [[1440,960],[768,1024],[390,844]]){await page.setViewportSize({width,height});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:'test-results/bestiary-'+width+'.png',fullPage:true});}
 await page.getByRole('button',{name:'Danh sách kẻ thù'}).click();await expect(page.getByRole('textbox',{name:'Tìm kẻ thù'})).toBeVisible();expect(errors).toEqual([]);
});
test('temporary exit retains the exact battle, discovery persists, explicit exit abandons it',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page);await page.goto('/quests?selected=forest_patrol');await page.getByRole('button',{name:/Xuất chiến/}).click();await expect(page).toHaveURL(/battle$/);await expect(page.locator('.execute')).toBeEnabled();
 const before=await page.locator('.combatant').allTextContents();await page.getByRole('button',{name:'Menu trận đấu'}).click();await expect(page.getByRole('dialog')).toContainText('Tạm thoát');await page.getByRole('button',{name:'Tạm thoát',exact:true}).click();await expect(page).toHaveURL(/home$/);await page.getByRole('link',{name:/Tiếp tục trận đang chơi/}).click();await expect(page.locator('.execute')).toBeEnabled();expect(await page.locator('.combatant').allTextContents()).toEqual(before);
 await page.getByRole('button',{name:'Menu trận đấu'}).click();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.keyboard.press('Escape');await page.getByRole('button',{name:'Thoát trận',exact:true}).click();await page.getByRole('button',{name:'Xác nhận thoát trận'}).click();await expect(page).toHaveURL(/quests/);await page.goto('/bestiary');await expect(page.locator('.bestiary-count')).toContainText('2 kẻ thù');await page.reload();await expect(page.locator('.bestiary-count')).toContainText('2 kẻ thù');expect(errors).toEqual([]);
});
test('training and trial party links return to their source, not the home screen',async({page})=>{
 await seed(page);
 for(const route of ['/chronicles/training','/chronicles/unrecorded/chimera?level=80']){
  await page.goto(route);const link=page.locator('a[href^="/party?back="]').first();await expect(link).toBeVisible();
  await link.click();await expect(page).toHaveURL(/party\?back=/);await page.getByRole('link',{name:'Trở về',exact:true}).click();await expect.poll(()=>new URL(page.url()).pathname+new URL(page.url()).search).toBe(route);
 }
});

test('Arena prevents temporary exit and explicit leave forfeits the match',async({page})=>{
 await seed(page);await page.goto('/arena/practice');await page.getByRole('button',{name:/Vào luyện tập/}).click();await expect(page).toHaveURL(/battle$/);await expect(page.locator('.execute')).toBeEnabled();
 await page.getByRole('button',{name:'Menu trận đấu'}).click();await expect(page.getByRole('button',{name:'Tạm thoát',exact:true})).toBeDisabled();await page.getByRole('button',{name:'Thoát trận',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('được tính là thua');await page.getByRole('button',{name:'Xác nhận thoát trận'}).click();await expect(page).toHaveURL(/arena$/);
 await page.goto('/battle');await expect(page.getByRole('heading',{name:'Thất bại',exact:true})).toBeVisible();await expect(page.locator('main')).toContainText('Xử thua');
});
test('academy temporary exit resumes its checkpoint and explicit exit records a defeat',async({page})=>{
 let s=createGameSave(c);s.tournaments.rulesAccepted=true;s=beginTournament(s,c,{revision:0,seed:'menu-ui-academy'});await seed(page,false,s);await page.goto('/chronicles/academy');await page.getByRole('button',{name:'Chuẩn bị tỷ thí',exact:true}).click();await page.getByRole('button',{name:'Bắt đầu tỷ thí',exact:true}).click();await expect(page.locator('.execute')).toBeEnabled();
 await page.getByRole('button',{name:'Menu trận đấu'}).click();await page.getByRole('button',{name:'Tạm thoát',exact:true}).click();await expect(page).toHaveURL(/home$/);await page.getByRole('link',{name:/Tiếp tục trận tự thí/}).click();await page.getByRole('button',{name:'Tiếp tục trận tỷ thí',exact:true}).click();await expect(page.locator('.execute')).toBeEnabled();await page.getByRole('button',{name:'Menu trận đấu'}).click();await page.getByRole('button',{name:'Thoát trận',exact:true}).click();await page.getByRole('button',{name:'Xác nhận thoát trận'}).click();await expect(page.getByRole('button',{name:'Xem kết quả chờ xác nhận',exact:true})).toBeVisible();
});
