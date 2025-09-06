import axios from 'axios';
import { keycloak } from './keycloak';

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || '/api'
});

// refresh token e Authorization su ogni richiesta
api.interceptors.request.use(async (config) => {
  try { await keycloak.updateToken(30); } catch {}
  if (keycloak?.token) config.headers.Authorization = `Bearer ${keycloak.token}`;
  return config;
});

export default api;
