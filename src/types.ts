export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  role: "Student" | "Unemployed Candidate" | "Employee" | "Company" | "Admin";
  location: string;
  education: string;
  skills: string[];
  experience?: string;
  resumeUrl?: string;
  resumeName?: string;
  profilePhotoUrl?: string;
  profilePhotoPosition?: "top" | "center" | "bottom" | "fit";
  companyName?: string; // only if role === "Company"
  createdAt: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  description: string;
  website: string;
  location: string;
  logoUrl?: string;
  createdBy: string;
  createdAt: string;
}

export interface ProjectPosting {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  description: string;
  type: "Project" | "Internship";
  requiredSkills: string[];
  duration: string;
  deadline: string;
  vacancies: number;
  salary: string;
  approved: boolean; // Needs Admin approval
  createdBy: string;
  createdAt: string;
  location?: string;
}

export interface SkillGapReport {
  matchPercentage: number;
  matchingSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  rejectionReason?: string;
  estimatedLearningTime: string;
  recommendedLearningPath: string[];
  suggestedCertification: string;
  expectedMatchAfterCourse?: number;
}

export interface Application {
  id: string;
  projectId: string;
  projectTitle: string;
  projectType: "Project" | "Internship";
  companyId: string;
  companyName: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateSkills: string[];
  candidateResumeUrl?: string;
  candidateResumeName?: string;
  candidatePhotoUrl?: string;
  candidatePhotoPosition?: "top" | "center" | "bottom" | "fit";
  status: "Pending" | "Approved" | "Rejected";
  aiMatchScore: number;
  aiReport?: SkillGapReport;
  appliedAt: string;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  skills: string[];
  duration: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  certificate: boolean;
  outcome: string;
  completedByUsers?: string[]; // list of userIds who completed it
}

export interface SystemNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "project_posted" | "application_approved" | "application_rejected" | "course_recommended" | "company_registered" | "system";
  read: boolean;
  createdAt: string;
}

export interface LocationStats {
  locationName: string;
  topHiringCompanies: string[];
  mostDemandedSkills: string[];
  candidatesCount: number;
  availableProjectsCount: number;
  topCategories: string[];
  skillDistribution: { skill: string; percentage: number }[];
}
