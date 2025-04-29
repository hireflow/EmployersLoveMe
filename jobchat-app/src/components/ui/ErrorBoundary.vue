<template>
  <div class="error-boundary-container">
    <div v-if="error" class="error-boundary">
      <h3>Something went wrong</h3>
      <p>{{ error.message }}</p>
      <button @click="resetError" class="retry-button">Try Again</button>
    </div>
    <slot v-else></slot>
  </div>
</template>

<script setup>
import { ref, onErrorCaptured } from "vue";

const error = ref(null);

onErrorCaptured((err) => {
  error.value = err;
  return false;
});

const resetError = () => {
  error.value = null;
};
</script>

<style scoped>
.error-boundary {
  padding: 2rem;
  text-align: center;
  background-color: #ffebee;
  border-radius: 8px;
  margin: 1rem;
}

.error-boundary h3 {
  color: #d32f2f;
  margin-bottom: 1rem;
}

.error-boundary p {
  color: #666;
  margin-bottom: 1.5rem;
}

.retry-button {
  background-color: #1976d2;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s ease;
}

.retry-button:hover {
  background-color: #1565c0;
}
</style>
