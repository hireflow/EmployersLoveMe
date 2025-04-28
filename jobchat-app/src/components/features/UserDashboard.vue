<script setup>
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import { getFunctions, httpsCallable } from "firebase/functions";
import CardComponent from "@/components/ui/CardComponent.vue";
import { ref, onMounted } from "vue";
const authStore = useAuthStore();
const router = useRouter();

// Initialize Firebase Functions
const functions = getFunctions();
const formActive = ref(false);
// Create a callable function reference
const createOrg = httpsCallable(functions, "createOrg");
const fetchUserOrgsByEmail = httpsCallable(functions, "fetchUserOrgsByEmail");
const orgName = ref("");

const createdLoginEmail = ref("");
const createdLoginPassword = ref("");
const companySize = ref("");
const industry = ref("");
const location = ref("");
const companyDescription = ref("");

const userOrgs = ref([]);

const fetchUserOrgs = async () => {
  try {
    const result = await fetchUserOrgsByEmail({
      createdByEmail: authStore.user.email,
    });
    userOrgs.value = result.data.orgs;
  } catch (error) {
    console.error("Error fetching user orgs:", error);
  }
};

onMounted(fetchUserOrgs);
// lol testing

const handleCreateOrg = async () => {
  try {
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
    console.log("Organization created:", result.data);

    // Refetch orgs after creation
    await fetchUserOrgs();
  } catch (error) {
    console.error("Error creating organization:", error);
  }
};

const toggleForm = () => {
  formActive.value = !formActive.value;
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
    <CardComponent message="Welcome to the dashboard" />
    <h1>Dashboard</h1>

    <p>Welcome, {{ authStore.user?.email }}</p>
    <button @click="toggleForm">Create New</button>
    <div v-if="formActive">
      <form @submit.prevent="handleCreateOrg">
        <input type="text" v-model="orgName" placeholder="Organization Name" />
        <input
          type="text"
          v-model="createdLoginEmail"
          placeholder="Login Email"
        />
        <input
          type="password"
          v-model="createdLoginPassword"
          placeholder="Login Password"
        />
        <input type="text" v-model="companySize" placeholder="Company Size" />
        <input type="text" v-model="industry" placeholder="Industry" />
        <input type="text" v-model="location" placeholder="Location" />
        <input
          type="text"
          v-model="companyDescription"
          placeholder="Company Description"
        />

        <button type="submit">Create</button>
      </form>
    </div>

    <div v-if="userOrgs.length > 0">
      <h2>Your Organizations</h2>
      <ul>
        <li v-for="org in userOrgs" :key="org.id">
          {{ org.name }}
        </li>
      </ul>
    </div>
    <button @click="handleLogout">Logout</button>
  </div>
</template>
