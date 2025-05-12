/**
 * Firebase Cloud Functions for public job data access.
 */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin"); // Assumes admin is initialized in main index.js

const db = admin.firestore();

/**
 * Fetches publicly available details for a specific job.
 *
 * Expected request.data:
 * - jobId (string): ID of the job to fetch.
 */
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

    // Select only the fields safe for candidate view
    // Exclude sensitive fields like internal notes, full list of hiringManagerIds and other sensitive stuff
    const publicJobData = {
      id: jobDoc.id,
      jobTitle: jobData.jobTitle,
      jobDescription: jobData.jobDescription,
      jobLocation: jobData.jobLocation,
      jobDepartment: jobData.jobDepartment,
      jobType: jobData.jobType,
      applicationDeadline: jobData.applicationDeadline, // TO-DO FORMAT!
      requiredSkills: jobData.requiredSkills,
      preferredSkills: jobData.preferredSkills,
      requiredEducation: jobData.requiredEducation,
      requiredCertifications: jobData.requiredCertifications,
      techStack: jobData.techStack,
      travelRequirements: jobData.travelRequirements,
      teamSize: jobData.teamSize,
      candidateResourceLinks: jobData.candidateResourceLinks,
      // other fields
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
