<script setup>
import { getFunctions, httpsCallable } from "firebase/functions";
import { watch, onMounted, ref, defineAsyncComponent } from "vue";
import { useAuthStore } from "@/stores/auth";
import LoadingSpinner from "@/components/ui/LoadingSpinner.vue";
import ErrorBoundary from "@/components/ui/ErrorBoundary.vue";

const authStore = useAuthStore();
const functions = getFunctions();

const getJobsByOrgId = httpsCallable(functions, "getJobsByOrgId");
const createJobCallable = httpsCallable(functions, "createJob"); // Renamed for clarity
const updateJobByIdCallable = httpsCallable(functions, "updateJobById"); // Renamed for clarity

const jobs = ref([]);
const showJobForm = ref(false);
const showEditModal = ref(false);
const showChatbotModal = ref(false);
const selectedJob = ref(null);
const errorMessage = ref("");
const successMessage = ref("");

const formatTimestamp = (timestampInput) => {
  if (!timestampInput) return "N/A";

  let date;
  if (
    timestampInput._seconds !== undefined &&
    timestampInput._nanoseconds !== undefined
  ) {
    // Firestore Timestamp object
    date = new Date(
      timestampInput._seconds * 1000 + timestampInput._nanoseconds / 1000000
    );
  } else if (
    typeof timestampInput === "string" &&
    timestampInput.match(/^\d{4}-\d{2}-\d{2}/)
  ) {
    // Date string in YYYY-MM-DD format (or YYYY-MM-DDTHH:mm:ss...)
    // Add time part if only date is given to avoid UTC interpretation issues for some browsers
    const parts = timestampInput.substring(0, 10).split("-");
    date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])); // Parse as UTC then format in local
  } else if (timestampInput instanceof Date) {
    // Already a Date object
    date = timestampInput;
  } else {
    return String(timestampInput); // Fallback for unknown formats, e.g. already formatted string
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC", // Specify timezone if parsed as UTC to display correctly
  });
};

const fetchJobs = async () => {
  try {
    if (!authStore.selectedOrg?.id) {
      jobs.value = []; // Clear jobs if no org is selected
      return;
    }

    console.log("Fetching jobs for org:", authStore.selectedOrg.id);
    errorMessage.value = ""; // Clear previous errors
    const result = await getJobsByOrgId({
      orgId: authStore.selectedOrg.id,
    });
    console.log("Raw result from getJobsByOrgId:", result);

    if (result.data.success) {
      jobs.value = result.data.data || [];
      console.log(
        "Fetched and processed jobs:",
        JSON.stringify(jobs.value, null, 2)
      );
    } else {
      jobs.value = [];
      errorMessage.value =
        result.data.message ||
        "Failed to fetch jobs (server indicated no success).";
    }
  } catch (error) {
    console.error("Error fetching jobs:", error);
    errorMessage.value =
      error.message || "Failed to fetch jobs. Please try again.";
    jobs.value = [];
  }
};

watch(
  () => authStore.selectedOrg?.id,
  (newId) => {
    if (newId) {
      console.log("Selected org changed to:", newId, "Fetching jobs.");
      fetchJobs();
    } else {
      console.log("Selected org cleared. Clearing jobs.");
      jobs.value = [];
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (authStore.selectedOrg?.id && jobs.value.length === 0) {
    // Fetch only if org selected and jobs not already loaded
    console.log("Component mounted with selected org. Fetching jobs.");
    fetchJobs();
  }
});

const createNewJob = async (formData) => {
  console.log("Form data for new job:", formData);
  try {
    errorMessage.value = "";
    successMessage.value = "";

    if (!formData.jobTitle) {
      // Basic validation
      errorMessage.value = "Job title is required.";
      return;
    }

    const payload = {
      orgId: authStore.selectedOrg.id,
      hiringManagerIds: [authStore.user.uid], // Ensure authStore.user.uid is available
      ...formData,
    };
    console.log("Payload for createJob:", payload);
    const result = await createJobCallable(payload);

    if (result.data.success) {
      await fetchJobs(); // Refresh the jobs list
      successMessage.value = "Job created successfully!";
      showJobForm.value = false;
    } else {
      errorMessage.value =
        result.data.message || "Failed to create job. Please try again.";
    }
  } catch (error) {
    console.error("Error creating job:", error);
    errorMessage.value =
      error.message || "An error occurred while creating the job.";
  }
};

const toggleJobForm = () => {
  showJobForm.value = !showJobForm.value;
  if (!showJobForm.value) {
    // Clear messages when closing form
    errorMessage.value = "";
    successMessage.value = "";
  }
};

const openEditModal = (job) => {
  selectedJob.value = { ...job }; // Clone job to avoid modifying the list directly
  showEditModal.value = true;
};

const closeEditModal = () => {
  selectedJob.value = null;
  showEditModal.value = false;
};

const updateJob = async () => {
  try {
    if (!selectedJob.value || !selectedJob.value.id) return;

    errorMessage.value = "";
    successMessage.value = "";

    // Ensure educationRequirements is mapped to requiredEducation if necessary
    const education =
      selectedJob.value.educationRequirements ||
      selectedJob.value.requiredEducation ||
      "";

    const payload = {
      jobId: selectedJob.value.id,
      updatedJobData: {
        jobTitle: selectedJob.value.jobTitle,
        jobDepartment: selectedJob.value.jobDepartment,
        jobDescription: selectedJob.value.jobDescription,
        jobLocation: selectedJob.value.jobLocation,
        jobSalary: selectedJob.value.jobSalary,
        applicationDeadline: selectedJob.value.applicationDeadline, // Send as is, backend might expect string
        requiredSkills: selectedJob.value.requiredSkills,
        preferredSkills: selectedJob.value.preferredSkills,
        requiredCertifications: selectedJob.value.requiredCertifications,
        requiredEducation: education, // Use the mapped value
        interviewStages: selectedJob.value.interviewStages,
        travelRequirements: selectedJob.value.travelRequirements,
        teamSize: selectedJob.value.teamSize,
        techStack: selectedJob.value.techStack,
        candidateResourceLinks: selectedJob.value.candidateResourceLinks,
        // Do not send orgId, id, createdAt, applications, status unless specifically updatable
      },
    };
    console.log("Payload for updateJobById:", payload);
    const result = await updateJobByIdCallable(payload);

    if (result.data.success) {
      await fetchJobs(); // Refresh
      successMessage.value = "Job updated successfully!";
      closeEditModal();
    } else {
      errorMessage.value =
        result.data.message || "Failed to update job. Please try again.";
    }
  } catch (error) {
    console.error("Error updating job:", error);
    errorMessage.value =
      error.message || "An error occurred while updating the job.";
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
    if (!selectedJob.value || !selectedJob.value.id) return;

    errorMessage.value = "";
    successMessage.value = "";

    const payload = {
      jobId: selectedJob.value.id,
      updatedJobData: {
        // Only send chatbotSettings or relevant fields to avoid overwriting others unintentionally
        chatbotSettings: settings,
      },
    };
    console.log(
      "Payload for updateChatbotSettings (via updateJobById):",
      payload
    );
    const result = await updateJobByIdCallable(payload);

    if (result.data.success) {
      await fetchJobs(); // Refresh
      successMessage.value = "Chatbot settings updated successfully!";
      closeChatbotModal();
    } else {
      errorMessage.value =
        result.data.message ||
        "Failed to update chatbot settings. Please try again.";
    }
  } catch (error) {
    console.error("Error updating chatbot settings:", error);
    errorMessage.value =
      error.message || "An error occurred while updating chatbot settings.";
  }
};

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
      <h1>Jobs for {{ authStore.selectedOrg?.name || "your organization" }}</h1>
      <button
        @click="toggleJobForm"
        class="create-button"
        :disabled="!authStore.selectedOrg?.id"
      >
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
          <p v-if="!authStore.selectedOrg?.id" class="no-jobs-message">
            Please select an organization to see jobs.
          </p>
          <p
            v-else-if="jobs.length === 0 && !errorMessage"
            class="no-jobs-message"
          >
            No jobs found for this organization.
          </p>
        </div>

        <div
          class="jobs-grid"
          v-if="authStore.selectedOrg?.id && jobs.length > 0"
        >
          <div v-for="job in jobs" :key="job.id" class="job-card">
            <div class="job-card-header">
              <h3>{{ job.jobTitle || "N/A" }}</h3>
              <span class="job-department">{{
                job.jobDepartment || "N/A"
              }}</span>
            </div>

            <div class="job-card-content">
              <div class="job-info">
                <div class="info-item">
                  <span class="label">Location:</span>
                  <span class="value">{{ job.jobLocation || "N/A" }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Team Size:</span>
                  <span class="value">{{ job.teamSize || "N/A" }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Status:</span>
                  <span class="value">{{ job.status || "N/A" }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Deadline:</span>
                  <span class="value">{{
                    formatTimestamp(job.applicationDeadline)
                  }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Job Type:</span>
                  <span class="value">{{ job.jobType || "N/A" }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Salary:</span>
                  <span class="value">{{ job.jobSalary || "N/A" }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Interview Stages:</span>
                  <span class="value">{{ job.interviewStages || "N/A" }}</span>
                </div>
              </div>

              <div class="job-details-section">
                <h4>Details:</h4>
                <div class="detail-item">
                  <span class="label">Required Skills:</span>
                  <p class="value-paragraph">
                    {{ job.requiredSkills || "N/A" }}
                  </p>
                </div>
                <div class="detail-item">
                  <span class="label">Preferred Skills:</span>
                  <p class="value-paragraph">
                    {{ job.preferredSkills || "N/A" }}
                  </p>
                </div>
                <div class="detail-item">
                  <span class="label">Required Education:</span>
                  <p class="value-paragraph">
                    {{ job.requiredEducation || "N/A" }}
                  </p>
                </div>
                <div class="detail-item">
                  <span class="label">Required Certifications:</span>
                  <p class="value-paragraph">
                    {{ job.requiredCertifications || "N/A" }}
                  </p>
                </div>
                <div class="detail-item">
                  <span class="label">Tech Stack:</span>
                  <p class="value-paragraph">{{ job.techStack || "N/A" }}</p>
                </div>
                <div class="detail-item">
                  <span class="label">Travel Requirements:</span>
                  <p class="value-paragraph">
                    {{ job.travelRequirements || "N/A" }}
                  </p>
                </div>
                <div class="detail-item" v-if="job.candidateResourceLinks">
                  <span class="label">Candidate Resources:</span>
                  <p class="value-paragraph">
                    {{ job.candidateResourceLinks }}
                  </p>
                </div>
              </div>

              <div class="job-description-section">
                <h4>Job Description:</h4>
                <p>{{ job.jobDescription || "No description provided." }}</p>
              </div>

              <div class="job-meta">
                <div class="info-item">
                  <span class="label">Posted:</span>
                  <span class="value">{{
                    formatTimestamp(job.createdAt)
                  }}</span>
                </div>
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
  font-family: sans-serif;
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
  text-align: center;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  border: 1px solid #ef9a9a;
}

.success-message {
  background-color: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #a5d6a7;
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
  transition: background-color 0.3s ease, opacity 0.3s ease;
}

.create-button:hover {
  background-color: #1565c0;
}

.create-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  opacity: 0.7;
}

.dashboard-content {
  background-color: #f8f9fa;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.section-header {
  margin-bottom: 2rem;
}

.section-header h2 {
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.no-jobs-message {
  color: #6c757d;
  font-style: italic;
  padding: 1rem;
  background-color: #e9ecef;
  border-radius: 6px;
  text-align: center;
}

.jobs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.job-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
}

.job-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.job-card-header {
  padding: 1.5rem;
  background-color: #eef1f5; /* Lighter header */
  border-bottom: 1px solid #dee2e6;
}

.job-card-header h3 {
  margin: 0 0 0.5rem 0;
  color: #1976d2;
  font-size: 1.3rem;
}

.job-department {
  color: #495057;
  font-size: 0.9rem;
  font-weight: 500;
}

.job-card-content {
  padding: 1.5rem;
  flex-grow: 1; /* Allows content to take up space */
}

.job-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 0.8rem;
  color: #6c757d; /* Subtler label color */
  margin-bottom: 0.25rem;
  text-transform: uppercase; /* Optional: makes labels stand out */
  font-weight: 600;
}

.value {
  font-weight: 500;
  color: #343a40;
  font-size: 0.95rem;
}

.job-details-section,
.job-description-section {
  margin-top: 1.5rem;
}

.job-details-section h4,
.job-description-section h4 {
  color: #343a40;
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 0.5rem;
}

.detail-item {
  margin-bottom: 1rem; /* Increased spacing */
}

.value-paragraph {
  font-weight: normal;
  color: #495057;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-top: 0.25rem;
  white-space: pre-wrap;
}

.job-description-section p {
  color: #495057;
  font-size: 0.95rem;
  line-height: 1.6;
  white-space: pre-wrap;
}

.job-meta {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
  font-size: 0.85rem;
  color: #6c757d;
}

.job-meta .info-item {
  display: flex; /* Align label and value on the same line if desired */
  justify-content: space-between;
  align-items: center;
}
.job-meta .label {
  margin-bottom: 0; /* Adjust if label and value are on the same line */
}

.job-card-actions {
  padding: 1rem 1.5rem;
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: auto; /* Pushes actions to the bottom */
}

.action-button {
  background-color: #1976d2;
  color: white;
  padding: 0.6rem 1.2rem; /* Slightly adjusted padding */
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.action-button:hover {
  background-color: #1565c0;
}

/* Additional style for alternative action button if needed */
.action-button.secondary {
  background-color: #6c757d;
}
.action-button.secondary:hover {
  background-color: #5a6268;
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

  .dashboard-header h1 {
    font-size: 1.75rem;
  }

  .jobs-grid {
    grid-template-columns: 1fr; /* Single column on smaller screens */
  }

  .job-card-content {
    padding: 1rem;
  }
  .job-card-header {
    padding: 1rem;
  }
  .job-card-actions {
    padding: 1rem;
  }
}
</style>
