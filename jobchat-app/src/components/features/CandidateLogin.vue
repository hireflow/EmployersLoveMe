<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useCandidateAuthStore } from "@/stores";

const route = useRoute();
const router = useRouter();
const candidateAuthStore = useCandidateAuthStore();


const email = ref("");
const isExistingCandidateCheck = ref(false);
const existingCandidateError = ref("");
const password = ref("");
const name = ref("");
const phone = ref("");
const loginError = ref("");
const registrationError = ref("");
const isRegistering = ref(true);
const showRegistrationForm = ref(false); // Control visibility of registration fields
const claimedId = ref(null);

const checkExistingCandidate = async () => {
  isExistingCandidateCheck.value = true;
  existingCandidateError.value = "";
  showRegistrationForm.value = false; // Hide registration form initially

  try {
    const result = await candidateAuthStore.checkIfCandidateExists(email.value);
    const exists = result.exists;
    if (exists) {
      isRegistering.value = false; // Show login form
      claimedId.value = result.claimedId;
    } else {
      isRegistering.value = true; // Prepare for registration
      showRegistrationForm.value = true; // Show registration fields
      console.log("here");
    }
  } catch (error) {
    existingCandidateError.value = error.message || "Error checking email.";
  } finally {
    isExistingCandidateCheck.value = false;
  }
};

const handleRegistration = async () => {
  registrationError.value = "";
  if (!email.value || !password.value || !name.value || !phone.value) {
    registrationError.value = "Please fill in all fields.";
    return;
  }

  try {
    await candidateAuthStore.register(
      email.value,
      password.value,
      name.value,
      phone.value
    );

    if (candidateAuthStore.candidate) {
      redirectToApplicationDetailsOrDashboard();
    } else {
      registrationError.value =
        "Registration successful, but unable to log you in automatically. Please log in with your email and password.";
      isRegistering.value = false;
      showRegistrationForm.value = false;
    }
  } catch (error) {
    registrationError.value = error.message || "Registration failed.";
  }
};

const handleLogin = async () => {
  loginError.value = "";
  if (!email.value || !password.value) {
    loginError.value = "Please enter your email and password.";
    return;
  }

  try {
    await candidateAuthStore.login(email.value, password.value, claimedId.value);
    if (candidateAuthStore.candidate) {
      claimedId.value = null;
      redirectToApplicationDetailsOrDashboard();
    } else {
      claimedId.value = null;
      loginError.value = "Login failed.";
    }
  } catch (error) {
    loginError.value = error.message || "Login failed.";
  }
};

const redirectToApplicationDetailsOrDashboard = () => {
  const orgId = route.query.orgId;
  const jobId = route.query.jobId;
  if (orgId && jobId) {
    router.push({ name: "ApplicationDetails", params: { orgId, jobId } });
  } else {
    router.push(""); // we can fallback to the applicant dashboard page in the future TO-DO
  }
};
</script>

<template>
  <div>
    <h1>Candidate Login / Registration</h1>

    <div v-if="isRegistering && !showRegistrationForm">
      <input type="email" v-model="email" placeholder="Enter your email" />
      <button
        @click="checkExistingCandidate"
        :disabled="isExistingCandidateCheck || candidateAuthStore.loading"
      >
        {{ isExistingCandidateCheck ? "Checking..." : "Continue" }}
      </button>
      <p v-if="existingCandidateError">{{ existingCandidateError }}</p>
    </div>

    <div v-if="isRegistering && showRegistrationForm">
      <h2>Register New Account</h2>
      <input type="email" v-model="email" placeholder="Email" disabled />
      <input type="password" v-model="password" placeholder="Password" />
      <input type="text" v-model="name" placeholder="Full Name" />
      <input type="tel" v-model="phone" placeholder="Phone Number" />
      <button @click="handleRegistration" :disabled="candidateAuthStore.loading">
        {{ candidateAuthStore.loading ? "Registering..." : "Register" }}
      </button>
      <p v-if="registrationError">{{ registrationError }}</p>
      <button
        @click="
          isRegistering = false;
          showRegistrationForm = false;
        "
      >
        Go back to login
      </button>
    </div>

    <div v-if="!isRegistering && !showRegistrationForm">
      <h2>Login</h2>
      <input type="email" v-model="email" placeholder="Email" />
      <input type="password" v-model="password" placeholder="Password" />
      <button @click="handleLogin" :disabled="candidateAuthStore.loading">
        {{ candidateAuthStore.loading ? "Logging in..." : "Login" }}
      </button>
      <p v-if="loginError">{{ loginError }}</p>
      <button @click="isRegistering = false">
        Don't have an account? Register
      </button>
    </div>
  </div>
</template>
