<script setup>
import { defineProps } from "vue";

defineProps({
  message: String,
});
</script>

<template>
  <div class="card-container">
    <div class="card-content">
      <p>{{ message }}</p>
    </div>
  </div>
</template>

<style scoped>
.card-container {
  outline: 1px solid red;
  width: 375px;
  height: 125px;
}
</style>
