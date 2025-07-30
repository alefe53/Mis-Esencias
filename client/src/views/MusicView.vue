<template>
  <div class="music-view">
    <div class="logo-container">
      <img src="/adfmusiclogo.jpg" alt="ADF Music Logo" class="logo-image" />
    </div>

    <div class="cards-container">
      <router-link to="/musica-propia" class="music-card-link">
        <div class="music-card" style="background-image: url('/bas.jpg')">
          <div class="card-content">
            <div class="text-info">
              <h2>Música de Ale</h2>
            </div>
          </div>
        </div>
      </router-link>

      <router-link to="/musica-con-ale" class="music-card-link">
        <div class="music-card" style="background-image: url('/ladlr.jpg')">
          <div class="card-content">
            <div class="text-info">
              <h2>Música con Ale</h2>
            </div>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
@keyframes shimmer-text {
  0% {
    background-position: 200% center;
  }
  100% {
    background-position: -200% center;
  }
}

.music-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  color: #fff;
  background-color: transparent;
}

.logo-container {
  width: 90%;
  max-width: 880px;
  height: 120px;
  margin-bottom: 1rem;
  overflow: hidden;
  filter: grayscale(100%) blur(2px);
  opacity: 0.7;
  transform: scale(0.95);
  transition:
    transform 0.4s ease-out,
    filter 0.4s ease-out,
    opacity 0.4s ease-out;
}

.logo-container:hover {
  transform: scale(1);
  filter: grayscale(0%) blur(0);
  opacity: 1;
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cards-container {
  display: flex;
  justify-content: center;
  gap: 2.5rem;
  flex-wrap: wrap;
  width: 100%;
}

.music-card {
  width: 350px;
  height: 350px;
  border-radius: 12px;
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  transition:
    transform 0.3s ease-in-out,
    box-shadow 0.3s ease-in-out;
}

.music-card:hover {
  transform: scale(1.05) translateY(-10px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
}

.card-content {
  position: relative;
  z-index: 2;
  height: 100%;
  padding: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.text-info {
  text-align: center;
  transition: opacity 0.3s ease-in-out;
}

.text-info h2 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: bold;
  color: transparent;
  background: linear-gradient(
    90deg,
    #ffffff,
    #0181af,
    #d793ca,
    #fdfdfd,
    #e1b1ea,
    #a364ad,
    #ffffff
  );
  background-size: 200% auto;
  background-clip: text;
  -webkit-background-clip: text;
  animation: shimmer-text 5s linear infinite;
  filter: drop-shadow(2px 3px 4px rgba(0, 0, 0, 0.7));
}

.music-card:hover .text-info {
  opacity: 0;
}
</style>
