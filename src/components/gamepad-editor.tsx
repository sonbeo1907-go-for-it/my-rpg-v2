"use client";
import { useEffect, useState } from "react";
import { Modal } from "./ui";

export function setControlValue(
  control: HTMLInputElement | HTMLSelectElement,
  value: string,
) {
  const prototype =
    control instanceof HTMLSelectElement
      ? HTMLSelectElement.prototype
      : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(
    control,
    value,
  );
  control.dispatchEvent(
    new Event(control instanceof HTMLSelectElement ? "change" : "input", {
      bubbles: true,
    }),
  );
}
export function GamepadEditor() {
  const [control, setControl] = useState<
    HTMLInputElement | HTMLSelectElement | null
  >(null);
  const [value, setValue] = useState("");
  const [upper, setUpper] = useState(false);
  useEffect(() => {
    const open = (event: Event) => {
      const element = (event as CustomEvent).detail;
      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement
      ) {
        setControl(element);
        setValue(element.value);
      }
    };
    window.addEventListener("rpg:edit-control", open);
    return () => window.removeEventListener("rpg:edit-control", open);
  }, []);
  if (!control) return null;
  const label = control.labels?.[0]?.cloneNode(true) as HTMLElement | undefined;
  label
    ?.querySelectorAll("input,select,button")
    .forEach((element) => element.remove());
  const title =
    label?.textContent?.split(":")[0]?.trim() ||
    control.getAttribute("aria-label") ||
    "Nhập nội dung";
  const commit = (next = value) => {
    if (control.isConnected) setControlValue(control, next);
    setControl(null);
  };
  const keys =
    control.type === "number"
      ? "1234567890"
      : "abcdefghijklmnopqrstuvwxyz0123456789đ";
  return (
    <Modal
      title={title}
      onClose={() => setControl(null)}
      initialFocus={
        control instanceof HTMLSelectElement
          ? "[aria-pressed=true]"
          : ".gamepad-keyboard button"
      }
      footer={
        <>
          <button onClick={() => setControl(null)}>Hủy</button>
          {!(control instanceof HTMLSelectElement) && (
            <button className="confirm" onClick={() => commit()}>
              Xác nhận nội dung
            </button>
          )}
        </>
      }
    >
      {control instanceof HTMLSelectElement ? (
        <div className="gamepad-options">
          {Array.from(control.options).map((option) => (
            <button
              key={option.value}
              aria-pressed={option.value === control.value}
              disabled={option.disabled}
              onClick={() => commit(option.value)}
            >
              {option.text}
            </button>
          ))}
        </div>
      ) : (
        <>
          <output className="gamepad-text-preview" aria-live="polite">
            {value || "Chưa nhập nội dung"}
          </output>
          <div className="gamepad-keyboard">
            {Array.from(keys).map((key) => (
              <button
                key={key}
                onClick={() =>
                  setValue((previous) =>
                    (previous + (upper ? key.toUpperCase() : key)).slice(
                      0,
                      control.maxLength > 0 ? control.maxLength : 80,
                    ),
                  )
                }
              >
                {upper ? key.toUpperCase() : key}
              </button>
            ))}
          </div>
          <div className="gamepad-keyboard-tools">
            {control.type !== "number" && (
              <>
                <button
                  onClick={() => setUpper((previous) => !previous)}
                  aria-pressed={upper}
                >
                  Aa
                </button>
                <button onClick={() => setValue((previous) => previous + " ")}>
                  Dấu cách
                </button>
              </>
            )}
            <button
              onClick={() => setValue((previous) => previous.slice(0, -1))}
            >
              ⌫ Xóa ký tự
            </button>
            <button onClick={() => setValue("")}>Xóa hết</button>
          </div>
        </>
      )}
    </Modal>
  );
}
