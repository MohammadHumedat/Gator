import { XMLParser } from "fast-xml-parser";
export type RSSFeed = {
  items: any;
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

export type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export async function fetchFeed(feedURL: string): Promise<RSSFeed> {
  const response = await fetch(feedURL, {
    headers: { "User-Agent": "gator" },
  });

  const xmlString = await response.text();

  const parser = new XMLParser();
  const rawData = parser.parse(xmlString);
  const channel = rawData.rss?.channel;
  if (!channel) {
    throw new Error("Invalid RSS feed: Missing channel field");
  }
  let items: RSSItem[] = [];
  if (channel.item) {
    if (Array.isArray(channel.item)) {
      items = channel.item;
    } else {
      items = [channel.item];
    }
  }


  return {
    channel: {
      title: channel.title || "",
      link: channel.link || "",
      description: channel.description || "",
      item: items.map(item => ({
        title: item.title || "",
        link: item.link || "",
        description: item.description || "",
        pubDate: item.pubDate || "",
      })),
    },
  };
}


