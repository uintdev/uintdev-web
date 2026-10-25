import path from "path";
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import type { BlogData, BlogPost } from "./src/types/data";

const BLOG_URL: string = "https://blog.uint.dev/";
const SELECTOR: string = ".listing .card";
const POST_LIMIT: number = 5;
const BLOG_TITLE: string = "Recent posts";
const BLOG_DESCRIPTION: string = `View all <a href="${BLOG_URL}">here</a>.`;

const blogEntryObject: BlogData = {
  metadata: {
    title: BLOG_TITLE,
    description: BLOG_DESCRIPTION,
  },
  posts: [],
};

const filePath: string = path.join("./src/data", "blog.json");

function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/g, (c: string): string => `&#${c.charCodeAt(0)};`);
}

async function fetchPosts(): Promise<BlogPost[]> {
  const response: Response = await fetch(BLOG_URL, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Failed to fetch ${BLOG_URL}: ${response.status} ${response.statusText}`);
  const $: cheerio.CheerioAPI = cheerio.load(await response.text());
  const cards: cheerio.Cheerio<AnyNode> = $(SELECTOR);

  if (!cards.length) throw new Error(`No elements found with selector '${SELECTOR}'`);

  return cards
    .slice(0, POST_LIMIT)
    .toArray()
    .map((el: AnyNode): BlogPost => {
      const card: cheerio.Cheerio<AnyNode> = $(el);
      return {
        link: new URL(card.attr("href") ?? "", BLOG_URL).href,
        title: escapeHtml(card.find(".title").eq(0).text()),
        description: escapeHtml(card.find(".description").eq(0).text()),
        metadata: card.find(".metadata").eq(0).html() ?? "",
      };
    });
}

console.log("Fetching blog post data...");

try {
  blogEntryObject.posts = await fetchPosts();
} catch (e: unknown) {
  if (!(await Bun.file(filePath).exists())) throw e;
  console.warn(`${(e as Error).message} — reusing existing ${filePath}`);
  process.exit(0);
}

console.log(`Writing ${blogEntryObject.posts.length} posts to ${filePath}...`);
await Bun.write(filePath, JSON.stringify(blogEntryObject, null, 2));
console.log(`Successfully wrote to ${filePath}`);

console.log("Creating build...");
