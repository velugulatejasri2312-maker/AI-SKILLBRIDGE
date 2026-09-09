import { useState, useEffect } from "react";
import { db } from "./lib/db";
import { isFirestoreConnected } from "./lib/firebase";
import { UserProfile, SystemNotification } from "./types";
import { getPhotoPositionClass } from "./lib/photoUtils";
import Splash from "./components/Splash";
import Auth from "./components/Auth";
import LocationStatsView from "./components/LocationStats";
import AdminPanel from "./components/AdminPanel";
import CompanyDashboard from "./components/CompanyDashboard";
import CandidateDashboard from "./components/CandidateDashboard";
import { 
  Building2, 
  Briefcase, 
  Users, 
  MapPin, 
  TrendingUp, 
  Bell, 
  LogOut, 
  Compass, 
  Sparkles, 
  Map, 
  Layers, 
  UserPlus, 
  ShieldCheck, 
  BookOpen, 
  Globe, 
  CheckCircle2, 
  Trash2,
  Check
} from "lucide-react";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedLocation, setSelectedLocation] = useState("Hyderabad");
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [activeTab, setActiveTab] = useState<"home" | "location_intelligence" | "explore_marketplace">("home");

  // Re-load notifications and DB counts
  const reloadData = () => {
    if (currentUser) {
      const refreshedUser = db.getUsers().find(u => u.id === currentUser.id);
      if (refreshedUser && JSON.stringify(refreshedUser) !== JSON.stringify(currentUser)) {
        setCurrentUser(refreshedUser);
      }
      setNotifications(db.getNotifications().filter(n => n.userId === currentUser.id || n.userId === "user-admin"));
    }
  };

  useEffect(() => {
    const initSync = async () => {
      await db.syncWithFirestore();
      reloadData();
    };
    initSync();
  }, []);

  useEffect(() => {
    reloadData();
  }, [currentUser]);

  // Handle Auth success
  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    // If admin role, set default active tab to home
    if (user.role === "Admin") {
      setActiveTab("home");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab("home");
  };

  const handleMarkNotifsRead = () => {
    if (currentUser) {
      db.markNotificationsRead(currentUser.id);
      reloadData();
    }
  };

  const handleClearNotif = (notifId: string) => {
    const allNotifs = db.getNotifications();
    db.setNotifications(allNotifs.filter(n => n.id !== notifId));
    reloadData();
  };

  // Derive Location Statistics for the top Location Selector
  const allUsers = db.getUsers();
  const allProjects = db.getProjects().filter(p => p.approved);
  const allCompanies = db.getCompanies();

  // Location-specific math
  const locUsers = allUsers.filter(u => u.location.toLowerCase() === selectedLocation.toLowerCase());
  const locProjects = allProjects.filter(p => {
    const projectLoc = p.location || allCompanies.find(c => c.id === p.companyId)?.location;
    return projectLoc?.toLowerCase() === selectedLocation.toLowerCase();
  });
  const locCompanies = allCompanies.filter(c => c.location.toLowerCase() === selectedLocation.toLowerCase());

  const locStudents = locUsers.filter(u => u.role === "Student").length;
  const locUnemployed = locUsers.filter(u => u.role === "Unemployed Candidate").length;
  const locEmployees = locUsers.filter(u => u.role === "Employee").length;

  // Custom helper to ensure location-specific metrics are varied, non-zero, non-one, and within 2 to 30 range
  const getLocMetric = (loc: string, key: 'firms' | 'projects' | 'internships' | 'students' | 'unemployed' | 'employees', currentCount: number) => {
    const clean = loc.toLowerCase();
    const offsets: Record<string, Record<string, number>> = {
      "hyderabad": { firms: 15, projects: 18, internships: 12, students: 24, unemployed: 14, employees: 22 },
      "visakhapatnam": { firms: 10, projects: 12, internships: 8, students: 16, unemployed: 9, employees: 13 },
      "kakinada": { firms: 4, projects: 5, internships: 3, students: 9, unemployed: 6, employees: 5 },
      "rajahmundry": { firms: 6, projects: 7, internships: 4, students: 11, unemployed: 8, employees: 7 },
      "vijayawada": { firms: 9, projects: 10, internships: 6, students: 14, unemployed: 10, employees: 11 },
      "guntur": { firms: 7, projects: 8, internships: 5, students: 12, unemployed: 11, employees: 9 }
    };
    const base = offsets[clean]?.[key] || 4;
    return Math.min(30, Math.max(2, base + currentCount));
  };

  const locFirmsCount = getLocMetric(selectedLocation, 'firms', locCompanies.length);
  const locProjectsCount = getLocMetric(selectedLocation, 'projects', locProjects.filter(p => p.type === "Project").length);
  const locInternshipsCount = getLocMetric(selectedLocation, 'internships', locProjects.filter(p => p.type === "Internship").length);
  const locStudentsCountVal = getLocMetric(selectedLocation, 'students', locStudents);
  const locUnemployedCountVal = getLocMetric(selectedLocation, 'unemployed', locUnemployed);
  const locEmployeesCountVal = getLocMetric(selectedLocation, 'employees', locEmployees);

  // Local static/mock trending skills depending on selected city
  const getTrendingSkills = (city: string) => {
    const cleanCity = city.toLowerCase();
    if (cleanCity.includes("hyderabad")) return ["Java Spring Boot", "AWS Cloud", "React", "Python AI"];
    if (cleanCity.includes("visakhapatnam")) return ["React", "Data Science", "Embedded Systems", "Cybersecurity"];
    if (cleanCity.includes("kakinada")) return ["Python Django", "IoT Architectures", "HTML/CSS/JS", "SQL"];
    if (cleanCity.includes("rajahmundry")) return ["PHP Laravel", "Mobile Flutter", "E-Commerce", "Digital Marketing"];
    if (cleanCity.includes("vijayawada")) return ["PHP Laravel", "MySql", "Android Dev", "Angular"];
    if (cleanCity.includes("guntur")) return ["Python Django", "Docker & K8s", "React", "Cloud DevOps"];
    return ["React", "Python", "Cloud Computing", "SQL"];
  };

  const trendingSkills = getTrendingSkills(selectedLocation);

  // Splash dismissal
  if (showSplash) {
    return <Splash onDismiss={() => setShowSplash(false)} />;
  }

  // Auth requirement
  if (!currentUser) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20 md:pb-6">
      
      {/* 1. TOP HEADER NAVIGATION BAR */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-40 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              S
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-extrabold font-display text-slate-900 leading-none">AI Skill Bridge</h1>
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest flex items-center gap-1 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isFirestoreConnected ? "bg-blue-500" : "bg-emerald-500"}`} />
                {isFirestoreConnected ? "Live Firestore Connected" : "Local Sandbox Node"}
              </span>
            </div>
          </div>

          {/* 2. REGIONAL SEARCH DROPDOWN (Core Requirement) */}
          <div className="flex items-center bg-slate-100 rounded-2xl px-3 py-1.5 border border-slate-200/50">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0 mr-1.5" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer pr-1"
            >
              <option value="Hyderabad">Hyderabad</option>
              <option value="Visakhapatnam">Visakhapatnam</option>
              <option value="Kakinada">Kakinada</option>
              <option value="Rajahmundry">Rajahmundry</option>
              <option value="Vijayawada">Vijayawada</option>
              <option value="Guntur">Guntur</option>
            </select>
          </div>

          {/* User Controls & Notifications */}
          <div className="flex items-center gap-3">
            
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => { setShowNotifMenu(!showNotifMenu); handleMarkNotifsRead(); }}
                className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-600 relative"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white font-extrabold text-[8px] rounded-full flex items-center justify-center border-2 border-white">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Drawer */}
              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden z-50 animate-fade-in">
                  <div className="p-3 bg-slate-900 text-white flex justify-between items-center text-xs font-bold font-display">
                    <span>Recent Alerts ({notifications.length})</span>
                    <button onClick={() => setShowNotifMenu(false)} className="text-slate-400 hover:text-white text-[10px] uppercase">Close</button>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-slate-400">No active alerts.</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="p-3.5 hover:bg-slate-50 flex justify-between gap-2.5 items-start">
                          <div className="space-y-1">
                            <div className="font-bold text-slate-800">{n.title}</div>
                            <p className="text-slate-500 leading-normal text-[11px]">{n.message}</p>
                            <span className="text-[9px] text-slate-400 font-semibold">{new Date(n.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <button 
                            onClick={() => handleClearNotif(n.id)}
                            className="p-1 hover:bg-red-50 text-red-500 rounded transition shrink-0"
                            title="Dismiss notification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logout & Profile Summary */}
            <div className="flex items-center gap-2 border-l border-slate-100 pl-3">
              <img 
                src={currentUser.profilePhotoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60"} 
                alt={currentUser.fullName}
                className={`w-8 h-8 rounded-full border border-slate-200 shrink-0 ${getPhotoPositionClass(currentUser.profilePhotoPosition)}`}
              />
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-none">{currentUser.fullName}</div>
                <span className="text-[10px] text-slate-400 font-bold">{currentUser.role}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-1.5 hover:bg-red-50 hover:text-red-600 text-slate-500 rounded-xl transition ml-1"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* 3. LOCATION OVERVIEW METRICS (Core Requirement) */}
      <section className="bg-white border-b border-slate-100 py-4 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Location Metrics: <span className="text-blue-600 font-extrabold">{selectedLocation}</span></span>
            <span className="text-[10px] text-blue-500 font-extrabold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-500" /> Regional Statistics Seeding
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-center text-center md:text-left">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Firms</span>
              <span className="text-lg font-black text-slate-800 font-display mt-0.5">{locFirmsCount}</span>
            </div>
            
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-center text-center md:text-left">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Projects</span>
              <span className="text-lg font-black text-slate-800 font-display mt-0.5">{locProjectsCount}</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-center text-center md:text-left">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Internships</span>
              <span className="text-lg font-black text-slate-800 font-display mt-0.5">{locInternshipsCount}</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-center text-center md:text-left">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Students</span>
              <span className="text-lg font-black text-blue-600 font-display mt-0.5">{locStudentsCountVal}</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-center text-center md:text-left">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Job Seekers</span>
              <span className="text-lg font-black text-amber-600 font-display mt-0.5">{locUnemployedCountVal}</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-center text-center md:text-left">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Employees</span>
              <span className="text-lg font-black text-emerald-600 font-display mt-0.5">{locEmployeesCountVal}</span>
            </div>
          </div>

          {/* Trending Skills in selected location banner */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-1">
            <span className="font-bold uppercase text-[10px] text-slate-400 tracking-wider flex items-center gap-1 shrink-0">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> Trending in {selectedLocation}:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {trendingSkills.map((sk, idx) => (
                <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-100/50 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  {sk}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. MAIN CENTRAL INTERACTIVE PLAYGROUND */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 space-y-6">
        
        {activeTab === "home" && (
          <div className="space-y-6">
            {/* Dynamic Dashboard routing by user roles */}
            {currentUser.role === "Admin" ? (
              <AdminPanel onRefresh={reloadData} />
            ) : currentUser.role === "Company" ? (
              <CompanyDashboard currentUser={currentUser} onRefresh={reloadData} />
            ) : (
              <CandidateDashboard currentUser={currentUser} onRefresh={reloadData} />
            )}
          </div>
        )}

        {activeTab === "location_intelligence" && (
          <LocationStatsView locationName={selectedLocation} />
        )}

        {/* EXPLORE COMPANIES, REGISTERED STUDENTS & JOBS BOARD */}
        {activeTab === "explore_marketplace" && (
          <div className="space-y-6 animate-fade-in">
            {/* Header info */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2">
              <h2 className="text-lg font-extrabold text-slate-800 font-display flex items-center gap-2">
                <Compass className="w-5 h-5 text-blue-600" /> Regional Ecosystem Marketplace
              </h2>
              <p className="text-xs text-slate-500">Audit the entire Skill Bridge network including active corporate entities, available internships, and talent statistics in {selectedLocation}.</p>
            </div>

            {/* List of active companies */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
                <h3 className="font-bold text-sm text-slate-800 font-display flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <Building2 className="w-4 h-4 text-blue-600" /> Active Ecosystem Firms ({locCompanies.length || 1})
                </h3>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {(locCompanies.length > 0 ? locCompanies : allCompanies.slice(0, 3)).map((c) => (
                    <div key={c.id} className="p-3 bg-slate-50 rounded-2xl flex items-center gap-2.5">
                      <img 
                        src={c.logoUrl || "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=100&auto=format&fit=crop&q=60"} 
                        alt={c.name}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-100 shrink-0"
                      />
                      <div>
                        <span className="font-extrabold text-xs text-slate-800 block leading-tight">{c.name}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{c.location} • {c.website}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* List of registered Students & candidates */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
                <h3 className="font-bold text-sm text-slate-800 font-display flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <Users className="w-4 h-4 text-blue-600" /> Registered Talent Base
                </h3>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {(locUsers.length > 0 ? locUsers : allUsers.slice(0, 3)).map((cand) => (
                    <div key={cand.id} className="p-3 bg-slate-50 rounded-2xl flex items-center gap-2.5">
                      <img 
                        src={cand.profilePhotoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60"} 
                        alt={cand.fullName}
                        className={`w-10 h-10 rounded-full shrink-0 border border-slate-200 ${getPhotoPositionClass(cand.profilePhotoPosition)}`}
                      />
                      <div>
                        <span className="font-extrabold text-xs text-slate-800 block leading-tight">{cand.fullName}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{cand.role}</span>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {cand.skills.slice(0, 3).map((sk, idx) => (
                            <span key={idx} className="bg-slate-200/50 text-[8px] text-slate-500 font-bold px-1.5 py-0.5 rounded">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Open Assignments and Internships */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
                <h3 className="font-bold text-sm text-slate-800 font-display flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <Briefcase className="w-4 h-4 text-blue-600" /> Ecosystem Projects
                </h3>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {(locProjects.length > 0 ? locProjects : allProjects.slice(0, 3)).map((p) => (
                    <div key={p.id} className="p-3 bg-slate-50 rounded-2xl space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-xs text-slate-800 truncate block max-w-[150px]">{p.title}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${p.type === "Project" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                          {p.type}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold">{p.companyName} • {p.duration}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* 5. BOTTOM PORTABLE NAVIGATION BAR (Core Requirement) */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 shadow-2xl z-40 px-4 py-2.5 flex items-center justify-around">
        {[
          { id: "home", label: "Dashboard", icon: Layers },
          { id: "location_intelligence", label: "Location Intel", icon: Compass },
          { id: "explore_marketplace", label: "Explore Market", icon: Map }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${activeTab === tab.id ? "text-blue-600 font-bold scale-105" : "text-slate-400 hover:text-slate-600"}`}
            >
              <Icon className="w-5.5 h-5.5" />
              <span className="text-[10px] font-semibold tracking-wider">{tab.label}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}
