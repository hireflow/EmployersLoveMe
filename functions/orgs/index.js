const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { HttpsError } = require("firebase-functions/v2/https");

// User who owns companies can log in and manage orgs
// This user will give the hiring manager the created login credentials for the org
// Hiring manager can log in and we will pre load the org (singular) that this account was made for
// const orgSchema = {
//   id: String,
//   name: String,
//   createdById: String, // Reference to user who created the organization
//   createdByEmail: String,
//   createdLoginEmail: String,
//   createdLoginPassword: String,
//   createdAt: Timestamp,

//   // not implemented yet
//   stripeCustomerId: String,
//   stripeSubscriptionId: String,
//   paymentPlanTier: String,
//   paymentPlanStatus: String,
//   paymentPlanStartDate: Timestamp,
//   paymentPlanEndDate: Timestamp,
//   paymentPlanCanceledDate: Timestamp,
//   paymentPlanCanceledReason: String,
//   logoUrl: String,
// };

exports.createJob = onCall(async (request) => {
  try {
    const {
      orgId,
      hiringManagerId,
      jobTitle,
      jobDepartment,
      jobDescription,
      jobLocation,
      jobSalary,
      employmentType,
      expectedJobDuration,
      applicationDeadline,
      salaryRange,
      responsibilities,
      requiredSkills,
      preferredSkills,
      minExperience,
      requiredCertifications,
      educationRequirements,
      workEnvironment,
      teamDynamics,
      growthOpportunities,
      interviewStages,
      diversityInitiatives,
      benefitsPackage,
      remoteWorkPolicy,
      travelRequirements,
      onboardingProcess,
      teamSize,
      techStack,
      candidateResourceLinks,
    } = request.data;

    // Validate required fields
    if (!orgId || !hiringManagerId || !jobTitle || !jobDescription) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required fields: orgId, hiringManagerId, jobTitle, or jobDescription"
      );
    }

    // Create a new job document
    const jobRef = admin.firestore().collection("jobs").doc();
    const createdAt = admin.firestore.Timestamp.now();

    const jobData = {
      id: jobRef.id,
      orgId,
      hiringManagerId,
      jobTitle,
      jobDepartment,
      jobDescription,
      jobLocation,
      jobSalary,
      employmentType,
      expectedJobDuration,
      applicationDeadline,
      salaryRange,
      responsibilities,
      requiredSkills,
      preferredSkills,
      minExperience,
      requiredCertifications,
      educationRequirements,
      workEnvironment,
      teamDynamics,
      growthOpportunities,
      interviewStages,
      diversityInitiatives,
      benefitsPackage,
      remoteWorkPolicy,
      travelRequirements,
      onboardingProcess,
      teamSize,
      techStack,
      candidateResourceLinks,
      createdAt,
      status: "active",
      applications: [], // we will store user data, resume and CV, our report , and interview prep
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
    const jobsSnapshot = await admin
      .firestore()
      .collection("jobs")
      .where("orgId", "==", orgId)
      .get();

    const jobs = jobsSnapshot.docs.map((doc) => doc.data());
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

exports.addNewJobIdToOrg = onCall(async (request) => {
  const { newJobId, orgId } = request.data;
  const orgRef = admin.firestore().collection("orgs").doc(orgId);

  const orgData = await orgRef.get();
  const jobIds = orgData.data().jobs;

  if (!jobIds.includes(newJobId)) {
    await orgRef.update({
      jobs: [...jobIds, newJobId],
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
    name,
    createdById,
    createdByEmail,
    createdLoginEmail,
    createdLoginPassword,
    companySize,
    industry,
    location,
    companyDescription,
    missionStatement,
    companyValues,
  } = request.data;

  try {
    // Validate required fields
    if (
      !name ||
      !createdById ||
      !createdByEmail ||
      !createdLoginEmail ||
      !createdLoginPassword
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
      .where("name", "==", name)
      .get();

    if (!existingOrg.empty) {
      throw new HttpsError(
        "already-exists",
        "An organization with this name already exists"
      );
    }

    // Create the hiring manager user first
    let hiringManagerUser;
    try {
      hiringManagerUser = await admin.auth().createUser({
        email: createdLoginEmail,
        password: createdLoginPassword,
        displayName: `${name} Manager`,
      });
    } catch (error) {
      console.error("Error creating hiring manager:", error);
      throw new HttpsError(
        "internal",
        error.message || "Error creating hiring manager account"
      );
    }

    // Create the organization document
    const orgRef = admin.firestore().collection("orgs").doc();
    const createdAt = admin.firestore.Timestamp.now();

    const orgData = {
      id: orgRef.id,
      name,
      createdById,
      createdByEmail,
      createdLoginEmail,
      createdAt,
      companySize,
      industry,
      location,
      companyDescription,
      missionStatement,
      companyValues,
      jobIds: [],
      hiringManagerId: hiringManagerUser.uid,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      paymentPlanTier: "free",
      paymentPlanStatus: "active",
      paymentPlanStartDate: createdAt,
      paymentPlanEndDate: null,
      paymentPlanCanceledDate: null,
      paymentPlanCanceledReason: null,
      logoUrl: null,
    };

    // Use a batch write to ensure both documents are created atomically
    const batch = admin.firestore().batch();

    // Add the org document
    batch.set(orgRef, orgData);

    // Add the hiring manager user document
    const userRef = admin
      .firestore()
      .collection("users")
      .doc(hiringManagerUser.uid);
      
    batch.set(userRef, {
      role: "hiring_manager",
      orgId: orgRef.id,
      createdAt,
      organizations: [orgRef.id],
      email: createdLoginEmail,
      displayName: `${name} Manager`,
    });

    // Commit the batch
    await batch.commit();

    return {
      success: true,
      orgId: orgRef.id,
      hiringManagerId: hiringManagerUser.uid,
      message: "Organization created successfully",
    };
  } catch (error) {
    console.error("Error creating organization:", error);

    // If we created a user but failed later, clean up
    if (error.hiringManagerId) {
      try {
        await admin.auth().deleteUser(error.hiringManagerId);
      } catch (cleanupError) {
        console.error("Error cleaning up hiring manager:", cleanupError);
      }
    }

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
  const createdByEmail = request.data.createdByEmail;

  try {
    const orgRefs = admin
      .firestore()
      .collection("orgs")
      .where("createdByEmail", "==", createdByEmail);

    const orgDocs = await orgRefs.get();
    const orgData = orgDocs.docs.map((doc) => doc.data());

    if (orgDocs.empty) {
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
