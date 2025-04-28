<template>
  <router-view v-if="!authStore.loading"></router-view>
  <div v-else class="loading">Loading...</div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const initialized = ref(false);

onMounted(async () => {
  if (!initialized.value) {
    await authStore.initialize();
    initialized.value = true;
  }
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 0;
  height: 100vh;
  width: 100%;
}

html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.2em;
  color: #666;
}
</style>
