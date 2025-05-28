<script setup>
import { useRoute, useRouter } from "vue-router";
import { onMounted, ref } from "vue";
import { useCandidateAuthStore } from "@/stores/candidate";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/firebase.config";

// Components
import NavButton from "@/components/ui/NavButton/NavButton.vue";
import LoadingSpinner from "@/components/ui/LoadingSpinner.vue";

const route = useRoute();
const router = useRouter();
const candidateAuthStore = useCandidateAuthStore();
const functions = getFunctions(app);

const sendChat = httpsCallable(functions, "geminiChatbot");
const parseForm = httpsCallable(functions, "parseApplicationForm");

const currentMessageForGemini = ref("");
const historyForGemini = ref([]);

const isSendingMessage = ref(false);
const chatError = ref("");
const showChatbot = ref(false);
const employmentForm = ref({
  employmentStatus: "",
  yearsOfExperience: "",
  currentSalary: "",
  noticePeriod: "",
});
const selectedResumeText = ref(null);

// Refs for application and report IDs
const applicationId = ref(null);
const reportId = ref(null);
const jobDetails = ref(null); // To store job details
const orgDetails = ref(null); // To store org details

// State refs
const isLoading = ref(true); // Overall loading for the page
const isLoadingDetails = ref(false); // Specific loading for job/org details
const errorMessage = ref("");
const successMessage = ref("");
const isExistingApplication = ref(false);

// Callable function references
const createApplicationCallable = httpsCallable(functions, "createApplication");
const getPublicJobDetailsCallable = httpsCallable(
  functions,
  "getPublicJobDetails"
);
const getPublicOrgDetailsCallable = httpsCallable(
  functions,
  "getPublicOrgDetails"
);


async function sendMessageToGemini() {
  if (!currentMessageForGemini.value.trim()) return;

  isSendingMessage.value = true;
  chatError.value = "";

  try {
    const geminiMessage = {
      message: currentMessageForGemini.value,
    }

    const result = await sendChat({
      candidateId: candidateAuthStore.candidate.uid,
      orgId: route.params.orgId,
      jobId: route.params.jobId,
      applicationId: applicationId.value,
      history: historyForGemini.value,
      message: geminiMessage,
    });

    historyForGemini.value.push({
      parts: [{ text: currentMessageForGemini.value}],
      role: 'user', // It's good practice to explicitly define the role for the outgoing message too.
    });

    historyForGemini.value.push({
      parts: [{ text: result.data.response }],
      role: 'model', 
    });

    currentMessageForGemini.value = "";
  } catch (error) {
    chatError.value = "Failed to send message. Please try again.";
    console.error("Chat error:", error);
  } finally {
    isSendingMessage.value = false;
  }
}

const handleFormSubmitAndInitializeChatbot = async () => {
  chatError.value = '';

  if (!selectedResumeText.value || selectedResumeText.value.trim() === '') {
    chatError.value = "Please paste the resume text.";
    return;
  }

  try {

    const payload = {
      resumeText: selectedResumeText.value,
      employmentStatus: employmentForm.value.employmentStatus,
      yearsOfExperience: employmentForm.value.yearsOfExperience || "",
      currentSalary: employmentForm.value.currentSalary || "",
      noticePeriod: employmentForm.value.noticePeriod || "",
      applicationId: applicationId.value || "",
      userId: candidateAuthStore.candidate.uid,
    };

    const result = await parseForm(payload);

    if (result.data && result.data.success) {
      showChatbot.value = true;
    } else {
      chatError.value = (result.data && result.data.message) || "Unknown error during submission.";
      console.error("Client: Server reported non-success:", result.data);
    }
  } catch (error) {
    console.error("Client: Cloud Function call failed:", error);
    if (error.code) {
      chatError.value = `Error (${error.code}): ${error.message}`;
    } else {
      chatError.value = "Failed to submit form. Please try again.";
    }
  }
};




// Function to format Firestore Timestamps or date strings
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
    date = new Date(Date.UTC(parts[0], parseInt(parts[1]) - 1, parts[2]));
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC", // Display in local time, but acknowledge it was parsed as UTC
    });
  } else if (timestampInput instanceof Date) {
    date = timestampInput;
  } else {
    try {
      date = new Date(timestampInput); // Try parsing other string formats
      if (isNaN(date.getTime())) return String(timestampInput); // If still invalid, return original
    } catch (e) {
      return String(timestampInput); // Fallback
    }
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

async function fetchJobAndOrgDetails(jobId, orgId) {
  isLoadingDetails.value = true;
  try {
    const [jobResult, orgResult] = await Promise.all([
      getPublicJobDetailsCallable({ jobId }),
      getPublicOrgDetailsCallable({ orgId }),
    ]);

    if (jobResult.data.success && jobResult.data.job) {
      jobDetails.value = jobResult.data.job;
      console.log("Fetched Job Details:", jobDetails.value);
    } else {
      errorMessage.value += ` Could not load job details: ${
        jobResult.data.message || ""
      }`;
    }

    if (orgResult.data.success && orgResult.data.organization) {
      orgDetails.value = orgResult.data.organization;
      console.log("Fetched Org Details:", orgDetails.value);
    } else {
      errorMessage.value += ` Could not load organization details: ${
        orgResult.data.message || ""
      }`;
    }
  } catch (error) {
    console.error("Error fetching job/org details:", error);
    errorMessage.value += ` Critical error fetching job/org data: ${error.message}.`;
  } finally {
    isLoadingDetails.value = false;
  }
}

onMounted(async () => {
  isLoading.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  const orgIdParam = route.params.orgId;
  const jobIdParam = route.params.jobId;

  if (!candidateAuthStore.isAuthenticated) {
    errorMessage.value = "Candidate not authenticated. Redirecting to login...";
    setTimeout(() => {
      router.push({
        name: "CandidateLogin",
        query: {
          orgId: orgIdParam,
          jobId: jobIdParam,
          redirect: route.fullPath,
        },
      });
    }, 2000);
    isLoading.value = false;
    return;
  }

  const candidateId = candidateAuthStore.candidate.uid;

  if (!orgIdParam || !jobIdParam) {
    errorMessage.value = "Organization ID or Job ID is missing from the route.";
    isLoading.value = false;
    return;
  }

  try {
    const result = await createApplicationCallable({
      candidateId,
      jobId: jobIdParam,
      orgId: orgIdParam,
    });

    if (result.data.success) {
      applicationId.value = result.data.applicationId;
      reportId.value = result.data.reportId;
      isExistingApplication.value = result.data.isExisting || false;

      if (isExistingApplication.value) {
        successMessage.value = `Welcome back! Existing application loaded.`;
      } else {
        successMessage.value = `Application successfully created!`;
      }
      console.log("Application processing successful:", result.data);

      // Fetch job and org details after application is confirmed/created
      await fetchJobAndOrgDetails(jobIdParam, orgIdParam);
    } else {
      errorMessage.value =
        result.data.message || "Failed to create or retrieve application.";
    }
  } catch (error) {
    console.error("Error calling createApplication function:", error);
    errorMessage.value = `Error processing application: ${
      error.message || "An unexpected error occurred."
    }`;
    if (error.details) console.error("Error details:", error.details);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="application-details-container">
    <header class="page-header">
      <NavButton
        :path="{ name: 'CandidateDashboard' }"
        text="Back to Dashboard"
        icon="←"
      />
      <h1>Job Application</h1>
    </header>

    <div v-if="isLoading && !applicationId" class="loading-state">
      <LoadingSpinner message="Processing your application..." />
    </div>
    <div v-else-if="isLoadingDetails && applicationId" class="loading-state">
      <LoadingSpinner message="Loading job details..." />
    </div>

    <div v-if="errorMessage && !isLoading" class="error-message">
      <p>{{ errorMessage }}</p>
    </div>

    <div
      v-if="successMessage && !isLoading && !errorMessage"
      class="success-message"
    >
      <p>{{ successMessage }}</p>
    </div>

    <div
      v-if="
        !isLoading && (applicationId || isExistingApplication) && !errorMessage
      "
      class="application-content"
    >
      <div v-if="orgDetails" class="org-header">
        <img
          v-if="orgDetails.logoUrl"
          :src="orgDetails.logoUrl"
          :alt="`${orgDetails.companyName} logo`"
          class="org-logo"
          onerror="this.style.display='none'"
        />
        <h2>{{ orgDetails.companyName }}</h2>
        <p class="org-location">{{ orgDetails.location }}</p>
      </div>

      <div v-if="jobDetails" class="job-summary">
        <h3>{{ jobDetails.jobTitle }}</h3>
        <p class="job-department">{{ jobDetails.jobDepartment }}</p>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <span class="label">Application ID:</span>
          <span class="value">{{ applicationId }}</span>
        </div>
        <div v-if="!isExistingApplication && reportId" class="info-item">
          <span class="label">Report ID:</span>
          <span class="value">{{ reportId }}</span>
        </div>
        <div class="info-item">
          <span class="label">Application Date:</span>
          <span class="value">{{ formatTimestamp(new Date()) }}</span>
        </div>
      </div>

      <section v-if="jobDetails" class="job-details-section">
        <h4>About the Role</h4>
        <p class="job-description">
          {{ jobDetails.jobDescription || "No description provided." }}
        </p>

        <div class="details-columns">
          <div>
            <h5>Key Information</h5>
            <p>
              <strong>Location:</strong> {{ jobDetails.jobLocation || "N/A" }}
            </p>
            <p><strong>Job Type:</strong> {{ jobDetails.jobType || "N/A" }}</p>
            <p>
              <strong>Team Size:</strong> {{ jobDetails.teamSize || "N/A" }}
            </p>
            <p>
              <strong>Application Deadline:</strong>
              {{ formatTimestamp(jobDetails.applicationDeadline) }}
            </p>
          </div>
          <div>
            <h5>Requirements</h5>
            <p>
              <strong>Education:</strong>
              {{ jobDetails.requiredEducation || "N/A" }}
            </p>
            <p>
              <strong>Certifications:</strong>
              {{ jobDetails.requiredCertifications || "N/A" }}
            </p>
            <p>
              <strong>Travel:</strong>
              {{ jobDetails.travelRequirements || "N/A" }}
            </p>
          </div>
        </div>

        <h5>Skills</h5>
        <p>
          <strong>Required:</strong> {{ jobDetails.requiredSkills || "N/A" }}
        </p>
        <p>
          <strong>Preferred:</strong> {{ jobDetails.preferredSkills || "N/A" }}
        </p>
        <p><strong>Tech Stack:</strong> {{ jobDetails.techStack || "N/A" }}</p>

        <div v-if="jobDetails.candidateResourceLinks">
          <h5>Candidate Resources</h5>
          <p>
            <a
              :href="jobDetails.candidateResourceLinks"
              target="_blank"
              rel="noopener noreferrer"
              >{{ jobDetails.candidateResourceLinks }}</a
            >
          </p>
        </div>
      </section>

      <section v-if="orgDetails" class="org-details-section">
        <h4>About {{ orgDetails.companyName }}</h4>
        <p>
          {{
            orgDetails.companyDescription || "No company description provided."
          }}
        </p>
        <p v-if="orgDetails.missionStatement">
          <strong>Mission:</strong> {{ orgDetails.missionStatement }}
        </p>
        <p v-if="orgDetails.industry">
          <strong>Industry:</strong> {{ orgDetails.industry }}
        </p>
      </section>

      <div class="form-group">
        <label for="resumeText">Paste Resume Text Here</label>
        <textarea
          id="resumeText"
          v-model="selectedResumeText"
          rows="15"                     placeholder="Copy and paste your resume content here..."
          class="form-input text-area"  ></textarea>
        <small class="form-text-muted">
          Please copy the plain text from your resume.
        </small>
      </div>

      <div class="application-form" v-if="!showChatbot">
        <h3>Complete Your Application</h3>
        <p class="form-description">
          Please provide some basic information to help us better understand
          your background.
        </p>

        <form
          @submit.prevent="handleFormSubmitAndInitializeChatbot"
          class="employment-form"
        >
          <div class="form-group">
            <label for="employmentStatus">Current Employment Status*</label>
            <select
              id="employmentStatus"
              v-model="employmentForm.employmentStatus"
              required
              class="form-input"
            >
              <option value="">Select your status</option>
              <option value="Employed">Employed</option>
              <option value="Unemployed">Unemployed</option>
              <option value="Self-employed">Self-employed</option>
              <option value="Student">Student</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div class="form-group">
            <label for="yearsOfExperience">Years of Experience</label>
            <input
              type="number"
              id="yearsOfExperience"
              v-model="employmentForm.yearsOfExperience"
              min="0"
              max="50"
              class="form-input"
              placeholder="Enter years of experience"
            />
          </div>

          <div class="form-group">
            <label for="currentSalary">Current Salary (Optional)</label>
            <input
              type="number"
              id="currentSalary"
              v-model="employmentForm.currentSalary"
              class="form-input"
              placeholder="Enter your current salary"
            />
          </div>

          <div class="form-group">
            <label for="noticePeriod">Notice Period (if employed)</label>
            <select
              id="noticePeriod"
              v-model="employmentForm.noticePeriod"
              class="form-input"
            >
              <option value="">Select notice period</option>
              <option value="Immediate">Immediate</option>
              <option value="1 week">1 week</option>
              <option value="2 weeks">2 weeks</option>
              <option value="1 month">1 month</option>
              <option value="2 months">2 months</option>
              <option value="3 months">3 months</option>
            </select>
          </div>

          <button type="submit" class="submit-button">
            Start Application Process
          </button>
        </form>
      </div>

      <div v-else class="chatbot-container">
        <div class="chat-messages" ref="chatMessages">
          <div>
            This is where the chatbot will say, we see your resume, see the job
            info and the org info... blah blah
          </div>
          <div
            v-for="(item, index) in historyForGemini"
            :key="index"
            class="message-group"
          >
            <div v-if="item.role === 'user'" class="message user-message">
              <div class="message-content">{{ item.parts[0].text }}</div>
            </div>
            <div v-if="item.role === 'model'" class="message bot-message">
              <div class="message-content">{{ item.parts[0].text }}</div>
            </div>
          </div>
        </div>

        <div v-if="chatError" class="chat-error">
          {{ chatError }}
        </div>

        <div class="chat-input-container">
          <input
            v-model="currentMessageForGemini"
            @keyup.enter="sendMessageToGemini"
            type="text"
            placeholder="Type your message..."
            :disabled="isSendingMessage"
            class="chat-input"
          />
          <button
            @click="sendMessageToGemini"
            :disabled="isSendingMessage || !currentMessageForGemini.trim()"
            class="send-button"
          >
            <span v-if="isSendingMessage">Sending...</span>
            <span v-else>Send</span>
          </button>
        </div>
      </div>
    </div>
    <div v-else-if="!isLoading && !errorMessage" class="no-application-data">
      <p>
        Could not load application data. Please try again or contact support.
      </p>
    </div>
  </div>
</template>

<style scoped>
.application-details-container {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
  font-family: "Poppins", sans-serif; /* Ensure Poppins is loaded or use a fallback */
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.07);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.page-header h1 {
  color: #2c3e50;
  font-size: 2.2rem;
  font-weight: 600;
}

.loading-state,
.error-message,
.success-message,
.no-application-data {
  text-align: center;
  padding: 1.5rem;
  margin: 1.5rem 0;
  border-radius: 8px;
  font-size: 1rem;
}

.error-message {
  background-color: #ffe3e3;
  color: #d32f2f;
  border: 1px solid #ffcdd2;
}

.success-message {
  background-color: #e6ffed;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}
.no-application-data {
  background-color: #fff8e1;
  color: #e65100;
  border: 1px solid #ffecb3;
}

.application-content {
  /* General content area after loading/messages */
  padding-top: 1rem;
}

.org-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px dashed #eee;
}
.org-logo {
  max-width: 120px;
  max-height: 80px;
  margin-bottom: 1rem;
  border-radius: 4px;
}
.org-header h2 {
  color: #333;
  font-size: 1.8rem;
  margin-bottom: 0.25rem;
}
.org-location {
  color: #666;
  font-size: 1rem;
}

.job-summary {
  text-align: center;
  margin-bottom: 2rem;
}
.job-summary h3 {
  font-size: 1.6rem;
  color: #1976d2; /* Highlight color for job title */
  margin-bottom: 0.25rem;
}
.job-department {
  font-size: 1rem;
  color: #555;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.2rem;
  background-color: #f9faff;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2.5rem;
  border: 1px solid #e8eef3;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item .label {
  font-size: 0.85rem;
  color: #5a6a7b;
  margin-bottom: 0.3rem;
  font-weight: 500;
  text-transform: uppercase;
}

.info-item .value {
  font-size: 0.95rem;
  color: #2c3e50;
  font-weight: 400;
  word-break: break-word;
}

.job-details-section,
.org-details-section {
  margin-bottom: 2.5rem;
  padding: 1.5rem;
  background-color: #fff;
  border-radius: 8px;
  border: 1px solid #eaeaea;
}

.job-details-section h4,
.org-details-section h4 {
  font-size: 1.3rem;
  color: #333;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
  font-weight: 600;
}
.job-details-section h5 {
  font-size: 1.1rem;
  color: #444;
  margin-top: 1.2rem;
  margin-bottom: 0.6rem;
  font-weight: 500;
}

.job-description,
.job-details-section p,
.org-details-section p {
  font-size: 0.95rem;
  color: #454545;
  line-height: 1.7;
  margin-bottom: 0.75rem;
  white-space: pre-wrap; /* To respect newlines in descriptions */
}
.job-details-section p strong,
.org-details-section p strong {
  color: #333;
  font-weight: 500;
}

.details-columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin: 1.5rem 0;
}

.application-form {
  margin-top: 2.5rem;
  padding: 2rem;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.form-description {
  text-align: center;
  color: #666;
  margin-bottom: 2rem;
}

.employment-form {
  max-width: 600px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #1976d2;
}

.submit-button {
  width: 100%;
  padding: 1rem;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-button:hover {
  background: #1565c0;
}

.submit-button:disabled {
  background: #b0bec5;
  cursor: not-allowed;
}

.chatbot-container {
  margin-top: 2rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.chat-messages {
  height: 400px;
  overflow-y: auto;
  padding: 1rem;
  background: #f8f9fa;
}

.message-group {
  margin-bottom: 1rem;
}

.message {
  max-width: 80%;
  margin-bottom: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  line-height: 1.4;
}

.user-message {
  margin-left: auto;
  background: #1976d2;
  color: white;
}

.bot-message {
  margin-right: auto;
  background: #e9ecef;
  color: #212529;
}

.message-content {
  word-wrap: break-word;
}

.chat-error {
  padding: 0.5rem;
  background: #ffe3e3;
  color: #d32f2f;
  text-align: center;
  font-size: 0.9rem;
}

.chat-input-container {
  display: flex;
  padding: 1rem;
  background: #fff;
  border-top: 1px solid #e0e0e0;
}

.chat-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-right: 0.5rem;
  font-size: 1rem;
}

.chat-input:focus {
  outline: none;
  border-color: #1976d2;
}

.send-button {
  padding: 0.75rem 1.5rem;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.send-button:hover:not(:disabled) {
  background: #1565c0;
}

.send-button:disabled {
  background: #b0bec5;
  cursor: not-allowed;
}
</style>
