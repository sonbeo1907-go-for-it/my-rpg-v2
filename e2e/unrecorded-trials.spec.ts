import {writeFile} from 'node:fs/promises';
import {test,expect} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
const content:any=await loadContent();
test.beforeEach(async({page})=>{
 const save=createGameSave(content);
 await page.addInitScript(raw=>{if(!localStorage.getItem('northern-prisma.campaign.v7'))localStorage.setItem('northern-prisma.campaign.v7',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));},encodeGameSave(save,content));
});
test('Quest entry opens the condition builder, score/rewards reconcile and deployment preserves immutable selection',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/quests?tab=trial');await expect(page.locator('.quest-card')).toHaveCount(3);await expect(page.locator('.deployment-actions')).toContainText('Đi vào');await expect(page.locator('.deployment-actions')).not.toContainText('Farm');
 await page.locator('.deployment-actions a').click();await expect(page).toHaveURL(/unrecorded\/chimera/);await expect(page.locator('h1')).toHaveText('Khúc Ca Ngoài Sử Sách');
 await page.getByRole('button',{name:'Cấp 90'}).click();await expect(page.getByRole('button',{name:'Cấp 90'})).toHaveAttribute('aria-pressed','true');
 for(const name of ['Sinh lực dị thường','Sức mạnh trỗi dậy','Thân thể kiên cố','Hành trang hao hụt','Sức lực suy tàn','Vết thương từ quá khứ']){const radio=page.getByRole('radio',{name:name+' · Mức 3',exact:true});await radio.click();await expect(radio).toHaveAttribute('aria-checked','true');}
 await expect(page.locator('.trial-score strong')).toHaveText('24');await expect(page.locator('.trial-reward')).toContainText('30');
 await page.screenshot({path:'test-results/song-builder-desktop.png',fullPage:true});
 await writeFile('test-results/song-inspect.html',await page.evaluate(()=>{const clone=document.documentElement.cloneNode(true) as HTMLElement;clone.querySelectorAll('script').forEach(s=>s.remove());const base=document.createElement('base');base.href=location.origin+'/';clone.querySelector('head')!.prepend(base);return '<!DOCTYPE html>'+clone.outerHTML;}));
 await page.getByRole('button',{name:'Bắt đầu thử thách',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('24/33');await expect(page.getByRole('dialog')).toContainText('30 Pure Prisma');
 await page.getByRole('dialog').getByRole('button',{name:'Chưa sẵn sàng'}).click();
 await page.getByRole('button',{name:'Bỏ các điều kiện'}).click();await expect(page.locator('.trial-score strong')).toHaveText('0');
 await page.getByRole('button',{name:'Bắt đầu thử thách',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Đi vào',exact:true}).click();await expect(page).toHaveURL(/\/battle/);await expect(page.locator('.trial-combat-notice')).toContainText('0 điểm thử thách');await expect(page.locator('.trial-combat-notice')).toContainText('3 vòng');
 expect(errors).toEqual([]);
});
test('all three stages have loaded original SVGs, specific tiers and no horizontal overflow at desktop/tablet/mobile',async({page})=>{
 for(const id of ['chimera','ego','calamity']){
  await page.goto('/chronicles/unrecorded/'+id);await expect(page.locator('.trial-intro img')).toBeVisible();expect(await page.locator('.trial-intro img').evaluate((img:any)=>img.complete&&img.naturalWidth>0)).toBe(true);
  await page.getByRole('button',{name:'Đặc trưng siêu trùm'}).click();await expect(page.locator('.trial-condition')).toHaveCount(3);
  await page.locator('.trial-condition').first().getByRole('radio').last().click();await expect(page.locator('.trial-score strong')).toHaveText('3');
  for(const width of [1440,768,390]){await page.setViewportSize({width,height:960});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:`test-results/song-${id}-${width}.png`,fullPage:true});}
 }
});
test('daily quota and best records are displayed from the saved ledger; opening/resetting conditions grants nothing',async({page})=>{
 await page.goto('/chronicles/unrecorded/ego?level=80&adapt=3');await expect(page.locator('.trial-score strong')).toHaveText('7');
 await page.locator('.trial-scout summary').click();await expect(page.locator('.trial-scout')).toContainText('Bản Ngã Tiến Hóa');await expect(page.locator('.trial-summary')).toContainText('Còn 30/30');
 await page.getByRole('button',{name:'Bỏ các điều kiện'}).click();await expect(page.locator('.trial-score strong')).toHaveText('0');await expect(page.locator('.trial-summary')).toContainText('Còn 30/30');
});

test('legacy trial records unlock Remulia and show character recovery copy',async({page})=>{
 const save=createGameSave(content);save.unrecordedLedger.best={song_chimera:22,song_ego:12,song_calamity:12};
 await page.addInitScript(raw=>{localStorage.setItem('northern-prisma.campaign.v7',raw);},encodeGameSave(save,content));
 await page.goto('/chronicles/unrecorded/ego');
 await expect(page.locator('.trial-milestones')).toContainText('3/3');await expect(page.locator('.trial-milestones')).toContainText('Đã mở');
 await page.goto('/characters?ownership=owned');await page.locator('a[href^="/characters/remulia?"]').click();await expect(page.locator('h1')).toHaveText('Remulia');
 await page.getByRole('link',{name:'Kỹ Năng',exact:true}).click();await expect(page.locator('.character-tab-panel')).toContainText('10');await expect(page.locator('.character-tab-panel')).toContainText('Chung Khúc');
 for(const width of [1440,768,390]){await page.setViewportSize({width,height:960});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:`test-results/remulia-skills-${width}.png`,fullPage:true});}
});

test('mechanic warning remains visible with Battle Logs disabled',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse',battleLogs:false})));await page.goto('/chronicles/unrecorded/ego');
 await page.getByRole('button',{name:'Bắt đầu thử thách',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Đi vào',exact:true}).click();await expect(page).toHaveURL(/\/battle/);
 await expect(page.locator('.trial-mechanic-upcoming')).toContainText('Đổi điểm yếu và kháng ở cuối vòng 5');await page.screenshot({path:'test-results/remulia-warning-battle.png',fullPage:true});
});
