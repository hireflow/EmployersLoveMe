<script setup>
import { computed } from "vue";
import { useStore } from "vuex";
import Level from "@/components/Level.vue";

const store = useStore();

const isFooterBarVisible = computed(() => !store.state.isFullScreen);
const isAsideCollapsed = computed(() => store.state.isAsideCollapsed);
</script>

<template>
  <footer
    v-show="isFooterBarVisible"
    class="bg-white py-2 px-6 dark:bg-gray-900/70 transition-all duration-300 ease-in-out"
    :class="[
      { 'xl:pl-60': !isAsideCollapsed },
      { 'xl:pl-20': isAsideCollapsed },
    ]"
  >
    <level>
      <div class="text-center md:text-left"></div>
    </level>
  </footer>
</template>
