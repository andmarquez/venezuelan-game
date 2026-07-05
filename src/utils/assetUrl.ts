/** Resolve public asset paths for Vite base URL (e.g. GitHub Pages subpath). */
export function assetUrl(path: string, cacheBust?: string): string {
  const base = import.meta.env.BASE_URL;
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  const url = `${base}${normalized}`;
  if (!cacheBust) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${encodeURIComponent(cacheBust)}`;
}
