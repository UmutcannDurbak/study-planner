const STORAGE_KEY = "study-sessions";

export function loadSessions() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

export function saveSessions(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}
