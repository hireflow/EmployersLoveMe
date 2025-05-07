import { defineStore } from "pinia";
import { ref } from "vue";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/firebase.config";



export const useCandidateAuthStore = defineStore("candidate-auth", () => {
  const functions = getFunctions(app);
  const candidate = ref(null);
  const loading = ref(false);
  const error = ref(null);


  // const applications = ... fetch applications for this candidate when candidate is not null
  // 
  const checkIfCandidateExists = async (emailToCheck) => {
    loading.value = true;
    error.value = null;
    try {
      const checkCandidateEmailExists = httpsCallable(functions, "checkCandidateEmailExists");
      const result = await checkCandidateEmailExists({ email: emailToCheck });
      return {
        exists: result.data.exists,
        claimedId: result.data.candidateId
      };
    } catch (err) {
      error.value = err.message || "Error checking email existence.";
      throw error.value;
    } finally {
      loading.value = false;
    }
  };

  const register = async (candidateEmail, candidatePassword, resumeUrl, name, phone) => {
    loading.value = true;
    error.value = null;
    try {
      const registerCandidate = httpsCallable(functions, "registerCandidate");
      const result = await registerCandidate({
        email: candidateEmail,
        password: candidatePassword,
        resumeUrl,
        name,
        phone,
      });
      candidate.value = result.data.candidate; 
    } catch (err) {
      error.value = err.message || "Could not register candidate.";
      throw error.value;
    } finally {
      loading.value = false;
    }
  };

  const login = async (candidateEmail, candidatePassword, claimedId) => {
    loading.value = true;
    error.value = null;
    try {
      const signInCandidate = httpsCallable(functions, "signInCandidate");
      const result = await signInCandidate({
        claimedId,
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
