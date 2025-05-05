
<script setup>
import { getFunctions, httpsCallable } from "firebase/functions";
import { watch, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { ref } from "vue";
import { defineAsyncComponent } from "vue";
import LoadingSpinner from "@/components/ui/LoadingSpinner.vue";
import ErrorBoundary from "@/components/ui/ErrorBoundary.vue";

const authStore = useAuthStore();
const functions = getFunctions();
const getJobsByOrgId = httpsCallable(functions, "getJobsByOrgId");

const jobs = ref([]);
const showJobForm = ref(false);
const showEditModal = ref(false);
const showChatbotModal = ref(false);
const selectedJob = ref(null);
const errorMessage = ref("");
const successMessage = ref("");

// Job form fields
// const jobTitle = ref("");
// const jobDepartment = ref("");
// const jobDescription = ref("");
// const jobLocation = ref("");
// const jobSalary = ref("");
// const employmentType = ref("");
// const expectedJobDuration = ref("");
// const applicationDeadline = ref("");
// const salaryRange = ref("");
// const responsibilities = ref("");
// const requiredSkills = ref("");
// const preferredSkills = ref("");
// const minExperience = ref("");
// const requiredCertifications = ref("");
// const educationRequirements = ref("");
// const workEnvironment = ref("");
// const teamDynamics = ref("");
// const growthOpportunities = ref("");
// const interviewStages = ref("");
// const diversityInitiatives = ref("");
// const benefitsPackage = ref("");
// const remoteWorkPolicy = ref("");
// const travelRequirements = ref("");
// const onboardingProcess = ref("");
// const teamSize = ref("");
// const techStack = ref("");
// const candidateResourceLinks = ref("");

const fetchJobs = async () => {
  try {
    if (!authStore.selectedOrg?.id) return;

    console.log("Fetching jobs for org:", authStore.selectedOrg.id);
    const result = await getJobsByOrgId({
      orgId: authStore.selectedOrg.id,
    });
    console.log("Raw result:", result);

    if (result.data.success) {
      jobs.value = result.data.data || [];
    } else {
      jobs.value = [];
    }
    console.log("Processed jobs:", jobs.value);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    errorMessage.value = "Failed to fetch jobs. Please try again.";
    jobs.value = [];
  }
};

// Watch for changes in selectedOrg
watch(
  () => authStore.selectedOrg?.id,
  (newId) => {
    if (newId) {
      fetchJobs();
    } else {
      jobs.value = [];
    }
  },
  { immediate: true }
);

// Also fetch on component mount if we have a selected org
onMounted(() => {
  if (authStore.selectedOrg?.id) {
    fetchJobs();
  }
});

const createJob = httpsCallable(functions, "createJob");
const updateJobById = httpsCallable(functions, "updateJobById");
const createNewJob = async (formData) => {
  console.log(formData);
  try {
    errorMessage.value = "";
    successMessage.value = "";

  //temp fix against double submit
  if (
    !formData.jobTitle
  ) {
    return;
  }

    const result = await createJob({
      orgId: authStore.selectedOrg.id,
      hiringManagerIds: [authStore.user.uid],
      ...formData
    });

    if (result.data.success) {
      await fetchJobs();
      successMessage.value = "Job created successfully!";
      showJobForm.value = false;
      // No need to reset individual fields as the form will be recreated when reopened
    } else {
      errorMessage.value = "Failed to create job. Please try again.";
    }
  } catch (error) {
    console.error("Error creating job:", error);
    errorMessage.value = "Failed to create job. Please try again.";
  }
};

const toggleJobForm = () => {
  showJobForm.value = !showJobForm.value;
  errorMessage.value = "";
  successMessage.value = "";
};

const openEditModal = (job) => {
  selectedJob.value = { ...job };
  showEditModal.value = true;
};

const closeEditModal = () => {
  selectedJob.value = null;
  showEditModal.value = false;
};

const updateJob = async () => {
  try {
    errorMessage.value = "";
    successMessage.value = "";

    const result = await updateJobById({
      jobId: selectedJob.value.id,
      updatedJobData: {
        jobTitle: selectedJob.value.jobTitle,
        jobDepartment: selectedJob.value.jobDepartment,
        jobDescription: selectedJob.value.jobDescription,
        jobLocation: selectedJob.value.jobLocation,
        jobSalary: selectedJob.value.jobSalary,
        applicationDeadline: selectedJob.value.applicationDeadline,
        requiredSkills: selectedJob.value.requiredSkills,
        preferredSkills: selectedJob.value.preferredSkills,
        requiredCertifications: selectedJob.value.requiredCertifications,
        requiredEducation: selectedJob.value.educationRequirements,
        interviewStages: selectedJob.value.interviewStages,
        travelRequirements: selectedJob.value.travelRequirements,
        teamSize: selectedJob.value.teamSize,
        techStack: selectedJob.value.techStack,
        candidateResourceLinks: selectedJob.value.candidateResourceLinks,
      },
    });

    if (result.data.success) {
      await fetchJobs();
      successMessage.value = "Job updated successfully!";
      closeEditModal();
    } else {
      errorMessage.value = "Failed to update job. Please try again.";
    }
  } catch (error) {
    console.error("Error updating job:", error);
    errorMessage.value = "Failed to update job. Please try again.";
  }
};

const openChatbotModal = (job) => {
  selectedJob.value = { ...job };
  showChatbotModal.value = true;
};

const closeChatbotModal = () => {
  selectedJob.value = null;
  showChatbotModal.value = false;
};

const updateChatbotSettings = async (settings) => {
  try {
    errorMessage.value = "";
    successMessage.value = "";

    const result = await updateJobById({
      jobId: selectedJob.value.id,
      updatedJobData: {
        ...selectedJob.value,
        chatbotSettings: settings,
      },
    });

    if (result.data.success) {
      await fetchJobs();
      successMessage.value = "Chatbot settings updated successfully!";
      closeChatbotModal();
    } else {
      errorMessage.value =
        "Failed to update chatbot settings. Please try again.";
    }
  } catch (error) {
    console.error("Error updating chatbot settings:", error);
    errorMessage.value = "Failed to update chatbot settings. Please try again.";
  }
};

// Lazy load the modals
const JobForm = defineAsyncComponent(() =>
  import("@/components/features/JobForm.vue")
);
const JobEditModal = defineAsyncComponent(() =>
  import("@/components/features/JobEditModal.vue")
);
const ChatbotConfigModal = defineAsyncComponent(() =>
  import("@/components/features/ChatbotConfigModal.vue")
);
</script>

<template>
  <div class="job-dashboard">
    <div class="dashboard-header">
      <h1>Jobs for {{ authStore.selectedOrg?.name }}</h1>
      <button @click="toggleJobForm" class="create-button">
        {{ showJobForm ? "Cancel" : "Create New Job" }}
      </button>
    </div>

    <div class="dashboard-messages">
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
    </div>

    <div class="dashboard-content">
      <ErrorBoundary>
        <Suspense>
          <template #default>
            <JobForm
              v-if="showJobForm"
              @submit="createNewJob"
              @cancel="toggleJobForm"
            />
          </template>
          <template #fallback>
            <LoadingSpinner message="Loading job form..." />
          </template>
        </Suspense>
      </ErrorBoundary>

      <div v-if="!showJobForm" class="jobs-section">
        <div class="section-header">
          <h2>Current Jobs</h2>
          <p v-if="jobs.length === 0" class="no-jobs-message">
            No jobs found for this organization.
          </p>
        </div>

        <div class="jobs-grid">
          <div v-for="job in jobs" :key="job.id" class="job-card">
            <div class="job-card-header">
              <h3>{{ job.jobTitle }}</h3>
              <span class="job-department">{{ job.jobDepartment }}</span>
            </div>

            <div class="job-card-content">
              <div class="job-info">
                <div class="info-item">
                  <span class="label">Location:</span>
                  <span class="value">{{ job.jobLocation }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Team Size:</span>
                  <span class="value">{{ job.teamSize }}</span>
                </div>
              </div>

              <div class="job-description">
                <p>{{ job.jobDescription }}</p>
              </div>
            </div>

            <div class="job-card-actions">
              <button @click="openEditModal(job)" class="action-button">
                Edit Details
              </button>
              <button @click="openChatbotModal(job)" class="action-button">
                Edit Config
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ErrorBoundary>
      <Suspense>
        <template #default>
          <JobEditModal
            v-if="showEditModal"
            :show="showEditModal"
            :job="selectedJob"
            @submit="updateJob"
            @close="closeEditModal"
          />
        </template>
        <template #fallback>
          <LoadingSpinner message="Loading edit form..." />
        </template>
      </Suspense>
    </ErrorBoundary>

    <ErrorBoundary>
      <Suspense>
        <template #default>
          <ChatbotConfigModal
            v-if="showChatbotModal"
            :show="showChatbotModal"
            :job="selectedJob"
            @submit="updateChatbotSettings"
            @close="closeChatbotModal"
          />
        </template>
        <template #fallback>
          <LoadingSpinner message="Loading chatbot settings..." />
        </template>
      </Suspense>
    </ErrorBoundary>
  </div>
</template>

<style scoped>
.job-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  margin: 0;
  color: #2c3e50;
  font-size: 2rem;
}

.dashboard-messages {
  margin-bottom: 1.5rem;
}

.error-message,
.success-message {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
}

.success-message {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.create-button {
  background-color: #1976d2;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.create-button:hover {
  background-color: #1565c0;
}

.dashboard-content {
  background-color: #f8f9fa;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.section-header {
  margin-bottom: 2rem;
}

.section-header h2 {
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
}

.no-jobs-message {
  color: #666;
  font-style: italic;
}

.jobs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.job-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.job-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.job-card-header {
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.job-card-header h3 {
  margin: 0 0 0.5rem 0;
  color: #1976d2;
  font-size: 1.25rem;
}

.job-department {
  color: #666;
  font-size: 0.9rem;
}

.job-card-content {
  padding: 1.5rem;
}

.job-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.value {
  font-weight: 500;
  color: #2c3e50;
}

.job-description {
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-top: 1rem;
}

.job-card-actions {
  padding: 1rem 1.5rem;
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.action-button {
  background-color: #1976d2;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.action-button:hover {
  background-color: #1565c0;
}

@media (max-width: 768px) {
  .job-dashboard {
    padding: 1rem;
  }

  .dashboard-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .jobs-grid {
    grid-template-columns: 1fr;
  }
}
</style>
