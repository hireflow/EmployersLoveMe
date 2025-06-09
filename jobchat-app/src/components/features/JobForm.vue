<template>
  <div class="job-form-container">
    <h2 class="form-title">Create New Job</h2>
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
  </div>
</template>

<script setup>
import { reactive, defineEmits } from "vue";

const emit = defineEmits(["submit", "close"]);

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
</script>

<style scoped>
.job-form-container {
  background: #ffffff;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.form-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
}

.form-layout {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

fieldset {
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 2rem;
  background-color: #ffffff;
  transition: all 0.3s ease;
}

fieldset:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

legend {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2c3e50;
  padding: 0 1rem;
  margin-bottom: 1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.form-grid.two-col {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

label,
.sub-label {
  font-weight: 500;
  color: #4a5568;
  font-size: 0.95rem;
}

.sub-label {
  margin-top: 0.75rem;
  color: #718096;
}

input[type="text"],
input[type="date"],
input[type="url"],
input[type="number"],
select,
textarea {
  padding: 0.75rem 1rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  width: 100%;
  box-sizing: border-box;
  transition: all 0.2s ease;
  background-color: #f8fafc;
}

input:hover,
select:hover,
textarea:hover {
  border-color: #cbd5e0;
  background-color: #ffffff;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
  outline: none;
  background-color: #ffffff;
}

textarea {
  min-height: 100px;
  resize: vertical;
}

/* Dynamic Array Input Styling */
.array-input-group {
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  border: 1.5px dashed #e2e8f0;
  border-radius: 8px;
  background-color: #f8fafc;
  transition: all 0.3s ease;
}

.array-input-group:hover {
  border-color: #cbd5e0;
  background-color: #ffffff;
}

.array-input-group > label {
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 1rem;
  display: block;
}

.array-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.array-item input,
.array-item textarea {
  flex-grow: 1;
}

.complex-array-item {
  border: 1.5px solid #e2e8f0;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: #ffffff;
  transition: all 0.3s ease;
}

.complex-array-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.sub-array-input-group {
  margin-top: 1rem;
  padding-left: 1.5rem;
  border-left: 3px solid #4299e1;
}

.btn-add-item,
.btn-remove-item {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  border: 1.5px solid;
  font-weight: 500;
}

.btn-add-item {
  background-color: #ebf8ff;
  color: #2b6cb0;
  border-color: #bee3f8;
}

.btn-add-item:hover {
  background-color: #bee3f8;
  transform: translateY(-1px);
}

.btn-add-item.btn-sm {
  padding: 0.35rem 0.75rem;
  font-size: 0.8rem;
}

.btn-remove-item {
  background-color: #fff5f5;
  color: #c53030;
  border-color: #feb2b2;
  padding: 0.4rem 0.7rem;
  font-weight: 600;
  line-height: 1;
}

.btn-remove-item:hover {
  background-color: #fed7d7;
  transform: translateY(-1px);
}

.btn-remove-item.btn-lg {
  font-size: 1.1rem;
  padding: 0.6rem 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #f0f0f0;
}

.btn-submit,
.btn-cancel {
  padding: 0.875rem 1.75rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-submit {
  background-color: #4299e1;
  color: white;
}

.btn-submit:hover {
  background-color: #3182ce;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.2);
}

.btn-cancel {
  background-color: #e2e8f0;
  color: #4a5568;
}

.btn-cancel:hover {
  background-color: #cbd5e0;
  transform: translateY(-1px);
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin: 0.75rem 0;
}

.weight-slider {
  flex-grow: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: #e2e8f0;
  border-radius: 3px;
  outline: none;
  transition: all 0.2s ease;
}

.weight-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: #4299e1;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.weight-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #4299e1;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: none;
}

.weight-slider::-webkit-slider-thumb:hover {
  background: #3182ce;
  transform: scale(1.1);
}

.weight-slider::-moz-range-thumb:hover {
  background: #3182ce;
  transform: scale(1.1);
}

.slider-value {
  min-width: 2.5rem;
  text-align: center;
  font-weight: 600;
  color: #2d3748;
  font-size: 1rem;
  background: #ebf8ff;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .job-form-container {
    padding: 1.5rem;
  }
  
  fieldset {
    padding: 1.5rem;
  }
  
  .form-grid.two-col {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn-submit,
  .btn-cancel {
    width: 100%;
  }
}
</style>
