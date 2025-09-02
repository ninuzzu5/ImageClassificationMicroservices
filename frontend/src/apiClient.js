import { keycloak } from "./keycloak";
const API = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

async function authFetch(path, options = {}) {
  await keycloak.updateToken(30).catch(() => keycloak.login());
  const token = keycloak.token;
  const headers = { ...(options.headers||{}), Authorization: `Bearer ${token}` };
  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (res.status === 401) await keycloak.login();
  return res;
}

export const api = {
  me: () => authFetch("/api/me").then(r => r.json()),
  classify: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const res = await authFetch("/api/classify", { method: "POST", body: form });
    return res.json();
  }
};
