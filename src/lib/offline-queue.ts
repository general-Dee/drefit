// Queue of workout completions made while offline. Stored in localStorage
// and replayed when the browser comes back online. Each entry has a client
// id that the server uses as the document id, so a replay is idempotent.

export interface QueuedCompletion {
  clientId: string
  workoutId: string
  completedAt: string
}

export const QUEUE_KEY = "drefit:pending-completions"
export const QUEUE_EVENT = "drefit:queue-changed"

export interface KV {
  getItem(k: string): string | null
  setItem(k: string, v: string): void
}

export function readQueue(store: KV): QueuedCompletion[] {
  try {
    const parsed = JSON.parse(store.getItem(QUEUE_KEY) ?? "[]")
    return Array.isArray(parsed) ? parsed.filter((e) => e && typeof e.clientId === "string" && typeof e.workoutId === "string") : []
  } catch {
    return []
  }
}

export function writeQueue(store: KV, queue: QueuedCompletion[]): void {
  store.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function newClientId(rand: () => string = () => crypto.randomUUID()): string {
  // Appwrite ids: <=36 chars of [a-zA-Z0-9._-], not starting with a special char.
  return `c${rand().replace(/-/g, "")}`.slice(0, 36)
}

export function enqueueCompletion(store: KV, entry: QueuedCompletion): QueuedCompletion[] {
  const queue = readQueue(store)
  if (!queue.some((q) => q.clientId === entry.clientId)) queue.push(entry)
  writeQueue(store, queue)
  return queue
}

type Poster = (entry: QueuedCompletion) => Promise<{ ok: boolean; status: number }>

// Replays the queue in order. Entries are removed on success, on 409
// (already synced) and on permanent 4xx errors; network errors and 5xx keep
// the entry for the next attempt.
export async function flushQueue(store: KV, post: Poster): Promise<{ synced: number; remaining: number }> {
  const queue = readQueue(store)
  const remaining: QueuedCompletion[] = []
  let synced = 0
  for (const entry of queue) {
    try {
      const res = await post(entry)
      if (res.ok || res.status === 409) synced += 1
      else if (res.status >= 500 || res.status === 429 || res.status === 401) remaining.push(entry)
      // other 4xx (e.g. 402 lapsed subscription, 400 invalid): drop
    } catch {
      remaining.push(entry)
    }
  }
  writeQueue(store, remaining)
  return { synced, remaining: remaining.length }
}

export function postCompletion(entry: QueuedCompletion) {
  return fetch(`/api/workouts/${encodeURIComponent(entry.workoutId)}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId: entry.clientId, completedAt: entry.completedAt }),
  }).then((r) => ({ ok: r.ok, status: r.status }))
}

export function isNetworkError(err: unknown): boolean {
  return err instanceof TypeError || (typeof navigator !== "undefined" && navigator.onLine === false)
}
