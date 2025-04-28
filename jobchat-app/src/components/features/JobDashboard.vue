// accept selected organization as a prop, display the jobs for the selected
organization
<script setup>
import { getFunctions, httpsCallable } from "firebase/functions";
import { defineProps } from "vue";
import { useAuthStore } from "@/stores/auth";
import { ref } from "vue";

const authStore = useAuthStore();
const functions = getFunctions();
const fetchJobs = httpsCallable(functions, "fetchJobsByOrgId");

const props = defineProps({
  selectedOrg: {
    type: Object,
    required: true,
  },
});

const jobs = ref([]);

const fetchJobs = async () => {
  const result = await fetchJobs({
    orgId: props.selectedOrg.id,
  });
  jobs.value = result.data.jobs;
};
</script>

<template>
  <div>
    <h1>Jobs for {{ props.selectedOrg.name }}</h1>
  </div>
</template>
