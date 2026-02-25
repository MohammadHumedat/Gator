import { db } from "..";
import { feeds, feed_follows, users, Feed } from "../schema";
import { and, eq, sql } from "drizzle-orm";
export async function createFeed(name: string, url: string, userId: string) {
  const [result] = await db
    .insert(feeds)
    .values({
      name,
      url,
      userId,
    })
    .returning();
  return result;
}

export async function getAllFeeds() {
  return await db
    .select({ feedName: feeds.name, feedUrl: feeds.url, userName: users.name })
    .from(feeds)
    .innerJoin(users, eq(feeds.userId, users.id));
}
export async function getFeedByUrl(url: string) {
  const [feed] = await db.select().from(feeds).where(eq(feeds.url, url));
  return feed;
}

export async function createFeedFollow(user_Id: string, feed_Id: string) {
  const [newFollow] = await db
    .insert(feed_follows)
    .values({
      user_Id: user_Id,
      feed_Id: feed_Id,
    })
    .returning();

  const [result] = await db
    .select({
      feedName: feeds.name,
      userName: users.name,
    })
    .from(feed_follows)
    .innerJoin(feeds, eq(feed_follows.feed_Id, feeds.id))
    .innerJoin(users, eq(feed_follows.user_Id, users.id))
    .where(eq(feed_follows.id, newFollow.id));

  return result;
}

export async function getFeedFollowsForUser(userId: string) {
  return await db
    .select({
      feedName: feeds.name,
      userName: users.name,
    })
    .from(feed_follows)
    .innerJoin(feeds, eq(feed_follows.feed_Id, feeds.id))
    .innerJoin(users, eq(feed_follows.user_Id, users.id))
    .where(eq(feed_follows.user_Id, userId));
}

export async function deleteFeedFollow(userId: string, feedUrl: string) {
  const feed = await getFeedByUrl(feedUrl);
  if (!feed) {
    throw new Error(`Feed with URL '${feedUrl}' not found.`);
  }

  await db
    .delete(feed_follows)
    .where(
      and(eq(feed_follows.user_Id, userId), eq(feed_follows.feed_Id, feed.id)),
    );
}

export async function markFeedFetched(feedId: string ) {
  await db.update(feeds).set({
    lastFetchedAt: new Date(),
      updatedAt: new Date()
  }).where(eq(feeds.id,feedId));
}

export async function getNextFeedToFetch() {
  const [nextFeed] = await db
    .select()
    .from(feeds)
    .orderBy(sql`${feeds.lastFetchedAt} ASC NULLS FIRST`)
    .limit(1);
  return nextFeed;
}