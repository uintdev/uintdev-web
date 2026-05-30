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

export function getTemplateData(): TemplateData {
  const meta: Object = JSON.parse(
    fs.readFileSync("src/data/meta.json", "utf8"),
  );
  const contact: Object = JSON.parse(
    fs.readFileSync("src/data/contact.json", "utf8"),
  );
  const project: Object = JSON.parse(
    fs.readFileSync("src/data/projects.json", "utf8"),
  );
  const blog: Object = JSON.parse(
    fs.readFileSync("src/data/blog.json", "utf8"),
  );

  let aboutData: string = "unknown_data";
  const aboutPath: string = "src/data/about.html";
  try {
    aboutData = fs.readFileSync(aboutPath, "utf8");
  } catch (e) {
    console.error("Failed to access file:", e);
  }

  let commitIDPartial: string = "unknown";
  let commitURL: string = "";
  let commitFull: string = "";
  const commitPath: string = ".git/FETCH_HEAD";
  try {
    const readData: string = fs.readFileSync(commitPath, "utf8");
    commitIDPartial = readData.slice(0, 7);
    const parts: string[] = readData.split("\x20");
    commitURL = parts[parts.length - 1].trim();
    commitFull = readData.split("\x09")[0];
  } catch (e) {
    console.error("Failed to access file:", e);
  }

  let commit: CommitData = {
    commitIDPartial,
    commitURL,
    commitFull,
  };

  return {
    meta,
    contact,
    project,
    blog,
    aboutData,
    commit,
  };
}
