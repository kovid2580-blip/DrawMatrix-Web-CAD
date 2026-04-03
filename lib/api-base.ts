const DEFAULT_BACKEND_URL = "http://localhost:3001";

export const getBackendBaseUrl = () =>
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  DEFAULT_BACKEND_URL;

export const buildBackendUrl = (path: string) => {
  const baseUrl = getBackendBaseUrl().replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};
