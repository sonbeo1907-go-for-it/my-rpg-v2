import { test, expect } from "@playwright/test";
import { loadContent } from "../scripts/load-content.mjs";
import { createGameSave, encodeGameSave } from "../src/core/game-save.js";
const content: any = await loadContent();
const seeded = createGameSave(content);
seeded.coins = 1234;
const raw = encodeGameSave(seeded, content);

test("new profile, automatic loading, rename, switching and isolated progress work on desktop / phone", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Chọn hành trình" }),
  ).toBeVisible();
  await expect(page.getByText("Import Save", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Tạo hành trình mới" }).click();
  await page
    .getByLabel("Tên người chơi", { exact: true })
    .fill("Arthur phương Bắc");
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(page).toHaveURL(/home$/);
  await expect(page.locator(".home-profile")).toContainText(
    "Arthur phương Bắc",
  );
  await expect(page.getByText("Export Save", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Đổi tên người chơi" }).click();
  await page.getByLabel("Tên người chơi", { exact: true }).fill("Iris");
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(page.locator(".home-profile")).toContainText("Iris");
  await page.reload();
  await expect(page.locator(".home-profile")).toContainText("Iris");
  await page.getByRole("button", { name: "Đổi hồ sơ", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator(".profile-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Tạo hành trình mới" }).click();
  await page.getByLabel("Tên người chơi", { exact: true }).fill("Takeshi");
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(page).toHaveURL(/home$/);
  await page.goto("/party");
  await page
    .getByLabel("Tên đội", { exact: true })
    .fill("Đội riêng của Takeshi");
  await page.getByRole("button", { name: "Lưu tên", exact: true }).click();
  await expect(
    page.getByText("Đã lưu thay đổi.", { exact: true }),
  ).toBeVisible();
  await page.goto("/home");
  await page.getByRole("button", { name: "Đổi hồ sơ", exact: true }).click();
  await page.locator(".profile-card").filter({ hasText: "Iris" }).click();
  await page.getByRole("button", { name: /^Tiếp tục/ }).click();
  await expect(page).toHaveURL(/home$/);
  await page.goto("/party");
  await expect(page.getByLabel("Tên đội", { exact: true })).toHaveValue(
    "Đội 1",
  );
  await page.goto("/home");
  await page.getByRole("button", { name: "Đổi hồ sơ", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".profile-card")).toHaveCount(2);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  for (const selector of [
    ".profile-selection",
    ".profile-title-screen h1",
    ".profile-card",
  ]) {
    for (const rect of await page.locator(selector).evaluateAll((nodes) =>
      nodes.map((node) => {
        const r = node.getBoundingClientRect();
        return { left: r.left, right: r.right };
      }),
    )) {
      expect(rect.left).toBeGreaterThanOrEqual(0);
      expect(rect.right).toBeLessThanOrEqual(391);
    }
  }
  await page.screenshot({
    path: "test-results/profiles-phone.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.screenshot({
    path: "test-results/profiles-desktop.png",
    fullPage: true,
  });
});

test("legacy saves migrate automatically and a corrupted profile offers validated backup recovery", async ({
  page,
}) => {
  await page.addInitScript((raw) => {
    if (!localStorage.getItem("northern-prisma.campaign.v4"))
      localStorage.setItem("northern-prisma.campaign.v4", raw);
  }, raw);
  await page.goto("/");
  await expect(page.locator(".profile-card")).toHaveCount(1);
  await expect(page.locator(".profile-card")).toContainText("Arthur");
  await page.getByRole("button", { name: /^Tiếp tục/ }).click();
  await expect(page).toHaveURL(/home$/);
  await expect(page.locator(".utility-wallet")).toContainText("1.234");
  await page.getByRole("button", { name: "Đổi hồ sơ", exact: true }).click();
  await page.evaluate(() => {
    const key = "northern-prisma.profiles.v1",
      bundle = JSON.parse(localStorage.getItem(key)!);
    bundle.entries[0].text = "broken";
    bundle.entries[0].revision = "broken";
    localStorage.setItem(key, JSON.stringify(bundle));
  });
  await page.reload();
  await expect(page.getByRole("button", { name: /^Tiếp tục/ })).toBeDisabled();
  await page.getByRole("button", { name: "Khôi phục bản sao lưu" }).click();
  await page.getByRole("button", { name: "Khôi phục", exact: true }).click();
  await expect(page.getByRole("button", { name: /^Tiếp tục/ })).toBeEnabled();
  await page.getByRole("button", { name: /^Tiếp tục/ }).click();
  await expect(page).toHaveURL(/home$/);
  await expect(page.locator(".utility-wallet")).toContainText("1.234");
});

test("native bridge scans saves, awaits disk writes before granting purchases and opens directory", async ({
  page,
}) => {
  await page.addInitScript((raw) => {
    (window as any).isTauri = true;
    (window as any).__disk = {
      id: 2,
      username: "Người chơi Windows",
      text: raw,
      backup: null,
      revision: "r1",
      updatedAt: Date.now(),
    };
    (window as any).__nativeCalls = [];
    (window as any).__TAURI_INTERNALS__ = {
      invoke: async (command: string, args: any) => {
        (window as any).__nativeCalls.push({ command, args });
        const disk = (window as any).__disk;
        if (command === "save_directory") return "C:/Test/NorthernPrisma/saves";
      if (command === "list_profiles") return [disk];
        if (command === "read_profile") return disk;
        if (command === "write_profile") {
          if ((window as any).__failWrite)
            throw new Error("Không ghi được file thử nghiệm");
          await new Promise((resolve) => setTimeout(resolve, 200));
          return ((window as any).__disk = {
            ...disk,
            text: args.text,
            backup: disk.text,
            revision: disk.revision + "x",
          });
        }
        if (command === "rename_profile")
          return ((window as any).__disk = {
            ...disk,
            username: args.username,
          });
        if (command === "open_save_directory") return null;
        throw new Error("Unexpected native command " + command);
      },
    };
  }, raw);
  await page.goto("/");
  await expect(page.locator(".profile-card")).toContainText(
    "Người chơi Windows",
  );
  await expect(page.getByText(/Bản xem trước trên trình duyệt/)).toHaveCount(0);
  await page.getByRole("button", { name: /^Tiếp tục/ }).click();
  await expect(page).toHaveURL(/home$/);
  await page
    .getByRole("button", { name: "Mở thư mục lưu dữ liệu game", exact: true })
    .click();
  expect(
    await page.evaluate(() =>
      (window as any).__nativeCalls.some(
        (c: any) => c.command === "open_save_directory",
      ),
    ),
  ).toBe(true);
  await page.goto("/party");
  await page.getByLabel("Tên đội", { exact: true }).fill("Tên chưa ghi được");
  await page.evaluate(() => {
    (window as any).__failWrite = true;
  });
  await page.getByRole("button", { name: "Lưu tên", exact: true }).click();
  await expect(
    page.getByText("Không ghi được file thử nghiệm", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => JSON.parse((window as any).__disk.text).partyPresets[0].name,
    ),
  ).toBe("Đội 1");
  await page.evaluate(() => {
    (window as any).__failWrite = false;
  });
  await page.getByRole("button", { name: "Lưu tên", exact: true }).click();
  await expect(
    page.getByText("Đã lưu thay đổi.", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => JSON.parse((window as any).__disk.text).partyPresets[0].name,
    ),
  ).toBe("Tên chưa ghi được");
  expect(
    await page.evaluate(() =>
      localStorage.getItem("northern-prisma.profiles.v1"),
    ),
  ).toBeNull();
});
