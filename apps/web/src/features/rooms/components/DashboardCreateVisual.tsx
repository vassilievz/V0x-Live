const DASHBOARD_CREATE_GIF = "/media/soldier.gif";

export function DashboardCreateVisual() {
  return (
    <aside className="dashboard-create-visual site-workspace-aside" aria-hidden="true">
      <div className="dashboard-create-visual__stage">
        <img
          src={DASHBOARD_CREATE_GIF}
          alt=""
          className="dashboard-create-visual__gif"
          loading="eager"
          decoding="async"
          draggable={false}
        />
        <div className="dashboard-create-visual__grain" />
        <div className="dashboard-create-visual__veil" />
        <div className="dashboard-create-visual__frame">
          <span className="dashboard-create-visual__frame-label">DB · AUX</span>
        </div>
      </div>
    </aside>
  );
}
