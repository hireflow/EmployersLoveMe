<script setup>
/*eslint-disable*/ 
import { getFunctions, httpsCallable } from "firebase/functions";
import { watch, onMounted, ref, defineAsyncComponent } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRoute } from "vue-router";
import LoadingSpinner from "@/components/ui/LoadingSpinner.vue";
import ErrorBoundary from "@/components/ui/ErrorBoundary.vue";
import SideBarLayout from "../layouts/SideBarLayout.vue";

const authStore = useAuthStore();
const route = useRoute();
const functions = getFunctions();

const getJobsByOrgId = httpsCallable(functions, "getJobsByOrgId");
const createJobCallable = httpsCallable(functions, "createJob");
const updateJobByIdCallable = httpsCallable(functions, "updateJobById");
const deleteJobByIdCallable = httpsCallable(functions, "deleteJobById");

const jobs = ref([]);
const showJobForm = ref(false);
const showEditModal = ref(false);
const showChatbotModal = ref(false);
const selectedJob = ref(null);
const errorMessage = ref("");
const successMessage = ref("");
const showDeleteConfirmation = ref(false);
const currentOrgId = ref(null);

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
    if (!currentOrgId.value) {
      jobs.value = []; // Clear jobs if no org is selected
      return;
    }

    console.log("Fetching jobs for org:", currentOrgId.value);
    errorMessage.value = ""; // Clear previous errors
    const result = await getJobsByOrgId({
      orgId: currentOrgId.value,
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

const openDeleteConfirmation = (job) => {
  selectedJob.value = { ...job };
  showDeleteConfirmation.value = true;
};

const closeDeleteConfirmation = () => {
  selectedJob.value = null;
  showDeleteConfirmation.value = false;
};

const deleteJob = async () => {
  try {
    if (!selectedJob.value || !selectedJob.value.id) {
      console.log("No job selected for deletion");
      return;
    }
    
    if (!currentOrgId.value) {
      console.log("No organization selected");
      errorMessage.value = "Organization information is missing";
      return;
    }

    errorMessage.value = "";
    successMessage.value = "";

    console.log("Deleting job with ID:", selectedJob.value.id);
    console.log("From organization ID:", currentOrgId.value);
    
    const payload = {
      jobId: selectedJob.value.id,
      orgId: currentOrgId.value,
    };

    console.log("Payload for deleteJobById:", payload);
    const result = await deleteJobByIdCallable(payload);
    console.log("Delete job result:", result);

    if (result.data.success) {
      console.log("Job deletion successful");
      await fetchJobs(); // Refresh the jobs list
      successMessage.value = "Job deleted successfully!";
      closeDeleteConfirmation();
    } else {
      console.error("Delete job failed:", result.data.message);
      errorMessage.value =
        result.data.message || "Failed to delete job. Please try again.";
    }
  } catch (error) {
    console.error("Error deleting job:", error);
    errorMessage.value =
      error.message || "An error occurred while deleting the job.";
  }
};

watch(
  () => route.params.orgId,
  (newOrgId) => {
    if (newOrgId) {
      currentOrgId.value = newOrgId;
      fetchJobs();
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (currentOrgId.value && jobs.value.length === 0) {
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
      orgId: currentOrgId.value,
      hiringManagerIds: [authStore.user.uid],
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

const updateJob = async (updatedJobData) => {
  try {
    console.log("updateJob function called with data:", updatedJobData);

    if (!updatedJobData || !updatedJobData.id) {
      console.log("Missing job data or ID");
      return;
    }

    errorMessage.value = "";
    successMessage.value = "";

    // Log the received job data
    console.log(
      "Received job data for update:",
      JSON.stringify(updatedJobData, null, 2)
    );

    // Use the updatedJobData parameter instead of selectedJob.value
    const education =
      updatedJobData.educationRequirements ||
      updatedJobData.requiredEducation ||
      "";

    const payload = {
      jobId: updatedJobData.id,
      updatedJobData: {
        jobTitle: updatedJobData.jobTitle,
        jobDepartment: updatedJobData.jobDepartment,
        jobDescription: updatedJobData.jobDescription,
        jobLocation: updatedJobData.jobLocation,
        jobSalary: updatedJobData.jobSalary,
        applicationDeadline: updatedJobData.applicationDeadline,
        requiredSkills: updatedJobData.requiredSkills,
        preferredSkills: updatedJobData.preferredSkills,
        requiredCertifications: updatedJobData.requiredCertifications,
        requiredEducation: education,
        interviewStages: updatedJobData.interviewStages,
        travelRequirements: updatedJobData.travelRequirements,
        teamSize: updatedJobData.teamSize,
        techStack: updatedJobData.techStack,
        candidateResourceLinks: updatedJobData.candidateResourceLinks,
        jobType: updatedJobData.jobType,
      },
    };

    // Detailed logging for debugging
    console.log("Job ID being updated:", payload.jobId);
    console.log(
      "Updated job data (full):",
      JSON.stringify(payload.updatedJobData, null, 2)
    );
    console.log("Payload for updateJobById:", payload);

    const result = await updateJobByIdCallable(payload);
    console.log("Update job result:", result);

    if (result.data.success) {
      console.log("Job update successful");
      await fetchJobs(); // Refresh
      successMessage.value = "Job updated successfully!";
      closeEditModal();
    } else {
      console.error("Update job failed:", result.data.message);
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

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    successMessage.value = "Link copied to clipboard!";
    setTimeout(() => {
      successMessage.value = "";
    }, 2000);
  } catch (err) {
    errorMessage.value = "Failed to copy link";
    setTimeout(() => {
      errorMessage.value = "";
    }, 2000);
  }
};

const openInNewTab = (url) => {
  window.open(url, '_blank');
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
  <SideBarLayout>
    <!-- Main Content -->
    <div class="dashboard-container">
      <!-- Page Header -->
      <div class="page-header">
        <h1 class="page-title">Jobs for {{ authStore.orgs.find(org => org.id === currentOrgId)?.companyName || "Company Name Not Found" }}</h1>
        <button
          @click="toggleJobForm"
          class="btn btn-primary add-btn"
          :disabled="!currentOrgId"
        >
          {{ showJobForm ? "Cancel" : "+ Add Job" }}
        </button>
      </div>

      <!-- Alerts Section -->
      <div class="alerts-container">
        <div v-if="errorMessage" class="alert alert-error">
          <p>{{ errorMessage }}</p>
        </div>
        <div v-if="successMessage" class="alert alert-success">
          <p>{{ successMessage }}</p>
        </div>
      </div>

      <div class="dashboard-content">
        <ErrorBoundary>
          <Suspense>
            <template #default>
              <JobForm
                v-if="showJobForm"
                :onSubmit="createNewJob"
                :onClose="toggleJobForm"
              />
            </template>
            <template #fallback>
              <LoadingSpinner message="Loading Job Form..."/>
            </template>
          </Suspense>
        </ErrorBoundary>
      
        <div v-if="!showJobForm" class="jobs-section">
          <div class="section-header">
            <h2>Current Jobs</h2>
            <p v-if="jobs.length === 0 && !errorMessage" class="no-jobs-message">
              No jobs found for this organization.
            </p>
          </div>

          <!-- Jobs Grid -->
          <div v-if="currentOrgId && jobs.length > 0" class="jobs-grid">
            <!-- Job Cards -->
            <div v-for="job in jobs" :key="job.id" class="job-card">
              <div class="job-card-header">
                <h3 class="job-title">{{ job.jobTitle || "N/A" }}</h3>
                <span class="job-department">{{ job.jobDepartment || "N/A" }}</span>
              </div>

              <div class="job-card-body">
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
                    <span class="value">{{ formatTimestamp(job.applicationDeadline) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Job Type:</span>
                    <span class="value">{{ job.jobType || "N/A" }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Salary:</span>
                    <span class="value">{{ job.jobSalary || "N/A" }}</span>
                  </div>
                </div>

                <div class="important-updates">
                  <h4>Application Link</h4>
                  <div class="link-container">
                    <p class="application-link">{{ `http://localhost:8080/applications/${currentOrgId}/${job.id}` }}</p>
                    <div class="link-actions">
                      <button 
                        @click="copyToClipboard(`http://localhost:8080/applications/${currentOrgId}/${job.id}`)" 
                        class="btn btn-outline btn-sm center"
                        title="Copy link"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        Copy
                      </button>
                      <button 
                        @click="openInNewTab(`http://localhost:8080/applications/${currentOrgId}/${job.id}`)" 
                        class="btn btn-outline2 btn-sm center"
                        title="Open in new tab"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                        Go to
                      </button>
                    </div>
                  </div>
                </div>

                <div class="job-actions">
                  <button @click="openEditModal(job)" class="btn btn-outline btn-sm">
                    Edit
                  </button>
                  <button @click="openChatbotModal(job)" class="btn btn-outline2 btn-sm">
                    Config
                  </button>
                  <button @click="openDeleteConfirmation(job)" class="btn btn-outline btn-sm">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </SideBarLayout>

  <!-- Edit Modal -->
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

  <!-- Chatbot Config Modal -->
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

  <!-- Delete Confirmation Modal -->
  <div v-if="showDeleteConfirmation" class="modal-overlay">
    <div class="confirmation-modal">
      <div class="confirmation-header">
        <h3>Confirm Deletion</h3>
      </div>
      <div class="confirmation-content">
        <p>Are you sure you want to delete the job: <strong>{{ selectedJob?.jobTitle }}</strong>?</p>
        <p class="warning-text">This action cannot be undone!</p>
      </div>
      <div class="confirmation-actions">
        <button @click="closeDeleteConfirmation" class="btn btn-secondary">
          Cancel
        </button>
        <button @click="deleteJob" class="btn btn-danger">
          Delete
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.add-btn {
  padding: 8px 16px;
  font-size: 14px;
}

/* Alerts Section */
.alerts-container {
  margin-bottom: 20px;
}

.alert {
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.alert-error {
  background-color: #fde8e8;
  border-left: 4px solid #f56565;
  color: #c53030;
}

.alert-success {
  background-color: #e6fffa;
  border-left: 4px solid #38b2ac;
  color: #2c7a7b;
}

.dashboard-content {
  background-color: #f8f9fa;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.jobs-section {
  margin-top: 1rem;
}

.section-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.section-header h2 {
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.no-jobs-message {
  color: #6c757d;
  font-style: italic;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  text-align: center;
  border: 1px dashed #dee2e6;
  margin: 1rem 0;
}

.jobs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 1.5rem;
}

.job-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.2s ease-in-out;
  border: 1px solid #e2e8f0;
  position: relative;
  display: flex;
  flex-direction: column;
}

.job-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
}

.job-card-header {
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  background-color: #f7fafc;
}

.job-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
}

.job-department {
  color: #495057;
  font-size: 0.9rem;
  font-weight: 500;
  display: block;
  margin-top: 4px;
}

.job-card-body {
  padding: 16px;
  position: relative;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.job-info {
  margin-bottom: 16px;
}

.info-item {
  margin-bottom: 8px;
}

.label {
  font-weight: 500;
  color: #718096;
  font-size: 0.8rem;
  text-transform: uppercase;
  display: block;
  margin-bottom: 2px;
}

.value {
  font-weight: 500;
  color: #343a40;
  font-size: 0.95rem;
}

.important-updates {
  background-color: #ebf4ff;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
  flex-grow: 1;
}

.important-updates h4 {
  font-size: 14px;
  font-weight: 600;
  color: #2b6cb0;
  margin: 0 0 8px 0;
}

.link-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.application-link {
  font-size: 13px;
  color: #4a5568;
  margin: 0;
  word-break: break-all;
  background-color: #f8f9fa;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.link-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 1px;
}

.job-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.icon {
  width: 16px;
  height: 16px;
  margin-right: 4px;
  vertical-align: middle;
}

.btn-outline, .btn-outline2 {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .jobs-grid {
    grid-template-columns: 1fr;
  }

  .job-card {
    margin-bottom: 1rem;
  }

  .section-header {
    margin-bottom: 1.5rem;
  }
}

/* Button Styles */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-primary:disabled {
  background-color: #bfdbfe;
  cursor: not-allowed;
}

.btn-outline {
  background-color: transparent;
  color: #e53e3e;
  border: 1px solid #e53e3e;
}

.btn-outline2 {
  background-color: transparent;
  color: rgb(10, 200, 10);
  border: 1px solid #00d953;
}

.btn-outline:hover {
  background-color: #fdf2f2;
}

.btn-outline2:hover {
  background-color: #f0fff4;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.confirmation-modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.confirmation-header {
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.confirmation-header h3 {
  margin: 0;
  color: #212529;
  font-size: 1.3rem;
}

.confirmation-content {
  padding: 1.5rem;
}

.warning-text {
  color: #dc3545;
  font-weight: 500;
  margin-top: 0.5rem;
}

.confirmation-actions {
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover {
  background-color: #c82333;
}

.center {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
