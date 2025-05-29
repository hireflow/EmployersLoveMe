<script setup>
import { useAuthStore } from "@/stores/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { ref, computed, nextTick } from "vue";
import { RouterLink } from "vue-router";
import SideBarLayout from "../layouts/SideBarLayout.vue";

const authStore = useAuthStore();
const functions = getFunctions();

const formActive = ref(false);
const isEditMode = ref(false);
const editingOrgId = ref(null);
const isSubmitting = ref(false);

const companyName = ref("");
// UPDATED: Company Size will now be a select, so default to a common value or empty string
const companySize = ref(""); // e.g., "11-50"
const industry = ref("");
const location = ref("");
const companyDescription = ref("");
const missionStatement = ref("");
const logoUrl = ref("");

const companyValues = ref([{ name: "", description: "", weight: 50 }]);

const errorMessage = ref("");
const successMessage = ref("");

const showDeleteConfirmation = ref(false);
const deleteOrgByIdCallable = httpsCallable(functions, "deleteOrg");
const createOrgCallable = httpsCallable(functions, "createOrg");
const updateOrgCallable = httpsCallable(functions, "updateOrg");

let isNewUser = computed(() => {
  return !authStore.loading && authStore.orgs.length === 0;
});

const resetFormFields = () => {
  companyName.value = "";
  companySize.value = ""; // Reset to empty or a default for select
  industry.value = "";
  location.value = "";
  companyDescription.value = "";
  missionStatement.value = "";
  logoUrl.value = "";
  companyValues.value = [{ name: "", description: "", weight: 50 }];
  editingOrgId.value = null;
};

const selectOrg = async (org) => {
  try {
    await authStore.setSelectedOrg(org);
    successMessage.value = `${org.companyName} is now your selected organization`;
    setTimeout(() => {
      successMessage.value = "";
    }, 2000);
  } catch (error) {
    errorMessage.value = "Error selecting organization";
    console.error("Error selecting organization:", error);
  }
};

const handleFormSubmit = async () => {
  if (isSubmitting.value) return;

  try {
    isSubmitting.value = true;
    errorMessage.value = "";
    successMessage.value = "";

    if (!authStore.user?.uid || !authStore.user?.email) {
      throw new Error("User not authenticated");
    }

    if (!companyName.value) {
      throw new Error("Please fill in Organization Name.");
    }
    if (!companySize.value) {
      // Example: make company size mandatory
      throw new Error("Please select Company Size.");
    }

    const filteredCompanyValues = companyValues.value
      .filter((cv) => cv.name.trim() !== "" || cv.description.trim() !== "")
      .map((cv) => ({ ...cv, weight: Number(cv.weight) })); // Ensure weight is a number

    const orgDataPayload = {
      companyName: companyName.value,
      companySize: companySize.value,
      industry: industry.value,
      location: location.value,
      companyDescription: companyDescription.value,
      missionStatement: missionStatement.value,
      logoUrl: logoUrl.value,
      companyValues: filteredCompanyValues,
    };

    if (isEditMode.value && editingOrgId.value) {
      const result = await updateOrgCallable({
        orgId: editingOrgId.value,
        updates: orgDataPayload,
      });
      if (!result.data.success) {
        throw new Error(result.data.message || "Error updating organization.");
      }
      successMessage.value = "Organization updated successfully!";
    } else {
      const result = await createOrgCallable({
        ...orgDataPayload,
        userId: authStore.user.uid,
      });
      if (!result.data.success) {
        throw new Error(result.data.message || "Error creating organization.");
      }
      successMessage.value =
        "Organization created successfully! Hiring manager credentials have been created.";
      if (result.data?.orgId) {
        await authStore.fetchUserOrgs(true);
        await nextTick();
        const newOrg = authStore.orgs.find(
          (org) => org.id === result.data.orgId
        );
        if (newOrg) {
          await authStore.setSelectedOrg(newOrg);
        }
      }
    }

    await authStore.fetchUserOrgs(true);
    resetFormFields();
    formActive.value = false;
    isEditMode.value = false;
  } catch (error) {
    console.error(
      `Error ${isEditMode.value ? "updating" : "creating"} organization:`,
      error
    );
    // ... (rest of your error handling)
    if (error.code === "already-exists") {
      errorMessage.value = "An organization with this name already exists.";
    } else if (error.code === "invalid-argument") {
      errorMessage.value =
        "Please check all required fields are filled correctly.";
    } else if (error.code === "permission-denied") {
      errorMessage.value = `You don't have permission to ${
        isEditMode.value ? "update" : "create an"
      } organization.`;
    } else if (error.message) {
      errorMessage.value = error.message;
    } else {
      errorMessage.value = `Error ${
        isEditMode.value ? "updating" : "creating"
      } organization. Please try again.`;
    }
  } finally {
    isSubmitting.value = false;
  }
};

const openCreateForm = () => {
  resetFormFields();
  isEditMode.value = false;
  formActive.value = true;
  errorMessage.value = "";
  successMessage.value = "";
};

const openEditForm = (org) => {
  if (!org) return;
  isEditMode.value = true;
  editingOrgId.value = org.id;

  companyName.value = org.companyName || "";
  companySize.value = org.companySize || "";
  industry.value = org.industry || "";
  location.value = org.location || "";
  companyDescription.value = org.companyDescription || "";
  missionStatement.value = org.missionStatement || "";
  logoUrl.value = org.logoUrl || "";

  companyValues.value = JSON.parse(
    JSON.stringify(
      org.companyValues || [{ name: "", description: "", weight: 50 }]
    )
  );
  if (!companyValues.value.length) {
    companyValues.value.push({ name: "", description: "", weight: 50 });
  }

  formActive.value = true;
  errorMessage.value = "";
  successMessage.value = "";
};

const closeForm = () => {
  formActive.value = false;
  isEditMode.value = false;
  resetFormFields();
  errorMessage.value = "";
  successMessage.value = "";
};

const addCompanyValue = () => {
  companyValues.value.push({ name: "", description: "", weight: 50 });
};

const removeCompanyValue = (index) => {
  if (companyValues.value.length > 1) {
    companyValues.value.splice(index, 1);
  } else {
    companyValues.value[index] = { name: "", description: "", weight: 50 }; // Clear if last one
  }
};

const openDeleteConfirmation = (orgToDelete) => {
  if (orgToDelete && authStore.selectedOrg?.id !== orgToDelete.id) {
    authStore.tempOrgForDeletion = orgToDelete;
  } else {
    authStore.tempOrgForDeletion = null;
  }
  showDeleteConfirmation.value = true;
};

const closeDeleteConfirmation = () => {
  showDeleteConfirmation.value = false;
  authStore.tempOrgForDeletion = null;
};

const getOrgForDeletion = () => {
  return authStore.tempOrgForDeletion || authStore.selectedOrg;
};

const deleteOrg = async () => {
  const orgToDelete = getOrgForDeletion();
  if (!orgToDelete?.id) {
    errorMessage.value =
      "Organization information is missing or no organization is selected for deletion.";
    closeDeleteConfirmation();
    return;
  }

  try {
    errorMessage.value = "";
    successMessage.value = "";
    isSubmitting.value = true;

    const payload = { orgId: orgToDelete.id };
    const result = await deleteOrgByIdCallable(payload);

    if (result.data.success) {
      await authStore.fetchUserOrgs(true);
      if (authStore.selectedOrg?.id === orgToDelete.id) {
        authStore.setSelectedOrg(null);
      }
      successMessage.value = "Organization deleted successfully!";
      closeDeleteConfirmation();
      // Check if the user has any orgs left AFTER deletion and fetch
      if (authStore.orgs.length === 0) {
        isNewUser.value = true; // computed property will also react
      }
    } else {
      errorMessage.value =
        result.data.message ||
        "Failed to delete organization. Please try again.";
    }
  } catch (error) {
    console.error("Error deleting organization:", error);
    errorMessage.value =
      error.message || "An error occurred while deleting the organization.";
  } finally {
    isSubmitting.value = false;
    authStore.tempOrgForDeletion = null;
  }
};
</script>

<template>
  <SideBarLayout>
    <div class="dashboard-container">
      <div class="page-header">
        <h1 class="page-title">Organizations</h1>
        <button @click="openCreateForm" class="btn btn-primary add-btn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            class="btn-icon"
          >
            <path
              d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"
            />
          </svg>
          Add Organization
        </button>
      </div>

      <div class="alerts-container">
        <div v-if="errorMessage" class="alert alert-danger">
          <p>{{ errorMessage }}</p>
        </div>
        <div v-if="successMessage" class="alert alert-success">
          <p>{{ successMessage }}</p>
        </div>
      </div>

      <div v-if="authStore.loading" class="loading-container">
        <div class="loading-spinner"></div>
      </div>

      <div v-else-if="isNewUser && !formActive" class="welcome-container">
        <div class="welcome-icon">
          <svg
            class="icon"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="currentColor"
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        </div>
        <h2 class="welcome-title">Welcome to Swiftly! 🎉</h2>
        <p class="welcome-text">
          Get started by creating your first organization to manage your hiring
          process.
        </p>
        <div class="welcome-actions">
          <button @click="openCreateForm" class="btn btn-primary">
            Create Your First Organization
          </button>
        </div>
      </div>

      <div
        v-else-if="!isNewUser && authStore.orgs.length > 0 && !formActive"
        class="org-grid"
      >
        <div
          v-for="org in authStore.orgs"
          :key="org.id"
          class="org-card"
          @click="selectOrg(org)"
          :class="{ 'is-selected': org.id === authStore.selectedOrg?.id }"
        >
          <div class="org-card-header">
            <img
              v-if="org.logoUrl"
              :src="org.logoUrl"
              alt="Org Logo"
              class="org-logo-small"
            />
            <div v-else class="org-logo-placeholder">
              <span>{{
                org.companyName ? org.companyName.charAt(0).toUpperCase() : "?"
              }}</span>
            </div>
            <h3 class="org-title">{{ org.companyName }}</h3>
            <div
              v-if="org.id === authStore.selectedOrg?.id"
              class="selected-indicator"
              title="Currently Selected"
            ></div>
          </div>
          <div class="org-card-body">
            <div class="org-info">
              <p v-if="org.industry">
                <span class="info-label">Industry:</span> {{ org.industry }}
              </p>
              <p v-if="org.location">
                <span class="info-label">Location:</span> {{ org.location }}
              </p>
              <p v-if="org.companySize">
                <span class="info-label">Size:</span> {{ org.companySize }}
              </p>
            </div>
          </div>
          <div class="org-card-footer">
            <button
              @click.stop="openEditForm(org)"
              class="btn btn-icon-only btn-outline-edit"
              title="Edit Organization"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
                ></path>
              </svg>
            </button>
            <button
              @click.stop="openDeleteConfirmation(org)"
              class="btn btn-icon-only btn-outline-danger"
              title="Delete Organization"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.197-2.328.372A.75.75 0 003 5.25v1.5a.75.75 0 00.75.75H5v7.5A2.75 2.75 0 007.75 18h4.5A2.75 2.75 0 0015 15V7.5h1.25a.75.75 0 00.75-.75v-1.5a.75.75 0 00-.672-.743c-.748-.175-1.533-.295-2.328-.372V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.534.059 2.199.181C12.865 4.334 13.5 4.773 13.5 5.25V6H6.5V5.25c0-.477.635-.916 1.301-.969A18.5 18.5 0 0110 4zM8.5 7.5V15h3V7.5h-3z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </button>
            <RouterLink
              :to="`/${org.id}/jobs`"
              class="btn btn-outline-view btn-sm"
              @click.stop
            >
              View Jobs
            </RouterLink>
          </div>
        </div>
      </div>

      <div v-if="formActive" class="modal-overlay" @click.self="closeForm">
        <div class="modal-container">
          <div class="modal-header">
            <h2 class="modal-title">
              {{
                isEditMode
                  ? "Edit Organization Details"
                  : isNewUser
                  ? "Create Your First Organization"
                  : "Create New Organization"
              }}
            </h2>
            <button
              @click="closeForm"
              class="btn-close"
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
                />
              </svg>
            </button>
          </div>

          <form @submit.prevent="handleFormSubmit" class="modal-body">
            <fieldset>
              <legend>Basic Information</legend>
              <div class="form-row">
                <div class="form-group">
                  <label for="companyName" class="form-label"
                    >Organization Name *</label
                  >
                  <input
                    id="companyName"
                    type="text"
                    v-model="companyName"
                    placeholder="e.g., Acme Innovations Inc."
                    required
                    :disabled="isSubmitting"
                    class="form-input"
                  />
                </div>
                <div class="form-group">
                  <label for="logoUrl" class="form-label">Logo URL</label>
                  <input
                    id="logoUrl"
                    type="url"
                    v-model="logoUrl"
                    placeholder="https://example.com/logo.png"
                    :disabled="isSubmitting"
                    class="form-input"
                  />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="companySize" class="form-label"
                    >Company Size *</label
                  >
                  <select
                    id="companySize"
                    v-model="companySize"
                    required
                    :disabled="isSubmitting"
                    class="form-select"
                  >
                    <option disabled value="">Select workforce size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501-1000">501-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="industry" class="form-label">Industry</label>
                  <input
                    id="industry"
                    type="text"
                    v-model="industry"
                    placeholder="e.g., Software Development, Healthcare"
                    :disabled="isSubmitting"
                    class="form-input"
                  />
                </div>
              </div>
              <div class="form-group">
                <label for="location" class="form-label"
                  >Headquarters Location</label
                >
                <input
                  id="location"
                  type="text"
                  v-model="location"
                  placeholder="e.g., San Francisco, CA or Remote-first"
                  :disabled="isSubmitting"
                  class="form-input"
                />
              </div>
            </fieldset>

            <fieldset>
              <legend>About the Company</legend>
              <div class="form-group">
                <label for="companyDescription" class="form-label"
                  >Company Description</label
                >
                <textarea
                  id="companyDescription"
                  v-model="companyDescription"
                  placeholder="Share a brief overview of your company, what you do, and your unique position in the market."
                  :disabled="isSubmitting"
                  class="form-textarea"
                  rows="3"
                ></textarea>
              </div>
              <div class="form-group">
                <label for="missionStatement" class="form-label"
                  >Mission Statement</label
                >
                <textarea
                  id="missionStatement"
                  v-model="missionStatement"
                  placeholder="What is your company's core purpose and long-term vision?"
                  :disabled="isSubmitting"
                  class="form-textarea"
                  rows="3"
                ></textarea>
              </div>
            </fieldset>

            <fieldset class="company-values-fieldset">
              <legend>Core Company Values</legend>
              <div
                v-for="(valueItem, index) in companyValues"
                :key="index"
                class="company-value-item"
              >
                <div class="form-row value-fields">
                  <div class="form-group value-name">
                    <label :for="'valueName' + index" class="form-label"
                      >Value {{ index + 1 }} Name</label
                    >
                    <input
                      :id="'valueName' + index"
                      type="text"
                      v-model="valueItem.name"
                      placeholder="e.g., Innovation"
                      :disabled="isSubmitting"
                      class="form-input"
                    />
                  </div>
                  <div class="form-group value-description">
                    <label :for="'valueDescription' + index" class="form-label"
                      >Brief Description</label
                    >
                    <input
                      :id="'valueDescription' + index"
                      type="text"
                      v-model="valueItem.description"
                      placeholder="How this value is embodied"
                      :disabled="isSubmitting"
                      class="form-input"
                    />
                  </div>
                  <div class="form-group value-weight">
                    <label :for="'valueWeight' + index" class="form-label"
                      >Importance (0-100)</label
                    >
                    <input
                      :id="'valueWeight' + index"
                      type="number"
                      min="0"
                      max="100"
                      step="5"
                      v-model.number="valueItem.weight"
                      :disabled="isSubmitting"
                      class="form-input"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  @click="removeCompanyValue(index)"
                  class="btn btn-icon-only btn-remove-value"
                  :disabled="isSubmitting || companyValues.length <= 1"
                  title="Remove Value"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
              </div>
              <button
                type="button"
                @click="addCompanyValue"
                class="btn btn-secondary btn-sm add-value-btn"
                :disabled="isSubmitting"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  class="btn-icon"
                >
                  <path
                    d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"
                  />
                </svg>
                Add Another Value
              </button>
            </fieldset>

            <div class="form-actions">
              <button
                type="button"
                @click="closeForm"
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
                <span v-if="isSubmitting">
                  <span class="spinner-sm"></span>
                  {{ isEditMode ? "Saving Changes..." : "Creating Org..." }}
                </span>
                <span v-else>
                  {{ isEditMode ? "Save Changes" : "Create Organization" }}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <div
        v-if="showDeleteConfirmation"
        class="modal-overlay"
        @click.self="closeDeleteConfirmation"
      >
        <div class="modal-container modal-sm">
          <div class="modal-header">
            <h3 class="modal-title">Confirm Deletion</h3>
            <button
              @click="closeDeleteConfirmation"
              class="btn-close"
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
                />
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="alert alert-warning deletion-warning">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                class="alert-icon"
              >
                <path
                  fill-rule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                  clip-rule="evenodd"
                />
              </svg>
              <div>
                <p class="confirm-text">
                  Are you sure you want to delete the organization:
                  <strong class="highlight">{{
                    getOrgForDeletion()?.companyName
                  }}</strong
                  >?
                </p>
                <p class="warning-text">
                  This action cannot be undone and will permanently delete all
                  associated jobs and data.
                </p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              @click="closeDeleteConfirmation"
              class="btn btn-secondary"
              :disabled="isSubmitting"
            >
              Cancel
            </button>
            <button
              @click="deleteOrg"
              class="btn btn-danger"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting"
                ><span class="spinner-sm"></span> Deleting...</span
              >
              <span v-else>Yes, Delete Organization</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </SideBarLayout>
</template>

<style scoped>
/* General Dashboard Styles (keeping some from before, enhancing others) */
.dashboard-container {
  max-width: 1200px;
  margin: 20px auto;
  padding: 20px;
  font-family: "Inter", sans-serif; /* A nice sans-serif font */
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}
.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a202c;
}

.alerts-container {
  margin-bottom: 20px;
}
.alert {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 15px;
  font-size: 14px;
  border-width: 1px;
  border-style: solid;
}
.alert-icon {
  width: 20px;
  height: 20px;
  margin-right: 10px;
}
.alert-danger {
  background-color: #fff5f5;
  border-color: #f56565;
  color: #c53030;
} /* Updated from alert-error */
.alert-success {
  background-color: #f0fff4;
  border-color: #38a169;
  color: #2f855a;
}
.alert-warning {
  background-color: #fffaf0;
  border-color: #ed8936;
  color: #dd6b20;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 250px;
}
.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-radius: 50%;
  border-top-color: #4a90e2;
  animation: spin 1s linear infinite;
}
.spinner-sm {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  margin-right: 8px;
  vertical-align: middle;
}

/* Welcome Section */
.welcome-container {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 40px;
  text-align: center;
  margin: 30px auto;
  max-width: 600px;
}
.welcome-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 20px;
  color: #4a90e2;
}
.icon {
  width: 100%;
  height: 100%;
} /* Removed fixed stroke, fill etc. as it's in SVG path */
.welcome-title {
  font-size: 26px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 12px;
}
.welcome-text {
  color: #4a5568;
  margin-bottom: 24px;
  font-size: 16px;
  line-height: 1.6;
}

/* Organization Grid & Cards */
.org-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}
.org-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.25s ease-in-out;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  position: relative;
}
.org-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}
.org-card.is-selected {
  border-color: #4a90e2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.3);
}
.selected-indicator {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 12px;
  height: 12px;
  background-color: #4a90e2;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 0 0 2px #4a90e2;
}

.org-card-header {
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 12px;
}
.org-logo-small {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #e2e8f0;
}
.org-logo-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: #edf2f7;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  color: #4a5568;
}
.org-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  line-height: 1.3;
}

.org-card-body {
  padding: 16px;
  flex-grow: 1;
}
.org-info p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #4a5568;
}
.info-label {
  font-weight: 500;
  color: #718096;
}

.details-section {
  background-color: #f7fafc;
  padding: 12px;
  border-radius: 8px;
  margin-top: 16px;
}
.details-section h4 {
  font-size: 13px;
  font-weight: 600;
  color: #2b6cb0;
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.details-section p {
  font-size: 13px;
  color: #4a5568;
  margin: 0 0 4px 0;
}

.org-card-footer {
  padding: 12px 16px;
  border-top: 1px solid #e2e8f0;
  background-color: #fdfdfe;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}

/* Button Styles */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 18px;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  text-decoration: none;
  line-height: 1.2;
}
.btn-icon {
  width: 18px;
  height: 18px;
  margin-right: 6px;
}
.btn-primary {
  background-color: #4a90e2;
  color: white;
  border-color: #4a90e2;
}
.btn-primary:hover {
  background-color: #357abd;
  border-color: #357abd;
}
.btn-primary:disabled {
  background-color: #a0aec0;
  border-color: #a0aec0;
  color: #e2e8f0;
  cursor: not-allowed;
}
.btn-primary:disabled .spinner-sm {
  border-left-color: #e2e8f0;
  border-bottom-color: #e2e8f0;
  border-top-color: #e2e8f0;
}

.btn-secondary {
  background-color: #e2e8f0;
  color: #4a5568;
  border-color: #e2e8f0;
}
.btn-secondary:hover {
  background-color: #cbd5e0;
  border-color: #cbd5e0;
}
.btn-danger {
  background-color: #e53e3e;
  color: white;
  border-color: #e53e3e;
}
.btn-danger:hover {
  background-color: #c53030;
  border-color: #c53030;
}

.btn-outline-view {
  color: #38a169;
  border-color: #38a169;
  background-color: transparent;
}
.btn-outline-view:hover {
  background-color: #f0fff4;
  color: #2f855a;
}
.btn-outline-edit {
  color: #dd6b20;
  border-color: #dd6b20;
  background-color: transparent;
}
.btn-outline-edit:hover {
  background-color: #fffaf0;
  color: #c05621;
}
.btn-outline-danger {
  color: #e53e3e;
  border-color: #e53e3e;
  background-color: transparent;
}
.btn-outline-danger:hover {
  background-color: #fff5f5;
  color: #c53030;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}
.btn-icon-only {
  padding: 8px;
} /* For edit, delete buttons on card */
.btn-icon-only svg {
  width: 18px;
  height: 18px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(10, 10, 20, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(3px);
}
.modal-container {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 760px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}
.modal-sm {
  max-width: 540px;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}
.btn-close {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #718096;
}
.btn-close:hover {
  color: #2d3748;
}
.btn-close svg {
  width: 20px;
  height: 20px;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex-grow: 1;
}
.modal-footer {
  padding: 16px 24px;
  background-color: #f7fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

/* Form Element Styling */
fieldset {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
}
fieldset legend {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  padding: 0 10px;
  margin-left: 0px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}
.form-row:last-child {
  margin-bottom: 0;
} /* Remove margin from last row in a group */
.form-group {
  display: flex;
  flex-direction: column;
} /* No margin-bottom here, handled by form-row gap or fieldset */

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 6px;
}
.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 14px;
  color: #2d3748;
  background-color: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
}
.form-input::placeholder,
.form-textarea::placeholder {
  color: #a0aec0;
}
.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: #4a90e2;
  outline: none;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.2);
}
.form-input:disabled,
.form-select:disabled,
.form-textarea:disabled {
  background-color: #edf2f7;
  color: #a0aec0;
  cursor: not-allowed;
}
.form-textarea {
  min-height: 80px;
  resize: vertical;
}

/* Company Values Specific Styling */
.company-values-fieldset {
  position: relative;
}
.company-value-item {
  display: flex; /* Use flex to align fields and button */
  align-items: flex-end; /* Align items to the bottom (label makes input top-align) */
  gap: 16px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin-bottom: 16px;
  background-color: #fdfdfe;
  position: relative; /* For absolute positioning of remove button if needed */
}
.company-value-item .value-fields {
  flex-grow: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 0;
}
.company-value-item .form-group {
  margin-bottom: 0;
} /* Remove bottom margin for groups inside item */

.btn-remove-value {
  background-color: transparent;
  border: 1px solid #e53e3e;
  color: #e53e3e;
  padding: 8px; /* Make it square-ish */
  height: 40px; /* Match input height */
  width: 40px;
  min-width: 40px;
  margin-bottom: 0; /* Align with input boxes */
}
.btn-remove-value svg {
  width: 18px;
  height: 18px;
}
.btn-remove-value:hover {
  background-color: #fff5f5;
}
.btn-remove-value:disabled {
  border-color: #cbd5e0;
  color: #a0aec0;
  background-color: #edf2f7;
}

.add-value-btn {
  margin-top: 0px; /* Adjust if needed after fieldset padding */
}
.add-value-btn .btn-icon {
  width: 16px;
  height: 16px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px; /* Ensure it's outside any fieldset */
}

/* Deletion Confirmation Modal Specifics */
.deletion-warning {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.deletion-warning .alert-icon {
  margin-top: 2px;
}
.confirm-text {
  font-size: 15px;
  color: #2d3748;
  margin-bottom: 6px;
}
.confirm-text .highlight {
  color: #c53030;
  font-weight: 600;
}
.warning-text {
  font-size: 13px;
  color: #4a5568;
  line-height: 1.5;
  margin: 0;
}

/* Media Queries */
@media (max-width: 768px) {
  .org-grid {
    grid-template-columns: 1fr;
  }
  .form-row {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 12px;
  }
  .modal-container {
    max-width: 95%;
    margin: 20px;
  }
  .modal-body {
    padding: 16px;
  }
  .modal-header,
  .modal-footer {
    padding: 16px;
  }
  fieldset {
    padding: 16px;
  }
  .company-value-item {
    flex-direction: column;
    align-items: stretch;
  }
  .company-value-item .value-fields {
    grid-template-columns: 1fr;
  } /* Stack fields in value item */
  .btn-remove-value {
    margin-top: 8px;
    width: 100%;
  }
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
