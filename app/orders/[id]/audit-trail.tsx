import { listAuditEntriesForEntity } from "@/features/audit/repo";

const ACTION_LABELS: Record<string, string> = {
  ORDER_CREATED: "Order created",
  ORDER_STATUS_CHANGED: "Status changed",
};

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

function describeMetadata(action: string, metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const m = metadata as Record<string, unknown>;
  if (action === "ORDER_STATUS_CHANGED") {
    const from = typeof m.from === "string" ? m.from : "?";
    const to = typeof m.to === "string" ? m.to : "?";
    const reason = typeof m.reason === "string" ? ` — "${m.reason}"` : "";
    return `${from} → ${to}${reason}`;
  }
  return null;
}

export async function AuditTrail({ orderId }: { orderId: string }) {
  const entries = await listAuditEntriesForEntity("Order", orderId);
  if (entries.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg tracking-tight">Activity</h2>
      <ol className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
        {entries.map((e) => {
          const detail = describeMetadata(e.action, e.metadata);
          return (
            <li key={e.id} className="px-5 py-3.5 flex items-baseline justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm text-foreground">
                  {ACTION_LABELS[e.action] ?? e.action}
                  {detail && (
                    <span className="ml-2 text-muted-foreground tabular-nums">{detail}</span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  by {e.actor.name}{" "}
                  <span className="text-muted-foreground/70">({e.actor.role})</span>
                </div>
              </div>
              <time className="text-xs text-muted-foreground tabular-nums shrink-0">
                {formatDate(e.createdAt)}
              </time>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
