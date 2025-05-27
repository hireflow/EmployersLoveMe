<script setup>
import { useAuthStore } from "@/stores/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { ref, computed } from "vue";
import { RouterLink } from 'vue-router';
// import JobDashboard from "./JobDashboard.vue";
import SideBarLayout from "../layouts/SideBarLayout.vue";

const authStore = useAuthStore();

// Initialize Firebase Functions
const functions = getFunctions();
const formActive = ref(false);
const isSubmitting = ref(false);
const isEditModalActive = ref(false);
const editingOrg = ref(null);

// Create a callable function reference
const companyName = ref("");
const errorMessage = ref("");
const successMessage = ref("");

const companySize = ref("");
const industry = ref("");
const location = ref("");
const companyDescription = ref("");
const missionStatement = ref("");
const companyValues = ref([]); // for objects like { name: '', description: '', weight: null }
const workEnvironment = ref({ techMaturity: '', structure: '', communication: '', pace: '', growthExpectations: '', collaboration: '', teamSize: null });

const showDeleteConfirmation = ref(false);
const deleteOrgByIdCallable = httpsCallable(functions, "deleteOrg");

// Computed property to check if user is new (has no orgs)
let isNewUser = computed(() => {
  return !authStore.loading && authStore.orgs.length === 0;
});

const selectOrg = async (org) => {
  try {
    await authStore.setSelectedOrg(org);
    successMessage.value = `${org.companyName} is now your selected organization`;
    
    // Clear message after a short delay
    setTimeout(() => {
      successMessage.value = "";
    }, 2000);
  } catch (error) {
    errorMessage.value = "Error selecting organization";
    console.error("Error selecting organization:", error);
  }
};

const handleCreateOrg = async () => {
  if (isSubmitting.value) return;

  try {
    isSubmitting.value = true;
    errorMessage.value = "";
    successMessage.value = "";

    if (!authStore.user?.uid || !authStore.user?.email) {
      throw new Error("User not authenticated");
    }

    // Validate form fields
    if (
      !companyName.value
    ) {
      throw new Error("Please fill in all required fields");
    }

    // Create organization
    const createOrg = httpsCallable(functions, "createOrg");
    const orgData = {
      companyName: companyName.value,
      userId: authStore.user.uid,
      companySize: companySize.value,
      industry: industry.value,
      location: location.value,
      companyDescription: companyDescription.value,
      missionStatement: missionStatement.value,
      companyValues: companyValues.value.filter(v => v.name && v.name.trim() !== ''), // Filter out empty values
      workEnvironment: workEnvironment.value,
    };

    const result = await createOrg(orgData);

    // Wait a short moment to ensure Firestore consistency
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Force refresh orgs with the new organization
    await authStore.fetchUserOrgs(true);

    // Set the newly created org as the selected org
    if (result.data?.orgId) {
      const newOrg = authStore.orgs.find((org) => org.id === result.data.orgId);
      if (newOrg) {
        await authStore.setSelectedOrg(newOrg);
      }
    }

    // Reset form
    companyName.value = "";
    companySize.value = "";
    industry.value = "";
    location.value = "";
    companyName.value = "";
    companySize.value = "";
    industry.value = "";
    location.value = "";
    companyDescription.value = "";
    missionStatement.value = "";
    companyValues.value = [];
    workEnvironment.value = { techMaturity: '', structure: '', communication: '', pace: '', growthExpectations: '', collaboration: '', teamSize: null };
    formActive.value = false;

    successMessage.value =
      "Organization created successfully! Hiring manager credentials have been created.";
  } catch (error) {
    console.error("Error creating organization:", error);

    // Handle specific error cases
    if (error.code === "already-exists") {
      errorMessage.value = "An organization with this name already exists.";
    } else if (error.code === "invalid-argument") {
      errorMessage.value =
        "Please check all required fields are filled correctly.";
    } else if (error.code === "permission-denied") {
      errorMessage.value =
        "You don't have permission to create an organization.";
    } else if (error.message) {
      errorMessage.value = error.message;
    } else {
      errorMessage.value = "Error creating organization. Please try again.";
    }
  } finally {
    isSubmitting.value = false;
  }
};

const openDeleteConfirmation = () => {
  showDeleteConfirmation.value = true;
};

const closeDeleteConfirmation = () => {
  if (authStore.selectedOrg){
    authStore.selectedOrg.value = null;
  }
  else{
    isNewUser = true;
  }
  showDeleteConfirmation.value = false;
};

const deleteOrg = async () => {
  try {
    
    if (!authStore.selectedOrg?.id) {
      console.log("No organization selected");
      errorMessage.value = "Organization information is missing";
      return;
    }

    errorMessage.value = "";
    successMessage.value = "";

    console.log("Deleting org with ID:", authStore.selectedOrg.id);
    
    const payload = {
      orgId: authStore.selectedOrg.id,
    };

    const result = await deleteOrgByIdCallable(payload);
    console.log("Delete Org result:", result);

    if (result.data.success) {
      console.log("Org deletion successful");
      await authStore.fetchUserOrgs(true); // Refresh the orgs list
      successMessage.value = "Organization deleted successfully!";
      closeDeleteConfirmation();
    } else {
      console.error("Delete org failed:", result.data.message);
      errorMessage.value =
        result.data.message || "Failed to org job. Please try again.";
    }
  } catch (error) {
    console.error("Error deleting job:", error);
    errorMessage.value =
      error.message || "An error occurred while deleting the org.";
  }
};

const toggleForm = () => {
  formActive.value = !formActive.value;
  errorMessage.value = "";
  successMessage.value = "";
  // Reset form fields if the form is being closed and also if it's a new user (to clear any potential pre-fills)
  if (!formActive.value || isNewUser.value) {
    companyName.value = "";
    companySize.value = "";
    industry.value = "";
    location.value = "";
    companyDescription.value = "";
    missionStatement.value = "";
    companyValues.value = [];
    workEnvironment.value = { techMaturity: '', structure: '', communication: '', pace: '', growthExpectations: '', collaboration: '', teamSize: null };
  }
};

const addCompanyValueEntry = () => {
  companyValues.value.push({ name: '', description: '', weight: null });
};

const removeCompanyValueEntry = (index) => {
  companyValues.value.splice(index, 1);
};

const openEditOrgModal = (org) => {
  // Deep copy the org object to avoid mutating the original store state directly
  editingOrg.value = JSON.parse(JSON.stringify(org));

  // Ensure companyValues and workEnvironment are initialized if they don't exist
  if (!editingOrg.value.companyValues) {
    editingOrg.value.companyValues = [];
  }
  if (!editingOrg.value.workEnvironment) {
    editingOrg.value.workEnvironment = { 
      techMaturity: '', 
      structure: '', 
      communication: '', 
      pace: '', 
      growthExpectations: '', 
      collaboration: '', 
      teamSize: null 
    };
  }
  isEditModalActive.value = true;
};

const addCompanyValueEntryToEditingOrg = () => {
  if (editingOrg.value && editingOrg.value.companyValues) {
    editingOrg.value.companyValues.push({ name: '', description: '', weight: null });
  }
};

const removeCompanyValueEntryFromEditingOrg = (index) => {
  if (editingOrg.value && editingOrg.value.companyValues) {
    editingOrg.value.companyValues.splice(index, 1);
  }
};

const cancelEditOrg = () => {
  isEditModalActive.value = false;
  editingOrg.value = null;
  errorMessage.value = ""; 
  successMessage.value = "";
};

const handleUpdateOrg = async () => {
  if (!editingOrg.value || !editingOrg.value.id) {
    errorMessage.value = "No organization selected for update.";
    return;
  }
  if (isSubmitting.value) return;

  isSubmitting.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const orgId = editingOrg.value.id;
    // Construct the updates object, excluding the id and potentially other non-editable fields
    const { id, hiringManagerIds, jobIds, createdAt, ...updatableData } = editingOrg.value;

    // Ensure companyValues and workEnvironment are part of the updatableData
    // and filter out empty company values
    const updates = {
      ...updatableData,
      companyValues: (updatableData.companyValues || []).filter(v => v.name && v.name.trim() !== ''),
      workEnvironment: updatableData.workEnvironment || { techMaturity: '', structure: '', communication: '', pace: '', growthExpectations: '', collaboration: '', teamSize: null }
    };

    const updateOrgCallable = httpsCallable(functions, "updateOrg"); // This function will be created in a later step
    await updateOrgCallable({ orgId, updates });

    await authStore.fetchUserOrgs(true); // Refresh the orgs list

    // Update selectedOrg if the edited org is the currently selected one
    if (authStore.selectedOrg && authStore.selectedOrg.id === orgId) {
      // Create a new object for selectedOrg to ensure reactivity if needed,
      // merging existing selectedOrg data with updates to keep it consistent.
      authStore.setSelectedOrg({ ...authStore.selectedOrg, ...updates });
    }
    
    successMessage.value = "Organization updated successfully!";
    isEditModalActive.value = false;
    editingOrg.value = null;

  } catch (error) {
    console.error("Error updating organization:", error);
    errorMessage.value = error.message || "Failed to update organization. Please try again.";
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <SideBarLayout>
    <!-- Main Content -->
    <div class="dashboard-container">
      <!-- Page Header -->
      <div class="page-header">
        <h1 class="page-title">Organizations</h1>
        <button @click="toggleForm" class="btn btn-primary add-btn">
          + Add Organization
        </button>
      </div>

      <!-- Alerts Section -->
      <div class="alerts-container">
        <div v-if="errorMessage" class="alert alert-error">
          <p>{{ errorMessage }}</p>
        </div>
        <div v-if="successMessage" class="alert alert-success">
          <p>{{ successMessage }}</p>
        </div>
      </div>

      <!-- Loading Section -->
      <div v-if="authStore.loading" class="loading-container">
        <div class="loading-spinner"></div>
      </div>

      <!-- New User Welcome Section -->
      <div v-else-if="isNewUser" class="welcome-container">
        <div class="welcome-icon">
          <svg class="icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h2 class="welcome-title">Welcome to Swiftly! 🎉</h2>
        <p class="welcome-text">Get started by creating your first organization to manage your hiring process.</p>
        <div class="welcome-actions">
          <button @click="toggleForm" class="btn btn-primary">
            Create Your First Organization
          </button>
        </div>
      </div>

      <!-- Organization Grid -->
      <div v-else class="org-grid">
        <!-- Organization Cards -->
        <div v-for="org in authStore.orgs" :key="org.id" class="org-card" @click="selectOrg(org)">
          <div class="org-card-header">
            <h3 class="org-title">{{ org.companyName }}</h3>
          </div>
          <div class="org-card-body">
            <div v-if="org.id === authStore.selectedOrg?.id" class="selected-badge">Selected</div>
            <div class="org-info">
              <p v-if="org.industry"><span class="info-label">Industry:</span> {{ org.industry }}</p>
              <p v-if="org.location"><span class="info-label">Location:</span> {{ org.location }}</p>
              <p v-if="org.companySize"><span class="info-label">Size:</span> {{ org.companySize }}</p>
            </div>
            <div class="important-updates">
              <h4>Important Updates</h4>
              <p>No important updates</p>
            </div>
            <div class="org-actions">
              <button @click.stop="openDeleteConfirmation(org)" class="btn btn-outline btn-sm">
                Delete
              </button>
              <RouterLink 
                :to="`/${org.id}/jobs`" 
                class="btn btn-outline2 btn-sm">
                View Jobs
              </RouterLink>
              <button @click.stop="openEditOrgModal(org)" class="btn btn-outline-primary btn-sm">
                Edit Details
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Organization Creation Form -->
      <div v-if="formActive" class="modal-overlay">
        <div class="modal-container">
          <div class="modal-header">
            <h2 class="modal-title">
              {{ isNewUser ? "Create Your First Organization" : "Create New Organization" }}
            </h2>
          </div>
          
          <form @submit.prevent="handleCreateOrg" class="modal-body">
            <div class="form-grid">
              <div class="form-group">
                <label for="companyName" class="form-label">Organization Name *</label>
                <input
                  id="companyName"
                  type="text"
                  v-model="companyName"
                  placeholder="Enter organization name"
                  required
                  :disabled="isSubmitting"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="companySize" class="form-label">Company Size</label>
                <input
                  id="companySize"
                  type="text"
                  v-model="companySize"
                  placeholder="e.g., 1-10, 11-50, 51-200"
                  :disabled="isSubmitting"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="industry" class="form-label">Industry</label>
                <input
                  id="industry"
                  type="text"
                  v-model="industry"
                  placeholder="e.g., Technology, Healthcare"
                  :disabled="isSubmitting"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="location" class="form-label">Location</label>
                <input
                  id="location"
                  type="text"
                  v-model="location"
                  placeholder="e.g., New York, NY"
                  :disabled="isSubmitting"
                  class="form-input"
                />
              </div>

              <div class="form-group form-group-full">
                <label for="companyDescription" class="form-label">Company Description</label>
                <textarea
                  id="companyDescription"
                  v-model="companyDescription"
                  placeholder="Brief description of your company"
                  :disabled="isSubmitting"
                  class="form-textarea"
                ></textarea>
              </div>

              <div class="form-group form-group-full">
                <label for="missionStatement" class="form-label">Mission Statement</label>
                <textarea
                  id="missionStatement"
                  v-model="missionStatement"
                  placeholder="Your company's mission"
                  :disabled="isSubmitting"
                  class="form-textarea"
                ></textarea>
                <p class="word-limit-cue">Please limit to approximately 75 words.</p>
              </div>

              <div class="form-group form-group-full">
                <label for="missionStatement" class="form-label">Mission Statement</label>
                <textarea
                  id="missionStatement"
                  v-model="missionStatement"
                  placeholder="Your company's mission"
                  :disabled="isSubmitting"
                  class="form-textarea"
                ></textarea>
                <p class="word-limit-cue">Please limit to approximately 75 words.</p>
              </div>
            </div>

            <!-- Company Values Section -->
            <div class="form-section">
              <h3 class="section-title">Company Values</h3>
              <div v-for="(value, index) in companyValues" :key="index" class="company-value-entry">
                <div class="form-grid">
                  <div class="form-group">
                    <label :for="'valueName-' + index" class="form-label">Value Name</label>
                    <input
                      :id="'valueName-' + index"
                      type="text"
                      v-model="value.name"
                      placeholder="Value Name, e.g., Innovation"
                      class="form-input"
                      :disabled="isSubmitting"
                    />
                  </div>
                  <div class="form-group">
                    <label :for="'valueWeight-' + index" class="form-label">Weight (1-5)</label>
                    <input
                      :id="'valueWeight-' + index"
                      type="number"
                      v-model.number="value.weight"
                      placeholder="Weight (1-5)"
                      min="1"
                      max="5"
                      class="form-input"
                      :disabled="isSubmitting"
                    />
                  </div>
                </div>
                <div class="form-group">
                  <label :for="'valueDescription-' + index" class="form-label">Description</label>
                  <textarea
                    :id="'valueDescription-' + index"
                    v-model="value.description"
                    placeholder="Describe this value in ~75 words or less."
                    class="form-textarea"
                    :disabled="isSubmitting"
                  ></textarea>
                </div>
                <button type="button" @click="removeCompanyValueEntry(index)" class="btn btn-danger btn-sm remove-value-btn" :disabled="isSubmitting">
                  Remove Value
                </button>
              </div>
              <button type="button" @click="addCompanyValueEntry" class="btn btn-outline btn-sm add-value-btn" :disabled="isSubmitting">
                + Add Company Value
              </button>
            </div>

            <!-- Work Environment Section -->
            <div class="form-section">
              <h3 class="section-title">Work Environment</h3>
              <div class="form-grid">
                <div class="form-group">
                  <label for="techMaturity" class="form-label">Tech Maturity</label>
                  <select id="techMaturity" v-model="workEnvironment.techMaturity" class="form-select" :disabled="isSubmitting">
                    <option value="" disabled>Select Tech Maturity</option>
                    <option value="Emerging">Emerging: Predominantly legacy systems, initial stages of modernization, limited adoption of new technologies.</option>
                    <option value="Established">Established: Well-defined tech stack, regular updates, moderate adoption of new technologies, some legacy systems may still exist.</option>
                    <option value="Modern">Modern: Current and regularly updated technologies, agile practices, significant use of cloud services and modern architectures.</option>
                    <option value="CuttingEdge">Cutting-Edge: Actively explores and implements the latest technologies, R&D focused, high tolerance for experimentation.</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="structure" class="form-label">Organizational Structure</label>
                  <select id="structure" v-model="workEnvironment.structure" class="form-select" :disabled="isSubmitting">
                    <option value="" disabled>Select Structure</option>
                    <option value="Hierarchical">Hierarchical: Traditional top-down structure with clear levels of authority and decision-making.</option>
                    <option value="Flat">Flat: Few or no levels of middle management, direct communication between staff and executives.</option>
                    <option value="Matrix">Matrix: Employees report to multiple managers, project-based work with cross-functional teams.</option>
                    <option value="Holacratic">Holacratic: Decentralized authority, self-managing teams, role-based work distribution.</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="communication" class="form-label">Communication Style</label>
                  <select id="communication" v-model="workEnvironment.communication" class="form-select" :disabled="isSubmitting">
                    <option value="" disabled>Select Communication Style</option>
                    <option value="Formal">Formal: Structured communication channels, emphasis on written documentation and official meetings.</option>
                    <option value="Informal">Informal: Open communication, frequent ad-hoc discussions, reliance on direct messaging and collaboration tools.</option>
                    <option value="Mixed">Mixed: A blend of formal and informal communication, adapting style to the situation.</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="pace" class="form-label">Work Pace</label>
                  <select id="pace" v-model="workEnvironment.pace" class="form-select" :disabled="isSubmitting">
                    <option value="" disabled>Select Work Pace</option>
                    <option value="Steady">Steady: Predictable workload, emphasis on work-life balance, consistent deadlines.</option>
                    <option value="FastPaced">Fast-Paced: Dynamic environment, frequent changes, tight deadlines, high-energy.</option>
                    <option value="Variable">Variable: Mix of steady periods and high-intensity projects, requires adaptability.</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="growthExpectations" class="form-label">Growth Expectations</label>
                  <select id="growthExpectations" v-model="workEnvironment.growthExpectations" class="form-select" :disabled="isSubmitting">
                    <option value="" disabled>Select Growth Expectations</option>
                    <option value="RapidExpansion">Rapid Expansion: Aggressive growth targets, focus on scaling operations and market share.</option>
                    <option value="StableGrowth">Stable Growth: Consistent and sustainable growth, focus on long-term stability.</option>
                    <option value="MaintenanceFocus">Maintenance Focus: Emphasis on retaining existing market position and customer base.</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="collaboration" class="form-label">Collaboration Level</label>
                  <select id="collaboration" v-model="workEnvironment.collaboration" class="form-select" :disabled="isSubmitting">
                    <option value="" disabled>Select Collaboration Level</option>
                    <option value="HighlyCollaborative">Highly Collaborative: Constant teamwork, cross-functional projects, open office or shared digital workspaces.</option>
                    <option value="ModeratelyCollaborative">Moderately Collaborative: Mix of individual work and team projects, defined collaboration points.</option>
                    <option value="PrimarilyIndependent">Primarily Independent: Focus on individual contributions, less emphasis on group work.</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="teamSize" class="form-label">Typical Team Size</label>
                  <input
                    id="teamSize"
                    type="number"
                    v-model.number="workEnvironment.teamSize"
                    placeholder="e.g., 5"
                    min="1"
                    class="form-input"
                    :disabled="isSubmitting"
                  />
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button
                type="button"
                @click="toggleForm"
                class="btn btn-secondary"
                :disabled="isSubmitting"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                class="btn btn-primary"
                :disabled="isSubmitting"
              >
                {{ isSubmitting ? "Creating..." : "Create Organization" }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- <JobDashboard v-if="authStore.selectedOrg" /> -->

      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteConfirmation" class="modal-overlay">
        <div class="modal-container modal-sm">
          <div class="modal-header">
            <h3 class="modal-title">Confirm Deletion</h3>
          </div>
          <div class="modal-body">
            <p class="confirm-text">Are you sure you want to delete the organization: <span class="highlight">{{ authStore.selectedOrg?.companyName }}</span>?</p>
            <p class="warning-text">This action cannot be undone and will delete all jobs in the organization!</p>
          </div>
          <div class="modal-footer">
            <button @click="closeDeleteConfirmation" class="btn btn-secondary">
              Cancel
            </button>
            <button @click="deleteOrg" class="btn btn-danger">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Organization Modal -->
    <div v-if="isEditModalActive" class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h2 class="modal-title">Edit Organization Details</h2>
        </div>
        <form @submit.prevent="handleUpdateOrg" class="modal-body" v-if="editingOrg">
          <div class="form-grid">
            <div class="form-group">
              <label for="editCompanyName" class="form-label">Organization Name *</label>
              <input id="editCompanyName" type="text" v-model="editingOrg.companyName" required class="form-input" :disabled="isSubmitting"/>
            </div>
            <div class="form-group">
              <label for="editCompanySize" class="form-label">Company Size</label>
              <input id="editCompanySize" type="text" v-model="editingOrg.companySize" class="form-input" :disabled="isSubmitting"/>
            </div>
            <div class="form-group">
              <label for="editIndustry" class="form-label">Industry</label>
              <input id="editIndustry" type="text" v-model="editingOrg.industry" class="form-input" :disabled="isSubmitting"/>
            </div>
            <div class="form-group">
              <label for="editLocation" class="form-label">Location</label>
              <input id="editLocation" type="text" v-model="editingOrg.location" class="form-input" :disabled="isSubmitting"/>
            </div>
            <div class="form-group form-group-full">
              <label for="editCompanyDescription" class="form-label">Company Description</label>
              <textarea id="editCompanyDescription" v-model="editingOrg.companyDescription" class="form-textarea" :disabled="isSubmitting"></textarea>
              <p class="word-limit-cue">Please limit to approximately 75 words.</p>
            </div>
            <div class="form-group form-group-full">
              <label for="editMissionStatement" class="form-label">Mission Statement</label>
              <textarea id="editMissionStatement" v-model="editingOrg.missionStatement" class="form-textarea" :disabled="isSubmitting"></textarea>
              <p class="word-limit-cue">Please limit to approximately 75 words.</p>
            </div>
          </div>

          <!-- Company Values Section for Editing -->
          <div class="form-section">
            <h3 class="section-title">Company Values</h3>
            <div v-for="(value, index) in editingOrg.companyValues" :key="index" class="company-value-entry">
              <div class="form-grid">
                <div class="form-group">
                  <label :for="'editValueName-' + index" class="form-label">Value Name</label>
                  <input :id="'editValueName-' + index" type="text" v-model="value.name" placeholder="Value Name" class="form-input" :disabled="isSubmitting"/>
                </div>
                <div class="form-group">
                  <label :for="'editValueWeight-' + index" class="form-label">Weight (1-5)</label>
                  <input :id="'editValueWeight-' + index" type="number" v-model.number="value.weight" placeholder="Weight (1-5)" min="1" max="5" class="form-input" :disabled="isSubmitting"/>
                </div>
              </div>
              <div class="form-group">
                <label :for="'editValueDescription-' + index" class="form-label">Description</label>
                <textarea :id="'editValueDescription-' + index" v-model="value.description" placeholder="Describe this value in ~75 words or less." class="form-textarea" :disabled="isSubmitting"></textarea>
              </div>
              <button type="button" @click="removeCompanyValueEntryFromEditingOrg(index)" class="btn btn-danger btn-sm remove-value-btn" :disabled="isSubmitting">Remove Value</button>
            </div>
            <button type="button" @click="addCompanyValueEntryToEditingOrg" class="btn btn-outline btn-sm add-value-btn" :disabled="isSubmitting">+ Add Company Value</button>
          </div>

          <!-- Work Environment Section for Editing -->
          <div class="form-section">
            <h3 class="section-title">Work Environment</h3>
            <div class="form-grid">
              <div class="form-group">
                <label for="editTechMaturity" class="form-label">Tech Maturity</label>
                <select id="editTechMaturity" v-model="editingOrg.workEnvironment.techMaturity" class="form-select" :disabled="isSubmitting">
                  <option value="" disabled>Select Tech Maturity</option>
                  <option value="Emerging">Emerging</option>
                  <option value="Established">Established</option>
                  <option value="Modern">Modern</option>
                  <option value="CuttingEdge">Cutting-Edge</option>
                </select>
              </div>
              <div class="form-group">
                  <label for="editStructure" class="form-label">Organizational Structure</label>
                  <select id="editStructure" v-model="editingOrg.workEnvironment.structure" class="form-select" :disabled="isSubmitting">
                    <option value="" disabled>Select Structure</option>
                    <option value="Hierarchical">Hierarchical</option>
                    <option value="Flat">Flat</option>
                    <option value="Matrix">Matrix</option>
                    <option value="Holacratic">Holacratic</option>
                  </select>
              </div>
              <div class="form-group">
                  <label for="editCommunication" class="form-label">Communication Style</label>
                  <select id="editCommunication" v-model="editingOrg.workEnvironment.communication" class="form-select" :disabled="isSubmitting">
                    <option value="" disabled>Select Communication Style</option>
                    <option value="Formal">Formal</option>
                    <option value="Informal">Informal</option>
                    <option value="Mixed">Mixed</option>
                  </select>
              </div>
              <div class="form-group">
                  <label for="editPace" class="form-label">Work Pace</label>
                  <select id="editPace" v-model="editingOrg.workEnvironment.pace" class="form-select" :disabled="isSubmitting">
                    <option value="" disabled>Select Work Pace</option>
                    <option value="Steady">Steady</option>
                    <option value="FastPaced">Fast-Paced</option>
                    <option value="Variable">Variable</option>
                  </select>
              </div>
              <div class="form-group">
                  <label for="editGrowthExpectations" class="form-label">Growth Expectations</label>
                  <select id="editGrowthExpectations" v-model="editingOrg.workEnvironment.growthExpectations" class="form-select" :disabled="isSubmitting">
                    <option value="" disabled>Select Growth Expectations</option>
                    <option value="RapidExpansion">Rapid Expansion</option>
                    <option value="StableGrowth">Stable Growth</option>
                    <option value="MaintenanceFocus">Maintenance Focus</option>
                  </select>
              </div>
              <div class="form-group">
                  <label for="editCollaboration" class="form-label">Collaboration Level</label>
                  <select id="editCollaboration" v-model="editingOrg.workEnvironment.collaboration" class="form-select" :disabled="isSubmitting">
                    <option value="" disabled>Select Collaboration Level</option>
                    <option value="HighlyCollaborative">Highly Collaborative</option>
                    <option value="ModeratelyCollaborative">Moderately Collaborative</option>
                    <option value="PrimarilyIndependent">Primarily Independent</option>
                  </select>
              </div>
              <div class="form-group">
                <label for="editTeamSize" class="form-label">Typical Team Size</label>
                <input id="editTeamSize" type="number" v-model.number="editingOrg.workEnvironment.teamSize" placeholder="e.g., 5" min="1" class="form-input" :disabled="isSubmitting"/>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" @click="cancelEditOrg" class="btn btn-secondary" :disabled="isSubmitting">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">{{ isSubmitting ? "Saving..." : "Save Changes" }}</button>
          </div>
        </form>
      </div>
    </div>
  </SideBarLayout>
</template>

<style scoped>
/* Dashboard Container */
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.add-btn {
  padding: 8px 16px;
  font-size: 14px;
}

/* Alerts */
.alerts-container {
  margin-bottom: 20px;
}

.alert {
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.alert-error {
  background-color: #fde8e8;
  border-left: 4px solid #f56565;
  color: #c53030;
}

.alert-success {
  background-color: #e6fffa;
  border-left: 4px solid #38b2ac;
  color: #2c7a7b;
}

/* Loading */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 250px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid #e2e8f0;
  border-radius: 50%;
  border-top-color: #3b82f6;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Welcome Section */
.welcome-container {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 30px;
  text-align: center;
  margin-bottom: 30px;
}

.welcome-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  color: #3b82f6;
}

.icon {
  width: 100%;
  height: 100%;
  stroke: currentColor;
  stroke-width: 2;
  fill: none;
}

.welcome-title {
  font-size: 24px;
  font-weight: bold;
  color: #1a202c;
  margin-bottom: 15px;
}

.welcome-text {
  color: #4a5568;
  margin-bottom: 25px;
}

.welcome-actions {
  margin-top: 20px;
}

/* Organization Grid */
.org-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.org-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.2s ease-in-out;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  position: relative;
}

.org-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
}

.org-card-header {
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  background-color: #f7fafc;
}

.org-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
}

.org-card-body {
  padding: 16px;
  position: relative;
}

.selected-badge {
  position: absolute;
  top: -10px;
  right: 16px;
  background-color: #48bb78;
  color: white;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 12px;
}

.org-info {
  margin-bottom: 16px;
}

.org-info p {
  margin: 8px 0;
  font-size: 14px;
  color: #4a5568;
}

.info-label {
  font-weight: 500;
  color: #718096;
}

.important-updates {
  background-color: #ebf4ff;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.important-updates h4 {
  font-size: 14px;
  font-weight: 600;
  color: #2b6cb0;
  margin: 0 0 8px 0;
}

.important-updates p {
  font-size: 13px;
  color: #4a5568;
  margin: 0;
}

.org-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

/* Button Styles */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-primary:disabled {
  background-color: #bfdbfe;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover {
  background-color: #cbd5e0;
}

.btn-danger {
  background-color: #e53e3e;
  color: white;
}

.btn-danger:hover {
  background-color: #c53030;
}

.btn-outline {
  background-color: transparent;
  color: #e53e3e;
  border: 1px solid #e53e3e;
}

.btn-outline2 {
  background-color: transparent;
  color: rgb(10, 200, 10);
  border: 1px solid #00d953;
}

.btn-outline:hover {
  background-color: #fdf2f2;
}

.btn-outline-primary {
  background-color: transparent;
  color: #3b82f6; /* Primary blue */
  border: 1px solid #3b82f6; /* Primary blue */
}

.btn-outline-primary:hover {
  background-color: #eff6ff; /* Light blue background on hover */
  color: #2563eb; /* Darker blue text on hover */
  border-color: #2563eb; /* Darker blue border on hover */
}

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}

/* Form Elements */
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
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-sm {
  max-width: 500px;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 15px 20px;
  background-color: #f7fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group-full {
  grid-column: span 2;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 5px;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  font-size: 14px;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: #3b82f6;
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  min-height: 100px;
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.confirm-text {
  margin-bottom: 12px;
}

.highlight {
  font-weight: 600;
}

.warning-text {
  color: #e53e3e;
  font-size: 14px;
  font-weight: 500;
  margin-top: 8px;
}

.form-section {
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0; /* Light gray border */
}

.section-title {
  font-size: 1.3em;
  font-weight: 600;
  color: #2d3748; /* Darker gray-blue */
  margin-bottom: 18px;
}

.company-value-entry {
  background-color: #f9fafb; /* Very light gray background for each entry */
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 15px;
  border: 1px solid #e5e7eb; /* Slightly darker border */
}

.remove-value-btn {
  margin-top: 10px;
  float: right; /* Align to the right */
}

.add-value-btn {
  margin-top: 5px;
  border-style: dashed; /* Dashed border for add button */
  /* Custom styling for the add value button to make it less prominent than danger */
  background-color: transparent;
  color: #3b82f6; /* Blue text */
  border: 1px dashed #3b82f6; /* Blue dashed border */
}

.add-value-btn:hover {
  background-color: #eff6ff; /* Light blue background on hover */
  color: #2563eb; /* Darker blue text on hover */
  border-color: #2563eb; /* Darker blue border on hover */
}


.word-limit-cue {
  font-size: 0.8rem;
  color: #718096; /* Medium gray text */
  margin-top: 4px;
}


/* Media Queries */
@media (max-width: 768px) {
  .org-grid {
    grid-template-columns: 1fr;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-group-full {
    grid-column: span 1;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
