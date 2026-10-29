export function grantEligibleUpgrades(campaign, content) {
  const granted = [];
  for (const upgrade of Object.values(content.upgrades).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id.localeCompare(b.id))) {
    const state = campaign.characters[upgrade.characterId];
    if (state && campaign.storyFlags.includes(upgrade.requires.storyFlag) && !state.upgradeIds.includes(upgrade.id)) {
      state.upgradeIds.push(upgrade.id);
      granted.push(upgrade.id);
    }
  }
  return granted;
}

export function completeStoryEvent(campaign, content, flag) {
  if (!campaign.storyFlags.includes(flag)) campaign.storyFlags.push(flag);
  return grantEligibleUpgrades(campaign, content);
}
