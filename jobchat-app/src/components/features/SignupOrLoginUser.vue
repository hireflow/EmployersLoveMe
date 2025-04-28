<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();
// fart bnalls
// Form fields
const email = ref("");
const password = ref("");
const name = ref("");
const signupEmail = ref("");
const signupPassword = ref("");
const error = ref("");
const signupError = ref("");
const isRightPanelActive = ref(false);

const handleLogin = async () => {
  try {
    await authStore.login(email.value, password.value);
    email.value = "";
    password.value = "";
    error.value = "";
    router.push("/dashboard");
  } catch (err) {
    error.value = err.message;
  }
};

const handleRegister = async () => {
  try {
    await authStore.register(signupEmail.value, signupPassword.value);
    signupEmail.value = "";
    signupPassword.value = "";
    name.value = "";
    signupError.value = "";
    // Auto-switch to login panel or redirect
    isRightPanelActive.value = false;
    router.push("/dashboard");
  } catch (err) {
    signupError.value = err.message;
  }
};

const togglePanel = () => {
  isRightPanelActive.value = !isRightPanelActive.value;
};
</script>

<template>
  <div class="body-container">
    <div class="brand">
      <h1 class="brand-name">Hireflow</h1>
      <h2 class="brand-tagline">Smarter Hiring Conversations</h2>
    </div>
    <div
      class="container"
      id="container"
      :class="{ 'right-panel-active': isRightPanelActive }"
    >
      <div class="form-container sign-up-container">
        <form @submit.prevent="handleRegister">
          <h1>Create Account</h1>
          <div v-if="signupError" class="error">{{ signupError }}</div>
          <div class="social-container">
            <a href="#" class="social"><i class="fab fa-facebook-f"></i></a>
            <a href="#" class="social"><i class="fab fa-google-plus-g"></i></a>
            <a href="#" class="social"><i class="fab fa-linkedin-in"></i></a>
          </div>
          <span>or use your email for registration</span>
          <input v-model="name" type="text" placeholder="Name" />
          <input
            v-model="signupEmail"
            type="email"
            placeholder="Email"
            required
          />
          <input
            v-model="signupPassword"
            type="password"
            placeholder="Password"
            required
          />
          <button type="submit">Sign Up</button>
        </form>
      </div>
      <div class="form-container sign-in-container">
        <form @submit.prevent="handleLogin">
          <h1>Sign in</h1>
          <div v-if="error" class="error">{{ error }}</div>
          <div class="social-container">
            <a href="#" class="social"><i class="fab fa-facebook-f"></i></a>
            <a href="#" class="social"><i class="fab fa-google-plus-g"></i></a>
            <a href="#" class="social"><i class="fab fa-linkedin-in"></i></a>
          </div>
          <span>or use your account</span>
          <input v-model="email" type="email" placeholder="Email" required />
          <input
            v-model="password"
            type="password"
            placeholder="Password"
            required
          />
          <a href="#" class="forgot-password">Forgot your password?</a>
          <button type="submit" class="signin-button">Sign In</button>
        </form>
      </div>
      <div class="overlay-container">
        <div class="overlay">
          <div class="overlay-panel overlay-left">
            <h1>Welcome Back!</h1>
            <p>
              To keep connected with us please login with your personal info
            </p>
            <button class="ghost" @click="togglePanel">Sign In</button>
          </div>
          <div class="overlay-panel overlay-right">
            <h1>Hello, Friend!</h1>
            <p>
              Enter your personal details and start your hiring journey with us
            </p>
            <button class="ghost" @click="togglePanel">Sign Up</button>
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
  /* New gradient background similar to the screenshot */
  background: linear-gradient(135deg, #7b68ee 0%, #ff6b6b 50%, #ffd23f 100%);
  background-size: cover;
  background-position: center;
  position: relative;
  padding: 20px;
}

.brand {
  margin-bottom: 2rem;
  text-align: center;
  color: #ffffff;
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

h2 {
  text-align: center;
}

p {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  margin: 20px 0 30px;
}

span {
  font-size: 12px;
  color: #505050;
  margin-bottom: 10px;
}

a {
  color: #6852ed;
  font-size: 14px;
  text-decoration: none;
  margin: 15px 0;
  transition: color 0.3s ease;
}

a:hover {
  color: #5842ca;
  text-decoration: underline;
}

button {
  border-radius: 50px;
  border: none;
  background-color: #6852ed;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  padding: 12px 45px;
  letter-spacing: 1px;
  text-transform: uppercase;
  transition: all 0.3s ease;
  cursor: pointer;
  box-shadow: 0 5px 15px rgba(104, 82, 237, 0.3);
}

button:hover {
  background-color: #5842ca;
  box-shadow: 0 8px 20px rgba(104, 82, 237, 0.4);
  transform: translateY(-2px);
}

button:active {
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

button.ghost:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.signin-button {
  margin-top: 10px;
}

.forgot-password {
  margin-top: 15px;
  margin-bottom: 5px;
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
  border: 1px solid #e8e8e8;
  padding: 15px;
  margin: 10px 0;
  width: 100%;
  border-radius: 50px;
  transition: all 0.3s ease;
  font-family: "Poppins", sans-serif;
  font-size: 14px;
}

input:focus {
  border-color: #6852ed;
  background-color: #ffffff;
  outline: none;
  box-shadow: 0 0 0 3px rgba(104, 82, 237, 0.1);
}

input::placeholder {
  color: #aaa;
}

.container {
  background-color: #ffffff;
  border-radius: 15px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
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
  background: #6852ed;
  background: linear-gradient(135deg, #6852ed 0%, #a742df 100%);
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

.social-container {
  margin: 20px 0;
}

.social-container a {
  border: 1px solid #eee;
  border-radius: 50%;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  margin: 0 5px;
  height: 40px;
  width: 40px;
  transition: all 0.3s ease;
  color: #6852ed;
}

.social-container a:hover {
  background-color: #f7f7f7;
  transform: translateY(-2px);
  border-color: #6852ed;
}

.error {
  color: #ff4e6a;
  margin-bottom: 15px;
  font-size: 13px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .container {
    min-height: 650px;
  }

  .overlay-container {
    display: none;
  }

  .sign-in-container,
  .sign-up-container,
  .container.right-panel-active .sign-in-container,
  .container.right-panel-active .sign-up-container {
    left: 0;
    width: 100%;
    transform: translateX(0);
  }

  .sign-up-container {
    opacity: 0;
    z-index: -1;
  }

  .container.right-panel-active .sign-up-container {
    opacity: 1;
    z-index: 5;
  }

  .container.right-panel-active .sign-in-container {
    opacity: 0;
    z-index: -1;
  }
}
</style>
