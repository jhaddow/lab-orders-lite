export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded bg-zinc-200" />
      <div className="rounded-md border bg-white">
        <div className="h-10 border-b bg-zinc-50" />
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 px-4 flex items-center">
              <div className="h-4 w-1/3 rounded bg-zinc-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
