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

const read: (path: string) => Promise<string> = async (
  path: string,
): Promise<string> => {
  try {
    return await Bun.file(path).text();
  } catch (e) {
    throw new Error(
      `Template data: failed to read "${path}" -- ${(e as Error).message}`,
    );
  }
};

export async function getTemplateData(
  params: Record<string, any>,
): Promise<TemplateData & Record<string, any>> {
  const [meta, contact, project, blog, aboutData, readData] = await Promise.all(
    [
      read("src/data/meta.json").then(JSON.parse),
      read("src/data/contact.json").then(JSON.parse),
      read("src/data/projects.json").then(JSON.parse),
      read("src/data/blog.json").then(JSON.parse),
      read("src/data/about.html"),
      read(".git/FETCH_HEAD"),
    ],
  );

  const parts: string[] = readData.split("\x20");
  const commit: CommitData = {
    commitIDPartial: readData.slice(0, 7),
    commitURL: parts.at(-1)!.trim(),
    commitFull: readData.split("\x09")[0],
  };

  return { ...params, meta, contact, project, blog, aboutData, commit };
}
