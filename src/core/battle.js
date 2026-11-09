import {baseStatValue} from './combat-math.js';
import {statusApplicationChance,stunImmune} from './status-chance.js';
import {applyPvpDamageCap,allowPvpHit,pvpPeriodicContext,reservePvpAutomatic} from './pvp-damage.js';
import {chooseBattleAction} from './battle-ai.js';
import {payMpTeamResources,sharedPenetration,spentSharedDamage,nativePenetration,lightningChargeEligible} from './powder-combat.js';
import {teamPhysicalGuard,alteredDefenseBonus} from './tactical-passives.js';
import {stealBaseStat} from './stat-theft.js';

import {skillDamageBonus} from './damage-amplification.js';
import {formationAbility} from './advanced-combat.js';
import {damageElements,elementalResistance} from './elements.js';
import {hitGrowthRatio,modePenetration} from './hit-growth.js';
import {teamResourceState,priorityTaggedAlly,teamSpentPenetration,selectedTeamCost,growTeamResources,spentTeamHits,initializeTeamResources,teamResourceValue,teamResourceSpent,teamCostAvailability,changeTeamResource,scaledTeamEffect,teamCostAmount,teamSpendStatBonuses,scaledSpentTeamEffect} from './team-resources.js';
import {captureDamageBuffs,settleDamageBuffs} from './charged-buffs.js';
import {restoreFortressVitals} from './fortress-session.js';
import {fortressSupport} from './fortress-rules.js';
import {isAlive,isInAgony,routesToMaxHp,agonyReduction,applyLifeDamage,maybeGrantLowHpImmortality,expireAgony} from './actor-life.js';
import {supportFollowupReady,supportFollowupBonus} from './support-followup.js';
import {exclusiveResourceChanged,exclusiveAttackResourceChance,exclusiveHealBonus,exclusiveAfterSkill,exclusiveShieldBreak,exclusiveAutomaticHit,exclusiveWardBlocked,exclusiveEnemyStatusApplied,exclusiveResourceBonus} from './exclusive-runtime.js';
import {specialPassives,specialSkillStatBonuses,specialHitStatBonus,specialResourcePenetration,specialResourceKeepChance} from './exclusive-specials.js';
import {resolveRankedAbility} from './skill-resolver.js';
import {questDifficulty} from './quest-difficulty.js';
import {shieldedDamageBonus} from './exclusive-field.js';
import {evasionChance,hasTrueStrike} from './evasion.js';
import {exposureStatus} from './weakness.js';
import {initializeGearEncounter,activateRoundGear,gearMainTurn,gearGuardReduction,gearIncomingMultiplier,gearOutgoingMultiplier,gearShieldExtra,gearHpLoss,gearAfterDirectHit,gearObserveWeakness,gearBuffApplied,prepareGearHealing,gearSkillHealed,gearAfterAction,gearAfterAttack} from './gear-effects.js';
import { captureExposures, availableExposureStacks, resolveWeakness, reserveExposure, finishExposures } from './weakness.js';
import {prepareCombatMode,prepareCompanion,roundSummons,expireRoundSummons} from './combat-summons.js';
import {periodicPotency} from './periodic-damage.js';
import { activeFormula, formulaAvailability, formulaSnapshot, formulaDamage, validateFormulaEdit, editedFormulaEntries, openFormula, closeFormula, expireFormulaFields, recordFormulaAction } from "./formula-field.js";
import { expireRoundEffects } from "./round-effects.js";
import { scalingValue, adjacentAllies, splashEnemies } from "./scaling.js";
import { statusModifier } from "./stat-values.js";
import { exclusivePassive, exclusivePassives, exclusiveDamageEffect, procAvailable, markProc } from "./exclusive-hooks.js";
import { enemyStatMultipliers, levelScaledEnemyStats } from "./enemy-scaling.js";
import { resolveCharacter } from "./progression.js";
import { seededRandom } from "./random.js";
import {
  ELEMENT_NAMES,
  DAMAGE_TYPE_NAMES,
} from "./content.js";
import { isValidParty } from "./party.js";
import {
  damageMultiplier,
  supportAmount,
  EMERGENCY_HP_THRESHOLD,
  effectiveStat,
  speedDamageBonus,
  mpRestoreAmount,
  shieldedDamageMultiplier,
  incomingDamageMultiplier,
} from "./combat-math.js";
import {
  canTriggerFollowUp,
  FOLLOW_UP_LABEL,
  REACTION_LABELS,
} from "./follow-up.js";
import { battleMaxMp,clampBattleMp,battleStat } from "./stat-values.js";
import { assertOwnedParty } from "./ownership.js";
import { assertValidEquipment } from "./equipment.js";
import {
  initializeBoss,
  bossHealthFloor,
  bossFireMultiplier,
  suppressOnWeakness,
  transitionBossPhases,
  bossTurnJobs,
} from "./boss-mechanics.js";
import { activeStatuses } from "./status-state.js";
import {receivedSupport,consumeStatusCharge} from "./status-policies.js";
import {bypassedBarrierReduction} from "./skill-barrier.js";
import { assertQuestUnlocked, assertEncounterParty } from "./quest-catalog.js";
import { normalizeBlacksmithState } from "./blacksmith-state.js";

import {lifeDebt,payLifeDebt,clearLifeDebt,preferredLifeDebtCost,externalHealingBlocked,mortgageDamageBonus} from './life-debt.js';
import { checkCombatMode, enterCombatMode, leaveCombatMode, modeAvailability, spendModeTurn } from "./combat-modes.js";
import { copyTurnOrderField, orderActorIds, expireTurnOrderField, applyTurnOrderField, skillBaseStatBonuses } from "./turn-order.js";
import { mpCost, hpCost, resourceCost, debuffTypeCount, debuffDamageBonus, buffTypeCount, buffDamageBonus, lowHpDamageBonus, targetsAsGroup } from "./conditional-combat.js";
const modeIO = { announce:announcePassive, write, emit: emitEvent, restore: gainResource, outcome:checkOutcome, pulse:companionPulse,
  apply:(battle,actor,effects)=>{for(const effect of effects) applyEffect(battle,actor,[actor],effect,0,false);}
};
const specialIO={restore:gainResource,heal:healHp,status:applyStatus,stat,emit:emitEvent,write,shield:(b,t,flat,sourceId)=>applyEffect(b,getActor(b,sourceId)??t,[t],{type:'shield',flat},0,false)};
const teamIO={emit:emitEvent,write,status:applyStatus,announce:announcePassive,checkModes:(b,team)=>{for(const a of b.actors.filter(a=>a.team===team))checkCombatMode(b,a,'team_resource_changed',modeIO);}};
const gearIO={status:applyStatus,heal:healHp,restore:gainResource,emit:emitEvent,write,shield:(battle,actor,flat)=>applyEffect(battle,actor,[actor],{type:'shield',flat},0,false)};
const living = isAlive;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function createBattle(
  content,
  campaign,
  encounterId,
  random = seededRandom(1),
  options = {},
) {
  if (options.continuesOnVictory !== undefined && typeof options.continuesOnVictory !== "boolean") throw new Error("Thiết lập chuyển trận không hợp lệ.");
  const encounter = content.encounters[encounterId];
  if (!encounter) throw new Error(`Unknown encounter ${encounterId}`);
  if (options.storyWaveIndex !== undefined && (!encounter.waves || !Number.isInteger(options.storyWaveIndex) || options.storyWaveIndex < 0 || options.storyWaveIndex >= encounter.waves.length)) throw new Error('Đợt truyện không hợp lệ.');
  if(encounter.category==='chronicle'&&encounter.bookId!=='book2'&&campaign.chronicles?.activeSession)throw Error('Hãy rời phiên pháo đài trước.');
  if(campaign.chronicles?.activeSession&&encounter.bookId!=='book2')throw Error('Hãy rời phiên pháo đài trước khi bắt đầu nội dung khác.');
  assertQuestUnlocked(encounter, campaign);
  if(encounter.bookId==='book2'&&(!campaign.chronicles?.firstClearIds.includes('book1.intro.f10')||campaign.chronicles.activeSession?.currentLocation!==content.chronicleEvents[encounter.chronicleEventId]?.steps.find(s=>s.battle)?.locationId))throw Error('Hãy đến đúng khu vực trong phiên pháo đài.');
  if(encounter.category==='chronicle'&&![...Object.values(campaign.chronicles.pendingByLocation),campaign.chronicles.activeSession?.activeEvent].filter(Boolean).some(p=>p.instanceId===options.chronicleInstanceId&&p.eventId===encounter.chronicleEventId&&p.level===options.enemyLevel&&p.stepId===p.battleStepId))throw Error('Hãy bắt đầu trận từ địa điểm đang khám phá.');
  if(encounter.superLevels&&options.enemyLevel!==undefined&&!encounter.superLevels.includes(options.enemyLevel))throw Error('Cấp thử thách không hợp lệ.');
  assertEncounterParty(encounter, campaign, content);
  if (!isValidParty(campaign.party, content.characters))
    throw new Error("Invalid party");
  assertOwnedParty(campaign);
  assertValidEquipment(campaign, content);
  normalizeBlacksmithState(campaign, content, campaign);
  const opponent=options.opponentCampaign;
  if(opponent){
    if(!isValidParty(opponent.party,content.characters))throw Error('Đội đối thủ không hợp lệ.');
    assertOwnedParty(opponent);assertValidEquipment(opponent,content);normalizeBlacksmithState(opponent,content,opponent);
  }
  const scale = enemyStatMultipliers(options.enemyScale ?? 1);
  const difficulty=questDifficulty(content,encounter,options.questDifficulty);
  const requestedLevel=difficulty?(Object.hasOwn(options,"enemyLevel")?options.enemyLevel:difficulty.level):encounter.superLevels?(options.enemyLevel??encounter.superLevels[0]):encounter.category==='chronicle'?options.enemyLevel:encounter.enemyLevel;
  if (
    !Number.isSafeInteger(options.roundOffset ?? 0) ||
    (options.roundOffset ?? 0) < 0
  )
    throw new Error("Thiết lập đợt quái không hợp lệ.");
  const makeActor = (definition, team, id) => ({
    ...structuredClone(definition),
    definitionId: definition.id,
    id,
    team,
    hp: definition.stats.maxHp,
    mp: definition.stats.maxMp,
    shield: 0,
    shieldSourceId: null,
    statuses: [],
    cooldowns:Object.fromEntries((definition.abilities??[]).filter(id=>content.abilities[id]?.initialCooldown).map(id=>[id,content.abilities[id].initialCooldown+1])),
    reactionRound: 0,
    followUpRound: 0,
    resourceValues: Object.fromEntries(
      Object.keys(definition.resources ?? {}).map((key) => [key, 0]),
    ),
  });
  const actors = [
    ...(options.partyActors
      ? structuredClone(options.partyActors)
      : campaign.party
          .filter(Boolean)
          .map((id) =>
            makeActor(resolveCharacter(content, campaign, id), "party", opponent?`party:${campaign.party.indexOf(id)}:${id}`:id),
          )),
    ...(opponent ? opponent.party.filter(Boolean).map(id=>makeActor(resolveCharacter(content,opponent,id),'enemy',`enemy:${opponent.party.indexOf(id)}:${id}`)) : (encounter.waves?.[options.storyWaveIndex ?? 0] ?? encounter.enemies).map((id, index) => {
      const definition = structuredClone(content.enemies[id]);
      definition.referenceLevel=encounter.referenceLevel??definition.referenceLevel;
      const level=requestedLevel??definition.referenceLevel;
      definition.stats = levelScaledEnemyStats(definition,level,content,scale,encounter);definition.level=level;
      definition.pendingSuperLevelBalance=level>content.progressionRules.default.enemyStatGrowthTargets.offense.atLevel;
      return makeActor(
        definition,
        "enemy",
        `${options.enemyIdPrefix ?? "enemy_"}${index}`,
      );
    })),
  ];
  if(opponent||options.pvpRules)for(const actor of actors){actor.masteryDisabled=true;actor.skillRanks=Object.fromEntries(Object.entries(actor.skillRanks??{}).map(([key,rank])=>[key,Math.min(5,rank)]));}
  if(opponent)for(const actor of actors){
    actor.actorKind='character';actor.characterId=actor.definitionId;actor.characterName=actor.name;if(actor.team==='enemy')actor.name+=' (đối thủ)';
    actor.formationSlot=(actor.team==='party'?campaign:opponent).party.indexOf(actor.characterId);
    for(const mode of Object.values(actor.combatModes??{})){mode.presentationScope='none';delete mode.background;delete mode.music;}
    for(const companion of Object.values(actor.companions??{}))delete companion.background;
  }
  for (const actor of actors.filter(item=>item.team==='party'&&!opponent)) {
    const slot=campaign.party.indexOf(actor.id);
    actor.formationSlot=slot>=0?slot:actors.filter(item=>item.team==='party').indexOf(actor);
  }
  if(encounter.bookId==='book2')restoreFortressVitals(campaign,actors);
  const encounterSupport=fortressSupport(campaign,content,encounter,options.chronicleInstanceId);
  if(encounterSupport)for(const actor of actors.filter(a=>a.team==='party'))actor.encounterModifiers={...encounterSupport.modifiers};
  const enemies = actors.filter((actor) => actor.team === "enemy");
  for (const actor of enemies) {
    const siblings = enemies.filter(
      (item) => item.definitionId === actor.definitionId,
    );
    if (siblings.length > 1)
      actor.name = `${actor.name} ${siblings.indexOf(actor) < 26 ? String.fromCharCode(65 + siblings.indexOf(actor)) : siblings.indexOf(actor) + 1}`;
  }
  for (const actor of actors) { initializeBoss(actor); clampBattleMp(content,actor); }
  const battle = {
    content,
    encounterId,
    arena:opponent?{prototype:true,opponentName:options.opponentName??'Đội mô phỏng',maxRounds:options.pvpRules?.maxRounds??40,rulesetVersion:options.pvpRules?.rulesetVersion}:null,
    pvpRules:options.pvpRules,
    formationSize:opponent?{party:4,enemy:4}:undefined,
    encounterSupport,
    questDifficulty:difficulty?.id??null,enemyLevel:requestedLevel??null,
    actors,
    random,
    round: options.roundOffset ?? 0,
    roundOffset: options.roundOffset ?? 0,
    sourceActors: structuredClone(options.sourceActors ?? []),
    phase: "main",
    extraTurnGrants: new Set(),
    extraTurnUsed: new Set(),
    extraPhaseRequired: false,
    turnOrderField: copyTurnOrderField(options.turnOrderField),
    mainTurnOrder: [],
    queue: [],
    cursor: 0,
    outcome: null,
    storyWave: encounter.waves ? {waveIndex:options.storyWaveIndex ?? 0,totalWaves:encounter.waves.length} : null,
    continuesOnVictory: options.continuesOnVictory === true || Boolean(encounter.waves && (options.storyWaveIndex ?? 0) < encounter.waves.length-1),
    log: [...(options.log ?? [])],
    events: [],
    actionCount: 0,
  };
  for(const actor of actors)for(const initial of actor.initialStatuses??[])applyStatus(battle,actor,initial.status,initial.duration,actor.id,{stacks:initial.stacks??1,silent:true});
  initializeTeamResources(battle,options.teamResources);
  for(const actor of actors){const p=actor.passive;if(p?.type==='starting_resource_skill_chance'&&!(options.partyActors??[]).some(a=>a.id===actor.id))gainResource(battle,actor,p.resource,p.initial);}
  if (!actors.some((actor) => actor.team === "party" && living(actor))) {
    battle.outcome = "defeat";
    write(battle, "Không còn đồng đội đứng vững để tiếp tục đợt mới.");
    return battle;
  }
  initializeGearEncounter(battle,(options.storyWaveIndex??0)>0);
  startRound(battle);
  return battle;
}

export function getActor(battle, id) {
  return (
    battle.actors.find((actor) => actor.id === id) ??
    battle.sourceActors?.find((actor) => actor.id === id)
  );
}
export function activeActor(battle) {
  return battle.outcome ? null : getActor(battle, battle.queue[battle.cursor]);
}

function write(battle, message) {
  battle.log.push(message);
  if (battle.log.length > 200) battle.log.shift();
}

// Presentation events describe actual outcomes, independently of translated log text.
// They contain only the most recent action, including reactions and next-turn regen.
function emitEvent(battle, event) {
  battle.events.push(event);
}

function statusDefinitions(battle, actor) {
  return activeStatuses(actor).map(
    (status) => battle.content.statuses[status.id],
  );
}
function modifier(battle, actor, key, ignoreConsumables = false) {
  return statusModifier(battle.content, actor, key, ignoreConsumables);
}
function flag(battle, actor, key) {
  if(key==='skipTurn'&&stunImmune(battle.content,actor)&&!activeStatuses(actor).some(s=>s.bypassControlImmunity&&battle.content.statuses[s.id]?.skipTurn))return false;
  return statusDefinitions(battle, actor).some((status) => status[key]);
}
function stat(battle, actor, key, ignoreConsumables = false) {
  return battleStat(battle.content, actor, key, ignoreConsumables);
}

function attackContext(battle, actor) {
  const buffs = actor.statuses.filter(
    (status) =>
      battle.content.statuses[status.id].consumeOnAttack === true,
  );
  return {
    pvpTargetSnapshot:battle.pvpRules?battle.actors.filter(a=>a.team!==actor.team&&living(a)).map(a=>a.id):undefined,
    teamResourceValues:Object.fromEntries(Object.entries(battle.teamResources?.[actor.team]??{}).map(([id,state])=>[id,state.value])),
    damageUseBuffs:captureDamageBuffs(battle.content,actor),
    gearTargetHpRatios:new Map(battle.actors.map(a=>[a.id,a.hp/a.stats.maxHp])),
    gearImpacts:[],
    weaknessTargets: new Set(),
    exposures: captureExposures(battle),
    consumedTargets: new Map(),
    newlyMarkedTargets: new Set(),
    shieldBreakBuffs: new Set(),
    shieldedAllyHits: new Set(),
    damagedAllyHits: new Set(),
    attackBuffs: buffs,
    mortgageDamageBonus:mortgageDamageBonus(actor),
    multiplier:1,
  };
}

function finishAttackContext(battle, actor, context) {
  if(context.lifeStealHp>0&&living(actor))healHp(battle,actor,context.lifeStealHp,actor.id,'Hút máu');
  settleDamageBuffs(battle,actor,context,{emit:emitEvent,write});
  finishExposures(battle, context, (target, statusId, remaining) => {
    emitEvent(battle, {type:"status_consumed", sourceId:actor.id, targetId:target.id, statusId, amount:1, remaining});
    write(battle, `${target.name}: tiêu 1 tầng ${battle.content.statuses[statusId].name}, còn ${remaining} tầng.`);
  });
  for (const [sourceId, proc] of context.supportMpSources ?? []) {
    const source = getActor(battle, sourceId);
    if (source && living(source)) {
      const passive = source.passive;
      announcePassive(battle,source,source.id);
      write(battle, `${source.name} kích hoạt ${passive.name}.`);
      gainResource(battle, source, "mp", passive.amount + (proc.weakness ? passive.weaknessBonus : 0), source.id);
    }
  }
  context.supportMpSources?.clear();
  actor.statuses = actor.statuses.filter(
    (status) => !context.attackBuffs.includes(status),
  );
  if (living(actor))
    for (const statusId of context.shieldBreakBuffs)
      applyStatus(battle, actor, statusId, undefined, actor.id);
  gearAfterAttack(battle,actor,context,gearIO);
  triggerShieldSurvivalFollowups(battle,actor,context);
  triggerAllySkillCounters(battle,actor,context);
  triggerReceivedDamageCounters(battle,actor,context);
  triggerBlessedResource(battle,context);
  triggerKillRepeat(battle,actor,context);
}

// Reaction limits are reserved before creating resources or resolving repeated damage.
function triggerBlessedResource(battle,context){
 for(const id of context.blessedResourceOwners??[]){const owner=getActor(battle,id),p=owner?.passive;if(!living(owner)||p?.type!=='blessed_team_resource')continue;
  const key=Array.from({length:p.perRound},(_,i)=>p.type+':'+i).find(key=>procAvailable(battle,owner,key));if(!key)continue;
  markProc(battle,owner,key);announcePassive(battle,owner,owner.id);changeTeamResource(battle,owner,p.resource,p.amount,teamIO);
 }
}
function triggerCreationSupport(battle,source,skill,context){
 if(skill.id.startsWith('$')||skill.activation==='passive'||context.reaction||context.automatic)return;
 for(const owner of battle.actors){const p=owner.passive;if(!living(owner)||owner.team!==source.team||owner.id===source.id||!['ally_team_creation','ally_creation_followup'].includes(p?.type)||!context.explicitTeamCreated?.has(p.resource))continue;
  // Keep the first key compatible with saved one-use quotas; all uses share the round clock.
  const limit=p.type==='ally_creation_followup'?(p.perRound??1):1;
  const key=Array.from({length:limit},(_,i)=>i===0?p.type:p.type+':'+i).find(k=>procAvailable(battle,owner,k));if(!key)continue;
  if(p.type==='ally_creation_followup'){
   const target=battle.actors.filter(a=>a.team!==owner.team&&living(a)).sort((a,b)=>b.hp-a.hp||(a.formationSlot??99)-(b.formationSlot??99))[0];
   if(!target||!canTriggerFollowUp(owner,source,target)||!reservePvpAutomatic(battle,owner,modeIO))continue;
   markProc(battle,owner,key);announcePassive(battle,owner,target.id);
   const follow=resolveRankedAbility(battle.content,owner,p.followUpAbility),reaction={...attackContext(battle,owner),pvpRegistered:true,skill:follow,skillId:follow.id,reaction:true,reactionKind:'follow_up',primaryTargetId:target.id};
   emitEvent(battle,{type:'reaction',kind:'follow_up',label:FOLLOW_UP_LABEL,sourceId:owner.id,targetId:target.id,abilityId:follow.id});write(battle,owner.name+' '+FOLLOW_UP_LABEL+' bằng '+follow.name+'.');
   for(const effect of follow.effects)applyEffect(battle,owner,[target],effect,0,false,reaction);finishAttackContext(battle,owner,reaction);
   if(living(owner))changeTeamResource(battle,owner,p.resource,p.amount,teamIO);
  }else{markProc(battle,owner,p.type);announcePassive(battle,owner,owner.id);changeTeamResource(battle,owner,p.resource,p.amount,teamIO);applyStatus(battle,owner,p.statusId,p.duration,owner.id);}
 }
}
function triggerKillRepeat(battle,owner,context){
 const p=owner.passive;if(!living(owner)||p?.type!=='team_spend_penetration'||context.reaction||context.automatic||context.skillId!==p.repeatAbility||!context.directDefeats?.size||!procAvailable(battle,owner,'kill_repeat'))return;
 const targets=battle.actors.filter(a=>a.team!==owner.team&&living(a));if(!targets.length||!reservePvpAutomatic(battle,owner,modeIO))return;
 markProc(battle,owner,'kill_repeat');announcePassive(battle,owner,targets[0].id);
 const skill=resolveRankedAbility(battle.content,owner,p.repeatAbility),reaction={...attackContext(battle,owner),pvpRegistered:true,skill,skillId:skill.id,reaction:true,reactionKind:'follow_up',primaryTargetId:targets[0].id,teamResourceSpent:{[p.resource]:p.virtualSpent}};
 write(battle,owner.name+' '+FOLLOW_UP_LABEL+' bằng '+skill.name+' · tính là dùng Hồn Kiếm, không trả chi phí.');
 emitEvent(battle,{type:'reaction',kind:'follow_up',label:FOLLOW_UP_LABEL,sourceId:owner.id,targetId:targets[0].id,targetIds:targets.map(t=>t.id),area:true,abilityId:skill.id});
 for(const effect of skill.effects)applyEffect(battle,owner,targets,effect,0,true,reaction);
 finishAttackContext(battle,owner,reaction);
}
function startRound(battle) {
  battle.round += 1;
  battle.phase = "main";
  battle.extraTurnGrants = new Set();
  battle.extraTurnUsed = new Set();
  battle.extraPhaseRequired = false;
  if (battle.round - (battle.roundOffset ?? 0) > 60) {
    battle.outcome = "draw";
    for (const actor of battle.actors) { checkCombatMode(battle,actor,"battle_end",modeIO); closeFormula(battle,actor,modeIO,"battle_end"); }
    write(battle, "Trận đấu dừng sau 60 vòng.");
    return;
  }
  expireFormulaFields(battle,modeIO);
  expireRoundEffects(battle,modeIO);
  expireTurnOrderField(battle,modeIO);
  for(const owner of battle.actors){const p=owner.passive;if(!living(owner)||p?.type!=='previous_round_team_spend_buff'||!procAvailable(battle,owner,p.type))continue;
    markProc(battle,owner,p.type);const state=teamResourceState(battle,owner,p.resource),spent=state?.spentRound===battle.round-1?state.spent:0,ratio=Math.min(p.cap,spent*p.perStack);
    if(ratio>0){announcePassive(battle,owner,owner.id);applyStatus(battle,owner,p.statusId,1,owner.id,{appliedModifiers:{[p.stat]:ratio}});}
  }
  activateRoundGear(battle,{status:applyStatus,heal:healHp,restore:gainResource,emit:emitEvent,write});
  roundSummons(battle,"start",modeIO);
  for(const owner of battle.actors){const p=owner.passive;if(!living(owner)||p?.type!=='round_team_resource'||!procAvailable(battle,owner,p.type))continue;
    markProc(battle,owner,p.type);const members=battle.actors.filter(a=>a.team===owner.team&&a.tags?.includes(p.memberTag)).length;
    announcePassive(battle,owner,owner.id);changeTeamResource(battle,owner,p.resource,members>=p.memberThreshold?p.enhancedAmount:p.amount,teamIO);
    if(members>=p.memberThreshold&&p.enhancedTeamMpRatio)for(const ally of battle.actors.filter(a=>a.team===owner.team&&living(a)))gainResource(battle,ally,"mp",Math.floor(battleMaxMp(battle.content,ally)*p.enhancedTeamMpRatio),owner.id);
  }
  for(const owner of battle.actors)checkCombatMode(battle,owner,'team_resource_changed',modeIO);
  if (checkOutcome(battle)) return;
  battle.queue = orderActorIds(battle,battle.actors.filter(living).map(actor=>actor.id));
  battle.mainTurnOrder = [...battle.queue];
  battle.cursor = 0;
  for (const actor of battle.actors) {
    for (const id of Object.keys(actor.cooldowns))
      actor.cooldowns[id] = Math.max(0, actor.cooldowns[id] - 1);
  }
  write(battle, `— Vòng Chính ${battle.round} —`);
  beginTurn(battle);
}

function announcePassive(battle,source,targetId,label=source?.passive?.name) {
  if (source?.passive && label) emitEvent(battle,{type:"passive",sourceId:source.id,targetId,label});
}

function healHp(battle, target, requested, sourceId, label = "") {
  if (!living(target)||isInAgony(target)) return 0;
  if(externalHealingBlocked(target,sourceId)){
    emitEvent(battle,{type:'healing_blocked',sourceId,targetId:target.id});
    write(battle,target.name+': Thế Chấp chỉ cho phép tự hồi HP.');return 0;
  }
  const effective=receivedSupport(battle.content,target,requested,"healingReceivedReduction");
  const {paid,remaining}=payLifeDebt(target,effective);
  if(paid>0){
    emitEvent(battle,{type:'life_debt_paid',sourceId,targetId:target.id,amount:paid,remaining:lifeDebt(target)});
    write(battle,`${target.name} thanh toán ${paid} Thế Chấp${label ? " từ " + label : ""}, còn ${lifeDebt(target)} HP.`);
  }
  const amount = Math.min(Math.max(0,target.stats.maxHp - target.hp),remaining);
  target.hp += amount;
  if (amount > 0) {
    const healer=getActor(battle,sourceId);
    if (label && (healer?.passive?.name===label || healer?.passive?.type==="shield_break_heal")) announcePassive(battle,healer,target.id,label);
    emitEvent(battle, { type: "heal", targetId: target.id, sourceId, amount });
    const source = getActor(battle, sourceId), passive = target.passive;
    if (passive?.type === "ally_heal_mp" && source && source.id !== target.id && source.team === target.team && procAvailable(battle,target,"ally_heal_mp")) {
      markProc(battle,target,"ally_heal_mp");
      announcePassive(battle,target,target.id);
      gainResource(battle,target,"mp",Math.ceil(battleMaxMp(battle.content,target) * passive.ratio),target.id);
    }
  }
  write(battle, `${target.name} hồi ${amount} HP${label ? " từ " + label : ""}.`);
  return amount;
}

// Healing also restores MP to the healed ally, based on the HP Amaryllis authored for that target.
function grantHealMp(battle, healer, target, healed) {
  const passive = healer.passive;
  if (passive?.type !== "heal_mp_regen" || !living(healer) || !living(target) || target.team !== healer.team || healed <= 0) return;
  const want = Math.min(passive.cap, Math.floor(healed * passive.ratio));
  if (want <= 0) return;
  announcePassive(battle, healer, target.id);
  gainResource(battle, target, "mp", want, healer.id);
}

function beginTurn(battle) {
  const actor = activeActor(battle);
  if (!actor) return;
  checkCombatMode(battle,actor,"turn_start",modeIO);
  if (battle.phase === "extra") battle.extraTurnUsed.add(actor.id);
  // Poison resolves before any regeneration or turn-start passive, even after its source falls.
  for (const status of [...actor.statuses]) {
    const definition = battle.content.statuses[status.id];
    if (!definition.damageOverTime) continue;
    const requested=Math.floor(status.potency*(status.stacks??1)*incomingDamageMultiplier(modifier(battle,actor,"damageTakenBonus"))*(1-agonyReduction(actor)));
    const periodicCap=applyPvpDamageCap(battle,getActor(battle,status.sourceId),actor,requested,battle.pvpRules?pvpPeriodicContext(battle,getActor(battle,status.sourceId),actor):{},false,modeIO);
    const life=applyLifeDamage(battle,actor,periodicCap.amount>0?periodicCap.amount:status.potency>0&&isInAgony(actor)?1:0,{element:definition.damageOverTime.element,healthFloor:bossHealthFloor(actor)},{write,emit:emitEvent});
    const amount=life.hpLost+life.maxHpLost;
    maybeEnterContingency(battle,actor,life.hpLost);
    status.remaining -= 1;
    emitEvent(battle, {
      type: "damage",
      targetId: actor.id,
      sourceId: status.sourceId,
      amount,
      absorbed: 0,
      weakness: false,
      periodic: true,
      ...(periodicCap.info?{pvpDamage:periodicCap.info}:{}),
      ...(life.maxHpLost?{maxHpDamage:life.maxHpLost}:{}),
    });
    write(battle, `${actor.name} mất ${amount} ${life.maxHpLost?"HP tối đa":"HP"} vì ${definition.name}.`);
    if(amount>0) gearHpLoss(battle,actor,actor.hp,gearIO);
    transitionBossPhases(battle, { write, restoreMp: gainResource });
    if (status.remaining <= 0)
      actor.statuses = actor.statuses.filter((item) => item !== status);
    if (!living(actor)) {
      actor.statuses = actor.statuses.filter(
        (item) => !battle.content.statuses[item.id].turnStartAbility,
      );
      onActorDefeated(battle,getActor(battle,status.sourceId),actor);
      write(battle, `${actor.name} gục xuống vì ${definition.name}.`);
      advance(battle); // Skip the defeated actor, including a last-enemy victory.
      return;
    }
  }
  gearMainTurn(battle,actor,gearIO);
  const passive = actor.passive;
  if (
    passive?.type === "magic_followup_mp" &&
    actor.resourceValues[passive.resource] >= passive.threshold
  ) {
    const consumed = actor.resourceValues[passive.resource];
    actor.resourceValues[passive.resource] = 0;
    announcePassive(battle,actor);
    write(
      battle,
      `${actor.name} kích hoạt ${passive.name}, tiêu ${consumed} ${actor.resources[passive.resource].name}: hồi ${Math.round(passive.mpRestoreRatio * 100)}% MP tối đa toàn đội.`,
    );
    for (const ally of battle.actors.filter(
      (ally) => ally.team === actor.team && living(ally),
    )) {
      gainResource(
        battle,
        ally,
        "mp",
        Math.round(battleMaxMp(battle.content,ally) * passive.mpRestoreRatio),
        actor.id,
      );
    }
  }
  for (const status of [...actor.statuses]) {
    const definition = battle.content.statuses[status.id];
    if (definition.regen) {
      healHp(battle, actor, actor.stats.maxHp * definition.regen, status.sourceId, definition.name);
    }
  }
  if (actor.pendingExclusiveHeal) {
    const pending = actor.pendingExclusiveHeal;
    delete actor.pendingExclusiveHeal;
    healHp(battle, actor, actor.stats.maxHp * pending.ratio, pending.sourceId, pending.name);
  }
  for (const status of [...actor.statuses]) {
    const abilityId = battle.content.statuses[status.id].turnStartAbility;
    if (!abilityId) continue;
    const growth = actor.passive;
    if (growth?.type === "field_growth" && growth.statusId === status.id) {
      status.growth = Math.min(growth.maxStacks, (status.growth ?? 0) + 1);
      const label = {
        attack: "ATK",
        magic: "MAG",
        defense: "DEF",
        resistance: "RES",
        speed: "SPD",
      }[growth.stat];
      write(
        battle,
        `${actor.name}: ${growth.name} +${Math.round(status.growth * growth.ratio * 100)}% ${label}.`,
      );
    }
    const skill = battle.content.abilities[abilityId];
    const context = {
      ...attackContext(battle, actor),
      attackBuffs: [],
      multiplier: 1,
      automatic: true,
    };
    write(
      battle,
      `${actor.name} kích hoạt ${skill.name} từ ${battle.content.statuses[status.id].name}.`,
    );
    const targets = targetsFor(battle, actor, skill);
    emitEvent(battle,{type:"ability_cast",sourceId:actor.id,abilityId:skill.id,label:skill.name,attack:true,automaticCast:true,area:targetsAsGroup(skill),targetId:targets[0]?.id,presentation:skill.presentation});
    context.skillId=skill.id;context.skill=skill;
    for (const effect of skill.effects) {
      for (const target of targets)
        for (let i = 0; i < (effect.hits ?? 1) && living(target); i++)
          hit(battle, actor, target, effect, 0, {
            reaction: true,
            area: true,
            actionContext: context,
          });
    }
    exclusiveAutomaticHit(battle,actor,skill.id,context.gearImpacts?.some(h=>h.lostHp+h.absorbed>0),specialIO);
    finishAttackContext(battle, actor, context);
    transitionBossPhases(battle, { write, restoreMp: gainResource });
    if (checkOutcome(battle)) return;
  }
  if (flag(battle, actor, "skipTurn")) {
    write(battle, `${actor.name} bị choáng, mất lượt hành động.`);
    finishStatuses(battle, actor, [...actor.statuses], false);
    battle.actionCount++;
    // A skipped turn is still the owner's turn: turn-counted modes must tick here too.
    spendModeTurn(actor);
    for (const member of battle.actors) checkCombatMode(battle, member, "action_end", modeIO);
    endTurnPassive(battle, actor);
    advance(battle);
  }
}

function endTurnPassive(battle, actor) {
  const passive = actor.passive;
  if (!living(actor) || passive?.type !== "end_turn_mp_regen") return;
  announcePassive(battle,actor);
  write(battle, `${actor.name} kích hoạt ${passive.name} cuối lượt.`);
  for (const ally of battle.actors.filter(
    (target) => target.team === actor.team && living(target),
  )) {
    const multiplier = ally.tags?.includes(passive.tag)
      ? passive.tagMultiplier
      : 1;
    gainResource(
      battle,
      ally,
      "mp",
      Math.ceil(battleMaxMp(battle.content,ally) * passive.ratio * multiplier),
      actor.id,
    );
  }
}

function onActorDefeated(battle,killer,target) {
  clearLifeDebt(target);
  const passive=killer?.passive;
  if (!killer || killer.team===target.team || passive?.type!=="kill_mp_discount" || killer.statuses.some(status=>status.id===passive.statusId)) return;
  announcePassive(battle,killer);
  applyStatus(battle,killer,passive.statusId,undefined,killer.id);
  write(battle,killer.name+" kích hoạt "+passive.name+": giảm "+Math.round(passive.ratio*100)+"% MP tiêu hao.");
}

// Shared revival: restore the whole team at the authored ratios, bringing the fallen back.
// Revived actors do not gain a turn in the current round; the next round rebuilds the queue.
function reviveTeam(battle, actor, effect, actionContext) {
  const hpRatio = effect.hpRatio ?? 1, mpRatio = effect.mpRatio ?? 1;
  for (const ally of battle.actors.filter(item => item.team === actor.team)) {
    if (ally.stats.maxHp <= 0) continue;
    const fallen = !living(ally);
    // Living allies with a self-only pact retain their debt/HP even under team restoration.
    // Revival of an actually fallen ally is allowed: defeat already clears its debt.
    if(!fallen&&externalHealingBlocked(ally,actor.id)){
      healHp(battle,ally,0,actor.id);
      gainResource(battle,ally,'mp',Math.max(0,Math.round(battleMaxMp(battle.content,ally)*mpRatio)-ally.mp),actor.id);
      continue;
    }
    if (fallen) {
      ally.shield = 0;ally.shieldSourceId = null;delete ally.shieldExpiresAfterRound;
    }
    // Revival pays off the mortgage ledger but Deep Wound stays: the authored restoration is always
    // large enough to fill the missing HP through that reduction. Fallen actors keep only Deep Wound.
    ally.statuses = ally.statuses.filter(status => {
      const definition = battle.content.statuses[status.id];
      if (definition.healingDebt) return false;
      if (fallen && !definition.healingReceivedReduction) return false;
      return true;
    });
    clearLifeDebt(ally);
    ally.hp = Math.max(1, Math.round(ally.stats.maxHp * hpRatio));
    ally.mp = Math.round(battleMaxMp(battle.content, ally) * mpRatio);
    clampBattleMp(battle.content, ally);
    write(battle, fallen
      ? `${ally.name} hồi sinh với ${ally.hp} / ${ally.stats.maxHp} HP và ${ally.mp} MP.`
      : `${ally.name} được hồi đầy: ${ally.hp} / ${ally.stats.maxHp} HP, ${ally.mp} MP.`);
    emitEvent(battle, {type:'revive',targetId:ally.id,sourceId:actor.id,fallen,amount:ally.hp,mp:ally.mp,abilityId:actionContext?.skillId});
  }
}

function checkOutcome(battle) {
  if (!battle.actors.some((actor) => actor.team === "enemy" && living(actor)))
    battle.outcome = "victory";
  else if (
    !battle.actors.some((actor) => actor.team === "party" && living(actor))
  )
    battle.outcome = "defeat";
  for (const actor of battle.actors) {
    if(!living(actor)||(battle.outcome&&!(battle.outcome==='victory'&&battle.continuesOnVictory)))clearLifeDebt(actor);
    checkCombatMode(battle,actor,battle.outcome ? "battle_end" : "owner_state",modeIO);
    if (!living(actor) || (battle.outcome && !(battle.outcome==='victory' && battle.continuesOnVictory))) closeFormula(battle,actor,modeIO,!living(actor)?'owner_ko':'battle_end');
  }
  return battle.outcome;
}

function advance(battle) {
  if (checkOutcome(battle)) return;
  battle.cursor += 1;
  while (
    battle.cursor < battle.queue.length &&
    !living(getActor(battle, battle.queue[battle.cursor]))
  )
    battle.cursor += 1;
  if (battle.cursor >= battle.queue.length) finishPhase(battle);
  else beginTurn(battle);
}

function triggerExtraPhasePassives(battle) {
  for(const id of battle.queue){
    const actor=getActor(battle,id),p=actor?.passive;
    if(!living(actor)||p?.type!=='extra_phase_resource_buff'||!procAvailable(battle,actor,p.type))continue;
    markProc(battle,actor,p.type);announcePassive(battle,actor,actor.id);
    changeTeamResource(battle,actor,p.resource,p.amount,teamIO);
    applyStatus(battle,actor,p.statusId,p.duration,actor.id);
  }
}

// The phase boundary is independent of recipient survival: even an empty extra phase resolves.
function finishPhase(battle) {
  if (checkOutcome(battle)) return;
  if (battle.phase === "main" && battle.extraPhaseRequired) {
    battle.phase = "extra";
    battle.queue = orderActorIds(battle,battle.actors.filter(actor => living(actor) && battle.extraTurnGrants.has(actor.id)).map(actor=>actor.id));
    battle.cursor = 0;
    write(battle, `— Vòng Phụ ${battle.round} —`);
    emitEvent(battle, { type: "phase", phase: "extra", round: battle.round });
    triggerExtraPhasePassives(battle);
    if (battle.queue.length) { beginTurn(battle); return; }
  }
  finishMainRound(battle);
}

function finishMainRound(battle) {
  if (checkOutcome(battle) || battle.endOfRoundResolvedRound === battle.round) return;
  battle.endOfRoundResolvedRound = battle.round;
  roundSummons(battle,"end",modeIO);
  if (checkOutcome(battle)) return;
  expireRoundSummons(battle,modeIO);
  for (const actor of battle.actors) checkCombatMode(battle,actor,"round_end",modeIO);
  for (const source of battle.actors.filter(living)) {
    const passive = source.passive;
    if(passive?.type==='spent_resource_team_mp'){
      const ratio=Math.min(passive.cap,teamResourceSpent(battle,source,passive.resource)*passive.perStack);
      if(ratio>0){announcePassive(battle,source);write(battle,source.name+' kích hoạt '+passive.name+': hồi '+Math.round(ratio*100)+'% MP toàn đội.');for(const ally of battle.actors.filter(a=>a.team===source.team&&living(a)))gainResource(battle,ally,'mp',Math.ceil(battleMaxMp(battle.content,ally)*ratio),source.id);}
      continue;
    }
    if (passive?.type === "end_round_team_mp") {
      announcePassive(battle,source);
      write(battle,source.name+" kích hoạt "+passive.name+" cuối Vòng.");
      for (const ally of battle.actors.filter(item=>living(item) && item.team===source.team)) gainResource(battle,ally,"mp",Math.ceil(battleMaxMp(battle.content,ally)*passive.ratio),source.id);
      continue;
    }
    if (passive?.type !== "end_round_lowest_mp") continue;
    const target = battle.actors.filter(actor => living(actor) && actor.team === source.team && battleMaxMp(battle.content,actor) > 0)
      .sort((a,b) => a.mp / battleMaxMp(battle.content,a) - b.mp / battleMaxMp(battle.content,b))[0];
    if (target) {
      announcePassive(battle,source,target.id);
      write(battle, `${source.name} kích hoạt ${passive.name} cuối Vòng.`);
      gainResource(battle, target, "mp", Math.ceil(battleMaxMp(battle.content,target) * passive.ratio), source.id);
    }
  }
  expireFormulaFields(battle,modeIO,true);
  expireRoundEffects(battle,modeIO,true);
  expireTurnOrderField(battle,modeIO,true);
  expireAgony(battle,{write,emit:emitEvent});
  emitEvent(battle, { type: "round_end", round: battle.round });
  write(battle, `— Kết thúc Vòng Chính ${battle.round} —`);
  if(battle.arena&&battle.round>=battle.arena.maxRounds){battle.outcome='draw';write(battle,'Đã hết giới hạn vòng · Hòa.');checkOutcome(battle);return;}
  startRound(battle);
}

export function targetsFor(battle, actor, skill) {
  skill=formationAbility(skill,actor);
  if (skill.target === "self") return living(actor) ? [actor] : [];
  if (skill.target === "adjacent_allies") return adjacentAllies(battle,actor);
  const allies = skill.target === "ally" || skill.target === "all_allies";
  let targets = battle.actors.filter(
    (target) =>
      living(target) &&
      (allies ? target.team === actor.team : target.team !== actor.team),
  );
  if(skill.targetElement)targets=targets.filter(target=>target.element===skill.targetElement);
  if(skill.targetTag)targets=targets.filter(target=>target.tags?.includes(skill.targetTag));
  if(skill.excludeSelf)targets=targets.filter(target=>target.id!==actor.id);
  if (skill.requiresTargetStatus) targets = targets.filter(target => target.statuses.some(status => status.id === skill.requiresTargetStatus && status.stacks > 0));
  if (skill.target === "enemy") {
    const taunting = targets.filter((target) => flag(battle, target, "taunt"));
    if (taunting.length) targets = taunting;
  }
  return skill.excludeSelf ? targets.filter(target => target.id !== actor.id) : targets;
}

// Legal anchors and actual area recipients are separate: splash must preserve formation gaps.
export function selectedTargets(battle,actor,skill,targetId) {
  skill=formationAbility(skill,actor);
  if (skill.target==="enemy_splash") return splashEnemies(battle,actor,targetId);
  const legal=targetsFor(battle,actor,skill);
  return targetsAsGroup(skill)||skill.target==="self" ? legal : legal.filter(target=>target.id===targetId);
}

export function abilityAvailability(battle, actor, skill) {
  if(actor&&(skill.targetElement||skill.targetTag||skill.excludeSelf)&&!targetsFor(battle,actor,skill).length)return {ok:false,reason:"Không có đồng đội phù hợp để nhận kỹ năng."};
  if (!actor || !living(actor))
    return { ok: false, reason: "Không thể hành động." };
  if(skill.requiresLifeDebt&&lifeDebt(actor)<=0)return {ok:false,reason:'Cần có Thế Chấp để tất toán.'};
  if(skill.requiresHpBelow!==undefined && actor.hp/actor.stats.maxHp>=skill.requiresHpBelow) return {ok:false,reason:"HP chưa đủ thấp để dùng chiêu này."};
  if(skill.maxSelfStatus&&(actor.statuses.find(s=>s.id===skill.maxSelfStatus)?.stacks??0)>=battle.content.statuses[skill.maxSelfStatus].maxStacks)return {ok:false,reason:'Đã đạt tối đa '+battle.content.statuses[skill.maxSelfStatus].maxStacks+' tầng.'};
  const teamCheck=teamCostAvailability(battle,actor,skill);if(teamCheck)return teamCheck;
  const formulaCheck = formulaAvailability(battle,actor,skill);
  if (formulaCheck) return formulaCheck;
  const modeCheck = modeAvailability(actor,skill);
  if (modeCheck) return modeCheck;
  if ((actor.cooldowns[skill.id] ?? 0) > 0)
    return {
      ok: false,
      reason: `Hồi chiêu: ${actor.cooldowns[skill.id]} vòng.`,
    };
  if (hpCost(skill,actor)>0 && actor.hp<=hpCost(skill,actor)) return {ok:false,reason:"Không đủ HP; không thể tự hạ gục bằng chi phí kỹ năng."};
  if (actor.mp < mpCost(skill,actor,battle))
    return { ok: false, reason: "Không đủ MP." };
  if (skill.target === "adjacent_allies" && !targetsFor(battle,actor,skill).length) return {ok:false,reason:"Không có đồng đội còn sống ở hai ô kề."};
  if (skill.requiresTargetStatus && !targetsFor(battle,actor,skill).length)
    return { ok: false, reason: `Cần mục tiêu có ${battle.content.statuses[skill.requiresTargetStatus].name}.` };
  const resource = resourceCost(skill,actor);
  if (
    resource &&
    (actor.resourceValues[resource.id] ?? 0) <
      (resource.min ?? resource.amount ?? 1)
  )
    return {
      ok: false,
      reason: `Chưa đủ ${actor.resources?.[resource.id]?.name ?? resource.id}.`,
    };
  return { ok: true, reason: "" };
}

function gainResource(battle, actor, id, amount, sourceId = actor.id) {
  if (id === "mp") {
    const recovered = Math.min(amount, battleMaxMp(battle.content,actor) - actor.mp);
    actor.mp = clamp(actor.mp + amount, 0, battleMaxMp(battle.content,actor));
    if (recovered > 0) {
      emitEvent(battle, {
        type: "mp_restore",
        targetId: actor.id,
        sourceId,
        amount: recovered,
      });
      write(battle, `${actor.name} hồi ${recovered} MP.`);
    }
    return;
  }
  if (!actor.resources?.[id]) return;
  // Exhaustion prevents resource generation, but does not remove stored resources.
  if (amount > 0 && flag(battle, actor, "blockResourceGain")) return;
  const beforeResource=actor.resourceValues[id]??0;
  actor.resourceValues[id] = clamp(
    (actor.resourceValues[id] ?? 0) + amount,
    0,
    actor.resources[id].max,
  );
  exclusiveResourceChanged(battle,actor,id,actor.resourceValues[id]-beforeResource,specialIO);
}

function coverTarget(battle, target, area = false, reaction = false) {
  for (const status of target.statuses) {
    const definition = battle.content.statuses[status.id];
    if (definition.cover && (!area || definition.coverArea) && (!reaction || definition.coverReactions)) {
      const source = getActor(battle, status.sourceId);
      if (source && living(source) && source.id !== target.id) return source;
    }
  }
  // Team guard: a living ally projects cover onto the whole team while his own status lasts.
  for (const source of battle.actors) {
    if (source.id === target.id || source.team !== target.team || !living(source)) continue;
    const guardian = source.statuses.some(status => {
      if (status.sourceId !== source.id) return false;
      const definition = battle.content.statuses[status.id];
      return definition.cover && definition.coverTeam
        && (!area || definition.coverArea) && (!reaction || definition.coverReactions);
    });
    if (guardian) return source;
  }
  return target;
}

// Element specialists react once after a complete active cast, after its exposure is settled.
function dispelBuffs(battle,actor,target,count,all=false){
 const buffs=target.statuses.filter(status=>battle.content.statuses[status.id].kind==='buff');
 const removed=all?buffs:buffs.slice(0,count);
 if(removed.length){target.statuses=target.statuses.filter(status=>!removed.includes(status));clampBattleMp(battle.content,target);emitEvent(battle,{type:'dispel',sourceId:actor.id,targetId:target.id,amount:removed.length});}
 write(battle,target.name+': bị xóa '+removed.length+' hiệu ứng có lợi.');
}
function triggerElementSupports(battle,source,skill,context){
 if(!context.dealtDirectDamage||context.reaction||context.automatic||skill.activation==='passive'||skill.id.startsWith('$'))return;
 for(const owner of battle.actors){
  const p=owner.passive;
  if(!living(owner)||owner.team!==source.team||owner.id===source.id||p?.element!==source.element)continue;
  const impacts=context.gearImpacts.filter(impact=>(impact.elements??[impact.element]).includes(p.element));
  if(p.type==='element_ally_weakness_mp'){
   if(!living(source)||source.mp>=battleMaxMp(battle.content,source)||!impacts.some(impact=>impact.weakness)||!procAvailable(battle,owner,p.type))continue;
   markProc(battle,owner,p.type);announcePassive(battle,owner,source.id);
   write(battle,owner.name+' kích hoạt '+p.name+'.');gainResource(battle,source,'mp',p.amount,owner.id);
  }
  if(p.type!=='element_ally_followup'||!procAvailable(battle,owner,p.type))continue;
  const targets=impacts.map(impact=>impact.target).filter(target=>canTriggerFollowUp(owner,source,target));
  const target=targets.find(target=>target.id===context.primaryTargetId)??targets[0];
  if(!target||!reservePvpAutomatic(battle,owner,modeIO))continue;
  markProc(battle,owner,p.type);announcePassive(battle,owner,target.id);
  const ability=battle.content.abilities[p.followUpAbility];
  const reactionContext={...attackContext(battle,owner),pvpRegistered:true,skill:ability,skillId:ability.id,reaction:true,reactionKind:'follow_up',primaryTargetId:target.id};
  write(battle,owner.name+' '+FOLLOW_UP_LABEL+' bằng '+ability.name+'.');
  emitEvent(battle,{type:'reaction',kind:'follow_up',label:FOLLOW_UP_LABEL,sourceId:owner.id,targetId:target.id,abilityId:ability.id});
  for(const effect of ability.effects)applyEffect(battle,owner,[target],effect,0,false,reactionContext);
  finishAttackContext(battle,owner,reactionContext);
 }
}

function triggerMagicFollowups(battle, attacker, target) {
  for (const ally of battle.actors) {
    const passive = ally.passive;
    if (!living(target)) break;
    if (
      !canTriggerFollowUp(ally, attacker, target) ||
      passive?.type !== "magic_followup_mp" ||
      ally.followUpRound === battle.round
    )
      continue;
    // Reserve the once-per-round activation before damage to prevent reaction chains.
    if(!reservePvpAutomatic(battle,ally,modeIO))continue;
    ally.followUpRound = battle.round;
    const ability = battle.content.abilities[passive.followUpAbility];
    const actionContext = attackContext(battle, ally);
    actionContext.pvpRegistered=true;actionContext.skillId=ability.id;actionContext.skill=ability;actionContext.reactionKind='follow_up';
    write(battle, `${ally.name} ${FOLLOW_UP_LABEL} bằng ${ability.name}.`);
    emitEvent(battle, {
      type: "reaction",
      kind: "follow_up",
      label: FOLLOW_UP_LABEL,
      sourceId: ally.id,
      targetId: target.id,
      abilityId: ability.id,
    });
    for (const effect of ability.effects) {
      for (let i = 0; i < (effect.hits ?? 1) && living(target); i += 1)
        hit(battle, ally, target, effect, 0, { reaction: true, actionContext });
    }
    finishAttackContext(battle, ally, actionContext);
    gainResource(battle, ally, passive.resource, 1);
    write(
      battle,
      `${ally.name}: ${ally.resources[passive.resource].name} ${ally.resourceValues[passive.resource]} / ${ally.resources[passive.resource].max}.`,
    );
  }
}

// Settle once after the complete hostile attack, never recursively from reactions or DoT.
function triggerShieldSurvivalFollowups(battle,attacker,context) {
  if (!context.shieldedAllyHits?.size) return;
  for (const owner of battle.actors) {
    const passive=owner.passive;
    if (passive?.type!=="shield_survival_followup" || !living(owner) || !procAvailable(battle,owner,"shield_survival")) continue;
    const enemies=battle.actors.filter(target=>target.team!==owner.team && living(target));
    const protectedAlly=battle.actors.find(target=>context.shieldedAllyHits.has(target.id) && target.shield>0 && enemies.some(enemy=>canTriggerFollowUp(owner,target,enemy)));
    if (!protectedAlly || attacker.team===owner.team || !enemies.length) continue;
    if(!reservePvpAutomatic(battle,owner,modeIO))continue;
    markProc(battle,owner,"shield_survival");
    const ability=battle.content.abilities[passive.followUpAbility];
    announcePassive(battle,owner,protectedAlly.id);
    write(battle,owner.name+" "+FOLLOW_UP_LABEL+" bằng "+ability.name+".");
    emitEvent(battle,{type:"reaction",kind:"follow_up",label:FOLLOW_UP_LABEL,sourceId:owner.id,targetId:enemies[0].id,targetIds:enemies.map(target=>target.id),abilityId:ability.id,area:true});
    const reactionContext=attackContext(battle,owner);
    reactionContext.pvpRegistered=true;reactionContext.skillId=ability.id;reactionContext.skill=ability;reactionContext.reaction=true;reactionContext.reactionKind='follow_up';
    for (const effect of ability.effects) applyEffect(battle,owner,enemies,effect,0,true,reactionContext);
    finishAttackContext(battle,owner,reactionContext);
  }
}

// One stack per originating damage action, including a separate ally reaction.
function maybeEnterContingency(battle,actor,hpLost){
 const p=actor.passive;if(p?.type!=='vampire_contingency'||hpLost<=0||!living(actor)||actor.activeMode||actor.hp/actor.stats.maxHp>=p.threshold||battle.round<=(actor.modeReentryAfterRound?.[p.modeId]??-1))return;
 actor.statuses=actor.statuses.filter(s=>!battle.content.statuses[s.id].taunt);
 announcePassive(battle,actor,actor.id);enterCombatMode(battle,actor,p.modeId,modeIO);
 applyStatus(battle,actor,p.immortalityStatus,1,actor.id);
 applyEffect(battle,actor,[actor],{type:'grant_extra_turn'},0,false);
}
// An enemy skill that lists a shield effect rouses an ancient blade — even if that shield is refused
// or does not overwrite a stronger one. Resolved once per cast, at most one entry per round.
function triggerShieldModeRouse(battle,caster,skill,context){
 if(!skill||battle.outcome||context?.reaction||context?.automatic||skill.activation==='passive'||skill.id.startsWith('$'))return;
 if(!skill.effects.some(effect=>effect.type==='shield'))return;
 for(const owner of battle.actors){
  const p=owner.passive;
  if(p?.type!=='enemy_shield_mode'||!living(owner)||owner.team===caster.team||owner.activeMode)continue;
  if(!procAvailable(battle,owner,'enemy_shield_mode'))continue;
  markProc(battle,owner,'enemy_shield_mode');
  announcePassive(battle,owner,caster.id);
  write(battle,owner.name+': '+p.name+' kích hoạt.');
  enterCombatMode(battle,owner,p.modeId,modeIO);
 }
}
// Explicit own-attack exception: one native follow-up per active attacking skill.
// Other characters retain the global no-self-trigger rule; reactions cannot recurse.
function triggerOwnModeFollowup(battle,actor,skill,context){
 const p=actor.passive;if(p?.type!=='vampire_contingency'||actor.activeMode!==p.modeId||!living(actor)||context.castMode!==p.modeId||skill.id.startsWith('$')||skill.activation==='passive'||!skill.effects.some(e=>e.type==='damage'))return;
 const targets=splashEnemies(battle,actor,context.primaryTargetId,true);if(!targets.length||!reservePvpAutomatic(battle,actor,modeIO))return;
 const follow=battle.content.abilities[p.followUpAbility],reaction={...attackContext(battle,actor),pvpRegistered:true,skillId:follow.id,skill:follow,reaction:true,reactionKind:'follow_up',primaryTargetId:context.primaryTargetId};
 announcePassive(battle,actor);write(battle,actor.name+' '+FOLLOW_UP_LABEL+' bằng '+follow.name+'.');emitEvent(battle,{type:'reaction',kind:'follow_up',label:FOLLOW_UP_LABEL,sourceId:actor.id,targetId:context.primaryTargetId,targetIds:targets.map(a=>a.id),abilityId:follow.id,area:true});
 for(const effect of follow.effects)applyEffect(battle,actor,targets,effect,0,true,reaction);
 finishAttackContext(battle,actor,reaction);transitionBossPhases(battle,{write,restoreMp:gainResource});
}
function chargeReceivedElement(battle,source,target,effect,context){
 if(!lightningChargeEligible(context.skill,context))return;
 for(const owner of battle.actors){const p=owner.passive;if(p?.type!=='element_received_charge'||!living(owner)||owner.team!==source.team||target.team===owner.team||!damageElements(effect).includes(p.element))continue;
  const before=owner.resourceValues[p.resource]??0;gainResource(battle,owner,p.resource,p.amount,source.id);
  if(owner.resourceValues[p.resource]>before){exclusiveResourceBonus(battle,owner,p.resource,specialIO);announcePassive(battle,owner,source.id);write(battle,owner.name+': '+p.name+' → '+owner.resourceValues[p.resource]+'/'+owner.resources[p.resource].max+' '+owner.resources[p.resource].name+'.');}
 }
}
function triggerPowderFollowups(battle,source,skill,parent){
 if(skill.id.startsWith('$')||skill.activation==='passive'||!skill.effects.some(e=>e.type==='damage'))return;
 for(const owner of battle.actors){const p=owner.passive;if(p?.type!=='powder_ally_followup'||owner.team!==source.team||owner.id===source.id||!living(owner))continue;
  const old=owner.powderFollowupState;if(old?.round===battle.round&&old.count>=p.perRound)continue;
  const pool=battle.actors.filter(a=>a.team!==owner.team&&living(a));if(!pool.length)continue;
  if(!reservePvpAutomatic(battle,owner,modeIO))continue;
  const roll=battle.random();if(!Number.isFinite(roll)||roll<0||roll>=1)throw Error('Nguồn chọn mục tiêu không hợp lệ.');
  const anchor=pool[Math.floor(roll*pool.length)],targets=splashEnemies(battle,owner,anchor.id),spent=parent.teamResourceSpent?.[p.resource]??0;
  owner.powderFollowupState={round:battle.round,count:old?.round===battle.round?old.count+1:1};
  const follow=battle.content.abilities[p.followUpAbility],context={...attackContext(battle,owner),pvpRegistered:true,skill:follow,skillId:follow.id,reaction:true,reactionKind:'follow_up',primaryTargetId:anchor.id,extraPrimaryPenetration:spent*p.penetrationPerCharge};
  announcePassive(battle,owner,source.id);write(battle,owner.name+' '+FOLLOW_UP_LABEL+' bằng '+follow.name+'.');emitEvent(battle,{type:'reaction',kind:'follow_up',label:FOLLOW_UP_LABEL,sourceId:owner.id,targetId:anchor.id,targetIds:targets.map(a=>a.id),abilityId:follow.id,area:true});
  for(const effect of follow.effects)applyEffect(battle,owner,targets,effect,0,true,context);
  finishAttackContext(battle,owner,context);
  if(spent>0&&living(owner))changeTeamResource(battle,owner,p.resource,p.generatedAfterPowered,teamIO);
  transitionBossPhases(battle,{write,restoreMp:gainResource});
 }
}

function chargeElementAllies(battle,source,context,damageElement){
 context.elementCharged??=new Set();
 for(const owner of battle.actors){const p=owner.passive;if(p?.type!=='element_ally_charge'||!living(owner)||owner.id===source.id||owner.team!==source.team||((p.elementMatch==='different')?!(p.elementSource==='damage'?damageElement:[source.element]).some(e=>e!==p.element):!(p.elementSource==='damage'?damageElement:[source.element]).includes(p.element))||context.elementCharged.has(owner.id))continue;
  context.elementCharged.add(owner.id);const before=owner.resourceValues[p.resource]??0;gainResource(battle,owner,p.resource,p.amount,source.id);
  if(owner.resourceValues[p.resource]>before){exclusiveResourceBonus(battle,owner,p.resource,specialIO);announcePassive(battle,owner,source.id);write(battle,owner.name+': '+p.name+' → '+owner.resourceValues[p.resource]+'/'+owner.resources[p.resource].max+' '+owner.resources[p.resource].name+'.');}
 }
}
function triggerReceivedDamageCounters(battle,attacker,context){
 if(context.reaction||!context.receivedCounterDamage?.size||!living(attacker))return;
 for(const[id,raw]of context.receivedCounterDamage){const owner=getActor(battle,id),p=owner?.passive;if(p?.type!=='received_damage_counter'||!living(owner)||owner.team===attacker.team||!procAvailable(battle,owner,'received_damage_counter')||!living(attacker))continue;
  if(!reservePvpAutomatic(battle,owner,modeIO))continue;
  markProc(battle,owner,'received_damage_counter');const multiplier=p.minimum+(p.maximum-p.minimum)*clamp(raw/owner.stats.maxHp,0,1),skill=battle.content.abilities[p.counterAbility];
  const counter={...attackContext(battle,owner),pvpRegistered:true,skillId:skill.id,skill,reaction:true,primaryTargetId:attacker.id};
  announcePassive(battle,owner,attacker.id);write(battle,owner.name+' phản công bằng '+skill.name+' ('+Math.round(multiplier*100)+'% HP tối đa).');
  emitEvent(battle,{type:'reaction',kind:'counter',label:REACTION_LABELS.counter,sourceId:owner.id,targetId:attacker.id,abilityId:skill.id,rawDamage:raw,multiplier});
  for(const e of skill.effects)applyEffect(battle,owner,[attacker],{...e,multiplier},0,false,counter);
  finishAttackContext(battle,owner,counter);transitionBossPhases(battle,{write,restoreMp:gainResource});
 }
}

function triggerSupportFollowups(battle,source,skill){
  for(const owner of battle.actors){
    if(!supportFollowupReady(battle,owner,source,skill))continue;
    const targets=battle.actors.filter(a=>a.team!==owner.team&&living(a));if(!targets.length)continue;
    if(!reservePvpAutomatic(battle,owner,modeIO))continue;
    const previous=owner.supportFollowupState;owner.supportFollowupState={round:battle.round,count:previous?.round===battle.round?previous.count+1:1};
    const base=battle.content.abilities[owner.passive.followUpAbility],bonus=supportFollowupBonus(owner);
    const ability={...base,effects:base.effects.map(e=>e.type==='damage'?{...e,multiplier:e.multiplier+bonus}:e)};
    announcePassive(battle,owner,source.id);write(battle,owner.name+' '+FOLLOW_UP_LABEL+' bằng '+ability.name+'.');
    emitEvent(battle,{type:'reaction',kind:'follow_up',label:FOLLOW_UP_LABEL,sourceId:owner.id,targetId:targets[0].id,targetIds:targets.map(a=>a.id),abilityId:ability.id,area:true});
    const context={...attackContext(battle,owner),pvpRegistered:true,skillId:ability.id,skill:ability,reaction:true,reactionKind:'follow_up'};
    for(const effect of ability.effects)applyEffect(battle,owner,targets,effect,0,true,context);
    finishAttackContext(battle,owner,context);
    transitionBossPhases(battle,{write,restoreMp:gainResource});
  }
}

function chargeSupportModes(battle,source,context){
 const scope=battle.supportChargeScope??context;scope.supportCharged??=new Set();
 for(const owner of battle.actors){const p=owner.passive;if(p?.type!=='mode_support_charge'||!living(owner)||owner.activeMode!==p.modeId||scope.supportCharged.has(owner.id))continue;
  scope.supportCharged.add(owner.id);const before=owner.resourceValues[p.resource]??0;gainResource(battle,owner,p.resource,p.amount,source.id);
  if(owner.resourceValues[p.resource]>before){exclusiveResourceBonus(battle,owner,p.resource,specialIO);announcePassive(battle,owner,source.id);write(battle,owner.name+': '+p.name+' → '+owner.resourceValues[p.resource]+'/'+owner.resources[p.resource].max+' '+owner.resources[p.resource].name+'.');}
 }
}

function triggerSpentResourceFollowups(battle,source,cost){
 for(const owner of battle.actors){const p=owner.passive;if(p?.type!=='spent_resource_followup'||p.resource!==cost.id||!living(owner))continue;
  const target=battle.actors.filter(t=>canTriggerFollowUp(owner,source,t)).sort((a,b)=>b.hp-a.hp||(a.formationSlot??0)-(b.formationSlot??0))[0];if(!target||!reservePvpAutomatic(battle,owner,modeIO))continue;
  const skill=battle.content.abilities[p.followUpAbility],context={...attackContext(battle,owner),pvpRegistered:true,skillId:skill.id,skill,reaction:true,reactionKind:'follow_up'};
  announcePassive(battle,owner,source.id);write(battle,owner.name+' '+FOLLOW_UP_LABEL+' bằng '+skill.name+'.');emitEvent(battle,{type:'reaction',kind:'follow_up',label:FOLLOW_UP_LABEL,sourceId:owner.id,targetId:target.id,abilityId:skill.id});
  for(const effect of skill.effects)applyEffect(battle,owner,[target],effect,0,false,context);
  finishAttackContext(battle,owner,context);transitionBossPhases(battle,{write,restoreMp:gainResource});
 }
}

function triggerAllySkillCounters(battle,attacker,context) {
  if(!living(attacker)||!context.damagedAllyHits?.size||!context.skillId||context.skillId.startsWith("$")||context.reaction||context.automatic||context.skill?.activation==="passive") return;
  for(const owner of battle.actors) {
    const p=owner.passive;
    if(p?.type!=="ally_skill_counter" || !living(owner)||owner.team===attacker.team||!procAvailable(battle,owner,"ally_skill_counter"))continue;
    const harmed=battle.actors.some(ally=>ally.team===owner.team&&ally.id!==owner.id&&context.damagedAllyHits.has(ally.id));
    if(!harmed||!living(attacker))continue;
    if(!reservePvpAutomatic(battle,owner,modeIO))continue;
    markProc(battle,owner,"ally_skill_counter");announcePassive(battle,owner,attacker.id);
    const ability=battle.content.abilities[p.counterAbility],reactionContext=attackContext(battle,owner);
    reactionContext.pvpRegistered=true;reactionContext.skill=ability;reactionContext.skillId=ability.id;reactionContext.reaction=true;
    write(battle,owner.name+" phản đòn: "+ability.name+".");
    emitEvent(battle,{type:"reaction",kind:"counter",label:REACTION_LABELS.counter,sourceId:owner.id,targetId:attacker.id,abilityId:ability.id});
    for(const effect of ability.effects) applyEffect(battle,owner,[attacker],effect,0,false,reactionContext);
    finishAttackContext(battle,owner,reactionContext);
  }
}

// An enemy skill that deals no direct damage (defend excluded) can be answered on a shared cooldown.
function triggerSupportSkillCounters(battle,caster,skill,context) {
  if(!living(caster)||!skill||context.reaction||context.automatic||skill.activation==='passive'||skill.id.startsWith('$'))return;
  if(skill.effects.some(effect=>effect.type==='damage'))return;
  for(const owner of battle.actors) {
    const p=owner.passive;
    if(p?.type!=='enemy_support_counter'||!living(owner)||owner.team===caster.team)continue;
    if(owner.supportCounterRound!==undefined&&battle.round-owner.supportCounterRound<p.cooldownRounds)continue;
    if(!living(caster))break;
    if(!reservePvpAutomatic(battle,owner,modeIO))continue;
    owner.supportCounterRound=battle.round;
    const cleansed=owner.statuses.filter(status=>battle.content.statuses[status.id].kind==='debuff');
    if(cleansed.length){
      owner.statuses=owner.statuses.filter(status=>battle.content.statuses[status.id].kind!=='debuff');
      clampBattleMp(battle.content,owner);
      emitEvent(battle,{type:'cleanse',sourceId:owner.id,targetId:owner.id});
      write(battle,owner.name+' giải '+cleansed.length+' hiệu ứng bất lợi bằng '+p.name+'.');
    }
    announcePassive(battle,owner,caster.id);
    const ability=battle.content.abilities[p.counterAbility],reactionContext={...attackContext(battle,owner),pvpRegistered:true,skill:ability,skillId:ability.id,reaction:true};
    write(battle,owner.name+' phản đòn: '+ability.name+'.');
    emitEvent(battle,{type:'reaction',kind:'counter',label:REACTION_LABELS.counter,sourceId:owner.id,targetId:caster.id,abilityId:ability.id});
    for(const effect of ability.effects) applyEffect(battle,owner,[caster],effect,0,false,reactionContext);
    finishAttackContext(battle,owner,reactionContext);
    transitionBossPhases(battle,{write,restoreMp:gainResource});
  }
}

function companionPulse(battle,owner,abilityId,name,phase) {
  const skill=battle.content.abilities[abilityId],targets=targetsFor(battle,owner,skill);
  if (!targets.length||!reservePvpAutomatic(battle,owner,modeIO)) return;
  write(battle,name+" "+FOLLOW_UP_LABEL+" "+(phase==="start"?"đầu":"cuối")+" vòng: "+skill.name+".");
  emitEvent(battle,{type:"reaction",kind:"follow_up",label:name+" · "+FOLLOW_UP_LABEL,sourceId:owner.id,targetId:targets[0].id,targetIds:targets.map(target=>target.id),abilityId,area:true,automaticCast:true});
  const context={...attackContext(battle,owner),pvpRegistered:true,skillId:abilityId,skill,attackBuffs:[],multiplier:1,automatic:true,reaction:true,reactionKind:'follow_up'};
  for(const effect of skill.effects) applyEffect(battle,owner,targets,effect,0,true,context);
  finishAttackContext(battle,owner,context);
  transitionBossPhases(battle,{write,restoreMp:gainResource});
}

function hit(
  battle,
  attacker,
  originalTarget,
  effect,
  spent = 0,
  options = {},
) {
  const context = options.actionContext ?? attackContext(battle, attacker);
  const growth=hitGrowthRatio(battle.content,attacker);
  if(growth>0||context.skill?.presentation?.startsWith('iaido_')){context.hitSequences??=new Map();const index=context.hitSequences.get(originalTarget.id)??0;context.hitSequences.set(originalTarget.id,index+1);context.hitIndex=index;context.hitGrowthMultiplier=(1+growth)**index;}
  try {
    return resolveHit(battle, attacker, originalTarget, effect, spent, {
      ...options,
      actionContext: context,
    });
  } finally {
    if (!options.actionContext) finishAttackContext(battle, attacker, context);
  }
}

function resolveHit(
  battle,
  attacker,
  originalTarget,
  effect,
  spent,
  { reaction = false, area = false, actionContext },
) {
  const target = coverTarget(battle, originalTarget, area, reaction);
  if (!living(attacker) || !living(target)) return;
  if(reaction) actionContext.reaction=true;
  if(!allowPvpHit(battle,attacker,actionContext,modeIO))return;
  if (target.id !== originalTarget.id)
    write(battle, `${target.name} chắn đòn cho ${originalTarget.name}.`);
  effect=exclusiveDamageEffect(attacker,actionContext.skillId,effect);
  const evasion=hasTrueStrike(battle.content,attacker)?0:evasionChance(target,effect,modifier(battle,target,"evasion"));
  if (evasion > 0 && battle.random() < evasion) {
    emitEvent(battle, {
      type: "dodge",
      targetId: target.id,
      sourceId: attacker.id,
      damageType: effect.damageType, element: effect.element, ...(effect.additionalElements?{elements:damageElements(effect)}:{}),
      hitIndex: actionContext.hitIndex ?? 0, ...(effect.to==='primary'?{primaryOnly:true}:{}),
    });
    write(battle, `${target.name} né đòn của ${attacker.name}.`);
    const dodgeHeal = exclusivePassive(target,"dodge_heal");
    if (dodgeHeal && (target.hp < target.stats.maxHp || lifeDebt(target)>0) && procAvailable(battle,target,"exclusive_dodge")) {
      const beforeDebt=lifeDebt(target);
      if (healHp(battle,target,target.stats.maxHp * dodgeHeal.ratio,target.id,dodgeHeal.name) > 0 || lifeDebt(target)<beforeDebt) markProc(battle,target,"exclusive_dodge");
    }
    if (
      !reaction &&
      target.passive?.type === "dodge_counter" &&
      target.reactionRound !== battle.round && reservePvpAutomatic(battle,target,modeIO)
    ) {
      target.reactionRound = battle.round;
      if(target.passive.resource)gainResource(battle, target, target.passive.resource, 1);
      write(battle, `${target.name} ${target.passive.counterAbility ? "phản công!" : "phản kiếm!"}`);
      emitEvent(battle, {
        type: "reaction",
        kind: "counter",
        label: REACTION_LABELS.counter,
        abilityId: target.passive.counterAbility,
        sourceId: target.id,
        targetId: attacker.id,
      });
      const counter = battle.content.abilities[target.passive.counterAbility];
      if (counter) {
        const context = attackContext(battle, target);context.pvpRegistered=true;
        context.skillId = counter.id;context.skill=counter;context.reaction=true;context.primaryTargetId=attacker.id;
        for (const effect of counter.effects) {
          if (living(attacker) && living(target)) {
            if (effect.type === "damage") hit(battle, target, attacker, effect, 0, { reaction: true, actionContext: context });
            else applyEffect(battle, target, [attacker], effect, 0, false, context);
          }
        }
        finishAttackContext(battle, target, context);
      } else {
        const context = attackContext(battle, target);context.pvpRegistered=true;
        hit(
        battle,
        target,
        attacker,
        {
          type: "damage",
          damageType: "physical",
          element: target.element,
          multiplier: 0.85,
          unavoidable: true,
        },
        0,
        { reaction: true, actionContext: context },
      );
        finishAttackContext(battle, target, context);
      }
    }
    return;
  }
  const exposed=exposureStatus(battle.content,target),entry=actionContext.exposures?.get(target.id);
  const exposureBonus=effect.bonusVsExposure&&entry&&(entry.reserved||(exposed===entry.status&&availableExposureStacks(exposed)>0))?effect.bonusVsExposure:0;
  let hitMagicBonus = 0;
  if (effect.damageType === "magical") {
    for (const ally of battle.actors.filter(candidate => living(candidate) && candidate.team === attacker.team && candidate.id !== attacker.id)) {
      const passive = ally.passive;
      if (passive?.type === "marked_ally_magic" && target.statuses.some(status => status.id === passive.statusId)) hitMagicBonus += specialPassives(ally,'marked_ally_ratio').find(p=>p.statusId===passive.statusId&&(target.statuses.find(s=>s.id===p.statusId)?.stacks??0)>=p.stacks)?.ratio??passive.ratio;
    }
  }
  const power = scalingValue(effect,key=>battleStat(battle.content,attacker,key,actionContext.automatic,(key==="magic"?hitMagicBonus:0)+(actionContext.statRatioBonuses?.[key]??0)+specialHitStatBonus(attacker,target,actionContext,key),actionContext.baseStatBonuses?.[key]??0));
  const penetration = exclusivePassive(attacker,"skill_penetration",actionContext.skillId);
  const extraPenetration = modePenetration(attacker,effect.damageType)+specialResourcePenetration(attacker,actionContext.skillId,effect,spent)+(penetration && spent >= (penetration.minSpent ?? 0) ? penetration.ratio : 0)+(attacker.exclusiveTeamPenetration??0)+nativePenetration(attacker,effect.damageType)+teamSpentPenetration(attacker,actionContext,effect)+(actionContext.sharedPenetration??0)+(target.id===actionContext.primaryTargetId?(actionContext.extraPrimaryPenetration??0):0);
  const defense =
    stat(
      battle,
      target,
      effect.damageType === "physical" ? "defense" : "resistance",
    ) *
    (1 - clamp((effect.penetration ?? 0) + extraPenetration, 0, 1));
  let stacks = 0;
  if (effect.consumeStatus) {
    const mark = target.statuses.find(
      (status) => status.id === effect.consumeStatus,
    );
    stacks = mark?.stacks ?? 0;
    if (stacks > 0) {
      if (!actionContext.consumedTargets.has(effect.consumeStatus)) actionContext.consumedTargets.set(effect.consumeStatus,new Set());
      actionContext.consumedTargets.get(effect.consumeStatus).add(target.id);
    }
    target.statuses = target.statuses.filter(
      (status) => status.id !== effect.consumeStatus,
    );
  }
  const multiplier = damageMultiplier(effect, {
    spent,
    stacks,
    hpRatio: attacker.hp / attacker.stats.maxHp,
    buffs: buffTypeCount(battle.content,target),
  });
  let reduction = agonyReduction(target)+modifier(battle, target, "damageReduction")-bypassedBarrierReduction(battle.content,target,attacker)+gearGuardReduction(target)+(effect.damageType==='physical'?teamPhysicalGuard(battle,target.team):0)+(effect.damageType==="magical"?(target.teamMagicDamageReduction??0):0);
  if (target.passive?.type === "damage_reduction" &&
    (!target.passive.requiresStatus || activeStatuses(target).some(status => status.id === target.passive.requiresStatus)))
    reduction += target.passive.amount;
  // Cover guards only apply when the hit was actually redirected from an ally.
  const coverGuard = target.id !== originalTarget.id
    ? Math.min(0.7, (exclusivePassive(target, "cover_damage_reduction")?.ratio ?? 0) + (target.passive?.type === "cover_guard" ? target.passive.ratio : 0))
    : 0;
  const { elementWeakness, typeWeakness, multiplier: weaknessMultiplier, matchedElements } =
    resolveWeakness(battle.content, attacker, target, effect, actionContext);
  // Element and damage type share one weakness multiplier, never additive bonuses.
  const weakness = elementWeakness || typeWeakness;
  const weaknessReason = [
    elementWeakness ? matchedElements.map(e=>ELEMENT_NAMES[e]).join(" / ") : null,
    typeWeakness ? DAMAGE_TYPE_NAMES[effect.damageType] : null,
  ]
    .filter(Boolean)
    .join(" / ");
  // Hit growth is a base-damage stage, separate from strongest-only skill amplification.
  const hitGrowthMultiplier = actionContext.hitGrowthMultiplier ?? 1;
  // Offense snapshot for retaliation excludes DEF/RES, elemental resistance,
  // reduction, cover reduction, incoming gear and shield. Weakness and attacker bonuses remain.
  const counterRaw=!reaction&&target.passive?.type==='received_damage_counter'&&attacker.team!==target.team?
    Math.max(0,power*multiplier+speedDamageBonus(attacker,effect.damageType,stat(battle,attacker,'speed',actionContext.automatic),effect.speedMultiplier??0))*hitGrowthMultiplier*weaknessMultiplier*gearOutgoingMultiplier(battle,attacker,target,actionContext)*bossFireMultiplier(attacker,effect)*(attacker.boss?.phases[attacker.bossState.phase-1].damageMultiplier??1)*Math.max(.1,1+skillDamageBonus(battle.content,attacker,target,actionContext.automatic)+alteredDefenseBonus(battle.content,attacker,target)+(actionContext.sharedDamageBonus??0)+(effect.spentResourceDamageBonus??0)+exposureBonus+shieldedDamageBonus(battle,attacker)+debuffDamageBonus(attacker.passive,debuffTypeCount(battle.content,target))+buffDamageBonus(attacker.passive,buffTypeCount(battle.content,target))+lowHpDamageBonus(attacker.passive,attacker.hp/attacker.stats.maxHp)+(actionContext.mortgageDamageBonus??0))*(actionContext.multiplier??1)*(attacker.passive?.type==='hp_difference_damage'?1+Math.min(attacker.passive.cap,Math.abs(attacker.hp/attacker.stats.maxHp-target.hp/target.stats.maxHp)):1):0;
  let amount = Math.max(
    1,
    Math.floor(
      Math.max(
        1,
        power * multiplier +
          speedDamageBonus(
            attacker,
            effect.damageType,
            stat(battle, attacker, "speed", actionContext.automatic),
            effect.speedMultiplier ?? 0,
          ) -
          defense * 0.55,
      ) * hitGrowthMultiplier *
        elementalResistance(target,effect) *
        weaknessMultiplier * gearOutgoingMultiplier(battle,attacker,target,actionContext) * gearIncomingMultiplier(battle,target,effect,gearIO) *
        bossFireMultiplier(attacker, effect) * (attacker.boss?.phases[attacker.bossState.phase-1].damageMultiplier ?? 1) *
        Math.max(
          0.1,
          1 +
            skillDamageBonus(battle.content,attacker,target,actionContext.automatic) + alteredDefenseBonus(battle.content,attacker,target) + (actionContext.sharedDamageBonus??0) + (effect.spentResourceDamageBonus??0) + exposureBonus + shieldedDamageBonus(battle,attacker) + debuffDamageBonus(attacker.passive,debuffTypeCount(battle.content,target)) + buffDamageBonus(attacker.passive,buffTypeCount(battle.content,target)) + lowHpDamageBonus(attacker.passive,attacker.hp/attacker.stats.maxHp)+(actionContext.mortgageDamageBonus??0),
        ) *
        (actionContext.multiplier ?? 1) *
        (attacker.passive?.type === "hp_difference_damage" ? 1 + Math.min(attacker.passive.cap, Math.abs(attacker.hp / attacker.stats.maxHp - target.hp / target.stats.maxHp)) : 1) *
        (1 - coverGuard) *

        incomingDamageMultiplier(modifier(battle, target, "damageTakenBonus")) *
        (1 - clamp(reduction, 0, 0.75)),
    ),
  );
  const cappedHit=applyPvpDamageCap(battle,attacker,target,amount,actionContext,area,modeIO);amount=cappedHit.amount;
  if (!reaction && attacker.team!==target.team && target.shield>0) actionContext.shieldedAllyHits.add(target.id);
  const maxHpRoute=routesToMaxHp(target,effect.element);
  const baseAbsorbed=maxHpRoute?0:Math.min(target.shield,amount);
  const absorbed=Math.min(target.shield,baseAbsorbed+gearShieldExtra(attacker,baseAbsorbed));
  target.shield-=absorbed;
  amount-=baseAbsorbed; // Extra shield damage never changes the original HP spill.
  const life=applyLifeDamage(battle,target,amount,{element:effect.element,healthFloor:bossHealthFloor(target)},{write,emit:emitEvent});
  const lostHp=life.hpLost,vitalityDamage=life.hpLost+life.maxHpLost;
  const hpAfter=target.hp;
  if(attacker.team!==target.team&&vitalityDamage+absorbed>0){
    if(!living(target)){actionContext.directDefeats??=new Set();actionContext.directDefeats.add(target.id);}
    for(const owner of battle.actors){const p=owner.passive;if(living(owner)&&owner.team===target.team&&p?.type==='blessed_team_resource'&&activeStatuses(target).some(s=>s.id===p.blessingStatus&&(s.remaining==null||s.remaining>0))){actionContext.blessedResourceOwners??=new Set();actionContext.blessedResourceOwners.add(owner.id);}}
  }
  if(effect.lifeStealRatio&&lostHp>0)actionContext.lifeStealHp=(actionContext.lifeStealHp??0)+lostHp*effect.lifeStealRatio;
  if(attacker.team!==target.team&&vitalityDamage+absorbed>0){
    if(counterRaw>0){actionContext.receivedCounterDamage??=new Map();actionContext.receivedCounterDamage.set(target.id,(actionContext.receivedCounterDamage.get(target.id)??0)+counterRaw);}
  }
  if(attacker.team!==target.team&&vitalityDamage+absorbed>0)actionContext.dealtDirectDamage=true;
  if(attacker.team!==target.team && vitalityDamage+absorbed>0) actionContext.gearImpacts.push({target,lostHp,absorbed,damageType:effect.damageType,element:effect.element,elements:damageElements(effect),elementWeakness,weakness});
  if (vitalityDamage + absorbed > 0) {for(const element of damageElements(effect))reserveExposure(target, element, actionContext);}
  if(!reaction && attacker.team!==target.team && vitalityDamage+absorbed>0) actionContext.damagedAllyHits.add(target.id);
  // Reserve before nested reactions; settle after the whole attack so a later
  // weak target/hit can upgrade 3 MP to 5 MP. Shield damage and kills count.
  if (attacker.team !== target.team && vitalityDamage + absorbed > 0) {
    for (const source of battle.actors) {
      const passive = source.passive;
      if (!living(source) || source.id === attacker.id || source.team !== attacker.team
        || passive?.type !== "buffed_ally_mp"
        || !attacker.statuses.some(status => status.sourceId === source.id && passive.statusIds.includes(status.id))) continue;
      const existing = actionContext.supportMpSources?.get(source.id);
      if (existing) existing.weakness ||= weakness;
      else if (procAvailable(battle, source, "buffed_ally_mp")) {
        markProc(battle, source, "buffed_ally_mp");
        (actionContext.supportMpSources ??= new Map()).set(source.id, { weakness });
      }
    }
  }
  emitEvent(battle, {
    type: "damage",
    targetId: target.id,
    sourceId: attacker.id,
    amount: vitalityDamage,
    ...(cappedHit.info?{pvpDamage:cappedHit.info}:{}),
    ...(life.maxHpLost?{maxHpDamage:life.maxHpLost}:{}),
    absorbed,
    element: effect.element, ...(effect.additionalElements?{elements:damageElements(effect)}:{}),
    weakness,
    weaknessMultiplier,
    damageType: effect.damageType,
    abilityId: actionContext.skillId ?? actionContext.skill?.id,
    area, reaction, hitIndex: actionContext.hitIndex ?? 0, ...(effect.to==='primary'?{primaryOnly:true}:{}),
    primary: target.id === actionContext.primaryTargetId,
    ...(actionContext.automatic ? { automatic: true } : {}),
  });
  write(
    battle,
    `${attacker.name} → ${target.name}: ${vitalityDamage} sát thương${life.maxHpLost ? ", trừ HP tối đa" : ""}${actionContext.hybrid ? ` ${DAMAGE_TYPE_NAMES[effect.damageType]}` : ""}${absorbed ? `, khiên chặn ${absorbed}` : ""}${weakness ? `, yếu ${weaknessReason} (+${Math.round((weaknessMultiplier - 1) * 100)}%)` : ""}.`,
  );
  if(attacker.team!==target.team&&vitalityDamage+absorbed>0)chargeElementAllies(battle,attacker,actionContext,damageElements(effect));
  if(attacker.team!==target.team&&vitalityDamage+absorbed>0)chargeReceivedElement(battle,attacker,target,effect,actionContext);
  maybeEnterContingency(battle,target,lostHp);
  if (living(target) && weakness && vitalityDamage + absorbed > 0)
    suppressOnWeakness(
      battle,
      attacker,
      target,
      actionContext,
      write,
      (id, duration) =>
        applyStatus(battle, target, id, duration, attacker.id, {
          silent: true,
        }),
    );
  if (
    absorbed &&
    target.shield === 0 &&
    attacker.team !== target.team &&
    attacker.passive?.type === "shield_break_attack_buff"
  )
    actionContext.shieldBreakBuffs.add(attacker.passive.statusId);
  if(absorbed&&target.shield===0&&attacker.team!==target.team)exclusiveShieldBreak(battle,attacker,specialIO);
  if (absorbed && target.shield === 0 && living(target)) {
    const healer = getActor(battle, target.shieldSourceId);
    if (healer?.passive?.type === "shield_break_heal" && living(healer)) {
      const bonus = exclusivePassive(healer,"shield_break_heal_bonus");
      healHp(battle,target,stat(battle,healer,"magic") * healer.passive.multiplier * (1 + (bonus?.ratio ?? 0)),healer.id,"Dư âm thủy hộ");
    }
    const refill=healer?.passive,rose=healer&&exclusivePassive(healer,'shield_break_restore_hp');
    if(refill?.type==='shield_break_mp'&&living(healer)&&procAvailable(battle,target,'shield_mp:'+healer.id)&&(target.mp<battleMaxMp(battle.content,target)||rose&&(target.hp<target.stats.maxHp||lifeDebt(target)>0))){
      markProc(battle,target,'shield_mp:'+healer.id);announcePassive(battle,healer,target.id);write(battle,healer.name+' kích hoạt '+refill.name+' cho '+target.name+'.');
      if(target.mp<battleMaxMp(battle.content,target))gainResource(battle,target,'mp',Math.ceil(scalingValue(refill,key=>stat(battle,healer,key))*refill.multiplier),healer.id);
      if(rose&&(target.hp<target.stats.maxHp||lifeDebt(target)>0))healHp(battle,target,scalingValue(rose,key=>stat(battle,healer,key))*rose.multiplier,healer.id);
    }
    if (target.passive?.type === "shield_break_status") {
      announcePassive(battle,target,target.id,target.passive.name??"Vỡ khiên");
      write(battle, `${target.name} vỡ khiên!`);
      for (const status of target.passive.statuses)
        applyStatus(battle, target, status.id, status.duration, attacker.id,{bypassControlImmunity:true});
    }
  }
  if(vitalityDamage+absorbed>0) { gearAfterDirectHit(battle,target,{lostHp,absorbed,hpAfter},gearIO); if(weakness) gearObserveWeakness(battle,attacker,gearIO); }
  if (living(target) && (vitalityDamage || absorbed)) {
    for (const status of statusDefinitions(battle, target)) {
      if (status.onDamagedResource)
        gainResource(battle, target, status.onDamagedResource, 1);
    }
  }
  // Refresh an existing mark at most once per main round per target. New marks don't consume that quota.
  if (living(target) && effect.damageType === "magical" && vitalityDamage + absorbed > 0) {
    for (const mark of target.statuses) {
      const refresh = battle.content.statuses[mark.id].magicRefresh;
      const source = getActor(battle,mark.sourceId);
      if (refresh && source?.team === attacker.team && attacker.team !== target.team && !actionContext.newlyMarkedTargets.has(target.id + ":" + mark.id) && (!refresh.oncePerRound || mark.refreshedRound !== battle.round)) {
        mark.remaining = refresh.duration;
        mark.refreshedRound = battle.round;
        write(battle, `${target.name}: làm mới ${battle.content.statuses[mark.id].name} (${refresh.duration} lượt).`);
      }
    }
    if (effect.onHitStatus) {
      const applied = applyStatus(battle,target,effect.onHitStatus.status,effect.onHitStatus.duration,attacker.id,{stacks:target.id===actionContext.primaryTargetId?(effect.onHitStatus.primaryStacks??effect.onHitStatus.stacks??1):(effect.onHitStatus.stacks??1),chanceScaling:effect.onHitStatus.chanceScaling});
      if (applied && !actionContext.preMarkedTargets?.has(target.id + ":" + applied.id)) actionContext.newlyMarkedTargets.add(target.id + ":" + applied.id);
    }
  } else if (living(target) && effect.damageType !== "magical" && vitalityDamage + absorbed > 0 && effect.onHitStatus) {
    applyStatus(battle,target,effect.onHitStatus.status,effect.onHitStatus.duration,attacker.id,{stacks:target.id===actionContext.primaryTargetId?(effect.onHitStatus.primaryStacks??effect.onHitStatus.stacks??1):(effect.onHitStatus.stacks??1),chanceScaling:effect.onHitStatus.chanceScaling});
  }
  if(living(target)&&vitalityDamage+absorbed>0&&effect.onHitDispelCount)dispelBuffs(battle,attacker,target,effect.onHitDispelCount);
  if (living(target) && attacker.team!==target.team && vitalityDamage+absorbed>0 && attacker.passive?.type==="attack_status") {
    if (applyStatus(battle,target,attacker.passive.statusId,attacker.passive.duration,attacker.id)) announcePassive(battle,attacker,target.id);
  }
  if (!living(target)) {
    target.statuses = target.statuses.filter(
      (status) => !battle.content.statuses[status.id].turnStartAbility,
    );
    onActorDefeated(battle,attacker,target);
    checkCombatMode(battle,target,"owner_ko",modeIO);
    closeFormula(battle,target,modeIO,"owner_ko");
    write(battle, `${target.name} gục xuống.`);
  } else if (
    !reaction &&
    !area &&
    effect.damageType === "magical" &&
    vitalityDamage + absorbed > 0
  )
    triggerMagicFollowups(battle, attacker, target);
}

function applyStatus(
  battle,
  target,
  statusId,
  duration,
  sourceId,
  { silent = false, stacks = 1, charges, appliedModifiers, linkedAppliedModifiers, baseStatModifiers, debtMaxHpRatio, chanceScaling, bypassControlImmunity=false, exclusiveReaction=false } = {},
) {
  const definition = battle.content.statuses[statusId];
  const source = getActor(battle, sourceId);
  if(definition.skipTurn&&!bypassControlImmunity&&stunImmune(battle.content,target)){write(battle,target.name+' miễn nhiễm Choáng.');emitEvent(battle,{type:'status_immune',sourceId,targetId:target.id,statusId});return null;}
  if(chanceScaling){const chance=statusApplicationChance(battle.content,source,chanceScaling);if(battle.random()>=chance){write(battle,target.name+' không bị '+definition.name+'.');emitEvent(battle,{type:'status_resisted',sourceId,targetId:target.id,statusId,chance});return null;}}
  if(definition.kind==='buff'){
    const seal=target.statuses.find(s=>battle.content.statuses[s.id]?.buffRejection&&(s.charges??1)>0&&(s.remaining==null||s.remaining>0));
    if(seal){
      consumeStatusCharge(target,seal);
      write(battle,`${target.name}: Phong Ấn chặn ${definition.name}, tiêu 1 lần.`);
      emitEvent(battle,{type:'effect_blocked',targetId:target.id,sourceId,statusId});
      return null;
    }
  }
  duration??=definition.defaultDuration;
  if (definition.kind === "debuff") {
    const ward = target.statuses.find((status) => {
      const immunity = battle.content.statuses[status.id].effectImmunity;
      return (
        immunity &&
        (status.charges ?? immunity.charges) > 0 &&
        (!immunity.hostileOnly || (source && source.team !== target.team))
      );
    });
    if (ward) {
      const wardOwner=getActor(battle,ward.sourceId);
      ward.charges =
        (ward.charges ??
          battle.content.statuses[ward.id].effectImmunity.charges) - 1;
      if (ward.charges === 0)
        target.statuses = target.statuses.filter((status) => status !== ward);
      write(
        battle,
        `${target.name} miễn nhiễm ${definition.name}, tiêu 1 lần ${battle.content.statuses[ward.id].name}.`,
      );
      emitEvent(battle, {
        type: "effect_blocked",
        targetId: target.id,
        sourceId,
        statusId,
      });
      exclusiveWardBlocked(battle,wardOwner,target,specialIO);
      return null;
    }
  }
  const previous = target.statuses.find((status) => status.id === statusId);
  const debtAdded=definition.healingDebt ? Math.min(
    Math.ceil(target.stats.maxHp*(debtMaxHpRatio??definition.healingDebt.maxHpRatio)),
    Math.max(0,Math.floor(target.stats.maxHp*definition.healingDebt.capMaxHpRatio)-lifeDebt(target))
  ) : 0;
  if(definition.healingDebt&&debtAdded<=0)return previous??null;
  const previousStacks = definition.exposedElement ? availableExposureStacks(previous) : previous?.stacks ?? 0;
  target.statuses = target.statuses.filter((status) => status.id !== statusId &&
    !(definition.exposedElement && battle.content.statuses[status.id].exposedElement));
  const applied = {
    id: statusId,
    ...(bypassControlImmunity?{bypassControlImmunity:true}:{}),
    ...(definition.healingDebt?{debtHp:(previous?.debtHp??0)+debtAdded}:{}),
    ...(baseStatModifiers?{baseStatModifiers:{...baseStatModifiers}}:{}),
    ...(appliedModifiers?{appliedModifiers:{...appliedModifiers}}:{}),
    ...(linkedAppliedModifiers?{linkedAppliedModifiers:structuredClone(linkedAppliedModifiers)}:{}),
    remaining: duration ?? (definition.persistent ? null : duration),
    sourceId,
    stacks: Math.min(definition.maxStacks ?? 1, previousStacks + stacks),
    ...(previous?.refreshedRound !== undefined ? { refreshedRound: previous.refreshedRound } : {}),
  };
  if (definition.durationClock === "round") applied.expiresAfterRound=battle.round+duration-1;
  if (definition.effectImmunity)
    applied.charges = definition.effectImmunity.charges;
  if (definition.damageUses) applied.charges=definition.damageUses;
  if(definition.buffRejection||definition.consumeOnPaidSkill)applied.charges=charges??definition.buffRejection?.charges??definition.charges??1;
  if(definition.mpCostIncrease)applied.mpCostIncrease=definition.mpCostIncrease;
  if (definition.damageOverTime) {
    applied.potency = periodicPotency(definition,source,key=>stat(battle,source,key));
  }
  target.statuses.push(applied);
  if(definition.healingDebt){
    emitEvent(battle,{type:'life_debt_applied',sourceId,targetId:target.id,amount:debtAdded,remaining:lifeDebt(target)});
    write(battle,`${target.name} nhận ${debtAdded} Thế Chấp, tổng ${lifeDebt(target)} HP.`);
  }
  clampBattleMp(battle.content,target);
  gearBuffApplied(battle,source,target,definition,gearIO);
  if(!silent&&!exclusiveReaction)exclusiveEnemyStatusApplied(battle,target,definition,specialIO);
  if (!silent) emitEvent(battle,{type:"status",sourceId,targetId:target.id,statusId,element:source?.element,beneficial:definition.kind!=="debuff"});
  if (!silent) write(battle, `${target.name}: ${definition.name}.`);
  if (definition.kind==='debuff' && source && source.team!==target.team && living(target) && (target.hp<target.stats.maxHp||lifeDebt(target)>0)) {
    for (const healer of battle.actors.filter(item=>living(item) && item.team===target.team && item.passive?.type==='debuff_received_heal')) {
      if ((target.hp>=target.stats.maxHp && lifeDebt(target)<=0) || !procAvailable(battle,target,'debuff_heal:'+healer.id)) continue;
      const amount=supportAmount({multiplier:healer.passive.multiplier},stat(battle,healer,'magic'));
      if (amount<=0) continue;
      markProc(battle,target,'debuff_heal:'+healer.id);
      announcePassive(battle,healer,target.id);
      write(battle,healer.name+' kích hoạt '+healer.passive.name+' cho '+target.name+'.');
      healHp(battle,target,amount,healer.id,healer.passive.name);
    }
  }
  return applied;
}

function applyEffect(
  battle,
  actor,
  targets,
  effect,
  spent,
  area,
  actionContext = attackContext(battle, actor),
) {
  if(effect.hitsWhenTeamSpent)effect=spentTeamHits(effect,actionContext.teamResourceSpent?.[effect.hitsWhenTeamSpent.id]??0);
  if(effect.divideAmongTargets)effect={...effect,multiplier:effect.multiplier/Math.max(1,targets.filter(t=>living(t)).length)};
  if(effect.type==='team_resource'){const amount=effect.amount*(effect.perHitTarget?Math.min(effect.maxTargets,new Set(actionContext.gearImpacts.map(h=>h.target.id)).size):1);if(living(actor)&&amount>0){changeTeamResource(battle,actor,effect.resource,amount,teamIO);actionContext.explicitTeamCreated??=new Set();actionContext.explicitTeamCreated.add(effect.resource);}return;}
  if(effect.type==='revive'){if(living(actor))reviveTeam(battle,actor,effect,actionContext);return;}
  if(effect.teamResourceScaling)effect=scaledTeamEffect(battle.content,effect,actionContext.teamResourceValues[effect.teamResourceScaling.id]??0);
  if(effect.spentTeamResourceScaling)effect=scaledSpentTeamEffect(effect,actionContext.teamResourceSpent?.[effect.spentTeamResourceScaling.id]??0);
  if (effect.formulaScaling) effect=formulaDamage(effect,actionContext.formula);
  if (effect.type === "damage" && actionContext.skill?.target === "random_enemies" && effect.to !== "self") {
    if(battle.pvpRules&&!actionContext.pvpDamage)actionContext.pvpTargetSnapshot=targets.map(t=>t.id);
    for (let index=0;index<(effect.hits??1) && living(actor);index++) {
      const pool=targetsFor(battle,actor,actionContext.skill);
      if (!pool.length) break;
      const roll=battle.random();
      if (!Number.isFinite(roll) || roll<0 || roll>=1) throw new Error("Nguồn chọn mục tiêu không hợp lệ.");
      const target=pool[Math.floor(roll*pool.length)];
      emitEvent(battle,{type:"random_target",sourceId:actor.id,targetId:target.id,hitIndex:index,totalHits:effect.hits??1});
      actionContext.hitIndex=index;
      hit(battle,actor,target,effect,spent,{area:true,reaction:actionContext.reaction===true,actionContext});
    }
    return;
  }
  if(battle.pvpRules&&effect.type==='damage'&&!actionContext.pvpDamage)actionContext.pvpTargetSnapshot=targets.filter(t=>t.team!==actor.team).map(t=>t.id);
  const selectedAlly=effect.selectAlly?priorityTaggedAlly(battle,actor,effect.selectAlly):null;
  const recipients = effect.selectAlly ? (selectedAlly?[selectedAlly]:[]) : effect.to === "self" ? [actor] : effect.to==='primary'?targets.filter(t=>t.id===actionContext.primaryTargetId):targets;
  for (const target of recipients) {
    if (!living(target)) continue;
    if(effect.requiresDamageHit&&!actionContext.gearImpacts.some(hit=>hit.target.id===target.id))continue;
    if(effect.type==='reduce_cooldowns'){
      let reduced=0;for(const id of Object.keys(target.cooldowns)){const before=target.cooldowns[id];target.cooldowns[id]=Math.max(0,before-effect.amount);reduced+=before-target.cooldowns[id];}
      if(reduced){emitEvent(battle,{type:'cooldowns_reduced',sourceId:actor.id,targetId:target.id,amount:effect.amount});write(battle,target.name+': giảm '+effect.amount+' vòng hồi chiêu đang có.');}
    }
    if (effect.type === "damage") {
      for (
        let i = 0;
        i < (effect.hits ?? 1) && living(target) && living(actor);
        i += 1
      ) {
        actionContext.hitIndex=i;
        hit(battle, actor, target, effect.primaryMultiplier !== undefined ? {...effect,multiplier:target.id===actionContext.primaryTargetId ? effect.primaryMultiplier : effect.multiplier} : effect, spent, { area, reaction:actionContext.reaction===true, actionContext });
      }
    }
    if (effect.type === "formula_field") openFormula(battle,target,actionContext.skill,effect,modeIO);
    if (effect.type === "edit_formula") {
      const field=activeFormula(battle,target);
      field.entries=editedFormulaEntries(field,actionContext.formulaEdit,actor,actionContext.skill);
      write(battle,actor.name+': hiệu chỉnh → '+field.entries.map(entry=>({lead:'Dẫn',break:'Phá',strike:'Kích'}[entry.tag])).join(' · ')+'.');
      emitEvent(battle,{type:'formula_edit',sourceId:actor.id,entries:structuredClone(field.entries)});
    }
    if (effect.type === "end_formula") closeFormula(battle,target,modeIO,"theorem");
    if (effect.type === "turn_order_field") applyTurnOrderField(battle,target,effect,modeIO,actionContext.skillId);
    if(effect.type==='end_mode'&&target.activeMode===effect.mode)leaveCombatMode(battle,target,'skill_end',modeIO);
    if (effect.type === "enter_mode") enterCombatMode(battle,target,effect.mode,modeIO,effect.modeAppliedModifiers,effect.followUpBonus);
    if (effect.type === "prepare_mode") prepareCombatMode(battle,target,effect.mode,modeIO);
    if (effect.type === "summon_companion") prepareCompanion(battle,target,effect.companion,modeIO);
    if(effect.type==='steal_base_stat')stealBaseStat(battle,actor,target,effect,{status:applyStatus,emit:emitEvent,write});
    if (effect.type === "heal") {
      const requested=effect.spentLifeDebtRatio!==undefined?Math.round((actionContext.spentLifeDebt??0)*effect.spentLifeDebtRatio):supportAmount(effect,scalingValue(effect,key=>stat(battle,actor,key)),target.hp / target.stats.maxHp <= EMERGENCY_HP_THRESHOLD)+exclusiveHealBonus(battle,actor,target,actionContext.skill,specialIO);
      const blocked=externalHealingBlocked(target,actor.id);
      const healed=healHp(battle,target,requested,actor.id);
      // MP goes to the healed ally, based on the heal Amaryllis authored for that target.
      if(!blocked)grantHealMp(battle, actor, target, requested);
      gearSkillHealed(battle,actor,target,healed,actionContext,gearIO);
    }
    if (effect.type === "shield") {
      if(isInAgony(target)){write(battle,target.name+': Oán Hận chặn nhận khiên.');continue;}
      const amount = receivedSupport(battle.content,target,supportAmount(
        effect.primaryMultiplier!==undefined?{...effect,multiplier:target.id===actionContext.primaryTargetId?effect.primaryMultiplier:effect.multiplier}:effect,
        scalingValue(effect,key=>stat(battle,actor,key)),
      ),"shieldReceivedReduction");
      // Shields do not stack; a weaker shield cannot overwrite a stronger one.
      if (amount > target.shield) {
        target.shield = amount;
        chargeSupportModes(battle,actor,actionContext);
        target.shieldSourceId = actor.id;
        if (effect.durationRounds!==undefined) target.shieldExpiresAfterRound=battle.round+effect.durationRounds-1;
        else delete target.shieldExpiresAfterRound;
        target.statuses = target.statuses.filter(
          (status) => !battle.content.statuses[status.id].expiresOnShieldGain,
        );
        emitEvent(battle, {
          type: "shield",
          targetId: target.id,
          sourceId: actor.id,
          amount,
        });
      }
      write(battle, `${target.name} có ${target.shield} khiên.`);
    }
    if (effect.type === "resource")
      gainResource(
        battle,
        target,
        effect.resource,
        effect.resource === "mp"
          ? mpRestoreAmount(effect, battleMaxMp(battle.content,target))
          : effect.amount,
        actor.id,
      );
    if (effect.type === "status") {
      const count = (effect.stacks ?? 1) + (effect.extraStacksIfPresent && actionContext.preMarkedTargets?.has(target.id + ":" + effect.status) ? effect.extraStacksIfPresent : 0);
      const extension = exclusivePassive(actor,"skill_status_duration",actionContext.skillId);
      const duration = effect.duration === undefined ? undefined : effect.duration + (extension?.statusId === effect.status ? extension.extraDuration : 0);
      if (battle.content.statuses[effect.status].exposedElement) applyStatus(battle, target, effect.status, duration, actor.id, {stacks:count});
      else for (let i = 0; i < count; i++) {
        const applied = applyStatus(battle, target, effect.status, duration, actor.id, {charges:effect.charges,appliedModifiers:effect.appliedModifiers,linkedAppliedModifiers:effect.linkedAppliedModifiers,debtMaxHpRatio:effect.debtMaxHpRatio,chanceScaling:effect.chanceScaling});
        if (!applied || applied.stacks >= (battle.content.statuses[effect.status].maxStacks ?? 1)) break;
      }
    }
    if (effect.type === "grant_extra_turn") {
      if (battle.phase === "extra") write(battle, `${target.name}: bỏ qua cấp Lượt Thêm trong Vòng Phụ.`);
      else if (battle.extraTurnGrants.has(target.id)) write(battle, `${target.name}: đã có Lượt Thêm trong vòng này.`);
      else {
        battle.extraTurnGrants.add(target.id);
        battle.extraPhaseRequired = true;
        write(battle, `${target.name} nhận Lượt Thêm cho Vòng Phụ ${battle.round}.`);
        emitEvent(battle, {type:"extra_turn_granted",sourceId:actor.id,targetId:target.id,round:battle.round});
      }
    }
    if (effect.type === "toggle_status") {
      if (target.statuses.some((status) => status.id === effect.status)) {
        target.statuses = target.statuses.filter(
          (status) => status.id !== effect.status,
        );
        write(
          battle,
          `${target.name} kết thúc ${battle.content.statuses[effect.status].name}.`,
        );
      } else {
        const applied = applyStatus(
          battle,
          target,
          effect.status,
          effect.duration,
          actor.id,
          {charges:effect.charges,appliedModifiers:effect.appliedModifiers,linkedAppliedModifiers:effect.linkedAppliedModifiers},
        );
        if (applied && effect.linkedStatuses)
          applied.linkedStatuses = [...effect.linkedStatuses];
      }
    }
    if (effect.type === "dispel") {
      dispelBuffs(battle,actor,target,effect.count,effect.all);
    }
    if (effect.type === "cleanse") {
      if (target.statuses.some(status=>battle.content.statuses[status.id].kind==="debuff")) emitEvent(battle,{type:"cleanse",sourceId:actor.id,targetId:target.id});
      target.statuses = target.statuses.filter(
        (status) => battle.content.statuses[status.id].kind !== "debuff",
      );
      write(battle, `${target.name} được giải hiệu ứng bất lợi.`);
    }
    clampBattleMp(battle.content,target);
  }
}

export function basicAbility(actor) {
  const magical = actor.basicDamageType === "magical";
  return {
    id: "$attack",
    name: magical ? "Phép cơ bản" : "Đánh thường",
    target: "enemy",
    presentation: actor.basicPresentation,
    effects: actor.basicAttack
      ? structuredClone(actor.basicAttack)
      : [
          {
            type: "damage",
            damageType: magical ? "magical" : "physical",
            element: actor.element,
            multiplier: 1,
          },
        ],
  };
}

export const DEFEND = {
  id: "$defend",
  name: "Phòng thủ",
  target: "self",
  effects: [
    { type: "status", status: "guard", duration: 1 },
    { type: "resource", resource: "mp", maxMpRatio: 0.05 },
  ],
};

export function executeAction(battle, command) {
  return resolveAction(battle, command);
}

function finishStatuses(
  battle,
  actor,
  oldStatuses,
  offensive,
  tickDuration = true,
) {
  actor.statuses = actor.statuses.filter((status) => {
    if (!oldStatuses.includes(status)) return true;
    if (battle.content.statuses[status.id].damageOverTime || battle.content.statuses[status.id].durationClock === "round") return true;
    if (offensive && battle.content.statuses[status.id].consumeOnAttack)
      return false;
    if (
      (battle.content.statuses[status.id].persistent &&
        status.remaining === null) ||
      (battle.content.statuses[status.id].durationClock === "main_turn" && battle.phase === "extra") ||
      !tickDuration
    )
      return true;
    status.remaining -= 1;
    if (
      status.remaining <= 0 &&
      battle.content.statuses[status.id].turnStartAbility
    )
      write(
        battle,
        `${actor.name}: ${battle.content.statuses[status.id].name} hết hiệu lực${actor.passive?.type === "field_growth" && actor.passive.statusId === status.id ? `, ${actor.passive.name} kết thúc` : ""}.`,
      );
    return status.remaining > 0;
  });
  clampBattleMp(battle.content,actor);
}

function resolveAction(
  battle,
  { actorId, abilityId, targetId, formulaEdit },
  { endTurn = true, resetEvents = true } = {},
) {
  if (battle.outcome) throw new Error("Trận đấu đã kết thúc.");
  const actor = activeActor(battle);
  if (!actor || actor.id !== actorId)
    throw new Error("Chưa đến lượt nhân vật này.");
  const skill = resolveRankedAbility(battle.content,actor,
    abilityId === "$attack"
      ? basicAbility(actor)
      : abilityId === "$defend"
        ? DEFEND
        : battle.content.abilities[abilityId]);
  if (
    !skill ||
    (!abilityId.startsWith("$") && !actor.abilities.includes(abilityId))
  )
    throw new Error("Nhân vật chưa có kỹ năng này.");
  const availability = abilityAvailability(battle, actor, skill);
  if (!availability.ok) throw new Error(availability.reason);
  const legal = targetsFor(battle, actor, skill);
  const area = targetsAsGroup(skill);
  const targets = selectedTargets(battle,actor,skill,targetId);
  if (!targets.length) throw new Error("Mục tiêu không hợp lệ.");
  if (skill.effects.some(effect=>effect.primaryMultiplier!==undefined||effect.to==='primary') && !legal.some(target=>target.id===targetId)) throw new Error("Mục tiêu chính không hợp lệ.");
  if (skill.effects.some(effect=>effect.type==='edit_formula')) validateFormulaEdit(activeFormula(battle,actor),formulaEdit);
  const theorem=skill.effects.some(effect=>effect.formulaScaling) ? formulaSnapshot(battle,actor) : null;
  // Validate everything before mutating MP, resources or turn order.
  if (resetEvents) battle.events = [];
  const supportScopeBefore=battle.supportChargeScope;battle.supportChargeScope={supportCharged:new Set()};
  const oldStatuses = [...actor.statuses];
  emitEvent(battle,{type:"ability_cast",sourceId:actor.id,abilityId:skill.id,label:skill.name,attack:skill.effects.some(effect=>effect.type==="damage"),presentation:skill.presentation,visualId:`cast-${battle.actionCount}-${actor.id}-${skill.id}`,perfect:theorem?.perfect??false,targetId,area,targetIds:targets.map(target=>target.id)});
  const mortgageBonusBeforeCost=mortgageDamageBonus(actor);
  const spentLifeDebt=skill.cost?.consumeAllLifeDebt?lifeDebt(actor):preferredLifeDebtCost(skill,actor);
  let totalPaidMp=mpCost(skill,actor,battle);
  actor.mp -= totalPaidMp;
  if(spentLifeDebt>0){payLifeDebt(actor,spentLifeDebt);emitEvent(battle,{type:'life_debt_spent',sourceId:actor.id,targetId:actor.id,amount:spentLifeDebt,remaining:lifeDebt(actor)});write(battle,actor.name+' tiêu '+spentLifeDebt+' Thế Chấp, còn '+lifeDebt(actor)+' HP.');}
  if(totalPaidMp>0){
    for(const status of [...actor.statuses])if(battle.content.statuses[status.id]?.consumeOnPaidSkill&&(status.charges??1)>0){
      consumeStatusCharge(actor,status);
      write(battle,actor.name+': Nhiễu Ma Lực tiêu 1 lần · trả '+totalPaidMp+' MP.');
    }
  }
  const teamCost=selectedTeamCost(battle,actor,skill);
  const paidTeam=teamCost?teamCostAmount(teamCost,teamResourceValue(battle,actor,teamCost.id)):0;
  if(teamCost)changeTeamResource(battle,actor,teamCost.id,-paidTeam,teamIO);
  const paidHp=hpCost(skill,actor);
  if(paidHp){actor.hp-=paidHp;emitEvent(battle,{type:"hp_spent",sourceId:actor.id,targetId:actor.id,amount:paidHp});write(battle,actor.name+" tiêu "+paidHp+" HP.");gearHpLoss(battle,actor,actor.hp,gearIO);maybeGrantLowHpImmortality(battle,actor,actor.hp,specialIO);}
  let spent = 0;
  const selectedResource = resourceCost(skill,actor);
  const deferredResource = selectedResource?.consumeAt === "after";
  if (selectedResource) {
    const cost = selectedResource;
    spent = cost.all ? actor.resourceValues[cost.id] : cost.amount;
    if (!deferredResource){actor.resourceValues[cost.id]-=spent;exclusiveResourceChanged(battle,actor,cost.id,-spent,specialIO);}
  }
  if (skill.cooldown) actor.cooldowns[skill.id] = skill.cooldown + 1;
  write(battle, `${actor.name} dùng ${skill.name}.`);
  if (skill.cost?.preferResource) write(battle,actor.name+': tiêu '+(selectedResource ? spent+' '+actor.resources[selectedResource.id].name : totalPaidMp+' MP')+'.');
  const actionContext = attackContext(battle, actor);
  actionContext.spentLifeDebt=spentLifeDebt;
  actionContext.mortgageDamageBonus=mortgageBonusBeforeCost;
  actionContext.teamResourceSpent=teamCost?{[teamCost.id]:paidTeam}:{};
  actionContext.castMode=actor.activeMode;
  actionContext.skillId = skill.id;
  actionContext.skill = skill;
  actionContext.formula = theorem;
  actionContext.formulaEdit = formulaEdit;
  actionContext.primaryTargetId = targetId;
  prepareGearHealing(battle,actor,targets,skill,actionContext);
  actionContext.baseStatBonuses = skillBaseStatBonuses(battle,actor,skill,targets);
  if (actor.passive?.type === 'detonation_base_growth' && actionContext.baseStatBonuses[actor.passive.stat]) actor.detonationBonus = actionContext.baseStatBonuses[actor.passive.stat];
  if (theorem?.baseMagic) actionContext.baseStatBonuses.magic=(actionContext.baseStatBonuses.magic??0)+theorem.baseMagic;
  if (theorem) emitEvent(battle,{type:'formula_burst',sourceId:actor.id,targetId,correct:theorem.correct,perfect:theorem.perfect,baseMagic:theorem.baseMagic});
  for (const [key,amount] of Object.entries(actionContext.baseStatBonuses)) {
    write(battle,actor.name+": "+actor.passive.name+" +"+amount+" "+(key==="magic"?"MAG":"ATK")+" căn bản cho chiêu này.");
    emitEvent(battle,{type:"skill_base_bonus",sourceId:actor.id,abilityId:skill.id,stat:key,amount});
  }
  actionContext.startStatusIds=new Set(oldStatuses.map(s=>s.id));
  actionContext.statRatioBonuses=specialSkillStatBonuses(actor,skill,{spentResource:selectedResource?.id,spent});
  for(const[key,n]of Object.entries(teamSpendStatBonuses(actor,skill,paidTeam)))actionContext.statRatioBonuses[key]=(actionContext.statRatioBonuses[key]??0)+n;
  if(actor.passive?.type==='spent_team_resource_stat'&&paidTeam){announcePassive(battle,actor);write(battle,actor.name+': '+actor.passive.name+' +'+Math.round(actor.passive.ratio*100)+'% ATK cho chiêu này.');}
  actionContext.preMarkedTargets = new Set(battle.actors.flatMap(target => target.statuses.map(mark => target.id + ":" + mark.id)));
  const damageBonus = exclusivePassive(actor,"skill_damage",skill.id);
  if (damageBonus) actionContext.multiplier *= 1 + damageBonus.ratio;
  if (actor.passive?.type === "extra_mp_damage" && (skill.cost?.mp ?? 0) > 0 && skill.effects.some(effect => effect.type === "damage") && skill.activation !== "passive") {
    const cap = Math.ceil(skill.cost.mp * actor.passive.extraCostRatio);
    const extra = Math.min(actor.mp,cap);
    actor.mp -= extra;
    totalPaidMp+=extra;
    if(cap>0&&extra===cap)for(const[key,n]of Object.entries(specialSkillStatBonuses(actor,skill,{fullExtraPayment:true})))actionContext.statRatioBonuses[key]=(actionContext.statRatioBonuses[key]??0)+n;
    actionContext.multiplier *= 1 + (cap ? actor.passive.maxDamageBonus * extra / cap : 0);
    write(battle, `${actor.name}: ${actor.passive.name}, tiêu thêm ${extra}/${cap} MP.`);
  }
  const automaticSpent=payMpTeamResources(battle,actor,totalPaidMp,teamIO);
  for(const[id,n]of Object.entries(automaticSpent))actionContext.teamResourceSpent[id]=(actionContext.teamResourceSpent[id]??0)+n;
  actionContext.sharedPenetration=sharedPenetration(battle.content,automaticSpent);
  actionContext.sharedDamageBonus=spentSharedDamage(actor,automaticSpent);
  actionContext.hybrid =
    new Set(
      skill.effects
        .filter((effect) => effect.type === "damage")
        .map((effect) => effect.damageType),
    ).size > 1;
  for (const effect of skill.effects)
    applyEffect(battle, actor, targets, effect, spent, area, actionContext);
  const resourcePassive=actor.passive;if(living(actor)&&resourcePassive?.type==='starting_resource_skill_chance'&&skill.id===resourcePassive.abilityId&&(actor.resourceValues[resourcePassive.resource]??0)<actor.resources[resourcePassive.resource].max){const chance=Math.min(resourcePassive.cap,Math.max(0,baseStatValue(actor,resourcePassive.stat))/resourcePassive.atStat*resourcePassive.cap);if(battle.random()<chance){announcePassive(battle,actor,actor.id);gainResource(battle,actor,resourcePassive.resource,resourcePassive.amount);}}
  for(const exclusive of exclusivePassives(actor).filter(p=>(!p.abilityIds||p.abilityIds.includes(skill.id))&&living(actor))) {
    if (exclusive.type === "after_skill_status") {
      for (const target of exclusive.to === "targets" ? targets.filter(living) : [actor]) applyStatus(battle,target,exclusive.statusId,exclusive.duration,actor.id);
    }
    if (exclusive.type === "skill_resource_bonus" && (!exclusive.oncePerRound || procAvailable(battle,actor,"exclusive_resource"))) {
      const before = actor.resourceValues[exclusive.resource] ?? 0;
      gainResource(battle,actor,exclusive.resource,exclusive.amount);
      if (actor.resourceValues[exclusive.resource] > before) markProc(battle,actor,"exclusive_resource");
    }
    if (exclusive.type === "fresh_mark_bonus" && (!exclusive.oncePerRound || procAvailable(battle,actor,"exclusive_mark"))) {
      for (const target of targets.filter(living)) {
        if (!actionContext.preMarkedTargets.has(target.id + ":" + exclusive.statusId) && target.statuses.some(status => status.id === exclusive.statusId)) {
          const old = target.statuses.find(status => status.id === exclusive.statusId).stacks;
          let applied;
          for (let i=0;i<exclusive.amount;i++) {
            applied = applyStatus(battle,target,exclusive.statusId,exclusive.duration,actor.id);
            if (!applied || applied.stacks >= (battle.content.statuses[exclusive.statusId].maxStacks ?? 1)) break;
          }
          if (applied && applied.stacks > old) { markProc(battle,actor,"exclusive_mark"); break; }
        }
      }
    }
    if (exclusive.type === "consumed_targets_mp" && (actionContext.consumedTargets.get(exclusive.statusId)?.size ?? 0) >= exclusive.minTargets) gainResource(battle,actor,"mp",exclusive.amount);
    if (exclusive.type === "next_turn_heal") actor.pendingExclusiveHeal = { ratio: exclusive.ratio, sourceId: actor.id, name: exclusive.name };
  }
  exclusiveAfterSkill(battle,actor,skill,actionContext,specialIO);
  if (deferredResource) {
    const resourceId = selectedResource.id;
    const keep=specialResourceKeepChance(actor,skill.id,resourceId,key=>baseStatValue(actor,key));
    if(keep&&battle.random()<keep.chance){
      announcePassive(battle,actor,actor.id,keep.passive.name);
      write(battle,`${actor.name}: ${keep.passive.name} giữ lại ${actor.resources[resourceId].name}.`);
    }else{
      actor.resourceValues[resourceId] = Math.max(
        0,
        actor.resourceValues[resourceId] - spent,
      );
      exclusiveResourceChanged(battle,actor,resourceId,-spent,specialIO);
    }
  }
  const offensive = skill.effects.some((effect) => effect.type === "damage");
  // Once per attack action, after its damage and resource cost. New points belong to the next attack.
  if (offensive && living(actor)) {
    for (const status of statusDefinitions(battle, actor)) {
      const trigger = status.onAttackResource;
      const resource = actor.resources?.[trigger?.resource];
      if (
        !trigger ||
        !resource ||
        actor.resourceValues[trigger.resource] >= resource.max
      )
        continue;
      if (battle.random() < exclusiveAttackResourceChance(actor,status.id,trigger,key=>stat(battle,actor,key))) {
        const before = actor.resourceValues[trigger.resource];
        gainResource(battle, actor, trigger.resource, trigger.amount ?? 1);
        const gained = actor.resourceValues[trigger.resource] - before;
        if (gained > 0)
          write(
            battle,
            `${actor.name} tích ${gained} ${actor.resources[trigger.resource].name} từ ${status.name}: ${actor.resourceValues[trigger.resource]} / ${actor.resources[trigger.resource].max}.`,
          );
      }
    }
  }
  if(skill.id==='$defend'&&actor.passive?.type==='defend_adjacent_mp'&&living(actor)){
    const recipients=adjacentAllies(battle,actor);
    if(recipients.length){announcePassive(battle,actor);write(battle,actor.name+' kích hoạt '+actor.passive.name+'.');}
    const upgrade=exclusivePassive(actor,'defend_adjacent_support');
    for(const ally of recipients){
      gainResource(battle,ally,'mp',Math.ceil(battleMaxMp(battle.content,ally)*(upgrade?.ratio??actor.passive.ratio)),actor.id);
      if(upgrade)applyStatus(battle,ally,upgrade.statusId,upgrade.duration,actor.id);
    }
  }
  if(skill.id==='$defend')chargeSupportModes(battle,actor,actionContext);
  gearAfterAction(battle,actor,skill,gearIO);
  finishStatuses(battle, actor, oldStatuses, offensive, endTurn);
  if (offensive) finishAttackContext(battle, actor, actionContext);
  growTeamResources(battle,actor,skill,teamIO);
  triggerCreationSupport(battle,actor,skill,actionContext);
  triggerElementSupports(battle,actor,skill,actionContext);
  triggerOwnModeFollowup(battle,actor,skill,actionContext);
  triggerPowderFollowups(battle,actor,skill,actionContext);
  battle.actionCount += 1;
  transitionBossPhases(battle, { write, restoreMp: gainResource });
  recordFormulaAction(battle,actor,skill,modeIO);
  triggerSupportFollowups(battle,actor,skill);
  triggerSupportSkillCounters(battle,actor,skill,actionContext);
  triggerShieldModeRouse(battle,actor,skill,actionContext);
  if(teamCost)triggerSpentResourceFollowups(battle,actor,teamCost);
  spendModeTurn(actor);
  for(const member of battle.actors)checkCombatMode(battle,member,'action_end',modeIO);
  if(supportScopeBefore)battle.supportChargeScope=supportScopeBefore;else delete battle.supportChargeScope;
  if (endTurn) {
    endTurnPassive(battle, actor);
    advance(battle);
  } else checkOutcome(battle);
  return battle;
}

function executeBossTurn(battle, actor) {
  battle.events = [];
  const oldStatuses = [...actor.statuses];
  const jobs = bossTurnJobs(battle, actor, id=>abilityAvailability(battle,actor,battle.content.abilities[id]).ok);
  let heavyUsed = false;
  for (const [index, job] of jobs.entries()) {
    if (battle.outcome || !living(actor)) break;
    let skill = battle.content.abilities[job.abilityId];
    if (
      !abilityAvailability(battle, actor, skill).ok ||
      (heavyUsed && skill.bossHeavy)
    )
      skill = battle.content.abilities[actor.boss.phases[0].rotation[0][0]];
    if (skill.bossHeavy) heavyUsed = true;
    const legal = targetsFor(battle, actor, skill);
    if (!legal.length) break;
    const target =
      legal.find((item) => item.id === job.targetId) ??
      legal[Math.floor(battle.random() * legal.length)];
    write(
      battle,
      `${actor.name} — Giai đoạn ${actor.bossState.phase}, hành động ${index + 1} / ${jobs.length}.`,
    );
    if (skill.windup && !job.readyRound) {
      actor.bossState.pendingMoves.push({
        abilityId: skill.id,
        readyRound: battle.round + skill.windup.rounds,
        targetId: skill.target === "enemy" ? target.id : undefined,
      });
      write(
        battle,
        `${actor.name} vận sức: ${skill.name}${skill.target === "enemy" ? ` nhắm ${target.name}` : ""}. ${skill.windup.message} Thi triển từ lượt boss ở vòng ${battle.round + skill.windup.rounds}.`,
      );
      battle.actionCount++;
    } else {
      resolveAction(
        battle,
        { actorId: actor.id, abilityId: skill.id, targetId: target.id },
        { endTurn: false, resetEvents: false },
      );
    }
  }
  finishStatuses(battle, actor, oldStatuses, false);
  endTurnPassive(battle, actor);
  if (!battle.outcome) advance(battle);
}

export function forecastBattleAction(battle,command){
 const {content,random,rewardRandom,...state}=battle;
 const trial=structuredClone(state);trial.content=content;trial.pvpRules=battle.pvpRules;trial.random=()=>.5;trial.events=[];trial.log=[];
 resolveAction(trial,command,{endTurn:false});return trial;
}
export const forecastArenaAction=forecastBattleAction;
export function planAutoBattleTurn(battle){
 const actor=activeActor(battle);if(battle.arena||battle.chronicle||battle.outcome||actor?.team!=='party')return null;
 return chooseBattleAction(battle,actor,{abilityAvailability,targetsFor,basicAbility,forecast:forecastBattleAction});
}
export function planArenaEnemyTurn(battle){
 const actor=activeActor(battle);if(!battle.arena||battle.outcome||actor?.team!=='enemy')return null;
 return chooseBattleAction(battle,actor,{abilityAvailability,targetsFor,basicAbility,forecast:forecastArenaAction});
}
export function executeEnemyTurn(battle,plannedCommand) {
  const actor = activeActor(battle);
  if (!actor || actor.team !== "enemy") return;
  if(battle.arena){
    const command=plannedCommand??planArenaEnemyTurn(battle);
    executeAction(battle,command);
    emitEvent(battle,{type:'arena_ai_decision',sourceId:actor.id,abilityId:command.abilityId,targetId:command.targetId,reason:command.aiReason,score:command.aiScore});
    if(battle.pvpRules?.debugDamage)write(battle,'[AI] '+actor.name+': '+command.aiReason+'.');return;
  }
  if (actor.boss) return executeBossTurn(battle, actor);
  const prepared=actor.preparedMove;
  if(prepared){
    if(battle.phase!=='main'||prepared.readyRound>battle.round){executeAction(battle,{actorId:actor.id,abilityId:'$defend',targetId:actor.id});return;}
    delete actor.preparedMove;
    let skill=battle.content.abilities[prepared.abilityId];if(!abilityAvailability(battle,actor,skill).ok)skill=basicAbility(actor);
    const legal=targetsFor(battle,actor,skill),target=legal.find(t=>t.id===prepared.targetId)??legal[0];
    executeAction(battle,{actorId:actor.id,abilityId:skill.id,targetId:target?.id});return;
  }
  const priority = actor.ai?.priorities?.map(rule => {
    const ability = battle.content.abilities[rule.abilityId];
    if (!ability || !abilityAvailability(battle, actor, ability).ok) return null;
    const targets = targetsFor(battle, actor, ability);
    let target;
    if(rule.when==="enemy_has_status") target=targets.find(t=>activeStatuses(t).some(s=>s.id===rule.statusId));
    if(rule.when==="enemy_missing_status") target=targets.find(t=>!activeStatuses(t).some(s=>s.id===rule.statusId));
    if (rule.when === "unshielded" && actor.shield === 0) target = targets[0];
    if (rule.when === "ally_hp_below") target = targets.filter(ally => ally.hp / ally.stats.maxHp < rule.ratio).sort((a,b) => a.hp/a.stats.maxHp-b.hp/b.stats.maxHp)[0];
    if (rule.when === "ally_unshielded") target = targets.find(ally => ally.shield === 0);
    if (rule.when === "missing_status") target = targets.find(ally => !ally.statuses.some(status => status.id === rule.statusId));
    return target ? { ability, target } : null;
  }).find(Boolean);
  const skills = actor.abilities
    .map((id) => battle.content.abilities[id])
    .filter(
      (skill) =>
        abilityAvailability(battle, actor, skill).ok &&
        skill.effects.some((effect) => (effect.type === "damage" || effect.type === "grant_extra_turn")),
    );
  const rotation=actor.ai?.rotation;let rotated;
  if(rotation?.length){const id=rotation[(actor.aiRotationStep??0)%rotation.length];actor.aiRotationStep=(actor.aiRotationStep??0)+1;const candidate=battle.content.abilities[id];rotated=abilityAvailability(battle,actor,candidate).ok?candidate:basicAbility(actor);}
  const skill = rotated??(priority
    ? priority.ability
    : skills.length && battle.random() < 0.7
      ? skills[Math.floor(battle.random() * skills.length)]
      : basicAbility(actor));
  const targets = targetsFor(battle, actor, skill);
  const target = (!rotated&&priority?.target) || targets[Math.floor(battle.random() * targets.length)];
  if(skill.windup){
    battle.events=[];const oldStatuses=[...actor.statuses];actor.preparedMove={abilityId:skill.id,readyRound:battle.round+skill.windup.rounds,targetId:target?.id};
    emitEvent(battle,{type:'enemy_windup',sourceId:actor.id,abilityId:skill.id,label:skill.name,readyRound:actor.preparedMove.readyRound});
    write(battle,actor.name+' vận sức: '+skill.name+'. '+skill.windup.message);battle.actionCount++;
    finishStatuses(battle,actor,oldStatuses,false);endTurnPassive(battle,actor);advance(battle);return;
  }
  executeAction(battle,{actorId:actor.id,abilityId:skill.id,targetId:target?.id});
}

