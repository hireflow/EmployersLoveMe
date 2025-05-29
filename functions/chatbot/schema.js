// functions/schemas.js

const jobSchemaDefinition = {
  type: "object",
  properties: {
    jobTitle: {
      type: ["string", "null"],
      description: "The title of the job.",
    },
    applicationDeadline: {
      type: ["string", "null"],
      format: "date-time",
      description: "The deadline for applications.",
    },
    applications: {
      type: "array",
      items: { type: "string" }, // Assuming an array of application IDs or simple references
      description:
        "List of applications or references to applications for this job.",
    },
    hiringManagerId: {
      type: "array",
      items: { type: "string" },
      description: "Array of user IDs for hiring managers.",
    },
    riskTolerance: {
      type: ["string", "null"],
      enum: ["high", "medium", "low", null],
      description: "Hiring manager's risk tolerance for this role.",
    },
    orgId: {
      type: ["string", "null"],
      description: "The ID of the organization this job belongs to.",
    },
    status: {
      type: ["string", "null"],
      description:
        "Current status of the job posting (e.g., Open, Closed, Filled).",
    },
    createdAt: {
      type: ["string", "null"],
      format: "date-time",
      description: "Timestamp of when the job was created.",
    },
    requiredEducation: {
      type: "array",
      items: { type: "string" },
      description: "List of required educational qualifications.",
    },
    requiredCertifications: {
      type: "array",
      items: { type: "string" },
      description: "List of required certifications.",
    },
    requiredSkills: {
      // Assuming this might be an array of strings or objects. Let's go with objects for more detail.
      type: "array",
      items: {
        type: "object",
        properties: {
          skill: { type: "string", description: "Name of the required skill." },
          level: {
            type: "string",
            description:
              "Required proficiency level (e.g., proficient, expert).",
          },
        },
        required: ["skill", "level"],
        additionalProperties: false,
      },
      description:
        "List of required skills and their expected proficiency levels.",
    },
    preferredSkills: {
      type: "array",
      items: {
        type: "object",
        properties: {
          skill: {
            type: "string",
            description: "Name of the preferred skill.",
          },
          level: {
            type: "string",
            description: "Preferred proficiency level.",
          },
        },
        required: ["skill", "level"],
        additionalProperties: false,
      },
      description:
        "List of preferred skills and their desired proficiency levels.",
    },
    requiredQuestions: {
      type: "array",
      items: { type: "string" },
      description:
        "Specific questions that must be asked or topics that must be covered during the interview.",
    },
    candidateResourceLinks: {
      type: "array",
      items: { type: "string", format: "uri" },
      description: "Array of URLs to resources for candidates.",
    },
    jobType: {
      type: ["string", "null"],
      description: "Type of employment (e.g., Full-time, Part-time, Contract).",
    },
    interviewStages: {
      // Assuming an array of strings describing stages, or objects for more detail.
      type: "array",
      items: {
        type: "object",
        properties: {
          stageName: { type: "string" },
          description: { type: "string" },
          order: { type: "integer" },
        },
        required: ["stageName"],
        additionalProperties: false,
      },
      description: "Defined stages of the interview process for this job.",
    },
    jobDepartment: {
      type: ["string", "null"],
      description: "The department the job belongs to.",
    },
    jobDescription: {
      type: ["string", "null"],
      description:
        "Detailed job description, including influence, level, and day-to-day activities.",
    },
    jobLocation: {
      type: ["string", "null"],
      description: "The location of the job (e.g., City, State, Remote).",
    },
    techStack: {
      type: ["object", "null"],
      properties: {
        stack: {
          type: "array",
          items: {
            type: "object",
            properties: {
              skill: {
                type: ["string", "null"],
                description: "Specific tool, technology, or platform.",
              },
              level: {
                type: ["string", "null"],
                description: "Required or expected level of expertise.",
                default: "intermediate",
              },
              realWorldApplication: {
                type: ["string", "null"],
                description:
                  "Expected real-world application of the skill in this role.",
                default: "General application in role",
              },
              redFlags: {
                type: ["array", "null"],
                items: { type: "string" },
                description:
                  "Potential red flags if a candidate lacks proficiency or understanding.",
                default: [],
              },
              weight: {
                type: ["number", "null"],
                minimum: 0,
                maximum: 1,
                description:
                  "Relative importance/weight of this skill (0.0 to 1.0).",
                default: 0.5,
              },
            },
            required: ["skill"],
            additionalProperties: false,
          },
          default: [],
        },
        architecture: {
          type: ["string", "null"],
          description:
            "Overall system architecture (e.g., microservices, monolithic).",
          default: "Not specified",
        },
        scale: {
          type: ["string", "null"],
          description:
            "The scale at which the system operates (e.g., 10M+ users, 10k RPS).",
          default: "Not specified",
        },
        challenges: {
          type: ["array", "null"],
          items: { type: "string" },
          description:
            "Key technical challenges associated with the role or system.",
          default: [],
        },
        practices: {
          type: ["array", "null"],
          items: { type: "string" },
          description:
            "Development practices followed (e.g., TDD, CI/CD, Agile, code reviews).",
          default: [],
        },
      },
      additionalProperties: false,
      description: "Details about the technology stack used for the role.",
    },
    successCriteria: {
      type: ["object", "null"],
      properties: {
        immediate: {
          type: "array",
          items: {
            type: "object",
            properties: {
              metric: {
                type: ["string", "null"],
                description: "The metric for success.",
              },
              description: {
                type: ["string", "null"],
                description: "Detailed description of the success metric.",
              },
              weight: {
                type: ["number", "null"],
                minimum: 0,
                maximum: 1,
                description:
                  "Relative importance/weight of this metric (0.0 to 1.0).",
              },
            },
            required: ["metric"],
            additionalProperties: false,
          },
          description: "Short-term success criteria (e.g., first 3-6 months).",
        },
        longTerm: {
          type: "array",
          items: {
            type: "object",
            properties: {
              metric: {
                type: ["string", "null"],
                description: "The metric for success.",
              },
              description: {
                type: ["string", "null"],
                description: "Detailed description of the success metric.",
              },
              weight: {
                type: ["number", "null"],
                minimum: 0,
                maximum: 1,
                description:
                  "Relative importance/weight of this metric (0.0 to 1.0).",
              },
            },
            required: ["metric"],
            additionalProperties: false,
          },
          description: "Long-term success criteria (e.g., 6-12+ months).",
        },
      },
      additionalProperties: false,
      description: "Criteria defining success in the role.",
    },
    workEnvironment: {
      type: ["object", "null"],
      properties: {
        techMaturity: {
          type: ["string", "null"],
          description:
            "Technological maturity of the organization or team (e.g., cutting-edge, stable, legacy).",
        },
        structure: {
          type: ["string", "null"],
          description:
            "Team or organizational structure (e.g., autonomous, hierarchical, flat, matrix).",
        },
        communication: {
          type: ["string", "null"],
          description:
            "Primary communication style (e.g., async-first, meetings-heavy, Slack-centric).",
        },
        pace: {
          type: ["string", "null"],
          description: "Pace of work (e.g., sprint-based, fast-paced, steady).",
        },
        growthExpectations: {
          type: ["string", "null"],
          description:
            "Expectations for employee growth and development (e.g., self-directed, structured mentorship).",
        },
        collaboration: {
          type: ["string", "null"],
          description:
            "Nature of collaboration (e.g., cross-functional, siloed, pair-programming).",
        },
        teamSize: {
          type: ["string", "null"],
          description:
            "Typical size of the immediate team (e.g., '5-7 engineers', '10+').",
        },
      },
      additionalProperties: false,
      description: "Details about the work environment and team dynamics.",
    },
    candidatePersona: {
      type: ["string", "null"],
      description:
        "Description of the ideal candidate profile, including soft skills, work style, and motivations.",
    },
    travelRequirements: {
      type: ["string", "null"],
      description:
        "Any travel requirements for the job (e.g., 'Up to 10%', 'None').",
    },
    salaryRange: {
      type: ["string", "null"],
      description:
        "The salary range for the position (e.g., '$100,000 - $120,000 USD').",
    },
  },
  required: ["jobTitle", "orgId", "jobDescription"], // Example required fields, adjust as necessary
  additionalProperties: false,
  description: "Schema for a job posting.",
};

const orgSchemaDefinition = {
  type: "object",
  properties: {
    companyName: {
      type: ["string", "null"],
      description: "Legal name of the company.",
    },
    companyDescription: {
      type: ["string", "null"],
      description:
        "A brief description of the company, its business, and culture.",
    },
    companySize: {
      type: ["string", "null"],
      description:
        "The size of the company (e.g., number of employees like '1-50', '501-1000', '10000+').",
    },
    createdAt: {
      type: ["string", "null"],
      format: "date-time",
      description: "Timestamp of when the organization record was created.",
    },
    hiringManagers: {
      type: "array",
      items: { type: "string" }, // Assuming array of user IDs
      description:
        "List of user IDs who are hiring managers for this organization.",
    },
    industry: {
      type: ["string", "null"],
      description:
        "The primary industry the company operates in (e.g., Technology, Healthcare, Finance).",
    },
    location: {
      type: ["string", "null"],
      description:
        "Primary physical location or headquarters of the company (e.g., City, State, Country or 'Remote-first').",
    },
    logoUrl: {
      type: ["string", "null"],
      format: "uri",
      description: "URL to the company's logo.",
    },
    missionStatement: {
      type: ["string", "null"],
      description: "The company's mission statement.",
    },
    companyValues: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description:
              "Name of the company value (e.g., Innovation, Integrity).",
          },
          description: {
            type: "string",
            description: "Description of what this value means to the company.",
          },
          extractedKeywords: {
            type: "array",
            items: { type: "string" },
            description: "Keywords associated with this value.",
          },
          weight: {
            type: "number",
            minimum: 0,
            maximum: 1,
            description:
              "Relative importance/weight of this value (0.0 to 1.0), if applicable.",
          },
        },
        required: ["name", "description"],
        additionalProperties: false,
      },
      description: "List of core company values.",
    },
    jobs: {
      type: "array",
      items: { type: "string" }, // Assuming array of job IDs associated with this org
      description: "List of job IDs posted by this organization.",
    },
    // Payment and Stripe fields (optional, include if needed for extraction)
    paymentPlanCanceledDate: { type: ["string", "null"], format: "date-time" },
    paymentPlanCanceledReason: { type: ["string", "null"] },
    paymentPlanEndDate: { type: ["string", "null"], format: "date-time" },
    paymentPlanStartDate: { type: ["string", "null"], format: "date-time" },
    paymentPlanStatus: { type: ["string", "null"] },
    paymentPlanTier: { type: ["string", "null"] },
    stripeCustomerId: { type: ["string", "null"] },
    stripeSubscriptionId: { type: ["string", "null"] },
  },
  required: ["companyName", "industry"], // Example required fields, adjust as necessary
  additionalProperties: false,
  description: "Schema for an organization.",
};

module.exports = {
  jobSchemaDefinition,
  orgSchemaDefinition,
};
