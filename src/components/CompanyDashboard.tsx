import React, { useState } from "react";
import { db } from "../lib/db";
import { UserProfile, ProjectPosting, Application, CompanyProfile } from "../types";
import { getPhotoPositionClass } from "../lib/photoUtils";
import { Briefcase, FileSpreadsheet, Plus, Check, X, Eye, Download, UserCheck, Sparkles, AlertCircle, Building, Globe, MapPin, AlignLeft, ShieldCheck } from "lucide-react";

interface CompanyDashboardProps {
  currentUser: UserProfile;
  onRefresh: () => void;
}

export default function CompanyDashboard({ currentUser, onRefresh }: CompanyDashboardProps) {
  const [showPostForm, setShowPostForm] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  // Form states for posting a project/internship
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"Project" | "Internship">("Project");
  const [requiredSkillsText, setRequiredSkillsText] = useState("");
  const [duration, setDuration] = useState("");
  const [deadline, setDeadline] = useState("");
  const [vacancies, setVacancies] = useState(1);
  const [salary, setSalary] = useState("");

  // Edit Company Profile states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [compName, setCompName] = useState(currentUser.companyName || "");
  const [compDesc, setCompDesc] = useState("A leading technical firm focused on building regional digital products.");
  const [compWeb, setCompWeb] = useState("https://example.com");
  const [compLoc, setCompLoc] = useState(currentUser.location);

  const myCompany = db.getCompanies().find(c => c.createdBy === currentUser.id) || {
    id: "company-temp",
    name: compName,
    description: compDesc,
    website: compWeb,
    location: compLoc,
    createdBy: currentUser.id,
    createdAt: new Date().toISOString()
  };

  const myProjects = db.getProjects().filter(p => p.companyId === myCompany.id);
  const myApplications = db.getApplications().filter(a => a.companyId === myCompany.id);

  const handlePostProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !requiredSkillsText || !deadline) {
      alert("Please fill in all required fields.");
      return;
    }

    const skillsArray = requiredSkillsText.split(",").map(s => s.trim()).filter(s => s.length > 0);

    const newPost: Omit<ProjectPosting, "id" | "createdAt" | "approved"> = {
      companyId: myCompany.id,
      companyName: myCompany.name,
      title,
      description,
      type,
      requiredSkills: skillsArray,
      duration: duration || "Immediate",
      deadline,
      vacancies: Number(vacancies),
      salary: salary || "Negotiable",
      createdBy: currentUser.id,
      location: myCompany.location
    };

    db.addProject(newPost);
    alert("Project proposal submitted! Admin approval is required before it goes live.");
    
    // Clear form
    setTitle("");
    setDescription("");
    setRequiredSkillsText("");
    setDuration("");
    setDeadline("");
    setVacancies(1);
    setSalary("");
    setShowPostForm(false);
    onRefresh();
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    // Update company in DB
    const companies = db.getCompanies();
    const index = companies.findIndex(c => c.createdBy === currentUser.id);
    const updatedComp = {
      id: index !== -1 ? companies[index].id : `company-${Math.random().toString(36).substring(2, 9)}`,
      name: compName,
      description: compDesc,
      website: compWeb,
      location: compLoc,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString()
    };

    if (index !== -1) {
      companies[index] = updatedComp;
    } else {
      companies.push(updatedComp);
    }
    db.setCompanies(companies);

    // Sync back user profile name
    db.updateUserProfile(currentUser.id, { companyName: compName, location: compLoc });
    
    setIsEditingProfile(false);
    alert("Profile saved successfully.");
    onRefresh();
  };

  const handleApproveApplicant = (appId: string) => {
    db.updateApplicationStatus(appId, "Approved");
    alert("Applicant approved! Notification sent to the candidate.");
    setSelectedApp(null);
    onRefresh();
  };

  const handleRejectApplicant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRejectModal) return;
    db.updateApplicationStatus(showRejectModal, "Rejected", rejectionReason);
    alert("Applicant rejected. Feedback report generated and transmitted.");
    setShowRejectModal(null);
    setRejectionReason("");
    setSelectedApp(null);
    onRefresh();
  };

  const handleDownloadResume = (app: Application) => {
    if (app.candidateResumeUrl && app.candidateResumeUrl.startsWith("data:")) {
      try {
        const link = document.createElement("a");
        link.href = app.candidateResumeUrl;
        link.download = app.candidateResumeName || `${app.candidateName}_Resume.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error("Failed to download resume:", err);
        alert("Failed to download the resume file.");
      }
    } else {
      alert(`Initiating mock secure file download for ${app.candidateName}'s resume... Completed.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="text-[10px] text-blue-600 font-extrabold uppercase tracking-widest flex items-center gap-1">
            <Building className="w-3.5 h-3.5" /> Corporate Ecosystem Suite
          </div>
          <h2 className="text-2xl font-extrabold font-display text-slate-900 mt-1">
            {myCompany.name} Dashboard
          </h2>
          <p className="text-xs text-slate-500 font-medium">Recruit talent, analyze matching stats, and post internships.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => { setIsEditingProfile(!isEditingProfile); setShowPostForm(false); }}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
          >
            {isEditingProfile ? "View Dashboard" : "Edit Corp Profile"}
          </button>
          <button
            onClick={() => { setShowPostForm(!showPostForm); setIsEditingProfile(false); }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> Post Opportunity
          </button>
        </div>
      </div>

      {/* Edit Corporate Profile view */}
      {isEditingProfile && (
        <form onSubmit={handleUpdateProfile} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 animate-fade-in">
          <h3 className="font-bold text-base text-slate-800 font-display">Edit Corporate Profile</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Company Name</label>
              <input
                type="text"
                required
                value={compName}
                onChange={(e) => setCompName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Headquarters Location</label>
              <select
                value={compLoc}
                onChange={(e) => setCompLoc(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Hyderabad">Hyderabad</option>
                <option value="Visakhapatnam">Visakhapatnam</option>
                <option value="Kakinada">Kakinada</option>
                <option value="Rajahmundry">Rajahmundry</option>
                <option value="Vijayawada">Vijayawada</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Website URL</label>
              <input
                type="url"
                value={compWeb}
                onChange={(e) => setCompWeb(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">About / Description</label>
              <textarea
                value={compDesc}
                onChange={(e) => setCompDesc(e.target.value)}
                rows={3}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2.5 bg-blue-600 text-white hover:bg-blue-700 font-bold text-xs rounded-xl transition"
          >
            Save Corporate Profile
          </button>
        </form>
      )}

      {/* Post Project / Internship view */}
      {showPostForm && (
        <form onSubmit={handlePostProject} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 animate-fade-in">
          <h3 className="font-bold text-base text-slate-800 font-display">Create Project or Internship Opportunity</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Opportunity Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Machine Learning Specialist"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Opportunity Type</label>
              <select
                value={type}
                onChange={(e: any) => setType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Project">Project Assignment</option>
                <option value="Internship">Internship Program</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Detailed Scope / Description</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will the hire be responsible for? Describe the stack and deliverables."
              rows={4}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Required Skills (Comma-separated)</label>
              <input
                type="text"
                required
                value={requiredSkillsText}
                onChange={(e) => setRequiredSkillsText(e.target.value)}
                placeholder="Python, Machine Learning, TensorFlow"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Duration</label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="3 Months"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Vacancies</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={vacancies}
                  onChange={(e) => setVacancies(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Deadline</label>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Salary or Stipend Description</label>
            <input
              type="text"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="₹35,000 / month"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowPostForm(false)}
              className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition shadow-sm"
            >
              Post Opportunity
            </button>
          </div>
        </form>
      )}

      {/* Main Layout Tabs / Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active job list */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-t-3xl border-b border-slate-100 shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 font-display flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" /> Posted Openings
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">{myProjects.length} total</span>
          </div>

          {myProjects.length === 0 ? (
            <div className="bg-white p-8 rounded-b-3xl border border-slate-100 text-center text-slate-400 text-xs">
              No active postings. Create one to recruit!
            </div>
          ) : (
            <div className="space-y-3">
              {myProjects.map((p) => {
                const appCount = myApplications.filter(a => a.projectId === p.id).length;
                return (
                  <div key={p.id} className="p-4 bg-white rounded-2xl border border-slate-100 hover:border-slate-200 transition shadow-sm space-y-2">
                    <div className="flex justify-between items-start">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${p.type === "Project" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                        {p.type}
                      </span>
                      {p.approved ? (
                        <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Live
                        </span>
                      ) : (
                        <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          <AlertCircle className="w-3 h-3 animate-pulse" /> Pending
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs line-clamp-1">{p.title}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">Stipend: {p.salary}</p>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-100 pt-2 text-[10px] font-semibold text-slate-500">
                      <span>Deadline: {p.deadline}</span>
                      <span className="text-blue-600">{appCount} Applicants</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Applicant list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-t-3xl border-b border-slate-100 shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 font-display flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-600" /> Ecosystem Applicants
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">{myApplications.length} applied</span>
          </div>

          {myApplications.length === 0 ? (
            <div className="bg-white p-12 rounded-b-3xl border border-slate-100 text-center text-slate-400 text-xs">
              Waiting for talented candidates to apply...
            </div>
          ) : (
            <div className="space-y-3">
              {myApplications.map((app) => (
                <div key={app.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200 transition">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {app.candidatePhotoUrl ? (
                        <img
                          src={app.candidatePhotoUrl}
                          alt={app.candidateName}
                          className={`w-10 h-10 rounded-full border border-slate-200 shrink-0 ${getPhotoPositionClass(app.candidatePhotoPosition)}`}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-extrabold text-sm flex items-center justify-center shrink-0 border border-blue-100">
                          {app.candidateName[0]}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800 text-sm">{app.candidateName}</h4>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            app.status === "Approved" ? "bg-emerald-50 text-emerald-700" :
                            app.status === "Rejected" ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-500"
                          }`}>
                            {app.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">Applied for <span className="font-bold text-slate-700">{app.projectTitle}</span></p>
                        
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {app.candidateSkills.slice(0, 4).map((s, idx) => (
                            <span key={idx} className="bg-slate-50 border border-slate-100 text-[10px] text-slate-500 px-2 py-0.5 rounded-md">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-2 shrink-0 border-t md:border-t-0 border-slate-100 pt-2.5 md:pt-0">
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
                        <span className="text-sm font-bold text-blue-700">{app.aiMatchScore}% Match Score</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="px-2.5 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-50 flex items-center gap-1 transition"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </button>
                        <button
                          onClick={() => handleDownloadResume(app)}
                          className="px-2.5 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-50 flex items-center gap-1 transition"
                        >
                          <Download className="w-3.5 h-3.5" /> Resume
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Applicant Detail & AI Report Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-slate-100 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedApp(null)}
              className="absolute right-4 top-4 p-2 hover:bg-slate-100 rounded-full transition"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>

            {/* Candidate Header info */}
            <div className="flex items-center gap-3">
              {selectedApp.candidatePhotoUrl ? (
                <img
                  src={selectedApp.candidatePhotoUrl}
                  alt={selectedApp.candidateName}
                  className={`w-12 h-12 rounded-full border-2 border-blue-500 shadow-sm shrink-0 ${getPhotoPositionClass(selectedApp.candidatePhotoPosition)}`}
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-black text-lg flex items-center justify-center shrink-0 border border-blue-200">
                  {selectedApp.candidateName[0]}
                </div>
              )}
              <div>
                <div className="flex items-center gap-1 text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> AI Skill Gap Analysis
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 font-display mt-0.5">
                  {selectedApp.candidateName}
                </h3>
                <p className="text-xs text-slate-500 font-medium">{selectedApp.candidateEmail} • Applying for: {selectedApp.projectTitle}</p>
              </div>
            </div>

            {/* Skill Matching Metrics visual */}
            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-col md:flex-row items-center gap-4 justify-between">
              <div className="flex flex-col sm:flex-row items-stretch gap-4 flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-blue-600 text-white font-extrabold text-xl flex items-center justify-center shrink-0">
                    {selectedApp.aiMatchScore}%
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">AI Skill Matching Rating</h4>
                    <p className="text-[10px] text-slate-500">Calculated across required tags and experience</p>
                  </div>
                </div>

                {selectedApp.aiReport?.expectedMatchAfterCourse && (
                  <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-200/60 pt-3 sm:pt-0 sm:pl-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-600 text-white font-extrabold text-xl flex items-center justify-center shrink-0">
                      {selectedApp.aiReport.expectedMatchAfterCourse}%
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Post-Course Est. Match</h4>
                      <p className="text-[10px] text-slate-500">Predicted match after course recommendations</p>
                    </div>
                  </div>
                )}
              </div>

              {selectedApp.status === "Pending" && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleApproveApplicant(selectedApp.id)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm transition transform active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve Candidate
                  </button>
                  <button
                    onClick={() => setShowRejectModal(selectedApp.id)}
                    className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl flex items-center gap-1 transition"
                  >
                    <X className="w-3.5 h-3.5" /> Reject Candidate
                  </button>
                </div>
              )}
            </div>

            {/* AI Report Elements */}
            {selectedApp.aiReport && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                
                {/* Strengths / Weaknesses */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                  <h4 className="font-bold text-slate-800 font-display flex items-center gap-1">
                    <UserCheck className="w-4 h-4 text-emerald-600" /> Key Match Strengths
                  </h4>
                  <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
                    {selectedApp.aiReport.strengths.map((str, i) => (
                      <li key={i}>{str}</li>
                    ))}
                  </ul>

                  <h4 className="font-bold text-slate-800 font-display flex items-center gap-1 pt-3 border-t border-slate-100">
                    <AlertCircle className="w-4 h-4 text-amber-500" /> Missing Requirements
                  </h4>
                  <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
                    {selectedApp.aiReport.weaknesses.map((wk, i) => (
                      <li key={i}>{wk}</li>
                    ))}
                  </ul>
                </div>

                {/* Path & Certifications */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                  <h4 className="font-bold text-slate-800 font-display flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-blue-500" /> Suggested Certification
                  </h4>
                  <p className="font-semibold text-blue-700 bg-blue-50/50 p-2 rounded border border-blue-100/50">{selectedApp.aiReport.suggestedCertification}</p>

                  <h4 className="font-bold text-slate-800 font-display flex items-center gap-1 pt-3 border-t border-slate-100">
                    <Globe className="w-4 h-4 text-blue-600" /> Learning Path & Est. Time
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Estimated Time: <span className="font-bold text-slate-700">{selectedApp.aiReport.estimatedLearningTime}</span></p>
                  <ul className="space-y-1 text-slate-600">
                    {selectedApp.aiReport.recommendedLearningPath.map((pathItem, i) => (
                      <li key={i} className="line-clamp-2">{pathItem}</li>
                    ))}
                  </ul>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Reason input dialog */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <form onSubmit={handleRejectApplicant} className="bg-white rounded-3xl max-w-sm w-full p-5 border border-slate-100 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-800 font-display">Provide Rejection Feedback</h3>
            <p className="text-xs text-slate-500">Provide constructive feedback. This is processed by our AI Course Recommender to find suitable courses for them.</p>

            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Candidates must possess proficiency in React. We recommend mastering state management."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />

            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowRejectModal(null)}
                className="px-3.5 py-1.5 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold shadow-sm"
              >
                Send Rejection
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
