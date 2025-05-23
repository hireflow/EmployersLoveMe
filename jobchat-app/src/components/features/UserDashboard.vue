<script setup>


import { useAuthStore } from "@/stores/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { ref, computed } from "vue";
import { RouterLink } from 'vue-router';
import JobDashboard from "./JobDashboard.vue";
import SideBarLayout from "../layouts/SideBarLayout.vue";

const authStore = useAuthStore();

// Initialize Firebase Functions
const functions = getFunctions();
const formActive = ref(false);
const isSubmitting = ref(false);

// Create a callable function reference
const companyName = ref("");
const errorMessage = ref("");
const successMessage = ref("");

const companySize = ref("");
const industry = ref("");
const location = ref("");
const companyDescription = ref("");
const missionStatement = ref("");

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
    const result = await createOrg({
      companyName: companyName.value,
      userId: authStore.user.uid,
      companySize: companySize.value,
      industry: industry.value,
      location: location.value,
      companyDescription: companyDescription.value,
      missionStatement: missionStatement.value,
    });

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
    companyDescription.value = "";
    missionStatement.value = "";
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
};
</script>

<template>
  <SideBarLayout>
    <!-- Main Content Area -->
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
                to="`/${authStore?.selectedOrg?.id}/${job.id}`" 
                class="btn btn-outline2 btn-sm">
                View Jobs
              </RouterLink>
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

      <JobDashboard v-if="authStore.selectedOrg" />

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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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
