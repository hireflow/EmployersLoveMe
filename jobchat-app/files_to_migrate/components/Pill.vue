<script setup>
import Icon from "@/components/Icon.vue";

defineProps({
  text: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: "info",
  },
  icon: {
    type: String,
    default: null,
  },
  small: Boolean,
});

const typeStyle = {
  success:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-800/20 dark:text-emerald-100",
  danger: "bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-100",
  warning:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-100",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-100",
};
</script>

<template>
  <div
    class="inline-flex items-center justify-center rounded-full"
    :class="[
      typeStyle[type],
      small ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5',
    ]"
  >
    <icon
      v-if="icon"
      :path="icon"
      :w="small ? 'w-4' : 'w-5'"
      :h="small ? 'h-4' : 'h-5'"
      class="mr-1"
    />
    <span>{{ text }}</span>
  </div>
</template>
