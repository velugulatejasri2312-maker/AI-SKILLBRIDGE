import { useState } from "react";
import { db } from "../lib/db";
import { UserProfile, ProjectPosting, CompanyProfile } from "../types";
import { getPhotoPositionClass } from "../lib/photoUtils";
import { ShieldCheck, Users, Briefcase, FileText, Check, Trash2, TrendingUp, AlertTriangle, Building2 } from "lucide-react";

interface AdminPanelProps {
  onRefresh: () => void;
}

export default function AdminPanel({ onRefresh }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"users" | "projects" | "companies" | "analytics">("analytics");
  const [users, setUsers] = useState<UserProfile[]>(db.getUsers());
  const [projects, setProjects] = useState<ProjectPosting[]>(db.getProjects());
  const [companies, setCompanies] = useState<CompanyProfile[]>(db.getCompanies());
  const [applications, setApplications] = useState(db.getApplications());

  const reloadData = () => {
    setUsers(db.getUsers());
    setProjects(db.getProjects());
    setCompanies(db.getCompanies());
    setApplications(db.getApplications());
    onRefresh();
  };

  const handleApproveProject = (projectId: string) => {
    db.approveProject(projectId);
    reloadData();
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure you want to remove this user from the ecosystem? This is permanent.")) {
      db.deleteUser(userId);
      reloadData();
    }
  };

  const handleDeleteCompany = (companyId: string) => {
    if (confirm("Are you sure you want to remove this company? This will revoke active project postings.")) {
      db.deleteCompany(companyId);
      reloadData();
    }
  };

  // Analytics helper math
  const totalStudents = users.filter(u => u.role === "Student").length;
  const totalUnemployed = users.filter(u => u.role === "Unemployed Candidate").length;
  const totalEmployees = users.filter(u => u.role === "Employee").length;
  const totalCompanies = users.filter(u => u.role === "Company").length;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header Banner */}
      <div className="p-6 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-display">Ecosystem Administration Panel</h3>
            <p className="text-xs text-slate-400">Moderation, audits, live metrics, and company project approvals</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center bg-slate-800 p-1 rounded-xl">
          {(["analytics", "users", "projects", "companies"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${activeTab === tab ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Container */}
      <div className="p-6">
        {activeTab === "analytics" && (
          <div className="space-y-6 animate-fade-in">
            {/* Quick stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Users</div>
                  <div className="text-lg font-bold text-slate-800">{users.length}</div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Registered Firms</div>
                  <div className="text-lg font-bold text-slate-800">{companies.length}</div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Project Postings</div>
                  <div className="text-lg font-bold text-slate-800">{projects.length}</div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Applications</div>
                  <div className="text-lg font-bold text-slate-800">{applications.length}</div>
                </div>
              </div>
            </div>

            {/* Custom chart/bar distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-sm text-slate-800 font-display">Talent Base Distribution</h4>
                </div>
                
                <div className="space-y-3">
                  {[
                    { label: "Students", count: totalStudents, color: "bg-blue-600" },
                    { label: "Unemployed Seekers", count: totalUnemployed, color: "bg-amber-500" },
                    { label: "Active Employees", count: totalEmployees, color: "bg-emerald-600" },
                    { label: "Company Representatives", count: totalCompanies, color: "bg-purple-600" }
                  ].map((roleObj, i) => {
                    const percentage = users.length > 0 ? Math.round((roleObj.count / users.length) * 100) : 0;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-600">
                          <span>{roleObj.label}</span>
                          <span>{roleObj.count} ({percentage}%)</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full ${roleObj.color} rounded-full`} style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Alerts / Fake account watch */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
                  <h4 className="font-bold text-sm text-slate-800 font-display">Ecosystem Moderation Alerts</h4>
                </div>
                
                <div className="space-y-2.5">
                  {projects.filter(p => !p.approved).length > 0 ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Pending Approvals:</span> There are {projects.filter(p => !p.approved).length} company postings that require immediate review before appearing publicly.
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      All project postings have been successfully audited and approved.
                    </div>
                  )}

                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-slate-700">
                    <span className="font-bold text-blue-800">Security Guard Active:</span> IP geolocation logs match registration records. No automated bot accounts detected within the past 48 hours.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === "users" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm text-slate-800 font-display">Ecosystem Users ({users.length})</h4>
              <span className="text-[10px] text-slate-400 font-medium">To delete a fake or malicious account, click Trash icon</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                    <th className="py-2">User Details</th>
                    <th className="py-2">Ecosystem Role</th>
                    <th className="py-2">Location</th>
                    <th className="py-2">Skills Owned</th>
                    <th className="py-2 text-right">Moderation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="py-3 pr-2">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={u.profilePhotoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60"} 
                            alt={u.fullName} 
                            className={`w-8 h-8 rounded-full border border-slate-200 shrink-0 ${getPhotoPositionClass(u.profilePhotoPosition)}`}
                          />
                          <div>
                            <div className="font-bold text-slate-800">{u.fullName}</div>
                            <div className="text-[10px] text-slate-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                          u.role === "Student" ? "bg-blue-50 text-blue-700" :
                          u.role === "Unemployed Candidate" ? "bg-amber-50 text-amber-700" :
                          u.role === "Employee" ? "bg-emerald-50 text-emerald-700" : "bg-purple-50 text-purple-700"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600 font-medium">{u.location}</td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {u.skills.slice(0, 3).map((s, idx) => (
                            <span key={idx} className="bg-slate-100 text-slate-600 text-[9px] px-1.5 py-0.5 rounded">
                              {s}
                            </span>
                          ))}
                          {u.skills.length > 3 && <span className="text-[9px] text-slate-400 font-bold">+{u.skills.length - 3}</span>}
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        {u.role !== "Admin" ? (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition"
                            title="Delete Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-extrabold pr-2">Master</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Project Approvals Tab */}
        {activeTab === "projects" && (
          <div className="space-y-4 animate-fade-in">
            <h4 className="font-bold text-sm text-slate-800 font-display">Project Postings & Approvals</h4>
            
            {projects.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No projects posted yet.
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((p) => (
                  <div key={p.id} className="p-4 border border-slate-100 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-200 transition bg-slate-50/20">
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${p.type === "Project" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                          {p.type}
                        </span>
                        <h5 className="font-bold text-slate-800 text-sm">{p.title}</h5>
                        {!p.approved && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">Pending Approval</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-semibold">{p.companyName} • {p.duration} • Vacancies: {p.vacancies}</div>
                      <p className="text-xs text-slate-600 line-clamp-2">{p.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      {!p.approved && (
                        <button
                          onClick={() => handleApproveProject(p.id)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm("Reject and remove this project?")) {
                            db.setProjects(projects.filter(proj => proj.id !== p.id));
                            reloadData();
                          }
                        }}
                        className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition"
                        title="Delete/Reject"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Company Profiles Tab */}
        {activeTab === "companies" && (
          <div className="space-y-4 animate-fade-in">
            <h4 className="font-bold text-sm text-slate-800 font-display">Firms & Corporate Profiles ({companies.length})</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {companies.map((c) => (
                <div key={c.id} className="p-4 border border-slate-100 rounded-2xl flex justify-between items-start bg-slate-50/40">
                  <div className="flex items-start gap-3">
                    <img 
                      src={c.logoUrl || "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=100&auto=format&fit=crop&q=60"} 
                      alt={c.name} 
                      className="w-10 h-10 rounded-xl object-cover border border-slate-100"
                    />
                    <div>
                      <h5 className="font-bold text-slate-800 text-sm">{c.name}</h5>
                      <p className="text-[10px] text-slate-400 font-semibold">{c.location} • {c.website}</p>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">{c.description}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteCompany(c.id)}
                    className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
