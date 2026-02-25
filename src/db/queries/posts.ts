import { db } from "..";
import { feed_follows, feeds, posts } from "../schema";
import { and, eq, sql, desc } from "drizzle-orm";
export async function createPost(post: {
  title: string;
  url: string;
  description: string | null;
  publishedAt: Date | null;
  feedId: string;
}) {
  try {
    await db.insert(posts).values(post).onConflictDoNothing();
  } catch (e) {
    console.error("Error inserting post:", e);
  }
}

export async function getPostsForUser(userId: string, limit: number = 2) {
  return await db
    .select({
      title: posts.title,
      url: posts.url,
      publishedAt: posts.publishedAt,
      feedName: feeds.name,
    })
    .from(posts)
    .innerJoin(feeds, eq(posts.feedId, feeds.id))
    .innerJoin(feed_follows, eq(feeds.id, feed_follows.feed_Id))
    .where(eq(feed_follows.user_Id, userId))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);
}
