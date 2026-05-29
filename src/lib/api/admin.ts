import axios from "axios";

export const AdminAPI = {

  getUsers(params?: any) {
    return axios.get("/api/admin/users", { params });
  },

  getUser(id: number) {
    return axios.get(`/api/admin/users/${id}`);
  },

  updateUser(id: number, data: any) {
    return axios.put(`/api/admin/users/${id}`, data);
  },

  deleteUser(id: number) {
    return axios.delete(`/api/admin/users/${id}`);
  },

  getRecycleBin() {
    return axios.get("/api/admin/recycle-bin");
  },

  bulkDelete(items: any[]) {
    return axios.post("/api/admin/recycle-bin/bulk-delete", { items });
  },

  clearCache() {
    return axios.post("/api/admin/clear-cache");
  },
};