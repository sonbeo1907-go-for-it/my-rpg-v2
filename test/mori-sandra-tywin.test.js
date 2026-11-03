import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/load-content.mjs';
import {createGameSave,encodeGameSave,decodeGameSave} from '../src/core/game-save.js';
import {resolveCharacter} from '../src/core/progression.js';
import {createBattle,executeAction,activeActor,getActor,abilityAvailability,targetsFor} from '../src/core/battle.js';
import {battleStat} from '../src/core/stat-values.js';
import {resolveRankedAbility} from '../src/core/skill-resolver.js';
import {skillPresentation,passivePresentation} from '../src/ui/skill-copy.js';
import {statusDetails} from '../src/ui/combat-presentation.js';
import {validateContent} from '../src/core/content.js';
import {combatTimeline} from '../src/ui/combat-timeline.js';
const content=await loadContent();
function fixture(){const c=structuredClone(content),save=createGameSave(c);save.unlockedCharacterIds=Object.keys(c.characters);save.party=['mori','sandra','tywin','elaine'];save.partyPresets[0].slots=[...save.party];const b=createBattle(c,save,'forest_patrol',()=>.99);for(const e of b.actors.filter(a=>a.team==='enemy')){e.hp=e.stats.maxHp=100000;e.stats.defense=e.stats.resistance=0;e.stats.attack=e.stats.magic=1;e.weaknesses=[];}return {b,c,save};}
function use(b,id,skill,target=id,phase='main'){b.phase=phase;b.queue=[id,b.actors.find(a=>a.id!==id&&a.hp>0).id];b.cursor=0;executeAction(b,{actorId:id,abilityId:skill,targetId:target});}
function custom(b,id,target,effects){const key='test.skill';b.content.abilities[key]={id:key,name:'Test',target:'ally',effects};const actor=getActor(b,id);actor.abilities.push(key);use(b,id,key,target);}
const status=(b,id,key)=>getActor(b,id).statuses.find(s=>s.id===key),damage=(b,id)=>b.events.filter(e=>e.type==='damage'&&e.sourceId===id);
test('official trio validate, join standard recruitment and default locked save state',()=>{assert.deepEqual(validateContent(content),[]);const s=createGameSave(content);for(const id of ['mori','sandra','tywin']){assert.equal(s.unlockedCharacterIds.includes(id),false);assert.ok(content.banners.standard.characterPool.includes(id));assert.ok(content.pvpAiProfiles[id]);assert.equal(content.characters[id].abilities.length,3);}assert.deepEqual(decodeGameSave(encodeGameSave(s,content),content),s);});
test('Mori converts prepared baseSPD including gear, caps at25 and excludes temporarySPD%',()=>{
 const {b,c,save}=fixture();const m=getActor(b,'mori');assert.equal(m.stats.speed,32);assert.equal(battleStat(c,m,'attack'),38);m.statuses.push({id:'test.speed',remaining:2,stacks:1});c.statuses['test.speed']={kind:'buff',modifiers:{speed:2}};assert.equal(battleStat(c,m,'speed'),96);assert.equal(battleStat(c,m,'attack'),38);m.baseStats.speed=100;assert.equal(battleStat(c,m,'attack'),55);m.baseStats.speed=200;assert.equal(battleStat(c,m,'attack'),55);
 save.gear=[1,2,3].map(i=>({id:'gear_'+i,typeId:'t3_focused',stats:{speed:5}}));save.equipment.mori=save.gear.map(g=>g.id);const prepared=resolveCharacter(c,save,'mori');assert.equal(prepared.stats.speed,47);assert.equal(prepared.stats.attack,41.75);assert.ok(passivePresentation(prepared,c).facts.some(s=>s.includes('25 ATK')));
});
test('Mori grants one Ward each, selfATK40% and extra turn; AoE dispels two buffs per target',()=>{
 const {b,c}=fixture();use(b,'mori','mori.unbound');for(const a of b.actors.filter(a=>a.team==='party'))assert.equal(status(b,a.id,'effect_ward').charges,1);assert.equal(status(b,'mori','mori_unbound').remaining,2);assert.equal(battleStat(c,getActor(b,'mori'),'attack'),38*1.4);assert.ok(b.extraTurnGrants.has('mori'));assert.equal(b.extraTurnGrants.has('sandra'),false);
 for(const e of b.actors.filter(a=>a.team==='enemy')){e.statuses=[{id:'guard',remaining:3,stacks:1},{id:'elder_resolve',remaining:3,stacks:1},{id:'young_oath',remaining:3,stacks:1}];}use(b,'mori','mori.storm','enemy_0');assert.equal(damage(b,'mori').length,3);for(const e of b.actors.filter(a=>a.team==='enemy'))assert.equal(e.statuses.filter(s=>c.statuses[s.id].kind==='buff').length,1);
});
test('Mori duration2 and CD3 leave exactly round4 empty; extra turns never tick the buff',()=>{
 const {b,c}=fixture();executeAction(b,{actorId:'mori',abilityId:'mori.unbound',targetId:'mori'});
 function until(round){for(let i=0;i<150;i++){const a=activeActor(b);if(b.round===round&&b.phase==='main'&&a.id==='mori')return;executeAction(b,{actorId:a.id,abilityId:'$defend',targetId:a.id});}throw Error('round unreachable');}
 until(2);assert.equal(status(b,'mori','mori_unbound').remaining,2);assert.equal(abilityAvailability(b,getActor(b,'mori'),c.abilities['mori.unbound']).ok,false);
 until(3);assert.equal(status(b,'mori','mori_unbound').remaining,1);until(4);assert.equal(status(b,'mori','mori_unbound'),undefined);assert.equal(abilityAvailability(b,getActor(b,'mori'),c.abilities['mori.unbound']).ok,false);until(5);assert.equal(abilityAvailability(b,getActor(b,'mori'),c.abilities['mori.unbound']).ok,true);
});
test('Sandra removes all buffs before placing independent2-charge seals; refresh never stacks charges',()=>{
 const {b,c}=fixture();for(const e of b.actors.filter(a=>a.team==='enemy'))e.statuses=[{id:'effect_ward',remaining:null,charges:1,stacks:1},{id:'elder_resolve',remaining:3,stacks:1}];use(b,'sandra','sandra.interdict','enemy_0');for(const e of b.actors.filter(a=>a.team==='enemy')){assert.equal(e.statuses.filter(s=>c.statuses[s.id].kind==='buff').length,0);assert.equal(status(b,e.id,'buff_seal').charges,2);}
 custom(b,'enemy_0','enemy_0',[{type:'status',status:'effect_ward'},{type:'status',status:'elder_resolve',duration:3},{type:'status',status:'young_oath',duration:3}]);assert.equal(status(b,'enemy_0','buff_seal'),undefined);assert.ok(status(b,'enemy_0','young_oath'));assert.equal(status(b,'enemy_1','buff_seal').charges,2);
 const p=skillPresentation(c.abilities['sandra.interdict'],getActor(b,'sandra'),c);assert.ok(p.facts.some(s=>s.includes('2 lần')));assert.equal(resolveRankedAbility(c,{...getActor(b,'sandra'),skillRanks:{'sandra.interdict':5}},c.abilities['sandra.interdict']).effects[1].charges,2);
 custom(b,'enemy_1','enemy_1',[{type:'status',status:'buff_seal',charges:1}]);assert.equal(status(b,'enemy_1','buff_seal').charges,1);assert.match(statusDetails(status(b,'enemy_1','buff_seal'),getActor(b,'enemy_1'),b,c).duration,/1 lần/);
});
test('Sandra bonuses apply per target only without live buffs; shields/debuffs alone do not block the bonus',()=>{
 const {b}=fixture();getActor(b,'enemy_1').statuses=[{id:'young_oath',remaining:3,stacks:1}];getActor(b,'enemy_2').shield=100;getActor(b,'enemy_2').statuses=[{id:'deep_wound',remaining:2,stacks:1}];use(b,'sandra','sandra.verdict','enemy_0');const hits=damage(b,'sandra');const x=hits.find(e=>e.targetId==='enemy_0'),y=hits.find(e=>e.targetId==='enemy_1'),z=hits.find(e=>e.targetId==='enemy_2'); // RES buff changes damage too; compare authored power without that buff later.
 assert.equal(y.amount,Math.floor(34*3.4));assert.equal(x.amount,Math.floor(34*3.4*1.3));assert.equal(x.amount,z.amount+(z.absorbed??0));assert.ok(getActor(b,'sandra').passive.ratio===.3);
});
test('Sandra weakAoE grants1 MP disruption each; new charges field rejects wrong effect or fraction',()=>{
 const {b,c}=fixture();use(b,'sandra','sandra.disruption','enemy_0');assert.equal(damage(b,'sandra').length,3);for(const e of b.actors.filter(a=>a.team==='enemy'))assert.equal(status(b,e.id,'mana_disruption').charges,1);const bad=structuredClone(c);bad.abilities['sandra.interdict'].effects[1].charges=1.5;assert.ok(validateContent(bad).some(s=>s.includes('invalid status charges')));
});
test('Tywin cleanses himself and exactly one other ally, excludes self from anchors, and truecut ignores100% evasion',()=>{
 const {b,c}=fixture();for(const id of ['mori','sandra','tywin'])getActor(b,id).statuses=[{id:'deep_wound',remaining:2,stacks:1}];const t=getActor(b,'tywin');assert.equal(targetsFor(b,t,c.abilities['tywin.purify']).some(a=>a.id===t.id),false);use(b,'tywin','tywin.purify','mori');assert.equal(status(b,'tywin','deep_wound'),undefined);assert.equal(status(b,'mori','deep_wound'),undefined);assert.ok(status(b,'sandra','deep_wound'));
 const e=getActor(b,'enemy_0');e.passive={evasion:{damageTypes:['physical','magical'],baseChance:1,perBaseSpeed:0,cap:1}};use(b,'tywin','tywin.truecut','enemy_0');assert.equal(damage(b,'tywin').length,1);assert.equal(b.events.some(e=>e.type==='dodge'),false);assert.equal(t.statuses.some(s=>s.id==='true_strike'),false);
});
test('rank grows MoriATK40→48.62% and damage; no growth in seals, debuff strength or dispel count',()=>{
 const {b,c}=fixture();const m=getActor(b,'mori');m.skillRanks={'mori.unbound':5,'mori.storm':5};const buff=resolveRankedAbility(c,m,c.abilities['mori.unbound']);assert.ok(Math.abs(buff.effects[1].appliedModifiers.attack-.4*1.05**4)<1e-10);const storm=resolveRankedAbility(c,m,c.abilities['mori.storm']);assert.equal(storm.effects[2].count,2);assert.equal(storm.effects[0].rankDamageFactor,1.1**4);
});

test('balance patch updates raw stats, role, authored scaling and only Sandra paid cooldowns',()=>{
 assert.equal(content.characters.mori.stats.attack,30);assert.equal(content.abilities['mori.storm'].effects[0].multiplier,2.8);assert.equal(content.abilities['tywin.truecut'].effects[0].multiplier,3.5);assert.equal(content.abilities['tywin.truecut'].effects[0].unavoidable,true);
 assert.equal(content.characters.sandra.roleGroup,'sorcerer');assert.equal(content.characters.sandra.stats.magic,34);assert.equal(content.pvpAiProfiles.sandra.role,'sorcerer');assert.equal(content.abilities['sandra.interdict'].cooldown,6);assert.equal(content.abilities['sandra.verdict'].cooldown,1);assert.equal(content.abilities['sandra.disruption'].cooldown,undefined);
});
test('decree VFX plans one formation book and one seal per actual target without altering combat',()=>{
 const {b,c}=fixture();use(b,'sandra','sandra.interdict','enemy_0');const before=JSON.stringify(b.events);const plan=combatTimeline(b.events,c);assert.equal(JSON.stringify(b.events),before);const art=plan.frames.filter(f=>f.kind==='signature');assert.equal(art.filter(f=>f.presentation==='edict_interdict'&&f.area).length,1);assert.deepEqual(art.filter(f=>f.presentation==='edict_seal').map(f=>f.targetId),['enemy_0','enemy_1','enemy_2']);assert.ok(art.every(f=>f.sourceId==='sandra'&&f.element==='earth'));assert.equal(plan.frames.some(f=>f.kind==='hurt'),false);const reduced=combatTimeline(b.events,c,{reduced:true});assert.ok(reduced.frames.every(f=>f.at===0));assert.equal(reduced.frames.filter(f=>f.kind==='signature').length,4);assert.ok(combatTimeline(b.events,c,{speed:'fast'}).duration<plan.duration);for(const e of b.actors.filter(a=>a.team==='enemy'))assert.equal(status(b,e.id,'buff_seal').charges,2);
});
