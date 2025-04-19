<script setup>
import Icon from "@/components/Icon.vue";

defineProps({
  icon: String,
  label: {
    type: String,
    required: true,
  },
  isDesktopIconOnly: Boolean,
});
</script>

<template>
  <div class="flex items-center">
    <slot />
    <icon v-if="icon" :path="icon" class="transition-colors w-6 h-6" />
    <span
      class="px-2 transition-colors"
      :class="{ 'lg:hidden': isDesktopIconOnly && icon }"
      >{{ label }}</span
    >
  </div>
</template>
