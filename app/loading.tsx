export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-3 w-16 rounded bg-muted" />
        <div className="h-9 w-56 rounded bg-muted" />
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="h-11 border-b border-border bg-muted/40" />
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 px-5 flex items-center gap-6">
              <div className="h-3 w-1/4 rounded bg-muted" />
              <div className="h-3 w-1/6 rounded bg-muted" />
              <div className="h-3 w-1/5 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
