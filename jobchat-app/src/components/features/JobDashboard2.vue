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
            <p v-if="jobs.length === 0 && !errorMessage">
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
              </div>
            </div>
          </div>
        </div>
      
      </div>

    </div>
  </SideBarLayout>
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

.dashboard-content {
  background-color: #f8f9fa;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.section-header {
  margin-bottom: 2rem;
}

/* Button Styles */
.add-btn {
  padding: 8px 16px;
  font-size: 14px;
}

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

/* Alerts Section */
.alerts-container {
  margin-bottom: 20px;
}

.alert {
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.alert-error {
  background-color: #fee2e2;
  border-left: 4px solid #f56565;
  color: #b91c1c;
}

.alert-success {
  background-color: #fde8e8;
  border-left: 4px solid #38b2ac;
  color: #2c7a7b;
}

/* Jobs Grid */
.jobs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.job-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
</style>
