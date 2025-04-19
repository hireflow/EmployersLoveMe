<script setup>
import { computed } from "vue";
import { useStore } from "vuex";
import menu from "@/menu.js";
import NavBar from "@/components/NavBar.vue";
import AsideMenu from "@/components/AsideMenu.vue";
import FooterBar from "@/components/FooterBar.vue";
import Overlay from "@/components/Overlay.vue";

const store = useStore();

store.commit("user", {
  name: "Jason Greenberg",
  email: "jason@example.com",
  avatar:
    "https://avatars.dicebear.com/api/avataaars/example.svg?options[top][]=shortHair&options[accessoriesChance]=93",
});

const isAsideLgActive = computed(() => store.state.isAsideLgActive);
const isAsideCollapsed = computed(() => store.state.isAsideCollapsed);

const overlayClick = () => {
  store.dispatch("asideLgToggle", false);
};
</script>

<template>
  <div
    :class="[
      'min-h-screen w-screen transition-all duration-300 ease-in-out',
      isAsideCollapsed ? 'lg:pl-20' : 'lg:pl-60',
    ]"
  >
    <nav-bar />
    <aside-menu :menu="menu" />
    <router-view />
    <footer-bar />
    <overlay
      v-show="isAsideLgActive"
      z-index="z-30"
      @overlay-click="overlayClick"
    />
  </div>
</template>
