import { defineStore } from "pinia";
import { ref, computed } from "vue"; // Added computed
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword, // Added
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth"; // Added Firebase Auth functions
import { getFunctions, httpsCallable } from "firebase/functions";
import { app, auth } from "@/firebase.config"; // Ensure 'auth' is exported from firebase.config
import { useRouter } from "vue-router";

export const useCandidateAuthStore = defineStore("candidate-auth", () => {
  const functions = getFunctions(app);
  const router = useRouter();

  const candidate = ref(null); // This will store the Firebase User object
  const candidateProfile = ref(null); // For additional profile data (name, phone, resume, application IDs)
  const loading = ref(true); // Combined loading state, true initially for initialize
  const error = ref(null);

  const applicationsList = ref([]);
  const isLoadingApplications = ref(false);
  const applicationsError = ref(null);

  const checkCandidateEmailExistsCallable = httpsCallable(
    functions,
    "checkCandidateEmailExists"
  );
  // Callable to create/update candidate profile data in your DB (e.g., Firestore)
  const setCandidateProfileCallable = httpsCallable( 
    functions,
    "setCandidateProfile" // Example name: creates or updates profile
  );
  // Callable to fetch candidate profile data
  const getCandidateProfileCallable = httpsCallable(
    functions,
    "getCandidateProfile" // Example name
  );

  const findApplicationsCallable = httpsCallable(
    functions,
    "findOneOrManyApplicationsById"
  );
  const getJobDetailsCallable = httpsCallable(functions, "getPublicJobDetails");
  const getOrgDetailsCallable = httpsCallable(functions, "getPublicOrgDetails");

  // --- Computed Properties ---
  const isAuthenticated = computed(() => !!candidate.value && !!candidateProfile.value);

  const currentCandidate = computed(() => {
    if (candidate.value && candidateProfile.value) {
      return {
        uid: candidate.value.uid,
        email: candidate.value.email,
        emailVerified: candidate.value.emailVerified,
        ...candidateProfile.value, // Spread additional profile details
      };
    }
    return null;
  });

  // --- Internal Helper Functions ---
  const resetState = () => {
    candidate.value = null;
    candidateProfile.value = null;
    applicationsList.value = [];
    applicationsError.value = null;
    isLoadingApplications.value = false;
    error.value = null;
  };

  const clearError = () => {
    error.value = null;
  };

  const initialize = async () => {
    loading.value = true; // Explicitly set loading at the start of initialization
    error.value = null;
    try {
      await setPersistence(auth, browserLocalPersistence);
      return new Promise((resolve, reject) => { // Added reject for error handling
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          loading.value = true;
          if (firebaseUser) {
            candidate.value = firebaseUser;
            if (isAuthenticated.value && candidateProfile.value?.applications?.length) {
                await fetchMyApplications();
            } else if (!candidateProfile.value) {
                console.warn(`User ${firebaseUser.uid} authenticated with Firebase, but no candidate profile found.`);
            }
          } else {
            resetState();
          }
          loading.value = false; // Processing of this auth state change is complete
          resolve(unsubscribe);
        }, (authError) => { // Add Firebase's own error callback for onAuthStateChanged
            console.error("Error in onAuthStateChanged listener:", authError);
            error.value = authError.message || "Auth state listener error.";
            resetState();
            loading.value = false;
            reject(authError);
        });
      });
    } catch (err) {
      console.error("Error initializing candidate auth:", err);
      error.value = err.message || "Initialization failed.";
      resetState();
      loading.value = false;
      throw err; // Re-throw to indicate critical failure if needed
    }
  };

  const fetchCandidateProfile = async (uid) => {
    if (!uid) return;
    try {
      const result = await getCandidateProfileCallable({uid});
      if (result.data.success && result.data.candidate) {
        candidateProfile.value = result.data.candidate;
      } else {
        console.warn(
          "Could not fetch candidate profile or profile does not exist:",
          result.data.message
        );
        candidateProfile.value = null; // Or initialize with empty structure
      }
    } catch (err) {
      console.error("Error fetching candidate profile:", err);
      candidateProfile.value = null;
    } 
  };

  const register = async (email, password, name, phone, resumeUrl = "") => {
    loading.value = true;
    error.value = null;
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      await setCandidateProfileCallable({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name,
        phone,
        resumeUrl,
        applications: [], // Initialize with empty applications
      });
      await fetchCandidateProfile(firebaseUser.uid);
      // The function resolves successfully if Firebase user is created and profile creation is initiated.
      return { success: true, uid: firebaseUser.uid };
    } catch (err) {
      console.error("Error in candidate register:", err);
      // Handle specific Firebase errors (e.g., email-already-in-use)
      error.value = err.code || err.message || "Could not register candidate.";
      throw err; // Re-throw for the component to handle
    } finally {
      loading.value = false;
    }
  };

  const login = async (email, password) => {
    loading.value = true;
    error.value = null;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      await new Promise(r => setTimeout(r, 50)); // Small delay for state propagation
      await fetchCandidateProfile(candidate.value.uid);
      if (!isAuthenticated.value) {
        error.value = "Login failed: This account is not registered as a candidate or the profile is missing.";
        await signOut(auth);
        throw new Error(error.value);
      }

    } catch (err) {
      console.error("Error in candidate login:", err);
      error.value = err.code || err.message || "Could not log in.";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    loading.value = true;
    error.value = null;
    try {
      await signOut(auth);
      router.push({ name: "CandidateLogin" }); // Ensure this route exists
    } catch (err) {
      console.error("Error logging out candidate:", err);
      error.value = err.message || "Logout failed.";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const checkIfCandidateExists = async (emailToCheck) => {
    loading.value = true;
    error.value = null;
    try {
      // This callable likely checks your custom candidate profiles collection, not Firebase Auth directly
      const result = await checkCandidateEmailExistsCallable({
        email: emailToCheck,
      });
      return {
        exists: result.data.exists,
        claimedId: result.data.candidateId, // This might be the UID if it exists
      };
    } catch (err) {
      console.error("Error in checkIfCandidateExists:", err);
      error.value = err.message || "Error checking email existence.";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchMyApplications = async () => {
    if (!isAuthenticated.value || !candidateProfile.value?.applications?.length) {
      applicationsList.value = [];
      if (!isAuthenticated.value && router.currentRoute.value.meta.requiresAuth) {
          console.log("User not authenticated as candidate or no applications to fetch.");
      }
      return;
    }

    isLoadingApplications.value = true;
    applicationsError.value = null;

    try {
      const appResult = await findApplicationsCallable({
        applicationIds: candidateProfile.value.applications,
      });

      if (!appResult.data.success) {
        throw new Error(
          appResult.data.message || "Failed to fetch application documents"
        );
      }
      const rawApplications = appResult.data.applications || [];


      if (rawApplications.length === 0) {
        applicationsList.value = [];
        isLoadingApplications.value = false;
        return;
      }

      // ... (rest of the fetching and mapping logic for job/org details remains the same)
      const jobIds = [...new Set(rawApplications.map((app) => app.jobID).filter(Boolean))];
      const orgIds = [...new Set(rawApplications.map((app) => app.orgID).filter(Boolean))];

      const jobDetailsPromises = jobIds.map(jobId =>
        getJobDetailsCallable({ jobId }).catch(e => {
          console.warn(`Failed to fetch job details for ${jobId}:`, e);
          return { data: { success: false, job: { id: jobId, jobTitle: "Details Unavailable" }}};
        })
      );
      const orgDetailsPromises = orgIds.map(orgId =>
        getOrgDetailsCallable({ orgId }).catch(e => {
          console.warn(`Failed to fetch org details for ${orgId}:`, e);
          return { data: { success: false, organization: { id: orgId, companyName: "Details Unavailable" }}};
        })
      );

      const [jobDetailsResults, orgDetailsResults] = await Promise.all([
        Promise.all(jobDetailsPromises),
        Promise.all(orgDetailsPromises),
      ]);

      const jobsMap = new Map();
      jobDetailsResults.forEach(res => {
        if (res.data.job) jobsMap.set(res.data.job.id, res.data.job);
      });

      const orgsMap = new Map();
      orgDetailsResults.forEach(res => {
        if (res.data.organization) orgsMap.set(res.data.organization.id, res.data.organization);
      });

      applicationsList.value = rawApplications.map((app) => ({
        ...app,
        jobTitle: jobsMap.get(app.jobID)?.jobTitle || "Job Title Not Available",
        companyName: orgsMap.get(app.orgID)?.companyName || "Company Not Available",
      }));

    } catch (err) {
      console.error("Error fetching candidate applications details:", err);
      applicationsError.value =
        err.message ||
        "An unexpected error occurred while fetching your applications.";
      applicationsList.value = [];
    } finally {
      isLoadingApplications.value = false;
    }
  };

  return {
    // State
    candidate, 
    candidateProfile, 
    loading,
    error,
    applicationsList,
    isLoadingApplications,
    applicationsError,

    isAuthenticated,
    currentCandidate,

    initialize, 
    register,
    login,
    logout,
    checkIfCandidateExists,
    fetchMyApplications,
    fetchCandidateProfile, 
    clearError,
    resetState,
  };
});