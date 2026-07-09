const KEY = 'rs_search_history';
const MAX_ENTRIES = 10;

export const getSearchHistory = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
};

export const addSearchTerm = (term: string): void => {
  if (typeof window === 'undefined') return;
  const trimmed = term.trim();
  if (!trimmed) return;
  const existing = getSearchHistory().filter(t => t.toLowerCase() !== trimmed.toLowerCase());
  const next = [trimmed, ...existing].slice(0, MAX_ENTRIES);
  localStorage.setItem(KEY, JSON.stringify(next));
};

export const clearSearchHistory = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
};
