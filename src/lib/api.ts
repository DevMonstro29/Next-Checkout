/**
 * URL base da API. Em produção (frontend separado), use VITE_API_URL.
 * Em desenvolvimento local, usa '' (requisições relativas /api via proxy).
 */
export const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${p}` : p;
}
