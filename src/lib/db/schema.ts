import { blob, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", { id: integer("id").primaryKey({ autoIncrement: true }), email: text("email").notNull(), passwordHash: text("password_hash").notNull(), createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()), updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()) }, (table) => [uniqueIndex("users_email_unique").on(table.email)]);

// A person is identity + relationship-level summary (currentStatus/started/ended/howEnded/generalNotes).
// What happens over time lives in timelineEvents; currentStatus is kept in sync from each event's
// status unless the event leaves it "undefined" (see src/lib/validation/event.ts).
// avatar/avatarType: optional profile photo, stored as a blob (not a file path — see src/lib/avatar.ts).
export const people = sqliteTable("people", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  origin: text("origin").notNull(),
  avatar: blob("avatar", { mode: "buffer" }),
  avatarType: text("avatar_type"),
  currentStatus: text("current_status").notNull().default("undefined"),
  startedAt: integer("started_at", { mode: "timestamp" }),
  endedAt: integer("ended_at", { mode: "timestamp" }),
  howEnded: text("how_ended"),
  generalNotes: text("general_notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// scope: "relationship" | "event" | "both" — which picker(s) offer this tag (src/lib/validation/tag.ts).
// label is an optional display name; UI falls back to `name` when absent.
// category: optional free-text grouping (e.g. "afeto-conexao", "conflito-desconforto") used to
// section the tag list in /app/tags once it grows past a flat scan — not a fixed enum, just a
// label of convenience from whatever taxonomy the tags were seeded with.
export const tags = sqliteTable(
  "tags",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    label: text("label"),
    scope: text("scope").notNull().default("both"),
    color: text("color").notNull().default("#8b5cf6"),
    category: text("category"),
    description: text("description"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }),
  },
  (table) => [uniqueIndex("tags_name_unique").on(table.name)]
);

// Relationship-scope tags attached to a person directly (the dynamic, not a specific occurrence).
export const personTags = sqliteTable("person_tags", { personId: integer("person_id").notNull().references(() => people.id, { onDelete: "cascade" }), tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }) }, (table) => [primaryKey({ columns: [table.personId, table.tagId] })]);

// The unit of the timeline: date + status + tags + note, now enriched with what happened (title,
// type, channel, location, tone, outcome). A person accumulates events over time.
// datePrecision: "day" | "month" | "year" | "approx" — how much of `date` is meaningful.
// status doubles as "statusAfter": relationship status right after this event. "undefined" means
// not specified and must not overwrite people.currentStatus (see src/lib/validation/event.ts).
// description reuses the existing "note" column — same data, clearer name at the ORM/API level.
export const timelineEvents = sqliteTable("timeline_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  personId: integer("person_id").notNull().references(() => people.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  datePrecision: text("date_precision").notNull().default("day"),
  title: text("title"),
  description: text("note"),
  eventType: text("event_type"),
  channel: text("channel"),
  locationType: text("location_type"),
  emotionalTone: text("emotional_tone"),
  outcome: text("outcome"),
  status: text("status").notNull().default("active"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const eventTags = sqliteTable("event_tags", { eventId: integer("event_id").notNull().references(() => timelineEvents.id, { onDelete: "cascade" }), tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }) }, (table) => [primaryKey({ columns: [table.eventId, table.tagId] })]);
