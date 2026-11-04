/**
 * Utility for managing SPA URL routes in Think Green Platform,
 * fully supporting GitHub Pages sub-directories (e.g. https://suitehub.github.io/thinkgreenplatform/contabil)
 * as well as root-domain hosting.
 */

const KNOWN_ROUTES = [
  'contabil',
  'accounting',
  'secretaria',
  'recepcao',
  'financeiro',
  'professor',
  'aluno',
  'orientacao',
  'admin',
] as const;

export type AppRouteName = typeof KNOWN_ROUTES[number] | '';

const BASE_PATH_STORAGE_KEY = 'tg_app_base_path';

/**
 * Detects and returns the application base path (e.g. "/thinkgreenplatform" or "").
 * Automatically checks window.location and persists in sessionStorage.
 */
export function getAppBasePath(): string {
  try {
    if (typeof window === 'undefined') return '';

    // Check cached base path first
    const cached = sessionStorage.getItem(BASE_PATH_STORAGE_KEY);
    if (cached !== null) {
      return cached;
    }

    const pathname = window.location.pathname;

    // Explicit check for known repo name thinkgreenplatform
    if (pathname.includes('/thinkgreenplatform')) {
      const detected = '/thinkgreenplatform';
      sessionStorage.setItem(BASE_PATH_STORAGE_KEY, detected);
      return detected;
    }

    // Split segments and detect if the first segment is a repository/subfolder
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length > 0) {
      const firstSegment = segments[0].toLowerCase();
      // If the first segment is NOT one of our known routes and NOT a file extension (like index.html)
      if (!KNOWN_ROUTES.includes(firstSegment as any) && !firstSegment.includes('.')) {
        const detected = '/' + segments[0];
        sessionStorage.setItem(BASE_PATH_STORAGE_KEY, detected);
        return detected;
      }
    }

    sessionStorage.setItem(BASE_PATH_STORAGE_KEY, '');
    return '';
  } catch {
    return '';
  }
}

/**
 * Constructs the application path preserving base path (e.g. "/thinkgreenplatform/contabil").
 */
export function buildAppPath(subroute: string): string {
  const base = getAppBasePath();
  const cleanRoute = subroute.replace(/^\/+|\/+$/g, '');
  if (!cleanRoute) {
    return base || '/';
  }
  return base ? `${base}/${cleanRoute}` : `/${cleanRoute}`;
}

/**
 * Returns the full absolute URL for a subroute (e.g. "https://suitehub.github.io/thinkgreenplatform/contabil").
 */
export function getFullAppUrl(subroute: string): string {
  try {
    if (typeof window === 'undefined') return subroute;
    const path = buildAppPath(subroute);
    return `${window.location.origin}${path}`;
  } catch {
    return subroute;
  }
}

/**
 * Updates browser history URL with the subroute while maintaining GitHub Pages base path.
 */
export function updateAppRoute(subroute: string, stateObj: Record<string, any> = {}): void {
  try {
    if (typeof window === 'undefined') return;
    const targetPath = buildAppPath(subroute);
    if (window.location.pathname !== targetPath) {
      window.history.replaceState({ ...stateObj, route: subroute }, '', targetPath);
    }
  } catch (err) {
    console.warn('[URL] Unable to update browser history:', err);
  }
}

/**
 * Parses current route from pathname, search, and hash.
 */
export function parseAppRoute(): string {
  try {
    if (typeof window === 'undefined') return '';
    const pathname = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();

    // 1. Check path segments
    const segments = pathname.split('/').filter(Boolean);
    for (const segment of segments) {
      if (KNOWN_ROUTES.includes(segment as any)) {
        return segment === 'accounting' ? 'contabil' : segment;
      }
    }

    // 2. Check search params (e.g. ?/contabil or ?route=contabil from 404 SPA redirect)
    if (search.includes('contabil') || search.includes('accounting')) return 'contabil';
    if (search.includes('secretaria')) return 'secretaria';
    if (search.includes('recepcao')) return 'recepcao';
    if (search.includes('financeiro')) return 'financeiro';
    if (search.includes('professor')) return 'professor';
    if (search.includes('aluno')) return 'aluno';
    if (search.includes('orientacao')) return 'orientacao';
    if (search.includes('admin')) return 'admin';

    // 3. Check hash (e.g. #/contabil or #contabil)
    if (hash.includes('contabil') || hash.includes('accounting')) return 'contabil';
    if (hash.includes('secretaria')) return 'secretaria';
    if (hash.includes('recepcao')) return 'recepcao';
    if (hash.includes('financeiro')) return 'financeiro';
    if (hash.includes('professor')) return 'professor';
    if (hash.includes('aluno')) return 'aluno';
    if (hash.includes('orientacao')) return 'orientacao';
    if (hash.includes('admin')) return 'admin';

    return '';
  } catch {
    return '';
  }
}
