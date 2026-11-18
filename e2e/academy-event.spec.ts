import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave} from '../src/core/game-save.js';
import {beginTournament,proposeTournamentResult,confirmTournamentResult,currentTournamentPlayerMatch} from '../src/core/tournament-session.js';
const c:any=await loadContent();
async function seed(page:any,s:any){await page.addInitScript((raw:string)=>{if(!localStorage.getItem('northern-prisma.campaign.v7'))localStorage.setItem('northern-prisma.campaign.v7',raw);sessionStorage.setItem('northern-prisma.entered','1');localStorage.setItem('northern-prisma.settings.v1',JSON.stringify({musicEnabled:false,controlMode:'mouse'}));},encodeGameSave({...s,tournaments:{...s.tournaments,rulesAccepted:true}},c));}
test('academy event shop confirms exchange, preserves wallet and renders at three widths',async({page})=>{
 const s:any=createGameSave(c);s.tournaments.wallet={tokens:1000,lifetimeEarned:1000,weekly:{week:null,purchases:{}}};await seed(page,s);await page.goto('/chronicles/academy');await page.getByRole('link',{name:'Quầy đổi thưởng →'}).click();await expect(page.getByRole('heading',{name:'Quầy Đổi Thưởng Học Viện'})).toBeVisible();
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [1440,768,390]){await page.setViewportSize({width,height:960});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:`test-results/academy78-shop-${width}.png`,fullPage:true});}
 await page.setViewportSize({width:1440,height:960});await writeFile('.taste-skill/academy78-shop.html',(await page.content()).replace(/<script[\s\S]*?<\/script>/g,'').replace('<head>','<head><base href="http://127.0.0.1:3002/">'));
 await page.locator('.academy-shop-offer').filter({hasText:'Original Prisma'}).click();await expect(page.getByRole('dialog')).toContainText('Tốn 200');await page.getByRole('button',{name:'Đổi 1 Original Prisma',exact:true}).click();await expect(page.locator('.academy-wallet strong')).toHaveText('800');await expect(page.locator('.academy-shop-offer').filter({hasText:'Original Prisma'})).toBeDisabled();await page.reload();await expect(page.locator('.academy-wallet strong')).toHaveText('800');expect(errors).toEqual([]);
});
test('rare trial scouting and real combat checkpoint resume independently from tournament fixtures',async({page})=>{
 let s:any=createGameSave(c);Object.assign(s.tournaments,{rulesAccepted:true,firstClear:true,championships:1,completedRuns:1,nextRunNumber:2});
 for(let n=0;n<100;n++){const trial=beginTournament(s,c,{revision:0,seed:'ui-special-'+n});if(trial.tournaments.activeRun.specialEncounter){s=trial;break;}}
 const r=s.tournaments.activeRun,m:any=currentTournamentPlayerMatch(r),p=r.snapshot.definition.playerTeamId;s=proposeTournamentResult(s,{runId:r.runId,revision:s.tournaments.revision,matchId:m.id,winnerId:p,survivors:m.teams.map((id:string)=>id===p?4:0)});s=confirmTournamentResult(s,{runId:r.runId,revision:s.tournaments.revision});
 await seed(page,s);await page.goto('/chronicles/academy');await page.getByRole('button',{name:'Xem thử thách',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Cấp 40');await page.getByRole('button',{name:'Nhận thử thách',exact:true}).click();await expect(page.locator('.enemy-grid .combatant')).toHaveCount(1);await expect(page.locator('.ally-grid .combatant')).toHaveCount(4);await page.screenshot({path:'test-results/academy78-special.png',fullPage:true});await page.reload();await page.getByRole('button',{name:'Tiếp tục thử thách',exact:true}).click();await expect(page.locator('.enemy-grid .combatant')).toHaveCount(1);
});
