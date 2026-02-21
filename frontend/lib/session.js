export function saveSession(session) {
  localStorage.setItem("sense_session", JSON.stringify(session));
}

export function getSession() {
  const s = localStorage.getItem("sense_session");
  return s ? JSON.parse(s) : null;
}

export function clearSession() {
  localStorage.removeItem("sense_session");
}
