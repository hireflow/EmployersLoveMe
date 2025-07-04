/**
 * Import function triggers from their respective submodules
 */
const { onCall } = require("firebase-functions/v2/https");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK only once
if (admin.apps.length === 0) {
  // Check if already initialized
  admin.initializeApp();
}

// Import auth functions
const authFunctions = require("./auth");
const orgFunctions = require("./orgs");
const candidateFunctions = require("./candidates");
const applicationFunctions = require("./applications");
const jobFunctions = require("./jobs");
const chatbotFunctions = require("./chatbot");

// job functions
exports.getPublicJobDetails = jobFunctions.getPublicJobDetails;

// application functions
exports.applyToJob = applicationFunctions.applyToJob;
exports.createApplication = applicationFunctions.createApplication;
exports.findOneOrManyApplicationsById =
  applicationFunctions.findOneOrManyApplicationsById;
exports.parseApplicationForm = applicationFunctions.parseApplicationForm;
exports.getApplicationDetails = applicationFunctions.getApplicationDetails;
exports.getApplicationsByJobId = applicationFunctions.getApplicationsByJobId;

// Export auth functions
exports.registerUser = authFunctions.registerUser;
exports.getUserProfile = authFunctions.getUserProfile;
exports.addOrganizationToUser = authFunctions.addOrganizationToUser;

// Export organization and job functions
exports.updateJobById = orgFunctions.updateJobById;
exports.createOrg = orgFunctions.createOrg;
exports.createJob = orgFunctions.createJob;
exports.getJobsByOrgId = orgFunctions.getJobsByOrgId;
exports.addNewJobIdToOrg = orgFunctions.addNewJobIdToOrg;
exports.fetchUserOrgsById = orgFunctions.fetchUserOrgsById;
exports.deleteJobById = orgFunctions.deleteJobById;
exports.deleteOrg = orgFunctions.deleteOrg;
exports.getPublicOrgDetails = orgFunctions.getPublicOrgDetails;
exports.updateOrg = orgFunctions.updateOrg;

// candidate functions
exports.checkCandidateEmailExists =
  candidateFunctions.checkCandidateEmailExists;
exports.setCandidateProfile = candidateFunctions.setCandidateProfile;
exports.getCandidateProfile = candidateFunctions.getCandidateProfile;

//gemini functions
exports.geminiChatbot = chatbotFunctions.geminiChatbot;
exports.extractAndSaveData = chatbotFunctions.extractAndSaveData;
exports.generateReport = chatbotFunctions.generateReport;


// Example HTTP function
exports.helloWorld = onRequest(
  {
    region: "us-central1",
    memory: "256MiB",
  },
  (request, response) => {
    console.log("Hello logs", { structuredData: true });
    response.send("Hello from Firebase!");
  }
);
// lol
