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
      <router-link to="/admin/stream-v2" class="nav-button"  style="background-color: #059669">
        Transmitir en Vivo (V2)
      </router-link>
      <router-link to="/admin/crear-release" class="nav-button" style="background-color: #10B981">
         📀 Cargar Release
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
@media (max-width: 768px) {
  .admin-menu-container {
    margin: 1rem;
  }

  .admin-nav {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }

  .nav-button {
    width: 90%;
    text-align: center;
  }
}
</style>
