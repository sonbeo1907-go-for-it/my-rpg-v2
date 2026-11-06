"use client";
import {createCompetitiveArena} from '../core/arena-ranked.js';
import {reserveArenaMatch,settleArenaMatch} from '../core/arena-progression.js';
import {validateDraftFormation,arrangeDraftAI} from '../core/arena-draft.js';
import {createArenaBattle} from '../core/arena.js';
import {forfeitArenaBattle} from '../core/arena-identity.js';
import {saveArenaSession,takeAbandonedArena} from './arena-session.js';
import {ARENA_PACING,arenaSkillName,arenaActionSummary} from '../ui/arena-experience.js';
import {assertFortressLoadoutUnchanged} from '../core/fortress-session.js';
import {enterFortress,moveFortress,leaveFortress,beginFortressEvent,performFortressService,actFortressEvent} from '../core/fortress.js';
import {beginChronicleEvent,actChronicle} from '../core/chronicles.js';
import {activeChronicleSnapshot,createChronicleBattle,restoreChronicleBattle,snapshotChronicleBattle,checkpointChronicleBattle,advanceChronicleWave,finishChronicleBattle} from '../core/chronicle-combat.js';
import {upgradeSkill} from '../core/skill-progression.js';
import {allocatePoints,limitBreak} from '../core/leveling.js';
import {sweepDungeon as sweepDungeonAction} from '../core/dungeon.js';
import {combatFeedbackDuration} from "../ui/combat-timeline.js";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { createGameSave } from "../core/game-save.js";
import {
  createBattle,
  activeActor,
  executeAction,
  executeEnemyTurn,
  planArenaEnemyTurn,
  planAutoBattleTurn,
} from "../core/battle.js";
import {prepareVictoryReward,victoryRewardText} from '../core/quest-rewards.js';
import { claimBattleReward, victoryCoinReward } from "../core/economy.js";
import { seededRandom } from "../core/random.js";
import {needsDailyVisit,visitDailyCommissions,claimDailyCommissions} from "../core/daily-commissions.js";
import {createFarmSession,recordFarmResult,stopFarmSession,validateFarmTarget} from '../core/farm-session.js';
import {dungeonDailyState,nextDungeonReset,dungeonDay} from "../core/dungeon-rules.js";
import { createGameMusic } from "../ui/game-music.js";
import { readSettings } from "../ui/preferences.js";
import { createProfileStore } from "./profile-store.js";
import { desktopInvoke } from "./desktop";
import { createDungeonPreviewCache } from "./dungeon-preview.js";
import { dungeonRewardText } from "../ui/dungeon-presentation.js";
import { isQuestUnlocked } from "../core/quest-catalog.js";
import {
  createDungeonRun,
  advanceDungeonWave,
  claimDungeonReward,
  isFinalDungeonWave,
} from "../core/dungeon.js";

import {createStoryRun,advanceStoryWave,isFinalStoryWave} from '../core/story-waves.js';
const isFinalRun=(run:any)=>run.kind==='story'?isFinalStoryWave(run):isFinalDungeonWave(run);
const advanceRun=(content:any,run:any)=>run.kind==='story'?advanceStoryWave(content,run):advanceDungeonWave(content,run);
import { battlePresentation, isContinuingVictory } from "../core/combat-modes.js";
type GameContextValue = {
  farm:any;
  startFarming:(target:any,limit:number)=>boolean;
  stopFarming:()=>void;
  toggleAutoBattle:()=>void;
  startArena:(teamId:string,seed?:number)=>boolean;
  reserveCompetition:(match:any)=>Promise<boolean>;
  beginCompetition:(draft?:any,party?:string[])=>boolean;
  settleCompetition:()=>Promise<boolean>;
  abandonCompetition:()=>Promise<boolean>;
  fortressCommand:(kind:string,payload?:any)=>Promise<boolean>;
  visitChronicle:(locationId:string,observe?:boolean)=>Promise<boolean>;
  actChronicleScene:(locationId:string,instanceId:string,stepId:string,actionId:string)=>Promise<boolean>;
  startChronicleFight:(locationId:string,instanceId:string)=>Promise<boolean>;
  retreatChronicleFight:()=>Promise<boolean>;

  dailyNow: number;
  claimCommissions: (keys?: string[]) => Promise<boolean>;
  refreshCommissions: () => Promise<boolean>;
  content: any;
  campaign: any;
  battle: any;
  events: any[];
  ready: boolean;
  entered: boolean;
  busy: boolean;
  notice: string;
  audio: any;
  battleUI: { allyId: string; enemyId: string; skillId: string };
  updateBattleUI: (
    changes: Partial<{ allyId: string; enemyId: string; skillId: string }>,
  ) => void;
  animationSpeed: "normal" | "fast";
  setAnimationSpeed: (speed: "normal" | "fast") => void;
  profiles: any[];
  activeProfile: any;
  profileError: string;
  desktop: boolean;
  saveDirectory: string;
  refreshProfiles: () => Promise<void>;
  enterProfile: (id: number) => Promise<boolean>;
  createProfile: (username: string) => Promise<boolean>;
  renameProfile: (username: string) => Promise<boolean>;
  restoreProfile: (id: number) => Promise<boolean>;
  leaveProfile: () => boolean;
  openSaveDirectory: () => Promise<void>;
  transact: (
    operation: (current: any) => any,
    message?: string,
  ) => Promise<boolean>;
  startBattle: (id: string,difficultyId?:string,superLevel?:number) => boolean;
  progressionLocked:boolean;
  upgradeCharacterSkill:(id:string,line:string,expectedRank:number)=>Promise<boolean>;
  updateAllocations:(id:string,allocations:Record<string,number>)=>Promise<boolean>;
  breakCharacterLimit:(id:string)=>Promise<boolean>;
  sweepDungeon:(id:string,difficultyId:string)=>Promise<boolean>;
  sweepResult:any;
  dismissSweepResult:()=>void;
  startDungeon: (id: string, difficultyId: string) => boolean;
  prepareDungeonPreview: (id: string, difficultyId: string, now?: Date) => any;
  runBattle: (command?: any) => Promise<void>;
  claimReward: () => Promise<void>;
  notify: (message: string) => void;
  toggleAudio: () => void;
  setVolume: (volume: number) => void;
  setAudioEnabled: (enabled: boolean) => void;
  pendingBattleId: string | null;
  pendingDungeon: { typeId: string; difficultyId: string } | null;
  cancelNewBattle: () => void;
  confirmNewBattle: () => boolean;
};
const GameContext = createContext<GameContextValue | null>(null);
export const useGame = () => {
  const value = useContext(GameContext);
  if (!value) throw new Error("Thiếu GameProvider");
  return value;
};
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function GameProvider({
  content: initialContent,
  children,
}: {
  content: any;
  children: ReactNode;
}) {
  // This catalog is static for the app session. RSC query navigation may deliver
  // a new object for the same data; it must not reset profiles or scene audio.
  const content = useRef(initialContent).current;
  const path = usePathname();
  const [campaign, setCampaign] = useState<any>(null);
  const [dailyNow,setDailyNow]=useState(()=>Date.now());
  const dailyAttempt=useRef("");
  useEffect(()=>{
    let timer:ReturnType<typeof setTimeout>;
    const tick=()=>{const now=new Date();setDailyNow(now.getTime());clearTimeout(timer);timer=setTimeout(tick,Math.min(60_000,nextDungeonReset(now).getTime()-now.getTime()+100));};
    const visible=()=>{if(!document.hidden){dailyAttempt.current="";tick();}};tick();window.addEventListener("focus",visible);document.addEventListener("visibilitychange",visible);
    return()=>{clearTimeout(timer);window.removeEventListener("focus",visible);document.removeEventListener("visibilitychange",visible);};
  },[]);
  const campaignRef = useRef<any>(null);
  const sweepRewardAttempt = useRef<any>(null);
  const store = useRef<ReturnType<typeof createProfileStore> | null>(null);
  const initializing = useRef<Promise<any> | null>(null);
  const activeProfileId = useRef<number | null>(null);
  const saveLock = useRef(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [profileError, setProfileError] = useState("");
  const [desktop, setDesktop] = useState(false);
  const [saveDirectory, setSaveDirectory] = useState("");
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const runtime = useRef<any>(null);
  const dungeonRun = useRef<any>(null);
  const scouting = useRef<ReturnType<typeof createDungeonPreviewCache> | null>(
    null,
  );
  function scoutingCache() {
    scouting.current ??= createDungeonPreviewCache(content, sessionStorage);
    return scouting.current;
  }
  const farmRef=useRef<any>(null);
  const [farm,setFarm]=useState<any>(null);
  const [sweepResult,setSweepResult]=useState<any>(null);
  const lock = useRef(false);
  const [battle, setBattle] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [ready, setReady] = useState(false);
  const [entered, setEntered] = useState(false);
  const [busy, setBusy] = useState(false);
  const pendingQuestDifficulty=useRef<string|undefined>(undefined);
  const pendingSuperLevel=useRef<number|undefined>(undefined);
  const [pendingBattleId, setPendingBattleId] = useState<string | null>(null);
  const [pendingDungeon, setPendingDungeon] = useState<{
    typeId: string;
    difficultyId: string;
  } | null>(null);
  const [notice, notify] = useState("");
  const [battleUI, setBattleUI] = useState({
    allyId: "",
    enemyId: "",
    skillId: "$attack",
  });
  const [animationSpeed, setSpeed] = useState<"normal" | "fast">("normal");
  const speedRef = useRef<"normal" | "fast">("normal");
  const battleSerial = useRef(0);
  const eventIdentity=useRef(new WeakMap<object,number>());
  const eventSerial=useRef(0);
  const lastTurn = useRef("");
  const music = useRef<any>(null);
  const [audio, setAudio] = useState<any>({ enabled: true, volume: 0.35 });
  const syncProfiles = () => setProfiles([...(store.current?.entries ?? [])]);
  const persist = async (next: any) => {
    if (!store.current || activeProfileId.current === null)
      throw new Error("Hãy chọn hồ sơ trước khi lưu.");
    const saved = await store.current.save(activeProfileId.current, next);
    setActiveProfile(saved);
    syncProfiles();
  };
  const publish = () => {
    const current = runtime.current;
    if(current?.arena){try{saveArenaSession(localStorage,activeProfileId.current,current);}catch{}}
    const turn = current
      ? `${battleSerial.current}-${current.round}-${current.phase}-${current.cursor}-${activeActor(current)?.id}`
      : "";
    if (turn !== lastTurn.current) {
      lastTurn.current = turn;
      setBattleUI((previous) => ({ ...previous, skillId: activeActor(current)?.combatModes?.[activeActor(current)?.activeMode]?.allowedAbilities[0] ?? "$attack" }));
    }
    if (current?.outcome === "victory" && !isContinuingVictory(current)) {
      if (music.current?.state().group !== "victory") music.current?.start("victory");
    } else if (current?.outcome && !isContinuingVictory(current)) music.current?.stop();
    else if(current?.arena) music.current?.updateArena(current,battleSerial.current);
    else music.current?.setBattleOverride(current ? battlePresentation(current.actors)?.music : null);
    // Engine holds RNG functions/content references. Only publish serializable view data to React.
    setBattle(
      current
        ? {
            presentation: current.arena?null:battlePresentation(current.actors),
            teamResources:structuredClone(current.teamResources??{}),
            encounterId: current.encounterId,
            arena:structuredClone(current.arena??null),
            chronicle:structuredClone(current.chronicle??null),
            questDifficulty:current.questDifficulty,enemyLevel:current.enemyLevel,xpAwards:structuredClone(current.xpAwards??[]),
            sessionId: battleSerial.current,
            actors: structuredClone(current.actors),
            sourceActors: structuredClone(current.sourceActors ?? []),
            dungeon: structuredClone(current.dungeon ?? null),
            storyWave: structuredClone(current.storyWave ?? null),
            turnOrderField: structuredClone(current.turnOrderField),
            mainTurnOrder: [...current.mainTurnOrder],
            queue: [...current.queue],
            cursor: current.cursor,
            round: current.round,
            phase: current.phase,
            extraTurnGrants: [...current.extraTurnGrants],
            outcome: current.outcome,
            rewardClaimed: current.rewardClaimed,
            victoryReward: current.victoryReward,
            firstClearRewards: current.firstClearRewards,
            log: [...current.log],
            activeId: activeActor(current)?.id,
          }
        : null,
    );
    setEvents(
      current
        ? current.events.map((event: any, index: number) => ({
            ...event,
            key: (()=>{let id=eventIdentity.current.get(event);if(id===undefined){id=++eventSerial.current;eventIdentity.current.set(event,id);}return `${battleSerial.current}-${id}`;})(),
          }))
        : [],
    );
  };
  function updateFarm(next:any){farmRef.current=next;setFarm(next);}
  function stopFarming(reason='Đã dừng theo yêu cầu'){updateFarm(stopFarmSession(farmRef.current,reason));}
  function settleFarm(current:any,before:any,after:any){updateFarm(recordFarmResult(farmRef.current,battleSerial.current,current,before,after));}
  function startFarming(target:any,limit:number){
    if(lock.current||saveLock.current||farmRef.current?.enabled)return false;
    if(runtime.current&&(!runtime.current.outcome||runtime.current.outcome==='victory'&&!runtime.current.rewardClaimed)){notify('Hãy kết thúc trận đang dở và nhận thưởng trước khi farm.');return false;}
    try{
      validateFarmTarget(content,target);const next=createFarmSession(target,limit,0);
      const ok=target.kind==='dungeon'?startDungeon(target.id,target.difficultyId):startBattle(target.id,false,target.difficultyId,target.superLevel,crypto.getRandomValues(new Uint32Array(1))[0]);
      if(!ok)return false;next.sessionId=battleSerial.current;updateFarm(next);notify('');return true;
    }catch(error){notify((error as Error).message);return false;}
  }
  function toggleAutoBattle(){
    const b=runtime.current;if(farmRef.current?.enabled){stopFarming('Đã tắt tự động');return;}
    if(!b||b.arena||b.chronicle||b.outcome||lock.current||saveLock.current)return;
    updateFarm(createFarmSession({kind:'battle'},1,battleSerial.current));
  }
  useEffect(()=>{
    if(!farmRef.current?.enabled)return;
    if(path!=='/battle'){if(farmRef.current.enteredBattle)stopFarming('Đã rời màn hình chiến đấu');return;}
    farmRef.current.enteredBattle=true;
    if(busy||lock.current||saveLock.current)return;
    const timer=setTimeout(()=>{
      const state=farmRef.current,b=runtime.current;if(!state?.enabled||!b||lock.current||saveLock.current)return;
      if(b.arena||b.chronicle){stopFarming('Nội dung này không hỗ trợ tự động');return;}
      if(b.outcome){
        if(b.outcome!=='victory'){settleFarm(b,campaignRef.current,campaignRef.current);return;}
        if(!b.rewardClaimed){stopFarming('Dừng vì chưa lưu được phần thưởng · Nhận thưởng để thử lại');return;}
        if(state.completed>=state.limit){stopFarming('Đã hoàn thành số lượt đã chọn');return;}
        if(state.target.kind==='battle'){stopFarming('Trận tự động đã kết thúc');return;}
        const t=state.target;
        if(t.kind==='dungeon'&&(dungeonDailyState(campaignRef.current,content,t.id,new Date()).remaining??0)<=0){stopFarming('Đã hết lượt hầm ngục hiện có');return;}
        const ok=t.kind==='dungeon'?startDungeon(t.id,t.difficultyId,true):startBattle(t.id,true,t.difficultyId,t.superLevel,crypto.getRandomValues(new Uint32Array(1))[0]);
        if(!ok){stopFarming('Không thể bắt đầu lượt farm tiếp theo');return;}
        updateFarm({...farmRef.current,sessionId:battleSerial.current,reason:'Đang chiến đấu'});notify('');return;
      }
      try{const cmd=activeActor(b)?.team==='party'?planAutoBattleTurn(b):undefined;if(activeActor(b)?.team==='party'&&!cmd)throw Error('AI không có hành động hợp lệ.');void runBattle(cmd);}
      catch(error){stopFarming('Dừng vì lỗi AI: '+(error as Error).message);notify((error as Error).message);}
    },160);
    return ()=>clearTimeout(timer);
  },[path,busy,battle?.sessionId,battle?.activeId,battle?.round,battle?.phase,battle?.outcome,battle?.rewardClaimed,farm?.enabled,farm?.completed]);
  // Campaign receipt is the durable source of truth; battle actors never enter the save.
  async function settleCompetition(){
    const current=runtime.current,pending=campaignRef.current?.arenaProgress?.pending;
    if(!pending)return true;
    if(!current?.arena?.matchId||current.arena.matchId!==pending.id||!current.outcome||saveLock.current)return false;
    const profileId=activeProfileId.current;if(profileId===null||!store.current)return false;
    saveLock.current=true;setBusy(true);
    current.arena.completedAt??=new Date().toISOString();
    try{
      const next=settleArenaMatch(campaignRef.current,content,pending.id,current.outcome,{forfeited:Boolean(current.arena.forfeited),now:new Date(current.arena.completedAt)});
      const saved=await store.current.save(profileId,next);
      if(activeProfileId.current===profileId){campaignRef.current=next;setCampaign(next);setActiveProfile(saved);syncProfiles();current.arena.result=next.arenaProgress.lastResult;current.rewardClaimed=true;publish();}
      return true;
    }catch{notify('Chưa lưu được kết quả Đấu Trường. Hãy bấm Lưu lại kết quả trước khi tìm trận mới.');return false;}
    finally{saveLock.current=false;if(!lock.current)setBusy(false);}
  }
  async function recoverCompetition(profile:any){
    const pending=profile?.campaign?.arenaProgress?.pending;if(!pending)return profile;
    const next=settleArenaMatch(profile.campaign,content,pending.id,'defeat',{forfeited:true});
    return await store.current!.save(profile.id,next);
  }
  async function abandonCompetition(){
    const pending=campaignRef.current?.arenaProgress?.pending;if(!pending)return true;
    if(runtime.current?.arena?.matchId===pending.id){if(forfeitArenaBattle(runtime.current))publish();return settleCompetition();}
    if(saveLock.current||lock.current)return false;
    saveLock.current=true;setBusy(true);
    try{const next=settleArenaMatch(campaignRef.current,content,pending.id,'defeat',{forfeited:true});await persist(next);campaignRef.current=next;setCampaign(next);notify('Bạn đã rời bước chọn đội · Xử thua.');return true;}
    catch{notify('Chưa lưu được kết quả rời trận. Hãy thử lại.');return false;}finally{saveLock.current=false;setBusy(false);}
  }
  async function reserveCompetition(match:any){
    if(inAdventure()||lock.current||saveLock.current||activeProfileId.current===null){notify('Hãy kết thúc trận đang dở trước.');return false;}
    return transact(c=>reserveArenaMatch(c,content,match),'');
  }
  function beginCompetition(draft?:any,party?:string[]){
    if(lock.current||saveLock.current||activeProfileId.current===null)return false;
    const pending=campaignRef.current?.arenaProgress?.pending;if(!pending)return false;
    try{
      const playerParty=pending.mode==='ranked'?validateDraftFormation(draft,party,content):undefined;
      if(pending.mode==='ranked'&&(draft.seed!==pending.seed||draft.rankId!==pending.rankAtEntry||draft.preBanCursor!==draft.preBanOrder.length))throw Error('Đợt chọn đội không khớp trận.');
      const candidate:any=createCompetitiveArena(content,campaignRef.current,pending,{playerParty,opponentParty:pending.mode==='ranked'?arrangeDraftAI(content,draft):undefined});
      runtime.current=candidate;dungeonRun.current=null;candidate.rewardClaimed=false;
      try{saveArenaSession(localStorage,activeProfileId.current,candidate);}catch{}battleSerial.current++;setBattleUI({allyId:'',enemyId:'',skillId:'$attack'});publish();notify('');return true;
    }catch(error){notify((error as Error).message);return false;}
  }
  function recoverAbandonedArena(profile:any){
    if(!profile||runtime.current?.chronicle)return;
    const record=takeAbandonedArena(localStorage,profile.id);
    if(!record||record.matchId||record.party.some((id:string)=>!content.characters[id]))return;
    try{const saved={...profile.campaign,party:record.party};
      const restored=createArenaBattle(content,saved,record.teamId,record.seed,{playerName:record.playerName});
      restored.round=Number.isSafeInteger(record.round)&&record.round>0?Math.min(record.round,restored.arena!.maxRounds):1;
      forfeitArenaBattle(restored);(restored.arena as any).recovered=true;runtime.current=restored;battleSerial.current++;publish();
      notify('Trận Đấu Trường trước chưa kết thúc khi bạn thoát game · Xử thua.');
    }catch{notify('Trận Đấu Trường đã rời được tính là thất bại.');}
  }
  function forfeitArena(){
    if(forfeitArenaBattle(runtime.current)){publish();void settleCompetition();music.current?.stop();notify('Bạn đã rời trận Đấu Trường · Xử thua.');}
  }
  useEffect(()=>{
    const current=runtime.current;
    if(current?.arena){
      if(path==='/battle')current.arena.enteredBattle=true;
      else if(current.arena.enteredBattle&&!current.outcome)forfeitArena();
    }
    if(campaignRef.current?.arenaProgress?.pending&&runtime.current?.arena?.matchId!==campaignRef.current.arenaProgress.pending.id&&path!=='/arena/match')void abandonCompetition();
  },[path,battle?.sessionId,campaign?.arenaProgress?.pending?.id]);
  useEffect(()=>{
    const leave=()=>forfeitArena();window.addEventListener('pagehide',leave);
    return ()=>window.removeEventListener('pagehide',leave);
  },[]);
  useEffect(() => {
    let alive = true;
    if (!initializing.current) {
      initializing.current = (async () => {
        const repository = createProfileStore({
          content,
          storage: localStorage,
          nativeInvoke: desktopInvoke(),
        });
        store.current = repository;
        await repository.initialize();
        return repository;
      })();
    }
    initializing.current
      .then(async (repository) => {
        if (!alive) return;
        setDesktop(repository.native);
        setSaveDirectory(repository.directory);
        syncProfiles();
        let chosen: any = null;
        try {
          if (sessionStorage.getItem("northern-prisma.entered") === "1") {
            const previous = Number(
              sessionStorage.getItem("northern-prisma.active-profile"),
            );
            chosen =
              repository.entries.find(
                (p: any) => p.id === previous && !p.error,
              ) ?? repository.entries.find((p: any) => !p.error);
          }
        } catch {}
        if(chosen?.campaign?.arenaProgress?.pending)chosen=await recoverCompetition(chosen);
        let loaded = chosen?.campaign ?? createGameSave(content);
        if(chosen && needsDailyVisit(loaded)){
          try{chosen=await repository.save(chosen.id,visitDailyCommissions(loaded));loaded=chosen.campaign;syncProfiles();}
          catch(error){dailyAttempt.current=chosen.id+":"+dungeonDay();notify("Chưa ghi nhận được đăng nhập ngày: "+(error as Error).message);}
        }
        if(!alive)return;
        campaignRef.current = loaded;
        setCampaign(loaded);
        restoreChronicleRuntime(loaded);
        activeProfileId.current = chosen?.id ?? null;
        setActiveProfile(chosen);
        recoverAbandonedArena(chosen);
        setEntered(Boolean(chosen));
        setReady(true);
      })
      .catch((error) => {
        if (!alive) return;
        setProfileError(String(error.message ?? error));
        const fresh = createGameSave(content);
        campaignRef.current = fresh;
        setCampaign(fresh);
        setReady(true);
      });
    try {
      if (localStorage.getItem("northern-prisma.combat.speed") === "fast") {
        speedRef.current = "fast";
        setSpeed("fast");
      }
    } catch {}
    const preferences = readSettings();
    const player = createGameMusic({
      content,
      enabled: preferences.musicEnabled,
      volume: preferences.musicVolume,
      onChange: (...args: any[]) => setAudio(args[0]),
    });
    music.current = player;
    return () => {
      alive = false;
      player.stop();
      music.current = null;
    };
  }, [content]);
  useEffect(() => {
    music.current?.setRoute(entered ? path : "/");
    const sync = () => music.current?.setVisible(!document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [path, entered]);
  async function transact(
    operation: (current: any) => any,
    message = "Đã lưu thay đổi.",
  ) {
    if (lock.current || saveLock.current || activeProfileId.current === null)
      return false;
    saveLock.current = true;
    setBusy(true);
    try {
      if(campaignRef.current?.arenaProgress?.pending)throw Error('Hãy hoàn tất trận Đấu Trường trước khi thay đổi hồ sơ.');
      const next = operation(campaignRef.current);
      assertFortressLoadoutUnchanged(campaignRef.current,next,content);
      await persist(next);
      campaignRef.current = next;
      setCampaign(next);
      notify(message);
      return true;
    } catch (error) {
      notify((error as Error).message);
      return false;
    } finally {
      saveLock.current = false;
      if (!lock.current) setBusy(false);
    }
  }
  async function refreshCommissions(){
    if(!campaignRef.current||!needsDailyVisit(campaignRef.current))return true;
    return transact(current=>visitDailyCommissions(current),"");
  }
  useEffect(()=>{
    if(!ready||!entered||busy||campaignRef.current?.arenaProgress?.pending||activeProfileId.current===null||!campaignRef.current||!needsDailyVisit(campaignRef.current,new Date(dailyNow)))return;
    const key=activeProfileId.current+":"+dungeonDay(new Date(dailyNow));if(dailyAttempt.current===key)return;dailyAttempt.current=key;void refreshCommissions();
  },[ready,entered,busy,activeProfile?.id,dailyNow,campaign?.arenaProgress?.pending?.id]);

  function restoreChronicleRuntime(current:any){
    const snapshot=activeChronicleSnapshot(current);
    if(snapshot){runtime.current=restoreChronicleBattle(content,snapshot);dungeonRun.current=null;battleSerial.current++;publish();music.current?.start(content.encounters[runtime.current.encounterId].bgm??'normal');}
  }
  async function fortressCommand(kind:string,payload:any={}){
    if(inAdventure()){notify('Hãy tiếp tục hoặc rút khỏi trận đang diễn ra.');return false;}
    const operations:any={enter:(c:any)=>enterFortress(c,content),move:(c:any)=>moveFortress(c,content,payload),exit:(c:any)=>leaveFortress(c,content,payload),begin:(c:any)=>beginFortressEvent(c,content,payload),service:(c:any)=>performFortressService(c,content,payload),act:(c:any)=>actFortressEvent(c,content,payload)};
    if(!operations[kind])return false;
    return transact(operations[kind],'');
  }
  async function visitChronicle(locationId:string,observe=false){
    if(inAdventure()){notify('Hãy tiếp tục hoặc rút khỏi trận đang diễn ra.');return false;}
    return transact(c=>beginChronicleEvent(c,content,locationId,{observe}),'');
  }
  async function actChronicleScene(locationId:string,instanceId:string,stepId:string,actionId:string){
    return transact(c=>actChronicle(c,content,{locationId,instanceId,stepId,actionId}),'');
  }
  async function startChronicleFight(locationId:string,instanceId:string){
    if(lock.current||saveLock.current||activeProfileId.current===null)return false;
    if(inAdventure()&&runtime.current?.chronicle?.instanceId!==instanceId){notify('Đang có trận chiến khác.');return false;}
    saveLock.current=true;setBusy(true);
    try{
      const nextBattle=createChronicleBattle(content,campaignRef.current,locationId,instanceId),next=checkpointChronicleBattle(campaignRef.current,content,nextBattle);
      await persist(next);campaignRef.current=next;setCampaign(next);runtime.current=nextBattle;dungeonRun.current=null;battleSerial.current++;setBattleUI({allyId:'',enemyId:'',skillId:'$attack'});publish();music.current?.start(content.encounters[nextBattle.encounterId].bgm??'normal');return true;
    }catch(error){notify((error as Error).message);return false;}finally{saveLock.current=false;setBusy(false);}
  }
  async function retreatChronicleFight(){
    if(lock.current||saveLock.current||!runtime.current?.chronicle)return false;
    saveLock.current=true;setBusy(true);
    try{const b=restoreChronicleBattle(content,snapshotChronicleBattle(runtime.current));b.outcome='defeat';const next=checkpointChronicleBattle(campaignRef.current,content,b);await persist(next);campaignRef.current=next;setCampaign(next);clearRuntime();return true;}
    catch(error){notify((error as Error).message);return false;}finally{saveLock.current=false;setBusy(false);}
  }
  async function performCombatStep(operation:(b:any)=>void){
    if(!runtime.current.chronicle){operation(runtime.current);return;}
    const trial=restoreChronicleBattle(content,snapshotChronicleBattle(runtime.current));operation(trial);
    const next=checkpointChronicleBattle(campaignRef.current,content,trial);await persist(next);campaignRef.current=next;setCampaign(next);runtime.current=trial;
  }
  async function claimChronicleFight(){
    if(!runtime.current?.chronicle||runtime.current.outcome!=='victory'||runtime.current.rewardClaimed||saveLock.current)return;
    saveLock.current=true;setBusy(true);
    try{const next=finishChronicleBattle(campaignRef.current,content,runtime.current);await persist(next);campaignRef.current=next;setCampaign(next);runtime.current.rewardClaimed=true;runtime.current.victoryReward={};publish();notify('Trận chiến đã được lưu. Tiếp tục câu chuyện tại địa điểm.');}
    catch(error){notify('Chưa lưu được tiến trình: '+(error as Error).message);publish();}finally{saveLock.current=false;if(!lock.current)setBusy(false);}
  }

  async function claimReward() {
    if(runtime.current?.arena){await settleCompetition();return;}
    if(runtime.current?.chronicle){await claimChronicleFight();return;}
    if (
      !runtime.current ||
      runtime.current.outcome !== "victory" ||
      runtime.current.rewardClaimed
    )
      return;
    if (runtime.current.continuesOnVictory || saveLock.current) return;
    saveLock.current = true;
    setBusy(true);
    try {
      const run = dungeonRun.current;
      const currentBattle = runtime.current;
      const beforeRewards=campaignRef.current;
      // Compute rewards on a shallow transaction copy; live claimed flags move only after disk commit.
      if(!currentBattle.dungeon)prepareVictoryReward(currentBattle,content,currentBattle.rewardRandom??Math.random,campaignRef.current);
      const claimBattle = { ...currentBattle };
      const claimRun = run ? { ...run, battle: claimBattle } : null;
      const next = currentBattle.dungeon
        ? claimDungeonReward(campaignRef.current, claimRun, content)
        : claimBattleReward(campaignRef.current, claimBattle, content);
      await persist(next);
      currentBattle.rewardClaimed = claimBattle.rewardClaimed;
      currentBattle.firstClearRewards = claimBattle.firstClearRewards;
      currentBattle.xpAwards=claimBattle.xpAwards;
      settleFarm(currentBattle,beforeRewards,next);
      if (run) run.claimed = run.kind==='story' ? claimBattle.rewardClaimed : claimRun.claimed;
      campaignRef.current = next;
      setCampaign(next);
      publish();
      notify(
        `Chiến thắng! +${runtime.current.dungeon ? dungeonRewardText(run.reward) : victoryRewardText(runtime.current.victoryReward)}. Thưởng và tiến trình đã được lưu.`,
      );
    } catch (error) {
      notify(
        `Chưa lưu được thưởng: ${(error as Error).message}. Bấm Nhận thưởng để thử lại.`,
      );
      publish();
    } finally {
      saveLock.current = false;
      if (!lock.current) setBusy(false);
    }
  }
  async function runBattle(command?: any) {
    if (
      lock.current ||
      saveLock.current ||
      !runtime.current ||
      (runtime.current.outcome &&
        !(
          dungeonRun.current &&
          runtime.current.outcome === "victory" &&
          !isFinalRun(dungeonRun.current)
        ))
    )
      return;
    lock.current = true;
    setBusy(true);
    const running=runtime.current;
    const automated=Boolean(farmRef.current?.enabled);
    const canContinue=()=>runtime.current===running&&!running.outcome;
    const activity=(source:any,phase:string,skillName='')=>{
      if(!running.arena)return;
      const previous=running.arena.activity[source.team]??{};
      running.arena.activity[source.team]={...previous,phase,sourceId:source.id,sourceName:source.name,skillName};publish();
    };
    const announce=async(source:any,cmd:any)=>{
      const name=arenaSkillName(running.content,source,cmd);
      activity(source,'casting',name);running.log.push(source.name+' đang dùng '+name+'…');publish();
      await sleep(ARENA_PACING.announce);return name;
    };
    const resolved=(source:any,name:string)=>{
      running.arena.activity[source.team]={phase:'resolved',sourceId:source.id,sourceName:source.name,skillName:name,summary:arenaActionSummary(source,name,running.events)};
    };
    const delay = () => combatFeedbackDuration(runtime.current?.events??[],content,speedRef.current,document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    try {
      if (command) {
        const source=activeActor(running),name=running.arena?await announce(source,command):'';
        if(!canContinue())return;
        await performCombatStep(b=>executeAction(b,command));
        if(running.arena)resolved(source,name);
        publish();
        await sleep(delay());
      }
      while (true) {
        if(automated&&!farmRef.current?.enabled&&!runtime.current.outcome)return;
        while (
          !runtime.current.outcome &&
          activeActor(runtime.current)?.team === "enemy"
        ) {
          if(automated&&!farmRef.current?.enabled)return;
          const source=activeActor(running);let planned:any=null,name='';
          if(running.arena){
            activity(source,'thinking');await sleep(ARENA_PACING.think);
            if(!canContinue())return;
            planned=planArenaEnemyTurn(running);if(!planned)return;
            name=await announce(source,planned);if(!canContinue())return;
          }
          await performCombatStep(b=>executeEnemyTurn(b,planned));
          if(running.arena)resolved(source,name);
          publish();
          await sleep(delay());
        }
        if(runtime.current.chronicle&&runtime.current.outcome==='victory'&&runtime.current.continuesOnVictory){
          const trial=advanceChronicleWave(content,campaignRef.current,restoreChronicleBattle(content,snapshotChronicleBattle(runtime.current))),next=checkpointChronicleBattle(campaignRef.current,content,trial);
          await persist(next);campaignRef.current=next;setCampaign(next);runtime.current=trial;battleSerial.current++;publish();await sleep(delay());continue;
        }
        if (
          dungeonRun.current &&
          runtime.current.outcome === "victory" &&
          !isFinalRun(dungeonRun.current)
        ) {
          runtime.current = advanceRun(content, dungeonRun.current);
          music.current?.start(
            content.encounters[runtime.current.encounterId].bgm ?? "normal",
            { preserveOverride: true },
          );
          battleSerial.current += 1;
          if(farmRef.current?.sessionId===battleSerial.current-1)updateFarm({...farmRef.current,sessionId:battleSerial.current});
          setBattleUI({ allyId: "", enemyId: "", skillId: "$attack" });
          publish();
          await sleep(delay());
          continue;
        }
        break;
      }
      if (runtime.current.outcome === "victory") {
        if (music.current?.state().group !== "victory") music.current?.start("victory");
        await claimReward();
      } else if (runtime.current.outcome) music.current?.stop();
      if(runtime.current.arena&&runtime.current.outcome)await settleCompetition();
    } catch (error) {
      if(farmRef.current?.enabled)stopFarming('Dừng vì lỗi chiến đấu: '+(error as Error).message);
      notify((error as Error).message);
    } finally {
      lock.current = false;
      setBusy(saveLock.current);
    }
  }
  function startArena(teamId:string,seed=1){
    if(campaignRef.current?.arenaProgress?.pending){notify('Hãy hoàn tất trận Đấu Trường trước.');return false;}
    if(lock.current||saveLock.current||activeProfileId.current===null)return false;
    if(campaignRef.current?.chronicles?.activeSession){notify('Hãy rời phiên pháo đài trước khi vào Đấu Trường.');return false;}
    if(runtime.current&&(!runtime.current.outcome||runtime.current.outcome==='victory'&&!runtime.current.rewardClaimed)){notify('Hãy kết thúc trận và nhận thưởng trước khi vào Đấu Trường.');return false;}
    try{
      const candidate=createArenaBattle(content,campaignRef.current,teamId,seed,{playerName:activeProfile?.username??'Người lữ hành'});
      saveArenaSession(localStorage,activeProfileId.current,candidate);
      runtime.current=candidate;
      runtime.current.rewardClaimed=true;dungeonRun.current=null;
      battleSerial.current++;setBattleUI({allyId:'',enemyId:'',skillId:'$attack'});publish();notify('');return true;
    }catch(error){notify((error as Error).message);return false;}
  }
  function startBattle(id: string, confirmed = false,difficultyId?:string,superLevel?:number,farmSeed?:number) {
    if(campaignRef.current?.arenaProgress?.pending){notify('Hãy hoàn tất trận Đấu Trường trước.');return false;}
    if(campaignRef.current?.chronicles?.activeSession){notify('Hãy rời phiên pháo đài qua cổng trước khi bắt đầu nội dung khác.');return false;}
    if(content.encounters[id]?.category==='chronicle'){notify('Hãy bắt đầu từ địa điểm trong Biên Niên Ký.');return false;}
    if(runtime.current?.chronicle&&!runtime.current.outcome){notify('Hãy tiếp tục hoặc rút khỏi trận đang diễn ra.');return false;}
    if (lock.current || saveLock.current || activeProfileId.current === null)
      return false;
    if (!isQuestUnlocked(content.encounters[id], campaignRef.current)) {
      notify("Nhiệm vụ chưa mở khóa. Điều kiện mở khóa sẽ được bổ sung sau.");
      return false;
    }
    if (
      runtime.current?.outcome === "victory" &&
      !runtime.current.rewardClaimed &&
      !(dungeonRun.current && !isFinalRun(dungeonRun.current))
    ) {
      notify("Hãy nhận thưởng trận trước để tiếp tục.");
      return false;
    }
    if (
      runtime.current &&
      (!runtime.current.outcome ||
        (dungeonRun.current &&
          runtime.current.outcome === "victory" &&
          !isFinalRun(dungeonRun.current))) &&
      !confirmed
    ) {
      setPendingDungeon(null);
      pendingQuestDifficulty.current=difficultyId;pendingSuperLevel.current=superLevel;
      setPendingBattleId(id);
      return false;
    }
    try {
      const storyRun=content.encounters[id].waves ? createStoryRun(content,campaignRef.current,id,seededRandom(farmSeed??20261027)) : null;
      runtime.current = storyRun?.battle ?? createBattle(content,campaignRef.current,id,seededRandom(farmSeed??20261027),{questDifficulty:difficultyId,...(content.encounters[id].superLevels&&superLevel!==undefined?{enemyLevel:superLevel}:{})});
      dungeonRun.current = storyRun;
      battleSerial.current += 1;
      setBattleUI({ allyId: "", enemyId: "", skillId: "$attack" });
      publish();
      music.current?.start(content.encounters[id].bgm ?? "normal");
      notify("Trận đấu bắt đầu.");
      return true;
    } catch (error) {
      notify((error as Error).message);
      return false;
    }
  }
  function startDungeon(id: string, difficultyId: string, confirmed = false) {
    if(campaignRef.current?.arenaProgress?.pending){notify('Hãy hoàn tất trận Đấu Trường trước.');return false;}
    if(campaignRef.current?.chronicles?.activeSession){notify('Hãy rời phiên pháo đài qua cổng trước khi bắt đầu nội dung khác.');return false;}
    if(runtime.current?.chronicle&&!runtime.current.outcome){notify('Hãy tiếp tục hoặc rút khỏi trận đang diễn ra.');return false;}
    if (lock.current || saveLock.current || activeProfileId.current === null)
      return false;
    if (
      runtime.current?.outcome === "victory" &&
      !runtime.current.rewardClaimed &&
      !(dungeonRun.current && !isFinalRun(dungeonRun.current))
    ) {
      notify("Hãy nhận thưởng trận trước để tiếp tục.");
      return false;
    }
    if (
      runtime.current &&
      (!runtime.current.outcome ||
        (dungeonRun.current &&
          runtime.current.outcome === "victory" &&
          !isFinalRun(dungeonRun.current))) &&
      !confirmed
    ) {
      setPendingBattleId(null);
      setPendingDungeon({ typeId: id, difficultyId });
      return false;
    }
    try {
      const seed = crypto.getRandomValues(new Uint32Array(1))[0];
      const next = createDungeonRun(
        content,
        campaignRef.current,
        id,
        difficultyId,
        {
          random: seededRandom(seed),
          preview: content.dungeons[id]?.revealRooms
            ? scoutingCache().read(activeProfileId.current, id, difficultyId)
            : null,
        },
      );
      dungeonRun.current = next;
      runtime.current = next.battle;
      battleSerial.current += 1;
      setBattleUI({ allyId: "", enemyId: "", skillId: "$attack" });
      publish();
      music.current?.start(content.encounters[next.waveIds[0]].bgm ?? "normal");
      notify("Bắt đầu thám hiểm. Thưởng được nhận khi vượt hết chuỗi.");
      return true;
    } catch (error) {
      notify((error as Error).message);
      return false;
    }
  }
  function clearRuntime() {
    forfeitArena();
    farmRef.current=null;setFarm(null);setSweepResult(null);
    runtime.current = null;
    dungeonRun.current = null;
    setPendingBattleId(null);
    setPendingDungeon(null);
    setBattleUI({ allyId: "", enemyId: "", skillId: "$attack" });
    battleSerial.current += 1;
    lastTurn.current = "";
    publish();
    music.current?.stop();
  }
  async function profileAction(operation: () => Promise<boolean>) {
    if (lock.current || saveLock.current) return false;
    saveLock.current = true;
    setBusy(true);
    try {
      return await operation();
    } catch (error) {
      notify(String((error as Error).message ?? error));
      return false;
    } finally {
      syncProfiles();
      saveLock.current = false;
      setBusy(false);
    }
  }
  function activate(profile: any) {
    clearRuntime();
    activeProfileId.current = profile.id;
    campaignRef.current = profile.campaign;
    setCampaign(profile.campaign);
    restoreChronicleRuntime(profile.campaign);
    recoverAbandonedArena(profile);
    setActiveProfile(profile);
    setEntered(true);
    setProfileError("");
    notify("");
    try {
      sessionStorage.setItem(
        "northern-prisma.active-profile",
        String(profile.id),
      );
      sessionStorage.setItem("northern-prisma.entered", "1");
    } catch {}
  }
  function canLeave() {
    if (lock.current || saveLock.current) return false;
    if(campaignRef.current?.arenaProgress?.pending){void abandonCompetition();notify('Đang lưu kết quả rời trận. Vui lòng đổi hồ sơ sau khi lưu xong.');return false;}
    if (
      runtime.current?.outcome === "victory" &&
      !runtime.current.rewardClaimed &&
      !(dungeonRun.current && !isFinalRun(dungeonRun.current))
    ) {
      notify("Hãy nhận thưởng trước khi đổi hồ sơ.");
      return false;
    }
    return true;
  }
  const inAdventure=()=>Boolean(campaignRef.current?.arenaProgress?.pending)||Boolean(runtime.current&&(!runtime.current.outcome||runtime.current.outcome==="victory"&&(!runtime.current.rewardClaimed||dungeonRun.current&&!isFinalRun(dungeonRun.current))));
  const value: GameContextValue = {
    farm,startFarming,stopFarming:()=>stopFarming(),toggleAutoBattle,
    sweepResult,dismissSweepResult:()=>setSweepResult(null),
    fortressCommand,visitChronicle,actChronicleScene,startChronicleFight,retreatChronicleFight,
    progressionLocked:inAdventure()||Boolean(campaign?.chronicles?.activeSession),
    upgradeCharacterSkill:(id,line,expectedRank)=>transact(c=>upgradeSkill(c,content,id,line,{battleActive:inAdventure()||Boolean(campaignRef.current.chronicles?.activeSession),expectedRank}),"Đã nâng cấp kỹ năng và lưu tiến trình."),
    updateAllocations:(id,allocations)=>transact(c=>allocatePoints(c,content,id,allocations,{battleActive:inAdventure()||Boolean(campaignRef.current.chronicles?.activeSession)}),"Đã lưu điểm phân bổ."),
    breakCharacterLimit:id=>transact(c=>limitBreak(c,content,id,{battleActive:inAdventure()||Boolean(campaignRef.current.chronicles?.activeSession)}),"Đã Đột Phá giới hạn."),
    sweepDungeon:async(id,difficultyId)=>{
      let receipt:any=null;
      if(sweepRewardAttempt.current?.campaign!==campaignRef.current)sweepRewardAttempt.current={campaign:campaignRef.current};
      const ok=await transact(c=>sweepDungeonAction(c,content,id,difficultyId,()=>{},new Date(),{battleActive:inAdventure()||Boolean(campaignRef.current.chronicles?.activeSession),rewardAttempt:sweepRewardAttempt.current,onResult:(result:any)=>{receipt=result;}}),"Đã Quét hầm ngục. Phần thưởng và EXP đã được lưu.");
      if(ok&&receipt){sweepRewardAttempt.current=null;setSweepResult({...receipt,sessionId:'sweep-'+Date.now()});}
      return ok;
    },
    dailyNow,refreshCommissions,
    claimCommissions: keys=>transact(current=>claimDailyCommissions(current,keys),"Đã nhận thưởng Ủy Thác Hằng Ngày."),
    startArena,reserveCompetition,beginCompetition,settleCompetition,abandonCompetition,
    content:path==='/battle'&&runtime.current?.arena?runtime.current.content:content,
    profiles,
    saveDirectory,
    activeProfile,
    profileError,
    desktop,
    async refreshProfiles() {
      await profileAction(async () => {
        if (!store.current) throw new Error("Kho lưu dữ liệu chưa sẵn sàng.");
        await store.current.initialize();
        setSaveDirectory(store.current.directory);
        syncProfiles();
        setProfileError("");
        return true;
      });
    },
    enterProfile: (id) =>
      profileAction(async () => {
        if (!store.current) throw new Error("Kho lưu dữ liệu chưa sẵn sàng.");
        const selected = await store.current.load(id);
        if (selected.error) throw new Error(selected.error);
        // Upgrade old save schemas durably before entering; retain the prior file as backup.
        const recovered=await recoverCompetition(selected);
        const saved = await store.current.save(id, needsDailyVisit(recovered.campaign)?visitDailyCommissions(recovered.campaign):recovered.campaign);
        activate(saved);
        return true;
      }),
    createProfile: (username) =>
      profileAction(async () => {
        if (!store.current || profileError)
          throw new Error(profileError || "Kho lưu dữ liệu chưa sẵn sàng.");
        const created = await store.current.create(username);
        const visited=await store.current.save(created.id,visitDailyCommissions(created.campaign));
        activate(visited);
        return true;
      }),
    renameProfile: (username) =>
      profileAction(async () => {
        if (!store.current || activeProfileId.current === null)
          throw new Error("Chưa chọn hồ sơ.");
        const renamed = await store.current.rename(
          activeProfileId.current,
          username,
        );
        setActiveProfile(renamed);
        notify("Đã đổi tên người chơi.");
        return true;
      }),
    restoreProfile: (id) =>
      profileAction(async () => {
        if (!store.current) throw new Error("Kho lưu dữ liệu chưa sẵn sàng.");
        await store.current.restore(id);
        notify("Đã khôi phục bản sao lưu. Chọn Tiếp tục để chơi.");
        return true;
      }),
    leaveProfile() {
      if (!canLeave()) return false;
      clearRuntime();
      setEntered(false);
      setActiveProfile(null);
      activeProfileId.current = null;
      try {
        sessionStorage.removeItem("northern-prisma.entered");
      } catch {}
      notify("");
      return true;
    },
    async openSaveDirectory() {
      try {
        if (!store.current) throw new Error("Kho lưu dữ liệu chưa sẵn sàng.");
        await store.current.openDirectory();
      } catch (error) {
        notify(String((error as Error).message ?? error));
      }
    },
    campaign,
    battle,
    events,
    ready,
    entered,
    busy,
    pendingBattleId,
    pendingDungeon,
    cancelNewBattle: () => {
      setPendingBattleId(null);
      setPendingDungeon(null);
    },
    confirmNewBattle: () => {
      if (!pendingBattleId && !pendingDungeon) return false;
      const ok = pendingDungeon
        ? startDungeon(pendingDungeon.typeId, pendingDungeon.difficultyId, true)
        : startBattle(pendingBattleId!, true,pendingQuestDifficulty.current,pendingSuperLevel.current);
      if (ok) {
        setPendingBattleId(null);
        setPendingDungeon(null);
      }
      return ok;
    },
    notice,
    audio,
    battleUI,
    updateBattleUI: (changes) =>
      setBattleUI((previous) => ({ ...previous, ...changes })),
    animationSpeed,
    setAnimationSpeed: (speed) => {
      speedRef.current = speed;
      setSpeed(speed);
      try {
        localStorage.setItem("northern-prisma.combat.speed", speed);
      } catch {}
    },
    transact,
    startBattle:(id,difficultyId,superLevel)=>startBattle(id,false,difficultyId,superLevel),
    startDungeon,
    prepareDungeonPreview: (id, difficultyId, now = new Date()) =>
      scoutingCache().prepare(activeProfileId.current, id, difficultyId, now),
    runBattle,
    claimReward,
    notify,
    toggleAudio: () => music.current?.toggle(),
    setVolume: (value) => music.current?.setVolume(value),
    setAudioEnabled: (value) => music.current?.setEnabled(value),
  };
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
