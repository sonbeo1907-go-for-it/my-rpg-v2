"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useGame } from "../runtime/game-context";
import { useSettings } from "../runtime/settings-context";
import { GamepadReader, spatialNext } from "../ui/gamepad-input.js";
import { setControlValue } from "./gamepad-editor";

const selector =
  'button:not(:disabled),a[href],input:not(:disabled):not([type=hidden]),select:not(:disabled),summary,[tabindex="0"]';
const visible = (element: HTMLElement) =>
  Boolean(element.getClientRects().length) &&
  !element.closest('[inert],[aria-hidden="true"]');
const controls = (root: ParentNode) =>
  Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(visible);
const scope = () =>
  Array.from(document.querySelectorAll<HTMLDialogElement>("dialog[open]"))
    .sort(
      (a, b) =>
        Number(a.dataset.modalOrder ?? 0) - Number(b.dataset.modalOrder ?? 0),
    )
    .at(-1) ??
  document.querySelector("main") ??
  document.body;
const focus = (element?: Element | null) => {
  if (element instanceof HTMLElement && visible(element)) {
    element.focus({ preventScroll: true });
    element.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "instant",
    });
  }
};
const keyFor = (element: HTMLElement) =>
  element.dataset.navKey ||
  element.getAttribute("href") ||
  element.getAttribute("aria-label") ||
  `${element.tagName}:${element.className}:${element.textContent?.trim().slice(0, 90)}`;
function initial(root: ParentNode, path: string) {
  if (path === "/stories") return root.querySelector<HTMLElement>(".story-book");
  if (path.startsWith("/stories/")) return root.querySelector<HTMLElement>(".quest-card.selected,.quest-card:not(:disabled)");
  if (path.startsWith("/dungeon/"))
    return root.querySelector<HTMLElement>(".quest-card.selected,.quest-card");
  if (path === "/dungeon")
    return root.querySelector<HTMLElement>("a.dungeon-choice");
  if (
    path === "/battle" &&
    root instanceof Element &&
    root.getAttribute("data-gamepad-phase") === "target"
  )
    return (
      root.querySelector<HTMLElement>(
        ".target-hitbox[data-gamepad-legal=true][aria-pressed=true]",
      ) ??
      root.querySelector<HTMLElement>(".target-hitbox[data-gamepad-legal=true]")
    );
  const preferred =
    path === "/party"
      ? ".party-member-select,.add-member"
      : path === "/home"
        ? ".home-menu-link"
        : path === "/battle"
          ? ".skill-command.selected,.skill-command,.result-actions button"
          : path.includes("/equipment")
            ? ".equipment-slots button:not(:disabled)"
            : path === "/quests"
              ? ".quest-card.selected,.quest-card"
              : path === "/recruitment"
                ? ".summon-actions button,.summon-skip"
                : path === "/characters"
                  ? ".character-grid a"
                  : "";
  return (
    (preferred && root.querySelector<HTMLElement>(preferred)) ||
    controls(root)[0]
  );
}
function cycle(
  items: HTMLElement[],
  direction: number,
  active: Element | null,
  activate = false,
) {
  if (!items.length) return;
  const found = items.findIndex(
    (item) => item === active || item.contains(active),
  );
  const next =
    items[(Math.max(0, found) + direction + items.length) % items.length];
  if (activate) next.click();
  focus(next);
}
function hintList(
  path: string,
  root: Element,
  active: Element | null,
): [string, string][] {
  if (root.matches("dialog")) {
    if (root.querySelector(".settings-tabs"))
      return [
        ["A", "Thay đổi"],
        ["B", "Đóng"],
        ["LB / RB", "Chuyển tab"],
        ["RS", "Cuộn"],
      ];
    if(root.querySelector(".gear-pagination"))return [["A","Chọn"],["LT / RT","Đổi trang"],["B","Đóng"],["RS","Cuộn"]];
    if (root.querySelector(".modal-grid"))
      return [
        ["A", "Chọn"],
        ["X", "Xếp vào vị trí"],
        ["Y", "Bộ lọc"],
        ["B", "Hủy"],
      ];
    return [
      ["A", "Chọn / Xác nhận"],
      ["B", "Hủy"],
      ["RS", "Cuộn"],
    ];
  }
  if (root.querySelector(".stone-awakening"))
    return [
      ["X", "Bỏ qua tới kết quả"],
      ["☰", "Settings"],
    ];
  if (path === "/battle" && root.querySelector(".abilities")) {
    const result:[string,string][] = root.getAttribute("data-gamepad-phase") === "target"
      ? [["D-pad","Mục tiêu"],["A","Thực hiện"],["B","Chọn lại chiêu"],["Y","Chi tiết chiêu"]]
      : [["D-pad","Kỹ năng"],["A","Chọn chiêu"],["Y","Chi tiết"],["☰","Settings"]];
    if(root.querySelector('.formula-edit-open'))result.splice(2,0,["X","Hiệu chỉnh"]);
    return result;
  }
  if (path.includes("/reveal"))
    return [
      ["A", "Mở thẻ / Tiếp tục"],
      ["X", "Bỏ qua"],
      ["B", "Trở về"],
    ];
  if (path.includes("/results"))
    return [
      ["A", "Chi tiết"],
      ["X", "Về Chiêu Mộ"],
      ["Y", "Xem lại reveal"],
    ];
  if (path === "/party")
    return [
      ["A", "Chọn đồng đội"],
      ["X", "Chi Tiết"],
      ["LB / RB", "Đội hình"],
      ["☰", "Settings"],
    ];
  if (path.endsWith("/equipment"))
    return [
      ["A", "Chọn ô / Trang bị"],
      ["LT / RT", "Đổi trang"],
      ["Y", "Bộ lọc"],
      ["B", "Trở về"],
      ["RS", "Cuộn"],
    ];
  if (path.startsWith("/characters/"))
    return [
      ["A", "Chọn"],
      ["X", "Trang bị"],
      ["B", "Trở về"],
      ["RS", "Cuộn"],
    ];
  if (path === "/shop" || path === "/blacksmith" || path === "/inventory")
    return [
      ["A", "Chọn"],
      ["LB / RB", "Chuyển tab"],
      ...(path!=="/shop"?[["LT / RT","Đổi trang"] as [string,string]]:[]),
      ["B", "Trở về"],
      ["RS", "Cuộn"],
    ];
  if (active?.matches("input[type=range]"))
    return [
      ["← / →", "Điều chỉnh"],
      ["↑ / ↓", "Di chuyển"],
      ["B", "Trở về"],
    ];
  if (path === "/quests")
    return [["A", "Chọn"], ["LB / RB", "Thảo phạt / Hiểm Ác / Truy Nã"], ["Y", "Bộ lọc"], ["B", "Trở về"], ["RS", "Cuộn"]];
  if (["/characters", "/inventory"].includes(path))
    return [
      ["A", "Chọn"],
      ["Y", "Bộ lọc"],
      ["B", "Trở về"],
      ["RS", "Cuộn"],
    ];
  return [
    ["D-pad", "Di chuyển"],
    ["A", "Chọn"],
    ["B", "Trở về"],
    ["☰", "Settings"],
  ];
}

export function GamepadNavigation() {
  const path = usePathname();
  const { busy } = useGame();
  const { preferences, open, setOpen, connection, setConnection } =
    useSettings();
  const [hints, setHints] = useState<[string, string][]>([]);
  const [guideHost, setGuideHost] = useState<HTMLElement | null>(null);
  const memory = useRef(new Map<string, string>());
  useEffect(() => {
    document.documentElement.dataset.controls = preferences.controlMode;
    const reader = new GamepadReader();
    let frame = 0,
      previousTime = performance.now(),
      lastConnection = "",
      lastHints = "",
      pad: any = null;
    const refreshHints = () => {
      const root = scope();
      setGuideHost(root instanceof HTMLDialogElement ? root : document.body);
      const next = hintList(path, root, document.activeElement);
      const signature = JSON.stringify(next);
      if (signature !== lastHints) {
        lastHints = signature;
        setHints(next);
      }
    };
    const restore = () => {
      if (
        preferences.controlMode !== "gamepad" ||
        document.querySelector("dialog[open]")
      )
        return;
      const root = scope();
      const remembered = memory.current.get(path);
      focus(
        controls(root).find((element) => keyFor(element) === remembered) ??
          initial(root, path),
      );
    };
    const onFocus = () => {
      const element = document.activeElement as HTMLElement;
      if (
        element &&
        !element.closest("dialog") &&
        document.querySelector("main")?.contains(element)
      ) {
        if (element.matches(selector))
          memory.current.set(path, keyFor(element));
        else if (
          preferences.controlMode === "gamepad" &&
          element.matches('h1[tabindex="-1"]')
        )
          requestAnimationFrame(() => {
            if (document.activeElement === element) restore();
          });
      }
      refreshHints();
    };
    const vibrate = () => {
      if (!preferences.rumble) return;
      try {
        const result = pad?.vibrationActuator?.playEffect?.("dual-rumble", {
          duration: 35,
          strongMagnitude: 0.12,
          weakMagnitude: 0.2,
        });
        result?.catch?.(() => {});
      } catch {}
    };
    function act(action: string) {
      if (action === "menu") {
        setOpen(!open);
        return;
      }
      if (preferences.controlMode !== "gamepad" && !open) return;
      const root = scope();
      const active = document.activeElement as HTMLElement;
      if (!root.matches("dialog")) {
        const event = new CustomEvent("rpg:gamepad", {
          detail: action,
          cancelable: true,
        });
        window.dispatchEvent(event);
        if (event.defaultPrevented) {
          if (action === "a") vibrate();
          refreshHints();
          return;
        }
      }
      if (action === "b") {
        if (document.querySelector(".combat-popover")) {
          document.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
          );
          return;
        }
        if (root.matches("dialog")) {
          root.dispatchEvent(new Event("cancel", { cancelable: true }));
          return;
        }
        document
          .querySelector<HTMLElement>(
            ".page-header .back-button,.home-title-link",
          )
          ?.click();
        return;
      }
      if (["up", "down", "left", "right"].includes(action)) {
        if (
          (action === "left" || action === "right") &&
          active instanceof HTMLInputElement &&
          ["range", "number"].includes(active.type)
        ) {
          const step = Number(active.step) || 1,
            minimum = active.min === "" ? 0 : Number(active.min),
            maximum =
              active.max === "" ? Number.MAX_SAFE_INTEGER : Number(active.max);
          setControlValue(
            active,
            String(
              Number(
                Math.min(
                  maximum,
                  Math.max(
                    minimum,
                    Number(active.value) + (action === "left" ? -step : step),
                  ),
                ).toFixed(6),
              ),
            ),
          );
          return;
        }
        const items = controls(root);
        const positions = items.map((element, index) => ({
          id: index,
          ...element.getBoundingClientRect().toJSON(),
        }));
        const next = spatialNext(positions, items.indexOf(active), action);
        if (next != null) focus(items[next]);
        else if (!root.contains(active)) focus(initial(root, path));
      } else if (action === "a") {
        if (!root.contains(active) || !visible(active)) {
          focus(initial(root, path));
          return;
        }
        if (active.getAttribute("aria-disabled") === "true") {
          active
            .closest(".combat-popover-anchor")
            ?.dispatchEvent(new Event("rpg:help"));
          return;
        }
        if (
          active instanceof HTMLSelectElement ||
          (active instanceof HTMLInputElement &&
            ["text", "number", "search", "email"].includes(active.type))
        ) {
          window.dispatchEvent(
            new CustomEvent("rpg:edit-control", { detail: active }),
          );
          return;
        }
        const slot = active.closest(".equipment-slots");
        const gear = active.closest(".gear-grid");
        const quest = active.closest(".quest-card");
        active.click();
        vibrate();
        if (slot)
          requestAnimationFrame(() =>
            focus(document.querySelector(".gear-grid .gear-card")),
          );
        else if (gear && path.endsWith("/equipment"))
          requestAnimationFrame(() =>
            focus(
              document.querySelector(".stack-actions .gold:not(:disabled)"),
            ),
          );
        else if (quest)
          requestAnimationFrame(() => focus(document.querySelector(".embark")));
      } else if (action === "y") {
        const anchor = active.closest(".combat-popover-anchor");
        if (anchor) anchor.dispatchEvent(new Event("rpg:help"));
        else if (path.includes("/results"))
          document
            .querySelector<HTMLElement>(".summon-result-actions a")
            ?.click();
        else
          focus(
            root.querySelector<HTMLElement>(
              ".filter-bar input,.filter-bar select,.shop-search input",
            ),
          );
      } else if (action === "x") {
        if (root.matches("dialog")) {
          if (root.querySelector(".modal-grid"))
            root
              .querySelector<HTMLButtonElement>(
                "footer .confirm:not(:disabled)",
              )
              ?.click();
          return;
        }
        if (path === "/party")
          active
            .closest(".party-member")
            ?.querySelector<HTMLElement>(".detail-button")
            ?.click();
        else if (
          path.includes("/reveal") ||
          root.querySelector(".stone-awakening")
        )
          document.querySelector<HTMLElement>(".summon-skip")?.click();
        else if (path.includes("/results"))
          document
            .querySelector<HTMLElement>(".summon-result-actions .gold")
            ?.click();
        else if (
          path.startsWith("/characters/") &&
          !path.endsWith("/equipment")
        )
          document.querySelector<HTMLElement>(".header-actions a")?.click();
      } else if(action==='lt'||action==='rt'){
        root.querySelector<HTMLButtonElement>('[data-gamepad-page="'+(action==='lt'?'previous':'next')+'"]:not(:disabled)')?.click();
      } else if (action === "lb" || action === "rb") {
        const tabs = root.querySelector(
          ".settings-tabs,.shop-tabs,.preset-bar,.quest-category-tabs,.inventory-tabs,.blacksmith-tabs",
        );
        if (tabs) {
          const items = controls(tabs);
          const selected = items.find((item) =>
            item.matches("[aria-selected=true],[aria-current=page],.active"),
          );
          cycle(items, action === "lb" ? -1 : 1, selected ?? active, true);
        }
      }
      refreshHints();
    }
    function poll(now: number) {
      const elapsed = Math.min(32, now - previousTime);
      previousTime = now;
      let pads: (Gamepad | null)[] = [];
      try {
        pads = Array.from(navigator.getGamepads?.() ?? []);
      } catch {}
      pad =
        pads.find((item) => item?.connected && item.mapping === "standard") ??
        null;
      const any = pad ?? pads.find((item) => item?.connected);
      const status = {
        connected: Boolean(any),
        supported: Boolean(pad),
        id: any?.id ?? "",
        haptics: Boolean((pad as any)?.vibrationActuator?.playEffect),
      };
      const signature = JSON.stringify(status);
      if (signature !== lastConnection) {
        lastConnection = signature;
        setConnection(status);
      }
      if (document.hidden) reader.reset();
      else {
        const sample = reader.read(pad, now);
        for (const action of sample.actions) act(action);
        if (sample.scroll && preferences.controlMode === "gamepad") {
          let parent: HTMLElement | null =
            document.activeElement as HTMLElement;
          while (
            parent &&
            !(
              parent.scrollHeight > parent.clientHeight + 2 &&
              /auto|scroll/.test(getComputedStyle(parent).overflowY)
            )
          )
            parent = parent.parentElement;
          (parent ?? document.scrollingElement)?.scrollBy({
            top: sample.scroll * elapsed * 0.9,
            behavior: "instant",
          });
        }
      }
      frame = requestAnimationFrame(poll);
    }
    const visibility = () => {
      reader.reset();
    };
    let mutationFrame = 0;
    const observer = new MutationObserver(() => {
      if (mutationFrame) return;
      mutationFrame = requestAnimationFrame(() => {
        mutationFrame = 0;
        refreshHints();
        if (
          preferences.controlMode === "gamepad" &&
          document.activeElement === document.body
        )
          focus(initial(scope(), path));
      });
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["open", "data-gamepad-phase"],
    });
    document.addEventListener("focusin", onFocus);
    document.addEventListener("visibilitychange", visibility);
    const focusFrame = requestAnimationFrame(restore);
    refreshHints();
    frame = requestAnimationFrame(poll);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(mutationFrame);
      cancelAnimationFrame(frame);
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [path, preferences.controlMode, preferences.rumble, open, busy]);
  if (
    preferences.controlMode !== "gamepad" ||
    !preferences.showHints ||
    !guideHost
  )
    return null;
  return createPortal(
    <div className="gamepad-guide" aria-label="Hướng dẫn tay cầm">
      <span className="gamepad-guide-status">
        {connection.supported
          ? "TAY CẦM XBOX"
          : "Kết nối tay cầm · Chuột vẫn dùng được"}
      </span>
      <div>
        {hints.map(([key, text]) => (
          <span className="gamepad-hint" key={key}>
            <kbd className={`xbox-key key-${key.toLowerCase()}`}>{key}</kbd>
            {text}
          </span>
        ))}
      </div>
    </div>,
    guideHost,
  );
}
