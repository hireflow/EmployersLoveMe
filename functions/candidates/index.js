const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { HttpsError } = require("firebase-functions/v2/https");


exports.checkCandidateEmailExists = onCall(async (request) => {
    const { email } = request.data;

    if (!email) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required field email"
      );
    }
    
    try {
      const candidatesRef = admin.firestore().collection('candidates');
      const snapshot = await candidatesRef.where('email', '==', email).limit(1).get();
      
      if (snapshot.empty) {
        return {
          exists: false,
          success: true
        };
      }
      
      const doc = snapshot.docs[0];
      
      return {
        exists: true,
        success: true,
        email: doc.data().email,
        candidateId: doc.id
      };
    } catch (error) {
      console.error('Error checking candidate email:', error);
      throw new HttpsError(
        "internal",
        "Error checking email existence"
      );
    }
});

exports.setCandidateProfile = onCall(async (request) => {
  const { email, password, resumeUrl, name, phone, applications } = request.data;

  // Validate inputs
  if (!email || !password) {
    throw new HttpsError(
      "invalid-argument",
      "Missing required fields: email and password are required."
    );
  }

  try {

    const candidateRecord = await admin.auth().createUser({
      email: email,
      password: password,
    });
    

    // Create candidate document
    const candidateData = {
      email,
      name,
      resumeUrl: resumeUrl || "",
      applications: applications || [],
      phone: phone || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Add to Firestore
    const candidatesRef = admin.firestore().collection('candidates');

    await candidatesRef.doc(candidateRecord.uid).set(candidateData);

    return {
      success: true,
      candidate: {
        uid: candidateRecord.uid,
        email: candidateRecord.email,  
      },
    };
  } catch (error) {
    console.error('Error registering candidate:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError(
      "internal",
      "Error registering candidate."
    );
  }
});

exports.getCandidateProfile = onCall(async (request) => {
    const { uid } = request.data;
  
    // Validate inputs
    if (!uid) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required fields: candidateId."
      );
    }
  
    try {
      const candidateRef = admin.firestore().collection('candidates').doc(uid);
      const candidateDoc = await candidateRef.get();
      
      // Check if candidate exists
      if (!candidateDoc.exists) {
        return {
          success: false,
          candidate: null
        };
      }
      
      const candidateData = candidateDoc.data();
      
      
      return {
        success: true,
        candidate: candidateData
      };
    } catch (error) {
      console.error('Error fetching candidate:', error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError(
        "internal",
        "Error fetching candidate."
      );
    }
  
});

