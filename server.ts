import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Robust JSON parse that strips markdown blocks if present
function robustJsonParse(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  cleaned = cleaned.trim();
  return JSON.parse(cleaned);
}

// Lazy-initialized Gemini API client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY is not configured or is placeholder. Falling back to algorithmic matches.");
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    aiEnabled: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"
  });
});

// AI SKILL MATCHING ENGINE
app.post("/api/match-skills", async (req, res) => {
  const { candidateSkills = [], requiredSkills = [], projectTitle = "Project", projectDescription = "" } = req.body;

  const ai = getGeminiClient();
  if (ai) {
    try {
      const prompt = `
        You are an advanced HR AI Skill Matcher.
        Compare the candidate's skills with the project's required skills.
        
        Project: "${projectTitle}"
        Project Description: "${projectDescription}"
        Required Skills: ${JSON.stringify(requiredSkills)}
        Candidate Skills: ${JSON.stringify(candidateSkills)}
        
        Generate a comprehensive, tailored JSON analysis.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matchPercentage: { type: Type.INTEGER, description: "Match percentage between 0 and 100 based on overlap." },
              matchingSkills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Skills that both the candidate has and the project requires." },
              missingSkills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Skills that the project requires but the candidate is missing." },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "2 to 3 detailed strengths of the candidate." },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "2 to 3 detailed areas of improvement for the candidate." },
              rejectionReason: { type: Type.STRING, description: "Empty string if matchPercentage >= 50, otherwise a polite reason why the candidate is not yet eligible." },
              estimatedLearningTime: { type: Type.STRING, description: "Estimated duration to learn missing skills, e.g., '30 Days', '15 Days'." },
              recommendedLearningPath: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-step structured learning path." },
              suggestedCertification: { type: Type.STRING, description: "Relevant certification name to bridge the gap." },
              expectedMatchAfterCourse: { type: Type.INTEGER, description: "Expected match percentage after completing the recommended path, typically between 90 and 100." }
            },
            required: [
              "matchPercentage",
              "matchingSkills",
              "missingSkills",
              "strengths",
              "weaknesses",
              "rejectionReason",
              "estimatedLearningTime",
              "recommendedLearningPath",
              "suggestedCertification",
              "expectedMatchAfterCourse"
            ]
          }
        }
      });

      const responseText = response.text?.trim() || "{}";
      const analysis = robustJsonParse(responseText);
      return res.json({ success: true, analysis });
    } catch (error) {
      console.error("Gemini Match error, falling back:", error);
    }
  }

  // Fallback algorithmic matching
  const candSet = new Set(candidateSkills.map((s: string) => s.toLowerCase().trim()));
  const reqSet = requiredSkills.map((s: string) => s.trim());
  
  const matchingSkills = reqSet.filter(s => candSet.has(s.toLowerCase()));
  const missingSkills = reqSet.filter(s => !candSet.has(s.toLowerCase()));
  
  const matchPercentage = reqSet.length > 0 
    ? Math.round((matchingSkills.length / reqSet.length) * 100) 
    : 100;

  const analysis = {
    matchPercentage,
    matchingSkills,
    missingSkills,
    strengths: matchingSkills.length > 0 
      ? [`Strong foundation in ${matchingSkills.slice(0, 2).join(" and ")}`, "Demonstrated proficiency in core requirements"]
      : ["Willingness to learn new ecosystems", "Good candidate background profile"],
    weaknesses: missingSkills.length > 0
      ? [`Currently lacking hands-on experience in ${missingSkills.slice(0, 2).join(" and ")}`, "Needs targeted domain practice"]
      : ["Needs real-world production level exposure in this stack"],
    rejectionReason: matchPercentage < 50 
      ? `Required skill set mismatch. The project requires high proficiency in ${missingSkills.join(", ")}.` 
      : "",
    estimatedLearningTime: `${missingSkills.length * 15 || 5} Days`,
    recommendedLearningPath: missingSkills.length > 0 
      ? missingSkills.map((skill, index) => `${index + 1}. Complete introductory courses and build a mini-project in ${skill}`)
      : ["1. Refresh existing core skills", "2. Review project codebase layout", "3. Onboard onto the team pipeline"],
    suggestedCertification: missingSkills.length > 0
      ? `Certified professional path in ${missingSkills[0]}`
      : "Professional Engineering Ecosystem Credential",
    expectedMatchAfterCourse: Math.max(90, Math.min(100, matchPercentage + (missingSkills.length > 0 ? 35 : 0)))
  };

  return res.json({ success: true, isMock: true, analysis });
});

// COURSE RECOMMENDATIONS
app.post("/api/recommend-courses", async (req, res) => {
  const { missingSkills = [] } = req.body;

  if (missingSkills.length === 0) {
    return res.json({ success: true, courses: [] });
  }

  const ai = getGeminiClient();
  if (ai) {
    try {
      const prompt = `
        You are an expert curriculum developer.
        Recommend highly focused learning courses (up to 3) to cover these missing skills: ${JSON.stringify(missingSkills)}.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Course name" },
                description: { type: Type.STRING, description: "Brief course description" },
                skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Skills addressed by this course" },
                duration: { type: Type.STRING, description: "Duration of course, e.g., '12 Hours', '4 Weeks'" },
                difficulty: { type: Type.STRING, description: "Difficulty level, must be 'Beginner', 'Intermediate', or 'Advanced'" },
                certificate: { type: Type.BOOLEAN, description: "Whether a certificate is awarded" },
                outcome: { type: Type.STRING, description: "The learning outcome" }
              },
              required: ["name", "description", "skills", "duration", "difficulty", "certificate", "outcome"]
            }
          }
        }
      });

      const responseText = response.text?.trim() || "[]";
      const courses = robustJsonParse(responseText);
      return res.json({ success: true, courses });
    } catch (error) {
      console.error("Gemini Course Recommendation error, falling back:", error);
    }
  }

  // Fallback courses
  const courses = missingSkills.map((skill, index) => ({
    id: `course-fallback-${index}`,
    name: `${skill} Professional BootCamp`,
    description: `Master the essentials of ${skill} with hands-on labs, comprehensive exercises, and real-world projects.`,
    skills: [skill],
    duration: "10 Hours",
    difficulty: "Beginner" as const,
    certificate: true,
    outcome: `Gain confidence building functional applications using ${skill}.`
  }));

  return res.json({ success: true, isMock: true, courses });
});

// RESUME ANALYSIS
app.post("/api/resume/analyze", async (req, res) => {
  const { fileData, mimeType, fileName } = req.body;

  if (!fileData || !mimeType) {
    return res.status(400).json({ success: false, error: "Missing fileData or mimeType" });
  }

  const ai = getGeminiClient();
  if (ai) {
    try {
      // fileData is expected to be a base64 encoded string.
      // If it contains a prefix like "data:application/pdf;base64,", strip it.
      let base64Part = fileData;
      if (fileData.includes(";base64,")) {
        base64Part = fileData.split(";base64,").pop();
      }

      const prompt = `
        You are an expert HR Resume Parser.
        Analyze the attached candidate resume file and extract key details.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [
          {
            inlineData: {
              data: base64Part,
              mimeType: mimeType,
            },
          },
          { text: prompt },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              fullName: { type: Type.STRING, description: "Extract candidate's full name. If not found, use an empty string or derive from filename." },
              email: { type: Type.STRING, description: "Extract candidate's email address. If not found, use an empty string." },
              mobileNumber: { type: Type.STRING, description: "Extract candidate's mobile number. If not found, use an empty string." },
              education: { type: Type.STRING, description: "Extract highest education credential (e.g., 'B.Tech CSE', 'MCA', 'MBA'). If not found, use an empty string." },
              skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Extract a clean list of professional skills as strings. If none, use empty array." },
              experience: { type: Type.STRING, description: "Extract a brief 1-sentence summary of professional experience, or 'Fresher' if no experience." }
            },
            required: ["fullName", "email", "mobileNumber", "education", "skills", "experience"]
          }
        },
      });

      const responseText = response.text?.trim() || "{}";
      const analysis = robustJsonParse(responseText);
      return res.json({ success: true, analysis });
    } catch (error: any) {
      console.error("Gemini Resume Analysis error, falling back:", error);
    }
  }

  // Fallback / Algorithmic mock parser when Gemini is disabled or errors out
  console.log("Using fallback resume parsing heuristics for", fileName);
  
  // Heuristics based on filename
  const cleanName = fileName ? fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ") : "Candidate";
  const nameWords = cleanName.split(" ").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  
  const mockAnalysis = {
    fullName: nameWords.match(/resume|cv/i) ? "" : nameWords,
    email: `${cleanName.toLowerCase().replace(/\s+/g, "")}@gmail.com`,
    mobileNumber: "9876543210",
    education: "B.Tech in Computer Science",
    skills: ["React", "TypeScript", "JavaScript", "SQL", "Tailwind CSS"],
    experience: "Entry Level Developer with academic project experience"
  };

  return res.json({ success: true, isMock: true, analysis: mockAnalysis });
});

// LOCATION INTELLIGENCE
app.post("/api/location-intelligence", async (req, res) => {
  const { location = "Hyderabad" } = req.body;

  const ai = getGeminiClient();
  if (ai) {
    try {
      const prompt = `
        You are a Regional Labor Market Analyst.
        Analyze the skill ecosystem and hiring trends for the location: "${location}".
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              locationName: { type: Type.STRING, description: "Name of the location analyzed." },
              topHiringCompanies: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 popular companies/startups active in this location." },
              mostDemandedSkills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "4 top technical skills in demand here." },
              candidatesCount: { type: Type.INTEGER, description: "Realistic candidates count in that location (e.g. 120-1500)." },
              availableProjectsCount: { type: Type.INTEGER, description: "Realistic count of available projects (e.g. 15-95)." },
              topCategories: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 top technical categories." },
              skillDistribution: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    skill: { type: Type.STRING },
                    percentage: { type: Type.INTEGER }
                  },
                  required: ["skill", "percentage"]
                },
                description: "4 skills and their percentage distribution."
              }
            },
            required: ["locationName", "topHiringCompanies", "mostDemandedSkills", "candidatesCount", "availableProjectsCount", "topCategories", "skillDistribution"]
          }
        }
      });

      const responseText = response.text?.trim() || "{}";
      const intelligence = robustJsonParse(responseText);
      return res.json({ success: true, intelligence });
    } catch (error) {
      console.error("Gemini Location Intelligence error, falling back:", error);
    }
  }

  // Fallback location intelligence based on location
  const cleanLoc = location.trim().toLowerCase();
  let intelligence = {
    locationName: location,
    topHiringCompanies: ["TCS Global", "Wipro Digital", "InnoTech Labs"],
    mostDemandedSkills: ["React", "Python", "Cloud Computing", "SQL"],
    candidatesCount: 340,
    availableProjectsCount: 24,
    topCategories: ["Software Development", "Data Analytics", "Cloud DevOps"],
    skillDistribution: [
      { skill: "React", percentage: 40 },
      { skill: "Python", percentage: 25 },
      { skill: "Cloud Computing", percentage: 20 },
      { skill: "SQL", percentage: 15 }
    ]
  };

  if (cleanLoc.includes("hyderabad")) {
    intelligence = {
      locationName: "Hyderabad",
      topHiringCompanies: ["Microsoft R&D", "Google Hyderabad", "Amazon AWS", "Tech Mahindra"],
      mostDemandedSkills: ["Java Spring Boot", "AWS Cloud", "React & Redux", "Python AI"],
      candidatesCount: 1450,
      availableProjectsCount: 88,
      topCategories: ["Enterprise Solutions", "Cloud Engineering", "Full Stack Web Development"],
      skillDistribution: [
        { skill: "Java", percentage: 35 },
        { skill: "AWS Cloud", percentage: 30 },
        { skill: "React", percentage: 20 },
        { skill: "Python", percentage: 15 }
      ]
    };
  } else if (cleanLoc.includes("visakhapatnam") || cleanLoc.includes("vizag")) {
    intelligence = {
      locationName: "Visakhapatnam",
      topHiringCompanies: ["Symbiosis Tech", "Fluentgrid", "Conduent", "Wipro Vizag"],
      mostDemandedSkills: ["Web Development", "Data Science", "Cybersecurity", "Embedded Systems"],
      candidatesCount: 680,
      availableProjectsCount: 35,
      topCategories: ["Smart Cities Infrastructure", "Web Applications", "E-Commerce Integrations"],
      skillDistribution: [
        { skill: "React", percentage: 40 },
        { skill: "Data Science", percentage: 25 },
        { skill: "Cybersecurity", percentage: 18 },
        { skill: "Embedded Systems", percentage: 17 }
      ]
    };
  } else if (cleanLoc.includes("kakinada")) {
    intelligence = {
      locationName: "Kakinada",
      topHiringCompanies: ["Sankhya Technologies", "Cyient", "Infotech Solutions"],
      mostDemandedSkills: ["Python Django", "IoT Architectures", "HTML/CSS/JS", "SQL Databases"],
      candidatesCount: 290,
      availableProjectsCount: 12,
      topCategories: ["Agricultural Technology", "Industrial Systems", "Web Portals"],
      skillDistribution: [
        { skill: "Python", percentage: 35 },
        { skill: "HTML/CSS/JS", percentage: 30 },
        { skill: "SQL Databases", percentage: 20 },
        { skill: "IoT", percentage: 15 }
      ]
    };
  } else if (cleanLoc.includes("rajahmundry")) {
    intelligence = {
      locationName: "Rajahmundry",
      topHiringCompanies: ["Godavari Digital", "SRK Technologies", "Local Business Systems"],
      mostDemandedSkills: ["E-Commerce Management", "PHP Laravel", "Mobile Flutter", "SEO & Marketing"],
      candidatesCount: 210,
      availableProjectsCount: 8,
      topCategories: ["Digital Commerce", "Mobile App Development", "Business Automation"],
      skillDistribution: [
        { skill: "E-Commerce", percentage: 35 },
        { skill: "PHP Laravel", percentage: 25 },
        { skill: "Mobile Flutter", percentage: 20 },
        { skill: "Digital Marketing", percentage: 20 }
      ]
    };
  } else if (cleanLoc.includes("vijayawada")) {
    intelligence = {
      locationName: "Vijayawada",
      topHiringCompanies: ["Krishna Digital Solutions", "HCL Vijayawada", "Apex Soft", "Efftronics"],
      mostDemandedSkills: ["PHP Laravel", "MySql Database", "Android Development", "Angular Framework"],
      candidatesCount: 520,
      availableProjectsCount: 28,
      topCategories: ["E-Commerce Portals", "Custom ERP Solutions", "Mobile App Development"],
      skillDistribution: [
        { skill: "PHP Laravel", percentage: 35 },
        { skill: "MySql", percentage: 25 },
        { skill: "Android Dev", percentage: 20 },
        { skill: "Angular", percentage: 20 }
      ]
    };
  } else if (cleanLoc.includes("guntur")) {
    intelligence = {
      locationName: "Guntur",
      topHiringCompanies: ["Amaravati Cloud Labs", "Nalanda Software", "Tech Mahindra Guntur", "Vignan Solutions"],
      mostDemandedSkills: ["Python Django", "Cloud Infrastructure", "Docker & Kubernetes", "React JS"],
      candidatesCount: 460,
      availableProjectsCount: 19,
      topCategories: ["AgriTech Platforms", "Cloud Migrations", "Enterprise Web Development"],
      skillDistribution: [
        { skill: "Python Django", percentage: 40 },
        { skill: "Cloud DevOps", percentage: 25 },
        { skill: "React", percentage: 20 },
        { skill: "Docker & K8s", percentage: 15 }
      ]
    };
  }

  return res.json({ success: true, isMock: true, intelligence });
});

// Vite middleware / Static serving setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n  🚀 AI Skill Bridge is running!`);
    console.log(`  ➜  Local:   http://localhost:${PORT}/`);
    console.log(`  ➜  Network: http://127.0.0.1:${PORT}/\n`);
  });
}

startServer();
