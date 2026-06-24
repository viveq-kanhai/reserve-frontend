// src/services/api.ts
import axios from "axios";
import { getToken } from "./auth";

export const api = axios.create({
  baseURL: "http://192.168.100.6:8000/api",
});

// attach token automatically
api.interceptors.request.use(async (config) => {
  const token = await getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
