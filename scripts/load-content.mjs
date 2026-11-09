import { readFile } from 'node:fs/promises';
import { assembleContent, COLLECTIONS } from '../src/core/content.js';
import { eastEnemies, eastEncounters, eastMusic, eastBossAbilities } from '../src/core/east-campaign.js';

export async function loadContent() {
  const collections = Object.fromEntries(await Promise.all(COLLECTIONS.map(async name => [name, JSON.parse(await readFile(new URL(`../data/${name}.json`, import.meta.url), 'utf8'))])));
  collections.abilities = [...collections.abilities, ...eastBossAbilities];
  collections.enemies = [...collections.enemies, ...eastEnemies];
  collections.encounters = [...collections.encounters, ...eastEncounters];
  collections.music = [...collections.music, ...eastMusic];
  return assembleContent(collections);
}
