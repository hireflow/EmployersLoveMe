import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/firebase.config"; // Ensure this path is correct
import { useRouter } from "vue-router";

const CANDIDATE_STORAGE_KEY = "hireflow_candidate_auth";

export const useCandidateAuthStore = defineStore("candidate-auth", () => {
  const functions = getFunctions(app);
  const router = useRouter(); // Get router instance here

  const candidate = ref(null);
  const loading = ref(false); // For general async operations like login/register
  const initLoading = ref(true); // Specifically for initial load from localStorage
  const error = ref(null); // For login/register/checkIfCandidateExists errors

  // --- NEW STATE PROPERTIES FOR APPLICATIONS ---
  const applicationsList = ref([]);
  const isLoadingApplications = ref(false);
  const applicationsError = ref(null);

  const checkCandidateEmailExistsCallable = httpsCallable(
    functions,
    "checkCandidateEmailExists"
  );
  const registerCandidateCallable = httpsCallable(
    functions,
    "registerCandidate"
  );
  const signInCandidateCallable = httpsCallable(functions, "signInCandidate");

  const findApplicationsCallable = httpsCallable(
    functions,
    "findOneOrManyApplicationsById"
  );

  const getJobDetailsCallable = httpsCallable(functions, "getPublicJobDetails");
  const getOrgDetailsCallable = httpsCallable(functions, "getPublicOrgDetails");

  const initialize = () => {
    initLoading.value = true;
    try {
      const storedCandidate = localStorage.getItem(CANDIDATE_STORAGE_KEY);
      if (storedCandidate) {
        const parsedCandidate = JSON.parse(storedCandidate);
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
      localStorage.removeItem(CANDIDATE_STORAGE_KEY);
    } finally {
      initLoading.value = false;
    }
  };

  initialize(); // Called on store setup

  watch(
    candidate,
    (newCandidateValue) => {
      if (newCandidateValue) {
        localStorage.setItem(
          CANDIDATE_STORAGE_KEY,
          JSON.stringify(newCandidateValue)
        );
        console.log("Candidate data saved to localStorage.");
      } else {
        localStorage.removeItem(CANDIDATE_STORAGE_KEY);
        console.log("Candidate data removed from localStorage.");
      }
    },
    { deep: true }
  );

  const checkIfCandidateExists = async (emailToCheck) => {
    loading.value = true;
    error.value = null;
    try {
      const result = await checkCandidateEmailExistsCallable({
        email: emailToCheck,
      });
      return {
        exists: result.data.exists,
        claimedId: result.data.candidateId,
      };
    } catch (err) {
      console.error("Error in checkIfCandidateExists:", err);
      error.value = err.message || "Error checking email existence.";
      throw err; // Re-throw for component to handle
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
    loading.value = true;
    error.value = null;
    try {
      const result = await registerCandidateCallable({
        email: candidateEmail,
        password: candidatePassword,
        name,
        phone,
        resumeUrl,
      });
      if (result.data.success && result.data.candidate) {
        candidate.value = result.data.candidate;
      } else {
        throw new Error(
          result.data.message || "Registration failed to return candidate data."
        );
      }
      return result.data;
    } catch (err) {
      console.error("Error in register:", err);
      error.value = err.message || "Could not register candidate.";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const login = async (candidateEmail, candidatePassword, claimedId) => {
    loading.value = true;
    error.value = null;
    try {
      const result = await signInCandidateCallable({
        claimedId,
        email: candidateEmail,
        password: candidatePassword,
      });
      if (result.data.success && result.data.candidate) {
        candidate.value = result.data.candidate;
      } else {
        throw new Error(
          result.data.message || "Login failed to return candidate data."
        );
      }
      return result.data;
    } catch (err) {
      console.error("Error in login:", err);
      error.value = err.message || "Could not log in.";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const logout = () => {
    candidate.value = null;

    applicationsList.value = [];
    applicationsError.value = null;
    isLoadingApplications.value = false; // Reset loading state

    console.log(
      "Candidate logged out and data cleared from store/localStorage."
    );
    router.push({ name: "CandidateLogin" });
  };

  const fetchMyApplications = async () => {
    // Ensure candidate is loaded and has an ID and the applications array
    if (!candidate.value?.id) {
      applicationsList.value = [];
      console.log(
        "No candidate logged in or no application IDs found to fetch."
      );
      router.push("CandidateLogin");
    } else if (!candidate.value.applications?.length) {
      applicationsList.value = [];
      return;
    }

    isLoadingApplications.value = true;
    applicationsError.value = null;

    try {
      const appResult = await findApplicationsCallable({
        applicationIds: candidate.value.applications,
      });

      if (!appResult.data.success) {
        throw new Error(
          appResult.data.message || "Failed to fetch application documents"
        );
      }
      const rawApplications = appResult.data.applications;

      if (!rawApplications || rawApplications.length === 0) {
        applicationsList.value = [];
        isLoadingApplications.value = false;
        return;
      }

      const jobIds = [
        ...new Set(
          rawApplications.map((app) => app.jobID).filter((id) => !!id)
        ),
      ];
      const orgIds = [
        ...new Set(
          rawApplications.map((app) => app.orgID).filter((id) => !!id)
        ),
      ];

      const jobDetailsPromises =
        jobIds.length > 0
          ? jobIds.map((jobId) =>
              getJobDetailsCallable({ jobId }).catch((e) => {
                console.warn(`Failed to fetch job details for ${jobId}:`, e);
                return {
                  data: {
                    success: false,
                    job: { id: jobId, jobTitle: "Details Unavailable" },
                  },
                };
              })
            )
          : [];

      const orgDetailsPromises =
        orgIds.length > 0
          ? orgIds.map((orgId) =>
              getOrgDetailsCallable({ orgId }).catch((e) => {
                console.warn(`Failed to fetch org details for ${orgId}:`, e);
                return {
                  data: {
                    success: false,
                    organization: {
                      id: orgId,
                      companyName: "Details Unavailable",
                    },
                  },
                };
              })
            )
          : [];

      const [jobDetailsResults, orgDetailsResults] = await Promise.all([
        Promise.all(jobDetailsPromises),
        Promise.all(orgDetailsPromises),
      ]);

      // 4. Create maps for quick lookup
      const jobsMap = new Map();
      jobDetailsResults.forEach((res) => {
        if (res.data.success && res.data.job)
          jobsMap.set(res.data.job.id, res.data.job);
        else if (res.data.job) jobsMap.set(res.data.job.id, res.data.job); // Store even if success is false but job object is there
      });

      const orgsMap = new Map();
      orgDetailsResults.forEach((res) => {
        if (res.data.success && res.data.organization)
          orgsMap.set(res.data.organization.id, res.data.organization);
        else if (res.data.organization)
          orgsMap.set(res.data.organization.id, res.data.organization);
      });

      applicationsList.value = rawApplications.map((app) => {
        const jobInfo = jobsMap.get(app.jobID);
        const orgInfo = orgsMap.get(app.orgID);
        return {
          ...app,
          jobTitle: jobInfo?.jobTitle || "Job Title Not Available",
          companyName: orgInfo?.companyName || "Company Not Available",
          orgID: app.orgID,
          jobID: app.jobID,
        };
      });
    } catch (error) {
      console.error("Error fetching candidate applications details:", error);
      applicationsError.value =
        error.message ||
        "An unexpected error occurred while fetching your applications.";
      applicationsList.value = [];
    } finally {
      isLoadingApplications.value = false;
    }
  };

  return {
    candidate,
    loading,
    initLoading,
    error,
    register,
    login,
    logout,
    checkIfCandidateExists,
    initialize,
    applicationsList,
    isLoadingApplications,
    applicationsError,
    fetchMyApplications,
  };
});
