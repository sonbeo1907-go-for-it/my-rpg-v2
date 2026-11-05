import {writeFile} from 'node:fs/promises';
import {test,expect,type Page} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
import {rotationSchedule} from '../src/core/rate-up.js';
const c:any=await loadContent();
const thursday=new Date('2026-11-05T05:00:00Z'),sunday=new Date('2026-11-08T05:00:00Z');
async function seed(page:Page,now=thursday,prisma=20){await page.clock.setFixedTime(now);const s=createGameSave(c);s.prisma=prisma;s.coins=10000;await page.addInitScript(raw=>{localStorage.setItem('northern-prisma.campaign.v7',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));},encodeGameSave(s,c));}
test('weekday faction artwork and exact odds are readable at desktop, tablet and phone',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page);await page.goto('/recruitment');const b=rotationSchedule(c,thursday).banners[0];
 await expect(page.locator('[data-active-banner]')).toHaveAttribute('data-active-banner',b.id);await expect(page.locator('.rateup-featured a')).toHaveCount(3);await expect(page.locator('.banner-card')).toHaveCount(2);await expect(page.locator('.rateup-terms')).toContainText('Mỗi banner có pity riêng');await expect(page.locator('.rateup-terms')).toContainText('đặt lại về 0');
 await page.getByText('Tỷ lệ & đồng đội',{exact:true}).click();await expect(page.locator('.rateup-odds')).toContainText('1,25%');await expect(page.locator('.rateup-odds')).toContainText('0,625%');
 for(const width of [1440,768,390]){await page.setViewportSize({width,height:960});await page.locator('.rateup-layout').scrollIntoViewIfNeeded();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);if(width===390){const sidebar=await page.locator('.banner-sidebar').boundingBox(),layout=await page.locator('.rateup-layout').boundingBox();expect(Math.abs(sidebar!.width-layout!.width)).toBeLessThan(2);}await page.screenshot({path:'test-results/rateup-'+width+'.png',fullPage:true});}
 expect(errors).toEqual([]);let html=await page.content();html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace('<head>','<head><base href="'+new URL(page.url()).origin+'">');await writeFile('out/rateup-inspect.html',html);
});
test('Tavern opens the displayed faction banner and Sunday has two independently selectable invitations',async({page})=>{
 await seed(page,sunday);await page.goto('/home');const banners=rotationSchedule(c,sunday).banners;
 await expect(page.locator('.home-rateup-slide')).toHaveCount(2);await page.locator('.carousel-dot').nth(1).click();await expect(page.locator('.carousel-dot').nth(1)).toHaveAttribute('aria-current','true');await expect(page.locator('.home-rateup-controls')).not.toContainText('2 / 2');await expect(page.locator('.home-rateup-slide').nth(1)).toHaveAttribute('aria-hidden','false');
 await page.locator('.home-rateup-slide').nth(1).click();await expect(page.locator('[data-active-banner]')).toHaveAttribute('data-active-banner',banners[1].id);await expect(page.locator('.banner-card')).toHaveCount(3);
 await page.screenshot({path:'test-results/rateup-sunday.png',fullPage:true});
});
test('Sunday invitation slides after ten seconds and can be paused without changing navigation',async({page})=>{
 await page.clock.install({time:sunday});await seed(page,sunday);await page.goto('/home');await expect(page.locator('.home-rateup-slide').first()).toHaveAttribute('aria-hidden','false');
 await page.clock.runFor(10020);await expect(page.locator('.home-rateup-slide').nth(1)).toHaveAttribute('aria-hidden','false');
 await page.getByRole('button',{name:'Tạm dừng chuyển banner tự động'}).click();await page.mouse.move(900,500);await page.locator('body').click({position:{x:900,y:500}});await page.clock.runFor(20000);await expect(page.locator('.home-rateup-slide').nth(1)).toHaveAttribute('aria-hidden','false');
 await page.screenshot({path:'test-results/rateup-tavern-sunday.png'});
});
test('roll commits the selected banner history and uses the rate-up pity lane, results survive reload',async({page})=>{
 await seed(page);await page.goto('/recruitment');const b=rotationSchedule(c,thursday).banners[0];await page.getByRole('button',{name:'Chiêu mộ 1 lần'}).click();await expect(page.getByRole('button',{name:'Bỏ qua → Kết quả'})).toBeVisible();await page.getByRole('button',{name:'Bỏ qua → Kết quả'}).click();
 await expect(page).toHaveURL(/results/);const s=await page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('northern-prisma.profiles.v1')!).entries[0].text));expect(s.prisma).toBe(19);expect(s.gacha.lastSummon.rateUp.id).toBe(b.id);expect(s.gacha.pity[b.id]).toBeDefined();await page.reload();await expect(page.getByRole('heading',{name:'Những hồi đáp từ Prisma'})).toBeVisible();
});
test('midnight refresh expires an open conversion confirmation before it can purchase the wrong lineup',async({page})=>{
 await seed(page,new Date('2026-11-07T16:59:59Z'),0);await page.goto('/recruitment');await page.getByRole('button',{name:'Chiêu mộ 1 lần'}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.clock.setFixedTime(new Date('2026-11-07T17:00:01Z'));await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.locator('.banner-card')).toHaveCount(3);const s=await page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('northern-prisma.profiles.v1')!).entries[0].text));expect(s.coins).toBe(10000);expect(s.prisma).toBe(0);
});

test('all five faction scenes render their own artwork with three live names',async({page})=>{
 await seed(page);const found=new Map<string,any>();for(let i=0;i<120&&found.size<5;i++){const date=new Date(thursday.getTime()+i*86400000);for(const b of rotationSchedule(c,date).banners)if(!found.has(b.groupId))found.set(b.groupId,{date,b});}
 expect(found.size).toBe(5);for(const [group,{date,b}]of found){await page.clock.setFixedTime(date);await page.goto('/recruitment?banner='+b.id);await expect(page.locator('[data-active-banner]')).toHaveAttribute('data-active-banner',b.id);await expect(page.locator('.rateup-stage .faction-scene')).toHaveAttribute('src',b.art);await expect(page.locator('.rateup-featured a')).toHaveCount(3);await page.locator('.rateup-stage').screenshot({path:'test-results/rateup-scene-'+group+'.png'});}
});
