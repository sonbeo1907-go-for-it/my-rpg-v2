import type { ReactNode } from "react";
export function QuestLayout({ children }: { children: ReactNode }) {
  return <div className="quest-layout">{children}</div>;
}
export function QuestIllustration({
  children,
  art,
  header,
}: {
  children: ReactNode;
  art?: string;
  header?: ReactNode;
}) {
  return (
    <section className="quest-illustration">
      <div
        className="scene-background quest-background"
        style={art ? { backgroundImage: `url(${art})` } : undefined}
      />
      {header && <div className="quest-illustration-top">{header}</div>}
      <div className="quest-illustration-content">{children}</div>
    </section>
  );
}
