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
import { eastEnemies, eastEncounters, eastMusic } from "../core/east-campaign.js";
export function getContent(): any {
  return assembleContent({
    chronicles,chronicleEvents,pvpRules,pvpAiProfiles,
    progressionRules,
    characters,
    abilities,
    statuses,
    upgrades,
    enemies:[...enemies,...eastEnemies],
    encounters:[...encounters,...eastEncounters],
    economy,
    gearTypes,
    banners,
    music:[...music,...eastMusic],
    dungeons,
    blacksmith,
    exclusiveGear,
    gearEffects,
    items,
    travelerStories,
  });
}
