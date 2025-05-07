import { defineStore } from "pinia";
import { ref, watch } from "vue"; // Added watch
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/firebase.config";
import { useRouter } from "vue-router";

const router = useRouter();

const CANDIDATE_STORAGE_KEY = "hireflow_candidate_auth";

export const useCandidateAuthStore = defineStore("candidate-auth", () => {
  const functions = getFunctions(app);
  const candidate = ref(null);
  const loading = ref(false); // For general async operations
  const initLoading = ref(true); // Specifically for initial load from localStorage
  const error = ref(null);

  /**
   * Tries to load candidate data from localStorage on store initialization.
   */
  const initialize = () => {
    initLoading.value = true;
    try {
      const storedCandidate = localStorage.getItem(CANDIDATE_STORAGE_KEY);
      if (storedCandidate) {
        const parsedCandidate = JSON.parse(storedCandidate);
        // Basic validation: check for essential fields like id and email
        if (parsedCandidate && parsedCandidate.id && parsedCandidate.email) {
          candidate.value = parsedCandidate;
          console.log("Candidate loaded from localStorage:", candidate.value);
        } else {
          console.warn("Stored candidate data is invalid. Clearing.");
          localStorage.removeItem(CANDIDATE_STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error("Error loading candidate from localStorage:", e);
      // If parsing fails or any other error, ensure localStorage is cleared
      localStorage.removeItem(CANDIDATE_STORAGE_KEY);
    } finally {
      initLoading.value = false;
    }
  };

  initialize();

  // Watch for changes in the candidate state and update localStorage
  watch(
    candidate,
    (newCandidateValue) => {
      if (newCandidateValue) {
        // Store candidate data (ensure no sensitive info like password if it were ever present)
        localStorage.setItem(
          CANDIDATE_STORAGE_KEY,
          JSON.stringify(newCandidateValue)
        );
        console.log("Candidate data saved to localStorage.");
      } else {
        // Clear from localStorage if candidate becomes null (e.g., on logout)
        localStorage.removeItem(CANDIDATE_STORAGE_KEY);
        console.log("Candidate data removed from localStorage.");
      }
    },
    { deep: true } // Use deep watch if candidate object might have nested changes
  );

  const checkIfCandidateExists = async (emailToCheck) => {
    loading.value = true;
    error.value = null;
    try {
      const checkCandidateEmailExistsCallable = httpsCallable(
        functions,
        "checkCandidateEmailExists"
      );
      const result = await checkCandidateEmailExistsCallable({
        email: emailToCheck,
      });
      return {
        exists: result.data.exists,
        claimedId: result.data.candidateId, // Ensure your backend returns this
      };
    } catch (err) {
      console.error("Error in checkIfCandidateExists:", err);
      error.value = err.message || "Error checking email existence.";
      throw error.value; // Re-throw to be caught by calling component
    } finally {
      loading.value = false;
    }
  };

  const register = async (
    candidateEmail,
    candidatePassword,
    name,
    phone,
    resumeUrl = ""
  ) => {
    // Added resumeUrl with a default value
    loading.value = true;
    error.value = null;
    try {
      const registerCandidateCallable = httpsCallable(
        functions,
        "registerCandidate"
      );
      const result = await registerCandidateCallable({
        email: candidateEmail,
        password: candidatePassword,
        name,
        phone,
        resumeUrl, // Pass resumeUrl to the backend
      });

      if (result.data.success && result.data.candidate) {
        candidate.value = result.data.candidate; // This will trigger the watcher to save to localStorage
      } else {
        throw new Error(
          result.data.message || "Registration failed to return candidate data."
        );
      }
      return result.data; // Return the full response
    } catch (err) {
      console.error("Error in register:", err);
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
      const signInCandidateCallable = httpsCallable(
        functions,
        "signInCandidate"
      );
      const result = await signInCandidateCallable({
        claimedId,
        email: candidateEmail,
        password: candidatePassword,
      });

      if (result.data.success && result.data.candidate) {
        candidate.value = result.data.candidate; // This will trigger the watcher to save to localStorage
      } else {
        throw new Error(
          result.data.message || "Login failed to return candidate data."
        );
      }
      return result.data; // Return the full response
    } catch (err) {
      console.error("Error in login:", err);
      error.value = err.message || "Could not log in.";
      throw error.value;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    // No async operation here unless you add one (e.g., call a backend endpoint)
    candidate.value = null; // This will trigger the watcher to remove from localStorage
    console.log(
      "Candidate logged out and data cleared from store/localStorage."
    );

    router.push({
      name: "CandidateLogin",
    });
  };

  return {
    candidate,
    loading,
    initLoading, // Expose initLoading if components need to wait for initial load
    error,
    register,
    login,
    logout,
    checkIfCandidateExists,
    initialize, // Expose initialize if you need to call it manually elsewhere (though it runs on store creation)
  };
});
