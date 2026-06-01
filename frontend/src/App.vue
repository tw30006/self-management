<script setup lang="ts">
import Header from "./components/Header.vue";
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <Header />

    <div class="main-wrapper">
      <main
        class="mx-auto max-w-5xl px-4 py-8 min-h-[calc(100vh-64px)] flex items-center justify-center"
      >
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style>
.main-wrapper {
  background:
    radial-gradient(
      circle at 20% 20%,
      rgba(13, 94, 146, 0.25),
      transparent 46%
    ),
    linear-gradient(160deg, #0b1019 0%, #10182a 52%, #111827 100%);
}
</style>
