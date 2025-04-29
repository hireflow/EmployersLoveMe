<template>
  <div class="loading-container">
    <div class="loading-spinner">
      <div class="spinner-circle"></div>
      <div class="spinner-circle"></div>
      <div class="spinner-circle"></div>
    </div>
    <p class="loading-text">{{ message }}</p>
  </div>
</template>

<script setup>
import { defineProps } from "vue";

defineProps({
  message: {
    type: String,
    default: "Loading...",
  },
});
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  gap: 1rem;
}

.loading-spinner {
  display: flex;
  gap: 0.5rem;
}

.spinner-circle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #1976d2;
  animation: bounce 1.4s infinite ease-in-out;
}

.spinner-circle:nth-child(1) {
  animation-delay: -0.32s;
}

.spinner-circle:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.loading-text {
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
}
</style>
