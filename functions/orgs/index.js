const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { HttpsError } = require("firebase-functions/v2/https");

exports.createJob = onCall(async (request) => {
  try {
    const data = request.data;
    console.log(request.data);

    // Validate required fields
    if (
      !data.orgId ||
      !Array.isArray(data.hiringManagerIds) ||
      data.hiringManagerIds.length === 0 ||
      !data.jobTitle ||
      !data.jobDescription
    ) {
      console.log(
        !data.orgId,
        data.hiringManagerIds.length === 0,
        !data.jobTitle,
        !data.jobDescription
      );
      throw new HttpsError(
        "invalid-argument",
        "Missing required fields: orgId, hiringManagerIds, jobTitle, or jobDescription"
      );
    }

    // Create a new job document
    const jobRef = admin.firestore().collection("jobs").doc();
    const createdAt = admin.firestore.Timestamp.now();

    const jobData = {
      jobTitle: data.jobTitle,
      applicationDeadline: data.applicationDeadline || "",
      applications: [],
      hiringManagerIds: data.hiringManagerIds,
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

    // Create the job document
    await jobRef.set(jobData);

    // Add the job to the org's jobs array
    const orgRef = admin.firestore().collection("orgs").doc(data.orgId);
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

// exports.getJobsByOrgId = onCall(async (request) => {
//   try {
//     const { orgId } = request.data;

//     if (!orgId) {
//       throw new HttpsError("invalid-argument", "orgId is required");
//     }

//     // Get all jobs for this org
//     const orgDoc = await admin.firestore().collection("orgs").doc(orgId).get();
//     let jobs = [];
//     if (orgDoc.exists) {
//       jobs = orgDoc.data().jobIds;
//     }

//     console.log("Fetched jobs:", jobs); // Add logging to help debug

//     // fetch the entire job object

//     return {
//       success: true,
//       data: jobs,
//     };
//   } catch (error) {
//     console.error("Error fetching jobs:", error);
//     throw new HttpsError("internal", "Error fetching jobs");
//   }
// });

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
    let jobIds = [];
    if (orgDoc.exists) {
      const data = orgDoc.data();
      if (data && data.jobIds && Array.isArray(data.jobIds)) {
        jobIds = data.jobIds;
      }
    }

    if (jobIds.length === 0) {
      console.log("No jobs found for orgID: ", orgId);
      return {
        success: true,
        data: [],
      };
    }
    // get each ref that pertains to each id in jobIds

    // right now jobIds looks like -> [1ZotxmT8Ski3yU6zctad, AfZh9ucHJ6S0cpFBMnDy] which is just Ids, not the object, on the frontend we would
    // need to either fetch again or do it here so lets do it here
    const jobDocRefs = jobIds.map((id) => jobsCollection.doc(id));

    // fetch all job documents using getAll()
    // getAll takes a spread array of document references
    const jobDocSnapshots = await admin.firestore().getAll(...jobDocRefs);

    // process now

    const populatedJobs = jobDocSnapshots
      .map((docSnapshot) => {
        if (docSnapshot.exists) {
          return { id: docSnapshot.id, ...docSnapshot.data() };
        } else {
          // job id is in jobIds but doesnt exist in our db
          console.warn(`Job document with ID ${docSnapshot.id} not found.`);
          return null;
        }
      })
      .filter((job) => job !== null);

    return {
      success: true,
      jobIds,
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
});

exports.addNewJobIdToOrg = onCall(async (request) => {
  const { newJobId, orgId } = request.data;
  const orgRef = admin.firestore().collection("orgs").doc(orgId);

  const orgDoc = await orgRef.get();
  if (!orgDoc.exists) {
    throw new HttpsError("not-found", "Organization not found.");
  }
  const jobs = orgDoc.data().jobIds || []; // Default to empty array

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
  const data = request.data;

  try {
    if (!data.companyName || !data.userId) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required fields for organization creation"
      );
    }

    // Check if an org with this name already exists
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

    // Create the organization document
    const orgRef = admin.firestore().collection("orgs").doc();
    const createdAt = admin.firestore.Timestamp.now();

    const orgData = {
      companyDescription: data.companyDescription || "",
      companyName: data.companyName,
      companySize: data.companySize || "",
      createdAt: createdAt,
      industry: data.industry || "",
      location: data.location || "",
      logoUrl: data.logoUrl || "",
      missionStatement: data.missionStatement || "",
      hiringManagerIds: [data.userId],
      jobIds: data.jobIds || [],
      paymentPlanCanceledDate: data.paymentPlanCanceledDate || "",
      paymentPlanCanceledReason: data.paymentPlanCanceledReason || "",
      paymentPlanEndDate: data.paymentPlanEndDate || "",
      paymentPlanStartDate: data.paymentPlanStartDate || "",
      paymentPlanStatus: data.paymentPlanStatus || "",
      paymentPlanTier: data.paymentPlanTier || "",
      stripeCustomerId: data.stripeCustomerId || "",
      stripeSubscriptionId: data.stripeSubscriptionId || "",
    };

    // Use a batch write to ensure both documents are created atomically
    const batch = admin.firestore().batch();

    // Add the org document
    batch.set(orgRef, orgData);

    // Add the hiring manager user document
    const userRef = admin.firestore().collection("users").doc(data.userId);

    batch.update(userRef, {
      role: "hiring-manager",
      organizations: admin.firestore.FieldValue.arrayUnion(orgRef.id),
    });

    // Commit the batch
    await batch.commit();

    return {
      success: true,
      orgId: orgRef.id,
      hiringManagerIds: [data.userId],
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
    const creatorOrgsRef = admin
      .firestore()
      .collection("orgs")
      .where("createdByEmail", "==", userEmail);

    // Query for orgs where user is the hiring manager
    const hiringManagerOrgsRef = admin
      .firestore()
      .collection("orgs")
      .where("createdLoginEmail", "==", userEmail);

    // Execute both queries in parallel
    const [creatorOrgsSnapshot, hiringManagerOrgsSnapshot] = await Promise.all([
      creatorOrgsRef.get(),
      hiringManagerOrgsRef.get(),
    ]);

    // Combine and deduplicate results
    const allOrgs = new Map();

    // Add creator orgs
    creatorOrgsSnapshot.docs.forEach((doc) => {
      allOrgs.set(doc.id, doc.data());
    });

    // Add hiring manager orgs
    hiringManagerOrgsSnapshot.docs.forEach((doc) => {
      allOrgs.set(doc.id, doc.data());
    });

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
    let userOrgs = [];
    if (userDoc.exists) {
      userOrgs = userDoc.data().organizations;
    }

    if (userOrgs.length === 0) {
      return {
        success: false,
        message: "No organizations found",
      };
    }

    const orgFetches = userOrgs.map((orgId) =>
      admin.firestore().collection("orgs").doc(orgId).get()
    );

    const orgDocs = await Promise.all(orgFetches);

    const orgData = orgDocs
      .filter((doc) => doc.exists)
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        };
      });

    return {
      success: true,
      orgs: orgData,
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    throw new HttpsError("internal", "Error fetching user");
  }
});
