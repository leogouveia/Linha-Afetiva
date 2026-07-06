import { blob, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", { id: integer("id").primaryKey({ autoIncrement: true }), email: text("email").notNull(), passwordHash: text("password_hash").notNull(), createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()), updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()) }, (table) => [uniqueIndex("users_email_unique").on(table.email)]);

// A person is only the identity; everything that happens lives in timelineEvents.
// avatar/avatarType: optional profile photo, stored as a blob (not a file path — see src/lib/avatar.ts).
export const people = sqliteTable("people", { id: integer("id").primaryKey({ autoIncrement: true }), name: text("name").notNull(), origin: text("origin").notNull(), avatar: blob("avatar", { mode: "buffer" }), avatarType: text("avatar_type"), createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()), updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()) });

export const tags = sqliteTable("tags", { id: integer("id").primaryKey({ autoIncrement: true }), name: text("name").notNull(), color: text("color").notNull().default("#8b5cf6"), createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()) }, (table) => [uniqueIndex("tags_name_unique").on(table.name)]);

// The unit of the timeline: date + status + tags + note. A person accumulates events over time.
// datePrecision: "day" | "month" | "year" | "approx" — how much of `date` is meaningful.
export const timelineEvents = sqliteTable("timeline_events", { id: integer("id").primaryKey({ autoIncrement: true }), personId: integer("person_id").notNull().references(() => people.id, { onDelete: "cascade" }), date: integer("date", { mode: "timestamp" }).notNull(), datePrecision: text("date_precision").notNull().default("day"), status: text("status").notNull().default("active"), note: text("note"), createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()), updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()) });

export const eventTags = sqliteTable("event_tags", { eventId: integer("event_id").notNull().references(() => timelineEvents.id, { onDelete: "cascade" }), tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }) }, (table) => [primaryKey({ columns: [table.eventId, table.tagId] })]);
