import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {createBattle,executeAction,executeEnemyTurn,activeActor,forecastBattleAction} from '../src/core/battle.js';
import {resolveCharacter} from '../src/core/progression.js';
import {battleStat} from '../src/core/stat-values.js';
import {baseStatValue} from '../src/core/combat-math.js';
import {syncTeamStatAuras,selfBuffOffense} from '../src/core/knight-passives.js';
import {createArenaBattle} from '../src/core/arena.js';
import {validateContent} from '../src/core/content.js';
const c=await loadContent(),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function save(party=['geoffrey','anabel','iris','elaine']){const s=createGameSave(c);s.unlockedCharacterIds=[...new Set([...s.unlockedCharacterIds,...party])];s.party=party;s.partyPresets[0].slots=[...party];return s;}
function fixture(){const s=save(),b=createBattle(c,s,'forest_patrol',()=>.99);for(const e of b.actors.filter(a=>a.team==='enemy')){e.hp=e.stats.maxHp=100000;e.weaknesses=[];}return {b,s,g:b.actors.find(a=>a.id==='geoffrey'),a:b.actors.find(a=>a.id==='anabel'),enemy:b.actors.find(a=>a.team==='enemy')};}
function cast(b,a,id,target){b.queue=[a.id,...b.actors.filter(x=>x.id!==a.id&&x.hp>0).map(x=>x.id)];b.cursor=0;executeAction(b,{actorId:a.id,abilityId:id,targetId:target??a.id});}
const damage=(b,id)=>b.events.filter(e=>e.type==='damage'&&e.sourceId===id);
test('data, release order, affiliations and standard banner membership validate',()=>{
 assert.deepEqual(validateContent(c),[]);assert.equal(c.characters.geoffrey.releaseId,105);assert.equal(c.characters.anabel.releaseId,106);assert.equal(c.characters.anabel.affiliation,'expedition_corps');for(const id of ['geoffrey','anabel'])assert.ok(c.banners.standard.characterPool.includes(id));
 const s=save();assert.deepEqual(decodeGameSave(encodeGameSave(s,c),c).party,s.party);
});
test('Geoffrey aura applies once in preparation and combat, includes self, disappears on KO and returns on revival',()=>{
 const {b,s,g,a}=fixture();near(resolveCharacter(c,s,'geoffrey').stats.defense,40.5);near(battleStat(c,g,'defense'),40.5);near(battleStat(c,a,'defense'),29.7);near(battleStat(c,a,'resistance'),24.3);
 g.hp=0;syncTeamStatAuras(b);near(battleStat(c,a,'defense'),22);near(battleStat(c,a,'resistance'),18);g.hp=100;syncTeamStatAuras(b);near(battleStat(c,a,'defense'),29.7);
 const e=b.actors.find(a=>a.team==='enemy');assert.deepEqual(e.teamAuraModifiers,{});
});
test('team shield uses current DEF, taunt main clock; disruption lowers both offensive stats for three main turns',()=>{
 const {b,g,enemy}=fixture();cast(b,g,'geoffrey.rampart');for(const a of b.actors.filter(a=>a.team===g.team))assert.equal(a.shield,61);assert.equal(g.mp,80);assert.equal(g.statuses.find(s=>s.id==='geoffrey_taunt').remaining,3);
 b.phase='extra';cast(b,g,'geoffrey.disarm',enemy.id);assert.equal(g.statuses.find(s=>s.id==='geoffrey_taunt').remaining,3);for(const e of b.actors.filter(a=>a.team==='enemy')){near(battleStat(c,e,'attack'),e.stats.attack*.75);near(battleStat(c,e,'magic'),e.stats.magic*.75);assert.equal(e.statuses.find(s=>s.id==='geoffrey_disarm').remaining,3);}
});
test('Geoffrey shields himself at 350% DEF and covers AoE plus reactions using Brant rules',()=>{
 const {b,g,a,enemy}=fixture();cast(b,g,'geoffrey.bastion');assert.equal(g.shield,142);const guard=g.statuses.find(s=>s.id==='geoffrey_guard');assert.equal(guard.remaining,3);const def=c.statuses[guard.id];for(const key of ['cover','coverArea','coverReactions','coverTeam'])assert.equal(def[key],true);
 const before=a.hp;cast(b,enemy,'$attack',a.id);assert.equal(a.hp,before);assert.ok(g.shield<142);
});
test('Anabel receives fifteen base ATK once and counts distinct active buff types, capped at 30%',()=>{
 const {a}=fixture();near(baseStatValue(a,'attack'),50);near(battleStat(c,a,'attack'),50);
 a.statuses=[{id:'anabel_command',stacks:5,remaining:5,sourceId:a.id}];near(battleStat(c,a,'attack'),75);assert.deepEqual(selfBuffOffense(c,a),{damage:.1,penetration:.1});
 a.statuses.push({id:'weakness_exploitation',remaining:3,stacks:1},{id:'geoffrey_taunt',remaining:3,stacks:1},{id:'defending',remaining:3,stacks:1});assert.deepEqual(selfBuffOffense(c,a),{damage:.3,penetration:.3});
 a.statuses=[];a.shield=500;assert.deepEqual(selfBuffOffense(c,a),{damage:0,penetration:0});
});
test('each authored attack repeats once per round, charges MP/CD only for the original and never chains',()=>{
 const {b,a,enemy}=fixture();cast(b,a,'anabel.advance',enemy.id);assert.equal(damage(b,a.id).length,2);assert.equal(a.mp,89);assert.equal(b.events.filter(e=>e.type==='reaction'&&e.sourceId===a.id).length,1);
 cast(b,a,'anabel.advance',enemy.id);assert.equal(damage(b,a.id).length,1);assert.equal(a.mp,83);
 cast(b,a,'anabel.judgment',enemy.id);assert.equal(damage(b,a.id).length,2);assert.equal(a.mp,63);assert.equal(a.cooldowns['anabel.judgment'],4);
 b.round++;cast(b,a,'anabel.advance',enemy.id);assert.equal(damage(b,a.id).length,2);
});
test('no repeat after target KO or rejected command; forecast does not reserve the live limiter',()=>{
 const {b,a,enemy}=fixture();b.queue=[a.id,...b.actors.filter(x=>x.id!==a.id).map(x=>x.id)];b.cursor=0;const before=a.mp;
 const f=forecastBattleAction(b,{actorId:a.id,abilityId:'anabel.advance',targetId:enemy.id});assert.equal(damage(f,a.id).length,2);assert.equal(a.mp,before);assert.equal(a.procRounds?.['surviving_repeat:anabel.advance'],undefined);
 enemy.hp=1;cast(b,a,'anabel.advance',enemy.id);assert.equal(damage(b,a.id).length,1);assert.equal(a.procRounds?.['surviving_repeat:anabel.advance'],undefined);
 a.mp=0;b.queue=[a.id];b.cursor=0;assert.throws(()=>executeAction(b,{actorId:a.id,abilityId:'anabel.judgment',targetId:b.actors.find(e=>e.team==='enemy'&&e.hp>0).id}));assert.equal(a.mp,0);
});
test('last-turn buff benefits both original and repeat, then expires only once',()=>{
 const {b,a,enemy}=fixture();enemy.stats.defense=0;a.statuses=[{id:'anabel_command',remaining:1,stacks:1,sourceId:a.id}];cast(b,a,'anabel.advance',enemy.id);const hits=damage(b,a.id);assert.equal(hits.length,2);assert.equal(hits[0].amount,hits[1].amount);assert.ok(!a.statuses.some(s=>s.id==='anabel_command'));
});
test('buff-based DEF penetration affects real damage, not only tooltip values',()=>{
 const first=fixture(),control=fixture();
 for(const f of [first,control]){f.enemy.stats.defense=80;f.a.statuses=[{id:'anabel_command',remaining:3,stacks:1,sourceId:f.a.id}];}
 control.a.passive.penetrationPerBuff=0;
 cast(first.b,first.a,'anabel.advance',first.enemy.id);cast(control.b,control.a,'anabel.advance',control.enemy.id);
 assert.ok(damage(first.b,first.a.id)[0].amount>damage(control.b,control.a.id)[0].amount);
});
test('a real lethal hit immediately removes Geoffrey aura without waiting for another round',()=>{
 const {b,g,a,enemy}=fixture();g.hp=1;g.shield=0;enemy.stats.attack=1000;cast(b,enemy,'$attack',g.id);assert.equal(g.hp,0);near(battleStat(c,a,'defense'),22);near(battleStat(c,a,'resistance'),18);
});
test('mirror teams retain separate aura sources and repeat quotas, use full skills for enemy actors',()=>{
 const b=createArenaBattle(c,save(),'mirror',450),g=b.actors.find(a=>a.team==='party'&&a.definitionId==='geoffrey'),enemyG=b.actors.find(a=>a.team==='enemy'&&a.definitionId==='geoffrey'),a=b.actors.find(a=>a.team==='enemy'&&a.definitionId==='anabel'),player=b.actors.find(a=>a.team==='party'&&a.definitionId==='anabel');
 for(const x of b.actors)x.hp=x.stats.maxHp=100000;
 g.hp=0;syncTeamStatAuras(b);near(battleStat(b.content,player,'defense'),player.baseStats.defense);near(battleStat(b.content,a,'defense'),a.baseStats.defense*1.35);assert.ok(enemyG.hp>0);
 cast(b,a,'anabel.advance',player.id);assert.equal(damage(b,a.id).length,2);assert.ok(damage(b,a.id).every(e=>e.pvpDamage));assert.equal(player.procRounds?.['surviving_repeat:anabel.advance'],undefined);
});
test('Anabel command is ready with two buff turns remaining; Extra Turns do not shorten its five main turns',()=>{
 const {b,a}=fixture();for(const x of b.actors){x.hp=x.stats.maxHp=100000;x.mp=x.stats.maxMp=10000;}
 function step(){const x=activeActor(b);if(x.team==='enemy')executeEnemyTurn(b);else executeAction(b,{actorId:x.id,abilityId:'$defend',targetId:x.id});}
 function seek(phase='main'){let n=0;while((activeActor(b)?.id!==a.id||b.phase!==phase)&&n++<200)step();assert.ok(n<200);}
 seek();executeAction(b,{actorId:a.id,abilityId:'anabel.command',targetId:a.id});assert.equal(a.statuses.find(s=>s.id==='anabel_command').remaining,5);
 b.extraTurnGrants.add(a.id);b.extraPhaseRequired=true;seek('extra');step();assert.equal(a.statuses.find(s=>s.id==='anabel_command').remaining,5);
 for(let i=0;i<3;i++){seek();step();}seek();assert.equal(a.statuses.find(s=>s.id==='anabel_command').remaining,2);assert.equal(a.cooldowns['anabel.command'],0);
});
