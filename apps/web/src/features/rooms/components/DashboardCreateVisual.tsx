import { cn } from "@/lib/cn";
import {
  dashboardCreateVisual,
  dashboardCreateVisualFrame,
  dashboardCreateVisualFrameLabel,
  dashboardCreateVisualGif,
  dashboardCreateVisualGrain,
  dashboardCreateVisualStage,
  dashboardCreateVisualVeil,
  siteWorkspaceAside,
} from "@/ui";

const DASHBOARD_CREATE_GIF = "/media/soldier.gif";

export function DashboardCreateVisual() {
  return (
    <aside className={cn(dashboardCreateVisual, siteWorkspaceAside)} aria-hidden="true">
      <div className={dashboardCreateVisualStage}>
        <img
          src={DASHBOARD_CREATE_GIF}
          alt=""
          className={dashboardCreateVisualGif}
          loading="eager"
          decoding="async"
          draggable={false}
        />
        <div className={dashboardCreateVisualGrain} />
        <div className={dashboardCreateVisualVeil} />
        <div className={dashboardCreateVisualFrame}>
          <span className={dashboardCreateVisualFrameLabel}>DB · AUX</span>
        </div>
      </div>
    </aside>
  );
}
