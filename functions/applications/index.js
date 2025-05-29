const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
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
      status: "Not Completed", // Initial status
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

exports.findOneOrManyApplicationsById = onCall(async (request) => {
  try {
    const { applicationIds } = request.data;
    if (
      !applicationIds ||
      !Array.isArray(applicationIds) ||
      applicationIds.length === 0
    ) {
      console.error(
        "Application ID array is null, not an array, or empty",
        request.data
      );
      throw new HttpsError(
        "invalid-argument",
        "Please provide a valid array of application IDs"
      );
    }

    if (applicationIds.length <= 29) {
      const applicationSnapshot = await db
        .collection("applications")
        .where(admin.firestore.FieldPath.documentId(), "in", applicationIds)
        .get();

      const validApplications = applicationSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {
        success: true,
        applications: validApplications,
        message: `Successfully retrieved ${validApplications.length} applications`,
      };
    } else {
      const batches = [];
      //Firestore's in query currently supports up to 30 values.
      for (let i = 0; i < applicationIds.length; i += 29) {
        const batch = applicationIds.slice(i, i + 29);
        batches.push(batch);
      }

      const batchPromises = batches.map(async (batchIds) => {
        const snapShot = await db
          .collection("applications")
          .where(admin.firestore.FieldPath.documentId(), "in", batchIds)
          .get();

        return snapShot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      });

      const batchResults = await Promise.all(batchPromises);
      const validApplications = batchResults
        .flat()
        .filter((app) => app !== null);

      return {
        success: true,
        applications: validApplications,
        message: `Successfully retrieved ${validApplications.length} applications`,
      };
    }
  } catch (error) {
    console.error("Error finding one or many applications by id:", error);
    if (error instanceof HttpsError) {
      throw error; // Re-throw HttpsError
    }
    throw new HttpsError(
      "internal",
      "An unexpected error occurred while finding the application."
    );
  }
});


exports.applyToJob = onCall(async (request) => {
  try {
    const { candidateId, jobId, applicationId, ...applicationResults } =
      request.data;

    if (!candidateId || !jobId || !applicationId) {
      throw new HttpsError("invalid-argument", "Missing required fields");
    }

    const candidateRef = db.collection("candidates").doc(candidateId);
    const jobRef = db.collection("jobs").doc(jobId);

    const [candidateDoc, jobDoc] = await Promise.all([
      candidateRef.get(),
      jobRef.get(),
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

    const applicationRef = db.collection("applications").doc(applicationId);
    const applicationDoc = await applicationRef.get();

    if (!applicationDoc.exists) {
      throw new HttpsError(
        "not-found",
        `Application with ID ${applicationId} not found.`
      );
    }

    const applicationData = applicationDoc.data();

    if (applicationData.status === "Not Completed") {
      //
      const { messages, summaryToAddToReport, scoreToAddToReport } =
        applicationResults;

      // generate a new report
      const reportId = db.collection("reports").doc().id;

      const reportData = {
        candidateId,
        applicationId,
        jobId,
        questionResponses: messages,
        summary: summaryToAddToReport,
        score: scoreToAddToReport,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      };

      const reportRef = db.collection("reports").doc(reportId);
      await reportRef.set(reportData);

      // now update the application to include messages and the report id

      const appData = {
        candidateId,
        jobId,
        orgId: applicationData.orgId, //check if i need to prefill this???
        messages,
        reportId,
        status: "Completed",
        completedAt: admin.firestore.Timestamp.now(),
        applicationDate: admin.firestore.Timestamp.now(),
      };

      await applicationRef.update(appData);

      return {
        success: true,
        applicationId,
        reportId,
        message: "Application completed successfully",
      };
    }
  } catch (error) {
    console.error("Error applying to job:", error);
    if (error instanceof HttpsError) {
      throw error; // Re-throw HttpsError
    }
    throw new HttpsError(
      "internal",
      "An unexpected error occurred while applying to the job."
    );
  }
});

exports.parseApplicationForm = onCall(async (request) => {
    const {
    employmentStatus,
    yearsOfExperience,
    currentSalary,
    noticePeriod,
    applicationId,
    reportId,
    resumeText,
    userId,
  } = request.data;

  // 2. Validate Resume Text
  if (!resumeText || typeof resumeText !== 'string' || resumeText.trim() === '') {
    return {
      success: true,
    };
  }

  const candidateData = {
    resumeBreakdown: resumeText,
    uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  try {
    const candidateRef = db.collection("candidates").doc(userId);
    await candidateRef.set(candidateData, { merge: true });

    return {
      success: true,
    };
  } catch (err) {
    console.error(`[${Date.now()}] Firestore save failed for user ${userId}:`, err);
    throw new HttpsError(
      'internal',
      'Failed to save application data.',
      err.message 
    );
  }
});
