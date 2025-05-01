/**
 * Main entry point for the JobChat application
 *
 * This file initializes the Vue application with necessary plugins and configurations:
 * - Pinia for state management
 * - Vue Router for navigation
 * - Motion plugin for animations
 */

// src/main.js
import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";
import App from "./App.vue";
import { motionPlugin } from "@oku-ui/motion";

// Initialize Vue application
const app = createApp(App);
const pinia = createPinia();

// Register plugins
app.use(pinia);
app.use(router);
app.use(motionPlugin);

// Mount the application
app.mount("#app");

