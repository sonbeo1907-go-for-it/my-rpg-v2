"use client";
import {
  cloneElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

// A non-modal, anchored panel shared by skills and statuses. It never captures focus.
export function CombatPopover({
  children,
  content,
  label,
}: {
  children: ReactElement;
  content: ReactNode;
  label: string;
}) {
  const id = useId();
  const anchor = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchHeld = useRef(false);
  const touchActive = useRef(false);
  const touchOrigin = useRef({ x: 0, y: 0 });
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const close = () => {
    clear();
    timer.current = setTimeout(() => setOpen(false), 130);
  };
  const show = (delay = 250) => {
    clear();
    timer.current = setTimeout(() => setOpen(true), delay);
  };
  useEffect(() => () => clear(), []);
  useEffect(() => {
    const node = anchor.current;
    const showInfo = () => {
      clear();
      setOpen(true);
    };
    node?.addEventListener("rpg:help", showInfo);
    return () => node?.removeEventListener("rpg:help", showInfo);
  }, []);
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = anchor.current?.getBoundingClientRect();
      const floating = panel.current?.getBoundingClientRect();
      if (!rect || !floating) return;
      const width = floating.width;
      const height = floating.height;
      const left =
        rect.left >= width + 20
          ? rect.left - width - 12
          : Math.min(window.innerWidth - width - 12, Math.max(12, rect.left));
      const top = Math.max(
        12,
        Math.min(
          window.innerHeight - height - 12,
          rect.bottom + height + 12 < innerHeight
            ? rect.bottom + 8
            : rect.top - height - 8,
        ),
      );
      setPosition({ left, top });
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        clear();
        setOpen(false);
      }
    };
    const dismiss = (event: PointerEvent) => {
      if (
        !anchor.current?.contains(event.target as Node) &&
        !panel.current?.contains(event.target as Node)
      )
        setOpen(false);
    };
    place();
    document.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", dismiss);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("keydown", escape);
      document.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, content]);
  return (
    <>
      <span
        ref={anchor}
        className="combat-popover-anchor"
        aria-describedby={open ? id : undefined}
        onPointerEnter={(event) => {
          if (event.pointerType !== "touch") show();
        }}
        onPointerLeave={(event) => {
          if (event.pointerType !== "touch") close();
        }}
        onFocus={() => {
          if (!touchActive.current) show(0);
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node))
            close();
        }}
        onPointerDown={(event) => {
          if (event.pointerType === "touch") {
            touchOrigin.current = { x: event.clientX, y: event.clientY };
            touchActive.current = true;
            touchHeld.current = false;
            clear();
            timer.current = setTimeout(() => {
              touchHeld.current = true;
              setOpen(true);
            }, 450);
          }
        }}
        onPointerMove={(event) => {
          if (
            event.pointerType === "touch" &&
            touchActive.current &&
            (Math.abs(event.clientX - touchOrigin.current.x) > 10 ||
              Math.abs(event.clientY - touchOrigin.current.y) > 10)
          )
            clear();
        }}
        onPointerUp={(event) => {
          if (event.pointerType === "touch") {
            clear();
            touchActive.current = false;
          }
        }}
        onPointerCancel={() => {
          clear();
          touchActive.current = false;
        }}
        onClickCapture={(event) => {
          if (touchHeld.current) {
            event.preventDefault();
            event.stopPropagation();
            touchHeld.current = false;
          }
        }}
        onContextMenu={(event) => event.preventDefault()}
      >
        {cloneElement(children as ReactElement<any>, {
          "aria-describedby": open ? id : undefined,
        })}
      </span>
      {open &&
        createPortal(
          <div
            ref={panel}
            id={id}
            role="tooltip"
            aria-label={label}
            className="combat-popover"
            style={position}
            onPointerEnter={clear}
            onPointerLeave={close}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}
