import {writeFile} from 'node:fs/promises';
import {test,expect} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
import {beginChronicleEvent} from '../src/core/chronicles.js';import {createChronicleBattle,snapshotChronicleBattle} from '../src/core/chronicle-combat.js';
import {activeActor,executeAction,executeEnemyTurn} from '../src/core/battle.js';
const c:any=await loadContent();
test('Voodoo persists locally, renders both recipient turns and accepts commands from the recipient of Rotary slot',async({page})=>{
 let s=createGameSave(c);s.party=['rotary','arthur','elaine','garrek'];s.partyPresets[0].slots=[...s.party];s.unlockedCharacterIds=Object.keys(c.characters);s=beginChronicleEvent(s,c,'a',{random:()=>.5});
 const p=s.chronicles.pendingByLocation.a;s.chronicles.firstClearIds=[c.chronicles.book1.locations.find((l:any)=>l.id==='a').introId];p.eventId='book1.a03';p.battleStepId=c.chronicleEvents[p.eventId].steps.find((x:any)=>x.battle).id;p.stepId=p.battleStepId;p.status='battle';
 const b=createChronicleBattle(c,s,'a',p.instanceId);for(const a of b.actors){a.hp=a.stats.maxHp=100000;a.mp=a.stats.maxMp=10000;if(a.team==='enemy')a.stats.attack=a.stats.magic=0;}
 function step(){const a=activeActor(b);if(a.team==='enemy')executeEnemyTurn(b);else executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});}
 let n=0;while(activeActor(b)?.id!=='rotary'&&n++<50)step();executeAction(b,{actorId:'rotary',abilityId:'rotary.voodoo',targetId:'arthur'});n=0;while(!(b.round===2&&b.phase==='main'&&b.queue[b.cursor]==='rotary')&&n++<80)step();expect(activeActor(b)?.id).toBe('arthur');
 p.battleSnapshot=snapshotChronicleBattle(b);s.chronicles.activeBattle='a';
 await page.addInitScript(raw=>{localStorage.setItem('northern-prisma.campaign.v7',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse',battleLogs:true}));localStorage.setItem('northern-prisma.combat.speed','fast');},encodeGameSave(s,c));
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/battle');await expect(page.locator('.execute')).toBeEnabled();
 await expect(page.locator('[data-actor-id="arthur"] .voodoo-mark')).toHaveCount(1);await expect(page.locator('.voodoo-mark')).toHaveCount(1);
 await expect(page.locator('.turn-chips [data-turn-actor="arthur"]')).toHaveCount(2);await expect(page.locator('[data-turn-owner="rotary"]')).toContainText('Arthur');await expect(page.locator('[data-turn-owner="rotary"]')).toContainText('Rotary');await expect(page.locator('[data-turn-owner="rotary"]')).toHaveClass('acting');
 for(const width of [1440,768,390]){await page.setViewportSize({width,height:960});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:`test-results/rotary-combat-${width}.png`,fullPage:true});}
 await page.setViewportSize({width:1440,height:960});const html=(await page.content()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace('<head>','<head><base href="http://127.0.0.1:3002/">');await writeFile('test-results/rotary-taste.html',html);await page.locator('[data-gamepad-skill="arthur.light_slash"]').click();await page.locator('.execute').click();await expect(page.locator('.turn-chips [data-turn-actor="arthur"]')).toHaveCount(1);await expect(page.locator('[data-turn-owner="arthur"]')).toHaveClass('acting');await expect(page.locator('.voodoo-mark')).toContainText('3');
 expect(errors).toEqual([]);
});
