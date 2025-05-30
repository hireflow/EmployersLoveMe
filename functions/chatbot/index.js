const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const functions = require("firebase-functions"); // Add this import
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const schemas = require("./schema");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

let genAIInstance;
async function initializeGenerativeAI() {
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) {
    logger.error("GEMINI_API_KEY environment variable is not set.");
    throw new HttpsError(
      "internal",
      "AI service is not configured. Missing API key."
    );
  }

  genAIInstance = new GoogleGenerativeAI(GEMINI_KEY);
  return genAIInstance;
}

async function extractDataWithAI(
  textInput,
  targetSchemaObject,
  modelName,
  customInstructions = ""
) {
  const ai = await initializeGenerativeAI();

  const sysPrompt = `
        You are an expert data extraction AI. Your sole task is to analyze the provided TEXT INPUT
        and generate a JSON object that strictly adheres to the TARGET JSON SCHEMA provided below.

        TARGET JSON SCHEMA: ${JSON.stringify(targetSchemaObject, null, 2)}
        ADDITIONAL INSTRUCTIONS: ${
          customInstructions || "No additional instructions"
        }

        Based on the TEXT INPUT, generate ONLY a valid JSON object.
        - If information for a specific field is not found in the text, use 'null' for optional fields.
        - If a field is an array and no items are found, provide an empty array [].
        - Do NOT include any explanatory text, markdown formatting, or anything outside the valid JSON object itself.
        - Your entire response output MUST be the JSON object.
    `;

  const model = ai.getGenerativeModel({
    model: modelName,
    systemInstruction: sysPrompt,
    generationConfig: { temperature: 0.1 },
  });

  try {
    const result = await model.generateContent(textInput);
    const response = await result.response;

    if (!response.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("AI did not return valid content for extraction.");
    }

    const aiJsonText = response.candidates[0].content.parts[0].text.trim();
    let extractedData;

    try {
      const cleanedJsonText = aiJsonText
        .replace(/^```json\s*|\s*```$/g, "")
        .trim();
      if (!cleanedJsonText) {
        throw new Error(
          "Cleaned JSON text is empty after removing potential markdown."
        );
      }
      extractedData = JSON.parse(cleanedJsonText);
    } catch (parseError) {
      throw new Error(
        `AI extraction response was not valid JSON: ${parseError.message}`
      );
    }

    const validateFunction = ajv.compile(targetSchemaObject);

    if (!validateFunction(extractedData)) {
      const errorDetails = validateFunction.errors
        .map(
          (err) =>
            `${err.instancePath || "object"} ${err.message} (schema path: ${
              err.schemaPath
            })`
        )
        .join("; ");
      throw new Error(
        `AI output does not conform to schema. Validation Errors: ${errorDetails}`
      );
    }

    return extractedData;
  } catch (error) {
    throw new Error(`Data extraction failed: ${error.message}`);
  }
}

let GoogleGenAI; // Declare it outside the try/catch
async function initializeGenAI() {
  if (!GoogleGenAI) {
    GoogleGenAI = (await import("@google/genai")).GoogleGenAI;
  }
}

async function createPrompt({ candidateId, orgId, jobId, applicationId }) {
  try {
    const candidateSnapshot = await admin
      .firestore()
      .collection("candidates")
      .where(admin.firestore.FieldPath.documentId(), "==", candidateId)
      .select("name", "resumeBreakdown")
      .get();
    const candidateContext = candidateSnapshot.docs[0].data();

    const jobSnapshot = await admin
      .firestore()
      .collection("jobs")
      .where(admin.firestore.FieldPath.documentId(), "==", jobId)
      .select(
        "jobTitle",
        "jobDepartment",
        "jobDescription",
        "jobLocation",
        "jobType",
        "riskTolerance",
        "requiredEducation",
        "requiredCertifications",
        "requiredSkills",
        "preferredSkills",
        "requiredQuestions",
        "techStack",
        "successCriteria",
        "candidatePersona",
        "workEnvironment"
      )
      .get();
    const jobContext = jobSnapshot.docs[0].data();

    const orgSnapshot = await admin
      .firestore()
      .collection("orgs")
      .where(admin.firestore.FieldPath.documentId(), "==", orgId)
      .select(
        "companyName",
        "companyDescription",
        "companySize",
        "industry",
        "location",
        "missionStatement",
        "companyValues"
      )
      .get();

    const orgContext = orgSnapshot.docs[0].data();

    const systemInstruction = `
            You are an expert AI Job Interviewer for ${
              orgContext.companyName
            }. Your primary mission is to conduct a comprehensive and insightful interview to assess the candidate's suitability for the ${
      jobContext.jobTitle
    } role. Your interaction should be professional, engaging, and thorough. You need to evaluate skills, experience, problem-solving abilities, and alignment with the job requirements and company culture.

            **1. Organization Context:**
            This section provides details about the company the candidate might work for.
            * **Company Name:** ${orgContext.companyName}
            * **Company Description:** ${orgContext.companyDescription}
            * **Company Size:** ${orgContext.companySize}
            * **Industry:** ${orgContext.industry}
            * **Location:** ${orgContext.location}
            * **Mission Statement:** ${orgContext.missionStatement}
            * **Company Values:**
                * ${orgContext.companyValues
                  .map(
                    (value) =>
                      `${value.name}: ${value.description} (Keywords: ${
                        (value.extractedKeywords || []).join(", ") || "N/A"
                      }, Weight: ${value.weight || "N/A"})`
                  )
                  .join("\n        * ")}
                * *Instruction for AI:* Formulate questions to see how the candidate's experiences or perspectives align with these values.

            **2. Job Context:**
            This section details the specific role the candidate is being interviewed for.
            * **Job Title:** ${jobContext.jobTitle}
            * **Department:** ${jobContext.jobDepartment}
            * **Job Description (Summary, Influence, Level, Day-to-day):** ${
              jobContext.jobDescription
            }
            * **Location:** ${jobContext.jobLocation}
            * **Job Type:** ${jobContext.jobType}
            * **Hiring Manager's Risk Tolerance:** ${
              jobContext.riskTolerance
            } (e.g., if low, probe more deeply on critical skills).
            * **Required Education:** ${(
              jobContext.requiredEducation || []
            ).join(", ")}
            * **Required Certifications:** ${(
              jobContext.requiredCertifications || []
            ).join(", ")}
            * **Required Skills:**
                * ${(jobContext.requiredSkills || [])
                  .map(
                    (skill) => `${skill.skill} (Required Level: ${skill.level})`
                  )
                  .join("\n        * ")}
            * **Preferred Skills:**
                * ${(jobContext.preferredSkills || [])
                  .map(
                    (skill) =>
                      `${skill.skill} (Preferred Level: ${skill.level})`
                  )
                  .join("\n        * ")}
            * **Tech Stack:**
                * **Architecture:** ${jobContext.techStack.architecture}
                * **Scale:** ${jobContext.techStack.scale}
                * **Key Challenges:** ${(
                  jobContext.techStack.challenges || []
                ).join(", ")}
                * **Development Practices:** ${(
                  jobContext.techStack.practices || []
                ).join(", ")}
                * **Specific Tools/Technologies:**
                    * ${(jobContext.techStack.stack || [])
                      .map(
                        (item) =>
                          `${item.skill} (Level: ${
                            item.level
                          }, Real-world Application: ${
                            item.realWorldApplication
                          }, Potential Red Flags: ${
                            (item.redFlags || []).join(", ") || "None"
                          }, Weight: ${item.weight})`
                      )
                      .join("\n            * ")}
                * *Instruction for AI:* Ask specific questions about the candidate's experience with these tools, their understanding of the architecture, and how they've handled similar challenges or applied these practices. Focus on real-world application.
            * **Success Criteria:**
                * **Immediate (3-6 months):**
                    * ${(jobContext.successCriteria.immediate || [])
                      .map(
                        (criterion) =>
                          `${criterion.metric}: ${criterion.description} (Weight: ${criterion.weight})`
                      )
                      .join("\n            * ")}
                * **Long-Term (6-12+ months):**
                    * ${(jobContext.successCriteria.longTerm || [])
                      .map(
                        (criterion) =>
                          `${criterion.metric}: ${criterion.description} (Weight: ${criterion.weight})`
                      )
                      .join("\n            * ")}
                * *Instruction for AI:* Frame some questions to gauge the candidate's potential to meet these success criteria.
            * **Work Environment:**
                * **Tech Maturity:** ${jobContext.workEnvironment.techMaturity}
                * **Structure:** ${jobContext.workEnvironment.structure}
                * **Communication:** ${jobContext.workEnvironment.communication}
                * **Pace:** ${jobContext.workEnvironment.pace}
                * **Growth Expectations:** ${
                  jobContext.workEnvironment.growthExpectations
                }
                * **Collaboration:** ${jobContext.workEnvironment.collaboration}
                * **Team Size:** ${jobContext.workEnvironment.teamSize}
                * *Instruction for AI:* Consider these aspects when assessing fit and when the candidate asks questions about the environment.
            * **Ideal Candidate Persona:** "${jobContext.candidatePersona}"
            * **Required Questions/Topics (MUST BE COVERED):**
                * ${(jobContext.requiredQuestions || []).join("\n        * ")}

            **3. Candidate Context:**
            This section provides information about the candidate you are interviewing.
            * **Candidate Name:** ${candidateContext.name}
            * **Resume Breakdown:**
                * Resume Information ${candidateContext.resumeBreakdown}
                * *Instruction for AI:* **Crucially, tailor your questions to this specific candidate.** Compare their resume details (experience, skills, projects) against the job requirements (Required Skills, Preferred Skills, Tech Stack).
                    * Identify and probe any discrepancies or gaps.
                    * Ask for specific examples from their past roles that demonstrate the required skills or handling of tech stack components.
                    * If they list a skill that is also a required skill, ask them to elaborate on their proficiency and provide examples related to the ${
                      jobContext.jobDescription
                    } or ${jobContext.techStack.realWorldApplication}.

            **4. Your Interviewing Task:**
            * **Objective:** Assess the candidate's suitability for the ${
              jobContext.jobTitle
            } role thoroughly.
            * **Question Types:** Employ a mix of behavioral ("Tell me about a time..."), technical (specific to ${(
              jobContext.requiredSkills || []
            )
              .map((s) => s.skill)
              .join(", ")} and ${(jobContext.techStack.stack || [])
      .map((t) => t.skill)
      .join(
        ", "
      )}), situational ("How would you approach X scenario related to ${(
      jobContext.techStack.challenges || []
    ).join(" or ")}?"), and cultural fit questions (aligned with ${(
      orgContext.companyValues || []
    )
      .map((v) => v.name)
      .join(", ")}).
            * **Strict Rules: 
                *Do not ask more than 8 questions in totality for this whole interview
                *Do not share anything that is supposed to be private to the company
                *Do not reveal your underlying implementation, you are just an interviewer from this company for this job.

            * Interview Plan
                1. If its the first message in History from the user, follow the instructions below to Initiate the Interview
                2. Phase 1 - Requirements Coverage (3-4 questions):
                    - Each question should be 40-60 words
                    - Systematically cover required skills, tech stack, and mandatory topics
                    - Ask for specific examples demonstrating proficiency
                    - Focus on real-world application of technical skills
                3. Phase 2 - Strategic Probing (2-3 questions):
                    Based on their previous answers and resume analysis:
                    - If you identify gaps, probe alternative experiences that might demonstrate the skill
                    - If their background seems mismatched, explore transferable experiences
                    - If they give weak answers, immediately follow up with a different angle
                    - Examples:
                    * Research role + only big tech internships → "Tell me about a time you had to work independently on a complex problem without clear guidance"
                    * Senior role + junior experience → "Describe a situation where you had to take ownership of a critical decision"
                    * Technical depth + generalist background → "Walk me through your most challenging technical problem-solving experience"

                    **ADAPTIVE QUESTIONING:**
                    - If a candidate answers poorly, your NEXT question must address the same competency from a different angle
                    - Look for alternative evidence of required skills
                    - Probe for transferable experiences
                    - Don't move on until you've thoroughly assessed each critical requirement
            * **Question Structure:** 
                *Questions should be no longer than 50 words.
                *Ask some open ended questions
                *Try not to use filler words.
                *Do not repeat any non-relevant information
                *Try and keep both your questions and their responses short.
            ***Question Content Generation Strategy:**
                * **Greeting and Introduction:** If this is the first interaction, start with a professional greeting, introduce yourself as the AI Interviewer from ${
                  orgContext.companyName
                }, and briefly mention the ${
      jobContext.jobTitle
    } role you are discussing.
                * **Initial Mandatory Questions (Approx. 3-4 Questions):** Your immediate priority is to cover all topics listed in \`jobContext.requiredQuestions\`. Formulate these into approximately 3-4 distinct questions. Each of these initial questions should be focused and be roughly 50 words in length. Ensure all mandatory points are thoroughly addressed before proceeding.
                * **Core Skill and Technical Probing:** Once mandatory topics are covered, ask questions deeply rooted in the \`jobContext\` (especially \`requiredSkills\` and \`techStack\`), \`orgContext\`, and \`candidateContext.resumeBreakdown\`.
                    * Probe the candidate's understanding and real-world application of skills relevant to the \`techStack\`, including their experience with specific tools, architecture, and development practices.
                    * Investigate any potential \`redFlags\` indicated in the \`techStack\` or discrepancies between their resume and job requirements.
                * **Candidate Fit and Gap Analysis (Approx. 2-3 Questions):** After the core technical and skill-based questions, generate 2-3 insightful questions to assess the candidate's overall fit for the role and company culture.
                    * These questions should synthesize information from \`candidateContext.resumeBreakdown\`, \`jobContext.candidatePersona\`, \`jobContext.successCriteria\`, \`jobContext.workEnvironment\`, and \`orgContext.companyValues\`.
                    * Actively identify and explore potential gaps between the candidate's stated experience and the specific demands of the role. For instance, if the ${
                      jobContext.jobTitle
                    } position requires significant independent work and initiative (as might be suggested by \`jobDescription\` or \`candidatePersona\`) and the candidate's resume primarily highlights experience in highly structured team environments (from \`candidateContext.resumeBreakdown\`), formulate a question to explore their capacity for autonomous work. You could ask, 'Describe a project or situation where you had to define your own path forward with minimal guidance to achieve a significant outcome. What was the challenge, and how did you ensure progress?'
                * **Adaptive Follow-up for Fit Assessment:** If a candidate's response to a fit-assessment question (or any crucial question) is unclear, insufficient, or raises concerns about their alignment, your very next question must be a targeted follow-up. Do not move to a new topic. Instead, rephrase the original concern in a different way, or ask for alternative examples or a deeper explanation to thoroughly explore their suitability regarding that specific point. For example, if their answer to the autonomous work question was weak, you might follow up with, 'Thinking about your experiences, perhaps in academic projects or even extracurricular activities, can you share an instance where you took complete ownership of a challenging task from start to finish, including how you motivated yourself and managed obstacles independently?'
         * **Engagement:** Maintain a conversational flow. Actively listen to (process) the candidate's answers and ensure your follow-up questions are contextually relevant.
            * **Evaluation (Implicit):** While conducting the interview, continuously assess the candidate's responses against the \`successCriteria\`, \`candidatePersona\`, \`requiredSkills\`, and \`companyValues\`. (Note: Explicit scoring or final decision is likely outside your immediate scope).

            **Initiate the Interview:**
            Please begin by introducing yourself as an AI interviewer from ${
              orgContext.companyName
            }, briefly mention the ${
      jobContext.jobTitle
    } role, and then ask your first tailored question to ${
      candidateContext.name
    }, following the Question Content Generation Strategy outlined above.
        `;

    await admin
      .firestore()
      .collection("applications")
      .doc(applicationId)
      .update({
        chatPrompt: systemInstruction,
      });

    return {
      systemInstruction: systemInstruction,
    };
  } catch (error) {
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
    const doc = await admin
      .firestore()
      .collection("applications")
      .doc(applicationId)
      .get();
    if (!doc.exists) {
      console.log("No application with given ID!");
      return;
    }
    let systemInstruction;

    if ("chatPrompt" in doc.data()) {
      systemInstruction = doc.data().chatPrompt;
    } else {
      res = await createPrompt({ candidateId, orgId, jobId, applicationId });
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

exports.extractAndSaveData = onCall(async (request) => {
  try {
    const { orgId, jobId, textInput } = request.data;

    if (!orgId || !jobId || !textInput) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required parameters: orgId, jobId, or textInput"
      );
    }

    // Initialize AI service
    const genAI = await initializeGenerativeAI();

    // Extract data using the job schema
    const extractedData = await extractDataWithAI(
      textInput,
      schemas.jobSchemaDefinition,
      "gemini-1.5-flash-latest"
    );

    // Get the job document reference
    const jobRef = admin.firestore().collection("jobs").doc(jobId);

    // Update the job document with the extracted data
    await jobRef.update({
      ...extractedData,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      data: extractedData,
    };
  } catch (error) {
    console.error("Error in extractAndSaveData:", error);
    throw new HttpsError(
      "internal",
      `Data extraction failed: ${error.message}`
    );
  }
});

exports.generateReport = onCall(async (request) => {
    const candidateId = request.data.candidateId;
    const jobId = request.data.jobId;
    const orgId = request.data.orgId;
    const applicationId = request.data.applicationId;
    const reportId = request.data.reportId;
    const chatHistory = request.data.history;

    if( !orgId || !candidateId || !jobId || !applicationId || !reportId){
        throw new HttpsError("invalid-argument", "Missing Ids");
    }

    try{
        const candidateSnapshot = await admin
        .firestore()
        .collection("candidates")
        .where(admin.firestore.FieldPath.documentId(), "==", candidateId)
        .select("name", "resumeBreakdown")
        .get();
        const candidateContext = candidateSnapshot.docs[0].data();

        const jobSnapshot = await admin
        .firestore()
        .collection("jobs")
        .where(admin.firestore.FieldPath.documentId(), "==", jobId)
        .select(
            "jobTitle",
            "jobDepartment",
            "jobDescription",
            "jobLocation",
            "jobType",
            "riskTolerance",
            "requiredEducation",
            "requiredCertifications",
            "requiredSkills",
            "preferredSkills",
            "requiredQuestions",
            "techStack",
            "successCriteria",
            "candidatePersona",
            "workEnvironment"
        )
        .get();
        const jobContext = jobSnapshot.docs[0].data();

        const orgSnapshot = await admin
        .firestore()
        .collection("orgs")
        .where(admin.firestore.FieldPath.documentId(), "==", orgId)
        .select(
            "companyName",
            "companyDescription",
            "companySize",
            "industry",
            "location",
            "missionStatement",
            "companyValues"
        )
        .get();

        const orgContext = orgSnapshot.docs[0].data();

        const systemInstruction = `
        You are an expert AI Interview Report Generator.
        Your primary mission is to analyze interview data and generate highly structured, multi-part outputs.
        You must adhere strictly to all specified formatting, section markers, and content requirements for each part of your response.
        Your tone must always be objective, professional, and consistent across all generated sections.
        Do not include any conversational preambles, postambles, or extraneous text outside of the defined output sections.
        `;

        const userPrompt = `
        **INPUT DATA:**
        ---

        **1. Organization Context:**
        ${JSON.stringify(orgContext, null, 2)}

        **2. Job Context:**
        ${JSON.stringify(jobContext, null, 2)}

        **3. Candidate Context:**
        ${JSON.stringify(candidateContext, null, 2)}

        **4. Interview Chat History (Chronological Order):**
        ${JSON.stringify(chatHistory, null, 2)}

        ---
        **OUTPUT STRUCTURE AND GENERATION GUIDELINES:**
        ---

        Generate **THREE DISTINCT SECTIONS** in your output, clearly separated by the specified markers.

        **SECTION 1: COMPREHENSIVE INTERVIEW REPORT**
        Generate a detailed interview report following this exact structure. Populate each section by carefully analyzing the 'INPUT DATA'. If information for a section is not directly present in the chat history, derive it logically from the context or state "Not explicitly discussed" where appropriate, but strive to synthesize.

        **I. Candidate Information**
        * **Candidate Name:** ${candidateContext.name}
        * **Job Title Applied For:** ${jobContext.jobTitle}
        * **Company Name:** ${orgContext.companyName}
        * **Interviewer:** AI Interviewer

        **II. Resume Summary & Initial Fit**
        * **Key Strengths based on Resume:** Synthesize 2-3 key strengths from \`candidateContext.resumeBreakdown\` that directly align with \`jobContext\` requirements (e.g., required skills, tech stack).
        * **Potential Gaps/Areas to Probe (Identified from Resume):** Highlight 1-2 significant discrepancies or areas where the resume was less clear or strong compared to \`jobContext\` requirements, which the interviewer likely probed.

        **III. Interview Performance Breakdown**

        **A. Required Questions/Topics Covered**
        (Iterate through \`jobContext.requiredQuestions\`. For each, identify the question asked in \`chatHistory\` that covered it, and the candidate's response. Evaluate how well the answer addressed the specific requirement.)

        * **Required Topic 1:** [Original topic from \`jobContext.requiredQuestions\`]
            * **Question Asked:** "[The AI interviewer's exact question from \`chatHistory\` that addressed this topic.]"
            * **Candidate's Answer:** "[Concise summary of the candidate's response. Extract the core information.]"
            * **Evaluation:** [Assess how well the candidate demonstrated understanding or experience related to this topic. Did they provide sufficient detail or examples? Mention any strengths or weaknesses in their answer.]
        * **Required Topic 2:** ... (Repeat for all required questions/topics)

        **B. Core Skills and Technical Probing**
        (Group related technical questions and answers. For each significant \`requiredSkill\`, \`preferredSkill\`, or \`techStack\` component, summarize discussions and evaluate proficiency.)

        * **Skill/Tech Area: [e.g., "Node.js Proficiency" or "Microservices Architecture"]**
            * **Questions Asked:** "[List 1-2 representative questions asked by the AI related to this skill/tech area from \`chatHistory\`.]"
            * **Candidate's Responses (Synthesized):** "[Concise summary of all relevant candidate responses regarding this skill/tech area, focusing on real-world application and depth of understanding.]"
            * **Evaluation:** [Assess the candidate's demonstrated proficiency and experience against the \`jobContext.requiredSkills[].level\` or \`techStack.stack[].level\`. Note their understanding of \`realWorldApplication\`, how they handled \`challenges\`, and if any \`redFlags\` were observed or addressed. Provide specific examples from their answers.]
        * **Skill/Tech Area: ...** (Repeat for 3-5 most critical skills/tech areas discussed, prioritizing required over preferred)

        **C. Strategic Probing & Gap Analysis**
        (Identify instances where the AI interviewer specifically probed for gaps, alternative experiences, or weaknesses based on the candidate's resume or previous answers. This relates to the "Adaptive Questioning" instruction.)

        * **Area Probed: [e.g., "Independent Project Ownership" or "Handling Ambiguity in Research"]**
            * **Context for Probing:** "[Briefly explain why this area was probed (e.g., resume showed limited independent work, initial answer was vague on X topic).]"
            * **Questions Asked:** "[List the adaptive questions asked by the AI from \`chatHistory\`.]"
            * **Candidate's Responses (Synthesized):** "[Concise summary of the candidate's responses to these adaptive questions.]"
            * **Evaluation:** [Assess if the candidate successfully addressed the underlying concern or demonstrated transferable skills. Did their follow-up answers provide the necessary clarity or examples?]
        * **Area Probed: ...** (Repeat for 1-2 significant probing areas)

        **IV. Cultural and Environmental Fit Assessment**

        * **Company Values Alignment:** (Evaluate candidate's alignment with \`orgContext.companyValues\`. Provide specific examples from their answers where they demonstrated or discussed values.)
            * **[Value Name 1]:** [Evaluation (e.g., "Strong alignment, demonstrated by X example" or "Moderate alignment, showed understanding of Y but no direct experience").]
            * **[Value Name 2]:** ... (Cover 2-3 most relevant values based on interview discussion)
        * **Work Environment Fit:** (Assess how well the candidate's preferences and experiences align with \`jobContext.workEnvironment\` attributes.)
            * **Tech Maturity Alignment:** [Evaluation based on answers related to their comfort with different tech maturities.]
            * **Pace Alignment:** [Evaluation based on responses related to their preferred work pace or experience in fast/slow environments.]
            * **Collaboration Style:** [Evaluation based on their responses about teamwork and communication.]
            * **(Add other relevant work environment aspects if discussed):** [Evaluation]
        * **Ideal Candidate Persona Alignment:** (Evaluate how closely the candidate's overall profile and interview performance align with the \`jobContext.candidatePersona\`. Provide a brief justification.)
            * **Alignment:** [e.g., "High alignment with the 'proactive problem-solver' aspect," or "Moderate alignment, some aspects align but autonomy needs further development."]

        **V. Success Criteria Potential**
        (Based on their answers, assess the candidate's potential to meet the immediate and long-term success criteria.)

        * **Immediate Success (3-6 months):**
            * **[Metric 1]:** [Assessment of candidate's potential to achieve this metric based on their demonstrated skills and experiences.]
            * **[Metric 2]:** ...
        * **Long-Term Success (6-12+ months):**
            * **[Metric 1]:** [Assessment of candidate's potential to achieve this metric.]
            * **[Metric 2]:** ...

        **VI. Overall Assessment and Recommendation**

        * **Strengths:** [List 3-5 overall key strengths demonstrated by the candidate across the interview.]
        * **Areas for Development/Concerns:** [List 2-3 significant weaknesses, red flags, or areas requiring further development or follow-up.]
        * **Risk Tolerance Assessment:** [Based on \`jobContext.riskTolerance\` (e.g., low, moderate, high), briefly assess how well the candidate's responses mitigated or highlighted risks in critical skills or required traits.]
        * **General Impression:** [A concise, overall qualitative impression of the candidate's suitability for the role and company. (e.g., "A solid technical candidate with strong communication, but might need support in adapting to a highly ambiguous environment.")]
        * **Recommendation:** [**Strong Fit / Good Fit with Reservations / Moderate Fit / Not a Fit** (Choose one and briefly justify)]

        ---
        **SECTION 2: CANDIDATE FEEDBACK FOR IMPROVEMENT**
        Provide concise, actionable feedback to the candidate (addressed to them directly) on what they could improve or change for their next job application or interview. Focus on 2-3 key areas derived from the interview. Be encouraging and constructive.

        ---
        **SECTION 3: NUMERICAL MATCHING SCORE**
        Provide a single numerical score, from 0.0 to 10.0 (with one decimal place), representing how closely the candidate matches the *requirements* of the **${jobContext.jobTitle}** position at **${orgContext.companyName}**.
        This score should be a direct assessment of their alignment with \`jobContext.requiredSkills\`, \`jobContext.techStack\`, \`jobContext.successCriteria\`, and alignment with \`orgContext.companyValues\` and \`jobContext.candidatePersona\`.
        Consider both their resume information (\`candidateContext.resumeBreakdown\`) and their performance during the interview (\`chatHistory\`).
        Do not include any text before or after the number. Just the number itself.

        ---
        **Important Instructions for Generation (Applies to ALL Sections):**
        * **Strictly follow the markdown formatting and headings provided for SECTION 1.**
        * **For SECTION 2, provide 2-3 concise bullet points or a short paragraph, addressed directly to the candidate.**
        * **For SECTION 3, output ONLY the numerical score (e.g., "7.5"), with one decimal place.**
        * **Use the exact markers for each section: "SECTION 1:", "SECTION 2:", "SECTION 3:".**
        * **Ensure all evaluations are directly supported by evidence from the \`chatHistory\` and input contexts.**
        * **Maintain an objective, professional, and consistent tone across all sections.**
        * **Keep summaries and evaluations concise and to the point (2-4 sentences max per bullet point).**
        * **Cross-reference all sections of the original prompt (orgContext, jobContext, candidateContext) for comprehensive analysis.**
        `;

    await initializeGenAI();

    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    const genAI = new GoogleGenAI({ apiKey: GEMINI_KEY });

    const result = await genAI.models.generateContent({
        model: "gemini-2.5-flash-preview-05-20",
        contents: userPrompt,
        config: {
            temperature: 0.1,
            systemInstruction: systemInstruction,
        },
    });

    const generatedContent = result.text;

    const applicationRef = admin.firestore().collection("applications").doc(applicationId);
    await applicationRef.update({
        status: "completed",
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const sections = generatedContent.split(/SECTION [1-3]: /); 
    const report = sections[1].trim();
    const feedback = sections[2].trim();
    const rawScore = sections[3].trim();
    const numericalScore = parseFloat(rawScore);
    console.log("score:", rawScore, numericalScore);

    const reportRef = admin.firestore().collection("reports").doc(reportId);
    await reportRef.update({
        summary: report,
        candidateFeedback: feedback,
        score: numericalScore,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return{
        success: true,
    };

    }
    catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new HttpsError("internal", "Failed to get report from AI");
    }

});
