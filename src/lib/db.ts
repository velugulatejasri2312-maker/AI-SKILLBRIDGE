import { 
  UserProfile, 
  CompanyProfile, 
  ProjectPosting, 
  Application, 
  Course, 
  SystemNotification,
  LocationStats 
} from "../types";
import { 
  isFirestoreConnected, 
  syncLocalCollectionToFirestore, 
  downloadCollectionFromFirestore 
} from "./firebase";


// Seed Data
const initialCompanies: CompanyProfile[] = [
  {
    id: "company-1",
    name: "Astra AI Labs",
    description: "Building next-generation generative AI products for agriculture and fintech.",
    website: "https://astra-ai.io",
    location: "Hyderabad",
    logoUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&auto=format&fit=crop&q=60",
    createdBy: "admin-id",
    createdAt: new Date().toISOString()
  },
  {
    id: "company-2",
    name: "Godavari AgriTech",
    description: "Pioneering sustainable digital systems and IoT nodes for coastal agriculture.",
    website: "https://godavariagri.tech",
    location: "Kakinada",
    logoUrl: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=100&auto=format&fit=crop&q=60",
    createdBy: "admin-id",
    createdAt: new Date().toISOString()
  },
  {
    id: "company-3",
    name: "Vizag Marine Soft",
    description: "Cybersecurity, smart ports software and logistics management consulting.",
    website: "https://vizagmarinesoft.com",
    location: "Visakhapatnam",
    logoUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=100&auto=format&fit=crop&q=60",
    createdBy: "admin-id",
    createdAt: new Date().toISOString()
  },
  {
    id: "company-4",
    name: "Rajahmundry Paper & Tech",
    description: "Developing green, eco-friendly smart packaging and manufacturing systems integration.",
    website: "https://rjy-papertech.io",
    location: "Rajahmundry",
    logoUrl: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=100&auto=format&fit=crop&q=60",
    createdBy: "admin-id",
    createdAt: new Date().toISOString()
  },
  {
    id: "company-5",
    name: "Krishna Digital Solutions",
    description: "Full-scale web products, custom ERP frameworks, and business software consulting.",
    website: "https://krishnadata.com",
    location: "Vijayawada",
    logoUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&auto=format&fit=crop&q=60",
    createdBy: "admin-id",
    createdAt: new Date().toISOString()
  },
  {
    id: "company-6",
    name: "Amaravati Cloud Labs",
    description: "Enterprise SaaS architecture, cloud deployments, and local digital transformation.",
    website: "https://amaravaticloud.in",
    location: "Guntur",
    logoUrl: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=100&auto=format&fit=crop&q=60",
    createdBy: "admin-id",
    createdAt: new Date().toISOString()
  }
];

const initialProjects: ProjectPosting[] = [
  {
    id: "project-1",
    companyId: "company-1",
    companyName: "Astra AI Labs",
    title: "Generative AI Python Developer",
    description: "Looking for an engineer to integrate large language models with automated data analytics pipelines. Responsibilities include prompt engineering, python API development, and data cleaning.",
    type: "Project",
    requiredSkills: ["Python", "Machine Learning", "FastAPI", "Generative AI"],
    duration: "3 Months",
    deadline: "2026-08-15",
    vacancies: 3,
    salary: "₹45,000 / month",
    approved: true,
    createdBy: "company-user-1",
    createdAt: new Date().toISOString(),
    location: "Hyderabad"
  },
  {
    id: "project-2",
    companyId: "company-2",
    companyName: "Godavari AgriTech",
    title: "IoT Node Controller Internship",
    description: "Design and implement firmware on microcontrollers for coastal climate sensing array networks. Work directly with sensors and real-time telemetry protocols.",
    type: "Internship",
    requiredSkills: ["Embedded Systems", "C++", "IoT", "SQL"],
    duration: "6 Months",
    deadline: "2026-08-30",
    vacancies: 5,
    salary: "₹15,000 / month",
    approved: true,
    createdBy: "company-user-2",
    createdAt: new Date().toISOString(),
    location: "Kakinada"
  },
  {
    id: "project-3",
    companyId: "company-3",
    companyName: "Vizag Marine Soft",
    title: "React Security Engineer",
    description: "Develop secure frontend components for seaport freight portals. Focus on authorization logic, responsive UI, and state synchronization.",
    type: "Project",
    requiredSkills: ["React", "TypeScript", "Cybersecurity", "Tailwind CSS"],
    duration: "4 Months",
    deadline: "2026-09-01",
    vacancies: 2,
    salary: "₹50,000 / month",
    approved: true,
    createdBy: "company-user-3",
    createdAt: new Date().toISOString(),
    location: "Visakhapatnam"
  },
  {
    id: "project-4",
    companyId: "company-1",
    companyName: "Astra AI Labs",
    title: "Data Operations Assistant",
    description: "Review and label datasets for model fine-tuning. This project is pending admin approval and demonstrates the admin panel approval flow.",
    type: "Project",
    requiredSkills: ["Python", "SQL", "Communication"],
    duration: "2 Months",
    deadline: "2026-08-20",
    vacancies: 2,
    salary: "₹25,000 / month",
    approved: false, // Unapproved, shows in admin panel
    createdBy: "company-user-1",
    createdAt: new Date().toISOString(),
    location: "Hyderabad"
  },
  {
    id: "project-5",
    companyId: "company-4",
    companyName: "Rajahmundry Paper & Tech",
    title: "Mobile Flutter Developer",
    description: "Create an internal tablet application using Flutter to monitor smart roll cutting machines and log waste management cycles.",
    type: "Project",
    requiredSkills: ["Mobile Flutter", "PHP Laravel", "E-Commerce", "Digital Marketing"],
    duration: "4 Months",
    deadline: "2026-09-10",
    vacancies: 2,
    salary: "₹35,000 / month",
    approved: true,
    createdBy: "admin-id",
    createdAt: new Date().toISOString(),
    location: "Rajahmundry"
  },
  {
    id: "project-6",
    companyId: "company-5",
    companyName: "Krishna Digital Solutions",
    title: "PHP Laravel Developer Internship",
    description: "Build custom accounting endpoints and optimize heavy database queries for a client's e-commerce platform.",
    type: "Internship",
    requiredSkills: ["PHP Laravel", "MySql", "Android Dev", "Angular"],
    duration: "3 Months",
    deadline: "2026-08-25",
    vacancies: 4,
    salary: "₹12,000 / month",
    approved: true,
    createdBy: "admin-id",
    createdAt: new Date().toISOString(),
    location: "Vijayawada"
  },
  {
    id: "project-7",
    companyId: "company-6",
    companyName: "Amaravati Cloud Labs",
    title: "Cloud Migration Specialist",
    description: "Assist in deploying agricultural monitoring systems onto secure multi-region cloud infrastructures using Docker containers.",
    type: "Project",
    requiredSkills: ["Python Django", "Docker & K8s", "React", "Cloud DevOps"],
    duration: "5 Months",
    deadline: "2026-09-15",
    vacancies: 3,
    salary: "₹40,000 / month",
    approved: true,
    createdBy: "admin-id",
    createdAt: new Date().toISOString(),
    location: "Guntur"
  }
];

const initialUsers: UserProfile[] = [
  {
    id: "user-student-1",
    fullName: "Arjun Prasad",
    email: "arjun@gmail.com",
    mobileNumber: "9876543210",
    role: "Student",
    location: "Kakinada",
    education: "B.Tech Computer Science, JNTU Kakinada",
    skills: ["Python", "C++", "Communication"],
    experience: "Academic projects in Python and Embedded controllers",
    resumeUrl: "#",
    resumeName: "Arjun_Prasad_Resume.pdf",
    profilePhotoUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=60",
    createdAt: new Date().toISOString()
  },
  {
    id: "user-student-2",
    fullName: "Kiran Dev",
    email: "kiran@gmail.com",
    mobileNumber: "9123456789",
    role: "Student",
    location: "Rajahmundry",
    education: "B.Tech IT, Adikavi Nannaya University",
    skills: ["PHP Laravel", "Mobile Flutter", "Digital Marketing"],
    experience: "Hobby projects on mobile app creation",
    resumeUrl: "#",
    resumeName: "Kiran_Dev_Resume.pdf",
    profilePhotoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60",
    createdAt: new Date().toISOString()
  },
  {
    id: "user-student-3",
    fullName: "Ravi Kumar",
    email: "ravi@gmail.com",
    mobileNumber: "9345678901",
    role: "Student",
    location: "Vijayawada",
    education: "B.Tech CSE, VR Siddhartha Engineering College",
    skills: ["PHP Laravel", "MySql", "Android Dev"],
    experience: "Academic assignment on secure client billing portals",
    resumeUrl: "#",
    resumeName: "Ravi_Kumar_Resume.pdf",
    profilePhotoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60",
    createdAt: new Date().toISOString()
  },
  {
    id: "user-unemployed-1",
    fullName: "Lakshmi Reddy",
    email: "lakshmi@gmail.com",
    mobileNumber: "9988776655",
    role: "Unemployed Candidate",
    location: "Visakhapatnam",
    education: "MCA, Andhra University",
    skills: ["React", "TypeScript", "HTML/CSS/JS"],
    experience: "1 Year freelance web developer focusing on responsive landing pages",
    resumeUrl: "#",
    resumeName: "Lakshmi_Reddy_CV.pdf",
    profilePhotoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60",
    createdAt: new Date().toISOString()
  },
  {
    id: "user-unemployed-2",
    fullName: "Sita Nair",
    email: "sita@gmail.com",
    mobileNumber: "9234567890",
    role: "Unemployed Candidate",
    location: "Rajahmundry",
    education: "B.Sc Computer Science",
    skills: ["E-Commerce", "Digital Marketing"],
    experience: "Managed local brick & mortar store's online presence",
    resumeUrl: "#",
    resumeName: "Sita_Nair_CV.pdf",
    profilePhotoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
    createdAt: new Date().toISOString()
  },
  {
    id: "user-unemployed-3",
    fullName: "Nitin Rao",
    email: "nitin@gmail.com",
    mobileNumber: "9567890123",
    role: "Unemployed Candidate",
    location: "Guntur",
    education: "B.Tech ECE, Vignan University",
    skills: ["Python Django", "Docker & K8s"],
    experience: "Freelance web design and server dockerization",
    resumeUrl: "#",
    resumeName: "Nitin_Rao_CV.pdf",
    profilePhotoUrl: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&auto=format&fit=crop&q=60",
    createdAt: new Date().toISOString()
  },
  {
    id: "user-employee-1",
    fullName: "Teja Sri Velugula",
    email: "teja@gmail.com",
    mobileNumber: "7766554433",
    role: "Employee",
    location: "Hyderabad",
    education: "M.Tech Systems Science, IIIT Hyderabad",
    skills: ["React", "Python", "Cloud Computing", "SQL"],
    experience: "Software Engineer at Tech Global (2 Years)",
    resumeUrl: "#",
    resumeName: "Teja_Sri_Velugula_Resume.pdf",
    profilePhotoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=60",
    createdAt: new Date().toISOString()
  },
  {
    id: "user-employee-2",
    fullName: "Pallavi Joshi",
    email: "pallavi@gmail.com",
    mobileNumber: "9456789012",
    role: "Employee",
    location: "Vijayawada",
    education: "MCA, VR Siddhartha",
    skills: ["PHP Laravel", "Angular", "MySql"],
    experience: "Software Engineer at Apex Solutions (3 Years)",
    resumeUrl: "#",
    resumeName: "Pallavi_Joshi_Resume.pdf",
    profilePhotoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=60",
    createdAt: new Date().toISOString()
  },
  {
    id: "user-employee-3",
    fullName: "Deepa Nair",
    email: "deepa@gmail.com",
    mobileNumber: "9678901234",
    role: "Employee",
    location: "Guntur",
    education: "B.Tech IT, Nalanda College",
    skills: ["React", "Cloud DevOps", "Python Django"],
    experience: "Cloud Associate at Amravati Labs (2 Years)",
    resumeUrl: "#",
    resumeName: "Deepa_Nair_Resume.pdf",
    profilePhotoUrl: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=100&auto=format&fit=crop&q=60",
    createdAt: new Date().toISOString()
  },
  {
    id: "user-company-1",
    fullName: "Ramesh Kumar",
    email: "hr@astra.io",
    mobileNumber: "9112233445",
    role: "Company",
    location: "Hyderabad",
    education: "MBA HR, Osmania University",
    skills: [],
    companyName: "Astra AI Labs",
    profilePhotoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=60",
    createdAt: new Date().toISOString()
  },
  {
    id: "user-admin",
    fullName: "System Admin",
    email: "admin@skillbridge.org",
    mobileNumber: "9000000000",
    role: "Admin",
    location: "Hyderabad",
    education: "Ecosystem Operations Specialist",
    skills: ["Governance", "Analytics"],
    profilePhotoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=60",
    createdAt: new Date().toISOString()
  }
];

const initialCourses: Course[] = [
  {
    id: "course-1",
    name: "Machine Learning Basics for Software Engineers",
    description: "Learn Python-based machine learning fundamentals including linear models, trees, neural network concepts, and data preprocessing with pandas and numpy.",
    skills: ["Machine Learning", "Python"],
    duration: "15 Hours",
    difficulty: "Beginner",
    certificate: true,
    outcome: "Able to construct and fine-tune tabular classification models in scikit-learn."
  },
  {
    id: "course-2",
    name: "FastAPI Production Architectures",
    description: "Complete guide to REST API design, asynchronous processing, Docker containers, database optimization, and cloud deployments with FastAPI.",
    skills: ["FastAPI", "Python"],
    duration: "12 Hours",
    difficulty: "Intermediate",
    certificate: true,
    outcome: "Implement scalable, secure, and fully documented microservices in production."
  },
  {
    id: "course-3",
    name: "Comprehensive Generative AI & LLM Systems",
    description: "Build interactive agents, chat pipelines, vector indexes, and customize models using prompt engineering and deep evaluation frameworks.",
    skills: ["Generative AI", "Python", "Machine Learning"],
    duration: "20 Hours",
    difficulty: "Advanced",
    certificate: true,
    outcome: "Architect complex orchestration systems using modern generative foundation frameworks."
  },
  {
    id: "course-4",
    name: "Cybersecurity Fundamentals for Web Systems",
    description: "Understand authorization patterns, defense against OWASP top 10 vulnerabilities, secure web socket handling, and cryptographic essentials.",
    skills: ["Cybersecurity", "React", "TypeScript"],
    duration: "18 Hours",
    difficulty: "Intermediate",
    certificate: true,
    outcome: "Confidently build secure React applications capable of defending against major client and API attacks."
  }
];

const initialApplications: Application[] = [
  {
    id: "app-1",
    projectId: "project-1",
    projectTitle: "Generative AI Python Developer",
    projectType: "Project",
    companyId: "company-1",
    companyName: "Astra AI Labs",
    candidateId: "user-student-1",
    candidateName: "Arjun Prasad",
    candidateEmail: "arjun@gmail.com",
    candidateSkills: ["Python", "C++", "Communication"],
    candidateResumeName: "Arjun_Prasad_Resume.pdf",
    status: "Pending",
    aiMatchScore: 67,
    aiReport: {
      matchPercentage: 67,
      matchingSkills: ["Python"],
      missingSkills: ["Machine Learning", "FastAPI", "Generative AI"],
      strengths: [
        "Strong fundamental skills in Python and OOP principles",
        "Clear communication style in academic settings"
      ],
      weaknesses: [
        "Lacks production framework experience (FastAPI)",
        "No hands-on Generative AI API exposure"
      ],
      estimatedLearningTime: "30 Days",
      recommendedLearningPath: [
        "1. Complete 'Machine Learning Basics for Software Engineers' course.",
        "2. Study FastAPI microservice configuration.",
        "3. Build a simple LLM integration project."
      ],
      suggestedCertification: "Machine Learning Basics Professional"
    },
    appliedAt: new Date(Date.now() - 3600000 * 24).toISOString() // 1 day ago
  }
];

const initialNotifications: SystemNotification[] = [
  {
    id: "notif-1",
    userId: "user-student-1",
    title: "Welcome to AI Skill Bridge!",
    message: "Create your profile, enter your skills, and let our HR AI match you to premium internships in Andhra Pradesh and beyond.",
    type: "system",
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

// Helper to check and initialize local storage
function initLocalStorage() {
  if (!localStorage.getItem("sb_companies")) {
    localStorage.setItem("sb_companies", JSON.stringify(initialCompanies));
  }
  if (!localStorage.getItem("sb_projects")) {
    localStorage.setItem("sb_projects", JSON.stringify(initialProjects));
  }
  if (!localStorage.getItem("sb_users")) {
    localStorage.setItem("sb_users", JSON.stringify(initialUsers));
  }
  if (!localStorage.getItem("sb_courses")) {
    localStorage.setItem("sb_courses", JSON.stringify(initialCourses));
  }
  if (!localStorage.getItem("sb_applications")) {
    localStorage.setItem("sb_applications", JSON.stringify(initialApplications));
  }
  if (!localStorage.getItem("sb_notifications")) {
    localStorage.setItem("sb_notifications", JSON.stringify(initialNotifications));
  }
}

initLocalStorage();

// Getters and Setters for local collections
export const db = {
  getUsers: (): UserProfile[] => JSON.parse(localStorage.getItem("sb_users") || "[]"),
  setUsers: (users: UserProfile[]) => {
    localStorage.setItem("sb_users", JSON.stringify(users));
    if (isFirestoreConnected) {
      syncLocalCollectionToFirestore("users", users);
    }
  },

  getCompanies: (): CompanyProfile[] => JSON.parse(localStorage.getItem("sb_companies") || "[]"),
  setCompanies: (companies: CompanyProfile[]) => {
    localStorage.setItem("sb_companies", JSON.stringify(companies));
    if (isFirestoreConnected) {
      syncLocalCollectionToFirestore("companies", companies);
    }
  },

  getProjects: (): ProjectPosting[] => JSON.parse(localStorage.getItem("sb_projects") || "[]"),
  setProjects: (projects: ProjectPosting[]) => {
    localStorage.setItem("sb_projects", JSON.stringify(projects));
    if (isFirestoreConnected) {
      syncLocalCollectionToFirestore("projects", projects);
    }
  },

  getApplications: (): Application[] => JSON.parse(localStorage.getItem("sb_applications") || "[]"),
  setApplications: (applications: Application[]) => {
    localStorage.setItem("sb_applications", JSON.stringify(applications));
    if (isFirestoreConnected) {
      syncLocalCollectionToFirestore("applications", applications);
    }
  },

  getCourses: (): Course[] => JSON.parse(localStorage.getItem("sb_courses") || "[]"),
  setCourses: (courses: Course[]) => {
    localStorage.setItem("sb_courses", JSON.stringify(courses));
    if (isFirestoreConnected) {
      syncLocalCollectionToFirestore("courses", courses);
    }
  },

  getNotifications: (): SystemNotification[] => JSON.parse(localStorage.getItem("sb_notifications") || "[]"),
  setNotifications: (notifs: SystemNotification[]) => {
    localStorage.setItem("sb_notifications", JSON.stringify(notifs));
    if (isFirestoreConnected) {
      syncLocalCollectionToFirestore("notifications", notifs);
    }
  },

  syncWithFirestore: async () => {
    if (!isFirestoreConnected) return;
    try {
      console.log("Synchronizing with Firestore...");
      const firestoreUsers = await downloadCollectionFromFirestore("users", "sb_users");
      const firestoreCompanies = await downloadCollectionFromFirestore("companies", "sb_companies");
      const firestoreProjects = await downloadCollectionFromFirestore("projects", "sb_projects");
      const firestoreApplications = await downloadCollectionFromFirestore("applications", "sb_applications");
      const firestoreCourses = await downloadCollectionFromFirestore("courses", "sb_courses");
      const firestoreNotifications = await downloadCollectionFromFirestore("notifications", "sb_notifications");

      if (firestoreUsers.length === 0) {
        await syncLocalCollectionToFirestore("users", db.getUsers());
      }
      if (firestoreCompanies.length === 0) {
        await syncLocalCollectionToFirestore("companies", db.getCompanies());
      }
      if (firestoreProjects.length === 0) {
        await syncLocalCollectionToFirestore("projects", db.getProjects());
      }
      if (firestoreApplications.length === 0) {
        await syncLocalCollectionToFirestore("applications", db.getApplications());
      }
      if (firestoreCourses.length === 0) {
        await syncLocalCollectionToFirestore("courses", db.getCourses());
      }
      if (firestoreNotifications.length === 0) {
        await syncLocalCollectionToFirestore("notifications", db.getNotifications());
      }
    } catch (e) {
      console.error("Firestore sync error:", e);
    }
  },

  // Complex Operations
  signUp: (user: Omit<UserProfile, "id" | "createdAt">, password?: string): UserProfile => {
    const users = db.getUsers();
    
    // Check if email exists
    const existing = users.find(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (existing) {
      throw new Error("A user with this email already exists.");
    }

    const newUser: UserProfile = {
      ...user,
      id: `user-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    db.setUsers(users);

    // If company role, automatically register a company shell for them to customize
    if (newUser.role === "Company") {
      const companies = db.getCompanies();
      const newCompany: CompanyProfile = {
        id: `company-${Math.random().toString(36).substring(2, 9)}`,
        name: newUser.companyName || `${newUser.fullName}'s Venture`,
        description: "Company description pending creation...",
        website: "https://",
        location: newUser.location,
        createdBy: newUser.id,
        createdAt: new Date().toISOString()
      };
      companies.push(newCompany);
      db.setCompanies(companies);

      // Create notification
      db.createNotification({
        userId: "user-admin",
        title: "New Company Registered",
        message: `${newCompany.name} has registered a corporate profile under ${newUser.fullName}.`,
        type: "company_registered"
      });
    }

    return newUser;
  },

  signIn: (email: string, password?: string): UserProfile => {
    const users = db.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error("Invalid email or password.");
    }
    return user;
  },

  forgotPassword: (email: string): string => {
    const users = db.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error("Email not registered in the system.");
    }
    return `Reset link dispatched to ${email}`;
  },

  addProject: (posting: Omit<ProjectPosting, "id" | "createdAt" | "approved">): ProjectPosting => {
    const projects = db.getProjects();
    const company = db.getCompanies().find(c => c.id === posting.companyId);
    const newProject: ProjectPosting = {
      ...posting,
      id: `project-${Math.random().toString(36).substring(2, 9)}`,
      approved: false, // All postings need Admin approval first
      createdAt: new Date().toISOString(),
      location: posting.location || company?.location || "Hyderabad"
    };
    projects.push(newProject);
    db.setProjects(projects);

    // Create admin notification
    db.createNotification({
      userId: "user-admin",
      title: "Project Pending Approval",
      message: `"${newProject.title}" was posted by ${newProject.companyName} and requires approval.`,
      type: "project_posted"
    });

    return newProject;
  },

  approveProject: (projectId: string): ProjectPosting => {
    const projects = db.getProjects();
    const index = projects.findIndex(p => p.id === projectId);
    if (index === -1) throw new Error("Project not found.");
    
    projects[index].approved = true;
    db.setProjects(projects);

    // Notify users about a newly approved project
    const candidates = db.getUsers().filter(u => u.role !== "Company" && u.role !== "Admin");
    candidates.forEach(cand => {
      db.createNotification({
        userId: cand.id,
        title: "New Opportunity Live",
        message: `${projects[index].companyName} is hiring: "${projects[index].title}". Apply now!`,
        type: "project_posted"
      });
    });

    return projects[index];
  },

  addApplication: async (projectId: string, candidateId: string): Promise<Application> => {
    const projects = db.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) throw new Error("Project not found");

    const users = db.getUsers();
    const candidate = users.find(u => u.id === candidateId);
    if (!candidate) throw new Error("Candidate not found");

    // Avoid double apply
    const apps = db.getApplications();
    const alreadyApplied = apps.some(a => a.projectId === projectId && a.candidateId === candidateId);
    if (alreadyApplied) {
      throw new Error("You have already applied for this role.");
    }

    // Call the server API endpoint for real AI matching!
    let aiReportData = null;
    let matchScore = 50;

    const maxRetries = 3;
    let attempt = 0;
    let success = false;

    while (attempt < maxRetries && !success) {
      try {
        const res = await fetch("/api/match-skills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateSkills: candidate.skills,
            requiredSkills: project.requiredSkills,
            projectTitle: project.title,
            projectDescription: project.description
          })
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        if (data.success && data.analysis) {
          aiReportData = data.analysis;
          matchScore = data.analysis.matchPercentage;
          success = true;
        } else {
          throw new Error("API response did not report success or contained no analysis data");
        }
      } catch (e) {
        attempt++;
        console.warn(`Attempt ${attempt} to fetch live AI match score failed:`, e);
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        } else {
          console.error("All attempts to fetch live AI match score failed, using client fallback calculation", e);
        }
      }
    }

    // Secondary client fallback if the API call failed or had issues
    if (!aiReportData) {
      const candSkillsSet = new Set(candidate.skills.map(s => s.toLowerCase().trim()));
      const matching = project.requiredSkills.filter(s => candSkillsSet.has(s.toLowerCase().trim()));
      const missing = project.requiredSkills.filter(s => !candSkillsSet.has(s.toLowerCase().trim()));
      matchScore = project.requiredSkills.length > 0 
        ? Math.round((matching.length / project.requiredSkills.length) * 100) 
        : 100;
      
      aiReportData = {
        matchPercentage: matchScore,
        matchingSkills: matching,
        missingSkills: missing,
        strengths: ["Highly enthusiastic to onboard", "Strong fundamentals"],
        weaknesses: missing.length > 0 ? [`Missing ${missing.join(", ")}`] : ["None identified"],
        estimatedLearningTime: `${missing.length * 10} Days`,
        recommendedLearningPath: missing.map(s => `Take an intro course in ${s}`),
        suggestedCertification: `${missing[0] || "General Engineering"} Foundation Certificate`,
        expectedMatchAfterCourse: Math.max(90, Math.min(100, matchScore + (missing.length > 0 ? 35 : 0)))
      };
    }

    const newApp: Application = {
      id: `app-${Math.random().toString(36).substring(2, 9)}`,
      projectId,
      projectTitle: project.title,
      projectType: project.type,
      companyId: project.companyId,
      companyName: project.companyName,
      candidateId,
      candidateName: candidate.fullName,
      candidateEmail: candidate.email,
      candidateSkills: candidate.skills,
      candidateResumeUrl: candidate.resumeUrl,
      candidateResumeName: candidate.resumeName || "Uploaded_CV.pdf",
      candidatePhotoUrl: candidate.profilePhotoUrl,
      candidatePhotoPosition: candidate.profilePhotoPosition || "top",
      status: "Pending",
      aiMatchScore: matchScore,
      aiReport: aiReportData,
      appliedAt: new Date().toISOString()
    };

    apps.push(newApp);
    db.setApplications(apps);

    // Notify company
    const companyUser = users.find(u => u.id === project.createdBy);
    if (companyUser) {
      db.createNotification({
        userId: companyUser.id,
        title: "New Candidate Applied",
        message: `${candidate.fullName} applied for ${project.title} (Match score: ${matchScore}%).`,
        type: "project_posted"
      });
    }

    // Auto-Recommend a Course to Candidate if match is less than 100%
    if (aiReportData.missingSkills && aiReportData.missingSkills.length > 0) {
      // Create course recommendation notification
      db.createNotification({
        userId: candidateId,
        title: "AI Course Recommendation",
        message: `Boost your skill match score for "${project.title}" from ${matchScore}% to near 95% by learning: ${aiReportData.missingSkills[0]}.`,
        type: "course_recommended"
      });
    }

    return newApp;
  },

  updateApplicationStatus: (applicationId: string, status: "Approved" | "Rejected", rejectionReason?: string) => {
    const apps = db.getApplications();
    const index = apps.findIndex(a => a.id === applicationId);
    if (index === -1) throw new Error("Application not found");

    apps[index].status = status;
    if (rejectionReason && apps[index].aiReport) {
      apps[index].aiReport!.rejectionReason = rejectionReason;
    }
    db.setApplications(apps);

    // Notify applicant
    db.createNotification({
      userId: apps[index].candidateId,
      title: status === "Approved" ? "Application Approved! 🎉" : "Application Decision Update",
      message: status === "Approved" 
        ? `Congratulations! ${apps[index].companyName} has accepted your application for ${apps[index].projectTitle}. They will contact you shortly.`
        : `Thank you for applying. Unfortunately, ${apps[index].companyName} is looking for candidate skills in other departments right now. Rejection details: ${rejectionReason || "Core skills discrepancy"}`,
      type: status === "Approved" ? "application_approved" : "application_rejected"
    });

    return apps[index];
  },

  updateUserProfile: (userId: string, updatedProfile: Partial<UserProfile>): UserProfile => {
    const users = db.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error("User profile not found");

    users[index] = { ...users[index], ...updatedProfile } as UserProfile;
    db.setUsers(users);
    return users[index];
  },

  completeCourse: (userId: string, courseId: string): { user: UserProfile, course: Course } => {
    const courses = db.getCourses();
    const courseIndex = courses.findIndex(c => c.id === courseId);
    if (courseIndex === -1) throw new Error("Course not found");

    const course = courses[courseIndex];
    if (!course.completedByUsers) course.completedByUsers = [];
    if (!course.completedByUsers.includes(userId)) {
      course.completedByUsers.push(userId);
    }
    db.setCourses(courses);

    const users = db.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error("User not found");

    const user = users[userIndex];
    // Add missing skills from course to user's skill set
    const earnedSkills = course.skills.filter(s => !user.skills.includes(s));
    if (earnedSkills.length > 0) {
      user.skills = [...user.skills, ...earnedSkills];
      db.setUsers(users);
    }

    // Update candidate's submitted application matching scores in real-time
    const apps = db.getApplications();
    const updatedApps = apps.map(app => {
      if (app.candidateId === userId) {
        const updatedSkills = Array.from(new Set([...(app.candidateSkills || []), ...earnedSkills]));
        app.candidateSkills = updatedSkills;

        if (app.aiReport) {
          const originalMissing = app.aiReport.missingSkills || [];
          const userSkillsSet = new Set(updatedSkills.map(s => s.toLowerCase().trim()));
          
          const currentMissing = originalMissing.filter(
            sk => !userSkillsSet.has(sk.toLowerCase().trim())
          );
          
          const originalCandSkills = (app.candidateSkills || []).filter(
            s => !originalMissing.some(om => om.toLowerCase().trim() === s.toLowerCase().trim())
          );
          const totalReqCount = originalCandSkills.length + originalMissing.length;
          
          if (totalReqCount > 0) {
            app.aiMatchScore = Math.min(100, Math.round(((totalReqCount - currentMissing.length) / totalReqCount) * 100));
          }
        }
      }
      return app;
    });
    db.setApplications(updatedApps);

    // Create success notification
    db.createNotification({
      userId,
      title: "Course Completed! 🎓",
      message: `You earned a Certificate of Completion for "${course.name}". Added skills: ${course.skills.join(", ")}. Your AI Match Score has been automatically boosted.`,
      type: "course_recommended"
    });

    return { user, course };
  },

  createNotification: (notif: Omit<SystemNotification, "id" | "read" | "createdAt">): SystemNotification => {
    const notifs = db.getNotifications();
    const newNotif: SystemNotification = {
      ...notif,
      id: `notif-${Math.random().toString(36).substring(2, 9)}`,
      read: false,
      createdAt: new Date().toISOString()
    };
    notifs.unshift(newNotif); // latest first
    db.setNotifications(notifs);
    return newNotif;
  },

  markNotificationsRead: (userId: string) => {
    const notifs = db.getNotifications();
    const updated = notifs.map(n => n.userId === userId ? { ...n, read: true } : n);
    db.setNotifications(updated);
  },

  // Admin Actions
  deleteUser: (userId: string) => {
    const users = db.getUsers();
    const filtered = users.filter(u => u.id !== userId);
    db.setUsers(filtered);

    // Also clean apps, companies, etc.
    const companies = db.getCompanies();
    db.setCompanies(companies.filter(c => c.createdBy !== userId));
  },

  deleteCompany: (companyId: string) => {
    const companies = db.getCompanies();
    db.setCompanies(companies.filter(c => c.id !== companyId));
  }
};
