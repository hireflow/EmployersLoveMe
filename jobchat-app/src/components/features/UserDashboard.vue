<script setup>
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import { getFunctions, httpsCallable } from "firebase/functions";
import { ref } from "vue";
import JobDashboard from "./JobDashboard.vue";

const authStore = useAuthStore();
const router = useRouter();

// Initialize Firebase Functions
const functions = getFunctions();
const formActive = ref(false);
// Create a callable function reference
const createOrg = httpsCallable(functions, "createOrg");
const orgName = ref("");
const errorMessage = ref("");
const successMessage = ref("");

const createdLoginEmail = ref("");
const createdLoginPassword = ref("");
const companySize = ref("");
const industry = ref("");
const location = ref("");
const companyDescription = ref("");
const missionStatement = ref("");
const companyValues = ref("");

const handleCreateOrg = async () => {
  try {
    errorMessage.value = "";
    successMessage.value = "";

    const result = await createOrg({
      name: orgName.value,
      createdById: authStore.user.uid,
      createdByEmail: authStore.user.email,
      createdLoginEmail: createdLoginEmail.value,
      createdLoginPassword: createdLoginPassword.value,
      companySize: companySize.value,
      industry: industry.value,
      location: location.value,
      companyDescription: companyDescription.value,
      missionStatement: missionStatement.value,
      companyValues: companyValues.value,
    });

    // reset the form fields and then toggle the form
    orgName.value = "";
    createdLoginEmail.value = "";
    createdLoginPassword.value = "";
    companySize.value = "";
    industry.value = "";
    location.value = "";
    companyDescription.value = "";
    formActive.value = false;

    successMessage.value = "Organization created successfully!";
    console.log("Organization created:", result.data);

    // Refetch orgs after creation
    await authStore.fetchUserOrgs();
  } catch (error) {
    console.error("Error creating organization:", error);
    if (error.code === "already-exists") {
      errorMessage.value = "An organization with this name already exists.";
    } else {
      errorMessage.value = "Error creating organization. Please try again.";
    }
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
  }
};
</script>

<template>
  <div>
    <p>Welcome, {{ authStore.user?.email }}</p>
    <button @click="toggleForm">Create New</button>

    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
    </div>

    <div v-if="formActive">
      <form @submit.prevent="handleCreateOrg">
        <input
          type="text"
          v-model="orgName"
          placeholder="Organization Name"
          required
        />
        <input
          type="text"
          v-model="createdLoginEmail"
          placeholder="Login Email"
          required
        />
        <input
          type="password"
          v-model="createdLoginPassword"
          placeholder="Login Password"
          required
        />
        <input
          type="text"
          v-model="companySize"
          placeholder="Company Size"
          required
        />
        <input type="text" v-model="industry" placeholder="Industry" required />
        <input type="text" v-model="location" placeholder="Location" required />
        <input
          type="text"
          v-model="companyDescription"
          placeholder="Company Description"
          required
        />
        <input
          type="text"
          v-model="missionStatement"
          placeholder="Mission Statement"
          required
        />
        <input
          type="text"
          v-model="companyValues"
          placeholder="Company Values"
          required
        />

        <button type="submit">Create</button>
      </form>
    </div>

    <div v-if="authStore.orgs.length > 0" class="org-selector">
      <h2>Select Organization</h2>
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
          {{ org.name }}
        </option>
      </select>

      <div v-if="authStore.selectedOrg" class="selected-org">
        <h3>Current Organization</h3>
        <div class="org-details">
          <p><strong>Name:</strong> {{ authStore.selectedOrg.name }}</p>
          <p><strong>Industry:</strong> {{ authStore.selectedOrg.industry }}</p>
          <p><strong>Location:</strong> {{ authStore.selectedOrg.location }}</p>
          <p><strong>Size:</strong> {{ authStore.selectedOrg.companySize }}</p>
        </div>
      </div>
    </div>

    <JobDashboard v-if="authStore.selectedOrg" />

    <button @click="handleLogout">Logout</button>
  </div>
</template>

<style scoped>
.error-message {
  color: red;
  margin: 10px 0;
  padding: 10px;
  background-color: #ffebee;
  border-radius: 4px;
}

.success-message {
  color: green;
  margin: 10px 0;
  padding: 10px;
  background-color: #e8f5e9;
  border-radius: 4px;
}

.org-selector {
  margin: 20px 0;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.org-dropdown {
  width: 100%;
  max-width: 300px;
  padding: 8px;
  margin: 10px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.selected-org {
  margin-top: 20px;
  padding: 15px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.org-details {
  margin-top: 10px;
}

.org-details p {
  margin: 5px 0;
}

input {
  display: block;
  margin: 10px 0;
  padding: 8px;
  width: 100%;
  max-width: 300px;
}

button {
  margin: 10px 0;
  padding: 8px 16px;
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #1565c0;
}
</style>
