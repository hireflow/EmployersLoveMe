import { defineStore } from "pinia";
import { ref } from "vue";

import {
  registerCandidate,
  signInCandidate,
  checkCandidateEmailExists,
} from "@/firebase/functions"; // Adjust the path as needed

export const useAuthStore = defineStore("candidate-auth", () => {
  const candidate = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const checkIfCandidateExists = async (emailToCheck) => {
    loading.value = true;
    error.value = null;
    try {
      const result = await checkCandidateEmailExists({ email: emailToCheck });
      return result.data.exists; //function should return { data: { exists: boolean } }
    } catch (err) {
      error.value = err.message || "Error checking email existence.";
      throw error.value;
    } finally {
      loading.value = false;
    }
  };

  const register = async (candidateEmail, candidatePassword, name, phone) => {
    loading.value = true;
    error.value = null;
    try {
      const result = await registerCandidate({
        email: candidateEmail,
        password: candidatePassword,
        name,
        phone,
      });
      candidate.value = result.data.candidate; // make the return for the cloud functions match this
    } catch (err) {
      error.value = err.message || "Could not register candidate.";
      throw error.value;
    } finally {
      loading.value = false;
    }
  };

  const login = async (candidateEmail, candidatePassword) => {
    loading.value = true;
    error.value = null;
    try {
      const result = await signInCandidate({
        email: candidateEmail,
        password: candidatePassword,
      });
      candidate.value = result.data.candidate; // return this
    } catch (err) {
      error.value = err.message || "Could not log in.";
      throw error.value;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    candidate.value = null;
    console.log("Candidate logged out.");
  };

  return {
    candidate,
    loading,
    error,
    register,
    login,
    logout,
    checkIfCandidateExists,
  };
});
