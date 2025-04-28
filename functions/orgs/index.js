const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { HttpsError } = require("firebase-functions/v2/https");

// User who owns companies can log in and manage orgs
// This user will give the hiring manager the created login credentials for the org
// Hiring manager can log in and we will pre load the org (singular) that this account was made for
// const orgSchema = {
//   id: String,
//   name: String,
//   createdById: String, // Reference to user who created the organization
//   createdByEmail: String,
//   createdLoginEmail: String,
//   createdLoginPassword: String,
//   createdAt: Timestamp,

//   // not implemented yet
//   stripeCustomerId: String,
//   stripeSubscriptionId: String,
//   paymentPlanTier: String,
//   paymentPlanStatus: String,
//   paymentPlanStartDate: Timestamp,
//   paymentPlanEndDate: Timestamp,
//   paymentPlanCanceledDate: Timestamp,
//   paymentPlanCanceledReason: String,
//   logoUrl: String,
// };

exports.createOrg = onCall(async (request) => {
  const {
    name,
    createdById,
    createdByEmail,
    createdLoginEmail,
    createdLoginPassword,
    companySize,
    industry,
    location,
    companyDescription,
  } = request.data;
  try {
    const orgRef = admin.firestore().collection("orgs").doc();

    // 1. Create timestamp for createdAt field
    const createdAt = admin.firestore.Timestamp.now();

    // 2. Create the org document data
    const orgData = {
      id: orgRef.id,
      name,
      createdById,
      createdByEmail,
      createdLoginEmail, // keep the password on the frontend for hiring managers to ss
      createdAt,
      companySize,
      industry,
      location,
      companyDescription,
      // Initialize other fields as needed
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      paymentPlanTier: "free", // Default tier
      paymentPlanStatus: "active",
      paymentPlanStartDate: createdAt,
      paymentPlanEndDate: null,
      paymentPlanCanceledDate: null,
      paymentPlanCanceledReason: null,
      logoUrl: null,
    };

    await orgRef.set(orgData);

    const hiringManagerUserRecord = await admin.auth().createUser({
      email: createdLoginEmail,
      password: createdLoginPassword,
      displayName: `${name} Manager`,
    });

    await admin
      .firestore()
      .collection("users")
      .doc(hiringManagerUserRecord.uid)
      .set({
        role: "hiring_manager",
        orgId: orgRef.id,
        createdAt,
        organizations: [orgRef.id],
      });

    return {
      success: true,
      orgId: orgRef.id,
      hiringManagerId: hiringManagerUserRecord.uid,
      message: "Organization created successfully",
    };
  } catch (authError) {
    console.error("Error creating user account:", authError);
    // Consider rolling back org creation if user creation fails
    await orgRef.delete();
    throw new HttpsError("internal", "Error creating user account");
  }
});

exports.fetchUserOrgsByEmail = onCall(async (request) => {
  const createdByEmail = request.data.createdByEmail;

  try {
    const orgRefs = admin
      .firestore()
      .collection("orgs")
      .where("createdByEmail", "==", createdByEmail);

    const orgDocs = await orgRefs.get();
    const orgData = orgDocs.docs.map((doc) => doc.data());

    if (orgDocs.empty) {
      return {
        success: false,
        message: "No organizations found",
      };
    } else {
      return {
        success: true,
        orgs: orgData,
      };
    }
  } catch (error) {
    console.error("Error fetching user orgs:", error);
    throw new HttpsError("internal", "Error fetching user orgs");
  }
});
