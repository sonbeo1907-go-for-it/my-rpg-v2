import {northAbilities,northEnemies,northEncounters,northMusic} from '../src/core/north-campaign.js';
import {eastSuperAbilities,eastSuperEnemies,eastSuperEncounters,eastSuperStatuses,eastSuperMusic} from '../src/core/east-superbosses.js';
import { readFile } from 'node:fs/promises';
import { assembleContent, COLLECTIONS } from '../src/core/content.js';
import { eastEnemies, eastEncounters, eastMusic, eastBossAbilities } from '../src/core/east-campaign.js';

export async function loadContent() {
  const collections = Object.fromEntries(await Promise.all(COLLECTIONS.map(async name => [name, JSON.parse(await readFile(new URL(`../data/${name}.json`, import.meta.url), 'utf8'))])));
  collections.abilities = [...northAbilities, ...collections.abilities, ...eastBossAbilities,...eastSuperAbilities];
  collections.enemies = [...northEnemies, ...collections.enemies, ...eastEnemies,...eastSuperEnemies];
  collections.encounters = [...northEncounters, ...collections.encounters, ...eastEncounters,...eastSuperEncounters];
  collections.music = [...northMusic, ...collections.music, ...eastMusic,...eastSuperMusic];
  collections.statuses = [...collections.statuses,...eastSuperStatuses];
  return assembleContent(collections);
}
