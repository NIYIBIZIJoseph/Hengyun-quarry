import axios from "axios";

export const SettingsAPI = {

  getSystemSettings() {
    return axios.get("/api/settings");
  },

  updateSystemSetting(key: string, value: any) {
    return axios.put("/api/settings", { key, value });
  },

  getBranchSettings(branchId?: number) {
    return axios.get("/api/settings/branch", {
      params: { branch_id: branchId },
    });
  },

  updateBranchSetting(branchId: number, key: string, value: any) {
    return axios.put("/api/settings/branch", {
      branch_id: branchId,
      key,
      value,
    });
  },
};