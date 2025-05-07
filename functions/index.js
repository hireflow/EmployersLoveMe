/**
 * Import function triggers from their respective submodules
 */
const { onCall } = require("firebase-functions/v2/https");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK only once
admin.initializeApp();

// Import auth functions
const authFunctions = require("./auth");
const orgFunctions = require("./orgs");
const candidateFunctions = require("./candidates");

// Export auth functions
exports.registerUser = authFunctions.registerUser;
exports.signIn = authFunctions.signIn;
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

exports.checkCandidateEmailExists = candidateFunctions.checkCandidateEmailExists;
exports.signInCandidate = candidateFunctions.signInCandidate;
exports.registerCandidate = candidateFunctions.registerCandidate;

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
