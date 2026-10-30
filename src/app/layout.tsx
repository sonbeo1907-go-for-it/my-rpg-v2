import type { Metadata } from "next";
import { Suspense } from "react";
import { GameProvider } from "@/runtime/game-context";
import { SettingsProvider } from "@/runtime/settings-context";
import { ControllerLayer } from "@/components/settings";
import { GameShell } from "@/components/ui";
import { getContent } from "@/runtime/content";
import "@fontsource-variable/noto-serif";
import "./globals.css";
import "./combat.css";
import "./summon.css";
import "./shop.css";
import "./controls.css";
import "./dungeon.css";
import "./quests.css";
import "./stories.css";
import "./blacksmith.css";
import "./profiles.css";
import "./skill-copy.css";
import "./equipment-ui.css";
import "./brand.css";
export const metadata: Metadata = {
  title: "The Prisma Origin",
  description:
    "Một hành trình RPG cổ điển. Những người đồng hành, những mảnh Prisma và lời hứa từ phương Bắc.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <Suspense fallback={<div className="loading">Đang mở hành trình…</div>}>
          <GameProvider content={getContent()}>
            <SettingsProvider>
              <GameShell>
                <Suspense
                  fallback={
                    <div className="loading">Đang mở trang hành trình…</div>
                  }
                >
                  {children}
                </Suspense>
              </GameShell>
              <ControllerLayer />
            </SettingsProvider>
          </GameProvider>
        </Suspense>
      </body>
    </html>
  );
}
