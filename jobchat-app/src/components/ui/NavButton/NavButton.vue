<template>
  <button @click="goBack" class="nav-button">
    <span v-if="icon" class="icon"> {{ icon }} </span>
    <span v-if="text" class="text">{{ text }}</span>
    <slot v-if="!text && !icon"></slot>
  </button>
</template>

<script setup>
import { useRouter, isNavigationFailure } from "vue-router";
import { defineProps } from "vue";
const props = defineProps({
  path: {
    type: [String, Object],
    required: true,
    description: "The path to navigate to. Can be a string or a route object.",
  },
  text: {
    type: String,
    default: "",
    description: "The text to display on the button.",
  },
  icon: {
    type: String,
    default: "",
    description: "An optional icon to display on the button.",
  },
  params: {
    type: Object,
    default: () => ({}),
    description: "Optional parameters to pass with the route.",
  },
  query: {
    type: Object,
    default: () => ({}),
    description: "Optional query parameters to pass with the route",
  },
  hash: {
    type: String,
    default: "",
    description: "Optional hash to add to the route",
  },
});

const router = useRouter();

const goBack = () => {
  if (router) {
    let destination;

    if (typeof props.path === "string") {
      if (props.path === "-") {
        router.back();
        return;
      }
      destination = { path: props.path };
    } else if (typeof props.path === "object") {
      destination = { ...props.path };
    } else {
      console.warn("NavButton: Invalid path type.");
      return;
    }

    if (Object.keys(props.params).length > 0) {
      destination.params = {
        ...destination.params,
      };
    }
    if (Object.keys(props.query).length > 0) {
      destination.query = {
        ...destination.query,
      };
    }

    if (props.hash) {
      destination.hash = props.hash;
    }
    router.push(destination).catch((failure) => {
      if (isNavigationFailure(failure)) {
        console.error("Navigation failed:", failure);
      }
    });
  } else {
    console.warn("NavButton: No router instance.");
  }
};
</script>

<style scoped>
.nav-button {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border: 1px solid #ccc;
  border-radius: 0.375rem;
  background-color: #f0f0f0;
  color: #333;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.nav-button:hover {
  background-color: #e0e0e0;
}

.icon {
  margin-right: 0.5rem;
}
</style>
