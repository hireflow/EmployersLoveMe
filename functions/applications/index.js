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

exports.getApplicationDetails = onCall(async (request) => {
  const { applicationId } = request.data;

  if (!applicationId) {
    throw new HttpsError("invalid-argument", "Missing required parameter: applicationId");
  }

  try {
    // Get the application document
    const applicationSnapshot = await admin
      .firestore()
      .collection("applications")
      .doc(applicationId)
      .get();

    if (!applicationSnapshot.exists) {
      throw new HttpsError("not-found", "Application not found");
    }

    const applicationData = applicationSnapshot.data();
    const candidateId = applicationData.candidateId;
    const reportId = applicationData.reportId;

    // Get the candidate document
    const candidateSnapshot = await admin
      .firestore()
      .collection("candidates")
      .doc(candidateId)
      .get();

    if (!candidateSnapshot.exists) {
      throw new HttpsError("not-found", "Candidate not found");
    }

    const candidateData = candidateSnapshot.data();

    // Get the report document if it exists
    let reportData = null;
    if (reportId) {
      const reportSnapshot = await admin
        .firestore()
        .collection("reports")
        .doc(reportId)
        .get();

      if (reportSnapshot.exists) {
        reportData = reportSnapshot.data();
      }
    }

    // Combine all the data
    const responseData = {
      ...applicationData,
      candidate: {
        id: candidateId,
        name: candidateData.name,
        email: candidateData.email,
        phone: candidateData.phone,
        resumeUrl: candidateData.resumeUrl
      },
      report: reportData
    };

    return {
      success: true,
      data: responseData
    };
  } catch (error) {
    console.error("Error in getApplicationDetails:", error);
    throw new HttpsError("internal", `Failed to get application details: ${error.message}`);
  }
}); 


exports.applyToJob = onCall(async (request) => {
  try {
    const { candidateId, jobId, applicationId, reportId, messages} =
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

    if (applicationData.status !== "Completed") {


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

      await admin
        .firestore()
        .collection("jobs")
        .doc(jobId)
        .update({
          applications: admin.firestore.FieldValue.arrayUnion(applicationId)
        });

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

exports.getApplicationsByJobId = onCall(async (request) => {
  const { jobId } = request.data;

  if (!jobId) {
    throw new HttpsError("invalid-argument", "Missing required parameter: jobId");
  }

  try {
    // First get the job document to get the applications array
    const jobDoc = await db.collection("jobs").doc(jobId).get();
    
    if (!jobDoc.exists) {
      throw new HttpsError("not-found", "Job not found");
    }

    const jobData = jobDoc.data();
    const applicationIds = jobData.applications || [];

    if (applicationIds.length === 0) {
      return {
        success: true,
        applications: [],
        message: "No applications found for this job"
      };
    }

    // Get all applications using the IDs from the job document
    const applicationsSnapshot = await db
      .collection("applications")
      .where(admin.firestore.FieldPath.documentId(), "in", applicationIds)
      .get();

    if (applicationsSnapshot.empty) {
      return {
        success: true,
        applications: [],
        message: "No applications found for this job"
      };
    }

    // Get all candidate IDs from the applications
    const candidateIds = applicationsSnapshot.docs.map(doc => doc.data().candidateId);
    
    // Get all candidate documents
    const candidateSnapshots = await Promise.all(
      candidateIds.map(id => db.collection("candidates").doc(id).get())
    );

    // Create a map of candidate data
    const candidateMap = new Map();
    candidateSnapshots.forEach((doc, index) => {
      if (doc.exists) {
        candidateMap.set(candidateIds[index], doc.data());
      }
    });

    // Get all report IDs from the applications
    const reportIds = applicationsSnapshot.docs.map(doc => doc.data().reportID);
    
    // Get all report documents
    const reportSnapshots = await Promise.all(
      reportIds.map(id => db.collection("reports").doc(id).get())
    );

    // Create a map of report data
    const reportMap = new Map();
    reportSnapshots.forEach((doc, index) => {
      if (doc.exists) {
        reportMap.set(reportIds[index], doc.data());
      }
    });

    // Combine all the data
    const applications = applicationsSnapshot.docs.map(doc => {
      const appData = doc.data();
      return {
        id: doc.id,
        ...appData,
        candidate: candidateMap.get(appData.candidateId) ? {
          id: appData.candidateId,
          name: candidateMap.get(appData.candidateId).name,
          email: candidateMap.get(appData.candidateId).email,
          phone: candidateMap.get(appData.candidateId).phone,
          resumeUrl: candidateMap.get(appData.candidateId).resumeUrl
        } : null,
        report: reportMap.get(appData.reportID) || null
      };
    });

    return {
      success: true,
      applications,
      message: `Successfully retrieved ${applications.length} applications`
    };
  } catch (error) {
    console.error("Error getting applications by job ID:", error);
    throw new HttpsError("internal", `Failed to get applications: ${error.message}`);
  }
});
