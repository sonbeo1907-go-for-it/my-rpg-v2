import { assembleContent } from "../core/content.js";
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
export function getContent(): any {
  return assembleContent({
    characters,
    abilities,
    statuses,
    upgrades,
    enemies,
    encounters,
    economy,
    gearTypes,
    banners,
    music,
    dungeons,
  });
}
