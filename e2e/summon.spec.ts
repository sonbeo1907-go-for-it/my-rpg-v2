import { test, expect, type Page } from "@playwright/test";
import { loadContent } from "../scripts/load-content.mjs";
import { createGameSave, encodeGameSave } from "../src/core/game-save.js";
import { pullGacha } from "../src/core/economy.js";
const content: any = await loadContent();
async function setup(page: Page, streak = 0, random: number[] = [0]) {
  const save = createGameSave(content);
  save.coins = 5000; save.prisma = 20;
  save.gacha.totalPulls = streak;
  save.gacha.pity.standard = streak;
  await page.addInitScript(
    ({ raw, values }) => {
      if (!localStorage.getItem("northern-prisma.campaign.v4"))
        localStorage.setItem("northern-prisma.campaign.v4", raw);
      sessionStorage.setItem("northern-prisma.entered", "1");
      let index = 0;
      Math.random = () => values[Math.min(index++, values.length - 1)];
    },
    { raw: encodeGameSave(save, content), values: random },
  );
  await page.goto("/recruitment");
}
const saved = (page: Page) =>
  page.evaluate(() =>
    JSON.parse(JSON.parse(localStorage.getItem("northern-prisma.profiles.v1")!).entries[0].text),
  );

for (const [rate, rarity, type] of [
  [0, "low", "t1"],
  [0.4, "mid", "t2"],
  [0.9, "high", "t3_focused"],
] as const) {
  test(`crystal ${rarity} matches gear tier, skip and reload keep saved rewards`, async ({
    page,
  }) => {
    await setup(page, 0, [rate]);
    await page.getByRole("button", { name: /Chiêu mộ 1 lần/ }).click();
    await expect(page.locator(".stone-awakening")).toHaveAttribute(
      "data-rarity",
      rarity,
    );
    const before = await saved(page);
    expect(before.coins).toBe(5000); expect(before.prisma).toBe(19);
    expect(before.gear[0].typeId).toBe(type);
    await page.getByRole("button", { name: "Bỏ qua → Kết quả" }).click();
    await expect(page.locator(".summon-result")).toHaveCount(1);
    await page.waitForTimeout(2700);
    await expect(page).toHaveURL(/recruitment\/results/);
    await page.reload();
    await expect(page.locator(".summon-result")).toHaveCount(1);
    expect(await saved(page)).toEqual(before);
  });
}

test("ten pulls use highest rarity, force the 50th character and never grant rewards again on replay", async ({
  page,
}) => {
  await setup(page, 45);
  await page.getByRole("button", { name: /Chiêu mộ 10 lần/ }).click();
  await expect(page.locator(".stone-awakening")).toHaveAttribute(
    "data-rarity",
    "character",
  );
  const before = await saved(page);
  expect(before.coins).toBe(5000); expect(before.prisma).toBe(10);
  expect(before.gacha.pity.standard).toBe(5);
  expect(before.gacha.lastSummon.results[4].guaranteed).toBe(true);
  await page.getByRole("button", { name: "Bỏ qua → Kết quả" }).click();
  await expect(page.locator(".summon-result")).toHaveCount(10);
  await expect(page.locator(".summon-new")).toHaveCount(1);
  await expect(page.locator(".pity-badge")).toHaveCount(1);
  await page.screenshot({
    path: "test-results/visual-summon-results.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.locator(".summon-result").nth(4).click();
  await expect(page.getByRole("dialog")).toContainText("Dain");
  await page.getByRole("button", { name: "Đóng", exact: true }).last().click();
  await page.getByRole("link", { name: "Xem lại reveal" }).click();
  await expect(page.locator(".reveal-card")).toHaveAttribute(
    "data-reveal-phase",
    "back",
  );
  await page.getByRole("button", { name: "Mở thẻ ngay" }).click();
  await expect(page.locator(".reveal-card")).toHaveAttribute(
    "data-reveal-phase",
    "front",
  );
  await page.getByRole("button", { name: /Tiếp tục · 2\/10/ }).click();
  await expect(page).toHaveURL(/card=1/);
  await page.getByRole("link", { name: "Bỏ qua → Kết quả" }).click();
  // Next client navigation completes after click; reload the results URL, not the reveal URL.
  await expect(page).toHaveURL(/recruitment\/results/);
  await page.reload();
  await expect(page.locator(".summon-result")).toHaveCount(10);
  expect(await saved(page)).toEqual(before);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  expect(
    await page
      .locator(".summon-result-scroll")
      .evaluate((node) => node.scrollWidth > node.clientWidth),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/visual-summon-phone.png",
    fullPage: true,
    animations: "disabled",
  });
});

test("automatic reveal opens from bottom to top with a detailed character role back", async ({
  page,
}) => {
  await setup(page, 49);
  await page.getByRole("button", { name: /Chiêu mộ 1 lần/ }).click();
  await expect(page.locator(".stone-awakening")).toHaveAttribute(
    "data-rarity",
    "character",
  );
  await page.screenshot({
    path: "test-results/visual-summon-crystal.png",
    fullPage: true,
    animations: "disabled",
  });
  await expect(page).toHaveURL(/recruitment\/reveal/);
  await expect(page.locator(".reveal-card")).toHaveAttribute(
    "data-reveal-phase",
    "back",
  );
  await expect(page.locator(".summon-card-back")).toHaveAttribute(
    "data-cardback-tier",
    "4",
  );
  await expect(page.locator(".cardback-center .role-icon")).toHaveCount(1);
  await page.screenshot({
    path: "test-results/visual-summon-cardback.png",
    fullPage: true,
  });
  await expect(page.locator(".reveal-card")).toHaveAttribute(
    "data-reveal-phase",
    "revealing",
  );
  const inset = await page
    .locator(".card-front-reveal")
    .evaluate((node) => getComputedStyle(node).clipPath);
  expect(inset).toMatch(/^inset\(/);
  await expect(page.locator(".reveal-card")).toHaveAttribute(
    "data-reveal-phase",
    "front",
  );
  await page.screenshot({
    path: "test-results/visual-summon-revealed.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Xem tất cả kết quả", exact: true })
    .last()
    .click();
  await expect(page.locator(".summon-result")).toHaveCount(1);
  const before = await saved(page);
  expect(before.gacha.pity.standard).toBe(0);
  await page.goto("/recruitment/results?draw=summon_1");
  await expect(page.locator(".empty-state")).toBeVisible();
  expect(await saved(page)).toEqual(before);
});

test("reduced motion skips long animations and reveal routes tolerate a missing batch", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await setup(page, 0);
  await page.goto("/recruitment/reveal");
  await expect(
    page.getByRole("heading", { name: "Dấu ấn chưa xuất hiện" }),
  ).toBeVisible();
  await page.goto("/recruitment");
  await page.getByRole("button", { name: /Chiêu mộ 1 lần/ }).click();
  await expect(page).toHaveURL(/recruitment\/reveal/);
  await expect(page.locator(".reveal-card")).toHaveAttribute(
    "data-reveal-phase",
    "front",
  );
  await page.getByRole("link", { name: "Bỏ qua → Kết quả" }).click();
  await expect(page.locator(".summon-result")).toHaveCount(1);
});

test("mixed rarity results display colored gear and role silhouettes in ten vertical panels", async ({
  page,
}) => {
  let save = createGameSave(content);
  save.coins = 5000; save.prisma = 20;
  const values = [
    0, 0, 0, 0, 0.4, 0.2, 0, 0.9, 0.3, 0.99, 0, 0, 0.99, 0.3, 0.6, 0.99, 0.5,
    0.99, 0.6, 0, 0.4, 0.4, 0, 0.9, 0.7, 0.99, 0.99,
  ];
  let index = 0;
  save = pullGacha(
    save,
    content,
    "standard",
    10,
    () => values[index++],
  ).campaign;
  await page.addInitScript(
    (raw) => {
      localStorage.setItem("northern-prisma.campaign.v4", raw);
      sessionStorage.setItem("northern-prisma.entered", "1");
    },
    encodeGameSave(save, content),
  );
  await page.goto("/recruitment/results");
  await expect(page.locator(".summon-result")).toHaveCount(10);
  for (const rarity of ["low", "mid", "high", "character"])
    await expect(
      page.locator(`.summon-result .summon-card-front.${rarity}`).first(),
    ).toBeVisible();
  await page.screenshot({
    path: "test-results/visual-summon-mixed.png",
    fullPage: true,
    animations: "disabled",
  });
});
