import {test,expect} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
import {setAstoriaEnabled} from '../src/core/developer.js';
const content:any=await loadContent();

test('Magnamut crosses dangerous dungeon rooms without exiting, refunding MP or restarting its music',async({page})=>{
 test.setTimeout(90000);
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 const save=setAstoriaEnabled(createGameSave(content),true);
 save.unlockedCharacterIds.push('lyon');save.party=['astoria','elaine','lyon','garrek'];save.partyPresets[0].slots=[...save.party];save.equipment.astoria=[];
 for(let i=0;i<3;i++){const gear={id:`rune_${i+1}`,typeId:'t4_stats',primaryStat:'magic',secondaryStat:'magic',stats:{magic:8}};save.gear.push(gear);save.equipment.astoria.push(gear.id);}save.craftedGearSerial=3;Object.assign(save.characters.astoria,{level:30,xp:0,limitBreakRank:1,allocations:{magic:10,maxHp:10,defense:9}});
 await page.clock.install({time:new Date('2026-10-30T05:00:00Z')});
 await page.addInitScript(raw=>{
  if(!localStorage.getItem('northern-prisma.campaign.v6'))localStorage.setItem('northern-prisma.campaign.v6',raw);
  sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.combat.speed','fast');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false}));
  sessionStorage.setItem('northern-prisma.scouting:1:dangerous:medium:2026-10-30',JSON.stringify({typeId:'dangerous',difficultyId:'medium',day:'2026-10-30',waveIds:['ogre_trial','giant_boar_trial']}));
  const create=document.createElement.bind(document);(window as any).__tracks=[];
  document.createElement=function(...args:any[]){const element=(create as any)(...args);if(args[0]==='audio'){const src=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'src')!;Object.defineProperty(element,'src',{configurable:true,get(){return src.get!.call(element);},set(value){(window as any).__tracks.push(new URL(value,location.href).pathname);src.set!.call(element,value);}});}return element;} as typeof document.createElement;
 },encodeGameSave(save,content));
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/dungeon/dangerous?selected=medium');await page.locator('.embark').click();await page.getByRole('dialog').getByRole('button',{name:'Bắt đầu thám hiểm',exact:true}).click();
 let expectedCarry=0,expectedMp=0;
 const card=page.locator('.combatant[data-actor-id=astoria]');
 const available=async(id:string)=>{const button=page.locator(`[data-gamepad-skill="${id}"]`);return await button.count()>0&&await button.getAttribute('aria-disabled')==='false';};
 for(let i=0;i<70;i++){
  await expect(page.locator('.execute')).toBeEnabled();
  if(await page.locator('.battle-page').getAttribute('data-dungeon-wave')==='2')break;
  const actor=await page.locator('.command-panel h2').textContent();let skill='$defend';
  if(actor?.includes('Astoria')){
   if(await available('astoria.command')){
    skill='astoria.command';expectedMp=await card.locator('.mp-bar').evaluate(node=>(node as HTMLProgressElement).value);const text=await card.innerText(),match=/Vết nứt không gian:\s*(\d)\s*\/\s*5/.exec(text);expect(match).not.toBeNull();expectedCarry=Number(match![1])-1;
   }else if(await available('astoria.summon'))skill='astoria.summon';else if(await available('astoria.rift'))skill='astoria.rift';else skill='astoria.slash';
  }else if(actor?.includes('Elaine')){if(await available('elaine.sanctuary'))skill='elaine.sanctuary';else if(await available('elaine.shield'))skill='elaine.shield';}
  else if(actor?.includes('Lyon')&&await available('lyon.shield'))skill='lyon.shield';
  await page.locator(`[data-gamepad-skill="${skill}"]`).click();await page.keyboard.press('Escape');
  if(skill==='elaine.shield')await card.locator('.target-hitbox').click();
  if(skill.startsWith('astoria.')&&skill!=='astoria.summon')await page.locator('.enemy-grid .combatant:not(.fallen) .target-hitbox').first().click();
  await page.locator('.execute').click();
 }
 await expect(page.locator('.battle-page')).toHaveAttribute('data-dungeon-wave','2');expect(expectedCarry).toBeGreaterThan(0);
 await expect(page.locator('.battle-page')).toHaveAttribute('data-combat-mode','magnamut');await expect(card).toContainText(new RegExp(`Vết nứt không gian:\\s*${expectedCarry}\\s*/\\s*5`));
 await expect(page.locator('.battle-log')).not.toContainText('Magnamut rời sân.');expect(await card.locator('.mp-bar').evaluate(node=>(node as HTMLProgressElement).value)).toBe(expectedMp);
 for(let i=0;i<5;i++){await expect(page.locator('.execute')).toBeEnabled();if((await page.locator('.command-panel h2').textContent())?.includes('Astoria'))break;await page.locator('[data-gamepad-skill="$defend"]').click();await page.keyboard.press('Escape');await page.locator('.execute').click();}
 await expect(page.locator('[data-gamepad-skill="astoria.command"]')).toHaveAttribute('aria-disabled','false');await expect(page.locator('[data-gamepad-skill="$attack"]')).toHaveAttribute('aria-disabled','true');await expect(page.locator('.skill-command.selected')).toHaveAttribute('data-gamepad-skill','astoria.command');
 const tracks=await page.evaluate(()=>(window as any).__tracks);expect(tracks.filter((path:string)=>path==='/bgm/bgm_astoria.mp3')).toHaveLength(1);expect(tracks).not.toContain('/bgm/victory.mp3');expect(errors).toEqual([]);
 await page.screenshot({path:'test-results/magnamut-room-continuity.png',fullPage:true});
});
