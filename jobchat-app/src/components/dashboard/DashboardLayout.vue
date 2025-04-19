<script setup>
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useOrganizationStore } from "@/stores/organization";
import * as colors from "@/files_to_migrate/colors.js";
import * as styles from "@/files_to_migrate/styles.js";

const authStore = useAuthStore();
const orgStore = useOrganizationStore();

const isAsideMobileExpanded = ref(false);
const isAsideLgActive = ref(false);
const isAsideCollapsed = ref(false);

const toggleAsideMobile = () => {
  isAsideMobileExpanded.value = !isAsideMobileExpanded.value;
  document.getElementById("app").classList.toggle("ml-60");
  document.documentElement.classList.toggle("m-clipped");
};

const toggleAsideLg = () => {
  isAsideLgActive.value = !isAsideLgActive.value;
};

const toggleAsideCollapse = () => {
  isAsideCollapsed.value = !isAsideCollapsed.value;
};
</script>

<template>
  <div :class="[styles.basic.body, 'min-h-screen']">
    <!-- Mobile menu button -->
    <div class="lg:hidden fixed top-0 left-0 z-20 m-4">
      <button
        :class="[
          colors.colorsBg.light,
          colors.colorsBgHover.light,
          'p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white',
        ]"
        @click="toggleAsideMobile"
      >
        <span class="sr-only">Open sidebar</span>
        <svg
          class="h-6 w-6"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    </div>

    <!-- Sidebar -->
    <div
      :class="[
        styles.basic.aside,
        'fixed inset-y-0 left-0 z-10 w-60 transform transition-transform duration-300 ease-in-out lg:translate-x-0',
      ]"
      :class="{
        'translate-x-0': isAsideMobileExpanded,
        '-translate-x-full': !isAsideMobileExpanded,
      }"
    >
      <div
        :class="[
          styles.basic.asideBrand,
          'flex items-center justify-center h-16',
        ]"
      >
        <h1 class="text-xl font-bold">JobChat</h1>
      </div>
      <nav class="mt-5 px-2">
        <slot name="sidebar"></slot>
      </nav>
    </div>

    <!-- Main content -->
    <div
      class="lg:pl-60 flex flex-col flex-1"
      :class="{ 'ml-60': isAsideMobileExpanded }"
    >
      <!-- Top navigation -->
      <div
        :class="[
          styles.basic.lightBg,
          'sticky top-0 z-10 flex-shrink-0 flex h-16 shadow',
        ]"
      >
        <div class="flex-1 px-4 flex justify-between">
          <div class="flex-1 flex">
            <slot name="header"></slot>
          </div>
          <div class="ml-4 flex items-center md:ml-6">
            <slot name="header-right"></slot>
          </div>
        </div>
      </div>

      <!-- Main content area -->
      <main class="flex-1 relative overflow-y-auto focus:outline-none">
        <div class="py-6">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <slot></slot>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
