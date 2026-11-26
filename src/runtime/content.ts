import {northAbilities,northEnemies,northEncounters,northMusic} from '../core/north-campaign.js';
import moonlightBlessings from '../../data/moonlightBlessings.json';
import {eastSuperAbilities,eastSuperEnemies,eastSuperEncounters,eastSuperStatuses,eastSuperMusic} from '../core/east-superbosses.js';
import trials from '../../data/trials.json';
import tournaments from '../../data/tournaments.json';
import tournamentTeams from '../../data/tournamentTeams.json';
import tournamentBuilds from '../../data/tournamentBuilds.json';
import tournamentScenes from '../../data/tournamentScenes.json';
import tournamentRewards from '../../data/tournamentRewards.json';
import pvpRules from '../../data/pvpRules.json';
import pvpAiProfiles from '../../data/pvpAiProfiles.json';
import chronicles from '../../data/chronicles.json';
import chronicleEvents from '../../data/chronicleEvents.json';
import { assembleContent } from "../core/content.js";
import progressionRules from "../../data/progressionRules.json";
import characters from "../../data/characters.json";
import abilities from "../../data/abilities.json";
import statuses from "../../data/statuses.json";
import upgrades from "../../data/upgrades.json";
import enemies from "../../data/enemies.json";
import encounters from "../../data/encounters.json";
import economy from "../../data/economy.json";
import gearTypes from "../../data/gearTypes.json";
import banners from "../../data/banners.json";
import music from "../../data/music.json";
import dungeons from "../../data/dungeons.json";
import blacksmith from "../../data/blacksmith.json";
import gearEffects from "../../data/gearEffects.json";
import exclusiveGear from "../../data/exclusiveGear.json";
import items from "../../data/items.json";
import travelerStories from "../../data/travelerStories.json";
import { eastEnemies, eastEncounters, eastMusic, eastBossAbilities } from "../core/east-campaign.js";
export function getContent(): any {
  return assembleContent({
    moonlightBlessings,trials,chronicles,chronicleEvents,pvpRules,pvpAiProfiles,
    tournaments,tournamentTeams,tournamentBuilds,tournamentScenes,tournamentRewards,
    progressionRules,
    characters,
    abilities:[...northAbilities, ...abilities,...eastBossAbilities,...eastSuperAbilities],
    statuses:[...statuses,...eastSuperStatuses],
    upgrades,
    enemies:[...northEnemies, ...enemies,...eastEnemies,...eastSuperEnemies],
    encounters:[...northEncounters, ...encounters,...eastEncounters,...eastSuperEncounters],
    economy,
    gearTypes,
    banners,
    music:[...northMusic, ...music,...eastMusic,...eastSuperMusic],
    dungeons,
    blacksmith,
    exclusiveGear,
    gearEffects,
    items,
    travelerStories,
  });
}
