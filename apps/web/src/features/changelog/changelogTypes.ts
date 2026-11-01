export type ChangelogSectionType = "fix" | "improvement" | "security";

export type ChangelogSection = {
  type: ChangelogSectionType;
  items: string[];
};

export type ChangelogRelease = {
  id: string;
  date: string;
  title: string;
  version?: string;
  sections: ChangelogSection[];
};

export type ChangelogDocument = {
  releases: ChangelogRelease[];
};
