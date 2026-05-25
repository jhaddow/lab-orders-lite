const STATUS_STYLES: Record<string, string> = {
  PENDING: "border-primary/30 bg-primary/8 text-primary",
  IN_PROGRESS: "border-amber-500/30 bg-amber-500/10 text-amber-700",
  COMPLETED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  CANCELLED: "border-muted-foreground/30 bg-muted text-muted-foreground",
};

export function statusBadgeClass(status: string): string {
  return STATUS_STYLES[status] ?? "border-primary/30 bg-primary/8 text-primary";
}

export function statusLabel(status: string): string {
  return status.replace("_", " ");
}
