"use client";
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
} from "../core/battle.js";
import { claimBattleReward, victoryCoinReward } from "../core/economy.js";
import { seededRandom } from "../core/random.js";
import {needsDailyVisit,visitDailyCommissions,claimDailyCommissions} from "../core/daily-commissions.js";
import {nextDungeonReset,dungeonDay} from "../core/dungeon-rules.js";
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
import { setAstoriaEnabled as configureAstoria } from "../core/developer.js";
type GameContextValue = {
  dailyNow: number;
  claimCommissions: (keys?: string[]) => Promise<boolean>;
  refreshCommissions: () => Promise<boolean>;
  setAstoriaEnabled: (enabled: boolean) => Promise<boolean>;
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
  startBattle: (id: string) => boolean;
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
  const lock = useRef(false);
  const [battle, setBattle] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [ready, setReady] = useState(false);
  const [entered, setEntered] = useState(false);
  const [busy, setBusy] = useState(false);
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
    else music.current?.setBattleOverride(current ? battlePresentation(current.actors)?.music : null);
    // Engine holds RNG functions/content references. Only publish serializable view data to React.
    setBattle(
      current
        ? {
            presentation: battlePresentation(current.actors),
            encounterId: current.encounterId,
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
        let loaded = chosen?.campaign ?? createGameSave(content);
        if(chosen && needsDailyVisit(loaded)){
          try{chosen=await repository.save(chosen.id,visitDailyCommissions(loaded));loaded=chosen.campaign;syncProfiles();}
          catch(error){dailyAttempt.current=chosen.id+":"+dungeonDay();notify("Chưa ghi nhận được đăng nhập ngày: "+(error as Error).message);}
        }
        if(!alive)return;
        campaignRef.current = loaded;
        setCampaign(loaded);
        activeProfileId.current = chosen?.id ?? null;
        setActiveProfile(chosen);
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
      const next = operation(campaignRef.current);
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
    if(!ready||!entered||busy||activeProfileId.current===null||!campaignRef.current||!needsDailyVisit(campaignRef.current,new Date(dailyNow)))return;
    const key=activeProfileId.current+":"+dungeonDay(new Date(dailyNow));if(dailyAttempt.current===key)return;dailyAttempt.current=key;void refreshCommissions();
  },[ready,entered,busy,activeProfile?.id,dailyNow]);
  async function claimReward() {
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
      // Compute rewards on a shallow transaction copy; live claimed flags move only after disk commit.
      const claimBattle = { ...currentBattle };
      const claimRun = run ? { ...run, battle: claimBattle } : null;
      const next = currentBattle.dungeon
        ? claimDungeonReward(campaignRef.current, claimRun, content)
        : claimBattleReward(campaignRef.current, claimBattle, content);
      await persist(next);
      currentBattle.rewardClaimed = claimBattle.rewardClaimed;
      currentBattle.firstClearRewards = claimBattle.firstClearRewards;
      if (run) run.claimed = run.kind==='story' ? claimBattle.rewardClaimed : claimRun.claimed;
      campaignRef.current = next;
      setCampaign(next);
      publish();
      notify(
        `Chiến thắng! +${runtime.current.dungeon ? dungeonRewardText(run.reward) : `${victoryCoinReward(content, runtime.current.encounterId)} Coin`}. Thưởng và tiến trình đã được lưu.`,
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
    const delay = () => combatFeedbackDuration(runtime.current?.events??[],content,speedRef.current,document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    try {
      if (command) {
        executeAction(runtime.current, command);
        publish();
        await sleep(delay());
      }
      while (true) {
        while (
          !runtime.current.outcome &&
          activeActor(runtime.current)?.team === "enemy"
        ) {
          executeEnemyTurn(runtime.current);
          publish();
          await sleep(delay());
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
    } catch (error) {
      notify((error as Error).message);
    } finally {
      lock.current = false;
      setBusy(saveLock.current);
    }
  }
  function startBattle(id: string, confirmed = false) {
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
      setPendingBattleId(id);
      return false;
    }
    try {
      const storyRun=content.encounters[id].waves ? createStoryRun(content,campaignRef.current,id,seededRandom(20261027)) : null;
      runtime.current = storyRun?.battle ?? createBattle(content,campaignRef.current,id,seededRandom(20261027));
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
  const value: GameContextValue = {
    dailyNow,refreshCommissions,
    claimCommissions: keys=>transact(current=>claimDailyCommissions(current,keys),"Đã nhận thưởng Ủy Thác Hằng Ngày."),
    setAstoriaEnabled: (enabled) => transact(current => configureAstoria(current,enabled,{battleActive:Boolean(runtime.current && !runtime.current.outcome) || Boolean(dungeonRun.current && !runtime.current?.outcome)}), enabled ? "Đã bật Astoria · bản trùng 0." : "Đã tắt Astoria."),
    content,
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
        const saved = await store.current.save(id, needsDailyVisit(selected.campaign)?visitDailyCommissions(selected.campaign):selected.campaign);
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
        : startBattle(pendingBattleId!, true);
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
    startBattle,
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
