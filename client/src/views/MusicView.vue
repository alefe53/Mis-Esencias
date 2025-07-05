<template>
  <div class="music-view">
    <h1>Música</h1>
    <section class="music-category">
      <h2>Mi Música</h2>
      <p>Composiciones propias y de mis proyectos como solista.</p>
      </section>

    <section class="music-category">
      <h2>Música Conmigo</h2>
      <p>Bandas en las que participé y colaboraciones especiales.</p>
      </section>
  </div>
</template>

<script setup lang="ts">

</script>

<style scoped>


.music-view {
  color: #fff;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  background-color: transparent
}
.music-category {
  margin-top: 3rem;
  border-left: 3px solid var(--current-mood-color, #3b82f6);
  padding-left: 1.5rem;
}
h2 {
  margin-top: 0;
}
</style>