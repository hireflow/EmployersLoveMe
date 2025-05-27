<!--
  Root component of the JobChat application
  
  This component serves as the main container for the application:
  - Handles authentication state and initialization
  - Provides the main layout structure
  - Manages routing through router-view
-->

<template>
  <router-view v-if="!authStore.loading && !candidateAuthStore.loading" />
  <div v-else class="loading">Loading...</div>
</template>

<script setup>
/**
 * Root component setup
 *
 * Initializes the application state and authentication
 */
import { onMounted, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useCandidateAuthStore } from "./stores/candidate";

const authStore = useAuthStore();
const candidateAuthStore = useCandidateAuthStore();
const initialized = ref(false);

onMounted(async () => {
  if (!initialized.value) {
    await authStore.initialize();
    await candidateAuthStore.initialize();
    initialized.value = true;
  }
});
</script>

<style>
/* Global application styles */
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

/* Reset default browser styles */
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}

/* Loading state styles */
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.2em;
  color: #666;
}
</style>
