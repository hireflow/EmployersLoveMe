const functions = require("firebase-functions");
const admin = require("firebase-admin");


exports.userCreated = functions.auth.user().onCreate(async (user) => {
    return admin.firestore().collection('users').doc(user.uid).set({
        email: user.email,
        createdAt: admin.firestore.Timestamp.fromDate(new Date ()),
        role: "user",
    })
})

exports.reg_emailAndPassword = functions.https.onCall()