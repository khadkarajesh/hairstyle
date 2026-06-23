import type { ReactNode } from "react";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell-bg">
      <div className="app-shell-frame">
        {children}
      </div>
    </div>
  );
}
