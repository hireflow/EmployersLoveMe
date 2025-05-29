<script setup>
import { ref, computed } from "vue"; // Added computed
import { useRouter, useRoute } from "vue-router";
import { useCandidateAuthStore } from "@/stores/candidate";

const route = useRoute();
const router = useRouter();
const candidateAuthStore = useCandidateAuthStore();

const emailForCheckOrLogin = ref("");
const passwordForLogin = ref("");

const nameForSignup = ref("");
const emailForSignup = ref("");
const phoneForSignup = ref("");
const passwordForSignup = ref("");

const isRightPanelActive = ref(false);
const showPasswordInputInSignInPanel = ref(false);

const emailCheckError = ref("");
const loginError = ref("");
const registrationError = ref("");

const isCheckingEmail = ref(false);
const isLoggingIn = ref(false);
const isRegistering = ref(false);

const handleEmailCheck = async () => {
  if (!emailForCheckOrLogin.value) {
    emailCheckError.value = "Please enter your email address.";
    return;
  }
  isCheckingEmail.value = true;
  emailCheckError.value = "";
  loginError.value = "";
  showPasswordInputInSignInPanel.value = false;

  try {
    const result = await candidateAuthStore.checkIfCandidateExists(
      emailForCheckOrLogin.value
    );
    if (result.exists) {
      isRightPanelActive.value = false;
      showPasswordInputInSignInPanel.value = true;
      passwordForLogin.value = "";
    } else {
      emailForSignup.value = emailForCheckOrLogin.value;
      nameForSignup.value = "";
      passwordForSignup.value = "";
      phoneForSignup.value = "";
      isRightPanelActive.value = true;
      showPasswordInputInSignInPanel.value = false;
    }
  } catch (err) {
    emailCheckError.value = err.message || "Error checking email.";
  } finally {
    isCheckingEmail.value = false;
  }
};

const handleRegistrationFlow = async () => {
  registrationError.value = "";
  if (
    !emailForSignup.value ||
    !passwordForSignup.value ||
    !nameForSignup.value ||
    !phoneForSignup.value
  ) {
    registrationError.value = "Please fill in all fields.";
    return;
  }
  isRegistering.value = true;
  try {
    await candidateAuthStore.register(
      emailForSignup.value,
      passwordForSignup.value,
      nameForSignup.value,
      phoneForSignup.value
    );

    if (candidateAuthStore.isAuthenticated) {
      redirectToApplicationDetailsOrDashboard();
    } else {
      registrationError.value = "Registration successful! Please sign in.";
      isRightPanelActive.value = false;
      showPasswordInputInSignInPanel.value = true;
      emailForCheckOrLogin.value = emailForSignup.value;
      passwordForLogin.value = "";

      nameForSignup.value = "";
      phoneForSignup.value = "";
      passwordForSignup.value = "";
    }
  } catch (error) {
    registrationError.value = error.message || "Registration failed.";
  } finally {
    isRegistering.value = false;
  }
};

const handleLoginFlow = async () => {
  loginError.value = "";
  if (!emailForCheckOrLogin.value || !passwordForLogin.value) {
    loginError.value = "Please enter your email and password.";
    return;
  }
  isLoggingIn.value = true;
  try {
    await candidateAuthStore.login(
      emailForCheckOrLogin.value,
      passwordForLogin.value
    );
    if (candidateAuthStore.candidate) {
      redirectToApplicationDetailsOrDashboard();
    } else {
      loginError.value = "Login failed. Please check credentials.";
    }
  } catch (error) {
    loginError.value = error.message || "Login failed.";
  } finally {
    isLoggingIn.value = false;
  }
};

const redirectToApplicationDetailsOrDashboard = () => {
  const orgId = route.query.orgId;
  const jobId = route.query.jobId;

  console.log("orgId:", orgId);
  console.log("jobId:", jobId);

  if (orgId && jobId) {
    console.log(candidateAuthStore.candidate);
    console.log(candidateAuthStore?.candidateProfile);
    console.log(candidateAuthStore.isAuthenticated);
    router.push({ name: "ApplicationDetails", params: { orgId, jobId } });
  } else {
    router.push(
      candidateAuthStore.candidate?.dashboardUrl || "/candidate-dashboard"
    );
  }
};

const togglePanel = () => {
  isRightPanelActive.value = !isRightPanelActive.value;
  emailCheckError.value = "";
  loginError.value = "";
  registrationError.value = "";
  showPasswordInputInSignInPanel.value = false;

  if (isRightPanelActive.value) {
    if (emailForCheckOrLogin.value && !emailForSignup.value) {
      emailForSignup.value = emailForCheckOrLogin.value;
    }
    passwordForLogin.value = "";
  } else {
    if (emailForSignup.value && !emailForCheckOrLogin.value) {
      emailForCheckOrLogin.value = emailForSignup.value;
    }
    nameForSignup.value = "";
    phoneForSignup.value = "";
    passwordForSignup.value = "";
  }
};

const signInButtonText = computed(() => {
  if (isCheckingEmail.value) return "Checking...";
  if (isLoggingIn.value) return "Logging In...";
  if (showPasswordInputInSignInPanel.value) return "Sign In";
  return "Continue";
});

const handleSignInPanelAction = () => {
  if (showPasswordInputInSignInPanel.value) {
    handleLoginFlow();
  } else {
    handleEmailCheck();
  }
};
</script>

<template>
  <div class="body-container">
    <div class="brand">
      <h1 class="brand-name">Candidate Portal</h1>
      <h2 class="brand-tagline">Your Application Journey Starts Here</h2>
    </div>
    <div
      class="container"
      id="container"
      :class="{ 'right-panel-active': isRightPanelActive }"
    >
      <div class="form-container sign-up-container">
        <form @submit.prevent="handleRegistrationFlow">
          <h1>Create Account</h1>
          <div v-if="registrationError" class="error">
            {{ registrationError }}
          </div>
          <span>Please provide your details</span>
          <input
            v-model="nameForSignup"
            type="text"
            placeholder="Full Name"
            required
          />
          <input
            v-model="emailForSignup"
            type="email"
            placeholder="Email"
            required
          />
          <input
            v-model="phoneForSignup"
            type="tel"
            placeholder="Phone Number"
            required
          />
          <input
            v-model="passwordForSignup"
            type="password"
            placeholder="Password"
            required
          />
          <button
            type="submit"
            :disabled="isRegistering || candidateAuthStore.loading"
          >
            {{
              isRegistering || candidateAuthStore.loading
                ? "Signing Up..."
                : "Sign Up"
            }}
          </button>
        </form>
      </div>

      <div class="form-container sign-in-container">
        <form @submit.prevent="handleSignInPanelAction">
          <h1>Sign In</h1>
          <div v-if="emailCheckError" class="error">{{ emailCheckError }}</div>
          <div v-if="loginError" class="error">{{ loginError }}</div>
          <span>{{
            showPasswordInputInSignInPanel
              ? "Enter your password to sign in"
              : "Enter your email to continue"
          }}</span>
          <input
            v-model="emailForCheckOrLogin"
            type="email"
            placeholder="Email"
            required
            :disabled="
              showPasswordInputInSignInPanel || isCheckingEmail || isLoggingIn
            "
          />
          <input
            v-if="showPasswordInputInSignInPanel"
            v-model="passwordForLogin"
            type="password"
            placeholder="Password"
            required
          />
          <button
            type="submit"
            class="signin-button"
            :disabled="
              isCheckingEmail || isLoggingIn || candidateAuthStore.loading
            "
          >
            {{ signInButtonText }}
          </button>
        </form>
      </div>

      <div class="overlay-container">
        <div class="overlay">
          <div class="overlay-panel overlay-left">
            <h1>Welcome Back!</h1>
            <p>
              Already have an account? Sign in to continue your application.
            </p>
            <button
              class="ghost"
              @click="togglePanel"
              :disabled="isCheckingEmail || isLoggingIn"
            >
              Sign In
            </button>
          </div>
          <div class="overlay-panel overlay-right">
            <h1>New Here?</h1>
            <p>Enter your email and we'll get you started with an account.</p>
            <button
              class="ghost"
              @click="togglePanel"
              :disabled="isRegistering"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css?family=Montserrat:400,600,700|Poppins:400,500,600,700");

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.body-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  font-family: "Poppins", sans-serif;
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #a7f3d0 0%, #e6fffa 70%, #ffffff 100%);
  background-size: cover;
  background-position: center;
  position: relative;
  padding: 20px;
}

.brand {
  margin-bottom: 2rem;
  text-align: center;
  color: #1e3a2b;
}

.brand-name {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.brand-tagline {
  font-size: 1.1rem;
  font-weight: 400;
  opacity: 0.9;
}

h1 {
  font-weight: 700;
  margin: 0 0 15px;
  font-size: 1.8rem;
  color: #333;
}

p {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  margin: 20px 0 30px;
  color: #f0fff4;
}

span {
  font-size: 12px;
  color: #505050;
  margin-bottom: 10px;
}

a {
  color: #22c55e;
  font-size: 14px;
  text-decoration: none;
  margin: 15px 0;
  transition: color 0.3s ease;
}

a:hover {
  color: #16a34a;
  text-decoration: underline;
}

button {
  border-radius: 50px;
  border: none;
  background-color: #22c55e;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  padding: 12px 45px;
  letter-spacing: 1px;
  text-transform: uppercase;
  transition: all 0.3s ease;
  cursor: pointer;
  box-shadow: 0 5px 15px rgba(34, 197, 94, 0.3);
}
button:disabled {
  background-color: #a7d7c5;
  cursor: not-allowed;
  box-shadow: 0 5px 15px rgba(34, 197, 94, 0.1);
}
button:disabled:hover {
  transform: none;
  background-color: #a7d7c5;
}

button:hover:not(:disabled) {
  background-color: #16a34a;
  box-shadow: 0 8px 20px rgba(34, 197, 94, 0.4);
  transform: translateY(-2px);
}

button:active:not(:disabled) {
  transform: scale(0.95);
}

button:focus {
  outline: none;
}

button.ghost {
  background-color: transparent;
  border: 2px solid #ffffff;
  box-shadow: none;
}
button.ghost:disabled {
  border-color: rgba(255, 255, 255, 0.5);
  color: rgba(255, 255, 255, 0.5);
  background-color: transparent;
}
button.ghost:disabled:hover {
  background-color: transparent;
}

button.ghost:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.1);
}

.signin-button {
  margin-top: 10px;
}

form {
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 0 50px;
  height: 100%;
  text-align: center;
}

input {
  background-color: #f7f7f7;
  border: 1px solid #e0e0e0;
  padding: 15px;
  margin: 10px 0;
  width: 100%;
  border-radius: 50px;
  transition: all 0.3s ease;
  font-family: "Poppins", sans-serif;
  font-size: 14px;
}
input:disabled {
  background-color: #e9e9e9;
  cursor: not-allowed;
  color: #757575;
}

input:focus:not(:disabled) {
  border-color: #22c55e;
  background-color: #ffffff;
  outline: none;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

input::placeholder {
  color: #aaa;
}

.container {
  background-color: #ffffff;
  border-radius: 15px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
  width: 900px;
  max-width: 100%;
  min-height: 580px;
  margin: 0 auto;
}

.form-container {
  position: absolute;
  top: 0;
  height: 100%;
  transition: all 0.6s ease-in-out;
}

.sign-in-container {
  left: 0;
  width: 50%;
  z-index: 2;
}

.container.right-panel-active .sign-in-container {
  transform: translateX(100%);
  opacity: 0;
}

.sign-up-container {
  left: 0;
  width: 50%;
  opacity: 0;
  z-index: 1;
}

.container.right-panel-active .sign-up-container {
  transform: translateX(100%);
  opacity: 1;
  z-index: 5;
  animation: show 0.6s;
}

@keyframes show {
  0%,
  49.99% {
    opacity: 0;
    z-index: 1;
  }

  50%,
  100% {
    opacity: 1;
    z-index: 5;
  }
}

.overlay-container {
  position: absolute;
  top: 0;
  left: 50%;
  width: 50%;
  height: 100%;
  overflow: hidden;
  transition: transform 0.6s ease-in-out;
  z-index: 100;
}

.container.right-panel-active .overlay-container {
  transform: translateX(-100%);
}

.overlay {
  background: #22c55e;
  background: linear-gradient(135deg, #22c55e 0%, #15803d 100%);
  background-repeat: no-repeat;
  background-size: cover;
  background-position: 0 0;
  color: #ffffff;
  position: relative;
  left: -100%;
  height: 100%;
  width: 200%;
  transform: translateX(0);
  transition: transform 0.6s ease-in-out;
}

.container.right-panel-active .overlay {
  transform: translateX(50%);
}

.overlay-panel {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 0 40px;
  text-align: center;
  top: 0;
  height: 100%;
  width: 50%;
  transform: translateX(0);
  transition: transform 0.6s ease-in-out;
}

.overlay-left {
  transform: translateX(-20%);
}

.container.right-panel-active .overlay-left {
  transform: translateX(0);
}

.overlay-right {
  right: 0;
  transform: translateX(0);
}

.container.right-panel-active .overlay-right {
  transform: translateX(20%);
}

.error {
  color: #ef4444;
  margin-bottom: 15px;
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  width: 100%;
  padding: 0 10px;
}

@media (max-width: 768px) {
  .body-container {
    padding: 10px;
    min-height: unset;
  }
  .brand {
    margin-bottom: 1rem;
  }
  .brand-name {
    font-size: 2rem;
  }
  .brand-tagline {
    font-size: 1rem;
  }
  .container {
    min-height: auto;
    width: 95%;
    margin-top: 1rem;
    margin-bottom: 1rem;
  }
  .form-container {
    padding: 0 25px;
    height: auto;
    padding-bottom: 20px;
  }
  h1 {
    font-size: 1.5rem;
    margin-bottom: 10px;
  }
  button {
    padding: 10px 30px;
    font-size: 13px;
  }
  input {
    padding: 12px 15px;
    font-size: 13px;
  }
  .overlay-container {
    display: none;
  }
  .sign-in-container,
  .sign-up-container {
    width: 100%;
    position: relative;
    transform: none !important;
    opacity: 1 !important;
    z-index: auto !important;
  }
  .sign-in-container {
    display: flex; /* Default state for sign-in */
  }
  .sign-up-container {
    display: none; /* Default state for sign-up */
  }
  .container.right-panel-active .sign-in-container {
    display: none;
  }
  .container.right-panel-active .sign-up-container {
    display: flex;
  }
}
</style>
