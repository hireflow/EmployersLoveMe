<script setup>
import { onMounted, computed, watch, ref } from "vue";
import { useCandidateAuthStore } from "@/stores/candidate"; // Or your path to the store
import { useRouter } from "vue-router";
import LoadingSpinner from "@/components/ui/LoadingSpinner.vue";
import { getFunctions, httpsCallable } from "firebase/functions";

const candidateAuthStore = useCandidateAuthStore();
const router = useRouter();
const functions = getFunctions();

// Computed properties to reactively get data from the store
const applications = computed(() => candidateAuthStore.applicationsList);
const isLoading = computed(() => candidateAuthStore.isLoadingApplications);
const error = computed(() => candidateAuthStore.applicationsError);
const candidateIsLoggedIn = computed(() => !!candidateAuthStore.isAuthenticated);

const getApplicationDetails = httpsCallable(functions, 'getApplicationDetails');

// Add computed property for completed applications
const isApplicationComplete = (app) => {
  return app.status?.toLowerCase() === 'completed';
};

// Add state for feedback modal
const showFeedbackModal = ref(false);
const currentFeedback = ref(null);
const isLoadingFeedback = ref(false);
const feedbackError = ref(null);

const logoutAction = async () => {
  try {
    await candidateAuthStore.logout();
    router.push("/candidate-login");
  } catch (error) {
    console.error("Logout error:", error);
  }
};

onMounted(async () => {
  if (!candidateAuthStore.loading) {
    if (candidateIsLoggedIn.value) {
      await candidateAuthStore.fetchMyApplications();
    }
  } else {
    const unwatch = watch(
      () => candidateAuthStore.loading,
      (newInitLoading) => {
        if (!newInitLoading && candidateIsLoggedIn.value) {
          candidateAuthStore.fetchMyApplications();
          unwatch();
        } else if (!newInitLoading && !candidateIsLoggedIn.value) {
          unwatch();
        }
      }
    );
  }
});

const formatTimestamp = (timestampInput) => {
  if (!timestampInput) return "N/A";
  let date;
  if (
    timestampInput &&
    typeof timestampInput === "object" &&
    timestampInput._seconds !== undefined
  ) {
    date = new Date(
      timestampInput._seconds * 1000 +
        (timestampInput._nanoseconds || 0) / 1000000
    );
  } else if (timestampInput instanceof Date) {
    date = timestampInput;
  } else if (
    typeof timestampInput === "string" ||
    typeof timestampInput === "number"
  ) {
    try {
      date = new Date(timestampInput);
      if (isNaN(date.getTime())) return String(timestampInput);
    } catch (e) {
      return String(timestampInput);
    }
  } else {
    return "Invalid Date";
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const viewFeedback = async (applicationId) => {
  try {
    isLoadingFeedback.value = true;
    feedbackError.value = null;
    
    const result = await getApplicationDetails({ applicationId });

    if (result.data.success && result.data.data.report) {
      currentFeedback.value = result.data.data.report;
      console.log("currentFeedback", currentFeedback.value);
      showFeedbackModal.value = true;
    } else {
      feedbackError.value = "No feedback available for this application.";
    }
  } catch (error) {
    console.error("Error fetching feedback:", error);
    feedbackError.value = "Failed to load feedback. Please try again later.";
  } finally {
    isLoadingFeedback.value = false;
  }
};
</script>

<template>
  <div class="candidate-dashboard-container">
    <header class="page-header">
      <h1>My Applications</h1>
      <button class="logout-button" @click="logoutAction">Logout</button>
    </header>

    <div v-if="isLoading && applications.length === 0" class="loading-state">
      <LoadingSpinner message="Loading your applications..." />
    </div>

    <div v-else-if="error" class="error-message">
      <p>We encountered an error loading your applications: {{ error }}</p>
      <button
        @click="candidateAuthStore.fetchMyApplications()"
        class="try-again-button"
      >
        Try Again
      </button>
    </div>

    <div
      v-else-if="!candidateIsLoggedIn && !candidateAuthStore.loading"
      class="info-message"
    >
      <p>Please log in to see your applications.</p>
      <router-link :to="{ name: 'CandidateLogin' }" class="action-button"
        >Login</router-link
      >
    </div>

    <div v-else-if="applications.length > 0" class="applications-list">
      <div 
        v-for="app in applications" 
        :key="app.id" 
        class="application-card"
        :class="{ 'completed-application': isApplicationComplete(app) }"
      >
        <div class="card-header">
          <h3>{{ app.jobTitle }}</h3>
          <p class="company-name">{{ app.companyName }}</p>
        </div>
        <div class="card-body">
          <p>
            <strong>Applied on:</strong>
            {{ formatTimestamp(app.applicationDate) }}
          </p>
          <p>
            <strong>Status:</strong>
            <span
              :class="`status-${app.status
                ?.toLowerCase()
                .replace(/\s+/g, '-')}`"
              >{{ app.status || "N/A" }}</span
            >
          </p>
        </div>
        <div class="card-footer" v-if="!isApplicationComplete(app)">
          <router-link
            :to="{
              name: 'ApplicationDetails',
              params: { orgId: app.orgID, jobId: app.jobID },
            }"
            class="view-details-button"
            v-if="app.orgID && app.jobID"
          >
            View Details & Chat
          </router-link>
          <span v-else class="details-unavailable-text">
            Details temporarily unavailable
          </span>
        </div>
        <div class="card-footer" v-else>
          <button 
            class="view-feedback-button"
            @click="viewFeedback(app.id)"
            :disabled="isLoadingFeedback"
          >
            {{ isLoadingFeedback ? 'Loading...' : 'View Feedback' }}
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="!isLoading" class="no-applications">
      <p>You haven't submitted any applications yet.</p>
    </div>

    <!-- Feedback Modal -->
    <div v-if="showFeedbackModal" class="modal-overlay" @click="showFeedbackModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Application Feedback</h2>
          <button class="close-button" @click="showFeedbackModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="feedbackError" class="error-message">
            {{ feedbackError }}
          </div>
          <div v-else-if="currentFeedback">
            <div class="feedback-section">
              <h3>Summary</h3>
              <p>{{ currentFeedback || 'No summary available' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.candidate-dashboard-container {
  max-width: 900px;
  margin: 2rem auto;
  padding: 1rem 2rem;
  font-family: "Poppins", sans-serif;
}

.page-header {
  position: relative;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.page-header h1 {
  color: #2c3e50;
  font-size: 2rem;
  font-weight: 600;
  margin: 0;
}

/* New logout button styling */
.logout-button {
  position: absolute;
  top: 0.25rem;
  right: 0;
  background-color: #d32f2f;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.logout-button:hover {
  background-color: #b71c1c;
}

/* rest of your styles unchanged ... */
.loading-state,
.error-message,
.no-applications,
.info-message {
  text-align: center;
  padding: 2rem;
  margin-top: 2rem;
  border-radius: 8px;
}

.error-message {
  background-color: #ffe3e3;
  color: #d32f2f;
  border: 1px solid #ffcdd2;
}
.try-again-button,
.action-button {
  margin-top: 1rem;
  padding: 0.6rem 1.2rem;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  text-decoration: none;
  display: inline-block;
  font-size: 0.9rem;
}
.try-again-button {
  background-color: #d32f2f;
}
.try-again-button:hover {
  background-color: #b71c1c;
}
.action-button {
  background-color: #1976d2;
}
.action-button:hover {
  background-color: #1565c0;
}

.no-applications,
.info-message {
  background-color: #f0f4f8;
  color: #4a6a87;
  padding: 2rem;
  border: 1px dashed #c8d4e0;
}

.applications-list {
  display: grid;
  gap: 1.5rem;
}

.application-card {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  display: flex;
  flex-direction: column;
}

.application-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.card-header {
  padding: 1.25rem 1.5rem; /* Slightly adjusted padding */
  border-bottom: 1px solid #f0f0f0;
}

.card-header h3 {
  margin: 0 0 0.25rem 0;
  color: #1976d2;
  font-size: 1.2rem; /* Slightly adjusted size */
}

.company-name {
  margin: 0;
  color: #555;
  font-size: 0.9rem; /* Slightly adjusted size */
}

.card-body {
  padding: 1.25rem 1.5rem; /* Slightly adjusted padding */
  flex-grow: 1;
}

.card-body p {
  margin: 0.5rem 0;
  color: #333;
  font-size: 0.9rem;
}
.card-body p strong {
  color: #111;
  font-weight: 600; /* Bolder strong tags */
}

/* Example status styling - extend as needed */
.status-applied {
  color: #0277bd;
  font-weight: 500;
}
.status-chatbot-welcome-sent {
  color: #0288d1;
  font-weight: 500;
}
.status-interview-in-progress {
  color: #ff8f00;
  font-weight: 500;
}
.status-interview-completed {
  color: #388e3c;
  font-weight: 500;
}
.status-shortlisted {
  color: #6a1b9a;
  font-weight: 500;
}
.status-rejected-manual {
  color: #c62828;
  font-weight: 500;
}
/* Add more specific status styles here, ensure class names are sanitized (e.g. replace spaces with hyphens) */
[class^="status-"] {
  /* Default for any status not specifically styled */
  color: #424242;
  font-weight: 500;
}

.card-footer {
  padding: 1rem 1.5rem;
  background-color: #f9fafb; /* Slightly lighter footer */
  border-top: 1px solid #f0f0f0;
  text-align: right;
}

.view-details-button {
  background-color: #1976d2;
  color: white;
  padding: 0.6rem 1.2rem;
  border-radius: 4px;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.view-details-button:hover {
  background-color: #1565c0;
}
.details-unavailable-text {
  font-size: 0.85rem;
  color: #757575;
  font-style: italic;
}

.completed-application {
  background-color: #e8f5e9;
  border: 1px solid #a5d6a7;
}

.completed-application:hover {
  transform: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.completed-text {
  color: #2e7d32;
  font-weight: 500;
  font-size: 0.9rem;
}

.view-feedback-button {
  background-color: #4caf50;
  color: white;
  padding: 0.6rem 1.2rem;
  border-radius: 4px;
  border: none;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.view-feedback-button:hover {
  background-color: #388e3c;
}

.view-feedback-button:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
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

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
}

.modal-body {
  padding: 1.5rem;
}

.feedback-section {
  margin-bottom: 1.5rem;
}

.feedback-section h3 {
  color: #1976d2;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.feedback-section p {
  white-space: pre-wrap;
  line-height: 1.6;
  color: #333;
}

.question-response {
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.question-response .question {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.question-response .response {
  color: #666;
  margin: 0;
}
</style>
