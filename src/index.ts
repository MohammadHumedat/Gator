import { readConfig, setUser, Config } from "./config";
import {
  createUser,
  getUserByName,
  getUsers,
  resetUsers,
} from "./db/queries/users";
import { Feed, users } from "./db/schema";
import { fetchFeed } from "./rss";
import {
  createFeed,
  createFeedFollow,
  deleteFeedFollow,
  getAllFeeds,
  getFeedByUrl,
  getFeedFollowsForUser,
  getNextFeedToFetch,
  markFeedFetched,
} from "./db/queries/feeds";
import { createPost, getPostsForUser } from "./db/queries/posts";

type User = typeof users.$inferSelect;

type CommandHandler = (
  state: Config,
  cmdName: string,
  ...args: string[]
) => Promise<void>;

interface CommandsRegistry {
  [key: string]: CommandHandler;
}

type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]
) => Promise<void>;

function middlewareLoggedIn(handler: UserCommandHandler): CommandHandler {
  return async (state: Config, cmdName: string, ...args: string[]) => {
    const username = state.currentUserName;
    if (!username) {
      throw new Error("You must be logged in to perform this action.");
    }
    const user = await getUserByName(username);
    if (!user) {
      throw new Error(`User ${username} not found in the database.`);
    }

    return await handler(cmdName, user, ...args);
  };
}

async function registerCommand(
  registry: CommandsRegistry,
  cmdName: string,
  handler: CommandHandler,
) {
  registry[cmdName] = handler;
}

async function runCommand(
  registry: CommandsRegistry,
  state: Config,
  cmdName: string,
  ...args: string[]
) {
  const handler = registry[cmdName];
  if (!handler) {
    throw new Error(`Unknown command: ${cmdName}`);
  }
  await handler(state, cmdName, ...args);
}

async function handlerLogin(
  state: Config,
  cmdName: string,
  ...args: string[]
): Promise<void> {
  if (args.length === 0) throw new Error("A username is required to login.");
  const name = args[0];
  const user = await getUserByName(name);
  if (!user) throw new Error(`User '${name}' does not exist.`);
  setUser(user.name);
  console.log(`User has been set to: ${user.name}`);
}

async function handlerRegister(
  state: Config,
  cmdName: string,
  ...args: string[]
) {
  if (args.length === 0) throw new Error("A username is required to register.");
  const name = args[0];
  const existingUser = await getUserByName(name);
  if (existingUser) throw new Error("The user is already exist");
  const user = await createUser(name);
  setUser(user.name);
  console.log("User was created successfully!", user);
}

async function handlerAddFeed(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  if (args.length < 2) throw new Error("Usage: addfeed <name> <url>");
  const name = args[0];
  const url = args[1];

  const feed = await createFeed(name, url, user.id);
  console.log("Feed created successfully:");

  console.log(`* Name: ${feed.name} | URL: ${feed.url}`);

  const follow = await createFeedFollow(user.id, feed.id);
  console.log(`Feed followed: ${follow.feedName} by ${follow.userName}`);
}

async function handlerFollowing(
  cmdName: string,
  user: User,
  ...args: string[]
) {
  const follows = await getFeedFollowsForUser(user.id);
  console.log(`User ${user.name} follows:`);
  follows.forEach((f) => console.log(`* ${f.feedName}`));
}

async function handlerFollow(cmdName: string, user: User, ...args: string[]) {
  if (args.length < 1) throw new Error("Usage: follow <url>");
  const feed = await getFeedByUrl(args[0]);
  if (!feed) throw new Error("Feed not found.");
  const { feedName, userName } = await createFeedFollow(user.id, feed.id);
  console.log(`User ${userName} is now following ${feedName}`);
}

async function resetHandler(state: Config, cmdName: string) {
  await resetUsers();
  console.log("Database reset successfully!");
}

async function handlerUsers(state: Config) {
  const allUsers = await getUsers();
  allUsers.forEach((u) =>
    console.log(
      `* ${u.name}${u.name === state.currentUserName ? " (current)" : ""}`,
    ),
  );
}

async function handlerAgg(state: Config, cmdName: string, ...args: string[]) {
  if (args.length < 1) throw new Error("Usage: agg <time_between_reqs>");

  const timeBetweenRequests = parseDuration(args[0]);
  console.log(`Collecting feeds every ${args[0]}...`);

  scrapeFeeds().catch((err) => console.error(`Error: ${err}`));

  const interval = setInterval(() => {
    scrapeFeeds().catch((err) => console.error(`Error: ${err}`));
  }, timeBetweenRequests);

  await new Promise<void>((resolve) => {
    process.on("SIGINT", () => {
      console.log("\nShutting down feed aggregator...");
      clearInterval(interval);
      resolve();
    });
  });
}

async function handlerListFeeds() {
  const feeds = await getAllFeeds();
  feeds.forEach((f) =>
    console.log(`* ${f.feedName} (${f.feedUrl}) - By: ${f.userName}`),
  );
}

async function handlerUnfollow(cmdName: string, user: User, ...args: string[]) {
  if (args.length < 1) throw new Error("Usage: unfollow <url>");

  const url = args[0];

  await deleteFeedFollow(user.id, url);
  console.log(`Successfully unfollowed: ${url}`);
}
function parseDuration(durationStr: string): number {
  const regex = /^(\d+)(ms|s|m|h)$/;
  const match = durationStr.match(regex);
  if (!match) throw new Error(`Invalid duration format: ${durationStr}`);

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case "ms":
      return value;
    case "s":
      return value * 1000;
    case "m":
      return value * 1000 * 60;
    case "h":
      return value * 1000 * 60 * 60;
    default:
      return 0;
  }
}
async function scrapeFeeds() {
  const feedRecord = await getNextFeedToFetch();
  if (!feedRecord) return;

  await markFeedFetched(feedRecord.id);
  const feedData = await fetchFeed(feedRecord.url);

  for (const item of feedData.items) {
    const pubDate = item.pubDate ? new Date(item.pubDate) : null;

    await createPost({
      title: item.title,
      url: item.link,
      description: item.description || null,
      publishedAt: pubDate,
      feedId: feedRecord.id,
    });
  }
  console.log(`Synced ${feedData.items.length} posts from ${feedRecord.name}`);
}
async function handlerBrowse(cmdName: string, user: User, ...args: string[]) {
  const limit = args.length > 0 ? parseInt(args[0]) : 2;

  const userPosts = await getPostsForUser(user.id, limit);

  if (userPosts.length === 0) {
    console.log(
      "No posts found. Try adding/following more feeds and running 'agg'.",
    );
    return;
  }

  console.log(`--- Showing latest ${userPosts.length} posts ---`);
  userPosts.forEach((p) => {
    console.log(`\n[${p.feedName}] ${p.title}`);
    console.log(`Link: ${p.url}`);
    console.log(`Published: ${p.publishedAt?.toLocaleString()}`);
    console.log("-".repeat(20));
  });
}
async function main() {
  const registry: CommandsRegistry = {};

  await registerCommand(registry, "register", handlerRegister);
  await registerCommand(registry, "login", handlerLogin);
  await registerCommand(registry, "reset", resetHandler);
  await registerCommand(registry, "users", handlerUsers);
  await registerCommand(registry, "agg", handlerAgg);
  await registerCommand(registry, "feeds", handlerListFeeds);
  await registerCommand(registry, "browse", middlewareLoggedIn(handlerBrowse));
  await registerCommand(
    registry,
    "unfollow",
    middlewareLoggedIn(handlerUnfollow),
  );

  await registerCommand(
    registry,
    "addfeed",
    middlewareLoggedIn(handlerAddFeed),
  );
  await registerCommand(registry, "follow", middlewareLoggedIn(handlerFollow));
  await registerCommand(
    registry,
    "following",
    middlewareLoggedIn(handlerFollowing),
  );

  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error("Error: Not enough arguments.");
    process.exit(1);
  }

  try {
    const config = readConfig();
    await runCommand(registry, config, args[0], ...args.slice(1));
    process.exit(0);
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
