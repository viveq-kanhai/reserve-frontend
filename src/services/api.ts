// src/services/api.ts
import axios from "axios";
import { getToken } from "./auth";

export const API_URL = "http://192.168.100.6:8000";

export const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// attach token automatically
api.interceptors.request.use(async (config) => {
  const token = await getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
