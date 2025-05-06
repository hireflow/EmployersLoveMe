const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { HttpsError } = require("firebase-functions/v2/https");
const bcrypt = require('bcrypt');


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

exports.registerCandidate = onCall(async (request) => {
  const { email, password, resumeUrl, name, phone } = request.data;

  // Validate inputs
  if (!email || !password || !name) {
    throw new HttpsError(
      "invalid-argument",
      "Missing required fields: email, password, and name are required."
    );
  }

  try {

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create candidate document
    const candidateData = {
      email,
      password: hashedPassword,
      name,
      resumeUrl: resumeUrl || "",
      phone: phone || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Add to Firestore
    const candidatesRef = admin.firestore().collection('candidates');

    const docRef = await candidatesRef.add(candidateData);
    
    // Get the created document (without password)
    const candidateDoc = await docRef.get();
    const candidate = candidateDoc.data();
    delete candidate.password; // Remove password from the response
    
    return {
      success: true,
      candidate: {
        ...candidate,
        id: docRef.id
      }
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

exports.signInCandidate = onCall(async (request) => {
    const { claimedId, email, password } = request.data;
  
    // Validate inputs
    if (!claimedId || !email || !password) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required fields: candidateId and email and password are required."
      );
    }
  
    try {
      // Get candidate directly by ID
      const candidateRef = admin.firestore().collection('candidates').doc(claimedId);
      const candidateDoc = await candidateRef.get();
      
      // Check if candidate exists
      if (!candidateDoc.exists) {
        throw new HttpsError(
          "not-found",
          "No candidate found with this ID."
        );
      }
      
      const candidateData = candidateDoc.data();
      
      if (email && candidateData.email !== email) {
        throw new HttpsError(
          "permission-denied",
          "Invalid credentials."
        );
      }
      
      // Verify password
      const passwordMatches = await bcrypt.compare(password, candidateData.password);
      
      if (!passwordMatches) {
        throw new HttpsError(
          "permission-denied",
          "Invalid credentials."
        );
      }
      
      // Create a response object without the password
      const candidate = { ...candidateData};
      delete candidate.password;
      
      return {
        success: true,
        candidate: {
          ...candidate,
          id: candidateDoc.id
        }
      };
    } catch (error) {
      console.error('Error signing in candidate:', error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError(
        "internal",
        "Error signing in candidate."
      );
    }
  
});

