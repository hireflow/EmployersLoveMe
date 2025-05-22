const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

exports.registerUser = onCall(async (request) => {
  const data = request.data;
  if (!data.email || !data.password) {
    throw new HttpsError(
      "invalid-argument",
      "Email and password are required."
    );
  }

  try {
    const userRecord = await admin.auth().createUser({
      email: data.email,
      password: data.password,
      displayName: data.displayName || "",
    });

    await admin
      .firestore()
      .collection("users")
      .doc(userRecord.uid)
      .set({
        email: data.email,
        displayName: data.displayName || "",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        role: "user",
        organizations: [], // Initialize with empty array
        ...(data.profile || {}),
      });

    return {
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
      },
    };
  } catch (error) {
    throw new HttpsError("internal", error.message);
  }
});

exports.addOrganizationToUser = onCall(async (request) => {
  const data = request.data;
  const { userId, orgId } = data;

  if (!userId || !orgId) {
    throw new HttpsError(
      "invalid-argument",
      "User ID and Organization ID are required."
    );
  }

  try {
    const userRef = admin.firestore().collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new HttpsError("not-found", "User not found");
    }

    // Update user with organization info
    await userRef.update({
      organizations: admin.firestore.FieldValue.arrayUnion(orgId),
    });

    return {
      success: true,
      message: "Organization added to user successfully",
      userId,
    };
  } catch (error) {
    throw new HttpsError("internal", error.message);
  }
});

exports.getUserProfile = onCall(async (request) => {
  const { uid } = request.data;
  if (!uid) {
    throw new HttpsError("invalid-argument", "userid is required.");
  }

  try {
    const userRef = admin.firestore().collection("users").doc(uid);
    userDoc = await userRef.get();

    if (!userDoc.exists) {
      return {
        success: false,
        user: null,
      };
    }

    const userData = userDoc.data();

    return {
      success: true,
      user: userData,
    };
  } catch (error) {
    throw new HttpsError("internal", error.message);
  }
});
