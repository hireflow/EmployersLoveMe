<script setup>
import { useRoute } from "vue-router";
const route = useRoute();

console.log(route.params.orgId);

</script>

<template>
  <div>
    organization id: {{ route.params.orgId }} job id: {{ route.params.jobId }}

   


  </div>
</template>

<style></style>
