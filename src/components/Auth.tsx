import React, { useState } from "react";
import { db } from "../lib/db";
import { UserProfile } from "../types";
import { motion } from "motion/react";
import { getPhotoPositionClass, PHOTO_POSITION_OPTIONS } from "../lib/photoUtils";
import { KeyRound, Mail, User, Phone, MapPin, GraduationCap, Briefcase, BadgeCheck, Upload, Image, ArrowRight, Eye, EyeOff, Loader2, Focus, Crop, Sparkles } from "lucide-react";

interface AuthProps {
  onAuthSuccess: (user: UserProfile) => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Sign In Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Sign Up Form States
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [role, setRole] = useState<"Student" | "Unemployed Candidate" | "Employee" | "Company">("Student");
  const [location, setLocation] = useState("Hyderabad");
  const [education, setEducation] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [experience, setExperience] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [profilePhotoPosition, setProfilePhotoPosition] = useState<"top" | "center" | "bottom" | "fit">("top");
  const [companyName, setCompanyName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resumeBase64, setResumeBase64] = useState("");

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
    setResumeName(file.name);
    setIsAnalyzing(true);
    setError("");
    setSuccess("");

    try {
      const base64 = await convertFileToBase64(file);
      setResumeBase64(base64);

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
        const { fullName: extractedName, email: extractedEmail, mobileNumber: extractedMobile, education: extractedEdu, skills: extractedSkills, experience: extractedExp } = data.analysis;
        
        if (extractedName) setFullName(extractedName);
        if (extractedEmail) setEmail(extractedEmail);
        if (extractedMobile) setMobileNumber(extractedMobile);
        if (extractedEdu) setEducation(extractedEdu);
        if (extractedSkills && extractedSkills.length > 0) {
          setSkillsText(extractedSkills.join(", "));
        }
        if (extractedExp) setExperience(extractedExp);

        setSuccess("Gemini has parsed your resume and pre-filled the profile details! Please verify the fields below. 🪄");
      } else {
        setError("Resume attached successfully. Feel free to complete the form manually.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Resume attached successfully. Complete details manually if needed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePhotoChange = async (file: File) => {
    if (!file) return;
    try {
      const base64 = await convertFileToBase64(file);
      setProfilePhotoUrl(base64);
      setSuccess("Profile photo selected successfully!");
    } catch (err) {
      console.error(err);
      setError("Failed to parse profile photo.");
    }
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please fill in all credentials.");
      return;
    }

    try {
      const user = db.signIn(email, password);
      setSuccess("Successfully authenticated!");
      setTimeout(() => onAuthSuccess(user), 800);
    } catch (err: any) {
      setError(err.message || "Invalid credentials.");
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!fullName || !email || !password || !mobileNumber || !education) {
      setError("Please fill in all required fields.");
      return;
    }

    // Parse comma-separated skills
    const skillsList = skillsText
      .split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (role !== "Company" && skillsList.length === 0) {
      setError("Please provide at least one of your current professional skills.");
      return;
    }

    try {
      const profileData: Omit<UserProfile, "id" | "createdAt"> = {
        fullName,
        email,
        mobileNumber,
        role,
        location,
        education,
        skills: skillsList,
        experience: experience || undefined,
        resumeName: resumeName || undefined,
        resumeUrl: resumeBase64 || undefined,
        profilePhotoUrl: profilePhotoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60",
        profilePhotoPosition,
        companyName: role === "Company" ? companyName : undefined
      };

      const newUser = db.signUp(profileData, password);
      setSuccess("Account successfully registered! Proceeding to launch dashboard.");
      setTimeout(() => onAuthSuccess(newUser), 1000);
    } catch (err: any) {
      setError(err.message || "Registration failed. Try again.");
    }
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Provide your account email first.");
      return;
    }

    try {
      const msg = db.forgotPassword(email);
      setSuccess(msg);
      setTimeout(() => setIsForgot(false), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to issue password recovery link.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Top Banner Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-md mb-3">
          <BadgeCheck className="w-7 h-7" />
        </div>
        <h2 className="text-3xl font-extrabold font-display text-slate-900">
          AI Skill Bridge
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {isForgot 
            ? "Enter your email to request recovery link" 
            : isSignUp 
              ? "Create your professional ecosystem profile" 
              : "Sign in to connect with skills and jobs"}
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-slate-100 sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-2xl border border-red-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-2xl border border-green-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-600 shrink-0" />
              {success}
            </div>
          )}

          {isForgot ? (
            <form onSubmit={handleForgot} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="pl-10 w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-md transition transform active:scale-95 flex items-center justify-center gap-2"
                >
                  Request Reset Link <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => { setIsForgot(false); setError(""); }}
                  className="text-xs text-blue-600 font-semibold hover:underline text-center"
                >
                  Return to Login
                </button>
              </div>
            </form>
          ) : !isSignUp ? (
            // Sign In Form
            <form onSubmit={handleSignIn} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teja@gmail.com"
                    className="pl-10 w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  />
                </div>

              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Password</label>
                  <button
                    type="button"
                    onClick={() => { setIsForgot(true); setError(""); }}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10 w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2 mt-2"
              >
                Sign In to Platform <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-4 border-t border-slate-100 text-center">
                <span className="text-xs text-slate-500">New to Skill Bridge? </span>
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); setError(""); }}
                  className="text-xs text-blue-600 font-extrabold hover:underline"
                >
                  Create an Account
                </button>
              </div>
            </form>
          ) : (
            // Sign Up Form
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Arjun Prasad"
                      className="pl-9 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="arjun@gmail.com"
                      className="pl-9 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs transition"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="pl-9 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="9876543210"
                      className="pl-9 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs transition"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Ecosystem Role</label>
                  <select
                    value={role}
                    onChange={(e: any) => setRole(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs transition"
                  >
                    <option value="Student">Student</option>
                    <option value="Unemployed Candidate">Unemployed Candidate</option>
                    <option value="Employee">Employee</option>
                    <option value="Company">Company Recruiter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Primary Location</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs transition"
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

              {role === "Company" ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Company Name</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Astra AI Labs"
                      className="pl-9 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs transition"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Education Credential</label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={education}
                          onChange={(e) => setEducation(e.target.value)}
                          placeholder="e.g. B.Tech CSE, MCA"
                          className="pl-9 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Professional Skills (Comma-separated)</label>
                      <input
                        type="text"
                        required
                        value={skillsText}
                        onChange={(e) => setSkillsText(e.target.value)}
                        placeholder="Python, React, SQL, AWS"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Experience Description (Optional)</label>
                      <input
                        type="text"
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        placeholder="e.g. Fresher / 2 years Software Engineer"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs transition"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                          Resume (PDF/TXT/Doc)
                        </label>
                        <div
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              handleResumeChange(e.dataTransfer.files[0]);
                            }
                          }}
                          className={`relative border-2 border-dashed rounded-xl p-2 text-center transition flex flex-col items-center justify-center min-h-[68px] ${
                            isAnalyzing 
                              ? "bg-blue-50 border-blue-300"
                              : resumeName 
                                ? "bg-green-50 border-green-300 text-green-800" 
                                : "bg-slate-50 border-slate-200 hover:bg-slate-100/80 cursor-pointer"
                          }`}
                        >
                          <input
                            type="file"
                            accept=".pdf,.txt,.doc,.docx,.png,.jpg,.jpeg"
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
                              <Upload className={`w-4 h-4 ${resumeName ? "text-green-600" : "text-slate-400"}`} />
                              <span className="text-[10px] font-medium leading-none truncate max-w-full px-1">
                                {resumeName ? resumeName : "Upload / Drop Resume"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center justify-between">
                          <span>Profile Photo (JPG/PNG)</span>
                          <span className="text-[9px] text-blue-600 font-bold flex items-center gap-1">
                            <Focus className="w-3 h-3" /> Auto Face Alignment
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
                          className={`relative border-2 border-dashed rounded-xl p-2.5 text-center transition flex flex-col items-center justify-center min-h-[64px] ${
                            profilePhotoUrl && profilePhotoUrl.startsWith("data:")
                              ? "bg-emerald-50/50 border-emerald-300 text-emerald-800"
                              : "bg-slate-50 border-slate-200 hover:bg-slate-100/80 cursor-pointer"
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
                          {profilePhotoUrl && profilePhotoUrl.startsWith("data:") ? (
                            <div className="flex items-center gap-1.5 pointer-events-none">
                              <img
                                src={profilePhotoUrl}
                                alt="Profile preview"
                                className={`w-6 h-6 rounded-full border border-emerald-400 ${getPhotoPositionClass(profilePhotoPosition)}`}
                              />
                              <span className="text-[10px] font-bold text-emerald-800">Photo Attached</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1 pointer-events-none">
                              <Image className="w-4 h-4 text-slate-400" />
                              <span className="text-[10px] font-medium leading-none">Upload / Drop Photo</span>
                            </div>
                          )}
                        </div>

                        {profilePhotoUrl && (
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 mt-1.5">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-700">
                              <span className="flex items-center gap-1">
                                <Crop className="w-3 h-3 text-blue-600" /> Framing Alignment
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-1">
                              {PHOTO_POSITION_OPTIONS.map((opt) => (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => setProfilePhotoPosition(opt.id)}
                                  className={`p-1.5 rounded-lg text-center border text-[9px] font-bold transition ${
                                    profilePhotoPosition === opt.id
                                      ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition transform active:scale-95 flex items-center justify-center gap-2 mt-2"
              >
                Create Account & Connect <ArrowRight className="w-4.5 h-4.5" />
              </button>

              <div className="pt-3 border-t border-slate-100 text-center">
                <span className="text-xs text-slate-500">Already possess an account? </span>
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); setError(""); }}
                  className="text-xs text-blue-600 font-extrabold hover:underline"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
