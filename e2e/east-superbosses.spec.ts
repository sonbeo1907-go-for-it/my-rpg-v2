import {writeFile} from 'node:fs/promises';
import {test,expect,type Page} from '@playwright/test';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
import {allocationLimit,unspentPoints} from '../src/core/leveling.js';
import {levelScaledEnemyStats} from '../src/core/enemy-scaling.js';
import {characterSkillIds,skillLineId} from '../src/core/skill-rules.js';
const c:any=await loadContent();
async function seed(page:Page,unlocked=true,gamepad=false){
  const s=createGameSave(c);s.unlockedCharacterIds=Object.keys(c.characters);s.party=['geoffrey','amaryllis','elaine','garrek'];s.partyPresets[0].slots=[...s.party];
  if(unlocked)s.storyFlags.push('east_campaign_completed','illusion.sinister_unlocked');
  s.gear=[];s.equipment={};
  for(const id of s.party){
    const state=s.characters[id];Object.assign(state,{level:50,xp:0,limitBreakRank:3,allocations:{},skillRanks:{basic:5}});
    for(const key of ['maxHp','defense','resistance','maxMp','magic','attack']){const n=Math.min(allocationLimit(c,50,key),unspentPoints(c,state));if(n>0)state.allocations[key]=n;}
    for(const skillId of characterSkillIds(c,state,id)){const skill=c.abilities[skillId];if(skill.rankable&&skill.growthProfile!=='fixed')state.skillRanks[skillLineId(skill)]=5;}
    s.extraGearSlots[id]=3;s.equipment[id]=[];
    for(let i=0;i<6;i++){const gear={id:'gear_'+(s.gear.length+1),typeId:'t3_focused',stats:{maxHp:25}};s.gear.push(gear);s.equipment[id].push(gear.id);}
  }
  s.gacha.totalPulls=s.gear.length;
  await page.addInitScript(({raw,gamepad})=>{
    if(!localStorage.getItem('northern-prisma.campaign.v7'))localStorage.setItem('northern-prisma.campaign.v7',raw);
    sessionStorage.setItem('northern-prisma.entered','1');
    localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:gamepad?'gamepad':'mouse',battleLogs:false}));
    localStorage.setItem('northern-prisma.combat.speed','fast');
    if(gamepad){(window as any).__yokaiPad={id:'Xbox Yokai Test',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[(window as any).__yokaiPad]});}
  },{raw:encodeGameSave(s,c),gamepad});
}
async function begin(page:Page,id:string,level=60){
  await page.goto(`/quests?tab=east&selected=${id}&superLevel=${level}`);
  await expect(page.locator('.quest-card.selected')).toContainText('Đại Yêu Ma');
  await page.getByRole('button',{name:/Xuất chiến/}).first().click();
  await expect(page.locator('.enemy-grid .combatant').first()).toBeVisible();
}
async function advanceRound(page:Page,n:number){
  for(let i=0;i<40;i++){
    const text=await page.locator('.page-header p').innerText();
    if(Number(text.match(/Vòng Chính (\d+)/)?.[1]??0)>=n)return;
    await expect(page.locator('.execute')).toBeEnabled();
    await page.locator('.skill-command').filter({hasText:'Phòng thủ'}).click();
    await page.locator('.execute').click();
    await expect(page.locator('.execute')).toBeEnabled();
  }
  throw Error('Round advance limit');
}
test('Orochi requirement is visible and direct selection cannot expose a locked superboss',async({page})=>{
  await seed(page,false);await page.goto('/quests?tab=east&selected=east_super_twins');
  await expect(page.locator('.east-super-lock')).toContainText('Yamata no Orochi');
  await expect(page.locator('[data-encounter-id^="east_super_"]')).toHaveCount(0);
});
test('post-Orochi quests select Super Level and giant is one full three-slot target on desktop/tablet/phone',async({page})=>{
  test.setTimeout(90000);await seed(page);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/quests?tab=east&selected=east_super_mountain');
  await expect(page.locator('[data-encounter-id^="east_super_"]')).toHaveCount(3);
  await expect(page.locator('.east-super-heading')).toContainText('Đại Yêu Ma');
  await page.getByRole('button',{name:'Level 70',exact:true}).click();
  await expect(page.locator('.quest-enemies')).toContainText('HP '+levelScaledEnemyStats(c.enemies.east_great_mountain,70,c,1,c.encounters.east_super_mountain).maxHp);
  await page.screenshot({path:'test-results/yokai-quest-desktop.png',fullPage:true});
  await page.getByRole('button',{name:/Xuất chiến/}).first().click();
  const giant=page.locator('.yokai-colossus');await expect(giant).toHaveCount(1);await expect(page.locator('.enemy-grid .combatant')).toHaveCount(1);
  await expect(giant.locator('.combat-level')).toHaveText('Level 70');
  for(const width of [1440,768,390]){
    await page.setViewportSize({width,height:960});
    const col=await giant.evaluate(el=>getComputedStyle(el).gridColumn);expect(col).toContain('span 3');
    if(width===1440){const ally=await page.locator('.ally-grid .combatant').first().boundingBox(),body=await giant.boundingBox();expect(Math.abs(body!.width-(ally!.width*3+25.6))).toBeLessThan(3);}
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await page.screenshot({path:`test-results/yokai-giant-${width}.png`,fullPage:true});
  }
  const snapshot=await page.evaluate(()=>{
    const copy=document.cloneNode(true) as Document;
    copy.querySelectorAll('script,link[rel="stylesheet"],style,nextjs-portal').forEach(el=>el.remove());
    const absolute=(value:string,base=location.href)=>value.replace(/url\(([^)]+)\)/g,(all,raw)=>{
      const path=raw.trim().replace(/^['"]|['"]$/g,'');
      try{return path.startsWith('data:')?all:`url("${new URL(path,base).href}")`;}catch{return all;}
    });
    const style=copy.createElement('style');
    style.textContent=[...document.styleSheets].flatMap(sheet=>{try{return [...sheet.cssRules].map(r=>absolute(r.cssText,sheet.href??location.href))}catch{return []}}).join('\n');
    copy.head.append(style);
    copy.querySelectorAll('[style]').forEach(el=>el.setAttribute('style',absolute(el.getAttribute('style')??'')));
    return '<!doctype html>'+copy.documentElement.outerHTML;
  });
  await writeFile('test-results/yokai-inspect.html',snapshot);
  expect(errors).toEqual([]);
});
test('twins retain two phase panels and announce both ritual halves with battle logs disabled',async({page})=>{
  test.setTimeout(120000);await seed(page);await begin(page,'east_super_twins');
  await expect(page.locator('.enemy-grid .combatant')).toHaveCount(2);
  await expect(page.locator('.boss-phase-panel')).toHaveCount(2);
  await advanceRound(page,3);
  await expect(page.locator('[data-ritual-kind="link"]')).toHaveCount(2);
  await expect(page.locator('.yokai-notices')).toContainText('Vòng 4');
  await expect(page.locator('.battle-log')).toHaveCount(0);
  await page.screenshot({path:'test-results/yokai-twins-warning.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('Cửu Vĩ warning shows source-specific curse amplification per living party member',async({page})=>{
  test.setTimeout(120000);await seed(page);await begin(page,'east_super_fox');
  await advanceRound(page,6);
  await expect(page.locator('[data-ritual-kind="curse"]')).toHaveCount(1);
  await expect(page.locator('.yokai-curse-targets li')).toHaveCount(4);
  await expect(page.locator('.yokai-notices')).toContainText('Giải hiệu ứng bất lợi');
  await expect(page.locator('.battle-log')).toHaveCount(0);
  await page.screenshot({path:'test-results/yokai-fox-warning.png',fullPage:true});
});

test('existing Miraebolis still selects Super Levels and returns to the sinister board',async({page})=>{
  await seed(page);await page.goto('/quests?tab=sinister&selected=miraebolis_superboss');
  const selector=page.getByRole('region',{name:'Cấp thử thách'});
  await expect(selector.getByRole('button')).toHaveCount(4);
  await selector.getByRole('button',{name:'Level 90',exact:true}).click();
  await expect(page).toHaveURL(/superLevel=90/);
  await page.reload();await expect(selector.getByRole('button',{name:'Level 90',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:/Xuất chiến/}).first().click();
  await expect(page.locator('.enemy-grid .combatant .combat-level')).toHaveText('Level 90');
  await expect(page.locator('.page-header .back-button,.page-header .back-link').first()).toHaveAttribute('href',/tab=sinister.*superLevel=90/);
});
test('Xbox RT changes the giant level and departure confirmation keeps the selected level',async({page})=>{
  await seed(page,true,true);await page.goto('/quests?tab=east&selected=east_super_mountain');
  await expect(page.getByRole('button',{name:'Level 60',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.evaluate(()=>new Promise<void>(done=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>done())))));
  await page.evaluate(()=>{(window as any).__yokaiPad.buttons[7]={pressed:true,value:1};});
  await expect(page.getByRole('button',{name:'Level 70',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.evaluate(()=>{(window as any).__yokaiPad.buttons[7]={pressed:false,value:0};});
  await page.getByRole('button',{name:/Xuất chiến/}).first().click();
  await expect(page.getByRole('dialog')).toContainText('Level 70');
  await page.getByRole('dialog').getByRole('button',{name:'Xuất chiến',exact:true}).click();
  await expect(page.locator('.enemy-grid [data-gamepad-target]')).toHaveCount(1);
  await expect(page.locator('.yokai-colossus .combat-level')).toHaveText('Level 70');
});
