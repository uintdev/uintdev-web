import fs from "fs";
import path from "path";
import type { BlogData, Contact, Meta, ProjectData } from "../types/data";

type TemplateParams = Record<string, unknown>;

interface CommitData {
  id: string;
  url: string;
}

interface PackageJson {
  repository: {
    url: string;
  };
}

export interface TemplateData {
  meta: Meta;
  previewImage: string;
  contact: Contact[];
  project: ProjectData;
  blog: BlogData;
  aboutData: string;
  commit: CommitData;
}

const UNKNOWN_COMMIT: CommitData = { id: "unknown", url: "#" };
const COMMIT_HASH_PATTERN: RegExp = /^[0-9a-f]{40}([0-9a-f]{24})?$/;

function readFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (e: unknown) {
    throw new Error(`[Template] failed to read "${filePath}": ${(e as Error).message}`);
  }
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFile(filePath)) as T;
}

function findGitDir(): string {
  if (!fs.existsSync(".git")) throw new Error(`[Template] no ".git" found`);
  if (fs.statSync(".git").isDirectory()) return ".git";

  const match: RegExpMatchArray | null = readFile(".git").match(/^gitdir: (.+)$/m);
  if (!match?.[1]) throw new Error(`[Template] ".git" file does not point to a git directory`);
  return path.resolve(match[1].trim());
}

function readCommitHash(): string {
  const gitDir: string = findGitDir();
  const head: string = readFile(path.join(gitDir, "HEAD")).trim();
  if (!head.startsWith("ref: ")) return head;

  const commonDirFile: string = path.join(gitDir, "commondir");
  const commonDir: string = fs.existsSync(commonDirFile)
    ? path.resolve(gitDir, readFile(commonDirFile).trim())
    : gitDir;

  const ref: string = head.slice("ref: ".length);
  const looseRef: string = path.join(commonDir, ref);
  if (fs.existsSync(looseRef)) return readFile(looseRef).trim();

  const packedLine: string | undefined = readFile(path.join(commonDir, "packed-refs"))
    .split("\n")
    .find((line: string): boolean => line.endsWith(` ${ref}`));
  if (!packedLine) throw new Error(`[Template] ref "${ref}" not found`);
  return packedLine.split(" ")[0]!;
}

function getCommitData(): CommitData {
  try {
    const hash: string = readCommitHash();
    if (!COMMIT_HASH_PATTERN.test(hash)) throw new Error(`[Template] invalid commit hash "${hash}"`);

    const repoUrl: string = readJson<PackageJson>("package.json")
      .repository.url.replace(/^git\+/, "")
      .replace(/\.git$/, "");

    return { id: hash.slice(0, 7), url: `${repoUrl}/commit/${hash}` };
  } catch (e: unknown) {
    console.warn(`${(e as Error).message} — using placeholder commit link`);
    return UNKNOWN_COMMIT;
  }
}

export function getErrorPageTemplateData(params: TemplateParams): TemplateParams & Pick<TemplateData, "meta"> {
  return {
    ...params,
    meta: readJson<Meta>("src/data/meta.json"),
  };
}

export function getTemplateData(params: TemplateParams): TemplateParams & TemplateData {
  const meta: Meta = readJson<Meta>("src/data/meta.json");

  return {
    ...params,
    meta,
    previewImage: new URL(meta.favicon, meta.url).href,
    contact: readJson<Contact[]>("src/data/contact.json"),
    project: readJson<ProjectData>("src/data/projects.json"),
    blog: readJson<BlogData>("src/data/blog.json"),
    aboutData: readFile("src/data/about.html"),
    commit: getCommitData(),
  };
}
