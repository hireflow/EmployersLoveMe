import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();
const applyToJob = httpsCallable(functions, "applyToJob");
const updateApplication = httpsCallable(functions, "updateApplication");
const initializeChatbot = httpsCallable(functions, "initializeChatbot");

const authStore = useAuthStore();
const showChatbot = ref(false);
const employmentForm = ref({
  employmentStatus: "",
  yearsOfExperience: null,
  currentSalary: null,
  noticePeriod: ""
});

const handleFormSubmitAndInitializeChatbot = async () => {
  try {
    if (!authStore.user?.uid || !props.jobId || !props.orgId) {
      throw new Error("Missing required data for application");
    }

    // First, apply to the job
    const applyResult = await applyToJob({
      jobId: props.jobId,
      candidateId: authStore.user.uid,
      orgId: props.orgId
    });

    if (!applyResult.data.success) {
      throw new Error("Failed to create application");
    }

    // Update the application with employment details
    await updateApplication({
      applicationId: applyResult.data.data.applicationId,
      employmentDetails: {
        employmentStatus: employmentForm.employmentStatus,
        yearsOfExperience: employmentForm.yearsOfExperience,
        currentSalary: employmentForm.currentSalary,
        noticePeriod: employmentForm.noticePeriod
      }
    });

    // Initialize the chatbot
    await initializeChatbot({
      applicationId: applyResult.data.data.applicationId,
      reportId: applyResult.data.data.reportId
    });

    showChatbot.value = true;
  } catch (error) {
    console.error("Error submitting application:", error);
    // Handle error appropriately
  }
}; 