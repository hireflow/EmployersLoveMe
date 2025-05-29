const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

const db = admin.firestore();

exports.getPublicJobDetails = onCall(async (request) => {
  const { jobId } = request.data;

  if (!jobId) {
    console.error("Validation Error: Missing jobId", request.data);
    throw new HttpsError("invalid-argument", "Missing required field: jobId.");
  }

  try {
    const jobRef = db.collection("jobs").doc(jobId);
    const jobDoc = await jobRef.get();

    if (!jobDoc.exists) {
      throw new HttpsError("not-found", `Job with ID ${jobId} not found.`);
    }

    const jobData = jobDoc.data();

    // Select only the fields safe for candidate view, aligning with new schema
    const publicJobData = {
      id: jobDoc.id,
      jobTitle: jobData.jobTitle || "N/A",
      jobDescription: jobData.jobDescription || "No description provided.",
      jobLocation: jobData.jobLocation || "N/A",
      jobDepartment: jobData.jobDepartment || "N/A",
      jobType: jobData.jobType || "N/A",
      applicationDeadline: jobData.applicationDeadline || null,

      requiredSkills: jobData.requiredSkills || [],
      preferredSkills: jobData.preferredSkills || [],
      requiredEducation: jobData.requiredEducation || [],
      requiredCertifications: jobData.requiredCertifications || [],

      // Work Environment fields
      workEnvironment: {
        techMaturity: jobData.workEnvironment?.techMaturity || "medium",
        structure: jobData.workEnvironment?.structure || "hybrid",
        communication: jobData.workEnvironment?.communication || "sync-first",
        pace: jobData.workEnvironment?.pace || "project-based",
        growthExpectiations: jobData.workEnvironment?.growthExpectiations || "mentored",
        collaboration: jobData.workEnvironment?.collaboration || "departmental",
      },

      // For techStack, decide what's public
      techStack: {
        stack: (jobData.techStack?.stack || []).map((item) => ({
          skill: item.skill,
          level: item.level,
        })), // Only skill and level from stack
        architecture: jobData.techStack?.architecture || "",
        practices: jobData.techStack?.practices || [],
      },

      travelRequirements: jobData.travelRequirements || "N/A",
      salaryRange: jobData.salaryRange || "Not disclosed",
      teamSize: jobData.teamSize || "N/A",
      candidateResourceLinks: jobData.candidateResourceLinks || [],
    };

    return {
      success: true,
      job: publicJobData,
    };
  } catch (error) {
    console.error(`Error fetching public job details for job ${jobId}:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError(
      "internal",
      "An unexpected error occurred while fetching job details.",
      error.message
    );
  }
});
