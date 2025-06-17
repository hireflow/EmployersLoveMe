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

// Assuming callable functions are defined in functions/orgs/index.js for job CUD within org context
const getJobsByOrgId = httpsCallable(functions, "getJobsByOrgId"); // from orgs/index.js
const createJobCallable = httpsCallable(functions, "createJob"); // from orgs/index.js
const updateJobByIdCallable = httpsCallable(functions, "updateJobById"); // from orgs/index.js
const deleteJobByIdCallable = httpsCallable(functions, "deleteJobById"); // from orgs/index.js
const getApplicationsByJobId = httpsCallable(functions, "getApplicationsByJobId");

const jobs = ref([]);
const showJobForm = ref(false);
const showEditModal = ref(false);
const showChatbotModal = ref(false);
const showApplicationsModal = ref(false);
const selectedJob = ref(null);
const errorMessage = ref("");
const successMessage = ref("");
const showDeleteConfirmation = ref(false);
const currentOrgId = ref(null);
const isLoading = ref(false); // Add loading state

// Add new refs for application data
const applicationsData = ref([]);
const applicationsLoading = ref(false);

// Add new ref for expanded summaries
const expandedSummaries = ref(new Set());

// ... (formatTimestamp, fetchJobs, deleteConfirmation logic remains largely the same) ...
const formatTimestamp = (timestampInput) => {
  if (!timestampInput) return "N/A";

  let date;
  if (
    timestampInput._seconds !== undefined &&
    timestampInput._nanoseconds !== undefined
  ) {
    date = new Date(
      timestampInput._seconds * 1000 + timestampInput._nanoseconds / 1000000
    );
  } else if (
    typeof timestampInput === "string" &&
    timestampInput.match(/^\d{4}-\d{2}-\d{2}/)
  ) {
    const parts = timestampInput.substring(0, 10).split("-");
    date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  } else if (timestampInput instanceof Date) {
    date = timestampInput;
  } else {
    return String(timestampInput);
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
};

const fetchJobs = async () => {
  try {
    if (!currentOrgId.value) {
      jobs.value = [];
      return;
    }
    isLoading.value = true; // Set loading to true before fetch
    errorMessage.value = "";
    const result = await getJobsByOrgId({ orgId: currentOrgId.value });
    if (result.data.success) {
      jobs.value = result.data.data || [];
    } else {
      jobs.value = [];
      errorMessage.value = result.data.message || "Failed to fetch jobs.";
    }
  } catch (error) {
    console.error("Error fetching jobs:", error);
    errorMessage.value =
      error.message || "Failed to fetch jobs. Please try again.";
    jobs.value = [];
  } finally {
    isLoading.value = false; // Set loading to false after fetch completes
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
    if (!selectedJob.value || !selectedJob.value.id || !currentOrgId.value) {
      errorMessage.value =
        "Job or Organization information is missing for deletion.";
      return;
    }
    errorMessage.value = "";
    successMessage.value = "";
    const payload = { jobId: selectedJob.value.id, orgId: currentOrgId.value };
    const result = await deleteJobByIdCallable(payload);
    if (result.data.success) {
      await fetchJobs();
      successMessage.value = "Job deleted successfully!";
      closeDeleteConfirmation();
    } else {
      errorMessage.value = result.data.message || "Failed to delete job.";
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
      fetchJobs(); // Fetch jobs when orgId changes
    } else {
      currentOrgId.value = null;
      jobs.value = []; // Clear jobs if no orgId
    }
  },
  { immediate: true }
);

// onMounted removed as watch with immediate:true handles initial load.

// --- createNewJob: Payload aligned with new schema ---
const createNewJob = async (formData) => {
  // formData is what your JobForm.vue emits. It needs to contain all new fields.
  console.log(
    "Form data for new job (from JobForm.vue):",
    JSON.stringify(formData, null, 2)
  );
  try {
    errorMessage.value = "";
    successMessage.value = "";

    if (!formData.jobTitle || !currentOrgId.value) {
      errorMessage.value = "Job title and Organization ID are required.";
      return;
    }
    if (!authStore.user?.uid) {
      errorMessage.value = "User not authenticated.";
      return;
    }

    // Construct payload based on new schema
    // Your JobForm.vue must provide these fields structured correctly
    const payload = {
      orgId: currentOrgId.value,
      hiringManagerIds: [authStore.user.uid], // Or from form if multiple are allowed
      jobTitle: formData.jobTitle,
      applicationDeadline: formData.applicationDeadline || null, // Ensure JobForm provides this, possibly from a date picker
      status: formData.status || "active",
      riskTolerance: formData.riskTolerance || "medium",

      // Assume JobForm provides these as arrays of strings
      requiredEducation: formData.requiredEducation || [],
      requiredCertifications: formData.requiredCertifications || [],
      requiredSkills: formData.requiredSkills || [],
      preferredSkills: formData.preferredSkills || [],
      requiredQuestions: formData.requiredQuestions || [],
      candidateResourceLinks: formData.candidateResourceLinks || [],

      jobType: formData.jobType || "",
      interviewStages: formData.interviewStages || 0,
      jobDepartment: formData.jobDepartment || "",
      jobDescription: formData.jobDescription || "",
      jobLocation: formData.jobLocation || "",
      travelRequirements: formData.travelRequirements || "",
      salaryRange: formData.salaryRange || "",
      teamSize: formData.teamSize || "", // If still used

      // Work Environment fields
      workEnvironment: formData.workEnvironment || {
        techMaturity: "emerging",
        structure: "hierarchical",
        communication: "async-first",
        pace: "steady-deliberate",
        growthExpectiations: "structured-paths",
        collaboration: "individual-contribution",
      },

      // Complex objects - JobForm needs to manage state for these
      techStack: formData.techStack || {
        stack: [],
        architecture: "",
        scale: "",
        challenges: [],
        practices: [],
      },
      successCriteria: formData.successCriteria || {
        immediate: [],
        longTerm: [],
      },
      candidatePersona: formData.candidatePersona || "",
    };
    console.log(
      "Payload for createJobCallable:",
      JSON.stringify(payload, null, 2)
    );

    const result = await createJobCallable(payload);

    if (result.data.success) {
      await fetchJobs();
      successMessage.value = "Job created successfully!";
      showJobForm.value = false;
    } else {
      errorMessage.value = result.data.message || "Failed to create job.";
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
    errorMessage.value = "";
    successMessage.value = "";
  }
};

const openEditModal = (job) => {
  // Ensure all fields from the new schema are part of the job object fetched
  // or provide defaults if opening for an older job record.
  selectedJob.value = JSON.parse(JSON.stringify(job)); // Deep clone

  // Ensure complex objects and arrays exist on selectedJob for the modal
  selectedJob.value.techStack = selectedJob.value.techStack || {
    stack: [],
    architecture: "",
    scale: "",
    challenges: [],
    practices: [],
  };
  selectedJob.value.techStack.stack = selectedJob.value.techStack.stack || [];
  selectedJob.value.techStack.challenges =
    selectedJob.value.techStack.challenges || [];
  selectedJob.value.techStack.practices =
    selectedJob.value.techStack.practices || [];

  selectedJob.value.successCriteria = selectedJob.value.successCriteria || {
    immediate: [],
    longTerm: [],
  };
  selectedJob.value.successCriteria.immediate =
    selectedJob.value.successCriteria.immediate || [];
  selectedJob.value.successCriteria.longTerm =
    selectedJob.value.successCriteria.longTerm || [];

  const arrayFields = [
    "requiredEducation",
    "requiredCertifications",
    "requiredSkills",
    "preferredSkills",
    "requiredQuestions",
    "candidateResourceLinks",
    "hiringManagerIds",
  ];
  arrayFields.forEach((field) => {
    selectedJob.value[field] = Array.isArray(selectedJob.value[field])
      ? selectedJob.value[field]
      : [];
  });

  showEditModal.value = true;
};

const closeEditModal = () => {
  selectedJob.value = null;
  showEditModal.value = false;
};

// --- updateJob: Payload aligned with new schema ---
const updateJob = async (formDataFromModal) => {
  // formDataFromModal is what your JobEditModal.vue emits.
  // It needs to contain all fields, including the job 'id'.
  console.log(
    "Form data for job update (from JobEditModal.vue):",
    JSON.stringify(formDataFromModal, null, 2)
  );
  try {
    errorMessage.value = "";
    successMessage.value = "";

    if (!formDataFromModal || !formDataFromModal.id) {
      errorMessage.value = "Job ID is missing for update.";
      return;
    }

    // Construct the updatedJobData part of the payload
    // Your JobEditModal.vue must provide these fields structured correctly
    const updatedJobDetails = {
      jobTitle: formDataFromModal.jobTitle,
      applicationDeadline: formDataFromModal.applicationDeadline || null,
      status: formDataFromModal.status,
      riskTolerance: formDataFromModal.riskTolerance,

      requiredEducation: formDataFromModal.requiredEducation || [],
      requiredCertifications: formDataFromModal.requiredCertifications || [],
      requiredSkills: formDataFromModal.requiredSkills || [],
      preferredSkills: formDataFromModal.preferredSkills || [],
      requiredQuestions: formDataFromModal.requiredQuestions || [],
      candidateResourceLinks: formDataFromModal.candidateResourceLinks || [],
      hiringManagerIds: formDataFromModal.hiringManagerIds || [],

      jobType: formDataFromModal.jobType,
      interviewStages: formDataFromModal.interviewStages,
      jobDepartment: formDataFromModal.jobDepartment,
      jobDescription: formDataFromModal.jobDescription,
      jobLocation: formDataFromModal.jobLocation,
      travelRequirements: formDataFromModal.travelRequirements,
      salaryRange: formDataFromModal.salaryRange, // Changed from jobSalary
      teamSize: formDataFromModal.teamSize, // if still used

      techStack: formDataFromModal.techStack || {
        stack: [],
        architecture: "",
        scale: "",
        challenges: [],
        practices: [],
      },
      successCriteria: formDataFromModal.successCriteria || {
        immediate: [],
        longTerm: [],
      },
      candidatePersona: formDataFromModal.candidatePersona,
      // Note: Do not include orgId or createdAt in updatedJobData
    };

    const payload = {
      jobId: formDataFromModal.id,
      updatedJobData: updatedJobDetails,
    };
    console.log(
      "Payload for updateJobByIdCallable:",
      JSON.stringify(payload, null, 2)
    );

    const result = await updateJobByIdCallable(payload);

    if (result.data.success) {
      await fetchJobs();
      successMessage.value = "Job updated successfully!";
      closeEditModal();
    } else {
      errorMessage.value = result.data.message || "Failed to update job.";
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
    // This function now sends only chatbot specific settings,
    // ensure `chatbotSettings` is a recognized field in your job schema if you use this.
    // Or integrate chatbot settings into one of the existing complex objects.
    // For now, I'll assume it's a top-level field on the job for simplicity here.
    const payload = {
      jobId: selectedJob.value.id,
      updatedJobData: {
        chatbotSettings: settings, // Make sure 'chatbotSettings' is a field in your job schema
      },
    };
    const result = await updateJobByIdCallable(payload);
    if (result.data.success) {
      await fetchJobs();
      successMessage.value = "Chatbot settings updated successfully!";
      closeChatbotModal();
    } else {
      errorMessage.value =
        result.data.message || "Failed to update chatbot settings.";
    }
  } catch (error) {
    // ... error handling ...
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
  window.open(url, "_blank");
};

const getCandidateName = (application) => {
  return application?.candidate?.name || "Unknown Candidate";
};

const getApplicationDate = (application) => {
  return application?.completedAt || application?.applicationDate;
};

const getApplicationScore = (application) => {
  return application?.report?.score || "N/A";
};

const getApplicationStatus = (application) => {
  return application?.status || "Unknown";
};

// Modify openApplicationsModal to fetch application data
const openApplicationsModal = async (job) => {
  selectedJob.value = { ...job };
  showApplicationsModal.value = true;
  applicationsLoading.value = true;
  
  try {
    // First get the job document to get the applications array
    const result = await getApplicationsByJobId({ jobId: job.id });
    if (result.data.success) {
      applicationsData.value = result.data.applications;
    } else {
      applicationsData.value = [];
    }
  } catch (error) {
    console.error("Error loading applications:", error);
    applicationsData.value = [];
  } finally {
    applicationsLoading.value = false;
  }
};

const closeApplicationsModal = () => {
  selectedJob.value = null;
  showApplicationsModal.value = false;
};

// Add function to toggle summary expansion
const toggleSummary = (applicationId) => {
  if (expandedSummaries.value.has(applicationId)) {
    expandedSummaries.value.delete(applicationId);
  } else {
    expandedSummaries.value.add(applicationId);
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
    <div class="job-dashboard-container">
      <div class="page-header">
        <h1 class="page-title">
          <span class="icon-title"
            ><svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M7.5 6.75A.75.75 0 006 7.5v8.25a.75.75 0 00.75.75h8.25a.75.75 0 00.75-.75V7.5a.75.75 0 00-.75-.75h-1.5a.75.75 0 000 1.5h.75v6.75h-6.75V8.25h.75a.75.75 0 000-1.5h-1.5z"
              ></path>
              <path
                d="M10.84 10.153A.75.75 0 009.75 11.01v1.48a.75.75 0 001.499.076l.001-.076V11.01a.75.75 0 00-1.09-.857zM14.16 10.153a.75.75 0 00-1.09.857v1.48a.75.75 0 001.499.076l.001-.076V11.01a.75.75 0 00-1.09-.857z"
              ></path>
              <path
                fill-rule="evenodd"
                d="M3 3.75A2.75 2.75 0 015.75 1h12.5A2.75 2.75 0 0121 3.75v16.5A2.75 2.75 0 0118.25 23H5.75A2.75 2.75 0 013 20.25V3.75zm2.75-.25a1.25 1.25 0 00-1.25 1.25v16.5a1.25 1.25 0 001.25 1.25h12.5a1.25 1.25 0 001.25-1.25V3.75a1.25 1.25 0 00-1.25-1.25H5.75z"
                clip-rule="evenodd"
              ></path></svg
          ></span>
          Manage Jobs:
          {{
            authStore.orgs.find((org) => org.id === currentOrgId)
              ?.companyName || "Select an Org"
          }}
        </h1>
        <button
          @click="toggleJobForm"
          class="btn btn-primary add-btn"
          :disabled="!currentOrgId"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            class="btn-icon"
          >
            <path
              d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"
            />
          </svg>
          {{ showJobForm ? "Cancel Posting" : "Post New Job" }}
        </button>
      </div>

      <div class="alerts-container">
        <div v-if="errorMessage" class="alert alert-danger">
          <p>{{ errorMessage }}</p>
        </div>
        <div v-if="successMessage" class="alert alert-success">
          <p>{{ successMessage }}</p>
        </div>
      </div>

      <div v-if="showJobForm" class="job-form-wrapper">
        <ErrorBoundary>
          <Suspense>
            <template #default>
              <JobForm
                :onSubmit="createNewJob"
                :onClose="toggleJobForm"
                :currentOrgId="currentOrgId"
              />
            </template>
            <template #fallback
              ><LoadingSpinner message="Loading Job Form..."
            /></template>
          </Suspense>
        </ErrorBoundary>
      </div>

      <div v-else class="jobs-display-area">
        <div v-if="!currentOrgId && !authStore.loading" class="no-org-selected">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="placeholder-icon"
          >
            <path
              d="M4.5 3.75a3 3 0 00-3 3v10.5a3 3 0 003 3h15a3 3 0 003-3V6.75a3 3 0 00-3-3h-15zm4.125 2.625a2.625 2.625 0 115.25 0 2.625 2.625 0 01-5.25 0zM18.375 15.75H5.625c0-2.175 2.025-3.75 4.875-3.75s4.875 1.575 4.875 3.75z"
            ></path>
          </svg>
          <h3>No Organization Selected</h3>
          <p>
            Please select an organization from the sidebar to view or manage its
            job postings.
          </p>
        </div>

        <div v-if="currentOrgId">
          <div v-if="isLoading" class="loading-container">
            <LoadingSpinner message="Loading jobs..." />
          </div>

          <div
            v-else-if="jobs.length === 0 && !errorMessage && !authStore.loading"
            class="no-jobs-found"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="placeholder-icon"
            >
              <path
                fill-rule="evenodd"
                d="M4.5 2.25a.75.75 0 000 1.5v16.5a.75.75 0 000 1.5h15a.75.75 0 000-1.5V3.75a.75.75 0 000-1.5h-15zm9.75 3.75a.75.75 0 00-1.5 0v2.25H10.5a.75.75 0 000 1.5h2.25v2.25a.75.75 0 001.5 0v-2.25h2.25a.75.75 0 000-1.5h-2.25V6a.75.75 0 00-1.5 0z"
                clip-rule="evenodd"
              ></path>
            </svg>
            <h3>No Jobs Posted Yet</h3>
            <p>
              This organization doesn't have any active job postings. Be the
              first to add one!
            </p>
            <button @click="toggleJobForm" class="btn btn-secondary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                class="btn-icon"
              >
                <path
                  d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"
                />
              </svg>
              Post First Job
            </button>
          </div>

          <div v-if="jobs.length > 0" class="jobs-grid">
            <div v-for="job in jobs" :key="job.id" class="job-card">
              <div class="job-card-status-banner" :class="`status-${job.status?.toLowerCase()}`">
                {{ job.status || "Unknown" }}
              </div>
              <button @click.stop="openDeleteConfirmation(job)" class="btn-delete" title="Delete job">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.197-2.328.372A.75.75 0 003 5.25v1.5a.75.75 0 00.75.75H5v7.5A2.75 2.75 0 007.75 18h4.5A2.75 2.75 0 0015 15V7.5h1.25a.75.75 0 00.75-.75v-1.5a.75.75 0 00-.672-.743c-.748-.175-1.533-.295-2.328-.372V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.534.059 2.199.181C12.865 4.334 13.5 4.773 13.5 5.25V6H6.5V5.25c0-.477.635-.916 1.301-.969A18.5 18.5 0 0110 4zM8.5 7.5V15h3V7.5h-3z" clip-rule="evenodd"/>
                </svg>
              </button>
              <div class="job-card-header">
                <h3 class="job-title">{{ job.jobTitle || "Untitled Job" }}</h3>
                <p class="job-department">
                  {{ job.jobDepartment || "N/A Department" }}
                </p>
              </div>

              <div class="job-card-body">
                <div class="job-info-row">
                  <span class="info-item" title="Location">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      class="info-icon"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001zm.612-1.426a.75.75 0 011.06 0l.094.093a.75.75 0 01-1.06 1.06l-.093-.093a.75.75 0 010-1.06zm-2.122 2.121a.75.75 0 011.06 0l.094.093a.75.75 0 01-1.06 1.06l-.093-.093a.75.75 0 010-1.06zM10 2a.75.75 0 01.75.75v.008c.006.064.018.18.036.335l.01.078c.074.576.208 1.319.427 2.132l.03.114c.588 2.213 1.618 4.539 2.949 6.919l.002.004c1.536 2.783 3.072 5.885 3.072 8.092A6.25 6.25 0 0110 21.25S3.75 18.092 3.75 15.875C3.75 13.668 5.286 10.566 6.822 7.783l.002-.004c1.331-2.38 2.361-4.706 2.95-6.92l.03-.113a12.532 12.532 0 01.045-.413V2.75A.75.75 0 0110 2zM8.5 10.5a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    {{ job.jobLocation || "N/A" }}
                  </span>
                  <span class="info-item" title="Employment Type">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      class="info-icon"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M2 5a3 3 0 013-3h10a3 3 0 013 3v10a3 3 0 01-3 3H5a3 3 0 01-3-3V5zm2 .75A.75.75 0 014.75 5h10.5a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75H4.75a.75.75 0 01-.75-.75V5.75z"
                        clip-rule="evenodd"
                      />
                      <path
                        d="M7.75 8a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5z"
                      />
                    </svg>
                    {{ job.jobType || "N/A" }}
                  </span>
                </div>
                <div class="job-info-row">
                  <span class="info-item" title="Salary Range">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      class="info-icon"
                    >
                      <path
                        d="M10.75 4.75a.75.75 0 00-1.5 0V6h-.75a2.25 2.25 0 00-2.25 2.25v2.5a2.25 2.25 0 002.25 2.25h.75v.25a.75.75 0 001.5 0V6A.75.75 0 0010.75 4.75z"
                      />
                      <path
                        fill-rule="evenodd"
                        d="M9.5 7.284V6.75a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.534c.609.122 1.08.307 1.458.528a.75.75 0 01-.622 1.353A5.07 5.07 0 0011.5 8.25H8.5a5.07 5.07 0 00-.834.915.75.75 0 01-1.17-.834A2.999 2.999 0 019.5 7.284zM8.5 11.75a.75.75 0 01.75-.75h2.5a.75.75 0 010 1.5h-2.5a.75.75 0 01-.75-.75z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    {{ job.salaryRange || "Not Disclosed" }}
                  </span>
                  <span class="info-item" title="Application Deadline">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      class="info-icon"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.14 0-.277.028-.4.082V15.25c0 .14.028.277.082.4H3.25A1.25 1.25 0 012 14.429V7.5c0-.14.028-.277.082-.4h1.592A2.253 2.253 0 014.75 7.5zm8.5 0c.14 0 .277.028.4.082V15.25c0 .14-.028.277-.082.4h1.168A1.25 1.25 0 0018 14.429V7.5c0-.14-.028-.277-.082-.4h-1.592A2.253 2.253 0 0013.25 7.5z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    {{ formatTimestamp(job.applicationDeadline) }}
                  </span>
                </div>

                <div
                  class="job-skills-preview"
                  v-if="job.requiredSkills && job.requiredSkills.length"
                >
                  <span
                    v-for="skill in job.requiredSkills.slice(0, 3)"
                    :key="skill"
                    class="skill-tag"
                  >
                    {{ skill }}
                  </span>
                  <span
                    v-if="job.requiredSkills.length > 3"
                    class="skill-tag more-skills"
                  >
                    +{{ job.requiredSkills.length - 3 }} more
                  </span>
                </div>

                <div class="application-link-section">
                  <p class="link-label">Public Application Link:</p>
                  <div class="link-input-group">
                    <input
                      type="text"
                      :value="`http://hireflow.firebaseapp.com/applications/${currentOrgId}/${job.id}`"
                      readonly
                      class="application-url-display"
                    />
                    <button
                      @click.stop="
                        copyToClipboard(
                          `http://hireflow.firebaseapp.com/applications/${currentOrgId}/${job.id}`
                        )
                      "
                      class="btn btn-icon-action"
                      title="Copy link"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.121A1.5 1.5 0 0117 6.621V16.5a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 017 16.5v-13z"
                        ></path>
                        <path
                          d="M5 6.5A1.5 1.5 0 016.5 5h3.879a1.5 1.5 0 011.06.44l3.122 3.121A1.5 1.5 0 0115 9.621V14.5A1.5 1.5 0 0113.5 16H6.5A1.5 1.5 0 015 14.5v-8zM6.5 6.5V14.5h7V9.621a.5.5 0 00-.146-.353l-3.122-3.121A.5.5 0 009.379 6H6.5z"
                        ></path>
                      </svg>
                    </button>
                    <button
                      @click.stop="
                        openInNewTab(
                          `http://localhost:8080/applications/${currentOrgId}/${job.id}`
                        )
                      "
                      class="btn btn-icon-action"
                      title="Open link"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.976-1.138 2.5 2.5 0 01-.142-3.667l3-3z"
                        ></path>
                        <path
                          d="M11.603 7.963a.75.75 0 00-.976 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 005.656 5.656l3-3a4 4 0 00-.225-5.865z"
                        ></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div class="job-card-footer">
                <button
                  @click.stop="openApplicationsModal(job)"
                  class="btn btn-secondary btn-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    class="btn-icon"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0a.75.75 0 01.75-.75h11.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75v-7.5z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  View Applications
                </button>
                <button
                  @click.stop="openEditModal(job)"
                  class="btn btn-secondary btn-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    class="btn-icon"
                  >
                    <path
                      d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z"
                    />
                  </svg>
                  Edit
                </button>
                <button
                  @click.stop="openChatbotModal(job)"
                  class="btn btn-secondary btn-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    class="btn-icon"
                  >
                    <path
                      d="M10 9a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0v-2.5A.75.75 0 0110 9z"
                    ></path>
                    <path
                      fill-rule="evenodd"
                      d="M2 5a3 3 0 013-3h10a3 3 0 013 3v6a3 3 0 01-3 3h-2.035A3.98 3.98 0 0013 17.394V18a1 1 0 01-1 1h-4a1 1 0 01-1-1v-.606A3.98 3.98 0 007.035 14H5a3 3 0 01-3-3V5zm6.057 9H11.5A2.5 2.5 0 0014 11.5V6H2.5v5.5A2.5 2.5 0 005 14h.035A3.98 3.98 0 005.5 15H8.5a3.983 3.983 0 002.443-1H12.5A2.5 2.5 0 0015 11.5V6H6v5.5A2.5 2.5 0 008.5 14z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  Configure Bot
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ErrorBoundary
        ><Suspense>
          <template #default
            ><JobEditModal
              v-if="showEditModal"
              :show="showEditModal"
              :job="selectedJob"
              @submit="updateJob"
              @close="closeEditModal"
          /></template>
          <template #fallback
            ><LoadingSpinner message="Loading edit form..."
          /></template> </Suspense
      ></ErrorBoundary>

      <ErrorBoundary
        ><Suspense>
          <template #default
            ><ChatbotConfigModal
              v-if="showChatbotModal"
              :show="showChatbotModal"
              :job="selectedJob"
              @submit="updateChatbotSettings"
              @close="closeChatbotModal"
          /></template>
          <template #fallback
            ><LoadingSpinner message="Loading chatbot settings..."
          /></template> </Suspense
      ></ErrorBoundary>

      <div
        v-if="showDeleteConfirmation"
        class="modal-overlay"
        @click.self="closeDeleteConfirmation"
      >
        <div class="confirmation-modal-container">
          <div class="confirmation-modal-header">
            <h3>Confirm Deletion</h3>
            <button
              @click="closeDeleteConfirmation"
              class="btn-close-modal"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
          <div class="confirmation-modal-body">
            <p>
              Are you sure you want to permanently delete the job:
              <br /><strong>{{ selectedJob?.jobTitle }}</strong
              >?
            </p>
            <p class="warning-text">
              This action cannot be undone and all associated data will be lost.
            </p>
          </div>
          <div class="confirmation-modal-footer">
            <button @click="closeDeleteConfirmation" class="btn btn-secondary">
              Cancel
            </button>
            <button @click="deleteJob" class="btn btn-danger">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                class="btn-icon"
              >
                <path
                  fill-rule="evenodd"
                  d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.197-2.328.372A.75.75 0 003 5.25v1.5a.75.75 0 00.75.75H5v7.5A2.75 2.75 0 007.75 18h4.5A2.75 2.75 0 0015 15V7.5h1.25a.75.75 0 00.75-.75v-1.5a.75.75 0 00-.672-.743c-.748-.175-1.533-.295-2.328-.372V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.534.059 2.199.181C12.865 4.334 13.5 4.773 13.5 5.25V6H6.5V5.25c0-.477.635-.916 1.301-.969A18.5 18.5 0 0110 4zM8.5 7.5V15h3V7.5h-3z"
                  clip-rule="evenodd"
                />
              </svg>
              Yes, Delete
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="showApplicationsModal"
        class="modal-overlay"
        @click.self="closeApplicationsModal"
      >
        <div class="applications-modal-container">
          <div class="applications-modal-header">
            <h3>Applications for {{ selectedJob?.jobTitle }}</h3>
            <button
              @click="closeApplicationsModal"
              class="btn-close-modal"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
          <div class="applications-modal-body">
            <div v-if="applicationsLoading" class="loading-container">
              <LoadingSpinner message="Loading applications..." />
            </div>
            <div v-else-if="!applicationsData.length" class="no-applications">
              <p>No applications received yet.</p>
            </div>
            <table v-else class="applications-table">
              <thead>
                <tr>
                  <th>Candidate Name</th>
                  <th>Date Completed</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Summary</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="application in applicationsData" :key="application.id">
                  <tr>
                    <td>{{ getCandidateName(application) }}</td>
                    <td>{{ formatTimestamp(getApplicationDate(application)) }}</td>
                    <td>{{ getApplicationScore(application) }}</td>
                    <td>
                      <span :class="`status-${getApplicationStatus(application)?.toLowerCase()}`">
                        {{ getApplicationStatus(application) }}
                      </span>
                    </td>
                    <td>
                      <button 
                        v-if="application.report?.summary"
                        @click="toggleSummary(application.id)"
                        class="btn-summary"
                        :class="{ 'expanded': expandedSummaries.has(application.id) }"
                      >
                        {{ expandedSummaries.has(application.id) ? 'Hide Summary' : 'Show Summary' }}
                      </button>
                      <span v-else class="no-summary">No summary available</span>
                    </td>
                  </tr>
                  <tr v-if="expandedSummaries.has(application.id)" class="summary-row">
                    <td colspan="5">
                      <div class="summary-panel">
                        <div class="summary-content">
                          <h4>Interview Summary for {{ getCandidateName(application) }}</h4>
                          <p>{{ application.report?.summary || 'No summary available' }}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </SideBarLayout>
</template>

<style scoped>
/* Base Dashboard Styles */
.job-dashboard-container {
  max-width: 1300px;
  margin: 1.5rem auto;
  padding: 0 1.5rem;
  font-family: "Inter", sans-serif;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}
.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a202c;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.icon-title svg {
  width: 28px;
  height: 28px;
  color: #4a90e2;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.6rem 1rem;
  border: 1px solid transparent;
  border-radius: 0.375rem; /* 6px */
  font-size: 0.875rem; /* 14px */
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  text-decoration: none;
  line-height: 1.25;
}
.btn-icon {
  width: 1.125rem; /* 18px */
  height: 1.125rem;
  margin-right: 0.375rem;
}
.btn-primary {
  background-color: #4a90e2;
  color: white;
  border-color: #4a90e2;
}
.btn-primary:hover {
  background-color: #357abd;
  border-color: #357abd;
}
.btn-primary:disabled {
  background-color: #a0aec0;
  border-color: #a0aec0;
  color: #e2e8f0;
  cursor: not-allowed;
}
.btn-secondary {
  background-color: #6c757d;
  color: white;
  border-color: #6c757d;
}
.btn-secondary:hover {
  background-color: #5a6268;
  border-color: #545b62;
}
.btn-danger {
  background-color: #e53e3e;
  color: white;
  border-color: #e53e3e;
}
.btn-danger:hover {
  background-color: #c53030;
  border-color: #c53030;
}
.btn-sm {
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
  white-space: nowrap;
  min-width: fit-content;
}

/* Alerts */
.alerts-container {
  margin-bottom: 1.5rem;
}
.alert {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  border-width: 1px;
  border-style: solid;
}
.alert-danger {
  background-color: #fff5f5;
  border-color: #f56565;
  color: #c53030;
}
.alert-success {
  background-color: #f0fff4;
  border-color: #38a169;
  color: #2f855a;
}

/* Job Form Wrapper */
.job-form-wrapper {
  background-color: #ffffff;
  padding: 2rem;
  border-radius: 0.75rem; /* 12px */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

/* Jobs Display Area */
.jobs-display-area {
  margin-top: 1rem;
}
.no-org-selected,
.no-jobs-found {
  text-align: center;
  padding: 3rem 1.5rem;
  background-color: #f8f9fa;
  border-radius: 0.75rem;
  border: 1px dashed #e2e8f0;
  color: #6c757d;
}
.placeholder-icon {
  width: 3.5rem;
  height: 3.5rem;
  margin-bottom: 1rem;
  color: #cbd5e0;
}
.no-org-selected h3,
.no-jobs-found h3 {
  font-size: 1.375rem;
  color: #4a5568;
  margin-bottom: 0.5rem;
}
.no-org-selected p,
.no-jobs-found p {
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

/* Job Grid & Cards - Enhanced UX */
.jobs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.75rem;
}
.job-card {
  background-color: white;
  border-radius: 0.75rem; /* 12px */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
  position: relative; /* For status banner */
  overflow: hidden; /* For status banner */
}
.job-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.job-card-status-banner {
  position: absolute;
  top: 12px;
  right: -35px; /* Adjust for rotation */
  background-color: #6c757d; /* Default/Unknown status */
  color: white;
  padding: 0.25rem 2.5rem; /* Wide padding for rotated text */
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transform: rotate(45deg);
  transform-origin: top right;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 1;
  text-align: center;
}
.status-active {
  background-color: #28a745;
}
.status-pending {
  background-color: #ffc107;
  color: #333;
}
.status-closed {
  background-color: #dc3545;
}
.status-draft {
  background-color: #6c757d;
}

.job-card-header {
  padding: 1.25rem;
  border-bottom: 1px solid #e8edf3;
}
.job-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 0.25rem 0;
}
.job-department {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
}

.job-card-body {
  padding: 1.25rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.job-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}
.info-item {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  color: #4a5568;
}
.info-icon {
  width: 1rem;
  height: 1rem;
  margin-right: 0.375rem;
  color: #94a3b8;
}

.job-skills-preview {
  margin-top: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}
.skill-tag {
  background-color: #eef2ff;
  color: #4338ca;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
}
.skill-tag.more-skills {
  background-color: #f1f5f9;
  color: #64748b;
}

.application-link-section {
  margin-top: 1rem;
}
.link-label {
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 0.25rem;
  font-weight: 500;
}
.link-input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.application-url-display {
  flex-grow: 1;
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  color: #4a5568;
  background-color: #f8f9fa;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.btn-icon-action {
  background: none;
  border: 1px solid #cbd5e0;
  color: #64748b;
  padding: 0.5rem;
  border-radius: 0.375rem;
}
.btn-icon-action:hover {
  background-color: #f1f5f9;
  color: #334155;
}
.btn-icon-action svg {
  width: 1rem;
  height: 1rem;
}

.job-card-footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid #e8edf3;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  background-color: #fcfdff;
  flex-wrap: wrap;
}

/* Modals */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(10, 20, 30, 0.65);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
  padding: 1rem;
  backdrop-filter: blur(3px);
}

/* Confirmation Modal */
.confirmation-modal-container {
  background: white;
  border-radius: 0.5rem;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}
.confirmation-modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.confirmation-modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #343a40;
}
.confirmation-modal-body {
  padding: 1.5rem;
  font-size: 0.95rem;
}
.warning-text {
  color: #dc3545;
  font-weight: 500;
  margin-top: 0.75rem;
  font-size: 0.9rem;
}
.confirmation-modal-footer {
  padding: 1rem 1.5rem;
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-close-modal {
  background: none;
  border: none;
  font-size: 1.75rem;
  line-height: 1;
  cursor: pointer;
  color: #9ca3af;
  padding: 0;
}
.btn-close-modal:hover {
  color: #374151;
}

@media (max-width: 768px) {
  .job-dashboard-container {
    padding: 1rem;
  }
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  .jobs-grid {
    grid-template-columns: 1fr;
  }
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  width: 100%;
}

.applications-modal-container {
  background: white;
  border-radius: 0.5rem;
  width: 100%;
  max-width: 800px;
  max-height: 80vh;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

.applications-modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.applications-modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.applications-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.applications-table th,
.applications-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

.applications-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
}

.applications-table tr:hover {
  background-color: #f8f9fa;
}

.no-applications {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.applications-table td .status-completed {
  color: #28a745;
  font-weight: 500;
}

.applications-table td .status-not-completed {
  color: #ffc107;
  font-weight: 500;
}

.applications-table td .status-unknown {
  color: #6c757d;
  font-weight: 500;
}

.btn-delete {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: none;
  border: none;
  color: #dc3545;
  padding: 0.25rem;
  cursor: pointer;
  z-index: 2;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.btn-delete:hover {
  opacity: 1;
}

.btn-delete svg {
  width: 1.25rem;
  height: 1.25rem;
}

.btn-summary {
  background: none;
  border: 1px solid #e2e8f0;
  color: #4a5568;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-summary:hover {
  background-color: #f7fafc;
  border-color: #cbd5e0;
}

.btn-summary.expanded {
  background-color: #ebf8ff;
  border-color: #4299e1;
  color: #2b6cb0;
}

.no-summary {
  color: #a0aec0;
  font-size: 0.75rem;
  font-style: italic;
}

.summary-row {
  background-color: #f8fafc;
}

.summary-row td {
  padding: 0 !important;
}

.summary-panel {
  margin: 0;
  padding: 1rem;
  background-color: #f8fafc;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}

.summary-content {
  max-width: 100%;
}

.summary-content h4 {
  margin: 0 0 0.5rem 0;
  color: #2d3748;
  font-size: 0.9rem;
  font-weight: 600;
}

.summary-content p {
  margin: 0;
  color: #4a5568;
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: pre-wrap;
}
</style>
