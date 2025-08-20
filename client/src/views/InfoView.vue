<template>
  <div class="info-page">
    <div class="interactive-name">
      <div class="letter-block">
        <span class="initial-letter">A</span>
        <span class="revealed-name">Alejandro</span>
      </div>
      <div class="letter-block">
        <span class="initial-letter">D</span>
        <span class="revealed-name">Damián</span>
      </div>
      <div class="letter-block">
        <span class="initial-letter">F</span>
        <span class="revealed-name">Fenos</span>
      </div>
    </div>

    <div class="info-content">
      <div class="desktop-content">
        <section class="info-section">
          <p class="intro-text">
            Es dificil encasillarse, soy un ser humano curioso con tanto tiempo
            en la música como en la programación. Sacarse fotos programando es
            aburrido de ver y se siente recursivo, mirar en la pantalla una foto
            de una persona mirando una pantalla. Prefiero dejar testimonio de
            mis esencias a través de esta página que cree usando tecnologías
            nodejs, es6, html, ejs, css, con extensiones express, rest, biome
            entre otras. Siempre me vas a encontrar ya sea en la compu, zapando
            en algun instrumento, editando algún audio o chusmeando alguna
            tecnología nueva.
          </p>
        </section>

        <section class="info-section">
          <div class="section-header">
            <h2>Un Poco Sobre Mí</h2>
            <div v-if="canViewGallery" class="gallery-button-wrapper">
              <button @click="handleGalleryClick" class="gallery-button">
                Fotos
              </button>
              <transition name="toast-fade">
                <span v-if="showGalleryToast" class="gallery-toast"
                  >¡Desbloqueaste las fotos!</span
                >
              </transition>
            </div>
          </div>
          <p>
            Argentino, porteño. Hermano del medio. Fanático del fútbol, del arte
            y la tecnología. Aspirante a multi-instrumentista. Profesional en
            sistemas y en la música.
          </p>
        </section>

        <section class="info-section">
          <h2>Experiencia</h2>
          <p>
            Principalmente como consultor de datos, desarrollador y
            administrador de bases de datos en proyectos para compañías líderes
            como: Whirlpool, Accenture, BNP (Banco Nacional de Paris), Oca,
            Movistar y otros. Docente de Bases de Datos. Un título de Analista
            en Sistemas (2025) y otro de Técnico Superior, 3 años en Sonido y
            Música. Inglés desde pequeño (FCE,CAE), experiencia con clientes del
            exterior, tanto en inglés como portugués.
          </p>
          <p>
            Mi camino hasta el momento ha sido con divertida curiosidad en
            mútiples ramas priorizando la tecnología y la música. Como músico he
            participado en numerosas bandas para festivales de la talla de
            artistas internacionales, en innumerables Centros Culturales, bares
            y boliches de capital federal y hasta en la televisión argentina.
            Disfruto grabar y mezclar diamantes en bruto escondidos entre los
            músicos y las bandas de Argentina. Poseo equipo profesional de audio
            de primer nivel. Hice de Sonidista en teatros y bares y hasta
            haciendo sonido directo de cortos audiovisuales (equipo propio de
            alta calidad) fx y foley. Disfruto y domino ambas ramas; para
            quienes estén interesados de mi servicios.
          </p>
        </section>

        <section class="info-section">
          <h2>Pasiones</h2>
          <p>
            Hincha de Arsenal de Sarandí. Amante de la lectura, particularmente
            ficciones, pero sólo en hojas físicas, Stephen King, René Barjavel,
            entre otros. Aspirante amateur a escritor. Instrumentos varios,
            guitarra, bajo, piano, batería, cigar box, mandolina... Pelis,
            series, animes. Paz y amigos. Agradezco a mi familia, a mi pareja
            Sofía, una artísta extraordinaria, a mis amigos, a mi país, a la
            vida.
          </p>
        </section>

        <section class="info-section contact-section">
          <h2>Contacto</h2>
          <div class="contact-details">
            <p>
              <span class="contact-icon">📧</span>
              <a href="mailto:alefe53@gmail.com">alefe53@gmail.com</a>
            </p>
            <p>
              <span class="contact-icon">📍</span>
              <span>Buenos Aires, Capital Federal, Argentina</span>
            </p>
          </div>
        </section>
      </div>

      <div class="mobile-accordion">
        <section class="info-section">
          <p class="intro-text">
            Es dificil encasillarse, soy un ser humano curioso con tanto tiempo
            en la música como en la programación. Siempre me vas a encontrar ya
            sea en la compu, zapando en algun instrumento, editando algún audio
            o chusmeando alguna tecnología nueva.
          </p>
        </section>

        <div class="accordion-item">
          <div class="accordion-header" @click="toggleSection('sobre-mi')">
            <div class="header-content">
              <span class="section-icon">🎙️</span>
              <h2>Un Poco Sobre Mí</h2>
            </div>
            <span
              class="chevron-icon"
              :class="{ expanded: activeSection === 'sobre-mi' }"
              >›</span
            >
          </div>
          <transition name="expand">
            <div v-if="activeSection === 'sobre-mi'" class="accordion-content">
              <p>
                Argentino, porteño. Hermano del medio. Fanático del fútbol, del
                arte y la tecnología. Aspirante a multi-instrumentista.
                Profesional en sistemas y en la música.
              </p>
              <div v-if="canViewGallery" class="gallery-button-wrapper">
                <button @click="handleGalleryClick" class="gallery-button">
                  Fotos
                </button>
                <transition name="toast-fade">
                  <span v-if="showGalleryToast" class="gallery-toast"
                    >¡Desbloqueaste las fotos!</span
                  >
                </transition>
              </div>
            </div>
          </transition>
        </div>

        <div class="accordion-item">
          <div class="accordion-header" @click="toggleSection('experiencia')">
            <div class="header-content">
              <span class="section-icon">🎛️</span>
              <h2>Experiencia</h2>
            </div>
            <span
              class="chevron-icon"
              :class="{ expanded: activeSection === 'experiencia' }"
              >›</span
            >
          </div>
          <transition name="expand">
            <div
              v-if="activeSection === 'experiencia'"
              class="accordion-content"
            >
              <p>
                Principalmente como consultor de datos, desarrollador y
                administrador de bases de datos en proyectos para compañías
                líderes como: Whirlpool, Accenture, BNP, Oca, Movistar y otros.
                Docente de Bases de Datos.
              </p>
              <p>
                Como músico he participado en numerosas bandas, festivales, y
                hasta en la televisión argentina. Disfruto grabar y mezclar.
                Poseo equipo profesional de audio de primer nivel.
              </p>
            </div>
          </transition>
        </div>

        <div class="accordion-item">
          <div class="accordion-header" @click="toggleSection('pasiones')">
            <div class="header-content">
              <span class="section-icon">🤘</span>
              <h2>Pasiones</h2>
            </div>
            <span
              class="chevron-icon"
              :class="{ expanded: activeSection === 'pasiones' }"
              >›</span
            >
          </div>
          <transition name="expand">
            <div v-if="activeSection === 'pasiones'" class="accordion-content">
              <p>
                Hincha de Arsenal de Sarandí. Amante de la lectura de ficciones
                en hojas físicas. Aspirante amateur a escritor. Instrumentos
                varios: guitarra, bajo, piano, batería... Pelis, series, animes.
                Paz y amigos.
              </p>
            </div>
          </transition>
        </div>

        <div class="accordion-item">
          <div class="accordion-header" @click="toggleSection('contacto')">
            <div class="header-content">
              <span class="section-icon">📲</span>
              <h2>Contacto</h2>
            </div>
            <span
              class="chevron-icon"
              :class="{ expanded: activeSection === 'contacto' }"
              >›</span
            >
          </div>
          <transition name="expand">
            <div v-if="activeSection === 'contacto'" class="accordion-content">
              <div class="contact-details">
                <p>
                  <span class="contact-icon">📧</span>
                  <a href="mailto:alefe53@gmail.com">alefe53@gmail.com</a>
                </p>
                <p>
                  <span class="contact-icon">📍</span>
                  <span>Buenos Aires, Capital Federal, Argentina</span>
                </p>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>

  <ImageGalleryModal />
  <LightboxModal />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useImageStore } from '../stores/imageStore'
import ImageGalleryModal from '../components/gallery/ImageGalleryModal.vue'
import LightboxModal from '../components/gallery/LightboxModal.vue'

const authStore = useAuthStore()
const imageStore = useImageStore()

const activeSection = ref<string | null>('sobre-mi')

function toggleSection(sectionName: string) {
  if (activeSection.value === sectionName) {
    activeSection.value = null
  } else {
    activeSection.value = sectionName
  }
}

const canViewGallery = computed(() => {
  return (
    authStore.isAuthenticated &&
    authStore.user &&
    authStore.user.subscription_tier_id > 1
  )
})

const showGalleryToast = computed(() => {
  return canViewGallery.value && !imageStore.wasToastViewed
})

const handleGalleryClick = () => {
  imageStore.openModal()
  if (showGalleryToast.value) {
    imageStore.markToastAsViewed()
  }
}
</script>

<style scoped>
/* --- ESTILOS ORIGINALES PARA ESCRITORIO (BASE) --- */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes tech-vibration {
  0% {
    transform: translate(0, 0);
  }
  1% {
    transform: translate(-1px, 1px);
  }
  2% {
    transform: translate(1px, -1px);
  }
  3% {
    transform: translate(-1px, 0);
  }
  4% {
    transform: translate(0, 1px);
  }
  5% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(0, 0);
  }
}
.info-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 2rem;
  color: #e0e0e0;
  animation: fadeIn 1s ease-out;
}
.interactive-name {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 4rem;
}
.letter-block {
  position: relative;
  text-align: center;
  cursor: default;
}
.initial-letter {
  display: inline-block;
  font-family: 'Uncial Antiqua', cursive;
  font-size: 8rem;
  color: #e0e0e0;
  line-height: 1;
  transition:
    transform 0.3s ease,
    color 0.3s ease;
}
.revealed-name {
  display: block;
  font-size: 1rem;
  color: #a0a0a0;
  margin-top: -1rem;
  opacity: 0;
  transform: translateY(10px);
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
  pointer-events: none;
}
.letter-block:hover .initial-letter {
  transform: scale(1.1);
  color: #fff;
}
.letter-block:hover .revealed-name {
  opacity: 1;
  transform: translateY(0);
}
.info-content {
  max-width: 75ch;
  width: 100%;
}
.info-section {
  margin-bottom: 3.5rem;
}
.info-section h2 {
  font-family: 'Roboto Slab', serif;
  font-size: 1.8rem;
  color: #fff;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #0a84ff;
  display: inline-block;
}
.info-section p {
  font-size: 1rem;
  line-height: 1.8;
  color: #d1d5db;
  margin-bottom: 1rem;
}
.intro-text {
  font-size: 1.1rem;
  line-height: 1.9;
  color: #f0f0f0;
  font-style: italic;
  border-left: 3px solid #555;
  padding-left: 1.5rem;
}
.contact-section p {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.contact-section a {
  color: #60a5fa;
  text-decoration: none;
  transition: color 0.2s;
}
.contact-section a:hover {
  color: #93c5fd;
}
.contact-icon {
  font-size: 1.2rem;
}
.section-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}
.section-header h2 {
  margin-bottom: 0;
}
.gallery-button-wrapper {
  position: relative;
  margin-left: 4.5rem;
  margin-top: 1.7rem;
}
.gallery-button {
  background: linear-gradient(180deg, #85bbee 0%, #09529b 100%);
  color: white;
  border: 1px solid #0056b3;
  padding: 0.6rem 1.2rem;
  font-weight: 600;
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  box-shadow:
    0 0 15px rgba(10, 132, 255, 0.4),
    inset 0 1px 1px rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  animation: tech-vibration 4s infinite ease-in-out;
}
.gallery-button:hover {
  background: linear-gradient(180deg, #6fb5f6 0%, #064d94 100%);
  box-shadow:
    0 0 25px rgba(10, 132, 255, 0.7),
    inset 0 1px 1px rgba(255, 255, 255, 0.2);
  transform: scale(1.05) translateY(-2px);
  animation-play-state: paused;
}
.gallery-toast {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background-color: #fca311;
  color: #1f2937;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: bold;
  white-space: nowrap;
  z-index: 10;
}
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition:
    opacity 0.5s ease,
    transform 0.5s ease;
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}

/* Por defecto, el acordeón móvil está oculto */
.mobile-accordion {
  display: none;
}

/* --- NUEVOS ESTILOS RESPONSIVOS PARA MÓVIL --- */
@media (max-width: 768px) {
  /* Ocultamos el contenido de escritorio y mostramos el de móvil */
  .desktop-content {
    display: none;
  }
  .mobile-accordion {
    display: block;
    width: 100%;
  }

  .info-page {
    padding: 2rem 1rem;
  }
  .interactive-name {
    gap: 1rem;
    margin-bottom: 2rem;
    flex-direction: column;
    align-items: center;
  }
  .letter-block {
    text-align: center;
  }
  .initial-letter {
    font-size: 4rem;
  }
  .revealed-name {
    opacity: 1;
    transform: translateY(0);
    margin-top: -0.5rem;
    font-size: 0.9rem;
  }
  .letter-block:hover .initial-letter {
    transform: none;
  }
  .intro-text {
    margin-bottom: 2rem;
    border-left: 2px solid #555;
    padding-left: 1rem;
    font-size: 1rem;
  }

  .accordion-item {
    background-color: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    margin-bottom: 1rem;
    overflow: hidden;
  }
  .accordion-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.03);
  }
  .header-content {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .section-icon {
    font-size: 1.5rem;
  }
  .accordion-header h2 {
    font-family: 'Roboto Slab', serif;
    font-size: 1.2rem;
    color: #fca311;
    margin: 0;
    border: none;
    padding: 0;
  }
  .chevron-icon {
    font-size: 1.5rem;
    font-weight: bold;
    color: #777;
    transition: transform 0.3s ease;
  }
  .chevron-icon.expanded {
    transform: rotate(90deg);
  }
  .accordion-content {
    padding: 0 1.25rem 1.25rem;
    color: #d1d5db;
    line-height: 1.7;
    font-size: 0.9rem;
  }
  .accordion-content p {
    margin-top: 1rem;
    margin-bottom: 0;
  }
  .accordion-content .gallery-button-wrapper {
    margin: 1.5rem 0 0 0;
  }
  .accordion-content .contact-details p {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .expand-enter-active,
  .expand-leave-active {
    transition: all 0.4s ease-in-out;
    max-height: 500px;
  }
  .expand-enter-from,
  .expand-leave-to {
    max-height: 0;
    opacity: 0;
    padding-top: 0;
    padding-bottom: 0;
    margin-top: 0;
  }
}
</style>
