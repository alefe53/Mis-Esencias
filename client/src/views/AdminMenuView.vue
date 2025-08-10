<template>
  <div class="admin-menu-container">
    <h1>Panel de Administrador</h1>
    <div class="admin-nav">
      <router-link to="/admin/chats" class="nav-button">
        Gestionar Chats
      </router-link>
      <router-link to="/admin/users" class="nav-button">
        Gestionar Usuarios
      </router-link>
      <router-link to="/admin/crear-publicacion" class="nav-button">
        Crear Publicación
      </router-link>
      <router-link to="/admin/stream" class="nav-button">
        Transmitir en Vivo
      </router-link>
    </div>

    <router-view />
  </div>
</template>

<style scoped>
.admin-menu-container {
  max-width: 800px;
  margin: 2rem auto;
  text-align: center;
}
.admin-nav {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 2rem;
  margin-bottom: 2rem;
}
.nav-button {
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background-color: #374151;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s ease;
}
.nav-button:hover,
.nav-button.router-link-exact-active {
  background-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
}
</style>
