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

// Export auth functions directly
exports.registerUser = authFunctions.registerUser;
exports.signIn = authFunctions.signIn;
exports.addOrganizationToUser = authFunctions.addOrganizationToUser;
exports.createOrg = orgFunctions.createOrg;
exports.fetchUserOrgsByEmail = orgFunctions.fetchUserOrgsByEmail;

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
