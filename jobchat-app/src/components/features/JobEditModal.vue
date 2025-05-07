<template>
  <div class="modal-overlay" v-if="show">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Edit Job</h2>
        <button class="close-button" @click="$emit('close')">×</button>
      </div>

      <form @submit.prevent="handleSubmit" class="form-grid">
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
            v-model="formData.jobSalary"
            placeholder="Salary Range"
            required
          />
          <input
            type="text"
            v-model="formData.jobType"
            placeholder="Employment Type (e.g., Full-time, Part-time)"
            required
          />
          <input
            type="date"
            v-model="formData.applicationDeadline"
            placeholder="Application Deadline"
            required
          />
          <textarea
            v-model="formData.travelRequirements"
            placeholder="Travel Requirements"
          ></textarea>
        </div>

        <div class="form-group">
          <label>Requirements & Skills</label>
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
            v-model="formData.requiredEducation"
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
          <label>Process & Resources</label>
          <textarea
            v-model="formData.interviewStages"
            placeholder="Interview Process Stages"
            required
          ></textarea>
          <textarea
            v-model="formData.candidateResourceLinks"
            placeholder="Additional Resources for Candidates (comma-separated links)"
          ></textarea>
        </div>

        <div class="form-actions">
          <button type="button" @click="$emit('close')" class="cancel-button">
            Cancel
          </button>
          <button type="submit" class="submit-button">Save Changes</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from "vue";

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  job: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["close", "submit"]);
const formData = ref({ ...props.job });

watch(
  () => props.job,
  (newJob) => {
    formData.value = { ...newJob };
  },
  { deep: true }
);

// Add this function to explicitly emit the current formData
function handleSubmit() {
  console.log("JobEditModal: Emitting submit with form data:", formData.value);
  emit("submit", formData.value);
}
</script>

<style scoped>
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
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
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
