<script setup>
import { computed, ref, onMounted, watch } from "vue";
import { useStore } from "vuex";
import {
  mdiAccountMultiple,
  mdiMonitorCellphone,
  mdiRobot,
  mdiOfficeBuilding,
  mdiCheck,
} from "@mdi/js";
import MainSection from "@/components/MainSection.vue";
import TitleBar from "@/components/TitleBar.vue";
import HeroBar from "@/components/HeroBar.vue";
import CardWidget from "@/components/CardWidget.vue";
import CardComponent from "@/components/CardComponent.vue";
import ClientsTable from "@/components/ClientsTable.vue";
import Notification from "@/components/Notification.vue";
import TitleSubBar from "@/components/TitleSubBar.vue";

const store = useStore();

const titleStack = computed(() => {
  const orgName = store.getters.selectedOrganization?.name || "";
  return ["Admin", "Dashboard", orgName];
});

const selectedOrganization = computed(
  () => store.getters.selectedOrganization || {}
);

const organizationJobs = computed(() => selectedOrganization.value?.jobs || []);

const selectedJob = ref(null);

const selectedJobApplications = computed(() => {
  if (!selectedJob.value) return [];
  return selectedJob.value.applications || [];
});

console.log(selectedJobApplications.value);

const selectedJobApplicationsCount = computed(
  () => selectedJobApplications.value.length
);

// Mock data for config status - in a real app, this would come from the store
const jobChatbotConfigStatus = ref("Not Setup");
const orgChatbotConfigStatus = ref("Setup");

// Function to handle gear icon click
const handleConfigClick = (type) => {
  // For now, just navigate to "#"
  window.location.href = "#";
};

// Initialize data
onMounted(() => {
  // Make sure organizations are initialized
  if (!store.state.userOrganizations.length) {
    store.dispatch("initializeOrganizations");
  }
  // Set first job as default when component mounts or organization changes
  if (organizationJobs.value.length > 0) {
    selectedJob.value = organizationJobs.value[0];
  }
});

// Watch for organization changes to update selected job
watch(
  () => selectedOrganization.value,
  (newOrg) => {
    if (newOrg?.jobs?.length > 0) {
      selectedJob.value = newOrg.jobs[0];
    } else {
      selectedJob.value = null;
    }
  }
);
</script>

<template>
  <title-bar :title-stack="titleStack" />
  <hero-bar>
    <div class="flex items-center space-x-4">
      <span>Job Posting Dashboard</span>
      <select
        v-if="organizationJobs.length"
        v-model="selectedJob"
        class="rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
      >
        <option v-for="job in organizationJobs" :key="job.id" :value="job">
          {{ job.id }}
        </option>
      </select>
    </div>
  </hero-bar>
  <main-section>
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
      <card-widget
        trend="12%"
        trend-type="up"
        color="text-emerald-500"
        :icon="mdiAccountMultiple"
        :number="selectedJobApplicationsCount"
        :label="'Applications for ' + (selectedJob?.name || 'All Jobs')"
      />
      <card-widget
        :icon="mdiRobot"
        :label="'Config: ' + (selectedJob?.id || 'No Job Selected')"
        :trend="jobChatbotConfigStatus"
        :trend-type="jobChatbotConfigStatus === 'Setup' ? 'up' : 'alert'"
        :trend-icon="jobChatbotConfigStatus === 'Setup' ? mdiCheck : null"
        color="text-blue-500"
        @config-click="handleConfigClick('job')"
      />
      <card-widget
        :icon="mdiOfficeBuilding"
        :label="'Config: ' + (selectedOrganization?.name || 'No Organization')"
        :trend="orgChatbotConfigStatus"
        :trend-type="orgChatbotConfigStatus === 'Setup' ? 'up' : 'alert'"
        :trend-icon="orgChatbotConfigStatus === 'Setup' ? mdiCheck : null"
        color="text-purple-500"
        @config-click="handleConfigClick('org')"
      />
    </div>

    <title-sub-bar
      :icon="mdiMonitorCellphone"
      :title="`Applications for ${selectedJob?.name || 'All Jobs'}`"
    />

    <notification color="info" :icon="mdiMonitorCellphone">
      Click on applicants to view the interview prep doc or the analytics sheet.
    </notification>

    <card-component :icon="mdiMonitorCellphone" title="Applicants" has-table>
      <clients-table :checkable="false" :items="selectedJobApplications" />
    </card-component>
  </main-section>
</template>
