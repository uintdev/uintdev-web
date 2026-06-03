import fs from "fs";

interface CommitData {
  commitIDPartial: string;
  commitURL: string;
  commitFull: string;
}

export interface TemplateData {
  meta: Object;
  contact: Object;
  project: Object;
  blog: Object;
  aboutData: string;
  commit: CommitData;
}

function readFile(path: string): string {
  try {
    return fs.readFileSync(path, "utf8");
  } catch (e) {
    throw new Error(
      `[Template] failed to read "${path}": ${(e as Error).message}`,
    );
  }
}

export function getTemplateData(
  params: Record<string, any>,
): TemplateData & Record<string, any> {
  const meta: object = JSON.parse(readFile("src/data/meta.json"));
  const contact: object = JSON.parse(readFile("src/data/contact.json"));
  const project: object = JSON.parse(readFile("src/data/projects.json"));
  const blog: object = JSON.parse(readFile("src/data/blog.json"));
  const aboutData: string = readFile("src/data/about.html");

  const readData: string = readFile(".git/FETCH_HEAD");
  const parts: string[] = readData.split("\x20");
  return {
    ...params,
    meta,
    contact,
    project,
    blog,
    aboutData,
    commit: {
      commitIDPartial: readData.slice(0, 7),
      commitURL: parts.at(-1)!.trim(),
      commitFull: readData.split("\x09")[0],
    },
  };
}
