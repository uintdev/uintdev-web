import path from "path";
import * as cheerio from "cheerio";

const BLOG_URL: string = "https://blog.uint.dev/";
const SELECTOR: string = ".listing .card";
const POST_LIMIT: number = 5;
const BLOG_TITLE: string = "Recent posts";
const BLOG_DESCRIPTION: string = `View all <a href="${BLOG_URL}">here</a>.`;

interface Post {
  link: string;
  title: string;
  description: string;
  metadata: string;
}

interface BlogEntryMetadata {
  title: string;
  description: string;
}

interface BlogEntry {
  metadata: BlogEntryMetadata;
  posts: Post[];
}

const blogEntryObject: BlogEntry = {
  metadata: {
    title: BLOG_TITLE,
    description: BLOG_DESCRIPTION,
  },
  posts: [],
};

const filePath: string = path.join("./src/data", "blog.json");

async function fetchPosts(): Promise<Post[]> {
  const response: Response = await fetch(BLOG_URL, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Failed to fetch ${BLOG_URL}: ${response.status} ${response.statusText}`);
  const $: cheerio.CheerioAPI = cheerio.load(await response.text());
  const cards = $(SELECTOR);

  if (!cards.length) throw new Error(`No elements found with selector '${SELECTOR}'`);

  return cards
    .slice(0, POST_LIMIT)
    .toArray()
    .map((el) => {
      const card = $(el);
      return {
        link: new URL(card.attr("href") ?? "", BLOG_URL).href,
        title: card.find(".title").eq(0).text(),
        description: card.find(".description").eq(0).text(),
        metadata: card.find(".metadata").eq(0).html() ?? "",
      };
    });
}

console.log("Fetching blog post data...");

blogEntryObject.posts = await fetchPosts();

console.log(blogEntryObject);

console.log(`Writing to ${filePath}...`);
await Bun.write(filePath, JSON.stringify(blogEntryObject, null, 2));
console.log(`Successfully wrote to ${filePath}`);

console.log("Creating build...");
