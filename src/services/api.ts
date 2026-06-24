import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_URL = "http://192.168.100.6:8000/api";
// IMPORTANT: use your local IP, not localhost

export const api = axios.create({
  baseURL: API_URL,
});

// attach token automatically
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// save token helper
export async function saveToken(token: string) {
  await SecureStore.setItemAsync("token", token);
}

// logout helper
export async function logout() {
  await SecureStore.deleteItemAsync("token");
}
