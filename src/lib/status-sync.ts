import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { people } from "@/lib/db/schema";
import type { EventStatus } from "@/lib/validation/event";

// Accepts both `db` and a `db.transaction()` callback's `tx` — they only need `.update()`.
type Executor = Pick<typeof db, "update">;

// Keep this rule intentionally simple (no "most recent event" check, no revert on delete):
// whenever an event is saved with a concrete statusAfter, it becomes the person's current status.
// Leaving statusAfter "undefined" (Indefinido) never changes it.
export function syncPersonStatus(tx: Executor, personId: number, status: EventStatus) {
  if (status === "undefined") return;
  tx.update(people).set({ currentStatus: status, updatedAt: new Date() }).where(eq(people.id, personId)).run();
}
