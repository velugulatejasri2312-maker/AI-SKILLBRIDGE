import React, { useState } from "react";
import { db } from "../lib/db";
import { UserProfile, ProjectPosting, Application, Course } from "../types";
import { getPhotoPositionClass, PHOTO_POSITION_OPTIONS } from "../lib/photoUtils";
import { Sparkles, MapPin, Briefcase, Plus, BookOpen, Clock, Award, CheckCircle2, ChevronRight, FileText, Search, PlusCircle, BookmarkCheck, LayoutGrid, RotateCw, X, Edit, Image, Upload, Loader2, Mail, Phone, GraduationCap, User, Focus, Crop, UserCheck } from "lucide-react";

interface CandidateDashboardProps {
  currentUser: UserProfile;
  onRefresh: () => void;
}

export default function CandidateDashboard({ currentUser, onRefresh }: CandidateDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [filterType, setFilterType] = useState<"All" | "Project" | "Internship">("All");
  const [newSkill, setNewSkill] = useState("");
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const [activeTab, setActiveTab] = useState<"dashboard" | "find_work" | "learning">("dashboard");

  // Edit Profile States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState(currentUser.fullName);
  const [editEmail, setEditEmail] = useState(currentUser.email);
  const [editMobile, setEditMobile] = useState(currentUser.mobileNumber || "");
  const [editLocation, setEditLocation] = useState(currentUser.location);
  const [editEducation, setEditEducation] = useState(currentUser.education || "");
  const [editExperience, setEditExperience] = useState(currentUser.experience || "");
  const [editSkillsText, setEditSkillsText] = useState(currentUser.skills.join(", "));
  const [editProfilePhotoUrl, setEditProfilePhotoUrl] = useState(currentUser.profilePhotoUrl || "");
  const [editProfilePhotoPosition, setEditProfilePhotoPosition] = useState<"top" | "center" | "bottom" | "fit">(
    currentUser.profilePhotoPosition || "top"
  );
  const [editResumeName, setEditResumeName] = useState(currentUser.resumeName || "");
  const [editResumeBase64, setEditResumeBase64] = useState(currentUser.resumeUrl || "");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleOpenEditModal = () => {
    setEditFullName(currentUser.fullName);
    setEditEmail(currentUser.email);
    setEditMobile(currentUser.mobileNumber || "");
    setEditLocation(currentUser.location);
    setEditEducation(currentUser.education || "");
    setEditExperience(currentUser.experience || "");
    setEditSkillsText(currentUser.skills.join(", "));
    setEditProfilePhotoUrl(currentUser.profilePhotoUrl || "");
    setEditProfilePhotoPosition(currentUser.profilePhotoPosition || "top");
    setEditResumeName(currentUser.resumeName || "");
    setEditResumeBase64(currentUser.resumeUrl || "");
    setError("");
    setSuccess("");
    setIsEditingProfile(true);
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleResumeChange = async (file: File) => {
    if (!file) return;
    setEditResumeName(file.name);
    setIsAnalyzing(true);
    setError("");
    setSuccess("");

    try {
      const base64 = await convertFileToBase64(file);
      setEditResumeBase64(base64);

      const response = await fetch("/api/resume/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileData: base64,
          mimeType: file.type || "application/pdf",
          fileName: file.name
        })
      });

      const data = await response.json();
      if (data.success && data.analysis) {
        const { fullName: extName, email: extEmail, mobileNumber: extMobile, education: extEdu, skills: extSkills, experience: extExp } = data.analysis;
        
        if (extName) setEditFullName(extName);
        if (extEmail) setEditEmail(extEmail);
        if (extMobile) setEditMobile(extMobile);
        if (extEdu) setEditEducation(extEdu);
        if (extSkills && extSkills.length > 0) {
          setEditSkillsText(extSkills.join(", "));
        }
        if (extExp) setEditExperience(extExp);

        setSuccess("Gemini analyzed your new resume and updated the form fields! Please verify the details.");
      } else {
        setSuccess("Resume attached successfully! You can make any adjustments manually.");
      }
    } catch (err: any) {
      console.error(err);
      setSuccess("Resume attached successfully! Feel free to adjust fields.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePhotoChange = async (file: File) => {
    if (!file) return;
    try {
      const base64 = await convertFileToBase64(file);
      setEditProfilePhotoUrl(base64);
      setSuccess("Profile photo selected successfully!");
    } catch (err) {
      console.error(err);
      setError("Failed to parse profile photo.");
    }
  };

  const handleSaveProfileChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName || !editEmail) {
      setError("Name and Email are required.");
      return;
    }

    const skillsList = editSkillsText
      .split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    try {
      db.updateUserProfile(currentUser.id, {
        fullName: editFullName,
        email: editEmail,
        mobileNumber: editMobile,
        location: editLocation,
        education: editEducation,
        experience: editExperience,
        skills: skillsList,
        profilePhotoUrl: editProfilePhotoUrl,
        profilePhotoPosition: editProfilePhotoPosition,
        resumeName: editResumeName || undefined,
        resumeUrl: editResumeBase64 || undefined
      });

      alert("Your profile has been successfully updated! ✨");
      setIsEditingProfile(false);
      onRefresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update profile.");
    }
  };

  // Fetch collections
  const projects = db.getProjects().filter(p => p.approved);
  const applications = db.getApplications().filter(a => a.candidateId === currentUser.id);
  const courses = db.getCourses();

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    if (currentUser.skills.includes(newSkill.trim())) {
      setNewSkill("");
      return;
    }

    const updatedSkills = [...currentUser.skills, newSkill.trim()];
    db.updateUserProfile(currentUser.id, { skills: updatedSkills });
    setNewSkill("");
    onRefresh();
  };

  const handleApply = async (projectId: string) => {
    setApplyingId(projectId);
    try {
      await db.addApplication(projectId, currentUser.id);
      alert("Application successfully submitted! AI skill-match analysis completed and transmitted to recruiter.");
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to submit application.");
    } finally {
      setApplyingId(null);
    }
  };

  const handleCompleteCourse = (courseId: string) => {
    db.completeCourse(currentUser.id, courseId);
    alert("Congratulations! Your certificate is generated, missing skills are unlocked, and matching scores updated.");
    onRefresh();
  };

  // Derive missing skills across all pending/active applications to power automated recommendations
  const allMissingSkills = Array.from(
    new Set(
      applications
        .filter(app => app.status === "Pending")
        .flatMap(app => app.aiReport?.missingSkills || [])
    )
  );

  // If no missing skills in pending jobs, recommend courses for skills the candidate doesn't have yet
  const targetRecommendationSkills = allMissingSkills.length > 0 
    ? allMissingSkills 
    : ["Machine Learning", "FastAPI", "Generative AI", "Cybersecurity"].filter(s => !currentUser.skills.includes(s));

  const recommendedCourses = courses.filter(course => 
    course.skills.some(skill => targetRecommendationSkills.includes(skill)) && 
    !(course.completedByUsers || []).includes(currentUser.id)
  );

  // Search filter
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.requiredSkills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.companyName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLoc = selectedLocation 
      ? (p.location?.toLowerCase() === selectedLocation.toLowerCase() || 
         db.getCompanies().find(c => c.id === p.companyId)?.location.toLowerCase() === selectedLocation.toLowerCase())
      : true;
    const matchesType = filterType === "All" ? true : p.type === filterType;

    return matchesSearch && matchesLoc && matchesType;
  });

  // Dynamic eligibility calculations for the currently selected application
  const getSelectedAppDynamicStats = () => {
    if (!selectedApp) return null;
    
    const userSkillsSet = new Set(currentUser.skills.map(s => s.toLowerCase().trim()));
    const originalMissingSkills = selectedApp.aiReport?.missingSkills || [];
    
    // Skills STILL missing
    const currentMissingSkills = originalMissingSkills.filter(
      sk => !userSkillsSet.has(sk.toLowerCase().trim())
    );
    
    // Skills acquired successfully from the missing list
    const acquiredSkills = originalMissingSkills.filter(
      sk => userSkillsSet.has(sk.toLowerCase().trim())
    );
    
    const originalCandidateSkills = selectedApp.candidateSkills || [];
    const totalRequiredCount = originalCandidateSkills.length + originalMissingSkills.length;
    
    // Recalculated matching score
    const currentMatchScore = totalRequiredCount > 0
      ? Math.min(100, Math.round(((totalRequiredCount - currentMissingSkills.length) / totalRequiredCount) * 100))
      : selectedApp.aiMatchScore;
      
    const isEligible = currentMissingSkills.length === 0;
    
    return {
      currentMissingSkills,
      acquiredSkills,
      currentMatchScore,
      isEligible
    };
  };

  const dynamicStats = getSelectedAppDynamicStats();

  return (
    <div className="space-y-6">
      
      {/* Top Banner Navigation tabs for Candidate */}
      <div className="bg-white rounded-2xl p-2 border border-slate-100 shadow-sm flex flex-wrap gap-1">
        {[
          { id: "dashboard", label: "My Hub", icon: LayoutGrid },
          { id: "find_work", label: "Browse Openings", icon: Search },
          { id: "learning", label: "Personalized Learning", icon: BookOpen }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: DASHBOARD HUB */}
      {activeTab === "dashboard" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          
          {/* Profile Overview (Left side) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
              <div className="text-center space-y-2">
                <img 
                  src={currentUser.profilePhotoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60"} 
                  alt={currentUser.fullName}
                  className={`w-16 h-16 rounded-full border-2 border-blue-500 mx-auto shadow-sm ${getPhotoPositionClass(currentUser.profilePhotoPosition)}`}
                />
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base font-display">{currentUser.fullName}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{currentUser.role}</p>
                </div>
                <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {currentUser.location}
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleOpenEditModal}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-slate-200/60 transition shadow-sm"
                  >
                    <Edit className="w-3.5 h-3.5 text-slate-500" /> Edit Profile
                  </button>
                </div>
              </div>

              {/* Education details */}
              <div className="border-t border-slate-100 pt-4 space-y-1 text-xs text-slate-600">
                <div className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Education</div>
                <div className="font-bold text-slate-800">{currentUser.education}</div>
                {currentUser.experience && (
                  <div className="mt-2 text-slate-500">{currentUser.experience}</div>
                )}
              </div>

              {/* Skills section */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Professional Skills ({currentUser.skills.length})</div>
                
                <div className="flex flex-wrap gap-1.5">
                  {currentUser.skills.map((skill, idx) => (
                    <span 
                      key={idx} 
                      className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <form onSubmit={handleAddSkill} className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add Skill (e.g. Docker)"
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button 
                    type="submit"
                    className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Active Work / Applications Tracking (Right side) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Quick dashboard cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Applied</div>
                <div className="text-xl font-black text-slate-800 font-display mt-0.5">{applications.length}</div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Approved</div>
                <div className="text-xl font-black text-emerald-600 font-display mt-0.5">
                  {applications.filter(a => a.status === "Approved").length}
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Skills Acquired</div>
                <div className="text-xl font-black text-blue-600 font-display mt-0.5">{currentUser.skills.length}</div>
              </div>
            </div>

            {/* Applications List */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-sm text-slate-800 font-display flex items-center gap-2">
                  <BookmarkCheck className="w-5 h-5 text-blue-600" /> Opportunity Applications Tracker
                </h3>
              </div>

              {applications.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No submissions yet. Tap <span className="font-bold text-blue-600 cursor-pointer" onClick={() => setActiveTab("find_work")}>Browse Openings</span> to apply for internships!
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {applications.map((app) => (
                    <div key={app.id} className="p-5 hover:bg-slate-50/40 transition space-y-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${app.projectType === "Project" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                              {app.projectType}
                            </span>
                            <h4 className="font-bold text-slate-800 text-sm">{app.projectTitle}</h4>
                          </div>
                          <p className="text-xs text-slate-400 font-semibold">{app.companyName} • Applied {new Date(app.appliedAt).toLocaleDateString()}</p>
                        </div>

                        <div className="flex items-center gap-4 self-start md:self-center">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${
                            app.status === "Approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                            app.status === "Rejected" ? "bg-red-50 text-red-700 border border-red-100" : "bg-slate-100 text-slate-500"
                          }`}>
                            {app.status}
                          </span>

                          <button
                            onClick={() => setSelectedApp(app)}
                            className="text-xs font-bold text-blue-600 hover:underline flex items-center"
                          >
                            AI Skill Gap <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FIND WORK / PROJECTS BOARD */}
      {activeTab === "find_work" && (
        <div className="space-y-4 animate-fade-in">
          
          {/* Search bar and options */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-slate-400 h-4 w-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by tech, company or required skill (e.g. Python, React)..."
                className="pl-9 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none"
              >
                <option value="">All Locations</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Visakhapatnam">Visakhapatnam</option>
                <option value="Kakinada">Kakinada</option>
                <option value="Rajahmundry">Rajahmundry</option>
              </select>

              <select
                value={filterType}
                onChange={(e: any) => setFilterType(e.target.value)}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none"
              >
                <option value="All">All Types</option>
                <option value="Project">Projects</option>
                <option value="Internship">Internships</option>
              </select>
            </div>
          </div>

          {/* Results grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProjects.length === 0 ? (
              <div className="col-span-full bg-white p-12 rounded-3xl border border-slate-100 text-center text-slate-400 text-xs">
                No matching opportunities found. Try adjusting filters.
              </div>
            ) : (
              filteredProjects.map((p) => {
                const alreadyApplied = applications.some(a => a.projectId === p.id);
                return (
                  <div key={p.id} className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-slate-200 transition space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${p.type === "Project" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                          {p.type}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {p.location || "Hyderabad"}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm font-display line-clamp-1">{p.title}</h4>
                        <p className="text-xs text-slate-400 font-bold">{p.companyName}</p>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-3">{p.description}</p>

                      <div className="flex flex-wrap gap-1">
                        {p.requiredSkills.map((sk, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between mt-3">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">
                        STIPEND: <span className="text-blue-700 font-extrabold">{p.salary}</span>
                      </div>

                      <button
                        disabled={alreadyApplied || applyingId === p.id}
                        onClick={() => handleApply(p.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm ${
                          alreadyApplied 
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                            : "bg-blue-600 hover:bg-blue-700 text-white transform active:scale-95"
                        }`}
                      >
                        {applyingId === p.id ? (
                          <>
                            <RotateCw className="w-3.5 h-3.5 animate-spin" /> Matching...
                          </>
                        ) : alreadyApplied ? (
                          "Applied"
                        ) : (
                          "Apply Now"
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* TAB 3: LEARNING / COURSE RECOMMENDATIONS */}
      {activeTab === "learning" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Header */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2">
            <div className="flex items-center gap-1 text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-blue-500" /> AI Skill Bridge Curations
            </div>
            <h3 className="text-lg font-bold text-slate-800 font-display">Personalized Learning & Skill Booster</h3>
            <p className="text-xs text-slate-500">Based on gaps detected in your active applications, our AI recommends high-quality courses. Master these to trigger immediate recruiter notifications and raise matching rates!</p>
          </div>

          {/* Courses List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedCourses.length === 0 ? (
              <div className="col-span-full bg-white p-12 rounded-3xl border border-slate-100 text-center text-slate-400 text-xs">
                No active learning recommendations. Apply to projects to generate custom skill-gap courses, or add more skills in your Hub!
              </div>
            ) : (
              recommendedCourses.map((c) => (
                <div key={c.id} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:border-slate-200 transition flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Award className="w-3 h-3" /> {c.difficulty}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {c.duration}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-slate-800 text-sm font-display line-clamp-2">{c.name}</h4>
                    <p className="text-xs text-slate-500 line-clamp-3">{c.description}</p>

                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Earns Skills:</span>
                      <div className="flex flex-wrap gap-1">
                        {c.skills.map((skill, idx) => (
                          <span key={idx} className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 border-t border-slate-100/50 pt-2 font-medium">
                      <span className="font-bold text-slate-700">Outcome:</span> {c.outcome}
                    </div>
                  </div>

                  <button
                    onClick={() => handleCompleteCourse(c.id)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 shadow-sm transition transform active:scale-95 mt-3"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Complete & Unlock Skills
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Completed Courses list */}
          {courses.filter(c => (c.completedByUsers || []).includes(currentUser.id)).length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
              <h4 className="font-bold text-sm text-slate-800 font-display flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Completed Curriculums
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {courses.filter(c => (c.completedByUsers || []).includes(currentUser.id)).map((c) => (
                  <div key={c.id} className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                    <div>
                      <span className="font-bold block text-slate-800 text-xs">{c.name}</span>
                      <span className="text-[10px] text-slate-400">Added to your credentials</span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold uppercase">Verified</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Detail & AI Report Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-slate-100 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto animate-fade-in">
            <button
              onClick={() => setSelectedApp(null)}
              className="absolute right-4 top-4 p-2 hover:bg-slate-100 rounded-full transition"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>

            <div>
              <div className="flex items-center gap-1 text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> AI Skill-Gap Analysis Report
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 font-display mt-1">
                Role Analysis: {selectedApp.projectTitle}
              </h3>
              <p className="text-xs text-slate-500 font-semibold">{selectedApp.companyName} • Application Status: <span className="font-bold text-blue-600">{selectedApp.status}</span></p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-slate-500 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                  {selectedApp.aiMatchScore}%
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-[10px] leading-tight">Initial Match</h4>
                  <p className="text-[9px] text-slate-400">At time of application</p>
                </div>
              </div>

              {dynamicStats && (
                <div className={`p-3 rounded-2xl border flex items-center gap-2.5 transition duration-300 ${
                  dynamicStats.isEligible 
                    ? "bg-emerald-50 border-emerald-200" 
                    : "bg-blue-50 border-blue-200"
                }`}>
                  <div className={`w-10 h-10 rounded-full font-extrabold text-xs flex items-center justify-center shrink-0 text-white ${
                    dynamicStats.isEligible 
                      ? "bg-emerald-600 animate-pulse" 
                      : "bg-blue-600"
                  }`}>
                    {dynamicStats.currentMatchScore}%
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-[10px] leading-tight">Current Match</h4>
                    <p className="text-[9px] text-slate-400 font-medium">Live score update</p>
                  </div>
                </div>
              )}

              {selectedApp.aiReport?.expectedMatchAfterCourse && (
                <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                    {selectedApp.aiReport.expectedMatchAfterCourse}%
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-[10px] leading-tight">Expected Target</h4>
                    <p className="text-[9px] text-slate-400">After all courses</p>
                  </div>
                </div>
              )}
            </div>

            {dynamicStats && (
              <div className={`p-4 rounded-2xl border transition duration-300 ${
                dynamicStats.isEligible 
                  ? "bg-emerald-50/60 border-emerald-200/80 text-emerald-900" 
                  : "bg-amber-50/70 border-amber-200/80 text-amber-900"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {dynamicStats.isEligible ? (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-extrabold uppercase tracking-wider">Candidate Eligible</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-extrabold uppercase tracking-wider">Not Eligible Yet</span>
                    </div>
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Recruitment Eligibility Assessment
                </h4>
                <p className="text-[11px] mt-1.5 text-slate-700 font-medium leading-relaxed">
                  {dynamicStats.isEligible ? (
                    <span>
                      <strong>Status: Eligible for Selection.</strong> Outstanding! By successfully completing the required training courses or aligning your credentials, you have fully bridged all technical skill gaps. You now possess all critical stack elements (learned: <strong>{dynamicStats.acquiredSkills.join(", ") || "N/A"}</strong>). Your live alignment score is at 100%, unlocking your eligibility for immediate corporate onboarding. The recruiter has been notified.
                    </span>
                  ) : (
                    <span>
                      <strong>Status: Active Gaps Remaining.</strong> You are currently missing key technical stack elements: <strong>{dynamicStats.currentMissingSkills.join(", ")}</strong>. To qualify and unlock your eligibility, navigate to the <strong>Personalized Learning</strong> tab and complete the recommended training courses for these skills. This will automatically boost your live match rating to 100% and notify the recruiters of your eligibility!
                    </span>
                  )}
                </p>
              </div>
            )}

            {selectedApp.aiReport && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                
                {/* Strengths & Missing skills */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                  <h4 className="font-bold text-slate-800 font-display flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Strengths Identified
                  </h4>
                  <ul className="space-y-1 text-slate-600 list-disc list-inside">
                    {selectedApp.aiReport.strengths.map((str, i) => (
                      <li key={i}>{str}</li>
                    ))}
                  </ul>

                  <h4 className="font-bold text-slate-800 font-display flex items-center gap-1 pt-3 border-t border-slate-100">
                    <X className="w-4 h-4 text-red-500" /> Missing Stack Elements (Skill Gap)
                  </h4>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {dynamicStats?.currentMissingSkills.map((sk, i) => (
                      <span key={`missing-${i}`} className="bg-red-50 text-red-700 border border-red-100 font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-red-500"></span>
                        {sk}
                      </span>
                    ))}
                    {dynamicStats?.acquiredSkills.map((sk, i) => (
                      <span key={`acquired-${i}`} className="bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {sk} <span className="text-[9px] font-bold text-emerald-500">(Acquired)</span>
                      </span>
                    ))}
                    {(!dynamicStats || (dynamicStats.currentMissingSkills.length === 0 && dynamicStats.acquiredSkills.length === 0)) && (
                      <span className="text-slate-400 italic">No skill gaps identified.</span>
                    )}
                  </div>
                </div>

                {/* Recommendations and Certification */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                  <h4 className="font-bold text-slate-800 font-display flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-blue-500" /> Suggested Certification
                  </h4>
                  <p className="font-bold text-blue-700 bg-blue-50/50 p-2 rounded border border-blue-100/50">{selectedApp.aiReport.suggestedCertification}</p>

                  <h4 className="font-bold text-slate-800 font-display flex items-center gap-1 pt-3 border-t border-slate-100">
                    <Clock className="w-4 h-4 text-blue-600" /> Learning Path (Est. Time: {selectedApp.aiReport.estimatedLearningTime})
                  </h4>
                  <ul className="space-y-1.5 text-slate-600">
                    {selectedApp.aiReport.recommendedLearningPath.map((item, i) => (
                      <li key={i} className="line-clamp-2">{item}</li>
                    ))}
                  </ul>
                </div>

              </div>
            )}

            {selectedApp.aiReport?.rejectionReason && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-800">
                <span className="font-bold">Recruiter Feedback:</span> {selectedApp.aiReport.rejectionReason}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-slate-100 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto animate-fade-in">
            <button
              type="button"
              onClick={() => setIsEditingProfile(false)}
              className="absolute right-4 top-4 p-2 hover:bg-slate-100 rounded-full transition"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>

            <div>
              <div className="flex items-center gap-1 text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Professional Persona Editor
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 font-display mt-1">
                Edit Personal Profile
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                Keep your details updated. Tip: uploading an updated resume will automatically parse and overwrite fields with Gemini AI. 🪄
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-800 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-100 text-green-800 rounded-xl text-xs font-semibold">
                {success}
              </div>
            )}

            <form onSubmit={handleSaveProfileChanges} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="pl-9 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-800"
                      placeholder="Your name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="pl-9 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-800"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      value={editMobile}
                      onChange={(e) => setEditMobile(e.target.value)}
                      className="pl-9 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-800"
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Location / Regional City</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <select
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="pl-9 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-700"
                    >
                      <option value="Hyderabad">Hyderabad</option>
                      <option value="Visakhapatnam">Visakhapatnam</option>
                      <option value="Kakinada">Kakinada</option>
                      <option value="Rajahmundry">Rajahmundry</option>
                      <option value="Vijayawada">Vijayawada</option>
                      <option value="Guntur">Guntur</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Highest Education Credential</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={editEducation}
                      onChange={(e) => setEditEducation(e.target.value)}
                      className="pl-9 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-800"
                      placeholder="e.g. B.Tech Computer Science"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Professional Skills (Comma Separated)</label>
                  <div className="relative">
                    <Sparkles className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={editSkillsText}
                      onChange={(e) => setEditSkillsText(e.target.value)}
                      className="pl-9 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-800"
                      placeholder="React, TypeScript, CSS, SQL..."
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Experience Summary</label>
                <textarea
                  value={editExperience}
                  onChange={(e) => setEditExperience(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-800"
                  placeholder="Summarize your professional or academic project achievements..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Resume Document (PDF/TXT)
                  </label>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleResumeChange(e.dataTransfer.files[0]);
                      }
                    }}
                    className={`relative border-2 border-dashed rounded-xl p-2 text-center transition flex flex-col items-center justify-center min-h-[64px] ${
                      isAnalyzing
                        ? "bg-blue-50 border-blue-300"
                        : editResumeName
                          ? "bg-green-50 border-green-300 text-green-800"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100 cursor-pointer"
                    }`}
                  >
                    <input
                      type="file"
                      accept=".pdf,.txt,.doc,.docx"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleResumeChange(e.target.files[0]);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    {isAnalyzing ? (
                      <div className="flex flex-col items-center gap-1">
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        <span className="text-[9px] font-bold text-blue-600 animate-pulse">AI Parsing...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 pointer-events-none">
                        <Upload className={`w-4 h-4 ${editResumeName ? "text-green-600" : "text-slate-400"}`} />
                        <span className="text-[10px] font-medium leading-none truncate max-w-full px-1 text-slate-700">
                          {editResumeName ? editResumeName : "Upload New Resume"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Profile Avatar (JPG/PNG)</span>
                    <span className="text-[9px] text-blue-600 font-bold flex items-center gap-1">
                      <Focus className="w-3 h-3" /> Auto Face & Body Adjust
                    </span>
                  </label>

                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handlePhotoChange(e.dataTransfer.files[0]);
                      }
                    }}
                    className={`relative border-2 border-dashed rounded-xl p-3 text-center transition flex flex-col items-center justify-center min-h-[64px] ${
                      editProfilePhotoUrl && editProfilePhotoUrl.startsWith("data:")
                        ? "bg-emerald-50/50 border-emerald-300 text-emerald-800"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100 cursor-pointer"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handlePhotoChange(e.target.files[0]);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    {editProfilePhotoUrl && editProfilePhotoUrl.startsWith("data:") ? (
                      <div className="flex items-center gap-2 pointer-events-none">
                        <img
                          src={editProfilePhotoUrl}
                          alt="Profile preview"
                          className={`w-7 h-7 rounded-full border border-emerald-400 ${getPhotoPositionClass(editProfilePhotoPosition)}`}
                        />
                        <span className="text-[10px] font-bold text-emerald-800">New Image Loaded</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 pointer-events-none">
                        <Image className="w-4 h-4 text-slate-400" />
                        <span className="text-[10px] font-medium leading-none text-slate-700">Upload / Drop Photo</span>
                      </div>
                    )}
                  </div>

                  {/* Face Area & Body Framing Alignment Selector */}
                  {editProfilePhotoUrl && (
                    <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                          <Crop className="w-3.5 h-3.5 text-blue-600" /> Face & Body Alignment Framing
                        </span>
                        <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                          {editProfilePhotoPosition === "top" ? "Face Aligned" : editProfilePhotoPosition === "center" ? "Upper Body Aligned" : "Full Body Fit"}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        {PHOTO_POSITION_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setEditProfilePhotoPosition(opt.id)}
                            className={`p-2 rounded-xl text-left border transition flex flex-col justify-between min-h-[52px] ${
                              editProfilePhotoPosition === opt.id
                                ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100/80"
                            }`}
                          >
                            <span className="text-[10px] font-extrabold leading-tight">{opt.label}</span>
                            <span className={`text-[8px] leading-tight font-medium ${editProfilePhotoPosition === opt.id ? "text-blue-100" : "text-slate-400"}`}>
                              {opt.subLabel}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Live framing preview display */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[10px]">
                        <span className="text-slate-500 font-medium">Live Avatar Framing Preview:</span>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-slate-400 font-semibold">Circle:</span>
                            <div className="w-8 h-8 rounded-full border-2 border-blue-500 overflow-hidden shadow-xs bg-slate-100 relative">
                              <img
                                src={editProfilePhotoUrl}
                                alt="Framing preview"
                                className={`w-full h-full ${getPhotoPositionClass(editProfilePhotoPosition)}`}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-slate-400 font-semibold">Square:</span>
                            <div className="w-8 h-8 rounded-xl border border-slate-300 overflow-hidden shadow-xs bg-slate-100">
                              <img
                                src={editProfilePhotoUrl}
                                alt="Square framing preview"
                                className={`w-full h-full ${getPhotoPositionClass(editProfilePhotoPosition)}`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs rounded-xl shadow-md transition transform active:scale-95"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
