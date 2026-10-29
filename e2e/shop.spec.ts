import { test, expect, type Page } from "@playwright/test";
import { loadContent } from "../scripts/load-content.mjs";
import { createGameSave, encodeGameSave } from "../src/core/game-save.js";
const content: any = await loadContent();
async function seed(
  page: Page,
  balances = { coins: 3000, prisma: 0, recruitmentShards: 120 },
) {
  const save = createGameSave(content);
  Object.assign(save, balances);
  save.gacha.totalPulls = 17;
  save.gacha.pity.standard = 17;
  await page.addInitScript(
    (raw) => {
      if (!localStorage.getItem("northern-prisma.campaign.v4"))
        localStorage.setItem("northern-prisma.campaign.v4", raw);
      sessionStorage.setItem("northern-prisma.entered", "1");
      Math.random = () => 0;
    },
    encodeGameSave(save, content),
  );
}
const saved = (page: Page) =>
  page.evaluate(() =>
    JSON.parse(JSON.parse(localStorage.getItem("northern-prisma.profiles.v1")!).entries[0].text),
  );

test("Shop is accessible from tavern/header, currencies have distinct colors and summon information moves below the banner", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/home");
  await expect(page.locator(".header-shop")).toBeVisible();
  await expect(page.locator('.home-menu-link[href="/shop"]')).toBeVisible();
  const pure = await page
    .locator(".utility-wallet [data-currency=pure]")
    .boundingBox();
  const coin = await page
    .locator(".utility-wallet [data-currency=coin]")
    .boundingBox();
  expect(pure!.x).toBeLessThan(coin!.x);
  const colors = await page
    .locator(".utility-wallet")
    .evaluate((node) =>
      Array.from(node.querySelectorAll(".currency-amount")).map(
        (item) => getComputedStyle(item).color,
      ),
    );
  expect(new Set(colors).size).toBe(3);
  await page.getByRole("link", { name: /Chiêu Mộ/ }).click();
  await expect(page.locator(".banner-sidebar")).not.toContainText("Bảo hiểm");
  await expect(page.locator(".banner-sidebar .currency-amount")).toHaveCount(0);
  await expect(page.locator(".recruitment-status")).toContainText(
    "17 lượt đã chiêu mộ",
  );
  await expect(page.locator(".recruitment-status .pity-panel")).toContainText(
    "17/50",
  );
  await expect(
    page.getByRole("heading", { name: "Đổi mảnh chiêu mộ" }),
  ).toHaveCount(0);
  await page.locator(".recruitment-status summary").click();
  await expect(page.locator(".recruitment-status details")).toContainText(
    "30% cấp thấp",
  );
  await page.screenshot({
    path: "test-results/visual-prisma-recruitment.png",
    fullPage: true,
  });
});

test("Shop converts at 300 Coin per Prisma and recruits for 120 Pure Prisma without changing pity", async ({
  page,
}) => {
  await seed(page, { coins: 1200, prisma: 0, recruitmentShards: 120 });
  await page.goto("/shop");
  await expect.poll(() => page.locator('.shop-scene img').evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
  const stock = await page.locator('.shop-stock').boundingBox();
  const keeper = await page.locator('.shop-keeper').boundingBox();
  expect(stock!.x + stock!.width).toBeLessThan(keeper!.x);
  expect(stock!.width / (stock!.width + keeper!.width)).toBeCloseTo(.6, 1);
  const greeting = await page.locator('.witch-dialogue p').textContent();
  await page.getByRole('button', { name: 'Nghe lời chào tiếp theo' }).click();
  await expect(page.locator('.witch-dialogue p')).not.toHaveText(greeting!);
  await page.getByRole("spinbutton", { name: "Số Prisma muốn đổi" }).fill("2");
  await page
    .getByRole("button", { name: "Chuyển đổi Prisma", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("600 Coin");
  await page
    .getByRole("button", { name: "Xác nhận chuyển đổi", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect((await saved(page)).coins).toBe(600);
  expect((await saved(page)).prisma).toBe(2);
  await page.reload();
  await expect(
    page.locator(".utility-wallet [data-currency=prisma]"),
  ).toContainText("2");
  await page.screenshot({
    path: "test-results/visual-prisma-shop.png",
    fullPage: true,
  });
  await page.locator(".shop-tabs a").nth(1).click();
  await page.getByRole("button", { name: /Dain/ }).click();
  await expect(page.getByRole("dialog")).toContainText("120 Pure Prisma");
  await page
    .getByRole("button", { name: "Chiêu mộ bằng Pure Prisma", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const state = await saved(page);
  expect(state.recruitmentShards).toBe(0);
  expect(state.prisma).toBe(2);
  expect(state.coins).toBe(600);
  expect(state.unlockedCharacterIds).toContain("dain");
  expect(state.gacha.pity.standard).toBe(17);
  await expect(page.getByRole("button", { name: /Dain/ })).toHaveCount(0);
  await page.screenshot({
    path: "test-results/visual-pure-prisma-shop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "/home",
    "/shop",
    "/shop?tab=recruitment",
    "/recruitment",
  ]) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      route,
    ).toBe(true);
    if (route.startsWith('/shop')) {
      await expect(page.locator('.witch-dialogue')).toBeVisible();
      await page.screenshot({path: `test-results/shop-phone-${route.includes('?') ? 'recruitment' : 'prisma'}.png`, fullPage: true});
    }
  }
  await page.screenshot({
    path: "test-results/visual-prisma-phone.png",
    fullPage: true,
  });
});

test("a summon shortfall confirms only missing Prisma; cancel is free and conversion plus rewards save once", async ({
  page,
}) => {
  await seed(page, { coins: 3000, prisma: 3, recruitmentShards: 0 });
  await page.goto("/recruitment");
  const before = await saved(page);
  await page.getByRole("button", { name: /Chiêu mộ 10 lần/ }).click();
  await expect(page.getByRole("dialog")).toContainText("7 Prisma");
  await expect(page.getByRole("dialog")).toContainText("2.100");
  await page.getByRole("button", { name: "Hủy", exact: true }).click();
  expect(await saved(page)).toEqual(before);
  await page.getByRole("button", { name: /Chiêu mộ 10 lần/ }).click();
  await page
    .getByRole("button", { name: "Đổi & Chiêu mộ 10 lần", exact: true })
    .click();
  await expect(page.locator(".stone-awakening")).toBeVisible();
  await page.getByRole("button", { name: "Bỏ qua → Kết quả" }).click();
  await expect(page.locator(".summon-result")).toHaveCount(10);
  const after = await saved(page);
  expect(after.coins).toBe(900);
  expect(after.prisma).toBe(0);
  expect(after.gacha.totalPulls).toBe(27);
  await page.reload();
  await expect(page.locator(".summon-result")).toHaveCount(10);
  expect(await saved(page)).toEqual(after);
});

test("insufficient Coin and a failed save cannot partially convert currency or grant summon results", async ({
  page,
}) => {
  await seed(page, { coins: 299, prisma: 0, recruitmentShards: 0 });
  await page.goto("/recruitment");
  const before = await saved(page);
  await page.getByRole("button", { name: /Chiêu mộ 1 lần/ }).click();
  await expect(page.getByRole("dialog")).toContainText("Cần thêm 1 Coin");
  await expect(
    page.getByRole("button", { name: "Đổi & Chiêu mộ 1 lần", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Hủy", exact: true }).click();
  expect(await saved(page)).toEqual(before);
  await page.evaluate(() => {
    const key = "northern-prisma.profiles.v1";
    const bundle = JSON.parse(localStorage.getItem(key)!);
    const value = JSON.parse(bundle.entries[0].text);
    value.coins = 300;
    bundle.entries[0].text = JSON.stringify(value);bundle.entries[0].revision = 'external-change';
    localStorage.setItem(key, JSON.stringify(bundle));
  });
  await page.reload();
  const funded = await saved(page);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "northern-prisma.profiles.v1")
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await page.getByRole("button", { name: /Chiêu mộ 1 lần/ }).click();
  await page
    .getByRole("button", { name: "Đổi & Chiêu mộ 1 lần", exact: true })
    .click();
  await expect(page.locator(".notice")).toContainText("Quota exceeded");
  await expect(page.locator(".stone-awakening")).toHaveCount(0);
  expect(await saved(page)).toEqual(funded);
});
