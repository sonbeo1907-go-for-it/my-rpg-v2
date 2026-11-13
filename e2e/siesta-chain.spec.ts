import {test,expect} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
import {beginChronicleEvent} from '../src/core/chronicles.js';import {createChronicleBattle,snapshotChronicleBattle} from '../src/core/chronicle-combat.js';
const c:any=await loadContent();
test('one player click executes Siesta buff and double burst in order, persists three spent stacks and one MP cost',async({page})=>{
 let s=createGameSave(c);s.party=['siesta','iris','elaine','garrek'];s.partyPresets[0].slots=[...s.party];s.unlockedCharacterIds=Object.keys(c.characters);s=beginChronicleEvent(s,c,'a',{random:()=>.5});
 const p=s.chronicles.pendingByLocation.a;s.chronicles.firstClearIds=[c.chronicles.book1.locations.find((l:any)=>l.id==='a').introId];p.eventId='book1.a03';p.battleStepId=c.chronicleEvents[p.eventId].steps.find((x:any)=>x.battle).id;p.stepId=p.battleStepId;p.status='battle';
 const b=createChronicleBattle(c,s,'a',p.instanceId);for(const e of b.actors.filter((a:any)=>a.team==='enemy'))e.hp=e.stats.maxHp=100000;b.actors.find((a:any)=>a.id==='siesta').resourceValues.ferocity=3;b.queue=['siesta',...b.actors.filter((a:any)=>a.id!=='siesta').map((a:any)=>a.id)];b.cursor=0;p.battleSnapshot=snapshotChronicleBattle(b);s.chronicles.activeBattle='a';
 await page.addInitScript(raw=>{localStorage.setItem('northern-prisma.campaign.v7',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse',battleLogs:true}));localStorage.setItem('northern-prisma.combat.speed','fast');},encodeGameSave(s,c));
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/battle');await expect(page.locator('.execute')).toBeEnabled();await page.locator('[data-gamepad-skill="siesta.rend"]').click();await page.locator('.execute').click();
 await expect(page.locator('.battle-log')).toContainText('nối tiếp Tiếng Tru');await expect(page.locator('.battle-log')).toContainText('nối tiếp Bầy Sói');
 const text=await page.locator('.battle-log').innerText();expect(text.match(/nối tiếp Bầy Sói/g)?.length).toBe(2);expect(text.indexOf('nối tiếp Tiếng Tru')).toBeLessThan(text.indexOf('nối tiếp Bầy Sói'));
 const state=await page.evaluate(()=>{const profile=JSON.parse(localStorage.getItem('northern-prisma.profiles.v1')!);const save=JSON.parse(profile.entries[0].text);return JSON.parse(save.chronicles.pendingByLocation.a.battleSnapshot.state).actors.find((a:any)=>a.id==='siesta');});
 expect(state.resourceValues.ferocity).toBe(0);expect(state.mp).toBe(75);expect(state.statuses.some((x:any)=>x.id==='siesta_howl')).toBe(true);expect(state.cooldowns['siesta.howl']??0).toBe(0);expect(state.cooldowns['siesta.ravage']??0).toBe(0);
 await expect(page.locator('[data-combat-fx]')).toHaveCount(0,{timeout:15000});expect(errors).toEqual([]);await page.screenshot({path:'test-results/siesta-chain-combat.png',fullPage:true});
});
