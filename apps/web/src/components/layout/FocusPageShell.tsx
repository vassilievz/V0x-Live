import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  focusPage,
  focusPageInner,
  focusPageInnerAuth,
  focusPageInnerFull,
} from "@/ui";

type FocusPageShellProps = {
  children: ReactNode;
  width?: "narrow" | "auth" | "full";
};

export function FocusPageShell({ children, width = "narrow" }: FocusPageShellProps) {
  return (
    <div className={focusPage}>
      <div
        className={cn(
          "site-container",
          focusPageInner,
          width === "auth" && focusPageInnerAuth,
          width === "full" && focusPageInnerFull,
        )}
      >
        {children}
      </div>
    </div>
  );
}
