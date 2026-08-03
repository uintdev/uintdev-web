import fs from "fs";

type TemplateParams = Record<string, any>;
type JsonObject = Record<string, any>;

interface CommitData {
  commitIDPartial: string;
  commitURL: string;
  commitFull: string;
}

export interface TemplateData {
  meta: JsonObject;
  contact: JsonObject[];
  project: JsonObject;
  blog: JsonObject;
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

function readJson<T = JsonObject>(path: string): T {
  return JSON.parse(readFile(path)) as T;
}

export function getTemplateData(params: TemplateParams): TemplateParams & TemplateData {
  const gitData: string = readFile(".git/FETCH_HEAD");
  const gitParts: string[] = gitData.split("\x20");

  return {
    ...params,
    meta: readJson("src/data/meta.json"),
    contact: readJson<JsonObject[]>("src/data/contact.json"),
    project: readJson("src/data/projects.json"),
    blog: readJson("src/data/blog.json"),
    aboutData: readFile("src/data/about.html"),
    commit: {
      commitIDPartial: gitData.slice(0, 7),
      commitURL: gitParts.at(-1)!.trim(),
      commitFull: gitData.split("\x09")[0],
    },
  };
}
