<script setup>
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = async () => {
  try {
    await authStore.logout();
    router.push("/login");
  } catch (error) {
    console.error("Logout error:", error);
  }
};
</script>

<template>
  <div>
    <h1>Dashboard</h1>
    <p>Welcome, {{ authStore.user?.email }}</p>
    <button @click="handleLogout">Logout</button>
  </div>
</template>
