import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";

const BLOG_URL: string = "https://blog.uint.dev";
const SELECTOR: string = ".listing .card";
const POST_LIMIT: number = 5;
const BLOG_TITLE: string = "Recent Posts";
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
  base: string;
}

interface BlogEntry {
  metadata: BlogEntryMetadata;
  posts: Post[];
}

const blogEntryObject: BlogEntry = {
  metadata: {
    title: BLOG_TITLE,
    description: BLOG_DESCRIPTION,
    base: BLOG_URL,
  },
  posts: [],
};

console.log("Fetching blog post data...");

const { data } = await axios.get(BLOG_URL);
const $: cheerio.CheerioAPI = cheerio.load(data);
const cards = $(SELECTOR);

if (!cards.length) {
  console.log(`No elements found with selector '${SELECTOR}'`);
  process.exit(1);
}

cards.each((i, el) => {
  if (i >= POST_LIMIT) return;
  const card = $(el);
  blogEntryObject.posts.push({
    link: card.attr("href") ?? "#",
    title: card.find(".title").eq(0).text(),
    description: card.find(".description").eq(0).text(),
    metadata: card.find(".metadata").eq(0).html() ?? "",
  });
});

console.log(blogEntryObject);

const filePath: string = path.join("./src/data", "blog.json");
console.log(`Writing to ${filePath}...`);
await Bun.write(filePath, JSON.stringify(blogEntryObject, null, 2));
console.log(`Successfully wrote to ${filePath}`);

console.log("Creating build...");
