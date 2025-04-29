<template>
  <div class="job-form">
    <h2>Create New Job</h2>
    <form @submit.prevent="$emit('submit', formData)" class="form-grid">
      <div class="form-group">
        <label>Basic Information</label>
        <input
          type="text"
          v-model="formData.jobTitle"
          placeholder="Job Title"
          required
        />
        <input
          type="text"
          v-model="formData.jobDepartment"
          placeholder="Job Department"
          required
        />
        <textarea
          v-model="formData.jobDescription"
          placeholder="Job Description"
          required
        ></textarea>
        <input
          type="text"
          v-model="formData.teamSize"
          placeholder="Team Size"
          required
        />
      </div>

      <div class="form-group">
        <label>Location & Compensation</label>
        <input
          type="text"
          v-model="formData.jobLocation"
          placeholder="Job Location"
          required
        />
        <input
          type="text"
          v-model="formData.salaryRange"
          placeholder="Salary Range"
          required
        />
        <input
          type="text"
          v-model="formData.employmentType"
          placeholder="Employment Type (e.g., Full-time, Part-time)"
          required
        />
        <input
          type="text"
          v-model="formData.expectedJobDuration"
          placeholder="Expected Job Duration"
          required
        />
        <input
          type="date"
          v-model="formData.applicationDeadline"
          placeholder="Application Deadline"
          required
        />
      </div>

      <div class="form-group">
        <label>Requirements & Skills</label>
        <textarea
          v-model="formData.responsibilities"
          placeholder="Job Responsibilities"
          required
        ></textarea>
        <textarea
          v-model="formData.requiredSkills"
          placeholder="Required Skills"
          required
        ></textarea>
        <textarea
          v-model="formData.preferredSkills"
          placeholder="Preferred Skills"
        ></textarea>
        <input
          type="text"
          v-model="formData.minExperience"
          placeholder="Minimum Experience"
          required
        />
        <input
          type="text"
          v-model="formData.educationRequirements"
          placeholder="Education Requirements"
          required
        />
        <input
          type="text"
          v-model="formData.requiredCertifications"
          placeholder="Required Certifications"
        />
        <textarea
          v-model="formData.techStack"
          placeholder="Technical Stack Requirements"
        ></textarea>
      </div>

      <div class="form-group">
        <label>Work Environment & Culture</label>
        <textarea
          v-model="formData.workEnvironment"
          placeholder="Work Environment Description"
        ></textarea>
        <textarea
          v-model="formData.teamDynamics"
          placeholder="Team Dynamics"
        ></textarea>
        <textarea
          v-model="formData.growthOpportunities"
          placeholder="Growth & Development Opportunities"
          required
        ></textarea>
        <textarea
          v-model="formData.diversityInitiatives"
          placeholder="Diversity & Inclusion Initiatives"
        ></textarea>
      </div>

      <div class="form-group">
        <label>Benefits & Policies</label>
        <textarea
          v-model="formData.benefitsPackage"
          placeholder="Benefits Package Details"
          required
        ></textarea>
        <textarea
          v-model="formData.remoteWorkPolicy"
          placeholder="Remote Work Policy"
          required
        ></textarea>
        <textarea
          v-model="formData.travelRequirements"
          placeholder="Travel Requirements"
        ></textarea>
      </div>

      <div class="form-group">
        <label>Process & Resources</label>
        <textarea
          v-model="formData.interviewStages"
          placeholder="Interview Process Stages"
          required
        ></textarea>
        <textarea
          v-model="formData.onboardingProcess"
          placeholder="Onboarding Process"
        ></textarea>
        <textarea
          v-model="formData.candidateResourceLinks"
          placeholder="Additional Resources for Candidates (comma-separated links)"
        ></textarea>
      </div>

      <div class="form-actions">
        <button type="button" @click="$emit('cancel')" class="cancel-button">
          Cancel
        </button>
        <button type="submit" class="submit-button">Create Job</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";

const formData = ref({
  jobTitle: "",
  jobDepartment: "",
  jobDescription: "",
  teamSize: "",
  jobLocation: "",
  salaryRange: "",
  employmentType: "",
  expectedJobDuration: "",
  applicationDeadline: "",
  responsibilities: "",
  requiredSkills: "",
  preferredSkills: "",
  minExperience: "",
  educationRequirements: "",
  requiredCertifications: "",
  techStack: "",
  workEnvironment: "",
  teamDynamics: "",
  growthOpportunities: "",
  diversityInitiatives: "",
  benefitsPackage: "",
  remoteWorkPolicy: "",
  travelRequirements: "",
  interviewStages: "",
  onboardingProcess: "",
  candidateResourceLinks: "",
});
</script>

<style scoped>
.job-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

label {
  font-weight: bold;
  color: #333;
}

input,
textarea,
select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

textarea {
  min-height: 100px;
  resize: vertical;
}

.form-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.submit-button,
.cancel-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-button {
  background-color: #4caf50;
  color: white;
}

.submit-button:hover {
  background-color: #45a049;
}

.cancel-button {
  background-color: #f44336;
  color: white;
}

.cancel-button:hover {
  background-color: #da190b;
}
</style>
