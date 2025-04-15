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
    throw new functions.https.HttpsError(
      "internal",
      "Error creating user account"
    );
  }
});
