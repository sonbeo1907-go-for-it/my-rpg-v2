import{test,expect}from'@playwright/test';
import{loadContent}from'../scripts/load-content.mjs';
import{createGameSave,encodeGameSave}from'../src/core/game-save.js';
const content=await loadContent();
test('title shows only the ornamental purple wordmark, a small The and looping shared Prisma glow',async({page,request})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/');await expect(page).toHaveTitle('The Prisma Origin');await expect(page.getByRole('heading',{name:'The Prisma Origin',exact:true})).toBeVisible();
 await page.evaluate(()=>document.fonts.load('700 80px "Prisma Cinzel"'));expect(await page.evaluate(()=>document.fonts.check('700 80px "Prisma Cinzel"'))).toBe(true);
 const logo=page.locator('.title-logo .origin-logo');await expect(logo.locator('.origin-crystal-glow')).toHaveCSS('animation-name','crystal-pulse');await expect(logo.locator('.origin-crystal-glow')).toHaveCSS('animation-iteration-count','infinite');
 const word=await logo.locator('.origin-logo-prisma').boundingBox(),the=await logo.locator('.origin-logo-the').boundingBox(),origin=await logo.locator('.origin-logo-origin').boundingBox(),gem=await logo.locator('.origin-logo-crystal').boundingBox();
 expect(the!.height).toBeLessThan(word!.height*.4);expect(the!.x).toBeLessThan(word!.x);expect(gem!.x).toBeGreaterThan(word!.x+word!.width-2);expect(origin!.y).toBeGreaterThan(word!.y+word!.height*.6);expect(origin!.x).toBeGreaterThan(word!.x);
 await expect(page.locator('.title-content')).not.toContainText('Northern');await expect(page.locator('.title-content .title-overline,.title-content>p,.title-crest,.title-rule')).toHaveCount(0);
 expect((await request.get('/fonts/cinzel-decorative/CinzelDecorative-Bold.ttf')).ok()).toBe(true);expect((await request.get('/fonts/cinzel-decorative/OFL.txt')).ok()).toBe(true);
 await page.screenshot({path:'test-results/prisma-origin-title-desktop.png',fullPage:true,animations:'disabled'});
});
test('mobile wordmark fits, reduced motion keeps the crystal lit, and existing saves reach the renamed header',async({page})=>{
 const c=createGameSave(content);c.coins=987;c.illusion.tutorial.completedMapIds=['hunter_guild_training'];
 await page.addInitScript(raw=>{if(!localStorage.getItem('northern-prisma.campaign.v6'))localStorage.setItem('northern-prisma.campaign.v6',raw);},encodeGameSave(c,content));await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await expect(page.locator('.profile-card')).toHaveCount(1);
 await page.evaluate(()=>document.fonts.ready);await expect(page.locator('.title-logo .origin-crystal-glow')).toHaveCSS('animation-name','none');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:'test-results/prisma-origin-title-phone.png',fullPage:true});
 await page.getByRole('button',{name:/^Tiếp tục/}).click();await expect(page.getByRole('link',{name:'The Prisma Origin — Về Tavern',exact:true})).toBeVisible();await expect(page.locator('.utility-wallet')).toContainText('987');await expect(page.locator('.brand .origin-logo')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.getByRole('link',{name:/Câu chuyện lữ hành/}).click();await expect(page.locator('.page-header .eyebrow')).toContainText('THE PRISMA ORIGIN');await page.screenshot({path:'test-results/prisma-origin-header-phone.png',fullPage:true});
});
