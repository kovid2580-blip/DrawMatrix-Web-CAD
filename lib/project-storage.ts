export interface StoredProject {
  id: string;
  name: string;
  content: string;
  lastModified: string;
}

export interface ProjectListItem {
  id?: string;
  projectId?: string;
  name: string;
  content?: string;
  lastModified?: string;
  updatedAt?: string;
  createdAt?: string;
}

const STORAGE_KEY = "dm_projects";

export const normalizeProjectListPayload = (
  payload: unknown
): ProjectListItem[] => {
  if (Array.isArray(payload)) return payload;
  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { projects?: ProjectListItem[] }).projects)
  ) {
    return (payload as { projects: ProjectListItem[] }).projects;
  }
  return [];
};

export const getLocalProjects = (): StoredProject[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.sort(
      (a: StoredProject, b: StoredProject) =>
        new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );
  } catch (error) {
    console.error("Failed to read local projects:", error);
    return [];
  }
};

export const getLocalProjectById = (
  projectId: string
): StoredProject | null => {
  return getLocalProjects().find((project) => project.id === projectId) || null;
};

export const saveLocalProject = (project: StoredProject) => {
  if (typeof window === "undefined") return;

  const projects = getLocalProjects();
  const existingIndex = projects.findIndex((item) => item.id === project.id);

  if (existingIndex >= 0) {
    projects[existingIndex] = project;
  } else {
    projects.push(project);
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
};

export const deleteLocalProject = (projectId: string) => {
  if (typeof window === "undefined") return;

  const projects = getLocalProjects().filter(
    (project) => project.id !== projectId
  );
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
};

export const renameLocalProject = (projectId: string, name: string) => {
  if (typeof window === "undefined") return;

  const projects = getLocalProjects().map((project) =>
    project.id === projectId
      ? { ...project, name, lastModified: new Date().toISOString() }
      : project
  );

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
};
