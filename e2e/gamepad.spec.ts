import { test, expect, type Page } from "@playwright/test";
import { loadContent } from "../scripts/load-content.mjs";
import { createGameSave, encodeGameSave } from "../src/core/game-save.js";
const content: any = await loadContent();
test('LB/RB switches Inventory and Thợ Rèn tabs; open dismantle modal keeps background tabs unchanged',async({page})=>{
 await setup(page);await page.goto('/inventory');await expect(page.locator('.gear-card')).toHaveCount(1);await focused(page,'.back-button');await expect(page.locator('.gamepad-guide-status')).toHaveText('TAY CẦM XBOX');await press(page,5);await expect(page.getByRole('button',{name:'Trấn Phái',exact:true})).toHaveAttribute('aria-current','page');await press(page,5);await expect(page.locator('.resource-card')).toHaveCount(5);await press(page,4);await expect(page.getByRole('button',{name:'Trấn Phái',exact:true})).toHaveAttribute('aria-current','page');await press(page,4);await expect(page.locator('.gear-card')).toHaveCount(1);
 await page.goto('/blacksmith');await expect(page.locator('.gear-card')).toHaveCount(1);await focused(page,'.back-button');await expect(page.locator('.gamepad-guide-status')).toHaveText('TAY CẦM XBOX');await press(page,5);await expect(page.locator('.exclusive-card')).toHaveCount(17);await press(page,4);await page.locator('.gear-card').click();await page.getByRole('button',{name:'Phân rã (1)',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await press(page,5);await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByRole('button',{name:'Phân rã',exact:true})).toHaveAttribute('aria-current','page');await press(page,1);await expect(page.getByRole('dialog')).toHaveCount(0);
});
async function setup(page: Page, mode = "gamepad") {
  const save = createGameSave(content);
  save.prisma = 10;
  save.coins = 3000;
  save.gear = [{ id: "gear_1", typeId: "t1", stats: { attack: 1 } }];
  save.gacha.totalPulls = 1;
  await page.addInitScript(
    ({ raw, mode }) => {
      if (!localStorage.getItem("northern-prisma.campaign.v4"))
        localStorage.setItem("northern-prisma.campaign.v4", raw);
      if (!localStorage.getItem("northern-prisma.settings.v1"))
        localStorage.setItem(
          "northern-prisma.settings.v1",
          JSON.stringify({
            controlMode: mode,
            musicEnabled: false,
            musicVolume: 0.35,
            rumble: false,
            showHints: true,
          }),
        );
      sessionStorage.setItem("northern-prisma.entered", "1");
      (window as any).__pad = {
        id: "Xbox Standard Test Controller",
        index: 0,
        connected: true,
        mapping: "standard",
        axes: [0, 0, 0, 0],
        buttons: Array.from({ length: 17 }, () => ({
          pressed: false,
          value: 0,
        })),
      };
      Object.defineProperty(navigator, "getGamepads", {
        value: () => {
          (window as any).__padSamples = ((window as any).__padSamples ?? 0) + 1;
          (window as any).__lastPadButtons = (window as any).__pad.buttons.map((button: any) => button.pressed);
          return [(window as any).__pad];
        },
      });
    },
    { raw: encodeGameSave(save, content), mode },
  );
}
async function press(page: Page, index: number, hold = 100) {
  await page.waitForTimeout(80);
  const samples = await page.evaluate(() => (window as any).__padSamples ?? 0);
  await page.evaluate((index) => {
    (window as any).__pad.buttons[index].pressed = true;
  }, index);
  // Deliver the synthetic press across two actual polling frames, even when a
  // large SVG makes headless rendering slower than the 100 ms default hold.
  await expect.poll(() => page.evaluate(({index,samples}) =>
    (window as any).__padSamples >= samples + 2 && (window as any).__lastPadButtons?.[index] === true,
    {index,samples})).toBe(true);
  await page.waitForTimeout(hold);
  await page.evaluate((index) => {
    (window as any).__pad.buttons[index].pressed = false;
  }, index);
  await expect.poll(() => page.evaluate(index => (window as any).__lastPadButtons?.[index] === false,index)).toBe(true);
  await page.waitForTimeout(100);
}
const focused = (page: Page, selector: string) =>
  expect
    .poll(() =>
      page.evaluate(
        (selector) => document.activeElement?.matches(selector),
        selector,
      ),
    )
    .toBe(true);

test("Settings replaces header BGM, persists preferences and Menu/B operate the modal without held-button repeats", async ({
  page,
}) => {
  await setup(page, "mouse");
  await page.goto("/home");
  await expect(
    page.locator(".utility-bar .audio-toggle,.utility-bar .volume"),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Mở Settings" }).click();
  await page.getByRole("tab", { name: "Âm thanh", exact: true }).click();
  await page.getByLabel("Âm lượng nhạc nền").fill("0.6");
  await page.getByRole("tab", { name: "Điều khiển", exact: true }).click();
  await page.getByRole("button", { name: "Tay cầm Xbox", exact: true }).click();
  await expect(page.locator(".controller-status")).toContainText("Đã kết nối");
  await expect(page.locator(".gamepad-guide")).toBeVisible();
  await press(page, 1);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await press(page, 9, 700);
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await press(page, 1);
  await page.reload();
  await page.getByRole("button", { name: "Mở Settings" }).click();
  await expect(page.getByLabel("Âm lượng nhạc nền")).toHaveValue("0.6");
  await page.getByRole("tab", { name: "Điều khiển", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Tay cầm Xbox", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({
    path: "test-results/visual-settings-controller.png",
    fullPage: true,
  });
});

test("party focus, picker grid, confirm shortcut, preset bumpers and roster filters work with the polled controller", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/party");
  await focused(page, ".party-member-select");
  await press(page, 0, 700);
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await focused(page, ".modal-grid .character-card");
  await press(page, 15);
  await press(page, 0);
  await press(page, 2);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await focused(page, ".party-member-select");
  await press(page, 5);
  await expect(page.locator(".preset-bar .active")).toContainText("02");
  await page.goto("/characters");
  await press(page, 3);
  await focused(page, ".filter-bar input");
  await press(page, 0);
  await expect(page.locator(".gamepad-keyboard")).toBeVisible();
  await press(page, 0);
  await expect(page.locator(".gamepad-text-preview")).toHaveText("a");
  await page.getByRole("button", { name: "Xác nhận nội dung" }).focus();
  await press(page, 0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".filter-bar input")).toHaveValue("a");
  await page.getByRole("combobox", { name: "Nguyên tố", exact: true }).focus();
  await press(page, 0);
  await expect(page.locator(".gamepad-options")).toBeVisible();
  await press(page, 1);
  await expect(page).toHaveURL(/characters/);
});

test("combat A chooses skill then legal target before executing; B cancels and Y explains unavailable skills", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/quests?selected=goblin_forest_ambush");
  await page.getByRole("button", { name: /Xuất chiến/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("dialog").getByRole("button", { name: "Hủy", exact: true }),
  ).toBeFocused();
  await press(page, 15);
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Xuất chiến", exact: true }),
  ).toBeFocused();
  await press(page, 0);
  await expect(page).toHaveURL(/battle$/);
  await focused(page, ".skill-command.selected");
  const before = await page.locator(".battle-log ol").textContent();
  await press(page, 0);
  await expect(page.locator("main")).toHaveAttribute(
    "data-gamepad-phase",
    "target",
  );
  expect(await page.locator(".battle-log ol").textContent()).toBe(before);
  await focused(page, ".target-hitbox[data-gamepad-legal=true]");
  await press(page, 15);
  await expect(page.locator(".enemy-grid .combatant.is-target")).toHaveCount(1);
  await press(page, 1);
  await expect(page.locator("main")).toHaveAttribute(
    "data-gamepad-phase",
    "skill",
  );
  await expect(page.locator(".battle-log ol")).toHaveText(before!);
  const unavailable = page
    .locator(".skill-command[aria-disabled=true]")
    .first();
  if (await unavailable.count()) {
    await unavailable.focus();
    await press(page, 3);
    await expect(page.getByRole("tooltip")).toContainText(/Chưa đủ|MP|Hồi/);
    await press(page, 1);
  }
  await page.locator(".skill-command").first().focus();
  await press(page, 0);
  await press(page, 0, 900);
  await expect(page.locator(".battle-log ol")).not.toHaveText(before!);
  await expect(page.locator(".execute")).toBeEnabled();
  await page.screenshot({
    path: "test-results/visual-gamepad-combat.png",
    fullPage: true,
  });
});

test("equipment, Shop tabs and gacha skip keep actions deliberate; disconnect leaves mouse and modal available", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/characters/arthur/equipment");
  await focused(page, ".equipment-slots button");
  await press(page, 0);
  await focused(page, ".gear-card");
  await press(page, 0);
  await focused(page, ".stack-actions .gold");
  await press(page, 0);
  await expect(page.locator(".equipment-slots button").first()).toContainText(
    "ATK +1",
  );
  await page.goto("/shop");
  await focused(page, ".back-button");
  await expect(page.locator('.gamepad-guide-status')).toContainText('TAY CẦM XBOX');
  await press(page, 5);
  await expect(page).toHaveURL(/tab=recruitment/);
  await press(page, 4);
  await expect(page).toHaveURL(/shop$/);
  await page.goto("/recruitment");
  await focused(page, ".summon-actions button");
  await press(page, 0);
  await expect(page.locator(".stone-awakening")).toBeVisible();
  await expect(page.locator(".gamepad-guide")).toContainText("Bỏ qua");
  await press(page, 2);
  await expect(page).toHaveURL(/results/);
  await press(page, 9);
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.evaluate(() => {
    (window as any).__pad.connected = false;
  });
  await expect(page.locator(".gamepad-guide")).toContainText("Kết nối tay cầm");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Đóng Settings" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/party");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/visual-gamepad-phone.png",
    fullPage: true,
  });
});

test("Menu over a pending new-battle confirmation scopes input to the top modal and B preserves the current battle", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/quests?selected=goblin_forest_ambush");
  await page.getByRole("button", { name: /Xuất chiến/ }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Xuất chiến", exact: true })
    .click();
  await expect(page).toHaveURL(/battle$/);
  const before = await page.locator(".battle-log ol").textContent();
  await page.getByRole("link", { name: "Trở về", exact: true }).click();
  await page.getByRole("button", { name: /Xuất chiến/ }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Xuất chiến", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Bắt đầu trận mới?");
  await press(page, 9);
  await expect(page.getByRole("dialog")).toHaveCount(2);
  await press(page, 1);
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await expect(page.getByRole("dialog")).toContainText("Bắt đầu trận mới?");
  await press(page, 1);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.locator(".resume-link").click();
  await expect(page.locator(".battle-log ol")).toHaveText(before!);
});
