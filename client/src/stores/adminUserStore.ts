// src/stores/adminUserStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { AdminUser } from '../types';
import * as adminService from '../services/adminService';
import { useUiStore } from './uiStore';

export const useAdminUserStore = defineStore('adminUsers', () => {
  const users = ref<AdminUser[]>([]);
  const isLoading = ref(false);

  async function fetchUsers() {
    if (users.value.length > 0) return;
    isLoading.value = true;
    try {
      users.value = await adminService.fetchAllUsers();
    } catch (error) {
      console.error("Error al cargar la lista de usuarios:", error);
      useUiStore().showToast({ message: "No se pudo cargar la lista de usuarios." });
    } finally {
      isLoading.value = false;
    }
  }

  return {
    users,
    isLoading,
    fetchUsers,
  };
});