const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin"); // Already initialized in main index.js

// Firestore instance
const db = admin.firestore();

exports.createApplication = onCall(async (request) => {
  // we will have the current applicant since we redirect to candidatelogin if candidate doesnt exist in candidate auth store
  // we have job id from params
  // we have orgid from params

  // need to pre load configs so that when the user gets here, in the background the specific org should be rendered
  // need to create a new Application
  // add the application to this candidate
  // generate a report that we will fill in later
  //

  const { candidateId, jobId, orgId } = request.data;

  if (!candidateId || !jobId || !orgId) {
    console.error(
      "Validation Error: Missing candidateId, jobId, or orgId",
      request.data
    );
    throw new HttpsError(
      "invalid-argument",
      "Missing required fields: candidateId, jobId, or orgId."
    );
  }

  try {
    // check if each ref exists
    const candidateRef = db.collection("candidates").doc(candidateId);
    const jobRef = db.collection("jobs").doc(jobId);
    const orgRef = db.collection("orgs").doc(orgId);

    const [candidateDoc, jobDoc, orgDoc] = await Promise.all([
      candidateRef.get(),
      jobRef.get(),
      orgRef.get(),
    ]);

    if (!candidateDoc.exists) {
      throw new HttpsError(
        "not-found",
        `Candidate with ID ${candidateId} not found.`
      );
    }
    if (!jobDoc.exists) {
      throw new HttpsError("not-found", `Job with ID ${jobId} not found.`);
    }
    if (!orgDoc.exists) {
      throw new HttpsError(
        "not-found",
        `Organization with ID ${orgId} not found.`
      );
    }

    // 2. Check if an application for this candidate and job already exists
    const applicationsRef = db.collection("applications");
    const existingApplicationQuery = await applicationsRef
      .where("candidateId", "==", candidateId)
      .where("jobID", "==", jobId)
      .limit(1)
      .get();

    if (!existingApplicationQuery.empty) {
      const existingApp = existingApplicationQuery.docs[0];
      console.log(
        `Application already exists for candidate ${candidateId} and job ${jobId}. ID: ${existingApp.id}`
      );
      // Return existing application details instead of creating a new one
      return {
        success: true,
        applicationId: existingApp.id,
        reportId: existingApp.data().reportID, // Assuming reportID is stored in application
        message: "Application already exists.",
        isExisting: true, // Flag to indicate it's an existing application
      };
    }

    const now = admin.firestore.Timestamp.now();
    const batch = db.batch();

    // 3. Create a new document in the `applications` collection
    const newApplicationRef = applicationsRef.doc(); // Auto-generate ID
    const reportId = db.collection("reports").doc().id; // Auto-generate ID for the report

    const applicationData = {
      candidateId: candidateId,
      jobID: jobId,
      orgID: orgId,
      applicationDate: now,
      status: "Applied", // Initial status
      messages: [], // Initialize with an empty array for chat history
      reportID: reportId,
      createdAt: now,
      updatedAt: now,
    };
    batch.set(newApplicationRef, applicationData);

    // 4. Create a new document in the `reports` collection
    const newReportRef = db.collection("reports").doc(reportId);
    const reportData = {
      candidateId: candidateId,
      applicationId: newApplicationRef.id,
      jobID: jobId,
      questionResponses: [],
      summary: "",
      score: null,
      createdAt: now,
      updatedAt: now,
      // maybe more fields later 
      // we will populate these fields later we can search by candidateId, jobID
    };

    batch.set(newReportRef, reportData);

    // applications will be an array of ids
    batch.update(candidateRef, {
      applications: admin.firestore.FieldValue.arrayUnion(newApplicationRef.id),
    });

    // applications will be an array of ids
    batch.update(jobRef, {
      applications: admin.firestore.FieldValue.arrayUnion(newApplicationRef.id),
    });

    // Commit all batched writes
    await batch.commit();

    console.log(
      `Successfully created application ${newApplicationRef.id} and report ${reportId}`
    );
    return {
      success: true,
      applicationId: newApplicationRef.id,
      reportId: reportId,
      message: "Application created successfully.",
      isExisting: false,
    };
  } catch (error) {
    console.error("Error creating application:", error);
    if (error instanceof HttpsError) {
      throw error; // Re-throw HttpsError
    }
    throw new HttpsError(
      "internal",
      "An unexpected error occurred while creating the application.",
      error.message
    );
  }
});
