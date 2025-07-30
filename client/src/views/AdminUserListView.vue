<template>
  <div class="user-list-container">
    <h2>Lista de Usuarios</h2>
    <div v-if="isLoading" class="loader">Cargando usuarios...</div>
    <table v-else>
      <thead>
        <tr>
          <th>Usuario</th>
          <th>Email</th>
          <th>Suscripción</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.user_id">
          <td>
            <div class="user-cell">
              <img
                :src="user.avatar_url || '/perfildefault.jpg'"
                alt="avatar"
                class="avatar"
              />
              <span>{{ user.full_name }}</span>
            </div>
          </td>
          <td>{{ user.email }}</td>
          <td>
            <span
              class="tier-badge"
              :class="`tier-${user.subscription_tier_id}`"
            >
              {{ user.subscription_name }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAdminUserStore } from '../stores/adminUserStore'

const store = useAdminUserStore()
const { users, isLoading } = storeToRefs(store)

onMounted(() => {
  store.fetchUsers()
})
</script>

<style scoped>
.user-list-container {
  max-width: 1000px;
  margin: 1rem auto;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  padding: 0.8rem 1rem;
  border-bottom: 1px solid #374151;
  text-align: left;
}
th {
  color: #9ca3af;
}
.user-cell {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}
.tier-badge {
  padding: 0.25rem 0.6rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
}
.tier-1 {
  background-color: #6b7280;
}
.tier-2 {
  background-color: #3b82f6;
}
.tier-3 {
  background-color: #a855f7;
}
</style>
