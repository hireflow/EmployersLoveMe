<script setup>
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import { getFunctions, httpsCallable } from "firebase/functions";
import { ref, computed } from "vue";
import JobDashboard from "./JobDashboard.vue";
import SideBarLayout from "../layouts/SideBarLayout.vue";

const authStore = useAuthStore();
const router = useRouter();

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

const deleteOrgByIdCallable = httpsCallable(functions, "deleteOrg"); // Renamed for clarity

// Computed property to check if user is new (has no orgs)
let isNewUser = computed(() => {
  return !authStore.loading && authStore.orgs.length === 0;
});

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

const handleLogout = async () => {
  try {
    await authStore.logout();
    router.push("/login");
  } catch (error) {
    console.error("Logout error:", error);
    errorMessage.value = "Failed to logout. Please try again.";
  }
};
</script>

<template>

<SideBarLayout >
  <div class="dashboard-container">
    <header class="dashboard-header">
      <h1>Welcome, {{ authStore.user?.email }}</h1>
      <button @click="handleLogout" class="logout-button">Logout</button>
    </header>

    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
    </div>

    <!-- Loading State -->
    <div v-if="authStore.loading" class="loading-section">
      <p>Loading...</p>
    </div>

    <!-- New User Welcome Section -->
    <div v-else-if="isNewUser" class="welcome-section">
      <h2>Welcome to JobChat! 🎉</h2>
      <p>
        Get started by creating your first organization to manage your hiring
        process.
      </p>
      <button @click="toggleForm" class="primary-button">
        Create Your First Organization
      </button>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirmation" class="modal-overlay">
      <div class="confirmation-modal">
        <div class="confirmation-header">
          <h3>Confirm Deletion</h3>
        </div>
        <div class="confirmation-content">
          <p>Are you sure you want to delete the organization: <strong>{{ authStore.selectedOrg?.companyName }}</strong>?</p>
          <p class="warning-text">This action cannot be undone and will delete all jobs in the organization!</p>
        </div>
        <div class="confirmation-actions">
          <button @click="closeDeleteConfirmation" class="secondary-button">
            Cancel
          </button>
          <button @click="deleteOrg" class="secondary-button delete">
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Existing User Organization Section -->
    <div v-else class="org-management-section">
      <div class="section-header">
        <h2>Your Organizations</h2>
        <div class="button-group">
          <button
            v-if="authStore.selectedOrg?.id"
            class="secondary-button delete"
            @click="openDeleteConfirmation()"
          >
            Delete Organization
          </button>
          <button @click="toggleForm" class="secondary-button">
            + New Organization
          </button>
        </div>
      </div>

      <div class="org-selector">
        <select
          :value="authStore.selectedOrg?.id"
          @change="
            (e) => {
              const selected = authStore.orgs.find(
                (org) => org.id === e.target.value
              );
              if (selected) authStore.setSelectedOrg(selected);
            }
          "
          class="org-dropdown"
        >
          <option value="">Select an organization</option>
          <option v-for="org in authStore.orgs" :key="org.id" :value="org.id">
            {{ org.companyName }}
          </option>
        </select>

        <div v-if="authStore.selectedOrg" class="selected-org">
          <h3>Current Organization</h3>
          <div class="org-details">
            <p><strong>Name:</strong> {{ authStore.selectedOrg.companyName }}</p>
            <p>
              <strong>Industry:</strong> {{ authStore.selectedOrg.industry }}
            </p>
            <p>
              <strong>Location:</strong> {{ authStore.selectedOrg.location }}
            </p>
            <p>
              <strong>Size:</strong> {{ authStore.selectedOrg.companySize }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Organization Creation Form -->
    <div v-if="formActive" class="create-org-form">
      <h2>
        {{
          isNewUser
            ? "Create Your First Organization"
            : "Create New Organization"
        }}
      </h2>
      <form @submit.prevent="handleCreateOrg" class="form-grid">
        <div class="form-group">
          <label for="companyName">Organization Name</label>
          <input
            id="companyName"
            type="text"
            v-model="companyName"
            placeholder="Enter organization name"
            required
            :disabled="isSubmitting"
          />
        </div>

        <div class="form-group">
          <label for="companySize">Company Size</label>
          <input
            id="companySize"
            type="text"
            v-model="companySize"
            placeholder="e.g., 1-10, 11-50, 51-200"
            required
            :disabled="isSubmitting"
          />
        </div>

        <div class="form-group">
          <label for="industry">Industry</label>
          <input
            id="industry"
            type="text"
            v-model="industry"
            placeholder="e.g., Technology, Healthcare"
            required
            :disabled="isSubmitting"
          />
        </div>

        <div class="form-group">
          <label for="location">Location</label>
          <input
            id="location"
            type="text"
            v-model="location"
            placeholder="e.g., New York, NY"
            required
            :disabled="isSubmitting"
          />
        </div>

        <div class="form-group full-width">
          <label for="companyDescription">Company Description</label>
          <textarea
            id="companyDescription"
            v-model="companyDescription"
            placeholder="Brief description of your company"
            required
            :disabled="isSubmitting"
          ></textarea>
        </div>

        <div class="form-group full-width">
          <label for="missionStatement">Mission Statement</label>
          <textarea
            id="missionStatement"
            v-model="missionStatement"
            placeholder="Your company's mission"
            required
            :disabled="isSubmitting"
          ></textarea>
        </div>

        <div class="form-actions">
          <button
            type="button"
            @click="toggleForm"
            class="secondary-button"
            :disabled="isSubmitting"
          >
            Cancel
          </button>
          <button type="submit" class="primary-button" :disabled="isSubmitting">
            {{ isSubmitting ? "Creating..." : "Create Organization" }}
          </button>
        </div>
      </form>
    </div>

    <!-- Job Dashboard -->
    <JobDashboard v-if="authStore.selectedOrg" />
  </div>

</SideBarLayout>
</template>

<style scoped>
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.loading-section {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

.welcome-section {
  text-align: center;
  padding: 40px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin: 20px 0;
}

.welcome-section h2 {
  color: #2c3e50;
  margin-bottom: 16px;
}

.welcome-section p {
  color: #6c757d;
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.button-group {
  display: flex;
  gap: 0.5rem; /* Optional spacing between buttons */
}

.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.success-message {
  color: #28a745;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.create-org-form {
  background-color: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group.full-width {
  grid-column: span 2;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #495057;
  font-weight: 500;
}

input,
select,
textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 16px;
}

input:disabled,
select:disabled,
textarea:disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
}

textarea {
  min-height: 100px;
  resize: vertical;
}

.form-actions {
  grid-column: span 2;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.primary-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.primary-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.primary-button:disabled {
  background-color: #b3d7ff;
  cursor: not-allowed;
}

.secondary-button {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.secondary-button:hover:not(:disabled) {
  background-color: #5a6268;
}

.secondary-button:disabled {
  background-color: #a1a8ae;
  cursor: not-allowed;
}

.secondary-button.delete {
  background-color: #dc3545;
}
.secondary-button.delete:hover {
  background-color: #c82333;
}

.logout-button {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.logout-button:hover {
  background-color: #c82333;
}

.org-selector {
  margin: 20px 0;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.org-dropdown {
  width: 100%;
  max-width: 300px;
  padding: 8px;
  margin: 10px 0;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 16px;
}

.selected-org {
  margin-top: 20px;
  padding: 20px;
  background-color: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.org-details {
  margin-top: 16px;
}

.org-details p {
  margin: 8px 0;
  color: #495057;
}

.org-details strong {
  color: #212529;
}
/* Modal styling for delete confirmation */
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

.confirmation-modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.confirmation-header {
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.confirmation-header h3 {
  margin: 0;
  color: #212529;
  font-size: 1.3rem;
}

.confirmation-content {
  padding: 1.5rem;
}

.warning-text {
  color: #dc3545;
  font-weight: 500;
  margin-top: 0.5rem;
}

.confirmation-actions {
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

</style>
