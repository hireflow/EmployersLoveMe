<template>
  <div class="job-form-container">
    <h2 class="form-title">Create New Job</h2>
    <div class="form-actions-top">
      <button type="button" @click="showExtractionModal = true" class="btn-extract">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="btn-icon">
          <path fill-rule="evenodd" d="M4.5 2a1.5 1.5 0 00-1.5 1.5v9a1.5 1.5 0 001.5 1.5h11a1.5 1.5 0 001.5-1.5V3.5A1.5 1.5 0 0015.5 2h-11zm0 1h11a.5.5 0 01.5.5v9a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5v-9a.5.5 0 01.5-.5z" clip-rule="evenodd" />
          <path fill-rule="evenodd" d="M7.5 5a.5.5 0 01.5.5v4a.5.5 0 01-1 0v-4a.5.5 0 01.5-.5zm3 0a.5.5 0 01.5.5v4a.5.5 0 01-1 0v-4a.5.5 0 01.5-.5z" clip-rule="evenodd" />
        </svg>
        Extract from Description
      </button>
    </div>
    <form @submit.prevent="handleSubmit" class="form-layout">
      <fieldset>
        <legend>Basic Information</legend>
        <div class="form-grid two-col">
          <div class="form-group">
            <label for="jobTitle">Job Title *</label>
            <input
              id="jobTitle"
              type="text"
              v-model="formData.jobTitle"
              placeholder="e.g., Senior Software Engineer"
              required
            />
          </div>
          <div class="form-group">
            <label for="jobDepartment">Department *</label>
            <input
              id="jobDepartment"
              type="text"
              v-model="formData.jobDepartment"
              placeholder="e.g., Engineering, Product"
              required
            />
          </div>
        </div>
        <div class="form-group">
          <label for="jobDescription">Job Description *</label>
          <textarea
            id="jobDescription"
            v-model="formData.jobDescription"
            placeholder="Detailed description of responsibilities, impact, and day-to-day tasks."
            required
            rows="5"
          ></textarea>
        </div>
        <div class="form-grid two-col">
          <div class="form-group">
            <label for="teamSize">Team Size</label>
            <input
              id="teamSize"
              type="text"
              v-model="formData.teamSize"
              placeholder="e.g., 5-10 people"
            />
          </div>
          <div class="form-group">
            <label for="status">Status</label>
            <select id="status" v-model="formData.status">
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
            <label for="jobLocation">Location *</label>
            <input
              id="jobLocation"
              type="text"
              v-model="formData.jobLocation"
              placeholder="e.g., Remote, New York City"
              required
            />
          </div>
          <div class="form-group">
            <label for="salaryRange">Salary Range</label>
            <input
              id="salaryRange"
              type="text"
              v-model="formData.salaryRange"
              placeholder="e.g., $120k - $150k USD"
            />
          </div>
          <div class="form-group">
            <label for="jobType">Employment Type *</label>
            <input
              id="jobType"
              type="text"
              v-model="formData.jobType"
              placeholder="e.g., Full-time, Contract"
              required
            />
          </div>
          <div class="form-group">
            <label for="applicationDeadline">Application Deadline</label>
            <input
              id="applicationDeadline"
              type="date"
              v-model="formData.applicationDeadline"
            />
          </div>
        </div>
        <div class="form-group">
          <label for="travelRequirements">Travel Requirements</label>
          <textarea
            id="travelRequirements"
            v-model="formData.travelRequirements"
            placeholder="e.g., Up to 10% domestic travel"
            rows="2"
          ></textarea>
        </div>
      </fieldset>

      <fieldset>
        <legend>Candidate Profile & Culture</legend>
        <div class="form-grid two-col">
          <div class="form-group">
            <label for="riskTolerance">Risk Tolerance Expected</label>
            <select id="riskTolerance" v-model="formData.riskTolerance">
              <option value="low">Low (Prefers stability)</option>
              <option value="medium">
                Medium (Comfortable with ambiguity)
              </option>
              <option value="high">
                High (Thrives in experimental environments)
              </option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label for="candidatePersona">Ideal Candidate Persona</label>
          <textarea
            id="candidatePersona"
            v-model="formData.candidatePersona"
            placeholder="Describe their work style, communication, problem-solving, etc."
            rows="4"
          ></textarea>
        </div>
      </fieldset>

      <fieldset>
        <legend>Work Environment</legend>
        <div class="form-grid two-col">
          <div class="form-group">
            <label for="techMaturity">Technology Maturity</label>
            <select
              id="techMaturity"
              v-model="formData.workEnvironment.techMaturity"
            >
              <option value="emerging">Emerging (Exploring new tech)</option>
              <option value="established">
                Established (Proven, stable tech)
              </option>
              <option value="leading-edge">
                Leading-Edge (Cutting-edge, experimental)
              </option>
              <option value="mixed">Mixed (Varies by team/project)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="structure">Team Structure</label>
            <select id="structure" v-model="formData.workEnvironment.structure">
              <option value="hierarchical">
                Hierarchical (Clear reporting lines)
              </option>
              <option value="flat">Flat (Minimal management layers)</option>
              <option value="matrix">
                Matrix (Reporting to multiple managers)
              </option>
              <option value="autonomous-teams">
                Autonomous Teams (Self-managed units)
              </option>
              <option value="hybrid">Hybrid (Combination of structures)</option>
            </select>
          </div>
        </div>
        <div class="form-grid two-col">
          <div class="form-group">
            <label for="communication">Primary Communication Style</label>
            <select
              id="communication"
              v-model="formData.workEnvironment.communication"
            >
              <option value="async-first">
                Async-First (Documentation, written)
              </option>
              <option value="sync-first">
                Sync-First (Meetings, real-time chat)
              </option>
              <option value="balanced">Balanced (Mix of async and sync)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="pace">Work Pace</label>
            <select id="pace" v-model="formData.workEnvironment.pace">
              <option value="steady-deliberate">Steady & Deliberate</option>
              <option value="fast-paced-agile">Fast-Paced & Agile</option>
              <option value="sprint-based">Sprint-Based (Fixed cycles)</option>
              <option value="project-driven">
                Project-Driven (Variable pace)
              </option>
            </select>
          </div>
        </div>
        <div class="form-grid two-col">
          <div class="form-group">
            <label for="growthExpectiations">Career Growth Approach</label>
            <select
              id="growthExpectiations"
              v-model="formData.workEnvironment.growthExpectiations"
            >
              <option value="structured-paths">
                Structured Paths (Defined career ladders)
              </option>
              <option value="self-directed-learning">
                Self-Directed Learning (Autonomy in growth)
              </option>
              <option value="mentorship-coaching">
                Mentorship & Coaching Focus
              </option>
              <option value="skill-based-advancement">
                Skill-Based Advancement
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="collaboration">Collaboration Model</label>
            <select
              id="collaboration"
              v-model="formData.workEnvironment.collaboration"
            >
              <option value="individual-contribution">
                Primarily Individual Contribution
              </option>
              <option value="team-centric">Team-Centric Projects</option>
              <option value="cross-functional-squads">
                Cross-Functional Squads
              </option>
              <option value="departmental-silos">
                Departmental Silos with Handoffs
              </option>
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Skills & Qualifications</legend>
        <div class="array-input-group">
          <label for="requiredSkills">Required Skills *</label>
          <div
            v-for="(skill, index) in formData.requiredSkills"
            :key="`reqSkill-${index}`"
            class="array-item"
          >
            <input
              type="text"
              v-model="formData.requiredSkills[index]"
              placeholder="e.g., JavaScript"
            />
            <button
              type="button"
              @click="removeArrayItem('requiredSkills', index)"
              class="btn-remove-item"
              title="Remove Skill"
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
          <label for="preferredSkills">Preferred Skills</label>
          <div
            v-for="(skill, index) in formData.preferredSkills"
            :key="`prefSkill-${index}`"
            class="array-item"
          >
            <input
              type="text"
              v-model="formData.preferredSkills[index]"
              placeholder="e.g., TypeScript"
            />
            <button
              type="button"
              @click="removeArrayItem('preferredSkills', index)"
              class="btn-remove-item"
              title="Remove Skill"
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
          <label for="requiredEducation">Required Education</label>
          <div
            v-for="(edu, index) in formData.requiredEducation"
            :key="`reqEdu-${index}`"
            class="array-item"
          >
            <input
              type="text"
              v-model="formData.requiredEducation[index]"
              placeholder="e.g., Bachelor's in CS"
            />
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
          <label for="requiredCertifications">Required Certifications</label>
          <div
            v-for="(cert, index) in formData.requiredCertifications"
            :key="`reqCert-${index}`"
            class="array-item"
          >
            <input
              type="text"
              v-model="formData.requiredCertifications[index]"
              placeholder="e.g., AWS Certified Developer"
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
          <label for="requiredQuestions">Screening Questions</label>
          <div
            v-for="(question, index) in formData.requiredQuestions"
            :key="`reqQuestion-${index}`"
            class="array-item"
          >
            <textarea
              v-model="formData.requiredQuestions[index]"
              placeholder="e.g., Describe a challenging project."
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
        <legend>Tech Stack & Environment</legend>
        <div class="form-grid two-col">
          <div class="form-group">
            <label for="ts_architecture">Architecture</label>
            <input
              id="ts_architecture"
              type="text"
              v-model="formData.techStack.architecture"
              placeholder="e.g., Microservices, Monolith"
            />
          </div>
          <div class="form-group">
            <label for="ts_scale">Scale</label>
            <input
              id="ts_scale"
              type="text"
              v-model="formData.techStack.scale"
              placeholder="e.g., 1M+ users, 10k RPS"
            />
          </div>
        </div>

        <div class="array-input-group">
          <label>Core Technologies/Stack</label>
          <div
            v-for="(item, index) in formData.techStack.stack"
            :key="`tsStack-${index}`"
            class="complex-array-item"
          >
            <input
              type="text"
              v-model="item.skill"
              placeholder="Skill/Technology (e.g., React)"
            />
            <select v-model="item.level">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
            <textarea
              v-model="item.realWorldApplication"
              placeholder="Real-world application examples"
              rows="2"
            ></textarea>
            <label class="sub-label">Weight (1-10)</label>
            <div class="slider-container">
              <input
                type="range"
                v-model.number="item.weight"
                min="1"
                max="10"
                step="1"
                class="weight-slider"
              />
              <span class="slider-value">{{ item.weight }}</span>
            </div>
            <div class="sub-array-input-group">
              <label class="sub-label">Red Flags for this technology:</label>
              <div
                v-for="(flag, rfIndex) in item.redFlags"
                :key="`rf-${index}-${rfIndex}`"
                class="array-item"
              >
                <input
                  type="text"
                  v-model="item.redFlags[rfIndex]"
                  placeholder="e.g., no async understanding"
                />
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

            <button
              type="button"
              @click="removeTechStackItem(index)"
              class="btn-remove-item btn-lg"
              title="Remove Technology"
            >
              &times;
            </button>
          </div>
          <button type="button" @click="addTechStackItem" class="btn-add-item">
            Add Technology to Stack
          </button>
        </div>

        <div class="array-input-group">
          <label for="ts_challenges">Key Technical Challenges</label>
          <div
            v-for="(challenge, index) in formData.techStack.challenges"
            :key="`tsChal-${index}`"
            class="array-item"
          >
            <input
              type="text"
              v-model="formData.techStack.challenges[index]"
              placeholder="e.g., Real-time data sync"
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
          <label for="ts_practices">Development Practices</label>
          <div
            v-for="(practice, index) in formData.techStack.practices"
            :key="`tsPrac-${index}`"
            class="array-item"
          >
            <input
              type="text"
              v-model="formData.techStack.practices[index]"
              placeholder="e.g., TDD, CI/CD"
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
            :key="`scImm-${index}`"
            class="complex-array-item"
          >
            <input
              type="text"
              v-model="item.metric"
              placeholder="Metric (e.g., Feature Velocity)"
            />
            <textarea
              v-model="item.description"
              placeholder="Description of success"
              rows="2"
            ></textarea>
            <!-- <input
              type="number"
              v-model.number="item.weight"
              placeholder="Weight (0.0-1.0)"
              step="0.01"
              min="0"
              max="1"
            /> -->
            <div class="slider-container">
              <input
                type="range"
                v-model.number="item.weight"
                min="1"
                max="10"
                step="1"
                class="weight-slider"
              />
              <span class="slider-value">{{ item.weight }}</span>
            </div>
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
            :key="`scLt-${index}`"
            class="complex-array-item"
          >
            <input
              type="text"
              v-model="item.metric"
              placeholder="Metric (e.g., Technical Leadership)"
            />
            <textarea
              v-model="item.description"
              placeholder="Description of success"
              rows="2"
            ></textarea>
            <!-- <input
              type="number"
              v-model.number="item.weight"
              placeholder="Weight (0.0-1.0)"
              step="0.01"
              min="0"
              max="1"
            /> -->
            <div class="slider-container">
              <input
                type="range"
                v-model.number="item.weight"
                min="1"
                max="10"
                step="1"
                class="weight-slider"
              />
              <span class="slider-value">{{ item.weight }}</span>
            </div>
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
          <label for="interviewStagesDesc">Interview Stages Description</label>
          <textarea
            id="interviewStagesDesc"
            v-model="formData.interviewStages_description"
            placeholder="Describe the stages, e.g., 1. HR Screen, 2. Technical Interview..."
            rows="3"
          ></textarea>
          <input
            type="number"
            v-model.number="formData.interviewStages"
            placeholder="Number of interview stages (e.g. 3)"
          />
        </div>
        <div class="array-input-group">
          <label for="candidateResourceLinks">Candidate Resource Links</label>
          <div
            v-for="(link, index) in formData.candidateResourceLinks"
            :key="`resLink-${index}`"
            class="array-item"
          >
            <input
              type="url"
              v-model="formData.candidateResourceLinks[index]"
              placeholder="https://example.com/resource"
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

      <div class="form-actions">
        <button type="button" @click="$emit('close')" class="btn-cancel">
          Cancel
        </button>
        <button type="submit" class="btn-submit">Create Job</button>
      </div>
    </form>

    <!-- Extraction Modal -->
    <div v-if="showExtractionModal" class="modal-overlay" @click.self="closeExtractionModal">
      <div class="extraction-modal-container">
        <div class="extraction-modal-header">
          <h3>Extract Job Data</h3>
          <button @click="closeExtractionModal" class="btn-close-modal" aria-label="Close">&times;</button>
        </div>
        <div class="extraction-modal-body">
          <div class="form-group">
            <label for="extractionText">Paste job description to extract data from:</label>
            <textarea
              id="extractionText"
              v-model="extractionText"
              rows="8"
              class="form-input text-area"
              placeholder="Paste your job description here..."
            ></textarea>
          </div>

          <div v-if="extractionError" class="error-message">
            {{ extractionError }}
          </div>

        </div>
        <div class="extraction-modal-footer">
          <button @click="closeExtractionModal" class="btn btn-secondary">Cancel</button>
          <button
            @click="handleExtraction"
            :disabled="isExtracting || !extractionText.trim()"
            class="btn btn-primary"
          >
            {{ isExtracting ? "Extracting..." : "Extract Data" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, defineEmits, ref } from "vue";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useAuthStore } from "@/stores/auth";

const emit = defineEmits(["submit", "close"]);
const functions = getFunctions();
const extractAndSaveData = httpsCallable(functions, "extractAndSaveData");
const authStore = useAuthStore();

// Add new refs for extraction functionality
const showExtractionModal = ref(false);
const extractionText = ref("");
const isExtracting = ref(false);
const extractionError = ref("");

const initialTechStackItem = () => ({
  skill: "",
  level: "intermediate",
  realWorldApplication: "",
  redFlags: [],
  weight: 1,
});

const initialSuccessCriterion = () => ({
  metric: "",
  description: "",
  weight: 1,
});

const formData = reactive({
  jobTitle: "",
  jobDepartment: "",
  jobDescription: "",
  teamSize: "", // General team size or context for the role
  status: "active",
  jobLocation: "",
  salaryRange: "", // New field, replaces jobSalary
  jobType: "", // Was employmentType, using jobType from schema
  applicationDeadline: "", // Store as YYYY-MM-DD string from date input
  travelRequirements: "",
  riskTolerance: "medium",
  candidatePersona: "",

  // Arrays of strings - will be managed by dynamic input fields
  requiredSkills: [""],
  preferredSkills: [""],
  requiredEducation: [""],
  requiredCertifications: [""],
  requiredQuestions: [""], // For candidates
  candidateResourceLinks: [""],

  // Interview process
  interviewStages: 0, // Number of stages
  interviewStages_description: "", // Textual description

  // Complex nested objects
  techStack: {
    stack: [initialTechStackItem()],
    architecture: "",
    scale: "",
    challenges: [""],
    practices: [""],
  },
  successCriteria: {
    immediate: [initialSuccessCriterion()],
    longTerm: [initialSuccessCriterion()],
  },
  workEnvironment: {
    techMaturity: "emerging",
    structure: "hierarchical",
    communication: "async-first",
    pace: "steady-deliberate",
    growthExpectiations: "structured-paths",
    collaboration: "individual-contribution",
  },
});

// --- Methods to manage dynamic arrays ---
const addArrayItem = (arrayName) => {
  if (formData[arrayName] && Array.isArray(formData[arrayName])) {
    formData[arrayName].push("");
  } else {
    console.warn(
      `Cannot add item to non-array or undefined property: ${arrayName}`
    );
  }
};
const removeArrayItem = (arrayName, index) => {
  if (formData[arrayName] && Array.isArray(formData[arrayName])) {
    formData[arrayName].splice(index, 1);
    if (formData[arrayName].length === 0) {
      // Ensure at least one empty item if all removed
      formData[arrayName].push("");
    }
  }
};

const addTechStackItem = () => {
  formData.techStack.stack.push(initialTechStackItem());
};
const removeTechStackItem = (index) => {
  formData.techStack.stack.splice(index, 1);
};

const addSuccessCriterion = (period) => {
  // period is 'immediate' or 'longTerm'
  formData.successCriteria[period].push(initialSuccessCriterion());
};
const removeSuccessCriterion = (period, index) => {
  formData.successCriteria[period].splice(index, 1);
};

const handleSubmit = () => {
  const finalFormData = JSON.parse(JSON.stringify(formData));

  emit("submit", finalFormData);
};

const closeExtractionModal = () => {
  showExtractionModal.value = false;
  extractionText.value = "";
  extractionError.value = "";
};

const handleExtraction = async () => {
  if (!extractionText.value.trim()) {
    extractionError.value = "Please enter some text to extract data from";
    return;
  }

  if (!authStore.currentOrg?.id) {
    extractionError.value = "No organization selected. Please select an organization first.";
    return;
  }

  isExtracting.value = true;
  extractionError.value = "";

  try {
    // Create a temporary job ID for extraction
    const tempJobId = `temp_${Date.now()}`;
    
    const result = await extractAndSaveData({
      orgId: authStore.currentOrg.id,
      jobId: tempJobId,
      textInput: extractionText.value,
    });
    
    // Prefill form with extracted data
    if (result.data.success) {
      const extractedData = result.data.data;
      console.log("Extracted data:", extractedData);
      
      // Handle basic fields
      const basicFields = [
        'jobTitle', 'jobDepartment', 'jobDescription', 'jobLocation',
        'jobType', 'applicationDeadline', 'travelRequirements', 'salaryRange',
        'teamSize', 'riskTolerance', 'candidatePersona'
      ];
      
      basicFields.forEach(field => {
        if (extractedData[field]) {
          formData[field] = extractedData[field];
        }
      });

      // Handle each array field separately with its specific structure
      // Required Skills
      if (Array.isArray(extractedData.requiredSkills)) {
        formData.requiredSkills = extractedData.requiredSkills.map(skill => 
          typeof skill === 'object' ? skill.skill : skill
        ).filter(Boolean); // Remove any null/undefined/empty values
      }
      
      // Preferred Skills
      if (Array.isArray(extractedData.preferredSkills)) {
        formData.preferredSkills = extractedData.preferredSkills.map(skill => 
          typeof skill === 'object' ? skill.skill : skill
        ).filter(Boolean);
      }

      // Required Education
      if (Array.isArray(extractedData.requiredEducation)) {
        formData.requiredEducation = extractedData.requiredEducation
          .map(edu => typeof edu === 'object' ? edu.name || edu.degree : edu)
          .filter(Boolean);
      }

      // Required Certifications
      if (Array.isArray(extractedData.requiredCertifications)) {
        formData.requiredCertifications = extractedData.requiredCertifications
          .map(cert => typeof cert === 'object' ? cert.name || cert.title : cert)
          .filter(Boolean);
      }

      // Required Questions
      if (Array.isArray(extractedData.requiredQuestions)) {
        formData.requiredQuestions = extractedData.requiredQuestions
          .map(q => typeof q === 'object' ? q.question || q.text : q)
          .filter(Boolean);
      }

      // Candidate Resource Links
      if (Array.isArray(extractedData.candidateResourceLinks)) {
        formData.candidateResourceLinks = extractedData.candidateResourceLinks
          .map(link => typeof link === 'object' ? link.url || link.href : link)
          .filter(Boolean);
      }

      // Handle techStack
      if (extractedData.techStack) {
        if (extractedData.techStack.architecture) {
          formData.techStack.architecture = extractedData.techStack.architecture;
        }
        if (extractedData.techStack.scale) {
          formData.techStack.scale = extractedData.techStack.scale;
        }
        if (Array.isArray(extractedData.techStack.challenges)) {
          formData.techStack.challenges = extractedData.techStack.challenges;
        }
        if (Array.isArray(extractedData.techStack.practices)) {
          formData.techStack.practices = extractedData.techStack.practices;
        }
        if (Array.isArray(extractedData.techStack.stack)) {
          formData.techStack.stack = extractedData.techStack.stack.map(item => ({
            skill: item.skill || '',
            level: item.level || 'intermediate',
            realWorldApplication: item.realWorldApplication || '',
            redFlags: Array.isArray(item.redFlags) ? item.redFlags : [],
            weight: item.weight || 1
          }));
        }
      }

      // Handle successCriteria
      if (extractedData.successCriteria) {
        if (Array.isArray(extractedData.successCriteria.immediate)) {
          formData.successCriteria.immediate = extractedData.successCriteria.immediate.map(item => ({
            metric: item.metric || '',
            description: item.description || '',
            weight: item.weight || 1
          }));
        }
        if (Array.isArray(extractedData.successCriteria.longTerm)) {
          formData.successCriteria.longTerm = extractedData.successCriteria.longTerm.map(item => ({
            metric: item.metric || '',
            description: item.description || '',
            weight: item.weight || 1
          }));
        }
      }

      // Handle workEnvironment
      if (extractedData.workEnvironment) {
        const workEnvFields = [
          'techMaturity', 'structure', 'communication', 'pace',
          'growthExpectiations', 'collaboration'
        ];
        
        workEnvFields.forEach(field => {
          if (extractedData.workEnvironment[field]) {
            formData.workEnvironment[field] = extractedData.workEnvironment[field];
          }
        });
      }
    }

    closeExtractionModal();
  } catch (error) {
    console.error("Extraction error:", error);
    extractionError.value = error.message || "Failed to extract data";
  } finally {
    isExtracting.value = false;
  }
};
</script>

<style scoped>
.job-form-container {
  background: #f9f9f9;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}
.form-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #eee;
}
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
  grid-template-columns: 1fr; /* Default to single column */
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
.field-instructions {
  font-size: 0.85rem;
  color: #777;
  margin-bottom: 0.5rem;
}

/* Dynamic Array Input Styling */
.array-input-group {
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px dashed #d0d0d0;
  border-radius: 4px;
}
.array-input-group > label {
  /* Top level label for the group */
  font-weight: 500;
  color: #4caf50; /* Make group label distinct */
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
  background-color: #e8f5e9; /* Light green */
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
  background-color: #ffebee; /* Light red */
  color: #d32f2f;
  border-color: #ef9a9a;
  padding: 0.3em 0.6em; /* Make smaller for inline */
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

.form-actions {
  grid-column: 1 / -1; /* Ensure it spans all columns in form-grid */
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
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
  background-color: #4a90e2; /* Blue */
  color: white;
}
.btn-submit:hover {
  background-color: #357abd;
}
.btn-cancel {
  background-color: #7f8c8d; /* Gray */
  color: white;
}
.btn-cancel:hover {
  background-color: #6c7a7b;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 0.5rem 0;
}

.weight-slider {
  flex-grow: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: #e2e8f0;
  border-radius: 3px;
  outline: none;
}

.weight-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: #4a90e2;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.2s;
}

.weight-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: #4a90e2;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.2s;
  border: none;
}

.weight-slider::-webkit-slider-thumb:hover {
  background: #357abd;
}

.weight-slider::-moz-range-thumb:hover {
  background: #357abd;
}

.slider-value {
  min-width: 2rem;
  text-align: center;
  font-weight: 600;
  color: #4a5568;
  font-size: 0.9rem;
}

.form-actions-top {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.btn-extract {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.btn-extract:hover {
  background-color: #357abd;
}

.btn-icon {
  width: 1.2rem;
  height: 1.2rem;
}

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

.extraction-modal-container {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.extraction-modal-header {
  padding: 1rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.extraction-modal-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.btn-close-modal {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.extraction-modal-body {
  padding: 1rem;
  overflow-y: auto;
}

.extraction-modal-footer {
  padding: 1rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.error-message {
  color: #d32f2f;
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.extraction-result {
  margin-top: 1rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.extraction-result pre {
  margin: 0;
  white-space: pre-wrap;
  font-size: 0.9rem;
}

.text-area {
  width: 100%;
  min-height: 150px;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.95rem;
  resize: vertical;
}
</style>
