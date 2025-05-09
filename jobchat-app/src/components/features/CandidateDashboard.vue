<script setup>
import { onMounted, computed, watch } from "vue";
import { useCandidateAuthStore } from "@/stores/candidate"; // Or your path to the store
import LoadingSpinner from "@/components/ui/LoadingSpinner.vue"; // Adjust path if needed
// import NavButton from '@/components/ui/NavButton/NavButton.vue'; // Not used in this version, but keep if needed elsewhere

const candidateAuthStore = useCandidateAuthStore();

// Computed properties to reactively get data from the store
const applications = computed(() => candidateAuthStore.applicationsList);
const isLoading = computed(() => candidateAuthStore.isLoadingApplications);
const error = computed(() => candidateAuthStore.applicationsError);
const candidateIsLoggedIn = computed(() => !!candidateAuthStore.candidate); // To ensure we only fetch if candidate is present

onMounted(async () => {
  // The initialize() in your store already handles loading from localStorage.
  // We should wait for initLoading to be false before attempting to fetch.
  if (!candidateAuthStore.initLoading) {
    if (candidateIsLoggedIn.value) {
      // console.log("CandidateDashboard: Attempting to fetch applications.");
      await candidateAuthStore.fetchMyApplications();
    } else {
      // console.log("CandidateDashboard: No candidate logged in, not fetching applications.");
      // Route guard should ideally handle redirecting unauthenticated users.
    }
  } else {
    // If initLoading is true, set up a watcher or rely on router guards to delay fetch
    // For simplicity here, we'll assume initLoading becomes false relatively quickly
    // or the user navigates here after init is done.
    // A robust way is to watch initLoading:
    const unwatch = watch(
      () => candidateAuthStore.initLoading,
      (newInitLoading) => {
        if (!newInitLoading && candidateIsLoggedIn.value) {
          // console.log("CandidateDashboard: initLoading finished, attempting to fetch applications.");
          candidateAuthStore.fetchMyApplications();
          unwatch(); // Stop watching once done
        } else if (!newInitLoading && !candidateIsLoggedIn.value) {
          // console.log("CandidateDashboard: initLoading finished, no candidate logged in.");
          unwatch();
        }
      }
    );
  }
});

// Re-usable timestamp formatter (consider moving to a utils file: src/utils/formatters.js)
const formatTimestamp = (timestampInput) => {
  if (!timestampInput) return "N/A";
  let date;
  if (
    timestampInput &&
    typeof timestampInput === "object" &&
    timestampInput._seconds !== undefined
  ) {
    // Firestore Timestamp object
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
      if (isNaN(date.getTime())) return String(timestampInput); // If parsing failed
    } catch (e) {
      return String(timestampInput); // Fallback
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
</script>

<template>
  <div class="candidate-dashboard-container">
    <header class="page-header">
      <h1>My Applications</h1>
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
      v-else-if="!candidateIsLoggedIn && !candidateAuthStore.initLoading"
      class="info-message"
    >
      <p>Please log in to see your applications.</p>
      <router-link :to="{ name: 'CandidateLogin' }" class="action-button"
        >Login</router-link
      >
    </div>

    <div v-else-if="applications.length > 0" class="applications-list">
      <div v-for="app in applications" :key="app.id" class="application-card">
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
        <div class="card-footer">
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
      </div>
    </div>

    <div v-else-if="!isLoading" class="no-applications">
      <p>You haven't submitted any applications yet.</p>
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
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.page-header h1 {
  color: #2c3e50;
  font-size: 2rem;
  font-weight: 600;
}

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
  background-color: #1976d2; /* Primary blue */
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
</style>
