const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { HttpsError } = require("firebase-functions/v2/https");

// User who owns companies can log in and manage orgs
// This user will give the hiring manager the created login credentials for the org
// Hiring manager can log in and we will pre load the org (singular) that this account was made for
// org
// {
//     orgID:{
//         companyDescription:
//         companyName:
//         companySize:
//         createdAt:
//         hiringManagers: array [userId]
//         industry:
//         location:
//         logoUrl:
//         missionStatement: 
//         jobIds: array [jobId1]
//         paymentPlanCanceledDate:
//         paymentPlanCanceledReason:
//         paymentPlanEndDate:
//         paymentPlanStartDate:
//         paymentPlanStatus:
//         paymentPlanTier:
//         stripeCustomerId:
//         stripeSubscriptionId:
//     }
// }

exports.createJob = onCall(async (request) => {
  try {
    const {
      jobTitle,
      applicationDeadline,
      applications,
      hiringManagerIds,
      orgId,
      requiredEducation,
      requiredCertifications,
      requiredSkills,
      preferredSkills,
      requiredQuestions,
      candidateResourceLinks,
      jobType,
      interviewStages,
      jobDepartment,
      jobDescription,
      jobLocation,
      teamSize,
      techStack,
      travelRequirements
    } = request.data;

    // Validate required fields
    if (!orgId || !hiringManagerIds || !jobTitle || !jobDescription) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required fields: orgId, hiringManagerIds, jobTitle, or jobDescription"
      );
    }

    // Create a new job document
    const jobRef = admin.firestore().collection("jobs").doc();
    const createdAt = admin.firestore.Timestamp.now();

    const jobData = {
      jobTitle,
      applicationDeadline,
      applications,
      hiringManagerIds,
      orgId,
      requiredEducation,
      requiredCertifications,
      requiredSkills,
      preferredSkills,
      requiredQuestions,
      candidateResourceLinks,
      jobType,
      interviewStages,
      jobDepartment,
      jobDescription,
      jobLocation,
      teamSize,
      techStack,
      travelRequirements,
      createdAt,
      status: "active",
      applications: [],
    };

    // Create the job document
    await jobRef.set(jobData);

    // Add the job to the org's jobs array
    const orgRef = admin.firestore().collection("orgs").doc(orgId);
    const orgDoc = await orgRef.get();

    if (!orgDoc.exists) {
      throw new HttpsError("not-found", "Organization not found");
    }

    await orgRef.update({
      jobIds: admin.firestore.FieldValue.arrayUnion(jobRef.id),
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
    throw new HttpsError("internal", "Error creating job");
  }
});

exports.getJobsByOrgId = onCall(async (request) => {
  try {
    const { orgId } = request.data;

    if (!orgId) {
      throw new HttpsError("invalid-argument", "orgId is required");
    }

    // Get all jobs for this org
    const orgDoc = await admin.firestore().collection("orgs").doc(orgId).get();
    let jobs = [];
    if (orgDoc.exists) {
      jobs = orgDoc.data().jobIds;
    }

    console.log("Fetched jobs:", jobs); // Add logging to help debug

    return {
      success: true,
      data: jobs,
    };
  } catch (error) {
    console.error("Error fetching jobs:", error);
    throw new HttpsError("internal", "Error fetching jobs");
  }
});

exports.updateJobById = onCall(async (request) => {
  const { jobId, updatedJobData } = request.data;

  const jobRef = admin.firestore().collection("jobs").doc(jobId);
  await jobRef.update(updatedJobData);

  return {
    success: true,
    message: "Job updated successfully",
  };
});

exports.addNewJobIdToOrg = onCall(async (request) => {
  const { newJobId, orgId } = request.data;
  const orgRef = admin.firestore().collection("orgs").doc(orgId);

  const orgData = await orgRef.get();
  const jobs = orgData.data().jobIds;

  if (!jobs.includes(newJobId)) {
    await orgRef.update({
      jobIds: [...jobs, newJobId],
    });
  } else {
    throw new HttpsError("already-exists", "Job already exists in org");
  }

  return {
    success: true,
    message: "Jobs updated successfully",
  };
});

exports.createOrg = onCall(async (request) => {
  const {
    userId,
    companyDescription,
    companyName,
    companySize,
    industry,
    location,
    logoUrl,
    missionStatement,
    paymentPlanCanceledDate,
    paymentPlanCanceledReason,
    paymentPlanEndDate,
    paymentPlanStartDate,
    paymentPlanStatus,
    paymentPlanTier,
    stripeCustomerId,
    stripeSubscriptionId,
  } = request.data;

  try {
    // Validate required fields

    console.log("request", request.data)
    if (
      !companyName ||
      !userId
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required fields for organization creation"
      );
    }

    // Check if an org with this name already exists
    const existingOrg = await admin
      .firestore()
      .collection("orgs")
      .where("companyName", "==", companyName)
      .get();

    if (!existingOrg.empty) {
      throw new HttpsError(
        "already-exists",
        "An organization with this name already exists"
      );
    }

    // Create the organization document
    const orgRef = admin.firestore().collection("orgs").doc();
    const createdAt = admin.firestore.Timestamp.now();

    const orgData = {
      companyDescription,
      companyName,
      companySize,
      createdAt,
      industry,
      location,
      logoUrl,
      missionStatement,
      hiringManagerIds: [userId],
      jobIds: [],
      paymentPlanCanceledDate,
      paymentPlanCanceledReason,
      paymentPlanEndDate,
      paymentPlanStartDate,
      paymentPlanStatus,
      paymentPlanTier,
      stripeCustomerId,
      stripeSubscriptionId,
    };

    // Use a batch write to ensure both documents are created atomically
    const batch = admin.firestore().batch();

    // Add the org document
    batch.set(orgRef, orgData);

    // Add the hiring manager user document
    const userRef = admin.firestore().collection("users").doc(userId);

    batch.update(userRef, {
      role: "hiring-manager",
      organizations: arrayUnion(orgRef.id),
    });

    // Commit the batch
    await batch.commit();

    return {
      success: true,
      orgId: orgRef.id,
      hiringManagerIds: [userId],
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

exports.fetchUserOrgsByEmail = onCall(async (request) => {
  const userEmail = request.data.userEmail;

  try {
    // Query for orgs where user is the creator
    console.log("1");
    const creatorOrgsRef = admin
      .firestore()
      .collection("orgs")
      .where("createdByEmail", "==", userEmail);

    console.log("2");
    // Query for orgs where user is the hiring manager
    const hiringManagerOrgsRef = admin
      .firestore()
      .collection("orgs")
      .where("createdLoginEmail", "==", userEmail);

    console.log("3");
    // Execute both queries in parallel
    const [creatorOrgsSnapshot, hiringManagerOrgsSnapshot] = await Promise.all([
      creatorOrgsRef.get(),
      hiringManagerOrgsRef.get(),
    ]);

    // Combine and deduplicate results
    const allOrgs = new Map();

    console.log("4");
    // Add creator orgs
    creatorOrgsSnapshot.docs.forEach((doc) => {
      allOrgs.set(doc.id, doc.data());
    });

    console.log("5");
    // Add hiring manager orgs
    hiringManagerOrgsSnapshot.docs.forEach((doc) => {
      allOrgs.set(doc.id, doc.data());
    });
    console.log("6");

    const orgData = Array.from(allOrgs.values());

    if (orgData.length === 0) {
      return {
        success: false,
        message: "No organizations found",
      };
    } else {
      return {
        success: true,
        orgs: orgData,
      };
    }
  } catch (error) {
    console.error("Error fetching user orgs:", error);
    throw new HttpsError("internal", "Error fetching user orgs");
  }
});

exports.fetchUserOrgsById = onCall(async (request) => {
  const userId = request.data.userId;
  console.log(userId);
  try {
    const userRef = admin.firestore().collection("users").doc(userId);
    const userDoc = await userRef.get();
    let userOrgs = []
    if (userDoc.exists) {
      userOrgs = userDoc.data().organizations;
    }
    
    if (userOrgs.length === 0) {
      return {
        success: false,
        message: "No organizations found",
      };
    } else {
      return {
        success: true,
        orgs: userOrgs,
      };
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    throw new HttpsError("internal", "Error fetching user");
  }
});
