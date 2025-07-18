<template>
  <div class="banner-container">
    <div class="animated-banner">
      <h1 class="banner-text">
        ¡Bienvenido a
        <router-link to="/music" class="link">Mis Esencias</router-link>!
      </h1>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const primaryColor = '#ADD8E6'; // Celeste claro
const secondaryColor = '#FFC0CB'; // Rosa claro
const whiteColor = '#FFFFFF';

const gradientColors = computed(() => {
  return [
    primaryColor,
    whiteColor,
    secondaryColor,
    whiteColor,
    primaryColor,
  ].join(', ');
});
</script>
<style scoped>
/* Definimos la animación que rota el gradiente del borde */
@keyframes rotate-gradient {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.banner-container {
  /* Contenedor que se pega arriba y ocupa todo el ancho */
  position: sticky;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1010;
  padding: 1.5rem 0;
  display: flex;
  justify-content: center;
  pointer-events: none;
  /* ✨ CAMBIO: Quitamos la imagen de fondo de aquí. */
  /* background-image, etc. ya no están. */
}

.animated-banner {
  /* El banner en sí mismo, con el borde animado */
  position: relative;
  padding: 2px;
  border-radius: 50px;
  overflow: hidden;
  display: inline-block;
  pointer-events: auto;
}

.animated-banner::before {
  /* El pseudo-elemento que contiene el gradiente y rota */
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(
    from 180deg at 50% 50%,
    v-bind(gradientColors)
  );
  animation: rotate-gradient 8s linear infinite;
  z-index: -1;
}

.banner-text {
  /* El contenido del banner (el texto) */
  display: block;
  font-family: 'Uncial Antiqua', serif;
  font-size: 2.2rem;
  color: #ffffff;
  margin: 0;
  padding: 1rem 3rem;
  border-radius: 48px;
  
  /* ✨ CAMBIO: Aplicamos la imagen de fondo aquí y un velo oscuro para legibilidad */
  background: 
    linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), /* Velo oscuro */
    url('/adfHeaderFondo.jpg'); /* Tu imagen de fondo */
  
  background-size: cover;
  background-position: center;
  
  /* El efecto de brillo para el texto se vuelve más importante */
  text-shadow: 
    0 0 2px rgba(0, 0, 0, 0.7),
    0 0 8px rgba(255, 255, 255, 0.8),
    0 0 18px rgba(247, 149, 4, 0.6);
}

.link {
  color: inherit;
  text-decoration: none;
  transition: all 0.3s ease;
  text-shadow: inherit;
}

.link:hover {
  color: #fff;
  text-shadow: 
    0 0 8px #fff,
    0 0 15px #fca311,
    0 0 25px #fca311;
}

/* Adaptación para pantallas más pequeñas */
@media (max-width: 768px) {
  .banner-text {
    font-size: 1.5rem;
    padding: 0.6rem 1.5rem;
  }
}
</style>