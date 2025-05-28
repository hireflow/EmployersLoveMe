const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const functions = require("firebase-functions"); // Add this import

let GoogleGenAI; // Declare it outside the try/catch
async function initializeGenAI() {
  if (!GoogleGenAI) {
    GoogleGenAI = (await import("@google/genai")).GoogleGenAI;
  }
}


async function createPrompt({candidateContext, orgContext, jobContext}) {

    const geminiToolConfig = [
        {
            functionDeclarations: [
                {
                    name: "makeQuestion",
                    description: "Generates a specific interview question tailored to the provided criteria. Use this to create targeted technical, behavioral, or situational questions based on job requirements, company values, or candidate background. The LLM should populate the context parameters with the most relevant information for the question it intends to generate.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            // jobContext: Corresponds to the 'jobs' schema
                            jobContext: {
                                type: "OBJECT",
                                description: "Relevant context about the job role.",
                                properties: {
                                    jobTitle: { type: "STRING", description: "The title of the job." },
                                    jobDepartment: { type: "STRING", description: "The department the job belongs to." },
                                    jobDescription: { type: "STRING", description: "A summary of the job, including influence, level, and day-to-day activities." },
                                    jobLocation: { type: "STRING", description: "The location of the job." },
                                    jobType: { type: "STRING", description: "The type of employment (e.g., Full-time, Contract)." },
                                    riskTolerance: { type: "STRING", description: "The hiring manager's risk tolerance for this role (e.g., high, medium, low)." },
                                    requiredEducation: {
                                        type: "ARRAY",
                                        items: { type: "STRING" },
                                        description: "List of required educational qualifications."
                                    },
                                    requiredCertifications: {
                                        type: "ARRAY",
                                        items: { type: "STRING" },
                                        description: "List of required certifications."
                                    },
                                    requiredSkills: {
                                        type: "ARRAY",
                                        items: {
                                            type: "OBJECT",
                                            properties: {
                                                skill: { type: "STRING", description: "Name of the required skill." },
                                                level: { type: "STRING", description: "Required proficiency level for the skill (e.g., proficient, expert)." }
                                            }
                                        },
                                        description: "List of required skills and their expected proficiency levels."
                                    },
                                    preferredSkills: {
                                        type: "ARRAY",
                                        items: {
                                            type: "OBJECT",
                                            properties: {
                                                skill: { type: "STRING", description: "Name of the preferred skill." },
                                                level: { type: "STRING", description: "Preferred proficiency level for the skill." }
                                            }
                                        },
                                        description: "List of preferred skills and their desired proficiency levels."
                                    },
                                    requiredQuestions: {
                                        type: "ARRAY",
                                        items: { type: "STRING" },
                                        description: "Specific questions that must be asked or topics that must be covered during the interview."
                                    },
                                    techStack: {
                                        type: "OBJECT",
                                        description: "Details about the technology stack used for the role.",
                                        properties: {
                                            stack: {
                                                type: "ARRAY",
                                                items: {
                                                    type: "OBJECT",
                                                    properties: {
                                                        skill: { type: "STRING", description: "Specific tool, technology, or platform." },
                                                        level: { type: "STRING", description: "Required or expected level of expertise." },
                                                        realWorldApplication: { type: "STRING", description: "Expected real-world application of the skill." },
                                                        redFlags: { type: "ARRAY", items: { type: "STRING" }, description: "Potential red flags related to this skill." },
                                                        weight: { type: "NUMBER", description: "Relative importance of this skill in the tech stack." }
                                                    }
                                                },
                                                description: "List of specific technologies, tools, and platforms."
                                            },
                                            architecture: { type: "STRING", description: "Overall system architecture (e.g., microservices, monolithic)." },
                                            scale: { type: "STRING", description: "The scale at which the system operates (e.g., 10M+ users)." },
                                            challenges: { type: "ARRAY", items: { type: "STRING" }, description: "Key technical challenges." },
                                            practices: { type: "ARRAY", items: { type: "STRING" }, description: "Development practices (e.g., TDD, CI/CD)." }
                                        }
                                    },
                                    successCriteria: {
                                        type: "OBJECT",
                                        description: "Criteria defining success in the role.",
                                        properties: {
                                            immediate: {
                                                type: "ARRAY",
                                                items: {
                                                    type: "OBJECT",
                                                    properties: {
                                                        metric: { type: "STRING", description: "Success metric." },
                                                        description: { type: "STRING", description: "Description of the success metric." },
                                                        weight: { type: "NUMBER", description: "Relative importance of the metric." }
                                                    }
                                                },
                                                description: "Short-term success criteria (e.g., first 3-6 months)."
                                            },
                                            longTerm: {
                                                type: "ARRAY",
                                                items: {
                                                    type: "OBJECT",
                                                    properties: {
                                                        metric: { type: "STRING", description: "Success metric." },
                                                        description: { type: "STRING", description: "Description of the success metric." },
                                                        weight: { type: "NUMBER", description: "Relative importance of the metric." }
                                                    }
                                                },
                                                description: "Long-term success criteria (e.g., 6-12+ months)."
                                            }
                                        }
                                    },
                                    workEnvironment: {
                                        type: "OBJECT",
                                        description: "Details about the work environment and team dynamics.",
                                        properties: {
                                            techMaturity: { type: "STRING", description: "Technological maturity of the organization or team." },
                                            structure: { type: "STRING", description: "Team or organizational structure (e.g., autonomous, hierarchical)." },
                                            communication: { type: "STRING", description: "Primary communication style (e.g., async-first, meetings-heavy)." },
                                            pace: { type: "STRING", description: "Pace of work (e.g., sprint-based, steady)." },
                                            growthExpectations: { type: "STRING", description: "Expectations for employee growth and development (e.g., self-directed, structured)." }, // Corrected spelling
                                            collaboration: { type: "STRING", description: "Nature of collaboration (e.g., cross-functional, siloed)." },
                                            teamSize: { type: "STRING", description: "Typical size of the team." } // Using STRING for flexibility e.g., "5-7 people"
                                        }
                                    },
                                    candidatePersona: { type: "STRING", description: "Description of the ideal candidate profile, including soft skills and work style." },
                                    interviewStages: {
                                        type: "ARRAY",
                                        items: { type: "STRING" },
                                        description: "Different stages of the interview process for this job."
                                    }
                                }
                            },
                            // orgContext: Corresponds to the 'org' schema
                            orgContext: {
                                type: "OBJECT",
                                description: "Relevant context about the organization.",
                                properties: {
                                    companyName: { type: "STRING", description: "Name of the company." },
                                    companyDescription: { type: "STRING", description: "A brief description of the company." },
                                    companySize: { type: "STRING", description: "The size of the company (e.g., number of employees)." },
                                    industry: { type: "STRING", description: "The industry the company operates in." },
                                    location: { type: "STRING", description: "Primary location of the company." },
                                    missionStatement: { type: "STRING", description: "The company's mission statement." },
                                    companyValues: {
                                        type: "ARRAY",
                                        items: {
                                            type: "OBJECT",
                                            properties: {
                                                name: { type: "STRING", description: "Name of the company value." },
                                                description: { type: "STRING", description: "Description of the company value." },
                                                extractedKeywords: { type: "ARRAY", items: { type: "STRING" }, description: "Keywords associated with the value (optional)." },
                                                weight: { type: "NUMBER", description: "Relative importance of the value (optional)." }
                                            }
                                        },
                                        description: "List of core company values."
                                    }
                                }
                            },
                            // candidateContext: Corresponds to the 'candidates' schema
                            candidateContext: {
                                type: "OBJECT",
                                description: "Relevant context about the candidate being interviewed.",
                                properties: {
                                    name: { type: "STRING", description: "The candidate's full name." },
                                    resumeBreakdown: {
                                        type: "OBJECT",
                                        description: "Structured information parsed from the candidate's resume.",
                                        // NOT YET STRUCTURED
                                        // properties: {
                                        //     summary: { type: "STRING", description: "A brief summary from the resume." },
                                        //     yearsOfExperience: { type: "NUMBER", description: "Total relevant years of experience." },
                                        //     skills: { type: "ARRAY", items: { type: "STRING" }, description: "List of skills mentioned in the resume." },
                                        //     recentRole: {
                                        //         type: "OBJECT",
                                        //         properties: {
                                        //             title: { type: "STRING" },
                                        //             company: { type: "STRING" },
                                        //             duration: { type: "STRING" }
                                        //         },
                                        //         description: "Details of the most recent or relevant role."
                                        //     }
                                        // }
                                    },
                                }
                            },
                        },
                        required: ["jobContext", "orgContext", "candidateContext"]
                    },
                ]
            }
];
    


    const creationPrompt = "
        Create a chatbot prompt for a job interviewer that asks tailored questions and generates reports
        
        

        

    
    ";

    const desiredFormat = "";


    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: "",
    });
    console.log(response.text);
}

exports.geminiChatbot = onCall(async (request) => {
  await initializeGenAI(); // Ensure GoogleGenAI is imported

  const GEMINI_KEY = process.env.GEMINI_API_KEY;

  const genAI = new GoogleGenAI({ apiKey: GEMINI_KEY });

  const data = request.data;

  const candidateId = data.candidateId;
  const jobId = data.jobId;
  const orgId = data.orgId;
  const userMessage = data.message;
  const chatHistory = data.history || [];

  if (!userMessage) {
    throw new HttpsError("invalid-argument", "Need a message to send");
  }
  
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
        .select('jobTitle', 'jobDepartment', 'jobDescription', 'jobLocation', 'jobType', 'riskTolerance', 'requiredEducation', 'requiredCertifications', 'requiredSkills', 'preferredSkills', 'requiredQuestions', 'techStack', 'successCriteria', 'candidatePersona', 'workEnvironment', 'interviewStages')
        .get();
    const jobContext = jobSnapshot.docs[0].data();

    const orgSnapshot = await admin.firestore()
        .collection("orgs")
        .where(admin.FieldPath.documentId(), '==', orgId)
        .select('companyName','companyDescription','companySize','industry','location','missionStatement','companyValues')
        .get();

    const orgContext = jobSnapshot.docs[0].data();


    


    const sysInstruc = await createPrompt({candidateContext,orgContext,jobContext})


    const chat = genAI.chats.create({
      model: "gemini-2.5-flash-preview-05-20",
      history: chatHistory,
      config: {
        temperature: 0.5,
        systemInstruction:
          "You are a conversational AI that conducts job interviews. Please ask job related questions to determine whether the candidate is a good fit for Google as a Software Engineer",
        maxOutputTokens: 1024,
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