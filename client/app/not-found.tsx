export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-app-bg px-6 text-app-text">
      <div className="max-w-md rounded-[28px] border border-white/8 bg-surface-1/90 p-10 text-center shadow-panel-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-app-text-subtle">
          404
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          Page not found
        </h1>
        <p className="mt-4 text-sm leading-6 text-app-text-muted">
          The requested route does not exist in the BetterYT control room.
        </p>
      </div>
    </main>
  );
}
