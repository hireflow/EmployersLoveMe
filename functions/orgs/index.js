const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
// admin.initializeApp() // Make sure admin is initialized, typically in your main index.js if not here.
const db = admin.firestore();

// Ensure admin is initialized if not done elsewhere
if (admin.apps.length === 0) {
  admin.initializeApp();
}

exports.createJob = onCall(async (request) => {
  try {
    const data = request.data;
    console.log(request.data);

    if (
      !data.orgId ||
      !Array.isArray(data.hiringManagerIds) || // This is the input param name, that's fine
      data.hiringManagerIds.length === 0 ||
      !data.jobTitle ||
      !data.jobDescription
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required fields: orgId, hiringManagerIds, jobTitle, or jobDescription"
      );
    }

    const jobRef = admin.firestore().collection("jobs").doc();
    const createdAt = admin.firestore.Timestamp.now();
    const jobData = {
      jobTitle: data.jobTitle,
      applicationDeadline: data.applicationDeadline || "",
      applications: [],
      hiringManagerIds: data.hiringManagerIds, // Storing IDs of managers for this job
      orgId: data.orgId,
      requiredEducation: data.requiredEducation || "",
      requiredCertifications: data.requiredCertifications || "",
      requiredSkills: data.requiredSkills || "",
      preferredSkills: data.preferredSkills || "",
      requiredQuestions: data.requiredQuestions || "",
      candidateResourceLinks: data.candidateResourceLinks || "",
      jobType: data.jobType || "",
      interviewStages: data.interviewStages || 0,
      jobDepartment: data.jobDepartment || "",
      jobDescription: data.jobDescription,
      jobLocation: data.jobLocation || "",
      teamSize: data.teamSize || 0,
      techStack: data.techStack || "",
      travelRequirements: data.travelRequirements || "",
      createdAt: createdAt,
      jobSalary: data.jobSalary || "",
      status: "active",
    };

    await jobRef.set(jobData);

    const orgRef = admin.firestore().collection("orgs").doc(data.orgId);
    const orgDoc = await orgRef.get();

    if (!orgDoc.exists) {
      throw new HttpsError("not-found", "Organization not found");
    }

    await orgRef.update({
      jobs: admin.firestore.FieldValue.arrayUnion(jobRef.id), // Using 'jobs' as per schema
    });

    return {
      success: true,
      jobId: jobRef.id,
      message: "Job created successfully",
    };
  } catch (error) {
    console.error("Error creating job:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Error creating job", error.message);
  }
});

exports.getJobsByOrgId = onCall(async (request) => {
  try {
    const { orgId } = request.data;
    if (!orgId)
      throw new HttpsError(
        "invalid-argument",
        "orgId is required from request data"
      );

    const orgsCollection = admin.firestore().collection("orgs");
    const jobsCollection = admin.firestore().collection("jobs");

    const orgDoc = await orgsCollection.doc(orgId).get();
    let jobIdsFromOrg = []; // Renamed to avoid confusion with param name
    if (orgDoc.exists) {
      const data = orgDoc.data();
      if (data && data.jobs && Array.isArray(data.jobs)) {
        // Using 'jobs' as per schema
        jobIdsFromOrg = data.jobs;
      }
    }

    if (jobIdsFromOrg.length === 0) {
      console.log("No jobs found for orgID: ", orgId);
      return {
        success: true,
        data: [],
      };
    }

    const jobDocRefs = jobIdsFromOrg.map((id) => jobsCollection.doc(id));
    const jobDocSnapshots = await admin.firestore().getAll(...jobDocRefs);

    const populatedJobs = jobDocSnapshots
      .map((docSnapshot) => {
        if (docSnapshot.exists) {
          return { id: docSnapshot.id, ...docSnapshot.data() };
        } else {
          console.warn(`Job document with ID ${docSnapshot.id} not found.`);
          return null;
        }
      })
      .filter((job) => job !== null);

    return {
      success: true,
      // jobIds: jobIdsFromOrg, // if client expects the raw IDs list
      data: populatedJobs,
    };
  } catch (error) {
    console.error("Error fetching populated jobs by orgId:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError(
      "internal",
      "An internal error occurred while fetching jobs.",
      error.message
    );
  }
});

exports.updateJobById = onCall(async (request) => {
  const { jobId, updatedJobData } = request.data;
  try {
    if (!jobId || !updatedJobData)
      throw new HttpsError(
        "invalid-argument",
        "Missing required fields jobId and updatedJobData"
      );

    const jobRef = admin.firestore().collection("jobs").doc(jobId);
    await jobRef.update(updatedJobData);

    return {
      success: true,
      message: "Job updated successfully",
    };
  } catch (error) {
    console.error("Error updating job:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError(
      "internal",
      "An internal error occurred while updating jobs.",
      error.message
    );
  }
});

exports.deleteJobById = onCall(async (request) => {
  const { jobId, orgId } = request.data;
  try {
    if (!jobId || !orgId)
      throw new HttpsError(
        "invalid-argument",
        "Missing required fields jobId and orgId"
      );

    const orgRef = admin.firestore().collection("orgs").doc(orgId);
    const jobRef = admin.firestore().collection("jobs").doc(jobId);

    const batch = admin.firestore().batch();

    batch.update(orgRef, {
      jobs: admin.firestore.FieldValue.arrayRemove(jobId), // Using 'jobs' as per schema
    });

    batch.delete(jobRef);

    await batch.commit();

    return {
      success: true,
      message: "Job deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting job:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError(
      "internal",
      "An internal error occurred while deleting jobs.",
      error.message
    );
  }
});

exports.createOrg = onCall(async (request) => {
  const data = request.data;

  try {
    if (!data.companyName || !data.userId) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required fields for organization creation (companyName, userId)"
      );
    }

    const existingOrg = await admin
      .firestore()
      .collection("orgs")
      .where("companyName", "==", data.companyName)
      .get();

    if (!existingOrg.empty) {
      throw new HttpsError(
        "already-exists",
        "An organization with this name already exists"
      );
    }

    const orgRef = admin.firestore().collection("orgs").doc();
    const createdAt = admin.firestore.Timestamp.now();

    // Align with schema
    const orgData = {
      companyName: data.companyName,
      companyDescription: data.companyDescription || "",
      companySize: data.companySize || "",
      createdAt: createdAt,
      industry: data.industry || "",
      location: data.location || "",
      logoUrl: data.logoUrl || "",
      missionStatement: data.missionStatement || "",
      companyValues: data.companyValues || [], // From schema
      workEnvironment: data.workEnvironment || {
        // From schema, with defaults
        techMaturity: "medium",
        structure: "hybrid",
        communication: "sync-first",
        pace: "project-based",
        growthExpectiations: "mentored",
        collaboration: "departmental",
        teamSize: "",
      },
      hiringManagers: [data.userId], // Schema: hiringManagers: array [userId]
      jobs: [], // Schema: jobs: array [jobId], initially empty

      paymentPlanCanceledDate: data.paymentPlanCanceledDate || null, // Use null for unset dates
      paymentPlanCanceledReason: data.paymentPlanCanceledReason || "",
      paymentPlanEndDate: data.paymentPlanEndDate || null,
      paymentPlanStartDate: data.paymentPlanStartDate || null,
      paymentPlanStatus: data.paymentPlanStatus || "",
      paymentPlanTier: data.paymentPlanTier || "",
      stripeCustomerId: data.stripeCustomerId || "",
      stripeSubscriptionId: data.stripeSubscriptionId || "",
    };
    // Validate companyValues structure if necessary
    if (Array.isArray(orgData.companyValues)) {
      orgData.companyValues.forEach((cv) => {
        if (
          typeof cv.name !== "string" ||
          typeof cv.description !== "string" ||
          typeof cv.weight !== "number"
        ) {
          console.warn("Invalid companyValue structure:", cv);
          // Potentially throw error or clean up
        }
      });
    }

    const batch = admin.firestore().batch();
    batch.set(orgRef, orgData);

    const userRef = admin.firestore().collection("users").doc(data.userId);
    batch.update(userRef, {
      role: "hiring-manager", // Or whatever role logic you have
      organizations: admin.firestore.FieldValue.arrayUnion(orgRef.id),
    });

    await batch.commit();

    return {
      success: true,
      orgId: orgRef.id,
      message: "Organization created successfully",
    };
  } catch (error) {
    console.error("Error creating organization:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError(
      "internal",
      error.message || "Error creating organization"
    );
  }
});

exports.updateOrg = onCall(async (request) => {
  const { orgId, updates } = request.data;

  try {
    if (!orgId || !updates) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required fields: orgId and updates object."
      );
    }

    const orgRef = db.collection("orgs").doc(orgId);
    const orgDoc = await orgRef.get();

    if (!orgDoc.exists) {
      throw new HttpsError(
        "not-found",
        `Organization with ID ${orgId} not found.`
      );
    }


    const updateData = {};
    const allowedFields = [
      "companyName",
      "companyDescription",
      "companySize",
      "industry",
      "location",
      "logoUrl",
      "missionStatement",
      "companyValues",
      "workEnvironment",
      // Add other fields from your schema that are user-editable but not payment/stripe related
    ];

    for (const key of allowedFields) {
      if (updates.hasOwnProperty(key)) {
        // Basic validation for companyValues structure before update
        if (key === "companyValues") {
          if (!Array.isArray(updates[key])) {
            console.warn("companyValues update skipped: not an array");
            continue; // Skip this update if malformed
          }
          // Ensure each item has the correct structure
          updates[key] = updates[key]
            .map((cv) => ({
              name: typeof cv.name === "string" ? cv.name : "",
              description:
                typeof cv.description === "string" ? cv.description : "",
              weight: typeof cv.weight === "number" ? cv.weight : 50,
              // extractedKeywords: cv.extractedKeywords || [] // if you handle this
            }))
            .filter((cv) => cv.name || cv.description); // Filter out completely empty ones
        }
        // Basic validation for workEnvironment (ensure it's an object)
        if (key === "workEnvironment") {
          if (typeof updates[key] !== "object" || updates[key] === null) {
            console.warn("workEnvironment update skipped: not an object");
            continue;
          }
          // Ensure all nested properties exist to avoid Firestore errors with undefined
          const defaultWorkEnv = {
            techMaturity: "",
            structure: "",
            communication: "",
            pace: "",
            growthExpectiations: "",
            collaboration: "",
            teamSize: "",
          };
          updateData[key] = { ...defaultWorkEnv, ...updates[key] };
        } else {
          updateData[key] = updates[key];
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new HttpsError(
        "invalid-argument",
        "No valid fields provided for update."
      );
    }

    // Prevent updating companyName to one that already exists (excluding itself)
    if (
      updateData.companyName &&
      updateData.companyName !== orgDoc.data().companyName
    ) {
      const existingOrg = await db
        .collection("orgs")
        .where("companyName", "==", updateData.companyName)
        .limit(1)
        .get();
      if (!existingOrg.empty) {
        // Check if the found org is not the current org
        if (existingOrg.docs[0].id !== orgId) {
          throw new HttpsError(
            "already-exists",
            "An organization with this name already exists."
          );
        }
      }
    }

    await orgRef.update(updateData);

    return {
      success: true,
      message: "Organization updated successfully.",
    };
  } catch (error) {
    console.error(`Error updating organization ${orgId}:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError(
      "internal",
      error.message ||
        "An internal error occurred while updating the organization."
    );
  }
});

exports.deleteOrg = onCall(async (request) => {
  const { orgId } = request.data;

  try {
    if (!orgId)
      throw new HttpsError("invalid-argument", "Missing required field orgId");

    const orgRef = db.collection("orgs").doc(orgId);
    const orgDoc = await orgRef.get();

    if (!orgDoc.exists) {
      throw new HttpsError("not-found", "Organization not found");
    }

    const orgData = orgDoc.data();

    const jobIdsToDelete = orgData.jobs || []; // Using 'jobs' as per schema
    const hiringManagerUserIds = orgData.hiringManagers || []; // Using 'hiringManagers'

    const batch = db.batch(); // Use db.batch()

    // Delete job documents
    if (jobIdsToDelete.length > 0) {
      const jobsQuery = await db
        .collection("jobs")
        .where(admin.firestore.FieldPath.documentId(), "in", jobIdsToDelete)
        .get();
      jobsQuery.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
    }

    // Remove orgId from hiring managers' organizations array
    hiringManagerUserIds.forEach((userId) => {
      const userRef = db.collection("users").doc(userId);
      batch.update(userRef, {
        organizations: admin.firestore.FieldValue.arrayRemove(orgId),
      });
    });

    batch.delete(orgRef);
    await batch.commit();

    return {
      success: true,
      message: "Organization and associated data deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting org:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError(
      "internal",
      "An internal error occurred while deleting the org.",
      error.message
    );
  }
});

exports.fetchUserOrgsById = onCall(async (request) => {
  const userId = request.data.userId;

  if (!userId) {
    throw new HttpsError("invalid-argument", "User ID is required.");
  }

  try {
    const userRef = admin.firestore().collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return {
        // Or throw HttpsError('not-found', 'User not found')
        success: false,
        message: "User not found",
        orgs: [],
      };
    }

    const userData = userDoc.data();
    const userOrgIds = userData.organizations || [];

    if (userOrgIds.length === 0) {
      return {
        success: true, // Still a success, just no orgs
        message: "No organizations found for this user.",
        orgs: [],
      };
    }

    const orgFetches = userOrgIds.map((orgId) =>
      admin.firestore().collection("orgs").doc(orgId).get()
    );

    const orgDocs = await Promise.all(orgFetches);

    const orgDataResult = orgDocs
      .filter((doc) => doc.exists)
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Ensure all schema fields are present, even if null/default, for consistency on client
          companyName: data.companyName || "",
          companyDescription: data.companyDescription || "",
          companySize: data.companySize || "",
          createdAt: data.createdAt, // Should exist
          industry: data.industry || "",
          location: data.location || "",
          logoUrl: data.logoUrl || "",
          missionStatement: data.missionStatement || "",
          companyValues: data.companyValues || [],
          workEnvironment: data.workEnvironment || {}, // Client should handle defaults if needed
          hiringManagers: data.hiringManagers || [],
          jobs: data.jobs || [],
        };
      });

    return {
      success: true,
      orgs: orgDataResult,
    };
  } catch (error) {
    console.error("Error fetching user organizations:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError(
      "internal",
      "Error fetching user organizations.",
      error.message
    );
  }
});

exports.getPublicOrgDetails = onCall(async (request) => {
  const { orgId } = request.data;

  if (!orgId) {
    console.error("Validation Error: Missing orgId", request.data);
    throw new HttpsError("invalid-argument", "Missing required field: orgId.");
  }

  try {
    const orgRef = db.collection("orgs").doc(orgId);
    const orgDoc = await orgRef.get();

    if (!orgDoc.exists) {
      throw new HttpsError(
        "not-found",
        `Organization with ID ${orgId} not found.`
      );
    }

    const orgData = orgDoc.data() || {};

    const publicOrgData = {
      id: orgDoc.id,
      companyName: orgData.companyName || "N/A",
      companyDescription:
        orgData.companyDescription || "No description provided.",
      industry: orgData.industry || "N/A",
      location: orgData.location || "N/A",
      logoUrl: orgData.logoUrl || "",
      missionStatement:
        orgData.missionStatement || "No mission statement provided.",
      companyValues: orgData.companyValues || [], // Expose company values if desired
      workEnvironment: {
        // Expose non-sensitive parts of work environment
        techMaturity: orgData.workEnvironment?.techMaturity || "N/A",
        structure: orgData.workEnvironment?.structure || "N/A",
        pace: orgData.workEnvironment?.pace || "N/A",
        // Add other public-safe workEnvironment fields
      },
      // Do NOT include hiringManagers, payment info, stripe IDs, etc.
    };

    return {
      success: true,
      organization: publicOrgData,
    };
  } catch (error) {
    console.error(`Error fetching public org details for org ${orgId}:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError(
      "internal",
      `An unexpected error occurred while fetching organization details for orgId: ${orgId}.`,
      error.message
    );
  }
});
