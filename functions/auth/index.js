const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Use the authOnUserCreated from v2/identity instead of v2/auth
const { authOnUserCreated } = require("firebase-functions/v2/identity");

// DO NOT initialize Firebase Admin SDK here
// It's already initialized in the main index.js file

exports.registerUser = onCall(async (request) => {
  const data = request.data;
  if (!data.email || !data.password) {
    throw new Error("Email and password are required.");
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
    throw new Error(error.message);
  }
});

exports.signIn = onCall(async (request) => {
  const data = request.data;
  try {
    const userRecord = await admin.auth().getUserByEmail(data.email);

    // Get user's additional data from Firestore
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(userRecord.uid)
      .get();
    const userData = userDoc.data();

    return {
      success: true,
      user: {
        ...(userData || {}),
        uid: userRecord.uid,
        email: userRecord.email,
      },
    };
  } catch (error) {
    throw new Error(error.message);
  }
});

// // Using authOnUserCreated from v2/identity instead of v2/auth
// exports.onUserCreated = authOnUserCreated((event) => {
//   const user = event.data;
//   console.log(
//     "onUserCreated triggered with user:",
//     JSON.stringify(user, null, 2)
//   );

//   if (!user) {
//     console.error("User object is null or undefined");
//     return null;
//   }

//   if (!user.uid) {
//     console.error(
//       "User object missing uid property:",
//       JSON.stringify(user, null, 2)
//     );
//     return null;
//   }

//   console.log(`Processing user with uid: ${user.uid}`);

//   try {
//     return admin
//       .firestore()
//       .collection("users")
//       .doc(user.uid)
//       .get()
//       .then((userDoc) => {
//         console.log(`User document exists: ${userDoc.exists}`);

//         if (!userDoc.exists) {
//           console.log("Creating new user document in Firestore");
//           return admin
//             .firestore()
//             .collection("users")
//             .doc(user.uid)
//             .set({
//               email: user.email || null,
//               createdAt: admin.firestore.FieldValue.serverTimestamp(),
//               role: "user",
//             })
//             .then(() => {
//               console.log("User document created successfully");
//               return null;
//             });
//         } else {
//           console.log("User document already exists, skipping creation");
//           return null;
//         }
//       })
//       .catch((error) => {
//         console.error("Error in onUserCreated function:", error);
//         throw error;
//       });
//   } catch (error) {
//     console.error("Error in onUserCreated function:", error);
//     throw error;
//   }
// });
