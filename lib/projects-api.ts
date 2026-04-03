export type RemoteProject = {
  projectId: string;
  name: string;
  content: string;
  lastModified: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  "http://localhost:3001";

export const listProjectsRemote = async (): Promise<RemoteProject[]> => {
  const response = await fetch(`${API_BASE}/projects`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load projects: ${response.status}`);
  }

  const payload = await response.json();
  return Array.isArray(payload?.projects) ? payload.projects : [];
};

export const getProjectRemote = async (
  projectId: string
): Promise<RemoteProject | null> => {
  const response = await fetch(`${API_BASE}/projects/${projectId}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to load project ${projectId}: ${response.status}`);
  }

  const payload = await response.json();
  return payload?.project || null;
};

export const saveProjectRemote = async (project: {
  id: string;
  name: string;
  content: string;
  lastModified: string;
}) => {
  const response = await fetch(`${API_BASE}/projects/${project.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: project.name,
      content: project.content,
      lastModified: project.lastModified,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to save project ${project.id}: ${response.status}`);
  }

  return response.json();
};

export const deleteProjectRemote = async (projectId: string) => {
  const response = await fetch(`${API_BASE}/projects/${projectId}`, {
    method: "DELETE",
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(
      `Failed to delete project ${projectId}: ${response.status}`
    );
  }

  return true;
};
