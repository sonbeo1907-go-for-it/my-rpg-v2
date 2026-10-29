import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../scripts/load-content.mjs';
import { createCampaign } from '../src/core/progression.js';
import { createBattle,executeAction,executeEnemyTurn,activeActor,getActor,abilityAvailability } from '../src/core/battle.js';
const content=await loadContent();
function setup(party=['lionel','iwayn'],source=content,random=()=>.99){
 const campaign=createCampaign(source);campaign.party=party;campaign.unlockedCharacterIds=Object.keys(source.characters);
 const b=createBattle(source,campaign,'forest_patrol',random);
 for(const e of b.actors.filter(a=>a.team==='enemy')){e.hp=e.stats.maxHp=10000;e.mp=e.stats.maxMp=10000;}
 return b;
}
function act(b,skill='$defend',target){const a=activeActor(b);executeAction(b,{actorId:a.id,abilityId:skill,targetId:target??a.id});}
function until(b,predicate,choose=()=>{}){for(let i=0;i<100;i++){if(predicate())return;assert.ok(!b.outcome);const a=activeActor(b);const move=choose(a)??{};act(b,move.skill,move.target);}throw Error('Unreached phase');}
function at(b,id){until(b,()=>activeActor(b)?.id===id);}

test('no grant means only main rounds, cooldowns tick once and round-end is emitted once',()=>{
 const b=setup();until(b,()=>b.round===2);
 assert.equal(b.phase,'main');assert.equal(b.extraTurnGrants.size,0);
 assert.equal(b.log.filter(l=>l.includes('— Kết thúc Vòng Chính 1')).length,1);
 assert.equal(b.log.some(l=>l.includes('— Vòng Phụ')),false);
});
test('grant records a right without inserting into main queue; extra action uses same round and no extra cooldown tick',()=>{
 const b=setup();at(b,'lionel');const queue=[...b.queue];act(b,'lionel.encore','iwayn');
 assert.deepEqual(b.queue,queue);assert.equal(b.phase,'main');assert.equal(b.round,1);
 assert.equal(getActor(b,'lionel').cooldowns['lionel.encore'],5);
 until(b,()=>b.phase==='extra');assert.equal(b.round,1);assert.deepEqual(b.queue,['iwayn']);
 assert.equal(getActor(b,'lionel').cooldowns['lionel.encore'],5);
 act(b);assert.equal(b.round,2);assert.equal(b.phase,'main');assert.equal(getActor(b,'lionel').cooldowns['lionel.encore'],4);
 assert.equal(b.log.filter(l=>l.includes('— Vòng Phụ 1')).length,1);
 assert.equal(b.log.filter(l=>l.includes('— Kết thúc Vòng Chính 1')).length,1);
});
test('both teams can receive rights, extra queue uses effective SPD at entry with stable ties',()=>{
 const b=setup(['lionel','iwayn','iris']);
 const everyone=b.actors.map(a=>a.id);b.extraTurnGrants=new Set(everyone);b.extraPhaseRequired=true;
 getActor(b,'iwayn').statuses.push({id:'benard_gale',remaining:3,sourceId:'iwayn'});
 for(const enemy of b.actors.filter(a=>a.team==='enemy'))enemy.stats.speed=10;
 until(b,()=>b.phase==='extra');assert.deepEqual(b.queue,['iris','iwayn','lionel','enemy_0','enemy_1','enemy_2']);
 assert.equal(b.round,1);until(b,()=>b.round===2);assert.equal(b.extraTurnGrants.size,0);assert.equal(b.extraTurnUsed.size,0);
});
test('repeated grant is ignored individually; a mixed skill in extra still damages, buffs, spends MP and starts cooldown',()=>{
 const c=structuredClone(content);
 c.abilities['test.mixed']={id:'test.mixed',name:'Hỗn hợp',target:'enemy',cost:{mp:9},cooldown:2,effects:[{type:'damage',damageType:'magical',element:'water',multiplier:1},{type:'grant_extra_turn'},{type:'status',to:'self',status:'young_oath',duration:3}]};
 const b=setup(undefined,c);getActor(b,'lionel').abilities.push('test.mixed');
 at(b,'lionel');act(b,'lionel.encore','lionel');
 // A second main-phase source grants the same recipient: no second right.
 c.abilities['test.grant']={id:'test.grant',name:'Thêm lượt',target:'ally',effects:[{type:'grant_extra_turn'}]};
 getActor(b,'iwayn').abilities.push('test.grant');at(b,'iwayn');act(b,'test.grant','lionel');assert.equal(b.extraTurnGrants.size,1);
 until(b,()=>b.phase==='extra');const a=getActor(b,'lionel'),before=a.mp,hp=getActor(b,'enemy_0').hp;
 act(b,'test.mixed','enemy_0');assert.equal(a.mp,before-9+11);assert.ok(getActor(b,'enemy_0').hp<hp);assert.ok(a.statuses.some(s=>s.id==='young_oath'));
 assert.equal(a.cooldowns['test.mixed'],2);assert.equal(b.round,2);assert.equal(b.phase,'main');
 assert.equal(b.log.filter(l=>l.includes('— Vòng Phụ 1')).length,1);assert.ok(b.log.some(l=>l.includes('bỏ qua cấp Lượt Thêm')));
});
test('all recipients dying still passes through an empty extra phase before end-round, without carrying rights',()=>{
 const b=setup();at(b,'lionel');act(b,'lionel.encore','iwayn');at(b,'iwayn');act(b);getActor(b,'iwayn').hp=0;
 until(b,()=>b.round===2);
 const extra=b.log.indexOf('— Vòng Phụ 1 —'),end=b.log.indexOf('— Kết thúc Vòng Chính 1 —');
 assert.ok(extra>=0&&extra<end);assert.equal(b.extraTurnGrants.size,0);
});
test('a recipient killed before its extra position is skipped, other rights still act exactly once',()=>{
 const b=setup(['lionel','iwayn','iris']);b.extraTurnGrants=new Set(['iris','iwayn']);b.extraPhaseRequired=true;
 until(b,()=>b.phase==='extra');assert.equal(activeActor(b).id,'iris');getActor(b,'iwayn').hp=0;act(b);assert.equal(b.round,2);
 assert.equal(b.log.filter(l=>l==='Iwayn dùng Phòng thủ.').length,1); // Only his main action.
});
test('Lionel end-round MP waits for all extra actors; includes self, chooses ratio and stable party ties',()=>{
 const b=setup(['lionel','iwayn','iris']);b.extraTurnGrants=new Set(['iris','iwayn']);b.extraPhaseRequired=true;
 until(b,()=>b.phase==='extra');const lionel=getActor(b,'lionel'),iwayn=getActor(b,'iwayn');lionel.mp=0;iwayn.mp=0;
 const mark=b.log.length;act(b);assert.equal(lionel.mp,0);assert.equal(b.round,1);
 act(b);assert.equal(lionel.mp,11);assert.equal(b.round,2);
 assert.equal(b.log.slice(mark).filter(l=>l.includes('kích hoạt Người dẫn lối')).length,1);
 const b2=setup();getActor(b2,'lionel').mp=50;getActor(b2,'iwayn').mp=20;
 until(b2,()=>b2.round===2);assert.ok(b2.log.some(l=>l==='Iwayn hồi 8 MP.'));
});
test('Lionel dead at end-round never restores MP; victory or defeat cancels pending phases',()=>{
 const b=setup();b.extraTurnGrants=new Set(['iwayn']);b.extraPhaseRequired=true;getActor(b,'lionel').hp=0;b.queue=b.queue.filter(id=>id!=='lionel');b.cursor=0;
 until(b,()=>b.round===2);assert.equal(b.log.some(l=>l.includes('kích hoạt Người dẫn lối')),false);
 for(const outcome of ['victory','defeat']){
  const x=setup();x.extraTurnGrants.add('iwayn');x.extraPhaseRequired=true;
  for(const a of x.actors)if(a.team===(outcome==='victory'?'enemy':'party'))a.hp=0;
  // The last valid living unit resolves an action and outcome ends immediately.
  const survivor=x.actors.find(a=>a.hp>0);x.queue=[survivor.id];x.cursor=0;act(x);
  assert.equal(x.outcome,outcome);assert.equal(x.log.some(l=>l.includes('— Vòng Phụ')),false);assert.equal(x.endOfRoundResolvedRound,undefined);
 }
});
test('extra actions enforce MP/cooldowns and tick poison, regen, stun and durations on actual own turns',()=>{
 const b=setup(['lionel','percival']);at(b,'lionel');act(b,'lionel.encore','percival');
 const p=getActor(b,'percival');p.hp=150;p.statuses.push({id:'kai_poison',remaining:3,potency:7,sourceId:'enemy_0'},{id:'tidal_stillness',remaining:3,sourceId:'percival'});
 until(b,()=>b.phase==='extra');assert.equal(activeActor(b).id,'percival');assert.equal(p.hp,178); // Two actual starts: (−7 +21) each.
 assert.equal(p.statuses.find(s=>s.id==='kai_poison').remaining,1);
 p.mp=0;assert.equal(abilityAvailability(b,p,content.abilities['percival.sea']).ok,false);
 assert.throws(()=>act(b,'percival.sea','enemy_0'),/MP/);assert.equal(b.phase,'extra');
 act(b);assert.equal(b.round,2);
 const stunned=setup();stunned.extraTurnGrants.add('iwayn');stunned.extraPhaseRequired=true;
 at(stunned,'iwayn');act(stunned);getActor(stunned,'iwayn').statuses.push({id:'stunned',remaining:1,sourceId:'enemy_0'});
 until(stunned,()=>stunned.round===2);assert.equal(stunned.log.filter(l=>l.includes('Iwayn bị choáng')).length,1);
});
test('Aurora and Takeshi share reaction quotas across phases and can activate first time in extra',()=>{
 for(const used of [true,false]){
  const b=setup(['lionel','aurora','iris','takeshi'],content,()=>0);
  const aurora=getActor(b,'aurora'),takeshi=getActor(b,'takeshi');
  aurora.followUpRound=used?1:0;takeshi.reactionRound=used?1:0;
  // Avoid main-phase reactions; synthetic rights let both teams exercise their normal extra actions.
  b.extraTurnGrants=new Set(['iris','enemy_0']);b.extraPhaseRequired=true;
  until(b,()=>b.phase==='extra');takeshi.statuses.push({id:'evasive',remaining:2,sourceId:takeshi.id});
  act(b,'$attack','enemy_0');
  assert.equal(aurora.resourceValues[aurora.passive.resource],used?0:1);
  const enemy=activeActor(b);executeAction(b,{actorId:enemy.id,abilityId:'$attack',targetId:'takeshi'});
  assert.equal(takeshi.resourceValues.opening,used?0:1);
 }
});
test('enemy AI can use a data-defined grant skill and acts in extra without opening a second phase',()=>{
 const c=structuredClone(content);c.enemies.goblin.abilities=['lionel.encore'];
 const b=setup(['lionel','iwayn'],c,()=>0);until(b,()=>activeActor(b)?.team==='enemy');executeEnemyTurn(b);
 assert.equal(b.extraTurnGrants.size,1);until(b,()=>b.phase==='extra');assert.equal(activeActor(b).team,'enemy');
 executeEnemyTurn(b);assert.equal(b.round,2);assert.equal(b.phase,'main');
});
test('a multi-move boss extra turn remains one actor turn for durations and end-round effects',()=>{
 const c=structuredClone(content);c.encounters.forest_patrol.enemies=['miraebolis'];
 const b=setup(['lionel','garrek'],c);const enemy=getActor(b,'enemy_0');enemy.bossState.phase=3;enemy.hp=3000;
 for(const a of b.actors.filter(a=>a.team==='party'))a.hp=a.stats.maxHp=5000;
 b.extraTurnGrants=new Set(['enemy_0','garrek']);b.extraPhaseRequired=true;
 // Main actions are defenses to isolate the granted boss turn.
 until(b,()=>b.phase==='extra');assert.equal(activeActor(b).id,'enemy_0');
 enemy.statuses.push({id:'dragon_suppressed',stacks:2,remaining:2,sourceId:'lionel'});
 const before=b.actionCount;executeEnemyTurn(b);
 assert.equal(b.round,1);assert.equal(b.phase,'extra');assert.equal(activeActor(b).id,'garrek');
 assert.equal(b.actionCount-before,2);assert.equal(enemy.statuses.find(s=>s.id==='dragon_suppressed').remaining,1);
 assert.equal(b.log.filter(l=>l.includes('kích hoạt Người dẫn lối')).length,0);act(b);assert.equal(b.round,2);assert.equal(b.log.filter(l=>l.includes('kích hoạt Người dẫn lối')).length,1);
});
