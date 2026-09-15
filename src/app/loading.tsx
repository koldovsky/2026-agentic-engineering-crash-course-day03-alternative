export default function Loading() {
  return (
    <main
      className="loading-state"
      aria-busy="true"
      aria-label="Loading workspace"
    >
      <div className="loading-brand">tokenatlas</div>
      <h1>Opening your workspace…</h1>
      <div className="loading-cards" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="loading-chart" aria-hidden="true" />
    </main>
  );
}
