<template>
  <div class="modal-overlay" v-if="show" @click.self="$emit('close')">
    <div class="modal-container">
      <div class="modal-header">
        <h2 class="modal-title">Edit Job Details</h2>
        <button
          class="btn-close-modal"
          @click="$emit('close')"
          aria-label="Close"
        >
          &times;
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body form-layout">
        <fieldset>
          <legend>Basic Information</legend>
          <div class="form-grid two-col">
            <div class="form-group">
              <label for="edit_jobTitle">Job Title *</label>
              <input
                id="edit_jobTitle"
                type="text"
                v-model="formData.jobTitle"
                required
              />
            </div>
            <div class="form-group">
              <label for="edit_jobDepartment">Department *</label>
              <input
                id="edit_jobDepartment"
                type="text"
                v-model="formData.jobDepartment"
                required
              />
            </div>
          </div>
          <div class="form-group">
            <label for="edit_jobDescription">Job Description *</label>
            <textarea
              id="edit_jobDescription"
              v-model="formData.jobDescription"
              required
              rows="5"
            ></textarea>
          </div>
          <div class="form-grid two-col">
            <div class="form-group">
              <label for="edit_teamSize">Team Size</label>
              <input
                id="edit_teamSize"
                type="text"
                v-model="formData.teamSize"
              />
            </div>
            <div class="form-group">
              <label for="edit_status">Status</label>
              <select id="edit_status" v-model="formData.status">
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="closed">Closed</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Location & Terms</legend>
          <div class="form-grid two-col">
            <div class="form-group">
              <label for="edit_jobLocation">Location *</label>
              <input
                id="edit_jobLocation"
                type="text"
                v-model="formData.jobLocation"
                required
              />
            </div>
            <div class="form-group">
              <label for="edit_salaryRange">Salary Range</label>
              <input
                id="edit_salaryRange"
                type="text"
                v-model="formData.salaryRange"
              />
            </div>
            <div class="form-group">
              <label for="edit_jobType">Employment Type *</label>
              <input
                id="edit_jobType"
                type="text"
                v-model="formData.jobType"
                required
              />
            </div>
            <div class="form-group">
              <label for="edit_applicationDeadline">Application Deadline</label>
              <input
                id="edit_applicationDeadline"
                type="date"
                v-model="formData.applicationDeadline"
              />
            </div>
          </div>
          <div class="form-group">
            <label for="edit_travelRequirements">Travel Requirements</label>
            <textarea
              id="edit_travelRequirements"
              v-model="formData.travelRequirements"
              rows="2"
            ></textarea>
          </div>
        </fieldset>

        <fieldset>
          <legend>Candidate Profile & Culture</legend>
          <div class="form-grid two-col">
            <div class="form-group">
              <label for="edit_riskTolerance">Risk Tolerance Expected</label>
              <select id="edit_riskTolerance" v-model="formData.riskTolerance">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label for="edit_candidatePersona">Ideal Candidate Persona</label>
            <textarea
              id="edit_candidatePersona"
              v-model="formData.candidatePersona"
              rows="4"
            ></textarea>
          </div>
        </fieldset>

        <fieldset>
          <legend>Skills & Qualifications</legend>
          <div class="array-input-group">
            <label>Required Skills *</label>
            <div
              v-for="(skill, index) in formData.requiredSkills"
              :key="`edit_reqSkill-${index}`"
              class="array-item"
            >
              <input type="text" v-model="formData.requiredSkills[index]" />
              <button
                type="button"
                @click="removeArrayItem('requiredSkills', index)"
                class="btn-remove-item"
              >
                &times;
              </button>
            </div>
            <button
              type="button"
              @click="addArrayItem('requiredSkills')"
              class="btn-add-item"
            >
              Add Required Skill
            </button>
          </div>
          <div class="array-input-group">
            <label>Preferred Skills</label>
            <div
              v-for="(skill, index) in formData.preferredSkills"
              :key="`edit_prefSkill-${index}`"
              class="array-item"
            >
              <input type="text" v-model="formData.preferredSkills[index]" />
              <button
                type="button"
                @click="removeArrayItem('preferredSkills', index)"
                class="btn-remove-item"
              >
                &times;
              </button>
            </div>
            <button
              type="button"
              @click="addArrayItem('preferredSkills')"
              class="btn-add-item"
            >
              Add Preferred Skill
            </button>
          </div>
          <div class="array-input-group">
            <label>Required Education</label>
            <div
              v-for="(item, index) in formData.requiredEducation"
              :key="`edit_reqEdu-${index}`"
              class="array-item"
            >
              <input type="text" v-model="formData.requiredEducation[index]" />
              <button
                type="button"
                @click="removeArrayItem('requiredEducation', index)"
                class="btn-remove-item"
              >
                &times;
              </button>
            </div>
            <button
              type="button"
              @click="addArrayItem('requiredEducation')"
              class="btn-add-item"
            >
              Add Education
            </button>
          </div>
          <div class="array-input-group">
            <label>Required Certifications</label>
            <div
              v-for="(item, index) in formData.requiredCertifications"
              :key="`edit_reqCert-${index}`"
              class="array-item"
            >
              <input
                type="text"
                v-model="formData.requiredCertifications[index]"
              />
              <button
                type="button"
                @click="removeArrayItem('requiredCertifications', index)"
                class="btn-remove-item"
              >
                &times;
              </button>
            </div>
            <button
              type="button"
              @click="addArrayItem('requiredCertifications')"
              class="btn-add-item"
            >
              Add Certification
            </button>
          </div>
          <div class="array-input-group">
            <label>Screening Questions</label>
            <div
              v-for="(item, index) in formData.requiredQuestions"
              :key="`edit_reqQues-${index}`"
              class="array-item"
            >
              <textarea
                v-model="formData.requiredQuestions[index]"
                rows="2"
              ></textarea>
              <button
                type="button"
                @click="removeArrayItem('requiredQuestions', index)"
                class="btn-remove-item"
              >
                &times;
              </button>
            </div>
            <button
              type="button"
              @click="addArrayItem('requiredQuestions')"
              class="btn-add-item"
            >
              Add Question
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend>Technical Environment (Tech Stack)</legend>
          <div class="form-grid two-col">
            <div class="form-group">
              <label for="edit_ts_architecture">Architecture</label>
              <input
                id="edit_ts_architecture"
                type="text"
                v-model="formData.techStack.architecture"
              />
            </div>
            <div class="form-group">
              <label for="edit_ts_scale">Scale</label>
              <input
                id="edit_ts_scale"
                type="text"
                v-model="formData.techStack.scale"
              />
            </div>
          </div>
          <div class="array-input-group">
            <label>Core Technologies/Stack</label>
            <div
              v-for="(item, index) in formData.techStack.stack"
              :key="`edit_tsStack-${index}`"
              class="complex-array-item"
            >
              <input
                type="text"
                v-model="item.skill"
                placeholder="Skill/Technology"
              />
              <select v-model="item.level">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
              <textarea
                v-model="item.realWorldApplication"
                placeholder="Real-world application"
                rows="2"
              ></textarea>
              <div class="sub-array-input-group">
                <label class="sub-label">Red Flags:</label>
                <div
                  v-for="(flag, rfIndex) in item.redFlags"
                  :key="`edit_rf-${index}-${rfIndex}`"
                  class="array-item"
                >
                  <input type="text" v-model="item.redFlags[rfIndex]" />
                  <button
                    type="button"
                    @click="item.redFlags.splice(rfIndex, 1)"
                    class="btn-remove-item"
                  >
                    &times;
                  </button>
                </div>
                <button
                  type="button"
                  @click="item.redFlags.push('')"
                  class="btn-add-item btn-sm"
                >
                  Add Red Flag
                </button>
              </div>
              <input
                type="number"
                v-model.number="item.weight"
                placeholder="Weight"
                step="0.01"
              />
              <button
                type="button"
                @click="removeTechStackItem(index)"
                class="btn-remove-item btn-lg"
              >
                &times;
              </button>
            </div>
            <button
              type="button"
              @click="addTechStackItem"
              class="btn-add-item"
            >
              Add Technology
            </button>
          </div>
          <div class="array-input-group">
            <label>Key Technical Challenges</label>
            <div
              v-for="(item, index) in formData.techStack.challenges"
              :key="`edit_tsChal-${index}`"
              class="array-item"
            >
              <input
                type="text"
                v-model="formData.techStack.challenges[index]"
              />
              <button
                type="button"
                @click="formData.techStack.challenges.splice(index, 1)"
                class="btn-remove-item"
              >
                &times;
              </button>
            </div>
            <button
              type="button"
              @click="formData.techStack.challenges.push('')"
              class="btn-add-item"
            >
              Add Challenge
            </button>
          </div>
          <div class="array-input-group">
            <label>Development Practices</label>
            <div
              v-for="(item, index) in formData.techStack.practices"
              :key="`edit_tsPrac-${index}`"
              class="array-item"
            >
              <input
                type="text"
                v-model="formData.techStack.practices[index]"
              />
              <button
                type="button"
                @click="formData.techStack.practices.splice(index, 1)"
                class="btn-remove-item"
              >
                &times;
              </button>
            </div>
            <button
              type="button"
              @click="formData.techStack.practices.push('')"
              class="btn-add-item"
            >
              Add Practice
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend>Success Criteria</legend>
          <div class="array-input-group">
            <label>Immediate (First 3-6 Months)</label>
            <div
              v-for="(item, index) in formData.successCriteria.immediate"
              :key="`edit_scImm-${index}`"
              class="complex-array-item"
            >
              <input type="text" v-model="item.metric" placeholder="Metric" />
              <textarea
                v-model="item.description"
                placeholder="Description"
                rows="2"
              ></textarea>
              <input
                type="number"
                v-model.number="item.weight"
                placeholder="Weight"
                step="0.01"
              />
              <button
                type="button"
                @click="removeSuccessCriterion('immediate', index)"
                class="btn-remove-item btn-lg"
              >
                &times;
              </button>
            </div>
            <button
              type="button"
              @click="addSuccessCriterion('immediate')"
              class="btn-add-item"
            >
              Add Immediate Criterion
            </button>
          </div>
          <div class="array-input-group">
            <label>Long-Term (6+ Months)</label>
            <div
              v-for="(item, index) in formData.successCriteria.longTerm"
              :key="`edit_scLt-${index}`"
              class="complex-array-item"
            >
              <input type="text" v-model="item.metric" placeholder="Metric" />
              <textarea
                v-model="item.description"
                placeholder="Description"
                rows="2"
              ></textarea>
              <input
                type="number"
                v-model.number="item.weight"
                placeholder="Weight"
                step="0.01"
              />
              <button
                type="button"
                @click="removeSuccessCriterion('longTerm', index)"
                class="btn-remove-item btn-lg"
              >
                &times;
              </button>
            </div>
            <button
              type="button"
              @click="addSuccessCriterion('longTerm')"
              class="btn-add-item"
            >
              Add Long-Term Criterion
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend>Interview Process & Candidate Resources</legend>
          <div class="form-group">
            <label for="edit_interviewStagesDesc"
              >Interview Stages Description</label
            >
            <textarea
              id="edit_interviewStagesDesc"
              v-model="formData.interviewStages_description"
              rows="3"
            ></textarea>
            <input
              type="number"
              v-model.number="formData.interviewStages"
              placeholder="Number of interview stages (e.g. 3)"
            />
          </div>
          <div class="array-input-group">
            <label for="edit_candidateResourceLinks"
              >Candidate Resource Links</label
            >
            <div
              v-for="(link, index) in formData.candidateResourceLinks"
              :key="`edit_resLink-${index}`"
              class="array-item"
            >
              <input
                type="url"
                v-model="formData.candidateResourceLinks[index]"
              />
              <button
                type="button"
                @click="removeArrayItem('candidateResourceLinks', index)"
                class="btn-remove-item"
              >
                &times;
              </button>
            </div>
            <button
              type="button"
              @click="addArrayItem('candidateResourceLinks')"
              class="btn-add-item"
            >
              Add Resource Link
            </button>
          </div>
        </fieldset>

        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn-cancel">
            Cancel
          </button>
          <button type="submit" class="btn-submit">Save Changes</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from "vue";

const props = defineProps({
  show: { type: Boolean, required: true },
  job: { type: Object, required: true }, // This 'job' prop comes from selectedJob in parent
});

const emit = defineEmits(["close", "submit"]);

// --- Default structures for scaffolding missing data from older job records ---
const initialTechStackItem = () => ({
  skill: "",
  level: "intermediate",
  realWorldApplication: "",
  redFlags: [],
  weight: 0.1,
});
const initialSuccessCriterion = () => ({
  metric: "",
  description: "",
  weight: 0.2,
});
const defaultJobStructure = () => ({
  id: null, // Important for identifying the job
  jobTitle: "",
  jobDepartment: "",
  jobDescription: "",
  teamSize: "",
  status: "active",
  jobLocation: "",
  salaryRange: "",
  jobType: "",
  applicationDeadline: "",
  travelRequirements: "",
  riskTolerance: "medium",
  candidatePersona: "",
  requiredSkills: [],
  preferredSkills: [],
  requiredEducation: [],
  requiredCertifications: [],
  requiredQuestions: [],
  candidateResourceLinks: [],
  interviewStages: 0,
  interviewStages_description: "",
  techStack: {
    stack: [],
    architecture: "",
    scale: "",
    challenges: [],
    practices: [],
  },
  successCriteria: {
    immediate: [],
    longTerm: [],
  },
  // any other fields that might be in props.job but not explicitly defined here
  // will be spread in by { ...props.job }
});

const formData = ref(initializeFormData());

function initializeFormData() {
  const defaults = defaultJobStructure();
  // Deep merge props.job into defaults to ensure all fields are present
  const jobData = props.job ? JSON.parse(JSON.stringify(props.job)) : {}; // Deep clone props.job

  const merged = {
    ...defaults,
    ...jobData, // Overwrite defaults with actual job data
    techStack: {
      // Deep merge techStack
      ...defaults.techStack,
      ...(jobData.techStack || {}),
      stack: Array.isArray(jobData.techStack?.stack)
        ? jobData.techStack.stack.map((s) => ({
            ...initialTechStackItem(),
            ...s,
            redFlags: Array.isArray(s.redFlags) ? s.redFlags : [],
          }))
        : [],
      challenges: Array.isArray(jobData.techStack?.challenges)
        ? jobData.techStack.challenges
        : [],
      practices: Array.isArray(jobData.techStack?.practices)
        ? jobData.techStack.practices
        : [],
    },
    successCriteria: {
      // Deep merge successCriteria
      ...defaults.successCriteria,
      ...(jobData.successCriteria || {}),
      immediate: Array.isArray(jobData.successCriteria?.immediate)
        ? jobData.successCriteria.immediate.map((s) => ({
            ...initialSuccessCriterion(),
            ...s,
          }))
        : [],
      longTerm: Array.isArray(jobData.successCriteria?.longTerm)
        ? jobData.successCriteria.longTerm.map((s) => ({
            ...initialSuccessCriterion(),
            ...s,
          }))
        : [],
    },
    // Ensure all top-level array fields are indeed arrays
    requiredSkills: Array.isArray(jobData.requiredSkills)
      ? jobData.requiredSkills
      : [],
    preferredSkills: Array.isArray(jobData.preferredSkills)
      ? jobData.preferredSkills
      : [],
    requiredEducation: Array.isArray(jobData.requiredEducation)
      ? jobData.requiredEducation
      : [],
    requiredCertifications: Array.isArray(jobData.requiredCertifications)
      ? jobData.requiredCertifications
      : [],
    requiredQuestions: Array.isArray(jobData.requiredQuestions)
      ? jobData.requiredQuestions
      : [],
    candidateResourceLinks: Array.isArray(jobData.candidateResourceLinks)
      ? jobData.candidateResourceLinks
      : [],
  };
  // Ensure applicationDeadline is in YYYY-MM-DD for date input
  if (merged.applicationDeadline) {
    try {
      const date = new Date(merged.applicationDeadline);
      if (!isNaN(date)) {
        merged.applicationDeadline = date.toISOString().split("T")[0];
      } else {
        merged.applicationDeadline = ""; // Clear if invalid
      }
    } catch (e) {
      merged.applicationDeadline = ""; // Clear if error
    }
  } else {
    merged.applicationDeadline = "";
  }
  return merged;
}

watch(
  () => props.job,
  (newJob) => {
    if (newJob) {
      formData.value = initializeFormData(); // Re-initialize with new prop data
    }
  },
  { deep: true, immediate: true } // immediate to run on component mount
);

// --- Methods to manage dynamic arrays (same as JobForm.vue) ---
const addArrayItem = (arrayName) => {
  if (formData.value[arrayName] && Array.isArray(formData.value[arrayName])) {
    formData.value[arrayName].push("");
  } else if (!formData.value[arrayName]) {
    // If array doesn't exist, initialize it
    formData.value[arrayName] = [""];
  }
};
const removeArrayItem = (arrayName, index) => {
  if (formData.value[arrayName] && Array.isArray(formData.value[arrayName])) {
    formData.value[arrayName].splice(index, 1);
    // Optionally, if array becomes empty, add back one empty string for the input field
    // if (formData.value[arrayName].length === 0) formData.value[arrayName].push("");
  }
};

const addTechStackItem = () => {
  if (!formData.value.techStack.stack) formData.value.techStack.stack = [];
  formData.value.techStack.stack.push(initialTechStackItem());
};
const removeTechStackItem = (index) => {
  formData.value.techStack.stack.splice(index, 1);
};

const addSuccessCriterion = (period) => {
  if (!formData.value.successCriteria[period])
    formData.value.successCriteria[period] = [];
  formData.value.successCriteria[period].push(initialSuccessCriterion());
};
const removeSuccessCriterion = (period, index) => {
  formData.value.successCriteria[period].splice(index, 1);
};

function handleSubmit() {
  const finalFormData = JSON.parse(JSON.stringify(formData.value));

  // Round all weight values to 2 decimal places
  if (finalFormData.techStack?.stack) {
    finalFormData.techStack.stack.forEach((item) => {
      if (typeof item.weight === "number") {
        item.weight = Math.round(item.weight * 100) / 100;
      }
    });
  }

  // Do the same for success criteria weights
  ["immediate", "longTerm"].forEach((period) => {
    if (finalFormData.successCriteria?.[period]) {
      finalFormData.successCriteria[period].forEach((item) => {
        if (typeof item.weight === "number") {
          item.weight = Math.round(item.weight * 100) / 100;
        }
      });
    }
  });

  emit("submit", finalFormData);
}
</script>

<style scoped>
/* Modal specific styles */
.modal-overlay {
  /* Keep from user */
}
.modal-container {
  /* New wrapper for content + header/footer */
  background: white;
  border-radius: 8px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 800px; /* Allow wider for complex form */
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}
.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}
.btn-close-modal {
  /* Improved close button */
  background: none;
  border: none;
  font-size: 1.75rem;
  line-height: 1;
  cursor: pointer;
  color: #888;
  padding: 0.25rem;
}
.btn-close-modal:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex-grow: 1;
}
.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  background-color: #f9f9f9;
}

/* Re-use JobForm styling for consistency - prefix classes if needed */
.form-layout {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
fieldset {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 1.5rem;
  background-color: #fff;
}
legend {
  font-size: 1.1rem;
  font-weight: 500;
  color: #444;
  padding: 0 0.5em;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
.form-grid.two-col {
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.form-group.full-width {
  grid-column: 1 / -1;
}
label,
.sub-label {
  font-weight: 500;
  color: #555;
  font-size: 0.9rem;
}
.sub-label {
  margin-top: 0.5rem;
}

input[type="text"],
input[type="date"],
input[type="url"],
input[type="number"],
select,
textarea {
  padding: 0.65rem 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.95rem;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
}
input:focus,
select:focus,
textarea:focus {
  border-color: #4a90e2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
  outline: none;
}
textarea {
  min-height: 80px;
  resize: vertical;
}

.array-input-group {
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px dashed #d0d0d0;
  border-radius: 4px;
}
.array-input-group > label {
  font-weight: 500;
  color: #4caf50;
  margin-bottom: 0.75rem;
  display: block;
}
.array-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.array-item input,
.array-item textarea {
  flex-grow: 1;
}
.complex-array-item {
  border: 1px solid #e0e0e0;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background-color: #fdfdfd;
}
.sub-array-input-group {
  margin-top: 0.5rem;
  padding-left: 1rem;
  border-left: 2px solid #4caf50;
}

.btn-add-item,
.btn-remove-item {
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background-color 0.2s;
  border: 1px solid;
}
.btn-add-item {
  background-color: #e8f5e9;
  color: #388e3c;
  border-color: #a5d6a7;
  margin-top: 0.5rem;
}
.btn-add-item:hover {
  background-color: #c8e6c9;
}
.btn-add-item.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}
.btn-remove-item {
  background-color: #ffebee;
  color: #d32f2f;
  border-color: #ef9a9a;
  padding: 0.3em 0.6em;
  font-weight: bold;
  line-height: 1;
}
.btn-remove-item:hover {
  background-color: #ffcdd2;
}
.btn-remove-item.btn-lg {
  font-size: 1rem;
  padding: 0.5rem 0.75rem;
}

.btn-submit,
.btn-cancel {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 500;
}
.btn-submit {
  background-color: #4a90e2;
  color: white;
}
.btn-submit:hover {
  background-color: #357abd;
}
.btn-cancel {
  background-color: #7f8c8d;
  color: white;
}
.btn-cancel:hover {
  background-color: #6c7a7b;
}
</style>
