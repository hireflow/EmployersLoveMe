// accept selected organization as a prop, display the jobs for the selected
organization
<script setup>
import { getFunctions, httpsCallable } from "firebase/functions";
import { watch, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { ref } from "vue";

const authStore = useAuthStore();
const functions = getFunctions();
const getJobsByOrgId = httpsCallable(functions, "getJobsByOrgId");

const jobs = ref([]);
const showJobForm = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

// Job form fields
const jobTitle = ref("");
const jobDepartment = ref("");
const jobDescription = ref("");
const jobLocation = ref("");
const jobSalary = ref("");
const employmentType = ref("");
const expectedJobDuration = ref("");
const applicationDeadline = ref("");
const salaryRange = ref("");
const responsibilities = ref("");
const requiredSkills = ref("");
const preferredSkills = ref("");
const minExperience = ref("");
const requiredCertifications = ref("");
const educationRequirements = ref("");
const workEnvironment = ref("");
const teamDynamics = ref("");
const growthOpportunities = ref("");
const interviewStages = ref("");
const diversityInitiatives = ref("");
const benefitsPackage = ref("");
const remoteWorkPolicy = ref("");
const travelRequirements = ref("");
const onboardingProcess = ref("");
const teamSize = ref("");
const techStack = ref("");
const candidateResourceLinks = ref("");

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

const createNewJob = async () => {
  try {
    errorMessage.value = "";
    successMessage.value = "";

    const result = await createJob({
      orgId: authStore.selectedOrg.id,
      hiringManagerId: authStore.user.uid,
      jobTitle: jobTitle.value,
      jobDepartment: jobDepartment.value,
      jobDescription: jobDescription.value,
      jobLocation: jobLocation.value,
      jobSalary: jobSalary.value,
      employmentType: employmentType.value,
      expectedJobDuration: expectedJobDuration.value,
      applicationDeadline: applicationDeadline.value,
      salaryRange: salaryRange.value,
      responsibilities: responsibilities.value,
      requiredSkills: requiredSkills.value,
      preferredSkills: preferredSkills.value,
      minExperience: minExperience.value,
      requiredCertifications: requiredCertifications.value,
      educationRequirements: educationRequirements.value,
      workEnvironment: workEnvironment.value,
      teamDynamics: teamDynamics.value,
      growthOpportunities: growthOpportunities.value,
      interviewStages: interviewStages.value,
      diversityInitiatives: diversityInitiatives.value,
      benefitsPackage: benefitsPackage.value,
      remoteWorkPolicy: remoteWorkPolicy.value,
      travelRequirements: travelRequirements.value,
      onboardingProcess: onboardingProcess.value,
      teamSize: teamSize.value,
      techStack: techStack.value,
      candidateResourceLinks: candidateResourceLinks.value,
    });

    if (result.data.success) {
      await fetchJobs();
      successMessage.value = "Job created successfully!";
      showJobForm.value = false;
      // Reset all form fields
      jobTitle.value = "";
      jobDepartment.value = "";
      jobDescription.value = "";
      jobLocation.value = "";
      jobSalary.value = "";
      employmentType.value = "";
      expectedJobDuration.value = "";
      applicationDeadline.value = "";
      salaryRange.value = "";
      responsibilities.value = "";
      requiredSkills.value = "";
      preferredSkills.value = "";
      minExperience.value = "";
      requiredCertifications.value = "";
      educationRequirements.value = "";
      workEnvironment.value = "";
      teamDynamics.value = "";
      growthOpportunities.value = "";
      interviewStages.value = "";
      diversityInitiatives.value = "";
      benefitsPackage.value = "";
      remoteWorkPolicy.value = "";
      travelRequirements.value = "";
      onboardingProcess.value = "";
      teamSize.value = "";
      techStack.value = "";
      candidateResourceLinks.value = "";
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
</script>

<template>
  <div class="job-dashboard">
    <h1>Jobs for {{ authStore.selectedOrg?.name }}</h1>

    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
    </div>

    <button @click="toggleJobForm" class="create-button">
      {{ showJobForm ? "Cancel" : "Create New Job" }}
    </button>

    <div v-if="showJobForm" class="job-form">
      <h2>Create New Job</h2>
      <form @submit.prevent="createNewJob" class="form-grid">
        <div class="form-group">
          <label>Basic Information</label>
          <input
            type="text"
            v-model="jobTitle"
            placeholder="Job Title"
            required
          />
          <input
            type="text"
            v-model="jobDepartment"
            placeholder="Job Department"
            required
          />
          <textarea
            v-model="jobDescription"
            placeholder="Job Description"
            required
          ></textarea>
          <input
            type="text"
            v-model="teamSize"
            placeholder="Team Size"
            required
          />
        </div>

        <div class="form-group">
          <label>Location & Compensation</label>
          <input
            type="text"
            v-model="jobLocation"
            placeholder="Job Location"
            required
          />
          <input
            type="text"
            v-model="salaryRange"
            placeholder="Salary Range"
            required
          />
          <input
            type="text"
            v-model="employmentType"
            placeholder="Employment Type (e.g., Full-time, Part-time)"
            required
          />
          <input
            type="text"
            v-model="expectedJobDuration"
            placeholder="Expected Job Duration"
            required
          />
          <input
            type="date"
            v-model="applicationDeadline"
            placeholder="Application Deadline"
            required
          />
        </div>

        <div class="form-group">
          <label>Requirements & Skills</label>
          <textarea
            v-model="responsibilities"
            placeholder="Job Responsibilities"
            required
          ></textarea>
          <textarea
            v-model="requiredSkills"
            placeholder="Required Skills"
            required
          ></textarea>
          <textarea
            v-model="preferredSkills"
            placeholder="Preferred Skills"
          ></textarea>
          <input
            type="text"
            v-model="minExperience"
            placeholder="Minimum Experience"
            required
          />
          <input
            type="text"
            v-model="educationRequirements"
            placeholder="Education Requirements"
            required
          />
          <input
            type="text"
            v-model="requiredCertifications"
            placeholder="Required Certifications"
          />
          <textarea
            v-model="techStack"
            placeholder="Technical Stack Requirements"
          ></textarea>
        </div>

        <div class="form-group">
          <label>Work Environment & Culture</label>
          <textarea
            v-model="workEnvironment"
            placeholder="Work Environment Description"
          ></textarea>
          <textarea
            v-model="teamDynamics"
            placeholder="Team Dynamics"
          ></textarea>
          <textarea
            v-model="growthOpportunities"
            placeholder="Growth & Development Opportunities"
            required
          ></textarea>
          <textarea
            v-model="diversityInitiatives"
            placeholder="Diversity & Inclusion Initiatives"
          ></textarea>
        </div>

        <div class="form-group">
          <label>Benefits & Policies</label>
          <textarea
            v-model="benefitsPackage"
            placeholder="Benefits Package Details"
            required
          ></textarea>
          <textarea
            v-model="remoteWorkPolicy"
            placeholder="Remote Work Policy"
            required
          ></textarea>
          <textarea
            v-model="travelRequirements"
            placeholder="Travel Requirements"
          ></textarea>
        </div>

        <div class="form-group">
          <label>Process & Resources</label>
          <textarea
            v-model="interviewStages"
            placeholder="Interview Process Stages"
            required
          ></textarea>
          <textarea
            v-model="onboardingProcess"
            placeholder="Onboarding Process"
          ></textarea>
          <textarea
            v-model="candidateResourceLinks"
            placeholder="Additional Resources for Candidates (comma-separated links)"
          ></textarea>
        </div>

        <button type="submit" class="submit-button">Create Job</button>
      </form>
    </div>

    <div v-if="jobs.length > 0" class="jobs-list">
      <h2>Current Jobs</h2>
      <div class="job-cards">
        <div v-for="job in jobs" :key="job.id" class="job-card">
          <h3>{{ job.jobTitle }}</h3>
          <p><strong>Department:</strong> {{ job.jobDepartment }}</p>
          <p><strong>Location:</strong> {{ job.jobLocation }}</p>
          <p class="job-description">{{ job.jobDescription }}</p>
        </div>
      </div>
    </div>
    <div v-else-if="!showJobForm" class="no-jobs">
      <p>No jobs found for this organization.</p>
    </div>
  </div>
</template>

<style scoped>
.job-dashboard {
  padding: 20px;
}

.error-message {
  color: red;
  background-color: #ffebee;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
}

.success-message {
  color: green;
  background-color: #e8f5e9;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
}

.create-button {
  background-color: #1976d2;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin: 20px 0;
}

.create-button:hover {
  background-color: #1565c0;
}

.job-form {
  background-color: #f5f5f5;
  padding: 20px;
  border-radius: 4px;
  margin: 20px 0;
}

.form-grid {
  display: grid;
  gap: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-group label {
  font-weight: bold;
  font-size: 1.1em;
  color: #2c3e50;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 8px;
  margin-bottom: 5px;
}

input,
textarea {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
}

textarea {
  min-height: 100px;
  resize: vertical;
}

input[type="date"] {
  height: 42px;
}

.submit-button {
  background-color: #4caf50;
  color: white;
  padding: 15px 30px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 20px;
  font-size: 16px;
  font-weight: 500;
  transition: background-color 0.3s ease;
}

.submit-button:hover {
  background-color: #45a049;
}

.jobs-list {
  margin-top: 30px;
}

.job-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.job-card {
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
}

.job-card h3 {
  margin: 0 0 10px 0;
  color: #1976d2;
}

.job-description {
  margin-top: 10px;
  color: #666;
}

.no-jobs {
  text-align: center;
  color: #666;
  margin-top: 30px;
}
</style>
