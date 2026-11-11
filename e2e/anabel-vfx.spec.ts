import {test,expect,type Page} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
import {beginChronicleEvent} from '../src/core/chronicles.js';
import {createChronicleBattle,snapshotChronicleBattle} from '../src/core/chronicle-combat.js';
const c:any=await loadContent();
async function seed(page:Page,reduced=false){
 let s=createGameSave(c);s.party=['anabel','iris','elaine','garrek'];s.partyPresets[0].slots=[...s.party];s.unlockedCharacterIds=Object.keys(c.characters);s=beginChronicleEvent(s,c,'a',{random:()=>.5});
 const p=s.chronicles.pendingByLocation.a;s.chronicles.firstClearIds=[c.chronicles.book1.locations.find((l:any)=>l.id==='a').introId];p.eventId='book1.a03';p.battleStepId=c.chronicleEvents[p.eventId].steps.find((x:any)=>x.battle).id;p.stepId=p.battleStepId;p.status='battle';
 const b=createChronicleBattle(c,s,'a',p.instanceId);for(const e of b.actors.filter((a:any)=>a.team==='enemy'))e.hp=e.stats.maxHp=100000;b.queue=['anabel',...b.actors.filter((a:any)=>a.id!=='anabel').map((a:any)=>a.id)];b.cursor=0;p.battleSnapshot=snapshotChronicleBattle(b);s.chronicles.activeBattle='a';
 await page.addInitScript(raw=>{localStorage.setItem('northern-prisma.campaign.v7',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));localStorage.setItem('northern-prisma.combat.speed','normal');},encodeGameSave(s,c));await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});await page.goto('/battle');await expect(page.locator('.execute')).toBeEnabled();
 await page.evaluate(()=>{(window as any).anabelFx=[];const seen=new Set();new MutationObserver(()=>{for(const node of document.querySelectorAll<HTMLElement>('[data-anabel-kind]')){const p=node.parentElement!,id=p.dataset.fxId;if(!seen.has(id)){seen.add(id);(window as any).anabelFx.push({id,kind:node.dataset.anabelKind,target:p.dataset.fxTarget,at:performance.now(),animations:node.getAnimations({subtree:true}).length});}}}).observe(document.body,{childList:true,subtree:true});});
}
for(const [skill,kind]of [['$attack','anabel_slash'],['anabel.advance','anabel_cleave'],['anabel.command','anabel_command']])test(skill+' gold VFX is local and cleans up',async({page})=>{
 await seed(page);if(skill==='anabel.advance')await page.setViewportSize({width:390,height:844});await page.locator(`[data-gamepad-skill="${skill}"]`).click();await page.locator('.enemy-grid').scrollIntoViewIfNeeded();await page.locator('.execute').evaluate((b:HTMLButtonElement)=>b.click());
 await page.waitForFunction(k=>(window as any).anabelFx.some((f:any)=>f.kind===k),kind);
 const fx=page.locator(`[data-anabel-kind="${kind}"]`).first();if(await fx.count()){await fx.evaluate(node=>node.parentElement!.getAnimations({subtree:true}).forEach(a=>{a.pause();const t=a.effect!.getTiming();a.currentTime=Number(t.delay)+Number(t.duration)*.45;}));await page.screenshot({path:`test-results/${kind}.png`,fullPage:true});}
 await expect(page.locator('[data-anabel-kind]')).toHaveCount(0,{timeout:5000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('dawn draws two descending golden blades on target, with separate repeat timing',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page);await page.locator('[data-gamepad-skill="anabel.judgment"]').click();await page.locator('.enemy-grid').scrollIntoViewIfNeeded();await page.locator('.execute').evaluate((b:HTMLButtonElement)=>b.click());
 await expect(page.locator('[data-anabel-kind="anabel_dawn"]').first()).toBeVisible();await page.locator('[data-anabel-kind="anabel_dawn"]').first().evaluate(node=>node.parentElement!.getAnimations({subtree:true}).forEach(a=>{a.pause();const t=a.effect!.getTiming();a.currentTime=Number(t.delay)+Number(t.duration)*((a as CSSAnimation).animationName==='anabel-sword-fall'?1:.6);}));await page.locator('.enemy-grid').screenshot({path:'test-results/anabel-dawn-sword.png'});
 await page.waitForFunction(()=>(window as any).anabelFx.filter((f:any)=>f.kind==='anabel_dawn').length===2);
 const cues=await page.evaluate(()=>(window as any).anabelFx.filter((f:any)=>f.kind==='anabel_dawn'));expect(cues[1].at-cues[0].at).toBeGreaterThan(400);expect(cues[0].target).toBe(cues[1].target);await expect(page.locator('[data-anabel-kind]')).toHaveCount(0,{timeout:5000});expect(errors).toEqual([]);
});
test('reduced motion preserves sword feedback with no CSS animation and leaves no residue after navigation',async({page})=>{
 await seed(page,true);await page.locator('[data-gamepad-skill="anabel.judgment"]').click();await page.locator('.execute').click();await page.waitForFunction(()=>(window as any).anabelFx.some((f:any)=>f.kind==='anabel_dawn'));
 expect(await page.evaluate(()=>(window as any).anabelFx.every((f:any)=>f.animations===0))).toBe(true);await page.goto('/characters?ownership=owned');await expect(page.locator('[data-anabel-kind]')).toHaveCount(0);
});

