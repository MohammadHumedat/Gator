import { pgTable, timestamp, uuid, text, unique } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  name: text("name").notNull().unique(),
});

export const feeds = pgTable("feeds", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  name: text("name").notNull(),
  url: text("url").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
    lastFetchedAt: timestamp("last_fetched_at"),
});

export const feed_follows = pgTable(
  "feed_follows",
  {
    id: uuid("id").primaryKey().unique().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    user_Id: uuid("user_Id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    feed_Id: uuid("feed_Id")
      .notNull()
      .references(() => feeds.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqueUserFeed: unique().on(table.user_Id, table.feed_Id),
  }),
);

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  title: text("title").notNull(),
  url: text("url").notNull().unique(), 
  description: text("description"),
  publishedAt: timestamp("published_at"),
  feedId: uuid("feed_id")
    .notNull()
    .references(() => feeds.id, { onDelete: "cascade" }),
});

export type Post = typeof posts.$inferSelect;

export type User = typeof users.$inferSelect;
export type Feed = typeof feeds.$inferSelect;
export type feed_follows = typeof feed_follows.$inferInsert;
