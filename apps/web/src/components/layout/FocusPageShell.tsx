import type { ReactNode } from "react";

type FocusPageShellProps = {
  children: ReactNode;
  width?: "narrow" | "auth" | "full";
};

export function FocusPageShell({ children, width = "narrow" }: FocusPageShellProps) {
  return (
    <div className="focus-page">
      <div
        className={
          width === "auth"
            ? "site-container focus-page-inner focus-page-inner--auth"
            : width === "full"
              ? "site-container focus-page-inner focus-page-inner--full"
              : "site-container focus-page-inner"
        }
      >
        {children}
      </div>
    </div>
  );
}
