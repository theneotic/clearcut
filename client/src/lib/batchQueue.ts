export function toggleBatchQueueItem(current: Set<string>, id: string): Set<string> {
  const next = new Set(current);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export function toggleAllBatchQueueItems(current: Set<string>, ids: string[]): Set<string> {
  return current.size === ids.length ? new Set() : new Set(ids);
}
