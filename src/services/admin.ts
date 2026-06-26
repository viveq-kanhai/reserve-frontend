import { api } from "./api";

export async function getAdminDashboard() {
  const res = await api.get("/dashboard/admin");

  return res.data;
}
