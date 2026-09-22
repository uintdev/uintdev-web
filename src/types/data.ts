export interface Meta {
  keywords: string;
  name: string;
  title: string;
  description: string;
  url: string;
  favicon: string;
  theme: string;
}

export interface Contact {
  name: string;
  url: string;
}

export interface SectionMetadata {
  title: string;
  description: string;
}

export interface Project {
  name: string;
  description: string;
  url: string;
  tags: string[];
}

export interface ProjectData {
  metadata: SectionMetadata;
  list: Project[];
}

export interface BlogPost {
  link: string;
  title: string;
  description: string;
  metadata: string;
}

export interface BlogData {
  metadata: SectionMetadata;
  posts: BlogPost[];
}
