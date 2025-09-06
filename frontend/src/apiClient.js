// // src/apiClient.js
// import { keycloak } from "./keycloak";
// const API = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

// async function authFetch(path, options = {}, requireAuth = true) {
//   const headers = { ...(options.headers || {}) };

//   if (requireAuth) {
//     if (!keycloak.authenticated) {
//       // niente redirect: lascia che la UI decida quando loggarsi
//       throw new Error("Not authenticated");
//     }
//     await keycloak.updateToken(30).catch(() => Promise.reject(new Error("Token refresh failed")));
//     headers.Authorization = `Bearer ${keycloak.token}`;
//   }

//   const res = await fetch(`${API}${path}`, { ...options, headers });
//   if (requireAuth && res.status === 401) {
//     throw new Error("Unauthorized");
//   }
//   return res;
// }

// export const api = {
//   me: () => authFetch("/api/me").then(r => r.json()),

//   classify: async (file) => {
//     const form = new FormData();
//     form.append("file", file);
//     const res = await authFetch("/api/classify", { method: "POST", body: form });
//     return res.json();
//   },

//   // endpoint pubblico per testare landing senza token
//   health: () => authFetch("/api/health", {}, false).then(r => r.text()),
// };
