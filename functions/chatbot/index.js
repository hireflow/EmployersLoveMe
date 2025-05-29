const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const functions = require("firebase-functions"); // Add this import

let GoogleGenAI; // Declare it outside the try/catch
async function initializeGenAI() {
  if (!GoogleGenAI) {
    GoogleGenAI = (await import("@google/genai")).GoogleGenAI;
  }
}


async function createPrompt({candidateId, orgId, jobId, applicationId}) {
    try {
        const candidateSnapshot = await admin.firestore()
            .collection('candidates')
            .where(admin.firestore.FieldPath.documentId(), '==', candidateId)
            .select('name', 'resumeBreakdown')
            .get();
        const candidateContext = candidateSnapshot.docs[0].data();

        const jobSnapshot = await admin.firestore()
            .collection('jobs')
            .where(admin.firestore.FieldPath.documentId(), '==', jobId)
            .select('jobTitle', 'jobDepartment', 'jobDescription', 'jobLocation', 'jobType', 'riskTolerance', 'requiredEducation', 'requiredCertifications', 'requiredSkills', 'preferredSkills', 'requiredQuestions', 'techStack', 'successCriteria', 'candidatePersona')
            .get();
        const jobContext = jobSnapshot.docs[0].data();

        const orgSnapshot = await admin.firestore()
            .collection("orgs")
            .where(admin.firestore.FieldPath.documentId(), '==', orgId)
            .select('companyName','companyDescription','companySize','industry','location','missionStatement','companyValues','workEnvironment')
            .get();

        const orgContext = orgSnapshot.docs[0].data();

        const systemInstruction = `
            You are an expert AI Job Interviewer for ${orgContext.companyName}. Your primary mission is to conduct a comprehensive and insightful interview to assess the candidate's suitability for the ${jobContext.jobTitle} role. Your interaction should be professional, engaging, and thorough. You need to evaluate skills, experience, problem-solving abilities, and alignment with the job requirements and company culture.

            **1. Organization Context:**
            This section provides details about the company the candidate might work for.
            * **Company Name:** ${orgContext.companyName}
            * **Company Description:** ${orgContext.companyDescription}
            * **Company Size:** ${orgContext.companySize}
            * **Industry:** ${orgContext.industry}
            * **Location:** ${orgContext.location}
            * **Mission Statement:** ${orgContext.missionStatement}
            * **Company Values:**
                * ${orgContext.companyValues.map(value => `${value.name}: ${value.description} (Keywords: ${(value.extractedKeywords || []).join(', ') || 'N/A'}, Weight: ${value.weight || 'N/A'})`).join('\n        * ')}
                * *Instruction for AI:* Formulate questions to see how the candidate's experiences or perspectives align with these values.

            **2. Job Context:**
            This section details the specific role the candidate is being interviewed for.
            * **Job Title:** ${jobContext.jobTitle}
            * **Department:** ${jobContext.jobDepartment}
            * **Job Description (Summary, Influence, Level, Day-to-day):** ${jobContext.jobDescription}
            * **Location:** ${jobContext.jobLocation}
            * **Job Type:** ${jobContext.jobType}
            * **Hiring Manager's Risk Tolerance:** ${jobContext.riskTolerance} (e.g., if low, probe more deeply on critical skills).
            * **Required Education:** ${(jobContext.requiredEducation || []).join(', ')}
            * **Required Certifications:** ${(jobContext.requiredCertifications || []).join(', ')}
            * **Required Skills:**
                * ${(jobContext.requiredSkills || []).map(skill => `${skill.skill} (Required Level: ${skill.level})`).join('\n        * ')}
            * **Preferred Skills:**
                * ${(jobContext.preferredSkills || []).map(skill => `${skill.skill} (Preferred Level: ${skill.level})`).join('\n        * ')}
            * **Tech Stack:**
                * **Architecture:** ${jobContext.techStack.architecture}
                * **Scale:** ${jobContext.techStack.scale}
                * **Key Challenges:** ${(jobContext.techStack.challenges || []).join(', ')}
                * **Development Practices:** ${(jobContext.techStack.practices || []).join(', ')}
                * **Specific Tools/Technologies:**
                    * ${(jobContext.techStack.stack || []).map(item => `${item.skill} (Level: ${item.level}, Real-world Application: ${item.realWorldApplication}, Potential Red Flags: ${(item.redFlags || []).join(', ') || 'None'}, Weight: ${item.weight})`).join('\n            * ')}
                * *Instruction for AI:* Ask specific questions about the candidate's experience with these tools, their understanding of the architecture, and how they've handled similar challenges or applied these practices. Focus on real-world application.
            * **Success Criteria:**
                * **Immediate (3-6 months):**
                    * ${(jobContext.successCriteria.immediate || []).map(criterion => `${criterion.metric}: ${criterion.description} (Weight: ${criterion.weight})`).join('\n            * ')}
                * **Long-Term (6-12+ months):**
                    * ${(jobContext.successCriteria.longTerm || []).map(criterion => `${criterion.metric}: ${criterion.description} (Weight: ${criterion.weight})`).join('\n            * ')}
                * *Instruction for AI:* Frame some questions to gauge the candidate's potential to meet these success criteria.
            * **Work Environment:**
                * **Tech Maturity:** ${orgContext.workEnvironment.techMaturity}
                * **Structure:** ${orgContext.workEnvironment.structure}
                * **Communication:** ${orgContext.workEnvironment.communication}
                * **Pace:** ${orgContext.workEnvironment.pace}
                * **Growth Expectations:** ${orgContext.workEnvironment.growthExpectations}
                * **Collaboration:** ${orgContext.workEnvironment.collaboration}
                * **Team Size:** ${orgContext.workEnvironment.teamSize}
                * *Instruction for AI:* Consider these aspects when assessing fit and when the candidate asks questions about the environment.
            * **Ideal Candidate Persona:** "${jobContext.candidatePersona}"
            * **Required Questions/Topics (MUST BE COVERED):**
                * ${(jobContext.requiredQuestions || []).join('\n        * ')}

            **3. Candidate Context:**
            This section provides information about the candidate you are interviewing.
            * **Candidate Name:** ${candidateContext.name}
            * **Resume Breakdown:**
                * Resume Information ${candidateContext.resumeBreakdown}
                * *Instruction for AI:* **Crucially, tailor your questions to this specific candidate.** Compare their resume details (experience, skills, projects) against the job requirements (Required Skills, Preferred Skills, Tech Stack).
                    * Identify and probe any discrepancies or gaps.
                    * Ask for specific examples from their past roles that demonstrate the required skills or handling of tech stack components.
                    * If they list a skill that is also a required skill, ask them to elaborate on their proficiency and provide examples related to the ${jobContext.jobDescription} or ${jobContext.techStack.realWorldApplication}.

            **4. Your Interviewing Task:**
            * **Objective:** Assess the candidate's suitability for the ${jobContext.jobTitle} role thoroughly.
            * **Question Types:** Employ a mix of behavioral ("Tell me about a time..."), technical (specific to ${ (jobContext.requiredSkills || []).map(s=>s.skill).join(', ') } and ${ (jobContext.techStack.stack || []).map(t=>t.skill).join(', ') }), situational ("How would you approach X scenario related to ${ (jobContext.techStack.challenges || []).join(' or ') }?"), and cultural fit questions (aligned with ${ (orgContext.companyValues || []).map(v=>v.name).join(', ') }).
            * **Question Generation:**
                * Start with an introduction.
                * Your questions must be deeply rooted in the provided \`jobContext\`, \`orgContext\`, and \`candidateContext\`.
                * Prioritize questions that address the \`requiredSkills\`, \`requiredQuestions\`, and \`techStack\`.
                * Probe into the candidate's understanding of the \`realWorldApplication\` for skills in the \`techStack\`.
                * Identify and investigate potential \`redFlags\` noted in the \`techStack\`.
            * **Engagement:** Maintain a conversational flow. Listen to the candidate's answers and ask relevant follow-up questions.
            * **Evaluation (Implicit):** While you are conducting the interview, you should be forming an assessment based on the candidate's responses, particularly concerning the \`successCriteria\` and \`candidatePersona\`. (Note: Actual scoring might be a separate step or require further prompting).

            **Initiate the Interview:**
            Please begin by introducing yourself as an AI interviewer from ${orgContext.companyName}, briefly mention the ${jobContext.jobTitle} role, and then ask your first tailored question to ${candidateContext.name}.

        `;

        await admin.firestore()
        .collection('applications')
        .doc(applicationId) 
        .update({
            chatPrompt: systemInstruction
        });

        return {
            systemInstruction: systemInstruction
        };
    }
    catch (error) {
        console.error("Error crafting prompt:", error);
        throw new HttpsError("internal", "Error crafting prompt.");
    }

    

    //ONCE RESUME IS STRUCTURED
    //     * {/* If resumeBreakdown is structured JSON, insert it here. */}
    // * {/* If resumeBreakdown is unstructured text (e.g., the raw resume), insert it here. You might add: "Analyze the following resume details carefully:" */}
    // * *Example if structured (ensure candidateContext.resumeBreakdown has these properties):*
    //     * **Summary:** ${candidateContext.resumeBreakdown.summary}
    //     * **Years of Experience:** ${candidateContext.resumeBreakdown.yearsOfExperience}
    //     * **Skills from Resume:** ${(candidateContext.resumeBreakdown.skills || []).join(', ')}
    //     * **Recent Role:** ${candidateContext.resumeBreakdown.recentRole ? `${candidateContext.resumeBreakdown.recentRole.title} at ${candidateContext.resumeBreakdown.recentRole.company} for ${candidateContext.resumeBreakdown.recentRole.duration}` : 'N/A'}


    // const geminiToolConfig = [
    //     {
    //         functionDeclarations: [
    //             {
    //                 name: "makeQuestion",
    //                 description: "Generates a specific interview question tailored to the provided criteria. Use this to create targeted technical, behavioral, or situational questions based on job requirements, company values, or candidate background. The LLM should populate the context parameters with the most relevant information for the question it intends to generate.",
    //                 parameters: {
    //                     type: "OBJECT",
    //                     properties: {
    //                         // jobContext: Corresponds to the 'jobs' schema
    //                         jobContext: {
    //                             type: "OBJECT",
    //                             description: "Relevant context about the job role.",
    //                             properties: {
    //                                 jobTitle: { type: "STRING", description: "The title of the job." },
    //                                 jobDepartment: { type: "STRING", description: "The department the job belongs to." },
    //                                 jobDescription: { type: "STRING", description: "A summary of the job, including influence, level, and day-to-day activities." },
    //                                 jobLocation: { type: "STRING", description: "The location of the job." },
    //                                 jobType: { type: "STRING", description: "The type of employment (e.g., Full-time, Contract)." },
    //                                 riskTolerance: { type: "STRING", description: "The hiring manager's risk tolerance for this role (e.g., high, medium, low)." },
    //                                 requiredEducation: {
    //                                     type: "ARRAY",
    //                                     items: { type: "STRING" },
    //                                     description: "List of required educational qualifications."
    //                                 },
    //                                 requiredCertifications: {
    //                                     type: "ARRAY",
    //                                     items: { type: "STRING" },
    //                                     description: "List of required certifications."
    //                                 },
    //                                 requiredSkills: {
    //                                     type: "ARRAY",
    //                                     items: {
    //                                         type: "OBJECT",
    //                                         properties: {
    //                                             skill: { type: "STRING", description: "Name of the required skill." },
    //                                             level: { type: "STRING", description: "Required proficiency level for the skill (e.g., proficient, expert)." }
    //                                         }
    //                                     },
    //                                     description: "List of required skills and their expected proficiency levels."
    //                                 },
    //                                 preferredSkills: {
    //                                     type: "ARRAY",
    //                                     items: {
    //                                         type: "OBJECT",
    //                                         properties: {
    //                                             skill: { type: "STRING", description: "Name of the preferred skill." },
    //                                             level: { type: "STRING", description: "Preferred proficiency level for the skill." }
    //                                         }
    //                                     },
    //                                     description: "List of preferred skills and their desired proficiency levels."
    //                                 },
    //                                 requiredQuestions: {
    //                                     type: "ARRAY",
    //                                     items: { type: "STRING" },
    //                                     description: "Specific questions that must be asked or topics that must be covered during the interview."
    //                                 },
    //                                 techStack: {
    //                                     type: "OBJECT",
    //                                     description: "Details about the technology stack used for the role.",
    //                                     properties: {
    //                                         stack: {
    //                                             type: "ARRAY",
    //                                             items: {
    //                                                 type: "OBJECT",
    //                                                 properties: {
    //                                                     skill: { type: "STRING", description: "Specific tool, technology, or platform." },
    //                                                     level: { type: "STRING", description: "Required or expected level of expertise." },
    //                                                     realWorldApplication: { type: "STRING", description: "Expected real-world application of the skill." },
    //                                                     redFlags: { type: "ARRAY", items: { type: "STRING" }, description: "Potential red flags related to this skill." },
    //                                                     weight: { type: "NUMBER", description: "Relative importance of this skill in the tech stack." }
    //                                                 }
    //                                             },
    //                                             description: "List of specific technologies, tools, and platforms."
    //                                         },
    //                                         architecture: { type: "STRING", description: "Overall system architecture (e.g., microservices, monolithic)." },
    //                                         scale: { type: "STRING", description: "The scale at which the system operates (e.g., 10M+ users)." },
    //                                         challenges: { type: "ARRAY", items: { type: "STRING" }, description: "Key technical challenges." },
    //                                         practices: { type: "ARRAY", items: { type: "STRING" }, description: "Development practices (e.g., TDD, CI/CD)." }
    //                                     }
    //                                 },
    //                                 successCriteria: {
    //                                     type: "OBJECT",
    //                                     description: "Criteria defining success in the role.",
    //                                     properties: {
    //                                         immediate: {
    //                                             type: "ARRAY",
    //                                             items: {
    //                                                 type: "OBJECT",
    //                                                 properties: {
    //                                                     metric: { type: "STRING", description: "Success metric." },
    //                                                     description: { type: "STRING", description: "Description of the success metric." },
    //                                                     weight: { type: "NUMBER", description: "Relative importance of the metric." }
    //                                                 }
    //                                             },
    //                                             description: "Short-term success criteria (e.g., first 3-6 months)."
    //                                         },
    //                                         longTerm: {
    //                                             type: "ARRAY",
    //                                             items: {
    //                                                 type: "OBJECT",
    //                                                 properties: {
    //                                                     metric: { type: "STRING", description: "Success metric." },
    //                                                     description: { type: "STRING", description: "Description of the success metric." },
    //                                                     weight: { type: "NUMBER", description: "Relative importance of the metric." }
    //                                                 }
    //                                             },
    //                                             description: "Long-term success criteria (e.g., 6-12+ months)."
    //                                         }
    //                                     }
    //                                 },
    //                                 workEnvironment: {
    //                                     type: "OBJECT",
    //                                     description: "Details about the work environment and team dynamics.",
    //                                     properties: {
    //                                         techMaturity: { type: "STRING", description: "Technological maturity of the organization or team." },
    //                                         structure: { type: "STRING", description: "Team or organizational structure (e.g., autonomous, hierarchical)." },
    //                                         communication: { type: "STRING", description: "Primary communication style (e.g., async-first, meetings-heavy)." },
    //                                         pace: { type: "STRING", description: "Pace of work (e.g., sprint-based, steady)." },
    //                                         growthExpectations: { type: "STRING", description: "Expectations for employee growth and development (e.g., self-directed, structured)." }, // Corrected spelling
    //                                         collaboration: { type: "STRING", description: "Nature of collaboration (e.g., cross-functional, siloed)." },
    //                                         teamSize: { type: "STRING", description: "Typical size of the team." } // Using STRING for flexibility e.g., "5-7 people"
    //                                     }
    //                                 },
    //                                 candidatePersona: { type: "STRING", description: "Description of the ideal candidate profile, including soft skills and work style." },
    //                                 interviewStages: {
    //                                     type: "ARRAY",
    //                                     items: { type: "STRING" },
    //                                     description: "Different stages of the interview process for this job."
    //                                 }
    //                             }
    //                         },
    //                         // orgContext: Corresponds to the 'org' schema
    //                         orgContext: {
    //                             type: "OBJECT",
    //                             description: "Relevant context about the organization.",
    //                             properties: {
    //                                 companyName: { type: "STRING", description: "Name of the company." },
    //                                 companyDescription: { type: "STRING", description: "A brief description of the company." },
    //                                 companySize: { type: "STRING", description: "The size of the company (e.g., number of employees)." },
    //                                 industry: { type: "STRING", description: "The industry the company operates in." },
    //                                 location: { type: "STRING", description: "Primary location of the company." },
    //                                 missionStatement: { type: "STRING", description: "The company's mission statement." },
    //                                 companyValues: {
    //                                     type: "ARRAY",
    //                                     items: {
    //                                         type: "OBJECT",
    //                                         properties: {
    //                                             name: { type: "STRING", description: "Name of the company value." },
    //                                             description: { type: "STRING", description: "Description of the company value." },
    //                                             extractedKeywords: { type: "ARRAY", items: { type: "STRING" }, description: "Keywords associated with the value (optional)." },
    //                                             weight: { type: "NUMBER", description: "Relative importance of the value (optional)." }
    //                                         }
    //                                     },
    //                                     description: "List of core company values."
    //                                 }
    //                             }
    //                         },
    //                         // candidateContext: Corresponds to the 'candidates' schema
    //                         candidateContext: {
    //                             type: "OBJECT",
    //                             description: "Relevant context about the candidate being interviewed.",
    //                             properties: {
    //                                 name: { type: "STRING", description: "The candidate's full name." },
    //                                 resumeBreakdown: {
    //                                     type: "OBJECT",
    //                                     description: "Structured information parsed from the candidate's resume.",
    //                                     // NOT YET STRUCTURED
    //                                     // properties: {
    //                                     //     summary: { type: "STRING", description: "A brief summary from the resume." },
    //                                     //     yearsOfExperience: { type: "NUMBER", description: "Total relevant years of experience." },
    //                                     //     skills: { type: "ARRAY", items: { type: "STRING" }, description: "List of skills mentioned in the resume." },
    //                                     //     recentRole: {
    //                                     //         type: "OBJECT",
    //                                     //         properties: {
    //                                     //             title: { type: "STRING" },
    //                                     //             company: { type: "STRING" },
    //                                     //             duration: { type: "STRING" }
    //                                     //         },
    //                                     //         description: "Details of the most recent or relevant role."
    //                                     //     }
    //                                     // }
    //                                 },
    //                             }
    //                         },
    //                     },
    //                     required: ["jobContext", "orgContext", "candidateContext"]
    //                 },
    //             }
    //         ]
    //     }
    // ];

    // const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

    // const response = await ai.models.generateContent({
    //   model: "gemini-2.0-flash",
    //   contents: "",
    //   tools: geminiToolConfig,
    // });

    // console.log(response.text);
}

exports.geminiChatbot = onCall(async (request) => {
  await initializeGenAI();

  const GEMINI_KEY = process.env.GEMINI_API_KEY;

  const genAI = new GoogleGenAI({ apiKey: GEMINI_KEY });

  const data = request.data;

  const candidateId = data.candidateId;
  const jobId = data.jobId;
  const orgId = data.orgId;
  const applicationId = data.applicationId;
  const userMessage = data.message;
  const chatHistory = data.history || [];

  if (!userMessage) {
    throw new HttpsError("invalid-argument", "Need a message to send");
  }
  
  try {
    const doc = await admin.firestore().collection('applications').doc(applicationId).get();
    if (!doc.exists) {
        console.log('No application with given ID!');
        return;
    }
    let systemInstruction;

    if ('chatPrompt' in doc.data()) {
        systemInstruction = doc.data().chatPrompt;
    } else {
        res = await createPrompt({candidateId, orgId, jobId, applicationId});
        systemInstruction = res.systemInstruction;
    }

    const chat = genAI.chats.create({
      model: "gemini-2.5-flash-preview-05-20",
      history: chatHistory,
      config: {
        temperature: 0.5,
        systemInstruction: systemInstruction,
      },
    });

    const result = await chat.sendMessage(userMessage);
    const text = result.candidates[0].content.parts[0].text;

    return { response: text };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new HttpsError("internal", "Failed to get response from AI");
  }
});