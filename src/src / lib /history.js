// Local-only calculation history, persisted in localStorage.
const KEY = 'math_solver_history';

export function getHistory() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToHistory(entry) {
  const hist = getHistory();
  const item = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    ...entry,
  };
  hist.unshift(item);
  const trimmed = hist.slice(0, 200);
  localStorage.setItem(KEY, JSON.stringify(trimmed));
  return trimmed;
}

export function deleteHistoryItem(id) {
  const hist = getHistory().filter((h) => h.id !== id);
  localStorage.setItem(KEY, JSON.stringify(hist));
  return hist;
}

export function clearHistory() {
  localStorage.removeItem(KEY);
}
